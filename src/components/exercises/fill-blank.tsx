import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useT } from "@/lib/i18n";
import { makeThemedStyles } from "@/lib/theme";
import type { FillBlankExercise } from "@/lib/types";

import { OptionCard, type OptionState } from "./option-card";

type FillBlankProps = {
  exercise: FillBlankExercise;
  answer: number | null;
  onAnswer: (index: number) => void;
  status: "none" | "correct" | "wrong";
  /** P4a reading aid for the options (romanization); none by default. */
  readingOf?: (text: string) => string | undefined;
};

export function FillBlank({ exercise, answer, onAnswer, status, readingOf = () => undefined }: FillBlankProps) {
  const styles = useStyles();
  const { t } = useT();
  const filled =
    answer !== null
      ? exercise.sentence.replace("___", exercise.options[answer])
      : exercise.sentence;

  const optionState = (index: number): OptionState => {
    if (status === "none") return answer === index ? "selected" : "idle";
    if (index === exercise.correct) return "correct";
    if (answer === index) return "wrong";
    return "idle";
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("ex.completeSentence")}</Text>
      <Text style={styles.sentence}>{filled}</Text>
      <Text style={styles.translation}>{exercise.translation}</Text>

      <View style={styles.options}>
        {exercise.options.map((option, index) => (
          <OptionCard
            key={option + index}
            text={option}
            reading={readingOf(option)}
            state={optionState(index)}
            onPress={() => onAnswer(index)}
            disabled={status !== "none"}
          />
        ))}
      </View>
    </View>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    container: { gap: 16 },
    title: { fontSize: 22, fontWeight: "800", color: colors.neutral700 },
    sentence: { fontSize: 22, fontWeight: "700", color: colors.text },
    translation: { fontSize: 15, color: colors.textMuted },
    options: { gap: 10, marginTop: 8 },
  })
);
