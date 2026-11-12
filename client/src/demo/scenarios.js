// Evaluator demo scenarios. Simulation lives here only; it drives the app through public APIs
// (Automerge handle, editor transactions, presence, network pause, semantic actions).
import * as A from "@automerge/automerge"
import { COLLABORATORS } from "../lib/collaborators.js"
import { setNetworkPaused } from "../lib/repo.js"
import { contextOf, resolutionField } from "../components/semantic/sharedResolutions.js"
import { detectFork, extractConflicts } from "../components/semantic/concurrency.js"

// One scenario per demo document: the two problem examples from the project slides.
// `anchor` is a phrase neither edit touches, used to find the sentence after merging;
// `afterHeading` instead names the heading whose next paragraph is the sentence.
// `grammarMerge` is a second sentence where two correct edits merge into a clear grammar
// error ("an rise"), which is fixed automatically as part of the merge.
// An edit is { at, remove, insert }: at the first occurrence of `at` in the sentence,
// delete `remove` and insert `insert`. Two such edits are made concurrently and merged.
export const SCENARIOS = {
  // Two compatible-looking word swaps merge into a contradiction.
  "market-demand": {
    original: "The current financial indicators show that market demand is stable and level.",
    anchor: "indicators show that market demand is", // untouched by both edits
    edits: [
      { at: "stable", remove: "stable", insert: "skyrocketing" },
      { at: "level", remove: "level", insert: "plummeting" },
    ],
    grammarMerge: {
      original: "Analysts expect an early increase in orders next quarter.",
      anchor: "in orders next quarter",
      edits: [
        { at: "early ", remove: "early ", insert: "" },
        { at: "increase", remove: "increase", insert: "rise" },
      ],
    },
  },
  // Both people add "quick" at the same place: the merge reads "The quick quick brown fox.",
  // flagged as a grammar suggestion for people to review.
  "brown-fox": {
    original: "The brown fox.",
    afterHeading: "The Quick Brown Fox",
    edits: [
      { at: " brown", remove: "", insert: " quick" },
      { at: " brown", remove: "", insert: " quick" },
    ],
  },
}

const GRAMMAR_SENTENCE = " The numbers shows the same pattern in every region."

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
const peerId = authorId => `demo-${authorId}`

function findText(doc, needle) {
  let found = null
  doc.descendants((node, pos) => {
    if (found || !node.isTextblock) return !found
    const index = node.textContent.indexOf(needle)
    if (index >= 0) found = { from: pos + 1 + index, to: pos + 1 + index + needle.length, node, pos }
    return false
  })
  return found
}

// The scenario sentence wherever it is now (original, edited or merged): the sentence around
// the scenario's anchor, a phrase neither edit touches.
function locateSentence(doc, scenario) {
  if (scenario.afterHeading) return paragraphAfter(doc, scenario.afterHeading)
  const hit = findText(doc, scenario.anchor)
  if (!hit) return null
  const text = hit.node.textContent
  const anchorIndex = text.indexOf(scenario.anchor)
  const previousStop = text.lastIndexOf(". ", anchorIndex)
  const start = previousStop >= 0 ? previousStop + 2 : 0
  const stop = text.indexOf(".", anchorIndex + scenario.anchor.length)
  const end = stop >= 0 ? stop + 1 : text.length
  return { from: hit.pos + 1 + start, to: hit.pos + 1 + end }
}

function paragraphAfter(doc, headingText) {
  let seen = false
  let found = null
  doc.descendants((node, pos) => {
    if (found || !node.isTextblock) return !found
    if (seen) found = { from: pos + 1, to: pos + 1 + node.content.size }
    else seen = node.type.name === "heading" && node.textContent === headingText
    return false
  })
  return found
}

function scrollToRange(editor, range) {
  const { node } = editor.view.domAtPos(range.from)
  const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node
  element?.scrollIntoView({ block: "start" })
}

function placeCollaborator({ presence }, authorId, from, to = from) {
  presence.simulatePeer(peerId(authorId), COLLABORATORS[authorId], from, to)
}

// Puts the original sentence back so a scenario can run (or rerun). Returns its range or null.
function restoreOriginal({ editor }, scenario) {
  const { view } = editor
  if (!findText(view.state.doc, scenario.original)) {
    const range = locateSentence(view.state.doc, scenario)
    if (!range) return null
    view.dispatch(view.state.tr.insertText(scenario.original, range.from, range.to))
  }
  const restored = findText(view.state.doc, scenario.original)
  return restored && { from: restored.from, to: restored.to }
}

// A collaborator's edit made on their own copy, starting from the same heads as everyone else.
// The change message records who made it, which Layer 2 reads back from the change history.
function forkWithEdit(handle, scenario, edit, authorId) {
  return A.change(A.clone(handle.doc()), { message: authorId }, doc => {
    const index = doc.text.indexOf(scenario.original) + scenario.original.indexOf(edit.at)
    A.splice(doc, ["text"], index, edit.remove.length, edit.insert)
  })
}

// Layer 2 → 3: the concurrent versions come from the document's change history, not from the script.
// `authors` is the expected order of the two people; this tab's own edits carry no message, so they
// are recognised by this tab's actor id.
function analyse(context, scenario, authors, options) {
  const { handle, semantic } = context
  const fork = detectFork(handle.doc())
  const conflict = fork && extractConflicts(fork).find(found => found.original === scenario.original)
  if (!conflict) return null // no concurrent edit to this sentence, so nothing to analyse
  const localActor = A.getActorId(handle.doc())
  const versions = conflict.versions
    .map(version => ({ ...version, authorId: version.authorId === localActor ? authors[0] : version.authorId }))
    .sort((a, b) => authors.indexOf(a.authorId) - authors.indexOf(b.authorId))
  return semantic.actions.analyzeConflict(
    { versions, original: conflict.original, locate: doc => locateSentence(doc, scenario) },
    options
  )
}

export function simulateCollaboratorsJoining(context, scenario) {
  const doc = context.editor.view.state.doc
  const target = (scenario && locateSentence(doc, scenario)) ?? { from: 1, to: 1 }
  placeCollaborator(context, "atika", target.from + 4)
  placeCollaborator(context, "ibrahim", target.to)
}

export function simulateCollaboratorsLeaving({ presence }) {
  presence.removePeer(peerId("atika"))
  presence.removePeer(peerId("ibrahim"))
}

// Both online: Atika and Ibrahim edit the same sentence at the same moment. Their changes are
// concurrent (neither includes the other), the CRDT merges them, and the result is analysed.
export async function runOnlineScenario(context, scenario, options) {
  const { editor, handle } = context
  const start = restoreOriginal(context, scenario)
  if (!start) return "missing"
  scrollToRange(editor, start)

  placeCollaborator(context, "atika", start.from, start.to)
  placeCollaborator(context, "ibrahim", start.from, start.to)
  await wait(1200)

  const atika = forkWithEdit(handle, scenario, scenario.edits[0], "atika")
  const ibrahim = forkWithEdit(handle, scenario, scenario.edits[1], "ibrahim")
  handle.update(doc => A.merge(A.merge(doc, atika), ibrahim))

  await wait(50) // let the merge reach the editor
  const merged = locateSentence(editor.view.state.doc, scenario)
  if (merged) {
    placeCollaborator(context, "atika", merged.to)
    placeCollaborator(context, "ibrahim", merged.to)
  }
  await analyse(context, scenario, ["atika", "ibrahim"], options)
  return "ok"
}

// Offline, then online: this tab loses its connection and you edit the sentence while Ibrahim's
// edit to the same sentence reaches the server. On reconnect both changes merge and are analysed.
export async function runOfflineScenario(context, scenario, options, localAuthorId) {
  const { editor, handle } = context
  const start = restoreOriginal(context, scenario)
  if (!start) return "missing"
  scrollToRange(editor, start)
  placeCollaborator(context, "ibrahim", start.to)

  setNetworkPaused(true)
  await wait(1000)

  // Ibrahim's change starts from the same version, on his own copy.
  const ibrahim = forkWithEdit(handle, scenario, scenario.edits[1], "ibrahim")

  // Your edit while offline: a normal editor transaction, saved on this device only.
  const edit = scenario.edits[0]
  const offset = scenario.original.indexOf(edit.at)
  editor.view.dispatch(editor.view.state.tr.insertText(edit.insert, start.from + offset, start.from + offset + edit.remove.length))
  await wait(2500)

  setNetworkPaused(false)
  handle.update(doc => A.merge(doc, ibrahim)) // Ibrahim's waiting change arrives on reconnect
  await wait(50)
  const merged = locateSentence(editor.view.state.doc, scenario)
  if (merged) placeCollaborator(context, "ibrahim", merged.to)
  await analyse(context, scenario, [localAuthorId, "ibrahim"], options)
  return "ok"
}

// Back to the starting point: original sentence, no results, nobody else here, back online.
export function resetScenario(context, scenario) {
  setNetworkPaused(false)
  simulateCollaboratorsLeaving(context)
  const restored = scenario ? restoreOriginal(context, scenario) : true
  if (scenario?.grammarMerge) restoreOriginal(context, scenario.grammarMerge)
  context.semantic.actions.clearIssues()
  return Boolean(restored)
}

// Adds a sentence with a subject-verb agreement mistake at the end of the current paragraph.
export function insertGrammarIssue({ editor }) {
  const { view } = editor
  view.dispatch(view.state.tr.insertText(GRAMMAR_SENTENCE, view.state.selection.$from.end()).scrollIntoView())
}

// Atika and you resolve the same open issue at the same moment, from the same version.
// Her change (text + shared resolution record) is made on her own copy, yours through the
// normal action, then they merge: the latest resolution wins and the text is repaired once.
export function simulateSimultaneousResolve({ editor, handle, semantic }) {
  const open = semantic.getSnapshot().issues.filter(i => i.status === "open")
  const issue = open.find(i => i.kind === "conflict") ?? open[0]
  if (!issue) return "none"
  const doc = editor.view.state.doc
  const context = contextOf(doc, issue.from, issue.to)
  const { prefix, suffix } = context
  const conflict = issue.kind === "conflict"
  const theirs = conflict ? issue.conflict.versions[0] : null
  const choice = conflict ? theirs.text : issue.grammar.replacement
  const label = conflict ? "Kept Atika’s version" : `Changed to “${choice}”`

  const atika = A.change(A.clone(handle.doc()), d => {
    const index = d.text.indexOf(prefix + issue.text + suffix) + prefix.length
    A.splice(d, ["text"], index, issue.text.length, choice)
    d[resolutionField(issue)] = { choice, label, by: "atika", byName: "Atika", at: Date.now() - 500, ...context }
  })

  if (conflict) {
    const yours = issue.conflict.versions[1]
    semantic.actions.keepText(issue, yours.text, "Kept the second version")
  } else {
    semantic.actions.applyGrammar(issue)
  }
  handle.update(current => A.merge(current, atika))
  return "ok"
}
