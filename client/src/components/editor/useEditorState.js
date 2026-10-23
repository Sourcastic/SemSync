import { useSyncExternalStore } from "react"

const noopSubscribe = () => () => {}

// Re-renders the caller on each editor transaction. EditorState objects are immutable,
// so the snapshot is stable between transactions. Use only in small UI (toolbar, menus).
export function useEditorState(editor) {
  return useSyncExternalStore(editor ? editor.subscribe : noopSubscribe, () => editor?.view.state ?? null)
}
