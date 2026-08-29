/**
 * Checkpoint route (Phase 6 §54, §109-113): a scored assessment session on
 * the shared session architecture. First-attempt scoring (no retries), no
 * FSRS/wordStats/mistakes mutation, zero XP — the outcome is the recorded
 * attempt plus a results screen with can-do wording.
 */

import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Linking, Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CheckpointResults } from "@/components/assessment/checkpoint-results";
import { DuoButton } from "@/components/duo-button";
import { SessionScreen } from "@/components/session/session-screen";
import { buildCheckpointAttempt } from "@/lib/assessment/checkpoint";
import { checkpointFor } from "@/lib/assessment/content";
import { buildCheckpointSessionDefinition } from "@/lib/session/sources";
import type { SessionDefinition } from "@/lib/session/types";
import {
  NETWORK_DISCLOSURE_TEXT,
  networkDisclosureRequired,
} from "@/lib/speech/step-policy";
import {
  probeSpeechCapabilityOnce,
  requestSpeechPermissionOnce,
} from "@/lib/speech/use-speech-session";
import { useProgress } from "@/lib/store";
import { makeThemedStyles } from "@/lib/theme";

export default function CheckpointScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const checkpoint = checkpointFor(id ?? "");

  const definition = useMemo<SessionDefinition | null>(
    () => (checkpoint ? buildCheckpointSessionDefinition(checkpoint) : null),
    [checkpoint]
  );

  // Speech preflight (P8 §20/§22 + P9 §8): a SPOKEN checkpoint is never
  // STARTED unless this device can actually administer it. Capability gaps
  // (no recognizer / no French / web) are hard blocks; permission is
  // resolved HERE, before any scored session exists — starting the check is
  // the point of use, so the preflight explains the microphone requirement
  // and may request. If permission stays blocked, no attempt is created and
  // nothing about the learner is ever inferred from a device state.
  const hasSpeech =
    checkpoint?.items.some(
      (item) =>
        item.exercise.type === "speakProduction" ||
        item.exercise.type === "speakRepetition"
    ) ?? false;
  const [speechGate, setSpeechGate] = useState<
    "probing" | "ok" | "blocked" | "needsPermission" | "permissionBlocked"
  >(hasSpeech ? "probing" : "ok");
  const speechNoticeAckAt = useProgress((s) => s.speechNoticeAckAt ?? null);
  const acknowledgeSpeechNotice = useProgress((s) => s.acknowledgeSpeechNotice);
  const [disclosureNeeded, setDisclosureNeeded] = useState(false);

  const gateFromCapability = (
    capability: Awaited<ReturnType<typeof probeSpeechCapabilityOnce>>
  ) => {
    if (
      !capability.available ||
      !capability.frenchRecognitionAvailable ||
      capability.platform === "web"
    ) {
      return "blocked" as const;
    }
    const mic = capability.microphonePermission;
    const speech = capability.speechPermission;
    if (mic === "granted" && speech === "granted") return "ok" as const;
    if (mic === "undetermined" || speech === "undetermined") {
      return "needsPermission" as const;
    }
    return "permissionBlocked" as const;
  };

  useEffect(() => {
    if (!hasSpeech) return;
    let live = true;
    void probeSpeechCapabilityOnce().then((capability) => {
      if (!live) return;
      setDisclosureNeeded(
        networkDisclosureRequired(capability, speechNoticeAckAt !== null)
      );
      setSpeechGate(gateFromCapability(capability));
    });
    return () => {
      live = false;
    };
    // speechNoticeAckAt is read once at mount on purpose: acknowledging on
    // this screen clears disclosureNeeded directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSpeech]);

  const requestPermission = () => {
    void requestSpeechPermissionOnce().then((capability) => {
      setSpeechGate(gateFromCapability(capability));
    });
  };
  const styles = useGateStyles();

  if (!checkpoint || !definition) {
    // Unknown id: nothing to assess — back to the path.
    router.replace("/");
    return null;
  }

  if (speechGate !== "ok" || disclosureNeeded) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          {speechGate === "probing" ? (
            <Text style={styles.title}>Checking speech recognition…</Text>
          ) : speechGate === "blocked" ? (
            <>
              <Text style={styles.title}>This check needs speech recognition</Text>
              <Text style={styles.body} testID="checkpoint-speech-blocked">
                It asks you to SAY French out loud, and this device can&apos;t do
                scored speech recognition in French. Nothing is recorded against
                you — the section simply stays unchecked until you can take it
                on a capable device.
              </Text>
              <DuoButton label="Back" onPress={() => router.back()} />
            </>
          ) : speechGate === "needsPermission" ? (
            <>
              <Text style={styles.title}>This check uses your microphone</Text>
              <Text style={styles.body} testID="checkpoint-speech-permission">
                Every task asks you to say French out loud, so the app needs
                microphone and speech-recognition permission before it starts.
                Nothing records until you tap the record button on each task.
              </Text>
              <DuoButton label="Allow microphone" onPress={requestPermission} />
              <DuoButton label="Back" variant="white" onPress={() => router.back()} />
            </>
          ) : speechGate === "permissionBlocked" ? (
            <>
              <Text style={styles.title}>Microphone permission is off</Text>
              <Text style={styles.body} testID="checkpoint-speech-permission-blocked">
                This check can&apos;t run without the microphone. Enable
                microphone and speech recognition in Settings, then come back —
                nothing has been recorded against you.
              </Text>
              {Platform.OS !== "web" ? (
                <DuoButton
                  label="Open Settings"
                  onPress={() => void Linking.openSettings()}
                />
              ) : null}
              <DuoButton label="Back" variant="white" onPress={() => router.back()} />
            </>
          ) : (
            <>
              <Text style={styles.title}>Before you start</Text>
              <Text style={styles.body} testID="checkpoint-speech-disclosure">
                {NETWORK_DISCLOSURE_TEXT}
              </Text>
              <DuoButton
                label="Got it — start the check"
                onPress={() => {
                  acknowledgeSpeechNotice();
                  setDisclosureNeeded(false);
                }}
              />
              <DuoButton label="Back" variant="white" onPress={() => router.back()} />
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SessionScreen
      definition={definition}
      targetLanguage="French"
      renderFinished={(controller) => (
        <CheckpointResults
          checkpointTitle={checkpoint.title}
          attempt={buildCheckpointAttempt({
            plan: definition.assessment!,
            firstResults: controller.state.firstResults,
            startedAt: 0,
            completedAt: 0,
          })}
          onDone={() => router.back()}
        />
      )}
    />
  );
}

const useGateStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      gap: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.neutral700,
      textAlign: "center",
    },
    body: { fontSize: 15, color: colors.textMuted, textAlign: "center", lineHeight: 22 },
  })
);
