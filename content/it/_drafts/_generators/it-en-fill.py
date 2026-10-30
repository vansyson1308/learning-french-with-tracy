"""QC 2026-10-29 §1.3: `en` fields must be English. The Italian generators draft {vi, en} objects with en = vi;
this gives each one its English text before ingest: first from it_en_map.EN (written for this course), then from the
identical Vietnamese string already translated in the German and Spanish courses. Unresolved strings are listed.
usage: python -I it-en-fill.py <repo root>"""
import glob, json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from it_en_map import EN

ROOT = sys.argv[1]
VI = re.compile("[ăâđêôơưĂÂĐÊÔƠƯàảãáạằẳẵắặầẩẫấậèẻẽéẹềểễếệìỉĩíịòỏõóọồổỗốộờởỡớợùủũúụừửữứựỳỷỹýỵ]")
known = {}


def harvest(o):
    if isinstance(o, dict):
        if isinstance(o.get("vi"), str) and isinstance(o.get("en"), str) and not VI.search(o["en"]):
            known.setdefault(o["vi"], o["en"])
        for v in o.values():
            harvest(v)
    elif isinstance(o, list):
        for v in o:
            harvest(v)


for lang in ("de", "es"):
    for rel in glob.glob(f"{ROOT}/content/{lang}/**/*.json", recursive=True):
        if "_drafts" in rel or "derived" in rel or "lexicon" in rel:
            continue
        harvest(json.load(open(rel, encoding="utf-8")))
known.update(EN)
missing = {}


def fill(o):
    if isinstance(o, dict):
        if isinstance(o.get("vi"), str) and isinstance(o.get("en"), str) and (o["en"] == o["vi"] and VI.search(o["vi"])):
            en = known.get(o["vi"])
            if en is None:
                missing[o["vi"]] = 1
            else:
                o["en"] = en
        for v in o.values():
            fill(v)
    elif isinstance(o, list):
        for v in o:
            fill(v)


for step in sys.argv[2:] or ["readings", "listening", "speech", "writing", "scenarios", "checkpoints", "placement", "exam", "stories"]:
    path = f"{ROOT}/content/it/_drafts/{step}/OUTPUT.jsonl"
    if not os.path.exists(path):
        continue
    rows = [json.loads(l) for l in open(path, encoding="utf-8") if l.strip()]
    fill(rows)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
out = sys.stdout.buffer
out.write(f"missing {len(missing)}\n".encode("utf-8"))
for k in missing:
    out.write((json.dumps(k, ensure_ascii=False) + "\n").encode("utf-8"))
