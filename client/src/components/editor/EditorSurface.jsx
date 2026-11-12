import { useEffect, useRef } from "react"
import { createEditor } from "./createEditor.js"

// Mounts ProseMirror into a stable node once per document handle. React never renders
// inside the contenteditable; parents receive the editor through onReady.
export function EditorSurface({ handle, onReady, onRequestLink, author }) {
  const mountRef = useRef(null)
  const linkRef = useRef(onRequestLink)
  linkRef.current = onRequestLink

  useEffect(() => {
    const editor = createEditor(mountRef.current, handle, { onRequestLink: () => linkRef.current?.(), author })
    onReady(editor)
    return () => {
      onReady(null)
      editor.destroy()
    }
    // onReady is a state setter (stable); only a new handle rebuilds the editor.
  }, [handle, author])

  return <div ref={mountRef} />
}
