/**
 * Synthetic-scale course generator (coordinator decision D-15 §7,
 * plan/10-LADDER-A1-C2.md §7): a deterministic, test-only target language
 * at C2 scale — 12,000 lexemes over 300 units — used by the scale/budget
 * tests to prove the engine and the data model hold at that size.
 *
 * Nothing here is content: it never touches content/ or src/content/, it is
 * never compiled, bundled or attributed. Everything derives from one seeded
 * PRNG (mulberry32) — no Math.random, no clock — so every run builds the
 * same course, the same learner and the same queries.
 *
 * The shapes mirror what the compiler emits for a real course (id registry,
 * lexicon index, web fallback, daily syllabus, pack), so the runtime under
 * test reads them through its normal seams.
 */

import type { CourseProfile } from "../../course-profile";
import type { DailyWordEntry } from "../../learning/daily-words";
import type { IdRegistry } from "../../learning/ids";
import type { LexemeMeta } from "../../learning/lexicon-index";
import type { FsrsCardState } from "../../learning/scheduler";
import type { GeneratedLexiconData } from "../../lexicon/generated-repository";
import type { LessonPack, Pack, SectionPack, UnitPack, Word } from "../../types";

export const SCALE_LEXEMES = 12_000;
export const SCALE_UNITS = 300;
export const SCALE_UNITS_PER_SECTION = 10;
export const SCALE_LESSONS_PER_UNIT = 4;
/** Test-only course id no other test uses (memo caches and bundles cannot be cleared). */
export const SCALE_COURSE_ID = "xx-scale";
export const SCALE_TARGET = "xx";
export const SCALE_NATIVE = "en";
export const SCALE_SOURCE_ID = "synthetic-scale";
const SEED = 0x5ca1e;

/** mulberry32 — the same deterministic PRNG family the app uses. */
export function scaleRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type SyntheticLexeme = {
  id: string;
  surface: string;
  lemma: string;
  lookupForm: string;
  pos: string;
  gender?: "masculine" | "feminine";
  gloss: string;
  topic?: string;
  frequency?: { band: "very-common" | "common" | "less-common"; rank?: number; perMillion: number };
  pronunciation?: { value: string; notation: "ipa" };
  example: { target: string; native: string };
  confusables?: string[];
  /** This lexeme is a regional form of `equivalent` (never on the path or in the syllabus). */
  variety?: { region: string; equivalent: string };
  /** Older course surfaces (QC 2026-10-28 shape): the bare noun without its article. */
  legacySurfaces?: string[];
};

const TOPICS = [
  "people", "greetings", "food", "animals", "travel", "everyday", "ideas", "places", "shopping", "time",
  "family", "home", "body", "clothing", "colors", "numbers", "weather", "nature", "work", "school",
  "feelings", "leisure", "technology",
] as const;
const CONSONANTS = ["b", "d", "f", "g", "k", "l", "m", "n", "p", "r", "s", "t", "v", "z"];
// A few accented vowels so the accent-folding search paths do real work.
const VOWELS = ["a", "e", "i", "o", "u", "a", "e", "i", "o", "u", "é", "ö"];
const GLOSS_ONSETS = ["b", "br", "c", "ch", "d", "f", "fl", "g", "gr", "h", "l", "m", "n", "p", "pl", "r", "s", "sh", "st", "t", "tr", "w"];
const GLOSS_NUCLEI = ["a", "e", "i", "o", "u", "ea", "oo", "ai", "ou"];
const GLOSS_CODAS = ["", "n", "t", "ck", "ll", "nd", "st", "r", "m", "sh"];

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function targetWord(rng: () => number): string {
  const syllables = 2 + Math.floor(rng() * 3);
  let w = "";
  for (let s = 0; s < syllables; s++) w += pick(rng, CONSONANTS) + pick(rng, VOWELS);
  return w;
}

function glossVocabulary(rng: () => number, size: number): string[] {
  const out = new Set<string>();
  while (out.size < size) {
    const parts = 1 + Math.floor(rng() * 2);
    let w = "";
    for (let p = 0; p < parts; p++) w += pick(rng, GLOSS_ONSETS) + pick(rng, GLOSS_NUCLEI) + pick(rng, GLOSS_CODAS);
    out.add(w);
  }
  return [...out];
}

/** Part of speech by share: ~50 % nouns, 20 % verbs, 15 % adjectives, then the long tail. */
function posFor(r: number): string {
  if (r < 0.5) return "noun";
  if (r < 0.7) return "verb";
  if (r < 0.85) return "adjective";
  if (r < 0.9) return "adverb";
  if (r < 0.95) return "expression";
  if (r < 0.97) return "preposition";
  if (r < 0.99) return "pronoun";
  return "interjection";
}

let cachedLexemes: SyntheticLexeme[] | null = null;

/** The 12,000 lexemes in delivery (authored) order. Memoized: the generator is pure. */
export function syntheticLexemes(): SyntheticLexeme[] {
  if (cachedLexemes) return cachedLexemes;
  const rng = scaleRng(SEED);
  const vocab = glossVocabulary(rng, 3_000);
  const usedWords = new Set<string>();
  const out: SyntheticLexeme[] = [];
  for (let i = 0; i < SCALE_LEXEMES; i++) {
    let word = targetWord(rng);
    while (usedWords.has(word)) word = targetWord(rng);
    usedWords.add(word);
    const pos = posFor(rng());
    const g1 = pick(rng, vocab);
    const g2 = pick(rng, vocab);
    const id = `xx:w:s${String(i).padStart(5, "0")}`;
    let surface = word;
    let lemma = word;
    let gloss = g1;
    let gender: SyntheticLexeme["gender"];
    if (pos === "noun") {
      gender = rng() < 0.5 ? "masculine" : "feminine";
      surface = `${gender === "masculine" ? "ka" : "ki"} ${word}`;
      gloss = `the ${g1}`;
    } else if (pos === "verb") {
      gloss = `to ${g1}`;
    } else if (pos === "expression") {
      const second = targetWord(rng);
      surface = `${word} ${second}`;
      lemma = surface;
      gloss = `${g1} ${g2}`;
    }
    const band = i < 2_000 ? "very-common" : i < 6_000 ? "common" : "less-common";
    const lex: SyntheticLexeme = {
      id,
      surface,
      lemma,
      lookupForm: lemma,
      pos,
      ...(gender !== undefined ? { gender } : {}),
      gloss,
      topic: pick(rng, TOPICS),
      example: { target: `Mi ${surface} na ${word}.`, native: `I see ${gloss} and ${g2}.` },
    };
    // ~90 % measured frequency (rank only for the ranked majority), ~80 % IPA.
    if (rng() < 0.9) {
      const perMillion = Math.round(100_000 / (i + 5)) / 10;
      lex.frequency = { band, ...(rng() < 0.95 ? { rank: i + 1 } : {}), perMillion };
    }
    if (rng() < 0.8) lex.pronunciation = { value: `/${word}/`, notation: "ipa" };
    // ~10 % of nouns carry an older bare surface (legacy-surface registry entries).
    if (pos === "noun" && i % 5 === 3) lex.legacySurfaces = [word];
    out.push(lex);
  }
  // Symmetric confusable pairs (every 25th lexeme with its successor).
  for (let i = 0; i + 1 < out.length; i += 25) {
    out[i].confusables = [out[i + 1].id];
    out[i + 1].confusables = [out[i].id];
  }
  // ~1 % regional forms of their predecessor (never taught on the path).
  for (let i = 50; i < out.length; i += 100) {
    if (out[i - 1].variety || out[i].confusables) continue;
    out[i].variety = { region: "south", equivalent: out[i - 1].id };
  }
  cachedLexemes = out;
  return out;
}

/** Lexemes the course teaches (regional forms are notes, not path words). */
export function deliveredLexemes(lexemes: SyntheticLexeme[]): SyntheticLexeme[] {
  return lexemes.filter((l) => l.variety === undefined);
}

export function unitId(u: number): string {
  return `${SCALE_COURSE_ID}:unit-${u + 1}`;
}

/** Unit of the k-th delivered lexeme (an even spread over the 300 units). */
export function unitIndexOf(k: number, delivered: number): number {
  return Math.floor((k * SCALE_UNITS) / delivered);
}

function wordOf(lex: SyntheticLexeme, k: number): Word {
  return { target: lex.surface, native: lex.gloss, emoji: ["🙂", "📘", "🌳", "🍽️", "🧳", "🏙️"][k % 6] };
}

export function syntheticPack(lexemes: SyntheticLexeme[]): Pack {
  const delivered = deliveredLexemes(lexemes);
  const byUnit: { lex: SyntheticLexeme; k: number }[][] = Array.from({ length: SCALE_UNITS }, () => []);
  delivered.forEach((lex, k) => byUnit[unitIndexOf(k, delivered.length)].push({ lex, k }));
  const units: UnitPack[] = byUnit.map((items, u) => {
    const words = items.map(({ lex, k }) => wordOf(lex, k));
    const lessons: LessonPack[] = [];
    const per = Math.ceil(items.length / SCALE_LESSONS_PER_UNIT);
    for (let l = 0; l < SCALE_LESSONS_PER_UNIT; l++) {
      const slice = items.slice(l * per, (l + 1) * per);
      const lessonId = `${SCALE_COURSE_ID}:u${u}-l${l}`;
      const exercises: LessonPack["exercises"] = slice.map(({ lex }, e) => {
        const others = items.filter((x) => x.lex.id !== lex.id).slice(0, 3);
        return {
          type: "select",
          id: `${lessonId}-e${e}`,
          mode: "targetToNative",
          prompt: lex.surface,
          options: [{ text: lex.gloss }, ...others.map((o) => ({ text: o.lex.gloss }))],
          correct: 0,
          gradeTargets: [lex.id],
        };
      });
      if (slice.length >= 2) {
        exercises.push({
          type: "match",
          id: `${lessonId}-e${slice.length}`,
          pairs: slice.slice(0, 4).map(({ lex }) => ({ target: lex.surface, native: lex.gloss })),
          gradeTargets: slice.slice(0, 4).map(({ lex }) => lex.id),
        });
      }
      lessons.push({ id: lessonId, title: `Lesson ${l + 1}`, exercises });
    }
    return {
      id: unitId(u),
      title: `Unit ${u + 1}`,
      description: "Synthetic scale unit.",
      guidebook: "Synthetic.",
      words,
      lessons,
    };
  });
  const sections: SectionPack[] = [];
  for (let s = 0; s * SCALE_UNITS_PER_SECTION < units.length; s++) {
    sections.push({
      id: `${SCALE_COURSE_ID}:section-${s + 1}`,
      title: `Section ${s + 1}`,
      units: units.slice(s * SCALE_UNITS_PER_SECTION, (s + 1) * SCALE_UNITS_PER_SECTION),
    });
  }
  return {
    id: SCALE_COURSE_ID,
    version: 1,
    targetLanguage: "Scaleish",
    targetCode: SCALE_TARGET,
    nativeLanguage: "English",
    nativeCode: SCALE_NATIVE,
    flag: "🏳️",
    audio: { policy: "device-tts", reason: "Synthetic scale course (test-only)." },
    sections,
  };
}

export function syntheticIdRegistry(lexemes: SyntheticLexeme[]): IdRegistry {
  const surfaceToId: Record<string, string> = {};
  const legacySurfaces: Record<string, string> = {};
  for (const lex of lexemes) {
    surfaceToId[lex.surface] = lex.id;
    for (const s of lex.legacySurfaces ?? []) legacySurfaces[s] = lex.id;
  }
  return { language: SCALE_TARGET, prefix: "xx:w:", legacyPrefix: "xx:legacy:", surfaceToId, legacySurfaces };
}

/** The runtime lexicon index, in the shape scripts/lib/lexicon-build.ts buildRuntimeIndex emits. */
export function syntheticLexiconIndex(lexemes: SyntheticLexeme[]): { contentHash: string; entries: LexemeMeta[] } {
  const variants = new Map<string, { region: string; surface: string }[]>();
  for (const lex of lexemes) {
    if (!lex.variety) continue;
    const list = variants.get(lex.variety.equivalent) ?? [];
    list.push({ region: lex.variety.region, surface: lex.surface });
    variants.set(lex.variety.equivalent, list);
  }
  return {
    contentHash: "5ca1e5ca1e5ca1e0",
    entries: lexemes.map((lex) => {
      const entry: LexemeMeta = {
        id: lex.id,
        surface: lex.surface,
        lookupForm: lex.lookupForm,
        lemma: lex.lemma,
        gloss: lex.gloss,
        pos: lex.pos,
      };
      if (lex.gender !== undefined) entry.gender = lex.gender;
      if (lex.topic !== undefined) entry.topic = lex.topic;
      if (lex.frequency !== undefined) entry.band = lex.frequency.band;
      if (lex.pronunciation !== undefined) entry.pronunciation = { ...lex.pronunciation };
      entry.example = { [SCALE_TARGET]: lex.example.target, [SCALE_NATIVE]: lex.example.native };
      if (lex.confusables !== undefined) entry.confusables = [...lex.confusables];
      const regional = variants.get(lex.id);
      if (regional) entry.regionalVariants = regional;
      if (lex.variety) entry.variety = { region: lex.variety.region, equivalent: lex.variety.equivalent };
      return entry;
    }),
  };
}

export function syntheticWebFallback(lexemes: SyntheticLexeme[]): GeneratedLexiconData {
  return {
    contentHash: "5ca1e5ca1e5ca1e0",
    entries: lexemes.map((lex) => ({
      id: lex.id,
      surface: lex.surface,
      lookupForm: lex.lookupForm,
      lemma: lex.lemma,
      gloss: lex.gloss,
      pos: lex.pos,
      ...(lex.gender !== undefined ? { gender: lex.gender } : {}),
      ...(lex.topic !== undefined ? { topic: lex.topic } : {}),
      ...(lex.frequency !== undefined ? { frequency: { ...lex.frequency } } : {}),
      ...(lex.pronunciation !== undefined ? { pronunciation: { ...lex.pronunciation } } : {}),
      examples: [{ [SCALE_TARGET]: lex.example.target, [SCALE_NATIVE]: lex.example.native, source: SCALE_SOURCE_ID }],
      ...(lex.confusables !== undefined ? { confusables: [...lex.confusables] } : {}),
      sourceRefs: [{ source: SCALE_SOURCE_ID }],
    })),
  };
}

/** The daily-words syllabus: every delivered lexeme in delivery order with its unlocking unit. */
export function syntheticDaily(lexemes: SyntheticLexeme[]): { version: number; language: string; level: string; entries: DailyWordEntry[] } {
  const delivered = deliveredLexemes(lexemes);
  return {
    version: 1,
    language: SCALE_TARGET,
    level: "C2",
    entries: delivered.map((lex, k) => ({ id: lex.id, unitId: unitId(unitIndexOf(k, delivered.length)) })),
  };
}

export function syntheticProfile(): CourseProfile {
  return {
    id: SCALE_COURSE_ID,
    targetCode: SCALE_TARGET,
    nativeCode: SCALE_NATIVE,
    targetLanguage: "Scaleish",
    nativeLanguage: "English",
    flag: "🏳️",
    flagAsset: "xx",
    recognitionLocale: "xx-XX",
    ttsLocale: "xx-XX",
    script: "latin",
    idPrefix: "xx:w:",
    legacyIdPrefix: "xx:legacy:",
    capabilities: {
      fsrs: true,
      dailySession: true,
      lexicon: true,
      concepts: false,
      placement: false,
      checkpoints: false,
      goals: false,
      listening: true,
      reading: false,
      speaking: false,
      writing: false,
      conversation: false,
    },
    artifacts: {},
  };
}

const DAY = 86_400_000;

/**
 * A heavy learner ~a quarter of the way through: the first 75 units'
 * lessons completed, ~3,000 FSRS cards (recognition for the first 2,600
 * delivered lexemes, listening for 400 of them) with a spread of
 * stabilities and due dates so a large share is due today, and a word clip
 * for every other learned lexeme.
 */
export function syntheticLearner(lexemes: SyntheticLexeme[], pack: Pack, now: number): {
  cards: Record<string, FsrsCardState>;
  completedLessons: Record<string, true>;
  listenClips: Record<string, string>;
} {
  const rng = scaleRng(SEED ^ 0x1ea7);
  const delivered = deliveredLexemes(lexemes);
  const cards: Record<string, FsrsCardState> = {};
  const card = (): FsrsCardState => {
    const stability = 0.5 + rng() * 60;
    const lastReview = now - Math.floor(rng() * 40 + 1) * DAY;
    return {
      due: lastReview + Math.round(stability * DAY),
      stability,
      difficulty: 1 + rng() * 9,
      scheduled_days: Math.round(stability),
      learning_steps: 0,
      reps: 1 + Math.floor(rng() * 12),
      lapses: Math.floor(rng() * 3),
      state: "review",
      last_review: lastReview,
    };
  };
  const listenClips: Record<string, string> = {};
  delivered.slice(0, 2_600).forEach((lex, k) => {
    cards[`${lex.id}|recognize`] = card();
    if (k % 2 === 0) listenClips[lex.id] = `xx.clip.${lex.id.slice(5)}`;
    if (k < 400) cards[`${lex.id}|listen`] = card();
  });
  const completedLessons: Record<string, true> = {};
  const units = pack.sections.flatMap((s) => s.units);
  for (const unit of units.slice(0, 75)) for (const lesson of unit.lessons) completedLessons[lesson.id] = true;
  return { cards, completedLessons, listenClips };
}

/**
 * ~30 deterministic search queries: one- and two-letter prefixes (the
 * broadest FTS hits), whole target words, glosses, multi-token and
 * accented queries, and misses.
 */
export function syntheticQueries(lexemes: SyntheticLexeme[]): string[] {
  const rng = scaleRng(SEED ^ 0x9e3);
  const at = () => lexemes[Math.floor(rng() * lexemes.length)];
  const queries = ["t", "k", "s", "ka", "ki", "th", "to", "the", "mi", "zé", "xyzzy", "qqq"];
  for (let i = 0; i < 6; i++) queries.push(at().lemma);
  for (let i = 0; i < 4; i++) queries.push(at().gloss);
  for (let i = 0; i < 3; i++) queries.push(at().surface);
  for (let i = 0; i < 3; i++) queries.push(at().lemma.slice(0, 3));
  queries.push(`the ${at().gloss.split(" ").pop() ?? ""}`, "ka the");
  return queries;
}

/** p-th percentile (nearest-rank) of a sample. */
export function percentile(samples: number[], p: number): number {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)];
}
