/**
 * TODAY session route (Phase 3) — a thin adapter like lesson/[id]: freeze a
 * plan from a state snapshot at entry, wrap it in a SessionDefinition, and
 * render the shared SessionScreen. Distinct route on purpose (§54): TODAY
 * is not another magic lesson id, and it runs outside the tab bar (§53).
 */

import { Redirect, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";

import { SessionScreen } from "@/components/session/session-screen";
import type { TodaySummaryStats } from "@/components/session/session-summary";
import { courseCapabilities } from "@/lib/capabilities";
import { useCourseContent } from "@/lib/content";
import { dueFrenchReviewQueue } from "@/lib/learning/engine";
import {
  composeTodayFromSnapshot,
  TODAY_PRESETS,
  type TodayPlan,
  type TodayPreset,
} from "@/lib/learning/today";
import { firstAttemptAccuracy } from "@/lib/session/reducer";
import type { SessionDefinition } from "@/lib/session/types";
import { useProgress, XP_PER_LESSON } from "@/lib/store";

function isPreset(value: unknown): value is TodayPreset {
  return typeof value === "string" && value in TODAY_PRESETS;
}

export default function TodaySessionRoute() {
  const { preset: presetParam } = useLocalSearchParams<{ preset?: string }>();
  const activeCourseId = useProgress((s) => s.activeCourseId);
  const { pack } = useCourseContent(activeCourseId);

  const { definition, plan } = useMemo<{
    definition: SessionDefinition;
    plan: TodayPlan;
  }>(() => {
    // Frozen at entry (§17/§56): the plan is composed once from a snapshot;
    // store writes during the session — including our own evidence — never
    // recompose it, and AppState changes don't touch this memo at all.
    const state = useProgress.getState();
    const course = state.courses[state.activeCourseId];
    const preset = isPreset(presetParam) ? presetParam : "regular";
    const plan = composeTodayFromSnapshot({
      pack,
      completedLessons: course?.completedLessons ?? {},
      cards: course?.cards,
      preset,
    });
    return {
      plan,
      definition: {
        kind: "today",
        courseId: state.activeCourseId,
        lessonId: "today",
        steps: plan.steps,
        completion: "today",
        evidenceSource: "today",
        trackMistakes: false,
        allowUndo: true,
      },
    };
    // Snapshot semantics: only a fresh navigation composes a fresh session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetParam, activeCourseId]);

  if (!courseCapabilities(activeCourseId).dailySession) {
    return <Redirect href="/" />;
  }

  return (
    <SessionScreen
      definition={definition}
      targetLanguage={pack.targetLanguage}
      emptyMessage="You're all caught up!"
      buildTodayStats={(controller): TodaySummaryStats => {
        const live = useProgress.getState().courses[definition.courseId];
        // Accuracy over designated assessments only (§64): mixed practice
        // and the finale game are reinforcement, not retrieval measurement.
        const assessmentStepIds = new Set(
          definition.steps
            .filter(
              (s) => s.type === "exercise" && s.evidence?.srsRole === "assessment"
            )
            .map((s) => s.stepId)
        );
        const firsts = Object.entries(controller.state.firstResults).filter(([id]) =>
          assessmentStepIds.has(id)
        );
        return {
          reviewsCompleted: plan.reviewCount,
          newWordsIntroduced: plan.newCount,
          firstAttemptAccuracy:
            firsts.length === 0
              ? firstAttemptAccuracy(controller.state)
              : firsts.filter(([, ok]) => ok).length / firsts.length,
          xpEarned: Math.min(controller.assessmentsCompleted, XP_PER_LESSON),
          remainingBacklog: dueFrenchReviewQueue(live?.cards).length,
        };
      }}
    />
  );
}
