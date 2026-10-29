/**
 * ACCEPTANCE-ONLY diagnostics: plays one Opus mono 16 kbps story sentence
 * through the app's audio path (expo-audio's useAudioPlayer /
 * useAudioPlayerStatus, the same hooks the story reader and the listening
 * player use; slow mode is the listening player's SLOW_RATE with the same
 * pitch-corrected setPlaybackRate call) and shows which playback events
 * arrived.
 *
 * Never in a release build: metro.config.js blocks src/app/diagnostics/ and
 * assets/diagnostics/ unless the build sets LFT_ACCEPTANCE_DIAGNOSTICS=1
 * (only the device-acceptance APK and the diagnostics web export do), and
 * scripts/check-diagnostics-export.ts proves the release export holds
 * neither the route nor the fixture. Not translated on purpose: no learner
 * ever sees it.
 */

import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import React, { useEffect, useReducer } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { initialProbe, PROBE_PHASE_TIMEOUT_MS, probeReducer, probeSummary, probeVerdict, type PhaseLog, type ProbePhaseName } from "@/lib/diagnostics/playback-probe";
import { SLOW_RATE } from "@/lib/reception/listening-player";
import { makeThemedStyles, radius } from "@/lib/theme";

// Encoded from fr.story.le_chat_et_la_souris#1 (content/audio/diagnostics-fixtures.json).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const FIXTURE = require("@/assets/diagnostics/opus/story-sentence-16k.opus");

const EVENTS: (keyof Pick<PhaseLog, "loaded" | "playing" | "finished">)[] = ["loaded", "playing", "finished"];

export default function OpusDiagnosticsScreen() {
  const styles = useStyles();
  const player = useAudioPlayer(FIXTURE);
  const status = useAudioPlayerStatus(player);
  const [state, dispatch] = useReducer(probeReducer, initialProbe);
  const verdict = probeVerdict(state);

  useEffect(() => {
    dispatch({ type: "status", status, nowMs: Date.now() });
  }, [status]);

  // The slow pass replays the clip from the top at the listening player's slow rate.
  useEffect(() => {
    if (state.phase === "slow") {
      player
        .seekTo(0)
        .catch(() => {})
        .finally(() => {
          player.setPlaybackRate(SLOW_RATE, "high");
          player.play();
        });
    } else if (state.phase === "done") {
      player.pause();
    }
  }, [player, state.phase]);

  useEffect(() => {
    if (state.phase !== "normal" && state.phase !== "slow") return;
    const phase: ProbePhaseName = state.phase;
    const timer = setTimeout(() => dispatch({ type: "timeout", phase }), PROBE_PHASE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [state.phase]);

  useEffect(() => {
    // One logcat / console line for the acceptance report.
    if (verdict !== "pending") console.info(`LFT_DIAG_OPUS ${probeSummary(state)}`);
  }, [verdict, state]);

  const start = () => {
    // Played inside the press handler: the web's autoplay policy needs the gesture.
    player.setPlaybackRate(1, "high");
    player.play();
    dispatch({ type: "start", nowMs: Date.now(), slowRate: SLOW_RATE });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body} testID="diag-opus-screen">
        <Text style={styles.heading}>Opus playback check (acceptance build)</Text>
        <Pressable accessibilityRole="button" onPress={start} disabled={state.phase !== "idle"} style={styles.button} testID="diag-opus-start">
          <Text style={styles.buttonText}>Play Opus sample</Text>
        </Pressable>
        {(["normal", "slow"] as const).map((phase) => (
          <View key={phase} style={styles.card}>
            <Text style={styles.label}>{phase === "normal" ? "Normal rate (1.0)" : `Slow rate (${SLOW_RATE})`}</Text>
            {EVENTS.map((event) =>
              state[phase][event] ? (
                <Text key={event} style={styles.text} testID={`diag-opus-${phase}-${event}`}>
                  {event}
                </Text>
              ) : null
            )}
          </View>
        ))}
        {state.phase === "done" ? (
          <Text style={styles.text} testID={state.error === null ? "diag-opus-no-error" : "diag-opus-error"}>
            {state.error === null ? "no decoder error" : `error: ${state.error}`}
          </Text>
        ) : null}
        {verdict !== "pending" ? (
          <Text style={styles.label} testID={`diag-opus-result-${verdict}`}>
            {verdict.toUpperCase()}
          </Text>
        ) : null}
        <Text style={styles.text} testID="diag-opus-summary">
          {probeSummary(state)}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    body: { padding: 16, gap: 12 },
    heading: { fontSize: 18, fontWeight: "800", color: colors.neutral700 },
    button: { borderRadius: radius.lg, backgroundColor: colors.neutral700, padding: 14, alignItems: "center" },
    buttonText: { color: colors.background, fontWeight: "800" },
    card: { borderWidth: 2, borderColor: colors.neutral200, borderRadius: radius.lg, padding: 12, gap: 4 },
    label: { fontSize: 15, fontWeight: "800", color: colors.neutral700 },
    text: { fontSize: 13, color: colors.text },
  })
);
