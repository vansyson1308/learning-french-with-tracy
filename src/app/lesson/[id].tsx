/**
 * Lesson route — a thin adapter since Phase 3. It resolves the route's
 * SessionSource into a SessionDefinition ONCE per session (from an
 * imperative store snapshot, preserving the Phase-0 freeze: grading writes
 * never rebuild the running queue) and renders the shared SessionScreen.
 * The session state-machine, evidence policy, completion policy and
 * per-exercise behavior all live in src/lib/session and the registry.
 */

import { Redirect, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";

import { SessionScreen } from "@/components/session/session-screen";
import { hasCapability, lessonRouteCapability } from "@/lib/course-profile";
import { useCourseContent } from "@/lib/content";
import { dayString } from "@/lib/dates";
import {
  buildConversationPracticeSessionDefinition,
  buildListeningReviewSessionDefinition,
  buildSpeakingReviewSessionDefinition,
  buildMistakesSessionDefinition,
  buildPathSessionDefinition,
  buildReviewSessionDefinition,
  buildWritingPracticeSessionDefinition,
} from "@/lib/session/sources";
import type { SessionDefinition } from "@/lib/session/types";
import { useProgress } from "@/lib/store";

/**
 * Course guard (P0): the magic ids srs-listening / srs-speaking /
 * writing-practice / conversation need their capabilities; a deep link while
 * another course is active goes home instead of grading evidence into a
 * course that has no such content.
 */
export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activeCourseId = useProgress((s) => s.activeCourseId);
  const needs = lessonRouteCapability(id ?? "");
  if (needs && !hasCapability(activeCourseId, needs)) return <Redirect href="/" />;
  return <LessonScreenBody id={id ?? ""} activeCourseId={activeCourseId} />;
}

function LessonScreenBody({ id, activeCourseId }: { id: string; activeCourseId: string }) {
  const { pack, getLesson, allWords } = useCourseContent(activeCourseId);

  const definition = useMemo<SessionDefinition>(() => {
    // Session content is frozen at entry: read the store imperatively so
    // writes made DURING the session don't rebuild this memo (Phase-0 fix).
    const state = useProgress.getState();
    const courseProgress = state.courses[state.activeCourseId] ?? {
      xp: 0,
      completedLessons: {},
      mistakes: [],
      wordStats: {},
      srs: {},
    };

    if (id === "mistakes") {
      return buildMistakesSessionDefinition({
        courseId: state.activeCourseId,
        mistakes: courseProgress.mistakes,
        getLesson,
      });
    }
    if (id === "srs") {
      return buildReviewSessionDefinition({
        courseId: state.activeCourseId,
        course: courseProgress,
        pool: allWords(),
      });
    }
    // Listening review (P7 §79-81): capability-gated surface over due listen
    // cards; the practice tab only offers it when the course has clips.
    if (id === "srs-listening") {
      return buildListeningReviewSessionDefinition({
        courseId: state.activeCourseId,
        course: courseProgress,
        pool: allWords(),
      });
    }
    // Speaking review (P8 §16): capability-gated surface over due speak cards.
    if (id === "srs-speaking") {
      return buildSpeakingReviewSessionDefinition({ courseId: state.activeCourseId, course: courseProgress });
    }
    // Writing practice (P9 §62): a short rotating set of taught writing
    // steps in learning mode — rubric feedback, model answers, no cards.
    if (id === "writing-practice") {
      return buildWritingPracticeSessionDefinition({
        courseId: state.activeCourseId,
        pack,
        seedKey: dayString(new Date()),
      });
    }
    // Conversation practice (P9 §63): one practice scenario per session,
    // rotating daily; reserved assessment scenarios can never appear.
    if (id === "conversation") {
      return buildConversationPracticeSessionDefinition({
        courseId: state.activeCourseId,
        seedKey: dayString(new Date()),
      });
    }
    const ref = getLesson(id);
    if (!ref) {
      return {
        kind: "path",
        courseId: state.activeCourseId,
        lessonId: "",
        steps: [],
        completion: "lesson",
        evidenceSource: "lesson",
        trackMistakes: false,
        allowUndo: false,
      };
    }
    const alreadyCompleted = !!courseProgress.completedLessons[ref.lesson.id];
    return buildPathSessionDefinition({
      courseId: state.activeCourseId,
      lesson: ref.lesson,
      alreadyCompleted,
      // Option order (P0): first sitting is seeded by the exercise alone; a
      // replay rotates by day so a repeated lesson is not a position memory.
      attempt: alreadyCompleted ? `replay:${dayString(new Date())}` : "first",
    });
    // Store data is intentionally read via getState (not subscribed) — only
    // a new route or course switch starts a new session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, activeCourseId]);

  return <SessionScreen definition={definition} targetLanguage={pack.targetLanguage} />;
}
