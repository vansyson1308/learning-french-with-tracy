#!/usr/bin/env python3
"""Kokoro-82M batch synthesis helper (P3b). Runs inside the dispatch-only
audio workflow only: loads the pinned model + voice once, then renders every
job of a JSONL file (`{"text": ..., "out": ...}` per line) to 24 kHz WAV.
Nothing here touches the network: the model, config and voice files were
downloaded and hash-verified by the pipeline beforehand.

    kokoro_synth.py --lang-code e --model kokoro-v1_0.pth --config config.json --voice ef_dora.pt --jobs jobs.jsonl
"""

import argparse
import json
import os
import sys


def trim_edges(audio, rate, np):
    """Cut leading and trailing silence, keeping a short pad."""
    window = max(1, rate // 100)
    usable = (audio.size // window) * window
    if usable == 0:
        return audio
    energy = np.abs(audio[:usable]).reshape(-1, window).max(axis=1)
    loud = np.nonzero(energy > energy.max() * 0.02)[0]
    if loud.size == 0:
        return audio
    pad = int(0.08 * rate)
    return audio[max(0, loud[0] * window - pad) : min(audio.size, (loud[-1] + 1) * window + pad)]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--lang-code", required=True, help="Kokoro language code (a=en-US, e=es, f=fr, i=it, p=pt-BR, j=ja, z=zh)")
    ap.add_argument("--model", required=True)
    ap.add_argument("--config", required=True)
    ap.add_argument("--voice", required=True, help="voice .pt file (pinned)")
    ap.add_argument("--jobs", required=True)
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--trim-edges", action="store_true", help="cut edge silence (voices that leave a long one)")
    args = ap.parse_args()

    os.environ.setdefault("HF_HUB_OFFLINE", "1")
    import numpy as np
    import soundfile as sf
    import torch
    from kokoro import KModel, KPipeline  # workflow-only dependency

    model = KModel(config=args.config, model=args.model).eval()
    pipeline = KPipeline(lang_code=args.lang_code, model=model)
    voice = torch.load(args.voice, weights_only=True)

    done = 0
    with open(args.jobs, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            job = json.loads(line)
            chunks = []
            for _gs, _ps, audio in pipeline(job["text"], voice=voice, speed=args.speed):
                if audio is not None:
                    chunks.append(audio.numpy() if hasattr(audio, "numpy") else np.asarray(audio))
            if not chunks:
                print(f"kokoro: no audio for {job['out']}", file=sys.stderr)
                return 1
            audio = np.concatenate(chunks)
            sf.write(job["out"], trim_edges(audio, 24000, np) if args.trim_edges else audio, 24000)
            done += 1
    print(f"kokoro: synthesized {done} jobs")
    return 0


if __name__ == "__main__":
    sys.exit(main())
