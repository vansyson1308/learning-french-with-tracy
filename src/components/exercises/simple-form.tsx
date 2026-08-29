/**
 * Simple-form renderer (P9 §14): discrete labeled fields — the CEFR
 * "notes, messages and forms" A1 construct (name, nationality, age,
 * city…). Each field checks deterministically against its rubric slot;
 * learning shows per-field feedback after the attempt.
 */
import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import {
  evaluateWrittenAnswer,
  isWrittenAnswer,
  type Answer,
  type Status,
} from "@/lib/grading";
import { makeThemedStyles, radius, useResolvedScheme, useThemeColors } from "@/lib/theme";
import type { SimpleFormExercise } from "@/lib/types";

export function SimpleForm({
  exercise,
  answer,
  status,
  scored,
  onAnswer,
}: {
  exercise: SimpleFormExercise;
  answer: Answer;
  status: Status;
  scored: boolean;
  onAnswer: (value: Answer) => void;
}) {
  const styles = useStyles();
  const colors = useThemeColors();
  const scheme = useResolvedScheme();
  const values =
    isWrittenAnswer(answer) && answer.kind === "form" ? answer.values : {};
  const answered = status !== "none";
  const evaluation = answered ? evaluateWrittenAnswer(exercise, answer) : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fill in the form in French</Text>
      <Text style={styles.instruction}>{exercise.instruction}</Text>

      <View style={styles.formBox}>
        {exercise.fields.map((field) => (
          <View key={field.id} style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <TextInput
              value={values[field.id] ?? ""}
              onChangeText={(next) =>
                onAnswer({
                  written: true,
                  kind: "form",
                  values: { ...values, [field.id]: next },
                })
              }
              editable={!answered}
              placeholderTextColor={colors.neutral400}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardAppearance={scheme}
              style={styles.fieldInput}
              accessibilityLabel={field.label}
              testID={`form-field-${field.id}`}
            />
          </View>
        ))}
      </View>

      {answered && !scored && evaluation && evaluation.feedback.length > 0 ? (
        <View style={styles.feedbackBox} testID="writing-feedback">
          {evaluation.feedback.map((line) => (
            <Text key={line} style={styles.feedbackText}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    container: { gap: 14 },
    title: { fontSize: 22, fontWeight: "800", color: colors.neutral700 },
    instruction: { fontSize: 16, color: colors.text, lineHeight: 22 },
    formBox: {
      borderWidth: 2,
      borderColor: colors.neutral200,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      padding: 12,
      gap: 12,
    },
    fieldRow: { gap: 4 },
    fieldLabel: { fontSize: 14, fontWeight: "700", color: colors.neutral400 },
    fieldInput: {
      borderWidth: 2,
      borderColor: colors.neutral200,
      borderRadius: radius.md,
      backgroundColor: colors.background,
      color: colors.text,
      fontSize: 17,
      padding: 10,
    },
    feedbackBox: { gap: 4 },
    feedbackText: { fontSize: 15, fontWeight: "600", color: colors.neutral700 },
  })
);
