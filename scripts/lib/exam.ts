/**
 * Exam tracks (P3d): content/<lang>/exam/<track>.json — the PUBLIC format of
 * an exam (sections, tasks, timing, score groups) with ORIGINAL practice
 * items in disjoint parallel forms, compiled per course into
 * `<root>/exam/<prefix>-exam-tracks.json`.
 *
 * Honesty rules enforced here (CLAUDE.md §3): results are an estimated
 * readiness ("mức sẵn sàng ước tính"), never a prediction of passing; the
 * format source and whether it was re-checked against the official guide
 * are part of the data and reach the learner.
 */

import { examTrackSchema, type ExamTrack, type PackSource } from "../../content/schema";

import { examTrackPaths } from "./exam-bank";
import { missingNativeCodes, localizeAssessmentItem, pickNative } from "./native-text";
import { readJson, validateExercise, type ValidationResult } from "./pipeline";

/** Exercise types each section skill may administer. */
const TYPES_BY_SKILL: Record<string, readonly string[]> = {
  reading: ["readingComprehension", "select"],
  listening: ["listeningComprehension", "dictation"],
  writing: ["guidedWriting", "simpleForm"],
  speaking: ["speakProduction", "speakRepetition", "interactionScenario"],
};

/** Wording an exam track may never use about a learner's result (any native language). */
const FORBIDDEN_CLAIMS: readonly RegExp[] = [/sẽ đỗ/i, /chắc chắn đỗ/i, /đảm bảo đỗ/i, /will pass/i, /guarantee/i, /certif(y|ied|icate) (that )?you/i];
/** Every native text of the readiness block must say it is an ESTIMATE. */
const ESTIMATE_WORD: Record<string, RegExp> = { vi: /ước tính/i, en: /estimat/i };

export function examFileSlug(trackId: string): string {
  return trackId.split(".").pop()!.replace(/_/g, "-");
}

export function loadExamTracks(lang: string): ExamTrack[] {
  return examTrackPaths(lang).map((relPath) => examTrackSchema(lang).parse(readJson(relPath)));
}

type RefSets = {
  objectiveIds: Set<string>;
  readingIds: Set<string>;
  clipIds: Set<string>;
  speechIds: Set<string>;
  writingIds: Set<string>;
  scenarioIds: Set<string>;
};

function nativeRecords(track: ExamTrack): { where: string; record: Record<string, string> }[] {
  const out: { where: string; record: Record<string, string> }[] = [
    { where: `${track.id}.title`, record: track.title },
    { where: `${track.id}.description`, record: track.description },
    { where: `${track.id}.formatSource.note`, record: track.formatSource.note },
    { where: `${track.id}.readiness.incomplete`, record: track.readiness.incomplete },
    { where: `${track.id}.readiness.disclaimer`, record: track.readiness.disclaimer },
  ];
  for (const s of track.sections) {
    out.push({ where: `${track.id}/${s.id}.title`, record: s.title });
    for (const t of s.tasks) {
      out.push({ where: `${track.id}/${s.id}/${t.id}.title`, record: t.title }, { where: `${track.id}/${s.id}/${t.id}.instruction`, record: t.instruction });
    }
  }
  for (const g of track.groups) out.push({ where: `${track.id}/${g.id}.title`, record: g.title });
  for (const b of track.readiness.bands) {
    out.push({ where: `${track.id}/${b.id}.label`, record: b.label }, { where: `${track.id}/${b.id}.message`, record: b.message });
  }
  return out;
}

/** Structure, honesty, references and parallel-form rules of one exam track. */
export function validateExamTrackData(input: { track: ExamTrack; lang: string; pack: PackSource; refs: RefSets; nativeCodes: readonly string[] }): ValidationResult {
  const { track, refs } = input;
  const errors: string[] = [];
  const err = (m: string) => errors.push(`exam ${track.id}: ${m}`);

  if (track.language !== input.lang) err(`language "${track.language}" ≠ content/${input.lang}/`);

  // Sections, tasks and score groups.
  const sections = new Map(track.sections.map((s) => [s.id, s]));
  if (sections.size !== track.sections.length) err("duplicate section id");
  for (const s of track.sections) {
    if (new Set(s.tasks.map((t) => t.id)).size !== s.tasks.length) err(`${s.id}: duplicate task id`);
  }
  const grouped = new Map<string, string>();
  for (const g of track.groups) {
    let sum = 0;
    for (const sid of g.sectionIds) {
      const s = sections.get(sid);
      if (!s) {
        err(`${g.id}: unknown section ${sid}`);
        continue;
      }
      if (grouped.has(sid)) err(`section ${sid} is in groups ${grouped.get(sid)} and ${g.id}`);
      grouped.set(sid, g.id);
      sum += s.maxPoints;
    }
    if (Math.abs(sum - g.maxPoints) > 1e-9) err(`${g.id}: maxPoints ${g.maxPoints} ≠ the sum of its sections (${sum})`);
    if (g.passPoints > g.maxPoints) err(`${g.id}: passPoints ${g.passPoints} exceeds maxPoints ${g.maxPoints}`);
  }
  for (const s of track.sections) if (!grouped.has(s.id)) err(`section ${s.id} belongs to no score group`);

  // Readiness: ordered bands ending at 0, estimate wording, no pass claims.
  const bands = track.readiness.bands;
  for (let i = 1; i < bands.length; i++) {
    if (bands[i].minGroupShare >= bands[i - 1].minGroupShare) err(`readiness bands must be ordered by strictly decreasing minGroupShare (${bands[i].id})`);
  }
  if (bands[bands.length - 1]?.minGroupShare !== 0) err("the last readiness band must start at minGroupShare 0");
  const records = nativeRecords(track);
  for (const { where, record } of records) {
    for (const [code, text] of Object.entries(record)) {
      for (const pattern of FORBIDDEN_CLAIMS) if (pattern.test(text)) err(`${where} (${code}) claims a result: "${text.match(pattern)?.[0]}"`);
    }
  }
  for (const record of [track.readiness.disclaimer, ...bands.map((b) => b.label)]) {
    for (const [code, text] of Object.entries(record)) {
      const word = ESTIMATE_WORD[code];
      if (word && !word.test(text)) err(`readiness text (${code}) must say it is an estimate: "${text}"`);
    }
  }
  errors.push(...missingNativeCodes(records, input.nativeCodes).map((m) => `exam ${track.id}: ${m}`));

  // Items.
  const itemIds = new Set<string>();
  const byId = new Map(track.items.map((i) => [i.id, i]));
  for (const item of track.items) {
    if (itemIds.has(item.id)) err(`duplicate item id ${item.id}`);
    itemIds.add(item.id);
    const section = sections.get(item.sectionId);
    if (!section) {
      err(`${item.id}: unknown section ${item.sectionId}`);
      continue;
    }
    const task = section.tasks.find((t) => t.id === item.taskId);
    if (!task) err(`${item.id}: unknown task ${item.sectionId}/${item.taskId}`);
    const e = item.exercise as { type: string; options?: unknown[]; gradeTargets?: unknown; objectiveTargets?: unknown } & Record<string, unknown>;
    if (!TYPES_BY_SKILL[section.skill].includes(e.type)) err(`${item.id}: ${e.type} cannot assess ${section.skill}`);
    if ((task?.format === "mcq3" || task?.format === "matching") && Array.isArray(e.options) && e.options.length !== 3) {
      err(`${item.id}: ${task.format} items offer exactly 3 options (the public format)`);
    }
    if (e.gradeTargets !== undefined) err(`${item.id}: exam items must not carry lexical gradeTargets`);
    if (e.objectiveTargets !== undefined) err(`${item.id}: put objective mapping on the ITEM, not inside the exercise payload`);
    for (const oid of item.objectiveTargets) if (!refs.objectiveIds.has(oid)) err(`${item.id}: unknown objective ${oid}`);
    const ref = (key: string, known: Set<string>) => {
      const value = e[key];
      if (typeof value === "string" && !known.has(value)) err(`${item.id}: unknown ${key} ${value}`);
    };
    ref("readingId", refs.readingIds);
    ref("clipId", refs.clipIds);
    ref("speechItemId", refs.speechIds);
    ref("writingTaskId", refs.writingIds);
    ref("scenarioId", refs.scenarioIds);
    validateExercise(input.pack.id, item.exercise, (m) => err(`${item.id}: ${m}`), input.pack.targetCode);
  }

  // Parallel forms: disjoint, complete, each a full administration of the format.
  const formIds = new Set<string>();
  const placed = new Map<string, string>();
  for (const form of track.forms) {
    if (formIds.has(form.formId)) err(`duplicate form id ${form.formId}`);
    formIds.add(form.formId);
    const perTask = new Map<string, number>();
    for (const id of form.itemIds) {
      const item = byId.get(id);
      if (!item) {
        err(`form ${form.formId}: item ${id} is not in the bank`);
        continue;
      }
      if (placed.has(id)) err(`item ${id} is in forms ${placed.get(id)} and ${form.formId} — parallel forms are disjoint`);
      placed.set(id, form.formId);
      const key = `${item.sectionId}/${item.taskId}`;
      perTask.set(key, (perTask.get(key) ?? 0) + 1);
    }
    for (const s of track.sections) {
      for (const t of s.tasks) {
        const n = perTask.get(`${s.id}/${t.id}`) ?? 0;
        if (n !== t.itemsPerForm) err(`form ${form.formId}: ${s.id}/${t.id} has ${n} item(s), the format needs ${t.itemsPerForm}`);
      }
    }
  }
  for (const item of track.items) if (!placed.has(item.id)) err(`${item.id} appears in no form — dead bank item`);

  return { errors, warnings: [] };
}

/** Lexemes an item exercises (for weak-area practice): its stimulus's lexeme refs. */
export type ExamLexemeSources = {
  readings: Map<string, string[]>;
  clips: Map<string, string[]>;
  speech: Map<string, string[]>;
  writing: Map<string, string[]>;
};

function itemLexemes(exercise: Record<string, unknown>, sources: ExamLexemeSources): string[] {
  const pick = (key: string, map: Map<string, string[]>) => (typeof exercise[key] === "string" ? (map.get(exercise[key] as string) ?? []) : []);
  return [...new Set([...pick("readingId", sources.readings), ...pick("clipId", sources.clips), ...pick("speechItemId", sources.speech), ...pick("writingTaskId", sources.writing)])].sort();
}

/** Compiled runtime artifact: every track of a target, native text resolved for one course. */
export function compileExamTracksArtifact(tracks: ExamTrack[], lang: string, nativeCode: string, sources: ExamLexemeSources): string {
  const text = (r: Record<string, string>, where: string) => pickNative(r, nativeCode, where);
  const compiled = tracks.map((track) => ({
    id: track.id,
    trackVersion: track.trackVersion,
    name: track.name,
    level: track.level,
    title: text(track.title, `${track.id}.title`),
    description: text(track.description, `${track.id}.description`),
    formatSource: {
      publisher: track.formatSource.publisher,
      checkedAgainstOfficialGuide: track.formatSource.checkedAgainstOfficialGuide,
      note: text(track.formatSource.note, `${track.id}.formatSource.note`),
    },
    sections: track.sections.map((s) => ({
      id: s.id,
      skill: s.skill,
      title: text(s.title, `${track.id}/${s.id}.title`),
      minutes: s.minutes,
      ...(s.preparationMinutes !== undefined ? { preparationMinutes: s.preparationMinutes } : {}),
      maxPoints: s.maxPoints,
      tasks: s.tasks.map((t) => ({
        id: t.id,
        title: text(t.title, `${track.id}/${s.id}/${t.id}.title`),
        instruction: text(t.instruction, `${track.id}/${s.id}/${t.id}.instruction`),
        format: t.format,
        itemsPerForm: t.itemsPerForm,
      })),
    })),
    groups: track.groups.map((g) => ({ id: g.id, title: text(g.title, `${track.id}/${g.id}.title`), sectionIds: g.sectionIds, maxPoints: g.maxPoints, passPoints: g.passPoints })),
    readiness: {
      bands: track.readiness.bands.map((b) => ({ id: b.id, minGroupShare: b.minGroupShare, label: text(b.label, `${track.id}/${b.id}.label`), message: text(b.message, `${track.id}/${b.id}.message`) })),
      incomplete: text(track.readiness.incomplete, `${track.id}.readiness.incomplete`),
      disclaimer: text(track.readiness.disclaimer, `${track.id}.readiness.disclaimer`),
    },
    items: track.items.map((item) => {
      const localized = localizeAssessmentItem(item as unknown as { id: string; exercise: Record<string, unknown>; exerciseNative?: Record<string, Record<string, string>> }, track.exerciseNativeCode, nativeCode) as unknown as typeof item;
      return {
        id: item.id,
        itemVersion: item.itemVersion,
        sectionId: item.sectionId,
        taskId: item.taskId,
        exercise: localized.exercise,
        objectiveTargets: item.objectiveTargets,
        lexemeRefs: itemLexemes(item.exercise as Record<string, unknown>, sources),
      };
    }),
    forms: track.forms,
  }));
  return `${JSON.stringify({ version: 1, language: lang, tracks: compiled }, null, 2)}\n`;
}
