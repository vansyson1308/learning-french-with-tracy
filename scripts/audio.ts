/**
 * Audio pipeline v2 driver (P3b) — pack, lexicon and reception layers for
 * ANY target language with ANY licence-gated engine (Piper, Kokoro-82M,
 * MeloTTS; scripts/lib/tts). Replaces scripts/pack-audio.ts and
 * scripts/reception-audio.ts; runs inside the dispatch-only workflow
 * .github/workflows/audio.yml, and locally for the pure subcommands
 * (`plan --dry-run`, `synth-script`, `qa` on existing files).
 *
 * Provenance discipline is unchanged: voices are pinned by double-download
 * hash (recon), their licence card must pass the fail-closed gate of
 * content/audio/engines.json, every clip is technically QA'd and
 * ASR-audited, assets are content-addressed, and `apply` merges ONLY the
 * languages it generated into src/content/audio-manifest.ts (never the
 * whole manifest), re-blessing that language's baseline file.
 *
 * Subcommands (all take --lang <code>; --layer pack|reception|lexicon|all):
 *   download-list --mode recon|generate [--layer] [--courses a,b]
 *   recon         --downloads DIR [--layer] [--courses a,b]
 *   verify        --downloads DIR [--layer] [--courses a,b]
 *   plan          --mode canary|generate [--layer] [--courses a,b] [--out FILE] [--dry-run]
 *   synth-script  --plan FILE --dl DIR --wav DIR --out DIR [--existing DIR]
 *   sfx-script    --out DIR
 *   qa            --plan FILE --outdir DIR --report FILE [--asr FILE] [--strict true]
 *   select        --report FILE [--layer] [--courses a,b]
 *   apply         --plan FILE --outdir DIR [--sfx DIR]
 *   baseline      --write
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import path from "path";

import { listeningSchema } from "../content/schema";

import { writeLanguageBaseline, writeManifestBaseline, writeSfxBaseline } from "./lib/audio";
import { buildPlugin } from "./lib/languages";
import { licenseGate, packAssetKey, parseModelCard, registryLicenseFor, sfxScript, sha256File, technicalQa } from "./lib/piper-audio";
import { loadPacks, packsForTarget } from "./lib/pipeline";
import { receptionAssetKey } from "./lib/reception";
import { buildSynthScript, engineFor, enginesNeeded, loadEngines, type EngineId, type EnginesDoc, type PinnedFile, type Voice } from "./lib/tts";
import { pickCast, speakerIdentity, type DeclaredIdentity, type SpeakerIdentity } from "./lib/tts/speaker";

const ROOT = path.resolve(import.meta.dir, "..");
const PACK_MANIFEST_PATH = path.join(ROOT, "content/audio/pack-audio-manifest.json");
const CASTS_PATH = path.join(ROOT, "content/audio/voice-casts.json");
const REGISTRY_PATH = path.join(ROOT, "content/sources/registry.json");
const AUDIO_MANIFEST_TS = path.join(ROOT, "src/content/audio-manifest.ts");
const MODEL_CARDS_DIR = path.join(ROOT, "content/audio/model-cards");
const REPORTS_DIR = path.join(ROOT, "content/reports");

type Layer = "pack" | "reception" | "lexicon" | "all";

type GeneratedCourse = { policy: "generated"; language: string; voiceId: string | null; candidates: string[]; voiceCast?: { A: string | null; B: string | null } };
type DeviceTtsCourse = { policy: "device-tts"; language: string; reason: string; candidates?: string[]; voiceCast?: { A: string | null; B: string | null } };
type Course = GeneratedCourse | DeviceTtsCourse;
type PackManifest = {
  version: number;
  pipelineVersions: Record<string, number>;
  note: string;
  courses: Record<string, Course>;
  voices: Voice[];
  restoreAudioTargets: Record<string, { exerciseId: string; text: string }[]>;
};
type ReceptionVoice = Voice & { role: string; multiSpeaker: boolean; canarySpeakers?: number[]; pinnedSpeakers?: number[] };
type ReceptionManifest = {
  version: number;
  pipelineVersion: number;
  note: string;
  voices: ReceptionVoice[];
  excludedVoices: { id: string; reason: string }[];
};
type VoiceCasts = {
  version: number;
  note: string;
  languages: Record<string, { status: string; candidates: ({ voiceId: string; engine: EngineId } & DeclaredIdentity)[]; cast: { A: string | null; B: string | null }; canary: Record<string, unknown> | null; reason?: string; castNote?: string; candidateSearch?: string }>;
};

export type PlanClip = {
  clipId: string;
  layer: "pack" | "lexicon" | "reception";
  courseId: string | null;
  language: string;
  text: string;
  segments: { voiceId: string; speaker: number | string | null; text: string }[];
  assetKey: string;
  pipelineVersion: number;
};
type PlanDoc = { language: string; mode: string; layers: Layer[]; normalization: unknown; charsPerSecBand: [number, number]; clips: PlanClip[] };

function fail(msg: string): never {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const DRY_RUN = process.argv.includes("--dry-run");
const LANG = arg("lang") ?? "fr";
if (!/^[a-z]{2,3}$/.test(LANG)) fail(`--lang must be a language code, got "${LANG}"`);
const LAYER = (arg("layer") ?? "all") as Layer;
if (!["pack", "reception", "lexicon", "all"].includes(LAYER)) fail(`--layer must be pack|reception|lexicon|all`);
const RECEPTION_DIR = path.join(ROOT, `content/${LANG}/reception`);
const RECEPTION_MANIFEST_PATH = path.join(RECEPTION_DIR, "audio-source-manifest.json");
const CANARY_PATH = path.join(RECEPTION_DIR, "audio-canary.json");
const LISTENING_PATH = path.join(RECEPTION_DIR, "listening.json");

const engines: EnginesDoc = loadEngines();
const wantsPack = LAYER === "pack" || LAYER === "all" || LAYER === "lexicon";
const wantsReception = LAYER === "reception" || LAYER === "all";

function loadPackManifest(): PackManifest {
  const m = JSON.parse(readFileSync(PACK_MANIFEST_PATH, "utf8")) as PackManifest;
  if (m.version !== 2) fail("content/audio/pack-audio-manifest.json is not a v2 manifest");
  return m;
}
function savePackManifest(m: PackManifest) {
  writeFileSync(PACK_MANIFEST_PATH, `${JSON.stringify(m, null, 2)}\n`);
}
function loadReceptionManifest(): ReceptionManifest | null {
  if (!existsSync(RECEPTION_MANIFEST_PATH)) return null;
  return JSON.parse(readFileSync(RECEPTION_MANIFEST_PATH, "utf8")) as ReceptionManifest;
}
function saveReceptionManifest(m: ReceptionManifest) {
  writeFileSync(RECEPTION_MANIFEST_PATH, `${JSON.stringify(m, null, 2)}\n`);
}
function loadCasts(): VoiceCasts {
  return JSON.parse(readFileSync(CASTS_PATH, "utf8")) as VoiceCasts;
}
function saveCasts(c: VoiceCasts) {
  writeFileSync(CASTS_PATH, `${JSON.stringify(c, null, 2)}\n`);
}
function pipelineVersionFor(m: PackManifest, lang: string): number {
  return m.pipelineVersions[lang] ?? m.pipelineVersions.default ?? 1;
}
/** Courses of the language (generated policy), optionally filtered by --courses. */
function languageCourses(m: PackManifest, filter?: string): [string, Course][] {
  const wanted = filter ? new Set(filter.split(",").map((s) => s.trim()).filter(Boolean)) : null;
  return Object.entries(m.courses).filter(([id, c]) => c.language === LANG && (wanted === null || wanted.has(id)));
}
function voiceById(voices: Voice[], id: string): Voice {
  const v = voices.find((x) => x.id === id);
  if (!v) fail(`voice ${id} is not declared in the manifest`);
  return v;
}
/** The primary course of the language (smallest native code): lexicon audio is keyed by it. */
function primaryCourseId(): string {
  const packs = packsForTarget(LANG, loadPacks()).filter((p) => p.pack.testOnly !== true);
  if (packs.length === 0) fail(`${LANG}: no course pack`);
  return [...packs].sort((a, b) => a.pack.nativeCode.localeCompare(b.pack.nativeCode))[0].pack.id;
}

/** Every string a course pack can speak (unchanged from the V1 pipeline). */
export function courseAudioStrings(m: PackManifest, courseId: string): string[] {
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
          if (e.type === "match" && Array.isArray(e.pairs)) for (const pr of e.pairs as { target: string }[]) set.add(pr.target);
        }
      }
    }
  }
  for (const r of m.restoreAudioTargets[courseId] ?? []) set.add(r.text);
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Every string the lexicon of the language speaks: surfaces and example sentences. */
export function lexiconAudioStrings(lang: string): string[] {
  const rel = path.join(ROOT, `content/${lang}/lexicon/lexemes.json`);
  if (!existsSync(rel)) return [];
  const doc = JSON.parse(readFileSync(rel, "utf8")) as { lexemes: { surface: string; examples: { target: string }[] }[] };
  const set = new Set<string>();
  for (const lex of doc.lexemes) {
    set.add(lex.surface);
    for (const ex of lex.examples) set.add(ex.target);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

// ---------------------------------------------------------------------------
// voices in scope, download-list, recon, verify
// ---------------------------------------------------------------------------

/** Candidate voice ids of the language (content/audio/voice-casts.json is the single source). */
function languageCandidates(): string[] {
  if (!existsSync(CASTS_PATH)) return [];
  return (loadCasts().languages[LANG]?.candidates ?? []).map((c) => c.voiceId);
}

function voicesInScope(mode: "recon" | "generate", courses?: string): Voice[] {
  const out = new Map<string, Voice>();
  if (wantsPack) {
    const m = loadPackManifest();
    if (mode === "recon") {
      const all = allVoices();
      for (const vid of languageCandidates()) out.set(vid, voiceById(all, vid));
    } else {
      for (const [id, course] of languageCourses(m, courses)) {
        const ids = course.policy === "generated" ? [course.voiceCast?.A ?? course.voiceId].filter((x): x is string => !!x) : [];
        if (course.policy === "generated" && ids.length === 0) fail(`${id}: no selected voice — run recon + canary first`);
        for (const vid of ids) out.set(vid, voiceById(allVoices(), vid));
      }
    }
  }
  if (wantsReception) {
    const r = loadReceptionManifest();
    if (r) for (const v of r.voices) out.set(v.id, v);
  }
  return [...out.values()];
}

function downloadList(mode: "recon" | "generate", courses?: string) {
  const lines: string[] = [];
  for (const voice of voicesInScope(mode, courses)) {
    for (const item of engineFor(voice.engine).downloads(voice, engines)) {
      lines.push(`${item.voiceId}\t${item.kind}\t${item.url}\t${mode === "recon" ? 2 : 1}`);
    }
  }
  process.stdout.write(`${lines.join("\n")}\n`);
}

function pinFiles(voice: Voice, downloads: string, twice: boolean) {
  for (const [kind, file] of Object.entries(voice.files)) {
    const a = path.join(downloads, `${voice.id}.${kind}.1`);
    if (!existsSync(a)) fail(`${voice.id}: missing downloaded ${kind}`);
    const ha = sha256File(a);
    if (twice) {
      const b = path.join(downloads, `${voice.id}.${kind}.2`);
      if (!existsSync(b)) fail(`${voice.id}: missing second download of ${kind}`);
      if (sha256File(b).sha256 !== ha.sha256) fail(`${voice.id}.${kind}: the two downloads differ — refusing to pin an unstable artifact`);
    }
    (file as PinnedFile).sha256 = ha.sha256;
    (file as PinnedFile).bytes = ha.bytes;
  }
}

function gateVoice(voice: Voice, downloads: string): Record<string, unknown> {
  const card = engineFor(voice.engine).licenseCard(voice, downloads);
  const { dataset, license } = parseModelCard(card.text);
  voice.declaredDataset = dataset;
  voice.declaredLicense = license;
  const verdict = licenseGate(engines.licenseGate, card.text);
  voice.status = verdict.ok ? "eligible" : "excluded";
  voice.gateReason = verdict.ok ? `matched ${verdict.matched}` : verdict.reason;
  const dir = path.join(MODEL_CARDS_DIR, LANG);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${voice.id}.${voice.engine === "piper" ? "MODEL_CARD" : "card"}.txt`), card.text);
  console.log(`${voice.status.toUpperCase()} ${voice.id} (${voice.engine}): dataset=${dataset} :: ${voice.gateReason}`);
  return { voice: voice.id, engine: voice.engine, language: voice.language, dataset, license, status: voice.status, gateReason: voice.gateReason, files: voice.files };
}

function recon(downloads: string, courses?: string) {
  const report: Record<string, unknown>[] = [];
  if (wantsPack) {
    const m = loadPackManifest();
    const touched = new Set(languageCandidates());
    for (const voice of m.voices) {
      if (!touched.has(voice.id)) continue;
      pinFiles(voice, downloads, true);
      report.push(gateVoice(voice, downloads));
    }
    savePackManifest(m);
    const eligible = languageCandidates().filter((c) => ["eligible", "selected"].includes(voiceById(allVoices(), c).status));
    if (eligible.length === 0) console.log(`${LANG}: no candidate voice passed the licence gate — the courses stay device-tts (recorded in voice-casts.json by select)`);
  }
  if (wantsReception) {
    const r = loadReceptionManifest();
    if (r) {
      for (const voice of r.voices) {
        pinFiles(voice, downloads, true);
        report.push(gateVoice(voice, downloads));
        if (voice.status === "excluded") fail(`${voice.id}: a reception voice failed the licence gate — ${voice.gateReason}`);
      }
      saveReceptionManifest(r);
    }
  }
  mkdirSync(reportsDirFor(), { recursive: true });
  writeFileSync(path.join(reportsDirFor(), "audio-recon.json"), `${JSON.stringify({ generator: "scripts/audio.ts recon", language: LANG, layers: LAYER, engines: Object.fromEntries(Object.entries(engines.engines).map(([k, v]) => [k, { pinnedVersion: (v as { pinnedVersion?: string }).pinnedVersion ?? (v as { pinnedCommit?: string }).pinnedCommit }])), voices: report }, null, 2)}\n`);
  console.log(`recon complete (${LANG}): pins written, cards under content/audio/model-cards/${LANG}/, report at ${path.relative(ROOT, reportsDirFor())}/audio-recon.json`);
}

function verify(downloads: string, courses?: string) {
  for (const voice of voicesInScope("generate", courses)) {
    for (const [kind, file] of Object.entries(voice.files)) {
      if (!file.sha256) fail(`${voice.id}.${kind}: manifest has no pin — run recon first`);
      const p = path.join(downloads, `${voice.id}.${kind}.1`);
      if (!existsSync(p)) fail(`${voice.id}: missing downloaded ${kind}`);
      const h = sha256File(p);
      if (h.sha256 !== file.sha256) fail(`${voice.id}.${kind}: hash drift — pinned ${file.sha256}, downloaded ${h.sha256}; failing closed`);
    }
    console.log(`verified ${voice.id}`);
  }
}

function reportsDirFor(): string {
  return LANG === "fr" ? REPORTS_DIR : path.join(REPORTS_DIR, LANG);
}

// ---------------------------------------------------------------------------
// plan
// ---------------------------------------------------------------------------

function canarySample(strings: string[], n = 12): string[] {
  if (strings.length <= n) return strings;
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(strings[Math.floor((i * strings.length) / n)]);
  return out;
}

function receptionDryRunProblems(r: ReceptionManifest, mode: string): string[] {
  const problems: string[] = [];
  if (typeof r.pipelineVersion !== "number") problems.push("reception manifest: pipelineVersion must be a number");
  if (!Array.isArray(r.voices) || r.voices.length === 0) problems.push("reception manifest: no voices");
  const voiceIds = new Set<string>();
  for (const voice of r.voices ?? []) {
    voiceIds.add(voice.id);
    if (!voice.engine) problems.push(`reception manifest: ${voice.id} has no engine`);
    for (const [kind, file] of Object.entries(voice.files ?? {})) if (!file.sha256) problems.push(`reception manifest: ${voice.id}.${kind} has no pinned sha256 (run recon)`);
    if (voice.multiSpeaker && !(voice.pinnedSpeakers?.length || voice.canarySpeakers?.length)) problems.push(`reception manifest: ${voice.id} is multi-speaker but pins no speakers`);
  }
  if (mode === "generate") {
    if (!existsSync(LISTENING_PATH)) problems.push(`${path.relative(ROOT, LISTENING_PATH)} does not exist`);
    else {
      const parsed = listeningSchema(LANG).safeParse(JSON.parse(readFileSync(LISTENING_PATH, "utf8")));
      if (!parsed.success) for (const issue of parsed.error.issues.slice(0, 5)) problems.push(`listening.json: ${issue.path.join(".")} — ${issue.message}`);
      else for (const [speaker, cast] of Object.entries(parsed.data.voiceCast)) if (!voiceIds.has(cast.voiceId)) problems.push(`listening.json: voiceCast.${speaker} uses ${cast.voiceId}, not in the manifest`);
    }
  } else if (!existsSync(CANARY_PATH)) problems.push(`${path.relative(ROOT, CANARY_PATH)} does not exist`);
  return problems;
}

function voiceShortName(voiceId: string): string {
  return voiceId.replace(/^[a-z]{2}_[A-Z]{2}-/, "").replace(/-[a-z]+$/, "");
}

function plan(mode: "canary" | "generate", out: string | undefined, courses?: string) {
  const clips: PlanClip[] = [];
  const problems: string[] = [];
  const layers: Layer[] = [];
  // ---- pack + lexicon layers (course-keyed, content/audio/pack-audio-manifest.json) ----
  if (wantsPack) {
    const m = loadPackManifest();
    const version = pipelineVersionFor(m, LANG);
    const pushPack = (layer: "pack" | "lexicon", courseId: string, voiceId: string, text: string, suffix: string) => {
      const voice = voiceById(allVoices(), voiceId);
      const speaker = voice.speaker ?? null;
      clips.push({ clipId: `${courseId}:${text}${suffix}`, layer, courseId, language: LANG, text, segments: [{ voiceId, speaker, text }], assetKey: packAssetKey(courseId, voiceId, typeof speaker === "number" ? speaker : null, text, version), pipelineVersion: version });
    };
    const mine = languageCourses(m, courses);
    if (mode === "canary" && LAYER !== "lexicon") {
      // The language's canary (content/<lang>/reception/audio-canary.json: language-specific
      // traps) for every eligible candidate — courses or not — plus 12 pack strings per course.
      layers.push("pack");
      const all = allVoices();
      const eligible = languageCandidates().filter((c) => ["eligible", "selected"].includes(voiceById(all, c).status));
      if (eligible.length === 0) problems.push(`${LANG}: no eligible candidate — run recon first (or the language has no clean voice)`);
      const canary = existsSync(CANARY_PATH) ? (JSON.parse(readFileSync(CANARY_PATH, "utf8")) as { items: { id: string; text: string }[] }).items : [];
      if (canary.length === 0) problems.push(`${path.relative(ROOT, CANARY_PATH)} does not exist — author the language canary first`);
      for (const voiceId of eligible) {
        const voice = voiceById(all, voiceId);
        const speaker = voice.speaker ?? null;
        for (const item of canary) {
          clips.push({ clipId: `${item.id}@${voiceId}`, layer: "pack", courseId: null, language: LANG, text: item.text, segments: [{ voiceId, speaker, text: item.text }], assetKey: packAssetKey(LANG, voiceId, typeof speaker === "number" ? speaker : null, item.text, version), pipelineVersion: version });
        }
        for (const [id] of mine) for (const text of canarySample(courseAudioStrings(m, id))) pushPack("pack", id, voiceId, text, `@${voiceId}`);
      }
    } else if (LAYER !== "lexicon") {
      if (mine.length === 0) problems.push(`no course of ${LANG} in content/audio/pack-audio-manifest.json`);
      for (const [id, course] of mine) {
        layers.push("pack");
        if (course.policy !== "generated") continue;
        const voiceId = course.voiceCast?.A ?? course.voiceId;
        if (!voiceId) problems.push(`${id}: no selected voice — run canary + select first`);
        else for (const text of courseAudioStrings(m, id)) pushPack("pack", id, voiceId, text, "");
      }
    }
    if ((LAYER === "lexicon" || LAYER === "all") && mode === "generate") {
      const strings = lexiconAudioStrings(LANG);
      if (strings.length > 0) {
        layers.push("lexicon");
        const courseId = primaryCourseId();
        const course = m.courses[courseId];
        const voiceId = course?.voiceCast?.A ?? (course?.policy === "generated" ? course.voiceId : null);
        if (!voiceId) problems.push(`${courseId}: the lexicon layer needs a selected voice for the primary course`);
        else for (const text of strings) pushPack("lexicon", courseId, voiceId, text, "");
      }
    }
  }
  // ---- reception layer (content/<lang>/reception/audio-source-manifest.json) ----
  if (wantsReception) {
    const r = loadReceptionManifest();
    if (r) {
      layers.push("reception");
      problems.push(...receptionDryRunProblems(r, mode));
      const push = (clipId: string, segments: PlanClip["segments"]) => {
        const resolved = segments.map((s) => ({ voiceId: s.voiceId, speaker: typeof s.speaker === "number" ? s.speaker : null, text: s.text }));
        clips.push({ clipId, layer: "reception", courseId: null, language: LANG, text: segments.map((s) => s.text).join(" "), segments, assetKey: receptionAssetKey(LANG, resolved, r.pipelineVersion), pipelineVersion: r.pipelineVersion });
      };
      if (mode === "canary" && existsSync(CANARY_PATH)) {
        const canary = JSON.parse(readFileSync(CANARY_PATH, "utf8")) as { items: { id: string; text: string }[] };
        for (const item of canary.items) {
          for (const voice of r.voices) {
            const short = voiceShortName(voice.id);
            if (!voice.multiSpeaker) {
              push(`${item.id}@${short}`, [{ voiceId: voice.id, speaker: null, text: item.text }]);
              continue;
            }
            for (const sp of voice.canarySpeakers ?? voice.pinnedSpeakers ?? []) push(`${item.id}@${short}-${sp}`, [{ voiceId: voice.id, speaker: sp, text: item.text }]);
          }
        }
      } else if (mode === "generate" && existsSync(LISTENING_PATH)) {
        const listening = JSON.parse(readFileSync(LISTENING_PATH, "utf8")) as { voiceCast: Record<"A" | "B", { voiceId: string; speaker: number | null }>; clips: { id: string; segments: { speaker: "A" | "B"; text: string }[] }[] };
        for (const clip of listening.clips) push(clip.id, clip.segments.map((seg) => ({ voiceId: listening.voiceCast[seg.speaker].voiceId, speaker: listening.voiceCast[seg.speaker].speaker, text: seg.text })));
      }
    } else if (LAYER === "reception") problems.push(`no reception voice manifest for ${LANG}`);
  }
  const plugin = buildPlugin(LANG);
  const doc: PlanDoc = { language: LANG, mode, layers: [...new Set(layers)], normalization: plugin.normalizeForAsr, charsPerSecBand: [plugin.charsPerSecBand.min, plugin.charsPerSecBand.max], clips };
  if (DRY_RUN) {
    for (const p of problems) console.error(`ERROR: ${p}`);
    if (problems.length > 0) fail(`dry run found ${problems.length} problem(s) for ${LANG}`);
    const unique = new Set(clips.map((c) => c.assetKey)).size;
    console.log(`dry run ok (${LANG}, ${mode}, ${doc.layers.join("+") || "none"}): ${clips.length} clips, ${unique} unique assets — nothing written`);
    return;
  }
  if (problems.length > 0) {
    for (const p of problems) console.error(`ERROR: ${p}`);
    fail(`plan found ${problems.length} problem(s) for ${LANG}`);
  }
  if (!out) fail("--out required");
  writeFileSync(out, `${JSON.stringify(doc, null, 2)}\n`);
  console.log(`plan (${LANG}, ${mode}, ${doc.layers.join("+")}): ${clips.length} clips → ${out}`);
}

function loadPlan(p: string): PlanDoc {
  return JSON.parse(readFileSync(p, "utf8")) as PlanDoc;
}

function allVoices(): Voice[] {
  const out: Voice[] = [];
  if (existsSync(PACK_MANIFEST_PATH)) out.push(...loadPackManifest().voices);
  const r = loadReceptionManifest();
  if (r) out.push(...r.voices);
  return out;
}

function synthScript(planPath: string, dl: string, wav: string, out: string, existing?: string) {
  const doc = loadPlan(planPath);
  const existingKeys = new Set<string>();
  if (existing && existsSync(existing)) for (const f of readdirSync(existing)) if (f.endsWith(".mp3")) existingKeys.add(f.slice(0, -4));
  process.stdout.write(buildSynthScript({ clips: doc.clips, voices: allVoices(), engines, downloadsDir: dl, wavDir: wav, outDir: out, existingDir: existing, existingKeys }));
}

// ---------------------------------------------------------------------------
// qa / select
// ---------------------------------------------------------------------------

const REVIEW_WER = 0.5;
const REVIEW_MIN_WORDS = 3;

type QaRow = {
  clipId: string;
  layer: string;
  courseId: string | null;
  language: string;
  voiceId: string;
  speaker: number | string | null;
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
  asr?: { text: string; wer: number; model?: string; engine?: string };
};

function qa(planPath: string, outdir: string, reportPath: string, asrPath?: string) {
  const doc = loadPlan(planPath);
  const asr: Record<string, QaRow["asr"]> = asrPath ? JSON.parse(readFileSync(asrPath, "utf8")) : {};
  const asrModel = Object.values(asr).find((a) => a?.model)?.model ?? null;
  const rows: QaRow[] = [];
  let failures = 0;
  for (const clip of doc.clips) {
    const p = path.join(outdir, `${clip.assetKey}.mp3`);
    const voices = new Set(clip.segments.map((s) => s.voiceId));
    const voiceId = voices.size === 1 ? clip.segments[0].voiceId : "mixed";
    const speaker = voices.size === 1 ? clip.segments[0].speaker : null;
    const base = { clipId: clip.clipId, layer: clip.layer, courseId: clip.courseId, language: clip.language, voiceId, speaker, assetKey: clip.assetKey, transcript: clip.text };
    if (!existsSync(p)) {
      rows.push({ ...base, durationSec: 0, bytes: 0, maxVolumeDb: null, leadingSilenceSec: null, trailingSilenceSec: null, charsPerSec: 0, technical: "fail", technicalIssues: ["missing file"] });
      failures++;
      continue;
    }
    const t = technicalQa(p, clip.text, clip.language, doc.charsPerSecBand);
    if (t.technical === "fail") failures++;
    rows.push({ ...base, ...t, ...(asr[clip.clipId] ? { asr: asr[clip.clipId] } : {}) });
  }
  rows.sort((a, b) => a.clipId.localeCompare(b.clipId));
  const byVoice = new Map<string, { courseId: string | null; layer: string; count: number; werSum: number; techFails: number }>();
  for (const row of rows) {
    const speakerKey = row.speaker === null || row.speaker === undefined ? row.voiceId : `${row.voiceId}#${row.speaker}`;
    const key = `${row.courseId ?? row.layer}|${speakerKey}`;
    let agg = byVoice.get(key);
    if (!agg) byVoice.set(key, (agg = { courseId: row.courseId, layer: row.layer, count: 0, werSum: 0, techFails: 0 }));
    agg.count += 1;
    if (row.asr) agg.werSum += row.asr.wer;
    if (row.technical === "fail") agg.techFails += 1;
  }
  const voiceSummary = [...byVoice.entries()]
    .map(([key, a]) => ({ courseId: a.courseId, layer: a.layer, voiceId: key.split("|")[1], clips: a.count, meanWer: Number((a.werSum / Math.max(a.count, 1)).toFixed(4)), technicalFailures: a.techFails }))
    .sort((a, b) => (a.courseId ?? "").localeCompare(b.courseId ?? "") || a.meanWer - b.meanWer);
  const wordCount = (text: string) => text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  const review = rows
    .filter((r) => r.asr && r.asr.wer >= REVIEW_WER && (wordCount(r.transcript) >= REVIEW_MIN_WORDS || /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(r.transcript)))
    .map((r) => ({ clipId: r.clipId, voiceId: r.voiceId, transcript: r.transcript, heard: r.asr!.text, wer: r.asr!.wer, durationSec: r.durationSec }));
  writeFileSync(
    reportPath,
    `${JSON.stringify({ generator: "scripts/audio.ts qa", language: LANG, mode: doc.mode, layers: doc.layers, asrModel, asrReviewPolicy: { minWords: REVIEW_MIN_WORDS, werAtLeast: REVIEW_WER, note: "single-word clips are informational only; the technical QA (duration, level, edge silence, speaking rate from the language plugin) gates every clip; ja/zh scores are character error rates" }, clipCount: rows.length, uniqueAssetCount: new Set(rows.map((r) => r.assetKey)).size, technicalFailures: failures, sentenceClipsForReview: review.length, voiceSummary, review, clips: rows }, null, 2)}\n`
  );
  console.log(`qa (${LANG}): ${rows.length} clips, ${failures} technical failures, ${review.length} clips for review (asr model: ${asrModel ?? "none"}) → ${reportPath}`);
  for (const v of voiceSummary) console.log(`  ${v.courseId ?? v.layer} ${v.voiceId}: meanWER=${v.meanWer} techFails=${v.technicalFailures}`);
  if (failures > 0 && arg("strict") === "true") fail("technical QA failures in strict mode");
}

/** The registry source id a voice is recorded under (Piper: one entry per dataset name, shared by its qualities). */
function registryIdFor(voice: Voice): string {
  if (voice.engine === "piper") return `piper-voice-${voice.files.model.path.split("/")[2]}`;
  if (voice.engine === "kokoro") return `kokoro-voice-${voice.id.replace(/^kokoro-/, "")}`;
  return `melotts-${voice.language}`;
}

/** The committed model card of a voice (written at recon), or null. */
function committedCard(voice: Voice): string | null {
  const file = `${voice.id}.${voice.engine === "piper" ? "MODEL_CARD" : "card"}.txt`;
  for (const p of [path.join(MODEL_CARDS_DIR, voice.language, file), path.join(MODEL_CARDS_DIR, file)]) if (existsSync(p)) return readFileSync(p, "utf8");
  return null;
}

/** Speaker identities of the language's candidates (model card + the declared identity in voice-casts.json). */
function castIdentities(all: Voice[], candidates: ({ voiceId: string } & DeclaredIdentity)[]): Map<string, SpeakerIdentity> {
  const ids = new Map<string, SpeakerIdentity>();
  for (const c of candidates) {
    const voice = all.find((v) => v.id === c.voiceId);
    if (!voice) continue;
    ids.set(voice.id, speakerIdentity(voice, committedCard(voice), { speaker: c.speaker, gender: c.gender }));
  }
  return ids;
}

function registryEntryFor(voice: Voice, license: string, courseId: string, best: { meanWer: number; clips: number; technicalFailures: number }, today: string) {
  const engine = voice.engine;
  if (engine === "piper") {
    const [lang, locale, name, quality] = voice.files.model.path.split("/");
    return {
      id: `piper-voice-${name}`,
      name: `Piper voice ${voice.id}${voice.declaredDataset ? ` (${voice.declaredDataset})` : ""}`,
      kind: "neural TTS voice used at pipeline time to synthesize bundled course audio",
      license,
      url: `${engines.engines.piper.voicesRepository}/tree/${engines.engines.piper.voicesRevision}/${lang}/${locale}/${name}/${quality}`,
      attribution: `Course audio for ${courseId} synthesized with Piper (MIT, rhasspy/piper) using the ${voice.id} voice${voice.declaredDataset ? `, trained on ${voice.declaredDataset}` : ""} (${license}). Voice pinned at rhasspy/piper-voices revision ${engines.engines.piper.voicesRevision}; the MODEL_CARD is preserved verbatim in content/audio/model-cards/.`,
      retrievedAt: today,
      covers: [`assets/audio/${voice.language}/`, `content/audio/model-cards/${voice.language}/${voice.id}.MODEL_CARD.txt`],
      notes: `Selected by the audio canary ASR audit (mean WER/CER ${best.meanWer} over ${best.clips} sampled strings, ${best.technicalFailures} technical failures). Model weights are never committed — only pins (content/audio/pack-audio-manifest.json), the model card and the generated MP3 assets.`,
    };
  }
  if (engine === "kokoro") {
    return {
      id: `kokoro-voice-${voice.id.replace(/^kokoro-/, "")}`,
      name: `Kokoro-82M voice ${voice.id}`,
      kind: "neural TTS voice used at pipeline time to synthesize bundled course audio",
      license,
      url: `${engines.engines.kokoro.modelRepository}/tree/${engines.engines.kokoro.modelRevision}`,
      attribution: `Course audio for ${courseId} synthesized with Kokoro-82M (hexgrad, Apache-2.0; kokoro ${engines.engines.kokoro.pinnedVersion}) using the ${voice.files.voiceFile?.path ?? voice.id} voice (${license}). Model and voice pinned at repository revision ${engines.engines.kokoro.modelRevision}; the model card is preserved verbatim in content/audio/model-cards/.`,
      retrievedAt: today,
      covers: [`assets/audio/${voice.language}/`, `content/audio/model-cards/${voice.language}/${voice.id}.card.txt`],
      notes: `Selected by the audio canary ASR audit (mean WER/CER ${best.meanWer} over ${best.clips} sampled strings, ${best.technicalFailures} technical failures). Model weights are never committed.`,
    };
  }
  const model = engines.engines.melotts.models[voice.language];
  return {
    id: `melotts-${voice.language}`,
    name: `MeloTTS ${model?.language ?? voice.language} model (${voice.id})`,
    kind: "neural TTS voice used at pipeline time to synthesize bundled course audio",
    license,
    url: `${model?.repository ?? engines.engines.melotts.gitRepository}/tree/${model?.revision ?? "main"}`,
    attribution: `Course audio for ${courseId} synthesized with MeloTTS (MyShell.ai, MIT; commit ${engines.engines.melotts.pinnedCommit.slice(0, 7)}) using the ${model?.language ?? voice.language} model (${license}), pinned at repository revision ${model?.revision ?? "main"}; the model card is preserved verbatim in content/audio/model-cards/.`,
    retrievedAt: today,
    covers: [`assets/audio/${voice.language}/`, `content/audio/model-cards/${voice.language}/${voice.id}.card.txt`],
    notes: `Selected by the audio canary ASR audit (mean WER/CER ${best.meanWer} over ${best.clips} sampled strings, ${best.technicalFailures} technical failures). Model weights are never committed.`,
  };
}

function select(reportPath: string, courses?: string) {
  const report = JSON.parse(readFileSync(reportPath, "utf8")) as { voiceSummary: { courseId: string | null; layer: string; voiceId: string; clips: number; meanWer: number; technicalFailures: number }[] };
  const casts = loadCasts();
  const today = new Date().toISOString().slice(0, 10);
  const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf8")) as { sources: Record<string, unknown>[] };
  const langCast = casts.languages[LANG] ?? { status: "pending-canary", candidates: [], cast: { A: null, B: null }, canary: null };
  if (wantsPack) {
    const m = loadPackManifest();
    const candidates = languageCandidates();
    // Aggregate the canary rows per voice across the language canary (courseId null) and the course samples.
    const perVoice = new Map<string, { voiceId: string; clips: number; werSum: number; technicalFailures: number }>();
    for (const r of report.voiceSummary) {
      // QA keys a voice with a fixed speaker as `<voiceId>#<speaker>` (MeloTTS "melotts-ko#KR"): the cast is per voice.
      const voiceId = r.voiceId.split("#")[0];
      if (r.layer === "reception" || !candidates.includes(voiceId)) continue;
      const agg = perVoice.get(voiceId) ?? { voiceId, clips: 0, werSum: 0, technicalFailures: 0 };
      agg.clips += r.clips;
      agg.werSum += r.meanWer * r.clips;
      agg.technicalFailures += r.technicalFailures;
      perVoice.set(voiceId, agg);
    }
    const all = allVoices();
    const rows = [...perVoice.values()]
      .filter((r) => ["eligible", "selected"].includes(voiceById(all, r.voiceId).status))
      .map((r) => ({ voiceId: r.voiceId, clips: r.clips, meanWer: Number((r.werSum / Math.max(r.clips, 1)).toFixed(4)), technicalFailures: r.technicalFailures }))
      .sort((a, b) => a.technicalFailures - b.technicalFailures || a.meanWer - b.meanWer || candidates.indexOf(a.voiceId) - candidates.indexOf(b.voiceId));
    // QC 2026-10-21: B is a different person from A (model card / declared identity),
    // preferably the other gender, within the same floor (scripts/lib/tts/speaker.ts).
    const pick = pickCast(rows, castIdentities(all, langCast.candidates));
    const best = pick.A;
    if (!best) {
      const reason = rows.length === 0 ? "no eligible candidate has canary results" : `best candidate ${rows[0].voiceId} has mean WER/CER ${rows[0].meanWer} (> 0.6) — not intelligible enough to ship`;
      console.log(`${LANG}: NO CLEAN VOICE — ${reason}`);
      langCast.status = "no-clean-voice";
      langCast.reason = reason;
      langCast.canary = { reportedAt: today, report: path.relative(ROOT, reportPath), voices: rows };
      langCast.castNote = pick.note;
    } else {
      const second = pick.B;
      // Voices of an earlier cast that are no longer A or B go back to eligible; their registry
      // entry is dropped unless a cast voice shares it (Piper qualities of one dataset share one entry).
      const castIds = new Set([best.voiceId, second?.voiceId].filter((x): x is string => !!x));
      const keptRegistryIds = new Set([...castIds].map((id) => registryIdFor(voiceById(all, id))));
      for (const c of langCast.candidates) {
        const voice = all.find((v) => v.id === c.voiceId);
        if (!voice || voice.status !== "selected" || castIds.has(voice.id)) continue;
        voice.status = "eligible";
        const inPack = m.voices.find((v) => v.id === voice.id);
        if (inPack) inPack.status = "eligible";
        const rid = registryIdFor(voice);
        if (!keptRegistryIds.has(rid)) registry.sources = registry.sources.filter((s) => s.id !== rid);
        console.log(`${LANG}: ${voice.id} leaves the cast (back to eligible)`);
      }
      for (const [id, course] of languageCourses(m, courses)) {
        m.courses[id] = { policy: "generated", language: LANG, voiceId: best.voiceId, candidates: candidates, voiceCast: { A: best.voiceId, B: second?.voiceId ?? null } };
        if (course.policy === "device-tts") console.log(`${id}: was device-tts — becomes generated with the new cast (the pack's audio policy is cleared by apply)`);
      }
      for (const chosen of [best, second].filter((x): x is typeof best => x !== null)) {
        const voice = voiceById(all, chosen.voiceId);
        voice.status = "selected";
        const inPack = m.voices.find((v) => v.id === voice.id);
        if (inPack) inPack.status = "selected";
        const r = loadReceptionManifest();
        const inReception = r?.voices.find((v) => v.id === voice.id);
        if (r && inReception) {
          inReception.status = "selected";
          saveReceptionManifest(r);
        }
        const license = registryLicenseFor(voice.gateReason?.replace(/^matched /, "") ?? "");
        if (!license) fail(`${voice.id}: cannot map licence gate match to a registry licence`);
        const courseLabel = languageCourses(m, courses).map(([id]) => id).join(", ") || `${LANG} (no course yet)`;
        const entry = registryEntryFor(voice, license, courseLabel, chosen, today);
        const existing = registry.sources.findIndex((s) => s.id === entry.id);
        if (existing >= 0) registry.sources[existing] = { ...registry.sources[existing], ...entry };
        else registry.sources.push(entry);
      }
      langCast.status = "selected";
      langCast.cast = { A: best.voiceId, B: second?.voiceId ?? null };
      langCast.canary = { reportedAt: today, report: path.relative(ROOT, reportPath), voices: rows };
      delete langCast.reason;
      langCast.castNote = pick.note;
      console.log(`${LANG}: cast A=${best.voiceId} (meanWER/CER ${best.meanWer}) B=${second?.voiceId ?? "—"} — ${pick.note}`);
    }
    savePackManifest(m);
  }
  if (wantsReception) {
    const r = loadReceptionManifest();
    if (r) {
      // Reception: record the per-voice/speaker sweep; the listening.json voiceCast is authored by a human from it.
      const rows = report.voiceSummary.filter((x) => x.layer === "reception").sort((a, b) => a.technicalFailures - b.technicalFailures || a.meanWer - b.meanWer);
      langCast.canary = { ...(langCast.canary ?? {}), reportedAt: today, receptionSweep: rows };
    }
  }
  casts.languages[LANG] = langCast;
  saveCasts(casts);
  writeFileSync(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
}

// ---------------------------------------------------------------------------
// apply (per-language merge) + baseline
// ---------------------------------------------------------------------------

function renderAudioManifest(entries: { key: string; file: string }[]): string {
  const lines = [
    "// Generated by scripts/audio.ts — do not edit by hand.",
    "// Every file is synthesized at pipeline time from a license-gated voice",
    "// pinned in content/audio/pack-audio-manifest.json (provenance:",
    "// release/AUDIO_PROVENANCE_FINAL.md). Keys are `<courseId>:<text>`.",
    "export const audioManifest: Record<string, number> = {",
    ...entries.sort((a, b) => a.key.localeCompare(b.key)).map((e) => `  ${JSON.stringify(e.key)}: require(${JSON.stringify(e.file)}),`),
    "};",
  ];
  return `${lines.join("\n")}\n`;
}

/** The committed manifest's entries, parsed back (key → require path). */
function existingManifestEntries(): { key: string; file: string }[] {
  if (!existsSync(AUDIO_MANIFEST_TS)) return [];
  const text = readFileSync(AUDIO_MANIFEST_TS, "utf8");
  const out: { key: string; file: string }[] = [];
  for (const m of text.matchAll(/^\s*("(?:[^"\\]|\\.)*"): require\(("(?:[^"\\]|\\.)*")\),$/gm)) out.push({ key: JSON.parse(m[1]) as string, file: JSON.parse(m[2]) as string });
  return out;
}

function apply(planPath: string, outdir: string, sfxDir?: string) {
  const doc = loadPlan(planPath);
  if (doc.mode !== "generate") fail("apply needs a generate plan");
  for (const clip of doc.clips) if (!existsSync(path.join(outdir, `${clip.assetKey}.mp3`))) fail(`missing synthesized clip for ${clip.clipId}`);
  const m = loadPackManifest();
  const languageCourseIds = new Set(Object.entries(m.courses).filter(([, c]) => c.language === LANG).map(([id]) => id));
  const packClips = doc.clips.filter((c) => c.layer !== "reception");
  const receptionClips = doc.clips.filter((c) => c.layer === "reception");
  // 1. Pack + lexicon assets of THIS language only: replace the directory, merge the manifest per language.
  if (packClips.length > 0) {
    const dir = path.join(ROOT, "assets/audio", LANG);
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const seen = new Set<string>();
    const entries = existingManifestEntries().filter((e) => !languageCourseIds.has(e.key.split(":")[0]));
    for (const clip of packClips) {
      if (!seen.has(clip.assetKey)) {
        copyFileSync(path.join(outdir, `${clip.assetKey}.mp3`), path.join(dir, `${clip.assetKey}.mp3`));
        seen.add(clip.assetKey);
      }
      entries.push({ key: `${clip.courseId}:${clip.text}`, file: `../../assets/audio/${LANG}/${clip.assetKey}.mp3` });
    }
    writeFileSync(AUDIO_MANIFEST_TS, renderAudioManifest(entries));
    // A course that now has bundled audio is no longer device-tts.
    for (const courseId of languageCourseIds) {
      const course = m.courses[courseId];
      if (course.policy !== "generated") continue;
      const file = path.join(ROOT, `content/courses/${courseId}.json`);
      if (!existsSync(file)) continue;
      const text = readFileSync(file, "utf8");
      const indent = /^\{\n( +)/.exec(text)?.[1].length ?? 1;
      const pack = JSON.parse(text) as { audio?: { policy: string; reason?: string }; sections: { units: { lessons: { exercises: { id: string; audioTarget?: string }[] }[] }[] }[] };
      let changed = false;
      if (pack.audio?.policy === "device-tts") {
        delete pack.audio;
        changed = true;
      }
      for (const r of m.restoreAudioTargets[courseId] ?? []) {
        for (const s of pack.sections) for (const u of s.units) for (const l of u.lessons) for (const e of l.exercises) if (e.id === r.exerciseId && e.audioTarget !== r.text) {
          e.audioTarget = r.text;
          changed = true;
        }
      }
      if (changed) writeFileSync(file, `${JSON.stringify(pack, null, indent)}\n`);
    }
    console.log(`applied ${packClips.length} pack/lexicon clips (${seen.size} assets) for ${LANG}; manifest merged per language`);
  }
  // 2. Reception assets: prune superseded, copy, record the plan the compiler reads.
  if (receptionClips.length > 0) {
    const dir = path.join(ROOT, `assets/audio/${LANG}-reception`);
    mkdirSync(dir, { recursive: true });
    const referenced = new Set(receptionClips.map((c) => `${c.assetKey}.mp3`));
    for (const f of readdirSync(dir)) if (f.endsWith(".mp3") && !referenced.has(f)) rmSync(path.join(dir, f));
    for (const key of referenced) copyFileSync(path.join(outdir, key), path.join(dir, key));
    writeFileSync(path.join(RECEPTION_DIR, "generated-plan.json"), `${JSON.stringify({ pipelineVersion: receptionClips[0].pipelineVersion, clips: receptionClips.map((c) => ({ clipId: c.clipId, text: c.text, segments: c.segments, assetKey: c.assetKey })) }, null, 2)}\n`);
    console.log(`applied ${receptionClips.length} reception clips (${referenced.size} assets) for ${LANG}`);
  }
  // 3. Sound effects (only when asked: they are language-neutral).
  if (sfxDir) {
    for (const f of ["correct.wav", "incorrect.wav", "finish.mp3"]) {
      const src = path.join(sfxDir, f);
      if (!existsSync(src)) fail(`missing synthesized sfx ${f}`);
      copyFileSync(src, path.join(ROOT, "assets/sfx", f));
    }
    writeSfxBaseline();
  }
  // 4. Census for the provenance record + this language's baseline.
  mkdirSync(reportsDirFor(), { recursive: true });
  const census = { generator: "scripts/audio.ts apply", language: LANG, pipelineVersion: pipelineVersionFor(m, LANG), layers: doc.layers, courses: [...languageCourseIds].map((id) => ({ courseId: id, policy: m.courses[id].policy, voiceCast: m.courses[id].voiceCast ?? null, clips: packClips.filter((c) => c.courseId === id).length })), receptionClips: receptionClips.length, files: { pack: existsSync(path.join(ROOT, "assets/audio", LANG)) ? readdirSync(path.join(ROOT, "assets/audio", LANG)).length : 0, reception: existsSync(path.join(ROOT, `assets/audio/${LANG}-reception`)) ? readdirSync(path.join(ROOT, `assets/audio/${LANG}-reception`)).length : 0 } };
  writeFileSync(path.join(reportsDirFor(), "audio-census.json"), `${JSON.stringify(census, null, 2)}\n`);
  writeLanguageBaseline(LANG);
  writeManifestBaseline();
  console.log(`baseline re-blessed for ${LANG} (content/audio/baseline/${LANG}.json + manifest.json)`);
}

// ---------------------------------------------------------------------------

const cmd = process.argv[2];
if (cmd === "download-list") downloadList((arg("mode") ?? fail("--mode required")) as "recon" | "generate", arg("courses"));
else if (cmd === "recon") recon(arg("downloads") ?? fail("--downloads required"), arg("courses"));
else if (cmd === "verify") verify(arg("downloads") ?? fail("--downloads required"), arg("courses"));
else if (cmd === "plan") plan((arg("mode") ?? fail("--mode required")) as "canary" | "generate", arg("out"), arg("courses"));
else if (cmd === "synth-script") synthScript(arg("plan") ?? fail("--plan required"), arg("dl") ?? fail("--dl required"), arg("wav") ?? fail("--wav required"), arg("out") ?? fail("--out required"), arg("existing"));
else if (cmd === "sfx-script") process.stdout.write(sfxScript(arg("out") ?? fail("--out required")));
else if (cmd === "qa") qa(arg("plan") ?? fail("--plan required"), arg("outdir") ?? fail("--outdir required"), arg("report") ?? fail("--report required"), arg("asr"));
else if (cmd === "select") select(arg("report") ?? fail("--report required"), arg("courses"));
else if (cmd === "apply") apply(arg("plan") ?? fail("--plan required"), arg("outdir") ?? fail("--outdir required"), arg("sfx"));
else if (cmd === "engines-needed") {
  const voices = voicesInScope((arg("mode") ?? "generate") as "recon" | "generate", arg("courses"));
  process.stdout.write(`${enginesNeeded(voices).join(" ")}\n`);
} else if (cmd === "baseline") {
  if (!process.argv.includes("--write")) fail("baseline needs --write");
  writeLanguageBaseline(LANG);
  writeManifestBaseline();
  writeSfxBaseline();
  console.log(`baseline written for ${LANG}`);
} else fail(`unknown subcommand ${cmd ?? "(none)"}`);
