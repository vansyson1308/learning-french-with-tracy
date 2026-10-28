/**
 * One sentence of a graded story (P5b): its number (tap → translation),
 * its words (tap → gloss sheet), a play button when audio is bundled, and
 * the read-along highlight while it plays. Each word is its own Text in a
 * wrapping row — a nested span has no native view, so it could be neither
 * a screen-reader element nor a test target.
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { useT } from "@/lib/i18n";
import { readingTokens, type CompiledStorySentence } from "@/lib/stories/content";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

export function SentenceRow(props: {
  sentence: CompiledStorySentence;
  index: number;
  active: boolean;
  showTranslation: boolean;
  newLexemes: ReadonlySet<string>;
  selectedLexeme: string | null;
  canPlay: boolean;
  onToggleTranslation: () => void;
  onPlay: () => void;
  onWord: (lexemeId: string) => void;
}) {
  const styles = useStyles();
  const colors = useThemeColors();
  const { t } = useT();
  const { sentence, index } = props;
  const tokens = useMemo(() => readingTokens(sentence.pieces), [sentence]);
  const dialogue = sentence.speaker !== "N";
  return (
    <View style={[styles.row, props.active && styles.rowActive]} testID={`story-sentence-${index + 1}`}>
      <Pressable
        onPress={props.onToggleTranslation}
        accessibilityRole="button"
        accessibilityLabel={`${t("stories.translation")} ${index + 1}`}
        testID={`story-translate-${index + 1}`}
        style={styles.number}
      >
        <Text style={styles.numberText}>{index + 1}</Text>
      </Pressable>
      <View style={styles.body}>
        <View style={styles.words}>
          {dialogue ? <Text style={[styles.text, styles.dialogue]}>— </Text> : null}
          {tokens.map((tok, i) =>
            tok.lexemeId ? (
              <Text
                key={i}
                onPress={() => props.onWord(tok.lexemeId!)}
                suppressHighlighting
                accessibilityRole="button"
                style={[styles.text, dialogue && styles.dialogue]}
                testID={`story-word-${tok.lexemeId}`}
              >
                <Text
                  style={[
                    props.newLexemes.has(tok.lexemeId) && styles.newWord,
                    props.selectedLexeme === tok.lexemeId && styles.selectedWord,
                  ]}
                >
                  {tok.word}
                </Text>
                {tok.trail}
              </Text>
            ) : (
              <Text key={i} style={[styles.text, dialogue && styles.dialogue]}>
                {tok.word}
                {tok.trail}
              </Text>
            )
          )}
        </View>
        {props.showTranslation ? (
          <Text style={styles.translation} testID={`story-translation-${index + 1}`}>
            {sentence.translation}
          </Text>
        ) : null}
      </View>
      {props.canPlay ? (
        <Pressable onPress={props.onPlay} accessibilityRole="button" accessibilityLabel={t("stories.listen")} style={styles.play} hitSlop={8}>
          <Ionicons name="volume-medium" size={20} color={colors.sky} />
        </Pressable>
      ) : null}
    </View>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  row: { flexDirection: "row" as const, gap: 10, paddingVertical: 8, paddingHorizontal: 8, borderRadius: radius.md },
  rowActive: { backgroundColor: colors.selectedBg },
  number: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.neutral200,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginTop: 2,
  },
  numberText: { fontSize: 13, fontWeight: "800" as const, color: colors.textMuted },
  body: { flex: 1, gap: 4 },
  words: { flexDirection: "row" as const, flexWrap: "wrap" as const },
  text: { fontSize: 19, lineHeight: 28, color: colors.text },
  dialogue: { fontStyle: "italic" as const },
  newWord: { color: colors.indigo, fontWeight: "800" as const, textDecorationLine: "underline" as const },
  selectedWord: { backgroundColor: colors.selectedBg, color: colors.selectedText },
  translation: { fontSize: 15, lineHeight: 21, color: colors.textMuted },
  play: { paddingTop: 4 },
}));
