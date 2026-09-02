import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { haptics } from "@/lib/haptics";
import { radius, useThemeColors, type ThemeColors } from "@/lib/theme";

/** Spoken suffix + non-colour glyph per outcome (Phase 10 §36/§39: never colour alone). */
const STATE_CUE: Record<OptionState, { label: string; icon: keyof typeof Ionicons.glyphMap | null }> = {
  idle: { label: "", icon: null },
  selected: { label: ", selected", icon: null },
  correct: { label: ", correct", icon: "checkmark-circle" },
  wrong: { label: ", not correct", icon: "close-circle" },
};

export type OptionState = "idle" | "selected" | "correct" | "wrong";

function stateColors(
  colors: ThemeColors
): Record<OptionState, { border: string; bg: string; text: string }> {
  return {
    idle: { border: colors.neutral200, bg: colors.surface, text: colors.text },
    selected: { border: colors.sky, bg: colors.selectedBg, text: colors.selectedText },
    correct: {
      border: colors.greenLight,
      bg: colors.correctBg,
      text: colors.correctText,
    },
    wrong: { border: colors.rose, bg: colors.wrongBg, text: colors.wrongText },
  };
}

type OptionCardProps = {
  text: string;
  emoji?: string;
  state: OptionState;
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
};

export function OptionCard({
  text,
  emoji,
  state,
  onPress,
  disabled,
  compact,
}: OptionCardProps) {
  const c = stateColors(useThemeColors())[state];
  const cue = STATE_CUE[state];
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${emoji ? `${emoji} ` : ""}${text}${cue.label}`}
      accessibilityState={{ disabled: !!disabled, selected: state === "selected" }}
      style={({ pressed }) => [
        styles.card,
        compact ? styles.compact : styles.full,
        {
          borderColor: c.border,
          backgroundColor: c.bg,
          borderBottomWidth: pressed ? 2 : 4,
        },
      ]}
    >
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <View style={styles.textWrap}>
        <Text style={[styles.text, { color: c.text }]}>{text}</Text>
      </View>
      {cue.icon ? (
        <Ionicons name={cue.icon} size={20} color={c.text} style={styles.cueIcon} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  full: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: "100%",
  },
  compact: {
    flexBasis: "47%",
    flexGrow: 1,
    paddingVertical: 18,
    paddingHorizontal: 10,
    gap: 8,
  },
  emoji: { fontSize: 34 },
  textWrap: { flexShrink: 1 },
  cueIcon: { marginLeft: 4 },
  text: { fontSize: 17, fontWeight: "700", textAlign: "center" },
});
