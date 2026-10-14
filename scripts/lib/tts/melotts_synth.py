#!/usr/bin/env python3
"""MeloTTS batch synthesis helper (P3b). Runs inside the dispatch-only audio
workflow only: loads the pinned checkpoint + config once, then renders every
job of a JSONL file (`{"text": ..., "out": ...}` per line) to WAV at the
model's native sample rate. No network: the files were downloaded and
hash-verified by the pipeline beforehand.

    melotts_synth.py --language ES --speaker ES --ckpt checkpoint.pth --config config.json --jobs jobs.jsonl
"""

import argparse
import json
import sys


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--language", required=True, help="MeloTTS language key (EN, ES, FR, ZH, JP, KR)")
    ap.add_argument("--speaker", required=True, help="speaker key of the model (EN-US, ES, FR, ZH, JP, KR)")
    ap.add_argument("--ckpt", required=True)
    ap.add_argument("--config", required=True)
    ap.add_argument("--jobs", required=True)
    ap.add_argument("--speed", type=float, default=1.0)
    args = ap.parse_args()

    from melo.api import TTS  # workflow-only dependency

    model = TTS(language=args.language, config_path=args.config, ckpt_path=args.ckpt, device="cpu")
    speaker_ids = model.hps.data.spk2id
    if args.speaker not in speaker_ids:
        print(f"melotts: speaker {args.speaker} not in {list(speaker_ids.keys())}", file=sys.stderr)
        return 1
    done = 0
    with open(args.jobs, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            job = json.loads(line)
            model.tts_to_file(job["text"], speaker_ids[args.speaker], job["out"], speed=args.speed, quiet=True)
            done += 1
    print(f"melotts: synthesized {done} jobs")
    return 0


if __name__ == "__main__":
    sys.exit(main())
