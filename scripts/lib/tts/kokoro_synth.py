#!/usr/bin/env python3
"""Kokoro-82M batch synthesis helper (P3b). Runs inside the dispatch-only
audio workflow only: loads the pinned model + voice once, then renders every
job of a JSONL file (`{"text": ..., "out": ...}` per line) to 24 kHz WAV.
Nothing here touches the network: the model, config and voice files were
downloaded and hash-verified by the pipeline beforehand.

    kokoro_synth.py --lang-code e --model kokoro-v1_0.pth --config config.json --voice ef_dora.pt --jobs jobs.jsonl

P4c: `--input phonemes` (Japanese) takes `{"phonemes": ..., "text": ..., "out": ...}`
jobs whose phonemes the plan built from the course's stored readings
(scripts/lib/tts/ja-kana.ts). The model is then called directly: no
KPipeline is built, so misaki's Japanese G2P (MeCab + a BSD dictionary) is
never imported. Every other language keeps `--input text`.
"""

import argparse
import json
import os
import re
import sys

# kokoro 0.9.4 pipeline.py: a phoneme string longer than 510 is refused (raw input) or truncated.
MAX_PHONEMES = 510


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


def phoneme_chunks(ps):
    """Split a long phoneme string after sentence punctuation into pieces of at most MAX_PHONEMES."""
    if len(ps) <= MAX_PHONEMES:
        return [ps]
    pieces = [p.strip() for p in re.split(r"(?<=[.!?…])\s+", ps) if p.strip()]
    chunks, current = [], ""
    for piece in pieces:
        if len(piece) > MAX_PHONEMES:
            raise ValueError(f"one sentence is longer than {MAX_PHONEMES} phonemes: {piece[:60]}...")
        candidate = f"{current} {piece}".strip()
        if len(candidate) <= MAX_PHONEMES:
            current = candidate
        else:
            chunks.append(current)
            current = piece
    if current:
        chunks.append(current)
    return chunks


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--lang-code", required=True, help="Kokoro language code (a=en-US, e=es, f=fr, i=it, p=pt-BR, j=ja, z=zh)")
    ap.add_argument("--model", required=True)
    ap.add_argument("--config", required=True)
    ap.add_argument("--voice", required=True, help="voice .pt file (pinned)")
    ap.add_argument("--jobs", required=True)
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--trim-edges", action="store_true", help="cut edge silence (voices that leave a long one)")
    ap.add_argument("--input", choices=["text", "phonemes"], default="text", help="phonemes: jobs carry plan-built phonemes (P4c, ja)")
    args = ap.parse_args()

    os.environ.setdefault("HF_HUB_OFFLINE", "1")
    import numpy as np
    import soundfile as sf
    import torch
    from kokoro import KModel, KPipeline  # workflow-only dependency

    model = KModel(config=args.config, model=args.model).eval()
    voice = torch.load(args.voice, weights_only=True)
    pipeline = None if args.input == "phonemes" else KPipeline(lang_code=args.lang_code, model=model)
    vocab = model.vocab

    done = 0
    with open(args.jobs, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            job = json.loads(line)
            chunks = []
            if pipeline is None:
                ps = job.get("phonemes")
                if not ps:
                    print(f"kokoro: {job['out']} has no phonemes (--input phonemes)", file=sys.stderr)
                    return 1
                unknown = {ch for ch in ps if ch not in vocab}
                if unknown:
                    # The model drops a symbol outside its vocabulary silently: fail instead of shipping a clip with a gap.
                    print(f"kokoro: {job['out']}: phonemes outside the model vocabulary: {''.join(sorted(unknown))!r}", file=sys.stderr)
                    return 1
                for piece in phoneme_chunks(ps):
                    audio = model(piece, voice[len(piece) - 1], args.speed)
                    chunks.append(audio.numpy() if hasattr(audio, "numpy") else np.asarray(audio))
            else:
                for _gs, _ps, audio in pipeline(job["text"], voice=voice, speed=args.speed):
                    if audio is not None:
                        chunks.append(audio.numpy() if hasattr(audio, "numpy") else np.asarray(audio))
            if not chunks:
                print(f"kokoro: no audio for {job['out']}", file=sys.stderr)
                return 1
            audio = np.concatenate(chunks)
            sf.write(job["out"], trim_edges(audio, 24000, np) if args.trim_edges else audio, 24000)
            done += 1
    print(f"kokoro: synthesized {done} jobs ({args.input} input)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
