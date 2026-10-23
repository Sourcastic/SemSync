// Builds the ProseMirror EditorView for an Automerge DocHandle.
// Ownership: Automerge doc → @automerge/prosemirror sync plugin → EditorState/EditorView.
// React never holds document content; it subscribes to editor state changes for UI only.
import { EditorState, Plugin } from "prosemirror-state"
import { EditorView, Decoration, DecorationSet } from "prosemirror-view"
import { keymap } from "prosemirror-keymap"
import { history } from "prosemirror-history"
import { pmDocFromSpans, syncPlugin } from "@automerge/prosemirror"
import * as A from "@automerge/automerge"
import { schemaAdapter, schema } from "./schema.js"
import { editorKeymap } from "./commands.js"
import { presencePlugin } from "../collaboration/presence.js"
import { semanticPlugin } from "../semantic/semanticPlugin.js"

export const TEXT_PATH = ["text"]

// Remote edits arrive through the sync plugin's change listener. We mark the transactions
// it dispatches as non-history so Undo only ever reverts the local user's own edits.
function trackRemoteDispatch(handle) {
  const state = { remote: false }
  const wrapped = new Map()
  // A plain delegate (the binding only needs doc/change/on/off). Inheriting from the handle
  // would break DocHandle's private fields.
  const proxy = {
    doc: () => handle.doc(),
    change: fn => handle.change(fn),
    on(event, callback) {
      const wrapper = payload => {
        state.remote = true
        try {
          callback(payload)
        } finally {
          state.remote = false
        }
      }
      wrapped.set(callback, wrapper)
      handle.on(event, wrapper)
    },
    off(event, callback) {
      handle.off(event, wrapped.get(callback) ?? callback)
      wrapped.delete(callback)
    },
  }
  return { proxy, isRemote: () => state.remote }
}

const placeholderPlugin = new Plugin({
  props: {
    decorations(state) {
      const { doc } = state
      if (doc.childCount !== 1 || doc.firstChild.content.size !== 0) return null
      return DecorationSet.create(doc, [Decoration.node(0, doc.firstChild.nodeSize, { class: "is-empty", "data-placeholder": "Start writing" })])
    },
  },
})

export function createEditor(mount, handle, { onRequestLink } = {}) {
  const { proxy, isRemote } = trackRemoteDispatch(handle)
  const listeners = new Set()

  const doc = pmDocFromSpans(schemaAdapter, A.spans(handle.doc(), TEXT_PATH))
  const state = EditorState.create({
    schema,
    doc,
    plugins: [
      history(),
      keymap(editorKeymap({ onRequestLink: () => onRequestLink?.() })),
      syncPlugin({ adapter: schemaAdapter, handle: proxy, path: TEXT_PATH }),
      placeholderPlugin,
      presencePlugin,
      semanticPlugin,
    ],
  })

  const view = new EditorView(mount, {
    state,
    attributes: { class: "doc-content", spellcheck: "true", "aria-label": "Document" },
    dispatchTransaction(tr) {
      if (isRemote()) tr.setMeta("addToHistory", false)
      view.updateState(view.state.apply(tr))
      listeners.forEach(listener => listener())
    },
  })

  return {
    view,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    run(command) {
      command(view.state, view.dispatch, view)
      view.focus()
    },
    destroy() {
      listeners.clear()
      view.destroy()
    },
  }
}
