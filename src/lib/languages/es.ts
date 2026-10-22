/** Spanish rules (P1b): Latin defaults + el/la/los/las article cue. */
import { articleTable, latinRules } from "./base";
import type { LanguageRules } from "./types";

export const es: LanguageRules = latinRules(
  { code: "es", ttsLocale: "es-ES", recognitionLocale: "es-ES" },
  {
    ...articleTable(["el", "la", "los", "las"]),
    // P3e: Peninsular person labels (vosotros taught for recognition; ustedes accepted).
    grammarLabels: {
      persons: { "pre:1s": "yo", "pre:2s": "tú", "pre:3s": "él/ella/usted", "pre:1p": "nosotros", "pre:2p": "vosotros", "pre:3p": "ellos/ellas/ustedes" },
      presentTense: "presente",
      articleGenders: { el: "masculine", la: "feminine", un: "masculine", una: "feminine", los: "masculine", las: "feminine" },
    },
  }
);
