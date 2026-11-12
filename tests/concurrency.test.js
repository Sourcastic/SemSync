// Headless Layer 2 verification: two replicas edit the same base concurrently, merge, and the
// detector must find the fork and package the conflicting sentence. No server or browser needed.
//   node tests/concurrency.test.js
import assert from "node:assert/strict"
import * as A from "@automerge/automerge"
import { detectFork, detectForks, extractConflicts } from "../client/src/components/semantic/concurrency.js"

function scenario(base, editA, editB) {
  const start = A.from({ text: base })
  const a = A.change(A.clone(start), { message: "atika" }, doc => A.updateText(doc, ["text"], editA))
  const b = A.change(A.clone(start), { message: "ibrahim" }, doc => A.updateText(doc, ["text"], editB))
  return A.merge(A.clone(a), b)
}

const cases = [
  { id: "TC-L2-01", name: "Contradictory word swaps in one sentence",
    base: "Market demand is stable and level.",
    a: "Market demand is skyrocketing and level.", b: "Market demand is stable and plummeting.",
    merged: "Market demand is skyrocketing and plummeting.", pairs: 1 },
  { id: "TC-L2-02", name: "Insert vs delete (dangling modifier)",
    base: "The brown fox.", a: "The quick brown fox.", b: "The .", merged: "The quick .", pairs: 1 },
  { id: "TC-L2-03", name: "Same insertion by both users",
    base: "The brown fox.", a: "The quick brown fox.", b: "The quick brown fox.", merged: "The quick quick brown fox.", pairs: 1 },
  { id: "TC-L2-04", name: "Edits in different sentences: no conflict",
    base: "Sales rose in May. Costs fell in June.",
    a: "Sales rose sharply in May. Costs fell in June.", b: "Sales rose in May. Costs fell slightly in June.",
    merged: "Sales rose sharply in May. Costs fell slightly in June.", pairs: 0 },
  { id: "TC-L2-05", name: "Only one user edits: no fork",
    base: "Hello world.", a: "Hello there world.", b: "Hello world.", merged: "Hello there world.", pairs: 0, fork: false },
]

let failed = 0
for (const c of cases) {
  try {
    const doc = scenario(c.base, c.a, c.b)
    assert.equal(doc.text, c.merged, "merged text")
    const fork = detectFork(doc)
    assert.equal(Boolean(fork), c.fork ?? true, "fork detected")
    const pairs = fork ? extractConflicts(fork) : []
    assert.equal(pairs.length, c.pairs, "pair count")
    if (c.pairs) {
      assert.equal(pairs[0].original, c.base, "original sentence")
      assert.deepEqual(pairs[0].versions.map(v => v.authorId).sort(), ["atika", "ibrahim"], "authors")
    }
    console.log(`PASS ${c.id} ${c.name}`)
  } catch (error) {
    failed++
    console.log(`FAIL ${c.id} ${c.name}: ${error.message}`)
  }
}

// Verification for joined forks in history:
try {
  const mergedDoc = scenario("Market demand is stable and level.", "Market demand is skyrocketing and level.", "Market demand is stable and plummeting.")
  const joinedDoc = A.change(mergedDoc, { message: "eshaal" }, doc => A.updateText(doc, ["text"], "Market demand is skyrocketing and plummeting!"))
  assert.equal(A.getHeads(joinedDoc).length, 1, "heads joined")
  const forks = detectForks(joinedDoc)
  assert.equal(forks.length, 1, "history fork detected")
  const pairs = extractConflicts(forks[0])
  assert.equal(pairs.length, 1, "pair count from history fork")
  assert.equal(pairs[0].original, "Market demand is stable and level.")
  console.log("PASS TC-L2-06 Joined fork detected in change history")
} catch (error) {
  failed++
  console.log(`FAIL TC-L2-06 Joined fork detected in change history: ${error.message}`)
}

console.log(failed ? `${failed} failed` : `All ${cases.length + 1} passed`)
process.exit(failed ? 1 : 0)
