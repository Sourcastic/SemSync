// Minimal hash router: a handful of screens doesn't justify a routing library.
import { useEffect, useState } from "react"

function currentPath() {
  return location.hash.replace(/^#/, "") || "/"
}

export function navigate(path, { replace = false } = {}) {
  if (replace) history.replaceState(null, "", `#${path}`)
  else location.hash = path
  if (replace) window.dispatchEvent(new HashChangeEvent("hashchange"))
}

export function useRoute() {
  const [path, setPath] = useState(currentPath)
  useEffect(() => {
    const onChange = () => setPath(currentPath())
    window.addEventListener("hashchange", onChange)
    return () => window.removeEventListener("hashchange", onChange)
  }, [])
  return path
}
