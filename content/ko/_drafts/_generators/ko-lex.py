"""Korean lexicon for ko-vi from the curated lists core-*.txt (hand-chosen, hand-glossed in Vietnamese and English).

usage: python -I ko-lex.py <repo root>          write every output below (byte-deterministic)
       python -I ko-lex.py <repo root> split    after `course-draft.ts syllabus --target ko`: move the core-a2 words out of
                                                the staged syllabus.json into the staged syllabus-a2-1.json

Every output is STAGED (content/ko/_drafts/staged/<repo path>) until `author.ts promote`: the lexicon, the frozen
surface → id map (an id, once written, never changes), the review sheet, legacy-unmapped.json, topic-units.json and the
Hán-Việt table content/hanviet/ko.json (P4b entries + hanviet-ko.txt). Staging keeps src/content, the goldens and
`content:validate` untouched while the course is built; `course-draft.ts validate --target ko` checks them overlaid.

Row format (core-*.txt):  kind|surface|vi|en|topic|example|example vi|example en[|form=…][|rrs=…]
kind: N noun, M numeral (a noun), V verb, A adjective (descriptive verb), D adverb, P pronoun, T determiner (관형사),
C conjunction, J interjection, E expression (set phrases, spaced words allowed), X other (particles, the copula,
counters), R proper noun (never a daily new word, never Hán-Việt).
form=  the form of a verb/adjective the example uses when no rule below finds it (irregular stems);
rrs=   the RR rule input with `+` at a compound boundary (ㄴ insertion), as P4b's `rrSpelling`.

Readings: Revised Romanization from the project's own rules (ko-readings.ts → scripts/lib/cjk-readings/korean-rr.ts);
a lemma P4b confirmed against Wiktionary keeps that reading. Hán-Việt only for Sino-Korean words with hanja
(hanviet-ko.txt, checked against Unihan: kHangul with the word-initial rule, kVietnamese), never a native word.
Speech level: examples are 해요체 (polite informal) unless the word is itself 합쇼체 (감사합니다) or marked 반말 in vi.
"""
import json, os, re, subprocess, sys

sys.stdout.reconfigure(encoding="utf-8")
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = sys.argv[1]
MODE = sys.argv[2] if len(sys.argv) > 2 else "all"
CORE = ["core-0.txt", "core-1.txt", "core-2.txt", "core-3.txt", "core-4.txt", "core-5.txt", "core-6.txt", "core-7.txt"]
LATER = "core-a2.txt"
STAGED = "content/ko/_drafts/staged"
REVIEW_DIR = "content/ko/_drafts/review"
POS = {"N": "noun", "M": "noun", "V": "verb", "A": "adjective", "D": "adverb", "P": "pronoun", "T": "determiner", "C": "conjunction", "J": "interjection", "E": "expression", "X": "other", "R": "noun"}
TOPICS = {"people", "greetings", "food", "animals", "travel", "everyday", "places", "shopping", "time", "family", "home", "body", "clothing", "colors", "numbers", "weather", "nature", "work", "school", "feelings", "leisure", "technology"}
HANGUL_WORDS = re.compile(r"^[가-힣]+( [가-힣]+)*$")
HAN = re.compile(r"[一-鿿]")
# Names in examples: characters, not vocabulary.
NAMES = ["민수", "지영", "수진", "준호", "김", "이", "박", "흐엉", "남", "란", "민", "투이", "응우옌", "호찌민", "하노이", "서울", "부산", "인천", "안산", "수원", "화성"]
# The inherited ko-en basic pack is never edited; every one of its words is a lexeme here with the pack's English gloss.
UNMAPPED = {}
# The 37 Hán-Việt pairs P4b authored in content/hanviet/ko.json; ko-lex.py keeps them and adds hanviet-ko.txt.
P4B_WORDS = set("가족 경제 공부 교실 국가 대학 대학교 도서관 동물 문제 문화 병원 사진 생일 선생 세계 시간 시장 식당 신문 약국 여행 영화 운동 은행 음악 의사 일본 전화 주말 중국 지하철 친구 학교 학생 한국 회사".split())
UNIT_ORDER = ["1", "2", "3", "4", "5", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v"]
# Where a lexeme no unit's word list teaches first unlocks in the daily words. Keys: topic, or topic:partOfSpeech.
TOPIC_UNITS = {
    "greetings": "1", "people": "2", "people:pronoun": "a", "people:other": "2", "people:verb": "s", "people:adjective": "l",
    "family": "3", "food": "4", "food:verb": "4", "food:adjective": "s", "numbers": "5", "numbers:other": "d", "shopping": "5", "shopping:verb": "s",
    "everyday": "a", "everyday:verb": "b", "everyday:adjective": "c", "everyday:adverb": "c", "everyday:other": "a", "everyday:conjunction": "p",
    "everyday:pronoun": "a", "everyday:determiner": "a", "everyday:expression": "k", "everyday:interjection": "k",
    "time": "d", "time:verb": "b", "time:adverb": "b", "time:adjective": "d", "time:other": "d",
    "home": "c", "home:verb": "j", "home:adjective": "c", "places": "c", "places:pronoun": "c", "places:verb": "t", "places:adjective": "t", "places:other": "c",
    "travel": "h", "travel:verb": "t", "travel:adverb": "t", "school": "e", "school:verb": "e", "school:adjective": "e",
    "work": "g", "work:verb": "g", "work:adjective": "g", "work:expression": "v", "work:adverb": "g", "body": "u", "body:adjective": "u", "body:expression": "u", "body:verb": "u",
    "clothing": "j", "clothing:verb": "j", "colors": "c", "colors:adjective": "c", "weather": "f", "weather:verb": "f", "weather:adjective": "f",
    "nature": "f", "nature:verb": "f", "animals": "f", "feelings": "l", "feelings:adjective": "l", "feelings:verb": "l", "feelings:adverb": "l", "feelings:expression": "l",
    "leisure": "m", "leisure:verb": "m", "leisure:adjective": "m", "technology": "v", "technology:verb": "v",
}
DERIVATION = "members: lexemes taught by the primary course + course-authored lexemes (source original-lexicon-etl only) + lexemes the course added through lexicon-add + frequency bands very-common/common; unit: first unit teaching the lexeme, else the authored topic map (topic-units.json, topic:pos before topic), else first unit teaching its topic, else the first unit; order: unit, then frequency rank; the words of content/ko/_drafts/_generators/core-a2.txt are band A2-1 (syllabus-a2-1.json)"

# ---------------------------------------------------------------- hangul helpers (example check)
S0, NV, NT = 0xAC00, 21, 28
V_O, V_WA, V_U, V_WO, V_I, V_YEO, V_EU, V_OE, V_WAE, V_A, V_EO = 8, 9, 13, 14, 20, 6, 18, 11, 10, 0, 4
T_D, T_L, T_B = 7, 8, 17


def split(ch):
    c = ord(ch) - S0
    return c // (NV * NT), (c % (NV * NT)) // NT, c % NT


def join(l, v, t=0):
    return chr(S0 + (l * NV + v) * NT + t)


def bright(v):
    return v in (V_A, V_O, 2, 12)  # ㅏ ㅗ ㅑ ㅛ


def polite_stems(stem):
    """Forms the 해요체 / 아어 contraction gives a stem (먹 → 먹, 가 → 가, 오 → 와, 마시 → 마셔, 쓰 → 써, 모르 → 몰라,
    춥 → 추워, 듣 → 들, 되 → 돼, 하 → 해). Approximate on purpose: the example check only needs one to appear."""
    out = {stem}
    if not stem or not all("가" <= c <= "힣" for c in stem):
        return out
    head, last = stem[:-1], stem[-1]
    l, v, t = split(last)
    if stem.endswith("하"):
        out.add(head + "해")
    if t == 0:
        if v == V_O:
            out.add(head + join(l, V_WA))
        elif v == V_U:
            out.add(head + join(l, V_WO))
        elif v == V_I:
            out.add(head + join(l, V_YEO))
        elif v == V_OE:
            out.add(head + join(l, V_WAE))
        elif v == V_EU:
            if l == 5 and head:  # 르: 모르 → 몰라, 부르 → 불러
                pl, pv, pt = split(head[-1])
                if pt == 0:
                    out.add(head[:-1] + join(pl, pv, T_L) + join(5, V_A if bright(pv) else V_EO))
            pv = split(head[-1])[1] if head else V_EO
            out.add(head + join(l, V_A if bright(pv) else V_EO))
    elif t == T_B:
        out.add(head + join(l, v) + "워")
        out.add(head + join(l, v) + "와")
    elif t == T_D:
        out.add(head + join(l, v, T_L))
    return out


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
            if len(p) < 8:
                raise SystemExit(f"{name}:{n}: expected at least 8 columns, got {len(p)}: {line}")
            kind, surface, vi, en, topic, ex, ex_vi, ex_en = p[:8]
            extra = {}
            for x in p[8:]:
                k, _, v = x.partition("=")
                if k not in ("form", "rrs") or not v:
                    raise SystemExit(f"{name}:{n}: bad extra column {x}")
                extra[k] = v
            if kind not in POS or topic not in TOPICS or not all(p[:8]):
                raise SystemExit(f"{name}:{n}: bad row: {line}")
            if not HANGUL_WORDS.match(surface):
                raise SystemExit(f"{name}:{n}: surface is not hangul words: {surface}")
            out.append({"kind": kind, "surface": surface, "vi": vi, "en": en, "topic": topic, "example": (ex, ex_vi, ex_en), "band": band, "file": name, "line": n, **extra})
    return out


def example_errors(r):
    ex = r["example"][0]
    errs = []
    if not re.search(r"[.?!]$", ex):
        errs.append(f"{r['surface']}: example lacks final punctuation: {ex}")
    if len(ex) > 40:
        errs.append(f"{r['surface']}: example over 40 characters: {ex}")
    if HAN.search(ex) or re.search(r"[A-Za-z]", ex):
        errs.append(f"{r['surface']}: example must be hangul (digits allowed): {ex}")
    s, kind = r["surface"], r["kind"]
    if "form" in r:
        ok = r["form"] in ex
    elif kind in ("V", "A") and s.endswith("하다") and len(s) > 2:
        ok = s[:-2] in ex  # 전화하다 → 전화할게요, 급하다 → 급한: the root carries the word
    elif kind in ("V", "A") and s.endswith("다"):
        ok = any(f in ex for f in polite_stems(s[:-1]))
    else:
        ok = s in ex
    if not ok:
        errs.append(f"{s}: example does not use the word: {ex}")
    return errs


def write_json(rel, doc, indent=2):
    path = f"{ROOT}/{rel}"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(doc, f, ensure_ascii=False, indent=indent)
        f.write("\n")


def hanviet_rows():
    rows = []
    for n, line in enumerate(open(os.path.join(HERE, "hanviet-ko.txt"), encoding="utf-8"), 1):
        line = line.rstrip("\n")
        if not line or line.startswith("#"):
            continue
        word, hanja, reading, note = line.split("|")
        rows.append({"word": word, "hanja": hanja, "reading": reading, "kind": "sino", **({"note": note} if note else {}), "line": n})
    return rows


def readings(rows, hv):
    """RR of every row and the Hán-Việt check, through ko-readings.ts (bun)."""
    os.makedirs(f"{ROOT}/{REVIEW_DIR}", exist_ok=True)
    src, dst = f"{ROOT}/{REVIEW_DIR}/readings-in.json", f"{ROOT}/{REVIEW_DIR}/readings-out.json"
    doc = {"words": [{"surface": r["surface"], "pos": POS[r["kind"]], **({"rrSpelling": r["rrs"]} if "rrs" in r else {})} for r in rows],
           "hanviet": [{k: e[k] for k in ("word", "hanja", "reading", "kind", "note") if k in e} for e in hv]}
    with open(src, "w", encoding="utf-8", newline="\n") as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)
        f.write("\n")
    subprocess.run(["bun", "content/ko/_drafts/_generators/ko-readings.ts", src, dst], cwd=ROOT, check=True)
    out = json.load(open(dst, encoding="utf-8"))
    os.remove(src)
    os.remove(dst)
    return out


def build():
    a1 = [r for name in CORE for r in read_rows(name, "A1")]
    a2 = read_rows(LATER, "A2-1")
    rows = a1 + a2
    errors, seen = [], {}
    for r in rows:
        if r["surface"] in seen:
            errors.append(f"duplicate surface: {r['surface']} ({seen[r['surface']]}, {r['file']}:{r['line']})")
        seen[r["surface"]] = f"{r['file']}:{r['line']}"
        if "TODO" in "".join([r["vi"], r["en"], *r["example"]]):
            errors.append(f"{r['surface']}: draft marker")
        errors += example_errors(r)
    hv = hanviet_rows()
    rd = readings(rows, hv)
    for r in rows:
        w = rd["words"][f"{r['surface']}|{POS[r['kind']]}"]
        r["rr"], r["rrSpelling"], r["rrBasis"] = w["rr"], w.get("rrSpelling"), w["basis"]
        if "disagreement" in w:
            r["rrNote"] = w["disagreement"]
    by_surface = {r["surface"]: r for r in rows}
    for e in hv:
        r = by_surface.get(e["word"])
        if r is None:
            errors.append(f"hanviet-ko.txt:{e['line']}: {e['word']} is not a course surface")
        elif r["kind"] == "R":
            errors.append(f"hanviet-ko.txt:{e['line']}: {e['word']} is a proper noun (no Hán-Việt for names)")
        elif e["word"] in P4B_WORDS:
            errors.append(f"hanviet-ko.txt:{e['line']}: {e['word']} is a P4b entry already")
        for m in rd["hanviet"][e["word"]]["errors"]:
            errors.append(f"hanviet-ko.txt:{e['line']}: {e['word']}: {m}")
    if errors:
        for e in errors:
            sys.stdout.write(f"ERROR {e}\n")
        raise SystemExit(f"{len(errors)} error(s)")
    return a1, a2, hv, rd


def assign_ids(rows):
    frozen_path = f"{ROOT}/{STAGED}/content/ko/lexemes.json"
    frozen = json.load(open(frozen_path, encoding="utf-8")) if os.path.exists(frozen_path) else {}
    used = set(frozen.values())
    ids = {}
    for r in rows:
        if r["surface"] in frozen:
            ids[r["surface"]] = frozen[r["surface"]]
            continue
        base = slug(r["rr"]) or "x"
        cand = f"ko:w:{base}"
        if cand in used:
            words = [w for w in slug(re.sub(r"^(the|to|a|an) ", "", r["en"].lower())).split("-") if w and w not in ("the", "to", "a", "an")]
            cand = f"ko:w:{base}-{words[0] if words else POS[r['kind']]}"
        n = 2
        while cand in used:
            cand = f"ko:w:{base}-{n}"
            n += 1
        used.add(cand)
        ids[r["surface"]] = cand
    return ids


def lexemes_of(rows, ids):
    pool = json.load(open(f"{ROOT}/content/ko/lexicon/derived/candidate-pool.json", encoding="utf-8"))["entries"]
    by_key = {}
    for e in pool:
        by_key.setdefault((e["lemma"], e["partOfSpeech"]), e)
    out = []
    for r in rows:
        pos = POS[r["kind"]]
        lemma = r["surface"]
        # Expressions are project-authored: a pool frequency on one would be fabricated (lexicon validator).
        ev = by_key.get((lemma, pos)) if pos != "expression" else None
        refs = []
        if ev:
            refs.append({"source": "kaikki-en", "key": f"{ev['lemma']}|{ev['sourcePos']}"})
            if ev.get("frequency"):
                refs.append({"source": "frequencywords", "key": ev["lemma"]})
        refs.append({"source": "original-lexicon-etl"})
        reading = {"rr": r["rr"], **({"rrSpelling": r["rrSpelling"]} if r.get("rrSpelling") else {})}
        lex = {"id": ids[lemma], "surface": lemma, "lemma": lemma, "lookupForm": lemma, "partOfSpeech": pos}
        if r["kind"] == "R":
            lex["proper"] = True
        lex.update({"glosses": {"en": r["en"], "vi": r["vi"]}, "pronunciation": {"value": r["rr"], "notation": "rr", "source": "original-lexicon-etl"}, "reading": reading})
        if ev and ev.get("frequency"):
            f = ev["frequency"]
            lex["frequency"] = {"source": "frequencywords", "rawValue": f["perMillion"], "rank": f["rank"], "band": f["band"]}
        ex, ex_vi, ex_en = r["example"]
        lex["topic"] = r["topic"]
        lex["examples"] = [{"target": ex, "translations": {"en": ex_en, "vi": ex_vi}, "source": "original-lexicon-etl", "key": "add"}]
        lex["sourceRefs"] = refs
        out.append(lex)
        r["id"] = ids[lemma]
        r["inPool"] = ev is not None
        r["rank"] = ((ev or {}).get("frequency") or {}).get("rank", 10**9)
    return out


def ko_en_check(rows):
    pack = json.load(open(f"{ROOT}/content/courses/ko-en.json", encoding="utf-8"))
    by_surface = {r["surface"]: r for r in rows}
    errors = []
    for s in pack["sections"]:
        for u in s["units"]:
            for w in u["words"]:
                r = by_surface.get(w["target"])
                if r is None:
                    if w["target"] not in UNMAPPED:
                        errors.append(f"ko-en word {w['target']} has no lexeme or unmapped reason")
                elif r["en"] != w["native"]:
                    errors.append(f"ko-en word {w['target']}: English gloss '{r['en']}' must equal the pack's '{w['native']}'")
    return errors


def anchors_report(rows):
    """Frequency anchor (no allowlisted Korean learner list can be fetched: the NIKL list is owner-download only,
    OWNER-FINAL-CHECKLIST C). The 300 most frequent content entries of the pool (FrequencyWords via kaikki lemmas) are
    the anchor; anchors-left-out.txt gives the reason each one not taken is left out."""
    pool = json.load(open(f"{ROOT}/content/ko/lexicon/derived/candidate-pool.json", encoding="utf-8"))["entries"]
    top = [e for e in pool if e["kind"] == "content" and e.get("frequency")]
    top = sorted(top, key=lambda e: e["frequency"]["rank"])[:300]
    taken = {(r["surface"], POS[r["kind"]]) for r in rows}
    surfaces = {r["surface"] for r in rows}
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
    grouped, unexplained, missing, other_pos = {}, [], [], 0
    for e in top:
        key = f"{e['lemma']}/{e['partOfSpeech']}"
        if (e["lemma"], e["partOfSpeech"]) in taken:
            continue
        if e["lemma"] in surfaces:
            other_pos += 1  # the same word, taken with the course's part of speech (오늘 noun, the pool's adverb entry)
            continue
        missing.append(key)
        if key in reasons:
            grouped.setdefault(reasons[key], []).append(key)
        else:
            unexplained.append(key)
    stale = sorted(w for w in reasons if w not in missing)
    if unexplained:
        print("UNEXPLAINED anchor entries:", " ".join(unexplained))
        raise SystemExit(f"{len(unexplained)} anchor entr(ies) lack a reason in anchors-left-out.txt")
    if stale:
        raise SystemExit("anchors-left-out.txt lists entries that are taken or not in the anchor: " + " ".join(stale))
    in_pool = sum(1 for r in rows if r.get("inPool"))
    return {"legend": legend, "grouped": grouped, "top": len(top), "missing": len(missing), "inPool": in_pool, "surfaceOnly": other_pos}


def hanviet_merge(hv):
    path = f"{ROOT}/content/hanviet/ko.json"
    table = json.load(open(path, encoding="utf-8"))
    entries = {e["word"]: e for e in table["entries"] if e["word"] in P4B_WORDS}
    for e in hv:
        entries[e["word"]] = {k: e[k] for k in ("word", "hanja", "reading", "kind", "note") if k in e}
    ordered = [entries[w] for w in sorted(entries)]
    write_json(f"{STAGED}/content/hanviet/ko.json", {"language": "ko", "entries": [{k: e[k] for k in ("word", "hanja", "reading", "kind", "note") if k in e} for e in ordered]})
    return len(hv), len(ordered)


def review(a1, a2, rep, hv, lexemes):
    rows = a1 + a2
    pos = {}
    for r in a1:
        pos[POS[r["kind"]]] = pos.get(POS[r["kind"]], 0) + 1
    topics = {}
    for r in rows:
        topics[r["topic"]] = topics.get(r["topic"], 0) + 1
    confirmed = sum(1 for r in rows if r["rrBasis"] == "pool-confirmed")
    notes = [r for r in rows if r.get("rrNote")]
    freq = sum(1 for x in lexemes if "frequency" in x)
    with_hv = sum(1 for r in rows if r["surface"] in P4B_WORDS or r["surface"] in {e["word"] for e in hv[2]})
    lines = [
        "# ko lexicon — authoring review sheet (generated by content/ko/_drafts/_generators/ko-lex.py)",
        "",
        f"Hand-chosen lexicon for ko-vi: {len(a1)} A1 words and {len(a2)} A2-1 words (core-*.txt). It replaces the pool-only sheet of `scripts/lexicon-author.ts`; do not re-run that script over it. Staged until promote.",
        "",
        "A human still has to check:",
        "",
        "- **Vietnamese text.** Every gloss and example translation was written by an AI agent and awaits the D-10 review. There are no `TODO:vi` markers.",
        "- **Korean examples.** Original sentences in 해요체 (합쇼체 only where the word itself is, such as 감사합니다), checked by ko-lex.py for length and for using the word only — a native or advanced reader should read every one.",
        "- **English glosses.** Short glosses for the build tools; the ko-en words keep the pack's own glosses (`the man`, `to eat`).",
        "",
        "## Counts",
        "",
        "- A1 by part of speech: " + ", ".join(f"{k} {v}" for k, v in sorted(pos.items())),
        "- Topics (A1 + A2-1): " + ", ".join(f"{k} {v}" for k, v in sorted(topics.items())),
        f"- Readings (RR): {confirmed} keep the reading P4b confirmed against Wiktionary; {len(rows) - confirmed} are the rule output of `scripts/lib/cjk-readings/korean-rr.ts` (words outside the pool, set phrases). {len(notes)} disagree with the pool's Wiktionary romanization and are listed below.",
        f"- Frequency (FrequencyWords, through the candidate pool): {freq} of {len(rows)}; {rep['inPool']} lexemes match a pool lemma (kaikki-en refs).",
        f"- Examples: {len(rows)}, all original (`original-lexicon-etl`, key `add`), with Vietnamese and English translations; no Tatoeba sentence is used.",
        f"- Hán-Việt: {hv[0]} course words added to `content/hanviet/ko.json` ({hv[1]} entries with the P4b ones); {with_hv} lexemes have a reading there. Sino-Korean words with hanja only, never a native word; false friends carry a note.",
        "- ko-en (basic pack, never edited): every word maps to a lexeme with the pack's English gloss.",
        "",
        "## Frequency anchor",
        "",
        f"No allowlisted Korean learner list can be fetched (the NIKL 한국어 학습용 어휘 목록 is owner-download only, OWNER-FINAL-CHECKLIST C). The anchor is the {rep['top']} most frequent content entries of the candidate pool (FrequencyWords counts over kaikki lemmas): {rep['top'] - rep['missing']} are taken ({rep['surfaceOnly']} of them as the same word under the course's part of speech, such as 오늘 noun for the pool's adverb entry); the {rep['missing']} left out are listed by reason. The pool counts subtitle word forms, so many of its top entries are inflected forms or rare homographs that took a common form's count.",
        "",
    ]
    for code in sorted(rep["grouped"]):
        lines += [f"**{rep['legend'][code]}** ({len(rep['grouped'][code])}): " + ", ".join(rep["grouped"][code]), ""]
    if notes:
        lines += ["## RR rule output vs Wiktionary", "", "The reading shipped is the rule output; check each against the official rule text.", ""]
        lines += [f"- {r['surface']} ({POS[r['kind']]}): {r['rrNote']}" for r in notes]
        lines.append("")
    return "\n".join(lines)


def main():
    a1, a2, hv, rd = build()
    rows = a1 + a2
    errors = ko_en_check(rows)
    if errors:
        raise SystemExit("\n".join(errors))
    ids = assign_ids(rows)
    lexemes = lexemes_of(rows, ids)
    if MODE == "split":
        rel = f"{STAGED}/content/ko/lexicon/syllabus.json"
        syl = json.load(open(f"{ROOT}/{rel}", encoding="utf-8"))
        later_ids = {r["id"] for r in a2}
        later = [e for e in syl["entries"] if e["lexemeId"] in later_ids]
        syl["entries"] = [e for e in syl["entries"] if e["lexemeId"] not in later_ids]
        syl["derivation"] = DERIVATION
        write_json(rel, syl)
        write_json(f"{STAGED}/content/ko/lexicon/syllabus-a2-1.json", {"version": 1, "language": "ko", "level": "A2-1", "minLexemes": 0, "derivation": "TOPIK I level-2 words for work and life in Korea (EPS), and the inherited ko-en words beyond A1 (core-a2.txt)", "entries": later})
        print("A1", len(syl["entries"]), "A2-1", len(later))
        return
    rep = anchors_report(rows)
    hvc = hanviet_merge(hv)
    write_json(f"{STAGED}/content/ko/lexicon/lexemes.json", {"version": 1, "language": "ko", "lexemes": lexemes})
    write_json(f"{STAGED}/content/ko/lexemes.json", {r["surface"]: r["id"] for r in rows})
    topics = {(r["topic"], POS[r["kind"]]) for r in rows}
    units = {k: f"ko-vi:unit-{v}" for k, v in TOPIC_UNITS.items() if any(t == k.split(":")[0] and (":" not in k or p == k.split(":")[1]) for t, p in topics)}
    write_json(f"{STAGED}/content/ko/lexicon/topic-units.json", {"version": 1, "language": "ko", "courseId": "ko-vi", "note": "Authored topic → unit map of the ko-vi syllabus: where a lexeme no lesson teaches first belongs. Keys are topic:partOfSpeech before topic.", "units": units})
    with open(f"{ROOT}/{STAGED}/content/ko/lexicon/REVIEW.md", "w", encoding="utf-8", newline="\n") as f:
        f.write(review(a1, a2, rep, (hvc[0], hvc[1], hv), lexemes) + "\n")
    # The reading basis of every word, for the review (which words the rules alone read).
    write_json(f"{REVIEW_DIR}/readings.json", {"generator": "content/ko/_drafts/_generators/ko-lex.py", "words": {r["surface"]: {"rr": r["rr"], "basis": r["rrBasis"], **({"rrSpelling": r["rrSpelling"]} if r.get("rrSpelling") else {}), **({"note": r["rrNote"]} if r.get("rrNote") else {})} for r in rows}})
    print("A1", len(a1), "A2-1", len(a2), "hanviet", hvc, "anchor taken", rep["top"] - rep["missing"], "of", rep["top"])


main()
