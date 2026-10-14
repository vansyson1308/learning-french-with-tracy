/**
 * Runtime access to the compiled reception artifacts, per course (P1b).
 * Content only — learner state lives in the store. Scored listening
 * resolves ONLY through the committed deterministic assets of the course's
 * clip-asset module; a clip with no bundled asset returns null audio and
 * the UI treats it as unavailable (never device TTS, P7 §25-26). A course
 * without reception content resolves nothing.
 */

import { artifactsFor, memoByCourse } from "../content-registry";

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

type Ordered<T> = { order: string[]; byId: Record<string, T> };
const EMPTY: Ordered<never> = { order: [], byId: {} };

const listeningOf = memoByCourse<Ordered<CompiledClip>>(
  (courseId) => (artifactsFor(courseId).listening as Ordered<CompiledClip> | undefined) ?? EMPTY
);
const readingOf = memoByCourse<Ordered<CompiledReading>>(
  (courseId) => (artifactsFor(courseId).reading as Ordered<CompiledReading> | undefined) ?? EMPTY
);
const clipAssetsOf = memoByCourse<Record<string, number>>((courseId) => artifactsFor(courseId).clipAssets ?? {});

export function clipFor(courseId: string, id: string): CompiledClip | undefined {
  return listeningOf(courseId).byId[id];
}

export function readingFor(courseId: string, id: string): CompiledReading | undefined {
  return readingOf(courseId).byId[id];
}

/** Bundled deterministic audio module for a clip; null before generation. */
export function clipAudioSource(courseId: string, id: string): number | null {
  return clipAssetsOf(courseId)[id] ?? null;
}

export function clipOrder(courseId: string): readonly string[] {
  return listeningOf(courseId).order;
}

export function readingOrder(courseId: string): readonly string[] {
  return readingOf(courseId).order;
}

/**
 * Word-clip index (P7 §72-78): lexemeId → the clip that can serve as its
 * auditory stimulus. Only single-lexeme word_phrase clips WITH a bundled
 * deterministic asset qualify — a listen card can never be reviewed off
 * device TTS, and a clip whose audio has not been generated yet simply
 * leaves its lexeme unreviewable (the card stays due). First clip in
 * authored order wins, deterministically.
 */
export const listenWordClipIndex = memoByCourse<Record<string, string>>((courseId) => {
  const listening = listeningOf(courseId);
  const index: Record<string, string> = {};
  for (const id of listening.order) {
    const clip = listening.byId[id];
    if (!clip || clip.kind !== "word_phrase") continue;
    if (clip.lexemeRefs.length !== 1) continue;
    if (clipAudioSource(courseId, id) === null) continue;
    const lexemeId = clip.lexemeRefs[0];
    if (index[lexemeId] === undefined) index[lexemeId] = id;
  }
  return index;
});
