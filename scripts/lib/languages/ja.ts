/**
 * Japanese build plugin (P4b stage 5, task 6): the generic CJK defaults
 * (trigram FTS, character error rate, no articles) plus the verb paradigm
 * it declares — plain / polite × non-past / past × affirmative / negative,
 * and the te-form — with the written rules of the ichidan / godan /
 * irregular groups (ja-morph.ts) as group rules.
 *
 * Evidence: a paradigm table is checked against the committed kaikki
 * morphology rows. Today's derivation tags only the dictionary form
 * (`inf`) and the polite non-past (`formal`); the other cells are
 * evidenced by an atom naming the cell itself, which the derivation must
 * emit before a ja table can validate (P4c). Until then the group rules
 * are the authority, and no ja table is authored.
 */
import { existsSync } from "fs";

import { readJson, safeResolve } from "../pipeline";

import { genericPlugin } from "./generic";
import { JA_GROUPS, JA_PARADIGM_CELLS, japaneseGroupRules } from "./ja-morph";
import type { BuildLanguagePlugin, MorphVerb, ParadigmSpec } from "./types";

const MORPHOLOGY_SOURCE = "content/ja/lexicon/derived/morphology.json";

function cellEvidencedBy(cellId: string, atom: string): boolean {
  if (cellId === "plain:nonpast:aff" && atom === "inf") return true;
  if (cellId === "polite:nonpast:aff" && atom === "formal") return true;
  return atom === cellId;
}

export const JA_PARADIGM: ParadigmSpec = {
  cellIds: JA_PARADIGM_CELLS,
  groups: JA_GROUPS,
  evidenceSource: "kaikki-en",
  loadEvidence(): MorphVerb[] | null {
    if (!existsSync(safeResolve(MORPHOLOGY_SOURCE))) return null;
    return (readJson(MORPHOLOGY_SOURCE) as { verbs: MorphVerb[] }).verbs;
  },
  cellEvidencedBy,
  groupRules: japaneseGroupRules,
};

export const ja: BuildLanguagePlugin = genericPlugin(
  { code: "ja", recognitionLocale: "ja-JP", ttsLocale: "ja-JP", script: "japanese", flagAsset: "jp", readings: ["kana"] },
  { paradigm: JA_PARADIGM }
);
