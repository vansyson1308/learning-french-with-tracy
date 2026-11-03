import React, { useEffect } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { RubyText } from "@/components/reading/ruby-text";
import { courseProfile } from "@/lib/course-profile";
import type { ScriptReading } from "@/lib/learning/script-reading";
import { useT } from "@/lib/i18n";
import { SpeakerButton } from "@/components/speaker-button";
import { speakTarget } from "@/lib/audio";
import { useProgress } from "@/lib/store";
import { makeThemedStyles, radius, useResolvedScheme, useThemeColors } from "@/lib/theme";
import type { TypeAnswerExercise } from "@/lib/types";

type TypeAnswerProps = {
  exercise: TypeAnswerExercise;
  answer: string;
  onAnswer: (text: string) => void;
  status: "none" | "correct" | "wrong";
  targetLanguage: string;
  /** P4b script reading of a target prompt (furigana / pinyin / RR); none by default. */
  scriptOf?: (text: string) => ScriptReading | undefined;
};

export function TypeAnswer({
  exercise,
  answer,
  onAnswer,
  status,
  targetLanguage,
  scriptOf = () => undefined,
}: TypeAnswerProps) {
  const courseId = useProgress((s) => s.activeCourseId);
  const colors = useThemeColors();
  const styles = useStyles();
  const scheme = useResolvedScheme();
  const { t, languageName } = useT();
  const nativeName = languageName(courseProfile(courseId).nativeCode, courseProfile(courseId).nativeLanguage, "native");
  const isListen = exercise.mode === "listen";
  const isProduceTarget = exercise.mode === "produceTarget";

  useEffect(() => {
    if (isListen && exercise.audioTarget) speakTarget(courseId, exercise.audioTarget);
  }, [courseId, exercise.id, isListen, exercise.audioTarget]);

  const promptScript = isListen ? undefined : scriptOf(exercise.prompt);

  const title = isListen
    ? t("ex.typeWhatYouHearIn", { language: targetLanguage })
    : isProduceTarget
      ? t("ex.writeThisIn", { language: targetLanguage })
      : t("ex.writeThisIn", { language: nativeName });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.promptRow}>
        {exercise.audioTarget ? <SpeakerButton text={exercise.audioTarget} /> : null}
        {isListen ? null : promptScript ? (
          <RubyText text={exercise.prompt} reading={promptScript} textStyle={styles.prompt} />
        ) : (
          <Text style={styles.prompt}>{exercise.prompt}</Text>
        )}
      </View>

      <TextInput
        testID="type-answer-input"
        value={answer}
        onChangeText={onAnswer}
        editable={status === "none"}
        placeholder={t("ex.typeIn", { language: isListen || isProduceTarget ? targetLanguage : nativeName })}
        placeholderTextColor={colors.neutral400}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardAppearance={scheme}
        multiline
        style={[
          styles.input,
          status === "correct" && { borderColor: colors.greenLight },
          status === "wrong" && { borderColor: colors.rose },
        ]}
      />
    </View>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    container: { gap: 20 },
    title: { fontSize: 22, fontWeight: "800", color: colors.neutral700 },
    promptRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    prompt: { fontSize: 20, fontWeight: "700", color: colors.text, flexShrink: 1 },
    input: {
      minHeight: 110,
      borderWidth: 2,
      borderColor: colors.neutral200,
      borderRadius: radius.lg,
      backgroundColor: colors.neutral100,
      padding: 14,
      fontSize: 17,
      color: colors.text,
      textAlignVertical: "top",
    },
  })
);
