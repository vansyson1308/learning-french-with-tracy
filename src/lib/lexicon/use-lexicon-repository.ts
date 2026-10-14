/**
 * React hook over the repository provider: resolves the platform's best
 * LexiconRepository for the course (native SQLite when its lazy open
 * succeeds, otherwise the generated tier). `null` only during the brief
 * initial resolution.
 */

import { useEffect, useState } from "react";

import { getLexiconRepository, type LexiconTier } from "./provider";
import type { LexiconRepository } from "./types";

export function useLexiconRepository(
  courseId: string
): { repo: LexiconRepository; tier: LexiconTier } | null {
  const [state, setState] = useState<{ repo: LexiconRepository; tier: LexiconTier } | null>(null);
  useEffect(() => {
    let alive = true;
    getLexiconRepository(courseId).then((resolved) => {
      if (alive) setState(resolved);
    });
    return () => {
      alive = false;
    };
  }, [courseId]);
  return state;
}
