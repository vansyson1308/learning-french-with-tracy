/**
 * AppText (P2a): the shared Text primitive — a typography variant from
 * src/lib/typography (size, weight and a line height with Vietnamese
 * diacritic headroom), a theme colour role, and the uppercase rule for
 * labels that switches off for Vietnamese. Used by new and edited
 * screens; the Duolingo-style look is unchanged.
 */
import React from "react";
import { Text, type TextProps, type TextStyle } from "react-native";

import { useT } from "@/lib/i18n";
import { useThemeColors, type ThemeColors } from "@/lib/theme";
import { labelTextTransform, TEXT_VARIANTS, type TextVariant } from "@/lib/typography";

type ColorRole = "text" | "muted" | "strong" | "inverse";

const COLOR_ROLE: Record<ColorRole, keyof ThemeColors> = {
  text: "text",
  muted: "textMuted",
  strong: "neutral700",
  inverse: "white",
};

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: ColorRole;
  /** Uppercase in English (Duolingo-style labels); natural case in Vietnamese. */
  uppercaseLabel?: boolean;
};

export function AppText({ variant = "body", color = "text", uppercaseLabel, style, ...rest }: AppTextProps) {
  const colors = useThemeColors();
  const { lang } = useT();
  const base: TextStyle = {
    ...TEXT_VARIANTS[variant],
    color: colors[COLOR_ROLE[color]],
    ...(uppercaseLabel ? { textTransform: labelTextTransform(lang), letterSpacing: lang === "vi" ? 0 : 0.8 } : {}),
  };
  return <Text {...rest} style={[base, style]} />;
}
