// Demo collaborators. Colors are CSS tokens so they adapt to light/dark and stay stable per user.

export const COLLABORATORS = {
  eshaal: { id: "eshaal", name: "Eshaal", fullName: "Eshaal Rehmatullah", color: "var(--collab-eshaal)" },
  atika: { id: "atika", name: "Atika", fullName: "Atika Hussain", color: "var(--collab-atika)" },
  ibrahim: { id: "ibrahim", name: "Ibrahim", fullName: "Ibrahim Faisal", color: "var(--collab-ibrahim)" },
}

export function initials(name) {
  const parts = name.trim().split(/\s+/)
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase()
}
