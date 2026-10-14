/**
 * Typography tokens (P2a). The app used 242 inline font sizes and the
 * 800 weight everywhere; Vietnamese stacks diacritics (ệ, ở, ữ, ẫ) above
 * the x-height, so every heavy label needs a line height with headroom
 * or the marks clip on Android. New and edited screens take their text
 * styles from here (via AppText) instead of inlining numbers; untouched
 * screens keep their styles until they are edited.
 *
 * Line heights are ≥ 1.3 × the font size for body and ≥ 1.25 × for
 * display sizes — enough for stacked Vietnamese diacritics at weight 800
 * on both platforms (checked in the Vietnamese typography QA, P2a).
 */

export const fontSize = {
  xs: 11,
  sm: 12,
  md: 13,
  base: 14,
  lg: 15,
  xl: 16,
  "2xl": 18,
  "3xl": 20,
  "4xl": 26,
  "5xl": 30,
} as const;

/** Line heights with diacritic headroom (never below 1.3× for text, 1.25× for display). */
export const lineHeight = {
  xs: 16,
  sm: 17,
  md: 19,
  base: 20,
  lg: 22,
  xl: 23,
  "2xl": 25,
  "3xl": 27,
  "4xl": 33,
  "5xl": 38,
} as const;

export const fontWeight = {
  regular: "400",
  semibold: "600",
  bold: "700",
  heavy: "800",
} as const;

export type TextVariant = "display" | "title" | "heading" | "subheading" | "body" | "bodyStrong" | "caption" | "label";

export const TEXT_VARIANTS: Record<TextVariant, { fontSize: number; lineHeight: number; fontWeight: (typeof fontWeight)[keyof typeof fontWeight] }> = {
  display: { fontSize: fontSize["5xl"], lineHeight: lineHeight["5xl"], fontWeight: fontWeight.heavy },
  title: { fontSize: fontSize["4xl"], lineHeight: lineHeight["4xl"], fontWeight: fontWeight.heavy },
  heading: { fontSize: fontSize["2xl"], lineHeight: lineHeight["2xl"], fontWeight: fontWeight.heavy },
  subheading: { fontSize: fontSize.xl, lineHeight: lineHeight.xl, fontWeight: fontWeight.heavy },
  body: { fontSize: fontSize.lg, lineHeight: lineHeight.lg, fontWeight: fontWeight.regular },
  bodyStrong: { fontSize: fontSize.lg, lineHeight: lineHeight.lg, fontWeight: fontWeight.bold },
  caption: { fontSize: fontSize.md, lineHeight: lineHeight.md, fontWeight: fontWeight.regular },
  label: { fontSize: fontSize.base, lineHeight: lineHeight.base, fontWeight: fontWeight.heavy },
};

/**
 * Uppercase is a Latin-script habit that hurts Vietnamese: capital letters
 * with stacked diacritics (Ệ, Ở) need extra height and read worse. Labels
 * stay in their natural case for Vietnamese.
 */
export function labelTextTransform(lang: string): "uppercase" | "none" {
  return lang === "vi" ? "none" : "uppercase";
}
