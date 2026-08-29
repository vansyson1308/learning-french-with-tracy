/**
 * Placement diagnostic runner (§73-80, §115-120): stage sessions on the
 * shared session engine (minimal feedback, "I don't know", no retries),
 * stage 2 only when stage 1 came back all-comfortable, then the pure
 * deterministic engine turns answers into a recommended starting lesson.
 * Learning memory is mutated by NOTHING here (§78); accepting a result
 * stores it in assessment state only (§81-83).
 */
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";

import { PlacementResults } from "@/components/assessment/placement-results";
import { SessionScreen } from "@/components/session/session-screen";
import { placementContent, placementEnginePlan } from "@/lib/assessment/content";
import {
  answersFromSession,
  buildPlacementResult,
  recommendPlacement,
  shouldRunStage,
  type PlacementAnswers,
} from "@/lib/assessment/placement";
import { useCourseContent } from "@/lib/content";
import type { SessionController } from "@/lib/session/controller";
import type { SessionMachineState } from "@/lib/session/reducer";
import { buildPlacementStageSessionDefinition } from "@/lib/session/sources";
import { useProgress } from "@/lib/store";

/**
 * First-attempt answers for a finished stage: true/false, null for IDK,
 * audio_unavailable for skips on audio-dependent steps (P7 §110).
 */
function stageAnswers(state: SessionMachineState): PlacementAnswers {
  const exerciseSteps = state.steps.filter((s) => s.type === "exercise");
  return answersFromSession({
    stepIds: exerciseSteps.map((s) => s.stepId),
    firstResults: state.firstResults,
    skipped: state.skipped,
    audioStepIds: new Set(
      exerciseSteps
        .filter(
          (s) =>
            s.exercise.type === "listeningComprehension" || s.exercise.type === "dictation"
        )
        .map((s) => s.stepId)
    ),
  });
}

/**
 * Rendered by SessionScreen when a stage finishes; merges the stage's
 * answers upward exactly once (an effect, never during render).
 */
function StageBridge({
  controller,
  onStageDone,
}: {
  controller: SessionController;
  onStageDone: (answers: PlacementAnswers) => void;
}) {
  const { state } = controller;
  useEffect(() => {
    onStageDone(stageAnswers(state));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export default function PlacementRunScreen() {
  const plan = placementContent();
  const enginePlan = useMemo(() => placementEnginePlan(), []);
  const { getLesson } = useCourseContent("fr-en");
  const progress = useProgress();

  const [stageIndex, setStageIndex] = useState(0);
  const [answers, setAnswers] = useState<PlacementAnswers>({});
  const [finished, setFinished] = useState(false);

  const stage = plan.stages[stageIndex];
  const definition = useMemo(
    () => buildPlacementStageSessionDefinition(stage),
    [stage]
  );

  if (finished) {
    const recommendation = recommendPlacement(enginePlan, answers);
    const recommendedRef = getLesson(recommendation.recommendedLessonId);
    const recommendedFloorIndex = recommendedRef?.globalIndex ?? 0;
    const storeResult = (acceptedFloorIndex: number) => {
      progress.setPlacementResult(
        buildPlacementResult({
          plan: enginePlan,
          answers,
          recommendedFloorIndex,
          completedAt: Date.now(),
        }),
        acceptedFloorIndex
      );
      router.replace("/");
    };
    return (
      <PlacementResults
        recommendation={recommendation}
        recommendedRef={recommendedRef}
        onStartHere={() => storeResult(recommendedFloorIndex)}
        onStartFromBeginning={() => storeResult(0)}
      />
    );
  }

  return (
    <SessionScreen
      definition={definition}
      targetLanguage="French"
      renderFinished={(controller) => (
        <StageBridge
          key={stage.id}
          controller={controller}
          onStageDone={(stageResult) => {
            const merged = { ...answers, ...stageResult };
            setAnswers(merged);
            const next = stageIndex + 1;
            if (next < plan.stages.length && shouldRunStage(enginePlan, next, merged)) {
              setStageIndex(next);
            } else {
              setFinished(true);
            }
          }}
        />
      )}
    />
  );
}
