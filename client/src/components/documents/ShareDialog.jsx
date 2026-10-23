import { useState } from "react"
import { MdLink, MdLockOutline, MdPublic } from "react-icons/md"
import { Dialog, DialogClose } from "../ui/Dialog.jsx"
import { Button } from "../ui/Button.jsx"
import { Select } from "../ui/Select.jsx"
import { Avatar } from "../ui/Avatar.jsx"
import { useToast } from "../ui/Toast.jsx"
import { COLLABORATORS } from "../../lib/collaborators.js"
import { getDocument, shareLink } from "../../lib/documents.js"

const PERMISSIONS = [
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
]

const ACCESS = [
  { value: "restricted", label: "Restricted" },
  { value: "link", label: "Anyone with the link" },
]

const PEOPLE = [
  [COLLABORATORS.eshaal, "eshaal.r@lhr.nu.edu.pk", "owner"],
  [COLLABORATORS.atika, "atika.h@lhr.nu.edu.pk", "editor"],
  [COLLABORATORS.ibrahim, "ibrahim.f@lhr.nu.edu.pk", "editor"],
]

// Demo share dialog: people with access, invite by email, Editor/Viewer, copy link.
export function ShareDialog({ documentTitle, documentId, open, onOpenChange, trigger }) {
  const toast = useToast()
  const [access, setAccess] = useState("restricted")

  async function copyLink() {
    const doc = getDocument(documentId)
    const url = doc ? shareLink(doc) : location.href
    try {
      await navigator.clipboard.writeText(url)
      toast("Link copied")
    } catch {
      toast("Couldn’t copy the link. Copy it from the address bar instead.")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      title={`Share “${documentTitle}”`}
      footer={
        <div className="share-footer">
          <Button variant="secondary" onClick={copyLink}><MdLink />Copy link</Button>
          <DialogClose asChild><Button variant="primary">Done</Button></DialogClose>
        </div>
      }
    >
      <input className="input share-add" type="email" placeholder="Add people by email" aria-label="Add people by email" />
      <section>
        <h3 className="share-heading">People with access</h3>
        {PEOPLE.map(([user, email, role]) => (
          <div className="share-person" key={user.id}>
            <Avatar user={user} size="lg" />
            <div className="share-person-name">
              <div>{user.fullName}{role === "owner" && " (you)"}</div>
              <div className="field-help">{email}</div>
            </div>
            {role === "owner" ? (
              <span className="share-role">Owner</span>
            ) : (
              <Select label={`Permission for ${user.name}`} defaultValue={role} options={PERMISSIONS} variant="ghost" size="sm" />
            )}
          </div>
        ))}
      </section>
      <section>
        <h3 className="share-heading">General access</h3>
        <div className="share-person">
          <span className="share-access-icon">{access === "restricted" ? <MdLockOutline /> : <MdPublic />}</span>
          <div className="share-person-name">
            <Select label="General access" value={access} onValueChange={setAccess} options={ACCESS} variant="ghost" size="sm" />
            <div className="field-help share-access-help">
              {access === "restricted" ? "Only people with access can open with the link" : "Anyone on the internet with the link can edit"}
            </div>
          </div>
        </div>
      </section>
    </Dialog>
  )
}
