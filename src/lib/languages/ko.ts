/** Korean rules (P1b): NFKC folding, segmenter tokens with whitespace (eojeol) fallback. */
import { cjkRules } from "./cjk";
import type { LanguageRules } from "./types";

export const ko: LanguageRules = cjkRules({ code: "ko", ttsLocale: "ko-KR", recognitionLocale: "ko-KR" }, false);
