// Layer 2: find concurrent branches in the Automerge change history and package conflict pairs.
// Pure functions (no React, no network), so the browser app and the Node tests share them.
import * as A from "@automerge/automerge"

// The document text carries block markers (U+FFFC) between paragraphs; treat them as line breaks.
// Same length, so character offsets are unchanged.
const flat = text => text.replace(/\uFFFC/g, "\n")
const segmenter = new Intl.Segmenter("en", { granularity: "sentence" })
const sentences = text => [...segmenter.segment(flat(text))].map(s => s.segment.trim()).filter(Boolean)

function buildFork(doc, fHeads, changes, byHash) {
  const ancestors = hash => {
    const seen = new Set()
    const stack = [hash]
    while (stack.length) {
      const current = stack.pop()
      if (seen.has(current)) continue
      seen.add(current)
      const c = byHash.get(current)
      if (c?.deps) stack.push(...c.deps)
    }
    return seen
  }

  // The base is the newest state every branch has in common.
  const sets = fHeads.map(ancestors)
  const common = [...sets[0]].filter(hash => sets.every(set => set.has(hash)))
  const baseHeads = common.filter(hash => !changes.some(change => common.includes(change.hash) && change.deps.includes(hash)))

  return {
    heads: fHeads,
    base: A.view(doc, baseHeads).text,
    merged: A.view(doc, fHeads).text,
    // author is the change message when the peer set one (the demo does); otherwise the actor id.
    branches: fHeads.map(head => ({
      actor: byHash.get(head)?.actor,
      author: byHash.get(head)?.message ?? null,
      text: A.view(doc, [head]).text,
    })),
  }
}

// Two or more heads mean branches were edited concurrently and no later change has joined them.
// Returns the common base text, the merged text and each branch's text and author, or null.
export function detectFork(doc) {
  const heads = A.getHeads(doc)
  if (heads.length < 2) return null

  const changes = A.getAllChanges(doc).map(change => A.decodeChange(change))
  const byHash = new Map(changes.map(change => [change.hash, change]))
  return buildFork(doc, heads, changes, byHash)
}

// Finds all concurrent forks in the document: open forks (heads.length >= 2) and merged forks in history.
export function detectForks(doc) {
  if (!doc) return []
  const heads = A.getHeads(doc)
  const changes = A.getAllChanges(doc).map(change => A.decodeChange(change))
  const byHash = new Map(changes.map(change => [change.hash, change]))

  const forkHeadSets = []
  if (heads.length >= 2) {
    forkHeadSets.push(heads)
  }
  for (const c of changes) {
    if (c.deps && c.deps.length >= 2) {
      forkHeadSets.push(c.deps)
    }
  }

  const seenSets = new Set()
  const uniqueForks = []
  for (const hSet of forkHeadSets) {
    const key = [...hSet].sort().join(":")
    if (seenSets.has(key)) continue
    seenSets.add(key)
    uniqueForks.push(hSet)
  }

  return uniqueForks.map(fHeads => buildFork(doc, fHeads, changes, byHash))
}

// A sentence changed by two different branches is a conflict candidate:
// [{ original, merged, versions: [{ authorId, text }, { authorId, text }] }]
// Limitation: branches whose sentence count differs from the base are skipped.
export function extractConflicts(fork) {
  const base = sentences(fork.base)
  const branches = fork.branches.map(branch => sentences(branch.text))
  if (!branches.every(list => list.length === base.length)) return []
  const mergedList = sentences(fork.merged)

  const pairs = []
  base.forEach((original, i) => {
    const changed = branches.map((list, branch) => ({ branch, text: list[i] })).filter(entry => entry.text !== original)
    for (let x = 0; x < changed.length; x++) {
      for (let y = x + 1; y < changed.length; y++) {
        pairs.push({
          original,
          merged: mergedList[i] ?? null,
          versions: [changed[x], changed[y]].map(({ branch, text }) => ({
            authorId: fork.branches[branch].author ?? fork.branches[branch].actor,
            text,
          })),
        })
      }
    }
  })
  return pairs
}

// Locates a conflicting or merged sentence in a ProseMirror document.
// Returns { from, to } or null if not found.
export function locateSentence(doc, { merged, original, versions } = {}) {
  if (!doc) return null
  const candidates = []

  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true
    for (const s of segmenter.segment(node.textContent)) {
      const text = s.segment.trim()
      if (!text) continue
      const leading = s.segment.match(/^\s*/)[0].length
      const from = pos + 1 + s.index + leading
      const to = from + text.length

      let score = 0
      if (merged && text === merged.trim()) score += 1000
      else if (merged && (text.includes(merged.trim()) || merged.trim().includes(text))) score += 500
      if (original && text === original.trim()) score += 800

      const wordsOf = t => new Set((t || "").toLowerCase().match(/\w+/g) || [])
      const textWords = wordsOf(text)
      const targetWords = wordsOf(merged || original)
      let common = 0
      for (const w of targetWords) {
        if (textWords.has(w)) common++
      }
      const overlap = targetWords.size ? common / targetWords.size : 0
      score += overlap * 100

      if (versions?.length) {
        for (const v of versions) {
          const vWords = wordsOf(v.text)
          let vCommon = 0
          for (const w of vWords) if (textWords.has(w)) vCommon++
          score += (vWords.size ? vCommon / vWords.size : 0) * 50
        }
      }

      candidates.push({ from, to, score })
    }
    return false
  })

  candidates.sort((a, b) => b.score - a.score)
  return candidates[0]?.score > 30 ? { from: candidates[0].from, to: candidates[0].to } : null
}
