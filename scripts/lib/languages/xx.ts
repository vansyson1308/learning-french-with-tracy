/**
 * Synthetic TEST language `xx` (P1c): exists only to prove that every
 * validator and the compiler run for a non-French target. Latin script,
 * one gendered article pair ("ka" masculine / "ki" feminine) so the
 * article/gender rules fire, no paradigms, no number speller. Its course
 * (content/courses/xx-en.json) is `testOnly` — never bundled, never in
 * the catalog, never in the audio baseline.
 */

import { genericPlugin } from "./generic";
import type { BuildLanguagePlugin } from "./types";

export const xx: BuildLanguagePlugin = genericPlugin(
  { code: "xx", recognitionLocale: "xx-XX", ttsLocale: "xx-XX", script: "latin", flagAsset: "xx" },
  {
    articleRules: { gender: { ka: "masculine", ki: "feminine" }, neutral: [] },
    functionWords: ["mi", "to", "na"],
    targetLanguageName: "Testish",
  }
);
