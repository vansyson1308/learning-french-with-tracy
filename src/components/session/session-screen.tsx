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
import { grammarNoteFor, panelItemIdFor, teachMetaFor } from "@/lib/session/panel";
import {
  currentStep,
  firstAttemptAccuracy as machineAccuracy,
  isPerfect,
  sessionProgress,
} from "@/lib/session/reducer";
import type { SessionDefinition } from "@/lib/session/types";
import { currentStreak, useProgress } from "@/lib/store";
import { makeThemedStyles, radius, useThemeColors } from "@/lib/theme";

export function SessionScreen({
  definition,
  targetLanguage,
  emptyMessage = "Nothing to practice yet!",
  buildTodayStats,
  renderFinished,
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
}) {
  const colors = useThemeColors();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const progress = useProgress();
  const controller = useSessionController(definition);
  const { state } = controller;

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
    const message =
      "Answers you already gave are saved. The session itself won't be counted as completed.";
    if (Platform.OS === "web") {
      // RN-web's Alert is a no-op; without this the close button would go dead.
      if (typeof window !== "undefined" && window.confirm(`Leave this session?\n\n${message}`)) {
        exitScreen();
      }
      return;
    }
    Alert.alert("Leave this session?", message, [
      { text: "Keep going", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: () => exitScreen() },
    ]);
  };

  if (definition.steps.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>{emptyMessage}</Text>
          <DuoButton label="Back" onPress={() => exitScreen()} />
        </View>
      </SafeAreaView>
    );
  }

  if (state.finished) {
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
  // Lexical feedback identity: exactly one stable French item or nothing.
  const answered = state.status === "correct" || state.status === "wrong";
  const panelItemId = answered && !minimalFeedback ? panelItemIdFor(definition, step) : null;

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
            accessibilityLabel={`Session progress ${Math.round(percentage)} percent`}
          >
            <Animated.View style={[styles.progressFill, progressBarStyle]}>
              <View style={styles.progressShine} />
            </Animated.View>
          </View>
          {isPractice ? (
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
            <TeachCard word={step.word} courseId={definition.courseId} meta={teachMetaFor(step)} />
          ) : step.type === "concept" ? (
            <ConceptCard conceptId={step.conceptId} />
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
              <Text style={[styles.feedback, { color: colors.text }]}>Answer recorded</Text>
            </Animated.View>
          )}
          {!minimalFeedback && state.status === "correct" && (
            <Animated.View entering={FadeInDown.duration(200)} style={styles.feedbackRow}>
              <Ionicons name="checkmark-circle" size={26} color={colors.correctText} />
              <Text style={[styles.feedback, { color: colors.correctText }]}>
                Nicely done!
              </Text>
              {controller.lastMutated && definition.allowUndo ? (
                <UndoLink onPress={controller.onUndo} color={colors.correctText} />
              ) : null}
            </Animated.View>
          )}
          {!minimalFeedback && state.status === "wrong" && exercise && (
            <Animated.View entering={FadeInDown.duration(200)}>
              <View style={styles.feedbackRow}>
                <Ionicons name="close-circle" size={26} color={colors.wrongText} />
                <Text style={[styles.feedback, { color: colors.wrongText }]}>
                  Correct answer:
                </Text>
                {controller.lastMutated && definition.allowUndo ? (
                  <UndoLink onPress={controller.onUndo} color={colors.wrongText} />
                ) : null}
              </View>
              <Text style={[styles.feedbackDetail, { color: colors.wrongText }]}>
                {behaviorFor(exercise).answerText(exercise)}
              </Text>
            </Animated.View>
          )}
          {panelItemId !== null ? (
            <PostAnswerPanel
              itemId={panelItemId}
              correct={state.status === "correct"}
              note={grammarNoteFor(step) ?? undefined}
            />
          ) : null}
          {step.type === "teach" || step.type === "concept" ? (
            <DuoButton label="Continue" onPress={controller.onTeachContinue} />
          ) : state.status === "idle" ? (
            <>
              <DuoButton
                label="Check"
                onPress={controller.onCheck}
                disabled={
                  selfAdvancing ||
                  !exercise ||
                  !behaviorFor(exercise).isReady(exercise, state.answer)
                }
              />
              {definition.kind === "placement" && !selfAdvancing ? (
                <DuoButton label="I don't know" variant="white" onPress={controller.onSkip} />
              ) : null}
            </>
          ) : (
            <DuoButton
              label="Continue"
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
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Undo this review"
      style={styles.undoLink}
    >
      <Ionicons name="arrow-undo" size={16} color={color} />
      <Text style={[styles.undoText, { color }]}>Undo</Text>
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
