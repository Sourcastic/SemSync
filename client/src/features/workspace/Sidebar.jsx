import { Fragment, useState } from "react"
import {
  MdMenu,
  MdKeyboardDoubleArrowLeft,
  MdAdd,
  MdOutlineHome,
  MdStarOutline,
  MdPeopleOutline,
  MdPersonOutline,
  MdOutlineFolder,
  MdHelpOutline,
  MdDeleteOutline,
  MdArrowDropDown,
  MdOutlineSettings,
  MdOutlineLightMode,
  MdLogout,
} from "react-icons/md"
import { Button, IconButton } from "../../components/ui/Button.jsx"
import { Tooltip } from "../../components/ui/Tooltip.jsx"
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator } from "../../components/ui/Dropdown.jsx"
import { Dialog, DialogClose } from "../../components/ui/Dialog.jsx"
import { ThemePicker } from "../../components/ui/ThemePicker.jsx"
import { Avatar } from "../../components/ui/Avatar.jsx"
import { ShortcutList } from "../../components/editor/Shortcuts.jsx"

const NAV = [
  ["/", "Home", MdOutlineHome],
  ["/starred", "Starred", MdStarOutline],
  ["/shared", "Shared with me", MdPeopleOutline],
  ["/owned", "Owned by me", MdPersonOutline],
  ["/folders", "Folders", MdOutlineFolder],
]

export function Sidebar({ path, user, collapsed, onToggleCollapsed, onNewDocument, onSignOut }) {
  const [dialog, setDialog] = useState(null) // "account" | "appearance" | "help" | null
  const closeDialog = open => !open && setDialog(null)

  function navLink(to, label, Icon) {
    const current = to === "/" ? path === "/" : path === to || path.startsWith(`${to}/`)
    const link = (
      <a className="sidebar-item" href={`#${to}`} aria-current={current ? "page" : undefined} aria-label={collapsed ? label : undefined}>
        <Icon /><span className="sidebar-text">{label}</span>
      </a>
    )
    return collapsed ? <Tooltip content={label} side="right">{link}</Tooltip> : link
  }

  return (
    <nav className="sidebar" id="workspace-sidebar" data-collapsed={collapsed || undefined} aria-label="Workspace">
      <div className="sidebar-header">
        <IconButton size="lg" label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-controls="workspace-sidebar" onClick={onToggleCollapsed}>
          {collapsed ? <MdMenu /> : <MdKeyboardDoubleArrowLeft />}
        </IconButton>
        <a className="brand sidebar-text" href="#/">
          SemSync
        </a>
      </div>

      <Tooltip content={collapsed ? "New document" : null} side="right">
        <Button variant="tonal" className="sidebar-new" onClick={onNewDocument} aria-label={collapsed ? "New document" : undefined}>
          <MdAdd /><span className="sidebar-text">New document</span>
        </Button>
      </Tooltip>

      <div className="sidebar-nav">
        {NAV.map(([to, label, Icon]) => <Fragment key={to}>{navLink(to, label, Icon)}</Fragment>)}
      </div>

      <div className="sidebar-footer">
        <button className="sidebar-item" onClick={() => setDialog("help")} aria-label={collapsed ? "Help & feedback" : undefined}>
          <MdHelpOutline /><span className="sidebar-text">Help & feedback</span>
        </button>
        {navLink("/trash", "Trash", MdDeleteOutline)}
        <Dropdown side="top" label="Account" trigger={
          <button className="account-button" aria-label={collapsed ? `Account: ${user.name}` : undefined}>
            <Avatar user={user} size="sm" />
            <span className="sidebar-text">{user.name}</span>
            <MdArrowDropDown className="sidebar-text" />
          </button>
        }>
          <DropdownLabel>{user.email ?? "Signed in as a guest"}</DropdownLabel>
          <DropdownItem icon={<MdOutlineSettings />} onSelect={() => setDialog("account")}>Account settings</DropdownItem>
          <DropdownItem icon={<MdOutlineLightMode />} onSelect={() => setDialog("appearance")}>Appearance</DropdownItem>
          <DropdownSeparator />
          <DropdownItem icon={<MdLogout />} onSelect={onSignOut}>Sign out</DropdownItem>
        </Dropdown>
      </div>

      <Dialog open={dialog === "appearance"} onOpenChange={closeDialog} title="Appearance">
        <ThemePicker name="settings-theme" />
      </Dialog>

      <Dialog
        open={dialog === "account"}
        onOpenChange={closeDialog}
        title="Account settings"
        footer={<DialogClose asChild><Button variant="primary">Done</Button></DialogClose>}
      >
        <dl className="settings-list">
          <div className="settings-row"><dt>Name</dt><dd>{user.name}</dd></div>
          <div className="settings-row"><dt>Email</dt><dd>{user.email ?? "None (guest)"}</dd></div>
          <div className="settings-row">
            <dt>Signed in with</dt>
            <dd>{{ password: "Email and password", demo: "Demo account", guest: "Guest (no account)" }[user.provider] ?? user.provider[0].toUpperCase() + user.provider.slice(1)}</dd>
          </div>
        </dl>
      </Dialog>

      <Dialog
        open={dialog === "help"}
        onOpenChange={closeDialog}
        title="Help & feedback"
        description="SemSync works like a familiar document editor. Flagged passages are suggestions; you decide what to keep."
        footer={<DialogClose asChild><Button variant="primary">Done</Button></DialogClose>}
      >
        <ShortcutList />
      </Dialog>
    </nav>
  )
}
