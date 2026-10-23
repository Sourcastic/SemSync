export const SHORTCUTS = [
  ["Bold, italic, underline", "Ctrl+B, Ctrl+I, Ctrl+U"],
  ["Undo, redo", "Ctrl+Z, Ctrl+Y"],
  ["Insert link", "Ctrl+K"],
  ["Normal text, heading 1 to 3", "Ctrl+Alt+0 to 3"],
  ["Indent or outdent list item", "Tab, Shift+Tab"],
  ["Clear formatting", "Ctrl+\\"],
]

export function ShortcutList() {
  return (
    <dl className="settings-list">
      {SHORTCUTS.map(([action, keys]) => (
        <div key={action} className="settings-row">
          <dt>{action}</dt>
          <dd className="kbd">{keys}</dd>
        </div>
      ))}
    </dl>
  )
}
