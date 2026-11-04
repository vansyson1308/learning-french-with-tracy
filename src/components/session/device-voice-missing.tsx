/**
 * QC 2026-11-05 §2.1: a device-voice course's listening item when no local
 * voice for the course's language is installed. The item cannot be heard,
 * so it is not answerable: the learner gets the install hint and skips it
 * through the session's skip channel (never counted wrong, no evidence).
 */
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { courseProfile } from "@/lib/course-profile";
import { useT } from "@/lib/i18n";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

export function DeviceVoiceMissing({ courseId, onSkip }: { courseId: string; onSkip?: () => void }) {
  const styles = useStyles();
  const colors = useThemeColors();
  const { t, languageName } = useT();
  const profile = courseProfile(courseId);
  const language = languageName(profile.targetCode, profile.targetLanguage);
  return (
    <View style={styles.wrap} testID="device-voice-missing">
      <View style={styles.row}>
        <Ionicons name="volume-mute-outline" size={20} color={colors.orange} />
        <Text style={styles.title}>{t("listening.noDeviceVoice", { language })}</Text>
      </View>
      <Text style={styles.hint}>
        {t(Platform.OS === "ios" ? "listening.noDeviceVoiceHintIos" : "listening.noDeviceVoiceHint", { language })}
      </Text>
      {onSkip ? (
        <Pressable onPress={onSkip} accessibilityRole="button" style={styles.button} testID="device-voice-skip">
          <Text style={styles.buttonText}>{t("listening.skipNoVoice")}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Small label under a player that speaks through the device voice. */
export function DeviceVoiceLabel() {
  const styles = useStyles();
  const colors = useThemeColors();
  const { t } = useT();
  return (
    <View style={styles.row} testID="listening-device-voice-label">
      <Ionicons name="phone-portrait-outline" size={14} color={colors.textMuted} />
      <Text style={styles.label}>{t("listening.deviceVoice")}</Text>
    </View>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    wrap: {
      gap: 10,
      padding: 14,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.neutral200,
      backgroundColor: colors.surface,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 8 },
    title: { flex: 1, fontSize: 16, fontWeight: "700", color: colors.text },
    hint: { fontSize: 14, color: colors.textMuted },
    label: { fontSize: 12, color: colors.textMuted },
    button: {
      alignSelf: "flex-start",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.full,
      borderWidth: 1.5,
      borderColor: colors.neutral400,
    },
    buttonText: { fontSize: 14, fontWeight: "700", color: colors.text },
  })
);
