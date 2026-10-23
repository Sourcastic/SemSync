import { MdKeyboardDoubleArrowRight, MdInfoOutline, MdSync } from "react-icons/md"
import { IconButton } from "../ui/Button.jsx"
import { IssueDetails, IssueSummary } from "./IssueDetails.jsx"
import { isVisible } from "./semanticPlugin.js"
import { formatRelativeTime } from "../../lib/format.js"

function scrollToIssue(id) {
  document.querySelector(`[data-issue-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" })
}

// Right-side panel listing every semantic result. The active issue expands in place;
// selecting a row also scrolls the document to the flagged text.
export function ReviewPanel({ open = true, semantic, snapshot, onClose }) {
  const { issues, activeId, analysis } = snapshot
  const byNewest = (a, b) => (b.settledAt ?? b.createdAt) - (a.settledAt ?? a.createdAt)
  const needsReview = issues.filter(i => i.kind === "conflict" && isVisible(i)).sort((a, b) => a.from - b.from)
  const grammar = issues.filter(i => i.kind === "grammar" && isVisible(i)).sort((a, b) => a.from - b.from)
  const resolved = issues.filter(i => i.status === "resolved" || i.status === "dismissed").sort(byNewest)

  function openIssue(issue) {
    semantic.actions.activate(issue.id)
    requestAnimationFrame(() => scrollToIssue(issue.id))
  }

  function renderSection({ title, items, empty, interactive = true }) {
    return (
      <section aria-label={title}>
        <h3 className="review-section-label">{title}<span className="count">{items.length}</span></h3>
        {items.length === 0 && <p className="review-empty">{empty}</p>}
        {items.map(issue =>
          interactive && issue.id === activeId ? (
            <div className="review-item" data-expanded key={issue.id}>
              <IssueDetails issue={issue} actions={semantic.actions} />
            </div>
          ) : interactive ? (
            <button className="review-item" key={issue.id} data-state={issue.status} onClick={() => openIssue(issue)}>
              <IssueSummary issue={issue} time={formatRelativeTime(issue.createdAt)} />
            </button>
          ) : (
            <div className="review-item" key={issue.id} data-state={issue.status}>
              <IssueSummary issue={issue} time={formatRelativeTime(issue.settledAt ?? issue.createdAt)} />
            </div>
          )
        )}
      </section>
    )
  }

  return (
    // Always mounted so it can slide open and closed; `inert` keeps it unreachable while closed.
    <aside className="review-panel" data-open={open} inert={!open} aria-label="Review">
      <div className="review-panel-inner">
        <div className="review-panel-header">
          <h2 className="review-panel-title">Review</h2>
          <IconButton size="sm" label="Close review" tooltip={false} onClick={onClose}><MdKeyboardDoubleArrowRight /></IconButton>
        </div>
        <div className="review-panel-body">
          {analysis === "analyzing" && (
            <p className="sync-status review-status"><MdSync aria-hidden="true" />Analyzing changes…</p>
          )}
          {analysis === "unavailable" && (
            <div className="notice review-status">
              <MdInfoOutline aria-hidden="true" />
              Semantic analysis is temporarily unavailable. Editing and collaboration still work.
            </div>
          )}
          {renderSection({ title: "Needs review", items: needsReview, empty: "No possible contradictions." })}
          {renderSection({ title: "Grammar", items: grammar, empty: "No grammar suggestions." })}
          {renderSection({ title: "Resolved", items: resolved, empty: "Resolved and dismissed items appear here.", interactive: false })}
        </div>
      </div>
    </aside>
  )
}
