/**
 * Checkpoint route (Phase 6 §54, §109-113): a scored assessment session on
 * the shared session architecture. First-attempt scoring (no retries), no
 * FSRS/wordStats/mistakes mutation, zero XP — the outcome is the recorded
 * attempt plus a results screen with can-do wording.
 */

import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CheckpointResults } from "@/components/assessment/checkpoint-results";
import { DuoButton } from "@/components/duo-button";
import { SessionScreen } from "@/components/session/session-screen";
import { buildCheckpointAttempt } from "@/lib/assessment/checkpoint";
import { checkpointFor } from "@/lib/assessment/content";
import { buildCheckpointSessionDefinition } from "@/lib/session/sources";
import type { SessionDefinition } from "@/lib/session/types";
import { probeSpeechCapabilityOnce } from "@/lib/speech/use-speech-session";
import { makeThemedStyles } from "@/lib/theme";

export default function CheckpointScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const checkpoint = checkpointFor(id ?? "");

  const definition = useMemo<SessionDefinition | null>(
    () => (checkpoint ? buildCheckpointSessionDefinition(checkpoint) : null),
    [checkpoint]
  );

  // A SPOKEN checkpoint on a device that cannot do scored speech at all is
  // never started (P8 §20/§22): the honest outcome is "not administrable",
  // not a page of skipped items — and no attempt is recorded, so nothing
  // about the learner is ever inferred from a device limitation.
  // Permission states are NOT hard blocks: they resolve at point of use.
  const hasSpeech =
    checkpoint?.items.some(
      (item) =>
        item.exercise.type === "speakProduction" ||
        item.exercise.type === "speakRepetition"
    ) ?? false;
  const [speechGate, setSpeechGate] = useState<"probing" | "ok" | "blocked">(
    hasSpeech ? "probing" : "ok"
  );
  useEffect(() => {
    if (!hasSpeech) return;
    let live = true;
    void probeSpeechCapabilityOnce().then((capability) => {
      if (!live) return;
      const hardBlocked =
        !capability.available ||
        !capability.frenchRecognitionAvailable ||
        capability.platform === "web";
      setSpeechGate(hardBlocked ? "blocked" : "ok");
    });
    return () => {
      live = false;
    };
  }, [hasSpeech]);
  const styles = useGateStyles();

  if (!checkpoint || !definition) {
    // Unknown id: nothing to assess — back to the path.
    router.replace("/");
    return null;
  }

  if (speechGate !== "ok") {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          {speechGate === "probing" ? (
            <Text style={styles.title}>Checking speech recognition…</Text>
          ) : (
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
