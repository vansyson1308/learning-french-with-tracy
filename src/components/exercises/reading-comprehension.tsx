/**
 * Reading comprehension (P7 §62, §112-115): a passage + a meaning question.
 * Learning mode may show tap-to-gloss; scored mode disables lexical help
 * before answering (§54, §98) via allowGloss.
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { OptionCard, type OptionState } from "@/components/exercises/option-card";
import { ReadingPassage } from "@/components/session/reading-passage";
import { readingFor } from "@/lib/reception/content";
import type { ReadingComprehensionExercise } from "@/lib/types";
import { makeThemedStyles } from "@/lib/theme";

function optionState(
  index: number,
  answer: number | null,
  status: "none" | "correct" | "wrong",
  correct: number
): OptionState {
  if (status === "none") return answer === index ? "selected" : "idle";
  if (index === correct) return "correct";
  if (answer === index) return "wrong";
  return "idle";
}

export function ReadingComprehension({
  exercise,
  answer,
  status,
  allowGloss,
  onAnswer,
}: {
  exercise: ReadingComprehensionExercise;
  answer: number | null;
  status: "none" | "correct" | "wrong";
  allowGloss: boolean;
  onAnswer: (index: number) => void;
}) {
  const styles = useStyles();
  const reading = readingFor(exercise.readingId);
  if (!reading) return <Text style={styles.question}>Missing reading {exercise.readingId}</Text>;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Read, then answer</Text>
      <ReadingPassage
        title={reading.title}
        kind={reading.kind}
        blocks={reading.blocks}
        glossary={reading.supportGlossary}
        allowGloss={allowGloss}
      />
      <Text style={styles.question}>{exercise.question}</Text>
      <View style={styles.options}>
        {exercise.options.map((option, i) => (
          <OptionCard
            key={option.text + i}
            text={option.text}
            state={optionState(i, answer, status, exercise.correct)}
            disabled={status !== "none"}
            onPress={() => onAnswer(i)}
          />
        ))}
      </View>
    </View>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    wrap: { gap: 16 },
    title: { fontSize: 22, fontWeight: "800", color: colors.text },
    question: { fontSize: 17, fontWeight: "600", color: colors.text },
    options: { gap: 10 },
  })
);
