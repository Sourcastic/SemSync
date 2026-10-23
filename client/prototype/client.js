// client.js — SemSync: Collaborative Editor (Dual View: Textarea + ProseMirror)

import { Repo } from "@automerge/automerge-repo"
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket"
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb"
import { updateText } from "@automerge/automerge/next"
import { toggleMark } from "prosemirror-commands"
import { setupProseMirror } from "./src/editor/proseMirrorView.js"

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

// --- 1. Textarea View Setup -----------------------------------------
let applyingRemoteChange = false

editor.addEventListener("input", () => {
  if (applyingRemoteChange) return
  handle.change(doc => {
    updateText(doc, ["text"], editor.value)
  })
})

handle.on("change", ({ doc }) => {
  if (!doc) return
  if (editor.value === doc.text) return

  applyingRemoteChange = true
  const pos = editor.selectionStart
  editor.value = doc.text ?? ""
  try {
    editor.setSelectionRange(pos, pos)
  } catch {}
  applyingRemoteChange = false
})

const initialDoc = await handle.doc()
editor.value = initialDoc.text ?? ""

// --- 2. ProseMirror View Setup --------------------------------------
const pmMount = document.getElementById("prosemirrorMount")
const pm = setupProseMirror(handle, pmMount)

// Formatting buttons
document.getElementById("pmBoldBtn")?.addEventListener("click", () => {
  const { state, dispatch } = pm.view
  const markType = state.schema.marks.strong || state.schema.marks.bold
  if (markType) {
    toggleMark(markType)(state, dispatch)
    pm.view.focus()
  }
})

document.getElementById("pmItalicBtn")?.addEventListener("click", () => {
  const { state, dispatch } = pm.view
  const markType = state.schema.marks.em || state.schema.marks.italic
  if (markType) {
    toggleMark(markType)(state, dispatch)
    pm.view.focus()
  }
})

// Layer 4 Demo: Simulate Conflict Highlight
document.getElementById("pmDemoConflictBtn")?.addEventListener("click", () => {
  const currentText = handle.docSync()?.text || ""
  // Highlight around 'skyrocketing' or 'fox' or first words
  const idx = currentText.toLowerCase().indexOf("skyrocketing")
  if (idx !== -1) {
    pm.highlightConflictSpan(idx + 1, idx + 1 + "skyrocketing and plummeting".length, "Contradiction (0.94)")
  } else {
    pm.highlightConflictSpan(1, Math.min(25, currentText.length + 1), "Sample Contradiction")
  }
})

document.getElementById("pmClearConflictBtn")?.addEventListener("click", () => {
  pm.clearConflictHighlights()
})

// --- 3. View Switcher Tabs ------------------------------------------
const viewTextareaBtn = document.getElementById("viewTextareaBtn")
const viewProseMirrorBtn = document.getElementById("viewProseMirrorBtn")
const textareaPanel = document.getElementById("textareaPanel")
const prosemirrorPanel = document.getElementById("prosemirrorPanel")

viewTextareaBtn?.addEventListener("click", () => {
  viewTextareaBtn.classList.add("active")
  viewProseMirrorBtn.classList.remove("active")
  textareaPanel.style.display = "block"
  prosemirrorPanel.style.display = "none"
  editor.value = handle.docSync()?.text ?? ""
})

viewProseMirrorBtn?.addEventListener("click", () => {
  viewProseMirrorBtn.classList.add("active")
  viewTextareaBtn.classList.remove("active")
  textareaPanel.style.display = "none"
  prosemirrorPanel.style.display = "block"
  pm.view.focus()
})

// --- 4. Preset Examples and Utilities --------------------------------
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
