// client/src/editor/proseMirrorView.js
// Basic ProseMirror view integrated with Automerge and sample Layer 4 conflict decorations

import { EditorState, Plugin } from "prosemirror-state"
import { EditorView, Decoration, DecorationSet } from "prosemirror-view"
import { keymap } from "prosemirror-keymap"
import { baseKeymap, toggleMark } from "prosemirror-commands"
import { init } from "@automerge/prosemirror"

/**
 * Initializes a ProseMirror editor instance bound to an Automerge DocHandle.
 * @param {import("@automerge/automerge-repo").DocHandle} handle - The Automerge document handle
 * @param {HTMLElement} containerEl - DOM container to attach the editor view
 */
export function setupProseMirror(handle, containerEl) {
  // Compatibility adapter: @automerge/prosemirror expects a synchronous .doc() method
  const compatHandle = Object.create(handle)
  compatHandle.doc = () => handle.docSync()

  // Initialize Automerge ProseMirror plugin on field ["text"]
  const { schema, pmDoc, plugin: automergePlugin } = init(compatHandle, ["text"])

  // Plugin to hold dynamic conflict decorations (Layer 4 preview)
  let activeDecorations = DecorationSet.empty

  const conflictPlugin = new Plugin({
    props: {
      decorations(state) {
        return activeDecorations.map(state.tr.mapping, state.doc)
      },
    },
  })

  // Assemble plugins
  const plugins = [
    keymap({
      ...baseKeymap,
      "Mod-b": toggleMark(schema.marks.strong || schema.marks.bold),
      "Mod-i": toggleMark(schema.marks.em || schema.marks.italic),
    }),
    automergePlugin,
    conflictPlugin,
  ]

  const state = EditorState.create({
    schema,
    doc: pmDoc,
    plugins,
  })

  const view = new EditorView(containerEl, {
    state,
  })

  /**
   * Demo function: Injects sample inline conflict decorations without modifying CRDT document
   * @param {number} from - Start character index
   * @param {number} to - End character index
   * @param {string} label - Conflict warning label
   */
  function highlightConflictSpan(from = 1, to = null, label = "Contradiction (0.94)") {
    const docSize = view.state.doc.content.size
    const safeFrom = Math.max(1, Math.min(from, docSize - 1))
    const safeTo = to ? Math.min(to, docSize) : Math.min(safeFrom + 12, docSize)

    if (safeFrom >= safeTo) return

    const inlineHighlight = Decoration.inline(safeFrom, safeTo, {
      class: "conflict-highlight",
      title: "SemSync: Detected concurrent contradiction",
    })

    const badgeWidget = Decoration.widget(safeTo, () => {
      const pill = document.createElement("span")
      pill.className = "conflict-pill"
      pill.textContent = label
      pill.title = "Click to preview resolution options"
      pill.onclick = () => {
        alert("SemSync Layer 4 Resolution Preview:\nUser A: skyrocketing\nUser B: plummeting\n\nSuggestion: fluctuating significantly")
      }
      return pill
    })

    activeDecorations = DecorationSet.create(view.state.doc, [inlineHighlight, badgeWidget])
    view.dispatch(view.state.tr)
  }

  function clearConflictHighlights() {
    activeDecorations = DecorationSet.empty
    view.dispatch(view.state.tr)
  }

  return {
    view,
    highlightConflictSpan,
    clearConflictHighlights,
  }
}
