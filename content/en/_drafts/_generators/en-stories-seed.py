"""Seed the staged content/en/stories/stories.json: voice cast from content/audio/voice-casts.json, function words, the shared
token map. The stories come through `author ingest stories`. usage: python -I en-stories-seed.py <repo root>"""
import json, os, sys

ROOT = sys.argv[1]
path = f"{ROOT}/content/en/_drafts/staged/content/en/stories/stories.json"
cast = json.load(open(f"{ROOT}/content/audio/voice-casts.json", encoding="utf-8"))["languages"]["en"]["cast"]
ids = {l["surface"]: l["id"] for l in json.load(open(f"{ROOT}/content/en/lexicon/lexemes.json", encoding="utf-8"))["lexemes"]}
# Only what is not a lexeme of its own, except the present and past of `be` and `not`, which every sentence needs at any band.
# A contraction splits after its apostrophe (segmentSentence): don't = don' + t, I'm = i' + m. The negative heads and the tails are here.
FUNCTION = ("am is are was were not "
            "m re ve ll d s t "
            "don' doesn' didn' isn' aren' wasn' weren' can' won' couldn' wouldn' shouldn' hasn' haven' hadn' mustn' "
            "its oh ok").split()
# Contraction heads resolve to the word they are.
HEADS = {"i'": "I", "you'": "you", "he'": "he", "she'": "she", "it'": "it", "we'": "we", "they'": "they", "that'": "that", "there'": "there",
         "what'": "what", "where'": "where", "who'": "who", "here'": "here", "how'": "how", "let'": "let"}
# `lost` is the past of lose unless a story maps it back to the adjective. change and answer are noun lexemes, so the verb evidence does not
# reach their verb forms. Every other verb form comes from morphology.json.
FORMS = {"mom": "mother", "grandma": "grandmother", "officer": "police", "lost": "lose", "changed": "change", "changing": "change", "answered": "answer", "answering": "answer"}
token_map = {k: ids[v] for k, v in {**HEADS, **FORMS}.items()}
doc = {"version": 1, "language": "en",
       "voiceCast": {"N": {"voiceId": cast["A"], "speaker": None}, "A": {"voiceId": cast["A"], "speaker": None}, "B": {"voiceId": cast["B"], "speaker": None}},
       "functionWords": sorted(set(FUNCTION)), "tokenMap": dict(sorted(token_map.items())), "stories": []}
os.makedirs(os.path.dirname(path), exist_ok=True)
with open(path, "w", encoding="utf-8", newline="\n") as f:
    json.dump(doc, f, ensure_ascii=False, indent=2)
    f.write("\n")
print("seeded", len(doc["functionWords"]), "function words")
