from pathlib import Path
from huggingface_hub import snapshot_download

target = Path(__file__).parent / "models" / "nli-deberta-v3-small"
snapshot_download(
    repo_id="cross-encoder/nli-deberta-v3-small",
    local_dir=target,
    ignore_patterns=["onnx/*", "openvino/*", "*.onnx", "*.msgpack", "*.h5", "*.ot"],  # skip formats we don't use
)
print("Saved to", target)