/**
 * Phase 5B pedagogy pipeline (per target language since P1c): concepts
 * source loading, validation, lesson flow integrity, paradigm (grammar
 * table) evidence, and the compiled runtime artifact. The concepts file is
 * authored (clean-room facts with registered sourceRefs); the compiler
 * emits a keyed runtime artifact — native text resolved for the course's
 * nativeCode — so the app resolves concept content by id without shipping
 * validation machinery.
 */

import { existsSync } from "fs";

import {
  paradigmTablesSchema,
  pedagogyConceptsSchema,
  type Concept,
  type PackSource,
  type ParadigmTable,
  type ParadigmTables,
  type PedagogyConcepts,
} from "../../content/schema";
import { buildPlugin, type BuildLanguagePlugin, type MorphVerb } from "./languages";
import { localizeConcept } from "./native-text";
import { canonicalJson, loadPacks, loadRegistry, readJson, safeResolve, targetCodeOf, targetLayers, type LoadedPack, type ValidationResult } from "./pipeline";

export function conceptsSourcePath(lang: string): string {
  return `content/${lang}/pedagogy/concepts.json`;
}
export function paradigmsSourcePath(lang: string): string {
  return `content/${lang}/pedagogy/paradigms.json`;
}

export function loadPedagogyConcepts(lang: string): PedagogyConcepts | null {
  const rel = conceptsSourcePath(lang);
  if (!existsSync(safeResolve(rel))) return null;
  const doc = pedagogyConceptsSchema(lang).parse(readJson(rel));
  if (doc.language !== lang) throw new Error(`${rel}: language "${doc.language}" ≠ folder "${lang}"`);
  return doc;
}

/** Paradigm tables, parsed against the plugin's cell vocabulary; null when not authored. */
export function loadParadigms(lang: string, plugin: BuildLanguagePlugin = buildPlugin(lang)): ParadigmTables | null {
  const rel = paradigmsSourcePath(lang);
  if (!existsSync(safeResolve(rel))) return null;
  if (!plugin.paradigm) {
    throw new Error(`${rel}: ${lang} declares no paradigm cells (scripts/lib/languages/${lang}.ts) — remove the file or declare the vocabulary`);
  }
  const doc = paradigmTablesSchema(plugin.paradigm.cellIds).parse(readJson(rel));
  if (doc.language !== lang) throw new Error(`${rel}: language "${doc.language}" ≠ folder "${lang}"`);
  return doc;
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
    for (const [code, title] of Object.entries(concept.title)) {
      if (/\b[ABC][12]\b/.test(title) || /\bCEFR\b/i.test(title)) {
        err(`${concept.id}: learner-facing title (${code}) must not carry CEFR labels`);
      }
    }
  }
  return { errors, warnings: [] };
}

/**
 * Lesson-flow integrity over every pack: a flow may reorder and interleave
 * but never drop, duplicate, or invent graded work, and every concept it
 * references must exist. Concept steps need authored pedagogy — only a
 * course whose target language has it may carry flows that reference them.
 */
export function validateLessonFlows(input: {
  packs: { courseId: string; pack: PackSource }[];
  conceptIds: Set<string>;
}): ValidationResult {
  const errors: string[] = [];
  const err = (m: string) => errors.push(`lesson-flow: ${m}`);
  for (const { courseId, pack } of input.packs) {
    const targetCode = pack.targetCode ?? targetCodeOf(courseId);
    for (const section of pack.sections) {
      for (const unit of section.units) {
        for (const lesson of unit.lessons) {
          if (!lesson.flow) continue;
          const where = `${courseId}/${lesson.id}`;
          const exerciseIds = new Set(lesson.exercises.map((e) => e.id));
          const seenExercises = new Set<string>();
          for (const entry of lesson.flow) {
            if ("concept" in entry) {
              if (!targetLayers(targetCode).pedagogy) {
                err(`${where}: concept steps need authored pedagogy (content/${targetCode}/pedagogy) — not available for ${courseId}`);
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

/**
 * §26 consumption contract, enforced through the language plugin: every
 * authored paradigm cell must be EVIDENCED by the registered evidence rows
 * — a row of the same lemma whose orthographic form matches the cell's
 * value and whose analysis set carries an atom the plugin accepts for that
 * cell. Groups must be plugin-declared, required attributes present, and
 * the plugin's own group rules (e.g. the French regular -er paradigm) hold.
 */
export function validateParadigmsData(input: {
  paradigms: ParadigmTables;
  plugin: BuildLanguagePlugin;
  /** null = the evidence derivation has not been committed yet. */
  evidence: MorphVerb[] | null;
  registryIds: Set<string>;
}): ValidationResult {
  const errors: string[] = [];
  const err = (m: string) => errors.push(`paradigms: ${m}`);
  const spec = input.plugin.paradigm;
  if (!spec) {
    err(`${input.plugin.code} declares no paradigm cell vocabulary`);
    return { errors, warnings: [] };
  }
  const byLemma = new Map((input.evidence ?? []).map((v) => [v.lemma, v]));

  const seen = new Set<string>();
  for (const table of input.paradigms.tables) {
    if (seen.has(table.lemma)) err(`duplicate table ${table.lemma}`);
    seen.add(table.lemma);
    if (!spec.groups.includes(table.group)) {
      err(`${table.lemma}: group "${table.group}" is not one of ${spec.groups.join(", ")}`);
    }
    if (table.evidence.source !== spec.evidenceSource) {
      err(`${table.lemma}: evidence source "${table.evidence.source}" must be ${spec.evidenceSource} for ${input.plugin.code}`);
    }
    if (!input.registryIds.has(table.evidence.source)) {
      err(`${table.lemma}: evidence source "${table.evidence.source}" is not registered`);
    }
    for (const [key, allowed] of Object.entries(spec.attributes ?? {})) {
      const value = table.attributes?.[key];
      if (value === undefined) err(`${table.lemma}: attribute "${key}" is required (${allowed.join(" | ")})`);
      else if (!allowed.includes(value)) err(`${table.lemma}: attribute ${key} = "${value}" is not one of ${allowed.join(", ")}`);
    }
    for (const key of Object.keys(table.attributes ?? {})) {
      if (!(key in (spec.attributes ?? {}))) err(`${table.lemma}: unknown attribute "${key}"`);
    }
    if (input.evidence === null) {
      err(`${table.lemma}: no committed evidence rows for ${spec.evidenceSource} — derive the morphology first`);
      continue;
    }
    const evidence = byLemma.get(table.lemma);
    if (!evidence || evidence.rows.length === 0) {
      err(`${table.lemma}: no verb-morphology evidence rows — extend the derive verb list first`);
      continue;
    }
    for (const cell of spec.cellIds) {
      const form = table.cells[cell];
      if (form === undefined) {
        err(`${table.lemma}: cell ${cell} is missing — tables must be complete`);
        continue;
      }
      const evidenced = evidence.rows.some(
        (row) => row.mot === form && row.infoVer.split(",").some((atom) => spec.cellEvidencedBy(cell, atom))
      );
      if (!evidenced) {
        err(`${table.lemma}: cell ${cell} = "${form}" is not evidenced by the ${spec.evidenceSource} morphology rows`);
      }
    }
    spec.groupRules?.(table, err);
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
  /** lang → tables (null when the language authors none). */
  paradigmsByLang: Record<string, ParadigmTables | null>;
}): ValidationResult {
  const errors: string[] = [];
  const err = (m: string) => errors.push(`conjugation-cloze: ${m}`);
  for (const { courseId, pack } of input.packs) {
    const targetCode = pack.targetCode ?? targetCodeOf(courseId);
    const tables = input.paradigmsByLang[targetCode] ?? null;
    const byLemma = new Map<string, ParadigmTable>((tables?.tables ?? []).map((t) => [t.lemma, t]));
    const cellIds = buildPlugin(targetCode).paradigm?.cellIds ?? [];
    for (const section of pack.sections)
      for (const unit of section.units)
        for (const lesson of unit.lessons)
          for (const e of lesson.exercises) {
            if (e.type !== "conjugationCloze") continue;
            const where = `${courseId}/${e.id}`;
            if (!targetLayers(targetCode).pedagogy) {
              err(`${where}: conjugationCloze needs authored pedagogy (content/${targetCode}/pedagogy) — not available for ${courseId}`);
              continue;
            }
            if (!cellIds.includes(e.cell)) {
              err(`${where}: cell "${e.cell}" is not a ${targetCode} paradigm cell (${cellIds.join(", ") || "none declared"})`);
            }
            const verb = byLemma.get(e.verb);
            if (!verb) {
              err(`${where}: verb ${e.verb} has no authored paradigm table`);
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

/** Disk-reading wrapper for the CLIs: concepts + flow integrity + paradigms, for one target language. */
export function validatePedagogy(lang: string, packs: LoadedPack[] = loadPacks()): ValidationResult {
  if (!targetLayers(lang).pedagogy) return { errors: [], warnings: [] };
  const plugin = buildPlugin(lang);
  let concepts: PedagogyConcepts | null;
  try {
    concepts = loadPedagogyConcepts(lang);
  } catch (e) {
    return {
      errors: [`pedagogy: ${conceptsSourcePath(lang)} failed schema validation — ${(e as Error).message.split("\n")[0]}`],
      warnings: [],
    };
  }
  if (concepts === null) {
    return { errors: [`pedagogy: content/${lang}/pedagogy exists but has no concepts.json`], warnings: [] };
  }
  const registryIds = new Set(loadRegistry().sources.map((s) => s.id));
  const conceptResult = validatePedagogyData({ concepts, registryIds });
  // Packs that fail their own schema are reported by validateContent; the
  // flow check simply skips them here. Flows/clozes are checked for the
  // packs of THIS target only.
  const mine = packs.filter((p) => p.pack.targetCode === lang);
  const flowResult = validateLessonFlows({
    packs: mine,
    conceptIds: new Set(concepts.concepts.map((c) => c.id)),
  });

  let paradigms: ParadigmTables | null;
  try {
    paradigms = loadParadigms(lang, plugin);
  } catch (e) {
    return {
      errors: [
        ...conceptResult.errors,
        ...flowResult.errors,
        `paradigms: ${paradigmsSourcePath(lang)} failed schema validation — ${(e as Error).message.split("\n")[0]}`,
      ],
      warnings: [],
    };
  }
  const paradigmResult =
    paradigms === null
      ? { errors: [] as string[] }
      : validateParadigmsData({ paradigms, plugin, evidence: plugin.paradigm?.loadEvidence() ?? null, registryIds });
  const clozeResult = validateConjugationClozes({ packs: mine, paradigmsByLang: { [lang]: paradigms } });

  return {
    errors: [
      ...conceptResult.errors,
      ...flowResult.errors,
      ...paradigmResult.errors,
      ...clozeResult.errors,
    ],
    warnings: [],
  };
}

/** The compiled runtime artifact: concepts keyed by id, authored order kept, native text resolved. */
export function compileConceptsArtifact(concepts: PedagogyConcepts, nativeCode: string): string {
  const byId: Record<string, unknown> = {};
  for (const concept of concepts.concepts) byId[concept.id] = localizeConcept(concept, concepts.language, nativeCode);
  return canonicalJson({
    version: concepts.version,
    language: concepts.language,
    order: concepts.concepts.map((c: Concept) => c.id),
    byId,
  });
}
