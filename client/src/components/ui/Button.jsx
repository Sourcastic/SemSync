import { forwardRef } from "react"
import { MdArrowDropDown } from "react-icons/md"
import { Tooltip } from "./Tooltip.jsx"

// variant: primary | tonal | secondary | ghost | danger | link    size: sm | md | lg
export const Button = forwardRef(function Button({ variant = "secondary", size, block, type = "button", className, ...props }, ref) {
  return <button ref={ref} type={type} className={className ? `button ${className}` : "button"} data-variant={variant} data-size={size} data-block={block || undefined} {...props} />
})

// Icon-only control. `label` is required: it names the button and becomes its tooltip.
export const IconButton = forwardRef(function IconButton({ label, shortcut, size, tooltip = true, type = "button", children, ...props }, ref) {
  const button = (
    <button ref={ref} type={type} className="icon-button" data-size={size} aria-label={label} {...props}>
      {children}
    </button>
  )
  return tooltip ? <Tooltip content={label} shortcut={shortcut}>{button}</Tooltip> : button
})

// Buttons placed together share one width.
export function ButtonRow({ children }) {
  return <div className="button-row">{children}</div>
}

// Main action + attached caret that opens a menu (pass `menu` as a Dropdown trigger wrapper).
export function SplitButton({ variant = "tonal", children, onClick, menuLabel, renderMenu }) {
  const caret = (
    <Button variant={variant} aria-label={menuLabel} aria-haspopup="menu">
      <MdArrowDropDown />
    </Button>
  )
  return (
    <div className="split-button">
      <Button variant={variant} onClick={onClick}>{children}</Button>
      {renderMenu ? renderMenu(caret) : caret}
    </div>
  )
}
