/**
 * Web resolution of the native lexicon loader: expo-sqlite's web backend
 * needs wasm + SharedArrayBuffer (COOP/COEP), which this app deliberately
 * does not require — web always uses the generated repository. Metro picks
 * ./native-loader.native.ts on iOS/Android.
 */

import type { LexiconRepository } from "./types";

export async function loadNativeLexiconRepository(_targetCode: string): Promise<LexiconRepository | null> {
  return null;
}
