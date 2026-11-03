/**
 * Build-side language registry (P1b facts table + P1c plugins). The facts
 * the compiler bakes into course profiles live here; the runtime twin is
 * src/lib/languages/<code>.ts and the two are cross-checked by test so a
 * locale can never drift between the profile and the plugin.
 * `buildPlugin(code)` is total: unknown codes get the generic plugin under
 * their own code.
 */

import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { genericPlugin } from "./generic";
import { it } from "./it";
import { ja } from "./ja";
import { ko } from "./ko";
import type { BuildLanguage, BuildLanguagePlugin } from "./types";
import { xx } from "./xx";
import { zh } from "./zh";

export type { ArticleGender, ArticleRules, BuildLanguage, BuildLanguagePlugin, GrammarConcept, MorphRow, MorphVerb, ParadigmSpec } from "./types";

export const BUILD_LANGUAGES: Record<string, BuildLanguage> = {
  fr: { code: "fr", recognitionLocale: "fr-FR", ttsLocale: "fr-FR", script: "latin", flagAsset: "fr", numberDrill: fr.numberDrill },
  en: { code: "en", recognitionLocale: "en-US", ttsLocale: "en-US", script: "latin", flagAsset: "us" },
  es: { code: "es", recognitionLocale: "es-ES", ttsLocale: "es-ES", script: "latin", flagAsset: "es" },
  de: { code: "de", recognitionLocale: "de-DE", ttsLocale: "de-DE", script: "latin", flagAsset: "de" },
  it: { code: "it", recognitionLocale: "it-IT", ttsLocale: "it-IT", script: "latin", flagAsset: "it" },
  // The inherited Portuguese pack is Brazilian Portuguese (content and voice).
  pt: { code: "pt", recognitionLocale: "pt-BR", ttsLocale: "pt-BR", script: "latin", flagAsset: "br" },
  ja: { code: "ja", recognitionLocale: "ja-JP", ttsLocale: "ja-JP", script: "japanese", flagAsset: "jp", readings: ["kana"], typedScripts: ["katakana"] },
  ko: { code: "ko", recognitionLocale: "ko-KR", ttsLocale: "ko-KR", script: "hangul", flagAsset: "kr", readings: ["rr"] },
  zh: { code: "zh", recognitionLocale: "zh-CN", ttsLocale: "zh-CN", script: "han", flagAsset: "cn", readings: ["pinyin"], validatedWithLexicon: true },
  vi: { code: "vi", recognitionLocale: "vi-VN", ttsLocale: "vi-VN", script: "latin", flagAsset: "vn" },
  /** Synthetic test language (test-only courses). */
  xx: { code: "xx", recognitionLocale: "xx-XX", ttsLocale: "xx-XX", script: "latin", flagAsset: "xx" },
  /** P4b stage 4: synthetic CJK test variant of xx (test-only course xc-en) — one lexeme per reading notation. */
  xc: { code: "xc", recognitionLocale: "xc-XC", ttsLocale: "xc-XC", script: "han", flagAsset: "xx", readings: ["kana", "pinyin", "rr"] },
};

export function buildLanguage(code: string): BuildLanguage {
  const known = BUILD_LANGUAGES[code];
  if (known) return known;
  return { code, recognitionLocale: code, ttsLocale: code, script: "latin", flagAsset: code };
}

// P4b stage 5: ja / ko declare verb paradigms, zh its grammar concepts (otherwise the generic CJK plugin).
const PLUGINS: Record<string, BuildLanguagePlugin> = { fr, en, es, de, it, ja, ko, zh, xx };
const GENERIC = new Map<string, BuildLanguagePlugin>();

/** The lexeme fields a dictionary plugin binds (the rich lexicon's shape, as the compiled index carries them). */
export type BindableLexeme = {
  surface: string;
  partOfSpeech?: string;
  pronunciation?: { value: string; notation: string };
  reading?: { traditional?: string };
};

/**
 * P4d: the plugin bound to a target's own words the way the app binds a course (src/lib/languages/index.ts
 * courseLexiconFor): the dictionary tokenizer of a plugin that segments by dictionary (ja, zh, ko), the stored
 * readings, the zh traditional spellings, the ja parts of speech. Speech, writing and interaction answers are then
 * validated with the tokens the app grades with, not Intl.Segmenter's. Only a language that opts in
 * (`validatedWithLexicon`: zh) is bound; a plugin without `withLexicon` (every Latin-script language), or no
 * lexicon, returns the plugin itself.
 */
export function lexiconBoundPlugin(plugin: BuildLanguagePlugin, lexemes: readonly BindableLexeme[] | null): BuildLanguagePlugin {
  if (plugin.validatedWithLexicon !== true || !plugin.rules.withLexicon || !lexemes || lexemes.length === 0) return plugin;
  const rules = plugin.rules.withLexicon({
    entries: lexemes.map((l) => ({
      surface: l.surface,
      ...(l.pronunciation ? { reading: { value: l.pronunciation.value, notation: l.pronunciation.notation } } : {}),
      ...(l.reading?.traditional !== undefined && l.reading.traditional !== l.surface ? { variants: [l.reading.traditional] } : {}),
      ...(l.partOfSpeech ? { pos: l.partOfSpeech } : {}),
    })),
  });
  return { ...plugin, rules, tokenize: (text) => rules.tokenize(rules.foldSpoken(text)) };
}

/** The build plugin for a target language (generic defaults for every language without its own). */
export function buildPlugin(code: string): BuildLanguagePlugin {
  const own = PLUGINS[code];
  if (own) return own;
  let generic = GENERIC.get(code);
  if (!generic) {
    generic = genericPlugin(buildLanguage(code));
    GENERIC.set(code, generic);
  }
  return generic;
}
