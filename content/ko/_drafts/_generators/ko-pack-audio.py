"""Record the ko-vi pack audio policy (QC 2026-11-05 §2.1) in the draft pack the units ingest wrote: device-tts, with
the reason on record next to the content (content/schema.ts PackAudioPolicySchema). Key order: the policy follows the
pack header, before `sections`. usage: python -I ko-pack-audio.py <repo root>"""
import json, sys

ROOT = sys.argv[1]
PATH = f"{ROOT}/content/ko/_drafts/pack.json"
REASON = (
    "No Korean synthesis voice with a clean lineage is available to the audio pipeline (D-11: MeloTTS-KR declares no "
    "training data; Google Cloud TTS is prepared but awaits the owner's approval, QC 2026-11-05 §2.2), so ko-vi speaks "
    "through the device's own Korean text-to-speech voice and grades listening through it when one is installed."
)
pack = json.load(open(PATH, encoding="utf-8"))
out = {}
for k, v in pack.items():
    if k == "sections":
        out["audio"] = {"policy": "device-tts", "reason": REASON}
    if k != "audio":
        out[k] = v
with open(PATH, "w", encoding="utf-8", newline="\n") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
    f.write("\n")
