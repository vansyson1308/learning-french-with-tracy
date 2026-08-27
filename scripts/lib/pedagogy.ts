/**
 * Phase 5B pedagogy pipeline: concepts source loading, validation, lesson
 * flow integrity, and the compiled runtime artifact. The concepts file is
 * authored (clean-room facts with registered sourceRefs); the compiler
 * emits a keyed runtime artifact so the app resolves concept content by id
 * without shipping validation machinery.
 */

import {
  PackSchema,
  PedagogyConceptsSchema,
  type Concept,
  type PackSource,
  type PedagogyConcepts,
} from "../../content/schema";
import {
  canonicalJson,
  listCourseSources,
  loadRegistry,
  readJson,
  type ValidationResult,
} from "./pipeline";

export const CONCEPTS_SOURCE = "content/fr/pedagogy/concepts.json";
export const CONCEPTS_ARTIFACT = "src/content/concepts/fr-concepts.json";

export function loadPedagogyConcepts(): PedagogyConcepts {
  return PedagogyConceptsSchema.parse(readJson(CONCEPTS_SOURCE));
}

/** Pure rule engine over the authored concepts (schema already enforced). */
export function validatePedagogyData(input: {
  concepts: PedagogyConcepts;
  registryIds: Set<string>;
}): ValidationResult {
  const errors: string[] = [];
  const err = (m: string) => errors.push(`pedagogy: ${m}`);
  const seen = new Set<string>();
  for (const concept of input.concepts.concepts) {
    if (seen.has(concept.id)) err(`duplicate concept id ${concept.id}`);
    seen.add(concept.id);
    for (const ref of concept.sourceRefs) {
      if (!input.registryIds.has(ref.source)) {
        err(`${concept.id}: source "${ref.source}" is not registered`);
      }
    }
    // The program forbids CEFR labels in learner-facing pedagogy titles.
    if (/\b[ABC][12]\b/.test(concept.title) || /\bCEFR\b/i.test(concept.title)) {
      err(`${concept.id}: learner-facing title must not carry CEFR labels`);
    }
  }
  return { errors, warnings: [] };
}

/**
 * Lesson-flow integrity over every pack: a flow may reorder and interleave
 * but never drop, duplicate, or invent graded work, and every concept it
 * references must exist. Concept steps are French pedagogy — only the
 * French course may carry flows that reference them.
 */
export function validateLessonFlows(input: {
  packs: { courseId: string; pack: PackSource }[];
  conceptIds: Set<string>;
}): ValidationResult {
  const errors: string[] = [];
  const err = (m: string) => errors.push(`lesson-flow: ${m}`);
  for (const { courseId, pack } of input.packs) {
    for (const section of pack.sections) {
      for (const unit of section.units) {
        for (const lesson of unit.lessons) {
          if (!lesson.flow) continue;
          const where = `${courseId}/${lesson.id}`;
          const exerciseIds = new Set(lesson.exercises.map((e) => e.id));
          const seenExercises = new Set<string>();
          for (const entry of lesson.flow) {
            if ("concept" in entry) {
              if (courseId !== "fr-en") {
                err(`${where}: concept steps are French pedagogy — not available for ${courseId}`);
              }
              if (!input.conceptIds.has(entry.concept)) {
                err(`${where}: flow references unknown concept ${entry.concept}`);
              }
            } else {
              if (!exerciseIds.has(entry.exercise)) {
                err(`${where}: flow references missing exercise ${entry.exercise}`);
              }
              if (seenExercises.has(entry.exercise)) {
                err(`${where}: flow lists exercise ${entry.exercise} more than once`);
              }
              seenExercises.add(entry.exercise);
            }
          }
          for (const id of exerciseIds) {
            if (!seenExercises.has(id)) {
              err(`${where}: flow drops exercise ${id} — a flow must carry every graded exercise`);
            }
          }
        }
      }
    }
  }
  return { errors, warnings: [] };
}

/** Disk-reading wrapper for the CLIs: concepts + flow integrity together. */
export function validatePedagogy(): ValidationResult {
  let concepts: PedagogyConcepts;
  try {
    concepts = loadPedagogyConcepts();
  } catch (e) {
    return {
      errors: [`pedagogy: concepts.json failed schema validation — ${(e as Error).message.split("\n")[0]}`],
      warnings: [],
    };
  }
  const registryIds = new Set(loadRegistry().sources.map((s) => s.id));
  const conceptResult = validatePedagogyData({ concepts, registryIds });
  // Packs that fail their own schema are reported by validateContent; the
  // flow check simply skips them here.
  const packs: { courseId: string; pack: PackSource }[] = [];
  for (const file of listCourseSources()) {
    const parsed = PackSchema.safeParse(readJson(`content/courses/${file}`));
    if (parsed.success) packs.push({ courseId: file.replace(/\.json$/, ""), pack: parsed.data });
  }
  const flowResult = validateLessonFlows({
    packs,
    conceptIds: new Set(concepts.concepts.map((c) => c.id)),
  });
  return { errors: [...conceptResult.errors, ...flowResult.errors], warnings: [] };
}

/** The compiled runtime artifact: concepts keyed by id, authored order kept. */
export function compileConceptsArtifact(concepts: PedagogyConcepts): string {
  const byId: Record<string, Concept> = {};
  for (const concept of concepts.concepts) byId[concept.id] = concept;
  return canonicalJson({
    version: concepts.version,
    language: concepts.language,
    order: concepts.concepts.map((c) => c.id),
    byId,
  });
}
