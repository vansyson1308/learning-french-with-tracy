"""Filter the published English kaikki dump to the course's words, hashing what passes through. Run outside the repository's data:
the dump is CC BY-SA and only derived rows are committed (content/en/lexicon/derived/, see sources/kaikki-en.md).

usage: curl -sSL --fail https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl.gz \
         | python -I en-kaikki-subset.py <repo root> <empty dir>/en
Writes <dir>/subset.jsonl and <dir>/identity.json (sha256 and bytes of the gz and of the jsonl). Then:
         bun scripts/lexicon-etl.ts supplement --lang en --dir <empty dir>
Words: the candidate pool's lemmas, the curated lists with their parts and forms, every word of the authored content/en layers."""
import glob, gzip, hashlib, json, os, re, sys

root, out_dir = sys.argv[1], sys.argv[2]
os.makedirs(out_dir, exist_ok=True)
words = {e["lemma"] for e in json.load(open(f"{root}/content/en/lexicon/derived/candidate-pool.json", encoding="utf-8"))["entries"]}
for path in glob.glob(f"{root}/content/en/_drafts/_generators/core-*.txt"):
    for line in open(path, encoding="utf-8"):
        p = line.rstrip("\n").split("|")
        if len(p) == 9:
            words |= {p[1], *p[1].split(), *(x for x in re.split(r"[ ,/]+", p[8]) if x and x != "-")}
for path in glob.glob(f"{root}/content/en/**/*.json", recursive=True):
    if "derived" in path or "_drafts" in path:
        continue
    for w in re.findall(r"[A-Za-z][A-Za-z'’-]+", open(path, encoding="utf-8").read()):
        words |= {w, w.lower().replace("’", "'")}
wanted = {w.lower() for w in words}

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


lines = kept = bad = 0
with open(f"{out_dir}/subset.jsonl", "w", encoding="utf-8", newline="\n") as out:
    for line in gzip.GzipFile(fileobj=Tap(sys.stdin.buffer)):
        raw_sha.update(line)
        raw_bytes += len(line)
        lines += 1
        try:
            e = json.loads(line)
        except ValueError:
            bad += 1
            continue
        if e.get("lang_code") != "en" or not isinstance(e.get("word"), str) or e["word"].lower() not in wanted:
            continue
        keep = {k: e[k] for k in ("word", "pos", "lang_code", "etymology_number", "sounds", "forms", "tags") if k in e}
        keep["senses"] = [{k: s[k] for k in ("glosses", "tags", "form_of", "alt_of") if k in s} for s in e.get("senses", [])]
        out.write(json.dumps(keep, ensure_ascii=False, sort_keys=True) + "\n")
        kept += 1
while True:  # the gzip reader may stop before the last bytes: the hash covers the whole file
    b = sys.stdin.buffer.read(1 << 20)
    if not b:
        break
    gz_sha.update(b)
    gz_bytes += len(b)
json.dump({"gzSha256": gz_sha.hexdigest(), "gzBytes": gz_bytes, "sha256": raw_sha.hexdigest(), "bytes": raw_bytes, "lines": lines, "kept": kept, "badLines": bad}, open(f"{out_dir}/identity.json", "w"), indent=1)
print("lines", lines, "kept", kept, "bad", bad, "gz", gz_bytes, gz_sha.hexdigest())
