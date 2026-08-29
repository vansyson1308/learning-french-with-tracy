/**
 * Written-production content pipeline (P9 §13-§23).
 *
 * Source of truth: content/fr/writing/tasks.json (WritingTasksSchema).
 * Pack/checkpoint/capstone exercises EMBED task fields and must mirror
 * them byte-for-byte (the speech-item discipline). The compiled runtime
 * artifact excludes reserved assessment tasks and carries the deterministic
 * known-French vocabulary the rubric engine's plausibility floor uses.
 */

import { existsSync } from "fs";

import {
  WritingTasksSchema,
  type CourseObjectives,
  type WritingTask,
  type WritingTasks,
} from "../../content/schema";
import { frenchNumber } from "../../src/lib/learning/french-numbers";
import { normalizeWrittenFrench } from "../../src/lib/writing/rubric";
import {
  evaluateGuidedWriting,
  evaluateSimpleForm,
} from "../../src/lib/writing/rubric";
import { loadRichLexicon } from "./lexicon";
import { canonicalJson, readJson, safeResolve, type ValidationResult } from "./pipeline";

export const WRITING_SOURCE = "content/fr/writing/tasks.json";

export function loadWritingTasks(): WritingTasks | null {
  if (!existsSync(safeResolve(WRITING_SOURCE))) return null;
  return WritingTasksSchema.parse(readJson(WRITING_SOURCE));
}

/**
 * High-frequency French function words and formulae the curriculum uses
 * constantly but that are not lexicon headwords. Authored, reviewed list —
 * the plausibility floor never guesses beyond it.
 */
const FUNCTION_WORDS =
  (
    "je tu il elle on nous vous ils elles moi toi lui " +
    "le la les l un une des du de d au aux " +
    "mon ma mes ton ta tes son sa ses notre votre nos vos leur leurs " +
    "ce cette ces c ca cela qui que qu quoi ou où quand comment pourquoi combien " +
    "et mais donc car ne n pas plus tres très aussi bien " +
    "a à dans en sur sous avec sans pour chez avant apres après " +
    "est suis es sommes etes êtes sont ai as avons avez ont " +
    "y voila voilà oui non merci bonjour bonsoir salut madame monsieur " +
    "s m t se me te il-y-a"
  ).split(" ");

/**
 * Deterministic known-French token vocabulary: curated lexeme surfaces,
 * their example sentences, taught conjugation cells, number words 0-100,
 * and the function-word list — all normalized exactly as the rubric engine
 * normalizes learner text.
 */
export function buildKnownFrench(): string[] {
  const out = new Set<string>();
  const add = (text: string) => {
    for (const token of normalizeWrittenFrench(text).split(" ")) {
      if (token.length > 0) out.add(token);
    }
  };

  for (const word of FUNCTION_WORDS) add(word);
  for (let n = 0; n <= 100; n++) add(frenchNumber(n).traditional);

  const lexicon = loadRichLexicon();
  for (const lexeme of lexicon.lexemes) {
    add(lexeme.surface);
    add(lexeme.lemma);
    add(lexeme.lookupForm);
    for (const example of lexeme.examples ?? []) add(example.fr);
  }

  const conjugations = readJson("content/fr/pedagogy/conjugations.json") as {
    verbs: { cells: Record<string, string> }[];
  };
  for (const verb of conjugations.verbs) {
    for (const form of Object.values(verb.cells)) add(form);
  }

  return [...out].sort();
}

/**
 * Runtime artifact: src/content/writing/fr-writing.json. Always emitted;
 * reserved tasks excluded by construction.
 */
export function compileWritingArtifact(writing: WritingTasks | null): string {
  const tasks = (writing?.tasks ?? []).filter((task) => !task.reserved);
  const byId: Record<string, unknown> = {};
  for (const task of tasks) {
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
    knownFrench: buildKnownFrench(),
  });
}

type GuidedWritingExercise = {
  type: "guidedWriting";
  id: string;
  writingTaskId: string;
  writingMode: "guided" | "open";
  instruction: string;
  cueFacts?: { label: string; value: string }[];
  rubric: WritingTask["rubric"];
  modelAnswers: string[];
  objectiveTargets?: string[];
};
type SimpleFormExercise = {
  type: "simpleForm";
  id: string;
  writingTaskId: string;
  instruction: string;
  fields: { id: string; label: string; slotId: string }[];
  rubric: WritingTask["rubric"];
  modelAnswers: string[];
  objectiveTargets?: string[];
};
export type WritingExercise = GuidedWritingExercise | SimpleFormExercise;

export type FrPackForWriting = {
  sections: {
    units: { lessons: { exercises: { type: string }[] }[] }[];
  }[];
};

function promptTextOf(task: WritingTask): string {
  return [
    task.instruction,
    ...(task.cueFacts ?? []).flatMap((cue) => [cue.label, cue.value]),
  ].join(" ");
}

export function validateWriting(input: {
  writing: WritingTasks | null;
  objectives: CourseObjectives | null;
  lexemeIds: Set<string>;
  /** When provided, embedded writing-exercise fields must mirror tasks. */
  frPack?: FrPackForWriting;
  /** Writing exercises from scored banks — must mirror RESERVED tasks. */
  assessmentWriting?: WritingExercise[];
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const err = (m: string) => errors.push(`writing: ${m}`);
  if (input.writing === null) return { errors, warnings };

  const knownObjectives = new Set(
    (input.objectives?.objectives ?? []).map((objective) => objective.id)
  );
  const knownFrench = new Set(buildKnownFrench());

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
      const normalized = slot.variants.map(normalizeWrittenFrench);
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

    // --- answer-leak rule ----------------------------------------------
    // Un-cued slot content appearing in the prompt hands the learner the
    // answer; cue-provided facts (names, cities, numbers) are legitimate.
    const promptFolded = ` ${normalizeWrittenFrench(promptTextOf(task))} `;
    for (const slot of task.rubric.requiredSlots) {
      if (slot.cueProvided) continue;
      for (const variant of slot.variants) {
        const run = normalizeWrittenFrench(variant);
        if (run.length > 0 && promptFolded.includes(` ${run} `)) {
          err(`${task.id}/${slot.id}: prompt exposes un-cued answer "${variant}"`);
        }
      }
    }

    // --- self-consistency: every model answer must satisfy the rubric ---
    for (const [index, model] of task.modelAnswers.entries()) {
      const evaluation =
        task.taskFamily === "simple_form" && task.formFields
          ? evaluateSimpleForm({
              values: Object.fromEntries(
                task.formFields.map((field, i) => [
                  field.id,
                  // Model answers for forms are authored "field: value" free
                  // text; splitting is brittle, so form models are authored
                  // as one value per field joined with " | " in field order.
                  (model.split(" | ")[i] ?? "").trim(),
                ])
              ),
              fields: task.formFields,
              rubric: task.rubric,
            })
          : evaluateGuidedWriting({
              text: model,
              rubric: task.rubric,
              promptText: promptTextOf(task),
              knownFrench,
            });
      if (evaluation.verdict !== "meets_rubric") {
        err(
          `${task.id}: modelAnswers[${index}] does not meet its own rubric ` +
            `(${evaluation.verdict}: ${evaluation.feedback.join(" / ")})`
        );
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
  if (input.frPack) {
    for (const section of input.frPack.sections) {
      for (const unit of section.units) {
        for (const lesson of unit.lessons) {
          for (const exercise of lesson.exercises) {
            if (exercise.type !== "guidedWriting" && exercise.type !== "simpleForm") {
              continue;
            }
            checkMirror(exercise as WritingExercise, "path");
          }
        }
      }
    }
  }
  for (const exercise of input.assessmentWriting ?? []) {
    checkMirror(exercise, "assessment");
  }

  function checkMirror(exercise: WritingExercise, context: "path" | "assessment") {
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
    const same = (label: string, a: unknown, b: unknown) => {
      if (canonicalJson(a) !== canonicalJson(b)) {
        err(`${exercise.id}: ${label} does not mirror task ${task.id}`);
      }
    };
    same("instruction", exercise.instruction, task.instruction);
    same("rubric", exercise.rubric, task.rubric);
    same("modelAnswers", exercise.modelAnswers, task.modelAnswers);
    if (exercise.type === "guidedWriting") {
      same("writingMode", exercise.writingMode, task.mode);
      same("cueFacts", exercise.cueFacts ?? null, task.cueFacts ?? null);
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
 * Writing exercises inside scored banks (checkpoints + any future
 * assessment sources); used by callers as validateWriting's
 * assessmentWriting input.
 */
export function assessmentBankWritingExercises(): WritingExercise[] {
  const out: WritingExercise[] = [];
  const push = (exercise: { type: string }) => {
    if (exercise.type === "guidedWriting" || exercise.type === "simpleForm") {
      out.push(exercise as WritingExercise);
    }
  };
  if (existsSync(safeResolve("content/fr/assessment/checkpoints.json"))) {
    const checkpoints = readJson("content/fr/assessment/checkpoints.json") as {
      checkpoints?: { items: { exercise: { type: string } }[] }[];
    };
    for (const checkpoint of checkpoints.checkpoints ?? []) {
      for (const item of checkpoint.items) push(item.exercise);
    }
  }
  if (existsSync(safeResolve("content/fr/assessment/placement.json"))) {
    const placement = readJson("content/fr/assessment/placement.json") as {
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
