#!/usr/bin/env python3
"""Parler-TTS batch synthesis helper (D-11). Runs inside the dispatch-only audio
workflow only: loads the pinned model once, then renders every job of a JSONL file
(`{"text": ..., "out": ...}` per line) to WAV. Parler is slow on a CPU, so jobs of similar
length run in batches. Sampling is seeded from the speaker and the batch, so a rerun
gives the same clips. A clip's edge silence is trimmed; a clip whose speech is
implausibly long or short for its text is sampled again with the next seed. No
network: every file was downloaded and hash-verified by the pipeline beforehand.

    parler_synth.py --model DIR --description-tokenizer DIR --speaker Nicole --jobs jobs.jsonl
"""

import argparse
import hashlib
import json
import os
import sys
import time

DESCRIPTION = "{speaker}'s voice is clear and calm, at a moderate speed, in a very close recording with very clear audio and no background noise."
BATCH = 8
ATTEMPTS = 3
# Characters of text per second of speech; wider than the pipeline's QA band for short clips.
MIN_RATE, MAX_RATE = 5.0, 24.0
SILENCE_RATIO = 0.02
PAD_SECONDS = 0.08


def trim(audio, rate):
    """Cut leading and trailing silence, keeping a short pad."""
    import numpy as np

    window = max(1, rate // 100)
    usable = (audio.size // window) * window
    if usable == 0:
        return audio
    energy = np.abs(audio[:usable]).reshape(-1, window).max(axis=1)
    loud = np.nonzero(energy > energy.max() * SILENCE_RATIO)[0]
    if loud.size == 0:
        return audio
    pad = int(PAD_SECONDS * rate)
    return audio[max(0, loud[0] * window - pad) : min(audio.size, (loud[-1] + 1) * window + pad)]


def plausible(text, audio, rate):
    chars = max(len(text), 1)
    seconds = audio.size / rate
    if seconds <= 0:
        return False
    per_second = chars / seconds
    # A one-word clip is naturally slow, so only its upper length is judged by the floor.
    floor = 2.5 if chars < 12 else MIN_RATE
    return floor <= per_second <= MAX_RATE


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

    model = ParlerTTSForConditionalGeneration.from_pretrained(args.model).eval()
    tokenizer = AutoTokenizer.from_pretrained(args.model, padding_side="left")
    description_tokenizer = AutoTokenizer.from_pretrained(args.description_tokenizer)
    description = DESCRIPTION.format(speaker=args.speaker)
    rate = model.config.sampling_rate

    with open(args.jobs, "r", encoding="utf-8") as f:
        jobs = [json.loads(line) for line in f if line.strip()]
    pending = sorted(jobs, key=lambda j: (len(j["text"]), j["text"], j["out"]))

    done, audio_seconds, started = 0, 0.0, time.time()
    for attempt in range(ATTEMPTS):
        retry = []
        for start in range(0, len(pending), BATCH):
            batch = pending[start : start + BATCH]
            texts = [j["text"] for j in batch]
            key = f"{args.speaker}\n{attempt}\n" + "\n".join(texts)
            torch.manual_seed(int.from_bytes(hashlib.sha256(key.encode("utf-8")).digest()[:4], "big"))
            desc = description_tokenizer([description] * len(batch), return_tensors="pt", padding=True)
            prompt = tokenizer(texts, return_tensors="pt", padding=True)
            with torch.inference_mode():
                out = model.generate(input_ids=desc.input_ids, attention_mask=desc.attention_mask, prompt_input_ids=prompt.input_ids, prompt_attention_mask=prompt.attention_mask, do_sample=True, return_dict_in_generate=True)
            for i, job in enumerate(batch):
                audio = trim(out.sequences[i, : out.audios_length[i]].cpu().numpy().squeeze(), rate)
                if audio.size == 0 or (attempt < ATTEMPTS - 1 and not plausible(job["text"], audio, rate)):
                    retry.append(job)
                    continue
                sf.write(job["out"], audio, rate)
                done += 1
                audio_seconds += audio.size / rate
        pending = retry
        print(f"parler: {args.speaker}: attempt {attempt + 1}: {len(retry)} clip(s) to sample again")
        if not pending:
            break
    if pending:
        print(f"parler: no audio for {pending[0]['out']}", file=sys.stderr)
        return 1
    elapsed = time.time() - started
    # The real-time factor decides whether a full generate run fits the job limit.
    print(f"parler: {args.speaker}: synthesized {done} jobs, {audio_seconds:.0f} s of audio in {elapsed:.0f} s (RTF {elapsed / max(audio_seconds, 1):.2f})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
