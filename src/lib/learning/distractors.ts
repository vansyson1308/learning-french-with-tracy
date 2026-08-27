/**
 * Smart distractor engine (Phase 4) for GENERATED exercises only — the
 * review builder and the TODAY composer. Authored lesson options are course
 * content and are never touched.
 *
 * Tier order for a French target with lexicon metadata:
 *   1. authored confusables
 *   2. same part of speech + same topic
 *   3. same part of speech + same frequency band (only when both carry one)
 *   4. same part of speech
 *   5. safe curriculum fallback (everything else)
 * Within every tier, when the target is a noun with known gender,
 * same-gender candidates come first — in the production direction the
 * option surfaces carry their articles, so a lone gender would leak the
 * answer.
 *
 * Hard rules, both directions: the answer is never a candidate, displayed
 * option strings are unique, and in production (native→French) no
 * candidate may share the answer's English gloss (a second correct answer
 * would make the question unwinnable). Gloss uniqueness AMONG distractors
 * is preferred but relaxes — deterministically — before returning fewer
 * than requested. Missing metadata never crashes: such candidates simply
 * rank in the fallback tier, which is also the whole engine for legacy
 * courses. Selection is fully deterministic under the session rng.
 */

import { FR_COURSE_ID, frItemIdFor } from "./ids-fr";
import { lexemeMetaFor, type LexemeMeta } from "./lexicon-index";
import type { Word } from "../types";

export type Direction = "targetToNative" | "nativeToTarget";

function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function metaFor(courseId: string, word: Word): LexemeMeta | undefined {
  if (courseId !== FR_COURSE_ID) return undefined;
  return lexemeMetaFor(frItemIdFor(word.target));
}

/** Exported for the test matrix; not part of the builder-facing API. */
export function tierOf(target: LexemeMeta | undefined, cand: LexemeMeta | undefined): number {
  if (!target || !cand) return 5;
  if ((target.confusables ?? []).includes(cand.id)) return 1;
  if (cand.pos === target.pos) {
    if (cand.topic !== undefined && cand.topic === target.topic) return 2;
    if (cand.band !== undefined && cand.band === target.band) return 3;
    return 4;
  }
  return 5;
}

export function pickDistractors(args: {
  courseId: string;
  word: Word;
  pool: Word[];
  rng: () => number;
  direction: Direction;
  count?: number;
}): Word[] {
  const { courseId, word, pool, rng, direction } = args;
  const count = args.count ?? 3;
  const display = (w: Word) => (direction === "targetToNative" ? w.native : w.target);
  const answerDisplay = display(word);
  const targetMeta = metaFor(courseId, word);
  const preferGender =
    targetMeta?.pos === "noun" &&
    (targetMeta.gender === "masculine" || targetMeta.gender === "feminine")
      ? targetMeta.gender
      : null;

  // Hard filtering. `deferred` keeps production candidates excluded only by
  // the soft gloss-uniqueness rule for the deterministic relaxation pass.
  const usedDisplay = new Set<string>([answerDisplay]);
  const usedGloss = new Set<string>([word.native]);
  const eligible: { w: Word; meta: LexemeMeta | undefined; tier: number }[] = [];
  const deferred: { w: Word; meta: LexemeMeta | undefined; tier: number }[] = [];
  for (const w of pool) {
    if (w.target === word.target) continue;
    const text = display(w);
    if (usedDisplay.has(text)) continue;
    if (direction === "nativeToTarget" && w.native === word.native) continue; // second correct answer
    const entry = { w, meta: metaFor(courseId, w), tier: 0 };
    entry.tier = tierOf(targetMeta, entry.meta);
    if (direction === "nativeToTarget" && usedGloss.has(w.native)) {
      deferred.push(entry);
      continue;
    }
    usedDisplay.add(text);
    usedGloss.add(w.native);
    eligible.push(entry);
  }

  const picked: Word[] = [];
  const pickedDisplays = new Set<string>([answerDisplay]);
  const take = (entries: { w: Word; meta: LexemeMeta | undefined; tier: number }[]) => {
    for (let tier = 1; tier <= 5 && picked.length < count; tier++) {
      const inTier = entries.filter((e) => e.tier === tier);
      const partitions = preferGender
        ? [
            inTier.filter((e) => e.meta?.gender === preferGender),
            inTier.filter((e) => e.meta?.gender !== preferGender),
          ]
        : [inTier];
      for (const partition of partitions) {
        for (const e of shuffle(partition, rng)) {
          if (picked.length >= count) break;
          const text = display(e.w);
          if (pickedDisplays.has(text)) continue;
          pickedDisplays.add(text);
          picked.push(e.w);
        }
      }
    }
  };

  take(eligible);
  // Deterministic relaxation: only if the strict pass could not fill.
  if (picked.length < count && deferred.length > 0) take(deferred);
  return picked;
}
