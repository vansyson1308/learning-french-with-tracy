/**
 * React hook over the repository provider: resolves the platform's best
 * LexiconRepository (native SQLite when its lazy open succeeds, otherwise
 * the generated tier). `null` only during the brief initial resolution.
 */

import { useEffect, useState } from "react";

import { getLexiconRepository, type LexiconTier } from "./provider";
import type { LexiconRepository } from "./types";

export function useLexiconRepository(): { repo: LexiconRepository; tier: LexiconTier } | null {
  const [state, setState] = useState<{ repo: LexiconRepository; tier: LexiconTier } | null>(null);
  useEffect(() => {
    let alive = true;
    getLexiconRepository().then((resolved) => {
      if (alive) setState(resolved);
    });
    return () => {
      alive = false;
    };
  }, []);
  return state;
}
