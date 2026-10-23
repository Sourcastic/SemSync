// The single Automerge Repo for the app: IndexedDB for local persistence, WebSocket to the sync server.
// Automerge documents are the collaborative source of truth for document content.
import { useSyncExternalStore } from "react"
import { Repo } from "@automerge/automerge-repo"
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket"
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb"

export const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL ?? "ws://localhost:3030"

const network = new BrowserWebSocketClientAdapter(SYNC_SERVER_URL)

// Simulated offline (demo and manual testing): messages queue in both directions while paused
// and flush on resume, exactly like a dropped connection that comes back.
let paused = false
let outgoing = []
let incoming = []
const send = network.send.bind(network)
const receive = network.receiveMessage.bind(network)
network.send = message => (paused ? outgoing.push(message) : send(message))
network.receiveMessage = message => (paused ? incoming.push(message) : receive(message))

export function setNetworkPaused(next) {
  if (next === paused) return
  paused = next
  if (paused) {
    setConnection("offline")
  } else {
    const [inbox, outbox] = [incoming, outgoing]
    incoming = []
    outgoing = []
    inbox.forEach(receive)
    outbox.forEach(send)
    setConnection(peers > 0 ? "online" : "reconnecting")
  }
}

export const isNetworkPaused = () => paused

export const repo = new Repo({
  network: [network],
  storage: new IndexedDBStorageAdapter("semsync"),
})

// ---------- Connection state: "connecting" | "online" | "reconnecting" | "offline" ----------
// Listeners attach on first subscriber and detach when the last one leaves.
const CONNECT_GRACE_MS = 4000
let connection = "connecting"
let peers = 0
let graceTimer = null
const listeners = new Set()

function setConnection(next) {
  if (paused && next !== "offline") return
  if (next === connection) return
  connection = next
  listeners.forEach(listener => listener())
}

function disconnectedState() {
  return navigator.onLine ? "reconnecting" : "offline"
}

const onPeer = () => {
  peers += 1
  clearTimeout(graceTimer)
  setConnection("online")
}
const onPeerDisconnected = () => {
  peers = Math.max(0, peers - 1)
  if (peers === 0) setConnection(disconnectedState())
}
const onBrowserOnline = () => peers === 0 && setConnection("reconnecting")
const onBrowserOffline = () => setConnection("offline")

function subscribe(listener) {
  if (listeners.size === 0) {
    repo.networkSubsystem.on("peer", onPeer)
    repo.networkSubsystem.on("peer-disconnected", onPeerDisconnected)
    window.addEventListener("online", onBrowserOnline)
    window.addEventListener("offline", onBrowserOffline)
    // Peers that connected before anyone was listening.
    peers = repo.peers.length
    if (peers > 0) setConnection("online")
    else if (connection === "online") setConnection(disconnectedState())
    if (connection === "connecting") {
      graceTimer = setTimeout(() => peers === 0 && setConnection(disconnectedState()), CONNECT_GRACE_MS)
    }
  }
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      repo.networkSubsystem.off("peer", onPeer)
      repo.networkSubsystem.off("peer-disconnected", onPeerDisconnected)
      window.removeEventListener("online", onBrowserOnline)
      window.removeEventListener("offline", onBrowserOffline)
      clearTimeout(graceTimer)
    }
  }
}

export function useConnection() {
  return useSyncExternalStore(subscribe, () => connection)
}
