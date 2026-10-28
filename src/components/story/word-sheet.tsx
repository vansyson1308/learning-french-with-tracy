/**
 * Tap-to-gloss panel of the story reader (P5b): the lexeme's dictionary
 * form, gloss and pronunciation, and — for a word that is not one of the
 * story's new words — a toggle that adds it to the closing word check.
 * Reading never writes learner state; the word check does, through FSRS.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { useT } from "@/lib/i18n";
import type { LexemeMeta } from "@/lib/learning/lexicon-index";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

export function WordSheet(props: {
  meta: LexemeMeta;
  isNew: boolean;
  picked: boolean;
  onTogglePick: () => void;
  onClose: () => void;
}) {
  const styles = useStyles();
  const colors = useThemeColors();
  const { t } = useT();
  const { meta } = props;
  return (
    <View style={styles.sheet} testID="story-word-sheet">
      <View style={styles.header}>
        <Text style={styles.surface}>{meta.surface}</Text>
        {props.isNew ? <Text style={styles.badge}>{t("stories.newWord")}</Text> : null}
        <Pressable onPress={props.onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel={t("common.close")} style={styles.close}>
          <Ionicons name="close" size={22} color={colors.textMuted} />
        </Pressable>
      </View>
      {meta.pronunciation ? <Text style={styles.ipa}>/{meta.pronunciation.value}/</Text> : null}
      <Text style={styles.gloss} testID="story-word-gloss">
        {meta.gloss}
      </Text>
      {props.isNew ? null : (
        <Pressable
          onPress={props.onTogglePick}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: props.picked }}
          style={[styles.pick, props.picked && styles.pickOn]}
          testID="story-learn-word"
        >
          <Ionicons name={props.picked ? "checkmark-circle" : "add-circle-outline"} size={20} color={props.picked ? colors.greenDark : colors.sky} />
          <Text style={[styles.pickText, props.picked && styles.pickTextOn]}>
            {props.picked ? t("stories.learningWord") : t("stories.learnWord")}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  sheet: {
    borderTopWidth: 2,
    borderColor: colors.neutral200,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 6,
  },
  header: { flexDirection: "row" as const, alignItems: "center" as const, gap: 10 },
  surface: { fontSize: 22, fontWeight: "800" as const, color: colors.text, flexShrink: 1 },
  badge: {
    fontSize: 12,
    fontWeight: "800" as const,
    color: colors.indigo,
    borderWidth: 1.5,
    borderColor: colors.indigo,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: "hidden" as const,
  },
  close: { marginLeft: "auto" as const },
  ipa: { fontSize: 15, color: colors.textMuted },
  gloss: { fontSize: 18, color: colors.text },
  pick: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    alignSelf: "flex-start" as const,
    borderWidth: 2,
    borderColor: colors.neutral200,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  pickOn: { borderColor: colors.greenLight, backgroundColor: colors.correctBg },
  pickText: { fontSize: 15, fontWeight: "700" as const, color: colors.sky },
  pickTextOn: { color: colors.correctText },
}));
