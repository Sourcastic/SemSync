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

const adapter = new BrowserWebSocketClientAdapter(SYNC_SERVER_URL)

// --- Offline simulation buffer ---------------------------------------
let isOffline = false
let outgoingQueue = []
let incomingQueue = []

const originalSend = adapter.send.bind(adapter)
adapter.send = msg => {
  if (isOffline) {
    outgoingQueue.push(msg)
    updateOfflineStatus()
  } else {
    originalSend(msg)
  }
}

const originalReceive = adapter.receiveMessage.bind(adapter)
adapter.receiveMessage = payload => {
  if (isOffline) {
    incomingQueue.push(payload)
    updateOfflineStatus()
  } else {
    originalReceive(payload)
  }
}

const repo = new Repo({
  network: [adapter],
  storage: new IndexedDBStorageAdapter(),
})

const statusEl = document.getElementById("status")
const editor = document.getElementById("editor")
const docIdEl = document.getElementById("docId")
const offlineBtn = document.getElementById("offlineBtn")

function updateOfflineStatus() {
  if (isOffline) {
    statusEl.textContent = `Offline (${outgoingQueue.length} changes buffered)`
    statusEl.className = "paused"
    offlineBtn.textContent = `Resume Sync (${outgoingQueue.length + incomingQueue.length})`
    offlineBtn.className = "btn btn-active"
  } else {
    statusEl.textContent = "Connected"
    statusEl.className = "connected"
    offlineBtn.textContent = "Pause Sync"
    offlineBtn.className = "btn"
  }
}

if (offlineBtn) {
  offlineBtn.addEventListener("click", () => {
    isOffline = !isOffline
    if (!isOffline) {
      const inMsgs = [...incomingQueue]
      const outMsgs = [...outgoingQueue]
      incomingQueue = []
      outgoingQueue = []
      inMsgs.forEach(payload => originalReceive(payload))
      outMsgs.forEach(msg => originalSend(msg))
    }
    updateOfflineStatus()
  })
}

repo.networkSubsystem.on("peer", () => {
  if (!isOffline) {
    statusEl.textContent = "Connected"
    statusEl.className = "connected"
  }
})
repo.networkSubsystem.on("peer-disconnected", () => {
  if (!isOffline) {
    statusEl.textContent = "Disconnected — Retrying..."
    statusEl.className = "disconnected"
  }
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
handle.on("change", ({ doc }) => {
  if (!doc) return
  // If this tab already has the matching text (e.g. the local user just typed it),
  // skip re-rendering to avoid clobbering the caret position.
  if (editor.value === doc.text) return

  applyingRemoteChange = true
  const pos = editor.selectionStart
  editor.value = doc.text ?? ""
  try {
    editor.setSelectionRange(pos, pos)
  } catch {}
  applyingRemoteChange = false
})

// Set initial textarea contents once the doc has loaded.
const initialDoc = await handle.doc()
editor.value = initialDoc.text ?? ""

// Copy link button helper
const copyBtn = document.getElementById("copyBtn")
if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(location.href)
      copyBtn.textContent = "Copied"
      setTimeout(() => { copyBtn.textContent = "Copy Document Link" }, 2000)
    } catch {
      prompt("Copy this link:", location.href)
    }
  })
}

// Preset examples from proposal
document.getElementById("presetDemand")?.addEventListener("click", () => {
  const sentence = "The current financial indicators show that market demand is stable and level."
  editor.value = sentence
  handle.change(doc => updateText(doc, ["text"], sentence))
})

document.getElementById("presetFox")?.addEventListener("click", () => {
  const sentence = "The brown fox."
  editor.value = sentence
  handle.change(doc => updateText(doc, ["text"], sentence))
})


