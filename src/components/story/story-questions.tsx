/**
 * Comprehension questions after a story (P5b): three multiple-choice
 * questions (locate / infer) with immediate feedback. Learning mode — the
 * result is shown to the learner and never stored, scored or claimed.
 */

import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { DuoButton } from "@/components/duo-button";
import { useT } from "@/lib/i18n";
import type { CompiledStoryQuestion } from "@/lib/stories/content";
import { makeThemedStyles, radius } from "@/lib/theme";

export function StoryQuestions(props: {
  questions: CompiledStoryQuestion[];
  onDone: (correct: number) => void;
}) {
  const styles = useStyles();
  const { t } = useT();
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const q = props.questions[index];
  if (!q) return null;
  const answered = chosen !== null;
  const right = chosen === q.answer;

  const choose = (i: number) => {
    if (answered) return;
    setChosen(i);
    if (i === q.answer) setCorrect((n) => n + 1);
  };
  const next = () => {
    if (index + 1 >= props.questions.length) {
      props.onDone(correct);
      return;
    }
    setIndex(index + 1);
    setChosen(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap} testID="story-questions">
      <Text style={styles.title}>{t("stories.questionsTitle")}</Text>
      <Text style={styles.progress}>{t("stories.questionProgress", { n: index + 1, total: props.questions.length })}</Text>
      <Text style={styles.prompt}>{q.prompt}</Text>
      {q.options.map((option, i) => {
        const state = !answered ? "idle" : i === q.answer ? "right" : i === chosen ? "wrong" : "idle";
        return (
          <Pressable
            key={i}
            onPress={() => choose(i)}
            accessibilityRole="button"
            accessibilityState={{ selected: chosen === i }}
            style={[styles.option, state === "right" && styles.optionRight, state === "wrong" && styles.optionWrong]}
            testID={`story-question-option-${i}`}
          >
            <Text style={styles.optionText}>{option}</Text>
          </Pressable>
        );
      })}
      {answered ? (
        <View style={[styles.feedback, right ? styles.feedbackRight : styles.feedbackWrong]} testID="story-question-feedback">
          <Text style={[styles.feedbackText, right ? styles.feedbackTextRight : styles.feedbackTextWrong]}>
            {right ? t("stories.correct") : t("stories.wrong", { answer: q.options[q.answer] })}
          </Text>
        </View>
      ) : null}
      <DuoButton label={t("stories.next")} variant="primary" disabled={!answered} onPress={next} testID="story-question-next" />
    </ScrollView>
  );
}

const useStyles = makeThemedStyles((colors) => ({
  wrap: { padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: "800" as const, color: colors.text },
  progress: { fontSize: 14, color: colors.textMuted, fontWeight: "700" as const },
  prompt: { fontSize: 18, lineHeight: 25, color: colors.text, marginBottom: 4 },
  option: { borderWidth: 2, borderBottomWidth: 4, borderColor: colors.neutral200, borderRadius: radius.lg, padding: 14 },
  optionRight: { borderColor: colors.greenLight, backgroundColor: colors.correctBg },
  optionWrong: { borderColor: colors.rose, backgroundColor: colors.wrongBg },
  optionText: { fontSize: 16, color: colors.text },
  feedback: { borderRadius: radius.md, padding: 12 },
  feedbackRight: { backgroundColor: colors.correctBg },
  feedbackWrong: { backgroundColor: colors.wrongBg },
  feedbackText: { fontSize: 16, fontWeight: "700" as const },
  feedbackTextRight: { color: colors.correctText },
  feedbackTextWrong: { color: colors.wrongText },
}));
