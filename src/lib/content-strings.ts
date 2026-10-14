/**
 * Native-language strings the engine builds INTO content at runtime (the
 * generated listening question of a Today / review session). They are
 * keyed by the course's NATIVE language code, not by the UI language:
 * like an authored pack question they are part of the course's content,
 * so a session definition is identical whatever the UI language (the
 * golden contract) and a `fr-vi` course gets Vietnamese questions by
 * construction. P2b owns the authored side; this file owns the generated
 * side. Unknown native codes fall back to English.
 */

type ContentStringKey = "whatDoYouHear";

const CONTENT_STRINGS: Record<string, Record<ContentStringKey, string>> = {
  en: { whatDoYouHear: "What do you hear?" },
  vi: { whatDoYouHear: "Bạn nghe thấy gì?" },
};

export function contentString(nativeCode: string, key: ContentStringKey): string {
  return (CONTENT_STRINGS[nativeCode] ?? CONTENT_STRINGS.en)[key];
}
