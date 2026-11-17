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
  const common = new Set([...sets[0]].filter(hash => sets.every(set => set.has(hash))))
  // Heads of the common part: common changes that no other common change depends on.
  // Sets, not nested array scans: histories grow to thousands of changes.
  const hasCommonChild = new Set()
  for (const hash of common) for (const dep of byHash.get(hash)?.deps ?? []) hasCommonChild.add(dep)
  const baseHeads = [...common].filter(hash => !hasCommonChild.has(hash))

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

// Aligns two sentence lists by their longest common subsequence. Unchanged sentences anchor the
// alignment; everything between anchors is one changed region: base sentences [from, to) became
// `sentences` (empty `from === to` means an insertion). Handles added, removed and reordered text.
function changedRegions(base, other) {
  const lcs = Array.from({ length: base.length + 1 }, () => new Array(other.length + 1).fill(0))
  for (let i = base.length - 1; i >= 0; i--)
    for (let j = other.length - 1; j >= 0; j--)
      lcs[i][j] = base[i] === other[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])

  const regions = []
  let i = 0
  let j = 0
  let open = null
  const close = () => {
    if (open) regions.push({ ...open, to: i, sentences: other.slice(open.otherFrom, j) })
    open = null
  }
  while (i < base.length || j < other.length) {
    if (i < base.length && j < other.length && base[i] === other[j]) {
      close()
      i++
      j++
      continue
    }
    open ??= { from: i, otherFrom: j }
    if (j < other.length && (i === base.length || lcs[i][j + 1] >= lcs[i + 1][j])) j++
    else i++
  }
  close()
  return regions
}

// The text a branch has for base sentences [from, to): its own replacements, base text elsewhere.
function textFor(base, regions, from, to) {
  const out = []
  for (let i = from; i < to; ) {
    const region = regions.find(r => r.from <= i && i < r.to)
    if (region) {
      out.push(...region.sentences)
      i = region.to
    } else out.push(base[i++])
  }
  return out.join(" ")
}

// Base sentences changed by two different branches are a conflict candidate:
// [{ original, merged, versions: [{ authorId, text }, { authorId, text }] }]
// Sentences are aligned (not compared by position), so a branch that adds or removes a
// sentence elsewhere still pairs up correctly. A region covering several sentences is
// reported as one passage.
export function extractConflicts(fork) {
  const base = sentences(fork.base)
  const edits = fork.branches.map(branch => changedRegions(base, sentences(branch.text)))
  const mergedRegions = changedRegions(base, sentences(fork.merged))
  // Pure insertions touch the sentence they were added before (or the last one at the end).
  const span = r => (r.to > r.from ? [r.from, r.to] : [Math.min(r.from, base.length - 1), Math.min(r.from, base.length - 1) + 1])

  const pairs = []
  for (let x = 0; x < edits.length; x++) {
    for (let y = x + 1; y < edits.length; y++) {
      for (const a of edits[x]) {
        for (const b of edits[y]) {
          const [aFrom, aTo] = span(a)
          const [bFrom, bTo] = span(b)
          if (aFrom >= bTo || bFrom >= aTo || aFrom < 0) continue
          const from = Math.min(aFrom, bFrom)
          const to = Math.max(aTo, bTo)
          // Widen each branch's own regions to the shared passage so both texts cover the same base.
          const widen = regions => regions.map(r => {
            if (r.to > r.from) return r
            if (r.from < base.length) return { ...r, to: r.from + 1, sentences: [...r.sentences, base[r.from]] }
            return { ...r, from: base.length - 1, to: base.length, sentences: [base[base.length - 1], ...r.sentences] }
          })
          pairs.push({
            original: base.slice(from, to).join(" "),
            merged: textFor(base, widen(mergedRegions), from, to) || null,
            versions: [[x, a], [y, b]].map(([branch]) => ({
              authorId: fork.branches[branch].author ?? fork.branches[branch].actor,
              text: textFor(base, widen(edits[branch]), from, to),
            })),
          })
        }
      }
    }
  }
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
