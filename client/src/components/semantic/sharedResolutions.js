// Shared resolutions: when two people resolve the same issue at the same moment.
//
// Every resolution that changes text is also written to the shared Automerge document as
// `resolution:<key>` = { choice, label, by, byName, at, prefix, suffix }. Automerge keeps both
// writes when they are concurrent, so every device sees the same set of candidates and picks
// the same winner without a server: latest `at`, then highest user id as the tie-breaker.
// Only the winner's device repairs the text (both text edits merged would duplicate it), and
// it then rewrites the record so the conflict is closed for everyone.
import * as A from "@automerge/automerge"

const CONTEXT_CHARS = 24
// Top-level keys, not a nested map: two people creating the same map concurrently would make two
// maps, and each record would hide in its own. One key per issue makes the writes collide.
const PREFIX = "resolution:"

// Same issue on every device: grammar issues already carry a stable key; conflicts use their text.
export const resolutionField = issue => PREFIX + sharedKey(issue)

export const sharedKey = issue => issue.key ?? `${issue.kind}|${issue.text}`

export function pickWinner(records) {
  return [...records].sort((a, b) => b.at - a.at || (b.by < a.by ? -1 : b.by > a.by ? 1 : 0))[0]
}

// The text around the flagged span inside its paragraph, used to find the spot again after merging.
export function contextOf(doc, from, to) {
  const $from = doc.resolve(from)
  const start = $from.start()
  const end = $from.end()
  let block = 0
  doc.nodesBetween(0, from, node => {
    if (node.isTextblock && node !== $from.parent) block++
    return !node.isTextblock
  })
  return {
    block, // which paragraph, so a span covering a whole paragraph can still be found
    prefix: doc.textBetween(Math.max(start, from - CONTEXT_CHARS), from),
    suffix: doc.textBetween(to, Math.min(end, to + CONTEXT_CHARS)),
  }
}

// Range between prefix and suffix in the recorded paragraph; empty context means the paragraph edge.
function locate(doc, { block, prefix, suffix }) {
  let index = 0
  let found = null
  doc.descendants((node, pos) => {
    if (found || !node.isTextblock) return !found
    if (index++ !== block) return false
    const text = node.textContent
    const before = prefix ? text.indexOf(prefix) : 0
    const after = before < 0 ? -1 : suffix ? text.indexOf(suffix, before + prefix.length) : text.length
    if (before >= 0 && after >= 0) found = { from: pos + 1 + before + prefix.length, to: pos + 1 + after }
    return false
  })
  return found
}

// view: the editor view; handle: the Automerge handle; me: { id, name };
// onSettled(key, winner, mine): tells the semantic layer and the person what happened.
export function connectSharedResolutions({ view, handle, me, onSettled }) {
  const settled = new Set() // "key|opIds" already handled on this device

  function record(issue, choice, label) {
    const entry = { choice, label, by: me.id, byName: me.name, at: Date.now(), ...contextOf(view.state.doc, issue.from, issue.to) }
    handle.change(doc => {
      doc[PREFIX + sharedKey(issue)] = entry
    })
  }

  function check() {
    const doc = handle.doc()
    if (!doc) return
    for (const field of Object.keys(doc)) {
      if (!field.startsWith(PREFIX)) continue
      const key = field.slice(PREFIX.length)
      const conflicts = A.getConflicts(doc, field)
      const ids = conflicts ? Object.keys(conflicts) : []
      if (ids.length < 2) continue
      const signature = `${key}|${ids.sort().join(",")}`
      if (settled.has(signature)) continue
      settled.add(signature)

      const records = ids.map(id => ({ ...conflicts[id] }))
      if (!records.some(r => r.by === me.id)) continue // not involved: the winner's device repairs it
      const winner = pickWinner(records)
      const mine = winner.by === me.id
      if (mine) {
        const range = locate(view.state.doc, winner)
        if (range && view.state.doc.textBetween(range.from, range.to) !== winner.choice) {
          view.dispatch(view.state.tr.insertText(winner.choice, range.from, range.to).setMeta("addToHistory", false))
        }
        handle.change(d => {
          d[field] = { ...winner }
        })
      }
      onSettled(key, winner, mine, records.find(r => r.by !== winner.by))
    }
  }

  // Runs after the editor has applied the incoming change, so positions match the merged text.
  let timer = null
  const schedule = () => {
    clearTimeout(timer)
    timer = setTimeout(check, 0)
  }
  handle.on("change", schedule)
  return {
    record,
    destroy() {
      clearTimeout(timer)
      handle.off("change", schedule)
    },
  }
}
