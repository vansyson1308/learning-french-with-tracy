import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { RubyText } from "@/components/reading/ruby-text";
import { useT } from "@/lib/i18n";
import type { ScriptReading } from "@/lib/learning/script-reading";
import { SpeakerButton } from "@/components/speaker-button";
import { haptics } from "@/lib/haptics";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";
import type { WordBankExercise } from "@/lib/types";

type WordBankProps = {
  exercise: WordBankExercise;
  /** Indexes into exercise.tokens, in chosen order. */
  answer: number[];
  onAnswer: (tokenIndexes: number[]) => void;
  status: "none" | "correct" | "wrong";
  /** P4b script reading of the prompt and tiles (furigana / pinyin / RR); none by default. */
  scriptOf?: (text: string) => ScriptReading | undefined;
};

export function WordBank({ exercise, answer, onAnswer, status, scriptOf = () => undefined }: WordBankProps) {
  const colors = useThemeColors();
  const styles = useStyles();
  const { t } = useT();
  const locked = status !== "none";

  const promptScript = scriptOf(exercise.prompt);

  const pick = (index: number) => {
    if (locked || answer.includes(index)) return;
    onAnswer([...answer, index]);
  };

  const unpick = (index: number) => {
    if (locked) return;
    onAnswer(answer.filter((i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("ex.translateSentence")}</Text>

      <View style={styles.promptRow}>
        {exercise.audioTarget ? <SpeakerButton text={exercise.audioTarget} /> : null}
        {promptScript ? (
          <RubyText text={exercise.prompt} reading={promptScript} textStyle={styles.prompt} />
        ) : (
          <Text style={styles.prompt}>{exercise.prompt}</Text>
        )}
      </View>

      <View
        style={[
          styles.answerArea,
          status === "correct" && { borderColor: colors.greenLight },
          status === "wrong" && { borderColor: colors.rose },
        ]}
      >
        {answer.map((tokenIndex) => (
          <Chip
            key={tokenIndex}
            label={exercise.tokens[tokenIndex]}
            script={scriptOf(exercise.tokens[tokenIndex])}
            onPress={() => unpick(tokenIndex)}
            testID="wordbank-answer"
          />
        ))}
      </View>

      <View style={styles.pool}>
        {exercise.tokens.map((token, index) => {
          const used = answer.includes(index);
          const script = scriptOf(token);
          return used ? (
            <View key={index} style={[styles.chip, styles.chipGhost]}>
              {script ? (
                <RubyText text={token} reading={script} textStyle={[styles.chipText, { color: "transparent" }]} readingColor="transparent" />
              ) : (
                <Text style={[styles.chipText, { color: "transparent" }]}>{token}</Text>
              )}
            </View>
          ) : (
            <Chip key={index} label={token} script={script} onPress={() => pick(index)} testID="wordbank-token" />
          );
        })}
      </View>
    </View>
  );
}

function Chip({ label, script, onPress, testID }: { label: string; script?: ScriptReading; onPress: () => void; testID?: string }) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      style={({ pressed }) => [styles.chip, { borderBottomWidth: pressed ? 2 : 4 }]}
    >
      {script ? <RubyText text={label} reading={script} textStyle={styles.chipText} /> : <Text style={styles.chipText}>{label}</Text>}
    </Pressable>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    container: { gap: 20 },
    title: { fontSize: 22, fontWeight: "800", color: colors.neutral700 },
    promptRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    prompt: { fontSize: 20, fontWeight: "700", color: colors.text, flexShrink: 1 },
    answerArea: {
      minHeight: 56,
      borderTopWidth: 2,
      borderBottomWidth: 2,
      borderColor: colors.neutral200,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      paddingVertical: 8,
      alignItems: "center",
    },
    pool: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "center",
    },
    chip: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.neutral200,
      borderRadius: radius.md,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    chipGhost: { backgroundColor: colors.neutral200, borderColor: colors.neutral200 },
    chipText: { fontSize: 17, fontWeight: "600", color: colors.text },
  })
);
