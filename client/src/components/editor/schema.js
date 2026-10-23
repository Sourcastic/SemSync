// SemSync's ProseMirror schema, mapped onto the Automerge rich-text model.
// Starts from the binding's own basic schema and adds two real, synced formats:
//   - underline: an Automerge mark
//   - align: an attribute on paragraph/heading blocks
import { basicSchemaAdapter, SchemaAdapter } from "@automerge/prosemirror"

const ALIGNMENTS = ["left", "center", "right"]

function specsOf(orderedMap, skip) {
  const out = {}
  orderedMap.forEach((name, spec) => {
    if (!skip.includes(name)) out[name] = { ...spec }
  })
  return out
}

function alignStyle(align) {
  return ALIGNMENTS.includes(align) && align !== "left" ? { style: `text-align: ${align}` } : {}
}

function parseAlign(dom) {
  const align = dom.style.textAlign
  return ALIGNMENTS.includes(align) ? align : null
}

// Only write align when set: Automerge block attrs can't hold undefined.
function alignAttrs(node) {
  return node.attrs.align ? { align: node.attrs.align } : {}
}

const base = basicSchemaAdapter.schema.spec
const nodes = specsOf(base.nodes, ["unknownLeaf"])
const marks = specsOf(base.marks, ["unknownMark"])

nodes.paragraph = {
  ...nodes.paragraph,
  attrs: { ...nodes.paragraph.attrs, align: { default: null } },
  parseDOM: [{ tag: "p", getAttrs: dom => ({ align: parseAlign(dom) }) }],
  toDOM: node => ["p", alignStyle(node.attrs.align), 0],
  automerge: {
    block: "paragraph",
    attrParsers: {
      fromAutomerge: block => ({ align: block.attrs?.align ?? null }),
      fromProsemirror: alignAttrs,
    },
  },
}

nodes.heading = {
  ...nodes.heading,
  attrs: { ...nodes.heading.attrs, align: { default: null } },
  parseDOM: [1, 2, 3, 4, 5, 6].map(level => ({ tag: `h${level}`, getAttrs: dom => ({ level, align: parseAlign(dom) }) })),
  toDOM: node => [`h${node.attrs.level}`, alignStyle(node.attrs.align), 0],
  automerge: {
    block: "heading",
    attrParsers: {
      fromAutomerge: block => ({ level: block.attrs?.level ?? 1, align: block.attrs?.align ?? null }),
      fromProsemirror: node => ({ level: node.attrs.level, ...alignAttrs(node) }),
    },
  },
}

marks.underline = {
  parseDOM: [{ tag: "u" }, { style: "text-decoration=underline" }],
  toDOM: () => ["u", 0],
  automerge: { markName: "underline" },
}

export const schemaAdapter = new SchemaAdapter({ nodes, marks })
export const schema = schemaAdapter.schema
export { ALIGNMENTS }
