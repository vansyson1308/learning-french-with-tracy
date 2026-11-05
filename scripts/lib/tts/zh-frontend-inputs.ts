/**
 * The re-render gate of the Mandarin Kokoro front-end (P4d), as for ja (scripts/lib/tts/ja-frontend-inputs.ts).
 *
 * Asset keys hash the clip TEXT, never the phonemes the plan builds from it, so a reading fix (a lexicon pinyin, a
 * sandhi or table rule) would leave every blessed zh clip in place with the old pronunciation. The front-end therefore
 * carries a version that is part of every zh Kokoro clip's key (engines.json `kokoro.phonemeFrontends.zh.version`,
 * scripts/lib/audio-recipe.ts), and `inputsSha256` records what that version was built from. A test (and
 * `audio.ts plan`) recomputes the hash: when an input changed, bump the version and record the new hash, and the next
 * generate re-renders the language.
 *
 * Inputs, as canonical bytes:
 *  - the reading fields the speech index reads from content/zh/lexicon/lexemes.json (surface, pinyin) and the
 *    syllables src/lib/languages/zh.ts parsePinyinReading makes of each pinyin, in file order — glosses, examples,
 *    traditional spellings and topics do not reach the audio;
 *  - what chineseTwoBeforeMeasure (src/lib/languages/zh.ts) does: its measure words and its output on probes. The rest
 *    of zh.ts (graders, normalisers) does not reach the audio, so its source is not an input — a grader fix must not
 *    re-render every zh clip;
 *  - the source text (LF) of the front-end: zh-readings.ts, zh-phonemes.ts, zh-numbers.ts, the sandhi rule
 *    (scripts/lib/zh-sandhi.ts) and the shared reading index (src/lib/learning/script-reading.ts, as for ja).
 */

import { createHash } from "crypto";

import { CHINESE_MEASURE_WORDS, chineseTwoBeforeMeasure, parsePinyinReading } from "../../../src/lib/languages/zh";

import { ZH_LEXICON_REL, type ZhLexemeLike } from "./zh-readings";

export const ZH_FRONTEND_SOURCES = [
  "scripts/lib/tts/zh-readings.ts",
  "scripts/lib/tts/zh-phonemes.ts",
  "scripts/lib/tts/zh-numbers.ts",
  "scripts/lib/zh-sandhi.ts",
  "src/lib/learning/script-reading.ts",
] as const;

/** Every file the hash reads (repo-relative). */
export const ZH_FRONTEND_INPUTS: readonly string[] = [ZH_LEXICON_REL, ...ZH_FRONTEND_SOURCES];

/** Probes of the 2 → 两 rule (with and without a measure word, after a digit, repeated). */
const TWO_PROBES = [...CHINESE_MEASURE_WORDS.map((m) => `2${m}`), "12个", "买2本", "2", "22个", "2个2本"];

/** sha256 (hex) over the canonical bytes of the front-end's inputs; `readText` returns a repo-relative file's text. */
export function zhFrontendInputsSha256(readText: (rel: string) => string): string {
  const lexemes = (JSON.parse(readText(ZH_LEXICON_REL)) as { lexemes: ZhLexemeLike[] }).lexemes;
  const canonical = JSON.stringify([
    [ZH_LEXICON_REL, lexemes.map((l) => [l.surface, l.reading?.pinyin ?? null, l.reading?.pinyin ? parsePinyinReading(l.reading.pinyin) : null])],
    ["chineseTwoBeforeMeasure", TWO_PROBES.map(chineseTwoBeforeMeasure)],
    ...ZH_FRONTEND_SOURCES.map((rel) => [rel, readText(rel).replace(/\r\n/g, "\n")]),
  ]);
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}
