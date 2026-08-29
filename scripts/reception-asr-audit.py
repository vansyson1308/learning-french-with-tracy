#!/usr/bin/env python3
"""Secondary ASR audit for generated reception audio (P7 §41).

Transcribes every clip in a generation plan with faster-whisper and scores
word error rate against the authoritative transcript. This is a TECHNICAL
audit signal, not a linguistic oracle: it feeds the QA report and the
canary speaker selection; it never replaces linguistic review, and the ASR
model is never shipped. Runs only inside the dispatch-only workflow.

Usage: reception-asr-audit.py --plan plan.json --outdir clips/ --out asr.json
"""

import argparse
import json
import os
import re
import sys
import unicodedata


def normalize(text: str) -> list[str]:
    text = unicodedata.normalize("NFC", text.lower())
    text = text.replace("œ", "oe").replace("æ", "ae")
    # Elisions attach clitics: split them so j'habite == j habite.
    text = text.replace("'", " ").replace("’", " ")
    text = re.sub(r"[^a-zà-ÿ0-9 ]", " ", text)
    return [t for t in text.split() if t]


def wer(ref: list[str], hyp: list[str]) -> float:
    # Standard Levenshtein over words.
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
    ap.add_argument("--model", default="base")
    args = ap.parse_args()

    from faster_whisper import WhisperModel  # imported late: workflow-only dep

    model = WhisperModel(args.model, device="cpu", compute_type="int8")
    with open(args.plan, "r", encoding="utf-8") as f:
        plan = json.load(f)

    results = {}
    for clip in plan["clips"]:
        path = os.path.join(args.outdir, clip["assetKey"] + ".mp3")
        if not os.path.exists(path):
            results[clip["clipId"]] = {"text": "", "wer": 1.0}
            continue
        segments, _info = model.transcribe(path, language="fr", beam_size=5)
        hyp_text = " ".join(seg.text for seg in segments).strip()
        score = wer(normalize(clip["text"]), normalize(hyp_text))
        results[clip["clipId"]] = {"text": hyp_text, "wer": round(score, 4)}
        print(f"{clip['clipId']}: wer={score:.3f} :: {hyp_text}")

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    return 0


if __name__ == "__main__":
    sys.exit(main())
