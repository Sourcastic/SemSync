// Demo identity. Each tab is whoever signed in there (an account or a guest). A tab can also
// act as one of the demo collaborators with ?as=atika or ?as=ibrahim in the URL, e.g.
//   http://localhost:5173/?as=atika#/doc/market-demand
// This is the only place that reads the override.
import { COLLABORATORS } from "../lib/collaborators.js"
import { userFromSession } from "../lib/session.js"

export const DEMO_MODE = true

export function presenceIdentity(session) {
  const override = new URLSearchParams(location.search).get("as")
  if (DEMO_MODE && COLLABORATORS[override]) return COLLABORATORS[override]
  return userFromSession(session)
}
