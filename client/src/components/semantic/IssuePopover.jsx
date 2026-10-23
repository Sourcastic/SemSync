import { useMemo } from "react"
import { Popover } from "../ui/Popover.jsx"
import { IssueDetails } from "./IssueDetails.jsx"
import { isVisible } from "./semanticPlugin.js"

// Narrow screens have no margin rail: the active conflict opens as a popover anchored to its text.
// Radix positions it against a virtual element that always reads the decoration's live position.
export function IssuePopover({ semantic, snapshot }) {
  const issue = snapshot.issues.find(item => item.id === snapshot.activeId && item.kind === "conflict" && isVisible(item))
  const anchor = useMemo(
    () => ({
      current: {
        getBoundingClientRect: () =>
          document.querySelector(`[data-issue-id="${CSS.escape(snapshot.activeId ?? "")}"]`)?.getBoundingClientRect() ?? new DOMRect(),
      },
    }),
    [snapshot.activeId]
  )

  if (!issue) return null
  return (
    <Popover open anchor={anchor} side="bottom" align="start" autoFocus={false} label="Suggestion details" onOpenChange={open => !open && semantic.actions.activate(null)}>
      <IssueDetails issue={issue} actions={semantic.actions} />
    </Popover>
  )
}
