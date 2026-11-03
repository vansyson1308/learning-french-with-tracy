"""Seed the staged content/ja/stories/stories.json: voice cast from content/audio/voice-casts.json (N narrates with A's voice),
the function words of ja_stories_lib.py, no file-level token map (each story maps its own inflected forms and names). The
stories come through `author ingest stories`. Also writes _drafts/stories/story-audio.json: the `storyAudio` block the
audio session puts into content/ja/reception/audio-source-manifest.json (band-1 audio: the first STORY_AUDIO_MAX_BUNDLED
stories of the reading order after the micro-stories, scripts/lib/stories.ts bandOneOrder).
usage: python -I ja-stories-seed.py <repo root>"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ja_stories_lib import BANDS, FUNCTION  # noqa: E402

ROOT = sys.argv[1]
path = f"{ROOT}/content/ja/_drafts/staged/content/ja/stories/stories.json"
cast = json.load(open(f"{ROOT}/content/audio/voice-casts.json", encoding="utf-8"))["languages"]["ja"]["cast"]
doc = {"version": 1, "language": "ja",
       "voiceCast": {"N": {"voiceId": cast["A"], "speaker": None}, "A": {"voiceId": cast["A"], "speaker": None}, "B": {"voiceId": cast["B"], "speaker": None}},
       "functionWords": sorted(set(FUNCTION)), "stories": []}
os.makedirs(os.path.dirname(path), exist_ok=True)
with open(path, "w", encoding="utf-8", newline="\n") as f:
    json.dump(doc, f, ensure_ascii=False, indent=2)
    f.write("\n")

STORY_AUDIO_MAX_BUNDLED = 18
stories = [json.loads(line) for line in open(f"{ROOT}/content/ja/_drafts/stories/OUTPUT.jsonl", encoding="utf-8")]
order = [s["id"] for _, s in sorted(enumerate(stories), key=lambda p: (BANDS.index(p[1]["band"]), p[0])) if s["band"] != "A1-0"]
story_audio = {"bundled": "band-1", "stories": order[:STORY_AUDIO_MAX_BUNDLED],
               "reason": "QC 2026-10-29b §2.3 + Opus (CI-proven 2026-10-30, PR #51): band-1 story audio only, as in es, it and en: the first 18 stories of the reading order after the A1-0 micro-stories bundle sentence audio as Opus 16 kbps; the micro-stories and every other story are read with the device voice, labelled \"Giọng đọc của máy\" (release/ASSET_DELIVERY.md)."}
with open(f"{ROOT}/content/ja/_drafts/stories/story-audio.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump({"storyAudio": story_audio}, f, ensure_ascii=False, indent=2)
    f.write("\n")
print("seeded", len(doc["functionWords"]), "function words;", len(story_audio["stories"]), "stories bundle audio")
