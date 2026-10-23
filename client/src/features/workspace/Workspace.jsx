import { useState } from "react"
import { MdSearch, MdClose, MdAdd, MdFilterList, MdFormatListBulleted, MdGridView, MdOutlineFolder } from "react-icons/md"
import { Sidebar } from "./Sidebar.jsx"
import { DocumentList } from "../../components/documents/DocumentList.jsx"
import { ShareDialog } from "../../components/documents/ShareDialog.jsx"
import { Button, ButtonRow, IconButton } from "../../components/ui/Button.jsx"
import { Dialog, DialogClose } from "../../components/ui/Dialog.jsx"
import { Select } from "../../components/ui/Select.jsx"
import { useToast } from "../../components/ui/Toast.jsx"
import { useDocuments, updateDocument, createDocument, folderNames, sortDocuments, SORT_OPTIONS } from "../../lib/documents.js"
import { navigate } from "../../lib/router.js"
import { signOut, userFromSession } from "../../lib/session.js"
import { useMediaQuery } from "../../lib/useMediaQuery.js"
import { usePageTitle } from "../../lib/usePageTitle.js"

const OWNER_OPTIONS = [
  { value: "anyone", label: "Owned by anyone" },
  { value: "me", label: "Owned by me" },
  { value: "others", label: "Not owned by me" },
]

// Each view is a filter over the same document index.
const VIEWS = {
  "/": { title: "Recent", filter: () => true, empty: ["No documents yet", "Create a document or ask a teammate to share one with you."] },
  "/starred": { title: "Starred", filter: doc => doc.starred, empty: ["No starred documents yet", "Star documents you want to find quickly."] },
  "/shared": { title: "Shared with me", filter: (doc, me) => doc.ownerId !== me, empty: ["Nothing shared with you yet", "Documents teammates share with you appear here."] },
  "/owned": { title: "Owned by me", filter: (doc, me) => doc.ownerId === me, empty: ["You don’t own any documents yet", "Documents you create appear here."] },
}

const PAGE_TITLES = { "/": "Home", "/starred": "Starred", "/shared": "Shared with me", "/owned": "Owned by me", "/folders": "Folders", "/trash": "Trash" }

function readPreference(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback
  } catch {
    return fallback
  }
}

function writePreference(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {}
}

export function Workspace({ path, session }) {
  const docs = useDocuments()
  const toast = useToast()
  const me = session.userId

  const [query, setQuery] = useState("")
  const [sort, setSort] = useState("openedAt")
  const [owner, setOwner] = useState("anyone")
  const [layout, setLayout] = useState(() => readPreference("semsync-doc-layout", "list"))
  const [collapsed, setCollapsed] = useState(() => readPreference("semsync-sidebar", "expanded") === "collapsed")
  const narrow = useMediaQuery("(max-width: 720px)")
  usePageTitle(
    query.trim() ? "Search"
    : path.startsWith("/folders/") ? decodeURIComponent(path.slice("/folders/".length))
    : PAGE_TITLES[path] ?? "Home"
  )
  const [renaming, setRenaming] = useState(null)
  const [moving, setMoving] = useState(null)
  const [sharing, setSharing] = useState(null)

  function chooseLayout(next) {
    setLayout(next)
    writePreference("semsync-doc-layout", next)
  }

  function toggleSidebar() {
    setCollapsed(c => {
      writePreference("semsync-sidebar", c ? "expanded" : "collapsed")
      return !c
    })
  }

  function newDocument() {
    const doc = createDocument(me)
    navigate(`/doc/${doc.id}`)
  }

  const actions = {
    open: doc => navigate(`/doc/${doc.id}`),
    rename: doc => setRenaming(doc),
    move: doc => setMoving(doc),
    share: doc => setSharing(doc),
    toggleStar: doc => updateDocument(doc.id, { starred: !doc.starred }),
    trash: doc => {
      updateDocument(doc.id, { trashed: true })
      toast("Moved to trash", { label: "Undo", onClick: () => updateDocument(doc.id, { trashed: false }) })
    },
    restore: doc => {
      updateDocument(doc.id, { trashed: false })
      toast("Document restored")
    },
  }

  const live = docs.filter(doc => !doc.trashed)
  const ownerFilter = doc => owner === "anyone" || (owner === "me") === (doc.ownerId === me)
  const header = {
    owner: <Select label="Owner" value={owner} onValueChange={setOwner} options={OWNER_OPTIONS} variant="ghost" size="sm" />,
    date: <Select label="Sort by" value={sort} onValueChange={setSort} options={SORT_OPTIONS} variant="ghost" size="sm" />,
    tools: (
      <div className="segmented" role="group" aria-label="Layout">
        <button aria-pressed={layout === "list"} aria-label="List view" onClick={() => chooseLayout("list")}><MdFormatListBulleted /></button>
        <button aria-pressed={layout === "grid"} aria-label="Grid view" onClick={() => chooseLayout("grid")}><MdGridView /></button>
      </div>
    ),
  }
  const listProps = { view: layout, currentUserId: me, actions, header, dateKey: sort === "title" ? "openedAt" : sort, grouped: sort !== "title" }

  let content
  const trimmed = query.trim().toLowerCase()
  if (trimmed) {
    const results = sortDocuments(live.filter(doc => doc.title.toLowerCase().includes(trimmed)), sort)
    content = (
      <section aria-labelledby="ws-title">
        <ListHeading id="ws-title" title={`Results for “${query.trim()}”`} />
        {results.length ? <DocumentList docs={results} {...listProps} /> : <Empty title="No matching documents" body="Try a different word from the document’s title." />}
      </section>
    )
  } else if (path === "/trash") {
    const trashed = sortDocuments(docs.filter(doc => doc.trashed), "modifiedAt")
    content = (
      <section aria-labelledby="ws-title">
        <ListHeading id="ws-title" title="Trash" />
        <p className="workspace-note">Documents in Trash can be restored from their menu.</p>
        {trashed.length ? <DocumentList docs={trashed} {...listProps} view="list" dateKey="modifiedAt" header={{}} /> : <Empty title="Trash is empty" body="Documents you move to trash appear here." />}
      </section>
    )
  } else if (path === "/folders") {
    const names = folderNames(docs)
    content = (
      <section aria-labelledby="ws-title">
        <ListHeading id="ws-title" title="Folders" />
        {names.length ? (
          <ul className="folder-list">
            {names.map(name => (
              <li key={name}>
                <a className="folder-row" href={`#/folders/${encodeURIComponent(name)}`}>
                  <MdOutlineFolder aria-hidden="true" />
                  <span>{name}</span>
                  <span className="folder-count">{live.filter(doc => doc.folder === name).length} documents</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="No folders yet" body="Use “Move to folder” on a document to create one." />
        )}
      </section>
    )
  } else if (path.startsWith("/folders/")) {
    const name = decodeURIComponent(path.slice("/folders/".length))
    const inFolder = sortDocuments(live.filter(doc => doc.folder === name), sort)
    content = (
      <section aria-labelledby="ws-title">
        <ListHeading id="ws-title" title={name} back={{ href: "#/folders", label: "Folders" }} />
        {inFolder.length ? <DocumentList docs={inFolder} {...listProps} /> : <Empty title="This folder is empty" body="Use “Move to folder” on a document to add it here." />}
      </section>
    )
  } else {
    const view = VIEWS[path] ?? VIEWS["/"]
    const list = sortDocuments(live.filter(doc => view.filter(doc, me) && ownerFilter(doc)), sort)
    content = (
      <>
        {path === "/" && (
          <section className="home-intro" aria-labelledby="home-title">
            <h1 className="home-title" id="home-title">Welcome, {userFromSession(session).name}</h1>
            <h2 className="section-label">Start a new document</h2>
            <button className="template-tile" onClick={newDocument}>
              <span className="template-tile-page" aria-hidden="true"><MdAdd /></span>
              <span>Blank document</span>
            </button>
          </section>
        )}
        <section aria-labelledby="ws-title">
          {path === "/" ? <h2 className="visually-hidden" id="ws-title">Recent documents</h2> : <ListHeading id="ws-title" title={view.title} />}
          {list.length ? <DocumentList docs={list} {...listProps} /> : <Empty title={view.empty[0]} body={view.empty[1]} />}
        </section>
      </>
    )
  }

  return (
    <div className="workspace">
      <Sidebar
        path={path}
        user={{ ...userFromSession(session), name: session.name, email: session.email, provider: session.provider }}
        collapsed={collapsed || narrow}
        onToggleCollapsed={toggleSidebar}
        onNewDocument={newDocument}
        onSignOut={() => { signOut(); navigate("/login") }}
      />
      <div className="workspace-main">
        <header className="workspace-topbar">
          <label className="search workspace-search">
            <MdSearch />
            <span className="visually-hidden">Search documents</span>
            <input type="search" placeholder="Search documents" value={query} onChange={event => setQuery(event.target.value)} />
            {query && (
              <IconButton size="sm" label="Clear search" tooltip={false} onClick={() => setQuery("")}><MdClose /></IconButton>
            )}
          </label>
        </header>
        <main className="workspace-content">{content}</main>
      </div>

      {renaming && <RenameDialog doc={renaming} onClose={() => setRenaming(null)} onDone={() => toast("Document renamed")} />}
      {moving && <MoveDialog doc={moving} folders={folderNames(docs)} onClose={() => setMoving(null)} onDone={folder => toast(folder ? `Moved to ${folder}` : "Removed from folder")} />}
      {sharing && <ShareDialog open documentTitle={sharing.title} documentId={sharing.id} onOpenChange={open => !open && setSharing(null)} />}
    </div>
  )
}

function ListHeading({ id, title, back }) {
  return (
    <div className="list-controls">
      {back && <a className="list-back" href={back.href}>{back.label} /</a>}
      <h1 className="list-controls-title" id={id}>{title}</h1>
    </div>
  )
}

function Empty({ title, body }) {
  return (
    <div className="empty-state">
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-body">{body}</div>
    </div>
  )
}

function RenameDialog({ doc, onClose, onDone }) {
  const [title, setTitle] = useState(doc.title)
  const [error, setError] = useState(null)

  function submit(event) {
    event.preventDefault()
    const next = title.trim()
    if (!next) return setError("Enter a name for the document.")
    if (next !== doc.title) {
      updateDocument(doc.id, { title: next, modifiedAt: Date.now() })
      onDone()
    }
    onClose()
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()} title="Rename document">
      <form className="dialog-form" onSubmit={submit}>
        <div className="field">
          <label className="field-label" htmlFor="rename-input">Name</label>
          <input
            className="input"
            id="rename-input"
            value={title}
            autoFocus
            onFocus={event => event.target.select()}
            onChange={event => { setTitle(event.target.value); setError(null) }}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? "rename-error" : undefined}
          />
          {error && <span className="field-error" id="rename-error" role="alert">{error}</span>}
        </div>
        <div className="dialog-footer">
          <ButtonRow>
            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
            <Button type="submit" variant="primary">Rename</Button>
          </ButtonRow>
        </div>
      </form>
    </Dialog>
  )
}

const NO_FOLDER = "__none__"

function MoveDialog({ doc, folders, onClose, onDone }) {
  const [folder, setFolder] = useState(doc.folder ?? NO_FOLDER)
  const [newFolder, setNewFolder] = useState("")

  function submit(event) {
    event.preventDefault()
    const target = newFolder.trim() || (folder === NO_FOLDER ? null : folder)
    if (target !== doc.folder) {
      updateDocument(doc.id, { folder: target })
      onDone(target)
    }
    onClose()
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()} title={`Move “${doc.title}”`}>
      <form className="dialog-form" onSubmit={submit}>
        <div className="field">
          <span className="field-label" aria-hidden="true">Folder</span>
          <Select
            label="Folder"
            value={folder}
            onValueChange={setFolder}
            options={[{ value: NO_FOLDER, label: "No folder" }, ...folders.map(name => ({ value: name, label: name }))]}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="move-new">Or create a new folder</label>
          <input className="input" id="move-new" placeholder="Folder name" value={newFolder} onChange={event => setNewFolder(event.target.value)} />
        </div>
        <div className="dialog-footer">
          <ButtonRow>
            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
            <Button type="submit" variant="primary">Move</Button>
          </ButtonRow>
        </div>
      </form>
    </Dialog>
  )
}
