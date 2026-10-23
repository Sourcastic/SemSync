import * as Menu from "@radix-ui/react-dropdown-menu"
import { MdCheck } from "react-icons/md"

// <Dropdown trigger={<Button/>}> <DropdownItem/>… </Dropdown>
export function Dropdown({ trigger, align = "start", side = "bottom", label, children }) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger asChild>{trigger}</Menu.Trigger>
      <Menu.Portal>
        <Menu.Content className="menu" align={align} side={side} sideOffset={4} aria-label={label}>
          {children}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  )
}

export function DropdownItem({ icon, shortcut, variant, children, ...props }) {
  return (
    <Menu.Item className="menu-item" data-variant={variant} {...props}>
      {icon}
      {children}
      {shortcut && <span className="menu-shortcut">{shortcut}</span>}
    </Menu.Item>
  )
}

export function DropdownCheckboxItem({ shortcut, children, ...props }) {
  return (
    <Menu.CheckboxItem className="menu-item" {...props}>
      <span className="menu-item-check">
        <Menu.ItemIndicator><MdCheck /></Menu.ItemIndicator>
      </span>
      {children}
      {shortcut && <span className="menu-shortcut">{shortcut}</span>}
    </Menu.CheckboxItem>
  )
}

export function DropdownLabel({ children }) {
  return <Menu.Label className="menu-label">{children}</Menu.Label>
}

export function DropdownSeparator() {
  return <Menu.Separator className="menu-separator" />
}
