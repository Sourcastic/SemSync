// peer-sync-test.js — headless proof that Layer 1 replication converges.
//
// Two independent Automerge peers connect ONLY through the WebSocket
// sync server (server/server.js) and edit the same text concurrently,
// deliberately reproducing the dangling-modifier example from the
// proposal's Introduction: starting from "The brown fox.", one peer
// inserts "quick" (-> "The quick brown fox.") while the other deletes
// "brown fox" (-> "The .").
//
// A plain CRDT merges these blindly by character position, so both
// peers converge to "The quick ." — syntactically valid, grammatically
// broken. That's Layer 1 doing exactly its job (guaranteed convergence)
// and exactly why Layers 2-4 (semantic conflict detection) need to
// exist on top of it.
//
// Run: node peer-sync-test.js   (with server/server.js already running)

import { Repo } from "@automerge/automerge-repo"
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket"
import { updateText } from "@automerge/automerge/next"

const URL = "ws://localhost:3030"

function makeRepo(peerId) {
  return new Repo({
    network: [new BrowserWebSocketClientAdapter(URL)],
    peerId,
  })
}

const repoA = makeRepo("peer-a")
const repoB = makeRepo("peer-b")

repoA.networkSubsystem.on("peer", p => console.log("A sees peer", p.peerId))
repoB.networkSubsystem.on("peer", p => console.log("B sees peer", p.peerId))

const handleA = repoA.create({ text: "The brown fox." })
await handleA.whenReady()
console.log("A ready, url:", handleA.url)

// Give the server a moment to register peer A and share the doc.
await new Promise(r => setTimeout(r, 500))

const handleB = repoB.find(handleA.url)
console.log("B requested doc, waiting for ready...")
await handleB.whenReady()
console.log("B ready")

// Wait until B actually has A's initial content (not just an empty doc).
await new Promise(resolve => {
  const check = () => {
    const d = handleB.docSync()
    if (d && d.text === "The brown fox.") resolve()
  }
  handleB.on("change", check)
  check()
})

console.log("Initial sync OK. B sees:", JSON.stringify(handleB.docSync().text))

// Concurrent edits — A inserts "quick", B deletes "brown fox".
handleA.change(doc => updateText(doc, ["text"], "The quick brown fox."))
handleB.change(doc => updateText(doc, ["text"], "The ."))

await new Promise(r => setTimeout(r, 1000))

const finalA = handleA.docSync().text
const finalB = handleB.docSync().text

console.log("A converged to:", JSON.stringify(finalA))
console.log("B converged to:", JSON.stringify(finalB))
console.log(finalA === finalB ? "PASS: both peers converged" : "FAIL: peers diverged")

process.exit(0)
