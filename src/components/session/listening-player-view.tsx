/**
 * Listening player UI (P7 §66-70): play/replay/pause, a non-interactive
 * progress bar (no seeking in scored audio, §24 — and none anywhere for
 * simplicity), the plays-left pill under a scored cap, an optional slow
 * toggle (learning only, §22-23), and the accessible "I can't use audio
 * right now" escape (§69-70).
 */
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useT } from "@/lib/i18n";
import type { ListeningPlayerApi } from "@/lib/reception/use-listening-player";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

export function ListeningPlayerView({
  api,
  onAudioUnavailable,
}: {
  api: ListeningPlayerApi;
  /** Present = show the audio-skip affordance (§69). */
  onAudioUnavailable?: () => void;
}) {
  const styles = useStyles();
  const colors = useThemeColors();
  const { t } = useT();
  const { state } = api;
  const pct = api.duration > 0 ? Math.min(100, (api.position / api.duration) * 100) : 0;
  const exhausted = api.playsLeft === 0 && !state.playing && !state.resumeCredit;

  return (
    <View style={styles.wrap} testID="listening-player">
      <View style={styles.row}>
        <Pressable
          onPress={state.playing ? api.onPausePress : api.onPlayPress}
          disabled={!state.playing && !api.canPlay}
          accessibilityRole="button"
          accessibilityLabel={
            state.playing ? t("player.pause") : state.everFinished ? t("player.playAgain") : t("a11y.playAudio")
          }
          style={[styles.playButton, !state.playing && !api.canPlay && styles.playDisabled]}
          testID="listening-play"
        >
          <Ionicons
            name={state.playing ? "pause" : state.everFinished ? "refresh" : "play"}
            size={30}
            color={colors.white}
          />
        </Pressable>
        <View style={styles.meta}>
          <View style={styles.track} accessibilityLabel={t("player.progress")}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>
          <View style={styles.metaRow}>
            {api.playsLeft !== null ? (
              <Text style={styles.pill} testID="plays-left">
                {exhausted ? t("player.noPlaysLeft") : t("player.playsLeft", { n: api.playsLeft })}
              </Text>
            ) : (
              <Text style={styles.pillMuted}>{t("player.unlimited")}</Text>
            )}
            {state.config.allowSlow ? (
              <Pressable
                onPress={api.onToggleRate}
                accessibilityRole="button"
                accessibilityLabel={state.rate === 1 ? t("player.slowOn") : t("player.slowOff")}
                style={[styles.rateChip, state.rate !== 1 && styles.rateChipActive]}
                testID="rate-toggle"
              >
                <Ionicons
                  name="speedometer-outline"
                  size={14}
                  color={state.rate !== 1 ? colors.greenDark : colors.textMuted}
                />
                <Text style={[styles.rateText, state.rate !== 1 && styles.rateTextActive]}>
                  {state.rate === 1 ? t("player.slow") : t("player.slowActive")}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
      {state.resumeCredit && !state.playing ? (
        <Text style={styles.interrupted}>{t("player.interrupted")}</Text>
      ) : null}
      {onAudioUnavailable ? (
        <Pressable
          onPress={onAudioUnavailable}
          accessibilityRole="button"
          accessibilityLabel={t("player.noAudio")}
          style={styles.noAudio}
          testID="audio-unavailable"
        >
          <Ionicons name="volume-mute-outline" size={15} color={colors.textMuted} />
          <Text style={styles.noAudioText}>{t("player.noAudio")}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    wrap: { gap: 10 },
    row: { flexDirection: "row", alignItems: "center", gap: 14 },
    playButton: {
      width: 64,
      height: 64,
      borderRadius: radius.full,
      backgroundColor: colors.sky,
      borderBottomWidth: 4,
      borderColor: colors.skyDark,
      alignItems: "center",
      justifyContent: "center",
    },
    playDisabled: { backgroundColor: colors.neutral200, borderColor: colors.neutral400 },
    meta: { flex: 1, gap: 8 },
    track: {
      height: 8,
      borderRadius: radius.full,
      backgroundColor: colors.neutral200,
      overflow: "hidden",
    },
    fill: { height: "100%", borderRadius: radius.full, backgroundColor: colors.sky },
    metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    pill: { fontSize: 13, fontWeight: "700", color: colors.neutral700 },
    pillMuted: { fontSize: 13, color: colors.textMuted },
    rateChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderWidth: 1.5,
      borderColor: colors.neutral200,
      borderRadius: radius.full,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    rateChipActive: { borderColor: colors.green, backgroundColor: colors.greenLight + "22" },
    rateText: { fontSize: 12, fontWeight: "700", color: colors.textMuted },
    rateTextActive: { color: colors.greenDark },
    interrupted: { fontSize: 12, color: colors.textMuted },
    noAudio: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 2 },
    noAudioText: { fontSize: 13, color: colors.textMuted, textDecorationLine: "underline" },
  })
);
