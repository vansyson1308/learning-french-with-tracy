/**
 * QC 2026-11-05 §2.1 (build side): the `deviceVoiceScoredListening` profile
 * flag is valid only on a course whose pack audio policy is device-tts, the
 * compiled profile carries it, and the reception validator does not ask such
 * a course's language for generated clip assets (the device voice reads the
 * transcript). Every other language still needs its bundled assets.
 */
import { describe, expect, test } from "bun:test";

import { FR_LEXEME_IDS } from "../../src/lib/learning/ids-fr";
import { loadCourseObjectives } from "../lib/assessment";
import { deviceVoiceListeningErrors } from "../lib/pipeline";
import { loadListening, loadReadings, validateReception } from "../lib/reception";

describe("deviceVoiceListeningErrors", () => {
  test("absent flag: nothing to check", () => {
    expect(deviceVoiceListeningErrors("ko-vi", null, undefined)).toEqual([]);
    expect(deviceVoiceListeningErrors("ko-vi", {}, { policy: "bundled" })).toEqual([]);
  });

  test("a device-tts course may opt in", () => {
    expect(deviceVoiceListeningErrors("ko-vi", { deviceVoiceScoredListening: true }, { policy: "device-tts", reason: "no clean Korean voice (D-11)" })).toEqual([]);
  });

  test("a bundled-audio course may not (P7 §25-26 stays for it)", () => {
    expect(deviceVoiceListeningErrors("fr-vi", { deviceVoiceScoredListening: true }, undefined).join()).toContain('needs the pack audio policy "device-tts"');
    expect(deviceVoiceListeningErrors("fr-vi", { deviceVoiceScoredListening: true }, { policy: "bundled" }).join()).toContain('needs the pack audio policy "device-tts"');
  });
});

describe("reception assets for a device-voice language", () => {
  const input = () => ({
    lang: "zz",
    readings: loadReadings("fr"),
    listening: loadListening("fr"),
    objectives: loadCourseObjectives("fr"),
    lexemeIds: new Set(Object.values(FR_LEXEME_IDS)),
  });

  test("a language with no assets folder fails on every clip by default", () => {
    const errors = validateReception(input()).errors.filter((e) => e.includes("generated asset"));
    expect(errors.length).toBe(loadListening("fr")!.clips.length);
  });

  test("a device-voice language needs no generated clip asset", () => {
    expect(validateReception({ ...input(), deviceVoiceListening: true }).errors.filter((e) => e.includes("generated asset"))).toEqual([]);
  });
});
