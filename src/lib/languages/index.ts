/**
 * Language plugin registry (P1b). `languageRules(code)` is total: unknown
 * codes get the Latin defaults under their own code so nothing in the
 * engine ever branches on a language literal. `languageRulesForCourse`
 * resolves through the course profile (the course's TARGET language).
 */

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
import type { LanguageRules } from "./types";
import { vi } from "./vi";
import { zh } from "./zh";

export type { LanguageRules } from "./types";

const PLUGINS: Record<string, LanguageRules> = { fr, en, es, de, it, pt, ja, ko, zh, vi };

/** Rules for a target-language code; Latin defaults for anything unknown. */
export function languageRules(code: string): LanguageRules {
  return PLUGINS[code] ?? latinRules({ code, ttsLocale: code, recognitionLocale: code });
}

/** Rules for a course's TARGET language, via its profile. */
export function languageRulesForCourse(courseId: string): LanguageRules {
  return languageRules(courseProfile(courseId).targetCode);
}

export function supportedLanguageCodes(): string[] {
  return Object.keys(PLUGINS);
}
