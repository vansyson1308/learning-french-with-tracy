/**
 * The plan-time Kokoro phoneme front-ends ("course-readings"), per language: ja (P4c, scripts/lib/tts/ja-kana.ts) and
 * zh (P4d, scripts/lib/tts/zh-readings.ts). Each reads a clip through the course's stored readings and fails closed;
 * each records the inputs its version was built from (the re-render gate of scripts/lib/audio-recipe.ts). A language
 * without an entry here has no front-end: Kokoro's own G2P reads its text and its keys carry no front-end tag.
 */

import { jaFrontendInputsSha256 } from "./ja-frontend-inputs";
import { jaClipPhonemes, loadJaSpeechIndex } from "./ja-kana";
import type { PhonemeReaderLoad } from "./kokoro";
import { zhFrontendInputsSha256 } from "./zh-frontend-inputs";
import { loadZhSpeechIndex, zhClipPhonemes } from "./zh-readings";

type Read = (rel: string) => unknown;
type Exists = (rel: string) => boolean;

/** Languages with a course-readings front-end. */
export const COURSE_READINGS_LANGUAGES = ["ja", "zh"] as const;

/** The clip reader of a language's front-end, loaded once (its speech index), or the problems that stop it. */
export function courseReadingsReader(language: string, read: Read, exists: Exists): PhonemeReaderLoad {
  if (language === "ja") {
    const loaded = loadJaSpeechIndex(read, exists);
    const index = loaded.index;
    return index === null ? { read: null, problems: loaded.problems } : { read: (text) => jaClipPhonemes(text, index), problems: [] };
  }
  if (language === "zh") {
    const loaded = loadZhSpeechIndex(read, exists);
    const index = loaded.index;
    return index === null ? { read: null, problems: loaded.problems } : { read: (text) => zhClipPhonemes(text, index), problems: [] };
  }
  return { read: null, problems: [`no course-readings front-end for ${language} (only ${COURSE_READINGS_LANGUAGES.join(", ")})`] };
}

/** sha256 of the inputs a language's front-end reads (its re-render gate), or null when it has no front-end. */
export function frontendInputsSha256(language: string, readText: (rel: string) => string): string | null {
  if (language === "ja") return jaFrontendInputsSha256(readText);
  if (language === "zh") return zhFrontendInputsSha256(readText);
  return null;
}
