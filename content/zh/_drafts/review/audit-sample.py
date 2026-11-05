"""D-10 independent audit for zh-vi: a seeded random sample (>= 10 %) of the exercise/answer-key lines and of the
language lines that NO review pass named (findings-answers.json, findings-language.json, findings-answers2.json),
plus 10 "fixed" P0/P1 decisions drawn across the three decision files.
usage: python -I -X utf8 audit-sample.py <repo root> <out dir>

Content is the promoted layer: content/courses/zh-vi.json and content/zh/** (byte-identical to content/zh/_drafts/pack.json
and the staged layer after `author.ts promote`, commit d5070ff4).

Population (one "line" = one unit a reviewer judges):
  exercises: every lesson exercise (976), checkpoint item (115), placement item (22), HSK 1/2 item (200), speech item (52),
             writing task (35), scored learner node of a scenario (42) and story question (126).
  language:  story sentences (<story>#<i>, 0-based) and blurbs; reading blocks (<reading>#<i>); clips (one line per clip,
             all segments); scenario title+goal; lexemes (vi gloss + example with its vi translation); concept cards
             (rule, explanation, exceptions, memory hint, each example); unit descriptions, word lists and guidebook lines
             (one per non-empty line); primer intro, section explanations, items (tones/contrasts/rules/strokes), notes
             and checkpoint items; Han-Viet entries.
Exclusion ("named"): every id token found in a finding's `id` or `alsoAffects` of the three findings files:
  exercise ids, lesson ids (all their exercises), item ids (speech/writing/scenario/cpi/pli/exi), lesson exercises and
  checkpoint/placement items whose speechItemId / writingTaskId / scenarioId is named, every node and clip of a named
  scenario, every line of a named reading, concept card, unit (guidebook/words/description), primer section, lexeme
  (by id or surface), Han-Viet entry, story ranges (#a-#b, title) and, for a bare story id, that story's questions+blurb.
Sampling: ids sorted, random.Random(SEED).sample(pop, ceil(10 % of pop)) for exercises, then language, then 10 fixes
  from the pool of decisions (all three files) with severity P0/P1 and decision starting 'fixed', sorted by (file, id).
"""
import json, math, random, re, sys
from collections import Counter

root, out = sys.argv[1], sys.argv[2]
SEED = 20261105
rng = random.Random(SEED)
C = f"{root}/content/"
RV = f"{root}/content/zh/_drafts/review/"


def L(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


fa1 = L(RV + "findings-answers.json")["findings"]
fla = [x for x in L(RV + "findings-language.json") if x.get("id") != "_summary"]
fa2 = L(RV + "findings-answers2.json")["findings"]
raw = []
for x in fa1 + fla + fa2:
    raw.append(x["id"])
    raw.extend(x.get("alsoAffects") or [])

N_EX, N_LESSON, N_ITEM, N_LEX, N_LEXS, N_CONCEPT, N_UNIT, N_PRIMER, N_HV = (set() for _ in range(9))
N_STORYLINE, N_STORYQ = set(), set()
for s in raw:
    for m in re.finditer(r"\b(u[0-9a-z]-l\d+)(-e\d+)?\b", s):
        (N_EX.add("zh-vi:" + m.group(1) + m.group(2)) if m.group(2) else N_LESSON.add("zh-vi:" + m.group(1)))
    for m in re.finditer(r"unit-([0-9a-z])\b", s):
        N_UNIT.add("zh-vi:unit-" + m.group(1))
    for m in re.finditer(r"zh\.(?:speak|write|scenario|read|clip|cpi|pli|exi)\.[a-z0-9_]+(?:\.[a-z0-9_]+)?", s):
        N_ITEM.add(m.group(0))
    for m in re.finditer(r"zh:w:[a-z0-9-]+", s):
        N_LEX.add(m.group(0))
    for m in re.finditer(r"zh-vi:([\u4e00-\u9fff]+)", s):
        N_LEXS.add(m.group(1))
    for m in re.finditer(r"\(([\u4e00-\u9fff]+)\)", s):
        N_LEXS.add(m.group(1))
    for m in re.finditer(r"zh:concept:[a-z0-9-]+", s):
        N_CONCEPT.add(m.group(0))
    if s.startswith("zh.primer.script"):
        N_PRIMER.add(s.split(" ")[1].split(".")[0])
    for m in re.finditer(r"hanviet:zh:(\S+)", s):
        N_HV.add(m.group(1))
    m = re.match(r"(zh\.story\.[a-z0-9_]+)(.*)$", s)
    if m:
        sid, rest = m.group(1), m.group(2)
        rng_m = re.findall(r"#(\d+)(?:\s*[-\u2013]\s*#?(\d+))?", rest)
        if not rest.strip():
            N_STORYQ.add(sid)
            N_STORYLINE.add(sid + ".blurb")
        for a, b in rng_m:
            for i in range(int(a), int(b or a) + 1):
                N_STORYLINE.add(f"{sid}#{i}")
        if "title" in rest:
            N_STORYLINE.add(sid + ".blurb")

course = L(C + "courses/zh-vi.json")
cps = L(C + "zh/assessment/checkpoints.json")["checkpoints"]
plc = L(C + "zh/assessment/placement.json")["stages"]
hsk = L(C + "zh/exam/hsk-1.json")["items"] + L(C + "zh/exam/hsk-2.json")["items"]
stories = L(C + "zh/stories/stories.json")["stories"]
readings = {r["id"]: r for r in L(C + "zh/reception/reading.json")["readings"]}
clips = {c["id"]: c for c in L(C + "zh/reception/listening.json")["clips"]}
scen = {s["id"]: s for s in L(C + "zh/interaction/scenarios.json")["scenarios"]}
speech = {s["id"]: s for s in L(C + "zh/speech/items.json")["items"]}
writing = {w["id"]: w for w in L(C + "zh/writing/tasks.json")["tasks"]}
lex = L(C + "zh/lexicon/lexemes.json")["lexemes"]
concepts = L(C + "zh/pedagogy/concepts.json")["concepts"]
primer = L(C + "zh/primer/script-primer.json")
hanviet = L(C + "hanviet/zh.json")["entries"]

scen_clips = {}
for sid, s in scen.items():
    for n in s["nodes"].values():
        for k in ("clipId", "rephraseClipId"):
            if n.get(k):
                scen_clips[n[k]] = sid


def J(o):
    return json.dumps(o, ensure_ascii=False)


def clip_text(cid):
    c = clips.get(cid)
    return f"<clip {cid} missing>" if not c else " / ".join(f"[{s.get('speaker', '')}] {s['text']}" for s in c["segments"])


def reading_text(rid):
    r = readings.get(rid)
    if not r:
        return f"<reading {rid} missing>"
    return f"TITLE {r.get('title')} | " + " | ".join(b["text"] for b in r["blocks"]) + (
        " | GLOSS " + J(r["supportGlossary"]) if r.get("supportGlossary") else "")


def ctx(e):
    x = []
    if e.get("clipId"):
        x.append("CLIP: " + clip_text(e["clipId"]))
    if e.get("readingId"):
        x.append("READING: " + reading_text(e["readingId"]))
    if e.get("speechItemId") in speech:
        x.append("SPEECH: " + J(speech[e["speechItemId"]]))
    if e.get("writingTaskId") in writing:
        x.append("WRITING: " + J(writing[e["writingTaskId"]]))
    if e.get("scenarioId"):
        x.append("SCENARIO: (scored in the scenario lines)")
    return x


def ex_named(iid, e, lesson=None):
    refs = {e.get("speechItemId"), e.get("writingTaskId"), e.get("scenarioId")} - {None}
    return iid in N_EX or iid in N_ITEM or e.get("id") in N_EX or lesson in N_LESSON or bool(refs & N_ITEM)


ex_pop, ex_total = {}, Counter()
for sec in course["sections"]:
    for u in sec["units"]:
        for l in u["lessons"]:
            for e in l["exercises"]:
                ex_total["lesson"] += 1
                if not ex_named(e["id"], e, l["id"]):
                    ex_pop[e["id"]] = ("lesson", e, ctx(e))
for cp in cps:
    for it in cp["items"]:
        ex_total["checkpoint"] += 1
        if not ex_named(it["id"], it["exercise"]):
            ex_pop[it["id"]] = ("checkpoint", it["exercise"], ctx(it["exercise"]))
for st in plc:
    for cl in st["clusters"]:
        for it in cl["items"]:
            ex_total["placement"] += 1
            if not ex_named(it["id"], it["exercise"]):
                ex_pop[it["id"]] = ("placement", it["exercise"], ctx(it["exercise"]))
for it in hsk:
    ex_total["hsk"] += 1
    if not ex_named(it["id"], it["exercise"]):
        ex_pop[it["id"]] = ("hsk", it["exercise"], ctx(it["exercise"]))
for sid, s in speech.items():
    ex_total["speech"] += 1
    if sid not in N_ITEM:
        ex_pop[sid] = ("speech", s, [])
for wid, w in writing.items():
    ex_total["writing"] += 1
    if wid not in N_ITEM:
        ex_pop[wid] = ("writing", w, [])
for sid, s in scen.items():
    for nid, n in s["nodes"].items():
        if n["kind"] == "learner" and n.get("scored"):
            ex_total["scenario"] += 1
            if sid not in N_ITEM:
                prev = [p for p in s["nodes"].values() if p.get("next") == nid and p["kind"] == "partner"]
                ex_pop[f"{sid}/{nid}"] = ("scenario", n, [f"GOAL: {s['goal']['vi']}", "PARTNER: " + (prev[0]["text"] if prev else "")])
for s in stories:
    for qi, q in enumerate(s["questions"]):
        ex_total["storyQuestion"] += 1
        if s["id"] not in N_STORYQ:
            text = " ".join(f"{i}[{se['speaker']}]{se['text']}({se['translation']['vi']})" for i, se in enumerate(s["sentences"]))
            ex_pop[f"{s['id']}?q{qi}"] = ("storyQuestion", q, ["STORY: " + text])

lang, lang_total = {}, Counter()


def add(cat, lid, text, excluded):
    lang_total[cat] += 1
    if not excluded:
        lang[lid] = (cat, text)


for s in stories:
    add("story", s["id"] + ".blurb", f"{s['title']} | {s['blurb']['vi']}", s["id"] + ".blurb" in N_STORYLINE)
    for i, se in enumerate(s["sentences"]):
        prev = s["sentences"][i - 1]["text"] if i else ""
        nxt = s["sentences"][i + 1]["text"] if i + 1 < len(s["sentences"]) else ""
        add("story", f"{s['id']}#{i}", f"[{se['speaker']}] {se['text']} || {se['translation']['vi']}    (prev: {prev} | next: {nxt}) band {s['band']}",
            f"{s['id']}#{i}" in N_STORYLINE)
for rid, r in readings.items():
    for i, b in enumerate(r["blocks"]):
        add("reading", f"{rid}#{i}", b["text"] + f"   (title {r.get('title')}; prev: {r['blocks'][i - 1]['text'] if i else ''})", rid in N_ITEM)
for cid, c in clips.items():
    sc = scen_clips.get(cid)
    add("clip", cid, clip_text(cid) + (f"  (scenario {sc})" if sc else ""), cid in N_ITEM or (sc in N_ITEM if sc else False))
for sid, s in scen.items():
    add("scenario", sid + ".goal", f"{s['title']['vi']} | {s['goal']['vi']}", sid in N_ITEM)
for x in lex:
    exs = " ; ".join(f"{e['target']} || {e['translations'].get('vi')}" for e in x.get("examples", []))
    add("lexicon", x["id"], f"{x['surface']} ({x['pronunciation']['value']}) {x['partOfSpeech']} = {x['glosses'].get('vi')} | {exs}",
        x["id"] in N_LEX or x["surface"] in N_LEXS)
for c in concepts:
    cid = c["id"]
    ex = cid in N_CONCEPT
    add("concept", cid + ".rule", f"{c['title']['vi']} | {c['shortRule']['vi']}", ex)
    add("concept", cid + ".explanation", c["explanation"]["vi"], ex)
    for k in ("exceptions", "memoryHint"):
        v = c.get(k)
        if v:
            add("concept", f"{cid}.{k}", J(v), ex)
    for i, e in enumerate(c.get("examples", [])):
        add("concept", f"{cid}.ex#{i}", f"{e['target']} || {e['translations']['vi']}" + (f" ({e['note']['vi']})" if e.get("note") else ""), ex)
for sec in course["sections"]:
    for u in sec["units"]:
        ex = u["id"] in N_UNIT
        add("guidebook", u["id"] + ".desc", f"{u['title']} | {u['description']}", ex)
        add("guidebook", u["id"] + ".words", J(u.get("words")), ex)
        for i, ln in enumerate([ln for ln in (u.get("guidebook") or "").split("\n") if ln.strip()]):
            add("guidebook", f"{u['id']}.gb#{i}", ln, ex)
add("primer", "zh.primer.intro", primer["intro"]["vi"], False)
for s in primer["sections"]:
    ex = s["id"] in N_PRIMER
    add("primer", f"zh.primer.{s['id']}.explanation", s["explanation"]["vi"], ex)
    for k in ("tones", "minimalPairs", "contrasts", "rules", "strokes"):
        for i, it in enumerate(s.get(k) or []):
            add("primer", f"zh.primer.{s['id']}.{k}#{i}", J(it), ex)
    for i, nt in enumerate(s.get("notes") or []):
        add("primer", f"zh.primer.{s['id']}.notes#{i}", J(nt), ex)
add("primer", "zh.primer.checkpoint.intro", primer["checkpoint"]["intro"]["vi"], False)
for it in primer["checkpoint"]["items"]:
    add("primer", f"zh.primer.checkpoint.{it['id']}", J(it), False)
for e in hanviet:
    add("hanviet", "hanviet:zh:" + e["word"], J(e), e["word"] in N_HV)

ex_ids, lang_ids = sorted(ex_pop), sorted(lang)
n_ex, n_lang = math.ceil(len(ex_ids) * 0.1), math.ceil(len(lang_ids) * 0.1)
s_ex = rng.sample(ex_ids, n_ex)
s_lang = rng.sample(lang_ids, n_lang)
pool = []
for fn in ("decisions-answers.json", "decisions-language.json", "decisions-answers2.json"):
    for d in L(RV + fn):
        if d.get("severity") in ("P0", "P1") and str(d.get("decision", "")).startswith("fixed"):
            pool.append(dict(d, _file=fn))
pool.sort(key=lambda d: (d["_file"], d["id"], d.get("problem", "")))
fixes = rng.sample(pool, 10)

with open(f"{out}/audit-exercises.txt", "w", encoding="utf-8", newline="\n") as f:
    for i in sorted(s_ex, key=lambda k: (ex_pop[k][0], k)):
        cat, e, extra = ex_pop[i]
        f.write(f"### {i} [{cat}]\n  " + J(e) + "\n")
        for x in extra:
            f.write("    " + x + "\n")
with open(f"{out}/audit-language.txt", "w", encoding="utf-8", newline="\n") as f:
    for i in sorted(s_lang, key=lambda k: (lang[k][0], k)):
        f.write(f"### {i} [{lang[i][0]}]\n  {lang[i][1]}\n")
with open(f"{out}/audit-fixes.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump(fixes, f, ensure_ascii=False, indent=1)

meta = {
    "seed": SEED,
    "method": "python -I -X utf8 audit-sample.py C:/src/lft-zh <out>; random.Random(seed).sample over sorted ids: exercises, then language, then 10 fixes (P0/P1, decision 'fixed*', all three decision files)",
    "exercises": {"lines": sum(ex_total.values()), "linesByCategory": dict(ex_total), "passed": len(ex_ids), "sample": n_ex,
                  "byCategory": dict(Counter(ex_pop[i][0] for i in s_ex)), "populationByCategory": dict(Counter(v[0] for v in ex_pop.values()))},
    "language": {"lines": sum(lang_total.values()), "linesByCategory": dict(lang_total), "passed": len(lang_ids), "sample": n_lang,
                 "byCategory": dict(Counter(lang[i][0] for i in s_lang)), "populationByCategory": dict(Counter(v[0] for v in lang.values()))},
    "fixPool": len(pool),
    "named": {"exercises": len(N_EX), "lessons": sorted(N_LESSON), "items": len(N_ITEM), "units": sorted(N_UNIT), "lexemes": sorted(N_LEX),
              "lexemeSurfaces": sorted(N_LEXS), "concepts": sorted(N_CONCEPT), "primerSections": sorted(N_PRIMER), "hanviet": sorted(N_HV),
              "storyLines": len(N_STORYLINE), "storyQuestionsOf": sorted(N_STORYQ)},
    "sampledIds": {"exercises": sorted(s_ex), "language": sorted(s_lang)},
    "fixesRechecked": [f"{d['_file']}:{d['id']}" for d in fixes],
}
with open(f"{out}/audit-sample.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump(meta, f, ensure_ascii=False, indent=1)
print(json.dumps({k: v for k, v in meta.items() if k not in ("sampledIds",)}, ensure_ascii=False, indent=1))
