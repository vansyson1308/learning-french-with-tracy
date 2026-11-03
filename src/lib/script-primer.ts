/**
 * Script primers (P4b stage 5, task 5): the compiled kana / tones / Hangul
 * primers (src/content/primer/<lang>.json, generated from
 * content/<lang>/primer/script-primer.json and checked by
 * scripts/lib/script-primer.ts). Language-level content, like the Hán-Việt
 * tables: a course reaches its primer through its TARGET code, so every
 * ja / zh / ko course shows it at the start of Section 1 and no other
 * course does.
 */
import jaPrimer from "../content/primer/ja.json";
import koPrimer from "../content/primer/ko.json";
import zhPrimer from "../content/primer/zh.json";

import type { ScriptPrimer } from "../../content/schema";
import { courseProfile } from "./course-profile";

export type { ScriptPrimer };
export type PrimerSection = ScriptPrimer["sections"][number];
export type PrimerText = { vi: string; en: string };

const PRIMERS: Readonly<Record<string, ScriptPrimer>> = {
  ja: jaPrimer as ScriptPrimer,
  zh: zhPrimer as ScriptPrimer,
  ko: koPrimer as ScriptPrimer,
};

/** The primer of a target language, or null when it has none. */
export function scriptPrimerFor(targetCode: string): ScriptPrimer | null {
  return PRIMERS[targetCode] ?? null;
}

/** The primer a course shows (by its target language). */
export function coursePrimer(courseId: string): ScriptPrimer | null {
  return scriptPrimerFor(courseProfile(courseId).targetCode);
}

/** A primer text in the course's native language (vi or en; other natives read the English). */
export function primerText(text: PrimerText, nativeCode: string): string {
  return nativeCode === "vi" ? text.vi : text.en;
}
