/**
 * Progress backup I/O shell. All parsing/validation/migration logic lives in
 * persistence/backup-core.ts (pure, unit-tested); this file only moves bytes
 * and commits.
 *
 * Since P1d a backup has two halves: the AsyncStorage blob (settings,
 * progress counters, assessment) and the learner store (cards, review
 * log). Export flushes the pending buffer and reads both. Import is one
 * logical transaction: the staged state is fully validated before anything
 * is written, an automatic safety copy of the CURRENT progress (both
 * halves) is saved to the documents directory, a rollback file is written,
 * the learner store is replaced, the blob is written, the store rehydrates
 * and the result is read back and verified — any failure restores both
 * halves from the rollback and reports why.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import {
  createEnvelope,
  stageImport,
  stripLearnerData,
  type StagedImport,
} from "./persistence/backup-core";
import { flushLearnerWrites, learnerStore } from "./persistence/learner";
import { emptyLearnerData, type LearnerData } from "./persistence/learner-types";
import {
  PERSIST_VERSION,
  type PersistedProgress,
} from "./persistence/migrations";
import { currentUiLanguage } from "./i18n";
import { msg, type Message } from "./i18n/message";
import { translate } from "./i18n/translate";
import { PROGRESS_STORAGE_KEY, resetLearnerMemory, runLearnerBootstrap, useProgress } from "./store";

export type BackupOutcome = { ok: true } | { ok: false; reason: Message };

function errorMessage(e: unknown): Message {
  return msg("backup.reason.failure", { detail: e instanceof Error ? e.message : String(e) });
}

/** The data half of the store (what zustand persists — no functions, no learner data). */
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
    uiLanguage: s.uiLanguage,
    courses: stripLearnerData({ courses: s.courses } as PersistedProgress).courses,
    activeDays: s.activeDays,
    assessmentByTarget: s.assessmentByTarget,
    speechNoticeAckAt: s.speechNoticeAckAt,
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

function stamp(now: Date): string {
  return now.toISOString().replace(/[:.]/g, "-");
}

/** Everything currently stored: the raw blob and the learner store's contents. */
async function currentHalves(): Promise<{ raw: string | null; state: PersistedProgress; version: number; learner: LearnerData }> {
  await flushLearnerWrites();
  const raw = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
  const { state, version } = parsePersistedRaw(raw);
  let learner: LearnerData = emptyLearnerData();
  try {
    learner = await (await learnerStore()).exportAll();
  } catch {
    // An unreadable learner store exports as empty; the blob still goes out.
  }
  return { raw, state, version, learner };
}

/** Share the current progress as a JSON backup file. */
export async function exportProgress(now = new Date()): Promise<BackupOutcome> {
  try {
    const { state, version, learner } = await currentHalves();
    const envelope = createEnvelope(state, learner, version, now);
    const name = `lingo-progress-${now.toISOString().slice(0, 10)}.json`;
    const file = writeFile(Paths.cache, name, JSON.stringify(envelope));
    if (!(await Sharing.isAvailableAsync())) {
      return { ok: false, reason: msg("backup.reason.sharingUnavailable") };
    }
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/json",
      dialogTitle: translate(currentUiLanguage(), "backup.shareTitle"),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: errorMessage(e) };
  }
}

export type PickResult =
  | { kind: "canceled" }
  | { kind: "error"; reason: Message }
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
    if (!uri) return { kind: "error", reason: msg("backup.reason.noFile") };
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
 * Commit a staged import. Order matters: safety copy → rollback file →
 * learner store replaced → atomic blob write → rehydrate + bootstrap →
 * read-back verify (restoring BOTH halves from the rollback if that fails).
 */
export async function commitImport(
  state: PersistedProgress,
  learner: LearnerData,
  now = new Date()
): Promise<BackupOutcome> {
  let previous: Awaited<ReturnType<typeof currentHalves>> | null = null;
  let rollbackFile: File | null = null;
  const restore = async () => {
    if (!previous) return;
    try {
      await (await learnerStore()).replaceAll(previous.learner);
    } catch {
      // the rollback file still holds the learner half
    }
    if (previous.raw) {
      resetLearnerMemory();
      await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, previous.raw);
      await useProgress.persist.rehydrate();
      await runLearnerBootstrap();
    }
  };
  try {
    previous = await currentHalves();

    // Automatic pre-import safety copy of the CURRENT progress (documents
    // directory, so it survives cache cleanup and can be re-imported), and
    // the rollback envelope this commit restores from on failure.
    if (previous.raw) {
      const envelope = JSON.stringify(createEnvelope(previous.state, previous.learner, previous.version, now));
      writeFile(Paths.document, `progress-before-import-${stamp(now)}.json`, envelope);
      rollbackFile = writeFile(Paths.document, `progress-rollback-${stamp(now)}.json`, envelope);
    }

    const store = await learnerStore();
    await store.replaceAll(learner);
    const newRaw = JSON.stringify({ state: stripLearnerData(state), version: PERSIST_VERSION });
    // Memory must not carry the OLD learner data into the bootstrap: the
    // bootstrap treats inline cards/log as a pre-v4 blob and would import
    // them on top of the freshly replaced store. The reset triggers a
    // persist write of the old blob, so it goes BEFORE the new blob write.
    resetLearnerMemory();
    await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, newRaw);
    await useProgress.persist.rehydrate();
    await runLearnerBootstrap();

    // Read-back verification of both halves. The bootstrap that follows
    // rehydration may rewrite the blob in the store's own key order, so the
    // blob is compared field by field, never byte by byte.
    const readBack = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
    const stored = readBack ? (JSON.parse(readBack) as { state?: PersistedProgress; version?: number }) : null;
    const live = useProgress.getState();
    const counts = await store.counts();
    const expectedCards = Object.values(learner.cards).reduce((n, byKey) => n + Object.keys(byKey).length, 0);
    const verified =
      stored?.version === PERSIST_VERSION &&
      stored.state?.activeCourseId === state.activeCourseId &&
      stored.state?.streak === state.streak &&
      Object.keys(stored.state?.courses ?? {}).length === Object.keys(state.courses).length &&
      live.activeCourseId === state.activeCourseId &&
      live.streak === state.streak &&
      Object.keys(live.courses).length === Object.keys(state.courses).length &&
      counts.cards === expectedCards &&
      counts.reviewLog === learner.reviewLog.length;
    if (!verified) {
      await restore();
      return {
        ok: false,
        reason: msg("backup.reason.verificationFailed"),
      };
    }
    try {
      rollbackFile?.delete();
    } catch {
      // A leftover rollback file is harmless (documents directory, never read automatically).
    }
    return { ok: true };
  } catch (e) {
    // Best-effort restore; anything before the learner write left state untouched.
    try {
      await restore();
    } catch {
      // Keep the original error as the reason.
    }
    return { ok: false, reason: errorMessage(e) };
  }
}
