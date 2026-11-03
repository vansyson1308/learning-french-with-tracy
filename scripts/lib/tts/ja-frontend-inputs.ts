/**
 * The re-render gate of the Japanese Kokoro front-end (P4c follow-up).
 *
 * Asset keys hash the clip TEXT, never the phonemes the plan builds from it, so a reading fix (a lexicon kana, a
 * supplement reading, a table or rule of the front-end) would leave every blessed ja clip in place with the old
 * pronunciation. The front-end therefore carries a version that is part of every ja Kokoro clip's key
 * (engines.json `kokoro.phonemeFrontends.ja.version`, scripts/lib/audio-recipe.ts), and `inputsSha256` records what
 * that version was built from. A test (and `audio.ts plan`) recomputes the hash: when an input changed, bump the
 * version and record the new hash, and the next generate re-renders the language.
 *
 * Inputs, as canonical bytes:
 *  - the reading fields the speech index reads from content/ja/lexicon/lexemes.json (surface, lemma, legacy surfaces,
 *    part of speech, reading), in file order — glosses, examples and topics do not reach the audio;
 *  - the readings of content/audio/ja-spoken-readings.json;
 *  - the source text (LF) of the front-end modules: the tables and rules of ja-kana.ts, ja-phonemes.ts,
 *    ja-numbers.ts, and the shared reading index they tokenise with (ja-inflection.ts, script-reading.ts).
 */

import { createHash } from "crypto";

import { JA_LEXICON_REL, SPOKEN_READINGS_REL, type JaLexemeLike, type SpokenReadingsDoc } from "./ja-kana";

export const JA_FRONTEND_SOURCES = [
  "scripts/lib/tts/ja-kana.ts",
  "scripts/lib/tts/ja-phonemes.ts",
  "scripts/lib/tts/ja-numbers.ts",
  "src/lib/languages/ja-inflection.ts",
  "src/lib/learning/script-reading.ts",
] as const;

/** Every file the hash reads (repo-relative). */
export const JA_FRONTEND_INPUTS: readonly string[] = [JA_LEXICON_REL, SPOKEN_READINGS_REL, ...JA_FRONTEND_SOURCES];

const lexemeReadingFields = (l: JaLexemeLike) => [l.surface, l.lemma ?? null, l.legacySurfaces ?? [], l.partOfSpeech, l.reading ?? null];

/** sha256 (hex) over the canonical bytes of the front-end's inputs; `readText` returns a repo-relative file's text. */
export function jaFrontendInputsSha256(readText: (rel: string) => string): string {
  const lexemes = (JSON.parse(readText(JA_LEXICON_REL)) as { lexemes: JaLexemeLike[] }).lexemes;
  const spoken = (JSON.parse(readText(SPOKEN_READINGS_REL)) as SpokenReadingsDoc).readings;
  const canonical = JSON.stringify([
    [JA_LEXICON_REL, lexemes.map(lexemeReadingFields)],
    [SPOKEN_READINGS_REL, spoken.map((r) => [r.surface, r.partOfSpeech, r.kana])],
    ...JA_FRONTEND_SOURCES.map((rel) => [rel, readText(rel).replace(/\r\n/g, "\n")]),
  ]);
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

/** The message of a stale record (test + plan). */
export function staleFrontendMessage(lang: string, recorded: string, actual: string): string {
  return `kokoro.phonemeFrontends.${lang}: its inputs changed (recorded inputsSha256 ${recorded.slice(0, 12)}…, now ${actual}) — bump phonemeFrontends.${lang}.version and update inputsSha256 in content/audio/engines.json, so every ${lang} Kokoro clip re-renders`;
}
