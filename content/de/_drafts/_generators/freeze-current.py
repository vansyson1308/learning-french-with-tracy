"""Make the current reviewed lexicon (minus lexicon-add entries, which are not in the pool) the frozen map;
extend exclude.json with subtitle junk and secondary readings seen at size 960."""
import json, pathlib
S = pathlib.Path(r"C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-app-hoc-ngoai-ngu\82ea6b33-e22d-4a2d-907b-9b4441f9e202\scratchpad")
cur = json.load(open(S / "de-lexemes-current.json", encoding="utf-8"))["lexemes"]
added = {l["id"] for l in cur if all(r["source"] == "original-lexicon-etl" for r in l["sourceRefs"])}
frozen = {l["surface"]: l["id"] for l in cur if l["id"] not in added}
(S / "de-frozen-reviewed.json").write_text(json.dumps(frozen, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(S / "de-lexemes-reviewed-old.json").write_text(json.dumps({"version": 1, "language": "de", "lexemes": [l for l in cur if l["id"] not in added]}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("frozen", len(frozen), "lexicon-add ids", len(added), sorted(added)[:5])

ex_path = pathlib.Path(r"C:\src\lft\content\de\lexicon\exclude.json")
ex = json.load(open(ex_path, encoding="utf-8"))
have = {e["key"] for e in ex["entries"]}
for k, why in [
    ("durch|adjective", "colloquial 'crazy'; the learner's durch is the preposition"),
    ("bar|adjective", "'bare'; marginal at A1"),
    ("lose|adjective", "'loose'; marginal at A1"),
    ("losen|verb", "'to draw lots'; subtitle artefact of the form 'los'"),
    ("verdammt|adjective", "subtitle-corpus swearing"),
    ("Warte|noun", "'lookout post'; artefact of the form 'warte' (warten)"),
    ("Weiß|noun", "nominalised colour; artefact of the form 'weiß' (wissen / weiß)"),
    ("wagen|verb", "'to dare'; artefact of the form 'Wagen'"),
    ("schonen|verb", "'to spare'; artefact of the form 'schon'"),
    ("dank|preposition", "'thanks to' (B1); the learner meets danke"),
    ("Kerl|noun", "colloquial 'guy'"),
    ("ab|adjective", "colloquial 'off'; the learner's ab is the preposition/particle"),
    ("willkommen|adjective", "duplicates the greeting Willkommen"),
    ("los|adverb", "'rid of'; the learner's los is the interjection 'let's go'"),
]:
    if k not in have:
        ex["entries"].append({"key": k, "reason": why})
ex_path.write_text(json.dumps(ex, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
print("exclusions", len(ex["entries"]))
