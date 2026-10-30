"""D-10 independent audit: a random 10 % of the lines the first review pass did not change, and 10 of its fixes.
usage: python -I it-vi-audit-sample.py <dir holding it-review-answers.txt and it-review-language.txt> <out dir>"""
import json, os, random, sys

src, out = sys.argv[1], sys.argv[2]
HERE = os.path.dirname(os.path.abspath(__file__))
SEED = 20261031
rng = random.Random(SEED)


def read(name):
    with open(f"{src}/{name}", encoding="utf-8") as f:
        return [l.rstrip("\n") for l in f if "\t" in l]


def ids(name):
    with open(f"{HERE}/{name}", encoding="utf-8") as f:
        return {str(x["id"]) for x in json.load(f)}


answer_ids = {i if i.startswith(("it-vi:", "it.")) else f"it-vi:{i}" for i in ids("findings-answers.json")}
language_ids = ids("findings-language.json")
answers = read("it-review-answers.txt")
language = read("it-review-language.txt")
passed_answers = [l for l in answers if l.split("\t", 1)[0] not in answer_ids]
passed_language = [l for l in language if l.split("\t", 1)[0] not in language_ids]
sample_answers = rng.sample(passed_answers, round(len(passed_answers) * 0.1))
sample_language = rng.sample(passed_language, round(len(passed_language) * 0.1))
with open(f"{HERE}/decisions-language.json", encoding="utf-8") as f:
    fixes = rng.sample([d for d in json.load(f) if d.get("severity") in ("P0", "P1")], 5)
with open(f"{HERE}/decisions-answers.json", encoding="utf-8") as f:
    fixes += rng.sample([d for d in json.load(f) if d.get("decision") == "fixed"], 5)

with open(f"{out}/it-audit-sample.txt", "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(sample_answers + sample_language) + "\n")
with open(f"{out}/it-audit-fixes.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump(fixes, f, ensure_ascii=False, indent=1)
meta = {
    "seed": SEED,
    "exercises": {"lines": len(answers), "passed": len(passed_answers), "sample": len(sample_answers)},
    "language": {"lines": len(language), "passed": len(passed_language), "sample": len(sample_language)},
    "fixesRechecked": len(fixes),
}
with open(f"{HERE}/it-vi-audit-sample.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump(meta, f, ensure_ascii=False, indent=1)
    f.write("\n")
print(meta)
