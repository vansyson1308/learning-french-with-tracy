/**
 * Reading passage (P7 §112-115): notices, short messages, dialogues,
 * descriptions and info blocks with mobile-first typography (comfortable
 * line height, font scaling, dark mode via theme tokens). Dialogue lines
 * carry explicit speaker labels — never color alone (§114). Learning mode
 * may show tap-to-gloss for supported unknown words; scored mode passes
 * allowGloss={false} and no lexical help exists before answering (§54, §98).
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { WordGlossRow } from "@/components/session/word-gloss";
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
  const noticeLike = kind === "notice" || kind === "info";

  return (
    <View style={[styles.card, noticeLike && styles.noticeCard]} testID="reading-passage">
      {title ? <Text style={[styles.title, noticeLike && styles.noticeTitle]}>{title}</Text> : null}
      {blocks.map((block, i) =>
        block.kind === "line" ? (
          <View key={i} style={styles.lineRow}>
            <Text style={styles.speaker}>{block.speaker}</Text>
            <Text style={styles.lineText} maxFontSizeMultiplier={2}>
              {block.text}
            </Text>
          </View>
        ) : (
          <Text key={i} style={styles.paragraph} maxFontSizeMultiplier={2}>
            {block.text}
          </Text>
        )
      )}
      {allowGloss ? <WordGlossRow glossary={glossary} /> : null}
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
  })
);
