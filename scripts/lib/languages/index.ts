/**
 * Build-side language registry (P1b facts table + P1c plugins). The facts
 * the compiler bakes into course profiles live here; the runtime twin is
 * src/lib/languages/<code>.ts and the two are cross-checked by test so a
 * locale can never drift between the profile and the plugin.
 * `buildPlugin(code)` is total: unknown codes get the generic plugin under
 * their own code.
 */

import { de } from "./de";
import { es } from "./es";
import { fr } from "./fr";
import { genericPlugin } from "./generic";
import type { BuildLanguage, BuildLanguagePlugin } from "./types";
import { xx } from "./xx";

export type { ArticleGender, ArticleRules, BuildLanguage, BuildLanguagePlugin, MorphRow, MorphVerb, ParadigmSpec } from "./types";

export const BUILD_LANGUAGES: Record<string, BuildLanguage> = {
  fr: { code: "fr", recognitionLocale: "fr-FR", ttsLocale: "fr-FR", script: "latin", flagAsset: "fr", numberDrill: fr.numberDrill },
  en: { code: "en", recognitionLocale: "en-US", ttsLocale: "en-US", script: "latin", flagAsset: "gb" },
  es: { code: "es", recognitionLocale: "es-ES", ttsLocale: "es-ES", script: "latin", flagAsset: "es" },
  de: { code: "de", recognitionLocale: "de-DE", ttsLocale: "de-DE", script: "latin", flagAsset: "de" },
  it: { code: "it", recognitionLocale: "it-IT", ttsLocale: "it-IT", script: "latin", flagAsset: "it" },
  // The inherited Portuguese pack is Brazilian Portuguese (content and voice).
  pt: { code: "pt", recognitionLocale: "pt-BR", ttsLocale: "pt-BR", script: "latin", flagAsset: "br" },
  ja: { code: "ja", recognitionLocale: "ja-JP", ttsLocale: "ja-JP", script: "japanese", flagAsset: "jp" },
  ko: { code: "ko", recognitionLocale: "ko-KR", ttsLocale: "ko-KR", script: "hangul", flagAsset: "kr" },
  zh: { code: "zh", recognitionLocale: "zh-CN", ttsLocale: "zh-CN", script: "han", flagAsset: "cn" },
  vi: { code: "vi", recognitionLocale: "vi-VN", ttsLocale: "vi-VN", script: "latin", flagAsset: "vn" },
  /** Synthetic test language (test-only courses). */
  xx: { code: "xx", recognitionLocale: "xx-XX", ttsLocale: "xx-XX", script: "latin", flagAsset: "xx" },
};

export function buildLanguage(code: string): BuildLanguage {
  const known = BUILD_LANGUAGES[code];
  if (known) return known;
  return { code, recognitionLocale: code, ttsLocale: code, script: "latin", flagAsset: code };
}

const PLUGINS: Record<string, BuildLanguagePlugin> = { fr, es, de, xx };
const GENERIC = new Map<string, BuildLanguagePlugin>();

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
