/**
 * Korean build plugin (P4b stage 5, task 6): the generic CJK defaults
 * (trigram FTS, character error rate, no articles) plus the verb paradigm
 * it declares — the dictionary form, 해요체 present / past / future and
 * the honorific present — with the written rules of regular and 하다
 * verbs (ko-morph.ts) as group rules.
 *
 * Evidence: today's kaikki derivation tags the dictionary form (`inf`)
 * but not the 해요체 cells (its `informal` / `formal` tags are other
 * speech levels), so those cells are evidenced by an atom naming the cell
 * itself, which the derivation must emit before a ko table can validate
 * (P4e). Until then the group rules are the authority, and no ko table is
 * authored.
 */
import { existsSync } from "fs";

import { readJson, safeResolve } from "../pipeline";

import { genericPlugin } from "./generic";
import { KO_GROUPS, KO_PARADIGM_CELLS, koreanGroupRules } from "./ko-morph";
import type { BuildLanguagePlugin, MorphVerb, ParadigmSpec } from "./types";

const MORPHOLOGY_SOURCE = "content/ko/lexicon/derived/morphology.json";

export const KO_PARADIGM: ParadigmSpec = {
  cellIds: KO_PARADIGM_CELLS,
  groups: KO_GROUPS,
  evidenceSource: "kaikki-en",
  loadEvidence(): MorphVerb[] | null {
    if (!existsSync(safeResolve(MORPHOLOGY_SOURCE))) return null;
    return (readJson(MORPHOLOGY_SOURCE) as { verbs: MorphVerb[] }).verbs;
  },
  cellEvidencedBy: (cellId, atom) => atom === cellId,
  groupRules: koreanGroupRules,
};

export const ko: BuildLanguagePlugin = genericPlugin(
  { code: "ko", recognitionLocale: "ko-KR", ttsLocale: "ko-KR", script: "hangul", flagAsset: "kr", readings: ["rr"] },
  { paradigm: KO_PARADIGM }
);
