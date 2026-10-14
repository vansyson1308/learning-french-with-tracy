/**
 * PostAnswerPanel identity + data (Phase 4).
 *
 * Identity rule (§ panel-data-identity): the panel shows lexical detail
 * ONLY for an interaction tied to exactly one valid stable item of the course,
 * resolved from the step's effective evidence plan (composer-designated
 * for generated steps, compiler-authored gradeTargets for PATH selects) —
 * NEVER by parsing rendered text. Anything ambiguous — match/multi-item
 * exercises, legacy courses, uncurated fallback ids — yields null and no
 * panel is shown. A fake panel is worse than no panel.
 */

import { behaviorFor } from "../exercise-registry";
import { msg, type Message } from "../i18n/message";
import { isCuratedItemId } from "../learning/ids";
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
  return isCuratedItemId(definition.courseId, plan.itemId) ? plan.itemId : null;
}

/** Rich metadata for a TODAY teach step (curated items of the course only). */
export function teachMetaFor(courseId: string, step: SessionStep): LexemeMeta | undefined {
  if (step.type !== "teach") return undefined;
  if (!isCuratedItemId(courseId, step.itemId)) return undefined;
  return lexemeMetaFor(courseId, step.itemId);
}

/** Conjugation cells the panel note can name (Phase 5B §67; the words live in the catalogue's `panel.conjugationNote` select). */
const CELL_SELECTORS: Record<string, string> = {
  "pre:1s": "pre1s",
  "pre:2s": "pre2s",
  "pre:3s": "pre3s",
  "pre:1p": "pre1p",
  "pre:2p": "pre2p",
  "pre:3p": "pre3p",
  inf: "inf",
  participle: "participle",
};

const ARTICLE_GENDER: Record<string, string> = {
  le: "masculine",
  la: "feminine",
  un: "masculine",
  une: "feminine",
};

/**
 * Phase 5B single-note addition: ONE derived line for grammar exercises,
 * built purely from the exercise's own authored fields (never parsed from
 * rendered text). Null for every other exercise type — the lexical panel
 * stays exactly as it was.
 */
export function grammarNoteFor(step: SessionStep): Message | null {
  if (step.type !== "exercise") return null;
  const exercise = step.exercise;
  if (exercise.type === "articleSelect") {
    const article = exercise.articles[exercise.correct];
    if (article === undefined) return null;
    const gender = ARTICLE_GENDER[article] ?? "unknown";
    return msg("panel.articleNote", { noun: exercise.noun, article, gender });
  }
  if (exercise.type === "conjugationCloze") {
    const cell = CELL_SELECTORS[exercise.cell];
    if (cell === undefined) return null;
    return msg("panel.conjugationNote", {
      answer: exercise.answer,
      cell,
      verb: exercise.verb,
      present: exercise.cell.startsWith("pre:") ? "yes" : "no",
    });
  }
  return null;
}

export type PanelData = {
  surface: string;
  gloss: string;
  /** "masculine noun" (+ elision cue) as a message — only for nouns with a known gender. */
  genderLabel?: Message;
  /** Pronunciation, already wrapped for display (/ipa/ or raw phonology). */
  pronunciation?: string;
  /** Keyed by language code — resolve with exampleTexts(). */
  example?: Record<string, string>;
  /** Expanded ("More") fields. */
  lemma: string;
  pos: string;
  topic?: string;
  band?: string;
};

export function displayPronunciation(p: { value: string; notation: string }): string {
  return p.notation === "ipa" ? `/${p.value}/` : p.value;
}

export function panelDataFor(courseId: string, itemId: string): PanelData | null {
  const meta = lexemeMetaFor(courseId, itemId);
  if (!meta) return null;
  const cue = articleCueFor(courseId, meta);
  const genderLabel =
    meta.pos === "noun" && (meta.gender === "masculine" || meta.gender === "feminine")
      ? msg("panel.genderLabel", { gender: meta.gender, elided: cue === "l'" ? "yes" : "no" })
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
