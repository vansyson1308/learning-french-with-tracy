/**
 * The device's preferred language tags (P2a), read once from
 * expo-localization and never trusted to be present: a missing native
 * module (static export render pass, a test runner without the mock)
 * reads as English. Nothing here leaves the device — the tag is only used
 * to pick the UI language.
 */

let cached: readonly string[] | null = null;

export function deviceLanguageTags(): readonly string[] {
  if (cached) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const localization = require("expo-localization") as { getLocales?: () => { languageTag?: string; languageCode?: string | null }[] };
    const locales = localization.getLocales?.() ?? [];
    const tags = locales
      .map((l) => l.languageTag || l.languageCode || "")
      .filter((tag): tag is string => tag.length > 0);
    cached = tags.length > 0 ? tags : ["en"];
  } catch {
    cached = ["en"];
  }
  return cached;
}

export function __setDeviceLanguageTagsForTests(tags: readonly string[] | null): void {
  cached = tags;
}
