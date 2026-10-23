// Theme preference: "light" | "dark" | "system". Persisted locally; applied as data-theme on <html>.

const STORAGE_KEY = "semsync-theme"
const media = window.matchMedia("(prefers-color-scheme: dark)")

export function getThemePreference() {
  try {
    return localStorage.getItem(STORAGE_KEY) || "system"
  } catch {
    return "system"
  }
}

function resolve(preference) {
  if (preference === "system") return media.matches ? "dark" : "light"
  return preference
}

export function applyTheme(preference) {
  document.documentElement.dataset.theme = resolve(preference)
}

export function setThemePreference(preference) {
  try {
    localStorage.setItem(STORAGE_KEY, preference)
  } catch {}
  applyTheme(preference)
}

// Keeps "system" in sync with the OS. Returns a cleanup function.
export function watchSystemTheme() {
  const onChange = () => {
    if (getThemePreference() === "system") applyTheme("system")
  }
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}
