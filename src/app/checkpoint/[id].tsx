/**
 * Checkpoint route (Phase 6 §54, §109-113): a scored assessment session on
 * the shared session architecture. First-attempt scoring (no retries), no
 * FSRS/wordStats/mistakes mutation, zero XP — the outcome is the recorded
 * attempt plus a results screen with can-do wording.
 */

import { Redirect, router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Linking, Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useT } from "@/lib/i18n";
import { CheckpointResults } from "@/components/assessment/checkpoint-results";
import { DuoButton } from "@/components/duo-button";
import { SessionScreen } from "@/components/session/session-screen";
import { buildCheckpointAttempt } from "@/lib/assessment/checkpoint";
import { checkpointFor } from "@/lib/assessment/content";
import { buildCheckpointSessionDefinition } from "@/lib/session/sources";
import type { SessionDefinition } from "@/lib/session/types";
import {
  networkDisclosureRequired,
  networkDisclosureText,
} from "@/lib/speech/step-policy";
import {
  probeSpeechCapabilityOnce,
  requestSpeechPermissionOnce,
} from "@/lib/speech/use-speech-session";
import { courseProfile, hasCapability } from "@/lib/course-profile";
import { assessmentFor, useProgress } from "@/lib/store";
import { makeThemedStyles } from "@/lib/theme";

/**
 * Course guard (P0): this surface exists only for courses that have the
 * capability; a deep link while another course is active goes home instead
 * of routing evidence to a course the content does not describe.
 */
export default function CheckpointScreen() {
  const activeCourseId = useProgress((s) => s.activeCourseId);
  if (!hasCapability(activeCourseId, "checkpoints")) return <Redirect href="/" />;
  return <CheckpointScreenBody courseId={activeCourseId} />;
}

function CheckpointScreenBody({ courseId }: { courseId: string }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, tm, languageName } = useT();
  const profile = courseProfile(courseId);
  const targetLanguage = languageName(profile.targetCode, profile.targetLanguage);
  const checkpoint = checkpointFor(courseId, id ?? "");

  // Parallel-form seed (P9 §38-§39): the prior attempt count is captured
  // ONCE at mount from a store snapshot — recording this sitting's attempt
  // at completion must never rebuild the definition mid-screen.
  const [priorAttemptCount] = useState(
    () =>
      assessmentFor(useProgress.getState(), useProgress.getState().activeCourseId)
        .checkpointAttempts.filter((a) => a.checkpointId === (id ?? ""))
        .length
  );
  const definition = useMemo<SessionDefinition | null>(
    () =>
      checkpoint ? buildCheckpointSessionDefinition(courseId, checkpoint, priorAttemptCount) : null,
    [courseId, checkpoint, priorAttemptCount]
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
        item.exercise.type === "speakRepetition" ||
        item.exercise.type === "interactionScenario"
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
      !capability.targetRecognitionAvailable ||
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
    void probeSpeechCapabilityOnce(profile.recognitionLocale).then((capability) => {
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
    void requestSpeechPermissionOnce(profile.recognitionLocale).then((capability) => {
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
            <Text style={styles.title}>{t("checkpoint.probing")}</Text>
          ) : speechGate === "blocked" ? (
            <>
              <Text style={styles.title}>{t("checkpoint.blockedTitle")}</Text>
              <Text style={styles.body} testID="checkpoint-speech-blocked">
                {t("checkpoint.blockedBody", { language: targetLanguage })}
              </Text>
              <DuoButton label={t("common.back")} onPress={() => router.back()} />
            </>
          ) : speechGate === "needsPermission" ? (
            <>
              <Text style={styles.title}>{t("checkpoint.permissionTitle")}</Text>
              <Text style={styles.body} testID="checkpoint-speech-permission">
                {t("checkpoint.permissionBody", { language: targetLanguage })}
              </Text>
              <DuoButton label={t("checkpoint.allowMicrophone")} onPress={requestPermission} />
              <DuoButton label={t("common.back")} variant="white" onPress={() => router.back()} />
            </>
          ) : speechGate === "permissionBlocked" ? (
            <>
              <Text style={styles.title}>{t("checkpoint.permissionBlockedTitle")}</Text>
              <Text style={styles.body} testID="checkpoint-speech-permission-blocked">
                {t("checkpoint.permissionBlockedBody")}
              </Text>
              {Platform.OS !== "web" ? (
                <DuoButton
                  label={t("checkpoint.openSettings")}
                  onPress={() => void Linking.openSettings()}
                />
              ) : null}
              <DuoButton label={t("common.back")} variant="white" onPress={() => router.back()} />
            </>
          ) : (
            <>
              <Text style={styles.title}>{t("checkpoint.beforeStart")}</Text>
              <Text style={styles.body} testID="checkpoint-speech-disclosure">
                {tm(networkDisclosureText(targetLanguage))}
              </Text>
              <DuoButton
                label={t("checkpoint.gotItStart")}
                onPress={() => {
                  acknowledgeSpeechNotice();
                  setDisclosureNeeded(false);
                }}
              />
              <DuoButton label={t("common.back")} variant="white" onPress={() => router.back()} />
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SessionScreen
      definition={definition}
      targetLanguage={targetLanguage}
      renderFinished={(controller) => (
        <CheckpointResults
          courseId={courseId}
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
