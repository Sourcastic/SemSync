// client.js — SemSync Layer 1: CRDT Replication (browser peer)
//
// Maps onto the diagram like this:
//   - Yjs/Automerge engine        -> Repo + DocHandle below
//   - Vector clock management     -> built into Automerge; every change
//                                    already knows its causal parents, so
//                                    there's nothing extra to write
//   - WebRTC/WebSocket broadcast  -> BrowserWebSocketClientAdapter below

import { Repo } from "@automerge/automerge-repo"
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket"
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb"
import { updateText } from "@automerge/automerge/next"

const SYNC_SERVER_URL = "ws://localhost:3030"

const repo = new Repo({
  network: [new BrowserWebSocketClientAdapter(SYNC_SERVER_URL)],
  storage: new IndexedDBStorageAdapter(),
})

const statusEl = document.getElementById("status")
const editor = document.getElementById("editor")
const docIdEl = document.getElementById("docId")

repo.networkSubsystem.on("peer", () => {
  statusEl.textContent = "connected to sync server"
  statusEl.className = "connected"
})
repo.networkSubsystem.on("peer-disconnected", () => {
  statusEl.textContent = "disconnected — retrying…"
  statusEl.className = "disconnected"
})

// Either open the doc named in the URL, or create a fresh one and put its
// id in the URL so a second tab/browser can join the same document.
const hashDocUrl = new URLSearchParams(location.hash.slice(1)).get("doc")

const handle = hashDocUrl
  ? repo.find(hashDocUrl)
  : repo.create({ text: "" })

if (!hashDocUrl) {
  location.hash = `doc=${handle.url}`
}

await handle.whenReady()
docIdEl.textContent = `Document: ${handle.url}`

// --- local edits: textarea -> CRDT ---------------------------------
let applyingRemoteChange = false

editor.addEventListener("input", () => {
  if (applyingRemoteChange) return
  handle.change(doc => {
    // updateText() diffs the old CRDT text against the new plain string
    // and applies the minimal set of character-level insertions/deletions
    // as a proper CRDT splice, instead of replacing the whole field
    // (which would just be last-write-wins).
    updateText(doc, ["text"], editor.value)
  })
})

// --- remote edits: CRDT -> textarea ---------------------------------
handle.on("change", ({ doc, patchInfo }) => {
  // Avoid clobbering the caret position on the tab that just typed —
  // Layer 2 will handle this more carefully with real cursor tracking;
  // for this Layer 1 demo we just skip re-rendering our own change.
  if (patchInfo.source === "change") return
  applyingRemoteChange = true
  const pos = editor.selectionStart
  editor.value = doc.text
  editor.setSelectionRange(pos, pos)
  applyingRemoteChange = false
})

// Set initial textarea contents once the doc has loaded.
const initialDoc = await handle.doc()
editor.value = initialDoc.text
