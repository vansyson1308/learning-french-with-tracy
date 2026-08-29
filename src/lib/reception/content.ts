/**
 * Runtime access to the compiled Phase-7 reception artifacts. Content only —
 * learner state lives in the store. Scored listening resolves ONLY through
 * the committed deterministic assets in RECEPTION_CLIP_ASSETS; a clip with
 * no bundled asset returns null audio and the UI treats it as unavailable
 * (never device TTS, P7 §25-26).
 */

import listeningArtifact from "../../content/reception/fr-listening.json";
import readingArtifact from "../../content/reception/fr-reading.json";
import { RECEPTION_CLIP_ASSETS } from "../../content/reception/fr-clip-assets";

export type ClipTranscriptLine = { speaker: "A" | "B"; text: string };

export type CompiledClip = {
  id: string;
  kind: "word_phrase" | "announcement" | "instruction" | "message" | "dialogue" | "factual";
  transcriptLines: ClipTranscriptLine[];
  objectiveRefs: string[];
  lexemeRefs: string[];
  scoredPlaybackPolicy: { maxPlays: number; rate: 1 };
  assetKey: string;
  durationSec: number | null;
};

export type CompiledReadingBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "line"; speaker: string; text: string };

export type CompiledReading = {
  id: string;
  kind: "notice" | "message" | "dialogue" | "description" | "directions" | "info" | "narrative";
  title?: string;
  blocks: CompiledReadingBlock[];
  objectiveRefs: string[];
  lexemeRefs: string[];
  supportGlossary: { surface: string; gloss: string }[];
};

const listening = listeningArtifact as unknown as {
  order: string[];
  byId: Record<string, CompiledClip>;
};
const reading = readingArtifact as unknown as {
  order: string[];
  byId: Record<string, CompiledReading>;
};

export function clipFor(id: string): CompiledClip | undefined {
  return listening.byId[id];
}

export function readingFor(id: string): CompiledReading | undefined {
  return reading.byId[id];
}

/** Bundled deterministic audio module for a clip; null before generation. */
export function clipAudioSource(id: string): number | null {
  return RECEPTION_CLIP_ASSETS[id] ?? null;
}

export const CLIP_ORDER: readonly string[] = listening.order;
export const READING_ORDER: readonly string[] = reading.order;
