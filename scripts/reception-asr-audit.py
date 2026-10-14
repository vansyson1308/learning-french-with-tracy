#!/usr/bin/env python3
"""Secondary ASR audit for generated reception audio (P7 §41; per language since P1c).

Transcribes every clip in a generation plan with faster-whisper and scores
word error rate against the authoritative transcript. This is a TECHNICAL
audit signal, not a linguistic oracle: it feeds the QA report and the
canary speaker selection; it never replaces linguistic review, and the ASR
model is never shipped. Runs only inside the dispatch-only workflow.

Language rules are NOT re-implemented here: the plan written by
`reception-audio.ts plan --lang <code>` carries the language and the build
plugin's ASR-normalisation spec (ligature folds, apostrophe splitting, the
word-character class, the Whisper language code). `--lang` only overrides
the Whisper language when a plan predates P1c.

Usage: reception-asr-audit.py --plan plan.json --outdir clips/ --out asr.json [--lang fr]
"""

import argparse
import json
import os
import re
import sys
import unicodedata

# The spec French plans carried implicitly before P1c (kept for old plans).
LEGACY_NORMALIZATION = {
    "ligatures": {"œ": "oe", "æ": "ae"},
    "apostropheSplit": True,
    "wordChars": "a-zà-ÿ0-9",
    "whisperLanguage": "fr",
}


def normalize(text: str, spec: dict) -> list[str]:
    text = unicodedata.normalize("NFC", text.lower())
    for src, dst in spec.get("ligatures", {}).items():
        text = text.replace(src, dst)
    if spec.get("apostropheSplit", True):
        # Elisions attach clitics: split them so j'habite == j habite.
        text = text.replace("'", " ").replace("’", " ")
    word_chars = spec.get("wordChars", LEGACY_NORMALIZATION["wordChars"])
    text = re.sub(rf"[^{word_chars} ]", " ", text)
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


def plan_language(plan: dict, override: str | None) -> tuple[str, dict]:
    spec = plan.get("normalization") or LEGACY_NORMALIZATION
    language = override or spec.get("whisperLanguage") or plan.get("language") or "fr"
    return language, spec


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", required=True)
    ap.add_argument("--outdir", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--model", default="medium")
    ap.add_argument("--lang", default=None, help="Whisper language override (default: the plan's)")
    ap.add_argument("--lead-silence", type=float, default=1.0)
    ap.add_argument("--tail-silence", type=float, default=0.5)
    args = ap.parse_args()

    import numpy as np
    from faster_whisper import WhisperModel, decode_audio  # imported late: workflow-only dep

    with open(args.plan, "r", encoding="utf-8") as f:
        plan = json.load(f)
    language, spec = plan_language(plan, args.lang)

    # Silence padding (V1 publication): Whisper-family recognizers are
    # unreliable on sub-second clips with no lead-in; padding adds context
    # without bias (nothing about the expected text reaches the model).
    model = WhisperModel(args.model, device="cpu", compute_type="int8")
    rate = 16000
    lead = np.zeros(int(args.lead_silence * rate), dtype=np.float32)
    tail = np.zeros(int(args.tail_silence * rate), dtype=np.float32)

    results = {}
    for clip in plan["clips"]:
        path = os.path.join(args.outdir, clip["assetKey"] + ".mp3")
        if not os.path.exists(path):
            results[clip["clipId"]] = {"text": "", "wer": 1.0}
            continue
        audio = np.concatenate([lead, decode_audio(path, sampling_rate=rate), tail])
        segments, _info = model.transcribe(
            audio, language=language, beam_size=5, condition_on_previous_text=False
        )
        hyp_text = " ".join(seg.text for seg in segments).strip()
        score = wer(normalize(clip["text"], spec), normalize(hyp_text, spec))
        results[clip["clipId"]] = {"text": hyp_text, "wer": round(score, 4), "model": args.model}
        print(f"{clip['clipId']}: wer={score:.3f} :: {hyp_text}")

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    return 0


if __name__ == "__main__":
    sys.exit(main())
