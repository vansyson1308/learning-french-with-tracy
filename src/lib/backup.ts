/**
 * Progress backup I/O shell. All parsing/validation/migration logic lives in
 * persistence/backup-core.ts (pure, unit-tested); this file only moves bytes
 * and commits.
 *
 * Import is transaction-safe: the staged state is fully validated before
 * anything is written, an automatic safety copy of the current progress is
 * saved first, the commit is a single AsyncStorage write, and the result is
 * read back and verified — any failure before commit leaves current state
 * untouched, and a failed verification restores the safety copy.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import {
  createEnvelope,
  stageImport,
  type StagedImport,
} from "./persistence/backup-core";
import {
  PERSIST_VERSION,
  type PersistedProgress,
} from "./persistence/migrations";
import { PROGRESS_STORAGE_KEY, useProgress } from "./store";

export type BackupOutcome = { ok: true } | { ok: false; reason: string };

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** The data half of the store (what zustand persists — no functions). */
function snapshotFromStore(): PersistedProgress {
  const s = useProgress.getState();
  return {
    activeCourseId: s.activeCourseId,
    streak: s.streak,
    lastActiveDay: s.lastActiveDay,
    dailyGoal: s.dailyGoal,
    dailyXp: s.dailyXp,
    dailyXpDay: s.dailyXpDay,
    onboardingDone: s.onboardingDone,
    themePreference: s.themePreference,
    courses: s.courses,
    activeDays: s.activeDays,
  };
}

function parsePersistedRaw(raw: string | null): {
  state: PersistedProgress;
  version: number;
} {
  if (raw) {
    const parsed = JSON.parse(raw) as { state?: unknown; version?: unknown };
    if (parsed && typeof parsed === "object" && parsed.state) {
      return {
        state: parsed.state as PersistedProgress,
        version: typeof parsed.version === "number" ? parsed.version : 0,
      };
    }
  }
  return { state: snapshotFromStore(), version: PERSIST_VERSION };
}

function writeFile(dir: typeof Paths.cache, name: string, content: string): File {
  const file = new File(dir, name);
  try {
    file.create({ intermediates: true, overwrite: true });
  } catch {
    // Some platforms create on write; ignore and let write() surface errors.
  }
  file.write(content);
  return file;
}

/** Share the current progress as a JSON backup file. */
export async function exportProgress(now = new Date()): Promise<BackupOutcome> {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
    const { state, version } = parsePersistedRaw(raw);
    const envelope = createEnvelope(state, version, now);
    const name = `lingo-progress-${now.toISOString().slice(0, 10)}.json`;
    const file = writeFile(Paths.cache, name, JSON.stringify(envelope));
    if (!(await Sharing.isAvailableAsync())) {
      return { ok: false, reason: "Sharing isn't available on this device." };
    }
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/json",
      dialogTitle: "Export progress",
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: errorMessage(e) };
  }
}

export type PickResult =
  | { kind: "canceled" }
  | { kind: "error"; reason: string }
  | { kind: "ok"; raw: string };

/** Open the system picker and read the chosen backup file. */
export async function pickBackupFile(): Promise<PickResult> {
  try {
    const picked = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (picked.canceled) return { kind: "canceled" };
    const uri = picked.assets?.[0]?.uri;
    if (!uri) return { kind: "error", reason: "No file was selected." };
    const raw = await new File(uri).text();
    return { kind: "ok", raw };
  } catch (e) {
    return { kind: "error", reason: errorMessage(e) };
  }
}

/** Validate + migrate a backup into a committable state. Never mutates. */
export function prepareImport(raw: string, now = new Date()): StagedImport {
  return stageImport(raw, now);
}

/**
 * Commit a staged import. Order matters: safety copy → atomic write →
 * rehydrate → read-back verify (restoring the safety copy if that fails).
 */
export async function commitImport(
  state: PersistedProgress,
  now = new Date()
): Promise<BackupOutcome> {
  let previousRaw: string | null = null;
  try {
    previousRaw = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);

    // Automatic pre-import safety copy of the CURRENT progress (documents
    // directory, so it survives cache cleanup and can be re-imported).
    if (previousRaw) {
      const { state: prevState, version } = parsePersistedRaw(previousRaw);
      const stamp = now.toISOString().replace(/[:.]/g, "-");
      writeFile(
        Paths.document,
        `progress-before-import-${stamp}.json`,
        JSON.stringify(createEnvelope(prevState, version, now))
      );
    }

    const newRaw = JSON.stringify({ state, version: PERSIST_VERSION });
    await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, newRaw);
    await useProgress.persist.rehydrate();

    // Read-back verification.
    const readBack = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
    const live = useProgress.getState();
    const verified =
      readBack === newRaw &&
      live.activeCourseId === state.activeCourseId &&
      live.streak === state.streak &&
      Object.keys(live.courses).length === Object.keys(state.courses).length;
    if (!verified) {
      if (previousRaw) {
        await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, previousRaw);
        await useProgress.persist.rehydrate();
      }
      return {
        ok: false,
        reason: "Import verification failed — your previous progress was restored.",
      };
    }
    return { ok: true };
  } catch (e) {
    // Best-effort restore; anything before the setItem left state untouched.
    try {
      if (previousRaw) {
        await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, previousRaw);
        await useProgress.persist.rehydrate();
      }
    } catch {
      // Keep the original error as the reason.
    }
    return { ok: false, reason: errorMessage(e) };
  }
}
