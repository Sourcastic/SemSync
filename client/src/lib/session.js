// Demo session. There is no auth backend in the FYP demo: any non-empty email and password
// signs in. Replace this module when real auth exists.
import { COLLABORATORS } from "./collaborators.js"

const KEY = "semsync-session"
// Session storage, not local storage: every new browser session starts at the sign-in page,
// which is what the demo needs. (Onboarding completion below stays in local storage.)
const sessionStore = window.sessionStorage

export function getSession() {
  try {
    return JSON.parse(sessionStore.getItem(KEY))
  } catch {
    return null
  }
}

const DEMO_EMAIL = "demo@semsync.app"
const ANIMALS = ["Otter", "Heron", "Lynx", "Panda", "Falcon", "Koala", "Badger", "Fox"]
const EXTRA_COLORS = [1, 2, 3, 4].map(n => `var(--collab-extra-${n})`)

function hash(text) {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) | 0
  return Math.abs(h)
}

const titleCase = text => text.replace(/[._-]+/g, " ").replace(/\b\w/g, ch => ch.toUpperCase()).trim()

// Who this tab is signed in as. The Google button is Eshaal (the demo owner);
// any other email becomes its own person, and guests are anonymous. Each tab keeps its own
// session, so two tabs can be two different people.
export function signIn({ email, name, provider = "password" }) {
  let session
  if (provider === "guest") {
    const id = `guest-${crypto.randomUUID().slice(0, 6)}`
    session = { userId: id, name: `Anonymous ${ANIMALS[hash(id) % ANIMALS.length]}`, email: null, provider }
  } else if (provider !== "password" || !email || email.toLowerCase() === DEMO_EMAIL) {
    session = { userId: COLLABORATORS.eshaal.id, name: COLLABORATORS.eshaal.fullName, email: "eshaal.r@lhr.nu.edu.pk", provider }
  } else {
    const local = email.split("@")[0]
    session = { userId: `user-${hash(email.toLowerCase()).toString(36)}`, name: name || titleCase(local) || email, email, provider }
  }
  try {
    sessionStore.setItem(KEY, JSON.stringify(session))
  } catch {}
  return session
}

// The person behind a session, in the shape avatars and presence use.
export function userFromSession(session) {
  const known = COLLABORATORS[session.userId]
  if (known) return known
  return {
    id: session.userId,
    name: session.name.split(" ")[0] === "Anonymous" ? session.name : session.name.split(" ")[0],
    fullName: session.name,
    color: EXTRA_COLORS[hash(session.userId) % EXTRA_COLORS.length],
  }
}

export function signOut() {
  try {
    sessionStore.removeItem(KEY)
  } catch {}
}

// Kept apart from the session so signing out and back in doesn't replay onboarding.
const ONBOARDED_KEY = "semsync-onboarded"

export function isOnboarded() {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === "true"
  } catch {
    return false
  }
}

export function completeOnboarding() {
  try {
    localStorage.setItem(ONBOARDED_KEY, "true")
  } catch {}
}
