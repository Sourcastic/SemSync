import * as RadixTabs from "@radix-ui/react-tabs"

export const Tabs = RadixTabs.Root
export const TabPanel = RadixTabs.Content

export function TabList({ label, children }) {
  return <RadixTabs.List className="tab-list" aria-label={label}>{children}</RadixTabs.List>
}

export function Tab({ value, count, children }) {
  return (
    <RadixTabs.Trigger className="tab" value={value}>
      {children}
      {count != null && <span className="count">{count}</span>}
    </RadixTabs.Trigger>
  )
}
