"""Filter the published Japanese kaikki dump to the course's verbs and adjectives, hashing what passes through (P4c
session 3; the ja counterpart of content/en/_drafts/_generators/en-kaikki-subset.py). The dump is CC BY-SA: only the
derived morphology rows are committed (content/ja/lexicon/derived/morphology.json), never the dump or this subset.

usage: python -I ja-kaikki-subset.py <repo root> <empty dir>/ja <kaikki.org-dictionary-Japanese.jsonl.gz>
       (the .gz from https://kaikki.org/dictionary/Japanese/kaikki.org-dictionary-Japanese.jsonl.gz, downloaded into its
       own empty folder first; "-" reads it from stdin)
Writes <dir>/subset.jsonl and <dir>/identity.json (sha256 and bytes of the gz and of the jsonl). Then:
       bun scripts/lexicon-etl.ts supplement --lang ja --dir <empty dir>
Words: every verb and adjective lemma of content/ja/lexicon/lexemes.json; a する verb also brings its noun (勉強 for
勉強する), the headword kaikki files the suru conjugation under."""
import gzip, hashlib, json, os, sys

root, out_dir, source = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out_dir, exist_ok=True)
lexemes = json.load(open(f"{root}/content/ja/lexicon/lexemes.json", encoding="utf-8"))["lexemes"]
wanted = set()
for lx in lexemes:
    if lx["partOfSpeech"] not in ("verb", "adjective"):
        continue
    wanted.add(lx["lemma"])
    if lx["partOfSpeech"] == "verb" and lx["lemma"].endswith("する") and len(lx["lemma"]) > 2:
        wanted.add(lx["lemma"][:-2])

gz_sha, raw_sha = hashlib.sha256(), hashlib.sha256()
gz_bytes = raw_bytes = 0


class Tap:
    def __init__(self, f):
        self.f = f

    def read(self, n=-1):
        global gz_bytes
        b = self.f.read(n)
        gz_sha.update(b)
        gz_bytes += len(b)
        return b


stream = sys.stdin.buffer if source == "-" else open(source, "rb")
lines = kept = bad = 0
with open(f"{out_dir}/subset.jsonl", "w", encoding="utf-8", newline="\n") as out:
    for line in gzip.GzipFile(fileobj=Tap(stream)):
        raw_sha.update(line)
        raw_bytes += len(line)
        lines += 1
        try:
            e = json.loads(line)
        except ValueError:
            bad += 1
            continue
        if e.get("lang_code") != "ja" or e.get("word") not in wanted or e.get("pos") not in ("verb", "adj"):
            continue
        keep = {k: e[k] for k in ("word", "pos", "lang_code", "etymology_number", "forms", "head_templates") if k in e}
        out.write(json.dumps(keep, ensure_ascii=False, sort_keys=True) + "\n")
        kept += 1
while True:  # the gzip reader may stop before the last bytes: the hash covers the whole file
    b = stream.read(1 << 20)
    if not b:
        break
    gz_sha.update(b)
    gz_bytes += len(b)
json.dump({"gzSha256": gz_sha.hexdigest(), "gzBytes": gz_bytes, "sha256": raw_sha.hexdigest(), "bytes": raw_bytes, "lines": lines, "kept": kept, "badLines": bad}, open(f"{out_dir}/identity.json", "w"), indent=1)
print("lines", lines, "kept", kept, "bad", bad, "gz", gz_bytes, gz_sha.hexdigest())
