"""zh-vi reception voice manifest (P4d session 5), after ja-reception-audio.py: content/zh/reception/audio-source-manifest.json
— the two Kokoro-82M voices of the zh story cast (zh_stories_lib.cast: voice-casts.json once the zh canary has selected a
cast, until then zh-plan.md §7, A kokoro-zf_xiaobei female, B kokoro-zm_yunjian male) with the pins of
content/audio/pack-audio-manifest.json, and the band-1 `storyAudio` block zh-stories-seed.py writes to
_drafts/stories/story-audio.json. Without this file the audio plan has no reception layer for zh and every story would
count as bundled.

Staged, like every zh course file (content/zh/_drafts/staged/content/zh/reception/audio-source-manifest.json): it moves
to content/zh/reception/ with `author.ts promote`, together with the listening clips and stories it voices — in the real
tree before them, `audio.ts plan --mode generate` would stop on the missing listening.json. A voice is taken as the pack
manifest has it (status included: zf_xiaobei is still "eligible" until the canary of zh-plan.md §7 selects it).
Run after zh-stories-seed.py. usage: python -I zh-reception-audio.py <repo root>
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zh_stories_lib import cast  # noqa: E402

ROOT = sys.argv[1]
c = cast()
pack = json.load(open(f"{ROOT}/content/audio/pack-audio-manifest.json", encoding="utf-8"))
story_audio = json.load(open(f"{ROOT}/content/zh/_drafts/stories/story-audio.json", encoding="utf-8"))["storyAudio"]

ROLE = {"A": "speaker A — female voice for announcements, monologues, the story narrator and dialogue turns", "B": "speaker B — male voice for the second speaker of dialogues"}
voices = []
for speaker in ("A", "B"):
    v = next(x for x in pack["voices"] if x["id"] == c[speaker])
    if v["engine"] != "kokoro" or v["language"] != "zh" or v["status"] not in ("eligible", "selected"):
        sys.exit(f"{v['id']}: the zh reception cast must be an eligible or selected Kokoro zh voice (got {v['engine']}, {v['language']}, {v['status']})")
    voices.append({**v, "role": ROLE[speaker], "multiSpeaker": False})

manifest = {"version": 2, "pipelineVersion": 3, "storyPipelineVersion": 4, "storyAudio": story_audio,
            "note": "Pinned TTS sources for the Mandarin reception audio (P4d): the two Kokoro-82M zh voices of the story cast (zh-plan.md §7, until the zh canary of content/audio/voice-casts.json selects the cast), with the same pins as the pack manifest; verified fail-closed on every run. Their phonemes will come from the course's stored CC-CEDICT pinyin with tone sandhi for audio only (zh-plan.md §7, decision 10; built in the audio session), not from misaki's G2P. Engines, licence gate and encoding live in content/audio/engines.json. Model weights are never committed.",
            "engines": "content/audio/engines.json", "voices": voices, "excludedVoices": []}
out = f"{ROOT}/content/zh/_drafts/staged/content/zh/reception/audio-source-manifest.json"
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, "w", encoding="utf-8", newline="\n") as f:
    f.write(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
print(len(voices), "voices,", len(story_audio["stories"]), "band-1 stories")
