/**
 * Phase-7 reception pipeline library (P7 §43-49, §128-133; per target
 * language since P1c): loaders, validators and compiled-artifact builders
 * for reading texts and listening clips, plus the SHARED asset-key
 * derivation the generation workflow and the compiler must agree on
 * byte-for-byte.
 */

import { createHash } from "crypto";
import { existsSync, readdirSync } from "fs";

import {
  listeningSchema,
  readingsSchema,
  type CourseObjectives,
  type Listening,
  type ListeningClip,
  type Readings,
} from "../../content/schema";
import { receptionClipRecipe } from "./audio-recipe";
import { localizeReading } from "./native-text";
import { canonicalJson, readJson, safeResolve, type ValidationResult } from "./pipeline";

export const RECEPTION_PIPELINE_VERSION = 1;

/**
 * P3f: the pipeline version a language's reception assets are keyed with —
 * the one its voice manifest (content/<lang>/reception/audio-source-manifest.json)
 * declares, as `audio.ts plan` uses it (French: 1, frozen; Spanish: 3).
 */
export function receptionPipelineVersion(lang: string): number {
  const rel = `content/${lang}/reception/audio-source-manifest.json`;
  if (!existsSync(safeResolve(rel))) return RECEPTION_PIPELINE_VERSION;
  const v = (readJson(rel) as { pipelineVersion?: unknown }).pipelineVersion;
  return typeof v === "number" ? v : RECEPTION_PIPELINE_VERSION;
}

export function readingsSourcePath(lang: string): string {
  return `content/${lang}/reception/reading.json`;
}
export function listeningSourcePath(lang: string): string {
  return `content/${lang}/reception/listening.json`;
}
/** Committed deterministic clips of a language. */
export function receptionAssetsDir(lang: string): string {
  return `assets/audio/${lang}-reception`;
}

/**
 * Generated-asset file extension by audio policy: synthesized MP3s for
 * shipped languages, generated WAV tones for the synthetic test language.
 */
export type ReceptionAssetKind = "mp3" | "wav";

export function loadReadings(lang: string): Readings | null {
  const rel = readingsSourcePath(lang);
  if (!existsSync(safeResolve(rel))) return null;
  const doc = readingsSchema(lang).parse(readJson(rel));
  if (doc.language !== lang) throw new Error(`${rel}: language "${doc.language}" ≠ folder "${lang}"`);
  return doc;
}

export function loadListening(lang: string): Listening | null {
  const rel = listeningSourcePath(lang);
  if (!existsSync(safeResolve(rel))) return null;
  const doc = listeningSchema(lang).parse(readJson(rel));
  if (doc.language !== lang) throw new Error(`${rel}: language "${doc.language}" ≠ folder "${lang}"`);
  return doc;
}

// ---------------------------------------------------------------------------
// Shared asset identity (P7 §27, §131-132)
// ---------------------------------------------------------------------------

export type ResolvedSegment = { voiceId: string; speaker: number | string | null; text: string };

/**
 * MUST stay in lockstep with scripts/reception-audio.ts (same hash inputs).
 * `recipe` (scripts/lib/audio-recipe.ts): a non-default render recipe, e.g.
 * a declared re-synthesis; absent for every default clip, whose key is unchanged.
 */
export function receptionAssetKey(
  lang: string,
  segments: ResolvedSegment[],
  pipelineVersion = RECEPTION_PIPELINE_VERSION,
  recipe: string | null = null
): string {
  const canonical = JSON.stringify([
    lang,
    segments.map((s) => [s.voiceId, s.speaker, s.text]),
    1.0,
    pipelineVersion,
    ...(recipe === null ? [] : [recipe]),
  ]);
  return createHash("sha256").update(canonical).digest("hex").slice(0, 20);
}

/**
 * The key of a listening clip as the plan, the validator and the compiler
 * all derive it: the default recipe unless the language's voice manifest
 * declares a re-synthesis of this clip (QC 2026-10-29b §3.4).
 */
export function listeningClipKey(lang: string, listening: Listening, clip: ListeningClip): string {
  return receptionAssetKey(lang, resolveClipSegments(listening, clip), receptionPipelineVersion(lang), receptionClipRecipe(lang, clip.id));
}

export function resolveClipSegments(
  listening: Listening,
  clip: ListeningClip
): ResolvedSegment[] {
  return clip.segments.map((seg) => ({
    voiceId: listening.voiceCast[seg.speaker].voiceId,
    speaker: listening.voiceCast[seg.speaker].speaker,
    text: seg.text,
  }));
}

function clipFileName(lang: string, listening: Listening, clip: ListeningClip, kind: ReceptionAssetKind): string {
  return `${listeningClipKey(lang, listening, clip)}.${kind}`;
}

// ---------------------------------------------------------------------------
// Validation (P7 §128-130)
// ---------------------------------------------------------------------------

export type PackForReception = {
  sections: { units: { lessons: { exercises: { type: string; id: string }[] }[] }[] }[];
};

export function validateReception(input: {
  lang: string;
  readings: Readings | null;
  listening: Listening | null;
  objectives: CourseObjectives | null;
  lexemeIds: Set<string>;
  /** Every clipId/readingId used by these packs' exercises must resolve. */
  packs?: PackForReception[];
  assetKind?: ReceptionAssetKind;
  /** Asset files other reception sources reference (P5b story sentences): never orphans. */
  otherReferencedFiles?: ReadonlySet<string>;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const err = (m: string) => errors.push(`reception: ${m}`);
  const known = new Set((input.objectives?.objectives ?? []).map((o) => o.id));
  const assetKind = input.assetKind ?? "mp3";

  const readingIds = new Set<string>();
  for (const reading of input.readings?.readings ?? []) {
    if (readingIds.has(reading.id)) err(`duplicate reading id ${reading.id}`);
    readingIds.add(reading.id);
    for (const oid of reading.objectiveRefs) {
      if (!known.has(oid)) err(`${reading.id}: unknown objective ${oid}`);
    }
    for (const lid of reading.lexemeRefs) {
      if (!input.lexemeIds.has(lid)) err(`${reading.id}: unknown lexeme ${lid}`);
    }
    const lineBlocks = reading.blocks.filter((b) => b.kind === "line").length;
    if (reading.kind === "dialogue" && lineBlocks !== reading.blocks.length) {
      err(`${reading.id}: dialogue readings must use speaker-labeled line blocks only`);
    }
    if (reading.kind !== "dialogue" && lineBlocks > 0) {
      err(`${reading.id}: only dialogue readings may use line blocks`);
    }
    const fullText = reading.blocks.map((b) => b.text).join("\n");
    for (const g of reading.supportGlossary) {
      if (!fullText.toLowerCase().includes(g.surface.toLowerCase())) {
        err(`${reading.id}: glossary surface "${g.surface}" does not appear in the text`);
      }
    }
    const tokens = fullText.split(/\s+/).filter(Boolean).length;
    const cap = reading.use === "exam" ? 260 : 90;
    if (tokens > cap) err(`${reading.id}: ${tokens} tokens exceeds the ${reading.use === "exam" ? "exam-text" : "beginner"} cap of ${cap} (P7 §52, P3e)`);
  }

  const clipIds = new Set<string>();
  const listening = input.listening;
  if (listening) {
    const assetsAbs = safeResolve(receptionAssetsDir(input.lang));
    const assetsPresent = existsSync(assetsAbs);
    const assetFiles = assetsPresent ? new Set(readdirSync(assetsAbs)) : new Set<string>();
    for (const clip of listening.clips) {
      if (clipIds.has(clip.id)) err(`duplicate clip id ${clip.id}`);
      clipIds.add(clip.id);
      for (const oid of clip.objectiveRefs) {
        if (!known.has(oid)) err(`${clip.id}: unknown objective ${oid}`);
      }
      for (const lid of clip.lexemeRefs) {
        if (!input.lexemeIds.has(lid)) err(`${clip.id}: unknown lexeme ${lid}`);
      }
      const speakers = new Set(clip.segments.map((s) => s.speaker));
      if (clip.kind === "dialogue") {
        if (clip.segments.length < 2 || speakers.size < 2) {
          err(`${clip.id}: dialogue clips need ≥2 segments across both speakers`);
        }
      } else if (speakers.size > 1) {
        err(`${clip.id}: non-dialogue clips must use a single speaker`);
      }
      for (const seg of clip.segments) {
        if (/[\t\n\r]/.test(seg.text)) err(`${clip.id}: segment text must be single-line`);
      }
      // Product-local scored rule (P7 §67): two deliberate plays, always.
      if (clip.scoredPlaybackPolicy.maxPlays !== 2) {
        err(`${clip.id}: scoredPlaybackPolicy.maxPlays must be 2 (product rule, §67)`);
      }
      const totalChars = clip.segments.reduce((n, s) => n + s.text.length, 0);
      if (totalChars > (clip.use === "exam" ? 1400 : 220)) {
        err(`${clip.id}: transcript length ${totalChars} chars exceeds the ${clip.use === "exam" ? "exam" : "beginner"} clip cap (P7 §58, P3e)`);
      }
      if (clip.use !== "exam" && clip.segments.length > 4) err(`${clip.id}: teaching clips have at most 4 segments`);
      // Deterministic bundled audio (P7 §26): every clip resolves to its committed file.
      // P3d(it): the first-generation warning let a language pass with no reception audio at all.
      const fileName = clipFileName(input.lang, listening, clip, assetKind);
      if (!assetFiles.has(fileName)) {
        err(
          `${clip.id}: generated asset ${fileName} missing — run the reception-audio generate workflow (P7 §26)`
        );
      }
    }
    // Census invariant (P8 Gate 0): every physical file must be a REFERENCED
    // asset key. Orphans creep in when an authored transcript changes (the
    // key moves) — Phase 7 cleaned one by hand; the validator now catches it.
    if (assetsPresent) {
      const referenced = new Set(listening.clips.map((c) => clipFileName(input.lang, listening, c, assetKind)));
      for (const file of assetFiles) {
        if (file.endsWith(`.${assetKind}`) && !referenced.has(file) && !input.otherReferencedFiles?.has(file)) {
          err(`orphan asset ${file}: no authored clip resolves to it — delete it or restore its clip`);
        }
      }
    }
  }

  for (const pack of input.packs ?? []) {
    const knownClips = new Set((input.listening?.clips ?? []).map((c) => c.id));
    const knownReadings = new Set((input.readings?.readings ?? []).map((r) => r.id));
    const examClips = new Set((input.listening?.clips ?? []).filter((c) => c.use === "exam").map((c) => c.id));
    const examReadings = new Set((input.readings?.readings ?? []).filter((r) => r.use === "exam").map((r) => r.id));
    for (const section of pack.sections) {
      for (const unit of section.units) {
        for (const lesson of unit.lessons) {
          for (const e of lesson.exercises) {
            const clipRef = (e as { clipId?: string }).clipId;
            const readingRef = (e as { readingId?: string }).readingId;
            if ((e.type === "listeningComprehension" || e.type === "dictation") && clipRef !== undefined) {
              if (!knownClips.has(clipRef)) err(`${e.id}: unknown clip ${clipRef}`);
              if (examClips.has(clipRef)) err(`${e.id}: ${clipRef} is an exam recording — lessons never use exam stimuli (P3e)`);
            }
            if (e.type === "readingComprehension" && readingRef !== undefined) {
              if (!knownReadings.has(readingRef)) err(`${e.id}: unknown reading ${readingRef}`);
              if (examReadings.has(readingRef)) err(`${e.id}: ${readingRef} is an exam text — lessons never use exam stimuli (P3e)`);
            }
          }
        }
      }
    }
  }

  return { errors, warnings };
}

// ---------------------------------------------------------------------------
// Compiled artifacts (P7 §128, §43)
// ---------------------------------------------------------------------------

export function compileReadingsArtifact(readings: Readings, nativeCode: string): string {
  const byId: Record<string, unknown> = {};
  for (const reading of readings.readings) byId[reading.id] = localizeReading(reading, nativeCode);
  return `${JSON.stringify(
    {
      version: readings.version,
      language: readings.language,
      order: readings.readings.map((r) => r.id),
      byId,
    },
    null,
    2
  )}\n`;
}

export type CompiledClip = {
  id: string;
  kind: ListeningClip["kind"];
  /** Speaker-labeled transcript lines for after-answer display. */
  transcriptLines: { speaker: "A" | "B"; text: string }[];
  objectiveRefs: string[];
  lexemeRefs: string[];
  scoredPlaybackPolicy: { maxPlays: number; rate: 1 };
  assetKey: string;
  durationSec: number | null;
};

export function compileListeningArtifact(
  listening: Listening,
  durations: Map<string, number>
): string {
  const byId: Record<string, CompiledClip> = {};
  for (const clip of listening.clips) {
    const key = listeningClipKey(listening.language, listening, clip);
    byId[clip.id] = {
      id: clip.id,
      kind: clip.kind,
      transcriptLines: clip.segments.map((s) => ({ speaker: s.speaker, text: s.text })),
      objectiveRefs: clip.objectiveRefs,
      lexemeRefs: clip.lexemeRefs,
      scoredPlaybackPolicy: clip.scoredPlaybackPolicy,
      assetKey: key,
      durationSec: durations.get(clip.id) ?? null,
    };
  }
  return `${JSON.stringify(
    {
      version: listening.version,
      language: listening.language,
      order: listening.clips.map((c) => c.id),
      byId,
    },
    null,
    2
  )}\n`;
}

/**
 * Audio census (P8 Gate 0) — the three counts are DIFFERENT CONCEPTS and
 * must be reported as such, never forced equal:
 *  - authoredClipCount: logical clips in listening.json (one per clip id);
 *  - uniqueAssetCount: distinct deterministic asset keys — clips whose
 *    resolved segments are identical share one synthesized file by design;
 *  - physicalAssetCount: files actually on disk (0 pre-generation).
 * Internal consistency: physical == unique once generation has run, and
 * every shared asset names the clip ids that share it.
 */
export function compileAudioCensus(
  listening: Listening,
  assetKind: ReceptionAssetKind = "mp3",
  /** Files of other reception sources (P5b story sentences) sharing the folder: not listening assets. */
  otherFiles: ReadonlySet<string> = new Set()
): string {
  const byKey = new Map<string, string[]>();
  for (const clip of listening.clips) {
    const key = listeningClipKey(listening.language, listening, clip);
    byKey.set(key, [...(byKey.get(key) ?? []), clip.id]);
  }
  const assetsAbs = safeResolve(receptionAssetsDir(listening.language));
  const physical = existsSync(assetsAbs)
    ? readdirSync(assetsAbs).filter((f) => f.endsWith(`.${assetKind}`) && !otherFiles.has(f)).length
    : 0;
  return canonicalJson({
    generator: "scripts/lib/reception.ts compileAudioCensus",
    authoredClipCount: listening.clips.length,
    uniqueAssetCount: byKey.size,
    physicalAssetCount: physical,
    generationComplete: physical === byKey.size,
    sharedAssetGroups: [...byKey.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([assetKey, clipIds]) => ({ assetKey, clipIds: [...clipIds].sort() }))
      .sort((a, b) => (a.assetKey < b.assetKey ? -1 : 1)),
  });
}

/**
 * Static require map so Metro bundles the committed clips (P7 §26, §32).
 * Only clips whose generated asset EXISTS are mapped — a dead require would
 * break bundling; the validator separately errors on any missing asset once
 * generation has run, so a shipped build can never lack a mapped clip.
 * `requirePrefix` is the relative path from the emitted module to the repo
 * root ("../../.." from src/content/reception).
 */
export function compileClipAssetsModule(
  listening: Listening,
  requirePrefix: string,
  assetKind: ReceptionAssetKind = "mp3"
): string {
  const lang = listening.language;
  const lines = [
    "/**",
    " * Generated by scripts/compile-content.ts — do not edit.",
    " * Static require map for the committed Phase-7 reception clips: scored",
    " * listening resolves ONLY through these deterministic bundled assets,",
    " * never device TTS (P7 §25-26).",
    " */",
    "",
    "export const RECEPTION_CLIP_ASSETS: Record<string, number> = {",
  ];
  for (const clip of listening.clips) {
    const fileName = clipFileName(lang, listening, clip, assetKind);
    if (!existsSync(safeResolve(receptionAssetsDir(lang), fileName))) continue;
    lines.push(`  "${clip.id}": require("${requirePrefix}/${receptionAssetsDir(lang)}/${fileName}"),`);
  }
  lines.push("};", "");
  return lines.join("\n");
}

/** Durations from the generated quality report (null-safe pre-generation). */
export function loadClipDurations(reportPath: string): Map<string, number> {
  const durations = new Map<string, number>();
  if (!existsSync(safeResolve(reportPath))) return durations;
  const report = readJson(reportPath) as {
    clips?: { clipId: string; durationSec: number }[];
  };
  for (const clip of report.clips ?? []) durations.set(clip.clipId, clip.durationSec);
  return durations;
}
