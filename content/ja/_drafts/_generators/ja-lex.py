"""Japanese lexicon for ja-vi from the curated lists core-*.txt (hand-chosen, hand-glossed in Vietnamese and English).

usage: python -I ja-lex.py <repo root>          write every output below (byte-deterministic)
       python -I ja-lex.py <repo root> split    after `course-draft.ts syllabus --target ja`: move the core-a2 words out of
                                                the staged syllabus.json into the staged syllabus-a2-1.json

Writes content/ja/lexemes.json (the frozen surface → id map: an id, once written, never changes), and under
content/ja/lexicon/: lexemes.json, REVIEW.md; the staged topic-units.json (content/ja/_drafts/staged/...);
content/ja/_drafts/review/kanji.json; and content/hanviet/ja.json, merging hanviet-ja.txt into the P4b table.

Row format (core-*.txt):  kind|surface|kana|vi|en|topic|example|example vi|example en
kind: N noun, V verb, I i-adjective, A na-adjective, D adverb, P pronoun, T determiner (この), C conjunction,
J interjection, E expression, X other (particles, counters, the copula, name suffixes), R proper noun (a family name or a
place, P4c session 3: a noun read with furigana, never a kanji target, no Hán-Việt).
kana: the whole reading (hiragana; a katakana part stays katakana). The surface is the dictionary form.

Readings: kana-only surfaces are their own reading. Kanji surfaces take their furigana from JmdictFurigana
(derived/jlpt-course.json, written by ja-subset.py): the entry for the surface and kana itself, else a chain of entries and
literal kana that spells both. Nothing is guessed: a surface no chain explains stops the run.

Levels: the OpenJLPT N5/N4 lists are an anchor only (anchors-left-out.txt gives the reason each N5 word is not taken).
Examples are original; an A1 example uses only kanji that A1 surfaces teach (names in NAMES aside), an A2-1 example only
kanji of the lexicon.
"""
import json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from ja_readings import HAN, chain, hira, index, merged  # noqa: E402

ROOT = sys.argv[1]
MODE = sys.argv[2] if len(sys.argv) > 2 else "all"
CORE = ["core-0.txt", "core-1.txt", "core-2.txt", "core-3.txt", "core-4.txt", "core-5.txt", "core-6.txt", "core-7.txt"]
LATER = "core-a2.txt"
STAGED = "content/ja/_drafts/staged"
POS = {"N": "noun", "V": "verb", "I": "adjective", "A": "adjective", "D": "adverb", "P": "pronoun", "T": "determiner", "C": "conjunction", "J": "interjection", "E": "expression", "X": "other", "R": "noun"}
TOPICS = {"people", "greetings", "food", "animals", "travel", "everyday", "places", "shopping", "time", "family", "home", "body", "clothing", "colors", "numbers", "weather", "nature", "work", "school", "feelings", "leisure", "technology"}
KANA_ONLY = re.compile(r"^[ぁ-ゖァ-ヺー゛゜]+$")
# Names in examples: characters, not vocabulary.
NAMES = ["北海道", "富士山", "田中", "木村", "東京", "大阪", "京都", "名古屋", "ハノイ", "グエン", "ラン", "ミン", "ナム", "ハナ", "リン", "トム"]
# The ja-en basic pack is never edited: its kana surfaces map to the lexeme that writes the word in kanji (learner data keys).
LEGACY = {"水": ["みず"], "牛乳": ["ぎゅうにゅう"], "食べる": ["たべます"], "飲む": ["のみます"], "お茶": ["おちゃ"], "ご飯": ["ごはん"], "卵": ["たまご"], "果物": ["くだもの"], "肉": ["にく"]}
# ja-en surfaces with no lexeme of their own (content/ja/lexicon/legacy-unmapped.json): progress keeps a reversible legacy id.
UNMAPPED = {"さかな": "ja-en teaches both さかな ('the fish') and 魚 ('fish'): one lexeme cannot carry both English glosses, so 魚 is the lexeme and さかな keeps its legacy key."}
# The 45 Hán-Việt pairs P4b authored in content/hanviet/ja.json; ja-lex.py keeps them as they are and adds hanviet-ja.txt.
P4B_WORDS = set("世界 中国 会社 便利 先生 写真 勉強 動物 問題 図書館 国家 外国 大丈夫 大学 天気 学校 学生 安心 家族 意味 教室 文化 新聞 旅行 日本 映画 時間 有名 注意 生活 留学生 病院 社会 簡単 経済 練習 言語 説明 質問 運動 銀行 電話 電車 音楽 食堂".split())
# Polite-form stems an example may show for verbs whose dictionary form gives no usable stem.
VERB_FORMS = {"する": ["し", "す"], "来る": ["来", "き"], "くる": ["き"], "ある": ["あり", "ある"], "いる": ["い"], "要る": ["要り", "要る"], "なる": ["なり", "なっ"], "やる": ["やり", "やっ"], "できる": ["でき"], "わかる": ["わかり", "わから"], "つける": ["つけ"], "あげる": ["あげ"], "くれる": ["くれ"], "かける": ["かけ"], "かかる": ["かかり"], "はく": ["はき", "はい"], "かぶる": ["かぶ"], "もらう": ["もらい"], "あびる": ["あび"]}
UNIT_ORDER = ["1", "2", "3", "4", "5", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v"]
# Where a lexeme no unit's word list teaches first unlocks in the daily words. Keys: topic, or topic:partOfSpeech.
TOPIC_UNITS = {
    "greetings": "1", "people": "2", "people:pronoun": "a", "people:other": "2", "people:verb": "s", "people:adjective": "l",
    "family": "3", "food": "4", "food:verb": "4", "food:adjective": "t", "numbers": "5", "numbers:other": "d", "shopping": "5", "shopping:verb": "t",
    "everyday": "a", "everyday:verb": "b", "everyday:adjective": "c", "everyday:adverb": "c", "everyday:other": "a", "everyday:conjunction": "p",
    "everyday:pronoun": "a", "everyday:determiner": "a", "everyday:expression": "k", "everyday:interjection": "k",
    "time": "d", "time:verb": "b", "time:adverb": "b", "time:adjective": "d", "time:other": "d",
    "home": "c", "home:verb": "j", "home:adjective": "c", "places": "c", "places:pronoun": "c", "places:verb": "u", "places:adjective": "u", "places:other": "c",
    "travel": "h", "travel:verb": "u", "travel:adverb": "u", "school": "e", "school:verb": "e", "school:adjective": "e",
    "work": "g", "work:verb": "g", "work:adjective": "g", "work:expression": "v", "work:adverb": "g", "body": "u", "body:adjective": "u", "body:expression": "u",
    "clothing": "j", "clothing:verb": "j", "colors": "c", "colors:adjective": "c", "weather": "f", "weather:verb": "f", "weather:adjective": "f",
    "nature": "f", "nature:verb": "f", "animals": "f", "feelings": "l", "feelings:adjective": "l", "feelings:verb": "l", "feelings:adverb": "l",
    "leisure": "m", "leisure:verb": "m", "leisure:adjective": "m", "technology": "v", "technology:verb": "v",
}
DERIVATION = "members: lexemes taught by the primary course + course-authored lexemes (source original-lexicon-etl only) + lexemes the course added through lexicon-add + frequency bands very-common/common; unit: first unit teaching the lexeme, else the authored topic map (topic-units.json, topic:pos before topic), else first unit teaching its topic, else the first unit; order: unit, then frequency rank; the words of content/ja/_drafts/_generators/core-a2.txt are band A2-1 (syllabus-a2-1.json)"


ROMA = {}
for row, cons in [("あいうえお", ""), ("かきくけこ", "k"), ("さしすせそ", "s"), ("たちつてと", "t"), ("なにぬねの", "n"), ("はひふへほ", "h"), ("まみむめも", "m"), ("らりるれろ", "r"), ("がぎぐげご", "g"), ("ざじずぜぞ", "z"), ("だぢづでど", "d"), ("ばびぶべぼ", "b"), ("ぱぴぷぺぽ", "p")]:
    for k, v in zip(row, "aiueo"):
        ROMA[k] = cons + v
ROMA.update({"し": "shi", "ち": "chi", "つ": "tsu", "ふ": "fu", "じ": "ji", "ぢ": "ji", "づ": "zu", "や": "ya", "ゆ": "yu", "よ": "yo", "わ": "wa", "を": "wo", "ん": "n", "ゔ": "vu",
             "ぁ": "a", "ぃ": "i", "ぅ": "u", "ぇ": "e", "ぉ": "o", "ゃ": "ya", "ゅ": "yu", "ょ": "yo", "ゎ": "wa"})
DIGRAPH_ONSET = {"き": "ky", "ぎ": "gy", "し": "sh", "じ": "j", "ち": "ch", "に": "ny", "ひ": "hy", "び": "by", "ぴ": "py", "み": "my", "り": "ry"}
SMALL_VOWEL = {"ぁ": "a", "ぃ": "i", "ぅ": "u", "ぇ": "e", "ぉ": "o"}
LOAN_ONSET = {"ふ": "f", "て": "t", "で": "d", "う": "w", "ゔ": "v", "ち": "ch", "し": "sh", "じ": "j", "つ": "ts", "と": "t", "ど": "d"}


def romaji(kana):
    s, out, i = hira(kana), [], 0
    while i < len(s):
        c, n = s[i], s[i + 1] if i + 1 < len(s) else ""
        if c == "っ":
            nxt = romaji(s[i + 1:])[:1]
            out.append(nxt if nxt.isalpha() else "")
            i += 1
        elif c == "ー":
            # The long mark repeats the vowel before it (コーヒー → koohii, チーズ → chiizu).
            last = "".join(out)[-1:]
            out.append(last if last in "aiueo" else "")
            i += 1
        elif n in "ゃゅょ" and n and c in DIGRAPH_ONSET:
            onset = DIGRAPH_ONSET[c]
            out.append(onset + ROMA[n][1] if onset.endswith(("h", "j")) else onset + ROMA[n][1])
            i += 2
        elif n in SMALL_VOWEL and n and c in LOAN_ONSET:
            out.append(LOAN_ONSET[c] + SMALL_VOWEL[n])
            i += 2
        elif c in ROMA:
            out.append(ROMA[c])
            i += 1
        else:
            i += 1
    return "".join(out)


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
            kind, surface, kana, vi, en, topic, ex, ex_vi, ex_en = p
            if kind not in POS or topic not in TOPICS or not all(p):
                raise SystemExit(f"{name}:{n}: bad row: {line}")
            if not KANA_ONLY.match(kana):
                raise SystemExit(f"{name}:{n}: kana column is not kana: {kana}")
            out.append({"kind": kind, "surface": surface, "kana": kana, "vi": vi, "en": en, "topic": topic, "example": (ex, ex_vi, ex_en), "band": band, "file": name, "line": n})
    return out


def load_subset():
    doc = json.load(open(f"{ROOT}/content/ja/lexicon/derived/jlpt-course.json", encoding="utf-8"))
    return doc, index(doc["furigana"])


def furigana(surface, kana, by_text):
    """Segments that spell the surface and, through their rubies and kana bases, the kana. None when nothing explains it."""
    found = chain(surface, kana, by_text)
    return merged(found[0]) if found is not None else None


def reading_errors(surface, kana, segs):
    errs = []
    if "".join(s["base"] for s in segs) != surface:
        errs.append("bases do not spell the surface")
    if hira("".join(s.get("ruby", s["base"]) for s in segs)) != hira(kana):
        errs.append("rubies do not spell the kana")
    return errs


def example_errors(r, allowed):
    ex = r["example"][0]
    errs = []
    if not re.search(r"[。？」]$", ex):
        errs.append(f"{r['surface']}: example lacks final punctuation: {ex}")
    body = re.sub(r"[。、「」？！ 　]", "", ex)
    if len(body) > 30:
        errs.append(f"{r['surface']}: example over 30 characters: {ex}")
    bare = ex
    for name in NAMES:
        bare = bare.replace(name, "")
    stray = sorted({c for c in bare if HAN.search(c) and c not in allowed})
    if stray:
        errs.append(f"{r['surface']}: kanji outside the band {''.join(stray)}: {ex}")
    s, kind = r["surface"], r["kind"]
    if kind == "V":
        if s in VERB_FORMS:
            stems = VERB_FORMS[s]
        elif s.endswith("する"):
            stems = [s[:-2]]
        else:
            stems = [s[:-1]]
        ok = any(st in ex for st in stems) or any(leg in ex for leg in LEGACY.get(s, []))
    elif kind == "I":
        ok = s[:-1] in ex
    else:
        ok = s in ex or any(leg in ex for leg in LEGACY.get(s, []))
    if not ok:
        errs.append(f"{s}: example does not use the word: {ex}")
    return errs


def jlpt_index(subset):
    """word spelling → level, and (reading, characters of the spelling) for kana matches."""
    spell, by_reading = {}, {}
    for lvl in ("N4", "N5"):
        for word, reading in subset["jlpt"][lvl]:
            for w in [x for x in re.split(r"[/ 、]+", word) if x]:
                spell[w] = lvl
                for rd in [x for x in re.split(r"[/ ]+", reading or w) if x]:
                    by_reading.setdefault(hira(rd), []).append((lvl, w))
    return spell, by_reading


def jlpt_level(r, spell, by_reading):
    s = r["surface"][:-2] if r["kind"] == "V" and r["surface"].endswith("する") and len(r["surface"]) > 2 else r["surface"]
    found = set()
    for cand in {s, *LEGACY.get(r["surface"], [])}:
        if cand in spell:
            found.add(spell[cand])
    for lvl, w in by_reading.get(hira(r["kana"] if s == r["surface"] else r["kana"][:-2]), []):
        # Same reading counts when the spellings share a character, or when either side is written in kana (かさ / 傘);
        # never for particles and suffixes (と is not 戸).
        if r["kind"] != "X" and (set(w) & set(s) or KANA_ONLY.match(w) or KANA_ONLY.match(s)):
            found.add(lvl)
    return "N5" if "N5" in found else ("N4" if "N4" in found else None)


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
    subset, by_text = load_subset()
    errors = []
    seen = {}
    for r in rows:
        if r["surface"] in seen:
            errors.append(f"duplicate surface: {r['surface']} ({seen[r['surface']]}, {r['file']}:{r['line']})")
        seen[r["surface"]] = f"{r['file']}:{r['line']}"
        if "TODO" in "".join([r["vi"], r["en"], *r["example"]]):
            errors.append(f"{r['surface']}: draft marker")
        if KANA_ONLY.match(r["surface"]) and r["kana"] != r["surface"]:
            errors.append(f"{r['surface']}: a kana surface is its own reading, found {r['kana']}")
    # Proper nouns (R) teach no kanji: names stay outside the bands, as the NAMES list keeps them out of the examples.
    k1 = {c for r in a1 if r["kind"] != "R" for c in r["surface"] if HAN.search(c)}
    kall = {c for r in rows if r["kind"] != "R" for c in r["surface"] if HAN.search(c)}
    for r in a1:
        errors += example_errors(r, k1)
    for r in a2:
        errors += example_errors(r, kall)
    for r in rows:
        if HAN.search(r["surface"]):
            segs = furigana(r["surface"], r["kana"], by_text)
            if segs is None:
                errors.append(f"{r['surface']} ({r['kana']}): no JmdictFurigana entry or chain spells it — fix the kana, or re-run ja-subset.py")
            else:
                errors += [f"{r['surface']}: {e}" for e in reading_errors(r["surface"], r["kana"], segs)]
                r["furigana"] = segs
                r["exact"] = f"{r['surface']}|{hira(r['kana'])}" in subset["furigana"] or f"{r['surface']}|{r['kana']}" in subset["furigana"]
    if errors:
        for e in errors:
            sys.stdout.write(f"ERROR {e}\n")
        raise SystemExit(f"{len(errors)} error(s)")
    return a1, a2, subset


def assign_ids(rows):
    frozen_path = f"{ROOT}/content/ja/lexemes.json"
    frozen = json.load(open(frozen_path, encoding="utf-8")) if os.path.exists(frozen_path) else {}
    used = set(frozen.values())
    ids = {}
    for r in rows:
        if r["surface"] in frozen:
            ids[r["surface"]] = frozen[r["surface"]]
            continue
        base = slug(romaji(r["kana"])) or "x"
        cand = f"ja:w:{base}"
        if cand in used:
            words = [w for w in slug(re.sub(r"^(the|to|a|an) ", "", r["en"].lower())).split("-") if w and w not in ("the", "to", "a", "an")]
            cand = f"ja:w:{base}-{words[0] if words else POS[r['kind']]}"
        n = 2
        while cand in used:
            cand = f"ja:w:{base}-{n}"
            n += 1
        used.add(cand)
        ids[r["surface"]] = cand
    return ids


def lexemes_of(rows, ids):
    pool = json.load(open(f"{ROOT}/content/ja/lexicon/derived/candidate-pool.json", encoding="utf-8"))["entries"]
    by_key = {}
    for e in pool:
        by_key.setdefault((e["lemma"], e["partOfSpeech"]), e)
    out = []
    for r in rows:
        pos = POS[r["kind"]]
        lemma = r["surface"]
        look = lemma[:-2] if r["kind"] == "V" and lemma.endswith("する") and len(lemma) > 2 else lemma
        ev = by_key.get((look, pos))
        refs = []
        if ev:
            refs.append({"source": "kaikki-en", "key": f"{ev['lemma']}|{ev['sourcePos']}"})
            if ev.get("frequency"):
                refs.append({"source": "frequencywords", "key": ev["lemma"]})
        if r.get("furigana"):
            refs.append({"source": "jmdict-furigana", "key": f"{lemma}|{r['kana']}" if r["exact"] else lemma})
        refs.append({"source": "original-lexicon-etl"})
        reading = {"kana": r["kana"], "furigana": r["furigana"]} if r.get("furigana") else {"kana": r["kana"]}
        source = "jmdict-furigana" if r.get("furigana") else "original-lexicon-etl"
        lex = {"id": ids[lemma], "surface": lemma}
        if lemma in LEGACY:
            lex["legacySurfaces"] = LEGACY[lemma]
        lex.update({"lemma": lemma, "lookupForm": lemma, "partOfSpeech": pos})
        if r["kind"] == "R":
            lex["proper"] = True  # P4c session 4: taught in lessons, never a daily new word in TODAY
        lex.update({"glosses": {"en": r["en"], "vi": r["vi"]},
                    "pronunciation": {"value": r["kana"], "notation": "kana", "source": source}, "reading": reading})
        if ev and ev.get("frequency"):
            f = ev["frequency"]
            lex["frequency"] = {"source": "frequencywords", "rawValue": f["perMillion"], "rank": f["rank"], "band": f["band"]}
        ex, ex_vi, ex_en = r["example"]
        lex["topic"] = r["topic"]
        lex["examples"] = [{"target": ex, "translations": {"en": ex_en, "vi": ex_vi}, "source": "original-lexicon-etl", "key": "add"}]
        lex["sourceRefs"] = refs
        out.append(lex)
        r["id"] = ids[lemma]
        r["rank"] = (ev or {}).get("frequency", {}) or {}
        r["rank"] = r["rank"].get("rank", 10**9) if isinstance(r["rank"], dict) else 10**9
    return out


def ja_en_check(rows):
    pack = json.load(open(f"{ROOT}/content/courses/ja-en.json", encoding="utf-8"))
    by_surface = {r["surface"]: r for r in rows}
    by_legacy = {leg: r for r in rows for leg in LEGACY.get(r["surface"], [])}
    errors = []
    for s in pack["sections"]:
        for u in s["units"]:
            for w in u["words"]:
                r = by_surface.get(w["target"]) or by_legacy.get(w["target"])
                if r is None:
                    if w["target"] not in UNMAPPED:
                        errors.append(f"ja-en word {w['target']} has no lexeme, legacy surface or unmapped reason")
                elif r["en"] != w["native"]:
                    errors.append(f"ja-en word {w['target']}: English gloss '{r['en']}' must equal the pack's '{w['native']}'")
                elif w["target"] in UNMAPPED:
                    errors.append(f"{w['target']} is listed unmapped but maps to {r['surface']}")
    return errors


def anchors_report(rows, subset):
    spell, by_reading = jlpt_index(subset)
    for r in rows:
        r["jlpt"] = jlpt_level(r, spell, by_reading)
    taken_spell = {r["surface"] for r in rows} | {leg for r in rows for leg in LEGACY.get(r["surface"], [])} | {r["surface"][:-2] for r in rows if r["surface"].endswith("する")}
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
    missing, grouped, unexplained = [], {}, []
    for word, reading in subset["jlpt"]["N5"]:
        variants = [x for x in re.split(r"[/ 、]+", word) if x]
        readings = [hira(x) for x in re.split(r"[/ ]+", reading or "") if x] or [hira(v) for v in variants]
        same_reading = [r for r in rows if r["kind"] != "X" and hira(r["kana"]) in readings]
        if any(v in taken_spell for v in variants) or any(KANA_ONLY.match(word) or KANA_ONLY.match(r["surface"]) or set(word) & set(r["surface"]) for r in same_reading):
            continue
        key = variants[0]
        missing.append(key)
        if key in reasons:
            grouped.setdefault(reasons[key], []).append(key)
        else:
            unexplained.append(key)
    stale = sorted(w for w in reasons if w not in missing)
    if unexplained:
        print("UNEXPLAINED N5:", " ".join(unexplained))
        raise SystemExit(f"{len(unexplained)} N5 word(s) lack a reason in anchors-left-out.txt")
    if stale:
        raise SystemExit("anchors-left-out.txt lists words that are taken or not N5: " + " ".join(stale))
    return {"legend": legend, "grouped": grouped, "n5": len(subset["jlpt"]["N5"]), "missing": len(missing)}


def kanji_report(a1, a2, subset):
    count = {}
    for r in a1:
        if r["kind"] == "R":
            continue  # names are read with furigana, never a kanji target
        for c in r["surface"]:
            if HAN.search(c):
                count[c] = count.get(c, 0) + 1
    n5, n4 = subset["kanji"]["N5"], subset["kanji"]["N4"]
    level = lambda c: "N5" if c in n5 else ("N4" if c in n4 else "other")
    taught = [c for c in n5 if c in count]
    for c, _ in sorted(((c, k) for c, k in count.items() if level(c) == "N4"), key=lambda x: (-x[1], n4.index(x[0]))):
        if len(taught) >= 100:
            break
        taught.append(c)
    return {
        "generator": "content/ja/_drafts/_generators/ja-lex.py",
        "note": "Kanji of the A1 surfaces. `taught` is the course's kanji target (≈100): every N5 kanji the A1 words use, then the N4 kanji the A1 words use most. Every other kanji of a surface is shown with furigana and is not a learning target at A1.",
        "counts": {"a1Kanji": len(count), "taught": len(taught), "n5InA1": sum(1 for c in count if level(c) == "N5"), "n5Total": len(n5), "n4InA1": sum(1 for c in count if level(c) == "N4"), "otherInA1": sum(1 for c in count if level(c) == "other")},
        "taught": "".join(taught),
        "n5Missing": "".join(c for c in n5 if c not in count),
        "a1": [{"kanji": c, "words": k, "jlpt": level(c)} for c, k in sorted(count.items(), key=lambda x: (-x[1], x[0]))],
    }


def hanviet_merge(rows):
    by_surface = {r["surface"]: r for r in rows}
    path = f"{ROOT}/content/hanviet/ja.json"
    table = json.load(open(path, encoding="utf-8"))
    # The table is rebuilt from the P4b entries plus hanviet-ja.txt, so an entry removed from the text file leaves the table.
    entries = {e["word"]: e for e in table["entries"] if e["word"] in P4B_WORDS}
    errors, added = [], 0
    for n, line in enumerate(open(os.path.join(HERE, "hanviet-ja.txt"), encoding="utf-8"), 1):
        line = line.rstrip("\n")
        if not line or line.startswith("#"):
            continue
        word, kana, reading, note = line.split("|")
        # A course surface, or the noun of a course する verb (結婚 of 結婚する).
        r = by_surface.get(word)
        if r is None and word + "する" in by_surface:
            r = {"kana": by_surface[word + "する"]["kana"][:-2]}
        if r is None or hira(r["kana"]) != kana:
            errors.append(f"hanviet-ja.txt:{n}: {word} ({kana}) is not a course surface with that kana")
            continue
        e = {"word": word, "kana": kana, "reading": reading, "kind": "sino", **({"note": note} if note else {})}
        if word in P4B_WORDS:
            errors.append(f"hanviet-ja.txt:{n}: {word} is a P4b entry already")
            continue
        entries[word] = e
        added += 1
    if errors:
        raise SystemExit("\n".join(errors))
    ordered = [entries[w] for w in sorted(entries)]
    write_json("content/hanviet/ja.json", {"language": "ja", "entries": [{k: e[k] for k in ("word", "kana", "reading", "kind", "note") if k in e} for e in ordered]})
    return added, len(ordered), sum(1 for r in rows if r["surface"] in entries)


def unit_of(r):
    return TOPIC_UNITS.get(f"{r['topic']}:{POS[r['kind']]}") or TOPIC_UNITS[r["topic"]]


def review(a1, a2, rep, kanji, hv, lexemes):
    rows = a1 + a2
    pos = {}
    for r in a1:
        pos[POS[r["kind"]]] = pos.get(POS[r["kind"]], 0) + 1
    levels = {}
    for r in rows:
        levels[(r["band"], r["jlpt"] or "none")] = levels.get((r["band"], r["jlpt"] or "none"), 0) + 1
    exact = sum(1 for r in rows if r.get("exact"))
    chained = sum(1 for r in rows if r.get("furigana") and not r.get("exact"))
    freq = sum(1 for x in lexemes if "frequency" in x)
    lines = [
        "# ja lexicon — authoring review sheet (generated by content/ja/_drafts/_generators/ja-lex.py)",
        "",
        f"Hand-chosen lexicon for ja-vi: {len(a1)} A1 words and {len(a2)} A2-1 words (core-*.txt). It replaces the pool-only sheet of `scripts/lexicon-author.ts`; do not re-run that script over it.",
        "",
        "A human still has to check:",
        "",
        "- **Vietnamese text.** Every gloss and example translation was written by an AI agent and awaits the D-10 review. There are no `TODO:vi` markers.",
        "- **Japanese examples.** Original sentences, polite style, checked by ja-lex.py for kanji level and length only — a native or advanced reader should read every one.",
        "- **English glosses.** Short glosses for the build tools and the inherited ja-en pack; the ja-en words keep the pack's own glosses (`the man`, `to eat`).",
        "",
        "## Counts",
        "",
        "- A1 by part of speech: " + ", ".join(f"{k} {v}" for k, v in sorted(pos.items())),
        "- JLPT anchor (OpenJLPT 0.1.0): " + ", ".join(f"{b} {lvl} {n}" for (b, lvl), n in sorted(levels.items())),
        f"- Readings: kana-only surfaces {len(rows) - exact - chained} (their own reading); JmdictFurigana entry for the whole surface {exact}; a chain of JmdictFurigana entries and kana {chained}.",
        f"- Frequency (FrequencyWords, through the candidate pool): {freq} of {len(rows)}; the others are outside the pool's top 3,000 or are particles and set phrases.",
        f"- Examples: {len(rows)}, all original (`original-lexicon-etl`, key `add`), with Vietnamese and English translations; no Tatoeba sentence is used.",
        f"- Hán-Việt: {hv[0]} course words added to `content/hanviet/ja.json` ({hv[1]} entries in all); {hv[2]} lexemes have a reading there. Only Sino-Japanese words where the reading helps; false friends carry a note.",
        f"- Kanji: {kanji['counts']['a1Kanji']} distinct kanji in A1 surfaces ({kanji['counts']['n5InA1']} of the {kanji['counts']['n5Total']} N5 kanji, {kanji['counts']['n4InA1']} N4, {kanji['counts']['otherInA1']} beyond N4). Course target: {kanji['counts']['taught']} kanji (`content/ja/_drafts/review/kanji.json`). N5 kanji no A1 word uses: {kanji['n5Missing'] or 'none'}.",
        "- ja-en (basic pack, never edited): every word maps to a lexeme, directly or through `legacySurfaces`, except さかな (`content/ja/lexicon/legacy-unmapped.json`).",
        "",
        "## JLPT N5 anchor coverage",
        "",
        f"- {rep['n5'] - rep['missing']} of {rep['n5']} N5 list entries are taken (spelling, reading, or a する verb's noun).",
        "",
        "### N5 entries left out, by reason",
        "",
    ]
    for code in sorted(rep["grouped"]):
        lines += [f"**{rep['legend'][code]}** ({len(rep['grouped'][code])}): " + ", ".join(rep["grouped"][code]), ""]
    return "\n".join(lines)


def main():
    a1, a2, subset = build()
    rows = a1 + a2
    errors = ja_en_check(rows)
    if errors:
        raise SystemExit("\n".join(errors))
    ids = assign_ids(rows)
    lexemes = lexemes_of(rows, ids)
    if MODE == "split":
        rel = f"{STAGED}/content/ja/lexicon/syllabus.json"
        syl = json.load(open(f"{ROOT}/{rel}", encoding="utf-8"))
        later_ids = {r["id"] for r in a2}
        later = [e for e in syl["entries"] if e["lexemeId"] in later_ids]
        syl["entries"] = [e for e in syl["entries"] if e["lexemeId"] not in later_ids]
        syl["derivation"] = DERIVATION
        write_json(rel, syl)
        write_json(f"{STAGED}/content/ja/lexicon/syllabus-a2-1.json", {"version": 1, "language": "ja", "level": "A2-1", "minLexemes": 0, "derivation": "N4 words for work and life in Japan and the inherited ja-en words beyond A1 (core-a2.txt)", "entries": later})
        print("A1", len(syl["entries"]), "A2-1", len(later))
        return
    rep = anchors_report(rows, subset)
    kanji = kanji_report(a1, a2, subset)
    hv = hanviet_merge(rows)
    write_json("content/ja/lexicon/lexemes.json", {"version": 1, "language": "ja", "lexemes": lexemes})
    write_json("content/ja/lexemes.json", {r["surface"]: r["id"] for r in rows})
    write_json("content/ja/lexicon/legacy-unmapped.json", {"version": 1, "language": "ja", "note": "Surfaces of the inherited ja-en pack that map to no lexeme: their learner progress keeps a reversible ja:legacy: id (src/lib/learning/ids.ts).", "surfaces": [{"courseId": "ja-en", "surface": s, "reason": why} for s, why in sorted(UNMAPPED.items())]})
    topics = {(r["topic"], POS[r["kind"]]) for r in rows}
    units = {k: f"ja-vi:unit-{v}" for k, v in TOPIC_UNITS.items() if any(t == k.split(":")[0] and (":" not in k or p == k.split(":")[1]) for t, p in topics)}
    write_json(f"{STAGED}/content/ja/lexicon/topic-units.json", {"version": 1, "language": "ja", "courseId": "ja-vi", "note": "Authored topic → unit map of the ja-vi syllabus: where a lexeme no lesson teaches first belongs. Keys are topic:partOfSpeech before topic.", "units": units})
    write_json("content/ja/_drafts/review/kanji.json", kanji)
    with open(f"{ROOT}/content/ja/lexicon/REVIEW.md", "w", encoding="utf-8", newline="\n") as f:
        f.write(review(a1, a2, rep, kanji, hv, lexemes) + "\n")
    print("A1", len(a1), "A2-1", len(a2), "kanji", kanji["counts"], "hanviet", hv, "N5 taken", rep["n5"] - rep["missing"], "of", rep["n5"])


main()
