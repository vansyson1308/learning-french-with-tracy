/**
 * Dictation (P7 §63): hear the bundled clip, type what was said. Strict
 * STRICT grading (accents matter — orthographic decoding IS the construct).
 * The transcript is the answer, so it is never shown before grading.
 */
import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { useT } from "@/lib/i18n";
import { DeviceVoiceLabel, DeviceVoiceMissing } from "@/components/session/device-voice-missing";
import { ListeningPlayerView } from "@/components/session/listening-player-view";
import type { ListeningAudioPlan } from "@/lib/reception/device-voice-listening";
import type { ListeningPlayerApi } from "@/lib/reception/use-listening-player";
import type { DictationExercise } from "@/lib/types";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

export function Dictation({
  targetLanguage,
  exercise: _exercise,
  answer,
  status,
  player,
  onAnswer,
  onAudioUnavailable,
  courseId,
  audioKind = "bundled",
  scriptNote,
}: {
  targetLanguage: string;
  exercise: DictationExercise;
  answer: string | null;
  status: "none" | "correct" | "wrong";
  player: ListeningPlayerApi;
  onAnswer: (value: string) => void;
  onAudioUnavailable?: () => void;
  /** Needed for the device-voice notice (QC 2026-11-05 §2.1). */
  courseId?: string;
  /** How the clip is heard; "no-device-voice" = not answerable, only the skip. */
  audioKind?: ListeningAudioPlan["kind"];
  /** QC 2026-11-05 §1.1: the taught-script key, when a correct answer was written in another accepted script. */
  scriptNote?: string | null;
}) {
  const styles = useStyles();
  const colors = useThemeColors();
  const { t } = useT();

  if (audioKind === "no-device-voice" && courseId !== undefined) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>{t("ex.typeWhatYouHear")}</Text>
        <DeviceVoiceMissing courseId={courseId} onSkip={onAudioUnavailable} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t("ex.typeWhatYouHear")}</Text>
      <ListeningPlayerView api={player} onAudioUnavailable={onAudioUnavailable} />
      {audioKind === "device-voice" ? <DeviceVoiceLabel /> : null}
      <TextInput
        style={[
          styles.input,
          status === "correct" && { borderColor: colors.green },
          status === "wrong" && { borderColor: colors.rose },
        ]}
        value={answer ?? ""}
        onChangeText={onAnswer}
        editable={status === "none"}
        placeholder={t("ex.typeInAccents", { language: targetLanguage })}
        placeholderTextColor={colors.neutral400}
        autoCapitalize="none"
        autoCorrect={false}
        testID="dictation-input"
      />
      {status === "correct" && scriptNote ? (
        <Text style={styles.note} testID="dictation-script-note">
          {t("ex.traditionalAccepted", { form: scriptNote })}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    wrap: { gap: 16 },
    title: { fontSize: 22, fontWeight: "800", color: colors.text },
    note: { fontSize: 15, color: colors.textMuted },
    input: {
      borderWidth: 2,
      borderColor: colors.neutral200,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      padding: 14,
      fontSize: 18,
      color: colors.text,
    },
  })
);
