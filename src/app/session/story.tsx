/**
 * Word check after a graded story (P5b) — a thin adapter like the TODAY
 * route: compose the steps once from a state snapshot at entry and render
 * the shared SessionScreen. Evidence goes through the normal gate (source
 * "story"); completion records a practice session (activity only).
 */

import { Redirect, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";

import { SessionScreen } from "@/components/session/session-screen";
import { useCourseContent } from "@/lib/content";
import { courseProfile, hasCapability } from "@/lib/course-profile";
import { dayString } from "@/lib/dates";
import { useT } from "@/lib/i18n";
import { syllabusWords } from "@/lib/learning/daily-words";
import { lexemeMetaFor } from "@/lib/learning/lexicon-index";
import { listenWordClipIndex } from "@/lib/reception/content";
import type { SessionDefinition } from "@/lib/session/types";
import { storyFor } from "@/lib/stories/content";
import { composeStoryWordCheck } from "@/lib/stories/word-check";
import { useProgress } from "@/lib/store";

export default function StoryWordCheckRoute() {
  const { id, picked } = useLocalSearchParams<{ id?: string; picked?: string }>();
  const activeCourseId = useProgress((s) => s.activeCourseId);
  const { pack } = useCourseContent(activeCourseId);
  const { t, languageName } = useT();

  const definition = useMemo<SessionDefinition | null>(() => {
    // Frozen at entry: our own evidence never recomposes the check.
    const state = useProgress.getState();
    const courseId = state.activeCourseId;
    const story = typeof id === "string" ? storyFor(courseId, id) : undefined;
    if (!story) return null;
    const steps = composeStoryWordCheck({
      courseId,
      story,
      cards: state.courses[courseId]?.cards,
      picked: typeof picked === "string" && picked.length > 0 ? picked.split(",") : [],
      lookup: (lexemeId) => lexemeMetaFor(courseId, lexemeId),
      pool: syllabusWords(courseId),
      listenClips: listenWordClipIndex(courseId),
      day: dayString(new Date()),
    });
    return {
      kind: "story",
      courseId,
      lessonId: "story",
      steps,
      completion: "practice",
      evidenceSource: "story",
      trackMistakes: false,
      allowUndo: true,
    };
    // Snapshot semantics: only a fresh navigation composes a fresh check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, picked, activeCourseId]);

  if (!hasCapability(activeCourseId, "stories") || !definition) return <Redirect href="/" />;

  return (
    <SessionScreen
      definition={definition}
      targetLanguage={languageName(courseProfile(activeCourseId).targetCode, pack.targetLanguage)}
      emptyMessage={t("stories.allKnown")}
    />
  );
}
