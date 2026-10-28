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
