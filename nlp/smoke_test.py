"""Quick check that the model loads and the labels make sense.  python smoke_test.py"""
import nli

CASES = [
    ("The market is stable.", "The market is plummeting.", "contradiction"),
    ("The report is due Friday.", "The report is due Monday.", "contradiction"),
    ("Sales rose sharply in May.", "Sales increased significantly in May.", "entailment"),
    ("He bought a red car.", "He bought a car.", "entailment"),
    ("The meeting is at 3 PM.", "The meeting is on Monday.", "neutral"),
    ("She likes tea.", "The weather is cold today.", "neutral"),
    # Exploratory: the real SemSync example. Record what the model says for Chapter 9.
    ("The current financial indicators show that market demand is skyrocketing and level.",
     "The current financial indicators show that market demand is stable and plummeting.", "?"),
]

print("labels:", nli.LABELS)
correct = checked = 0
for premise, hypothesis, expected in CASES:
    forward, backward = nli.both_ways(premise, hypothesis)
    contradiction = max(forward["contradiction"], backward["contradiction"])
    predicted = "contradiction" if contradiction >= 0.5 else max(("entailment", "neutral"), key=lambda k: forward[k] + backward[k])
    if expected != "?":
        checked += 1
        correct += predicted == expected
    print(f"{predicted:13} expected={expected:13} contradiction={contradiction:.2f}  {premise[:48]!r}")
print(f"{correct}/{checked} clear cases correct")
