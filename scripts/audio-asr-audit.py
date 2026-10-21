#!/usr/bin/env python3
"""Language-aware ASR audit for generated audio (audio pipeline v2, P3b).

Transcribes every clip of a generation plan and scores the word error rate
(character error rate for Japanese and Chinese) against the authoritative
transcript. A TECHNICAL signal only — it feeds the QA reports and the
voice-cast selection, never replaces linguistic review, and no ASR model is
ever shipped. Runs only inside the dispatch-only audio workflow.

Recognisers (content/audio/engines.json → asr):
  whisper     faster-whisper (default; --model base for canaries, medium for shipped clips)
  sensevoice  FunASR SenseVoiceSmall — zh / ja / ko only (plan/06 §3; the model knows zh/yue/en/ja/ko,
              fed Vietnamese it emits Chinese filler — vi audits with Whisper); Whisper stays the fallback

Language rules are NOT re-implemented here: the plan written by
`scripts/audio.ts plan` carries the language and the build plugin's
ASR-normalisation spec (ligature folds, apostrophe splitting, the
word-character class, the Whisper language code).

Every clip is transcribed with one second of digital silence before it and
half a second after it (Whisper-family models are unreliable on sub-second
audio with no lead-in; the padding adds no bias).

Usage: audio-asr-audit.py --plan plan.json --outdir clips/ --out asr.json [--engine whisper|sensevoice|auto] [--model medium]
"""

import argparse
import json
import os
import re
import sys
import unicodedata
from concurrent.futures import ThreadPoolExecutor

CER_LANGUAGES = {"ja", "zh"}
SENSEVOICE_LANGUAGES = {"zh", "ja", "ko"}
LEGACY_NORMALIZATION = {"ligatures": {"œ": "oe", "æ": "ae", "ß": "ss"}, "apostropheSplit": True, "wordChars": "a-zà-ÿ0-9", "whisperLanguage": None}


def normalize(text: str, language: str, spec: dict) -> list[str]:
    text = unicodedata.normalize("NFC", text.lower())
    for src, dst in (spec.get("ligatures") or {}).items():
        text = text.replace(src, dst)
    if language in CER_LANGUAGES:
        # Character tokens: letters/digits/kana/han only (punctuation and spaces dropped).
        return [c for c in text if c.isalnum()]
    if spec.get("apostropheSplit", True):
        text = text.replace("'", " ").replace("’", " ")
    word_chars = spec.get("wordChars") or LEGACY_NORMALIZATION["wordChars"]
    if word_chars == "\\w":
        text = re.sub(r"[^\w\s]", " ", text)
    else:
        text = re.sub(rf"[^{word_chars} ]", " ", text)
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


class WhisperRecognizer:
    def __init__(self, model: str, workers: int = 1):
        from faster_whisper import WhisperModel, decode_audio  # workflow-only dependency
        import numpy as np

        self.np = np
        self.decode_audio = decode_audio
        # num_workers > 1 lets transcribe() run truly in parallel from several threads;
        # the CPU threads are split between them. Each clip's result does not depend on the others.
        threads = max(1, (os.cpu_count() or 2) // max(1, workers))
        self.model = WhisperModel(model, device="cpu", compute_type="int8", cpu_threads=threads, num_workers=max(1, workers))
        self.name = f"faster-whisper:{model}"
        self.rate = 16000

    def transcribe(self, path: str, language: str, lead: float, tail: float) -> str:
        np = self.np
        audio = np.concatenate([np.zeros(int(lead * self.rate), dtype=np.float32), self.decode_audio(path, sampling_rate=self.rate), np.zeros(int(tail * self.rate), dtype=np.float32)])
        segments, _info = self.model.transcribe(audio, language=language, beam_size=5, condition_on_previous_text=False)
        return " ".join(seg.text for seg in segments).strip()


class SenseVoiceRecognizer:
    LANG = {"zh": "zh", "ja": "ja", "ko": "ko", "en": "en"}

    def __init__(self, model: str, hub: str):
        from funasr import AutoModel  # workflow-only dependency
        from funasr.utils.postprocess_utils import rich_transcription_postprocess

        self.post = rich_transcription_postprocess
        self.model = AutoModel(model=model, hub=hub, device="cpu", disable_update=True)
        self.name = f"sensevoice:{model}"

    def transcribe(self, path: str, language: str, lead: float, tail: float) -> str:
        res = self.model.generate(input=path, language=self.LANG.get(language, "auto"), use_itn=False, batch_size_s=0)
        if not res:
            return ""
        return self.post(res[0]["text"]).strip()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", required=True)
    ap.add_argument("--outdir", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--engine", default="auto", choices=["auto", "whisper", "sensevoice"])
    ap.add_argument("--model", default="medium", help="whisper model size (base for canaries)")
    ap.add_argument("--lead-silence", type=float, default=1.0)
    ap.add_argument("--tail-silence", type=float, default=0.5)
    ap.add_argument("--workers", type=int, default=2, help="parallel Whisper transcriptions (SenseVoice stays sequential)")
    args = ap.parse_args()

    with open(args.plan, "r", encoding="utf-8") as f:
        plan = json.load(f)
    language = plan.get("language") or "fr"
    spec = plan.get("normalization") or LEGACY_NORMALIZATION
    whisper_lang = spec.get("whisperLanguage") or language
    engine = args.engine
    if engine == "auto":
        engine = "sensevoice" if language in SENSEVOICE_LANGUAGES else "whisper"
    engines_doc = {}
    engines_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "content", "audio", "engines.json")
    if os.path.exists(engines_path):
        with open(engines_path, "r", encoding="utf-8") as f:
            engines_doc = json.load(f).get("asr", {})
    if engine == "sensevoice":
        sv = engines_doc.get("sensevoice", {})
        recognizer = SenseVoiceRecognizer(sv.get("model", "FunAudioLLM/SenseVoiceSmall"), sv.get("modelHub", "hf"))
    else:
        recognizer = WhisperRecognizer(args.model, args.workers)

    metric = "cer" if language in CER_LANGUAGES else "wer"
    # One transcription per unique asset (an asset key hashes voice + speaker + text,
    # so clips sharing it are the same audio); results are written in plan order.
    unique = {}
    for clip in plan["clips"]:
        if clip["assetKey"] not in unique and os.path.exists(os.path.join(args.outdir, clip["assetKey"] + ".mp3")):
            unique[clip["assetKey"]] = clip
    done = [0]

    def work(item):
        key, clip = item
        hyp = recognizer.transcribe(os.path.join(args.outdir, key + ".mp3"), whisper_lang if engine == "whisper" else clip.get("language", language), args.lead_silence, args.tail_silence)
        done[0] += 1
        if done[0] % 100 == 0:
            print(f"… transcribed {done[0]}/{len(unique)} assets", flush=True)
        return key, hyp

    workers = args.workers if engine == "whisper" else 1
    if workers > 1:
        with ThreadPoolExecutor(max_workers=workers) as pool:
            hyps = dict(pool.map(work, unique.items()))
    else:
        hyps = dict(work(item) for item in unique.items())

    results = {}
    for clip in plan["clips"]:
        clip_lang = clip.get("language", language)
        hyp = hyps.get(clip["assetKey"])
        if hyp is None:
            results[clip["clipId"]] = {"text": "", "wer": 1.0, "metric": metric, "engine": recognizer.name}
            continue
        score = edit_rate(normalize(clip["text"], clip_lang, spec), normalize(hyp, clip_lang, spec))
        results[clip["clipId"]] = {"text": hyp, "wer": round(score, 4), "metric": metric, "model": recognizer.name, "engine": engine}
        print(f"{clip['clipId']}: {metric}={score:.3f} :: {hyp}")

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    return 0


if __name__ == "__main__":
    sys.exit(main())
