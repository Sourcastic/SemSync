// Fallback heuristic on the same benchmark test split as nlp/benchmark.py, for comparison.
//   node tests/heuristic.bench.js
// The heuristic only says "contradiction" or "neutral" (it never predicts entailment).
import { readFileSync } from "node:fs"
import { localClassify } from "../client/src/components/semantic/analysis.js"

const pairs = readFileSync(new URL("../nlp/benchmark.jsonl", import.meta.url), "utf8")
  .split("\n").filter(Boolean).map(line => JSON.parse(line))
  .filter(pair => pair.split === "test")

let tp = 0, fp = 0, fn = 0, correct = 0
const misses = []
for (const pair of pairs) {
  const predicted = localClassify(pair.a, pair.b).classification
  const isC = predicted === "contradiction"
  const shouldC = pair.label === "contradiction"
  if (isC && shouldC) tp++
  if (isC && !shouldC) fp++
  if (!isC && shouldC) fn++
  if (predicted === pair.label) correct++
  else misses.push(`${pair.id}: expected ${pair.label}, got ${predicted}`)
}
const precision = tp + fp ? tp / (tp + fp) : 0
const recall = tp + fn ? tp / (tp + fn) : 0
const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0
console.log(`Fallback heuristic, test split (n=${pairs.length})`)
console.log(`  3-class accuracy        ${(correct / pairs.length).toFixed(3)}`)
console.log(`  contradiction precision ${precision.toFixed(3)}`)
console.log(`  contradiction recall    ${recall.toFixed(3)}  (${tp} of ${tp + fn} found)`)
console.log(`  contradiction F1        ${f1.toFixed(3)}`)
console.log(`  contradictions found: ${tp} of ${tp + fn}; false conflicts: ${fp} of ${pairs.length - tp - fn} non-contradictions`)
