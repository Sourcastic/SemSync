// Collaborator presence: remote carets, selections and name labels.
//
// Positions travel as Automerge ephemeral messages (never stored in the document).
// Between messages, the plugin maps every remote position through local transactions,
// so carets stay attached to the right text while edits arrive.
import { Plugin, PluginKey } from "prosemirror-state"
import { Decoration, DecorationSet } from "prosemirror-view"

const presenceKey = new PluginKey("semsync-presence")

const BROADCAST_THROTTLE_MS = 80
const HEARTBEAT_MS = 5000
const STALE_MS = 15000
const LABEL_IDLE_MS = 3000

function clamp(pos, doc) {
  return Math.max(0, Math.min(pos, doc.content.size))
}

function caretWidget(peer, idle) {
  return () => {
    const caret = document.createElement("span")
    caret.className = "collab-caret"
    caret.dataset.peer = peer.peerId
    if (idle) caret.dataset.idle = ""
    caret.style.setProperty("--collab-color", peer.user.color)
    const label = document.createElement("span")
    label.className = "collab-caret-label"
    label.textContent = peer.user.name
    caret.append("⁠", label) // word joiner keeps the caret from breaking lines
    return caret
  }
}

function buildDecorations(doc, peers, now) {
  const decorations = []
  for (const peer of peers.values()) {
    const from = clamp(Math.min(peer.anchor, peer.head), doc)
    const to = clamp(Math.max(peer.anchor, peer.head), doc)
    const head = clamp(peer.head, doc)
    const idle = now - peer.lastMoved > LABEL_IDLE_MS
    if (from !== to) {
      decorations.push(Decoration.inline(from, to, { class: "collab-selection", style: `--collab-color: ${peer.user.color}` }))
    }
    decorations.push(Decoration.widget(head, caretWidget(peer, idle), { key: `${peer.peerId}:${idle}`, side: 1, ignoreSelection: true }))
  }
  return DecorationSet.create(doc, decorations)
}

// Plugin state: Map<peerId, { peerId, user, anchor, head, lastMoved, lastSeen }>
export const presencePlugin = new Plugin({
  key: presenceKey,
  state: {
    init: () => ({ peers: new Map(), decorations: DecorationSet.empty }),
    apply(tr, value, _old, newState) {
      const meta = tr.getMeta(presenceKey)
      if (!meta && !tr.docChanged) return value
      const peers = new Map(value.peers)
      if (tr.docChanged) {
        for (const [id, peer] of peers) {
          peers.set(id, { ...peer, anchor: tr.mapping.map(peer.anchor), head: tr.mapping.map(peer.head) })
        }
      }
      if (meta?.upsert) peers.set(meta.upsert.peerId, meta.upsert)
      if (meta?.remove) meta.remove.forEach(id => peers.delete(id))
      return { peers, decorations: buildDecorations(newState.doc, peers, Date.now()) }
    },
  },
  props: {
    decorations: state => presenceKey.getState(state).decorations,
  },
})

// Wires the plugin to a DocHandle. Returns { subscribe, getPeers, destroy } for React (avatars).
export function connectPresence(editor, handle, user) {
  const { view } = editor
  const listeners = new Set()
  let peersSnapshot = []
  let lastSent = 0
  let pendingSend = null
  let sentSelection = null

  function notify() {
    const peers = presenceKey.getState(view.state).peers
    peersSnapshot = [...peers.values()]
    listeners.forEach(listener => listener())
  }

  function dispatchMeta(meta) {
    if (view.isDestroyed) return
    view.dispatch(view.state.tr.setMeta(presenceKey, meta))
    notify()
  }

  function send() {
    pendingSend = null
    lastSent = Date.now()
    const { anchor, head } = view.state.selection
    sentSelection = `${anchor}:${head}`
    handle.broadcast({ type: "presence", user: { id: user.id, name: user.name, fullName: user.fullName, color: user.color }, anchor, head })
  }

  function scheduleSend() {
    if (pendingSend) return
    const wait = Math.max(0, BROADCAST_THROTTLE_MS - (Date.now() - lastSent))
    pendingSend = setTimeout(send, wait)
  }

  const onEditorChange = () => {
    const { anchor, head } = view.state.selection
    if (`${anchor}:${head}` !== sentSelection) scheduleSend()
  }

  const onMessage = ({ senderId, message }) => {
    if (!message || typeof message !== "object") return
    if (message.type === "presence-leave") return dispatchMeta({ remove: [senderId] })
    if (message.type !== "presence") return
    const previous = presenceKey.getState(view.state).peers.get(senderId)
    const moved = !previous || previous.anchor !== message.anchor || previous.head !== message.head
    dispatchMeta({
      upsert: {
        peerId: senderId,
        user: message.user,
        anchor: clamp(message.anchor, view.state.doc),
        head: clamp(message.head, view.state.doc),
        lastMoved: moved ? Date.now() : previous.lastMoved,
        lastSeen: Date.now(),
      },
    })
    // A newcomer needs our position too; answer once instead of waiting for the heartbeat.
    if (!previous) scheduleSend()
  }

  // Heartbeat keeps presence alive; the sweep drops peers that vanished and refreshes idle labels.
  const heartbeat = setInterval(send, HEARTBEAT_MS)
  const sweep = setInterval(() => {
    const now = Date.now()
    const peers = presenceKey.getState(view.state).peers
    const stale = [...peers.values()].filter(peer => !peer.simulated && now - peer.lastSeen > STALE_MS).map(peer => peer.peerId)
    const labelExpired = [...peers.values()].some(peer => now - peer.lastMoved > LABEL_IDLE_MS && now - peer.lastMoved < LABEL_IDLE_MS + 1000)
    if (stale.length || labelExpired) dispatchMeta({ remove: stale })
  }, 1000)

  const unsubscribeEditor = editor.subscribe(onEditorChange)
  handle.on("ephemeral-message", onMessage)
  const onUnload = () => handle.broadcast({ type: "presence-leave" })
  window.addEventListener("beforeunload", onUnload)
  send()

  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getPeers: () => peersSnapshot,
    // Demo: show a collaborator who isn't connected (see src/demo/scenarios.js).
    simulatePeer(peerId, user, anchor, head = anchor) {
      dispatchMeta({ upsert: { peerId, user, anchor, head, lastMoved: Date.now(), lastSeen: Date.now(), simulated: true } })
    },
    removePeer: peerId => dispatchMeta({ remove: [peerId] }),
    destroy() {
      onUnload()
      clearInterval(heartbeat)
      clearInterval(sweep)
      clearTimeout(pendingSend)
      unsubscribeEditor()
      handle.off("ephemeral-message", onMessage)
      window.removeEventListener("beforeunload", onUnload)
      listeners.clear()
    },
  }
}
