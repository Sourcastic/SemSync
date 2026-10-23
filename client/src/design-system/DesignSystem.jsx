import { useEffect, useState } from "react"
import {
  MdOutlineDarkMode,
  MdOutlineDesktopWindows,
  MdOutlineLightMode,
} from "react-icons/md"
import { getThemePreference, setThemePreference, watchSystemTheme } from "../lib/theme.js"
import { Foundations } from "./Foundations.jsx"
import { Controls } from "./Controls.jsx"
import { Product } from "./Product.jsx"
import { Live } from "./Live.jsx"
import { TooltipProvider } from "../components/ui/Tooltip.jsx"

const NAV = [
  ["Foundations", [["color", "Color"], ["typography", "Typography"], ["spacing", "Spacing & elevation"]]],
  ["Components", [["buttons", "Buttons"], ["inputs", "Inputs"], ["menus", "Menus & popovers"], ["tabs", "Tabs & status"], ["dialogs", "Dialogs"], ["feedback", "Empty, loading, toast"], ["live", "Live components"]]],
  ["Product", [["sidebar", "Sidebar"], ["documents", "Documents"], ["editor", "Editor chrome"], ["presence", "Presence"], ["semantic", "Semantic review"], ["themes", "Light & dark"]]],
]

const THEMES = [
  ["light", "Light", MdOutlineLightMode],
  ["dark", "Dark", MdOutlineDarkMode],
  ["system", "System", MdOutlineDesktopWindows],
]

export function DesignSystem() {
  const [theme, setTheme] = useState(getThemePreference)

  useEffect(() => watchSystemTheme(), [])

  function chooseTheme(next) {
    setTheme(next)
    setThemePreference(next)
  }

  return (
    <TooltipProvider>
    <div className="ds">
      <nav className="ds-nav" aria-label="Design system sections">
        <div className="brand">SemSync</div>
        {NAV.map(([group, items]) => (
          <div key={group}>
            <div className="sidebar-section-label">{group}</div>
            <div className="sidebar-nav">
              {items.map(([id, label]) => (
                <a key={id} className="sidebar-item" href={`#${id}`}>{label}</a>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <main className="ds-main">
        <header className="ds-header">
          <div>
            <h1>Design system</h1>
            <p>
              The visual source of truth for SemSync. Every specimen on this page renders the same
              classes and tokens the app uses. Add or change a control here first.
            </p>
          </div>
          <div className="segmented" role="group" aria-label="Theme">
            {THEMES.map(([value, label, Icon]) => (
              <button key={value} aria-pressed={theme === value} onClick={() => chooseTheme(value)}>
                <Icon />{label}
              </button>
            ))}
          </div>
        </header>
        <Foundations />
        <Controls />
        <Live />
        <Product />
      </main>
    </div>
    </TooltipProvider>
  )
}
