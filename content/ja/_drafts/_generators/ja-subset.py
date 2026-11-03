"""One-time build step (like en-kaikki-subset.py): the slice of two pinned sources that the ja lexicon generator needs,
written to content/ja/lexicon/derived/jlpt-course.json. Offline afterwards: ja-lex.py reads only that file.

usage: python -I ja-subset.py <repo root> <openjlpt-0.1.0.tar.gz> <JmdictFurigana.json>

Both files must hash to their pins (openjlpt: content/ja/lexicon/source-manifest.json; JmdictFurigana:
content/ja/lexicon/readings-manifest.json); a mismatch is source-version drift and nothing is written.
Downloads live outside the repository (a scratch folder); nothing of them is committed except this derived slice:

  jlpt      the N5 and N4 vocabulary of OpenJLPT 0.1.0 as [word, reading] pairs (level facts: Waller's lists, CC BY,
            redistributed by OpenJLPT under CC BY-SA 4.0), and its N5 and N4 kanji;
  furigana  the JmdictFurigana entries (CC BY-SA 4.0) that the reading chain of a course word (core-*.txt, surface and
            authored kana) uses — see ja_readings.py — as {"text|reading": [[base, ruby or null], ...]}.
Re-run it after adding course words with kanji; ja-lex.py stops and says so when a reading is missing.
"""
import hashlib, io, json, os, re, sys, tarfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from ja_readings import HAN, chain, hira, index  # noqa: E402

ROOT, TARBALL, FURIGANA = sys.argv[1], sys.argv[2], sys.argv[3]
OUT = "content/ja/lexicon/derived/jlpt-course.json"


def pin(manifest_rel, source_id):
    doc = json.load(open(f"{ROOT}/{manifest_rel}", encoding="utf-8"))
    for s in doc["sources"]:
        if s["id"] == source_id:
            sha = s["sha256"] if "sha256" in s else s["retrieval"]["sha256"]
            at = s["retrievedAt"] if "retrievedAt" in s else s["retrieval"]["retrievedAt"]
            return {"id": source_id, "sha256": sha, "url": s["url"], "retrievedAt": at}
    raise SystemExit(f"{manifest_rel}: no source {source_id}")


def check(path, p):
    data = open(path, "rb").read()
    got = hashlib.sha256(data).hexdigest()
    if got != p["sha256"]:
        raise SystemExit(f"{path}: sha256 {got}, the manifest pins {p['sha256']} — source-version drift, nothing written")
    return data


def course_rows():
    """(surface, kana) of every course row with a kanji."""
    out = set()
    for name in sorted(os.listdir(HERE)):
        if re.fullmatch(r"core-[0-9a-z]+\.txt", name):
            for line in open(os.path.join(HERE, name), encoding="utf-8"):
                if line.strip() and not line.startswith("#"):
                    p = line.split("|")
                    if HAN.search(p[1]):
                        out.add((p[1], p[2]))
    return sorted(out)


def main():
    p_jlpt = pin("content/ja/lexicon/source-manifest.json", "openjlpt")
    p_furi = pin("content/ja/lexicon/readings-manifest.json", "jmdict-furigana")
    tar = tarfile.open(fileobj=io.BytesIO(check(TARBALL, p_jlpt)), mode="r:gz")
    levels, kanji = {}, {}
    for lvl in ("n5", "n4"):
        vocab = json.load(tar.extractfile(f"openjlpt-0.1.0/data/json/vocab/{lvl}.json"))
        levels[lvl.upper()] = [[e["word"], e["reading"]] for e in vocab]
        kanji[lvl.upper()] = "".join(k["character"] for k in json.load(tar.extractfile(f"openjlpt-0.1.0/data/json/kanji/{lvl}.json")))
    rows = course_rows()
    pieces = {s[i:j] for s, _ in rows for i in range(len(s)) for j in range(i + 1, len(s) + 1) if HAN.search(s[i:j])}
    candidates = {}
    for e in json.loads(check(FURIGANA, p_furi).decode("utf-8-sig")):
        segs = [[seg["ruby"], seg.get("rt")] for seg in e["furigana"]]
        last = max((i for i, s in enumerate(segs) if s[1] is not None), default=-1)
        stem = "".join(s[0] for s in segs[: last + 1])
        if e["text"] in pieces or stem in pieces:
            candidates[f"{e['text']}|{e['reading']}"] = segs
    by_text = index(candidates)
    used, missing = set(), []
    for surface, kana in rows:
        found = chain(surface, kana, by_text)
        if found is None:
            missing.append(f"{surface} ({kana})")
        else:
            used.update(found[1])
    doc = {
        "generator": "content/ja/_drafts/_generators/ja-subset.py",
        "sources": [p_jlpt, p_furi],
        "note": "Build-time slice: OpenJLPT N5/N4 level facts (word, reading) and kanji, and the JmdictFurigana entries the course words' reading chains use. The JLPT publishes no official lists; these are community approximations (OpenJLPT NOTICE.md).",
        "jlpt": levels,
        "kanji": kanji,
        "furigana": {k: candidates[k] for k in sorted(used)},
    }
    with open(f"{ROOT}/{OUT}", "w", encoding="utf-8", newline="\n") as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(OUT, {k: len(v) for k, v in levels.items()}, {k: len(v) for k, v in kanji.items()}, "furigana", len(used), "unexplained", len(missing))
    for m in missing:
        print("  no chain:", m)


main()
