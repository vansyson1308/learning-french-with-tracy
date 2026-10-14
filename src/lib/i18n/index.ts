/**
 * UI language + typed `t()` (P2a). Every user-visible string — screens,
 * components, accessibility labels and hints, alerts, lib-level messages
 * — comes from the catalogues under ./catalog (`en.json` is the key
 * source of truth, `vi.json` must mirror it; a test enforces parity).
 *
 * Resolution: the store's `uiLanguage` preference (`system` | `vi` |
 * `en`); `system` follows the device's first preferred language —
 * Vietnamese on `vi-*` devices, English everywhere else — unless
 * `EXPO_PUBLIC_UI_LANG` pins it (e2e smokes, screenshots). `t()` works
 * outside React (reads the store); `useT()` re-renders on a change.
 */
import { useMemo } from "react";

import type { UiLanguagePreference } from "../persistence/migrations";
import { useProgress } from "../store";
import { deviceLanguageTags } from "./device-locale";
import type { Params } from "./format";
import type { MessageKey } from "./keys";
import type { Message } from "./message";
import { languageName, translate, translateMessage, type UiLanguage } from "./translate";

export { UI_LANGUAGES, languageName, translate, translateMessage } from "./translate";
export { msg } from "./message";
export type { MessageKey, Message, Params, UiLanguage };

function envOverride(): UiLanguage | null {
  const raw = process.env.EXPO_PUBLIC_UI_LANG;
  return raw === "vi" || raw === "en" ? raw : null;
}

/** The UI language for a preference and the device's language tags. */
export function resolveUiLanguage(pref: UiLanguagePreference, tags: readonly string[]): UiLanguage {
  if (pref === "vi" || pref === "en") return pref;
  const pinned = envOverride();
  if (pinned) return pinned;
  const first = (tags[0] ?? "en").toLowerCase();
  return first === "vi" || first.startsWith("vi-") ? "vi" : "en";
}

export function currentUiLanguage(): UiLanguage {
  return resolveUiLanguage(useProgress.getState().uiLanguage, deviceLanguageTags());
}

/** Translate in the current UI language (usable outside React — alerts, navigation titles). */
export function t(key: MessageKey, params?: Params): string {
  return translate(currentUiLanguage(), key, params);
}

/** Format a lib-level message reference in the current UI language. */
export function tm(message: Message): string {
  return translateMessage(currentUiLanguage(), message);
}

export type Translator = {
  t: (key: MessageKey, params?: Params) => string;
  tm: (message: Message) => string;
  /** A language's name in the UI language (course chips, "Learn French"). */
  languageName: (code: string, fallback: string) => string;
  lang: UiLanguage;
};

export function translatorFor(lang: UiLanguage): Translator {
  return {
    t: (key, params) => translate(lang, key, params),
    tm: (message) => translateMessage(lang, message),
    languageName: (code, fallback) => languageName(lang, code, fallback),
    lang,
  };
}

/** Hook: the translator for the current UI language; re-renders when the preference changes. */
export function useT(): Translator {
  const pref = useProgress((s) => s.uiLanguage);
  const lang = resolveUiLanguage(pref, deviceLanguageTags());
  return useMemo(() => translatorFor(lang), [lang]);
}
