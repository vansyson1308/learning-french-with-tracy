import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useT } from "@/lib/i18n";
import { radius, useThemeColors, type ThemeColors } from "@/lib/theme";
import { labelTextTransform, lineHeight } from "@/lib/typography";

type Variant = "primary" | "secondary" | "danger" | "super" | "locked" | "white";

function palette(
  colors: ThemeColors
): Record<Variant, { bg: string; border: string; text: string }> {
  return {
    primary: { bg: colors.sky, border: colors.skyDark, text: colors.white },
    secondary: { bg: colors.green, border: colors.greenDark, text: colors.white },
    danger: { bg: colors.rose, border: colors.roseDark, text: colors.white },
    super: { bg: colors.indigo, border: colors.indigoDark, text: colors.white },
    locked: { bg: colors.neutral200, border: colors.neutral400, text: colors.neutral400 },
    white: { bg: colors.surface, border: colors.neutral200, text: colors.textMuted },
  };
}

type DuoButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** The web app's 3D button: darker bottom border that collapses on press. */
export function DuoButton({
  label,
  onPress,
  variant = "secondary",
  disabled,
  style,
  testID,
}: DuoButtonProps) {
  const c = palette(useThemeColors())[disabled ? "locked" : variant];
  const { lang } = useT();
  // Vietnamese labels keep their natural case: uppercase letters with stacked
  // diacritics (Ệ, Ở) clip at this weight and read worse; the line height
  // gives the marks headroom in both languages.
  const labelCase = labelTextTransform(lang);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: c.bg,
          borderColor: c.border,
          borderBottomWidth: pressed ? 0 : 4,
          marginTop: pressed ? 4 : 0,
        },
        variant === "white" && { borderWidth: 2, borderBottomWidth: pressed ? 2 : 4 },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: c.text, textTransform: labelCase, letterSpacing: labelCase === "none" ? 0 : 0.8 },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  label: {
    fontWeight: "800",
    fontSize: 15,
    lineHeight: lineHeight.lg,
    textAlign: "center",
  },
});
