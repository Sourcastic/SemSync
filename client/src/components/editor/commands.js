// Editor commands and selection queries. The editor state is authoritative:
// the toolbar and menus derive their pressed/disabled state from these queries.
import { toggleMark, setBlockType, baseKeymap, chainCommands } from "prosemirror-commands"
import { wrapInList, liftListItem, sinkListItem, splitListItem } from "prosemirror-schema-list"
import { undo, redo } from "prosemirror-history"
import { schema } from "./schema.js"

const { strong, em, underline, link } = schema.marks
const { paragraph, heading, bullet_list, ordered_list, list_item, horizontal_rule } = schema.nodes

// ---------- Queries ----------
export function isMarkActive(state, type) {
  const { from, $from, to, empty } = state.selection
  if (empty) return Boolean(type.isInSet(state.storedMarks || $from.marks()))
  return state.doc.rangeHasMark(from, to, type)
}

// "paragraph" | "h1" | "h2" | "h3" | "mixed"
export function blockStyle(state) {
  const { $from, $to } = state.selection
  const node = $from.parent
  if (!$from.sameParent($to)) return "mixed"
  if (node.type === heading) return `h${node.attrs.level}`
  if (node.type === paragraph) return "paragraph"
  return "mixed"
}

export function blockAlign(state) {
  return state.selection.$from.parent.attrs.align ?? "left"
}

export function listType(state) {
  const { $from } = state.selection
  for (let depth = $from.depth; depth > 0; depth--) {
    const type = $from.node(depth).type
    if (type === bullet_list) return "bullet"
    if (type === ordered_list) return "ordered"
  }
  return null
}

export function linkAt(state) {
  const { $from, $to } = state.selection
  const mark = link.isInSet($from.marks()) || link.isInSet($to.marks())
  return mark ? mark.attrs.href : null
}

// ---------- Commands ----------
export const toggleBold = toggleMark(strong)
export const toggleItalic = toggleMark(em)
export const toggleUnderline = toggleMark(underline)
export { undo, redo }

export function setBlockStyle(style) {
  if (style === "paragraph") return setBlockType(paragraph)
  return setBlockType(heading, { level: Number(style.slice(1)) })
}

export function setAlign(align) {
  return (state, dispatch) => {
    const { from, to } = state.selection
    const tr = state.tr
    let changed = false
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.type === paragraph || node.type === heading) {
        tr.setNodeMarkup(pos, null, { ...node.attrs, align: align === "left" ? null : align })
        changed = true
        return false
      }
    })
    if (changed && dispatch) dispatch(tr)
    return changed
  }
}

// Toggle a list: lift out if already in this list type, otherwise wrap.
export function toggleList(kind) {
  const type = kind === "bullet" ? bullet_list : ordered_list
  return (state, dispatch) => {
    if (listType(state) === kind) return liftListItem(list_item)(state, dispatch)
    return wrapInList(type)(state, dispatch)
  }
}

export function setLink(href) {
  return (state, dispatch) => {
    const { from, to, empty } = state.selection
    if (!dispatch) return true
    let tr = state.tr
    if (empty) {
      // No selection: insert the URL itself as linked text.
      tr = tr.insertText(href, from).addMark(from, from + href.length, link.create({ href }))
    } else {
      tr = tr.removeMark(from, to, link).addMark(from, to, link.create({ href }))
    }
    dispatch(tr.scrollIntoView())
    return true
  }
}

export function removeLink(state, dispatch) {
  const { $from, from, to, empty } = state.selection
  if (!dispatch) return true
  if (!empty) {
    dispatch(state.tr.removeMark(from, to, link))
    return true
  }
  // Collapsed cursor: remove the whole contiguous link around it.
  const parent = $from.parent
  const offset = $from.parentOffset
  let found = null
  parent.forEach((child, childOffset) => {
    const end = childOffset + child.nodeSize
    if (!found && link.isInSet(child.marks) && childOffset <= offset && offset <= end) found = [childOffset, end]
  })
  if (!found) return false
  const base = $from.start()
  dispatch(state.tr.removeMark(base + found[0], base + found[1], link))
  return true
}

export function insertHorizontalRule(state, dispatch) {
  if (dispatch) dispatch(state.tr.replaceSelectionWith(horizontal_rule.create()).scrollIntoView())
  return true
}

export function clearFormatting(state, dispatch) {
  const { from, to } = state.selection
  if (dispatch) {
    let tr = state.tr
    for (const type of [strong, em, underline, link]) tr = tr.removeMark(from, to, type)
    dispatch(tr)
  }
  return true
}

// ---------- Keymap ----------
export function editorKeymap({ onRequestLink }) {
  return {
    ...baseKeymap,
    Enter: chainCommands(splitListItem(list_item), baseKeymap.Enter),
    Tab: sinkListItem(list_item),
    "Shift-Tab": liftListItem(list_item),
    "Mod-b": toggleBold,
    "Mod-i": toggleItalic,
    "Mod-u": toggleUnderline,
    "Mod-z": undo,
    "Mod-y": redo,
    "Mod-Shift-z": redo,
    "Mod-k": () => {
      onRequestLink?.()
      return true
    },
    "Mod-Alt-0": setBlockStyle("paragraph"),
    "Mod-Alt-1": setBlockStyle("h1"),
    "Mod-Alt-2": setBlockStyle("h2"),
    "Mod-Alt-3": setBlockStyle("h3"),
    "Mod-\\": clearFormatting,
  }
}
