"""Paradigm tables of the ko-vi conjugationCloze verbs (P4e session 2): the dictionary form, the 해요체 present / past /
future and the honorific present (scripts/lib/languages/ko-morph.ts KO_PARADIGM_CELLS).

The cells are written by ko_text's conjugator; the validator evidences every one against the verb's own kaikki
conjugation rows (tagKoreanCells: present, past and honorific stated by the table, the future composed from the
stated prospective modifier) and checks a regular or 하다 table against the group rules. Only verbs whose kaikki table
states every cell are here (no 먹다: its honorific 드세요 is not in its table; no 주다: its table states 주었어요, not
the spoken 줬어요 the course teaches; no 오다 / 마시다: no table in the committed morphology). Glosses come from the
lexicon.
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ko_text import IRREG_B, IRREG_D, IRREG_H, IRREG_S, _eu, _past, aeo  # noqa: E402

VERBS = ["가다", "하다", "보다", "사다", "타다", "서다", "켜다", "기다리다", "찾다", "알다", "살다", "놀다", "팔다", "열다", "쓰다", "모르다", "걷다"]


def group(lemma):
    if lemma.endswith("하다"):
        return "hada"
    s = lemma[:-1]
    if lemma in IRREG_B | IRREG_D | IRREG_S | IRREG_H or (s.endswith("르") and len(s) >= 2):
        return "irregular"
    return "regular"


def cells(lemma):
    return {
        "inf": lemma,
        "haeyo:pre": aeo(lemma) + "요",
        "haeyo:pas": _past(lemma) + "어요",
        "haeyo:fut": _eu(lemma, "ㄹ") + " 거예요",
        "hon:pre": _eu(lemma, "세요"),
    }


def _gloss(lex, lemma):
    x = lex[lemma]["glosses"]
    return {"vi": x["vi"].split(";")[0].strip(), "en": x["en"].split(";")[0].strip()}


TABLES = {v: {"lemma": v, "group": group(v), "cells": cells(v), "evidence": {"source": "kaikki-en"}} for v in VERBS}


def table_records(lex):
    """The {paradigm: …} records the concepts ingest writes to the staged paradigms.json."""
    return [{"paradigm": {"lemma": v, "gloss": _gloss(lex, v), "group": TABLES[v]["group"], "cells": TABLES[v]["cells"], "evidence": {"source": "kaikki-en"}}} for v in VERBS]
