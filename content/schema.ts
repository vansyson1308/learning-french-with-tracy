/**
 * Content-pack schemas — the validation source of truth for content/courses/.
 * Mirrors src/lib/types.ts exactly (that file's header has pointed here since
 * the original, unpublished pipeline). Strict objects: an unknown field in
 * source content is a typo until proven otherwise.
 *
 * `gradeTargets` is emitted by the compiler (never authored): the stable
 * lexeme ids an exercise unambiguously assesses. Phase 2 only emits it where
 * ambiguity is zero; the runtime keeps its conservative interim rule.
 */

import { z } from "zod";

const id = z.string().min(1);

export const WordSchema = z.strictObject({
  target: z.string().min(1),
  native: z.string().min(1),
  emoji: z.string().min(1),
  romanization: z.string().min(1).optional(),
});

const gradeTargets = z.array(z.string().min(1)).min(1).optional();

export const SelectExerciseSchema = z.strictObject({
  type: z.literal("select"),
  id,
  mode: z.enum(["targetToNative", "nativeToTarget", "listen"]),
  prompt: z.string(),
  audioTarget: z.string().min(1).optional(),
  options: z
    .array(z.strictObject({ text: z.string().min(1), emoji: z.string().optional() }))
    .min(2),
  correct: z.number().int().min(0),
  gradeTargets,
});

export const WordBankExerciseSchema = z.strictObject({
  type: z.literal("wordBank"),
  id,
  direction: z.enum(["targetToNative", "nativeToTarget"]),
  prompt: z.string(),
  audioTarget: z.string().min(1).optional(),
  tokens: z.array(z.string().min(1)).min(1),
  answer: z.array(z.string().min(1)).min(1),
  gradeTargets,
});

export const MatchExerciseSchema = z.strictObject({
  type: z.literal("match"),
  id,
  pairs: z
    .array(z.strictObject({ target: z.string().min(1), native: z.string().min(1) }))
    .min(2),
  gradeTargets,
});

export const TypeAnswerExerciseSchema = z.strictObject({
  type: z.literal("typeAnswer"),
  id,
  mode: z.enum(["translate", "listen"]),
  prompt: z.string(),
  audioTarget: z.string().min(1).optional(),
  answer: z.string().min(1),
  alternatives: z.array(z.string()),
  gradeTargets,
});

export const FillBlankExerciseSchema = z.strictObject({
  type: z.literal("fillBlank"),
  id,
  sentence: z.string().min(1),
  translation: z.string().min(1),
  audioTarget: z.string().min(1).optional(),
  options: z.array(z.string().min(1)).min(2),
  correct: z.number().int().min(0),
  gradeTargets,
});

export const ExerciseSchema = z.discriminatedUnion("type", [
  SelectExerciseSchema,
  WordBankExerciseSchema,
  MatchExerciseSchema,
  TypeAnswerExerciseSchema,
  FillBlankExerciseSchema,
]);

export const LessonSchema = z.strictObject({
  id,
  title: z.string().min(1),
  exercises: z.array(ExerciseSchema).min(1),
});

export const UnitSchema = z.strictObject({
  id,
  title: z.string().min(1),
  description: z.string(),
  guidebook: z.string(),
  words: z.array(WordSchema).min(1),
  lessons: z.array(LessonSchema).min(1),
});

export const SectionSchema = z.strictObject({
  id,
  title: z.string().min(1),
  units: z.array(UnitSchema).min(1),
});

export const PackSchema = z.strictObject({
  id,
  version: z.number().int().min(1),
  targetLanguage: z.string().min(1),
  targetCode: z.string().min(2),
  nativeLanguage: z.string().min(1),
  nativeCode: z.string().min(2),
  flag: z.string().min(1),
  sections: z.array(SectionSchema).min(1),
});
export type PackSource = z.infer<typeof PackSchema>;

export const CatalogSchema = z.strictObject({
  version: z.number().int().min(1),
  courses: z.array(
    z.strictObject({
      id,
      targetLanguage: z.string().min(1),
      targetCode: z.string().min(2),
      nativeLanguage: z.string().min(1),
      flag: z.string().min(1),
      unitCount: z.number().int().min(1),
      lessonCount: z.number().int().min(1),
    })
  ),
});

/** content/fr/lexemes.json: surface → stable lexeme id (fr:w:<slug>). */
export const FrLexemeMapSchema = z.record(
  z.string().min(1),
  z.string().regex(/^fr:w:[a-z0-9-]+$/)
);

const LICENSE_ALLOWLIST = [
  "MIT",
  "Apache-2.0",
  "CC-BY-4.0",
  "CC-BY-SA-4.0",
  "CC-BY-2.0-FR",
  "CC0-1.0",
  "original",
] as const;
export const ALLOWED_LICENSES: readonly string[] = LICENSE_ALLOWLIST;

/**
 * content/sources/registry.json — provenance registry. Every content/audio
 * path must be covered by a registered source with an allowlisted license;
 * a source whose exact redistribution terms are ambiguous cannot be
 * registered, so its data cannot be ingested. That is the gate, by design.
 */
export const SourceRegistrySchema = z.strictObject({
  sources: z
    .array(
      z.strictObject({
        id,
        name: z.string().min(1),
        kind: z.string().min(1),
        license: z.enum(LICENSE_ALLOWLIST),
        url: z.string().min(1),
        attribution: z.string().min(1),
        retrievedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        covers: z.array(z.string().min(1)).min(1),
        notes: z.string().optional(),
      })
    )
    .min(1),
});
export type SourceRegistry = z.infer<typeof SourceRegistrySchema>;
