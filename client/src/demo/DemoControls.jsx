import { useState } from "react"
import {
  MdOutlineScience,
  MdPeopleOutline,
  MdOutlinePersonRemove,
  MdCallMerge,
  MdOutlineCloudOff,
  MdSpellcheck,
  MdAutoFixHigh,
  MdGroups,
  MdRestartAlt,
} from "react-icons/md"
import { Dropdown, DropdownItem, DropdownCheckboxItem, DropdownLabel, DropdownSeparator } from "../components/ui/Dropdown.jsx"
import { Button } from "../components/ui/Button.jsx"
import { useToast } from "../components/ui/Toast.jsx"
import { setNetworkPaused, isNetworkPaused } from "../lib/repo.js"
import {
  SCENARIOS,
  runOnlineScenario,
  runOfflineScenario,
  simulateCollaboratorsJoining,
  simulateCollaboratorsLeaving,
  insertGrammarIssue,
  simulateSimultaneousResolve,
  resetScenario,
} from "./scenarios.js"

// Small, out-of-the-way control surface for the evaluator demo. Rendered only when DEMO_MODE is on.
// Ordered as the presentation flows: set the scene, make concurrent edits, then test edge cases.
export function DemoControls({ documentId, localAuthorId, editor, handle, presence, semantic }) {
  const toast = useToast()
  const [offline, setOffline] = useState(isNetworkPaused)
  const [nlpDown, setNlpDown] = useState(false)
  const [running, setRunning] = useState(null) // "online" | "offline" | null
  const context = { editor, handle, presence, semantic }
  const ready = Boolean(editor && handle && presence && semantic)
  const scenario = SCENARIOS[documentId]
  const busy = Boolean(running)

  async function run(kind) {
    setRunning(kind)
    try {
      const options = { simulateFailure: nlpDown }
      const outcome = kind === "offline"
        ? await runOfflineScenario(context, scenario, options, localAuthorId)
        : await runOnlineScenario(context, kind === "grammar" ? scenario.grammarMerge : scenario, options)
      if (outcome === "missing") toast("The scenario sentence isn’t in this document any more. Use Reset document.")
    } finally {
      setOffline(isNetworkPaused())
      setRunning(null)
    }
  }

  function reset() {
    if (!resetScenario(context, scenario)) toast("Couldn’t find the scenario sentence to restore.")
    setOffline(false)
    setNlpDown(false)
  }

  function toggleOffline(next) {
    setNetworkPaused(next)
    setOffline(next)
  }

  const label = running === "offline" ? "Offline scenario…" : running ? "Running…" : "Demo"

  return (
    <div className="demo-controls">
      <Dropdown side="top" align="end" label="Demo controls" trigger={
        <Button variant="secondary" size="sm" disabled={!ready}><MdOutlineScience />{label}</Button>
      }>
        <DropdownLabel>1. Set the scene</DropdownLabel>
        <DropdownItem icon={<MdPeopleOutline />} onSelect={() => simulateCollaboratorsJoining(context, scenario)}>Atika and Ibrahim join</DropdownItem>
        <DropdownItem icon={<MdOutlinePersonRemove />} onSelect={() => simulateCollaboratorsLeaving(context)}>They leave</DropdownItem>
        <DropdownSeparator />
        <DropdownLabel>2. Edit the same sentence at once{scenario ? "" : " (no scenario here)"}</DropdownLabel>
        <DropdownItem icon={<MdCallMerge />} disabled={!scenario || busy} onSelect={() => run("online")}>Both online</DropdownItem>
        <DropdownItem icon={<MdOutlineCloudOff />} disabled={!scenario || busy} onSelect={() => run("offline")}>You offline, then reconnect</DropdownItem>
        <DropdownItem icon={<MdAutoFixHigh />} disabled={!scenario?.grammarMerge || busy} onSelect={() => run("grammar")}>Merge causes a grammar error</DropdownItem>
        <DropdownSeparator />
        <DropdownLabel>3. Other checks</DropdownLabel>
        <DropdownItem icon={<MdGroups />} disabled={busy} onSelect={() => simulateSimultaneousResolve(context) === "none" && toast("Nothing to resolve yet. Run a scenario first.")}>Atika resolves it at the same time</DropdownItem>
        <DropdownItem icon={<MdSpellcheck />} onSelect={() => insertGrammarIssue(context)}>Add a grammar mistake</DropdownItem>
        <DropdownCheckboxItem checked={offline} disabled={busy} onCheckedChange={toggleOffline}>Work offline</DropdownCheckboxItem>
        <DropdownCheckboxItem checked={nlpDown} onCheckedChange={setNlpDown}>Semantic analysis unavailable</DropdownCheckboxItem>
        <DropdownSeparator />
        <DropdownItem icon={<MdRestartAlt />} disabled={busy} onSelect={reset}>Reset document</DropdownItem>
      </Dropdown>
    </div>
  )
}
