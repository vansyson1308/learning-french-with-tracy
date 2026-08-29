/**
 * Speech cache hygiene (P8 §8/§27): attempt audio lives in ONE sweepable
 * cache subdirectory, is deletable per attempt, and the boundary sweep
 * removes everything there without ever touching anything else — in
 * particular never the document area where progress backups live.
 */
import { beforeEach, describe, expect, test } from "bun:test";

import {
  deleteRecording,
  ensureSpeechCacheDirectory,
  SPEECH_CACHE_SUBDIR,
  speechCacheDirectory,
  sweepSpeechCache,
} from "../speech/speech-cache";
import { memDirs, memFiles } from "./helpers/mocks";

const DIR = `cache/${SPEECH_CACHE_SUBDIR}`;

beforeEach(() => {
  memFiles.clear();
  memDirs.clear();
});

describe("directory placement", () => {
  test("the speech cache lives under the OS cache area, never documents", () => {
    const uri = speechCacheDirectory().uri;
    expect(uri).toBe(DIR);
    expect(uri.startsWith("cache/")).toBe(true);
    expect(uri.includes("document")).toBe(false);
  });

  test("ensure creates the directory and is idempotent", () => {
    expect(speechCacheDirectory().exists).toBe(false);
    expect(ensureSpeechCacheDirectory()?.uri).toBe(DIR);
    expect(speechCacheDirectory().exists).toBe(true);
    expect(ensureSpeechCacheDirectory()?.uri).toBe(DIR);
  });
});

describe("per-attempt deletion (§8: delete after use)", () => {
  test("deleteRecording removes exactly the one file", () => {
    memFiles.set(`${DIR}/rec-a.wav`, "AAA");
    memFiles.set(`${DIR}/rec-b.wav`, "BBB");
    deleteRecording(`${DIR}/rec-a.wav`);
    expect(memFiles.has(`${DIR}/rec-a.wav`)).toBe(false);
    expect(memFiles.has(`${DIR}/rec-b.wav`)).toBe(true);
  });

  test("null, undefined, and already-deleted URIs are safe no-ops", () => {
    expect(() => deleteRecording(null)).not.toThrow();
    expect(() => deleteRecording(undefined)).not.toThrow();
    expect(() => deleteRecording(`${DIR}/never-existed.wav`)).not.toThrow();
  });
});

describe("boundary sweep", () => {
  test("sweeping a missing directory is 0 removed, no error", () => {
    expect(sweepSpeechCache()).toBe(0);
  });

  test("sweep removes every attempt file and nothing outside the cache dir", () => {
    memFiles.set(`${DIR}/rec-1.wav`, "one");
    memFiles.set(`${DIR}/rec-2.wav`, "two");
    memFiles.set(`${DIR}/rec-3.caf`, "three");
    memFiles.set("cache/other-cache/keep.json", "unrelated cache");
    memFiles.set("document/backup-2026.json", "progress backup");

    expect(sweepSpeechCache()).toBe(3);

    expect([...memFiles.keys()].filter((k) => k.startsWith(`${DIR}/`))).toEqual([]);
    expect(memFiles.get("cache/other-cache/keep.json")).toBe("unrelated cache");
    expect(memFiles.get("document/backup-2026.json")).toBe("progress backup");
  });

  test("an empty (but existing) cache sweeps to 0", () => {
    ensureSpeechCacheDirectory();
    expect(sweepSpeechCache()).toBe(0);
  });
});
