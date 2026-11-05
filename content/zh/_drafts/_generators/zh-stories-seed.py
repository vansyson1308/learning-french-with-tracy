"""Seed the staged content/zh/stories/stories.json, after ja-stories-seed.py: the voice cast (N narrates with A's voice;
voice-casts.json once the zh canary has selected a cast, until then the cast of zh-plan.md §7 — A kokoro-zf_xiaobei
female, B kokoro-zm_yunjian male, zh_stories_lib.cast), the function words of zh_stories_lib.py, no file-level token map
(each story maps its own names). The stories come through `author ingest stories`. Also writes
_drafts/stories/story-audio.json: the `storyAudio` block zh-reception-audio.py puts into the reception voice manifest
(band-1 audio: the first STORY_AUDIO_MAX_BUNDLED stories of the reading order after the micro-stories,
scripts/lib/stories.ts bandOneOrder).
usage: python -I zh-stories-seed.py <repo root>"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zh_stories_lib import BANDS, FUNCTION, cast  # noqa: E402

ROOT = sys.argv[1]
path = f"{ROOT}/content/zh/_drafts/staged/content/zh/stories/stories.json"
c = cast()
doc = {"version": 1, "language": "zh",
       "voiceCast": {"N": {"voiceId": c["A"], "speaker": None}, "A": {"voiceId": c["A"], "speaker": None}, "B": {"voiceId": c["B"], "speaker": None}},
       "functionWords": sorted(set(FUNCTION)), "stories": []}
os.makedirs(os.path.dirname(path), exist_ok=True)
with open(path, "w", encoding="utf-8", newline="\n") as f:
    json.dump(doc, f, ensure_ascii=False, indent=2)
    f.write("\n")

STORY_AUDIO_MAX_BUNDLED = 18
stories = [json.loads(line) for line in open(f"{ROOT}/content/zh/_drafts/stories/OUTPUT.jsonl", encoding="utf-8")]
order = [s["id"] for _, s in sorted(enumerate(stories), key=lambda p: (BANDS.index(p[1]["band"]), p[0])) if s["band"] != "A1-0"]
story_audio = {"bundled": "band-1", "stories": order[:STORY_AUDIO_MAX_BUNDLED],
               "reason": "QC 2026-10-29b §2.3 + Opus (CI-proven 2026-10-30, PR #51), as in es, it, en and ja: the first 18 stories of the reading order after the A1-0 micro-stories bundle sentence audio as Opus 16 kbps (ja measured 2.77 MB for its 18; zh-plan.md §7 keeps zh near 9 MB of the 12 MB cap); the micro-stories and every other story are read with the device voice, labelled \"Giọng đọc của máy\" (release/ASSET_DELIVERY.md)."}
with open(f"{ROOT}/content/zh/_drafts/stories/story-audio.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump({"storyAudio": story_audio}, f, ensure_ascii=False, indent=2)
    f.write("\n")
print("seeded", len(doc["functionWords"]), "function words;", len(story_audio["stories"]), "stories bundle audio")
