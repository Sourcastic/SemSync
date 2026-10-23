import { useEffect, useRef, useState } from "react"
import { MdOutlineCloudDone, MdOutlineCloudOff, MdSync } from "react-icons/md"
import { Tooltip } from "../ui/Tooltip.jsx"
import { useConnection } from "../../lib/repo.js"

const SAVE_SETTLE_MS = 800
const SYNCED_FLASH_MS = 2500

// Routine states stay muted; only offline/reconnecting use the warning tone.
const DISPLAY = {
  saving: [MdSync, "Saving…", "Saving your changes"],
  saved: [MdOutlineCloudDone, "Saved", "All changes saved"],
  synced: [MdOutlineCloudDone, "Synced", "Back online. Changes are in sync"],
  reconnecting: [MdSync, "Reconnecting…", "Trying to reach the sync server. Changes are saved on this device"],
  offline: [MdOutlineCloudOff, "Offline", "You’re offline. Changes are saved on this device and will sync when you’re back online"],
}

export function SyncStatus({ handle }) {
  const connection = useConnection()
  const [saving, setSaving] = useState(false)
  const [justSynced, setJustSynced] = useState(false)
  const previous = useRef(connection)

  // Any change (local or remote) is written to local storage; show a short "Saving…".
  useEffect(() => {
    if (!handle) return
    let timer
    const onChange = () => {
      setSaving(true)
      clearTimeout(timer)
      timer = setTimeout(() => setSaving(false), SAVE_SETTLE_MS)
    }
    handle.on("change", onChange)
    return () => {
      handle.off("change", onChange)
      clearTimeout(timer)
    }
  }, [handle])

  // Briefly confirm "Synced" when the connection comes back.
  useEffect(() => {
    let timer
    if (connection === "online" && (previous.current === "reconnecting" || previous.current === "offline")) {
      setJustSynced(true)
      timer = setTimeout(() => setJustSynced(false), SYNCED_FLASH_MS)
    }
    previous.current = connection
    return () => clearTimeout(timer)
  }, [connection])

  const state =
    connection === "offline" ? "offline"
    : connection === "reconnecting" ? "reconnecting"
    : saving ? "saving"
    : justSynced ? "synced"
    : "saved"
  const [Icon, label, description] = DISPLAY[state]

  return (
    <Tooltip content={description}>
      <span className="sync-status" data-state={state} role="status" tabIndex={0} aria-label={label}>
        <Icon aria-hidden="true" /><span className="sync-label">{label}</span>
      </span>
    </Tooltip>
  )
}
