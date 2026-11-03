/**
 * Language plugin registry (P1b). `languageRules(code)` is total: unknown
 * codes get the Latin defaults under their own code so nothing in the
 * engine ever branches on a language literal. `languageRulesForCourse`
 * resolves through the course profile (the course's TARGET language) and,
 * for a plugin that segments or reads by dictionary (P4b: ja, zh, ko),
 * binds the course's own words from its compiled lexicon index. Plugins
 * without `withLexicon` are returned as they are — every Latin-script
 * course gets exactly the object it always got.
 */

import { artifactsFor, memoByCourse } from "../content-registry";
import { courseProfile } from "../course-profile";

import { latinRules } from "./base";
import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { it } from "./it";
import { ja } from "./ja";
import { ko } from "./ko";
import { pt } from "./pt";
import type { CourseLexicon, LanguageRules } from "./types";
import { vi } from "./vi";
import { zh } from "./zh";

export type { CharsPerSecBand, CourseLexicon, LanguageRules } from "./types";

const PLUGINS: Record<string, LanguageRules> = { fr, en, es, de, it, pt, ja, ko, zh, vi };

/** Rules for a target-language code; Latin defaults for anything unknown. */
export function languageRules(code: string): LanguageRules {
  return PLUGINS[code] ?? latinRules({ code, ttsLocale: code, recognitionLocale: code });
}

/** The lexicon-index fields a dictionary plugin reads (src/content/lexicon/<code>-index.json). */
type IndexEntryLike = {
  surface?: unknown;
  pronunciation?: { value?: unknown; notation?: unknown };
  /** zh (P4b stage 4): the traditional spelling CC-CEDICT records beside the simplified surface. */
  traditional?: unknown;
};

/** A course's words as a CourseLexicon, or null when the course has no lexicon index (yet). */
export function courseLexiconFor(courseId: string): CourseLexicon | null {
  const raw = artifactsFor(courseId).lexiconIndex as { entries?: IndexEntryLike[] } | undefined;
  const entries: CourseLexicon["entries"][number][] = [];
  for (const e of raw?.entries ?? []) {
    if (typeof e.surface !== "string" || e.surface.length === 0) continue;
    const p = e.pronunciation;
    const reading = p && typeof p.value === "string" && typeof p.notation === "string" ? { value: p.value, notation: p.notation } : undefined;
    const variants = typeof e.traditional === "string" && e.traditional !== e.surface ? [e.traditional] : undefined;
    entries.push({ surface: e.surface, ...(reading ? { reading } : {}), ...(variants ? { variants } : {}) });
  }
  return entries.length > 0 ? { entries } : null;
}

const boundRules = memoByCourse<LanguageRules>((courseId) => {
  const rules = languageRules(courseProfile(courseId).targetCode);
  const lexicon = rules.withLexicon ? courseLexiconFor(courseId) : null;
  return lexicon && rules.withLexicon ? rules.withLexicon(lexicon) : rules;
});

/** Rules for a course's TARGET language, via its profile (bound to the course's words where the plugin uses them). */
export function languageRulesForCourse(courseId: string): LanguageRules {
  const rules = languageRules(courseProfile(courseId).targetCode);
  return rules.withLexicon === undefined ? rules : boundRules(courseId);
}

export function supportedLanguageCodes(): string[] {
  return Object.keys(PLUGINS);
}
