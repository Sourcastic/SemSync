// Links workspace metadata to Automerge documents and seeds first-run content.
import { useEffect, useState } from "react"
import * as A from "@automerge/automerge"
import { pmNodeToSpans } from "@automerge/prosemirror"
import { repo } from "./repo.js"
import { schema, schemaAdapter } from "../components/editor/schema.js"
import { getDocument, updateDocument, reloadDocuments, adoptSharedDocument } from "./documents.js"
import { isValidAutomergeUrl } from "@automerge/automerge-repo"

const TEXT_PATH = ["text"]

// Seeds are written as ProseMirror nodes and converted with the binding's own pmNodeToSpans,
// so block markers use exactly the representation the sync plugin expects.
const { doc: docNode, paragraph, heading, bullet_list, list_item } = schema.nodes
const p = value => paragraph.create(null, value ? schema.text(value) : null)
const h = (level, value) => heading.create({ level }, schema.text(value))
const bullets = items => bullet_list.create(null, items.map(item => list_item.create(null, p(item))))

// Demo content. The scenario sentences are rewritten by src/demo/scenarios.js; each document
// Market Demand also carries one subject-verb agreement mistake; the fox document is only its example.
const SEED_CONTENT = {
  "market-demand": () => [
    h(1, "Market Demand Analysis"),
    p("Prepared for the quarterly review. Figures are preliminary and will be updated after regional sales close."),
    h(2, "Current indicators"),
    p("The current financial indicators show that market demand is stable and level."),
    p("Analysts expect an early increase in orders next quarter."),
    p("Regional sales recovered through the third quarter, led by replacement purchases in urban markets."),
    h(2, "Customer research"),
    p("The figures shows a clear rise in repeat purchases after the pricing change."),
    bullets([
      "Repeat purchases rose in all three regions.",
      "Support tickets about pricing fell by a third.",
    ]),
  ],
  "brown-fox": () => [
    h(1, "The Quick Brown Fox"),
    p("The brown fox."),
  ],
}

function seedFor(meta) {
  const blocks = SEED_CONTENT[meta.id]?.() ?? (meta.excerpt ? [h(1, meta.title), p(meta.excerpt)] : [p()])
  return pmNodeToSpans(schemaAdapter, docNode.create(null, blocks))
}

async function openHandle(id, shared) {
  reloadDocuments() // another tab may have created this document's content already
  if (shared?.automergeUrl && isValidAutomergeUrl(shared.automergeUrl)) adoptSharedDocument(id, shared)
  const meta = getDocument(id)
  if (!meta) throw new Error("not-found")
  if (meta.automergeUrl) return repo.find(meta.automergeUrl)

  const handle = repo.create({ text: "" })
  handle.change(doc => A.updateSpans(doc, TEXT_PATH, seedFor(meta)))
  // Record the link only once the document is safely in local storage.
  await repo.flush([handle.documentId])
  updateDocument(id, { automergeUrl: handle.url })
  return handle
}

// { status: "loading" | "ready" | "error", handle?, error? }
// shared: { automergeUrl, title, ownerId } from a share link, if the document was opened through one.
export function useDocumentHandle(id, shared) {
  const [result, setResult] = useState({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    setResult({ status: "loading" })
    openHandle(id, shared).then(
      handle => !cancelled && setResult({ status: "ready", handle }),
      error => !cancelled && setResult({ status: "error", error: error.message === "not-found" ? "not-found" : "unavailable" })
    )
    return () => {
      cancelled = true
    }
  }, [id, shared?.automergeUrl])

  return result
}
