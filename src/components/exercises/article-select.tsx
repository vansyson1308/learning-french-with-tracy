/**
 * Article drill (Phase 5B §54–58): pick the right article for a noun. The
 * noun is displayed bare with a blank where the article goes; choices are
 * the article set. Grammar practice only — no lexical card is graded.
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { makeThemedStyles } from "@/lib/theme";
import type { ArticleSelectExercise } from "@/lib/types";

import { OptionCard, type OptionState } from "./option-card";

type ArticleSelectProps = {
  exercise: ArticleSelectExercise;
  answer: number | null;
  onAnswer: (index: number) => void;
  status: "none" | "correct" | "wrong";
};

export function ArticleSelect({ exercise, answer, onAnswer, status }: ArticleSelectProps) {
  const styles = useStyles();
  const chosen = answer !== null ? exercise.articles[answer] : "___";

  const optionState = (index: number): OptionState => {
    if (status === "none") return answer === index ? "selected" : "idle";
    if (index === exercise.correct) return "correct";
    if (answer === index) return "wrong";
    return "idle";
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose the right article</Text>
      <Text style={styles.phrase}>
        {chosen} {exercise.noun}
      </Text>
      <Text style={styles.gloss}>{exercise.gloss}</Text>

      <View style={styles.options}>
        {exercise.articles.map((article, index) => (
          <OptionCard
            key={article + index}
            text={article}
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
    phrase: { fontSize: 28, fontWeight: "800", color: colors.text },
    gloss: { fontSize: 15, color: colors.textMuted },
    options: { gap: 10, marginTop: 8 },
  })
);
