/**
 * Test helper: the zh course's own words (content/zh/lexicon/lexemes.json) as
 * a CourseLexicon, the way src/lib/languages/index.ts binds a compiled lexicon
 * index — surface, stored pinyin, and the CC-CEDICT traditional spelling.
 */
import zhLexemes from "../../../content/zh/lexicon/lexemes.json";
import type { CourseLexicon } from "../languages";

type Lexeme = { surface: string; pronunciation?: { value: string; notation: string }; reading?: { traditional?: string } };

export const ZH_LEXICON: CourseLexicon = {
  entries: (zhLexemes as { lexemes: Lexeme[] }).lexemes.map((l) => ({
    surface: l.surface,
    ...(l.pronunciation ? { reading: l.pronunciation } : {}),
    ...(l.reading?.traditional && l.reading.traditional !== l.surface ? { variants: [l.reading.traditional] } : {}),
  })),
};
