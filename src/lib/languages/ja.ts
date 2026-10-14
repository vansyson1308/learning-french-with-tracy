/** Japanese rules (P1b): NFKC folding, segmenter tokens with per-character fallback. */
import { cjkRules } from "./cjk";
import type { LanguageRules } from "./types";

export const ja: LanguageRules = cjkRules({ code: "ja", ttsLocale: "ja-JP", recognitionLocale: "ja-JP" }, true);
