// server.js — SemSync Layer 1: CRDT Replication (sync server)
//
// This is the piece of the diagram's "Layer 1" box that lives on a server:
//   - Yjs/Automerge engine        -> the Repo below IS the automerge engine
//   - Vector clock management     -> handled internally by Automerge's
//                                    hash-DAG of changes (no code needed
//                                    from us — every change already carries
//                                    its causal history)
//   - WebRTC/WebSocket broadcast  -> the WebSocket server adapter below
//
// Every browser tab that connects to this server becomes a peer. The server
// itself is just another peer with a persistent (on-disk) copy of every
// document, so two browsers don't even need to be online at the same time
// to converge — they each sync with the server whenever they connect.

import http from "http"
import { WebSocketServer } from "ws"
import { Repo } from "@automerge/automerge-repo"
import { NodeWSServerAdapter } from "@automerge/automerge-repo-network-websocket"
import { NodeFSStorageAdapter } from "@automerge/automerge-repo-storage-nodefs"

const PORT = process.env.PORT ? Number(process.env.PORT) : 3030

// Plain HTTP server, just so we have something to attach the WebSocket
// server to and a trivial health-check endpoint.
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" })
  res.end("SemSync Layer 1 sync server is running.\n")
})

const wss = new WebSocketServer({ server })

// The Repo is the actual CRDT engine + document manager. Handing it a
// network adapter is what turns "a CRDT library" into "a replicating
// CRDT system" — this one line is doing the job of the whole
// "WebRTC / WebSocket broadcast" box in the diagram.
const repo = new Repo({
  network: [new NodeWSServerAdapter(wss)],
  storage: new NodeFSStorageAdapter("./automerge-data"),
  peerId: "sync-server",
  // The server never "owns" a document's edits, it just relays and
  // persists them, so it doesn't need to be listed as an authoritative
  // share target.
  sharePolicy: async () => true,
})

// This is exactly the hook Layer 2 (Concurrent Edit Detection) will
// attach to later: every time the CRDT state changes, we get an event
// with the change and who made it. For now we just log it so you can see
// replication happening in real time.
repo.on("document", ({ handle }) => {
  handle.on("change", ({ doc, patches, patchInfo }) => {
    console.log(
      `[repo] doc ${handle.documentId} changed`,
      `(${patches.length} patch${patches.length === 1 ? "" : "es"})`,
      "source:", patchInfo.source
    )
  })
})

server.listen(PORT, () => {
  console.log(`SemSync sync server listening on ws://localhost:${PORT}`)
})
