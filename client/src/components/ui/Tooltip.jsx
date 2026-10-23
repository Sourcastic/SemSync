import * as RadixTooltip from "@radix-ui/react-tooltip"

// Mount once near the app root.
export function TooltipProvider({ children }) {
  return (
    <RadixTooltip.Provider delayDuration={500} skipDelayDuration={200}>
      {children}
    </RadixTooltip.Provider>
  )
}

export function Tooltip({ content, shortcut, side = "bottom", children }) {
  if (!content) return children
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content className="tooltip" side={side} sideOffset={6}>
          {content}
          {shortcut && <kbd>{shortcut}</kbd>}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
}
