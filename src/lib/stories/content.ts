/**
 * Runtime access to the compiled graded stories of a course (P5b). Content
 * only — what the learner knows comes from the card states the caller
 * passes in. A course without stories resolves nothing.
 */

import { artifactsFor, memoByCourse } from "../content-registry";

/** A piece of a sentence: its text, and the lexeme it renders when it is a word. */
export type StoryPieceTuple = [string] | [string, string];

export type StorySpeaker = "N" | "A" | "B";

export type CompiledStorySentence = {
  speaker: StorySpeaker;
  text: string;
  /** Native-language translation of the whole sentence (tap-to-gloss). */
  translation: string;
  pieces: StoryPieceTuple[];
  assetKey: string;
  /** Offset in the story's audio and duration; null before generation. */
  startSec: number | null;
  durationSec: number | null;
};

export type CompiledStoryQuestion = {
  kind: "locate" | "infer";
  prompt: string;
  options: string[];
  answer: number;
};

export type CompiledStory = {
  id: string;
  band: "A1-1" | "A1-2" | "A2-1" | "A2-2";
  title: string;
  blurb: string;
  tokens: number;
  /** Distinct lexemes of the text, first-use order (function words excluded). */
  lexemes: string[];
  /** The 3–5 lexemes the story introduces — the only ones its word check grades. */
  newLexemes: string[];
  sentences: CompiledStorySentence[];
  questions: CompiledStoryQuestion[];
};

type StoriesArtifact = { order: string[]; byId: Record<string, CompiledStory> };
const EMPTY: StoriesArtifact = { order: [], byId: {} };

const storiesOf = memoByCourse<StoriesArtifact>(
  (courseId) => (artifactsFor(courseId).stories as StoriesArtifact | undefined) ?? EMPTY
);
const assetsOf = memoByCourse<Record<string, number>>((courseId) => artifactsFor(courseId).storyAssets ?? {});

/** Stories in reading order (band, then authored order). */
export function storyList(courseId: string): CompiledStory[] {
  const { order, byId } = storiesOf(courseId);
  return order.map((id) => byId[id]).filter((s): s is CompiledStory => s !== undefined);
}

export function storyFor(courseId: string, id: string): CompiledStory | undefined {
  return storiesOf(courseId).byId[id];
}

/** Bundled audio module of one sentence; null when its asset is not bundled. */
export function sentenceAudio(courseId: string, sentence: Pick<CompiledStorySentence, "assetKey">): number | null {
  return assetsOf(courseId)[sentence.assetKey] ?? null;
}

/** Every sentence has bundled audio: the reader offers "listen" only then. */
export function storyHasAudio(courseId: string, story: CompiledStory): boolean {
  return story.sentences.length > 0 && story.sentences.every((s) => sentenceAudio(courseId, s) !== null);
}

/** A rendered word of a sentence: its text, the spaces/punctuation that follow it, its lexeme. */
export type ReadingToken = { word: string; trail: string; lexemeId?: string };

/**
 * Pieces → one token per word, so each word is its own view (tap target,
 * accessibility element, testID). Spaces and punctuation that follow a word
 * ride along in its `trail`; tokens concatenate back to the sentence.
 */
export function readingTokens(pieces: readonly StoryPieceTuple[]): ReadingToken[] {
  const out: ReadingToken[] = [];
  for (const [text, lexemeId] of pieces) {
    if (lexemeId) {
      out.push({ word: text, trail: "", lexemeId });
      continue;
    }
    for (const seg of text.match(/\s+|\S+/g) ?? []) {
      const last = out[out.length - 1];
      if (/^\s/.test(seg)) {
        if (last) last.trail += seg;
        else out.push({ word: "", trail: seg });
      } else if (last && last.trail === "") {
        // Punctuation glued to the previous word ("perro," / "Toby!").
        last.trail += seg;
      } else out.push({ word: seg, trail: "" });
    }
  }
  return out;
}

/** Level label without CEFR wording: band 1…4 in reading order. */
export function storyLevel(story: Pick<CompiledStory, "band">): number {
  return ["A1-1", "A1-2", "A2-1", "A2-2"].indexOf(story.band) + 1;
}
