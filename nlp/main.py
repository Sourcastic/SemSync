"""Layer 3 service. Run from this folder:  uvicorn main:app --port 8000

Contract (matches client/src/components/semantic/analysis.js):
    POST /analyze  { premise, hypothesis }  ->  { label, score, model, latency_ms }
"""
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import nli

app = FastAPI(title="SemSync NLI service")

# The browser calls this service directly from the Vite dev server, so CORS must allow it.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# A conflict is flagged when the contradiction probability reaches this value.
# Tune it on a dev split of the benchmark (see Chapter 9), not on the test split.
THRESHOLD = 0.5


class AnalyzeRequest(BaseModel):
    premise: str
    hypothesis: str


@app.get("/health")
def health():
    return {"ok": True, "model": nli.MODEL_NAME}


@app.post("/analyze")
def analyze(request: AnalyzeRequest):
    started = time.perf_counter()
    forward, backward = nli.both_ways(request.premise, request.hypothesis)
    score = max(forward.get("contradiction", 0.0), backward.get("contradiction", 0.0))
    other = max(("entailment", "neutral"), key=lambda label: forward.get(label, 0.0) + backward.get(label, 0.0))
    return {
        "label": "contradiction" if score >= THRESHOLD else other,
        "score": round(score, 4),
        "model": nli.MODEL_NAME,
        "latency_ms": round((time.perf_counter() - started) * 1000, 1),
    }
