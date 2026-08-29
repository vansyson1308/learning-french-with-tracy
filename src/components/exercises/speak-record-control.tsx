/**
 * Shared recording control for both speak exercise types (P8 §14/§23/§24):
 * point-of-use permission flow, record/stop with a live indicator, honest
 * non-final-outcome notices, bounded scored attempts, own-voice replay,
 * and the "I heard: …" line. Construct policy (what may be shown when) is
 * DECIDED in step-policy and passed in — this component only renders it.
 */
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import React from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { DuoButton } from "@/components/duo-button";
import type { SpokenAnswer } from "@/lib/grading";
import {
  gateFor,
  gateMessage,
  NETWORK_DISCLOSURE_TEXT,
  networkDisclosureRequired,
  outcomeNotice,
  type SpeakStepContext,
} from "@/lib/speech/step-policy";
import { useProgress } from "@/lib/store";
import type { SpeechSessionApi } from "@/lib/speech/use-speech-session";
import { useSpeechAttempt } from "@/lib/speech/use-speech-attempt";
import type { SpeechRecognizerPort } from "@/lib/speech/recognizer-port";
import type { SpeechOutcome } from "@/lib/speech/types";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

/** Inert stand-in while the session adapter is still mounting. */
const INERT_PORT: SpeechRecognizerPort = {
  probeCapabilities: async () => {
    throw new Error("speech port not mounted");
  },
  requestPermissions: async () => {
    throw new Error("speech port not mounted");
  },
  startAttempt: () => {
    throw new Error("speech port not mounted");
  },
  stopAttempt: () => {},
  abortAttempt: () => {},
  addListener: () => () => {},
  dispose: () => {},
};

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function SpeakRecordControl({
  scored,
  session,
  mode,
  contextualStrings,
  budget,
  showPartials,
  showHeard,
  answered,
  assisted,
  heardText,
  hint,
  onFinal,
  onOutcome,
  onSkip,
  onBeforeRecord,
}: {
  scored: boolean;
  session: SpeechSessionApi;
  mode: "practice" | "scored";
  contextualStrings?: string[];
  /** Recording starts allowed (scored); null = unlimited. */
  budget: number | null;
  showPartials: boolean;
  /** Show the heard transcript before Check (learning). Post-check always. */
  showHeard: boolean;
  answered: boolean;
  /** Whether an attempt started NOW counts as assisted (§13). */
  assisted: boolean;
  /** The currently submitted-or-pending final transcript, if any. */
  heardText: string | null;
  /** Parent-provided practice hint after a final (never a score). */
  hint?: string | null;
  onFinal: (answer: SpokenAnswer) => void;
  /**
   * Every settled attempt outcome, final or not (P9 §28/§71): interaction
   * steps count silent/technical attempts without ever judging them.
   */
  onOutcome?: (outcome: SpeechOutcome) => void;
  onSkip?: () => void;
  /** Pause any model/stimulus audio before the mic opens (§10). */
  onBeforeRecord?: () => void;
}) {
  const styles = useStyles();
  const colors = useThemeColors();
  const ctx: SpeakStepContext = { scored };
  const attempt = useSpeechAttempt(session.port ?? INERT_PORT);
  const [attemptsUsed, setAttemptsUsed] = React.useState(0);
  const assistedAtStartRef = React.useRef(false);
  const replayPlayer = useAudioPlayer();

  // Deliver each FINAL outcome exactly once as a submittable SpokenAnswer
  // (and every settled outcome once through onOutcome, for callers that
  // track non-final attempts — never judged, only counted).
  const onFinalRef = React.useRef(onFinal);
  const onOutcomeRef = React.useRef(onOutcome);
  React.useEffect(() => {
    onFinalRef.current = onFinal;
    onOutcomeRef.current = onOutcome;
  });
  const outcome = attempt.outcome;
  React.useEffect(() => {
    if (!outcome) return;
    onOutcomeRef.current?.(outcome);
    if (outcome.kind !== "final") return;
    onFinalRef.current({
      spoken: true,
      finalTranscript: outcome.result.finalTranscript,
      alternatives: outcome.result.alternatives,
      assisted: assistedAtStartRef.current,
    });
  }, [outcome]);

  const gate = gateFor(session.capability, ctx);
  const speechNoticeAckAt = useProgress((s) => s.speechNoticeAckAt ?? null);
  const acknowledgeSpeechNotice = useProgress((s) => s.acknowledgeSpeechNotice);
  const needsNetworkDisclosure =
    gate.kind === "ready" &&
    networkDisclosureRequired(session.capability, speechNoticeAckAt !== null);
  const budgetLeft = budget === null ? null : Math.max(0, budget - attemptsUsed);
  const outOfAttempts = budgetLeft !== null && budgetLeft === 0;
  const active =
    attempt.phase === "starting" ||
    attempt.phase === "recording" ||
    attempt.phase === "stopping";
  const notice = outcomeNotice(outcome);

  const onRecordPress = () => {
    if (answered || active || outOfAttempts) return;
    assistedAtStartRef.current = assisted;
    setAttemptsUsed((used) => used + 1);
    onBeforeRecord?.();
    attempt.start({
      mode,
      contextualStrings,
      persistRecording: !scored && (session.capability?.recordingPersistenceAvailable ?? false),
    });
  };

  const onReplayPress = () => {
    if (!attempt.recordingUri) return;
    replayPlayer.replace({ uri: attempt.recordingUri });
    replayPlayer.seekTo(0);
    replayPlayer.play();
  };

  const skipLink =
    onSkip && !answered ? (
      <Pressable
        onPress={onSkip}
        accessibilityRole="button"
        accessibilityLabel="Skip this speaking exercise"
        style={styles.skipLink}
        testID="speak-skip"
      >
        <Text style={styles.skipText}>Can&apos;t speak right now? Skip this step</Text>
      </Pressable>
    ) : null;

  if (gate.kind === "probing") {
    return (
      <View style={styles.wrap}>
        <Text style={styles.muted}>Checking speech recognition…</Text>
        {skipLink}
      </View>
    );
  }

  if (gate.kind === "needsPermission") {
    return (
      <View style={styles.wrap}>
        <Text style={styles.rationale}>
          The microphone is used only while you practice speaking French, to hear
          your answer. Nothing is recorded until you tap the button.
        </Text>
        <DuoButton label="Allow microphone" onPress={() => void session.request()} />
        {skipLink}
      </View>
    );
  }

  if (gate.kind === "blocked") {
    return (
      <View style={styles.wrap} testID="speak-blocked">
        <Text style={styles.muted}>{gateMessage(gate)}</Text>
        {gate.reason === "permission" && Platform.OS !== "web" ? (
          <DuoButton
            label="Open Settings"
            variant="white"
            onPress={() => void Linking.openSettings()}
          />
        ) : null}
        {onSkip ? <DuoButton label="Skip this step" variant="white" onPress={onSkip} /> : null}
      </View>
    );
  }

  // §7 (P9): before the FIRST recording on a device whose system recognizer
  // may use the network, say so once — plainly, not per-question, and never
  // buried in a settings page. Recording stays closed until acknowledged.
  if (needsNetworkDisclosure) {
    return (
      <View style={styles.wrap} testID="speech-network-notice">
        <Text style={styles.rationale}>{NETWORK_DISCLOSURE_TEXT}</Text>
        <DuoButton label="Got it" onPress={acknowledgeSpeechNotice} />
        {skipLink}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {active ? (
        <View style={styles.recordingRow}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText} testID="speak-elapsed">
            {attempt.phase === "recording"
              ? `Recording ${formatElapsed(attempt.elapsedMs)}`
              : attempt.phase === "stopping"
                ? "Processing…"
                : "Preparing…"}
          </Text>
        </View>
      ) : null}
      {showPartials && active && attempt.lastPartialTranscript ? (
        <Text style={styles.partial} testID="speak-partial">
          {attempt.lastPartialTranscript}
        </Text>
      ) : null}

      {!answered || active ? (
        <Pressable
          onPress={attempt.phase === "recording" ? attempt.stop : onRecordPress}
          disabled={
            answered ||
            attempt.phase === "starting" ||
            attempt.phase === "stopping" ||
            (!active && outOfAttempts)
          }
          accessibilityRole="button"
          accessibilityLabel={
            attempt.phase === "recording" ? "Stop recording" : "Record your answer"
          }
          style={({ pressed }) => [
            styles.micButton,
            attempt.phase === "recording" && styles.micButtonRecording,
            (answered || (!active && outOfAttempts)) && styles.micButtonDisabled,
            pressed && { transform: [{ scale: 0.97 }] },
          ]}
          testID="speak-record"
        >
          <Ionicons
            name={attempt.phase === "recording" ? "stop" : "mic"}
            size={34}
            color="#fff"
          />
        </Pressable>
      ) : null}

      {budgetLeft !== null && !answered ? (
        <Text style={styles.muted} testID="speak-budget">
          {budgetLeft === 1 ? "1 recording attempt left" : `${budgetLeft} recording attempts left`}
        </Text>
      ) : null}

      {notice && !active && !answered ? (
        <Text style={styles.notice} testID="speak-notice">
          {notice.message}
          {notice.retryable && outOfAttempts ? " No attempts left." : ""}
        </Text>
      ) : null}

      {(showHeard || answered) && heardText && !active ? (
        <View style={styles.heardBox} testID="speak-heard">
          <Text style={styles.heardLabel}>I heard:</Text>
          <Text style={styles.heardText}>“{heardText}”</Text>
        </View>
      ) : null}
      {hint && !active && !answered ? <Text style={styles.hint}>{hint}</Text> : null}

      {attempt.recordingUri && !active ? (
        <Pressable
          onPress={onReplayPress}
          accessibilityRole="button"
          accessibilityLabel="Play back my recording"
          style={styles.replayRow}
          testID="speak-replay"
        >
          <Ionicons name="play-circle-outline" size={22} color={colors.skyDark} />
          <Text style={[styles.replayText, { color: colors.skyDark }]}>Play my recording</Text>
        </Pressable>
      ) : null}

      {skipLink}
    </View>
  );
}

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    wrap: { gap: 14, alignItems: "center" },
    micButton: {
      width: 84,
      height: 84,
      borderRadius: radius.full,
      backgroundColor: colors.sky,
      alignItems: "center",
      justifyContent: "center",
    },
    micButtonRecording: { backgroundColor: colors.rose },
    micButtonDisabled: { backgroundColor: colors.neutral300 },
    recordingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    recordingDot: {
      width: 12,
      height: 12,
      borderRadius: radius.full,
      backgroundColor: colors.rose,
    },
    recordingText: { fontSize: 16, fontWeight: "700", color: colors.text },
    partial: { fontSize: 16, color: colors.neutral400, fontStyle: "italic" },
    muted: { fontSize: 14, color: colors.neutral400, textAlign: "center" },
    rationale: { fontSize: 15, color: colors.neutral700, textAlign: "center" },
    notice: { fontSize: 15, fontWeight: "600", color: colors.neutral700, textAlign: "center" },
    heardBox: {
      alignSelf: "stretch",
      borderWidth: 2,
      borderColor: colors.neutral200,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      padding: 12,
      gap: 4,
    },
    heardLabel: { fontSize: 13, fontWeight: "700", color: colors.neutral400 },
    heardText: { fontSize: 18, fontWeight: "600", color: colors.text },
    hint: { fontSize: 15, fontWeight: "600", color: colors.neutral700 },
    replayRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    replayText: { fontSize: 15, fontWeight: "700" },
    skipLink: { paddingVertical: 6 },
    skipText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.neutral400,
      textDecorationLine: "underline",
    },
  })
);
