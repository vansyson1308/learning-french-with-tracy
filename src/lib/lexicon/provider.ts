/**
 * Repository provider, per course (P1b): the generated repository
 * (compiled web-fallback data of the course's target language) is ALWAYS
 * available synchronously — it is the web tier and the universal safety
 * net. The native SQLite repository upgrades it lazily on iOS/Android; if
 * that fails for any reason, callers simply stay on the generated tier and
 * every feature keeps working. One database per TARGET language (D-4): two
 * courses that share a language share the repository.
 */

import { artifactsFor } from "../content-registry";
import { courseProfile } from "../course-profile";

import {
  GeneratedLexiconRepository,
  type GeneratedLexiconData,
} from "./generated-repository";
import { loadNativeLexiconRepository } from "./native-loader";
import type { LexiconRepository } from "./types";

const EMPTY_DATA: GeneratedLexiconData = { contentHash: "", entries: [] };

const generated = new Map<string, GeneratedLexiconRepository>();

/** Memo key: the course's lexicon artifact identity — one repository per (target, native) (P2b). */
function lexiconKey(courseId: string): string {
  const profile = courseProfile(courseId);
  const db = profile.artifacts.lexiconDb ?? profile.artifacts.lexiconFallback ?? profile.targetCode;
  return db;
}

export function getGeneratedLexiconRepository(courseId: string): GeneratedLexiconRepository {
  const key = lexiconKey(courseId);
  const hit = generated.get(key);
  if (hit) return hit;
  const data = (artifactsFor(courseId).lexiconFallback as GeneratedLexiconData | undefined) ?? EMPTY_DATA;
  const repo = new GeneratedLexiconRepository(data);
  generated.set(key, repo);
  return repo;
}

export type LexiconTier = "native" | "generated";

const nativePromises = new Map<string, Promise<LexiconRepository | null>>();

/**
 * Resolves the best repository for this platform and course: generated
 * immediately; native once its lazy open succeeds (memoized per language —
 * a database opens at most once per app session).
 */
export function getLexiconRepository(
  courseId: string
): Promise<{ repo: LexiconRepository; tier: LexiconTier }> {
  const { targetCode: code, nativeCode, artifacts } = courseProfile(courseId);
  const key = lexiconKey(courseId);
  let pending = nativePromises.get(key);
  if (!pending) {
    // The database asset is keyed by the target code (primary native language) or the course id.
    const assetKey = artifacts.lexiconDb?.includes(`/${courseId}-lexicon-`) ? courseId : code;
    pending = loadNativeLexiconRepository(code, nativeCode, assetKey);
    nativePromises.set(key, pending);
  }
  return pending.then((native) =>
    native !== null
      ? { repo: native, tier: "native" as const }
      : { repo: getGeneratedLexiconRepository(courseId), tier: "generated" as const }
  );
}

/** Test hook: reset memoized state (bun/jest only). */
export function resetLexiconProviderForTests(): void {
  generated.clear();
  nativePromises.clear();
}
