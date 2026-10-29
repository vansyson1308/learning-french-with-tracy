/**
 * Target-language strings of a course (P3e §8): every text a learner reads
 * or hears in the language being learned — exercise prompts and options,
 * sentences, readings, clip transcripts, speech targets, model answers,
 * partner lines, exam texts, lexicon surfaces and examples. Native-language
 * text (records keyed by native code, the exercise native-field table),
 * ids, references and enum values are left out. Feeds the LanguageTool
 * gate (scripts/languagetool.ts) and the tiered review files.
 */

import { existsSync } from "fs";

import type { PackSource } from "../../content/schema";

import { examTrackPaths } from "./exam-bank";
import { exerciseNativeFieldPaths } from "./native-fields";
import { readJson, safeResolve } from "./pipeline";

export type TargetString = { text: string; where: string; key: string };

/** Keys whose values are never target-language prose. */
const NON_TEXT_KEYS = new Set([
  "id", "clipId", "readingId", "speechItemId", "writingTaskId", "scenarioId", "modelClipId", "modelAudioRef", "rephraseClipId",
  "next", "noMatchNext", "startNodeId", "intent", "lexemeRefs", "evidenceLexemeRefs", "objectiveRefs", "objectiveTargets", "objectives",
  "sourceRef", "sourceRefs", "source", "key", "relations", "confusables", "pronunciation", "frequency", "topic", "glosses", "translations",
  "vi", "en", "native", "translation", "gloss", "instruction", "question", "goal", "label", "description", "title", "guidebook", "note",
  "type", "kind", "format", "level", "cefr", "skill", "partOfSpeech", "gender", "group", "notation", "role", "speaker", "voice", "status",
  "lessonKind", "completion", "metric", "emoji", "image", "flag", "url", "retrieved", "use", "unit", "lesson", "section", "lang", "language",
  "targetCode", "nativeCode", "exerciseNativeCode", "conceptRefs", "conceptId", "paradigmRef", "lemma", "lookupForm", "variety", "attributes",
  "cells", "domain", "register", "tags", "references", "formatSource", "scoring", "passRule", "timing",
  "mode", "direction", "inferenceDemand", "sectionId", "taskId", "slotId", "recognitionLocale", "writingMode", "taskFamily",
  "elicitationType", "formId", "name",
]);

/** Letters Vietnamese has and Spanish never uses: a string containing one is native text. */
const VIETNAMESE_ONLY = /[àèìòùãõĩũỹăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịĩọỏốồổỗộớờởỡợụủũứừửữựỳỵỷỹ]/i;
const ID_LIKE = /^[\w.-]*[:_][\w.:-]*$|^[a-z]+(?:\.[\w-]+)+$/;

function isNativeRecord(rec: Record<string, unknown>): boolean {
  const keys = Object.keys(rec);
  return keys.length > 0 && keys.every((k) => /^[a-z]{2,3}$/.test(k)) && keys.some((k) => typeof rec[k] === "string");
}

function walk(value: unknown, where: string, key: string, out: TargetString[]): void {
  if (NON_TEXT_KEYS.has(key)) return;
  if (typeof value === "string") {
    const text = value.trim();
    if (text === "" || VIETNAMESE_ONLY.test(text) || ID_LIKE.test(text) || !/\p{L}/u.test(text)) return;
    out.push({ text, where, key });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, `${where}[${i}]`, key, out));
    return;
  }
  if (value && typeof value === "object") {
    const rec = value as Record<string, unknown>;
    if (isNativeRecord(rec)) return;
    for (const [k, v] of Object.entries(rec)) {
      // Scored-bank items (checkpoints, placement, exam) carry exercise payloads with native fields.
      const payload = k === "exercise" && v && typeof v === "object" && !Array.isArray(v) ? dropPaths(v as Record<string, unknown>) : v;
      walk(payload, `${where}.${k}`, k, out);
    }
  }
}

function dropPaths(exercise: Record<string, unknown>): Record<string, unknown> {
  // Remove the exercise's native fields (prompts in the learner's language etc.).
  const copy = structuredClone(exercise);
  for (const p of exerciseNativeFieldPaths(exercise)) {
    const segs = p.split(".");
    let cur: unknown = copy;
    for (const s of segs.slice(0, -1)) cur = cur && typeof cur === "object" ? (cur as Record<string, unknown>)[s] : undefined;
    if (cur && typeof cur === "object") delete (cur as Record<string, unknown>)[segs[segs.length - 1]];
  }
  return copy;
}

/** Rich source files of a target language that carry target text (lexicon examples and graded stories included). */
export function targetSourcePaths(lang: string): string[] {
  const rels = [
    `content/${lang}/reception/reading.json`,
    `content/${lang}/reception/listening.json`,
    `content/${lang}/speech/items.json`,
    `content/${lang}/writing/tasks.json`,
    `content/${lang}/interaction/scenarios.json`,
    `content/${lang}/assessment/checkpoints.json`,
    `content/${lang}/assessment/placement.json`,
    `content/${lang}/pedagogy/concepts.json`,
    `content/${lang}/pedagogy/paradigms.json`,
    `content/${lang}/lexicon/lexemes.json`,
    storiesPath(lang),
    ...examTrackPaths(lang),
  ];
  return rels.filter((rel) => existsSync(safeResolve(rel)));
}

const storiesPath = (lang: string) => `content/${lang}/stories/stories.json`;

/**
 * Graded stories (QC 2026-10-29 evening §1): each story's target-language
 * title and every sentence. The questions, blurbs and translations are
 * native text only (StoryQuestionSchema: prompt and options are keyed by
 * native code), and the file's function words, token map and voice cast
 * are not prose, so nothing else is collected.
 */
export function collectStoryStrings(lang: string): TargetString[] {
  const rel = storiesPath(lang);
  if (!existsSync(safeResolve(rel))) return [];
  const doc = readJson(rel) as { stories?: { id: string; title: string; sentences: { text: string }[] }[] };
  const out: TargetString[] = [];
  for (const story of doc.stories ?? []) {
    out.push({ text: story.title, where: `${rel}:${story.id}.title`, key: "title" });
    story.sentences.forEach((s, i) => out.push({ text: s.text, where: `${rel}:${story.id}#${i + 1}`, key: "text" }));
  }
  return out;
}

/**
 * Which strings a run checks: the whole course (pack and every rich layer),
 * or only the graded stories of its target (`--scope stories`; the French
 * CI gate — see .github/workflows/ci.yml `languagetool`).
 */
export type TargetScope = "course" | "stories";

export function collectTargetStrings(courseId: string, scope: TargetScope = "course"): TargetString[] {
  const pack = readJson(`content/courses/${courseId}.json`) as PackSource;
  if (scope === "stories") return collectStoryStrings(pack.targetCode);
  const out: TargetString[] = [];
  for (const s of pack.sections) {
    for (const u of s.units) {
      for (const w of u.words) out.push({ text: w.target, where: `${courseId}:${u.id}.words`, key: "target" });
      for (const l of u.lessons) {
        for (const ex of l.exercises) walk(dropPaths(ex as Record<string, unknown>), ex.id, "", out);
      }
    }
  }
  for (const rel of targetSourcePaths(pack.targetCode)) {
    if (rel === storiesPath(pack.targetCode)) {
      out.push(...collectStoryStrings(pack.targetCode));
      continue;
    }
    const doc = readJson(rel);
    // Lexicon: surfaces and example sentences only.
    if (rel.endsWith("lexicon/lexemes.json")) {
      const lexemes = ((doc as { lexemes?: unknown[] }).lexemes ?? []) as { id: string; surface: string; examples?: { target: string }[] }[];
      for (const l of lexemes) {
        out.push({ text: l.surface, where: `${rel}:${l.id}.surface`, key: "surface" });
        (l.examples ?? []).forEach((e, i) => out.push({ text: e.target, where: `${rel}:${l.id}.examples[${i}]`, key: "target" }));
      }
      continue;
    }
    walk(doc, rel, "", out);
  }
  return out;
}

/** One entry per distinct text, with every place it occurs. */
export function uniqueTargetStrings(strings: TargetString[]): { text: string; where: string[] }[] {
  const byText = new Map<string, string[]>();
  for (const s of strings) byText.set(s.text, [...(byText.get(s.text) ?? []), s.where]);
  return [...byText].map(([text, where]) => ({ text, where })).sort((a, b) => a.text.localeCompare(b.text));
}
