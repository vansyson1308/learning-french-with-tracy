/** Chinese (Mandarin, simplified) rules (P1b): NFKC folding, segmenter tokens with per-character fallback. */
import { cjkRules } from "./cjk";
import type { LanguageRules } from "./types";

export const zh: LanguageRules = cjkRules({ code: "zh", ttsLocale: "zh-CN", recognitionLocale: "zh-CN" }, true);
