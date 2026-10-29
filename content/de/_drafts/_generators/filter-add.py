"""Keep only lexicon-add records whose surface the authored lexicon does not have yet; add fünfzehn."""
import json, pathlib
L = {l["surface"] for l in json.load(open(r"C:\src\lft\content\de\lexicon\lexemes.json", encoding="utf-8"))["lexemes"]}
src = pathlib.Path(r"C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-app-hoc-ngoai-ngu\82ea6b33-e22d-4a2d-907b-9b4441f9e202\scratchpad\de-lexicon-add-all.jsonl")
recs = [json.loads(l) for l in src.read_text(encoding="utf-8").splitlines() if l.strip()]
if not any(r["lemma"] == "fünfzehn" for r in recs):
    recs.append({"lemma": "fünfzehn", "partOfSpeech": "determiner", "glossEn": "fifteen", "glossVi": "mười lăm", "topic": "numbers",
                 "examples": [{"target": "Die Pause dauert fünfzehn Minuten.", "en": "The break lasts fifteen minutes.", "vi": "Giờ nghỉ kéo dài mười lăm phút."}]})
    src.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in recs), encoding="utf-8")
surface = lambda r: (({"masculine": "der ", "feminine": "die ", "neuter": "das "}.get(r.get("gender"), "")) + r["lemma"]) if r["partOfSpeech"] == "noun" else r["lemma"]
keep = [r for r in recs if surface(r) not in L]
pathlib.Path(r"C:\src\lft\content\de\_drafts\lexicon-add\OUTPUT.jsonl").write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in keep), encoding="utf-8")
print("lexicon-add keep", len(keep), "of", len(recs))
