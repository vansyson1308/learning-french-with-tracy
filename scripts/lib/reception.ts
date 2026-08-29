/**
 * Phase-7 reception pipeline library (P7 §43-49, §128-133): loaders,
 * validators and compiled-artifact builders for reading texts and listening
 * clips, plus the SHARED asset-key derivation the generation workflow and
 * the compiler must agree on byte-for-byte.
 */

import { createHash } from "crypto";
import { existsSync, readdirSync } from "fs";

import {
  ListeningSchema,
  ReadingsSchema,
  type CourseObjectives,
  type Listening,
  type ListeningClip,
  type Readings,
  type ReadingSource,
} from "../../content/schema";
import { readJson, safeResolve, type ValidationResult } from "./pipeline";

export const READINGS_SOURCE = "content/fr/reception/reading.json";
export const LISTENING_SOURCE = "content/fr/reception/listening.json";
export const RECEPTION_ASSETS_DIR = "assets/audio/fr-reception";
export const RECEPTION_PIPELINE_VERSION = 1;

export function loadReadings(): Readings | null {
  if (!existsSync(safeResolve(READINGS_SOURCE))) return null;
  return ReadingsSchema.parse(readJson(READINGS_SOURCE));
}

export function loadListening(): Listening | null {
  if (!existsSync(safeResolve(LISTENING_SOURCE))) return null;
  return ListeningSchema.parse(readJson(LISTENING_SOURCE));
}

// ---------------------------------------------------------------------------
// Shared asset identity (P7 §27, §131-132)
// ---------------------------------------------------------------------------

export type ResolvedSegment = { voiceId: string; speaker: number | null; text: string };

/** MUST stay in lockstep with scripts/reception-audio.ts (same hash inputs). */
export function receptionAssetKey(
  segments: ResolvedSegment[],
  pipelineVersion = RECEPTION_PIPELINE_VERSION
): string {
  const canonical = JSON.stringify([
    "fr",
    segments.map((s) => [s.voiceId, s.speaker, s.text]),
    1.0,
    pipelineVersion,
  ]);
  return createHash("sha256").update(canonical).digest("hex").slice(0, 20);
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

// ---------------------------------------------------------------------------
// Validation (P7 §128-130)
// ---------------------------------------------------------------------------

export function validateReception(input: {
  readings: Readings | null;
  listening: Listening | null;
  objectives: CourseObjectives;
  lexemeIds: Set<string>;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const err = (m: string) => errors.push(`reception: ${m}`);
  const known = new Set(input.objectives.objectives.map((o) => o.id));

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
    if (tokens > 90) err(`${reading.id}: ${tokens} tokens exceeds the beginner cap of 90 (P7 §52)`);
  }

  const clipIds = new Set<string>();
  const listening = input.listening;
  if (listening) {
    const assetsAbs = safeResolve(RECEPTION_ASSETS_DIR);
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
      if (totalChars > 220) {
        err(`${clip.id}: transcript length ${totalChars} chars exceeds the beginner clip cap (P7 §58)`);
      }
      // Deterministic bundled audio (P7 §26): once ANY generated asset
      // exists, every clip must resolve to its committed file; before the
      // first generation run this is a warning so authoring can iterate.
      const key = receptionAssetKey(resolveClipSegments(listening, clip));
      const fileName = `${key}.mp3`;
      if (assetsPresent) {
        if (!assetFiles.has(fileName)) {
          err(
            `${clip.id}: generated asset ${fileName} missing — run the reception-audio generate workflow (P7 §26)`
          );
        }
      } else {
        warnings.push(
          `reception: ${clip.id} has no generated asset yet (bootstrap state — dispatch the generate workflow before shipping)`
        );
      }
    }
  }

  return { errors, warnings };
}

// ---------------------------------------------------------------------------
// Compiled artifacts (P7 §128, §43)
// ---------------------------------------------------------------------------

export function compileReadingsArtifact(readings: Readings): string {
  const byId: Record<string, ReadingSource> = {};
  for (const reading of readings.readings) byId[reading.id] = reading;
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
    const key = receptionAssetKey(resolveClipSegments(listening, clip));
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

/** Static require map so Metro bundles the committed clips (P7 §26, §32). */
export function compileClipAssetsModule(listening: Listening): string {
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
    const key = receptionAssetKey(resolveClipSegments(listening, clip));
    lines.push(`  "${clip.id}": require("../../../assets/audio/fr-reception/${key}.mp3"),`);
  }
  lines.push("};", "");
  return lines.join("\n");
}

/** Durations from the generated quality report (null-safe pre-generation). */
export function loadClipDurations(): Map<string, number> {
  const durations = new Map<string, number>();
  const reportPath = "content/reports/reception-audio-quality.json";
  if (!existsSync(safeResolve(reportPath))) return durations;
  const report = readJson(reportPath) as {
    clips?: { clipId: string; durationSec: number }[];
  };
  for (const clip of report.clips ?? []) durations.set(clip.clipId, clip.durationSec);
  return durations;
}
