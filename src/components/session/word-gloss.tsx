/**
 * Words offered for their meaning: a chip per word, its gloss below on tap. Learning mode's
 * reading passages use it (never in a scored one, P7 §54), and an exam item of a track above
 * its course's level, which says so on its page (QC 2026-11-01 §2.5).
 */
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useT } from "@/lib/i18n";
import { makeThemedStyles, radius } from "@/lib/theme";

export function WordGlossRow({ title, glossary }: { title?: string; glossary: { surface: string; gloss: string }[] }) {
  const styles = useStyles();
  const { t } = useT();
  const [open, setOpen] = useState<string | null>(null);
  if (glossary.length === 0) return null;
  const active = glossary.find((g) => g.surface === open);
  return (
    <View style={styles.wrap} testID="word-gloss">
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.row}>
        {glossary.map((g) => (
          <Pressable
            key={g.surface}
            onPress={() => setOpen(open === g.surface ? null : g.surface)}
            accessibilityRole="button"
            accessibilityLabel={t("reading.showMeaning", { word: g.surface })}
            style={[styles.chip, open === g.surface && styles.chipActive]}
            testID={`gloss-${g.surface}`}
          >
            <Text style={styles.chipText}>{g.surface}</Text>
          </Pressable>
        ))}
      </View>
      {active ? (
        <Text style={styles.value} testID="gloss-value">
          {active.surface} — {active.gloss}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    wrap: { gap: 6, marginTop: 2 },
    title: { fontSize: 13, color: colors.textMuted },
    row: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    chip: {
      borderWidth: 1.5,
      borderColor: colors.neutral200,
      borderRadius: radius.full,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    chipActive: { borderColor: colors.sky, backgroundColor: colors.sky + "22" },
    chipText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
    value: { fontSize: 14, color: colors.text, fontStyle: "italic" },
  })
);
