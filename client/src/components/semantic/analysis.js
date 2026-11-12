// Meaning-conflict analysis (Layer 3). Asks the NLI service when one is configured
// (VITE_NLP_URL, POST /analyze { premise, hypothesis } → { label, score, model }), otherwise
// falls back to a small local heuristic so the demo works offline. The result always says
// which one produced it, so the evaluator can tell.

const NLP_URL = import.meta.env?.VITE_NLP_URL // optional chaining: Node scripts have no import.meta.env
const TIMEOUT_MS = 8000

// Opposing direction words. Deliberately tiny: the real classifier is the NLI service.
const OPPOSITES = [
  ["increase", "decline"], ["increase", "decrease"], ["increase", "fall"], ["rise", "fall"], ["rise", "decline"],
  ["grow", "shrink"], ["growth", "decline"], ["up", "down"], ["higher", "lower"], ["more", "fewer"],
  ["stable", "volatile"], ["gain", "loss"], ["improve", "worsen"], ["profit", "loss"],
  ["skyrocket", "plummet"], ["soar", "plunge"], ["surge", "collapse"], ["boom", "crash"], ["skyrocket", "plunge"], ["soar", "plummet"],
]

// The span of `original` a version replaced, and what it put there.
function diff(original, text) {
  let start = 0
  while (start < original.length && start < text.length && original[start] === text[start]) start++
  let end = 0
  while (end < original.length - start && end < text.length - start && original[original.length - 1 - end] === text[text.length - 1 - end]) end++
  return { from: start, to: original.length - end, inserted: text.slice(start, text.length - end) }
}

// One person adds words right where the other deletes the words they describe
// ("quick" added before "brown fox", which the other person removes): the merge keeps the
// addition but loses what it referred to, leaving a sentence that no longer reads correctly.
function danglingAddition(original, [first, second]) {
  const a = diff(original, first)
  const b = diff(original, second)
  const isInsert = d => d.from === d.to && d.inserted.trim() !== ""
  const isDelete = d => d.to > d.from && d.inserted.trim() === ""
  const touches = (ins, del) => ins.from >= del.from - 1 && ins.from <= del.to + 1
  return (isInsert(a) && isDelete(b) && touches(a, b)) || (isInsert(b) && isDelete(a) && touches(b, a))
}

const stems = text => new Set(text.toLowerCase().match(/[a-z]+/g)?.map(word => word.replace(/(ing|es|s|d|ed)$/, "")) ?? [])

export function localClassify(premise, hypothesis, original) {
  if (original && danglingAddition(original, [premise, hypothesis])) return { classification: "incoherent", confidence: 0.78 }
  const a = stems(premise)
  const b = stems(hypothesis)
  const has = (set, word) => set.has(word) || set.has(word.replace(/(ing|es|s|d|ed)$/, ""))
  const opposed = OPPOSITES.some(([x, y]) => (has(a, x) && has(b, y)) || (has(a, y) && has(b, x)))
  if (opposed) return { classification: "contradiction", confidence: 0.82 }
  return { classification: "neutral", confidence: 0.6 }
}

async function serviceClassify(premise, hypothesis) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(`${NLP_URL.replace(/\/$/, "")}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ premise, hypothesis }),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`NLI service responded ${response.status}`)
    const { label, score, model } = await response.json()
    return { classification: String(label).toLowerCase(), confidence: Number(score), model: model ? `NLI service (${model})` : "NLI service" }
  } finally {
    clearTimeout(timer)
  }
}

// versions: [{ authorId, text }, { authorId, text }]; original: the sentence both started from.
// Classifications: "contradiction" | "incoherent" | "neutral". Throws when analysis is unavailable.
export async function analyzeConcurrentEdits(versions, { original, simulateFailure = false } = {}) {
  if (simulateFailure) throw new Error("Semantic analysis is unavailable")
  const [premise, hypothesis] = versions.map(version => version.text)
  if (NLP_URL) {
    // NLI judges meaning; an addition left without the words it described is a structural problem it is not built for.
    if (original && danglingAddition(original, [premise, hypothesis])) {
      return { classification: "incoherent", confidence: 0.78, model: "Rule: addition left without its target" }
    }
    try {
      return await serviceClassify(premise, hypothesis)
    } catch (error) {
      console.warn("NLI service call failed, falling back to local heuristic:", error.message)
      return { ...localClassify(premise, hypothesis, original), model: "Local heuristic (NLI service unreachable)" }
    }
  }
  // Give the "Analyzing…" state a visible moment, as a real round trip would.
  await new Promise(resolve => setTimeout(resolve, 700))
  return { ...localClassify(premise, hypothesis, original), model: "Local heuristic (NLI service not configured)" }
}
