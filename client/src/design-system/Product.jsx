import {
  MdArrowBack,
  MdArrowDropDown,
  MdCheck,
  MdChevronRight,
  MdClose,
  MdDeleteOutline,
  MdInfoOutline,
  MdLockOutline,
  MdMoreVert,
  MdOutlineCloudDone,
  MdOutlineDescription,
  MdOutlineFolder,
  MdOutlineRateReview,
  MdStarOutline,
  MdSync,
} from "react-icons/md"
import { Section, Group } from "./Section.jsx"
import { Toolbar } from "../components/editor/Toolbar.jsx"
import { Sidebar } from "../features/workspace/Sidebar.jsx"
import { DocumentList } from "../components/documents/DocumentList.jsx"
import { useDocuments } from "../lib/documents.js"
import { Avatar, AvatarGroup } from "../components/ui/Avatar.jsx"
import { COLLABORATORS } from "../lib/collaborators.js"

const { eshaal, atika, ibrahim } = COLLABORATORS

const noop = () => {}
const DEMO_ACTIONS = { open: noop, rename: noop, toggleStar: noop, move: noop, share: noop, trash: noop, restore: noop }
const DEMO_USER = { name: "Eshaal Rehmatullah", email: "eshaal.r@lhr.nu.edu.pk", provider: "password" }

export function EditorChrome() {
  return (
    <>
      <header className="app-bar">
        <button className="icon-button" aria-label="Back to home"><MdArrowBack /></button>
        <div className="app-bar-main">
          <div className="app-bar-title-row">
            <input className="doc-title-input" defaultValue="Market Analysis Draft" aria-label="Document title" />
            <button className="icon-button" data-size="sm" aria-label="Star"><MdStarOutline /></button>
            <span className="pill" data-variant="outline"><MdOutlineFolder />FYP</span>
            <span className="sync-status" data-state="saved"><MdOutlineCloudDone />Saved</span>
          </div>
          <nav className="menubar" aria-label="Menu bar">
            {["File", "Edit", "View", "Insert", "Format", "Help"].map(m => (
              <button key={m} className="menubar-item" aria-haspopup="menu" aria-expanded={m === "Format" ? "true" : "false"}>{m}</button>
            ))}
          </nav>
        </div>
        <div className="app-bar-actions">
          <AvatarGroup users={[atika, ibrahim]} />
          <button className="icon-button" aria-label="Review" aria-pressed="true"><MdOutlineRateReview /></button>
          <div className="split-button">
            <button className="button" data-variant="tonal"><MdLockOutline />Share</button>
            <button className="button" data-variant="tonal" aria-label="Share options" aria-haspopup="menu"><MdArrowDropDown /></button>
          </div>
          <button className="icon-button" aria-label="More"><MdMoreVert /></button>
        </div>
      </header>
      <Toolbar editor={null} />
    </>
  )
}

/* Static rendering of what ProseMirror decorations produce, using the same classes. */
export function DocumentSample() {
  return (
    <div className="doc-content">
      <h1>Market Analysis Draft</h1>
      <p>
        Regional demand for mid-range devices recovered through the third quarter, led by
        replacement purchases in urban markets
        <span className="collab-selection" style={{ "--collab-color": atika.color }}> and a modest rise in first-time buyers</span>
        <span className="collab-caret" style={{ "--collab-color": atika.color }}>
          <span className="collab-caret-label">Atika</span>
        </span>.
      </p>
      <p className="sem-has-conflict">
        <span className="sem-conflict" data-active>
          The company expects revenue to increase sharply next quarter. The company expects revenue to decline significantly next quarter.
        </span>
      </p>
      <p>
        <span className="sem-grammar">The results shows</span> a significant improvement in retention after the
        pricing change
        <span className="collab-caret" style={{ "--collab-color": ibrahim.color }} data-idle>
          <span className="collab-caret-label">Ibrahim</span>
        </span>.
      </p>
    </div>
  )
}

export function ConflictPopover() {
  return (
    <div className="popover" role="dialog" aria-labelledby="ds-conflict-title">
      <div className="conflict-popover">
        <div className="conflict-popover-header">
          <div>
            <div className="conflict-popover-title" id="ds-conflict-title">Possible meaning conflict</div>
            <div className="conflict-popover-desc">Two collaborators edited this passage at the same time.</div>
          </div>
          <button className="icon-button" data-size="sm" aria-label="Close"><MdClose /></button>
        </div>
        <div className="version-list">
          <div className="version" style={{ "--collab-color": atika.color }}>
            <span className="version-author">
              <Avatar user={atika} size="xs" />Atika
              <button className="button" data-variant="secondary" data-size="sm" aria-label="Keep Atika’s version">Keep</button>
            </span>
            <span className="version-text">The company expects revenue to <ins>increase sharply</ins> next quarter.</span>
          </div>
          <div className="version" style={{ "--collab-color": ibrahim.color }}>
            <span className="version-author">
              <Avatar user={ibrahim} size="xs" />Ibrahim
              <button className="button" data-variant="secondary" data-size="sm" aria-label="Keep Ibrahim’s version">Keep</button>
            </span>
            <span className="version-text">The company expects revenue to <ins>decline significantly</ins> next quarter.</span>
          </div>
          <div className="version">
            <span className="version-author">
              Merged version <span className="pill" data-tone="conflict">Contradiction</span>
              <button className="button" data-variant="secondary" data-size="sm">Keep merged</button>
            </span>
            <span className="version-text" style={{ color: "var(--text-secondary)" }}>
              The company expects revenue to increase sharply next quarter. The company expects revenue to decline significantly next quarter.
            </span>
          </div>
        </div>
        <div className="button-row">
          <button className="button" data-variant="secondary" data-size="sm">Edit manually</button>
          <button className="button" data-variant="ghost" data-size="sm">Dismiss</button>
        </div>
        <details className="analysis-details">
          <summary><MdChevronRight />Analysis details</summary>
          <dl>
            <dt>Classification</dt><dd>Contradiction</dd>
            <dt>Confidence</dt><dd>0.94</dd>
            <dt>Model</dt><dd>deberta-v3-small (MNLI)</dd>
            <dt>Changes</dt><dd>2 concurrent heads</dd>
          </dl>
        </details>
      </div>
    </div>
  )
}

function GrammarPopover() {
  return (
    <div className="popover" role="dialog" aria-labelledby="ds-grammar-title" style={{ width: 320 }}>
      <div className="conflict-popover">
        <div className="conflict-popover-header">
          <div>
            <div className="conflict-popover-title" id="ds-grammar-title">Subject–verb agreement</div>
            <div className="conflict-popover-desc">“results” is plural.</div>
          </div>
        </div>
        <div className="version" style={{ "--collab-color": "var(--grammar-line)" }}>
          <span className="version-text">The results <ins>show</ins> a significant improvement.</span>
        </div>
        <div className="button-row">
          <button className="button" data-variant="primary" data-size="sm">Apply</button>
          <button className="button" data-variant="ghost" data-size="sm">Ignore</button>
        </div>
      </div>
    </div>
  )
}

export function ReviewPanel() {
  return (
    <aside className="review-panel" aria-label="Review">
      <div className="review-panel-header">
        <h3 className="review-panel-title">Review</h3>
        <button className="icon-button" data-size="sm" aria-label="Close review"><MdClose /></button>
      </div>
      <div className="review-panel-body">
        <ReviewItems />
      </div>
    </aside>
  )
}

function ReviewItems() {
  return (
    <>
      <div className="review-section-label">Needs review<span className="count">2</span></div>
      <button className="review-item" aria-current="true">
        <span className="review-item-type"><span className="sem-swatch" />Possible contradiction<time>2 min ago</time></span>
        <span className="review-item-excerpt">The company expects revenue to increase sharply next quarter. The company expects revenue to decline significantly…</span>
        <span className="review-item-meta"><AvatarGroup users={[atika, ibrahim]} size="xs" />Atika, Ibrahim</span>
      </button>
      <div className="review-item" data-state="stale">
        <span className="review-item-type"><span className="sem-swatch" data-kind="muted" />Possible contradiction<time>14 min ago</time></span>
        <span className="review-item-excerpt">Operating costs will remain flat while headcount doubles.</span>
        <span className="review-item-note">
          This suggestion may be outdated. <button className="button" data-variant="link">Analyze again</button>
        </span>
      </div>
      <div className="review-section-label">Grammar<span className="count">1</span></div>
      <button className="review-item">
        <span className="review-item-type"><span className="sem-swatch" data-kind="grammar" />Subject–verb agreement<time>Just now</time></span>
        <span className="review-item-excerpt">The results shows a significant improvement.</span>
        <span className="review-item-meta">Suggestion: “show”</span>
      </button>
      <div className="review-section-label">Resolved<span className="count">2</span></div>
      <div className="review-item" data-state="resolved">
        <span className="review-item-type"><MdCheck style={{ color: "var(--success)" }} />Resolved<time>Yesterday</time></span>
        <span className="review-item-excerpt">Kept Atika’s version: “Demand recovered in urban markets.”</span>
      </div>
      <div className="review-item" data-state="dismissed">
        <span className="review-item-type"><MdClose />Dismissed<time>Yesterday</time></span>
        <span className="review-item-excerpt">Pricing is competitive yet premium.</span>
      </div>
    </>
  )
}

export function Product() {
  const sample = useDocuments().filter(doc => !doc.trashed).slice(0, 3)
  return (
    <>
      <Section id="sidebar" title="Sidebar navigation" lead="The real Sidebar component. Selected state is a subtle tint, stronger text and an accent icon.">
        <div className="ds-row" style={{ alignItems: "stretch" }}>
          <div className="ds-frame" style={{ height: 560 }}>
            <Sidebar path="/" user={DEMO_USER} onToggleCollapsed={noop} onNewDocument={noop} onSignOut={noop} />
          </div>
          <div className="ds-frame" style={{ height: 560 }}>
            <Sidebar path="/" user={DEMO_USER} collapsed onToggleCollapsed={noop} onNewDocument={noop} onSignOut={noop} />
          </div>
        </div>
      </Section>

      <Section id="documents" title="Documents" lead="The real DocumentList. Rows are the default; grid cards stay restrained: a real-text thumbnail, a title, one line of metadata.">
        <Group title="Document rows">
          <div className="ds-frame" data-column style={{ padding: "var(--space-2) var(--space-4)" }}>
            <DocumentList docs={sample} currentUserId="eshaal" actions={DEMO_ACTIONS} />
          </div>
        </Group>
        <Group title="Document cards (grid view)">
          <DocumentList docs={sample} view="grid" currentUserId="eshaal" actions={DEMO_ACTIONS} />
        </Group>
      </Section>

      <Section id="editor" title="Editor chrome" lead="Title row and menu bar share the top area, formatting toolbar below. The page stays the visual center.">
        <Group title="App bar, menu bar, formatting toolbar">
          <div className="ds-frame" data-column style={{ background: "var(--surface-canvas)" }}>
            <EditorChrome />
          </div>
        </Group>
      </Section>

      <Section id="presence" title="Collaborators and presence" lead="Avatars carry a stable color per person. Carets show a short name label that fades when idle; selections use a light tint of the same color.">
        <Group title="Avatars">
          <div className="ds-stage">
            <Avatar user={eshaal} size="xs" />
            <Avatar user={atika} size="sm" />
            <Avatar user={ibrahim} />
            <Avatar user={eshaal} size="lg" />
            <AvatarGroup users={[eshaal, atika, ibrahim]} />
            <AvatarGroup users={[eshaal, atika, ibrahim, { id: "x", name: "Guest", color: "var(--avatar-neutral)" }]} max={2} size="sm" />
          </div>
        </Group>
        <Group title="In-document presence, semantic and grammar marks (decorations)">
          <div className="ds-frame" style={{ background: "var(--surface-canvas)", padding: "var(--space-6) var(--space-4)", display: "block" }}>
            <div className="doc-layout">
              <div className="page" style={{ minHeight: 380, width: 720, "--page-pad-y": "var(--space-10)", "--page-pad-x": "var(--space-12)" }}>
                <DocumentSample />
              </div>
              <div className="margin-rail" aria-label="Suggestions">
                <button className="margin-card" style={{ top: 150 }} aria-expanded="false">
                  <span className="review-item-type"><span className="sem-swatch" />Possible contradiction</span>
                  <span className="review-item-excerpt">Atika and Ibrahim edited this sentence at the same time.</span>
                  <span className="review-item-meta"><AvatarGroup users={[atika, ibrahim]} size="xs" />Review</span>
                </button>
                <button className="margin-card" style={{ top: 272 }} aria-expanded="false">
                  <span className="review-item-type"><span className="sem-swatch" data-kind="grammar" />Subject–verb agreement</span>
                  <span className="review-item-excerpt">shows → show</span>
                </button>
              </div>
            </div>
          </div>
          <div className="ds-row" style={{ marginTop: "var(--space-3)" }}>
            <span className="review-item-type"><span className="sem-swatch" />Conflict: solid coral underline, faint tint, right-margin bar and card</span>
            <span className="review-item-type"><span className="sem-swatch" data-kind="grammar" />Grammar: dotted violet underline</span>
            <span className="review-item-type"><span className="sem-swatch" data-kind="muted" />Stale: dashed, muted</span>
          </div>
        </Group>
      </Section>

      <Section id="semantic" title="Semantic review" lead="“Review recommended”, not “document broken”. Resolution actions become ProseMirror transactions; technical NLP detail stays collapsed.">
        <div className="ds-split">
          <Group title="Conflict popover">
            <div className="ds-stage" data-start><ConflictPopover /></div>
          </Group>
          <Group title="Grammar popover">
            <div className="ds-stage" data-start><GrammarPopover /></div>
          </Group>
        </div>
        <div className="ds-split">
          <Group title="Review panel">
            <div className="ds-frame" style={{ height: 600, justifyContent: "flex-end" }}>
              <ReviewPanel />
            </div>
          </Group>
          <Group title="Analysis states">
            <div className="ds-stage" data-column>
              <span className="sync-status"><MdSync />Analyzing changes…</span>
              <span className="review-item-type"><span className="sem-swatch" />Conflict detected</span>
              <span className="review-item-type"><span className="sem-swatch" data-kind="grammar" />Grammar issue</span>
              <span className="review-item-type"><MdCheck style={{ color: "var(--success)" }} />Resolved</span>
              <span className="review-item-type"><MdClose />Dismissed</span>
              <span className="review-item-type"><span className="sem-swatch" data-kind="muted" />Stale result</span>
              <div className="notice">
                <MdInfoOutline />
                Semantic analysis is temporarily unavailable. Editing and collaboration still work.
              </div>
            </div>
          </Group>
        </div>
      </Section>

      <Section id="themes" title="Light and dark" lead="Dark mode overrides tokens only. Deep navy surfaces, soft white text, no glow.">
        <div className="ds-theme-pair">
          {["light", "dark"].map(theme => (
            <div className="ds-theme-pane" data-theme={theme} key={theme}>
              <span className="ds-caption">{theme === "light" ? "Light" : "Dark"}</span>
              <Toolbar editor={null} />
              <div className="page" style={{ minHeight: 0, "--page-pad-y": "var(--space-6)", "--page-pad-x": "var(--space-8)" }}>
                <div className="doc-content">
                  <p className="sem-has-conflict" style={{ marginLeft: "var(--space-2)" }}>
                    <span className="sem-conflict">Revenue will increase sharply. Revenue will decline significantly.</span>
                  </p>
                  <p><span className="sem-grammar">The results shows</span> improvement.</p>
                </div>
              </div>
              <div className="ds-row">
                <div className="button-row">
                  <button className="button" data-variant="primary">Share</button>
                  <button className="button" data-variant="secondary">Keep merged</button>
                </div>
                <span className="sync-status"><MdOutlineCloudDone />Saved</span>
                <AvatarGroup users={[eshaal, atika, ibrahim]} size="sm" />
              </div>
              <div className="menu" style={{ alignSelf: "flex-start" }}>
                <button className="menu-item"><MdOutlineDescription />Open</button>
                <button className="menu-item" data-highlighted><MdStarOutline />Star</button>
                <button className="menu-item" data-variant="danger"><MdDeleteOutline />Move to trash</button>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}

