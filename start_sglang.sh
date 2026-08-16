#!/bin/bash
export HF_HOME=/root/.cache/huggingface
echo "Fixing broken huggingface-hub in image..."
pip install "huggingface_hub<1.0"
echo "Downloading GGUF model..."
huggingface-cli download empero-ai/Qwen3.5-9B-Claude-Opus-4.6-Distill-GGUF Qwen3.5-9B-Claude-Opus-4.6-Distill-Q4_K_M.gguf --local-dir /models
echo "Starting SGLang server..."
python3 -m sglang.launch_server \
  --model-path /models/Qwen3.5-9B-Claude-Opus-4.6-Distill-Q4_K_M.gguf \
  --load-format gguf \
  --quantization gguf \
  --host 0.0.0.0 \
  --port 30000 \
  --mem-fraction-static 0.88 \
  --context-length 8192 \
  --chunked-prefill-size 512 \
  --max-running-requests 4 \
  --schedule-policy lpm
