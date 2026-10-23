import { createRoot } from "react-dom/client"
import "../styles/index.css"
import "./design-system.css"
import { applyTheme, getThemePreference } from "../lib/theme.js"
import { DesignSystem } from "./DesignSystem.jsx"

applyTheme(getThemePreference())
createRoot(document.getElementById("root")).render(<DesignSystem />)
