import { Fragment } from "react"
import { MdClose, MdChevronRight, MdCheck } from "react-icons/md"
import { Button, IconButton } from "../ui/Button.jsx"
import { Avatar } from "../ui/Avatar.jsx"
import { COLLABORATORS } from "../../lib/collaborators.js"

// How each concurrent-edit classification is described to people.
const CONFLICT_COPY = {
  contradiction: { title: "Possible meaning conflict", summary: "Possible contradiction", pill: "Contradiction" },
  incoherent: { title: "Sentence no longer reads correctly", summary: "Broken sentence after merge", pill: "Incoherent" },
}
const conflictCopy = issue => CONFLICT_COPY[issue.conflict.classification] ?? CONFLICT_COPY.contradiction

// High: the text now says two opposite things. Medium: it no longer reads. Low: wording only.
const SEVERITY = {
  contradiction: { label: "High", tone: "conflict" },
  incoherent: { label: "Medium", tone: "warning" },
  grammar: { label: "Low", tone: "grammar" },
}
const severityOf = issue => SEVERITY[issue.kind === "conflict" ? issue.conflict.classification : "grammar"] ?? SEVERITY.contradiction

function Severity({ issue }) {
  const { label, tone } = severityOf(issue)
  return <span className="pill severity" data-tone={tone}>{label}<span className="visually-hidden"> severity</span></span>
}

// Why the merged text can't be kept as it is, or null when it can.
const IMPOSSIBLE = {
  contradiction: "Says two opposite things at once",
  incoherent: "No longer reads as a sentence",
}

function authorOf(id) {
  return COLLABORATORS[id] ?? { id, name: id, fullName: id, color: "var(--avatar-neutral)" }
}

// Highlights what an author changed relative to the original sentence (shared prefix/suffix trimmed).
function changedPart(original, text) {
  if (!original) return [text, "", ""]
  let start = 0
  while (start < original.length && start < text.length && original[start] === text[start]) start++
  let end = 0
  while (end < original.length - start && end < text.length - start && original[original.length - 1 - end] === text[text.length - 1 - end]) end++
  // Snap to whole words, so "stable" → "skyrocketing" isn't shown as "table" → "kyrocketing".
  const isWord = ch => ch !== undefined && /[\w’']/.test(ch)
  while (start > 0 && isWord(original[start - 1]) && isWord(original[start])) start--
  while (end > 0 && isWord(original[original.length - end]) && isWord(original[original.length - end - 1])) end--
  return [text.slice(0, start), text.slice(start, text.length - end), text.slice(text.length - end)]
}

// What an author did to the original sentence: removed and/or added words.
function changeOf(original, text) {
  const [before, changed, after] = changedPart(original, text)
  return { removed: original.slice(before.length, original.length - after.length).trim(), added: changed.trim() }
}

function Change({ removed, added }) {
  return (
    <span className="change-words">
      {removed && <del>{removed}</del>}
      {removed && added && <span aria-hidden="true"> → </span>}
      {added && <ins>{added}</ins>}
    </span>
  )
}

// The changed part of the merged sentence, with one word of context on each side.
function mergedExcerpt(original, merged) {
  const [before, changed, after] = changedPart(original, merged)
  const left = before.match(/(\S+\s*)$/)?.[1] ?? ""
  const right = after.match(/^(\s*\S+)/)?.[1] ?? ""
  return { left: before.length > left.length ? `…${left}` : left, changed, right: after.length > right.length ? `${right}…` : right }
}

function Header({ title, description, onClose, severity }) {
  return (
    <div className="conflict-popover-header">
      <div>
        <div className="conflict-popover-title">{title}{severity}</div>
        {description && <div className="conflict-popover-desc">{description}</div>}
      </div>
      <IconButton size="sm" label="Close" tooltip={false} onClick={onClose}><MdClose /></IconButton>
    </div>
  )
}

function StaleNotice({ issue, actions }) {
  return (
    <p className="review-item-note">
      This suggestion may be outdated.{" "}
      <Button variant="link" onClick={() => actions.reanalyze(issue)}>Analyze again</Button>
    </p>
  )
}

// One row per option: who, what changed, and a Keep button. Full sentences live under Details.
export function ConflictDetails({ issue, actions }) {
  const { versions, merged, original, classification } = issue.conflict
  const impossible = IMPOSSIBLE[classification]
  const stale = issue.status === "stale"
  const names = versions.map(v => authorOf(v.authorId).name).join(" and ")
  const now = mergedExcerpt(original, merged)
  return (
    <div className="conflict-popover">
      <Header title={conflictCopy(issue).summary} severity={<Severity issue={issue} />} description={`${names} edited this sentence at the same time.`} onClose={() => actions.activate(null)} />
      {stale && <StaleNotice issue={issue} actions={actions} />}
      <div className="choice-rows">
        {versions.map(version => {
          const author = authorOf(version.authorId)
          return (
            <div className="choice-row" key={version.authorId}>
              <span className="choice-row-who"><Avatar user={author} size="xs" />{author.name}</span>
              <Change {...changeOf(original, version.text)} />
              {!stale && (
                <Button variant="secondary" size="sm" aria-label={`Keep ${author.name}’s version`} onClick={() => actions.keepText(issue, version.text, `Kept ${author.name}’s version`)}>
                  Keep
                </Button>
              )}
            </div>
          )
        })}
        <div className="choice-row" data-merged>
          <span className="choice-row-who">Now reads</span>
          <span className="change-words">
            {now.left}<mark>{now.changed}</mark>{now.right}
            {impossible && <span className="choice-row-reason">{impossible}</span>}
          </span>
          {!stale && (
            <Button variant="secondary" size="sm" disabled={!!impossible} aria-label={impossible ? `Can’t keep the merged text: ${impossible.toLowerCase()}` : "Keep the merged text"} onClick={() => actions.keepMerged(issue)}>
              Keep
            </Button>
          )}
        </div>
      </div>
      {!stale && (
        <div className="conflict-popover-footer">
          <Button variant="link" onClick={() => actions.editManually(issue)}>Edit manually</Button>
          <Button variant="link" className="quiet-link" onClick={() => actions.dismiss(issue)}>Dismiss</Button>
        </div>
      )}
      <details className="analysis-details">
        <summary><MdChevronRight />Details</summary>
        <dl>
          <dt>Before</dt><dd>{original}</dd>
          {versions.map(v => (
            <Fragment key={v.authorId}><dt>{authorOf(v.authorId).name}</dt><dd>{v.text}</dd></Fragment>
          ))}
          <dt>Merged</dt><dd>{merged}</dd>
        </dl>
      </details>
    </div>
  )
}

// Small hover card for a grammar suggestion.
export function GrammarDetails({ issue, actions }) {
  const { rule, message, replacement } = issue.grammar
  if (issue.status === "stale") return <div className="conflict-popover"><Header title={rule} onClose={() => actions.activate(null)} /><StaleNotice issue={issue} actions={actions} /></div>
  return (
    <div className="conflict-popover grammar-card">
      <div className="conflict-popover-title">{rule}<Severity issue={issue} /></div>
      <span className="change-words"><del>{issue.text}</del><span aria-hidden="true"> → </span><ins>{replacement}</ins></span>
      <p className="conflict-popover-desc">{message}</p>
      <div className="conflict-popover-footer">
        <Button variant="primary" size="sm" onClick={() => actions.applyGrammar(issue)}>Apply</Button>
        <Button variant="link" className="quiet-link" onClick={() => actions.dismiss(issue)}>Ignore</Button>
      </div>
    </div>
  )
}

export function IssueDetails(props) {
  return props.issue.kind === "conflict" ? <ConflictDetails {...props} /> : <GrammarDetails {...props} />
}

// Compact summary used by rail cards and Review panel rows.
export function IssueSummary({ issue, time }) {
  const conflict = issue.kind === "conflict"
  const label = conflict ? conflictCopy(issue).summary : issue.grammar.rule
  const when = time && <time>{time}</time>

  if (issue.status === "resolved" || issue.status === "dismissed") {
    const resolved = issue.status === "resolved"
    return (
      <>
        <span className="review-item-type">
          {resolved ? <MdCheck className="review-item-icon" data-tone="success" /> : <MdClose className="review-item-icon" />}
          {resolved ? "Resolved" : "Dismissed"}
          {when}
        </span>
        <span className="review-item-excerpt">{label}{issue.resolution ? ` · ${issue.resolution}` : ""}</span>
      </>
    )
  }

  const stale = issue.status === "stale"
  return (
    <>
      <span className="review-item-type">
        <span className="sem-swatch" data-kind={stale ? "muted" : conflict ? undefined : "grammar"} />
        {label}
        {!stale && <Severity issue={issue} />}
        {when}
      </span>
      <span className="review-item-excerpt">
        {conflict ? issue.text : `“${issue.text}” → “${issue.grammar.replacement}”`}
      </span>
      {conflict && (
        <span className="review-item-meta">
          {issue.conflict.versions.map(v => authorOf(v.authorId).name).join(" and ")}
        </span>
      )}
      {stale && <span className="review-item-note">May be outdated</span>}
    </>
  )
}
