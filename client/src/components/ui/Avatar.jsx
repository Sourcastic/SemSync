import { initials } from "../../lib/collaborators.js"

export function Avatar({ user, size, label }) {
  return (
    <span
      className="avatar"
      data-size={size}
      style={{ "--avatar-color": user.color }}
      role="img"
      aria-label={label ?? user.fullName ?? user.name}
    >
      {initials(user.fullName ?? user.name)}
    </span>
  )
}

export function AvatarGroup({ users, size, max = 3 }) {
  const shown = users.slice(0, max)
  const extra = users.length - shown.length
  return (
    <span className="avatar-group">
      {shown.map(user => (
        <Avatar key={user.id} user={user} size={size} />
      ))}
      {extra > 0 && (
        <span className="avatar" data-size={size} data-overflow role="img" aria-label={`${extra} more`}>
          +{extra}
        </span>
      )}
    </span>
  )
}
