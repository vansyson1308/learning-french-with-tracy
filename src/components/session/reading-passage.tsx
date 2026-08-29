/**
 * Reading passage (P7 §112-115): notices, short messages, dialogues,
 * descriptions and info blocks with mobile-first typography (comfortable
 * line height, font scaling, dark mode via theme tokens). Dialogue lines
 * carry explicit speaker labels — never color alone (§114). Learning mode
 * may show tap-to-gloss for supported unknown words; scored mode passes
 * allowGloss={false} and no lexical help exists before answering (§54, §98).
 */
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { makeThemedStyles, radius } from "@/lib/theme";

export type ReadingBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "line"; speaker: string; text: string };

export function ReadingPassage({
  title,
  kind,
  blocks,
  glossary,
  allowGloss,
}: {
  title?: string;
  kind: string;
  blocks: ReadingBlock[];
  glossary: { surface: string; gloss: string }[];
  allowGloss: boolean;
}) {
  const styles = useStyles();
  const [openGloss, setOpenGloss] = useState<string | null>(null);
  const noticeLike = kind === "notice" || kind === "info";
  const active = allowGloss ? glossary.find((g) => g.surface === openGloss) : undefined;

  return (
    <View style={[styles.card, noticeLike && styles.noticeCard]} testID="reading-passage">
      {title ? <Text style={[styles.title, noticeLike && styles.noticeTitle]}>{title}</Text> : null}
      {blocks.map((block, i) =>
        block.kind === "line" ? (
          <View key={i} style={styles.lineRow}>
            <Text style={styles.speaker}>{block.speaker}</Text>
            <Text style={styles.lineText} maxFontSizeMultiplier={1.6}>
              {block.text}
            </Text>
          </View>
        ) : (
          <Text key={i} style={styles.paragraph} maxFontSizeMultiplier={1.6}>
            {block.text}
          </Text>
        )
      )}
      {allowGloss && glossary.length > 0 ? (
        <View style={styles.glossRow}>
          {glossary.map((g) => (
            <Pressable
              key={g.surface}
              onPress={() => setOpenGloss(openGloss === g.surface ? null : g.surface)}
              accessibilityRole="button"
              accessibilityLabel={`Show meaning of ${g.surface}`}
              style={[styles.glossChip, openGloss === g.surface && styles.glossChipActive]}
              testID={`gloss-${g.surface}`}
            >
              <Text style={styles.glossChipText}>{g.surface}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {active ? (
        <Text style={styles.glossValue} testID="gloss-value">
          {active.surface} — {active.gloss}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    card: {
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: colors.neutral200,
      backgroundColor: colors.surface,
      padding: 16,
      gap: 10,
    },
    noticeCard: { borderColor: colors.amber, borderStyle: "solid" },
    title: { fontSize: 17, fontWeight: "800", color: colors.text },
    noticeTitle: { textTransform: "uppercase", letterSpacing: 0.5, fontSize: 15 },
    paragraph: { fontSize: 17, lineHeight: 26, color: colors.text },
    lineRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
    speaker: { fontSize: 15, fontWeight: "800", color: colors.skyDark, minWidth: 52 },
    lineText: { flex: 1, fontSize: 17, lineHeight: 25, color: colors.text },
    glossRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
    glossChip: {
      borderWidth: 1.5,
      borderColor: colors.neutral200,
      borderRadius: radius.full,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    glossChipActive: { borderColor: colors.sky, backgroundColor: colors.sky + "22" },
    glossChipText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
    glossValue: { fontSize: 14, color: colors.text, fontStyle: "italic" },
  })
);
