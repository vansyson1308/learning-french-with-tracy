/**
 * Store-free translation core (P2a): the two catalogues and `translate`.
 * `index.ts` binds this to the store's `uiLanguage`; pure modules and
 * tests use this file directly.
 */
import en from "./catalog/en.json";
import vi from "./catalog/vi.json";
import { formatMessage, type Params } from "./format";
import type { MessageKey } from "./keys";
import type { Message } from "./message";

export type UiLanguage = "vi" | "en";
export const UI_LANGUAGES: readonly UiLanguage[] = ["vi", "en"];

export const CATALOGS: Record<UiLanguage, Record<string, string>> = { en, vi };

/** Translate in an explicit language. Falls back to English, then to the key itself. */
export function translate(lang: UiLanguage, key: MessageKey, params?: Params): string {
  const template = CATALOGS[lang][key] ?? CATALOGS.en[key];
  if (template === undefined) return key;
  return formatMessage(template, params, lang);
}

/** Format a lib-level message reference in an explicit language. */
export function translateMessage(lang: UiLanguage, message: Message): string {
  return translate(lang, message.key, message.params);
}

/**
 * The name of a language code in the UI language (`language.<code>`), or the given fallback.
 * The plain name is what a course teaches, so it may carry the course's variety ("Tiếng Anh (Mỹ)").
 * `native` asks for the language explanations are written in, where the variety says nothing (`language.native.<code>`).
 */
export function languageName(lang: UiLanguage, code: string, fallback: string, role: "target" | "native" = "target"): string {
  const key = `language.${code}`;
  const nativeKey = `language.native.${code}`;
  const native = role === "native" ? (CATALOGS[lang][nativeKey] ?? CATALOGS.en[nativeKey]) : undefined;
  return native ?? CATALOGS[lang][key] ?? CATALOGS.en[key] ?? fallback;
}
