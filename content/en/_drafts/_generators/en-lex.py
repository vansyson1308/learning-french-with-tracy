"""English lexicon for en-vi from the curated lists core-*.txt (hand-chosen, hand-glossed).

usage: python -I en-lex.py <repo root>          write every output below (byte-deterministic)
       python -I en-lex.py <repo root> split    after `syllabus.ts derive` exists for en-vi: move core-a2 words
                                                out of the derived syllabus.json into syllabus-a2-1.json

Writes content/en/lexemes.json, and under content/en/lexicon/: lexemes.json, syllabus.json,
syllabus-a2-1.json, topic-units.json, noun-plurals.json, irregular-forms.json, REVIEW.md.

Row format (core-*.txt):
  kind|lemma|ipa|vi|en|topic|example|example vi|forms
  +|example|example vi      a further example for the row above
kind: N V A D P T R C I E (see POS). forms: nouns = irregular plural, or "-" for uncountable;
verbs = past/participle when irregular; adjectives and adverbs = comparative/superlative when irregular.

The IPA column is the authored General American transcription, kept to compare. What ships is the licensed value from
derived/ipa-general-american.json, verbatim, with source kaikki-en; a row with no licensed value, or one the D-10 review corrected
(IPA_FIXED), ships the authored string, with source original-english-course. Every difference is listed in content/en/_drafts/review/ipa-diff.json.

anchors-left-out.txt gives the reason each CEFR-J A1 lemma is not taken; a missing or stale reason stops the run.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
CORE = ["core-0.txt", "core-1.txt", "core-2.txt", "core-3.txt", "core-4.txt", "core-5.txt", "core-6.txt"]
LATER = "core-a2.txt"
POS = {"N": "noun", "V": "verb", "A": "adjective", "D": "adverb", "P": "pronoun", "T": "determiner", "R": "preposition", "C": "conjunction", "I": "interjection", "E": "expression"}
TOPICS = {"people", "greetings", "food", "animals", "travel", "everyday", "places", "shopping", "time", "family", "home", "body", "clothing", "colors", "numbers", "weather", "nature", "work", "school", "feelings", "leisure", "technology"}
AUTHORED_IPA = "original-english-course"
# American titles take a period. The lemma stays the bare word: tokens never hold the period.
TITLE_SURFACE = {"Mr": "Mr.", "Mrs": "Mrs.", "Ms": "Ms."}
UNIT_ORDER = ["1", "2", "3", "4", "5", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v"]
# Where a lexeme no unit's word list teaches first unlocks in the daily words (en-units.py teaches about 200 of the 750).
# Near-first units for what a learner needs early; work words at the units about work.
TOPIC_UNITS = {
    "greetings": "1", "people": "2", "people:pronoun": "2", "people:determiner": "3", "people:expression": "o", "people:verb": "s", "people:adjective": "l",
    "family": "3", "animals": "3", "food": "4", "food:verb": "4", "food:adjective": "t",
    "travel": "5", "travel:verb": "h", "travel:preposition": "h", "travel:expression": "5",
    "places": "5", "places:preposition": "5", "places:verb": "u", "places:adverb": "i", "places:adjective": "u", "places:expression": "u",
    "home": "a", "home:verb": "j", "home:adjective": "n",
    "work": "l", "work:verb": "h", "work:adjective": "g", "work:conjunction": "p",
    "school": "h", "school:verb": "f", "technology": "q", "numbers": "d",
    "time": "d", "time:verb": "j", "time:adverb": "j", "time:adjective": "v", "time:preposition": "v",
    "colors": "n", "clothing": "n", "body": "u", "shopping": "t", "weather": "j", "nature": "j",
    "feelings": "n", "feelings:verb": "p", "leisure": "v",
    "everyday": "b", "everyday:adjective": "n", "everyday:noun": "f", "everyday:adverb": "c", "everyday:pronoun": "i", "everyday:determiner": "a",
    "everyday:expression": "a", "everyday:conjunction": "p", "everyday:preposition": "p",
}
DERIVATION = "members: lexemes taught by the primary course + course-authored lexemes (source original-lexicon-etl only) + lexemes the course added through lexicon-add + frequency bands very-common/common; unit: first unit teaching the lexeme, else the authored topic map (topic-units.json, topic:pos before topic), else first unit teaching its topic, else the first unit; order: unit, then frequency rank; the words of content/en/_drafts/_generators/core-a2.txt are band A2-1 (syllabus-a2-1.json)"
# Confusable by sound or spelling for Vietnamese learners (surfaces); symmetric by construction.
CONFUSABLES = [
    ("to", "too"), ("to", "two"), ("too", "two"), ("hear", "here"), ("their", "there"), ("buy", "by"), ("right", "write"), ("see", "sea"), ("son", "sun"),
    ("meat", "meet"), ("know", "no"), ("week", "weak"), ("wear", "where"), ("hour", "our"), ("live", "leave"), ("eat", "it"), ("this", "these"), ("that", "those"),
    ("he", "she"), ("his", "her"), ("sit", "seat"), ("cook", "book"), ("bad", "bed"), ("thirteen", "thirty"), ("fifteen", "fifty"),
    ("fourteen", "forty"), ("sixteen", "sixty"), ("seventeen", "seventy"), ("eighteen", "eighty"), ("nineteen", "ninety"),
    ("think", "thing"), ("work", "walk"), ("car", "card"), ("bag", "back"), ("cat", "cut"), ("sick", "six"),
]
CONTRACTIONS = {"don't": "do", "doesn't": "do", "didn't": "do", "isn't": "be", "aren't": "be", "wasn't": "be", "weren't": "be", "can't": "can", "won't": "will", "i'm": "i", "i'll": "i", "i'd": "i", "i've": "i", "you're": "you", "he's": "he", "she's": "she", "it's": "it", "we're": "we", "they're": "they", "that's": "that", "what's": "what", "where's": "where", "there's": "there", "let's": "let", "who's": "who", "how's": "how", "o'clock": "o'clock", "wouldn't": "would", "shouldn't": "should", "couldn't": "could", "mustn't": "must", "cannot": "can"}
EXTRA_FORMS = {"be": ["am", "is", "are"], "have": ["has"], "do": ["does"], "go": ["goes"]}
NAMES = {"anna", "tom", "mai", "nam", "lan", "minh", "hoa", "hanoi", "ben", "sam", "john", "mary", "hung", "david", "linh"}
ANCHOR_INFLECTED = {"are", "is", "was", "were", "had", "doing", "am", "been", "done", "being", "left", "lost", "worried", "used", "married"}


# A selected line that is wrong for the course's word: the hand-written value ships with source original-english-course, listed for review.
IPA_REJECTED = {"thank": "the only American line is an unlabelled /ˈðæŋk/ next to dialect lines; thank starts with /θ/"}

# D-10 language review: the wrong values and the unexplained parentheses, as a teacher writes them. They ship with source original-english-course.
IPA_FIXED = { "English": "ˈɪŋɡlɪʃ", "appointment": "əˈpɔɪntmənt", "bicycle": "ˈbaɪsɪkəl", "cafeteria": "ˌkæfəˈtɪɹiə", "clothes": "kloʊz", "community": "kəˈmjunəti", "condition": "kənˈdɪʃən", "during": "ˈdʊɹɪŋ", "eighteen": "ˌeɪˈtin", "empty": "ˈɛmpti", "engineer": "ˌɛndʒəˈnɪɹ", "every": "ˈɛvɹi", "everything": "ˈɛvɹiˌθɪŋ", "excuse me": "ɪkˈskjuz mi", "exhibition": "ˌɛksəˈbɪʃən", "experience": "ɪkˈspɪɹiəns", "fourteen": "ˌfɔɹˈtin", "grandfather": "ˈɡɹænˌfɑðɚ", "grandmother": "ˈɡɹænˌmʌðɚ", "hello": "həˈloʊ", "how are you": "ˌhaʊ ɑɹ ˈju", "internet": "ˈɪntɚˌnɛt", "interview": "ˈɪntɚˌvju", "invitation": "ˌɪnvɪˈteɪʃən", "kitchen": "ˈkɪtʃən", "landlord": "ˈlændˌlɔɹd", "mountain": "ˈmaʊntən", "once": "wʌns", "orange": "ˈɔɹɪndʒ", "quarter": "ˈkwɔɹtɚ", "restaurant": "ˈɹɛstɹɑnt", "sale": "seɪl", "supermarket": "ˈsupɚˌmɑɹkɪt", "thirteen": "ˌθɝˈtin", "thousand": "ˈθaʊzənd", "traffic light": "ˈtɹæfɪk laɪt", "university": "ˌjunɪˈvɝsəti", "usually": "ˈjuʒuəli", "volunteer": "ˌvɑlənˈtɪɹ", "wear": "wɛɹ", "website": "ˈwɛbˌsaɪt", "within": "wɪˈðɪn", "yesterday": "ˈjɛstɚˌdeɪ" }


def read_rows(name, band):
    out = []
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        for n, line in enumerate(f, 1):
            line = line.rstrip("\n")
            if not line.strip() or line.startswith("#"):
                continue
            p = line.split("|")
            if p[0] == "+":
                if len(p) != 3 or not out:
                    raise SystemExit(f"{name}:{n}: bad continuation row")
                out[-1]["examples"].append((p[1], p[2]))
                continue
            if len(p) != 9:
                raise SystemExit(f"{name}:{n}: expected 9 columns, got {len(p)}: {line}")
            kind, lemma, ipa, vi, en, topic, ex, ex_vi, forms = p
            if kind not in POS or topic not in TOPICS or not all([lemma, ipa, vi, en, ex, ex_vi]):
                raise SystemExit(f"{name}:{n}: bad row: {line}")
            out.append({"kind": kind, "lemma": lemma, "ipa": ipa, "vi": vi, "en": en, "topic": topic, "examples": [(ex, ex_vi)], "forms": forms, "band": band, "file": name})
    return out


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower().replace("'", "")).strip("-")


def norm_ipa(s, stress=False):
    s = s.replace("͡", "").replace("͜", "").replace("̬", "").replace("̯", "").replace("(", "").replace(")", "").replace("ɫ", "l")
    s = s.replace("l̩", "əl").replace("n̩", "ən").replace("m̩", "əm")
    s = re.sub(r"[ˌ.ːˑ‿/\[\] ]", "", s)
    if not stress:
        s = s.replace("ˈ", "")
    s = s.replace("g", "ɡ").replace("r", "ɹ").replace("ʍ", "w").replace("ɾ", "t")
    s = s.replace("ɜɹ", "ɝ").replace("ɜ˞", "ɝ").replace("ə˞", "ɚ").replace("əɹ", "ɚ").replace("ɝɹ", "ɝ").replace("ɝ", "ɚ").replace("ɚɹ", "ɚ")
    # One sound in General American, written either way: horse-hoarse and the r after a vowel.
    s = s.replace("oɹ", "ɔɹ").replace("ɛɚ", "ɛɹ").replace("ɪɚ", "ɪɹ").replace("ʊɚ", "ʊɹ").replace("ɔɚ", "ɔɹ").replace("ɑɚ", "ɑɹ").replace("aɪɚ", "aɪɹ")
    s = re.sub(r"e(?!ɪ)", "ɛ", s)
    return s


def ipa_agrees(licensed, authored):
    """Same sounds, and the primary stress in the same place when both mark one (monosyllables may or may not)."""
    if norm_ipa(licensed) != norm_ipa(authored):
        return False
    a, b = norm_ipa(licensed, True), norm_ipa(authored, True)
    return "ˈ" not in a or "ˈ" not in b or a == b


def licensed_ipa(table, lemma, pos, authored):
    """The licensed line for a row. The same part of speech first; another with the same spelling only where this one has no
    line (Vietnamese: adjective in one list, noun in another), and letters and symbols never. Tags select the line, unless a
    further American line of the page agrees with the authored value: then that is the common variant the course means
    (`the`: /ðə/, not the strong /ði/), still licensed, still verbatim."""
    key = f"{lemma}|{pos}"
    if key in table:
        keys = [key]
    else:
        keys = sorted(k for k in table if k.rsplit("|", 1)[0] == lemma and k.rsplit("|", 1)[1] not in ("character", "symbol", "letter"))
    if not keys:
        return None
    lines = [line for k in keys for line in [table[k], *table[k].get("others", [])]]
    for line in lines:
        if ipa_agrees(line["value"], authored):
            return line
    return table[keys[0]]


def inflections(lemma, kind="E"):
    """Regular forms a learner of this word may meet, by part of speech. Glosses may name a second use (`change`, `open`), so nouns and verbs share endings."""
    w = lemma.lower()
    out = {w}
    if kind in ("N", "V"):
        out |= {w + "s", w + "es"}
        if w.endswith("y"):
            out |= {w[:-1] + "ies"}
    if kind == "V":
        out |= {w + "ed", w + "d", w + "ing"}
        if w.endswith("y"):
            out |= {w[:-1] + "ied"}
        if w.endswith("e"):
            out |= {w[:-1] + "ing"}
        if re.search(r"[^aeiou][aeiou][^aeiouwy]$", w):
            out |= {w + w[-1] + "ed", w + w[-1] + "ing"}
    if kind in ("A", "D"):
        out |= {w + "er", w + "r", w + "est", w + "st", w + "ly"}
        if w.endswith("y"):
            out |= {w[:-1] + "ier", w[:-1] + "iest", w[:-1] + "ily"}
        if re.search(r"[^aeiou][aeiou][^aeiouwy]$", w):
            out |= {w + w[-1] + "er", w + w[-1] + "est"}
    return out


def vocabulary(rows):
    vocab = set()
    for r in rows:
        for part in re.split(r"[ ]+", r["lemma"]):
            vocab |= inflections(part, r["kind"])
        if r["forms"] not in ("", "-"):
            vocab |= {x.lower() for x in re.split(r"[ ,/]+", r["forms"]) if x}
        vocab |= set(EXTRA_FORMS.get(r["lemma"], []))
    return vocab


def tokens(text):
    return re.findall(r"[A-Za-z0-9'-]+", text.replace("’", "'"))


def level_errors(row, vocab):
    errs = []
    for ex, _ in row["examples"]:
        toks = tokens(ex)
        if len(toks) > 12:
            errs.append(f"{row['lemma']}: example over 12 words: {ex}")
        if not re.search(r"[.?!]$", ex):
            errs.append(f"{row['lemma']}: example lacks final punctuation: {ex}")
        for t in toks:
            low = t.lower()
            if low.isdigit() or low in NAMES or low in vocab:
                continue
            base = CONTRACTIONS.get(low)
            if base and base in vocab:
                continue
            if low.endswith("'s") and (low[:-2] in vocab or low[:-2] in NAMES):
                continue
            if "-" in low and all(x in vocab for x in low.split("-")):
                continue
            errs.append(f"{row['lemma']}: '{t}' is outside the band: {ex}")
    forms = {x.lower() for x in re.split(r"[ ,/]+", row["forms"]) if x and x != "-"}
    if " " in row["lemma"]:
        if not any(row["lemma"].lower() in ex.lower().replace("’", "'") for ex, _ in row["examples"]):
            errs.append(f"{row['lemma']}: no example contains the expression")
    else:
        allowed = inflections(row["lemma"], row["kind"]) | forms | set(EXTRA_FORMS.get(row["lemma"], []))
        for ex, _ in row["examples"]:
            toks = {t.lower() for t in tokens(ex)}
            expanded = toks | {CONTRACTIONS[t] for t in toks if t in CONTRACTIONS} | {t[:-2] for t in toks if t.endswith("'s")}
            if not (allowed & expanded):
                errs.append(f"{row['lemma']}: example does not use the word: {ex}")
    return errs


def write_json(root, rel, doc):
    with open(f"{root}/{rel}", "w", encoding="utf-8", newline="\n") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)
        f.write("\n")


def unit_of(r):
    return TOPIC_UNITS.get(f"{r['topic']}:{POS[r['kind']]}") or TOPIC_UNITS[r["topic"]]


def build(root):
    a1 = [r for name in CORE for r in read_rows(name, "A1")]
    a2 = read_rows(LATER, "A2-1")
    rows = a1 + a2
    errors = []
    seen = {}
    for r in rows:
        if r["lemma"] in seen:
            errors.append(f"duplicate surface: {r['lemma']} ({seen[r['lemma']]}, {r['file']})")
        seen[r["lemma"]] = r["file"]
        if re.search(r"TODO", r["vi"] + r["en"] + "".join(v for _, v in r["examples"])):
            errors.append(f"{r['lemma']}: draft marker")
    v1, v2 = vocabulary(a1), vocabulary(rows)
    for r in a1:
        errors += level_errors(r, v1)
    for r in a2:
        errors += level_errors(r, v2)
    if errors:
        for e in errors:
            print("ERROR", e)
        raise SystemExit(f"{len(errors)} error(s)")

    pool = json.load(open(f"{root}/content/en/lexicon/derived/candidate-pool.json", encoding="utf-8"))["entries"]
    by_lemma = {}
    for e in pool:
        by_lemma.setdefault(e["lemma"], []).append(e)
    ipa_table = json.load(open(f"{root}/content/en/lexicon/derived/ipa-general-american.json", encoding="utf-8"))["entries"]
    ids, lexemes = {}, []
    stats = {"kaikki-en": 0, AUTHORED_IPA: 0, "byMethod": {}, "exact": [], "notationOnly": [], "mismatches": [], "noLicensedValue": []}
    for r in rows:
        pos = POS[r["kind"]]
        cands = [] if r["kind"] == "E" else by_lemma.get(r["lemma"], [])
        same = [e for e in cands if e["partOfSpeech"] == pos]
        def key(e):
            return (e["frequency"]["rank"] if e.get("frequency") else 10**9)
        ev = min(same, key=key) if same else (min(cands, key=key) if cands else None)
        base = f"en:w:{slug(r['lemma'])}"
        i = base if base not in ids.values() else f"{base}-{pos}"
        if i in ids.values():
            raise SystemExit(f"id collision {i}")
        ids[r["lemma"]] = i
        found = None if r["lemma"] in IPA_REJECTED or r["lemma"] in IPA_FIXED else licensed_ipa(ipa_table, r["lemma"], pos, r["ipa"])
        if r["lemma"] in IPA_FIXED:
            r["ipa"] = IPA_FIXED[r["lemma"]]
        if found:
            pron = {"value": found["value"], "notation": "ipa", "source": "kaikki-en"}
            stats["kaikki-en"] += 1
            stats["byMethod"][found["method"]] = stats["byMethod"].get(found["method"], 0) + 1
            row = {"word": r["lemma"], "partOfSpeech": pos, "generated": found["value"], "handWritten": r["ipa"], "source": "kaikki-en", "method": found["method"]}
            stats["exact" if found["value"] == r["ipa"] else "notationOnly" if ipa_agrees(found["value"], r["ipa"]) else "mismatches"].append(row)
        else:
            pron = {"value": r["ipa"], "notation": "ipa", "source": AUTHORED_IPA}
            stats[AUTHORED_IPA] += 1
            stats["noLicensedValue"].append({"word": r["lemma"], "partOfSpeech": pos, "handWritten": r["ipa"], "source": AUTHORED_IPA, **({"rejected": IPA_REJECTED[r["lemma"]]} if r["lemma"] in IPA_REJECTED else {})})
        refs = []
        if ev:
            refs.append({"source": "kaikki-en", "key": f"{ev['lemma']}|{ev['sourcePos']}"})
            if ev.get("frequency"):
                refs.append({"source": "frequencywords", "key": ev["lemma"]})
        refs.append({"source": "original-lexicon-etl"})
        lex = {"id": i, "surface": TITLE_SURFACE.get(r["lemma"], r["lemma"]), "lemma": r["lemma"], "lookupForm": TITLE_SURFACE.get(r["lemma"], r["lemma"]), "partOfSpeech": pos, "glosses": {"en": r["en"], "vi": r["vi"]}, "pronunciation": pron}
        if ev and ev.get("frequency"):
            f = ev["frequency"]
            lex["frequency"] = {"source": "frequencywords", "rawValue": f["perMillion"], "rank": f["rank"], "band": f["band"]}
        lex["topic"] = r["topic"]
        lex["examples"] = [{"target": ex, "translations": {"en": ex, "vi": vi}, "source": "original-lexicon-etl", "key": "add"} for ex, vi in r["examples"]]
        lex["sourceRefs"] = refs
        lexemes.append(lex)
        r["id"], r["rank"] = i, (lex.get("frequency") or {}).get("rank", 10**9)
    conf = {}
    for a, b in CONFUSABLES:
        if a in ids and b in ids:
            conf.setdefault(a, set()).add(ids[b])
            conf.setdefault(b, set()).add(ids[a])
    for lex in lexemes:
        if lex["surface"] in conf:
            lex["relations"] = {"confusables": sorted(conf[lex["surface"]])}
    return a1, a2, ids, lexemes, stats


def syllabus_entries(rows):
    order = {u: n for n, u in enumerate(UNIT_ORDER)}
    ranked = sorted(rows, key=lambda r: (order[unit_of(r)], r["rank"], r["lemma"].casefold(), r["lemma"]))
    return [{"lexemeId": r["id"], "unitId": f"en-vi:unit-{unit_of(r)}"} for r in ranked]


def anchors_report(root, a1, a2):
    anchors = json.load(open(f"{root}/content/en/lexicon/derived/anchors.json", encoding="utf-8"))["levels"]
    taken = {r["lemma"].lower() for r in a1}
    later = {r["lemma"].lower() for r in a2}
    forms = set()
    for r in a1 + a2:
        if r["forms"] not in ("", "-"):
            forms |= {x.lower() for x in re.split(r"[ ,/]+", r["forms"]) if x}
        forms |= set(EXTRA_FORMS.get(r["lemma"], []))
    multi = {p.lower() for r in a1 for p in r["lemma"].split() if " " in r["lemma"]}
    reasons = {}
    path = os.path.join(HERE, "anchors-left-out.txt")
    legend = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            if not line or line.startswith("#"):
                continue
            head, tail = line.split("|", 1)
            if head == "@":
                code, text = tail.split("|", 1)
                legend[code] = text
            else:
                for w in tail.split():
                    if w in reasons:
                        raise SystemExit(f"anchors-left-out: {w} listed twice")
                    reasons[w] = head
    cefr_a1 = sorted({k.split("|")[0].lower() for k, v in anchors["cefr-j"].items() if v == "A1"})
    ngsl1 = sorted({k.split("|")[0].lower() for k, v in anchors["ngsl"].items() if v == "NGSL-1k"})
    cefr_any = {}
    for k, v in anchors["cefr-j"].items():
        w = k.split("|")[0].lower()
        if w not in cefr_any or v < cefr_any[w]:
            cefr_any[w] = v
    missing_a1 = [w for w in cefr_a1 if w not in taken and w not in later]
    unexplained = []
    grouped = {}
    for w in missing_a1:
        if w in forms or w in ANCHOR_INFLECTED:
            grouped.setdefault("form", []).append(w)
        elif w in multi:
            grouped.setdefault("multi", []).append(w)
        elif w in reasons:
            grouped.setdefault(reasons[w], []).append(w)
        else:
            unexplained.append(w)
    stale = sorted(w for w in reasons if w not in missing_a1)
    if unexplained:
        print("UNEXPLAINED CEFR-J A1:", " ".join(unexplained))
        raise SystemExit(f"{len(unexplained)} CEFR-J A1 lemma(s) lack a reason in anchors-left-out.txt")
    if stale:
        raise SystemExit("anchors-left-out.txt lists words that are taken or not CEFR-J A1: " + " ".join(stale))
    ngsl_missing = [w for w in ngsl1 if w not in taken and w not in later and w not in cefr_a1]
    return {"cefrA1": cefr_a1, "ngsl1": ngsl1, "grouped": grouped, "legend": legend, "ngslMissing": ngsl_missing, "cefrLevel": cefr_any, "taken": taken, "later": later}


def review(a1, a2, stats, rep):
    rows = a1 + a2
    pos = {}
    for r in a1:
        pos[POS[r["kind"]]] = pos.get(POS[r["kind"]], 0) + 1
    covered_c = sum(1 for w in rep["cefrA1"] if w in rep["taken"] or w in rep["later"])
    covered_n = sum(1 for w in rep["ngsl1"] if w in rep["taken"] or w in rep["later"])
    legend = dict(rep["legend"], form="inflected form or variant of a chosen headword", multi="taught inside a chosen expression")
    lines = [
        "# en lexicon — authoring review sheet (generated by content/en/_drafts/_generators/en-lex.py)",
        "",
        f"Hand-chosen lexicon for en-vi: {len(a1)} A1 lemmas and {len(a2)} A2-1 lemmas (core-*.txt). It replaces the output of `scripts/lexicon-author.ts --lang en --size 900`; do not re-run that script over it.",
        "",
        "A human still has to check:",
        "",
        "- **Vietnamese text.** Every gloss and example translation was written by an AI agent and awaits native review. There are no `TODO:vi` markers.",
        "- **IPA.** Licensed General American values ship; every difference from the hand-written column and every word with no licensed value is in `content/en/_drafts/review/ipa-diff.json`, for the D-10 language pass.",
        "- **Unit mapping.** `topic-units.json` is authored in `TOPIC_UNITS` above; `syllabus.json` is derived from it and the unit word lists by `content/en/_drafts/_generators/en-pipeline.sh`.",
        "",
        "## Counts",
        "",
        "- A1 by part of speech: " + ", ".join(f"{k} {v}" for k, v in sorted(pos.items())),
        f"- IPA: kaikki-en {stats['kaikki-en']} ({', '.join(f'{k} {v}' for k, v in sorted(stats['byMethod'].items()))}); {AUTHORED_IPA} {stats[AUTHORED_IPA]}, no licensed value. Against the hand-written column: identical {len(stats['exact'])}, notation only {len(stats['notationOnly'])}, mismatch {len(stats['mismatches'])}.",
        f"- Examples: {sum(len(r['examples']) for r in rows)}, all original (`original-lexicon-etl`, key `add`); no Tatoeba sentence is used. Each is at most 12 words and uses only words of its band, checked by en-lex.py.",
        f"- Irregular forms are in `noun-plurals.json` and `irregular-forms.json`: the lexeme schema has no field for them, as in Italian.",
        "",
        "## Anchor coverage",
        "",
        f"- CEFR-J A1: {covered_c} of {len(rep['cefrA1'])} lemmas taken. NGSL first 1000: {covered_n} of {len(rep['ngsl1'])} lemmas taken.",
        "",
        "### CEFR-J A1 lemmas left out, by reason",
        "",
    ]
    for code in sorted(rep["grouped"]):
        words = rep["grouped"][code]
        lines += [f"**{legend[code]}** ({len(words)}): " + ", ".join(words), ""]
    lines += [
        f"### NGSL first 1000 lemmas left out that CEFR-J does not place at A1 ({len(rep['ngslMissing'])})",
        "",
        "Frequency-only candidates, mostly abstract or academic. CEFR-J level in brackets where listed.",
        "",
        ", ".join(f"{w} [{rep['cefrLevel'][w]}]" if w in rep["cefrLevel"] else w for w in rep["ngslMissing"]),
        "",
    ]
    return "\n".join(lines)


def forms_docs(rows):
    plurals, verbs, adjectives = {}, {}, {}
    for r in rows:
        f = r["forms"]
        if not f:
            continue
        if r["kind"] == "N":
            plurals[r["id"]] = "—" if f == "-" else f
        elif r["kind"] == "V":
            past, part = f.split("/")
            verbs[r["id"]] = {"past": past, "participle": part}
        elif r["kind"] in ("A", "D"):
            comp, sup = f.split("/")
            adjectives[r["id"]] = {"comparative": comp, "superlative": sup}
        else:
            raise SystemExit(f"{r['lemma']}: forms on a {POS[r['kind']]}")
    return plurals, verbs, adjectives


def main():
    root = sys.argv[1]
    mode = sys.argv[2] if len(sys.argv) > 2 else "all"
    a1, a2, ids, lexemes, stats = build(root)
    if mode == "split":
        path = "content/en/lexicon/syllabus.json"
        syl = json.load(open(f"{root}/{path}", encoding="utf-8"))
        later_ids = {r["id"] for r in a2}
        later = [e for e in syl["entries"] if e["lexemeId"] in later_ids]
        syl["entries"] = [e for e in syl["entries"] if e["lexemeId"] not in later_ids]
        syl["derivation"] = DERIVATION
        write_json(root, path, syl)
        write_json(root, "content/en/lexicon/syllabus-a2-1.json", {"version": 1, "language": "en", "level": "A2-1", "minLexemes": 0, "derivation": "words the first A2 stories add beyond the A1 syllabus", "entries": later})
        print("A1", len(syl["entries"]), "A2-1", len(later))
        return
    rep = anchors_report(root, a1, a2)
    write_json(root, "content/en/lexicon/lexemes.json", {"version": 1, "language": "en", "lexemes": lexemes})
    write_json(root, "content/en/lexemes.json", {TITLE_SURFACE.get(r["lemma"], r["lemma"]): r["id"] for r in a1 + a2})
    write_json(root, "content/en/lexicon/syllabus.json", {"version": 1, "language": "en", "level": "A1", "minLexemes": 600, "derivation": DERIVATION, "entries": syllabus_entries(a1)})
    write_json(root, "content/en/lexicon/syllabus-a2-1.json", {"version": 1, "language": "en", "level": "A2-1", "minLexemes": 0, "derivation": "words the first A2 stories add beyond the A1 syllabus", "entries": syllabus_entries(a2)})
    topics = {r["topic"] for r in a1 + a2}
    poses = {POS[r["kind"]] for r in a1 + a2}
    units = {k: f"en-vi:unit-{v}" for k, v in TOPIC_UNITS.items() if k.split(":")[0] in topics and (":" not in k or k.split(":")[1] in poses)}
    write_json(root, "content/en/lexicon/topic-units.json", {"version": 1, "language": "en", "courseId": "en-vi", "note": "Authored topic → unit map of the en-vi syllabus: where a lexeme no lesson teaches first belongs. Keys are topic:partOfSpeech before topic.", "units": units})
    plurals, verbs, adjectives = forms_docs(a1 + a2)
    write_json(root, "content/en/lexicon/noun-plurals.json", {"version": 1, "language": "en", "note": "Irregular plurals of the nouns in the English lexicon, authored with the curated lists in content/en/_drafts/_generators; — = uncountable or no plural in everyday use; any other noun takes -s/-es/-ies.", "plurals": dict(sorted(plurals.items()))})
    write_json(root, "content/en/lexicon/irregular-forms.json", {"version": 1, "language": "en", "note": "Irregular past and participle of verbs, irregular comparative and superlative, authored with the curated lists in content/en/_drafts/_generators.", "verbs": dict(sorted(verbs.items())), "adjectives": dict(sorted(adjectives.items()))})
    with open(f"{root}/content/en/lexicon/REVIEW.md", "w", encoding="utf-8", newline="\n") as f:
        f.write(review(a1, a2, stats, rep))
    os.makedirs(f"{root}/content/en/_drafts/review", exist_ok=True)
    write_json(root, "content/en/_drafts/review/ipa-diff.json", {
        "generator": "content/en/_drafts/_generators/en-lex.py",
        "note": "Licensed General American IPA against the hand-written column of core-*.txt. mismatches: different sounds or stress, for the D-10 language pass. notationOnly: the same sounds written differently (r/ɹ, g/ɡ, length, syllable dots). noLicensedValue: ships the hand-written string, source original-english-course, to review.",
        "counts": {"lexemes": len(a1) + len(a2), "kaikki-en": stats["kaikki-en"], "byMethod": dict(sorted(stats["byMethod"].items())), AUTHORED_IPA: stats[AUTHORED_IPA], "identical": len(stats["exact"]), "notationOnly": len(stats["notationOnly"]), "mismatches": len(stats["mismatches"])},
        "mismatches": stats["mismatches"], "notationOnly": stats["notationOnly"], "noLicensedValue": stats["noLicensedValue"]})
    print("A1", len(a1), "A2-1", len(a2), "ipa", {k: (len(v) if isinstance(v, list) else v) for k, v in stats.items()})


main()
