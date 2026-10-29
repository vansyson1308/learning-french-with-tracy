/**
 * Stable testID of an answer option (QC 2026-10-30): device flows select an
 * option by id, never by its display text (an emoji prefix, a regex
 * character or a reshuffle cannot make a scripted tap land elsewhere).
 * The id is derived from the option's text so the flow generator can
 * compute it from the same content; it never encodes which option is right.
 */
export function optionTestId(text: string): string {
  const slug = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/ß/g, "ss")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return `option-${slug || "x"}`;
}

/** Marker on the finish screen: device flows assert a lesson had no mistakes. */
export function sessionResultTestId(perfect: boolean): string {
  return perfect ? "session-result-perfect" : "session-result-mistakes";
}
