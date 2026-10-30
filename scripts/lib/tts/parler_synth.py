#!/usr/bin/env python3
"""Parler-TTS batch synthesis helper (D-11). Runs inside the dispatch-only audio
workflow only: loads the pinned model once, then renders every job of a JSONL file
(`{"text": ..., "out": ...}` per line) to WAV. Sampling is seeded from the speaker and
the text, so a rerun gives the same clip. No network: every file was downloaded and
hash-verified by the pipeline beforehand.

    parler_synth.py --model DIR --description-tokenizer DIR --speaker Nicole --jobs jobs.jsonl
"""

import argparse
import hashlib
import json
import os
import sys
import time

DESCRIPTION = "{speaker}'s voice is clear and calm, at a moderate speed, in a very close recording with very clear audio and no background noise."


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--description-tokenizer", required=True)
    ap.add_argument("--speaker", required=True)
    ap.add_argument("--jobs", required=True)
    args = ap.parse_args()

    os.environ.setdefault("HF_HUB_OFFLINE", "1")
    import soundfile as sf
    import torch
    from parler_tts import ParlerTTSForConditionalGeneration  # workflow-only dependency
    from transformers import AutoTokenizer

    model = ParlerTTSForConditionalGeneration.from_pretrained(args.model, attn_implementation="sdpa").eval()
    tokenizer = AutoTokenizer.from_pretrained(args.model)
    description_tokenizer = AutoTokenizer.from_pretrained(args.description_tokenizer)
    description = description_tokenizer(DESCRIPTION.format(speaker=args.speaker), return_tensors="pt")
    rate = model.config.sampling_rate

    done, audio_seconds, started = 0, 0.0, time.time()
    with open(args.jobs, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            job = json.loads(line)
            seed = int.from_bytes(hashlib.sha256(f"{args.speaker}\n{job['text']}".encode("utf-8")).digest()[:4], "big")
            torch.manual_seed(seed)
            prompt = tokenizer(job["text"], return_tensors="pt")
            with torch.inference_mode():
                generation = model.generate(input_ids=description.input_ids, attention_mask=description.attention_mask, prompt_input_ids=prompt.input_ids, prompt_attention_mask=prompt.attention_mask)
            audio = generation.cpu().numpy().squeeze()
            if audio.size == 0:
                print(f"parler: no audio for {job['out']}", file=sys.stderr)
                return 1
            sf.write(job["out"], audio, rate)
            done += 1
            audio_seconds += audio.size / rate
    elapsed = time.time() - started
    # The real-time factor decides whether a full generate run fits the job limit.
    print(f"parler: {args.speaker}: synthesized {done} jobs, {audio_seconds:.0f} s of audio in {elapsed:.0f} s (RTF {elapsed / max(audio_seconds, 1):.2f})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
