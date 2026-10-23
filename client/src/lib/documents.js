// Workspace document index: titles, owners, folders, stars, timestamps.
// Document *content* lives in Automerge (Phase 8); this is only the metadata the home page lists.
// Persisted locally for the demo and exposed to React through useSyncExternalStore.
import { useSyncExternalStore } from "react"

const KEY = "semsync-documents-v7"
const HOUR = 3600e3
const DAY = 24 * HOUR

function seed() {
  const now = Date.now()
  const doc = (id, title, ownerId, folder, ago, extra = {}) => ({
    id,
    title,
    ownerId,
    folder,
    starred: false,
    trashed: false,
    createdAt: now - ago.created,
    modifiedAt: now - ago.modified,
    openedAt: now - ago.opened,
    excerpt: "",
    ...extra,
  })
  // Two demo documents, one per README example. Each has a grammar mistake and a sentence the
  // concurrent-edit scenarios rewrite (see src/demo/scenarios.js).
  return [
    doc("market-demand", "Market Demand Analysis", "eshaal", "FYP", { created: 6 * DAY, modified: 2 * HOUR, opened: HOUR }, {
      starred: true,
      excerpt: "The current financial indicators show that market demand is stable and level.",
    }),
    doc("brown-fox", "The Quick Brown Fox", "atika", "FYP", { created: 4 * DAY, modified: DAY, opened: 3 * HOUR }, {
      excerpt: "Specimen text for the new reading font. The design team reviews every weight against the same sample sentence.",
    }),
  ]
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return seed()
}

let documents = load()
const listeners = new Set()

function commit(next) {
  documents = next
  try {
    localStorage.setItem(KEY, JSON.stringify(documents))
  } catch {}
  listeners.forEach(listener => listener())
}

// Other tabs write the same index; pick up their changes so every tab opens the same documents.
export function reloadDocuments() {
  documents = load()
  listeners.forEach(listener => listener())
}

const onStorage = event => event.key === KEY && reloadDocuments()

function subscribe(listener) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage)
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener("storage", onStorage)
  }
}

export function useDocuments() {
  return useSyncExternalStore(subscribe, () => documents)
}

export function getDocument(id) {
  return documents.find(doc => doc.id === id)
}

export function updateDocument(id, patch) {
  commit(documents.map(doc => (doc.id === id ? { ...doc, ...patch } : doc)))
}

export function createDocument(ownerId) {
  const now = Date.now()
  const doc = {
    id: crypto.randomUUID().slice(0, 8),
    title: "Untitled document",
    ownerId,
    folder: null,
    starred: false,
    trashed: false,
    createdAt: now,
    modifiedAt: now,
    openedAt: now,
    excerpt: "",
  }
  commit([doc, ...documents])
  return doc
}

export function folderNames(docs) {
  return [...new Set(docs.filter(doc => doc.folder && !doc.trashed).map(doc => doc.folder))].sort()
}

export const SORT_OPTIONS = [
  { value: "openedAt", label: "Last opened" },
  { value: "modifiedAt", label: "Last modified" },
  { value: "title", label: "Name" },
  { value: "createdAt", label: "Created date" },
]

export function sortDocuments(docs, key) {
  const sorted = [...docs]
  if (key === "title") return sorted.sort((a, b) => a.title.localeCompare(b.title))
  return sorted.sort((a, b) => b[key] - a[key])
}

// A link anyone can open, including another browser: it carries the Automerge document address
// plus the title and owner, since a fresh browser has no local document index.
export function shareLink(doc) {
  const params = new URLSearchParams({ t: doc.title, o: doc.ownerId })
  if (doc.automergeUrl) params.set("am", doc.automergeUrl)
  return `${location.origin}${location.pathname}#/doc/${doc.id}?${params}`
}

// Opening a shared link: remember the document locally (it then appears under Shared with me).
export function adoptSharedDocument(id, { automergeUrl, title, ownerId }) {
  const existing = getDocument(id)
  if (existing) {
    if (automergeUrl && existing.automergeUrl !== automergeUrl) updateDocument(id, { automergeUrl })
    return
  }
  const now = Date.now()
  commit([{ id, title: title || "Shared document", ownerId: ownerId || "unknown", folder: null, starred: false, trashed: false, createdAt: now, modifiedAt: now, openedAt: now, excerpt: "", automergeUrl }, ...documents])
}
