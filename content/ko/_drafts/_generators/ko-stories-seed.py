"""Seed the staged content/ko/stories/stories.json (P4e session 4), after ja-stories-seed.py: the voice cast, the
function words of ko_stories_lib.py, no file-level token map (each story maps its own words). The stories come through
`author ingest stories`.

Voices: ko has no clean recorded voice (content/audio/voice-casts.json: no-clean-voice, D-11), so no story bundles
audio; the reader uses the device's ko-KR voice, labelled "Giọng đọc của máy", or text only. The cast keeps the
listening layer's "unselected" voice with the speaker letter, so the three speakers stay distinct ids.
usage: python -I ko-stories-seed.py <repo root>"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ko_stories_lib import FUNCTION  # noqa: E402

ROOT = sys.argv[1]
path = f"{ROOT}/content/ko/_drafts/staged/content/ko/stories/stories.json"
doc = {"version": 1, "language": "ko",
       "voiceCast": {s: {"voiceId": "unselected", "speaker": s} for s in ("N", "A", "B")},
       "functionWords": sorted(set(FUNCTION)), "stories": []}
os.makedirs(os.path.dirname(path), exist_ok=True)
with open(path, "w", encoding="utf-8", newline="\n") as f:
    json.dump(doc, f, ensure_ascii=False, indent=2)
    f.write("\n")
# The `storyAudio` block promote puts into content/ko/reception/audio-source-manifest.json (scripts/lib/stories.ts
# parseStoryAudio): no story bundles audio.
story_audio = {"bundled": False,
               "reason": "ko has no clean recorded voice (content/audio/voice-casts.json: no-clean-voice, D-11): every story is read with the device's ko-KR voice, labelled \"Giọng đọc của máy\", or as text only (release/ASSET_DELIVERY.md)."}
with open(f"{ROOT}/content/ko/_drafts/stories/story-audio.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump({"storyAudio": story_audio}, f, ensure_ascii=False, indent=2)
    f.write("\n")
print("seeded", len(doc["functionWords"]), "function words; device voice for every story")
