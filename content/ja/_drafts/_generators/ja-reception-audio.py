"""ja-vi reception voice manifest (P4c audio): writes content/ja/reception/audio-source-manifest.json as
en-reception-s3.py does for en — the two Kokoro-82M voices of the ja cast (content/audio/voice-casts.json: A kokoro-jf_alpha,
female; B kokoro-jm_kumo, male) with the pins of content/audio/pack-audio-manifest.json, and the band-1 `storyAudio`
block ja-stories-seed.py writes to _drafts/stories/story-audio.json. Without this file the audio plan has no reception
layer for ja (no listening clip, no story sentence) and every story would count as bundled.
Run after ja-stories-seed.py. usage: python -I ja-reception-audio.py <repo root>
"""
import json, sys

ROOT = sys.argv[1]
cast = json.load(open(f"{ROOT}/content/audio/voice-casts.json", encoding="utf-8"))["languages"]["ja"]["cast"]
pack = json.load(open(f"{ROOT}/content/audio/pack-audio-manifest.json", encoding="utf-8"))
story_audio = json.load(open(f"{ROOT}/content/ja/_drafts/stories/story-audio.json", encoding="utf-8"))["storyAudio"]

ROLE = {"A": "speaker A — female voice for announcements, monologues and dialogue turns", "B": "speaker B — male voice for the second speaker of dialogues"}
voices = []
for speaker in ("A", "B"):
    v = next(x for x in pack["voices"] if x["id"] == cast[speaker])
    if v["engine"] != "kokoro" or v["status"] != "selected":
        sys.exit(f"{v['id']}: the ja reception cast must be a selected Kokoro voice (got {v['engine']}, {v['status']})")
    voices.append({**v, "role": ROLE[speaker], "multiSpeaker": False})

manifest = {"version": 2, "pipelineVersion": 3, "storyPipelineVersion": 4, "storyAudio": story_audio,
            "note": "Pinned TTS sources for the Japanese reception audio (P4c): the two Kokoro-82M voices of the ja cast (content/audio/voice-casts.json), with the same pins as the pack manifest; verified fail-closed on every run. Their phonemes come from the course's stored readings (engines.json kokoro.phonemeFrontends.ja), not from misaki's G2P. Engines, licence gate and encoding live in content/audio/engines.json. Model weights are never committed.",
            "engines": "content/audio/engines.json", "voices": voices, "excludedVoices": []}
with open(f"{ROOT}/content/ja/reception/audio-source-manifest.json", "w", encoding="utf-8", newline="\n") as f:
    f.write(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
print(len(voices), "voices,", len(story_audio["stories"]), "band-1 stories")
