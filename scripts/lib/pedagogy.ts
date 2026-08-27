/**
 * Phase 5B pedagogy pipeline: concepts source loading, validation, lesson
 * flow integrity, and the compiled runtime artifact. The concepts file is
 * authored (clean-room facts with registered sourceRefs); the compiler
 * emits a keyed runtime artifact so the app resolves concept content by id
 * without shipping validation machinery.
 */

import {
  CONJUGATION_CELLS,
  ConjugationsSchema,
  PackSchema,
  PedagogyConceptsSchema,
  type Concept,
  type Conjugations,
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

export const CONJUGATIONS_SOURCE = "content/fr/pedagogy/conjugations.json";

export function loadConjugations(): Conjugations {
  return ConjugationsSchema.parse(readJson(CONJUGATIONS_SOURCE));
}

type MorphVerb = {
  lemma: string;
  rows: { mot: string; infoVer: string }[];
};

/**
 * §26 consumption contract, enforced: every authored conjugation cell must
 * be EVIDENCED by the committed Lexique 4 verb-morphology rows — a row of
 * the same lemma whose orthographic form matches the cell's value and
 * whose analysis set carries the cell's mood:tense:person atom (row-level
 * number is documented as noisy and never gates). Regular -er verbs must
 * additionally follow the written paradigm they claim to teach.
 */
export function validateConjugationsData(input: {
  conjugations: Conjugations;
  morphologyVerbs: MorphVerb[];
}): ValidationResult {
  const errors: string[] = [];
  const err = (m: string) => errors.push(`conjugations: ${m}`);
  const byLemma = new Map(input.morphologyVerbs.map((v) => [v.lemma, v]));

  const atomFor = (cell: string): ((atom: string) => boolean) => {
    if (cell === "inf") return (a) => a === "inf";
    if (cell === "participle") return (a) => a.startsWith("par:pas");
    const person = cell.slice(4, 5); // "pre:1s" → "1"
    return (a) => a === `ind:pre:${person}`;
  };

  const seen = new Set<string>();
  for (const verb of input.conjugations.verbs) {
    if (seen.has(verb.lemma)) err(`duplicate verb ${verb.lemma}`);
    seen.add(verb.lemma);
    const evidence = byLemma.get(verb.lemma);
    if (!evidence || evidence.rows.length === 0) {
      err(`${verb.lemma}: no verb-morphology evidence rows — extend the derive verb list first`);
      continue;
    }
    for (const cell of CONJUGATION_CELLS) {
      const form = verb.cells[cell];
      if (form === undefined) {
        err(`${verb.lemma}: cell ${cell} is missing — tables must be complete`);
        continue;
      }
      const matches = atomFor(cell);
      const evidenced = evidence.rows.some(
        (row) => row.mot === form && row.infoVer.split(",").some(matches)
      );
      if (!evidenced) {
        err(`${verb.lemma}: cell ${cell} = "${form}" is not evidenced by the Lexique 4 morphology rows`);
      }
    }
    if (verb.group === "er-regular") {
      const first = verb.cells["pre:1s"];
      const stemEz = verb.cells.inf?.endsWith("er") ? `${verb.cells.inf.slice(0, -2)}ez` : undefined;
      if (first !== undefined) {
        if (verb.cells["pre:2s"] !== `${first}s`) err(`${verb.lemma}: er-regular 2s must be 1s + s`);
        if (verb.cells["pre:3s"] !== first) err(`${verb.lemma}: er-regular 3s must equal 1s`);
        if (verb.cells["pre:3p"] !== `${first}nt`) err(`${verb.lemma}: er-regular 3p must be 1s + nt`);
      }
      if (stemEz !== undefined && verb.cells["pre:2p"] !== stemEz) {
        err(`${verb.lemma}: er-regular 2p must be stem + ez`);
      }
    }
  }
  return { errors, warnings: [] };
}

/**
 * Pack ↔ tables ↔ evidence chain for conjugationCloze exercises: the
 * expected answer must be exactly the named verb's authored cell (which is
 * itself evidence-verified above), so no drill can ever teach a form the
 * data does not support.
 */
export function validateConjugationClozes(input: {
  packs: { courseId: string; pack: PackSource }[];
  conjugations: Conjugations;
}): ValidationResult {
  const errors: string[] = [];
  const err = (m: string) => errors.push(`conjugation-cloze: ${m}`);
  const byLemma = new Map(input.conjugations.verbs.map((v) => [v.lemma, v]));
  for (const { courseId, pack } of input.packs) {
    for (const section of pack.sections)
      for (const unit of section.units)
        for (const lesson of unit.lessons)
          for (const e of lesson.exercises) {
            if (e.type !== "conjugationCloze") continue;
            const where = `${courseId}/${e.id}`;
            if (courseId !== "fr-en") {
              err(`${where}: conjugationCloze is French pedagogy — not available for ${courseId}`);
              continue;
            }
            const verb = byLemma.get(e.verb);
            if (!verb) {
              err(`${where}: verb ${e.verb} has no authored conjugation table`);
              continue;
            }
            const expected = verb.cells[e.cell];
            if (expected !== e.answer) {
              err(`${where}: answer "${e.answer}" ≠ authored cell ${e.cell} = "${expected}"`);
            }
            if (!e.sentence.includes("___")) err(`${where}: sentence has no ___ blank`);
            if (e.alternatives.includes(e.answer)) err(`${where}: answer duplicated in alternatives`);
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

  let conjugations: Conjugations;
  try {
    conjugations = loadConjugations();
  } catch (e) {
    return {
      errors: [
        ...conceptResult.errors,
        ...flowResult.errors,
        `conjugations: conjugations.json failed schema validation — ${(e as Error).message.split("\n")[0]}`,
      ],
      warnings: [],
    };
  }
  const morphology = readJson("content/fr/lexicon/derived/verb-morphology.json") as {
    verbs: { lemma: string; rows: { mot: string; infoVer: string }[] }[];
  };
  const conjResult = validateConjugationsData({
    conjugations,
    morphologyVerbs: morphology.verbs,
  });
  const clozeResult = validateConjugationClozes({ packs, conjugations });

  return {
    errors: [
      ...conceptResult.errors,
      ...flowResult.errors,
      ...conjResult.errors,
      ...clozeResult.errors,
    ],
    warnings: [],
  };
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
