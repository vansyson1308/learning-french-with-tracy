/**
 * Audio pipeline v2 unit tests (P3b): the engine abstraction renders the
 * exact synthesis recipe (Piper per clip, Kokoro / MeloTTS batched per
 * voice through their Python helpers), loudness normalisation applies
 * only to pipelineVersion ≥ 2 clips (French stays byte-identical), the
 * licence gate accepts Apache-2.0 / MIT model terms and denies RAIL-style
 * and unverifiable ones, the manifests are v2-shaped and consistent with
 * the voice casts, and the per-language baseline groups cover every
 * shipped file.
 */
import { describe, expect, test } from "bun:test";

import { baselineGroupOf, loadBaselineGroups } from "../lib/audio";
import { licenseGate, registryLicenseFor } from "../lib/piper-audio";
import { buildPlugin } from "../lib/languages";
import { existsSync } from "fs";

import { readJson, safeResolve } from "../lib/pipeline";
import { buildSynthScript, engineFor, enginesNeeded, loadEngines, type Voice } from "../lib/tts";

const engines = loadEngines();

const piperVoice: Voice = { id: "es_MX-claude-high", engine: "piper", language: "es", note: "", files: { model: { path: "es/es_MX/claude/high/es_MX-claude-high.onnx", sha256: null, bytes: null }, config: { path: "es/es_MX/claude/high/es_MX-claude-high.onnx.json", sha256: null, bytes: null }, modelCard: { path: "es/es_MX/claude/high/MODEL_CARD", sha256: null, bytes: null } }, speaker: null, declaredDataset: null, declaredLicense: null, status: "eligible", gateReason: null };
const kokoroVoice: Voice = { id: "kokoro-ef_dora", engine: "kokoro", language: "es", note: "", files: { model: { path: "kokoro-v1_0.pth", sha256: null, bytes: null }, config: { path: "config.json", sha256: null, bytes: null }, voiceFile: { path: "voices/ef_dora.pt", sha256: null, bytes: null }, modelCard: { path: "README.md", sha256: null, bytes: null } }, speaker: null, declaredDataset: null, declaredLicense: null, status: "eligible", gateReason: null };
const meloVoice: Voice = { id: "melotts-ko", engine: "melotts", language: "ko", note: "", files: { checkpoint: { path: "checkpoint.pth", sha256: null, bytes: null }, config: { path: "config.json", sha256: null, bytes: null }, modelCard: { path: "README.md", sha256: null, bytes: null } }, speaker: "KR", declaredDataset: null, declaredLicense: null, status: "eligible", gateReason: null };

describe("engine abstraction", () => {
  test("downloads point at the pinned repositories (Piper revision, Kokoro revision, MeloTTS model revision)", () => {
    const piper = engineFor("piper").downloads(piperVoice, engines);
    expect(piper.map((d) => d.kind).sort()).toEqual(["config", "model", "modelCard"]);
    expect(piper[0].url).toContain("/rhasspy/piper-voices/resolve/v1.0.0/");
    const kokoro = engineFor("kokoro").downloads(kokoroVoice, engines);
    expect(kokoro.find((d) => d.kind === "voiceFile")!.url).toBe(`${engines.engines.kokoro.modelRepository}/resolve/${engines.engines.kokoro.modelRevision}/voices/ef_dora.pt?download=true`);
    const melo = engineFor("melotts").downloads(meloVoice, engines);
    expect(melo.find((d) => d.kind === "checkpoint")!.url).toContain("/myshell-ai/MeloTTS-Korean/resolve/0207e5adfc90129a51b6b03d89be6d84360ed323/checkpoint.pth");
    expect(enginesNeeded([piperVoice, kokoroVoice, meloVoice])).toEqual(["kokoro", "melotts", "piper"]);
  });

  test("the synthesis script batches Kokoro/MeloTTS per voice, renders Piper per clip, and normalises loudness only for v2 clips", () => {
    const script = buildSynthScript({
      clips: [
        { assetKey: "aaaa", pipelineVersion: 2, segments: [{ voiceId: "es_MX-claude-high", speaker: null, text: "Hola, ¿qué tal?" }] },
        { assetKey: "bbbb", pipelineVersion: 2, segments: [{ voiceId: "kokoro-ef_dora", speaker: null, text: "Buenos días." }, { voiceId: "kokoro-ef_dora", speaker: null, text: "Buenas noches." }] },
        { assetKey: "cccc", pipelineVersion: 2, segments: [{ voiceId: "melotts-ko", speaker: "KR", text: "안녕하세요." }] },
        { assetKey: "dddd", pipelineVersion: 1, segments: [{ voiceId: "es_MX-claude-high", speaker: null, text: "Adiós." }] },
        { assetKey: "aaaa", pipelineVersion: 2, segments: [{ voiceId: "es_MX-claude-high", speaker: null, text: "Hola, ¿qué tal?" }] },
      ],
      voices: [piperVoice, kokoroVoice, meloVoice],
      engines,
      downloadsDir: "/dl",
      wavDir: "/wav",
      outDir: "/out",
    });
    expect(script).toContain("piper --model '/dl/es_MX-claude-high.model.1'");
    expect(script.match(/kokoro_synth\.py/g)!.length).toBe(1); // one process for the two Kokoro segments
    expect(script).toContain("--jobs '/wav/kokoro-kokoro-ef_dora.jobs.jsonl'");
    expect(script).toContain("melotts_synth.py --language 'KR' --speaker 'KR'");
    expect(script).toContain("loudnorm=I=-18:TP=-1.5:LRA=11");
    // The v1 clip (French-style) is encoded WITHOUT loudness normalisation.
    const v1Line = script.split("\n").find((l) => l.includes("/out/dddd.mp3"))!;
    expect(v1Line).not.toContain("loudnorm");
    // Identical keys synthesise once; the gap is concatenated for the 2-segment clip.
    expect(script).toContain("synthesized 4 clips, reused 0 existing assets (5 plan clips)");
    expect(script).toContain("/wav/bbbb.list");
  });

  test("already-blessed assets are copied, never re-rendered", () => {
    const script = buildSynthScript({ clips: [{ assetKey: "aaaa", pipelineVersion: 2, segments: [{ voiceId: "es_MX-claude-high", speaker: null, text: "Hola" }] }], voices: [piperVoice], engines, downloadsDir: "/dl", wavDir: "/wav", outDir: "/out", existingDir: "/blessed", existingKeys: new Set(["aaaa"]) });
    expect(script).toContain("cp '/blessed/aaaa.mp3' '/out/aaaa.mp3'");
    expect(script).not.toContain("piper --model");
  });
});

describe("licence gate v2", () => {
  const gate = engines.licenseGate;
  test("accepts Apache-2.0 / MIT model cards and CC0 / CC BY datasets; denies RAIL, NC, unknown, See URL", () => {
    expect(licenseGate(gate, "# Model card\n\n## Dataset\n\n* URL: x\n* License: apache-2.0\n").ok).toBe(true);
    expect(licenseGate(gate, "---\nlicense: mit\n---\n").ok).toBe(true);
    // Hugging Face card: the front matter is the statement of record; prose about "non-commercial use" is not a restriction.
    expect(licenseGate(gate, "---\nlicense: mit\nlanguage:\n- ko\n---\n# MeloTTS\n\nThis library is under MIT License, which means it is free for both commercial and non-commercial use.\n").ok).toBe(true);
    expect(licenseGate(gate, "---\nlicense: cc-by-nc-4.0\n---\n").ok).toBe(false);
    expect(licenseGate(gate, "* Dataset: Thorsten\n* License: CC0\n").ok).toBe(true);
    expect(licenseGate(gate, "* License: https://creativecommons.org/licenses/by/4.0/\n").ok).toBe(true);
    expect(licenseGate(gate, "License: OpenRAIL-M\n").ok).toBe(false);
    expect(licenseGate(gate, "* License: CC BY-NC-SA 4.0\n").ok).toBe(false);
    expect(licenseGate(gate, "* License: Unknown\n").ok).toBe(false);
    expect(licenseGate(gate, "* License: See URL\n").ok).toBe(false);
    expect(licenseGate(gate, "* Dataset: French words\n").ok).toBe(false);
  });
  test("gate matches map to registry licence ids", () => {
    expect(registryLicenseFor("apache-2.0")).toBe("Apache-2.0");
    expect(registryLicenseFor("MIT")).toBe("MIT");
    expect(registryLicenseFor("CC BY-SA 4.0")).toBe("CC-BY-SA-4.0");
    expect(registryLicenseFor("CC0")).toBe("CC0-1.0");
  });
});

describe("manifests and voice casts", () => {
  const pack = readJson("content/audio/pack-audio-manifest.json") as { version: number; pipelineVersions: Record<string, number>; courses: Record<string, { language: string; policy: string; voiceCast?: { A: string | null } }>; voices: { id: string; engine: string; language: string }[] };
  const casts = readJson("content/audio/voice-casts.json") as { languages: Record<string, { status: string; candidates: { voiceId: string; engine: string }[]; cast: { A: string | null } }> };
  test("every course has a language, every candidate voice is declared with its engine, French stays at pipelineVersion 1", () => {
    expect(pack.version).toBe(2);
    expect(pack.pipelineVersions.fr).toBe(1);
    expect(pack.pipelineVersions.default).toBe(3); // P3f: 32 kbps speech from version 3
    const voices = [...pack.voices];
    for (const lang of Object.keys(casts.languages)) {
      const rel = `content/${lang}/reception/audio-source-manifest.json`;
      if (existsSync(safeResolve(rel))) voices.push(...(readJson(rel) as { voices: { id: string; engine: string; language: string }[] }).voices);
    }
    const voiceIds = new Map(voices.map((v) => [v.id, v]));
    for (const [lang, entry] of Object.entries(casts.languages)) {
      for (const c of entry.candidates) {
        const v = voiceIds.get(c.voiceId);
        expect(v, `${lang}: ${c.voiceId}`).toBeDefined();
        expect(v!.engine).toBe(c.engine);
        expect(v!.language).toBe(lang);
      }
      if (entry.status === "selected") expect(entry.candidates.map((c) => c.voiceId)).toContain(entry.cast.A!);
    }
    for (const [id, course] of Object.entries(pack.courses)) {
      expect(casts.languages[course.language], `${id} language has a cast entry`).toBeDefined();
      if (course.policy === "generated") expect(course.voiceCast?.A).toBeTruthy();
    }
  });
  test("every target language with a course has a canary file with language-specific traps", () => {
    for (const lang of ["es", "de", "it", "pt", "ja", "zh", "ko", "en", "vi", "fr"]) {
      const canary = readJson(`content/${lang}/reception/audio-canary.json`) as { language: string; items: { id: string; focus: string; text: string }[] };
      expect(canary.language).toBe(lang);
      expect(canary.items.length).toBeGreaterThanOrEqual(10);
      expect(new Set(canary.items.map((i) => i.id)).size).toBe(canary.items.length);
    }
  });
});

describe("per-language audio baselines", () => {
  test("groups are derived from the asset path; every committed group file is loaded; French groups are the V1 files", () => {
    expect(baselineGroupOf("assets/audio/fr/abc.mp3")).toBe("fr");
    expect(baselineGroupOf("assets/audio/fr-reception/abc.mp3")).toBe("fr-reception");
    expect(baselineGroupOf("assets/sfx/correct.wav")).toBe("sfx");
    const groups = loadBaselineGroups();
    expect(groups.groups).toEqual(expect.arrayContaining(["fr", "fr-reception", "de", "es", "pt", "sfx"]));
    expect(groups.manifestSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(Object.keys(groups.files).filter((k) => k.startsWith("assets/audio/fr/")).length).toBe(164);
    expect(Object.keys(groups.files).filter((k) => k.startsWith("assets/audio/fr-reception/")).length).toBe(166);
  });
});

describe("canary fixes (2026-10-21 runs)", () => {
  test("a Creative Commons licence URL maps to its registry licence (vi VAIS-1000 card)", () => {
    expect(registryLicenseFor("creativecommons.org/licenses/by/4.0")).toBe("CC-BY-4.0");
    expect(registryLicenseFor("https://creativecommons.org/licenses/by-sa/4.0/")).toBe("CC-BY-SA-4.0");
    expect(registryLicenseFor("creativecommons.org/publicdomain/zero/1.0")).toBe("CC0-1.0");
  });
  test("the speaking-rate band follows the script (Han ~1 character per syllable)", () => {
    expect(buildPlugin("zh").charsPerSecBand.min).toBeLessThan(3.4);
    expect(buildPlugin("ko").charsPerSecBand.min).toBeLessThan(3);
    expect(buildPlugin("es").charsPerSecBand).toEqual({ min: 4, max: 30 });
    expect(buildPlugin("fr").charsPerSecBand).toEqual({ min: 4, max: 30 });
  });
});
