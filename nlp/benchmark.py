"""Layer 3 benchmark (Chapter 9).  python benchmark.py

Runs every pair in benchmark.jsonl through the NLI model with the same rule as main.py:
contradiction if max(P(C|A,B), P(C|B,A)) >= threshold, otherwise the stronger of entailment
and neutral. The threshold is tuned on the dev split only; the test split is reported at
the shipped threshold (0.5) and at the tuned one.
"""
import json
import statistics
import time
from pathlib import Path

import nli

LABELS = ["contradiction", "entailment", "neutral"]
SHIPPED_THRESHOLD = 0.5
pairs = [json.loads(line) for line in (Path(__file__).parent / "benchmark.jsonl").read_text(encoding="utf-8").splitlines() if line.strip()]

# Score every pair once; thresholds are applied afterwards.
latencies = []
for pair in pairs:
    started = time.perf_counter()
    forward, backward = nli.both_ways(pair["a"], pair["b"])
    latencies.append((time.perf_counter() - started) * 1000)
    pair["contradiction"] = max(forward["contradiction"], backward["contradiction"])
    pair["other"] = max(("entailment", "neutral"), key=lambda label: forward[label] + backward[label])


def predict(pair, threshold):
    return "contradiction" if pair["contradiction"] >= threshold else pair["other"]


def metrics(split, threshold):
    rows = [p for p in pairs if p["split"] == split]
    predicted = [predict(p, threshold) for p in rows]
    gold = [p["label"] for p in rows]
    tp = sum(g == "contradiction" and y == "contradiction" for g, y in zip(gold, predicted))
    fp = sum(g != "contradiction" and y == "contradiction" for g, y in zip(gold, predicted))
    fn = sum(g == "contradiction" and y != "contradiction" for g, y in zip(gold, predicted))
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    accuracy = sum(g == y for g, y in zip(gold, predicted)) / len(rows)
    matrix = {g: {y: sum(1 for a, b in zip(gold, predicted) if a == g and b == y) for y in LABELS} for g in LABELS}
    errors = [(p["id"], p["label"], y, round(p["contradiction"], 3)) for p, y in zip(rows, predicted) if p["label"] != y]
    return {"accuracy": accuracy, "precision": precision, "recall": recall, "f1": f1, "matrix": matrix, "errors": errors, "n": len(rows)}


def show(title, m, threshold):
    print(f"\n{title} (threshold {threshold}, n={m['n']})")
    print(f"  3-class accuracy           {m['accuracy']:.3f}")
    print(f"  contradiction precision    {m['precision']:.3f}")
    print(f"  contradiction recall       {m['recall']:.3f}")
    print(f"  contradiction F1           {m['f1']:.3f}")
    print("  confusion matrix (rows = expected, columns = predicted)")
    print("  " + " " * 14 + "".join(f"{label[:13]:>14}" for label in LABELS))
    for gold in LABELS:
        print("  " + f"{gold:<14}" + "".join(f"{m['matrix'][gold][y]:>14}" for y in LABELS))
    for error in m["errors"]:
        print(f"  miss {error[0]}: expected {error[1]}, got {error[2]} (contradiction {error[3]})")


def by_category(split, threshold):
    """Per category: how often the conflict decision (contradiction or not) was right."""
    print(f"\n{split.upper()} by category (threshold {threshold}): conflict decision correct / pairs")
    for category in dict.fromkeys(p.get("category", "simple") for p in pairs):
        rows = [p for p in pairs if p["split"] == split and p.get("category", "simple") == category]
        if not rows:
            continue
        right = sum((predict(p, threshold) == "contradiction") == (p["label"] == "contradiction") for p in rows)
        print(f"  {category:<17} {rows[0]['label'] if len({r['label'] for r in rows}) == 1 else 'mixed':<14} {right}/{len(rows)}")


# Tune on dev: best contradiction F1, ties broken by closeness to the shipped 0.5.
grid = [round(0.05 * i, 2) for i in range(1, 20)]
best = max(grid, key=lambda t: (metrics("dev", t)["f1"], -abs(t - SHIPPED_THRESHOLD)))
print("dev precision / recall / F1 by threshold:")
for t in grid:
    m = metrics("dev", t)
    print(f"  {t:<5} {m['precision']:.3f} / {m['recall']:.3f} / {m['f1']:.3f}")
show("DEV", metrics("dev", best), best)
show("TEST at shipped threshold", metrics("test", SHIPPED_THRESHOLD), SHIPPED_THRESHOLD)
if best != SHIPPED_THRESHOLD:
    show("TEST at tuned threshold", metrics("test", best), best)
by_category("test", SHIPPED_THRESHOLD)

ordered = sorted(latencies)
print(f"\nInference latency over {len(latencies)} pairs (CPU, both directions per pair):")
print(f"  mean {statistics.mean(latencies):.1f} ms, median {statistics.median(latencies):.1f} ms, p95 {ordered[int(0.95 * len(ordered)) - 1]:.1f} ms")
