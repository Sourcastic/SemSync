import { useEffect, useState } from "react"
import {
  MdUndo,
  MdRedo,
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdLink,
} from "react-icons/md"
import { IconButton, Button, ButtonRow } from "../ui/Button.jsx"
import { Select } from "../ui/Select.jsx"
import { Popover } from "../ui/Popover.jsx"
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
  setLink,
  removeLink,
  isMarkActive,
  blockStyle,
  blockAlign,
  listType,
  linkAt,
} from "./commands.js"
import { schema } from "./schema.js"

const STYLES = [
  { value: "paragraph", label: "Normal text" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
]

const ALIGN = [
  ["left", "Align left", MdFormatAlignLeft],
  ["center", "Align center", MdFormatAlignCenter],
  ["right", "Align right", MdFormatAlignRight],
]

// Keeps the editor's selection visible while clicking toolbar buttons.
const keepFocus = event => event.preventDefault()

// editor may be null (loading, or the design-system specimen); controls then render inert.
export function Toolbar({ editor, linkOpen, onLinkOpenChange }) {
  const state = useEditorState(editor)
  const run = command => editor?.run(command)
  const can = command => Boolean(state && command(state))
  const active = type => Boolean(state && isMarkActive(state, type))
  const style = state ? blockStyle(state) : "paragraph"
  const align = state ? blockAlign(state) : "left"
  const list = state ? listType(state) : null

  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting">
      <div className="toolbar-group">
        <IconButton size="sm" label="Undo" shortcut="Ctrl+Z" disabled={!can(undo)} onMouseDown={keepFocus} onClick={() => run(undo)}><MdUndo /></IconButton>
        <IconButton size="sm" label="Redo" shortcut="Ctrl+Y" disabled={!can(redo)} onMouseDown={keepFocus} onClick={() => run(redo)}><MdRedo /></IconButton>
      </div>
      <span className="toolbar-separator" />
      <Select
        label="Text style"
        value={style === "mixed" ? "" : style}
        onValueChange={value => run(setBlockStyle(value))}
        onCloseFocus={() => editor?.view.focus()}
        options={STYLES}
        variant="ghost"
        size="sm"
        width={128}
      />
      <span className="toolbar-separator" />
      <div className="toolbar-group">
        <IconButton size="sm" label="Bold" shortcut="Ctrl+B" aria-pressed={active(schema.marks.strong)} onMouseDown={keepFocus} onClick={() => run(toggleBold)}><MdFormatBold /></IconButton>
        <IconButton size="sm" label="Italic" shortcut="Ctrl+I" aria-pressed={active(schema.marks.em)} onMouseDown={keepFocus} onClick={() => run(toggleItalic)}><MdFormatItalic /></IconButton>
        <IconButton size="sm" label="Underline" shortcut="Ctrl+U" aria-pressed={active(schema.marks.underline)} onMouseDown={keepFocus} onClick={() => run(toggleUnderline)}><MdFormatUnderlined /></IconButton>
      </div>
      <span className="toolbar-separator" />
      <div className="toolbar-group">
        {ALIGN.map(([value, label, Icon]) => (
          <IconButton key={value} size="sm" label={label} aria-pressed={align === value} onMouseDown={keepFocus} onClick={() => run(setAlign(value))}><Icon /></IconButton>
        ))}
      </div>
      <span className="toolbar-separator" />
      <div className="toolbar-group">
        <IconButton size="sm" label="Bulleted list" aria-pressed={list === "bullet"} onMouseDown={keepFocus} onClick={() => run(toggleList("bullet"))}><MdFormatListBulleted /></IconButton>
        <IconButton size="sm" label="Numbered list" aria-pressed={list === "ordered"} onMouseDown={keepFocus} onClick={() => run(toggleList("ordered"))}><MdFormatListNumbered /></IconButton>
      </div>
      <span className="toolbar-separator" />
      <LinkControl editor={editor} state={state} open={linkOpen} onOpenChange={onLinkOpenChange} />
    </div>
  )
}

function normalizeUrl(value) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function LinkControl({ editor, state, open, onOpenChange }) {
  const current = state ? linkAt(state) : null
  const [href, setHref] = useState("")

  useEffect(() => {
    if (open) setHref(current ?? "") // prefill only when the popover opens
  }, [open])

  function apply(event) {
    event.preventDefault()
    const url = normalizeUrl(href)
    if (url) editor?.run(setLink(url))
    onOpenChange(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
      label="Insert link"
      trigger={
        <IconButton size="sm" label="Insert link" shortcut="Ctrl+K" aria-pressed={Boolean(current)} onMouseDown={keepFocus}>
          <MdLink />
        </IconButton>
      }
    >
      <form className="dialog-form" onSubmit={apply}>
        <div className="field">
          <label className="field-label" htmlFor="link-input">Link</label>
          <input className="input" id="link-input" autoFocus placeholder="Paste or type a link" value={href} onChange={event => setHref(event.target.value)} />
        </div>
        <div className="dialog-footer">
          <ButtonRow>
            {current ? (
              <Button variant="ghost" size="sm" onClick={() => { editor?.run(removeLink); onOpenChange(false) }}>Remove</Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            )}
            <Button type="submit" variant="primary" size="sm" disabled={!href.trim()}>Apply</Button>
          </ButtonRow>
        </div>
      </form>
    </Popover>
  )
}
