/**
 * The ONE place attempt audio may live (P8 §8/§27): a dedicated cache
 * subdirectory, deleted file-by-file as soon as a step is done with its
 * recording and swept wholesale at session boundaries. Recording URIs are
 * ephemeral React state only — never Zustand, never AsyncStorage, never a
 * backup file (backups live under Paths.document; this stays under
 * Paths.cache, which the OS may clear and backups exclude).
 */

import { Directory, File, Paths } from "expo-file-system";

export const SPEECH_CACHE_SUBDIR = "speech-attempts";

export function speechCacheDirectory(): Directory {
  return new Directory(Paths.cache, SPEECH_CACHE_SUBDIR);
}

/**
 * Create the directory before a persisting attempt starts (the recognizer
 * writes into it and does not create parents). Failure degrades to
 * recognition without own-voice replay — never an attempt failure.
 */
export function ensureSpeechCacheDirectory(): Directory | null {
  try {
    const dir = speechCacheDirectory();
    dir.create({ intermediates: true, idempotent: true });
    return dir;
  } catch {
    return null;
  }
}

/** Best-effort removal of one finished attempt's audio (§8: delete after use). */
export function deleteRecording(uri: string | null | undefined): void {
  if (!uri) return;
  try {
    new File(uri).delete();
  } catch {
    // Already gone or still held by the OS — the boundary sweep retries.
  }
}

/**
 * Remove everything in the speech cache (session boundaries, app foreground
 * of a session-free app). Returns the number of entries removed; -1 when
 * the platform has no usable cache directory (web) — never throws.
 */
export function sweepSpeechCache(): number {
  try {
    const dir = speechCacheDirectory();
    if (!dir.exists) return 0;
    let removed = 0;
    for (const entry of dir.list()) {
      try {
        entry.delete();
        removed += 1;
      } catch {
        // Locked or vanished — leave it for the next sweep.
      }
    }
    return removed;
  } catch {
    return -1;
  }
}
