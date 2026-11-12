"""Layer 3: natural language inference with a small pretrained model (inference only, no training)."""
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

MODEL_NAME = "cross-encoder/nli-deberta-v3-small"
# Smaller fallback if this one is too slow or too large to download:
# MODEL_NAME = "cross-encoder/nli-MiniLM2-L6-H768"

_tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
_model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME).eval()
# Read the label order from the model config. Never assume it.
LABELS = [_model.config.id2label[i].lower() for i in range(_model.config.num_labels)]


@torch.inference_mode()
def both_ways(a: str, b: str):
    """NLI is directional, so score A→B and B→A in one batch. Returns [{label: probability}, {label: probability}]."""
    batch = _tokenizer([a, b], [b, a], return_tensors="pt", padding=True, truncation=True, max_length=256)
    probabilities = torch.softmax(_model(**batch).logits, dim=-1).tolist()
    return [dict(zip(LABELS, row)) for row in probabilities]


both_ways("warm up", "warm up")  # the first call is slow; pay for it at import time, not on the first request
