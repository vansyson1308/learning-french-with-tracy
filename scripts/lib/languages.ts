/**
 * Build-side language table (P1b): the per-target-language facts the
 * compiler bakes into course profiles. The runtime twin lives in
 * src/lib/languages/<code>.ts; the two are cross-checked by test so a
 * locale can never drift between the profile and the plugin.
 */

import { acceptedNumberSpellings, frenchNumber } from "../../src/lib/learning/french-numbers";

export type BuildLanguage = {
  code: string;
  recognitionLocale: string;
  ttsLocale: string;
  script: "latin" | "japanese" | "han" | "hangul";
  /** assets/images/flags/<flagAsset>.svg (HatScripts circle-flags, MIT). */
  flagAsset: string;
  /**
   * Verified number speller for the pack validator's number-drill rule
   * (a bare-integer prompt must key the engine's spelling). Absent until a
   * language's speller is verified — the rule then does not apply.
   */
  numberDrill?: { accepted(n: number): string[]; expected(n: number): string };
};

export const BUILD_LANGUAGES: Record<string, BuildLanguage> = {
  fr: {
    code: "fr",
    recognitionLocale: "fr-FR",
    ttsLocale: "fr-FR",
    script: "latin",
    flagAsset: "fr",
    numberDrill: { accepted: acceptedNumberSpellings, expected: (n) => frenchNumber(n).traditional },
  },
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
};

export function buildLanguage(code: string): BuildLanguage {
  const known = BUILD_LANGUAGES[code];
  if (known) return known;
  return { code, recognitionLocale: code, ttsLocale: code, script: "latin", flagAsset: code };
}
