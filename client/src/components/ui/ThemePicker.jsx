import { useState } from "react"
import { getThemePreference, setThemePreference } from "../../lib/theme.js"

const OPTIONS = [
  ["light", "Light", null],
  ["dark", "Dark", null],
  ["system", "System", "Matches your device"],
]

// Radio group of choice tiles. Each preview renders real tokens under its own data-theme,
// so what you see is exactly what the app will look like.
export function ThemePicker({ name = "theme" }) {
  const [value, setValue] = useState(getThemePreference)

  function choose(next) {
    setValue(next)
    setThemePreference(next)
  }

  return (
    <fieldset className="choice-group">
      <legend className="visually-hidden">Appearance</legend>
      {OPTIONS.map(([option, label, hint]) => (
        <label className="choice" key={option}>
          <input type="radio" name={name} value={option} checked={value === option} onChange={() => choose(option)} className="visually-hidden" />
          {option === "system" ? (
            <span className="theme-preview-split" aria-hidden="true">
              <ThemePreview theme="light" />
              <ThemePreview theme="dark" />
            </span>
          ) : (
            <ThemePreview theme={option} />
          )}
          <span className="choice-label">
            {label}
            {hint && <span className="choice-hint">{hint}</span>}
          </span>
        </label>
      ))}
    </fieldset>
  )
}

function ThemePreview({ theme }) {
  return (
    <span className="theme-preview" data-theme={theme} aria-hidden="true">
      <span className="theme-preview-toolbar" />
      <span className="theme-preview-page">
        <span className="theme-preview-line" data-width="title" />
        <span className="theme-preview-line" />
        <span className="theme-preview-line" data-kind="conflict" />
        <span className="theme-preview-line" data-width="short" />
      </span>
    </span>
  )
}
