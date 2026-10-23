import { useEffect } from "react"

// Browser tab title in the form "SemSync | Home".
export function usePageTitle(page) {
  useEffect(() => {
    document.title = page ? `SemSync | ${page}` : "SemSync"
  }, [page])
}
