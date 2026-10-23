import { useEffect, useMemo, useRef, useState } from "react"
import { Popover } from "../ui/Popover.jsx"
import { GrammarDetails } from "./IssueDetails.jsx"
import { isVisible } from "./semanticPlugin.js"

const OPEN_DELAY_MS = 150
const CLOSE_DELAY_MS = 250

// Grammar suggestions stay out of the way: the card appears only while the pointer is on the
// dotted text (or after clicking it). Every suggestion is also listed in the Review panel.
export function GrammarHoverCard({ editor, semantic, snapshot, pinActive }) {
  const [hoverId, setHoverId] = useState(null)
  const timers = useRef({})
  const overCard = useRef(false)

  useEffect(() => {
    const root = editor.view.dom
    const clear = () => {
      clearTimeout(timers.current.open)
      clearTimeout(timers.current.close)
    }
    const onOver = event => {
      const id = event.target.closest?.(".sem-grammar")?.dataset.issueId
      if (!id) return
      clear()
      timers.current.open = setTimeout(() => setHoverId(id), OPEN_DELAY_MS)
    }
    const onOut = event => {
      if (!event.target.closest?.(".sem-grammar")) return
      clear()
      timers.current.close = setTimeout(() => !overCard.current && setHoverId(null), CLOSE_DELAY_MS)
    }
    root.addEventListener("mouseover", onOver)
    root.addEventListener("mouseout", onOut)
    return () => {
      clear()
      root.removeEventListener("mouseover", onOver)
      root.removeEventListener("mouseout", onOut)
    }
  }, [editor])

  const active = snapshot.issues.find(issue => issue.id === snapshot.activeId)
  const openId = hoverId ?? (pinActive && active?.kind === "grammar" ? active.id : null)
  const issue = snapshot.issues.find(item => item.id === openId && item.kind === "grammar" && isVisible(item))

  const anchor = useMemo(
    () => ({
      current: {
        getBoundingClientRect: () =>
          document.querySelector(`[data-issue-id="${CSS.escape(openId ?? "")}"]`)?.getBoundingClientRect() ?? new DOMRect(),
      },
    }),
    [openId]
  )

  if (!issue) return null

  function close() {
    overCard.current = false
    setHoverId(null)
    if (snapshot.activeId === issue.id) semantic.actions.activate(null)
  }

  return (
    <Popover open anchor={anchor} side="bottom" align="start" autoFocus={false} className="grammar-popover" label="Grammar suggestion" onOpenChange={open => !open && close()}>
      <div
        onMouseEnter={() => {
          overCard.current = true
          clearTimeout(timers.current.close)
        }}
        onMouseLeave={() => {
          overCard.current = false
          if (snapshot.activeId !== issue.id) timers.current.close = setTimeout(() => setHoverId(null), CLOSE_DELAY_MS)
        }}
      >
        <GrammarDetails issue={issue} actions={{ ...semantic.actions, activate: close }} />
      </div>
    </Popover>
  )
}
