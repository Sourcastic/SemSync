# SemSync: Semantic-Aware Collaborative Text Editing via CRDTs

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Real-time collaborative text editor that augments mathematical CRDT synchronization with an asynchronous Natural Language Inference (NLI) pipeline to detect and resolve semantic contradictions and grammatical incoherence.

- **Team:** Atika Hussain (23L-0570), M. Ibrahim Faisal (23L-0759), Eshaal Rehmatullah (23L-0648)

---

## The Problem

Character-level CRDTs (Automerge, Yjs) merge concurrent operations blindly based on character indices. While they guarantee mathematical convergence, they frequently introduce **semantic conflicts** that neither author intended:

- **Semantic Contradiction:**  
  _Original:_ `"The financial indicators show market demand is stable and level."`  
  _User A edits:_ `"stable"` → `"skyrocketing"`  
  _User B edits:_ `"level"` → `"plummeting"`  
  _CRDT Blind Merge:_ `"market demand is skyrocketing and plummeting."`
- **Grammatical Incoherence (Dangling Modifier):**  
  _Original:_ `"The brown fox."`  
  _User A inserts:_ `"quick"`  
  _User B deletes:_ `"brown fox"`  
  _CRDT Blind Merge:_ `"The quick"` (dangling modifier with no grammatical head).

---

## Architecture

SemSync decouples real-time editing from semantic analysis using a 4-layer architecture. Keystrokes remain 0ms latency; the AI functions strictly as an **asynchronous linter** without modifying vector clocks or CRDT causal history.

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: CRDT Replication                                   │
│ Automerge engine, WebSocket relay, vector clock management  │
└──────────────────────────────┬──────────────────────────────┘
                               │ change events (author + heads)
┌──────────────────────────────▼──────────────────────────────┐
│ Layer 2: Concurrent Edit Detection                          │
│ Fork detection, span extractor, premise-hypothesis packager │
└──────────────────────────────┬──────────────────────────────┘
                               │ conflict pairs (spans + text)
┌──────────────────────────────▼──────────────────────────────┐
│ Layer 3: NLP / NLI Reasoning Engine                         │
│ Distilled NLI model (Contradiction / Entailment / Neutral)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ annotated conflicts + score
┌──────────────────────────────▼──────────────────────────────┐
│ Layer 4: Conflict Resolution & UI                           │
│ Inline suggestion cards, non-destructive editor decorations │
└─────────────────────────────────────────────────────────────┘
```

### Layer Breakdown

| Layer                        | Responsibility                                                                         | Tech / Mechanism                                        |
| :--------------------------- | :------------------------------------------------------------------------------------- | :------------------------------------------------------ |
| **1. CRDT Replication**      | Local persistence and multi-peer synchronization.                                      | `@automerge/automerge-repo`, WebSockets                 |
| **2. Concurrency Detection** | Walks Automerge change DAG to detect forked/concurrent branches and extract sentences. | Causal DAG inspection, Sentence Boundary Disambiguation |
| **3. NLI Reasoning**         | Classifies concurrent pairs into Entailment, Neutral, or Contradiction.                | Distilled NLI Transformer (`deberta-v3-small` / `mnli`) |
| **4. Resolution UI**         | Non-destructive highlight spans and inline merge resolution cards.                     | Asynchronous Linter pattern, interactive UI             |

---

## Project Structure

```text
SemSync/
├── client/                     # React + ProseMirror + Automerge app (Vite)
│   ├── index.html              # The app
│   ├── design-system.html      # Browser-viewable design system
│   ├── prototype/              # Original dual-view prototype (reference only)
│   ├── src/
│   │   ├── components/         # ui/, editor/, semantic/, collaboration/, documents/
│   │   │                       #   semantic/concurrency.js = Layer 2 (fork detection, conflict packaging)
│   │   │                       #   semantic/analysis.js    = Layer 3 client (NLI service, local fallback)
│   │   │                       #   semantic/grammarCheck.js = rule-based grammar checks (client-side)
│   │   ├── features/           # Screens: auth, onboarding, workspace, editor
│   │   ├── demo/               # Evaluator demo scenarios (DEMO_MODE)
│   │   ├── lib/                # Repo, document index, router, session, theme
│   │   ├── styles/             # tokens.css and per-domain styles
│   │   └── design-system/      # Design system page
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # CRDT relay & persistence backend (Layer 1)
│   ├── server.js               # Automerge Repo + WebSocket adapter + disk storage
│   └── package.json
│
├── nlp/                        # Layer 3 NLI microservice (Python / FastAPI)
│   ├── main.py                 # POST /analyze { premise, hypothesis } -> { label, score, model }
│   ├── nli.py                  # Pretrained NLI model, scored in both directions
│   ├── smoke_test.py           # Checks the model loads and labels make sense
│   └── requirements.txt
│
├── shared/
│   └── schemas/
│       └── conflictPair.schema.json  # Shared JSON schema for conflict data
│
├── tests/
│   ├── peer-sync.test.js       # Headless Layer 1 convergence verification
│   └── concurrency.test.js     # Headless Layer 2 fork detection and conflict packaging
│
├── package.json                # Root npm workspace
└── README.md
```

Notes on where things run:

- **Layer 2** reads the Automerge change history of the document replica each peer holds (`A.getHeads`, `A.getAllChanges`, `A.view`). It lives in the client because that is where the live document and the editor are. The sync server only relays and stores.
- **Layer 3** is the Python service. The client calls it directly; if it is not configured or not running, the app falls back to a small local keyword heuristic and says so on the result.
- **Grammar** is rule-based and runs in the client (`grammarCheck.js`).

Before changing the client, read [docs/CHANGE-GUIDE.md](docs/CHANGE-GUIDE.md).

---

## Quickstart

### Prerequisites

- **Node.js** (v18+)
- **npm** (v9+)

### Installation

From the root directory:

```bash
npm install
```

### Run the Initial Demo

Start both the WebSocket sync server and the Vite client concurrently:

```bash
npm run dev
```

- **Sync Server:** `ws://localhost:3030`
- **Web Client:** `http://localhost:5173/`

Open `http://localhost:5173/` in two browser tabs or windows side-by-side to test live CRDT synchronization.

### Run the NLI Service (Layer 3, optional but recommended)

Requires Python 3.10 to 3.12. The first run downloads the model (a few hundred MB).

```bash
cd nlp
python -m venv .venv
.venv\Scripts\activate            # macOS/Linux: source .venv/bin/activate
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
python smoke_test.py               # checks the model and label order
uvicorn main:app --port 8000       # try it at http://localhost:8000/docs
```

Then copy `client/.env.example` to `client/.env.local` and restart `npm run dev`. In the app, the result details show which model produced the verdict.

### Run Headless Verification Tests

```bash
node tests/peer-sync.test.js       # Layer 1: convergence over WebSockets (start the server first)
node tests/concurrency.test.js     # Layer 2: fork detection and conflict packaging
```

---
