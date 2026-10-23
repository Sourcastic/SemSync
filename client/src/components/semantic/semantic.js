// Connects the semantic plugin to analysis and exposes its state to React.
// Analysis failures change `analysis` status only; editing is never blocked.
import { TextSelection } from "prosemirror-state"
import { semanticKey, semanticState, dispatchSemantic } from "./semanticPlugin.js"
import { findGrammarIssues } from "./grammarCheck.js"
import { analyzeConcurrentEdits } from "./analysis.js"
import { connectSharedResolutions, sharedKey } from "./sharedResolutions.js"

const GRAMMAR_DEBOUNCE_MS = 600

// shared: { handle, me, notify } to sync resolutions with other people; optional.
export function connectSemantic(editor, shared) {
  const { view } = editor
  const listeners = new Set()
  const dismissedKeys = new Set()
  let analysis = "idle" // "idle" | "analyzing" | "unavailable"
  let snapshot = { ...semanticState(view.state), analysis }
  let timer = null
  let lastDoc = null

  function publish() {
    const next = semanticState(view.state)
    if (next.issues !== snapshot.issues || next.activeId !== snapshot.activeId || analysis !== snapshot.analysis) {
      snapshot = { issues: next.issues, activeId: next.activeId, analysis }
      listeners.forEach(listener => listener())
    }
  }

  function runGrammar() {
    timer = null
    if (view.isDestroyed) return
    try {
      const found = findGrammarIssues(view.state.doc).filter(issue => !dismissedKeys.has(issue.key))
      const grammarIssues = semanticState(view.state).issues.filter(issue => issue.kind === "grammar")
      const existing = grammarIssues.filter(issue => issue.status === "open")
      // Grammar is cheap to re-check, so stale grammar results are replaced rather than shown as outdated.
      const staleIds = grammarIssues.filter(issue => issue.status === "stale").map(issue => issue.id)
      const sameSpot = (a, b) => a.from === b.from && a.to === b.to && a.text === b.text
      const add = found
        .filter(f => !existing.some(e => sameSpot(e, f)))
        .map(f => ({
          id: `grammar-${crypto.randomUUID().slice(0, 8)}`,
          kind: "grammar",
          status: "open",
          from: f.from,
          to: f.to,
          text: f.text,
          createdAt: Date.now(),
          key: f.key,
          grammar: { rule: f.rule, message: f.message, replacement: f.replacement },
        }))
      // Mistakes fixed by hand simply disappear.
      const remove = [...staleIds, ...existing.filter(e => !found.some(f => sameSpot(e, f))).map(e => e.id)]
      if (add.length || remove.length) dispatchSemantic(view, { add, remove })
    } catch {
      analysis = "unavailable"
    }
    publish()
  }

  function scheduleGrammar() {
    clearTimeout(timer)
    timer = setTimeout(runGrammar, GRAMMAR_DEBOUNCE_MS)
  }

  const unsubscribe = editor.subscribe(() => {
    if (view.state.doc !== lastDoc) {
      lastDoc = view.state.doc
      scheduleGrammar()
    }
    publish()
  })
  lastDoc = view.state.doc
  runGrammar()

  // Clear grammar errors inside a freshly merged sentence are fixed in the same step,
  // as one undoable transaction, and recorded under Resolved so the fix stays visible.
  function autoFixGrammar(range) {
    if (!range) return
    // A repeated word may be intended either way ("quick quick"), so people review it instead.
    const inside = findGrammarIssues(view.state.doc).filter(f => f.rule !== "Repeated word" && f.from >= range.from && f.to <= range.to)
    if (!inside.length) return
    const tr = view.state.tr
    for (const f of [...inside].reverse()) tr.insertText(f.replacement, f.from, f.to)
    const now = Date.now()
    tr.setMeta(semanticKey, {
      add: inside.map(f => ({
        id: `grammar-${crypto.randomUUID().slice(0, 8)}`,
        kind: "grammar",
        status: "resolved",
        from: tr.mapping.map(f.from),
        to: tr.mapping.map(f.to),
        text: f.text,
        createdAt: now,
        settledAt: now,
        resolution: `Fixed during the merge: “${f.text}” → “${f.replacement}”`,
        grammar: { rule: f.rule, message: f.message, replacement: f.replacement },
      })),
    })
    view.dispatch(tr)
  }

  // Two people resolved the same issue at once: show everyone the choice that was kept.
  const resolutions = shared?.handle && connectSharedResolutions({
    view,
    handle: shared.handle,
    me: shared.me,
    onSettled(key, winner, mine, other) {
      const issue = semanticState(view.state).issues.find(i => sharedKey(i) === key && i.status === "resolved")
      if (issue) dispatchSemantic(view, { update: { id: issue.id, patch: { resolution: `${winner.label} (${mine ? "you" : winner.byName}, kept)` } } })
      shared.notify?.(mine
        ? `${other?.byName ?? "Someone"} resolved this at the same time. Your choice was kept because it came last.`
        : `${winner.byName} resolved this at the same time. Their choice was kept because it came last.`)
    },
  })

  function settle(issue, patch, change) {
    const tr = view.state.tr
    change?.(tr)
    tr.setMeta(semanticKey, { update: { id: issue.id, patch: { ...patch, settledAt: Date.now() } }, skipStale: [issue.id], activate: null })
    view.dispatch(tr)
  }

  // Resolution actions. Each is one ProseMirror transaction, so it syncs through Automerge
  // and undoes like any other edit.
  const actions = {
    activate: id => dispatchSemantic(view, { activate: id }),
    keepText(issue, text, resolution) {
      resolutions?.record(issue, text, resolution)
      settle(issue, { status: "resolved", resolution }, tr => tr.insertText(text, issue.from, issue.to))
    },
    keepMerged(issue) {
      resolutions?.record(issue, view.state.doc.textBetween(issue.from, issue.to), "Kept the merged text")
      settle(issue, { status: "resolved", resolution: "Kept the merged text" })
    },
    editManually(issue) {
      settle(issue, { status: "resolved", resolution: "Edited manually" }, tr => tr.setSelection(TextSelection.create(tr.doc, issue.from, issue.to)))
      view.focus()
    },
    applyGrammar(issue) {
      resolutions?.record(issue, issue.grammar.replacement, `Changed to “${issue.grammar.replacement}”`)
      settle(issue, { status: "resolved", resolution: `Changed to “${issue.grammar.replacement}”` }, tr => tr.insertText(issue.grammar.replacement, issue.from, issue.to))
    },
    dismiss(issue) {
      if (issue.key) dismissedKeys.add(issue.key)
      settle(issue, { status: "dismissed" })
    },
    reanalyze(issue) {
      // Stale grammar results are simply re-checked; stale conflicts are retired until re-detected.
      if (issue.kind === "grammar") {
        dispatchSemantic(view, { remove: [issue.id] })
        runGrammar()
      } else {
        settle(issue, { status: "dismissed", resolution: "Outdated" })
      }
    },
    addIssues: issues => dispatchSemantic(view, { add: issues }),
    // Forget every result (open, resolved, dismissed); grammar is re-checked straight away.
    clearIssues() {
      dismissedKeys.clear()
      dispatchSemantic(view, { remove: semanticState(view.state).issues.map(issue => issue.id) })
      analysis = "idle"
      runGrammar()
    },
    // Layer 2 → 3: concurrent versions of a passage are classified; a contradiction is flagged.
    // locate(doc) returns the merged passage's { from, to } at the moment the result arrives.
    async analyzeConflict({ versions, original, locate }, options) {
      analysis = "analyzing"
      publish()
      try {
        const result = await analyzeConcurrentEdits(versions, { ...options, original })
        analysis = "idle"
        if (!view.isDestroyed) autoFixGrammar(locate(view.state.doc))
        const range = view.isDestroyed ? null : locate(view.state.doc)
        if (range && (result.classification === "contradiction" || result.classification === "incoherent")) {
          const merged = view.state.doc.textBetween(range.from, range.to)
          dispatchSemantic(view, {
            add: [{
              id: `conflict-${crypto.randomUUID().slice(0, 8)}`,
              kind: "conflict",
              status: "open",
              from: range.from,
              to: range.to,
              text: merged,
              createdAt: Date.now(),
              conflict: { original, versions, merged, ...result },
            }],
          })
        }
        publish()
        return result
      } catch {
        analysis = "unavailable"
        publish()
        return null
      }
    },
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot: () => snapshot,
    actions,
    destroy() {
      clearTimeout(timer)
      resolutions?.destroy()
      unsubscribe()
      listeners.clear()
    },
  }
}

