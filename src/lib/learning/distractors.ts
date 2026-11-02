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

import { itemIdFor } from "./ids";
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
  return lexemeMetaFor(courseId, itemIdFor(courseId, word.target));
}

/**
 * A candidate pool prepared once for many picks. A session that draws
 * distractors many times from one large pool (TODAY: ~30 picks over a
 * 12,000-word syllabus at C2 scale, D-15 §7) resolves every candidate's
 * lexicon metadata once and indexes the pool by tier key, so a pick reads
 * only the candidates of the tiers it visits instead of scanning the whole
 * pool. Same words, same order, same metadata, same rng draws — the picks
 * are identical to the plain-array path (pinned by test). A pool with a
 * repeated target falls back to the scan.
 */
export type DistractorPool = {
  readonly courseId: string;
  readonly words: readonly Word[];
  readonly metas: readonly (LexemeMeta | undefined)[];
};

/** Tier keys of a candidate's metadata (confusable id, POS, POS+topic, POS+band). */
type BucketKind = "id" | "pos" | "posTopic" | "posBand";

const SEP = "\u0000";

function bucketKey(kind: BucketKind, meta: LexemeMeta): string | undefined {
  switch (kind) {
    case "id":
      return meta.id;
    case "pos":
      return meta.pos;
    case "posTopic":
      return meta.topic === undefined ? undefined : `${meta.pos}${SEP}${meta.topic}`;
    case "posBand":
      return meta.band === undefined ? undefined : `${meta.pos}${SEP}${meta.band}`;
  }
}

/** Pool positions by text and by tier key; every position list ascends (pool order). */
type PoolIndex = {
  /** False when two candidates share a target: the indexed path then falls back to the scan. */
  uniqueTargets: boolean;
  indexOfTarget: Map<string, number>;
  /** The first two positions carrying each native text. */
  firstOfNative: Map<string, number>;
  secondOfNative: Map<string, number>;
  /** Built on first use — most picks only ever read the POS+topic buckets. */
  buckets: Map<BucketKind, Map<string, number[]>>;
  countOfNative: Map<string, number> | null;
};

const POOL_INDEX = new WeakMap<DistractorPool, PoolIndex>();

function buckets(pool: DistractorPool, index: PoolIndex, kind: BucketKind): Map<string, number[]> {
  const hit = index.buckets.get(kind);
  if (hit) return hit;
  const built = new Map<string, number[]>();
  pool.metas.forEach((meta, i) => {
    const key = meta === undefined ? undefined : bucketKey(kind, meta);
    if (key === undefined) return;
    const list = built.get(key);
    if (list) list.push(i);
    else built.set(key, [i]);
  });
  index.buckets.set(kind, built);
  return built;
}

export function prepareDistractorPool(courseId: string, words: readonly Word[]): DistractorPool {
  const pool: DistractorPool = { courseId, words, metas: words.map((w) => metaFor(courseId, w)) };
  const index: PoolIndex = {
    uniqueTargets: true,
    indexOfTarget: new Map(),
    firstOfNative: new Map(),
    secondOfNative: new Map(),
    buckets: new Map(),
    countOfNative: null,
  };
  words.forEach((w, i) => {
    if (index.indexOfTarget.has(w.target)) index.uniqueTargets = false;
    else index.indexOfTarget.set(w.target, i);
    if (!index.firstOfNative.has(w.native)) index.firstOfNative.set(w.native, i);
    else if (!index.secondOfNative.has(w.native)) index.secondOfNative.set(w.native, i);
  });
  POOL_INDEX.set(pool, index);
  return pool;
}

function isPrepared(pool: readonly Word[] | DistractorPool): pool is DistractorPool {
  return "metas" in pool;
}

type Candidate = { w: Word; meta: LexemeMeta | undefined; tier: number };

/**
 * With unique targets the scan below reduces, in BOTH directions, to one
 * rule per position: skip the answer word and every candidate carrying the
 * answer's native text; of the rest, the first position (the answer word's
 * own position aside) carrying a native text is eligible, every later one
 * is deferred (production's gloss-uniqueness relaxation; recognition never
 * reaches it — its display IS the native text).
 */
function isFirstOfNative(pool: DistractorPool, index: PoolIndex, word: Word, i: number): boolean | null {
  const w = pool.words[i];
  if (w.target === word.target || w.native === word.native) return null;
  const first = index.firstOfNative.get(w.native);
  return first === i || (first === index.indexOfTarget.get(word.target) && index.secondOfNative.get(w.native) === i);
}

/** Whether the scan would defer any candidate (a native text on ≥ 2 positions besides the answer word's). */
function hasDeferred(pool: DistractorPool, index: PoolIndex, word: Word): boolean {
  const self = index.indexOfTarget.get(word.target);
  const selfNative = self === undefined ? undefined : pool.words[self].native;
  if (index.countOfNative === null) {
    const counts = new Map<string, number>();
    for (const w of pool.words) counts.set(w.native, (counts.get(w.native) ?? 0) + 1);
    index.countOfNative = counts;
  }
  for (const [native, n] of index.countOfNative) {
    if (native !== word.native && n - (native === selfNative ? 1 : 0) >= 2) return true;
  }
  return false;
}

/**
 * Candidates of ONE tier, in pool order, from the prepared index — exactly
 * `eligible.filter((e) => e.tier === tier)` (or `deferred…`) of the scan
 * below. Each tier reads a superset bucket and keeps the positions whose
 * computed tier is that tier.
 */
function indexedTier(
  pool: DistractorPool,
  index: PoolIndex,
  word: Word,
  targetMeta: LexemeMeta | undefined,
  tier: number,
  pass: "eligible" | "deferred"
): Candidate[] {
  const eligible = (i: number): boolean => isFirstOfNative(pool, index, word, i) === (pass === "eligible");
  let bucket: readonly number[];
  if (tier === 5 || !targetMeta) {
    bucket = tier === 5 ? pool.words.map((_, i) => i) : [];
  } else if (tier === 1) {
    const ids = targetMeta.confusables ?? [];
    const byId = ids.length === 0 ? null : buckets(pool, index, "id");
    bucket = [...new Set(ids.flatMap((id) => byId?.get(id) ?? []))].sort((a, b) => a - b);
  } else {
    const kind: BucketKind = tier === 2 ? "posTopic" : tier === 3 ? "posBand" : "pos";
    const key = bucketKey(kind, targetMeta);
    bucket = key === undefined ? [] : buckets(pool, index, kind).get(key) ?? [];
  }
  const out: Candidate[] = [];
  for (const i of bucket) {
    if (!eligible(i)) continue;
    const meta = pool.metas[i];
    if (tierOf(targetMeta, meta) === tier) out.push({ w: pool.words[i], meta, tier });
  }
  return out;
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
  /** Candidate words, or a pool prepared once for many picks (same result). */
  pool: readonly Word[] | DistractorPool;
  rng: () => number;
  direction: Direction;
  count?: number;
}): Word[] {
  const { courseId, word, rng, direction } = args;
  const prepared = isPrepared(args.pool) && args.pool.courseId === courseId ? args.pool : null;
  const pool = isPrepared(args.pool) ? args.pool.words : args.pool;
  const candidateMeta = (w: Word, i: number) => (prepared ? prepared.metas[i] : metaFor(courseId, w));
  const count = args.count ?? 3;
  const display = (w: Word) => (direction === "targetToNative" ? w.native : w.target);
  const answerDisplay = display(word);
  const targetMeta = metaFor(courseId, word);
  const preferGender =
    targetMeta?.pos === "noun" &&
    (targetMeta.gender === "masculine" || targetMeta.gender === "feminine")
      ? targetMeta.gender
      : null;

  const picked: Word[] = [];
  const pickedDisplays = new Set<string>([answerDisplay]);
  const take = (inTierOf: (tier: number) => Candidate[]) => {
    for (let tier = 1; tier <= 5 && picked.length < count; tier++) {
      const inTier = inTierOf(tier);
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

  // Indexed path (prepared pool): only the visited tiers are read.
  const index = prepared ? POOL_INDEX.get(prepared) : undefined;
  if (prepared && index?.uniqueTargets) {
    take((tier) => indexedTier(prepared, index, word, targetMeta, tier, "eligible"));
    if (direction === "nativeToTarget" && picked.length < count && hasDeferred(prepared, index, word)) {
      take((tier) => indexedTier(prepared, index, word, targetMeta, tier, "deferred"));
    }
    return picked;
  }

  // Hard filtering. `deferred` keeps production candidates excluded only by
  // the soft gloss-uniqueness rule for the deterministic relaxation pass.
  const usedDisplay = new Set<string>([answerDisplay]);
  const usedGloss = new Set<string>([word.native]);
  const eligible: Candidate[] = [];
  const deferred: Candidate[] = [];
  for (let i = 0; i < pool.length; i++) {
    const w = pool[i];
    if (w.target === word.target) continue;
    const text = display(w);
    if (usedDisplay.has(text)) continue;
    if (direction === "nativeToTarget" && w.native === word.native) continue; // second correct answer
    const entry = { w, meta: candidateMeta(w, i), tier: 0 };
    entry.tier = tierOf(targetMeta, entry.meta);
    if (direction === "nativeToTarget" && usedGloss.has(w.native)) {
      deferred.push(entry);
      continue;
    }
    usedDisplay.add(text);
    usedGloss.add(w.native);
    eligible.push(entry);
  }

  take((tier) => eligible.filter((e) => e.tier === tier));
  // Deterministic relaxation: only if the strict pass could not fill.
  if (picked.length < count && deferred.length > 0) take((tier) => deferred.filter((e) => e.tier === tier));
  return picked;
}
