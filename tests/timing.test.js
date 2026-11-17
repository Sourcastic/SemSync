import * as A from "@automerge/automerge"
import { detectFork, extractConflicts } from "../client/src/components/semantic/concurrency.js"

for (const n of [100, 500, 2000]) {
  let d = A.from({ text: "Market demand is stable and level. Costs fell in June." })
  for (let i = 0; i < n; i++) {
    d = A.change(d, { message: "u" }, x => A.splice(x, ["text"], 0, 0, "a"))
  }
  const a = A.change(A.clone(d), { message: "atika" }, x =>
    A.updateText(x, ["text"], x.text.replace("stable", "skyrocketing")))
  const b = A.change(A.clone(d), { message: "ibrahim" }, x =>
    A.updateText(x, ["text"], x.text.replace("level", "plummeting")))
  const merged = A.merge(A.clone(a), b)

  const runs = []
  for (let r = 0; r < 5; r++) {
    const t = performance.now()
    extractConflicts(detectFork(merged))
    runs.push(performance.now() - t)
  }
  runs.sort((x, y) => x - y)
  console.log(`${n} changes: median ${runs[2].toFixed(1)} ms, worst ${runs[4].toFixed(1)} ms`)
}