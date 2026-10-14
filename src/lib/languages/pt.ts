/** Portuguese (Brazil) rules (P1b): Latin defaults + o/a/os/as article cue. */
import { articleTable, latinRules } from "./base";
import type { LanguageRules } from "./types";

export const pt: LanguageRules = latinRules(
  { code: "pt", ttsLocale: "pt-BR", recognitionLocale: "pt-BR" },
  articleTable(["o", "a", "os", "as"])
);
