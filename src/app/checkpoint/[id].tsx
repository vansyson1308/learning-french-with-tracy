/**
 * Checkpoint route (Phase 6 §54, §109-113): a scored assessment session on
 * the shared session architecture. First-attempt scoring (no retries), no
 * FSRS/wordStats/mistakes mutation, zero XP — the outcome is the recorded
 * attempt plus a results screen with can-do wording.
 */

import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";

import { CheckpointResults } from "@/components/assessment/checkpoint-results";
import { SessionScreen } from "@/components/session/session-screen";
import { buildCheckpointAttempt } from "@/lib/assessment/checkpoint";
import { checkpointFor } from "@/lib/assessment/content";
import { buildCheckpointSessionDefinition } from "@/lib/session/sources";
import type { SessionDefinition } from "@/lib/session/types";

export default function CheckpointScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const checkpoint = checkpointFor(id ?? "");

  const definition = useMemo<SessionDefinition | null>(
    () => (checkpoint ? buildCheckpointSessionDefinition(checkpoint) : null),
    [checkpoint]
  );

  if (!checkpoint || !definition) {
    // Unknown id: nothing to assess — back to the path.
    router.replace("/");
    return null;
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
