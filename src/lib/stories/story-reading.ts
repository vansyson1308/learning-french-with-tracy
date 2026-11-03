/**
 * The graded-story reader's reading layer (pure): the same display the
 * lessons give a target text of a CJK course, laid over the reader's word
 * tokens so each word stays its own tap target —
 *
 *  - furigana / pinyin / RR over each token, behind the per-course reading-aid
 *    switch: the token's own lexeme reading first (a homograph in the course
 *    index never overrides it), else the course's reading index, inflection
 *    keys included (食べます → furigana over 食);
 *  - the romaji line of a whole sentence while the course shows romaji until
 *    its kana primer is passed (independent of the switch, as in lessons);
 *  - no Hán-Việt on a token: the lessons show it only on a text that is one
 *    single word, which the reader's word sheet is (see scriptReadingFor).
 *
 * A course without stored readings (every Latin-script course) hands in the
 * empty index and gets nothing, so its reader renders as before.
 */
import { buildScriptReadingIndex, romajiLine, scriptReadingFor, type ScriptReading, type ScriptReadingIndex } from "../learning/script-reading";
import type { WordReading } from "../types";

export type StoryReadingOptions = {
  targetCode: string;
  /** The learner's reading-aid switch for the course. */
  furigana: boolean;
  /** The course shows romaji and its kana primer is not passed. */
  romaji: boolean;
};

/** The lexeme a token renders, as the lexicon index stores it. */
export type StoryTokenLexeme = { surface: string; reading?: WordReading };

/** The reading over one word token of a story sentence; undefined when it has none to show. */
export function storyTokenReading(
  word: string,
  lexeme: StoryTokenLexeme | undefined,
  index: ScriptReadingIndex,
  opts: StoryReadingOptions
): ScriptReading | undefined {
  if (!opts.furigana || word.trim().length === 0 || index.bySurface.size === 0) return undefined;
  const layout = { targetCode: opts.targetCode, showHanViet: false, furigana: true, romaji: false };
  if (lexeme?.reading && lexeme.surface === word) {
    const own = buildScriptReadingIndex([{ surface: lexeme.surface, reading: lexeme.reading }]);
    const reading = own.bySurface.size > 0 ? scriptReadingFor(word, own, layout) : undefined;
    if (reading) return reading;
  }
  return scriptReadingFor(word, index, layout);
}

/** The romaji line under a whole story sentence, while the course shows romaji. */
export function storySentenceRomaji(text: string, index: ScriptReadingIndex, opts: StoryReadingOptions): string | undefined {
  if (!opts.romaji || index.bySurface.size === 0) return undefined;
  return romajiLine(text, index);
}
