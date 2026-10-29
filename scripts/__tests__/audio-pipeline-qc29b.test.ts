/**
 * QC 2026-10-29b §3 — audio pipeline: fail-fast technical QA (with the
 * stderr-parsed level/silence measurements and the speech-only floor), the
 * incremental ASR cache (hit, miss, invalidation by bytes, model or
 * transcript), the declared German re-synthesis and the owner listening list.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import os from "os";
import path from "path";

import { asrCacheKey, asrModelId, mergeAsrResults, splitPlanByCache, type AsrPlan } from "../lib/asr-cache";
import { ownerListeningLines, splitReview, techQaDoc } from "../lib/audio-qa";
import { loadResynthesis, packClipRecipe, receptionClipRecipe, resynthesisProblems } from "../lib/audio-recipe";
import { packAssetKey, parseDecodedSec, parseEdgeSilence, QA_THRESHOLDS, technicalIssues, type ClipMeasurement, type TechnicalQa } from "../lib/piper-audio";
import { listeningClipKey, loadListening, receptionAssetKey, resolveClipSegments, receptionPipelineVersion } from "../lib/reception";
import { buildSynthScript, loadEngines, type Voice } from "../lib/tts";

const tmp = mkdtempSync(path.join(os.tmpdir(), "audio-qc29b-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe("technical QA measurements (ffmpeg reports are read from stderr)", () => {
  test("edge silence: padded word, no silence, all silence, a trailing silence reported at the stream end", () => {
    const padded = "silence_start: 0\nsilence_end: 0.120045 | silence_duration: 0.12\nsilence_start: 0.323265\nsilence_end: 0.44 | silence_duration: 0.116735\n";
    const p = parseEdgeSilence(padded, 0.44);
    expect(p.lead).toBeCloseTo(0.12, 3);
    expect(p.trail).toBeCloseTo(0.1167, 3);
    expect(p.speechSec).toBeCloseTo(0.2032, 3);
    expect(parseEdgeSilence("", 0.8)).toEqual({ lead: null, trail: null, speechSec: 0.8 });
    expect(parseEdgeSilence("silence_start: 0\nsilence_end: 0.5 | silence_duration: 0.5\n", 0.5).speechSec).toBe(0);
    // Older ffmpeg: no silence_end for a silence that runs to the end.
    const open = parseEdgeSilence("silence_start: 0.9\n", 1.2);
    expect(open.trail).toBeCloseTo(0.3, 5);
    expect(open.speechSec).toBeCloseTo(0.9, 5);
    // A pause inside the clip is neither leading nor trailing.
    expect(parseEdgeSilence("silence_start: 0.4\nsilence_end: 0.6 | silence_duration: 0.2\n", 1.0)).toEqual({ lead: null, trail: null, speechSec: 1.0 });
  });

  test("the decoded length comes from astats (the MP3 container duration includes the encoder delay)", () => {
    expect(parseDecodedSec("Stream #0:0: Audio: mp3 (mp3float), 22050 Hz, mono, fltp, 32 kb/s\n[Parsed_astats_1 @ x] Number of samples: 9702\n")).toBeCloseTo(0.44, 3);
    expect(parseDecodedSec("nothing")).toBeNull();
  });

  const noClip = { sampleRate: 22050, samples: 11025, peakAbs: 0.8, hotSamples: 0, runs: 0, longestRun: 0, clippedSamples: 0, clippedShare: 0 };
  const m = (over: Partial<ClipMeasurement>): ClipMeasurement => ({ durationSec: 0.5, bytes: 2200, maxVolumeDb: -2, meanVolumeDb: -18, clipping: noClip, lead: 0.12, trail: 0.12, speechSec: 0.25, ...over });
  const band: [number, number] = [4, 30];

  test("the 0.25 s floor applies to the padded clip; speech-only must reach 0.12 s (padding cannot hide a clipped word)", () => {
    expect(technicalIssues(m({}), "du", band)).toEqual([]);
    expect(technicalIssues(m({ durationSec: 0.24, speechSec: 0.2 }), "du", band).join()).toContain("too short");
    const clipped = technicalIssues(m({ durationSec: 0.42, speechSec: 0.106 }), "du", band);
    expect(clipped).toHaveLength(1);
    expect(clipped[0]).toContain("speech-only duration 0.11s");
    expect(QA_THRESHOLDS.minDurationSec).toBe(0.25);
    expect(QA_THRESHOLDS.minSpeechSec).toBe(0.12);
  });

  test("clipping, near-silence, edge silence, file size and speaking rate each fail", () => {
    // Coordinator decision 2026-10-29: clipping is >= 3 consecutive hot samples, not a peak level.
    expect(technicalIssues(m({ clipping: { ...noClip, peakAbs: 1, hotSamples: 3, runs: 1, longestRun: 3, clippedSamples: 3, clippedShare: 3 / 11025 } }), "du", band).join()).toContain("clipping: 1 run(s)");
    // A blessed clip with MP3 overshoot (isolated samples, runs of two) is not clipping; a new one meets the peak gate below.
    expect(technicalIssues(m({ maxVolumeDb: 0, clipping: { ...noClip, peakAbs: 1.097, hotSamples: 1, longestRun: 1 } }), "du", band, { newlyRendered: false })).toEqual([]);
    expect(technicalIssues(m({ maxVolumeDb: -0.1, clipping: { ...noClip, peakAbs: 0.99, hotSamples: 2, longestRun: 2 } }), "du", band, { newlyRendered: false })).toEqual([]);
    expect(technicalIssues(m({ clipping: null }), "du", band)).toEqual([]);
    expect(technicalIssues(m({ maxVolumeDb: -35 }), "du", band).join()).toContain("too quiet");
    expect(technicalIssues(m({ lead: 1.3 }), "du", band).join()).toContain("leading silence 1.30s");
    expect(technicalIssues(m({ trail: 1.5 }), "du", band).join()).toContain("trailing silence 1.50s");
    expect(technicalIssues(m({ bytes: 500 }), "du", band).join()).toContain("under 800 bytes");
    expect(technicalIssues(m({ durationSec: 0.6, speechSec: 0.5 }), "Das ist ein sehr langer Satz mit vielen Wörtern.", band).join()).toContain("chars/sec");
  });

  test("the old peak gate still applies to NEWLY rendered clips; blessed clips get the sample rule only", () => {
    const hot = { ...noClip, peakAbs: 1.0974, hotSamples: 1, longestRun: 1 }; // fr.clip.ui_cafe_commande
    const peak = m({ maxVolumeDb: -0.1, clipping: hot });
    expect(QA_THRESHOLDS.newClipMaxPeakDb).toBe(-0.2);
    // New clip (explicit, and the default): the general threshold is unchanged.
    expect(technicalIssues(peak, "du", band, { newlyRendered: true })).toEqual(["peak -0.1dB above -0.2dB (newly rendered clip)"]);
    expect(technicalIssues(peak, "du", band)).toEqual(["peak -0.1dB above -0.2dB (newly rendered clip)"]);
    expect(technicalIssues(m({ maxVolumeDb: 0 }), "du", band, { newlyRendered: true }).join()).toContain("newly rendered");
    expect(technicalIssues(m({ maxVolumeDb: -0.2 }), "du", band, { newlyRendered: true })).toEqual([]);
    // Blessed (frozen French): no waiver needed.
    expect(technicalIssues(peak, "du", band, { newlyRendered: false })).toEqual([]);
    // The sample rule holds for both.
    const run = m({ maxVolumeDb: 0, clipping: { ...noClip, peakAbs: 1, hotSamples: 4, runs: 1, longestRun: 4, clippedSamples: 4, clippedShare: 4 / 11025 } });
    expect(technicalIssues(run, "du", band, { newlyRendered: false }).join()).toContain("clipping: 1 run(s)");
    expect(technicalIssues(run, "du", band, { newlyRendered: true })).toHaveLength(2);
  });

  test("tech-qa marks a clip newly rendered unless its bytes are blessed", () => {
    const outdir = path.join(tmp, "tech-bless");
    mkdirSync(outdir, { recursive: true });
    writeFileSync(path.join(outdir, "old.mp3"), "blessed bytes");
    writeFileSync(path.join(outdir, "new.mp3"), "fresh bytes");
    const seen: Record<string, boolean | undefined> = {};
    const fake = (file: string, _t: string, _l: string, _b: [number, number], opts: { newlyRendered?: boolean }): TechnicalQa => {
      seen[path.basename(file)] = opts.newlyRendered;
      return { durationSec: 1, speechSec: 0.8, bytes: 3000, maxVolumeDb: -2, meanVolumeDb: -18, clipping: null, leadingSilenceSec: null, trailingSilenceSec: null, charsPerSec: 10, technical: "pass", technicalIssues: [] };
    };
    const doc = techQaDoc({
      clips: [
        { clipId: "fr-en:old", assetKey: "old", text: "old", language: "fr" },
        { clipId: "de-vi:new", assetKey: "new", text: "new", language: "de" },
      ],
      outdir,
      band,
      qa: fake,
      isBlessed: (file) => path.basename(file) === "old.mp3",
    });
    expect(seen).toEqual({ "old.mp3": false, "new.mp3": true });
    expect(doc.rows.map((r) => [r.clipId, r.newlyRendered])).toEqual([["de-vi:new", true], ["fr-en:old", false]]);
  });

  test("tech-qa checks each unique asset once and names every failure", () => {
    const outdir = path.join(tmp, "tech");
    mkdirSync(outdir, { recursive: true });
    writeFileSync(path.join(outdir, "a.mp3"), "x");
    writeFileSync(path.join(outdir, "b.mp3"), "x");
    const seen: string[] = [];
    const fake = (file: string, transcript: string): TechnicalQa => {
      seen.push(path.basename(file));
      const bad = transcript === "du";
      return { durationSec: bad ? 0.2 : 1, speechSec: bad ? 0.1 : 0.8, bytes: 3000, maxVolumeDb: -2, meanVolumeDb: -18, clipping: null, leadingSilenceSec: null, trailingSilenceSec: null, charsPerSec: 10, technical: bad ? "fail" : "pass", technicalIssues: bad ? ["duration 0.20s too short"] : [] };
    };
    const doc = techQaDoc({
      clips: [
        { clipId: "de-vi:du", assetKey: "a", text: "du", language: "de" },
        { clipId: "de-en:du", assetKey: "a", text: "du", language: "de" },
        { clipId: "de-vi:Hallo Welt", assetKey: "b", text: "Hallo Welt", language: "de" },
        { clipId: "de-vi:fehlt", assetKey: "c", text: "fehlt", language: "de" },
      ],
      outdir,
      band,
      qa: fake,
    });
    expect(doc.uniqueAssets).toBe(3);
    expect(seen).toEqual(["a.mp3", "b.mp3"]);
    expect(doc.failures.map((f) => f.clipId)).toEqual(["de-vi:du", "de-vi:fehlt"]);
    expect(doc.failures[1].technicalIssues).toEqual(["missing file"]);
  });
});

describe("incremental ASR cache (sha256 of clip bytes + model id + transcript)", () => {
  const outdir = path.join(tmp, "asr-out");
  const cacheDir = path.join(tmp, "asr-cache");
  mkdirSync(outdir, { recursive: true });
  const write = (key: string, bytes: string) => writeFileSync(path.join(outdir, `${key}.mp3`), bytes);
  const plan = (clips: { clipId: string; assetKey: string; text: string }[]): AsrPlan => ({ language: "de", normalization: { wordChars: "a-zäöüß0-9" }, clips });
  const modelId = asrModelId({ recognizer: "faster-whisper==1.0.3:medium", language: "de", normalization: { wordChars: "a-zäöüß0-9" }, auditScript: "v1" });
  const result = (text: string) => ({ text, wer: 0, metric: "wer", model: "faster-whisper:medium", engine: "whisper" });

  test("the key binds bytes, model id and transcript", () => {
    const k = asrCacheKey(Buffer.from("abc"), modelId, "Hallo");
    expect(k).toMatch(/^[0-9a-f]{64}$/);
    expect(asrCacheKey(Buffer.from("abd"), modelId, "Hallo")).not.toBe(k);
    expect(asrCacheKey(Buffer.from("abc"), `${modelId}x`, "Hallo")).not.toBe(k);
    expect(asrCacheKey(Buffer.from("abc"), modelId, "Hallo!")).not.toBe(k);
    // The model id carries the recogniser, the language, the scoring spec and the audit script.
    expect(asrModelId({ recognizer: "faster-whisper==1.0.3:base", language: "de", normalization: {}, auditScript: "v1" })).not.toBe(asrModelId({ recognizer: "faster-whisper==1.0.3:medium", language: "de", normalization: {}, auditScript: "v1" }));
    expect(asrModelId({ recognizer: "r", language: "de", normalization: { a: 1 }, auditScript: "v1" })).not.toBe(asrModelId({ recognizer: "r", language: "de", normalization: { a: 2 }, auditScript: "v1" }));
    expect(asrModelId({ recognizer: "r", language: "de", normalization: {}, auditScript: "v1" })).not.toBe(asrModelId({ recognizer: "r", language: "de", normalization: {}, auditScript: "v2" }));
  });

  test("miss → audit → store; the next run is a full hit; a one-clip change re-audits that clip only", () => {
    write("k1", "bytes-1");
    write("k2", "bytes-2");
    const p = plan([
      { clipId: "c1", assetKey: "k1", text: "Guten Tag." },
      { clipId: "c2", assetKey: "k2", text: "Danke schön." },
    ]);
    // Cold cache: everything to audit.
    const first = splitPlanByCache({ plan: p, outdir, cacheDir, modelId });
    expect(first.stats).toEqual({ clips: 2, hits: 0, misses: 2 });
    const merged = mergeAsrResults({ plan: p, outdir, cacheDir, modelId, hits: first.hits, fresh: { c1: result("Guten Tag"), c2: result("Danke schön") } });
    expect(merged.written).toBe(2);
    expect(Object.keys(merged.results)).toEqual(["c1", "c2"]);
    // Warm cache: nothing to audit, identical results.
    const second = splitPlanByCache({ plan: p, outdir, cacheDir, modelId });
    expect(second.stats).toEqual({ clips: 2, hits: 2, misses: 0 });
    expect(second.todo.clips).toEqual([]);
    expect(second.hits.c1.text).toBe("Guten Tag");
    expect(mergeAsrResults({ plan: p, outdir, cacheDir, modelId, hits: second.hits, fresh: {} }).results).toEqual(merged.results);
    // Invalidation by bytes: a re-rendered clip is audited again, the other stays cached.
    write("k1", "bytes-1-resynthesised");
    const bytesChanged = splitPlanByCache({ plan: p, outdir, cacheDir, modelId });
    expect(bytesChanged.todo.clips.map((c) => c.clipId)).toEqual(["c1"]);
    expect(Object.keys(bytesChanged.hits)).toEqual(["c2"]);
  });

  test("invalidation by model id and by transcript", () => {
    write("k3", "bytes-3");
    const p = plan([{ clipId: "c3", assetKey: "k3", text: "Wie geht's?" }]);
    mergeAsrResults({ plan: p, outdir, cacheDir, modelId, hits: {}, fresh: { c3: result("Wie geht's") } });
    expect(splitPlanByCache({ plan: p, outdir, cacheDir, modelId }).stats.hits).toBe(1);
    const otherModel = asrModelId({ recognizer: "faster-whisper==1.0.3:base", language: "de", normalization: { wordChars: "a-zäöüß0-9" }, auditScript: "v1" });
    expect(splitPlanByCache({ plan: p, outdir, cacheDir, modelId: otherModel }).stats.misses).toBe(1);
    const edited = plan([{ clipId: "c3", assetKey: "k3", text: "Wie geht es?" }]);
    expect(splitPlanByCache({ plan: edited, outdir, cacheDir, modelId }).stats.misses).toBe(1);
  });

  test("never caches a missing file or a placeholder result, and ignores a corrupt entry", () => {
    const p = plan([{ clipId: "gone", assetKey: "nofile", text: "Weg." }]);
    const r = mergeAsrResults({ plan: p, outdir, cacheDir, modelId, hits: {}, fresh: { gone: { text: "", wer: 1, metric: "wer", engine: "x" } } });
    expect(r.written).toBe(0);
    expect(r.results.gone.wer).toBe(1);
    write("k4", "bytes-4");
    const q = plan([{ clipId: "c4", assetKey: "k4", text: "Ja." }]);
    expect(mergeAsrResults({ plan: q, outdir, cacheDir, modelId, hits: {}, fresh: { c4: { text: "", wer: 1 } } }).written).toBe(0); // no model: not a transcription
    const key = asrCacheKey(readFileSync(path.join(outdir, "k4.mp3")), modelId, "Ja.");
    mkdirSync(path.join(cacheDir, key.slice(0, 2)), { recursive: true });
    writeFileSync(path.join(cacheDir, key.slice(0, 2), `${key}.json`), "{not json");
    expect(splitPlanByCache({ plan: q, outdir, cacheDir, modelId }).stats.misses).toBe(1);
  });
});

describe("German re-synthesis of the 11 flagged sentence clips (§3.4)", () => {
  const declared = loadResynthesis("de");
  // The review list of de run 40815633778, pinned: the re-synthesis run rewrites the report, so it cannot be the reference.
  const FLAGGED_BY_RUN_40815633778 = [
    "de-en:Die Milch ist kalt.",
    "de-en:Du bist eine Frau.",
    "de-en:Gehen Sie geradeaus.",
    "de-vi:Was darf es sein?",
    "de-vi:Wir haben Pizza gegessen.",
    "de.clip.cp3_dikt_zug",
    "de.clip.goethe_a_h1_06",
    "de.clip.ix_goethe_a_thema_miss",
    "de.clip.ix_goethe_b_thema_miss",
    "de.clip.ix_plaene_0_s",
    "de.clip.uh_brot_preis",
  ];

  test("the de voice manifest declares exactly the clips the last de run flagged, with another noise scale, same voices", () => {
    expect(declared).not.toBeNull();
    expect(resynthesisProblems(declared)).toEqual([]);
    expect([...declared!.clips].sort()).toEqual(FLAGGED_BY_RUN_40815633778);
    expect(declared!.clips).toHaveLength(11);
    // Piper's defaults are 0.667 / 0.8: the declared values differ.
    expect(declared!.piper.noiseScale).not.toBe(0.667);
    expect(declared!.piper.noiseW).not.toBe(0.8);
  });

  test("every declared listening clip gets a new key, so its blessed file is not reused and it is re-rendered and re-audited", () => {
    // Keys only: before the re-synthesis run the new file is absent, after it the old one is (release hygiene checks both).
    const listening = loadListening("de")!;
    const version = receptionPipelineVersion("de");
    const reception = declared!.clips.filter((id) => id.startsWith("de.clip."));
    expect(reception.length).toBe(6);
    for (const id of reception) {
      const clip = listening.clips.find((c) => c.id === id);
      expect(clip, `${id} is a de listening clip`).toBeDefined();
      const old = receptionAssetKey("de", resolveClipSegments(listening, clip!), version);
      const now = listeningClipKey("de", listening, clip!);
      expect(now).not.toBe(old);
    }
    // An undeclared clip keeps its key.
    const other = listening.clips.find((c) => !declared!.clips.includes(c.id))!;
    expect(listeningClipKey("de", listening, other)).toBe(receptionAssetKey("de", resolveClipSegments(listening, other), version));
    expect(receptionClipRecipe("de", other.id)).toBeNull();
  });

  test("declared pack clips get a new key; the synthesis script passes the noise scale to Piper only", () => {
    const synthesis = declared!.piper;
    const recipe = packClipRecipe({ engine: "piper", text: "Die Milch ist kalt.", pipelineVersion: 3, synthesis });
    expect(recipe).toContain("piper-noise=");
    expect(packAssetKey("de-en", "de_DE-thorsten-high", null, "Die Milch ist kalt.", 3, recipe)).not.toBe(packAssetKey("de-en", "de_DE-thorsten-high", null, "Die Milch ist kalt.", 3));
    const engines = loadEngines();
    const piper: Voice = { id: "de_DE-thorsten-high", engine: "piper", language: "de", note: "", files: {}, speaker: null, declaredDataset: null, declaredLicense: null, status: "selected", gateReason: null };
    const script = buildSynthScript({ clips: [{ assetKey: "k", pipelineVersion: 3, segments: [{ voiceId: piper.id, speaker: null, text: "Die Milch ist kalt." }], synthesis }], voices: [piper], engines, downloadsDir: "/dl", wavDir: "/wav", outDir: "/out" });
    expect(script).toContain(`--noise_scale ${synthesis.noiseScale} --noise_w ${synthesis.noiseW}`);
    const kokoro: Voice = { ...piper, id: "kokoro-ef_dora", engine: "kokoro", language: "es" };
    expect(() => buildSynthScript({ clips: [{ assetKey: "k", pipelineVersion: 3, segments: [{ voiceId: kokoro.id, speaker: null, text: "Hola." }], synthesis }], voices: [kokoro], engines, downloadsDir: "/dl", wavDir: "/wav", outDir: "/out" })).toThrow("Piper only");
  });

  test("declaration problems are caught", () => {
    expect(resynthesisProblems({ reason: "", piper: { noiseScale: 0, noiseW: 2 }, clips: ["a", "a", "de.story.x#1"] })).toHaveLength(4);
  });

  test("clips still flagged after the re-synthesis go to the owner checklist; other flagged clips are next candidates", () => {
    const row = (clipId: string) => ({ clipId, voiceId: "de_DE-thorsten-high", transcript: "Die Milch ist kalt.", heard: "Himmelig ist kalt.", wer: 0.5, durationSec: 1.2 });
    const { ownerListening, resynthesisCandidates } = splitReview([row("de-en:Die Milch ist kalt."), row("de.clip.neu")], declared!.clips);
    expect(ownerListening.map((r) => r.clipId)).toEqual(["de-en:Die Milch ist kalt."]);
    expect(resynthesisCandidates.map((r) => r.clipId)).toEqual(["de.clip.neu"]);
    const lines = ownerListeningLines("de", [{ ...ownerListening[0], assetPath: "assets/audio/de/abc.mp3" }]);
    expect(lines[0]).toBe("- [ ] de: nghe xem có bị méo/rè không — `de-en:Die Milch ist kalt.` «Die Milch ist kalt.» (`assets/audio/de/abc.mp3`)");
  });
});
