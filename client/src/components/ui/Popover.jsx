import * as RadixPopover from "@radix-ui/react-popover"

// Pass `trigger` for a button-opened popover, or `anchor` (a ref to anything with
// getBoundingClientRect, e.g. a semantic decoration's DOM range) and control `open`.
// autoFocus={false} keeps focus where it is (e.g. in the editor) when the popover opens.
export function Popover({ open, onOpenChange, trigger, anchor, side = "bottom", align = "start", label, autoFocus = true, className, children }) {
  return (
    <RadixPopover.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>}
      {anchor && <RadixPopover.Anchor virtualRef={anchor} />}
      <RadixPopover.Portal>
        <RadixPopover.Content
          className={className ? `popover ${className}` : "popover"}
          side={side}
          align={align}
          sideOffset={8}
          collisionPadding={16}
          aria-label={label}
          onOpenAutoFocus={autoFocus ? undefined : event => event.preventDefault()}
        >
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  )
}

export const PopoverClose = RadixPopover.Close
