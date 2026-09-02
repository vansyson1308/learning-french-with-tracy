#!/usr/bin/env python3
"""Language-aware ASR audit for generated audio (V1 publication program).

Transcribes every clip in a generation plan with faster-whisper in the
clip's own language and scores word (or, for Chinese, character) error rate
against the authoritative transcript. A TECHNICAL signal only — it feeds
QA reports and candidate-voice selection, never replaces linguistic review,
and the ASR model is never shipped. Runs only inside the dispatch-only
workflow (huggingface.co is unreachable from the interactive environment).

Every clip is transcribed with one second of digital silence before it and
half a second after it: Whisper-family models are unreliable on sub-second
audio with no lead-in, and the padding adds context without adding any
bias (nothing about the expected text reaches the recognizer). Isolated
single-word clips remain the weakest case for any ASR — the QA report
therefore keeps sentence-length clips as the intelligibility signal and
treats word-level scores as informational.

Usage: audio-asr-audit.py --plan plan.json --outdir clips/ --out asr.json [--model medium]
"""

import argparse
import json
import os
import re
import sys
import unicodedata


def normalize(text: str, language: str) -> list[str]:
    text = unicodedata.normalize("NFC", text.lower())
    text = text.replace("œ", "oe").replace("æ", "ae").replace("ß", "ss")
    text = text.replace("'", " ").replace("’", " ")
    if language == "zh":
        chars = [c for c in text if c.isalnum() and not c.isspace()]
        return chars
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"[_\d]+", " ", text)
    return [t for t in text.split() if t]


def edit_rate(ref: list[str], hyp: list[str]) -> float:
    d = [[0] * (len(hyp) + 1) for _ in range(len(ref) + 1)]
    for i in range(len(ref) + 1):
        d[i][0] = i
    for j in range(len(hyp) + 1):
        d[0][j] = j
    for i in range(1, len(ref) + 1):
        for j in range(1, len(hyp) + 1):
            cost = 0 if ref[i - 1] == hyp[j - 1] else 1
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
    return d[len(ref)][len(hyp)] / max(len(ref), 1)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", required=True)
    ap.add_argument("--outdir", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--model", default="medium")
    ap.add_argument("--lead-silence", type=float, default=1.0)
    ap.add_argument("--tail-silence", type=float, default=0.5)
    args = ap.parse_args()

    import numpy as np
    from faster_whisper import WhisperModel, decode_audio  # workflow-only dependency

    model = WhisperModel(args.model, device="cpu", compute_type="int8")
    rate = 16000
    lead = np.zeros(int(args.lead_silence * rate), dtype=np.float32)
    tail = np.zeros(int(args.tail_silence * rate), dtype=np.float32)
    with open(args.plan, "r", encoding="utf-8") as f:
        plan = json.load(f)

    results = {}
    for clip in plan["clips"]:
        path = os.path.join(args.outdir, clip["assetKey"] + ".mp3")
        language = clip.get("language", "fr")
        if not os.path.exists(path):
            results[clip["clipId"]] = {"text": "", "wer": 1.0}
            continue
        audio = np.concatenate([lead, decode_audio(path, sampling_rate=rate), tail])
        segments, _info = model.transcribe(
            audio, language=language, beam_size=5, condition_on_previous_text=False
        )
        hyp_text = " ".join(seg.text for seg in segments).strip()
        score = edit_rate(normalize(clip["text"], language), normalize(hyp_text, language))
        results[clip["clipId"]] = {"text": hyp_text, "wer": round(score, 4), "model": args.model}
        print(f"{clip['clipId']}: wer={score:.3f} :: {hyp_text}")

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    return 0


if __name__ == "__main__":
    sys.exit(main())
