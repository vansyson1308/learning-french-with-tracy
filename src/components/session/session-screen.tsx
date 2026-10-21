/**
 * Shared session screen (Phase 3): renders any SessionDefinition — PATH
 * lesson, replay, SRS review, mistakes, TODAY — on top of the pure session
 * machine via useSessionController. Routes are thin adapters that resolve a
 * definition and hand it here.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { CloseButton } from "@/components/close-button";
import { DuoButton } from "@/components/duo-button";
import { ConceptCard } from "@/components/session/concept-card";
import { ExerciseRenderer } from "@/components/session/exercise-renderer";
import { PostAnswerPanel } from "@/components/session/post-answer-panel";
import { SessionSummary, type TodaySummaryStats } from "@/components/session/session-summary";
import { TeachCard } from "@/components/session/teach-card";
import { behaviorFor } from "@/lib/exercise-registry";
import { exitScreen } from "@/lib/navigation";
import { useSessionController, type SessionController } from "@/lib/session/controller";
import { courseProfile } from "@/lib/course-profile";
import { useT } from "@/lib/i18n";
import { grammarNoteFor, panelItemIdFor, teachMetaFor } from "@/lib/session/panel";
import {
  currentStep,
  firstAttemptAccuracy as machineAccuracy,
  isPerfect,
  sessionProgress,
} from "@/lib/session/reducer";
import type { SessionDefinition } from "@/lib/session/types";
import { useSpeechSession } from "@/lib/speech/use-speech-session";
import { currentStreak, useProgress } from "@/lib/store";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

/** mm:ss left on an exam section clock. */
function clockText(endsAt: number, now: number): string {
  const s = Math.max(0, Math.ceil((endsAt - now) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function SessionScreen({
  definition,
  targetLanguage,
  emptyMessage,
  buildTodayStats,
  renderFinished,
  countdown,
}: {
  definition: SessionDefinition;
  targetLanguage: string;
  emptyMessage?: string;
  /** TODAY passes this to compute honest summary stats at finish time. */
  buildTodayStats?: (controller: SessionController) => TodaySummaryStats;
  /**
   * Scored assessments (checkpoint/placement) replace the generic summary
   * with their own results screen (§112, §118).
   */
  renderFinished?: (controller: SessionController) => React.ReactElement | null;
  /**
   * P3d timed exam sections: a visible clock; at `endsAt` the route takes
   * the controller's first-attempt results (unanswered items stay
   * unanswered) and moves on. Called at most once.
   */
  countdown?: { endsAt: number; onExpire: (controller: SessionController) => void };
}) {
  const colors = useThemeColors();
  const styles = useStyles();
  const { t, tm } = useT();
  const insets = useSafeAreaInsets();
  const progress = useProgress();
  const controller = useSessionController(definition);
  const { state } = controller;

  // One recognizer per session, created only when speak steps exist; its
  // teardown sweeps the speech cache (P8 §8 boundary).
  const hasSpeechSteps = React.useMemo(
    () =>
      definition.steps.some(
        (planned) =>
          planned.type === "exercise" &&
          (planned.exercise.type === "speakRepetition" ||
            planned.exercise.type === "speakProduction" ||
            planned.exercise.type === "interactionScenario")
      ),
    [definition.steps]
  );
  const speechSession = useSpeechSession(hasSpeechSteps, courseProfile(definition.courseId).recognitionLocale);

  const [now, setNow] = React.useState(() => Date.now());
  const expiredRef = React.useRef(false);
  React.useEffect(() => {
    if (!countdown || state.finished) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [countdown, state.finished]);
  React.useEffect(() => {
    if (!countdown || state.finished || expiredRef.current || now < countdown.endsAt) return;
    expiredRef.current = true;
    countdown.onExpire(controller);
  }, [countdown, now, state.finished, controller]);

  const step = currentStep(state);
  const percentage = sessionProgress(state) * 100;
  const progressBar = useSharedValue(0);
  React.useEffect(() => {
    progressBar.set(withSpring(percentage, { damping: 20, stiffness: 160 }));
  }, [percentage, progressBar]);
  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressBar.get()}%`,
  }));

  const isPractice = definition.completion !== "lesson";
  // Confirm abandon only when a TODAY session actually has progress (§55).
  const confirmClose =
    definition.kind === "today" && state.completedCount > 0 && !state.finished;
  const onClose = () => {
    if (!confirmClose) {
      exitScreen();
      return;
    }
    const message = t("session.leaveBody");
    if (Platform.OS === "web") {
      // RN-web's Alert is a no-op; without this the close button would go dead.
      if (typeof window !== "undefined" && window.confirm(`${t("session.leaveTitle")}\n\n${message}`)) {
        exitScreen();
      }
      return;
    }
    Alert.alert(t("session.leaveTitle"), message, [
      { text: t("session.keepGoing"), style: "cancel" },
      { text: t("session.leave"), style: "destructive", onPress: () => exitScreen() },
    ]);
  };

  if (definition.steps.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>{emptyMessage ?? t("session.nothingYet")}</Text>
          <DuoButton label={t("common.back")} onPress={() => exitScreen()} testID="session-back" />
        </View>
      </SafeAreaView>
    );
  }

  if (state.finished) {
    // A definition swap mid-mount (placement stage 2) leaves one frame where
    // the OLD machine's finished state renders under the NEW definition
    // before the controller's start effect resets the machine. "Finished" is
    // only real when the machine is running THIS definition's frozen plan —
    // otherwise render nothing for that frame.
    if (state.steps !== definition.steps) {
      return <SafeAreaView style={styles.screen} />;
    }
    const custom = renderFinished?.(controller);
    if (custom) return custom;
    return (
      <SessionSummary
        kind={definition.kind}
        correctCount={state.completedCount}
        perfect={isPerfect(state)}
        streak={currentStreak(progress)}
        todayStats={buildTodayStats?.(controller)}
        onDone={() => exitScreen()}
      />
    );
  }

  if (!step) return <SafeAreaView style={styles.screen} />;

  const exercise = step.type === "exercise" ? step.exercise : null;
  const selfAdvancing = exercise ? behaviorFor(exercise).selfAdvancing : false;
  // Minimal feedback (§118): a diagnostic acknowledges the answer without
  // revealing it — no correct-answer line, no teaching panel, no verdict.
  const minimalFeedback = definition.feedbackPolicy === "minimal";
  // Lexical feedback identity: exactly one stable item of the course or nothing.
  const answered = state.status === "correct" || state.status === "wrong";
  const panelItemId = answered && !minimalFeedback ? panelItemIdFor(definition, step) : null;
  const grammarNote = grammarNoteFor(step);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <CloseButton onPress={onClose} />
          <View
            style={styles.progressTrack}
            accessibilityLabel={t("session.progressLabel", { percent: Math.round(percentage) })}
          >
            <Animated.View style={[styles.progressFill, progressBarStyle]}>
              <View style={styles.progressShine} />
            </Animated.View>
          </View>
          {countdown ? (
            <Text style={styles.clock} testID="session-countdown" accessibilityLabel={t("exam.clockLabel", { time: clockText(countdown.endsAt, now) })}>
              {clockText(countdown.endsAt, now)}
            </Text>
          ) : isPractice ? (
            <View style={styles.practicePill}>
              <Ionicons name="infinite" size={24} color={colors.skyDark} />
            </View>
          ) : null}
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          {step.type === "teach" ? (
            <TeachCard word={step.word} courseId={definition.courseId} meta={teachMetaFor(definition.courseId, step)} />
          ) : step.type === "concept" ? (
            <ConceptCard courseId={definition.courseId} conceptId={step.conceptId} />
          ) : (
            <ExerciseRenderer
              exercise={step.exercise}
              answer={state.answer}
              status={state.status === "idle" ? "none" : state.status}
              courseId={definition.courseId}
              targetLanguage={targetLanguage}
              onAnswer={controller.onAnswer}
              onMatchComplete={controller.onMatchComplete}
              onMatchWordResult={controller.onMatchWordResult}
              reception={{
                scored:
                  definition.kind === "checkpoint" || definition.kind === "placement",
                // NEVER reveal transcripts in a scored session — several
                // items can probe the SAME clip, and a revealed transcript
                // with the verdict beside it would turn every later item on
                // that clip into a read-the-answer question (P7 §67, §102).
                revealTranscript:
                  definition.kind !== "checkpoint" &&
                  definition.kind !== "placement" &&
                  definition.feedbackPolicy !== "minimal",
                onAudioSkip: controller.onSkip,
              }}
              speech={
                hasSpeechSteps
                  ? {
                      scored:
                        definition.kind === "checkpoint" ||
                        definition.kind === "placement",
                      session: speechSession,
                      onSpeechSkip: controller.onSkip,
                    }
                  : undefined
              }
              writing={{
                scored:
                  definition.kind === "checkpoint" || definition.kind === "placement",
              }}
            />
          )}
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom + 8, 24) },
            !minimalFeedback && state.status === "correct" && { backgroundColor: colors.correctBg },
            !minimalFeedback && state.status === "wrong" && { backgroundColor: colors.wrongBg },
          ]}
        >
          {minimalFeedback && answered && (
            <Animated.View entering={FadeInDown.duration(200)} style={styles.feedbackRow}>
              <Ionicons name="checkmark-done" size={26} color={colors.skyDark} />
              <Text style={[styles.feedback, { color: colors.text }]}>{t("session.answerRecorded")}</Text>
            </Animated.View>
          )}
          {!minimalFeedback && state.status === "correct" && (
            <Animated.View entering={FadeInDown.duration(200)} style={styles.feedbackRow}>
              <Ionicons name="checkmark-circle" size={26} color={colors.correctText} />
              <Text style={[styles.feedback, { color: colors.correctText }]} testID="session-feedback">{t("session.nicelyDone")}</Text>
              {controller.lastMutated && definition.allowUndo ? (
                <UndoLink onPress={controller.onUndo} color={colors.correctText} />
              ) : null}
            </Animated.View>
          )}
          {!minimalFeedback && state.status === "wrong" && exercise && (
            <Animated.View entering={FadeInDown.duration(200)}>
              <View style={styles.feedbackRow}>
                <Ionicons name="close-circle" size={26} color={colors.wrongText} />
                <Text style={[styles.feedback, { color: colors.wrongText }]} testID="session-feedback">
                  {/* An interaction has no single correct sentence to show. */}
                  {behaviorFor(exercise).answerText(exercise) ? t("session.correctAnswer") : t("session.notQuite")}
                </Text>
                {controller.lastMutated && definition.allowUndo ? (
                  <UndoLink onPress={controller.onUndo} color={colors.wrongText} />
                ) : null}
              </View>
              {behaviorFor(exercise).answerText(exercise) ? (
                <Text style={[styles.feedbackDetail, { color: colors.wrongText }]}>
                  {behaviorFor(exercise).answerText(exercise)}
                </Text>
              ) : null}
            </Animated.View>
          )}
          {panelItemId !== null ? (
            <PostAnswerPanel
              courseId={definition.courseId}
              itemId={panelItemId}
              correct={state.status === "correct"}
              note={grammarNote ? tm(grammarNote) : undefined}
            />
          ) : null}
          {step.type === "teach" || step.type === "concept" ? (
            <DuoButton label={t("common.continue")} onPress={controller.onTeachContinue} testID="session-continue" />
          ) : state.status === "idle" ? (
            <>
              <DuoButton
                label={t("common.check")}
                onPress={controller.onCheck}
                testID="session-check"
                disabled={
                  selfAdvancing ||
                  !exercise ||
                  !behaviorFor(exercise).isReady(exercise, state.answer)
                }
              />
              {definition.kind === "placement" && !selfAdvancing ? (
                <DuoButton label={t("session.idk")} variant="white" onPress={controller.onSkip} testID="session-idk" />
              ) : null}
            </>
          ) : (
            <DuoButton
              label={t("common.continue")}
              testID="session-continue"
              variant={
                minimalFeedback ? "secondary" : state.status === "wrong" ? "danger" : "secondary"
              }
              onPress={controller.onContinue}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Modest undo affordance — shown only after an FSRS scheduler write. */
function UndoLink({ onPress, color }: { onPress: () => void; color: string }) {
  const styles = useStyles();
  const { t } = useT();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={t("session.undoLabel")}
      style={styles.undoLink}
    >
      <Ionicons name="arrow-undo" size={16} color={color} />
      <Text style={[styles.undoText, { color }]}>{t("session.undo")}</Text>
    </Pressable>
  );
}

export { machineAccuracy as sessionFirstAttemptAccuracy };

const useStyles = makeThemedStyles((colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    progressTrack: {
      flex: 1,
      height: 14,
      borderRadius: radius.full,
      backgroundColor: colors.neutral200,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: radius.full,
      backgroundColor: colors.greenLight,
      justifyContent: "center",
    },
    progressShine: {
      height: 4,
      marginHorizontal: 8,
      borderRadius: radius.full,
      backgroundColor: "rgba(255,255,255,0.35)",
    },
    clock: { fontSize: 16, fontWeight: "800", color: colors.skyDark, minWidth: 52, textAlign: "right" },
    practicePill: {
      flexDirection: "row",
      alignItems: "center",
      minWidth: 44,
      height: 44,
      justifyContent: "center",
    },
    body: { padding: 20, paddingBottom: 40 },
    footer: {
      padding: 16,
      gap: 12,
      borderTopWidth: 2,
      borderTopColor: colors.neutral200,
    },
    feedbackRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    feedback: { fontSize: 20, fontWeight: "800" },
    feedbackDetail: { fontSize: 16, fontWeight: "600", marginTop: 2, marginLeft: 34 },
    undoLink: {
      marginLeft: "auto",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    undoText: { fontSize: 14, fontWeight: "700" },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      gap: 18,
    },
    emptyTitle: {
      fontSize: 26,
      fontWeight: "800",
      color: colors.neutral700,
      textAlign: "center",
    },
  })
);
