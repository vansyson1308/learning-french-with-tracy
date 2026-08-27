/**
 * Repository provider: the generated repository (compiled web-fallback
 * data) is ALWAYS available synchronously — it is the web tier and the
 * universal safety net. The native SQLite repository upgrades it lazily
 * on iOS/Android; if that fails for any reason, callers simply stay on
 * the generated tier and every feature keeps working.
 */

import frWebFallback from "../../content/lexicon/fr-web-fallback.json";
import {
  GeneratedLexiconRepository,
  type GeneratedLexiconData,
} from "./generated-repository";
import { loadNativeLexiconRepository } from "./native-loader";
import type { LexiconRepository } from "./types";

let generated: GeneratedLexiconRepository | null = null;

export function getGeneratedLexiconRepository(): GeneratedLexiconRepository {
  if (generated === null) {
    generated = new GeneratedLexiconRepository(frWebFallback as GeneratedLexiconData);
  }
  return generated;
}

export type LexiconTier = "native" | "generated";

let nativePromise: Promise<LexiconRepository | null> | null = null;

/**
 * Resolves the best repository for this platform: generated immediately;
 * native once its lazy open succeeds (memoized — the database opens at
 * most once per app session).
 */
export function getLexiconRepository(): Promise<{ repo: LexiconRepository; tier: LexiconTier }> {
  if (nativePromise === null) nativePromise = loadNativeLexiconRepository();
  return nativePromise.then((native) =>
    native !== null
      ? { repo: native, tier: "native" as const }
      : { repo: getGeneratedLexiconRepository(), tier: "generated" as const }
  );
}

/** Test hook: reset memoized state (bun/jest only). */
export function resetLexiconProviderForTests(): void {
  generated = null;
  nativePromise = null;
}
