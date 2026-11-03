import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import { RubyText } from "@/components/reading/ruby-text";
import { useT } from "@/lib/i18n";
import { SpeakerButton } from "@/components/speaker-button";
import type { ScriptReading } from "@/lib/learning/script-reading";
import { speakTarget } from "@/lib/audio";
import { useProgress } from "@/lib/store";
import { useReadingAid } from "@/lib/use-reading-aid";
import { makeThemedStyles } from "@/lib/theme";
import type { SelectExercise } from "@/lib/types";

import { OptionCard, type OptionState } from "./option-card";

type SelectProps = {
  exercise: SelectExercise;
  answer: number | null;
  onAnswer: (index: number) => void;
  status: "none" | "correct" | "wrong";
  targetLanguage: string;
  /** P4b script reading of a target text (furigana / pinyin / RR); none by default. */
  scriptOf?: (text: string) => ScriptReading | undefined;
};

export function Select({
  exercise,
  answer,
  onAnswer,
  status,
  targetLanguage,
  scriptOf = () => undefined,
}: SelectProps) {
  const courseId = useProgress((s) => s.activeCourseId);
  const readingAid = useReadingAid(courseId);
  // P4c: an item that asks for a kanji's reading or spelling (JLPT 漢字読み, 表記) shows no reading layer at all.
  const hidden = exercise.scriptAid === "hidden";
  const readingOf = hidden ? () => undefined : readingAid;
  const scriptFor = hidden ? () => undefined : scriptOf;
  const styles = useStyles();
  const { t } = useT();
  const hasEmoji = exercise.options.some((o) => o.emoji);
  const isListen = exercise.mode === "listen";

  useEffect(() => {
    if (isListen && exercise.audioTarget) speakTarget(courseId, exercise.audioTarget);
  }, [courseId, exercise.id, isListen, exercise.audioTarget]);

  const optionState = (index: number): OptionState => {
    if (status === "none") return answer === index ? "selected" : "idle";
    if (index === exercise.correct) return "correct";
    if (answer === index) return "wrong";
    return "idle";
  };

  const title =
    exercise.mode === "targetToNative"
      ? t("ex.whatDoesThisMean")
      : exercise.mode === "nativeToTarget"
        ? t("ex.pickWord", { language: targetLanguage })
        : t("ex.tapWhatYouHear");

  const promptScript = isListen ? undefined : scriptFor(exercise.prompt);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.promptRow}>
        {exercise.audioTarget ? <SpeakerButton text={exercise.audioTarget} /> : null}
        {!isListen ? (
          <View>
            {promptScript ? (
              <RubyText text={exercise.prompt} reading={promptScript} textStyle={styles.prompt} />
            ) : (
              <Text style={styles.prompt}>{exercise.prompt}</Text>
            )}
            {!promptScript && readingOf(exercise.prompt) ? (
              <Text style={styles.reading} testID="prompt-reading">{readingOf(exercise.prompt)}</Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={[styles.options, hasEmoji && styles.grid]}>
        {exercise.options.map((option, index) => (
          <OptionCard
            key={option.text + index}
            text={option.text}
            reading={readingOf(option.text)}
            script={scriptFor(option.text)}
            emoji={option.emoji}
            compact={hasEmoji}
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
    container: { gap: 20 },
    title: { fontSize: 22, fontWeight: "800", color: colors.neutral700 },
    promptRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    prompt: { fontSize: 22, fontWeight: "700", color: colors.text, flexShrink: 1 },
    reading: { fontSize: 15, color: colors.textMuted, marginTop: 2 },
    options: { gap: 10 },
    grid: { flexDirection: "row", flexWrap: "wrap" },
  })
);
