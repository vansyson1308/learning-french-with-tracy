"""D-10 independent audit for ja-vi: a seeded random sample (>= 10 %) of the exercise lines and of the language lines
that the first review pass did not name, plus 10 of its fixes (5 answer-key, 5 language).
usage: python -I -X utf8 ja-vi-audit-sample.py <repo root> <out dir>

Population (one "line" = one unit a reviewer judges):
  exercises: every lesson exercise in staged courses/ja-vi.json, every checkpoint item, every placement item, every
             JLPT N5 item. Excluded: ids named in findings-answers.json (id + alsoAffects), exercise ids named in
             findings-language.json, and lesson exercises whose speechItemId / writingTaskId / scenarioId is named.
  language:  story sentences (<story>#<i>, 0-based) and blurbs; reading blocks (<reading>#<i>); clips (one line per
             clip, all segments); scenario goal and learner prompts; lexemes (vi gloss + example with its vi
             translation); concept cards (rule, explanation, each example); unit guidebooks (one line per non-empty
             line) and unit descriptions; primer intro, section explanations/notes and checkpoint items.
             Excluded: exact ids named in findings-language.json; every line of a named reading, concept card, unit
             guidebook or scenario (and that scenario's ix clips); the primer fields the primer findings quote.
Sampling: ids sorted, random.Random(SEED).sample(pop, ceil(10 % of pop)) per category, exercises first.
Fix re-check: 5 from decisions-answers.json with decision starting 'fixed', 5 from decisions-language.json with
severity P0/P1 and decision starting 'fixed', same rng, after the line samples.
"""
import json, math, random, sys

root, out = sys.argv[1], sys.argv[2]
SEED = 20261104
rng = random.Random(SEED)
ST = f"{root}/content/ja/_drafts/staged/content/"
RV = f"{root}/content/ja/_drafts/review/"


def L(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


fa = L(RV + "findings-answers.json")["findings"]
fl = L(RV + "findings-language.json")
named_ans = set()
for x in fa:
    named_ans.add(x["id"])
    for a in x.get("alsoAffects") or []:
        named_ans.add(a.split(" ")[0])
named_lang = {x["id"] for x in fl}
named = named_ans | named_lang

course = L(ST + "courses/ja-vi.json")
cps = L(ST + "ja/assessment/checkpoints.json")
plc = L(ST + "ja/assessment/placement.json")
exam = L(ST + "ja/exam/jlpt-n5.json")
stories = L(ST + "ja/stories/stories.json")["stories"]
readings = {r["id"]: r for r in L(ST + "ja/reception/reading.json")["readings"]}
clips = {c["id"]: c for c in L(ST + "ja/reception/listening.json")["clips"]}
scen = {s["id"]: s for s in L(ST + "ja/interaction/scenarios.json")["scenarios"]}
speech = {s["id"]: s for s in L(ST + "ja/speech/items.json")["items"]}
writing = {w["id"]: w for w in L(ST + "ja/writing/tasks.json")["tasks"]}
lex = L(f"{root}/content/ja/lexicon/lexemes.json")["lexemes"]
concepts = L(ST + "ja/pedagogy/concepts.json")["concepts"]
primer = L(f"{root}/content/ja/primer/script-primer.json")


def clip_text(cid):
    c = clips.get(cid)
    if not c:
        return f"<clip {cid} missing>"
    return " / ".join(f"[{s.get('speaker','')}] {s['text']}" for s in c["segments"])


def reading_text(rid):
    r = readings.get(rid)
    if not r:
        return f"<reading {rid} missing>"
    parts = [f"TITLE {r.get('title')}"]
    for b in r["blocks"]:
        parts.append(json.dumps({k: v for k, v in b.items()}, ensure_ascii=False))
    if r.get("supportGlossary"):
        parts.append("GLOSS " + json.dumps(r["supportGlossary"], ensure_ascii=False))
    return "\n      ".join(parts)


def ctx(e):
    extra = []
    if e.get("clipId"):
        extra.append("CLIP: " + clip_text(e["clipId"]))
    if e.get("readingId"):
        extra.append("READING: " + reading_text(e["readingId"]))
    if e.get("speechItemId") and e["speechItemId"] in speech:
        extra.append("SPEECH: " + json.dumps(speech[e["speechItemId"]], ensure_ascii=False))
    if e.get("writingTaskId") and e["writingTaskId"] in writing:
        extra.append("WRITING: " + json.dumps(writing[e["writingTaskId"]], ensure_ascii=False))
    if e.get("scenarioId"):
        extra.append("SCENARIO: (see scenario lines)")
    return extra


ex_pop = {}


def is_named(iid, e):
    refs = {e.get("speechItemId"), e.get("writingTaskId"), e.get("scenarioId")} - {None}
    return iid in named or e.get("id") in named or bool(refs & named)


for sec in course["sections"]:
    for u in sec["units"]:
        for l in u["lessons"]:
            for e in l["exercises"]:
                if not is_named(e["id"], e):
                    ex_pop[e["id"]] = ("lesson", e)
for cp in cps["checkpoints"]:
    for it in cp["items"]:
        if not is_named(it["id"], it["exercise"]):
            ex_pop[it["id"]] = ("checkpoint", it["exercise"])
for st in plc["stages"]:
    for cl in st["clusters"]:
        for it in cl["items"]:
            if not is_named(it["id"], it["exercise"]):
                ex_pop[it["id"]] = ("placement", it["exercise"])
for it in exam["items"]:
    if not is_named(it["id"], it["exercise"]):
        ex_pop[it["id"]] = ("jlpt", it["exercise"])
ex_total = sum(len(l["exercises"]) for s in course["sections"] for u in s["units"] for l in u["lessons"]) + sum(
    len(c["items"]) for c in cps["checkpoints"]) + sum(len(c["items"]) for s in plc["stages"] for c in s["clusters"]) + len(exam["items"])

lang = {}  # id -> (category, text)
lang_total = 0


def add(cat, lid, text, excluded):
    global lang_total
    lang_total += 1
    if not excluded and lid not in named:
        lang[lid] = (cat, text)


for s in stories:
    add("story", s["id"] + ".blurb", f"{s['title']} | {s['blurb']['vi']}", False)
    for i, se in enumerate(s["sentences"]):
        prev = s["sentences"][i - 1]["text"] if i else ""
        nxt = s["sentences"][i + 1]["text"] if i + 1 < len(s["sentences"]) else ""
        add("story", f"{s['id']}#{i}", f"[{se['speaker']}] {se['text']} || {se['translation']['vi']}    (prev: {prev} | next: {nxt}) band {s['band']}", False)
for rid, r in readings.items():
    for i, b in enumerate(r["blocks"]):
        add("reading", f"{rid}#{i}", json.dumps(b, ensure_ascii=False) + f"  (title {r.get('title')})", rid in named)
scen_clips = {}
for sid, s in scen.items():
    for n in s["nodes"].values():
        for k in ("clipId", "rephraseClipId"):
            if n.get(k):
                scen_clips[n[k]] = sid
for cid, c in clips.items():
    add("clip", cid, clip_text(cid) + (f"  (scenario {scen_clips[cid]})" if cid in scen_clips else ""), scen_clips.get(cid) in named)
for sid, s in scen.items():
    add("scenario", sid + ".goal", f"{s['title']['vi']} | {s['goal']['vi']}", sid in named)
    for nid, n in s["nodes"].items():
        if n["kind"] == "learner" and n.get("scored"):
            prev = [p for p in s["nodes"].values() if p.get("next") == nid]
            pt = prev[0]["text"] if prev else ""
            add("scenario", f"{sid}/{nid}", f"partner: {pt} || prompt: {n['prompt']['vi']} || expected: " + json.dumps(n["expected"], ensure_ascii=False), sid in named)
for x in lex:
    exs = " ; ".join(f"{e['target']} || {e['translations'].get('vi')}" for e in x.get("examples", []))
    add("lexicon", x["id"], f"{x['surface']} ({x['reading']['kana'] if x.get('reading') else ''}) {x['partOfSpeech']} = {x['glosses'].get('vi')} | {exs}", False)
for c in concepts:
    cid = c["id"]
    add("concept", cid + ".rule", f"{c['title']['vi']} | {c['shortRule']['vi']}", cid in named)
    add("concept", cid + ".explanation", c["explanation"]["vi"], cid in named)
    for i, e in enumerate(c.get("examples", [])):
        add("concept", f"{cid}.ex#{i}", f"{e['target']} || {e['translations']['vi']}" + (f" ({e['note']['vi']})" if e.get("note") else ""), cid in named)
for sec in course["sections"]:
    for u in sec["units"]:
        add("guidebook", u["id"] + ".desc", f"{u['title']} | {u['description']}", u["id"] in named)
        lines = [ln for ln in (u.get("guidebook") or "").split("\n") if ln.strip()]
        for i, ln in enumerate(lines):
            add("guidebook", f"{u['id']}.gb#{i}", ln, u["id"] in named)
primer_named_sections = {"hiragana-basic", "katakana-long-vowels"}
add("primer", "ja.primer.intro", primer["intro"]["vi"], True)
for s in primer["sections"]:
    if s.get("explanation"):
        add("primer", f"ja.primer.{s['id']}.explanation", s["explanation"]["vi"], s["id"] in primer_named_sections)
    for k in ("note", "notes"):
        if s.get(k):
            add("primer", f"ja.primer.{s['id']}.{k}", json.dumps(s[k], ensure_ascii=False), False)
add("primer", "ja.primer.checkpoint.intro", primer["checkpoint"]["intro"]["vi"], False)
for it in primer["checkpoint"]["items"]:
    add("primer", f"ja.primer.checkpoint.{it['id']}", json.dumps(it, ensure_ascii=False), False)

ex_ids = sorted(ex_pop)
lang_ids = sorted(lang)
n_ex = math.ceil(len(ex_ids) * 0.1)
n_lang = math.ceil(len(lang_ids) * 0.1)
s_ex = rng.sample(ex_ids, n_ex)
s_lang = rng.sample(lang_ids, n_lang)
da = L(RV + "decisions-answers.json")
dl = L(RV + "decisions-language.json")
fix_a = rng.sample([d for d in da if d.get("decision", "").startswith("fixed")], 5)
fix_l = rng.sample([d for d in dl if d.get("severity") in ("P0", "P1") and d.get("decision", "").startswith("fixed")], 5)

with open(f"{out}/ja-audit-exercises.txt", "w", encoding="utf-8", newline="\n") as f:
    for i in sorted(s_ex):
        cat, e = ex_pop[i]
        f.write(f"### {i} [{cat}]\n  " + json.dumps(e, ensure_ascii=False) + "\n")
        for x in ctx(e):
            f.write("    " + x + "\n")
with open(f"{out}/ja-audit-language.txt", "w", encoding="utf-8", newline="\n") as f:
    for i in sorted(s_lang, key=lambda k: (lang[k][0], k)):
        f.write(f"### {i} [{lang[i][0]}]\n  {lang[i][1]}\n")
with open(f"{out}/ja-audit-fixes.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump(fix_a + fix_l, f, ensure_ascii=False, indent=1)

from collections import Counter
meta = {
    "seed": SEED,
    "method": "python -I -X utf8 ja-vi-audit-sample.py C:/src/lft-ja <out>; random.Random(seed).sample over sorted ids, exercises then language then 5 answer fixes then 5 language P0/P1 fixes",
    "exercises": {"lines": ex_total, "passed": len(ex_ids), "sample": n_ex, "byCategory": dict(Counter(ex_pop[i][0] for i in s_ex)),
                  "populationByCategory": dict(Counter(v[0] for v in ex_pop.values()))},
    "language": {"lines": lang_total, "passed": len(lang_ids), "sample": n_lang, "byCategory": dict(Counter(lang[i][0] for i in s_lang)),
                 "populationByCategory": dict(Counter(v[0] for v in lang.values()))},
    "sampledIds": {"exercises": sorted(s_ex), "language": sorted(s_lang)},
    "fixesRechecked": [d["id"] for d in fix_a + fix_l],
}
with open(f"{out}/ja-vi-audit-sample.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump(meta, f, ensure_ascii=False, indent=1)
print(json.dumps({k: v for k, v in meta.items() if k != "sampledIds"}, ensure_ascii=False, indent=1))
