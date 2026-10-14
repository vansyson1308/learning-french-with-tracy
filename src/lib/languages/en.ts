/** English rules (P1b): Latin defaults; no gendered article cue. */
import { latinRules } from "./base";
import type { LanguageRules } from "./types";

export const en: LanguageRules = latinRules({ code: "en", ttsLocale: "en-US", recognitionLocale: "en-US" });
