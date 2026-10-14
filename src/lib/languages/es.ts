/** Spanish rules (P1b): Latin defaults + el/la/los/las article cue. */
import { articleTable, latinRules } from "./base";
import type { LanguageRules } from "./types";

export const es: LanguageRules = latinRules(
  { code: "es", ttsLocale: "es-ES", recognitionLocale: "es-ES" },
  articleTable(["el", "la", "los", "las"])
);
