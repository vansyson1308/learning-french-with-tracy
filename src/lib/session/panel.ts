/**
 * PostAnswerPanel identity + data (Phase 4).
 *
 * Identity rule (§ panel-data-identity): the panel shows lexical detail
 * ONLY for an interaction tied to exactly one valid stable French item,
 * resolved from the step's effective evidence plan (composer-designated
 * for generated steps, compiler-authored gradeTargets for PATH selects) —
 * NEVER by parsing rendered text. Anything ambiguous — match/multi-item
 * exercises, legacy courses, uncurated fallback ids — yields null and no
 * panel is shown. A fake panel is worse than no panel.
 */

import { behaviorFor } from "../exercise-registry";
import { isCuratedFrItemId } from "../learning/ids-fr";
import {
  articleCueFor,
  lexemeMetaFor,
  type LexemeMeta,
} from "../learning/lexicon-index";

import { evidencePlanFor } from "./evidence";
import type { SessionDefinition, SessionStep } from "./types";

export function panelItemIdFor(
  definition: SessionDefinition,
  step: SessionStep
): string | null {
  if (step.type !== "exercise") return null;
  // Match (self-advancing) exercises grade several items — no single panel.
  if (behaviorFor(step.exercise).selfAdvancing) return null;
  const plan = evidencePlanFor(definition, step);
  if (!plan) return null;
  return isCuratedFrItemId(plan.itemId) ? plan.itemId : null;
}

/** Rich metadata for a TODAY teach step (curated French items only). */
export function teachMetaFor(step: SessionStep): LexemeMeta | undefined {
  if (step.type !== "teach") return undefined;
  if (!isCuratedFrItemId(step.itemId)) return undefined;
  return lexemeMetaFor(step.itemId);
}

export type PanelData = {
  surface: string;
  gloss: string;
  /** e.g. "masculine noun" — only for nouns with a known gender. */
  genderLabel?: string;
  /** Pronunciation, already wrapped for display (/ipa/ or raw phonology). */
  pronunciation?: string;
  example?: { fr: string; en: string };
  /** Expanded ("More") fields. */
  lemma: string;
  pos: string;
  topic?: string;
  band?: string;
};

export function displayPronunciation(p: { value: string; notation: string }): string {
  return p.notation === "ipa" ? `/${p.value}/` : p.value;
}

export function panelDataFor(itemId: string): PanelData | null {
  const meta = lexemeMetaFor(itemId);
  if (!meta) return null;
  const cue = articleCueFor(meta);
  const genderLabel =
    meta.pos === "noun" && (meta.gender === "masculine" || meta.gender === "feminine")
      ? `${meta.gender} noun${cue === "l'" ? ` (l')` : ""}`
      : undefined;
  return {
    surface: meta.surface,
    gloss: meta.gloss,
    ...(genderLabel !== undefined ? { genderLabel } : {}),
    ...(meta.pronunciation !== undefined
      ? { pronunciation: displayPronunciation(meta.pronunciation) }
      : {}),
    ...(meta.example !== undefined ? { example: { ...meta.example } } : {}),
    lemma: meta.lemma,
    pos: meta.pos,
    ...(meta.topic !== undefined ? { topic: meta.topic } : {}),
    ...(meta.band !== undefined ? { band: meta.band } : {}),
  };
}
