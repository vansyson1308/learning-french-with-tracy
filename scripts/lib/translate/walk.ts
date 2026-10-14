/**
 * Every translatable native-language string of one target language (P2b):
 * the `Record<nativeCode,string>` records of content/<target>/** (reused
 * from the compiler's own walker), the plain exercise payloads of the
 * assessment banks (per native-field table), and the course pack of the
 * source native language (pack-level fields + exercise native fields).
 *
 * Each unit of work is a `Slot`: a stable key (`<file>#<path>`), the
 * source text, and a setter that writes the draft back into the loaded
 * document. Keys are deterministic so a drafts file survives re-runs.
 */
import { existsSync } from "fs";

import type { PackSource } from "../../../content/schema";
import { exerciseNativeFieldPaths, getPath, packNativeFieldPaths, setPath } from "../native-fields";
import { readJson, safeResolve } from "../pipeline";

export type Slot = {
  key: string;
  source: string;
  /** What kind of text this is (review-sheet grouping + special handling). */
  kind: "text" | "markdown" | "exercise";
  exerciseType?: string;
  /** Hint for structured drafts (wordBank answer/tokens, typeAnswer answer). */
  note?: string;
};

type Json = Record<string, unknown>;

/** The native-text records of a loaded content/<target> document, by dot path. */
function nativeRecordPaths(doc: unknown, path = ""): string[] {
  const out: string[] = [];
  if (Array.isArray(doc)) {
    doc.forEach((v, i) => out.push(...nativeRecordPaths(v, path ? `${path}.${i}` : String(i))));
  } else if (doc && typeof doc === "object") {
    const o = doc as Json;
    const values = Object.values(o);
    const looksNative = values.length > 0 && values.every((v) => typeof v === "string") && Object.keys(o).every((k) => /^[a-z]{2,3}$/.test(k));
    if (looksNative && typeof o.en === "string") {
      out.push(path);
      return out;
    }
    for (const [k, v] of Object.entries(o)) out.push(...nativeRecordPaths(v, path ? `${path}.${k}` : k));
  }
  return out;
}

export type LoadedDoc = { rel: string; doc: Json; to?: string };

export const CONTENT_FILES = [
  "lexicon/lexemes.json",
  "pedagogy/concepts.json",
  "pedagogy/paradigms.json",
  "assessment/objectives.json",
  "assessment/checkpoints.json",
  "assessment/placement.json",
  "reception/reading.json",
  "speech/items.json",
  "writing/tasks.json",
  "interaction/scenarios.json",
] as const;

export function loadContentDocs(target: string): LoadedDoc[] {
  const out: LoadedDoc[] = [];
  for (const rel of CONTENT_FILES) {
    const file = `content/${target}/${rel}`;
    if (existsSync(safeResolve(file))) out.push({ rel: file, doc: readJson(file) as Json });
  }
  return out;
}

/** Slots of the native-text records of a document (`{en, vi}` maps). */
export function recordSlots(loaded: LoadedDoc, from: string): { slot: Slot; set: (value: string) => void }[] {
  const out: { slot: Slot; set: (value: string) => void }[] = [];
  for (const path of nativeRecordPaths(loaded.doc)) {
    const record = getPath(loaded.doc, path) as Record<string, string>;
    const source = record[from];
    if (typeof source !== "string") continue;
    const markdown = /explanation|guidebook/.test(path);
    out.push({
      slot: { key: `${loaded.rel}#${path}`, source, kind: markdown ? "markdown" : "text" },
      set: (value) => {
        loaded.doc = setPath(loaded.doc, path, { ...record, [loaded.to ?? "vi"]: value }) as Json;
      },
    });
  }
  return out;
}

/**
 * Slots of the assessment item payloads (`exercise` fields in the
 * document's native language); the draft lands in `exerciseNative.<to>`.
 */
export function assessmentOverlaySlots(loaded: LoadedDoc, from: string, to: string): { slot: Slot; set: (value: string) => void }[] {
  const out: { slot: Slot; set: (value: string) => void }[] = [];
  const doc = loaded.doc;
  const docNative = (doc.exerciseNativeCode as string | undefined) ?? "en";
  if (docNative !== from) return out;
  const visit = (itemPath: string) => {
    const item = getPath(doc, itemPath) as Json | undefined;
    if (!item || typeof item.exercise !== "object") return;
    const exercise = item.exercise as Json;
    for (const p of exerciseNativeFieldPaths(exercise)) {
      const source = getPath(exercise, p) as string;
      out.push({
        slot: { key: `${loaded.rel}#${itemPath}.exercise.${p}`, source, kind: "exercise", exerciseType: exercise.type as string },
        set: (value) => {
          const current = (getPath(loaded.doc, `${itemPath}.exerciseNative.${to}`) as Record<string, string> | undefined) ?? {};
          loaded.doc = setPath(loaded.doc, `${itemPath}.exerciseNative.${to}`, { ...current, [p]: value }) as Json;
        },
      });
    }
  };
  if (Array.isArray(doc.checkpoints)) {
    (doc.checkpoints as Json[]).forEach((cp, c) => (cp.items as Json[]).forEach((_, i) => visit(`checkpoints.${c}.items.${i}`)));
  }
  if (Array.isArray(doc.stages)) {
    (doc.stages as Json[]).forEach((st, s) =>
      (st.clusters as Json[]).forEach((cl, c) => (cl.items as Json[]).forEach((_, i) => visit(`stages.${s}.clusters.${c}.items.${i}`)))
    );
  }
  return out;
}

export const WORD_BANK_NOTE = "wordBank (target→native): draft the whole native ANSWER sentence under `answer` and extra DISTRACTOR tokens under `distractors`; tokens are rebuilt from them (word order may differ from the source)";
export const TYPE_ANSWER_NOTE = "typeAnswer (translate): draft the native ANSWER sentence under `answer` and accepted variants under `alternatives`";

/** Slots of a course pack (source native language) — pack fields and exercise native fields. */
export function packSlots(pack: PackSource, rel: string): { slot: Slot; path: string }[] {
  const out: { slot: Slot; path: string }[] = [];
  const seenExercise = new Set<string>();
  for (const entry of packNativeFieldPaths(pack)) {
    const value = getPath(pack, entry.path);
    if (typeof value !== "string") continue;
    if (entry.exercise && entry.exercisePath) {
      const type = entry.exercise.type as string;
      // wordBank answer/tokens and typeAnswer answer/alternatives are drafted
      // as ONE structured record per exercise (word order differs).
      if (type === "wordBank" && entry.exercise.direction === "targetToNative") {
        if (seenExercise.has(entry.exercisePath)) continue;
        seenExercise.add(entry.exercisePath);
        const answer = (entry.exercise.answer as string[]).join(" ");
        const tokens = entry.exercise.tokens as string[];
        const distractors = tokens.filter((t) => !(entry.exercise!.answer as string[]).includes(t));
        out.push({
          slot: { key: `${rel}#${entry.exercisePath}.wordBank`, source: JSON.stringify({ answer, distractors }), kind: "exercise", exerciseType: type, note: WORD_BANK_NOTE },
          path: entry.exercisePath,
        });
        continue;
      }
      if (type === "typeAnswer" && entry.exercise.mode === "translate") {
        if (seenExercise.has(entry.exercisePath)) continue;
        seenExercise.add(entry.exercisePath);
        out.push({
          slot: {
            key: `${rel}#${entry.exercisePath}.typeAnswer`,
            source: JSON.stringify({ answer: entry.exercise.answer, alternatives: entry.exercise.alternatives ?? [] }),
            kind: "exercise",
            exerciseType: type,
            note: TYPE_ANSWER_NOTE,
          },
          path: entry.exercisePath,
        });
        continue;
      }
      out.push({ slot: { key: `${rel}#${entry.path}`, source: value, kind: "exercise", exerciseType: type }, path: entry.path });
      continue;
    }
    out.push({ slot: { key: `${rel}#${entry.path}`, source: value, kind: entry.path.endsWith("guidebook") ? "markdown" : "text" }, path: entry.path });
  }
  return out;
}
