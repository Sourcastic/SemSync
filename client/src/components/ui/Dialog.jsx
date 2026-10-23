import * as RadixDialog from "@radix-ui/react-dialog"
import { MdClose } from "react-icons/md"
import { IconButton } from "./Button.jsx"

export function Dialog({ open, onOpenChange, trigger, title, description, footer, children }) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="dialog-overlay" />
        <RadixDialog.Content className="dialog" data-floating {...(!description && { "aria-describedby": undefined })}>
          <div className="dialog-header">
            <div>
              <RadixDialog.Title className="dialog-title">{title}</RadixDialog.Title>
              {description && <RadixDialog.Description className="dialog-description">{description}</RadixDialog.Description>}
            </div>
            <RadixDialog.Close asChild>
              <IconButton label="Close" tooltip={false}><MdClose /></IconButton>
            </RadixDialog.Close>
          </div>
          {children}
          {footer && <div className="dialog-footer">{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}

export const DialogClose = RadixDialog.Close
