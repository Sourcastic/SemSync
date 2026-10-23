import { useSyncExternalStore } from "react"
import { Avatar } from "../ui/Avatar.jsx"
import { Tooltip } from "../ui/Tooltip.jsx"

const noopSubscribe = () => () => {}
const empty = []

// Avatars of collaborators currently in the document. One per person, even with several tabs.
export function PresenceAvatars({ presence, max = 4 }) {
  const peers = useSyncExternalStore(presence ? presence.subscribe : noopSubscribe, () => presence?.getPeers() ?? empty)
  const people = [...new Map(peers.map(peer => [peer.user.id, peer])).values()]
  if (people.length === 0) return null

  const shown = people.slice(0, max)
  const extra = people.length - shown.length

  function locate(peerId) {
    document.querySelector(`.collab-caret[data-peer="${CSS.escape(peerId)}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" })
  }

  return (
    <div className="avatar-group presence-avatars" aria-label={`${people.length} ${people.length === 1 ? "collaborator" : "collaborators"} in this document`}>
      {shown.map(peer => (
        <Tooltip key={peer.user.id} content={`${peer.user.fullName ?? peer.user.name} · Go to cursor`}>
          <button className="presence-avatar" style={{ "--collab-color": peer.user.color }} onClick={() => locate(peer.peerId)} aria-label={`${peer.user.fullName ?? peer.user.name}, go to cursor`}>
            <Avatar user={peer.user} label="" />
          </button>
        </Tooltip>
      ))}
      {extra > 0 && <span className="avatar" data-overflow>+{extra}</span>}
    </div>
  )
}
