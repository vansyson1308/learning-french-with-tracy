/**
 * Lesson route — a thin adapter since Phase 3. It resolves the route's
 * SessionSource into a SessionDefinition ONCE per session (from an
 * imperative store snapshot, preserving the Phase-0 freeze: grading writes
 * never rebuild the running queue) and renders the shared SessionScreen.
 * The session state-machine, evidence policy, completion policy and
 * per-exercise behavior all live in src/lib/session and the registry.
 */

import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";

import { SessionScreen } from "@/components/session/session-screen";
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

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activeCourseId = useProgress((s) => s.activeCourseId);
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
    // Listening review (P7 §79-81): French-only surface over due listen
    // cards; the practice tab only offers it for the French course.
    if (id === "srs-listening") {
      return buildListeningReviewSessionDefinition({
        course: courseProgress,
        pool: allWords(),
      });
    }
    // Speaking review (P8 §16): French-only surface over due speak cards.
    if (id === "srs-speaking") {
      return buildSpeakingReviewSessionDefinition({ course: courseProgress });
    }
    // Writing practice (P9 §62): a short rotating set of taught writing
    // steps in learning mode — rubric feedback, model answers, no cards.
    if (id === "writing-practice") {
      return buildWritingPracticeSessionDefinition({
        pack,
        seedKey: dayString(new Date()),
      });
    }
    // Conversation practice (P9 §63): one practice scenario per session,
    // rotating daily; reserved assessment scenarios can never appear.
    if (id === "conversation") {
      return buildConversationPracticeSessionDefinition({
        seedKey: dayString(new Date()),
      });
    }
    const ref = getLesson(id ?? "");
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
    return buildPathSessionDefinition({
      courseId: state.activeCourseId,
      lesson: ref.lesson,
      alreadyCompleted: !!courseProgress.completedLessons[ref.lesson.id],
    });
    // Store data is intentionally read via getState (not subscribed) — only
    // a new route or course switch starts a new session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, activeCourseId]);

  return <SessionScreen definition={definition} targetLanguage={pack.targetLanguage} />;
}
