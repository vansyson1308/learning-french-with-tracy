/** Italian rules (P1b): Latin defaults + il/lo/la/l'/i/gli/le article cue. */
import { articleTable, latinRules } from "./base";
import type { LanguageRules } from "./types";

export const it: LanguageRules = latinRules(
  { code: "it", ttsLocale: "it-IT", recognitionLocale: "it-IT" },
  articleTable(["il", "lo", "la", "l'", "i", "gli", "le"])
);
