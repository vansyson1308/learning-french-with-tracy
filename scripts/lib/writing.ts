/**
 * Written-production content pipeline (P9 §13-§23; per target language
 * since P1c).
 *
 * Source of truth: content/<lang>/writing/tasks.json (WritingTasksSchema).
 * Pack/checkpoint/capstone exercises EMBED task fields and must mirror
 * them byte-for-byte (the speech-item discipline) in the course's native
 * language. The compiled runtime artifact excludes reserved assessment
 * tasks and carries the deterministic known-vocabulary token set the
 * rubric engine's plausibility floor uses — built from the language
 * plugin's function words and number speller, the rich lexicon, and the
 * paradigm tables.
 */

import { existsSync } from "fs";
import { translateMessage } from "../../src/lib/i18n/translate";

import {
  writingTasksSchema,
  type CourseObjectives,
  type ParadigmTables,
  type RichLexicon,
  type WritingTask,
  type WritingTasks,
} from "../../content/schema";
import {
  evaluateGuidedWriting,
  evaluateSimpleForm,
  normalizeWritten,
} from "../../src/lib/writing/rubric";
import { buildPlugin, type BuildLanguagePlugin } from "./languages";
import { localizeRubric, localizeWritingTask, type LocalizedWritingTask } from "./native-text";
import { canonicalJson, readJson, safeResolve, type ValidationResult } from "./pipeline";

export function writingSourcePath(lang: string): string {
  return `content/${lang}/writing/tasks.json`;
}

export function loadWritingTasks(lang: string): WritingTasks | null {
  const rel = writingSourcePath(lang);
  if (!existsSync(safeResolve(rel))) return null;
  const doc = writingTasksSchema(lang).parse(readJson(rel));
  if (doc.language !== lang) throw new Error(`${rel}: language "${doc.language}" ≠ folder "${lang}"`);
  return doc;
}

/**
 * Deterministic known-vocabulary token set of a target language: the
 * plugin's function words, number words 0-100 (when a verified speller
 * exists), curated lexeme surfaces/lemmas/lookup forms, their example
 * sentences, and every taught paradigm cell — all normalized exactly as
 * the rubric engine normalizes learner text.
 */
export function buildKnownVocabulary(input: {
  plugin: BuildLanguagePlugin;
  lexicon: RichLexicon | null;
  paradigms: ParadigmTables | null;
}): string[] {
  const { plugin } = input;
  const out = new Set<string>();
  const add = (text: string) => {
    for (const token of normalizeWritten(text, plugin.rules).split(" ")) {
      if (token.length > 0) out.add(token);
    }
  };

  for (const word of plugin.functionWords) add(word);
  if (plugin.numberWords) for (let n = 0; n <= 100; n++) add(plugin.numberWords(n));

  for (const lexeme of input.lexicon?.lexemes ?? []) {
    add(lexeme.surface);
    add(lexeme.lemma);
    add(lexeme.lookupForm);
    for (const example of lexeme.examples ?? []) add(example.target);
  }

  for (const table of input.paradigms?.tables ?? []) {
    for (const form of Object.values(table.cells)) add(form);
  }

  return [...out].sort();
}

/**
 * Runtime artifact: src/content/writing/<lang>-writing.json. Always
 * emitted; reserved tasks excluded by construction. `knownVocabularyKey`
 * is the artifact field name of the token set — "knownVocabulary", except
 * where a language's shipped artifact predates P1c and is golden-pinned
 * under its historical name (the French plugin declares "knownFrench").
 */
export function compileWritingArtifact(input: {
  writing: WritingTasks | null;
  nativeCode: string;
  knownVocabulary: string[];
  knownVocabularyKey?: string;
}): string {
  const tasks = (input.writing?.tasks ?? []).filter((task) => !task.reserved);
  const byId: Record<string, unknown> = {};
  for (const source of tasks) {
    const task = localizeWritingTask(source, input.nativeCode);
    byId[task.id] = {
      id: task.id,
      taskFamily: task.taskFamily,
      mode: task.mode,
      instruction: task.instruction,
      ...(task.cueFacts ? { cueFacts: task.cueFacts } : {}),
      ...(task.formFields ? { formFields: task.formFields } : {}),
      rubric: task.rubric,
      modelAnswers: task.modelAnswers,
      objectiveRefs: task.objectiveRefs,
      lexemeRefs: task.lexemeRefs,
      scoredEligibility: task.scoredEligibility,
    };
  }
  return canonicalJson({
    generator: "scripts/lib/writing.ts",
    version: 1,
    order: tasks.map((task) => task.id),
    byId,
    [input.knownVocabularyKey ?? "knownVocabulary"]: input.knownVocabulary,
  });
}

type GuidedWritingExercise = {
  type: "guidedWriting";
  id: string;
  writingTaskId: string;
  writingMode: "guided" | "open";
  instruction: string;
  cueFacts?: { label: string; value: string }[];
  rubric: LocalizedWritingTask["rubric"];
  modelAnswers: string[];
  objectiveTargets?: string[];
};
type SimpleFormExercise = {
  type: "simpleForm";
  id: string;
  writingTaskId: string;
  instruction: string;
  fields: { id: string; label: string; slotId: string }[];
  rubric: LocalizedWritingTask["rubric"];
  modelAnswers: string[];
  objectiveTargets?: string[];
};
export type WritingExercise = GuidedWritingExercise | SimpleFormExercise;

export type PackForWriting = {
  nativeCode: string;
  sections: {
    units: { lessons: { exercises: { type: string }[] }[] }[];
  }[];
};

function promptTextOf(task: LocalizedWritingTask): string {
  return [
    task.instruction,
    ...(task.cueFacts ?? []).flatMap((cue) => [cue.label, cue.value]),
  ].join(" ");
}

export function validateWriting(input: {
  lang: string;
  writing: WritingTasks | null;
  objectives: CourseObjectives | null;
  lexemeIds: Set<string>;
  /** The token set the rubric floor accepts (buildKnownVocabulary). */
  knownVocabulary: ReadonlySet<string>;
  /** Native codes the tasks must be checked in (every course of the language). */
  nativeCodes?: string[];
  /** Course packs: embedded writing-exercise fields must mirror tasks. */
  packs?: PackForWriting[];
  /** Writing exercises from scored banks — must mirror RESERVED tasks. */
  assessmentWriting?: { nativeCode: string; exercises: WritingExercise[] }[];
  plugin?: BuildLanguagePlugin;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const err = (m: string) => errors.push(`writing: ${m}`);
  if (input.writing === null) return { errors, warnings };
  const plugin = input.plugin ?? buildPlugin(input.lang);
  const rules = plugin.rules;
  const norm = (text: string) => normalizeWritten(text, rules);
  const nativeCodes =
    input.nativeCodes ?? [...new Set((input.packs ?? []).map((p) => p.nativeCode))].sort();

  const knownObjectives = new Set(
    (input.objectives?.objectives ?? []).map((objective) => objective.id)
  );

  const byId = new Map<string, WritingTask>();
  for (const task of input.writing.tasks) {
    if (byId.has(task.id)) err(`duplicate task id ${task.id}`);
    byId.set(task.id, task);

    // --- construct rules (§15) -----------------------------------------
    if (task.mode === "open" && task.scoredEligibility) {
      err(`${task.id}: open practice tasks can never be scored-eligible`);
    }
    if (task.reserved && task.mode !== "guided") {
      err(`${task.id}: reserved assessment tasks must be guided`);
    }
    if (task.reserved && !task.scoredEligibility) {
      err(`${task.id}: reserved tasks exist only for scoring`);
    }
    if (task.taskFamily === "simple_form") {
      if (!task.formFields) err(`${task.id}: simple_form requires formFields`);
    } else if (task.formFields) {
      err(`${task.id}: formFields only belong to simple_form tasks`);
    }

    // --- rubric sanity --------------------------------------------------
    const slotIds = new Set<string>();
    for (const slot of task.rubric.requiredSlots) {
      if (slotIds.has(slot.id)) err(`${task.id}: duplicate slot id ${slot.id}`);
      slotIds.add(slot.id);
      const normalized = slot.variants.map(norm);
      normalized.forEach((v, i) => {
        if (v.length === 0) err(`${task.id}/${slot.id}: variants[${i}] normalizes to nothing`);
      });
      if (new Set(normalized).size !== normalized.length) {
        err(`${task.id}/${slot.id}: duplicate variants after normalization`);
      }
    }
    if (task.rubric.minTokens >= task.rubric.maxTokens) {
      err(`${task.id}: minTokens must be < maxTokens`);
    }
    for (const field of task.formFields ?? []) {
      if (!slotIds.has(field.slotId)) {
        err(`${task.id}: field ${field.id} references unknown slot ${field.slotId}`);
      }
    }

    // Per native language: answer-leak rule and model-answer self-consistency.
    for (const nativeCode of nativeCodes) {
      let localized: LocalizedWritingTask;
      try {
        localized = localizeWritingTask(task, nativeCode);
      } catch (e) {
        err((e as Error).message);
        continue;
      }
      // --- answer-leak rule --------------------------------------------
      // Un-cued slot content appearing in the prompt hands the learner the
      // answer; cue-provided facts (names, cities, numbers) are legitimate.
      const promptFolded = ` ${norm(promptTextOf(localized))} `;
      for (const slot of task.rubric.requiredSlots) {
        if (slot.cueProvided) continue;
        for (const variant of slot.variants) {
          const run = norm(variant);
          if (run.length > 0 && promptFolded.includes(` ${run} `)) {
            err(`${task.id}/${slot.id}: prompt (${nativeCode}) exposes un-cued answer "${variant}"`);
          }
        }
      }

      // --- self-consistency: every model answer must satisfy the rubric ---
      for (const [index, model] of task.modelAnswers.entries()) {
        const evaluation =
          task.taskFamily === "simple_form" && localized.formFields
            ? evaluateSimpleForm({
                rules,
                targetLanguage: plugin.targetLanguageName,
                values: Object.fromEntries(
                  localized.formFields.map((field, i) => [
                    field.id,
                    // Model answers for forms are authored "field: value" free
                    // text; splitting is brittle, so form models are authored
                    // as one value per field joined with " | " in field order.
                    (model.split(" | ")[i] ?? "").trim(),
                  ])
                ),
                fields: localized.formFields,
                rubric: localized.rubric,
              })
            : evaluateGuidedWriting({
                rules,
                targetLanguage: plugin.targetLanguageName,
                text: model,
                rubric: localized.rubric,
                promptText: promptTextOf(localized),
                knownVocabulary: input.knownVocabulary,
                mode: task.mode,
              });
        if (evaluation.verdict !== "meets_rubric") {
          err(
            `${task.id}: modelAnswers[${index}] does not meet its own rubric ` +
              `(${evaluation.verdict}: ${evaluation.feedback.map((m) => translateMessage("en", m)).join(" / ")})`
          );
        }
      }
    }

    // --- references -----------------------------------------------------
    for (const objective of task.objectiveRefs) {
      if (!knownObjectives.has(objective)) {
        err(`${task.id}: unknown objective ${objective}`);
      }
    }
    for (const lexeme of task.lexemeRefs) {
      if (!input.lexemeIds.has(lexeme)) err(`${task.id}: unknown lexeme ${lexeme}`);
    }
  }

  // --- exercises embedded in the learning path -------------------------
  for (const pack of input.packs ?? []) {
    for (const section of pack.sections) {
      for (const unit of section.units) {
        for (const lesson of unit.lessons) {
          for (const exercise of lesson.exercises) {
            if (exercise.type !== "guidedWriting" && exercise.type !== "simpleForm") {
              continue;
            }
            checkMirror(exercise as WritingExercise, "path", pack.nativeCode);
          }
        }
      }
    }
  }
  for (const bank of input.assessmentWriting ?? []) {
    for (const exercise of bank.exercises) checkMirror(exercise, "assessment", bank.nativeCode);
  }

  function checkMirror(exercise: WritingExercise, context: "path" | "assessment", nativeCode: string) {
    const task = byId.get(exercise.writingTaskId);
    if (!task) {
      err(`${exercise.id}: unknown writing task ${exercise.writingTaskId}`);
      return;
    }
    if (context === "path" && task.reserved) {
      err(`${exercise.id}: reserved assessment task used as teaching material`);
    }
    if (context === "assessment") {
      if (!task.reserved) err(`${exercise.id}: scored banks require RESERVED tasks`);
      if (task.mode !== "guided" || !task.scoredEligibility) {
        err(`${exercise.id}: scored banks require guided, scored-eligible tasks`);
      }
    }
    let localized: LocalizedWritingTask;
    try {
      localized = localizeWritingTask(task, nativeCode);
    } catch (e) {
      err(`${exercise.id}: ${(e as Error).message}`);
      return;
    }
    const same = (label: string, a: unknown, b: unknown) => {
      if (canonicalJson(a) !== canonicalJson(b)) {
        err(`${exercise.id}: ${label} does not mirror task ${task.id}`);
      }
    };
    same("instruction", exercise.instruction, localized.instruction);
    same("rubric", exercise.rubric, localizeRubric(task.rubric, nativeCode, task.id));
    same("modelAnswers", exercise.modelAnswers, task.modelAnswers);
    if (exercise.type === "guidedWriting") {
      same("writingMode", exercise.writingMode, task.mode);
      same("cueFacts", exercise.cueFacts ?? null, localized.cueFacts ?? null);
      if (task.taskFamily === "simple_form") {
        err(`${exercise.id}: simple_form tasks render as simpleForm exercises`);
      }
    } else {
      same("fields", exercise.fields, task.formFields ?? null);
      if (task.taskFamily !== "simple_form") {
        err(`${exercise.id}: simpleForm exercises require simple_form tasks`);
      }
    }
  }

  return { errors, warnings };
}

/**
 * Writing exercises inside scored banks (checkpoints + placement) of a
 * language; used by callers as validateWriting's assessmentWriting input.
 */
export function assessmentBankWritingExercises(lang: string): WritingExercise[] {
  const out: WritingExercise[] = [];
  const push = (exercise: { type: string }) => {
    if (exercise.type === "guidedWriting" || exercise.type === "simpleForm") {
      out.push(exercise as WritingExercise);
    }
  };
  const checkpointsRel = `content/${lang}/assessment/checkpoints.json`;
  if (existsSync(safeResolve(checkpointsRel))) {
    const checkpoints = readJson(checkpointsRel) as {
      checkpoints?: { items: { exercise: { type: string } }[] }[];
    };
    for (const checkpoint of checkpoints.checkpoints ?? []) {
      for (const item of checkpoint.items) push(item.exercise);
    }
  }
  const placementRel = `content/${lang}/assessment/placement.json`;
  if (existsSync(safeResolve(placementRel))) {
    const placement = readJson(placementRel) as {
      stages?: { clusters: { items: { exercise: { type: string } }[] }[] }[];
    };
    for (const stage of placement.stages ?? []) {
      for (const cluster of stage.clusters) {
        for (const item of cluster.items) push(item.exercise);
      }
    }
  }
  return out;
}
