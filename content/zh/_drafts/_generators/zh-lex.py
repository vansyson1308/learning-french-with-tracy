"""Chinese lexicon for zh-vi from the curated lists core-*.txt (hand-chosen, hand-glossed in Vietnamese and English).

usage: python -I zh-lex.py <repo root>          write every output below (byte-deterministic)
       python -I zh-lex.py <repo root> split    after `course-draft.ts syllabus --target zh`: move the core-a2 words out of
                                                the staged syllabus.json into the staged syllabus-a2-1.json

Writes content/zh/lexemes.json (the frozen surface → id map: an id, once written, never changes), and under
content/zh/lexicon/: lexemes.json, REVIEW.md, legacy-unmapped.json; the staged topic-units.json
(content/zh/_drafts/staged/...); content/zh/_drafts/review/hanzi.json; and content/hanviet/zh.json, merging
hanviet-zh.txt into the P4b table.

Row format (core-*.txt):  kind|surface|pinyin|vi|en|topic|example|example vi|example en
kind: N noun, V verb, A adjective, D adverb, P pronoun, T determiner (每), Q preposition, C conjunction, J interjection,
E expression, X particle or affix (了, 吗, 的, 第), M measure word, U numeral, R proper noun (a city or a family name: a
noun read with pinyin, never a daily new word, no Hán-Việt). M and U are stored as partOfSpeech "other".
surface: simplified characters, the course spelling (traditional is accepted through the stored `traditional`).
pinyin: empty, or the tone-marked syllables (space-separated) when the word has more than one reading.

Readings come only from CC-CEDICT (derived/hsk-course.json, written by zh-subset.py), in citation tones (tone sandhi of
3-3, 不 and 一 is taught, never stored): the entry whose simplified headword is the surface and whose reading the
HSK 3.0 list confirms (tone-exact, else toneless — CC-CEDICT's tones are kept), else the only reading CC-CEDICT has,
else the row's pinyin, which must be one of CC-CEDICT's readings. A surface with no entry may be a chain of entries
(早上好 = 早上 + 好). Nothing is guessed: a surface nothing explains stops the run.

Levels: HSK 3.0 (ivankra/hsk30) is an anchor only (anchors-left-out.txt gives the reason each HSK 1 word is not taken).
Examples are original; an A1 example uses only characters that A1 surfaces teach (names in NAMES aside), an A2-1 example
only characters of the lexicon.
"""
import json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from zh_readings import HAN, compact, is_syllable, nfc, strip_tones, tones_of  # noqa: E402

ROOT = sys.argv[1]
MODE = sys.argv[2] if len(sys.argv) > 2 else "all"
CORE = ["core-0.txt", "core-1.txt", "core-2.txt", "core-3.txt", "core-4.txt", "core-5.txt", "core-6.txt", "core-7.txt", "core-8.txt"]
LATER = "core-a2.txt"
STAGED = "content/zh/_drafts/staged"
POS = {"N": "noun", "V": "verb", "A": "adjective", "D": "adverb", "P": "pronoun", "T": "determiner", "Q": "preposition", "C": "conjunction", "J": "interjection", "E": "expression", "X": "other", "M": "other", "U": "other", "R": "noun"}
TOPICS = {"people", "greetings", "food", "animals", "travel", "everyday", "places", "shopping", "time", "family", "home", "body", "clothing", "colors", "numbers", "weather", "nature", "work", "school", "feelings", "leisure", "technology"}
# Names in examples: characters, not vocabulary (Vietnamese and Chinese family and given names, cities).
NAMES = ["胡志明市", "北京", "上海", "台北", "台湾", "河内", "广州", "深圳", "阮", "黎", "范", "王", "李", "张", "刘", "陈", "林", "兰", "明", "华", "芳", "强", "丽", "英", "文", "安", "南"]
# The zh-en basic pack is never edited: its surfaces are taught with the pack's own English glosses. None needs a legacy
# surface or an unmapped reason today; the two maps stay for the check below.
LEGACY = {}
UNMAPPED = {}
# The 36 Hán-Việt pairs P4b authored in content/hanviet/zh.json; zh-lex.py keeps them as they are and adds hanviet-zh.txt.
P4B_WORDS = set("世界 中国 介绍 休息 公司 关系 医生 历史 发展 商店 国家 图书馆 大学 天气 学习 学校 学生 家庭 工作 文化 时间 朋友 欢迎 汉语 生日 电影 电脑 电话 经济 老师 认识 越南 银行 问题 音乐 飞机".split())
# D-10 review (P4d): false-friend notes added to P4b entries; a P4b note on an unconfirmed character is kept in front.
P4B_NOTES = {
    "认识": "False friend: 认识 means to know a person, to be acquainted (quen biết); Vietnamese nhận thức means awareness or cognition.",
    "工作": "Partly a false friend: 工作 is a job, to work (công việc, làm việc); Vietnamese công tác is an assignment or a business trip.",
    "医生": "医生 is a doctor (bác sĩ); Vietnamese y sinh is an old word for a physician or a medical student.",
}
# The P4b note those entries already carried (a character Unihan cannot confirm), kept verbatim after the new note.
P4B_KEPT_NOTES = {"认识": "识: Unihan 17.0.0 has no kVietnamese for 识 or 識; thức is the standard Hán-Việt reading."}
UNIT_ORDER = ["1", "2", "3", "4", "5", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v"]
# Where a lexeme no unit's word list teaches first unlocks in the daily words. Keys: topic, or topic:partOfSpeech.
TOPIC_UNITS = {
    "greetings": "1", "people": "2", "people:pronoun": "a", "people:verb": "l", "people:adjective": "n", "people:other": "b",
    "family": "3", "family:verb": "3", "food": "4", "food:verb": "4", "food:adjective": "s", "food:other": "s",
    "numbers": "5", "numbers:other": "b", "shopping": "5", "shopping:verb": "i", "shopping:adjective": "i", "shopping:other": "b",
    "everyday": "a", "everyday:verb": "c", "everyday:adjective": "n", "everyday:adverb": "a", "everyday:other": "a", "everyday:conjunction": "p",
    "everyday:pronoun": "a", "everyday:determiner": "b", "everyday:preposition": "c", "everyday:expression": "k", "everyday:interjection": "k",
    "time": "d", "time:verb": "d", "time:adverb": "d", "time:adjective": "d", "time:other": "d",
    "home": "c", "home:verb": "j", "home:adjective": "j", "home:other": "b", "places": "c", "places:pronoun": "c", "places:verb": "t", "places:adjective": "t", "places:preposition": "t", "places:other": "c",
    "travel": "h", "travel:verb": "t", "travel:adverb": "t", "travel:other": "h", "school": "e", "school:verb": "e", "school:adjective": "e", "school:other": "e",
    "work": "g", "work:verb": "g", "work:adjective": "g", "work:expression": "k", "work:adverb": "g", "work:other": "g",
    "body": "u", "body:adjective": "u", "body:verb": "u", "body:expression": "u", "body:other": "u",
    "clothing": "j", "clothing:verb": "j", "clothing:other": "b", "colors": "n", "colors:adjective": "n",
    "weather": "f", "weather:verb": "f", "weather:adjective": "f", "nature": "f", "nature:verb": "f", "animals": "f", "animals:other": "b",
    "feelings": "l", "feelings:adjective": "l", "feelings:verb": "l", "feelings:adverb": "l",
    "leisure": "m", "leisure:verb": "m", "leisure:adjective": "m", "technology": "v", "technology:verb": "v", "technology:other": "v",
}
DERIVATION = "members: lexemes taught by the primary course + course-authored lexemes (source original-lexicon-etl only) + lexemes the course added through lexicon-add + frequency bands very-common/common; unit: first unit teaching the lexeme, else the authored topic map (topic-units.json, topic:pos before topic), else first unit teaching its topic, else the first unit; order: unit, then frequency rank; the words of content/zh/_drafts/_generators/core-a2.txt are band A2-1 (syllabus-a2-1.json)"


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def read_rows(name, band):
    out = []
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        for n, line in enumerate(f, 1):
            line = line.rstrip("\n")
            if not line.strip() or line.startswith("#"):
                continue
            p = line.split("|")
            if len(p) != 9:
                raise SystemExit(f"{name}:{n}: expected 9 columns, got {len(p)}: {line}")
            kind, surface, pinyin, vi, en, topic, ex, ex_vi, ex_en = p
            if kind not in POS or topic not in TOPICS or not all([kind, surface, vi, en, topic, ex, ex_vi, ex_en]):
                raise SystemExit(f"{name}:{n}: bad row: {line}")
            if not all(HAN.match(c) for c in surface):
                raise SystemExit(f"{name}:{n}: surface is not hanzi only: {surface}")
            out.append({"kind": kind, "surface": surface, "given": nfc(pinyin), "vi": vi, "en": en, "topic": topic, "example": (ex, ex_vi, ex_en), "band": band, "file": name, "line": n})
    return out


def load_subset():
    return json.load(open(f"{ROOT}/content/zh/lexicon/derived/hsk-course.json", encoding="utf-8"))


def hsk_index(subset):
    """simplified → [(level, pinyin, pos)] over HSK 1-3 (and the course words' own levels beyond)."""
    out = {}
    for lvl, rows in subset["hsk"].items():
        for _id, simp, trad, py, pos in rows:
            out.setdefault(simp, []).append((lvl, py, pos, trad))
    return out


def syllables_ok(py):
    return all(is_syllable(strip_tones(s)) for s in py.split(" "))


def resolve(r, cedict, hsk):
    """(pinyin, traditional, how, note) or an error string."""
    s = r["surface"]
    every = cedict.get(s, [])
    common = [c for c in every if not c[2]]
    # Proper-name entries (capitalised in CC-CEDICT) only for names, or when the word has no other entry (中国).
    cands = common if common and r["kind"] != "R" else every
    readings = sorted({c[1] for c in cands})
    trad_of = lambda py: sorted({c[0] for c in cands if c[1] == py})
    if cands:
        if r["given"]:
            if r["given"] not in readings:
                return f"{s}: pinyin '{r['given']}' is not a CC-CEDICT reading ({' / '.join(readings)})"
            py, how = r["given"], "given"
        else:
            hpy = sorted({compact(h[1]) for h in hsk.get(s, [])})
            exact = [p for p in readings if compact(p) in hpy]
            loose = sorted({p for p in readings if strip_tones(compact(p)) in {strip_tones(h) for h in hpy}})
            if len(hpy) == 1 and len(exact) == 1:
                py, how = exact[0], "hsk"
            elif len(hpy) == 1 and len(loose) == 1:
                py, how = loose[0], "hsk-toneless"
            elif len(readings) == 1 and len(hpy) <= 1:
                py, how = readings[0], "only"
            else:
                return f"{s}: several readings ({' / '.join(readings)}; HSK {' / '.join(hpy) or '-'}) — give the pinyin column"
        trads = trad_of(py)
        # Several traditional spellings for one reading: the HSK list's (its main, Taiwan-first variant) for this reading,
        # else the surface itself when CC-CEDICT lists it (碗, not the rare 㼝), else the first.
        rows = hsk.get(s, [])
        same = [h[3] for h in rows if compact(h[1]) == compact(py) and h[3] in trads] or [h[3] for h in rows if strip_tones(compact(h[1])) == strip_tones(compact(py)) and h[3] in trads]
        pick = same[0] if same else (s if s in trads else trads[0])
        return py, pick, how, (f"traditional spelled {' / '.join(trads)} in CC-CEDICT" if len(trads) > 1 else None)
    # A chain: the longest left-to-right split into words that each have one reading (or the given pinyin's syllables).
    chain = chain_of(s, cedict, r["given"])
    if chain is None:
        return f"{s}: no CC-CEDICT entry or chain of entries spells it — re-run zh-subset.py or fix the surface"
    py = " ".join(p for _, p, _ in chain)
    trad = "".join(t for _, _, t in chain)
    return py, trad, "chain", "chain: " + " + ".join(w for w, _, _ in chain)


def chain_of(s, cedict, given):
    target = given.split(" ") if given else None

    def go(i, k):
        if i == len(s):
            return [] if target is None or k == len(target) else None
        for j in range(len(s), i, -1):
            piece = s[i:j]
            every = cedict.get(piece, [])
            opts = sorted({(c[1], c[0]) for c in ([c for c in every if not c[2]] or every)})
            if target is not None:
                want = " ".join(target[k:k + (j - i)])
                opts = [o for o in opts if o[0] == want]
            if len({o[0] for o in opts}) != 1:
                continue
            rest = go(j, k + (j - i))
            if rest is not None:
                trad = piece if (opts[0][0], piece) in opts else opts[0][1]
                return [(piece, opts[0][0], trad)] + rest
        return None

    return go(0, 0)


def example_errors(r, allowed):
    ex = r["example"][0]
    errs = []
    if not re.search(r"[。？！」”]$", ex):
        errs.append(f"{r['surface']}: example lacks final punctuation: {ex}")
    body = [c for c in ex if HAN.match(c)]
    if len(body) > 20:
        errs.append(f"{r['surface']}: example over 20 characters: {ex}")
    bare = ex
    for name in NAMES:
        bare = bare.replace(name, "")
    stray = sorted({c for c in bare if HAN.match(c) and c not in allowed})
    if stray:
        errs.append(f"{r['surface']}: characters outside the band {''.join(stray)}: {ex}")
    if r["surface"] not in ex:
        errs.append(f"{r['surface']}: example does not use the word: {ex}")
    if re.search(r"[,?!:;]", ex):
        errs.append(f"{r['surface']}: example uses ASCII punctuation: {ex}")
    return errs


def write_json(rel, doc, indent=2):
    path = f"{ROOT}/{rel}"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(doc, f, ensure_ascii=False, indent=indent)
        f.write("\n")


def build():
    a1 = [r for name in CORE for r in read_rows(name, "A1")]
    a2 = read_rows(LATER, "A2-1")
    rows = a1 + a2
    subset = load_subset()
    cedict, hsk = subset["cedict"], hsk_index(subset)
    errors = []
    seen = {}
    for r in rows:
        if r["surface"] in seen:
            errors.append(f"duplicate surface: {r['surface']} ({seen[r['surface']]}, {r['file']}:{r['line']})")
        seen[r["surface"]] = f"{r['file']}:{r['line']}"
        if "TODO" in "".join([r["vi"], r["en"], *r["example"]]):
            errors.append(f"{r['surface']}: draft marker")
        if r["given"] and not syllables_ok(r["given"]):
            errors.append(f"{r['surface']}: pinyin column '{r['given']}' is not tone-marked pinyin")
    c1 = {c for r in a1 if r["kind"] != "R" for c in r["surface"]}
    call = {c for r in rows if r["kind"] != "R" for c in r["surface"]}
    for r in a1:
        errors += example_errors(r, c1)
    for r in a2:
        errors += example_errors(r, call)
    for r in rows:
        got = resolve(r, cedict, hsk)
        if isinstance(got, str):
            errors.append(got)
            continue
        r["pinyin"], r["traditional"], r["how"], r["readingNote"] = got
        if len(r["pinyin"].split(" ")) != len(r["surface"]):
            errors.append(f"{r['surface']}: pinyin '{r['pinyin']}' is not one syllable per hanzi")
    if errors:
        for e in errors:
            sys.stdout.write(f"ERROR {e}\n")
        raise SystemExit(f"{len(errors)} error(s)")
    return a1, a2, subset


def assign_ids(rows, subset):
    """Toneless pinyin (ü as v): zh:w:xuesheng. The most common word of a spelling gets the bare id (A1 before A2-1,
    then HSK level, then wordfreq rank); another word with other tones gets the tone digits (号 zh:w:hao-4 beside
    好 zh:w:hao), one with the same tones the first word of its English gloss (她 zh:w:ta-she). Frozen once written."""
    frozen_path = f"{ROOT}/content/zh/lexemes.json"
    frozen = json.load(open(frozen_path, encoding="utf-8")) if os.path.exists(frozen_path) else {}
    used = set(frozen.values())
    wf = subset["wordfreq"]
    level = lambda r: {"1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6}.get(r.get("hsk") or "", 9)
    order = sorted(rows, key=lambda r: (r["band"] != "A1", level(r), wf.get(r["surface"], [10**9])[0], r["surface"]))
    tones_of_id = {}
    ids = {}
    for r in order:
        if r["surface"] in frozen:
            ids[r["surface"]] = frozen[r["surface"]]
            continue
        base = slug(strip_tones(r["pinyin"]).replace("ü", "v").replace(" ", "")) or "x"
        tones = "".join(str(t or 5) for t in tones_of(r["pinyin"]))
        cand = f"zh:w:{base}"
        if cand in used:
            words = [w for w in slug(re.sub(r"^(the|to|a|an|be) ", "", r["en"].lower())).split("-") if w and w not in ("the", "to", "a", "an", "be")]
            by_tone = f"zh:w:{base}-{tones}"
            cand = by_tone if tones_of_id.get(f"zh:w:{base}") != tones and by_tone not in used else f"zh:w:{base}-{words[0] if words else POS[r['kind']]}"
        n = 2
        while cand in used:
            cand = f"zh:w:{base}-{n}"
            n += 1
        used.add(cand)
        tones_of_id.setdefault(f"zh:w:{base}", tones)
        ids[r["surface"]] = cand
    return ids


def pool_index():
    pool = json.load(open(f"{ROOT}/content/zh/lexicon/derived/candidate-pool.json", encoding="utf-8"))["entries"]
    readings = json.load(open(f"{ROOT}/content/zh/lexicon/derived/lexeme-readings.json", encoding="utf-8"))["readings"]
    by_key = {}
    for e in pool:
        simp = readings.get(f"{e['lemma']}|{e['partOfSpeech']}", {}).get("simplified", e["lemma"])
        by_key.setdefault((simp, e["partOfSpeech"]), e)
    return by_key


def lexemes_of(rows, ids):
    by_key = pool_index()
    out = []
    for r in rows:
        pos = POS[r["kind"]]
        lemma = r["surface"]
        ev = by_key.get((lemma, pos))
        refs = []
        if ev:
            refs.append({"source": "kaikki-en", "key": f"{ev['lemma']}|{ev['sourcePos']}"})
        refs.append({"source": "cedict", "key": f"{r['traditional']}|{lemma}"})
        refs.append({"source": "original-lexicon-etl"})
        lex = {"id": ids[lemma], "surface": lemma}
        if lemma in LEGACY:
            lex["legacySurfaces"] = LEGACY[lemma]
        lex.update({"lemma": lemma, "lookupForm": lemma, "partOfSpeech": pos})
        if r["kind"] == "R":
            lex["proper"] = True  # P4c: taught in lessons, never a daily new word in TODAY
        lex.update({"glosses": {"en": r["en"], "vi": r["vi"]},
                    "pronunciation": {"value": r["pinyin"], "notation": "pinyin", "source": "cedict"},
                    "reading": {"pinyin": r["pinyin"], "traditional": r["traditional"]}})
        ex, ex_vi, ex_en = r["example"]
        lex["topic"] = r["topic"]
        lex["examples"] = [{"target": ex, "translations": {"en": ex_en, "vi": ex_vi}, "source": "original-lexicon-etl", "key": "add"}]
        lex["sourceRefs"] = refs
        out.append(lex)
        r["id"] = ids[lemma]
        r["kaikki"] = ev is not None
    return out


def zh_en_check(rows):
    pack = json.load(open(f"{ROOT}/content/courses/zh-en.json", encoding="utf-8"))
    by_surface = {r["surface"]: r for r in rows}
    by_legacy = {leg: r for r in rows for leg in LEGACY.get(r["surface"], [])}
    errors = []
    for s in pack["sections"]:
        for u in s["units"]:
            for w in u["words"]:
                r = by_surface.get(w["target"]) or by_legacy.get(w["target"])
                if r is None:
                    if w["target"] not in UNMAPPED:
                        errors.append(f"zh-en word {w['target']} has no lexeme, legacy surface or unmapped reason")
                elif r["en"] != w["native"]:
                    errors.append(f"zh-en word {w['target']}: English gloss '{r['en']}' must equal the pack's '{w['native']}'")
    return errors


def anchors_report(rows, subset):
    hsk = hsk_index(subset)
    for r in rows:
        lv = sorted({h[0] for h in hsk.get(r["surface"], [])}) or ([subset["courseLevels"][r["surface"]]] if r["surface"] in subset["courseLevels"] else [])
        r["hsk"] = lv[0] if lv else None
    taken = {r["surface"] for r in rows}
    legend, reasons = {}, {}
    for line in open(os.path.join(HERE, "anchors-left-out.txt"), encoding="utf-8"):
        line = line.rstrip("\n")
        if not line or line.startswith("#"):
            continue
        head, tail = line.split("|", 1)
        if head == "@":
            code, text = tail.split("|", 1)
            legend[code] = text
            continue
        for w in tail.split():
            if w in reasons:
                raise SystemExit(f"anchors-left-out: {w} listed twice")
            reasons[w] = head
    grouped, unexplained, missing = {}, [], {"1": [], "2": []}
    for lvl in ("1", "2"):
        for _id, simp, _t, _py, _pos in subset["hsk"][lvl]:
            if simp in taken or simp in missing[lvl]:
                continue
            missing[lvl].append(simp)
            if lvl == "1":
                if simp in reasons:
                    grouped.setdefault(reasons[simp], []).append(simp)
                else:
                    unexplained.append(simp)
    stale = sorted(w for w in reasons if w not in missing["1"])
    if unexplained:
        print("UNEXPLAINED HSK1:", " ".join(unexplained))
        raise SystemExit(f"{len(unexplained)} HSK 1 word(s) lack a reason in anchors-left-out.txt")
    if stale:
        raise SystemExit("anchors-left-out.txt lists words that are taken or not HSK 1: " + " ".join(stale))
    totals = {lvl: len({row[1] for row in subset["hsk"][lvl]}) for lvl in ("1", "2")}
    return {"legend": legend, "grouped": grouped, "missing": missing, "totals": totals}


def hanzi_report(a1, a2, subset):
    count = {}
    for r in a1:
        if r["kind"] == "R":
            continue
        for c in r["surface"]:
            count[c] = count.get(c, 0) + 1
    l1, l2 = subset["chars"]["1"], subset["chars"]["2"]
    level = lambda c: "1" if c in l1 else ("2" if c in l2 else "other")
    taught = [c for c in l1 if c in count] + [c for c in l2 if c in count]
    return {
        "generator": "content/zh/_drafts/_generators/zh-lex.py",
        "note": "Characters of the A1 surfaces. `taught` is the course's character target: every HSK 3.0 level-1 and level-2 character an A1 word uses (recognition, with pinyin shown). Writing by hand is not taught; typing goes through a pinyin keyboard. Characters of level 3+ inside A1 words are shown with pinyin and are not a target.",
        "counts": {"a1Characters": len(count), "taught": len(taught), "hsk1InA1": sum(1 for c in count if level(c) == "1"), "hsk1Total": len(l1), "hsk2InA1": sum(1 for c in count if level(c) == "2"), "hsk2Total": len(l2), "otherInA1": sum(1 for c in count if level(c) == "other")},
        "taught": "".join(taught),
        "hsk1Missing": "".join(c for c in l1 if c not in count),
        "a1": [{"hanzi": c, "words": k, "hsk": level(c), **({"writingLevel": subset["writingLevel"][c]} if c in subset["writingLevel"] else {})} for c, k in sorted(count.items(), key=lambda x: (-x[1], x[0]))],
    }


def hanviet_merge(rows):
    by_surface = {r["surface"]: r for r in rows}
    path = f"{ROOT}/content/hanviet/zh.json"
    table = json.load(open(path, encoding="utf-8"))
    entries = {e["word"]: e for e in table["entries"] if e["word"] in P4B_WORDS}
    missing_p4b = sorted(P4B_WORDS - set(entries))
    if missing_p4b:
        raise SystemExit("content/hanviet/zh.json lost P4b entries: " + " ".join(missing_p4b))
    for word, note in P4B_NOTES.items():
        old = P4B_KEPT_NOTES.get(word)
        entries[word] = {**entries[word], "note": f"{note} {old}" if old else note}
    errors, added = [], 0
    for n, line in enumerate(open(os.path.join(HERE, "hanviet-zh.txt"), encoding="utf-8"), 1):
        line = line.rstrip("\n")
        if not line or line.startswith("#"):
            continue
        word, reading, note = line.split("|")
        r = by_surface.get(word)
        if r is None or r["kind"] == "R":
            errors.append(f"hanviet-zh.txt:{n}: {word} is not a course surface (or is a name)")
            continue
        if len(reading.split(" ")) != len(word):
            errors.append(f"hanviet-zh.txt:{n}: {word} has {len(word)} characters, the reading {len(reading.split(' '))} syllables")
        if word in P4B_WORDS:
            errors.append(f"hanviet-zh.txt:{n}: {word} is a P4b entry already")
            continue
        if word in entries:
            errors.append(f"hanviet-zh.txt:{n}: {word} listed twice")
            continue
        entries[word] = {"word": word, "reading": reading, "kind": "sino", **({"note": note} if note else {})}
        added += 1
    if errors:
        raise SystemExit("\n".join(errors))
    ordered = [entries[w] for w in sorted(entries)]
    write_json("content/hanviet/zh.json", {"language": "zh", "entries": [{k: e[k] for k in ("word", "reading", "kind", "note") if k in e} for e in ordered]})
    return added, len(ordered), sum(1 for r in rows if r["surface"] in entries), sum(1 for e in ordered if "False friend" in e.get("note", ""))


def unit_of(r):
    return TOPIC_UNITS.get(f"{r['topic']}:{POS[r['kind']]}") or TOPIC_UNITS[r["topic"]]


def review(a1, a2, rep, hanzi, hv, subset):
    rows = a1 + a2
    pos = {}
    for r in a1:
        pos[POS[r["kind"]]] = pos.get(POS[r["kind"]], 0) + 1
    kinds = {}
    for r in rows:
        kinds[r["kind"]] = kinds.get(r["kind"], 0) + 1
    levels = {}
    for r in rows:
        key = (r["band"], f"HSK{r['hsk']}" if r["hsk"] else "none")
        levels[key] = levels.get(key, 0) + 1
    how = {}
    for r in rows:
        how[r["how"]] = how.get(r["how"], 0) + 1
    wf = subset["wordfreq"]
    ranked = [wf[r["surface"]][0] for r in rows if r["surface"] in wf]
    top = lambda n: sum(1 for x in ranked if x <= n)
    trad_diff = sum(1 for r in rows if r["traditional"] != r["surface"])
    notes = [r for r in rows if r["readingNote"]]
    lines = [
        "# zh lexicon — authoring review sheet (generated by content/zh/_drafts/_generators/zh-lex.py)",
        "",
        f"Hand-chosen lexicon for zh-vi: {len(a1)} A1 words and {len(a2)} A2-1 words (core-*.txt). It replaces the pool-only sheet of `scripts/lexicon-author.ts`; do not re-run that script over it.",
        "",
        "A human still has to check:",
        "",
        "- **Vietnamese text.** Every gloss and example translation was written by an AI agent and awaits the D-10 review. There are no `TODO:vi` markers.",
        "- **Chinese examples.** Original sentences in simplified characters, checked by zh-lex.py for character band and length only — a native or advanced reader should read every one.",
        "- **English glosses.** Short glosses for the build tools and the inherited zh-en pack; the zh-en words keep the pack's own glosses (`the man`, `to eat`).",
        "",
        "## Counts",
        "",
        "- A1 by part of speech: " + ", ".join(f"{k} {v}" for k, v in sorted(pos.items())) + f" (measure words {sum(1 for r in a1 if r['kind'] == 'M')}, numerals {sum(1 for r in a1 if r['kind'] == 'U')}, particles {sum(1 for r in a1 if r['kind'] == 'X')} inside `other`)",
        "- HSK 3.0 anchor (ivankra/hsk30): " + ", ".join(f"{b} {lvl} {n}" for (b, lvl), n in sorted(levels.items())),
        f"- HSK coverage: level 1 {rep['totals']['1'] - len(rep['missing']['1'])} of {rep['totals']['1']} words taken; level 2 {rep['totals']['2'] - len(rep['missing']['2'])} of {rep['totals']['2']}.",
        f"- Readings (CC-CEDICT, citation tones): confirmed by the HSK list {how.get('hsk', 0)}, by the HSK list without tones {how.get('hsk-toneless', 0)}, the only CC-CEDICT reading {how.get('only', 0)}, chosen in the row among CC-CEDICT readings {how.get('given', 0)}, a chain of entries {how.get('chain', 0)}. Traditional spelling differs from the simplified surface on {trad_diff} lexemes.",
        f"- wordfreq 3.1.1 (zh, large list): {len(ranked)} of {len(rows)} lexemes are in the list; {top(1000)} in the top 1,000, {top(3000)} in the top 3,000, {top(10000)} in the top 10,000. Selection evidence only: `frequency` is not set on zh lexemes (see the plan, §8).",
        f"- Examples: {len(rows)}, all original (`original-lexicon-etl`, key `add`), with Vietnamese and English translations; no Tatoeba sentence is used.",
        f"- Hán-Việt: {hv[0]} course words added to `content/hanviet/zh.json` ({hv[1]} entries in all, {hv[3]} flagged as false friends); {hv[2]} lexemes have a reading there.",
        f"- Characters: {hanzi['counts']['a1Characters']} distinct characters in A1 surfaces ({hanzi['counts']['hsk1InA1']} of the {hanzi['counts']['hsk1Total']} HSK level-1 characters, {hanzi['counts']['hsk2InA1']} level-2, {hanzi['counts']['otherInA1']} beyond). Course target: {hanzi['counts']['taught']} characters (`content/zh/_drafts/review/hanzi.json`).",
        f"- Proper nouns (never a daily new word): {kinds.get('R', 0)}.",
        "- zh-en (basic pack, never edited): every word is a lexeme with the pack's English gloss.",
        "",
        "## Readings to look at",
        "",
    ]
    lines += [f"- {r['surface']} {r['pinyin']} — {r['readingNote']}" for r in notes] or ["- none"]
    lines += ["", "## HSK 1 words left out, by reason", ""]
    for code in sorted(rep["grouped"]):
        lines += [f"**{rep['legend'][code]}** ({len(rep['grouped'][code])}): " + ", ".join(rep["grouped"][code]), ""]
    lines += [f"## HSK 2 words not taken ({len(rep['missing']['2'])})", "", "Kept for A2 (v1.1) unless a scenario needs them: " + ", ".join(rep["missing"]["2"]), ""]
    return "\n".join(lines)


def main():
    a1, a2, subset = build()
    rows = a1 + a2
    errors = zh_en_check(rows)
    if errors:
        raise SystemExit("\n".join(errors))
    rep = anchors_report(rows, subset)
    ids = assign_ids(rows, subset)
    lexemes = lexemes_of(rows, ids)
    if MODE == "split":
        rel = f"{STAGED}/content/zh/lexicon/syllabus.json"
        syl = json.load(open(f"{ROOT}/{rel}", encoding="utf-8"))
        later_ids = {r["id"] for r in a2}
        later = [e for e in syl["entries"] if e["lexemeId"] in later_ids]
        syl["entries"] = [e for e in syl["entries"] if e["lexemeId"] not in later_ids]
        syl["derivation"] = DERIVATION
        write_json(rel, syl)
        write_json(f"{STAGED}/content/zh/lexicon/syllabus-a2-1.json", {"version": 1, "language": "zh", "level": "A2-1", "minLexemes": 0, "derivation": "HSK 2 words for work and life with Chinese-speaking employers and the inherited zh-en words beyond A1 (core-a2.txt)", "entries": later})
        print("A1", len(syl["entries"]), "A2-1", len(later))
        return
    hanzi = hanzi_report(a1, a2, subset)
    hv = hanviet_merge(rows)
    write_json("content/zh/lexicon/lexemes.json", {"version": 1, "language": "zh", "lexemes": lexemes})
    write_json("content/zh/lexemes.json", {r["surface"]: r["id"] for r in rows})
    # Every zh-en word is a zh-vi lexeme, so there is no legacy-unmapped.json (the file needs at least one surface).
    unmapped_rel = "content/zh/lexicon/legacy-unmapped.json"
    if UNMAPPED:
        write_json(unmapped_rel, {"version": 1, "language": "zh", "note": "Surfaces of the inherited zh-en pack that map to no lexeme: their learner progress keeps a reversible zh:legacy: id (src/lib/learning/ids.ts).", "surfaces": [{"courseId": "zh-en", "surface": s, "reason": why} for s, why in sorted(UNMAPPED.items())]})
    elif os.path.exists(f"{ROOT}/{unmapped_rel}"):
        os.remove(f"{ROOT}/{unmapped_rel}")
    topics = {(r["topic"], POS[r["kind"]]) for r in rows}
    units = {k: f"zh-vi:unit-{v}" for k, v in TOPIC_UNITS.items() if any(t == k.split(":")[0] and (":" not in k or p == k.split(":")[1]) for t, p in topics)}
    write_json(f"{STAGED}/content/zh/lexicon/topic-units.json", {"version": 1, "language": "zh", "courseId": "zh-vi", "note": "Authored topic → unit map of the zh-vi syllabus: where a lexeme no lesson teaches first belongs. Keys are topic:partOfSpeech before topic.", "units": units})
    write_json("content/zh/_drafts/review/hanzi.json", hanzi)
    with open(f"{ROOT}/content/zh/lexicon/REVIEW.md", "w", encoding="utf-8", newline="\n") as f:
        f.write(review(a1, a2, rep, hanzi, hv, subset) + "\n")
    print("A1", len(a1), "A2-1", len(a2), "hanzi", hanzi["counts"], "hanviet", hv, "HSK1 taken", rep["totals"]["1"] - len(rep["missing"]["1"]), "of", rep["totals"]["1"], "HSK2 taken", rep["totals"]["2"] - len(rep["missing"]["2"]), "of", rep["totals"]["2"])


main()
