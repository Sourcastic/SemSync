import {
  MdMoreVert,
  MdOpenInNew,
  MdDriveFileRenameOutline,
  MdStar,
  MdStarOutline,
  MdOutlineFolder,
  MdOutlinePersonAddAlt,
  MdDeleteOutline,
  MdRestoreFromTrash,
} from "react-icons/md"
import { Dropdown, DropdownItem, DropdownSeparator } from "../ui/Dropdown.jsx"
import { IconButton } from "../ui/Button.jsx"

// actions: { open, rename, toggleStar, move, share, trash, restore }; each receives the doc.
export function DocumentMenu({ doc, actions, size }) {
  const trigger = (
    <IconButton label={`Actions for ${doc.title}`} tooltip={false} size={size} onClick={event => event.stopPropagation()}>
      <MdMoreVert />
    </IconButton>
  )

  if (doc.trashed) {
    return (
      <Dropdown align="end" label="Document actions" trigger={trigger}>
        <DropdownItem icon={<MdRestoreFromTrash />} onSelect={() => actions.restore(doc)}>Restore</DropdownItem>
      </Dropdown>
    )
  }

  return (
    <Dropdown align="end" label="Document actions" trigger={trigger}>
      <DropdownItem icon={<MdOpenInNew />} onSelect={() => actions.open(doc)}>Open</DropdownItem>
      <DropdownItem icon={<MdDriveFileRenameOutline />} onSelect={() => actions.rename(doc)}>Rename</DropdownItem>
      <DropdownItem icon={doc.starred ? <MdStar /> : <MdStarOutline />} onSelect={() => actions.toggleStar(doc)}>
        {doc.starred ? "Remove from starred" : "Star"}
      </DropdownItem>
      <DropdownItem icon={<MdOutlineFolder />} onSelect={() => actions.move(doc)}>Move to folder</DropdownItem>
      <DropdownItem icon={<MdOutlinePersonAddAlt />} onSelect={() => actions.share(doc)}>Share</DropdownItem>
      <DropdownSeparator />
      <DropdownItem icon={<MdDeleteOutline />} variant="danger" onSelect={() => actions.trash(doc)}>Move to trash</DropdownItem>
    </Dropdown>
  )
}
