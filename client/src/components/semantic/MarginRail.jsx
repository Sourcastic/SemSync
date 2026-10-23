import { useLayoutEffect, useRef, useState } from "react"
import { IssueDetails, IssueSummary } from "./IssueDetails.jsx"
import { useEditorState } from "../editor/useEditorState.js"
import { isVisible } from "./semanticPlugin.js"

const CARD_GAP = 8

// Right-margin cards beside the text they refer to, like comments in familiar editors.
// The active card expands in place; the others stack below it without overlapping.
export function MarginRail({ editor, semantic, snapshot }) {
  useEditorState(editor) // re-measure as the document reflows
  const railRef = useRef(null)
  const cardRefs = useRef(new Map())
  const [tops, setTops] = useState({})

  // Only meaning conflicts get margin cards; grammar appears on hover and in the Review panel.
  const issues = snapshot.issues.filter(issue => issue.kind === "conflict" && isVisible(issue)).sort((a, b) => a.from - b.from)

  useLayoutEffect(() => {
    const rail = railRef.current
    if (!rail || !editor) return
    const railTop = rail.getBoundingClientRect().top
    let bottom = 0
    const next = {}
    for (const issue of issues) {
      const wanted = editor.view.coordsAtPos(issue.from).top - railTop
      const top = Math.max(wanted, bottom)
      next[issue.id] = Math.round(top)
      bottom = top + (cardRefs.current.get(issue.id)?.offsetHeight ?? 0) + CARD_GAP
    }
    const changed = Object.keys(next).length !== Object.keys(tops).length || Object.entries(next).some(([id, top]) => tops[id] !== top)
    if (changed) setTops(next)
  })

  const register = id => node => {
    if (node) cardRefs.current.set(id, node)
    else cardRefs.current.delete(id)
  }

  return (
    <aside className="margin-rail" ref={railRef} aria-label="Suggestions">
      {issues.map(issue => {
        const style = { top: tops[issue.id] ?? 0, visibility: issue.id in tops ? "visible" : "hidden" }
        return issue.id === snapshot.activeId ? (
          <section className="margin-card" data-expanded key={issue.id} ref={register(issue.id)} style={style} aria-label="Suggestion details">
            <IssueDetails issue={issue} actions={semantic.actions} />
          </section>
        ) : (
          <button className="margin-card" key={issue.id} ref={register(issue.id)} style={style} onClick={() => semantic.actions.activate(issue.id)}>
            <IssueSummary issue={issue} />
          </button>
        )
      })}
    </aside>
  )
}
