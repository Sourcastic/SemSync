import { useEffect } from "react"
import { useRoute, navigate } from "./lib/router.js"
import { getSession, isOnboarded } from "./lib/session.js"
import { watchSystemTheme } from "./lib/theme.js"
import { createDocument } from "./lib/documents.js"
import { AuthScreen } from "./features/auth/AuthScreen.jsx"
import { Onboarding } from "./features/onboarding/Onboarding.jsx"
import { Workspace } from "./features/workspace/Workspace.jsx"
import { EditorScreen } from "./features/editor/EditorScreen.jsx"

const RETURN_KEY = "semsync-return-to"

export function App() {
  const path = useRoute()
  const session = getSession()
  const onboarded = isOnboarded()
  const signedIn = Boolean(session)

  useEffect(() => watchSystemTheme(), [])

  // Signed out → auth only. Signed in → onboarding once, then never auth or onboarding again.
  useEffect(() => {
    if (!signedIn) {
      if (path !== "/login") {
        // Remember where they were going (e.g. a share link) and return there after signing in.
        if (path !== "/") sessionStorage.setItem(RETURN_KEY, path)
        navigate("/login", { replace: true })
      }
    } else if (!onboarded) {
      if (path !== "/onboarding") navigate("/onboarding", { replace: true })
    } else if (sessionStorage.getItem(RETURN_KEY)) {
      const target = sessionStorage.getItem(RETURN_KEY)
      sessionStorage.removeItem(RETURN_KEY)
      navigate(target, { replace: true })
    } else if (path === "/login" || path === "/onboarding") {
      navigate("/", { replace: true })
    } else if (path === "/doc/new") {
      navigate(`/doc/${createDocument(session.userId).id}`, { replace: true })
    }
  }, [signedIn, onboarded, path])

  if (!session || path === "/login") return <AuthScreen />
  if (!onboarded || path === "/onboarding") return <Onboarding />
  if (path.startsWith("/doc/") && path !== "/doc/new") {
    // Share links look like /doc/<id>?am=<automerge url>&t=<title>&o=<owner>
    const [route, query = ""] = path.split("?")
    const params = new URLSearchParams(query)
    const shared = params.get("am") ? { automergeUrl: params.get("am"), title: params.get("t"), ownerId: params.get("o") } : null
    return <EditorScreen id={route.slice("/doc/".length)} shared={shared} session={session} />
  }
  return <Workspace path={path} session={session} />
}
