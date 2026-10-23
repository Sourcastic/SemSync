import { useState } from "react"
import {
  MdOpenInNew,
  MdDriveFileRenameOutline,
  MdStarOutline,
  MdOutlineFolder,
  MdOutlinePersonAddAlt,
  MdDeleteOutline,
  MdMoreVert,
  MdOutlineSettings,
  MdOutlineLightMode,
  MdLogout,
  MdArrowDropDown,
  MdLockOutline,
  MdLink,
  MdFilterList,
  MdOutlineMail,
} from "react-icons/md"
import { Section, Group } from "./Section.jsx"
import { Button, IconButton, ButtonRow, SplitButton } from "../components/ui/Button.jsx"
import { Dropdown, DropdownItem, DropdownCheckboxItem, DropdownLabel, DropdownSeparator } from "../components/ui/Dropdown.jsx"
import { Popover, PopoverClose } from "../components/ui/Popover.jsx"
import { Select } from "../components/ui/Select.jsx"
import { Tabs, TabList, Tab, TabPanel } from "../components/ui/Tabs.jsx"
import { Avatar } from "../components/ui/Avatar.jsx"
import { ShareDialog } from "../components/documents/ShareDialog.jsx"
import { ThemePicker } from "../components/ui/ThemePicker.jsx"
import { COLLABORATORS } from "../lib/collaborators.js"

const SORTS = [
  { value: "opened", label: "Last opened" },
  { value: "modified", label: "Last modified" },
  { value: "name", label: "Name" },
  { value: "created", label: "Created date" },
]


export function Live() {
  const [sort, setSort] = useState("opened")
  const [format, setFormat] = useState({ bold: true, italic: false })
  const [lastAction, setLastAction] = useState("None")

  return (
    <Section id="live" title="Live components" lead="The React wrappers in components/ui. Radix supplies keyboard, focus and positioning; the classes above supply the look. Screens import these, never Radix directly.">
      <Group title="Dropdowns (click, or focus and press Enter / arrow keys)">
        <div className="ds-stage">
          <Dropdown label="Document actions" trigger={<IconButton label="Document actions" tooltip={false}><MdMoreVert /></IconButton>}>
            <DropdownItem icon={<MdOpenInNew />} onSelect={() => setLastAction("Open")}>Open</DropdownItem>
            <DropdownItem icon={<MdDriveFileRenameOutline />} onSelect={() => setLastAction("Rename")}>Rename</DropdownItem>
            <DropdownItem icon={<MdStarOutline />} onSelect={() => setLastAction("Star")}>Star</DropdownItem>
            <DropdownItem icon={<MdOutlineFolder />} onSelect={() => setLastAction("Move to folder")}>Move to folder</DropdownItem>
            <DropdownItem icon={<MdOutlinePersonAddAlt />} onSelect={() => setLastAction("Share")}>Share</DropdownItem>
            <DropdownSeparator />
            <DropdownItem icon={<MdDeleteOutline />} variant="danger" onSelect={() => setLastAction("Move to trash")}>Move to trash</DropdownItem>
          </Dropdown>

          <Dropdown label="Account" trigger={
            <button className="account-button" style={{ width: "auto" }} aria-haspopup="menu">
              <Avatar user={COLLABORATORS.eshaal} size="sm" />
              <span className="sidebar-text">Eshaal Rehmatullah</span>
              <MdArrowDropDown />
            </button>
          }>
            <DropdownLabel>eshaal.r@lhr.nu.edu.pk</DropdownLabel>
            <DropdownItem icon={<MdOutlineSettings />}>Account settings</DropdownItem>
            <DropdownItem icon={<MdOutlineLightMode />} shortcut="System">Appearance</DropdownItem>
            <DropdownSeparator />
            <DropdownItem icon={<MdLogout />}>Sign out</DropdownItem>
          </Dropdown>

          <Dropdown label="Format" trigger={<button className="menubar-item">Format</button>}>
            <DropdownCheckboxItem checked={format.bold} onCheckedChange={bold => setFormat(f => ({ ...f, bold }))} shortcut="Ctrl+B">Bold</DropdownCheckboxItem>
            <DropdownCheckboxItem checked={format.italic} onCheckedChange={italic => setFormat(f => ({ ...f, italic }))} shortcut="Ctrl+I">Italic</DropdownCheckboxItem>
          </Dropdown>

          <SplitButton
            menuLabel="Share options"
            onClick={() => setLastAction("Share")}
            renderMenu={caret => (
              <Dropdown align="end" label="Share options" trigger={caret}>
                <DropdownItem icon={<MdLink />} onSelect={() => setLastAction("Copy link")}>Copy link</DropdownItem>
                <DropdownItem icon={<MdOutlineMail />} onSelect={() => setLastAction("Email collaborators")}>Email collaborators</DropdownItem>
              </Dropdown>
            )}
          >
            <MdLockOutline />Share
          </SplitButton>

          <span className="ds-caption">Last action: {lastAction}</span>
        </div>
      </Group>

      <div className="ds-split">
        <Group title="Select (sort control)">
          <div className="ds-stage">
            <Select label="Sort by" value={sort} onValueChange={setSort} options={SORTS} variant="ghost" size="sm" />
            <Select label="Owner" defaultValue="anyone" variant="ghost" size="sm" icon={<MdFilterList />} options={[
              { value: "anyone", label: "Owned by anyone" },
              { value: "me", label: "Owned by me" },
              { value: "others", label: "Not owned by me" },
            ]} />
          </div>
        </Group>
        <Group title="Tabs">
          <div className="ds-stage" data-column>
            <Tabs defaultValue="appearance">
              <TabList label="Settings">
                <Tab value="appearance">Appearance</Tab>
                <Tab value="account">Account</Tab>
                <Tab value="review" count={3}>Review</Tab>
              </TabList>
              <TabPanel value="appearance" className="ds-caption" style={{ paddingTop: "var(--space-3)" }}>Theme, density.</TabPanel>
              <TabPanel value="account" className="ds-caption" style={{ paddingTop: "var(--space-3)" }}>Name, email, sign-in.</TabPanel>
              <TabPanel value="review" className="ds-caption" style={{ paddingTop: "var(--space-3)" }}>Semantic review preferences.</TabPanel>
            </Tabs>
          </div>
        </Group>
      </div>

      <Group title="Choice tiles: ThemePicker (onboarding, Settings → Appearance). Changes the page theme.">
        <div className="ds-stage" data-column style={{ maxWidth: 560 }}>
          <ThemePicker name="ds-theme" />
        </div>
      </Group>

      <div className="ds-split">
        <Group title="Dialog">
          <div className="ds-stage">
            <ShareDialog documentTitle="Market Demand Analysis" documentId="market-demand" trigger={<Button variant="tonal"><MdLockOutline />Share</Button>} />
          </div>
        </Group>
        <Group title="Popover">
          <div className="ds-stage">
            <Popover label="Insert link" trigger={<IconButton label="Insert link" shortcut="Ctrl+K"><MdLink /></IconButton>}>
              <div className="field">
                <label className="field-label" htmlFor="live-link">Link</label>
                <input className="input" id="live-link" placeholder="Paste or type a link" />
              </div>
              <div className="dialog-footer" style={{ marginTop: "var(--space-3)" }}>
                <ButtonRow>
                  <PopoverClose asChild><Button variant="ghost" size="sm">Cancel</Button></PopoverClose>
                  <PopoverClose asChild><Button variant="primary" size="sm">Apply</Button></PopoverClose>
                </ButtonRow>
              </div>
            </Popover>
            <span className="ds-caption">Hover icon buttons for tooltips.</span>
          </div>
        </Group>
      </div>
    </Section>
  )
}
