import { createRoot } from "react-dom/client"
import "./styles/index.css"
import { applyTheme, getThemePreference } from "./lib/theme.js"
import { TooltipProvider } from "./components/ui/Tooltip.jsx"
import { ToastProvider } from "./components/ui/Toast.jsx"
import { App } from "./App.jsx"

applyTheme(getThemePreference())
createRoot(document.getElementById("root")).render(
  <TooltipProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
  </TooltipProvider>
)
