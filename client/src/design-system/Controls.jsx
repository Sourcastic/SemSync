import {
  MdAdd,
  MdArrowDropDown,
  MdCheck,
  MdClose,
  MdContentCopy,
  MdDeleteOutline,
  MdDriveFileRenameOutline,
  MdFormatBold,
  MdFormatItalic,
  MdFormatListBulleted,
  MdFormatUnderlined,
  MdGridView,
  MdInfoOutline,
  MdLink,
  MdLockOutline,
  MdLogout,
  MdMoreVert,
  MdOpenInNew,
  MdOutlineCloudDone,
  MdOutlineCloudOff,
  MdOutlineDarkMode,
  MdOutlineDescription,
  MdOutlineDesktopWindows,
  MdOutlineFolder,
  MdOutlineLightMode,
  MdOutlinePersonAddAlt,
  MdOutlineSettings,
  MdSearch,
  MdStarOutline,
  MdSync,
} from "react-icons/md"
import { Section, Group } from "./Section.jsx"
import { Avatar } from "../components/ui/Avatar.jsx"
import { COLLABORATORS } from "../lib/collaborators.js"

const { eshaal, atika, ibrahim } = COLLABORATORS

export function Controls() {
  return (
    <>
      <Section id="buttons" title="Buttons" lead="Rounded, never squarish. Primary appears once per view; buttons placed together share one width.">
        <Group title="Variants">
          <div className="ds-stage">
            <button className="button" data-variant="primary">Continue</button>
            <button className="button" data-variant="tonal">Tonal</button>
            <button className="button" data-variant="secondary"><MdOutlinePersonAddAlt />Share</button>
            <button className="button" data-variant="ghost">Cancel</button>
            <button className="button" data-variant="danger">Move to trash</button>
            <button className="button" data-variant="link">Forgot password?</button>
            <button className="button" data-variant="primary" disabled>Disabled</button>
          </div>
        </Group>
        <Group title="Paired buttons share one width · split button">
          <div className="ds-stage">
            <div className="button-row">
              <button className="button" data-variant="ghost">Cancel</button>
              <button className="button" data-variant="primary">Move to trash</button>
            </div>
            <div className="button-row">
              <button className="button" data-variant="secondary">Edit manually</button>
              <button className="button" data-variant="ghost">Dismiss</button>
            </div>
            <div className="split-button">
              <button className="button" data-variant="tonal"><MdLockOutline />Share</button>
              <button className="button" data-variant="tonal" aria-label="Share options"><MdArrowDropDown /></button>
            </div>
          </div>
        </Group>
        <Group title="Sizes: sm 28 · md 36 · lg 40">
          <div className="ds-stage">
            <button className="button" data-variant="secondary" data-size="sm">Keep merged</button>
            <button className="button" data-variant="secondary">New document</button>
            <button className="button" data-variant="primary" data-size="lg">Log in</button>
          </div>
        </Group>
        <Group title="Icon buttons (ghost by default; pressed uses accent tint)">
          <div className="ds-stage">
            <button className="icon-button" aria-label="More actions"><MdMoreVert /></button>
            <button className="icon-button" data-size="sm" aria-label="Bold" aria-pressed="true"><MdFormatBold /></button>
            <button className="icon-button" data-size="sm" aria-label="Italic" aria-pressed="false"><MdFormatItalic /></button>
            <button className="icon-button" data-size="sm" aria-label="Underline"><MdFormatUnderlined /></button>
            <button className="icon-button" data-size="sm" aria-label="Insert link" disabled><MdLink /></button>
            <button className="icon-button" data-size="lg" aria-label="Close"><MdClose /></button>
            <span className="ds-caption">Round hover, Material icons at 18px</span>
          </div>
        </Group>
      </Section>

      <Section id="inputs" title="Inputs" lead="Inputs and buttons share the 36px height so they align on one baseline.">
        <div className="ds-split">
          <Group title="Text field">
            <div className="ds-stage" data-column>
              <div className="field">
                <label className="field-label" htmlFor="ds-email">Work email</label>
                <input className="input" id="ds-email" type="email" placeholder="name@company.com" />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="ds-invite">Invite by email</label>
                <input className="input" id="ds-invite" aria-invalid="true" defaultValue="atika@" aria-describedby="ds-invite-err" />
                <span className="field-error" id="ds-invite-err">Enter a complete email address.</span>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="ds-disabled">Document ID</label>
                <input className="input" id="ds-disabled" disabled defaultValue="automerge:4Ndy…" />
                <span className="field-help">Assigned automatically.</span>
              </div>
            </div>
          </Group>
          <Group title="Search, select, segmented">
            <div className="ds-stage" data-column>
              <label className="search">
                <MdSearch />
                <span className="visually-hidden">Search documents</span>
                <input type="search" placeholder="Search documents" />
              </label>
              <div className="ds-row">
                <button className="select-trigger" aria-haspopup="listbox" style={{ minWidth: 140 }}>
                  Editor <MdArrowDropDown />
                </button>
                <button className="select-trigger" data-variant="ghost" data-size="sm" aria-haspopup="menu">
                  Last opened <MdArrowDropDown />
                </button>
                <div className="segmented" role="group" aria-label="Layout">
                  <button aria-pressed="true" aria-label="List view"><MdFormatListBulleted /></button>
                  <button aria-pressed="false" aria-label="Grid view"><MdGridView /></button>
                </div>
              </div>
              <div className="segmented" role="group" aria-label="Appearance">
                <button aria-pressed="false"><MdOutlineLightMode />Light</button>
                <button aria-pressed="true"><MdOutlineDarkMode />Dark</button>
                <button aria-pressed="false"><MdOutlineDesktopWindows />System</button>
              </div>
            </div>
          </Group>
        </div>
      </Section>

      <Section id="menus" title="Menus, popovers, tooltips" lead="Radix provides behavior; these classes provide the look. Floating layers are the only places shadows appear.">
        <div className="ds-split">
          <Group title="Document menu">
            <div className="ds-stage" data-start>
              <div className="menu" role="menu" aria-label="Document actions">
                <button className="menu-item" role="menuitem"><MdOpenInNew />Open</button>
                <button className="menu-item" role="menuitem" data-highlighted><MdDriveFileRenameOutline />Rename</button>
                <button className="menu-item" role="menuitem"><MdStarOutline />Star</button>
                <button className="menu-item" role="menuitem"><MdOutlineFolder />Move to folder</button>
                <button className="menu-item" role="menuitem"><MdOutlinePersonAddAlt />Share</button>
                <div className="menu-separator" role="separator" />
                <button className="menu-item" role="menuitem" data-variant="danger"><MdDeleteOutline />Move to trash</button>
              </div>
            </div>
          </Group>
          <Group title="Account dropdown">
            <div className="ds-stage" data-start>
              <div className="menu" role="menu" aria-label="Account">
                <div className="menu-label">eshaal.r@lhr.nu.edu.pk</div>
                <button className="menu-item" role="menuitem"><MdOutlineSettings />Account settings</button>
                <button className="menu-item" role="menuitem"><MdOutlineLightMode />Appearance<span className="menu-shortcut">System</span></button>
                <div className="menu-separator" role="separator" />
                <button className="menu-item" role="menuitem"><MdLogout />Sign out</button>
              </div>
            </div>
          </Group>
          <Group title="Menu bar menu (Format)">
            <div className="ds-stage" data-start>
              <div className="menu" role="menu" aria-label="Format">
                <button className="menu-item" role="menuitemcheckbox" aria-checked="true">
                  <span className="menu-item-check"><MdCheck /></span>Bold<span className="menu-shortcut">Ctrl+B</span>
                </button>
                <button className="menu-item" role="menuitemcheckbox" aria-checked="false">
                  <span className="menu-item-check" />Italic<span className="menu-shortcut">Ctrl+I</span>
                </button>
                <button className="menu-item" role="menuitemcheckbox" aria-checked="false">
                  <span className="menu-item-check" />Underline<span className="menu-shortcut">Ctrl+U</span>
                </button>
                <div className="menu-separator" role="separator" />
                <button className="menu-item" role="menuitem" data-disabled aria-disabled="true">
                  <span className="menu-item-check" />Clear formatting<span className="menu-shortcut">Ctrl+\</span>
                </button>
              </div>
            </div>
          </Group>
        </div>
        <div className="ds-split">
          <Group title="Popover (generic)">
            <div className="ds-stage" data-start>
              <div className="popover" role="dialog" aria-label="Link">
                <div className="field">
                  <label className="field-label" htmlFor="ds-link">Link</label>
                  <input className="input" id="ds-link" defaultValue="https://nu.edu.pk/fyp" />
                </div>
                <div className="dialog-footer" style={{ marginTop: "var(--space-3)" }}>
                  <div className="button-row">
                    <button className="button" data-variant="ghost" data-size="sm">Remove</button>
                    <button className="button" data-variant="primary" data-size="sm">Apply</button>
                  </div>
                </div>
              </div>
            </div>
          </Group>
          <Group title="Tooltips">
            <div className="ds-stage">
              <span className="ds-anchor">
                <span className="tooltip" role="tooltip">Bold <kbd>Ctrl+B</kbd></span>
                <button className="icon-button" data-size="sm" aria-label="Bold"><MdFormatBold /></button>
              </span>
              <span className="ds-anchor">
                <span className="tooltip" role="tooltip">Atika Hussain · editing</span>
                <Avatar user={atika} />
              </span>
              <span className="ds-anchor">
                <span className="tooltip" role="tooltip">All changes saved to this device and synced</span>
                <span className="sync-status"><MdOutlineCloudDone />Saved</span>
              </span>
            </div>
          </Group>
        </div>
      </Section>

      <Section id="tabs" title="Tabs and status" lead="Tabs use an underline marker, not pills. Pills only carry status, filters and tags.">
        <div className="ds-split">
          <Group title="Tabs">
            <div className="ds-stage" data-column>
              <div className="tab-list" role="tablist" aria-label="Review">
                <button className="tab" role="tab" aria-selected="true">Needs review<span className="count">2</span></button>
                <button className="tab" role="tab" aria-selected="false">Grammar<span className="count">1</span></button>
                <button className="tab" role="tab" aria-selected="false">Resolved<span className="count">3</span></button>
              </div>
            </div>
          </Group>
          <Group title="Pills">
            <div className="ds-stage">
              <span className="pill" data-tone="conflict">Contradiction</span>
              <span className="pill" data-tone="grammar">Grammar</span>
              <span className="pill" data-tone="success"><MdCheck />Resolved</span>
              <span className="pill" data-tone="warning">Offline</span>
              <span className="pill">Dismissed</span>
              <span className="pill" data-variant="outline">My docs</span>
            </div>
          </Group>
        </div>
        <Group title="Sync status (routine states stay muted)">
          <div className="ds-stage">
            <span className="sync-status" data-state="saving"><MdSync />Saving…</span>
            <span className="sync-status" data-state="saved"><MdOutlineCloudDone />Saved</span>
            <span className="sync-status" data-state="synced"><MdOutlineCloudDone />Synced</span>
            <span className="sync-status" data-state="offline"><MdOutlineCloudOff />Offline</span>
            <span className="sync-status" data-state="reconnecting"><MdSync />Reconnecting…</span>
          </div>
        </Group>
      </Section>

      <Section id="dialogs" title="Dialogs" lead="Dialogs are for focused tasks like sharing. Semantic review never interrupts with a modal.">
        <div className="ds-overlay-stage">
          <div className="dialog" role="dialog" aria-labelledby="ds-share-title">
            <div className="dialog-header">
              <div>
                <h3 className="dialog-title" id="ds-share-title">Share “Market Analysis Draft”</h3>
              </div>
              <button className="icon-button" aria-label="Close"><MdClose /></button>
            </div>
            <div className="ds-row" style={{ flexWrap: "nowrap" }}>
              <input className="input" placeholder="Invite by email" aria-label="Invite by email" />
              <button className="select-trigger" aria-haspopup="listbox">Editor <MdArrowDropDown /></button>
            </div>
            <div>
              <div className="field-label" style={{ marginBottom: "var(--space-2)" }}>People with access</div>
              {[
                [eshaal, "eshaal.r@lhr.nu.edu.pk", "Owner"],
                [atika, "atika.h@lhr.nu.edu.pk", "Editor"],
                [ibrahim, "ibrahim.f@lhr.nu.edu.pk", "Editor"],
              ].map(([user, email, role]) => (
                <div className="ds-row" key={user.id} style={{ flexWrap: "nowrap", padding: "var(--space-2) 0" }}>
                  <Avatar user={user} size="lg" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div>{user.fullName}{user.id === "eshaal" && <span className="ds-caption"> (you)</span>}</div>
                    <div className="field-help">{email}</div>
                  </div>
                  {role === "Owner" ? (
                    <span className="ds-caption">Owner</span>
                  ) : (
                    <button className="select-trigger" data-variant="ghost" data-size="sm">{role} <MdArrowDropDown /></button>
                  )}
                </div>
              ))}
            </div>
            <div className="ds-row" style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
              <MdLockOutline /> Only people with access can open this link
            </div>
            <div className="dialog-footer">
              <div className="button-row">
                <button className="button" data-variant="secondary"><MdContentCopy />Copy link</button>
                <button className="button" data-variant="primary">Done</button>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section id="feedback" title="Empty, loading, toast" lead="Restrained by default: no illustrations, no shimmer, toasts only for meaningful confirmation.">
        <div className="ds-split">
          <Group title="Empty state">
            <div className="ds-stage" data-start>
              <div className="empty-state">
                <div className="empty-state-title">No starred documents yet</div>
                <div className="empty-state-body">Star documents you want to find quickly.</div>
              </div>
            </div>
          </Group>
          <Group title="Empty state with action">
            <div className="ds-stage" data-start>
              <div className="empty-state">
                <div className="empty-state-title">No documents yet</div>
                <div className="empty-state-body">Create a document or ask a teammate to share one with you.</div>
                <button className="button" data-variant="secondary"><MdAdd />New document</button>
              </div>
            </div>
          </Group>
        </div>
        <div className="ds-split">
          <Group title="Loading: document list">
            <div className="ds-stage" data-column aria-busy="true" aria-label="Loading documents">
              {[60, 45, 70].map(w => (
                <div key={w} className="ds-row" style={{ flexWrap: "nowrap" }}>
                  <MdOutlineDescription style={{ color: "var(--text-disabled)" }} />
                  <span className="skeleton" style={{ width: `${w}%` }} />
                  <span className="skeleton" style={{ width: 64, marginLeft: "auto" }} />
                </div>
              ))}
            </div>
          </Group>
          <Group title="Loading: editor page">
            <div className="ds-stage" data-column aria-busy="true" aria-label="Loading document">
              <span className="skeleton" style={{ width: "50%", height: 20 }} />
              <span className="skeleton" style={{ width: "100%" }} />
              <span className="skeleton" style={{ width: "92%" }} />
              <span className="skeleton" style={{ width: "75%" }} />
              <span className="ds-caption">Opening document…</span>
            </div>
          </Group>
        </div>
        <Group title="Toasts">
          <div className="ds-stage">
            <div className="toast" role="status">Link copied</div>
            <div className="toast" role="status">
              Moved to trash
              <button className="button" data-variant="link">Undo</button>
              <button className="icon-button" data-size="sm" aria-label="Dismiss"><MdClose /></button>
            </div>
            <div className="toast" role="status">Conflict resolved · Kept Atika’s version</div>
          </div>
        </Group>
        <Group title="Inline notice (errors stay specific)">
          <div className="ds-stage" data-column>
            <div className="notice"><MdInfoOutline />Connection lost. Changes will sync when you’re back online.</div>
            <div className="notice" data-tone="danger">
              <MdInfoOutline />Unable to rename document.
            </div>
          </div>
        </Group>
      </Section>
    </>
  )
}
