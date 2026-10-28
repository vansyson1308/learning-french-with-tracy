import json, pathlib
S = pathlib.Path(r"C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-app-hoc-ngoai-ngu\82ea6b33-e22d-4a2d-907b-9b4441f9e202\scratchpad")
rec = {"lemma": "Zimmer", "partOfSpeech": "noun", "gender": "neuter", "glossEn": "room", "glossVi": "căn phòng, phòng", "topic": "home",
       "examples": [{"target": "Das Zimmer ist klein.", "en": "The room is small.", "vi": "Căn phòng nhỏ."}, {"target": "Haben Sie ein Zimmer frei?", "en": "Do you have a room free?", "vi": "Ông/bà còn phòng trống không?"}]}
allp = S / "de-lexicon-add-all.jsonl"
recs = [json.loads(l) for l in allp.read_text(encoding="utf-8").splitlines() if l.strip()]
if not any(r["lemma"] == "Zimmer" for r in recs):
    recs.append(rec)
    allp.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in recs), encoding="utf-8")
pathlib.Path(r"C:\src\lft\content\de\_drafts\lexicon-add\OUTPUT.jsonl").write_text(json.dumps(rec, ensure_ascii=False) + "\n", encoding="utf-8")
print("ok", len(recs))
