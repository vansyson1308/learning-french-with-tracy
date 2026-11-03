"""Paradigm tables of the verbs the ja-vi lessons drill with conjugationCloze (P4c session 3).

Every cell is read from the committed kaikki morphology rows (content/ja/lexicon/derived/morphology.json, derived by
scripts/lib/lexicon-etl/ja-morphology.ts): the row of that cell in the lemma's own spelling (kanji where the lemma has
kanji). A cell with no such row stops the generator — nothing is conjugated here. The group follows from the rows
(ichidan: the polite stem is the lemma without る); scripts/lib/languages/ja-morph.ts checks every table against the
written rules of its group, and the paradigm validator against the rows. ja-concepts.py emits the tables (they are
ingested with the concept cards); ja_lesson_lib.K() reads them for the answer keys.
"""
import json

CELLS = ["plain:nonpast:aff", "plain:nonpast:neg", "plain:past:aff", "plain:past:neg",
         "polite:nonpast:aff", "polite:nonpast:neg", "polite:past:aff", "polite:past:neg", "te"]
HAN = lambda s: any("一" <= c <= "鿿" or c == "々" for c in s)  # noqa: E731

# The verbs of the cloze items: Section 2 unit b (ます forms), the te-form lessons (ug-l1, uq-l3, uv-l1). 飲む, 休む,
# 出す, 取る and 続ける are not here: the retrieval has no conjugation table for them (see REVIEW-NOTES.md).
CLOZE_VERBS = ["行く", "来る", "帰る", "食べる", "見る", "する", "起きる", "寝る", "買う", "書く", "聞く", "話す", "待つ",
               "働く", "勉強する", "読む", "使う", "座る", "開ける", "閉める", "入る", "見せる", "持つ", "洗う", "着る"]


def _rows(root):
    doc = json.load(open(f"{root}/content/ja/lexicon/derived/morphology.json", encoding="utf-8"))
    return {v["lemma"]: v["rows"] for v in doc["verbs"]}


def _pick(lemma, rows, cell):
    forms = sorted({r["mot"] for r in rows if r["infoVer"].split(",")[0] == cell})
    if HAN(lemma):
        mine = [f for f in forms if f[0] == lemma[0]]
    else:
        mine = [f for f in forms if not HAN(f)]
        if len(mine) > 1:
            mine = [f for f in mine if f[0] == lemma[0]] or mine
    return mine[0] if len(mine) == 1 else None, forms


def _kana(lemma_kana, rows, cell):
    """The all-kana spelling of a cell (a typed answer in kana is an accepted variant), or None."""
    forms = sorted({r["mot"] for r in rows if r["infoVer"].split(",")[0] == cell and not HAN(r["mot"])})
    forms = [f for f in forms if f[0] == lemma_kana[0]] or forms
    return forms[0] if len(forms) == 1 else None


def tables(root, lexicon):
    """{lemma: {"cells", "kana", "group", "gloss"}} for CLOZE_VERBS; raises on a cell the rows do not give."""
    rows = _rows(root)
    lex = {x["surface"]: x for x in lexicon}
    out, problems = {}, []
    for lemma in CLOZE_VERBS:
        r = rows.get(lemma)
        if r is None:
            problems.append(f"{lemma}: no morphology rows")
            continue
        cells, kana = {}, {}
        for cell in CELLS:
            form, forms = _pick(lemma, r, cell)
            if form is None:
                problems.append(f"{lemma}: cell {cell} has no single row in its spelling ({forms})")
                continue
            cells[cell] = form
            k = _kana(lex[lemma]["reading"]["kana"], r, cell)
            if k and k != form:
                kana[cell] = k
        polite = cells.get("polite:nonpast:aff", "")
        if lemma.endswith("する") or lemma in ("来る", "くる"):
            group = "irregular"
        elif lemma.endswith("る") and polite == lemma[:-1] + "ます":
            group = "ichidan"
        else:
            group = "godan"
        out[lemma] = {"cells": cells, "kana": kana, "group": group, "gloss": lex[lemma]["glosses"]}
    if problems:
        raise SystemExit("paradigms: " + "; ".join(problems))
    return out


def cloze_kana(table, cell, answer, index):
    """The cloze's one alternative, its kana spelling (D-10 review: every cloze lists it, strict grading folds no
    kanji): the kana row of the cell, else the answer read through the inflection keys (行きません → いきません)."""
    k = table["kana"].get(cell) or index.kana(answer)
    return [k] if k != answer and not HAN(k) else []


def table_records(root, lexicon):
    """The {paradigm: …} records the concepts ingest writes to content/ja/pedagogy/paradigms.json."""
    out = []
    for lemma, t in tables(root, lexicon).items():
        gloss = {"vi": t["gloss"]["vi"].split(";")[0].strip(), "en": t["gloss"]["en"].split(";")[0].strip()}
        out.append({"paradigm": {"lemma": lemma, "gloss": gloss, "group": t["group"], "cells": t["cells"], "evidence": {"source": "kaikki-en"}}})
    return out
