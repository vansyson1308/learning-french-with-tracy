"""One-time build step (like ja-subset.py): the slice of four pinned sources that the zh lexicon generator needs,
written to content/zh/lexicon/derived/hsk-course.json. Offline afterwards: zh-lex.py reads only that file.

usage: python -I zh-subset.py <repo root> <hsk30.csv> <hsk30-chars.csv> <cedict_1_0_ts_utf-8_mdbg.txt.gz> <wordfreq-3.1.1-py3-none-any.whl>

Every file must hash to its pin (hsk30.csv: content/zh/lexicon/source-manifest.json; the other three: PINS below, the
retrievals of 2026-11-04); a mismatch is source-version drift and nothing is written. Downloads live outside the
repository (a scratch folder); nothing of them is committed except this derived slice:

  hsk       HSK 3.0 levels 1-3 as [id, simplified, traditional, pinyin, pos] (level facts of the 2021 standard,
            transcribed by ivankra/hsk30, MIT; variants expanded), and the level of every course word found at levels 4+;
  chars     the HSK 3.0 characters of levels 1-2 (reading level facts) and the writing level where the list gives one;
  cedict    the CC-CEDICT entries (CC BY-SA 4.0) of every HSK 1-3 word and every course word: [traditional, tone-marked
            pinyin, proper-name flag];
  wordfreq  rank and Zipf of every HSK 1-3 word and course word in wordfreq 3.1.1's large zh list (CC BY-SA 4.0 data),
            read from the pinned wheel's cBpack file (rank = position in the list; Zipf = 9 - bucket/100).
Re-run it after adding course words (core-*.txt); zh-lex.py stops and says so when a word has no CC-CEDICT entry.
"""
import csv, gzip, hashlib, io, json, os, re, sys, zipfile

sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from zh_readings import HAN, cedict_marked, nfc, parse_cedict, unpack  # noqa: E402

ROOT, HSK, CHARS, CEDICT, WHEEL = sys.argv[1:6]
OUT = "content/zh/lexicon/derived/hsk-course.json"
PINS = {
    "hsk30-chars": {"id": "hsk30", "artifact": "hsk30-chars.csv", "sha256": "8c5957108e6dafd120be10518a827a4d834ea3ce29acbfedeff1022cd7d05280", "url": "https://raw.githubusercontent.com/ivankra/hsk30/master/hsk30-chars.csv", "retrievedAt": "2026-11-04"},
    "cedict": {"id": "cedict", "artifact": "cedict_1_0_ts_utf-8_mdbg.txt.gz", "sha256": "2ec9a065cee371c2ee6a75adda056deef979ee336a7ae45b3d25f2ef2e6d427f", "url": "https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz", "retrievedAt": "2026-11-04"},
    "wordfreq": {"id": "wordfreq", "artifact": "wordfreq-3.1.1-py3-none-any.whl", "sha256": "4b1c6ecffc6198be3396d5cf871c4423ca71c907c231348d352dd54d62b97473", "url": "https://files.pythonhosted.org/packages/24/61/62835c475d69872d30689f284497853fe33fe1d6dd18f57346d13305861d/wordfreq-3.1.1-py3-none-any.whl", "retrievedAt": "2026-11-04"},
}


def manifest_pin(source_id, artifact):
    doc = json.load(open(f"{ROOT}/content/zh/lexicon/source-manifest.json", encoding="utf-8"))
    for s in doc["sources"]:
        if s["id"] == source_id and s["artifactFilename"] == artifact:
            r = s["retrieval"]
            return {"id": source_id, "artifact": artifact, "sha256": r["sha256"], "url": s["url"], "retrievedAt": r["retrievedAt"]}
    raise SystemExit(f"source-manifest: no {source_id} ({artifact})")


def check(path, pin):
    data = open(path, "rb").read()
    got = hashlib.sha256(data).hexdigest()
    if got != pin["sha256"]:
        raise SystemExit(f"{path}: sha256 {got}, the pin is {pin['sha256']} — source-version drift, nothing written")
    return data


def course_surfaces():
    out = set()
    for name in sorted(os.listdir(HERE)):
        if re.fullmatch(r"core-[0-9a-z]+\.txt", name):
            for line in open(os.path.join(HERE, name), encoding="utf-8"):
                if line.strip() and not line.startswith("#"):
                    out.add(line.split("|")[1])
    return out


def hsk_rows(data):
    rows = []
    for r in csv.DictReader(io.StringIO(data.decode("utf-8-sig"))):
        level = r["Level"]
        variants = json.loads(r["Variants"]) if r["Variants"] else [{}]
        for v in variants:
            simp = v.get("Simplified", r["Simplified"])
            if v.get("Example"):
                continue  # an example word of a prefix/suffix term (子（桌子）), not a list entry
            trad = v.get("Traditional", r["Traditional"]).split("|")[0]
            rows.append((level, [r["ID"], simp, trad, nfc(v.get("Pinyin", r["Pinyin"])), v.get("POS", r["POS"])]))
    return rows


def wordfreq_list(whl):
    z = zipfile.ZipFile(io.BytesIO(whl))
    packed = unpack(gzip.decompress(z.read("wordfreq/data/large_zh.msgpack.gz")))
    header, buckets = packed[0], packed[1:]
    if header.get("format") != "cB":
        raise SystemExit(f"wordfreq: unexpected header {header}")
    ranked = []
    for i, words in enumerate(buckets):
        for w in words:
            ranked.append((w, round(9 - i / 100, 2)))
    return ranked


def main():
    p_hsk = manifest_pin("hsk30", "hsk30.csv")
    hsk = hsk_rows(check(HSK, p_hsk))
    chars_csv = check(CHARS, PINS["hsk30-chars"]).decode("utf-8-sig")
    lines = gzip.decompress(check(CEDICT, PINS["cedict"])).decode("utf-8").splitlines()
    ranked = wordfreq_list(check(WHEEL, PINS["wordfreq"]))
    course = course_surfaces()
    early = {}
    level_of = {}
    for level, row in hsk:
        level_of.setdefault(row[1], level)
        if level in ("1", "2", "3"):
            early.setdefault(level, []).append(row)
    hsk_words = {row[1] for rows in early.values() for row in rows}
    # Every substring of a course word too, so that zh-lex.py can explain a phrase (早上好) as a chain of entries.
    pieces = {s[i:j] for s in course for i in range(len(s)) for j in range(i + 1, len(s) + 1)}
    wanted = hsk_words | pieces
    cedict = parse_cedict(lines, wanted)
    entries = {}
    for key in sorted(wanted):
        out = []
        for trad, simp, py, proper in cedict.get(key, []):
            if simp != key:
                continue  # only entries whose simplified headword is the word (a traditional headword match is a variant)
            marked = cedict_marked(py)
            if marked is not None and [trad, marked, proper] not in out:
                out.append([trad, marked, proper])
        if out:
            entries[key] = out
    rank = {}
    for i, (w, zipf) in enumerate(ranked, 1):
        if (w in hsk_words or w in course) and w not in rank:
            rank[w] = [i, zipf]
    chars = {"1": "", "2": ""}
    writing = {}
    for r in csv.DictReader(io.StringIO(chars_csv)):
        if r["Level"] in chars:
            chars[r["Level"]] += r["Hanzi"]
            if r["WritingLevel"]:
                writing[r["Hanzi"]] = r["WritingLevel"]
    # The wordfreq export the pool pinned (content/zh/lexicon/source-manifest.json, wordfreq-zh.csv) is
    # `word,zipf` of the first 50,000 words; recompute it from the wheel and say whether the bytes agree.
    export = "word,zipf\n" + "".join(f"{w},{z:.2f}\n" for w, z in ranked[:50000])
    export_sha = hashlib.sha256(export.encode("utf-8")).hexdigest()
    doc = {
        "generator": "content/zh/_drafts/_generators/zh-subset.py",
        "sources": [p_hsk, PINS["hsk30-chars"], PINS["cedict"], PINS["wordfreq"]],
        "note": "Build-time slice. HSK 3.0 levels are facts about the 2021 standard (GF0025-2021), transcribed by ivankra/hsk30 (MIT; its README notes the Ministry's copyright notice and that the list may be public domain under PRC law): no list text is shown to learners. CC-CEDICT readings (CC BY-SA 4.0) are the pinyin and traditional spelling of every lexeme. wordfreq ranks are selection evidence only; lexeme `frequency` stays the manifest's measurement source (FrequencyWords).",
        "wordfreqExport": {"sha256": export_sha, "matchesPoolPin": export_sha == manifest_pin("wordfreq", "wordfreq-zh.csv")["sha256"], "words": len(ranked)},
        "hsk": early,
        "courseLevels": {w: level_of[w] for w in sorted(course) if w in level_of},
        "chars": chars,
        "writingLevel": writing,
        "cedict": entries,
        "wordfreq": {w: rank[w] for w in sorted(rank)},
    }
    with open(f"{ROOT}/{OUT}", "w", encoding="utf-8", newline="\n") as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)
        f.write("\n")
    missing = sorted(w for w in course if w not in entries)
    print(OUT, {k: len(v) for k, v in early.items()}, "chars", {k: len(v) for k, v in chars.items()}, "cedict", len(entries), "wordfreq", len(rank), "export matches pool pin:", doc["wordfreqExport"]["matchesPoolPin"])
    for w in missing:
        print("  no CC-CEDICT entry:", w)


main()
