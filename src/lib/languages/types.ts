/**
 * Language rules (P1b): everything the runtime needs to know about a TARGET
 * language that is not course content — how to fold and compare text, how
 * to tokenise it, how its numbers are spelt, how its articles cue gender,
 * and which locales its speech services use. One plugin per language code
 * under src/lib/languages/<code>.ts; `fr.ts` holds the logic the French
 * course shipped with, byte-for-byte in behaviour (golden-pinned).
 *
 * No plugin ever reads course content or learner state: these are pure
 * string functions so the engine, the graders and the lexicon search can
 * call them for the session's course without knowing which language it is.
 */

/**
 * P4b: a course's own words, handed to a plugin that segments or reads
 * text by dictionary (ja/zh/ko). Built by src/lib/languages/index.ts from
 * the course's compiled lexicon index; the plugin stays a pure function of
 * what it is given.
 */
export type CourseLexicon = {
  entries: readonly {
    /** The course spelling (zh: simplified). */
    surface: string;
    /** Stored reading, labelled with its notation ("kana", "pinyin" — syllables space-separated). */
    reading?: { value: string; notation: string };
    /** Other spellings of the same word that fold to `surface` (zh: traditional). */
    variants?: readonly string[];
  }[];
};

/**
 * P4b: reading-speed band of a language, counted in its own units —
 * characters for ja/zh, hangul syllable blocks for ko — never letters.
 * Not the build side's speaking-rate plausibility band for audio QA
 * (scripts/lib/languages/generic.ts), which stays per script and wider.
 */
export type CharsPerSecBand = {
  unit: "character" | "syllable";
  /** Adult native speakers, mean ± 1 SD, units per second. */
  native: { min: number; max: number };
  /** Where the numbers come from; `estimate: true` when no published norm backs them. */
  source: string;
  estimate: boolean;
};

export type LanguageRules = {
  /** ISO 639-1 code ("fr", "vi", …). */
  code: string;
  /** Device TTS locale (BCP-47). */
  ttsLocale: string;
  /** Speech-recognition locale (BCP-47). */
  recognitionLocale: string;
  /**
   * The article a lexeme surface leads with, when the language cues gender
   * through articles ("le", "la", "l'"); undefined for other languages and
   * for surfaces that carry none. `pos` lets noun-only cues stay noun-only.
   */
  articleCue(surface: string, pos?: string): string | undefined;
  /** Surface → its article (if any) and the bare word. */
  splitArticle(surface: string): { article?: string; bare: string };
  /** Cardinal number as words, when the language has a verified speller. */
  numberToWords?(value: number): string;
  /**
   * One spoken/written TOKEN: standalone digit strings become number words
   * (the speech grader's "2 chats" ≡ "deux chats"); every other token is
   * returned unchanged. Identity for languages without a speller.
   */
  spellDigits(token: string): string;
  /** Lenient comparison form: case, punctuation and (where safe) diacritics folded. */
  normalizeLenient(text: string): string;
  /**
   * A second lenient form under which two typed texts ALSO count as equal
   * (German: ä/ö/ü spelt ae/oe/ue). Absent for languages without one.
   */
  normalizeLenientAlternate?(text: string): string;
  /**
   * A typed answer rewritten toward one key, both already in the lenient form: where the key
   * has a word of this language's variety and the answer has the other variety's word for it
   * ("an apartment" / "a flat"). Pair-aware because the pair holds only for that key's meaning;
   * a unary fold would turn every "flat" into "apartment". Absent for most languages.
   */
  alignAnswerToKey?(answer: string, key: string): string;
  /**
   * P4b: the reading notation alignAnswerToKey accepts for a key written in
   * the target script (ja: kana for kanji, zh: pinyin for hanzi). An answer
   * that matches ONLY through it is practice, never production evidence,
   * unless the course profile sets `readingInputIsProduction`
   * (src/lib/grading.ts readingOnlyAnswer). Absent = every alignment this
   * plugin makes is a same-script match (English varieties).
   */
  readingInput?: "kana" | "pinyin";
  /** The same for one key's run inside free writing, where the answer's words have no fixed meaning: stricter about which words it rewrites. */
  alignWrittenToKey?(answer: string, key: string): string;
  /** Strict comparison form: case/space folded, every letter and mark kept. */
  normalizeStrict(text: string): string;
  /**
   * Spoken-form folding WITHOUT digit conversion: case, ligatures,
   * apostrophes, hyphens, punctuation and whitespace unified into single
   * spaces — the shape recognizer output and authored variants share.
   */
  foldSpoken(text: string): string;
  /** Words of an already-folded string (whitespace for Latin scripts; segmenter/characters for CJK). */
  tokenize(folded: string): string[];
  /** Search folding (ligatures + lowercase + diacritics), mirrored by the SQLite FTS tokenizer. */
  fold(text: string): string;
  /**
   * P4b: the same plugin bound to a course's words (dictionary tokenizer,
   * stored readings, variant spellings). Absent for plugins that need none.
   */
  withLexicon?(lexicon: CourseLexicon): LanguageRules;
  /**
   * P4b: the READING of an already-normalized spoken form (tokens joined by
   * single spaces, as normalizeSpoken returns): each token replaced by its
   * stored reading, kana folded (ja: 学生 → がくせい). The speech grader
   * also accepts a transcript whose reading equals an authored variant's —
   * the recognizer may write a word in kana or in kanji. Absent = no
   * reading layer (every other language).
   */
  spokenReading?(normalized: string): string;
  /** P4b: reading-speed band (CJK: characters, not letters). Absent = not stated. */
  charsPerSecBand?: CharsPerSecBand;
  /**
   * P3e: the target language's own names for the post-answer grammar note —
   * person labels per paradigm cell (es: "vosotros"), the present tense's
   * name and the genders its articles cue. Absent = no person/tense/gender
   * wording (the note degrades to "a form").
   */
  grammarLabels?: {
    persons: Partial<Record<"pre:1s" | "pre:2s" | "pre:3s" | "pre:1p" | "pre:2p" | "pre:3p", string>>;
    presentTense: string;
    articleGenders: Record<string, "masculine" | "feminine" | "neuter">;
  };
};
