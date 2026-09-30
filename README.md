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
├── client/                     # Frontend Vite application
│   ├── src/
│   │   ├── editor/             # Editor view & Automerge bindings
│   │   ├── conflicts/          # Decorations, cursor flags & conflict store
│   │   ├── components/         # Shared UI components
│   │   └── services/           # WebSocket client connection
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # CRDT relay & synchronization backend
│   ├── src/
│   │   ├── crdt/               # Automerge Repo & persistence adapters
│   │   ├── concurrency/        # Fork detection & span extraction
│   │   └── analysis/           # NLI bridge & result dispatcher
│   └── package.json
│
├── nlp/                        # Layer 3 NLP/NLI microservice
│   ├── main.py                 # FastAPI service entry
│   ├── nli.py                  # Contradiction classification pipeline
│   ├── grammar.py              # Grammar & dangling modifier checks
│   ├── schemas.py              # Pydantic request/response models
│   └── requirements.txt
│
├── shared/
│   └── schemas/
│       └── conflictPair.schema.json  # Shared JSON schema for conflict data
│
├── tests/
│   ├── peer-sync.test.js       # Headless Layer 1 convergence verification
│   ├── concurrency.test.js
│   ├── contradiction.test.js
│   └── grammar-conflict.test.js
│
├── package.json                # Root npm workspace
└── README.md
```

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

### Run Headless Verification Test

Reproduces the proposal's dangling-modifier scenario over WebSockets headlessly:

```bash
node tests/peer-sync.test.js
```

---
