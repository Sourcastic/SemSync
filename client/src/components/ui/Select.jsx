import * as RadixSelect from "@radix-ui/react-select"
import { MdArrowDropDown, MdCheck } from "react-icons/md"

// options: [{ value, label }]    variant: default | ghost    size: sm | md
// onCloseFocus: where focus goes after choosing (e.g. back into the editor instead of the trigger).
export function Select({ value, defaultValue, onValueChange, options, label, variant, size, width, icon, onCloseFocus }) {
  return (
    <RadixSelect.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange}>
      <RadixSelect.Trigger className="select-trigger" data-variant={variant} data-size={size} aria-label={label} style={width ? { width } : undefined}>
        {icon}
        <RadixSelect.Value />
        <RadixSelect.Icon asChild><MdArrowDropDown /></RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          className="menu"
          position="popper"
          sideOffset={4}
          onCloseAutoFocus={onCloseFocus ? event => { event.preventDefault(); onCloseFocus() } : undefined}
        >
          <RadixSelect.Viewport>
            {options.map(option => (
              <RadixSelect.Item key={option.value} value={option.value} className="menu-item">
                <span className="menu-item-check">
                  <RadixSelect.ItemIndicator><MdCheck /></RadixSelect.ItemIndicator>
                </span>
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}
