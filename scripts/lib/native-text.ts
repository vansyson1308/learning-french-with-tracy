/**
 * Native-language text resolution (P1c). Authored sources carry every
 * native-language string as `Record<nativeCode, string>`; the compiled
 * runtime artifacts carry the ONE native language of the course as plain
 * strings (byte-identical to the pre-P1c French artifacts). This module is
 * the only place that picks a native code out of a record — fail-closed:
 * a missing translation is a compile error, never a silent fallback to
 * another language.
 *
 * The `localize*` helpers return the legacy (plain-string) shapes the
 * runtime types describe; key order is preserved so emitted JSON stays
 * identical to the artifacts produced before the schema generalisation.
 */

import type {
  Checkpoint,
  Concept,
  CourseObjective,
  InteractionScenarioSource,
  NativeText,
  PlacementStage,
  ReadingSource,
  RichLexeme,
  SpeechItem,
  WritingRubricSource,
  WritingTask,
} from "../../content/schema";
import { applyExerciseOverlay, exerciseNativeFieldPaths, missingOverlayPaths } from "./native-fields";

export class MissingNativeTextError extends Error {
  constructor(where: string, nativeCode: string, available: string[]) {
    super(
      `${where}: no "${nativeCode}" text (available: ${available.length ? available.join(", ") : "none"}) — every nativeCode a course uses must be authored`
    );
    this.name = "MissingNativeTextError";
  }
}

/** The text for `nativeCode`, or throw (fail-closed). */
export function pickNative(record: NativeText, nativeCode: string, where: string): string {
  const value = record[nativeCode];
  if (typeof value !== "string" || value.length === 0) {
    throw new MissingNativeTextError(where, nativeCode, Object.keys(record));
  }
  return value;
}

/**
 * Collect every native-text record of a document with its path, so a
 * validator can report every missing nativeCode at once instead of the
 * compiler throwing on the first one. `isNativeText` is decided by the
 * caller's knowledge of the schema (a predicate over the path).
 */
export function missingNativeCodes(
  records: { where: string; record: NativeText }[],
  nativeCodes: readonly string[]
): string[] {
  const errors: string[] = [];
  for (const { where, record } of records) {
    for (const code of nativeCodes) {
      if (typeof record[code] !== "string" || record[code].length === 0) {
        errors.push(`${where}: missing "${code}" text`);
      }
    }
  }
  return errors;
}

/** `{ [targetCode]: target, [nativeCode]: translation, ...rest }` — the compiled example shape. */
export function localizeExample(
  ex: { target: string; translations: NativeText; source?: string; note?: NativeText },
  targetCode: string,
  nativeCode: string,
  where: string
): Record<string, string> {
  const out: Record<string, string> = {
    [targetCode]: ex.target,
    [nativeCode]: pickNative(ex.translations, nativeCode, `${where}.translations`),
  };
  if (ex.source !== undefined) out.source = ex.source;
  if (ex.note !== undefined) out.note = pickNative(ex.note, nativeCode, `${where}.note`);
  return out;
}

/** Legacy rich-lexeme view: `gloss` string, examples keyed by language code. */
export type LocalizedLexeme = Omit<RichLexeme, "glosses" | "examples"> & {
  gloss: string;
  examples: { target: string; native: string; source: string }[];
};

export function localizeLexeme(lex: RichLexeme, nativeCode: string): LocalizedLexeme {
  const { glosses, examples, ...rest } = lex;
  return {
    ...rest,
    gloss: pickNative(glosses, nativeCode, `${lex.id}.glosses`),
    examples: examples.map((ex, i) => ({
      target: ex.target,
      native: pickNative(ex.translations, nativeCode, `${lex.id}.examples[${i}].translations`),
      source: ex.source,
    })),
  };
}

/** Concept artifact object (verbatim key order of the pre-P1c schema). */
export function localizeConcept(concept: Concept, targetCode: string, nativeCode: string): Record<string, unknown> {
  const where = concept.id;
  return {
    id: concept.id,
    title: pickNative(concept.title, nativeCode, `${where}.title`),
    shortRule: pickNative(concept.shortRule, nativeCode, `${where}.shortRule`),
    explanation: pickNative(concept.explanation, nativeCode, `${where}.explanation`),
    examples: concept.examples.map((ex, i) =>
      localizeExample(ex, targetCode, nativeCode, `${where}.examples[${i}]`)
    ),
    exceptions: concept.exceptions.map((e, i) => pickNative(e, nativeCode, `${where}.exceptions[${i}]`)),
    ...(concept.memoryHint !== undefined
      ? { memoryHint: pickNative(concept.memoryHint, nativeCode, `${where}.memoryHint`) }
      : {}),
    ...(concept.objectives !== undefined ? { objectives: concept.objectives } : {}),
    sourceRefs: concept.sourceRefs,
  };
}

export function localizeObjective(o: CourseObjective, nativeCode: string): Omit<CourseObjective, "title" | "canDo"> & { title: string; canDo: string } {
  const { title, canDo, ...rest } = o;
  return {
    ...rest,
    title: pickNative(title, nativeCode, `${o.id}.title`),
    canDo: pickNative(canDo, nativeCode, `${o.id}.canDo`),
  };
}

/**
 * An assessment item's exercise in `nativeCode`: the plain payload when that
 * is the document's own native language, otherwise the payload with the
 * item's `exerciseNative[nativeCode]` overlay applied (fail-closed). The
 * overlay never reaches the artifact.
 */
export function localizeAssessmentItem<T extends { id: string; exercise: Record<string, unknown>; exerciseNative?: Record<string, Record<string, string>> }>(
  item: T,
  exerciseNativeCode: string,
  nativeCode: string
): Omit<T, "exerciseNative"> {
  const { exerciseNative, ...rest } = item;
  if (nativeCode === exerciseNativeCode) return rest;
  const overlay = exerciseNative?.[nativeCode];
  if (overlay === undefined) {
    if (exerciseNativeFieldPaths(item.exercise).length === 0) return rest;
    throw new MissingNativeTextError(`${item.id}.exerciseNative`, nativeCode, Object.keys(exerciseNative ?? {}));
  }
  return { ...rest, exercise: applyExerciseOverlay(item.exercise, overlay, `${item.id}.exerciseNative.${nativeCode}`) };
}

export function localizeCheckpoint(cp: Checkpoint, nativeCode: string, exerciseNativeCode = "en"): Record<string, unknown> {
  return {
    id: cp.id,
    checkpointVersion: cp.checkpointVersion,
    formVersion: cp.formVersion,
    sectionId: cp.sectionId,
    title: pickNative(cp.title, nativeCode, `${cp.id}.title`),
    description: pickNative(cp.description, nativeCode, `${cp.id}.description`),
    items: cp.items.map((item) => localizeAssessmentItem(item, exerciseNativeCode, nativeCode)),
    ...(cp.forms !== undefined ? { forms: cp.forms } : {}),
    criteria: cp.criteria,
  };
}

export function localizePlacementStage(stage: PlacementStage, nativeCode: string, exerciseNativeCode = "en"): Record<string, unknown> {
  return {
    id: stage.id,
    title: pickNative(stage.title, nativeCode, `${stage.id}.title`),
    clusters: stage.clusters.map((cluster) => ({
      ...cluster,
      items: cluster.items.map((item) => localizeAssessmentItem(item, exerciseNativeCode, nativeCode)),
    })),
  };
}

/**
 * Overlay completeness (validator, P2b): for every native code other than
 * the document's own, every assessment item with native-language fields
 * must carry a complete overlay.
 */
export function missingExerciseOverlays(
  items: { id: string; exercise: Record<string, unknown>; exerciseNative?: Record<string, Record<string, string>> }[],
  exerciseNativeCode: string,
  nativeCodes: readonly string[]
): string[] {
  const errors: string[] = [];
  for (const item of items) {
    for (const code of nativeCodes) {
      if (code === exerciseNativeCode) continue;
      const missing = missingOverlayPaths(item.exercise, item.exerciseNative?.[code]);
      if (missing.length > 0) errors.push(`${item.id}: exerciseNative.${code} missing ${missing.join(", ")}`);
      const unknown = Object.keys(item.exerciseNative?.[code] ?? {}).filter((p) => !exerciseNativeFieldPaths(item.exercise).includes(p));
      if (unknown.length > 0) errors.push(`${item.id}: exerciseNative.${code} has non-native paths ${unknown.join(", ")}`);
    }
  }
  return errors;
}

export function localizeReading(reading: ReadingSource, nativeCode: string): Record<string, unknown> {
  const { supportGlossary, ...rest } = reading;
  return {
    id: reading.id,
    kind: reading.kind,
    ...(reading.title !== undefined ? { title: reading.title } : {}),
    blocks: reading.blocks,
    objectiveRefs: reading.objectiveRefs,
    lexemeRefs: reading.lexemeRefs,
    supportGlossary: supportGlossary.map((g, i) => ({
      surface: g.surface,
      gloss: pickNative(g.gloss, nativeCode, `${reading.id}.supportGlossary[${i}].gloss`),
    })),
    sourceRef: rest.sourceRef,
    authoringSpec: rest.authoringSpec,
  };
}

export type LocalizedCueFact = { label: string; value: string };

export function localizeCueFacts(
  cueFacts: { label: NativeText; value: string }[] | undefined,
  nativeCode: string,
  where: string
): LocalizedCueFact[] | undefined {
  if (cueFacts === undefined) return undefined;
  return cueFacts.map((f, i) => ({
    label: pickNative(f.label, nativeCode, `${where}.cueFacts[${i}].label`),
    value: f.value,
  }));
}

export type LocalizedSpeechPrompt = { instruction: string; cueEmoji?: string; cueFacts?: LocalizedCueFact[] };

export function localizeSpeechPrompt(item: SpeechItem, nativeCode: string): LocalizedSpeechPrompt {
  const where = `${item.id}.prompt`;
  const cueFacts = localizeCueFacts(item.prompt.cueFacts, nativeCode, where);
  return {
    instruction: pickNative(item.prompt.instruction, nativeCode, `${where}.instruction`),
    ...(item.prompt.cueEmoji !== undefined ? { cueEmoji: item.prompt.cueEmoji } : {}),
    ...(cueFacts !== undefined ? { cueFacts } : {}),
  };
}

export type LocalizedRubric = Omit<WritingRubricSource, "requiredSlots"> & {
  requiredSlots: (Omit<WritingRubricSource["requiredSlots"][number], "description"> & { description: string })[];
};

export function localizeRubric(rubric: WritingRubricSource, nativeCode: string, where: string): LocalizedRubric {
  return {
    requiredSlots: rubric.requiredSlots.map((slot) => ({
      id: slot.id,
      description: pickNative(slot.description, nativeCode, `${where}.requiredSlots.${slot.id}.description`),
      variants: slot.variants,
      cueProvided: slot.cueProvided,
    })),
    minTokens: rubric.minTokens,
    maxTokens: rubric.maxTokens,
    ...(rubric.requireSentenceVerbs !== undefined ? { requireSentenceVerbs: rubric.requireSentenceVerbs } : {}),
  };
}

export type LocalizedWritingTask = Omit<WritingTask, "instruction" | "cueFacts" | "rubric"> & {
  instruction: string;
  cueFacts?: LocalizedCueFact[];
  rubric: LocalizedRubric;
};

export function localizeWritingTask(task: WritingTask, nativeCode: string): LocalizedWritingTask {
  const { instruction, cueFacts, rubric, ...rest } = task;
  const facts = localizeCueFacts(cueFacts, nativeCode, task.id);
  return {
    ...rest,
    instruction: pickNative(instruction, nativeCode, `${task.id}.instruction`),
    ...(facts !== undefined ? { cueFacts: facts } : {}),
    rubric: localizeRubric(rubric, nativeCode, `${task.id}.rubric`),
  };
}

/** Scenario nodes with learner prompts resolved (partner/terminal nodes verbatim). */
export function localizeScenarioNodes(
  scenario: InteractionScenarioSource,
  nativeCode: string
): Record<string, unknown> {
  const nodes: Record<string, unknown> = {};
  for (const [key, node] of Object.entries(scenario.nodes)) {
    if (node.kind === "learner") {
      nodes[key] = {
        kind: node.kind,
        id: node.id,
        prompt: pickNative(node.prompt, nativeCode, `${scenario.id}/${node.id}.prompt`),
        expected: node.expected,
        noMatchNext: node.noMatchNext,
        scored: node.scored,
      };
    } else {
      nodes[key] = node;
    }
  }
  return nodes;
}

/** Every native-text record of a document, for the completeness validator. */
export function nativeTextRecordsOf(input: {
  lexicon?: { lexemes: RichLexeme[] } | null;
  concepts?: { concepts: Concept[] } | null;
  paradigms?: { tables: { lemma: string; gloss: NativeText }[] } | null;
  objectives?: { objectives: CourseObjective[] } | null;
  checkpoints?: { checkpoints: Checkpoint[] } | null;
  placement?: { stages: PlacementStage[] } | null;
  readings?: { readings: ReadingSource[] } | null;
  speech?: { items: SpeechItem[] } | null;
  writing?: { tasks: WritingTask[] } | null;
  interaction?: { scenarios: InteractionScenarioSource[] } | null;
}): { where: string; record: NativeText }[] {
  const out: { where: string; record: NativeText }[] = [];
  const add = (where: string, record: NativeText | undefined) => {
    if (record !== undefined) out.push({ where, record });
  };
  for (const lex of input.lexicon?.lexemes ?? []) {
    add(`${lex.id}.glosses`, lex.glosses);
    lex.examples.forEach((ex, i) => add(`${lex.id}.examples[${i}].translations`, ex.translations));
  }
  for (const c of input.concepts?.concepts ?? []) {
    add(`${c.id}.title`, c.title);
    add(`${c.id}.shortRule`, c.shortRule);
    add(`${c.id}.explanation`, c.explanation);
    c.examples.forEach((ex, i) => {
      add(`${c.id}.examples[${i}].translations`, ex.translations);
      add(`${c.id}.examples[${i}].note`, ex.note);
    });
    c.exceptions.forEach((e, i) => add(`${c.id}.exceptions[${i}]`, e));
    add(`${c.id}.memoryHint`, c.memoryHint);
  }
  for (const t of input.paradigms?.tables ?? []) add(`paradigm ${t.lemma}.gloss`, t.gloss);
  for (const o of input.objectives?.objectives ?? []) {
    add(`${o.id}.title`, o.title);
    add(`${o.id}.canDo`, o.canDo);
  }
  for (const cp of input.checkpoints?.checkpoints ?? []) {
    add(`${cp.id}.title`, cp.title);
    add(`${cp.id}.description`, cp.description);
  }
  for (const s of input.placement?.stages ?? []) add(`${s.id}.title`, s.title);
  for (const r of input.readings?.readings ?? []) {
    r.supportGlossary.forEach((g, i) => add(`${r.id}.supportGlossary[${i}].gloss`, g.gloss));
  }
  for (const item of input.speech?.items ?? []) {
    add(`${item.id}.prompt.instruction`, item.prompt.instruction);
    item.prompt.cueFacts?.forEach((f, i) => add(`${item.id}.prompt.cueFacts[${i}].label`, f.label));
  }
  for (const task of input.writing?.tasks ?? []) {
    add(`${task.id}.instruction`, task.instruction);
    task.cueFacts?.forEach((f, i) => add(`${task.id}.cueFacts[${i}].label`, f.label));
    for (const slot of task.rubric.requiredSlots) add(`${task.id}.rubric.${slot.id}.description`, slot.description);
  }
  for (const sc of input.interaction?.scenarios ?? []) {
    add(`${sc.id}.title`, sc.title);
    add(`${sc.id}.goal`, sc.goal);
    for (const node of Object.values(sc.nodes)) {
      if (node.kind === "learner") add(`${sc.id}/${node.id}.prompt`, node.prompt);
    }
  }
  return out;
}
