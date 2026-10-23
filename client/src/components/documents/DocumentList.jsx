import { MdOutlineDescription, MdStar, MdPeopleOutline } from "react-icons/md"
import { DocumentMenu } from "./DocumentMenu.jsx"
import { COLLABORATORS } from "../../lib/collaborators.js"
import { formatDocDate } from "../../lib/format.js"

// Menu content is portalled outside the row, but React still bubbles its clicks here.
function openIfInside(event, doc, actions) {
  if (event.currentTarget.contains(event.target)) actions.open(doc)
}

function ownerLabel(doc, currentUserId) {
  return doc.ownerId === currentUserId ? "me" : COLLABORATORS[doc.ownerId]?.fullName ?? "Unknown"
}

const DAY = 864e5

// Date sections like familiar file lists: Today, Previous 7 days, Previous 30 days, Earlier.
function groupByDate(docs, key) {
  const today = new Date().setHours(0, 0, 0, 0)
  const label = time => (time >= today ? "Today" : time >= today - 7 * DAY ? "Previous 7 days" : time >= today - 30 * DAY ? "Previous 30 days" : "Earlier")
  const groups = []
  for (const doc of docs) {
    const name = label(doc[key])
    if (groups.at(-1)?.name !== name) groups.push({ name, docs: [] })
    groups.at(-1).docs.push(doc)
  }
  return groups
}

// view: "list" | "grid". dateKey picks the timestamp shown and grouped by.
// header: { owner, date, tools }: controls placed above the columns they act on.
export function DocumentList({ docs, view = "list", currentUserId, actions, dateKey = "openedAt", grouped = true, header = {} }) {
  const groups = grouped ? groupByDate(docs, dateKey) : [{ name: "Name", docs }]

  const headerRow = (
    <div className="doc-list-header" role="row">
      <span className="doc-list-group" role="columnheader">{view === "list" ? groups[0]?.name : ""}</span>
      <span role="columnheader">{view === "list" && header.owner}</span>
      <span role="columnheader">{header.date}</span>
      <span className="doc-list-tools">{header.tools}</span>
    </div>
  )

  if (view === "grid") {
    return (
      <div className="doc-list">
        {headerRow}
        <ul className="doc-grid" aria-label="Documents">
          {docs.map(doc => (
            <li className="doc-card" key={doc.id} onClick={event => openIfInside(event, doc, actions)}>
              <div className="doc-card-preview" aria-hidden="true">
                <div className="doc-card-page">
                  <strong>{doc.title}</strong>
                  {doc.excerpt}
                </div>
              </div>
              <div className="doc-card-body">
                <a className="doc-card-title" href={`#/doc/${doc.id}`} onClick={event => event.stopPropagation()}>{doc.title}</a>
                <span className="doc-card-meta">{formatDocDate(doc[dateKey])}</span>
                <DocumentMenu doc={doc} actions={actions} size="sm" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="doc-list" role="table" aria-label="Documents">
      {headerRow}
      {groups.map((group, index) => (
        <div role="rowgroup" key={group.name} aria-label={group.name}>
          {index > 0 && <div className="doc-list-group doc-list-group-row" role="row">{group.name}</div>}
          {group.docs.map(doc => (
            <div className="doc-row" role="row" key={doc.id} onClick={event => openIfInside(event, doc, actions)}>
              <MdOutlineDescription aria-hidden="true" />
              <div className="doc-row-title" role="cell">
                <a href={`#/doc/${doc.id}`} onClick={event => event.stopPropagation()}>{doc.title}</a>
                {doc.ownerId !== currentUserId && <MdPeopleOutline aria-label="Shared" className="doc-row-badge" />}
                {doc.starred && <MdStar aria-label="Starred" className="doc-row-badge" />}
              </div>
              <span role="cell">{ownerLabel(doc, currentUserId)}</span>
              <span role="cell">{formatDocDate(doc[dateKey])}</span>
              <DocumentMenu doc={doc} actions={actions} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
