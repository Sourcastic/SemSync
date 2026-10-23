// Semantic layer plugin. Issues (meaning conflicts, grammar) are presentation metadata:
// they live in plugin state, render as decorations, and never enter the document.
//
// Issue: {
//   id, kind: "conflict" | "grammar", status: "open" | "stale" | "resolved" | "dismissed",
//   from, to,                 // ProseMirror positions, mapped through every transaction
//   text,                     // the flagged text when detected
//   createdAt, resolution?,   // resolution: short past-tense note, e.g. "Kept Atika's version"
//   conflict: { versions: [{ authorId, text }], merged, classification, confidence, model }
//   grammar:  { rule, message, replacement }
// }
import { Plugin, PluginKey } from "prosemirror-state"
import { Decoration, DecorationSet } from "prosemirror-view"

export const semanticKey = new PluginKey("semsync-semantic")

export const isVisible = issue => (issue.status === "open" || issue.status === "stale") && issue.to > issue.from

// True when a step changed text strictly inside [from, to]. Typing right at an edge doesn't count.
function touches(tr, from, to) {
  let start = from
  let end = to
  let hit = false
  for (const map of tr.mapping.maps) {
    map.forEach((oldStart, oldEnd) => {
      const inserted = oldStart === oldEnd
      if (inserted ? oldStart > start && oldStart < end : oldStart < end && oldEnd > start) hit = true
    })
    start = map.map(start, 1)
    end = map.map(end, -1)
  }
  return hit
}

function mapIssue(issue, tr, skipStale) {
  const from = tr.mapping.map(issue.from, 1)
  const to = tr.mapping.map(issue.to, -1)
  let status = issue.status
  if (status === "open" && !skipStale.includes(issue.id) && (to <= from || touches(tr, issue.from, issue.to))) status = "stale"
  return from === issue.from && to === issue.to && status === issue.status ? issue : { ...issue, from, to, status }
}

function buildDecorations(doc, issues, activeId) {
  const decorations = []
  for (const issue of issues) {
    if (!isVisible(issue)) continue
    const attrs = {
      class: issue.kind === "conflict" ? "sem-conflict" : "sem-grammar",
      "data-issue-id": issue.id,
    }
    if (issue.id === activeId) attrs["data-active"] = ""
    if (issue.status === "stale") attrs["data-stale"] = ""
    decorations.push(Decoration.inline(issue.from, issue.to, attrs, { issueId: issue.id }))

    if (issue.kind === "conflict" && issue.status === "open") {
      const $from = doc.resolve(issue.from)
      const blockStart = $from.before($from.depth)
      decorations.push(Decoration.node(blockStart, blockStart + $from.parent.nodeSize, { class: "sem-has-conflict" }))
    }
  }
  return DecorationSet.create(doc, decorations)
}

// Meta: { add?: Issue[], update?: { id, patch }, remove?: id[], activate?: id | null, skipStale?: id[] }
export const semanticPlugin = new Plugin({
  key: semanticKey,
  state: {
    init: () => ({ issues: [], activeId: null, decorations: DecorationSet.empty }),
    apply(tr, value, _old, newState) {
      const meta = tr.getMeta(semanticKey)
      if (!tr.docChanged && !meta) return value

      let issues = value.issues
      if (tr.docChanged) issues = issues.map(issue => mapIssue(issue, tr, meta?.skipStale ?? []))
      if (meta?.add) {
        const ids = new Set(meta.add.map(issue => issue.id))
        issues = [...issues.filter(issue => !ids.has(issue.id)), ...meta.add]
      }
      if (meta?.update) issues = issues.map(issue => (issue.id === meta.update.id ? { ...issue, ...meta.update.patch } : issue))
      if (meta?.remove) issues = issues.filter(issue => !meta.remove.includes(issue.id))

      let activeId = meta && "activate" in meta ? meta.activate : value.activeId
      if (activeId && !issues.some(issue => issue.id === activeId && isVisible(issue))) activeId = null

      return { issues, activeId, decorations: buildDecorations(newState.doc, issues, activeId) }
    },
  },
  props: {
    decorations: state => semanticKey.getState(state).decorations,
    // Clicking flagged text opens its details; the click still places the cursor normally.
    handleClick(view, _pos, event) {
      const id = event.target.closest?.("[data-issue-id]")?.dataset.issueId
      const current = semanticKey.getState(view.state).activeId
      if (id !== current) view.dispatch(view.state.tr.setMeta(semanticKey, { activate: id ?? null }))
      return false
    },
  },
})

export function semanticState(state) {
  return semanticKey.getState(state)
}

export function dispatchSemantic(view, meta) {
  view.dispatch(view.state.tr.setMeta(semanticKey, meta))
}
