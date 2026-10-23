// Local rule-based grammar check: subject-verb agreement after common plural nouns, and
// "a"/"an" before the next word. Deliberately small and explainable. Issues are advisory,
// except inside a freshly merged sentence, where clear errors are fixed as part of the merge.

const PLURAL_SUBJECTS = "results|figures|numbers|findings|customers|users|sales|metrics|regions|teams|costs|prices|margins|reviews|tests|surveys"
const SINGULAR_TO_PLURAL = {
  shows: "show",
  is: "are",
  was: "were",
  has: "have",
  does: "do",
  indicates: "indicate",
  suggests: "suggest",
  remains: "remain",
  seems: "seem",
  appears: "appear",
  confirms: "confirm",
}

const PATTERN = new RegExp(`\\b(?:the|these|those|our|their|all)\\s+(${PLURAL_SUBJECTS})\\s+(${Object.keys(SINGULAR_TO_PLURAL).join("|")})\\b`, "gi")

function matchCase(source, replacement) {
  return source[0] === source[0].toUpperCase() ? replacement[0].toUpperCase() + replacement.slice(1) : replacement
}

// "an" before a consonant sound or "a" before a vowel sound. Words starting with h, u or "one"
// are skipped because their sound varies (an hour, a unit, a one-off).
const ARTICLE = /\b(an|a)\s+([a-z]+)/gi
function articleFix(article, word) {
  const lower = word.toLowerCase()
  if (/^(h|u|one)/.test(lower)) return null
  const vowel = /^[aeio]/.test(lower)
  if (article.toLowerCase() === "an" && !vowel) return matchCase(article, "a")
  if (article.toLowerCase() === "a" && vowel) return matchCase(article, "an")
  return null
}

// The same word twice in a row ("quick quick"), as two identical concurrent edits produce.
const REPEATED = /\b([a-z]+)\s+\1\b/gi

// Returns [{ from, to, text, replacement, rule, message, key }] in ProseMirror positions.
export function findGrammarIssues(doc) {
  const found = []
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true
    const text = node.textContent
    for (const match of text.matchAll(REPEATED)) {
      const [whole, word] = match
      found.push({
        from: pos + 1 + match.index,
        to: pos + 1 + match.index + whole.length,
        text: whole,
        replacement: word,
        rule: "Repeated word",
        message: `“${word}” appears twice in a row.`,
        key: `${whole}|${text.slice(Math.max(0, match.index - 24), match.index)}`,
      })
    }
    for (const match of text.matchAll(ARTICLE)) {
      const [whole, article, word] = match
      const fixed = articleFix(article, word)
      if (!fixed) continue
      found.push({
        from: pos + 1 + match.index,
        to: pos + 1 + match.index + whole.length,
        text: whole,
        replacement: `${fixed} ${word}`,
        rule: "Article",
        message: `Use “${fixed}” before “${word}”.`,
        key: `${whole}|${text.slice(Math.max(0, match.index - 24), match.index)}`,
      })
    }
    for (const match of text.matchAll(PATTERN)) {
      const [, noun, verb] = match
      const start = match.index + match[0].indexOf(noun)
      const end = match.index + match[0].length
      const fixed = matchCase(verb, SINGULAR_TO_PLURAL[verb.toLowerCase()])
      found.push({
        from: pos + 1 + start,
        to: pos + 1 + end,
        text: text.slice(start, end),
        replacement: `${noun} ${fixed}`,
        rule: "Subject-verb agreement",
        message: `“${noun}” is plural, so the verb should be “${fixed}”.`,
        // Identifies the same mistake across re-checks (and remembers a dismissal).
        key: `${text.slice(start, end)}|${text.slice(Math.max(0, start - 24), start)}`,
      })
    }
    return false
  })
  return found
}
