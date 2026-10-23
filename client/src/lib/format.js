// Date formatting in the style of familiar editors: time for today, "Yesterday", then a date.

const time = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" })
const sameYear = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" })
const otherYear = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" })

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

export function formatDocDate(timestamp) {
  const date = new Date(timestamp)
  const today = startOfDay(new Date())
  const day = startOfDay(date)
  if (day === today) return time.format(date)
  if (day === today - 864e5) return "Yesterday"
  return (date.getFullYear() === new Date().getFullYear() ? sameYear : otherYear).format(date)
}

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })

// "Just now", "2 min ago", "3 hr ago", then a date.
export function formatRelativeTime(timestamp) {
  const seconds = Math.round((Date.now() - timestamp) / 1000)
  if (seconds < 45) return "Just now"
  if (seconds < 3600) return relative.format(-Math.round(seconds / 60), "minute")
  if (seconds < 86400) return relative.format(-Math.round(seconds / 3600), "hour")
  return formatDocDate(timestamp)
}
