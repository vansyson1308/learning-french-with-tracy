/** Portuguese (Brazil) rules (P1b): Latin defaults + o/a/os/as article cue. */
import { articleTable, latinRules } from "./base";
import type { LanguageRules, NegationRules } from "./types";

/**
 * QC 2026-11-05 §1.2: "não" (and nunca) stands before the verb and negates the rest of its clause ("não quero café").
 * A comma or a conjunction (mas, porém, porque, e, ou, quando, se) ends the clause; "não tem problema", "não há
 * problema", "não faz mal" and "não há de quê" negate nothing.
 */
const NEGATION: NegationRules = {
  unit: "word",
  before: { negators: ["não", "nunca"], reach: "clause" },
  idioms: ["não há problema", "não tem problema", "não faz mal", "não há de quê", "não tem de quê"],
  clauseBreaks: ["mas", "porém", "porque", "e", "ou", "quando", "se"],
};

export const pt: LanguageRules = latinRules(
  { code: "pt", ttsLocale: "pt-BR", recognitionLocale: "pt-BR" },
  { ...articleTable(["o", "a", "os", "as"]), negation: NEGATION }
);
