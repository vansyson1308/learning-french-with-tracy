/** German rules (P1b): Latin defaults + der/die/das article cue. */
import { articleTable, latinRules } from "./base";
import type { LanguageRules } from "./types";

export const de: LanguageRules = latinRules(
  { code: "de", ttsLocale: "de-DE", recognitionLocale: "de-DE" },
  articleTable(["der", "die", "das"])
);
