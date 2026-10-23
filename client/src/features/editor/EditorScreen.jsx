import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { MdArrowBack, MdStar, MdStarOutline, MdOutlineFolder, MdLockOutline, MdMoreVert, MdDeleteOutline, MdLink, MdOutlineRateReview } from "react-icons/md"
import { EditorSurface } from "../../components/editor/EditorSurface.jsx"
import { Toolbar } from "../../components/editor/Toolbar.jsx"
import { MenuBar } from "../../components/editor/MenuBar.jsx"
import { SyncStatus } from "../../components/editor/SyncStatus.jsx"
import { ShortcutList } from "../../components/editor/Shortcuts.jsx"
import { ThemePicker } from "../../components/ui/ThemePicker.jsx"
import { ShareDialog } from "../../components/documents/ShareDialog.jsx"
import { connectPresence } from "../../components/collaboration/presence.js"
import { PresenceAvatars } from "../../components/collaboration/PresenceAvatars.jsx"
import { presenceIdentity, DEMO_MODE } from "../../demo/identity.js"
import { DemoControls } from "../../demo/DemoControls.jsx"
import { connectSemantic } from "../../components/semantic/semantic.js"
import { MarginRail } from "../../components/semantic/MarginRail.jsx"
import { IssuePopover } from "../../components/semantic/IssuePopover.jsx"
import { ReviewPanel } from "../../components/semantic/ReviewPanel.jsx"
import { GrammarHoverCard } from "../../components/semantic/GrammarHoverCard.jsx"
import { isVisible } from "../../components/semantic/semanticPlugin.js"
import { useMediaQuery } from "../../lib/useMediaQuery.js"
import { IconButton, Button, SplitButton } from "../../components/ui/Button.jsx"
import { Dropdown, DropdownItem } from "../../components/ui/Dropdown.jsx"
import { Dialog, DialogClose } from "../../components/ui/Dialog.jsx"
import { useToast } from "../../components/ui/Toast.jsx"
import { Tooltip } from "../../components/ui/Tooltip.jsx"
import { Avatar } from "../../components/ui/Avatar.jsx"
import { usePageTitle } from "../../lib/usePageTitle.js"
import { useDocuments, updateDocument, createDocument, shareLink } from "../../lib/documents.js"
import { useDocumentHandle } from "../../lib/documentContent.js"
import { navigate } from "../../lib/router.js"

const noopSubscribe = () => () => {}

export function EditorScreen({ id, shared, session }) {
  const docs = useDocuments()
  const meta = docs.find(doc => doc.id === id)
  const loaded = useDocumentHandle(id, shared)
  const toast = useToast()

  const [editor, setEditor] = useState(null)
  const me = presenceIdentity(session)
  const [presence, setPresence] = useState(null)
  const [semantic, setSemantic] = useState(null)
  const semanticSnapshot = useSyncExternalStore(semantic ? semantic.subscribe : noopSubscribe, () => semantic?.getSnapshot() ?? null)
  const narrow = useMediaQuery("(max-width: 1179px)")
  const [reviewOpen, setReviewOpen] = useState(() => {
    try {
      // On phones the panel covers the page, so it only opens when asked.
      return localStorage.getItem("semsync-review-open") === "true" && !window.matchMedia("(max-width: 900px)").matches
    } catch {
      return false
    }
  })
  const openCount = semanticSnapshot?.issues.filter(isVisible).length ?? 0

  function toggleReview() {
    setReviewOpen(open => {
      try {
        localStorage.setItem("semsync-review-open", String(!open))
      } catch {}
      return !open
    })
  }
  const [linkOpen, setLinkOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [appearanceOpen, setAppearanceOpen] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => {
    if (meta) updateDocument(id, { openedAt: Date.now() })
  }, [id]) // record the open once per document

  usePageTitle(meta ? meta.title : "Document not found")

  // Presence lives as long as this editor instance; it never touches document content.
  useEffect(() => {
    if (!editor || loaded.status !== "ready") return
    const connection = connectPresence(editor, loaded.handle, me)
    setPresence(connection)
    return () => {
      connection.destroy()
      setPresence(null)
    }
  }, [editor, loaded, session.userId])

  // Semantic layer: analysis results and resolution actions for this editor instance.
  useEffect(() => {
    if (!editor || loaded.status !== "ready") return
    const connection = connectSemantic(editor, { handle: loaded.handle, me, notify: toast })
    setSemantic(connection)
    return () => {
      connection.destroy()
      setSemantic(null)
    }
  }, [editor, loaded, session.userId])

  // Keep "Last modified" current as the document changes.
  useEffect(() => {
    if (loaded.status !== "ready") return
    let timer
    const onChange = () => {
      clearTimeout(timer)
      timer = setTimeout(() => updateDocument(id, { modifiedAt: Date.now() }), 1000)
    }
    loaded.handle.on("change", onChange)
    return () => {
      loaded.handle.off("change", onChange)
      clearTimeout(timer)
    }
  }, [loaded, id])

  if (!meta || loaded.status === "error") {
    return (
      <main className="auth">
        <div className="auth-panel">
          <h1 className="auth-title">{meta ? "Unable to open this document" : "Document not found"}</h1>
          <p className="auth-subtitle">
            {meta ? "The document couldn’t be loaded from this device or the sync server. Check your connection and try again." : "It may have been deleted, or the link is incomplete."}
          </p>
          <Button variant="secondary" onClick={() => navigate("/")}><MdArrowBack />Back to documents</Button>
        </div>
      </main>
    )
  }

  function newDocument() {
    navigate(`/doc/${createDocument(session.userId).id}`)
  }

  function trash() {
    updateDocument(id, { trashed: true })
    toast("Moved to trash", { label: "Undo", onClick: () => updateDocument(id, { trashed: false }) })
    navigate("/")
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareLink(meta))
      toast("Link copied")
    } catch {
      toast("Couldn’t copy the link. Copy it from the address bar instead.")
    }
  }

  return (
    <div className="editor-screen">
      <header className="app-bar">
        <IconButton label="Back to documents" onClick={() => navigate("/")}><MdArrowBack /></IconButton>
        <div className="app-bar-main">
          <div className="app-bar-title-row">
            <TitleInput key={meta.id} meta={meta} inputRef={titleRef} />
            <IconButton size="sm" label={meta.starred ? "Remove from starred" : "Star"} aria-pressed={meta.starred} onClick={() => updateDocument(id, { starred: !meta.starred })}>
              {meta.starred ? <MdStar /> : <MdStarOutline />}
            </IconButton>
            {meta.folder && (
              <a className="pill app-bar-folder" data-variant="outline" href={`#/folders/${encodeURIComponent(meta.folder)}`}><MdOutlineFolder />{meta.folder}</a>
            )}
            {loaded.status === "ready" && <SyncStatus handle={loaded.handle} />}
          </div>
          <MenuBar
            editor={editor}
            onNewDocument={newDocument}
            onShare={() => setShareOpen(true)}
            onRename={() => titleRef.current?.select()}
            onTrash={trash}
            onShortcuts={() => setShortcutsOpen(true)}
            onInsertLink={() => setLinkOpen(true)}
            reviewOpen={reviewOpen}
            onToggleReview={toggleReview}
            onAppearance={() => setAppearanceOpen(true)}
          />
        </div>
        <div className="app-bar-actions">
          <PresenceAvatars presence={presence} />
          <span className="review-toggle">
            <IconButton label={openCount ? `Review, ${openCount} open` : "Review"} aria-pressed={reviewOpen} onClick={toggleReview}>
              <MdOutlineRateReview />
            </IconButton>
            {openCount > 0 && <span className="count-badge" aria-hidden="true">{openCount}</span>}
          </span>
          <SplitButton
            menuLabel="Share options"
            onClick={() => setShareOpen(true)}
            renderMenu={caret => (
              <Dropdown align="end" label="Share options" trigger={caret}>
                <DropdownItem icon={<MdLink />} onSelect={copyLink}>Copy link</DropdownItem>
              </Dropdown>
            )}
          >
            <MdLockOutline />Share
          </SplitButton>
          <Dropdown align="end" label="More actions" trigger={<IconButton label="More actions" tooltip={false}><MdMoreVert /></IconButton>}>
            <DropdownItem icon={<MdDeleteOutline />} variant="danger" onSelect={trash}>Move to trash</DropdownItem>
          </Dropdown>
          <Tooltip content={`You · ${me.fullName ?? me.name}`}>
            <span className="app-bar-self" tabIndex={0}><Avatar user={me} label={`You, ${me.fullName ?? me.name}`} /></span>
          </Tooltip>
        </div>
      </header>

      <Toolbar editor={editor} linkOpen={linkOpen} onLinkOpenChange={setLinkOpen} />

      <div className="editor-workspace">
        <div className="editor-canvas">
          <div className="doc-layout">
            <div className="page">
              {loaded.status === "ready" ? (
                <EditorSurface handle={loaded.handle} onReady={setEditor} onRequestLink={() => setLinkOpen(true)} />
              ) : (
                <div className="page-loading" aria-busy="true" aria-label="Opening document">
                  <span className="skeleton" style={{ width: "50%", height: 24 }} />
                  <span className="skeleton" />
                  <span className="skeleton" style={{ width: "92%" }} />
                  <span className="skeleton" style={{ width: "75%" }} />
                </div>
              )}
            </div>
            {!narrow && !reviewOpen && (semanticSnapshot ? <MarginRail editor={editor} semantic={semantic} snapshot={semanticSnapshot} /> : <aside className="margin-rail" />)}
          </div>
        </div>
        {semanticSnapshot && <ReviewPanel open={reviewOpen} semantic={semantic} snapshot={semanticSnapshot} onClose={toggleReview} />}
      </div>
      {editor && semanticSnapshot && <GrammarHoverCard editor={editor} semantic={semantic} snapshot={semanticSnapshot} pinActive={!reviewOpen} />}
      {narrow && !reviewOpen && semanticSnapshot && <IssuePopover semantic={semantic} snapshot={semanticSnapshot} />}
      {DEMO_MODE && <DemoControls documentId={id} localAuthorId={me.id} editor={editor} handle={loaded.handle} presence={presence} semantic={semantic} />}

      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} documentTitle={meta.title} documentId={meta.id} />
      <Dialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
        title="Keyboard shortcuts"
        footer={<DialogClose asChild><Button variant="primary">Done</Button></DialogClose>}
      >
        <ShortcutList />
      </Dialog>
      <Dialog open={appearanceOpen} onOpenChange={setAppearanceOpen} title="Appearance">
        <ThemePicker name="editor-theme" />
      </Dialog>
    </div>
  )
}

// Local draft while typing; committed on blur or Enter so the index isn't rewritten per keystroke.
function TitleInput({ meta, inputRef }) {
  const [draft, setDraft] = useState(meta.title)

  function commit() {
    const next = draft.trim()
    if (!next) return setDraft(meta.title)
    if (next !== meta.title) updateDocument(meta.id, { title: next, modifiedAt: Date.now() })
  }

  return (
    <input
      ref={inputRef}
      className="doc-title-input"
      aria-label="Document title"
      size={Math.max(draft.length, 8)} // width follows the title, capped by CSS max-width
      value={draft}
      onChange={event => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={event => {
        if (event.key === "Enter") event.currentTarget.blur()
        if (event.key === "Escape") {
          setDraft(meta.title)
          requestAnimationFrame(() => event.target.blur())
        }
      }}
    />
  )
}
