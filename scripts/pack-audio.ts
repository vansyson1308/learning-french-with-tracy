/**
 * Pack audio pipeline driver (V1 publication program, Part II §9-§12).
 *
 * Replaces the upstream "pre-generated TTS MP3s" — 856 recordings whose
 * source and license could not be traced (release/AUDIO_PROVENANCE_FINAL.md)
 * — with audio synthesized at pipeline time from license-gated Piper
 * voices, under the same provenance discipline as the reception pipeline:
 * double-download hash pins, MODEL_CARD license gate (fail closed), ASR
 * quality audit, technical QA, content-addressed asset keys, and a
 * regenerated src/content/audio-manifest.ts. Runs INSIDE the dispatch-only
 * pack-audio workflow; pure subcommands (plan, manifest text) also run here.
 *
 * Subcommands:
 *   download-list --mode recon|generate [--courses a,b]   voice files to fetch (tsv)
 *   recon        --downloads DIR [--courses a,b]           pin + gate every candidate
 *   verify       --downloads DIR [--courses a,b]           pins must match (fail closed)
 *   plan         --mode canary|generate --out FILE [--courses a,b]
 *   synth-script --plan FILE --dl DIR --wav DIR --out DIR  bash recipe
 *   sfx-script   --out DIR                                 bash recipe for the 3 sfx
 *   qa           --plan FILE --outdir DIR --report FILE [--asr FILE] [--strict true]
 *   select       --report FILE [--courses a,b]             pick one voice per course
 *   apply        --plan FILE --outdir DIR --sfx DIR        install assets + manifest
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, copyFileSync } from "fs";
import path from "path";

import {
  licenseGate,
  packAssetKey,
  parseModelCard,
  registryLicenseFor,
  sfxScript,
  sha256File,
  synthScript,
  technicalQa,
  type LicenseGate,
  type VoiceFiles,
} from "./lib/piper-audio";

const ROOT = path.resolve(import.meta.dir, "..");
const MANIFEST_PATH = path.join(ROOT, "content/audio/pack-audio-manifest.json");
const REGISTRY_PATH = path.join(ROOT, "content/sources/registry.json");
const AUDIO_MANIFEST_TS = path.join(ROOT, "src/content/audio-manifest.ts");
const MODEL_CARDS_DIR = path.join(ROOT, "content/audio/model-cards");
const REPORTS_DIR = path.join(ROOT, "content/reports");

type GeneratedCourse = { policy: "generated"; language: string; voiceId: string | null; candidates: string[] };
type DeviceTtsCourse = { policy: "device-tts"; language: string; reason: string };
type Course = GeneratedCourse | DeviceTtsCourse;
type Voice = {
  id: string;
  language: string;
  note: string;
  files: VoiceFiles;
  declaredDataset: string | null;
  declaredLicense: string | null;
  status: "candidate" | "eligible" | "excluded" | "selected";
  gateReason: string | null;
};
type Manifest = {
  version: number;
  pipelineVersion: number;
  note: string;
  piperTts: { package: string; pinnedVersion: string };
  voicesRepository: string;
  voicesRevision: string;
  licenseGate: LicenseGate;
  courses: Record<string, Course>;
  voices: Voice[];
  restoreAudioTargets: Record<string, { exerciseId: string; text: string }[]>;
};

export type PlanClip = {
  clipId: string;
  courseId: string;
  language: string;
  text: string;
  segments: { voiceId: string; speaker: number | null; text: string }[];
  assetKey: string;
};

function fail(msg: string): never {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function loadManifest(): Manifest {
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as Manifest;
}
function saveManifest(m: Manifest) {
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(m, null, 2)}\n`);
}
function generatedCourses(m: Manifest, filter?: string): [string, GeneratedCourse][] {
  const wanted = filter ? new Set(filter.split(",").map((s) => s.trim()).filter(Boolean)) : null;
  return Object.entries(m.courses)
    .filter((e): e is [string, GeneratedCourse] => e[1].policy === "generated")
    .filter(([id]) => wanted === null || wanted.has(id));
}
function voiceById(m: Manifest, id: string): Voice {
  const v = m.voices.find((x) => x.id === id);
  if (!v) fail(`voice ${id} is not declared in the manifest`);
  return v;
}

/**
 * Every string a course pack can speak: unit words, exercise audioTargets,
 * match-pair targets, plus the texts the manifest restores an audioTarget
 * for. Sorted and unique — the plan is a pure function of content.
 */
export function courseAudioStrings(m: Manifest, courseId: string): string[] {
  const pack = JSON.parse(readFileSync(path.join(ROOT, `content/courses/${courseId}.json`), "utf8")) as {
    sections: { units: { words?: { target: string }[]; lessons: { exercises: Record<string, unknown>[] }[] }[] }[];
  };
  const set = new Set<string>();
  for (const s of pack.sections) {
    for (const u of s.units) {
      for (const w of u.words ?? []) set.add(w.target);
      for (const l of u.lessons) {
        for (const e of l.exercises) {
          if (typeof e.audioTarget === "string") set.add(e.audioTarget);
          if (e.type === "match" && Array.isArray(e.pairs)) {
            for (const pr of e.pairs as { target: string }[]) set.add(pr.target);
          }
        }
      }
    }
  }
  for (const r of m.restoreAudioTargets[courseId] ?? []) set.add(r.text);
  return [...set].sort((a, b) => a.localeCompare(b));
}

// ---------------------------------------------------------------------------
// download-list / recon / verify
// ---------------------------------------------------------------------------

function downloadList(mode: string, courses?: string) {
  const m = loadManifest();
  const lines: string[] = [];
  const seen = new Set<string>();
  for (const [, course] of generatedCourses(m, courses)) {
    const ids = mode === "recon" ? course.candidates : course.voiceId ? [course.voiceId] : [];
    if (mode === "generate" && ids.length === 0) fail(`a generated course has no selected voice — run recon first`);
    for (const id of ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      const v = voiceById(m, id);
      for (const [kind, f] of Object.entries(v.files)) {
        lines.push(`${v.id}\t${kind}\t${f.path}\t${mode === "recon" ? 2 : 1}`);
      }
    }
  }
  process.stdout.write(`${lines.join("\n")}\n`);
}

function recon(downloads: string, courses?: string) {
  const m = loadManifest();
  const report: Record<string, unknown>[] = [];
  mkdirSync(MODEL_CARDS_DIR, { recursive: true });
  const touched = new Set<string>();
  for (const [, course] of generatedCourses(m, courses)) for (const id of course.candidates) touched.add(id);
  for (const voice of m.voices) {
    if (!touched.has(voice.id)) continue;
    for (const [kind, file] of Object.entries(voice.files)) {
      const a = path.join(downloads, `${voice.id}.${kind}.1`);
      const b = path.join(downloads, `${voice.id}.${kind}.2`);
      if (!existsSync(a) || !existsSync(b)) fail(`${voice.id}: missing downloaded ${kind} copies`);
      const ha = sha256File(a);
      const hb = sha256File(b);
      if (ha.sha256 !== hb.sha256) fail(`${voice.id}.${kind}: the two downloads differ — refusing to pin an unstable artifact`);
      file.sha256 = ha.sha256;
      file.bytes = ha.bytes;
    }
    const cardText = readFileSync(path.join(downloads, `${voice.id}.modelCard.1`), "utf8");
    const { dataset, license } = parseModelCard(cardText);
    voice.declaredDataset = dataset;
    voice.declaredLicense = license;
    const verdict = licenseGate(m.licenseGate, cardText);
    voice.status = verdict.ok ? "eligible" : "excluded";
    voice.gateReason = verdict.ok ? `matched ${verdict.matched}` : verdict.reason;
    writeFileSync(path.join(MODEL_CARDS_DIR, `${voice.id}.MODEL_CARD.txt`), cardText);
    report.push({ voice: voice.id, language: voice.language, dataset, license, status: voice.status, gateReason: voice.gateReason, files: voice.files });
    console.log(`${voice.status.toUpperCase()} ${voice.id}: dataset=${dataset} :: ${voice.gateReason}`);
  }
  for (const [id, course] of generatedCourses(m, courses)) {
    const eligible = course.candidates.filter((c) => voiceById(m, c).status === "eligible" || voiceById(m, c).status === "selected");
    if (eligible.length === 0) fail(`${id}: no candidate voice passed the license gate — add a candidate or switch the course to device-tts`);
  }
  saveManifest(m);
  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(
    path.join(REPORTS_DIR, "pack-audio-recon.json"),
    `${JSON.stringify({ generator: "scripts/pack-audio.ts recon", voicesRevision: m.voicesRevision, piperTts: m.piperTts, voices: report }, null, 2)}\n`
  );
  console.log("recon complete: pins written, model cards committed, report at content/reports/pack-audio-recon.json");
}

function verify(downloads: string, courses?: string) {
  const m = loadManifest();
  for (const [id, course] of generatedCourses(m, courses)) {
    if (!course.voiceId) fail(`${id}: no selected voice — run recon (canary + select) first`);
    const voice = voiceById(m, course.voiceId);
    for (const [kind, file] of Object.entries(voice.files)) {
      if (!file.sha256) fail(`${voice.id}.${kind}: manifest has no pin — run recon first`);
      const p = path.join(downloads, `${voice.id}.${kind}.1`);
      if (!existsSync(p)) fail(`${voice.id}: missing downloaded ${kind}`);
      const h = sha256File(p);
      if (h.sha256 !== file.sha256) fail(`${voice.id}.${kind}: hash drift — pinned ${file.sha256}, downloaded ${h.sha256}; failing closed`);
    }
    console.log(`verified ${voice.id} for ${id}`);
  }
}

// ---------------------------------------------------------------------------
// plan
// ---------------------------------------------------------------------------

/** Deterministic canary sample: 12 strings spread across the sorted list. */
function canarySample(strings: string[]): string[] {
  if (strings.length <= 12) return strings;
  const out: string[] = [];
  for (let i = 0; i < 12; i++) out.push(strings[Math.floor((i * strings.length) / 12)]);
  return out;
}

function plan(mode: string, out: string, courses?: string) {
  const m = loadManifest();
  const clips: PlanClip[] = [];
  const push = (courseId: string, language: string, voiceId: string, text: string, suffix: string) => {
    const assetKey = packAssetKey(courseId, voiceId, null, text, m.pipelineVersion);
    clips.push({ clipId: `${courseId}:${text}${suffix}`, courseId, language, text, segments: [{ voiceId, speaker: null, text }], assetKey });
  };
  for (const [id, course] of generatedCourses(m, courses)) {
    const strings = courseAudioStrings(m, id);
    if (mode === "canary") {
      const eligible = course.candidates.filter((c) => ["eligible", "selected"].includes(voiceById(m, c).status));
      if (eligible.length === 0) fail(`${id}: no eligible candidate — run recon first`);
      for (const voiceId of eligible) for (const text of canarySample(strings)) push(id, course.language, voiceId, text, `@${voiceId}`);
    } else if (mode === "generate") {
      if (!course.voiceId) fail(`${id}: no selected voice — run recon (canary + select) first`);
      for (const text of strings) push(id, course.language, course.voiceId, text, "");
    } else {
      fail(`unknown plan mode ${mode}`);
    }
  }
  writeFileSync(out, `${JSON.stringify({ pipelineVersion: m.pipelineVersion, mode, clips }, null, 2)}\n`);
  console.log(`plan (${mode}): ${clips.length} clips → ${out}`);
}

// ---------------------------------------------------------------------------
// qa / select
// ---------------------------------------------------------------------------

type QaRow = {
  clipId: string;
  courseId: string;
  language: string;
  voiceId: string;
  assetKey: string;
  transcript: string;
  durationSec: number;
  bytes: number;
  maxVolumeDb: number | null;
  leadingSilenceSec: number | null;
  trailingSilenceSec: number | null;
  charsPerSec: number;
  technical: "pass" | "fail";
  technicalIssues: string[];
  asr?: { text: string; wer: number; model?: string };
};

/**
 * ASR review policy: a clip is listed for human review when the recognizer
 * disagrees with at least half of a SENTENCE-length transcript (≥ 3 words).
 * Isolated one- or two-word clips are the weakest case for any ASR model
 * (no context to condition on), so their scores stay informational rather
 * than actionable — the technical QA (duration, level, edge silence,
 * speaking rate) still gates every clip.
 */
const REVIEW_WER = 0.5;
const REVIEW_MIN_WORDS = 3;

function qa(planPath: string, outdir: string, reportPath: string, asrPath?: string) {
  const genPlan = JSON.parse(readFileSync(planPath, "utf8")) as { mode: string; clips: PlanClip[] };
  const asr: Record<string, { text: string; wer: number; model?: string }> = asrPath ? JSON.parse(readFileSync(asrPath, "utf8")) : {};
  const asrModel = Object.values(asr).find((a) => a.model)?.model ?? null;
  const rows: QaRow[] = [];
  let failures = 0;
  for (const clip of genPlan.clips) {
    const p = path.join(outdir, `${clip.assetKey}.mp3`);
    const base = { clipId: clip.clipId, courseId: clip.courseId, language: clip.language, voiceId: clip.segments[0].voiceId, assetKey: clip.assetKey, transcript: clip.text };
    if (!existsSync(p)) {
      rows.push({ ...base, durationSec: 0, bytes: 0, maxVolumeDb: null, leadingSilenceSec: null, trailingSilenceSec: null, charsPerSec: 0, technical: "fail", technicalIssues: ["missing file"] });
      failures++;
      continue;
    }
    const t = technicalQa(p, clip.text, clip.language);
    if (t.technical === "fail") failures++;
    rows.push({ ...base, ...t, ...(asr[clip.clipId] ? { asr: asr[clip.clipId] } : {}) });
  }
  rows.sort((a, b) => a.clipId.localeCompare(b.clipId));
  const byVoice = new Map<string, { courseId: string; count: number; werSum: number; techFails: number }>();
  for (const row of rows) {
    const key = `${row.courseId}|${row.voiceId}`;
    let agg = byVoice.get(key);
    if (!agg) byVoice.set(key, (agg = { courseId: row.courseId, count: 0, werSum: 0, techFails: 0 }));
    agg.count += 1;
    if (row.asr) agg.werSum += row.asr.wer;
    if (row.technical === "fail") agg.techFails += 1;
  }
  const voiceSummary = [...byVoice.entries()]
    .map(([key, a]) => ({ courseId: a.courseId, voiceId: key.split("|")[1], clips: a.count, meanWer: Number((a.werSum / Math.max(a.count, 1)).toFixed(4)), technicalFailures: a.techFails }))
    .sort((a, b) => a.courseId.localeCompare(b.courseId) || a.meanWer - b.meanWer);
  const wordCount = (text: string) => text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  const review = rows
    .filter((r) => r.asr && r.asr.wer >= REVIEW_WER && wordCount(r.transcript) >= REVIEW_MIN_WORDS)
    .map((r) => ({ clipId: r.clipId, voiceId: r.voiceId, transcript: r.transcript, heard: r.asr!.text, wer: r.asr!.wer, durationSec: r.durationSec }));
  writeFileSync(
    reportPath,
    `${JSON.stringify({ generator: "scripts/pack-audio.ts qa", mode: genPlan.mode, asrModel, asrReviewPolicy: { minWords: REVIEW_MIN_WORDS, werAtLeast: REVIEW_WER, note: "single-word clips are informational only (no context for the recognizer); the technical QA gates every clip" }, clipCount: rows.length, uniqueAssetCount: new Set(rows.map((r) => r.assetKey)).size, technicalFailures: failures, sentenceClipsForReview: review.length, voiceSummary, review, clips: rows }, null, 2)}\n`
  );
  console.log(`qa: ${rows.length} clips, ${failures} technical failures, ${review.length} sentence clips for review (asr model: ${asrModel ?? "none"}) → ${reportPath}`);
  for (const v of voiceSummary) console.log(`  ${v.courseId} ${v.voiceId}: meanWER=${v.meanWer} techFails=${v.technicalFailures}`);
  for (const r of review) console.log(`  REVIEW ${r.clipId}: wer=${r.wer} heard=${JSON.stringify(r.heard)}`);
  if (failures > 0 && arg("strict") === "true") fail("technical QA failures in strict mode");
}

function select(reportPath: string, courses?: string) {
  const m = loadManifest();
  const report = JSON.parse(readFileSync(reportPath, "utf8")) as { voiceSummary: { courseId: string; voiceId: string; clips: number; meanWer: number; technicalFailures: number }[] };
  const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf8")) as { sources: Record<string, unknown>[] };
  const today = new Date().toISOString().slice(0, 10);
  for (const [id, course] of generatedCourses(m, courses)) {
    const rows = report.voiceSummary
      .filter((r) => r.courseId === id && course.candidates.includes(r.voiceId))
      .filter((r) => ["eligible", "selected"].includes(voiceById(m, r.voiceId).status))
      .sort((a, b) => a.technicalFailures - b.technicalFailures || a.meanWer - b.meanWer || course.candidates.indexOf(a.voiceId) - course.candidates.indexOf(b.voiceId));
    const best = rows[0];
    if (!best) fail(`${id}: no eligible candidate has canary results`);
    // Intelligibility floor: the reception pipeline excluded a voice at
    // WER ≈ 0.98; a bundled course voice must be clearly intelligible.
    if (best.meanWer > 0.6) fail(`${id}: best candidate ${best.voiceId} has mean WER ${best.meanWer} — not intelligible enough to ship; add another candidate`);
    course.voiceId = best.voiceId;
    const voice = voiceById(m, best.voiceId);
    voice.status = "selected";
    const license = registryLicenseFor(voice.gateReason?.replace(/^matched /, "") ?? "");
    if (!license) fail(`${voice.id}: cannot map license gate match to a registry license`);
    const [lang, locale, name, quality] = voice.files.model.path.split("/");
    const entryId = `piper-voice-${name}`;
    const entry = {
      id: entryId,
      name: `Piper voice ${voice.id}${voice.declaredDataset ? ` (${voice.declaredDataset})` : ""}`,
      kind: "neural TTS voice used at pipeline time to synthesize bundled course audio",
      license,
      url: `${m.voicesRepository}/tree/${m.voicesRevision}/${lang}/${locale}/${name}/${quality}`,
      attribution: `Course audio for ${id} synthesized with Piper (MIT, rhasspy/piper) using the ${voice.id} voice${voice.declaredDataset ? `, trained on ${voice.declaredDataset}` : ""} (${license}). Voice pinned at rhasspy/piper-voices revision ${m.voicesRevision}; the MODEL_CARD is preserved verbatim in content/audio/model-cards/.`,
      retrievedAt: today,
      covers: [`assets/audio/${course.language}/`, `content/audio/model-cards/${voice.id}.MODEL_CARD.txt`],
      notes: `Selected by the pack-audio canary ASR audit (mean WER ${best.meanWer} over ${best.clips} sampled strings, ${best.technicalFailures} technical failures). Model weights are never committed — only pins (content/audio/pack-audio-manifest.json), the model card, and the generated MP3 assets. Double-download hash verification and the fail-closed license gate run in the dispatch-only pack-audio workflow.`,
    };
    const existing = registry.sources.findIndex((s) => s.id === entryId);
    if (existing >= 0) registry.sources[existing] = { ...registry.sources[existing], ...entry };
    else registry.sources.push(entry);
    console.log(`${id}: selected ${best.voiceId} (meanWER ${best.meanWer}, techFails ${best.technicalFailures}, ${license})`);
  }
  saveManifest(m);
  writeFileSync(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
}

// ---------------------------------------------------------------------------
// apply
// ---------------------------------------------------------------------------

function renderAudioManifest(entries: { key: string; file: string }[]): string {
  const lines = [
    "// Generated by scripts/pack-audio.ts — do not edit by hand.",
    "// Every file is synthesized at pipeline time from a license-gated Piper",
    "// voice pinned in content/audio/pack-audio-manifest.json (provenance:",
    "// release/AUDIO_PROVENANCE_FINAL.md). Keys are `<courseId>:<text>`.",
    "export const audioManifest: Record<string, number> = {",
    ...entries.sort((a, b) => a.key.localeCompare(b.key)).map((e) => `  ${JSON.stringify(e.key)}: require(${JSON.stringify(e.file)}),`),
    "};",
  ];
  return `${lines.join("\n")}\n`;
}

function apply(planPath: string, outdir: string, sfxDir: string) {
  const m = loadManifest();
  const genPlan = JSON.parse(readFileSync(planPath, "utf8")) as { mode: string; clips: PlanClip[] };
  if (genPlan.mode !== "generate") fail("apply needs a generate plan");
  const planCourses = new Set(genPlan.clips.map((c) => c.courseId));
  const allGenerated = generatedCourses(m).map(([id]) => id);
  for (const id of allGenerated) {
    if (!planCourses.has(id)) fail(`apply needs every generated course in one plan (missing ${id}) — the manifest is regenerated as a whole`);
  }
  for (const clip of genPlan.clips) {
    if (!existsSync(path.join(outdir, `${clip.assetKey}.mp3`))) fail(`missing synthesized clip for ${clip.clipId}`);
  }
  // 1. Replace every course audio directory with the generated assets.
  const entries: { key: string; file: string }[] = [];
  const perCourse = new Map<string, PlanClip[]>();
  for (const clip of genPlan.clips) perCourse.set(clip.courseId, [...(perCourse.get(clip.courseId) ?? []), clip]);
  for (const [id, course] of Object.entries(m.courses)) {
    const dir = path.join(ROOT, "assets/audio", course.language);
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
    if (course.policy !== "generated") continue;
    mkdirSync(dir, { recursive: true });
    const seen = new Set<string>();
    for (const clip of perCourse.get(id) ?? []) {
      if (!seen.has(clip.assetKey)) {
        copyFileSync(path.join(outdir, `${clip.assetKey}.mp3`), path.join(dir, `${clip.assetKey}.mp3`));
        seen.add(clip.assetKey);
      }
      entries.push({ key: `${id}:${clip.text}`, file: `../../assets/audio/${course.language}/${clip.assetKey}.mp3` });
    }
  }
  // 2. Sound effects.
  for (const f of ["correct.wav", "incorrect.wav", "finish.mp3"]) {
    const src = path.join(sfxDir, f);
    if (!existsSync(src)) fail(`missing synthesized sfx ${f}`);
    copyFileSync(src, path.join(ROOT, "assets/sfx", f));
  }
  // 3. The runtime manifest.
  writeFileSync(AUDIO_MANIFEST_TS, renderAudioManifest(entries));
  // 4. Restore authored audioTargets that were dropped while no clean audio existed.
  for (const [courseId, restores] of Object.entries(m.restoreAudioTargets)) {
    const file = path.join(ROOT, `content/courses/${courseId}.json`);
    const text = readFileSync(file, "utf8");
    const indent = /^\{\n( +)/.exec(text)?.[1].length ?? 1;
    const pack = JSON.parse(text) as { sections: { units: { lessons: { exercises: { id: string; audioTarget?: string }[] }[] }[] }[] };
    for (const r of restores) {
      let found = false;
      for (const s of pack.sections) for (const u of s.units) for (const l of u.lessons) for (const e of l.exercises) {
        if (e.id === r.exerciseId) {
          e.audioTarget = r.text;
          found = true;
        }
      }
      if (!found) fail(`${courseId}: restoreAudioTargets names unknown exercise ${r.exerciseId}`);
    }
    writeFileSync(file, `${JSON.stringify(pack, null, indent)}\n`);
  }
  // 5. Census for the provenance record.
  const census = Object.entries(m.courses).map(([id, course]) => ({
    courseId: id,
    policy: course.policy,
    language: course.language,
    voiceId: course.policy === "generated" ? course.voiceId : null,
    strings: course.policy === "generated" ? (perCourse.get(id) ?? []).length : 0,
    files: course.policy === "generated" ? readdirSync(path.join(ROOT, "assets/audio", course.language)).length : 0,
  }));
  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(path.join(REPORTS_DIR, "pack-audio-census.json"), `${JSON.stringify({ generator: "scripts/pack-audio.ts apply", pipelineVersion: m.pipelineVersion, courses: census, sfx: ["correct.wav", "incorrect.wav", "finish.mp3"] }, null, 2)}\n`);
  console.log(`applied: ${entries.length} manifest entries across ${perCourse.size} courses; device-tts courses carry no bundled audio`);
}

// ---------------------------------------------------------------------------

const cmd = process.argv[2];
if (cmd === "download-list") downloadList(arg("mode") ?? fail("--mode required"), arg("courses"));
else if (cmd === "recon") recon(arg("downloads") ?? fail("--downloads required"), arg("courses"));
else if (cmd === "verify") verify(arg("downloads") ?? fail("--downloads required"), arg("courses"));
else if (cmd === "plan") plan(arg("mode") ?? fail("--mode required"), arg("out") ?? fail("--out required"), arg("courses"));
else if (cmd === "synth-script") {
  const genPlan = JSON.parse(readFileSync(arg("plan") ?? fail("--plan required"), "utf8")) as { clips: PlanClip[] };
  // Identical asset keys (same text twice in a course) synthesize once.
  const unique = new Map<string, PlanClip>();
  for (const c of genPlan.clips) if (!unique.has(c.assetKey)) unique.set(c.assetKey, c);
  process.stdout.write(synthScript([...unique.values()], arg("dl") ?? fail("--dl required"), arg("wav") ?? fail("--wav required"), arg("out") ?? fail("--out required")));
} else if (cmd === "sfx-script") process.stdout.write(sfxScript(arg("out") ?? fail("--out required")));
else if (cmd === "qa") qa(arg("plan") ?? fail("--plan required"), arg("outdir") ?? fail("--outdir required"), arg("report") ?? fail("--report required"), arg("asr"));
else if (cmd === "select") select(arg("report") ?? fail("--report required"), arg("courses"));
else if (cmd === "apply") apply(arg("plan") ?? fail("--plan required"), arg("outdir") ?? fail("--outdir required"), arg("sfx") ?? fail("--sfx required"));
else fail(`unknown subcommand ${cmd ?? "(none)"}`);
