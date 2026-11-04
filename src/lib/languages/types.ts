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
    /** Part of speech from the lexicon index (ja: verbs and い-adjectives get inflection keys). */
    pos?: string;
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

/**
 * QC 2026-11-05 §1.2: how the language negates, as data for the shared matcher
 * (src/lib/languages/negation.ts). A required keyword / concept / slot run that
 * sits inside a negated span does not count — 不是 is not 是, "I don't like" is not
 * "like". Negator phrases are written as learners write them; the matcher folds
 * them with the same normalizer as the text it checks (spoken, written, reading).
 *
 * Spans (all stay inside one clause; clauses end at sentence punctuation and at
 * the `clauseBreaks` words — speech transcripts usually carry no punctuation, so
 * there the whole utterance is one clause unless a break word splits it):
 *  - `clause`: a negator anywhere in the clause negates all of it (de — the
 *    negator follows the verb, often at the end: "ich komme heute nicht");
 *  - `before`: a negator negates what follows it, up to `reach` units between
 *    its end and the keyword's start, or to the clause end (en, fr, es, it, pt;
 *    zh, ko) — the subject before it is not negated;
 *  - `after`: a negator negates what precedes it, the keyword run followed by it
 *    after at most `gap` units (ja ません after the verb; ko -지 않다; en "not"
 *    and fr "pas" after the auxiliary / verb: "I can't" is not "I can").
 * `unit` "word" counts tokens; "text" counts characters of the clause with the
 * token spaces removed (zh/ja/ko, whose segmentation may glue a negator to the
 * next word). An occurrence inside an `idioms` phrase never negates (没问题,
 * "no problem"). A form that itself contains a negator is exempt: when the
 * expected answer is 不是 or "not", the negated form is what is required.
 */
export type NegationRules = {
  unit: "word" | "text";
  clause?: readonly string[];
  /** `wholeToken`: the negator must be a whole token or token run (ko 안, never the 안 of 불안). */
  before?: { negators: readonly string[]; reach: number | "clause"; wholeToken?: boolean };
  after?: { negators: readonly string[]; gap: number };
  idioms?: readonly string[];
  clauseBreaks?: readonly string[];
};

export type LanguageRules = {
  /** ISO 639-1 code ("fr", "vi", …). */
  code: string;
  /** QC 2026-11-05 §1.2: negation data for negation-aware keyword matching. Absent = no negation check. */
  negation?: NegationRules;
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
   * D-10 owner decision (2026-11-03): the lenient form of an item that asks for one script (typeAnswer.script) —
   * width, case and punctuation folded, but never one script into another (ja "katakana": ぱん stays ぱん, so it is
   * not パン). Absent for languages with no such item; the validator then refuses the flag.
   */
  normalizeLenientInScript?(text: string, script: "katakana"): string;
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
  /**
   * The same for one key's run inside free writing, where the answer's words have no fixed meaning: stricter about which
   * words it rewrites. P4c: ja / zh rewrite only a run of tokens written entirely in the reading notation whose
   * reading is the key's stored one (a match through `readingInput`, so practice under the P4b guard).
   */
  alignWrittenToKey?(answer: string, key: string): string;
  /**
   * P4c: whether one token of normalized free writing spells a course word in the reading notation (ja: the kana of
   * 毎日 or of 食べます; zh: the pinyin of 学生). Such a token counts as target-language vocabulary for the writing
   * rubric's "recognizably the target language" floor. Absent = no reading notation (every Latin-script plugin).
   */
  knownReading?(token: string): boolean;
  /** Strict comparison form: case/space folded, every letter and mark kept. */
  normalizeStrict(text: string): string;
  /**
   * QC 2026-11-05 §1.1: a dictation answer in the strict form rewritten toward one key in the same form, where the
   * answer writes the key's words in another script the course accepts (zh: a traditional spelling the course lexicon
   * records for a word → its simplified surface; mixed scripts fold word by word). Grading marks such an answer
   * correct and shows the key, the taught form. Absent = the strict form is the whole contract.
   */
  alignScriptToKey?(answer: string, key: string): string;
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
  /**
   * P4c: the reading of a WHOLE normalized utterance, spaces dropped, with the
   * inflected forms of stored verbs and adjectives read too (ja: 働いています →
   * はたらいています, through ja-inflection.ts). The grader compares whole
   * variants with it; concept slots keep spokenReading's word-level tokens.
   * Absent = the grader compacts spokenReading (zh, ko).
   */
  utteranceReading?(normalized: string): string;
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
