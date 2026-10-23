import { forwardRef } from "react"
import {
  MdAdd,
  MdOutlinePersonAddAlt,
  MdDriveFileRenameOutline,
  MdDeleteOutline,
  MdUndo,
  MdRedo,
  MdSelectAll,
  MdLink,
  MdHorizontalRule,
  MdFormatClear,
  MdOutlineKeyboard,
  MdOutlineLightMode,
} from "react-icons/md"
import { Dropdown, DropdownItem, DropdownCheckboxItem, DropdownLabel, DropdownSeparator } from "../ui/Dropdown.jsx"
import { useEditorState } from "./useEditorState.js"
import {
  undo,
  redo,
  toggleBold,
  toggleItalic,
  toggleUnderline,
  setBlockStyle,
  setAlign,
  toggleList,
  insertHorizontalRule,
  clearFormatting,
  isMarkActive,
  blockStyle,
  blockAlign,
  listType,
} from "./commands.js"
import { schema } from "./schema.js"
import { selectAll } from "prosemirror-commands"

// Radix triggers use asChild, so this must forward its ref and props.
const MenuTrigger = forwardRef(function MenuTrigger(props, ref) {
  return <button ref={ref} className="menubar-item" {...props} />
})

// Only commands that exist; menus are added when they have real commands.
export function MenuBar({ editor, onNewDocument, onShare, onRename, onTrash, onShortcuts, onInsertLink, reviewOpen, onToggleReview, onAppearance }) {
  const state = useEditorState(editor)
  const run = command => editor?.run(command)
  const can = command => Boolean(state && command(state))
  const style = state ? blockStyle(state) : null
  const align = state ? blockAlign(state) : null
  const list = state ? listType(state) : null
  const mark = type => Boolean(state && isMarkActive(state, type))

  return (
    <nav className="menubar" aria-label="Menu bar">
      <Dropdown label="File" trigger={<MenuTrigger>File</MenuTrigger>}>
        <DropdownItem icon={<MdAdd />} onSelect={onNewDocument}>New document</DropdownItem>
        <DropdownItem icon={<MdOutlinePersonAddAlt />} onSelect={onShare}>Share</DropdownItem>
        <DropdownItem icon={<MdDriveFileRenameOutline />} onSelect={onRename}>Rename</DropdownItem>
        <DropdownSeparator />
        <DropdownItem icon={<MdDeleteOutline />} variant="danger" onSelect={onTrash}>Move to trash</DropdownItem>
      </Dropdown>

      <Dropdown label="Edit" trigger={<MenuTrigger>Edit</MenuTrigger>}>
        <DropdownItem icon={<MdUndo />} shortcut="Ctrl+Z" disabled={!can(undo)} onSelect={() => run(undo)}>Undo</DropdownItem>
        <DropdownItem icon={<MdRedo />} shortcut="Ctrl+Y" disabled={!can(redo)} onSelect={() => run(redo)}>Redo</DropdownItem>
        <DropdownSeparator />
        <DropdownItem icon={<MdSelectAll />} shortcut="Ctrl+A" onSelect={() => run(selectAll)}>Select all</DropdownItem>
      </Dropdown>

      <Dropdown label="View" trigger={<MenuTrigger>View</MenuTrigger>}>
        <DropdownCheckboxItem checked={reviewOpen} onCheckedChange={onToggleReview}>Review panel</DropdownCheckboxItem>
        <DropdownItem icon={<MdOutlineLightMode />} onSelect={onAppearance}>Appearance</DropdownItem>
      </Dropdown>

      <Dropdown label="Insert" trigger={<MenuTrigger>Insert</MenuTrigger>}>
        <DropdownItem icon={<MdLink />} shortcut="Ctrl+K" onSelect={onInsertLink}>Link</DropdownItem>
        <DropdownItem icon={<MdHorizontalRule />} onSelect={() => run(insertHorizontalRule)}>Horizontal line</DropdownItem>
      </Dropdown>

      <Dropdown label="Format" trigger={<MenuTrigger>Format</MenuTrigger>}>
        <DropdownLabel>Text</DropdownLabel>
        <DropdownCheckboxItem checked={mark(schema.marks.strong)} shortcut="Ctrl+B" onCheckedChange={() => run(toggleBold)}>Bold</DropdownCheckboxItem>
        <DropdownCheckboxItem checked={mark(schema.marks.em)} shortcut="Ctrl+I" onCheckedChange={() => run(toggleItalic)}>Italic</DropdownCheckboxItem>
        <DropdownCheckboxItem checked={mark(schema.marks.underline)} shortcut="Ctrl+U" onCheckedChange={() => run(toggleUnderline)}>Underline</DropdownCheckboxItem>
        <DropdownSeparator />
        <DropdownLabel>Paragraph style</DropdownLabel>
        {[["paragraph", "Normal text", "Ctrl+Alt+0"], ["h1", "Heading 1", "Ctrl+Alt+1"], ["h2", "Heading 2", "Ctrl+Alt+2"], ["h3", "Heading 3", "Ctrl+Alt+3"]].map(([value, label, keys]) => (
          <DropdownCheckboxItem key={value} checked={style === value} shortcut={keys} onCheckedChange={() => run(setBlockStyle(value))}>{label}</DropdownCheckboxItem>
        ))}
        <DropdownSeparator />
        <DropdownLabel>Align and lists</DropdownLabel>
        {[["left", "Left"], ["center", "Center"], ["right", "Right"]].map(([value, label]) => (
          <DropdownCheckboxItem key={value} checked={align === value} onCheckedChange={() => run(setAlign(value))}>Align {label.toLowerCase()}</DropdownCheckboxItem>
        ))}
        <DropdownCheckboxItem checked={list === "bullet"} onCheckedChange={() => run(toggleList("bullet"))}>Bulleted list</DropdownCheckboxItem>
        <DropdownCheckboxItem checked={list === "ordered"} onCheckedChange={() => run(toggleList("ordered"))}>Numbered list</DropdownCheckboxItem>
        <DropdownSeparator />
        <DropdownItem icon={<MdFormatClear />} shortcut="Ctrl+\" onSelect={() => run(clearFormatting)}>Clear formatting</DropdownItem>
      </Dropdown>

      <Dropdown label="Help" trigger={<MenuTrigger>Help</MenuTrigger>}>
        <DropdownItem icon={<MdOutlineKeyboard />} onSelect={onShortcuts}>Keyboard shortcuts</DropdownItem>
      </Dropdown>
    </nav>
  )
}
