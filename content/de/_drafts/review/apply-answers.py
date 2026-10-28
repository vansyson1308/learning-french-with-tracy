"""D-10 AI review, de-vi answer keys: apply the reviewer findings (de-vi-answers.jsonl) to the course
pack and its mirrored sources (writing tasks, speech items, scenarios), and record what happened to
each one (decisions-answers.json).

The German grader now folds ss/ß and accepts ae/oe/ue for ä/ö/ü in typed answers and rubric slots,
and spells digits 0–100 in spoken/written answers (src/lib/languages/de.ts). A proposed alternative
that those folds already accept is not added; the finding is then "fixed by the engine".
Run once on a clean tree (git checkout the content files first to re-run).
usage: python -I apply-answers.py"""
import json, pathlib, re, unicodedata

R = pathlib.Path(r"C:\src\lft-air")
F = R / "content/de/_drafts/review/de-vi-answers.jsonl"
P = R / "content/courses/de-vi.json"
W = R / "content/de/writing/tasks.json"
S = R / "content/de/speech/items.json"
X = R / "content/de/interaction/scenarios.json"


def load(p):
    return json.loads(p.read_text(encoding="utf-8"))


def save(p, d):
    p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")


findings = [json.loads(l) for l in F.read_text(encoding="utf-8").splitlines() if l.strip() and not json.loads(l).get("summary")]
pack, writing, speech, scen = load(P), load(W), load(S), load(X)
ex = {e["id"]: e for s in pack["sections"] for u in s["units"] for l in u["lessons"] for e in l["exercises"]}
tasks = {t["id"]: t for t in writing["tasks"]}
items = {i["id"]: i for i in speech["items"]}
scenarios = {s["id"]: s for s in scen["scenarios"]}
decisions = {}


# --- Python replica of the German typed folds (src/lib/languages/de.ts) ---------------------------
def lenient(t):
    t = re.sub(r"[\u2018\u2019\u02bc]", "'", t)
    t = unicodedata.normalize("NFD", t.lower())
    t = re.sub(r"[\u0300-\u036f]", "", t)
    t = re.sub(r"[.,!?\u00bf\u00a1;:\"'\u00ab\u00bb\u201c\u201d\u2026]", "", t)
    return re.sub(r"\s+", " ", t).strip().replace("ß", "ss")


def translit(t):
    return lenient(unicodedata.normalize("NFC", t.lower()).replace("ä", "ae").replace("ö", "oe").replace("ü", "ue"))


def accepted(a, keys):
    return any(lenient(a) == lenient(k) or translit(a) == translit(k) for k in keys)


def add_typed(eid, proposals):
    """typeAnswer alternatives: add what the engine does not already accept; return (added, engine)."""
    e = ex[eid]
    added, engine = [], []
    for a in proposals:
        if accepted(a, [e["answer"], *e["alternatives"]]):
            engine.append(a)
        else:
            e["alternatives"].append(a)
            added.append(a)
    return added, engine


def typed_decision(added, engine, note=""):
    if not added and engine:
        return "fixed by the engine: ss/ß and ae/oe/ue spellings are folded by the German grader (" + "; ".join(engine) + ")" + note
    out = "fixed: added " + "; ".join(added)
    if engine:
        out += "; already accepted by the engine fold: " + "; ".join(engine)
    return out + note


def add_bank(eid, alts):
    """wordBank alternatives, as tile strings (the proposal's case is matched to the tiles)."""
    e = ex[eid]
    tiles = e["tokens"]
    cur = e.setdefault("alternatives", [])
    for alt in alts:
        seq = []
        for tok in alt:
            tile = tok if tok in tiles else next(t for t in tiles if t.lower() == tok.lower())
            seq.append(tile)
        if seq != e["answer"] and seq not in cur:
            cur.append(seq)
    return "fixed: word-bank alternative " + " | ".join(" ".join(s) for s in cur)


def spoken_key(t):
    return re.sub(r"\s+", " ", re.sub(r"[.,!?;:'\u2019]", " ", t.lower())).strip()


def add_variants(eid, variants):
    """Speech acceptedVariants: the pack exercise and its speech item stay identical."""
    e = ex[eid]
    cur = e["acceptedVariants"]
    assert items[e["speechItemId"]]["acceptedVariants"] == cur, eid
    added = []
    for v in variants:
        if all(spoken_key(v) != spoken_key(c) for c in cur):
            cur.append(v)
            added.append(v)
    items[e["speechItemId"]]["acceptedVariants"] = list(cur)
    return added


def slot(eid, slot_id):
    """The rubric slot in the pack exercise and in its writing task (same rubric, both sources)."""
    e = ex[eid]
    t = tasks[e["writingTaskId"]]
    a = next(s for s in e["rubric"]["requiredSlots"] if s["id"] == slot_id)
    b = next(s for s in t["rubric"]["requiredSlots"] if s["id"] == slot_id)
    assert a["variants"] == b["variants"], (eid, slot_id)
    return a, b


def set_variants(eid, slot_id, variants):
    a, b = slot(eid, slot_id)
    a["variants"] = list(variants)
    b["variants"] = list(variants)


def add_slot_variants(eid, slot_id, variants):
    a, _ = slot(eid, slot_id)
    new = [v for v in variants if all(lenient(v) != lenient(c) for c in a["variants"])]
    set_variants(eid, slot_id, a["variants"] + new)
    return new


def option(eid, index, old, new, key="options"):
    e = ex[eid]
    cur = e[key][index]
    if isinstance(cur, dict):
        assert cur["text"] == old, (eid, cur)
        cur["text"] = new
    else:
        assert cur == old, (eid, cur)
        e[key][index] = new


# --- Engine findings -------------------------------------------------------------------------------
decisions["de-ak-1"] = "fixed by the engine: src/lib/languages/de.ts spells digits 0–100 in German (spellDigits/numberToWords) and reads ASR clock/price formats (8:15 Uhr, 3,50 €) for spoken and written grading"
decisions["de-ak-19"] = "fixed by the engine: German normalizeLenient folds ß → ss and a second lenient form accepts ae/oe/ue for ä/ö/ü (typed answers, word banks; rubric slots get the ß fold); dictation and conjugationCloze stay strict"

# --- Dictation: two-line clips are keyed with the full transcript --------------------------------
e = ex["de-vi:ui-l1-e4"]; e["answer"] = "Wann kommt der Zug? Um zehn Uhr."; e["alternatives"] = ["Wann kommt der Zug? Um 10 Uhr."]
decisions["de-ak-2"] = "fixed: keyed with the full transcript of the two-line clip (\"Um 10 Uhr\" also accepted); the clip and its audio stay as they are, like every other dictation, which keys its whole clip"
e = ex["de-vi:ui-l3-e3"]; e["answer"] = "Entschuldigung, wie spät ist es? Es ist halb drei."; e["alternatives"] = []
decisions["de-ak-3"] = "fixed: keyed with the full transcript of the two-line clip; the clip and its audio stay as they are"

# --- Wrong key / second correct option -------------------------------------------------------------
e = ex["de-vi:us-l3-e4"]; e["answer"] = "Meine Freundin heißt Lea."; e["audioTarget"] = "Meine Freundin heißt Lea."; e["alternatives"] = ["Eine Freundin von mir heißt Lea."]
decisions["de-ak-4"] = "fixed: key and audioTarget \"Meine Freundin heißt Lea.\"; \"Eine Freundin von mir heißt Lea.\" accepted; the masculine form dropped; \"heisst\" by the engine (new audioTarget needs the de audio run)"
option("de-vi:ua-l3-e0", 3, "die", "dem"); decisions["de-ak-5"] = "fixed: distractor \"die\" → \"dem\" (the plural \"die Schlüssel\" was also correct)"
option("de-vi:ut-l3-e3", 2, "macht", "kauft"); decisions["de-ak-6"] = "fixed: distractor \"macht\" → \"kauft\""
option("de-vi:ua-l1-e5", 0, "điện thoại", "chìa khóa"); decisions["de-ak-7"] = "fixed: distractor \"điện thoại\" → \"chìa khóa\""
option("de-vi:uc-l3-e5", 0, "điện thoại", "chìa khóa"); decisions["de-ak-8"] = "fixed: distractor \"điện thoại\" → \"chìa khóa\""
option("de-vi:ua-l1-e6", 0, "das Handy", "die Uhr"); decisions["de-ak-9"] = "fixed: distractor \"das Handy\" → \"die Uhr\" (the proposed \"der Schlüssel\" is already another option)"

# --- Word banks -------------------------------------------------------------------------------------
for f in findings:
    if f["field"] == "alternatives" and ex.get(f["exerciseId"], {}).get("type") == "wordBank":
        decisions[f["id"]] = add_bank(f["exerciseId"], json.loads(f["proposed"]))

# --- Typed alternatives -----------------------------------------------------------------------------
KEPT = {
    "de-ak-54": "the course renders bạn as du and ông/bà as Sie throughout (us-l2-e4 \"Ông/bà tên là gì?\" = \"Wie heißen Sie?\"); accepting Sie for \"Bạn ăn…\" would blur the distinction it teaches",
}
for f in findings:
    fid, eid = f["id"], f["exerciseId"]
    if fid in decisions or f["field"] != "alternatives" or ex.get(eid, {}).get("type") != "typeAnswer":
        continue
    if fid in KEPT:
        decisions[fid] = "kept: " + KEPT[fid]
        continue
    proposals = json.loads(f["proposed"])
    if fid == "de-ak-55":
        added, engine = add_typed(eid, ["Du bist früh da."])
        decisions[fid] = "fixed: added \"Du bist früh da.\"; the Sie form is not added — the course renders bạn as du and ông/bà as Sie"
        continue
    added, engine = add_typed(eid, proposals)
    decisions[fid] = typed_decision(added, engine)

# --- Rubric slots (pack exercise + content/de/writing/tasks.json) ----------------------------------
new = add_slot_variants("de-vi:up-l2-e0", "city", ["wohnt in köln", "lebt in köln"])
decisions["de-ak-18"] = "fixed: city slot accepts " + ", ".join(new) + " (pack and writing task)"
new = add_slot_variants("de-vi:ur-l2-e0", "closing", ["beste grüße"])
decisions["de-ak-26"] = "fixed: closing slot accepts " + ", ".join(new) + "; the ss spellings (Grüsse) by the engine (rubric normalisation folds ß → ss)"
new = add_slot_variants("de-vi:uq-l2-e0", "closing", ["tschüs", "bis später"])
decisions["de-ak-27"] = "fixed: closing slot accepts " + ", ".join(new) + "; the ss spellings by the engine"
new = add_slot_variants("de-vi:uq-l3-e0", "closing", ["tschüs", "bis samstag"])
decisions["de-ak-28"] = "fixed: closing slot accepts " + ", ".join(new) + "; the ss spellings by the engine"
new = add_slot_variants("de-vi:up-l0-e1", "like", ["ich spiele sehr gern fußball", "fußball spiele ich gern", "ich spiele fußball gern"])
decisions["de-ak-78"] = "fixed: like slot accepts " + ", ".join(new) + "; fussball by the engine"
set_variants("de-vi:up-l3-e0", "cat", ["katze ist klein", "katze ist sehr klein", "kleine katze"])
set_variants("de-vi:up-l3-e0", "house", ["haus ist groß", "haus ist sehr groß", "großes haus"])
decisions["de-ak-79"] = "fixed: cat slot katze ist (sehr) klein / kleine katze; house slot haus ist (sehr) groß / großes haus; the hand-added \"das haus ist gross\" is dropped because \"haus ist groß\" folds to the same run (ß → ss)"
new = add_slot_variants("de-vi:uo-l2-e1", "city", ["in hamburg"])
decisions["de-ak-80"] = "fixed: city slot accepts " + ", ".join(new) + " (the verb is checked by requireSentenceVerbs)"
new = add_slot_variants("de-vi:uq-l0-e0", "time", ["um 15"])
decisions["de-ak-81"] = "fixed: time slot accepts " + ", ".join(new) + "; \"um 15:00 Uhr\" also matches \"um 15 uhr\" by the engine (HH:MM Uhr is read as H Uhr, digits spelt), and \"um fünfzehn uhr\" ≡ \"um 15 uhr\""

# --- Speech acceptedVariants (pack exercise + content/de/speech/items.json) ------------------------
added = add_variants("de-vi:uk-l0-e2", ["Hallo", "Guten Tag", "Moin", "Grüß Gott", "Servus"])
decisions["de-ak-69"] = "fixed: accepted " + ", ".join(added) + " (regional greetings per VARIETY.md; speech item synced)"
added = add_variants("de-vi:uk-l1-e0", ["Dankeschön"])
decisions["de-ak-70"] = "fixed: accepted " + ", ".join(added) + " (speech item synced)"
added = add_variants("de-vi:uk-l1-e2", ["Dankeschön", "Danke sehr", "Danke, sehr nett"])
decisions["de-ak-71"] = "fixed: accepted " + ", ".join(added) + " (speech item synced)"
added = add_variants("de-vi:uk-l2-e3", ["Tschüs", "Ciao", "Bis dann", "Bis später", "Mach's gut", "Servus"])
decisions["de-ak-72"] = "fixed: accepted " + ", ".join(added) + " (speech item synced)"
added = add_variants("de-vi:uk-l3-e1", ["Entschuldigen Sie bitte", "Verzeihung", "Oh, Verzeihung", "Tut mir leid", "Sorry"])
decisions["de-ak-73"] = "fixed: accepted " + ", ".join(added) + " (speech item synced)"
added = add_variants("de-vi:ul-l2-e0", ["Ich spreche Deutsch und Vietnamesisch", "Vietnamesisch und Deutsch", "Ich spreche Vietnamesisch und etwas Deutsch"])
decisions["de-ak-74"] = "fixed: accepted " + ", ".join(added) + " (speech item synced)"
added = add_variants("de-vi:ul-l2-e1", ["Ich mag Kaffee", "Ich trinke sehr gern Kaffee"])
decisions["de-ak-75"] = "fixed: accepted " + ", ".join(added) + " (speech item synced)"
added = add_variants("de-vi:um-l1-e1", ["Drei Euro, bitte", "Das macht drei Euro", "Der kostet drei Euro"])
decisions["de-ak-76"] = "fixed: accepted " + ", ".join(added) + "; \"3 €\"/\"3 Euro\" from the recognizer by the engine (speech item synced)"
added = add_variants("de-vi:um-l2-e0", ["Es ist acht"])
decisions["de-ak-77"] = "fixed: accepted " + ", ".join(added) + "; the digit forms (Es ist 8 Uhr, 8 Uhr) by the engine's German number speller, so they are not listed (speech item synced)"

# --- Options, prompts, translations -----------------------------------------------------------------
option("de-vi:ue-l1-e3", 1, "ue", "a"); decisions["de-ak-82"] = "fixed: distractor \"ue\" → \"a\" (typed answers now accept ue for ü)"
option("de-vi:ue-l1-e4", 2, "oe", "a"); decisions["de-ak-83"] = "fixed: distractor \"oe\" → \"a\" (typed answers now accept oe for ö)"
e = ex["de-vi:uu-l0-e3"]
option("de-vi:uu-l0-e3", 3, "Wo", "Wie")
e["audioTarget"] = "Wie ist der Weg zum Bahnhof?"; e["translation"] = "Đi đến nhà ga thế nào?"
decisions["de-ak-84"] = "fixed: key \"Wie\" (\"Wie ist der Weg zum Bahnhof?\", the phrase u4-l3-e3 teaches); \"Wo\" is removed rather than kept as a distractor so no second arguable answer remains; audioTarget and translation follow (same sentence as u4-l3-e3)"
option("de-vi:ue-l0-e0", 0, "ss", "sch"); decisions["de-ak-85"] = "fixed: distractor \"ss\" → \"sch\", so the Swiss spelling is never marked wrong (VARIETY.md); the item still teaches ß after a long vowel"
e = ex["de-vi:uo-l1-e4"]; e["prompt"] = "Viết bằng tiếng Đức: Tôi 40 tuổi."
decisions["de-ak-86"] = "fixed: prompt \"Viết bằng tiếng Đức: Tôi 40 tuổi.\""
option("de-vi:um-l2-e4", 3, "Acht", "achtzehn"); decisions["de-ak-87"] = "fixed: distractor \"Acht\" → \"achtzehn\""
ex["de-vi:u4-l3-e3"]["translation"] = "Đi đến nhà ga thế nào?"; decisions["de-ak-89"] = "fixed: translation \"Đi đến nhà ga thế nào?\""

# --- Scenario concept list ---------------------------------------------------------------------------
sc = scenarios["de.scenario.hallo_wie_gehts"]
for node in ("l1", "l1b"):
    for exp in sc["nodes"][node]["expected"]:
        if exp["intent"] != "say_bye":
            continue
        concepts = exp["requiredConcepts"][0]
        for c in ["tschüs", "bis später", "servus"]:
            if c not in concepts:
                concepts.append(c)
decisions["de-ak-90"] = "fixed: say_bye concepts accept tschüs, bis später, servus (nodes l1 and l1b)"

save(P, pack); save(W, writing); save(S, speech); save(X, scen)
missing = [f["id"] for f in findings if f["id"] not in decisions]
order = {f["id"]: i for i, f in enumerate(findings)}
out = {k: decisions[k] for k in sorted(decisions, key=lambda k: order[k])}
(R / "content/de/_drafts/review/decisions-answers.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
print("decided", len(decisions), "of", len(findings), "undecided:", missing)
