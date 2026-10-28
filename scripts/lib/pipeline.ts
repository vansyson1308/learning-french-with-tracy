/**
 * Content pipeline core (Phase 2, generalised in P1c). Pure functions over
 * the content/ source tree; the thin CLIs in scripts/ call these. Rules
 * this module enforces:
 *
 * - content/ is the source of truth; everything under GENERATED_TARGETS is
 *   a GENERATED artifact (committed, drift-guarded in CI) — including, since
 *   P1c, src/content/catalog.json. The legacy audio manifest is an
 *   immutable baseline, never regenerated here.
 * - Targets are discovered, never listed: every `content/courses/*.json`
 *   pack names its targetCode, and `content/<code>/` holds that language's
 *   rich sources. Nothing here names a language.
 * - Deterministic output: same input bytes → same output bytes. No
 *   timestamps, no randomness, no network. CI makes zero paid API calls.
 * - Writes go only to the declared generated targets; every path is
 *   containment-checked against the repo root (no traversal, no eval).
 */

import { existsSync, readdirSync, readFileSync, rmSync } from "fs";
import path from "path";

import {
  ALLOWED_LICENSES,
  CatalogSchema,
  LANGUAGE_CODE_PATTERN,
  PackSchema,
  SourceRegistrySchema,
  idLanguage,
  lexemeMapSchema,
  type PackSource,
  type SourceRegistry,
  CourseProfileOverrideSchema,
} from "../../content/schema";
import { resolveCourseRoles, type CourseRef, type CourseRole, type CourseRoles } from "./course-roles";
import { lessonShapeErrors, templateDefectErrors } from "./lesson-shape";
import { buildPlugin, type BuildLanguagePlugin } from "./languages";

export const REPO_ROOT = path.resolve(__dirname, "..", "..");

/**
 * Remove a temp directory that briefly held a SQLite file. On Windows the
 * handle can outlive `db.close()` (or an on-access scanner holds it) for a
 * few hundred ms, which makes a plain rmSync throw EBUSY; retrying is the
 * documented Node remedy.
 */
export function removeTempDirSync(dir: string): void {
  rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}

/** Resolves inside the repo or throws — the anti-traversal gate for IO. */
export function safeResolve(...segments: string[]): string {
  const resolved = path.resolve(REPO_ROOT, ...segments);
  if (resolved !== REPO_ROOT && !resolved.startsWith(REPO_ROOT + path.sep)) {
    throw new Error(`path escapes the repository: ${segments.join("/")}`);
  }
  return resolved;
}

/** Generated artifacts of TEST-ONLY courses live here — never imported by the app. */
export const TEST_ONLY_ROOT = "src/content/test-only";

/** The only paths compile is allowed to write. */
export const GENERATED_TARGETS = [
  "src/content/packs",
  "src/content/lexicon",
  "src/content/ids",
  "src/content/artifacts",
  "src/content/course-profiles.json",
  "src/content/catalog.json",
  "src/content/flags.ts",
  "src/content/concepts",
  "src/content/assessment",
  "src/content/reception",
  "src/content/speech",
  "src/content/writing",
  "src/content/interaction",
  "src/content/exam",
  "src/content/stories",
  "src/content/audio",
  "src/content/courses",
  "src/content/course-loaders.ts",
  "src/content/course-bundles.ts",
  TEST_ONLY_ROOT,
  "assets/lexicon",
  "content/reports",
  "ATTRIBUTIONS.md",
  "src/content/attributions.json",
] as const;

export function assertGeneratedTarget(relPath: string): void {
  const abs = safeResolve(relPath);
  const ok = GENERATED_TARGETS.some((t) => {
    const base = safeResolve(t);
    return abs === base || abs.startsWith(base + path.sep);
  });
  if (!ok) throw new Error(`refusing to write outside generated targets: ${relPath}`);
}

/** Canonical JSON emit — proven byte-identical to the shipped pack format. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function readJson(relPath: string): unknown {
  return JSON.parse(readFileSync(safeResolve(relPath), "utf8"));
}

export function listCourseSources(): string[] {
  return readdirSync(safeResolve("content/courses"))
    .filter((f) => f.endsWith(".json") && !f.endsWith(".profile.json") && !f.endsWith(".map.json"))
    .sort();
}

/** Course ids are `<target>-<native>` (CLAUDE.md conventions). */
export function targetCodeOf(courseId: string): string {
  return courseId.split("-")[0] ?? courseId;
}

// ---------------------------------------------------------------------------
// Target discovery (P1c)
// ---------------------------------------------------------------------------

export type LoadedPack = { file: string; courseId: string; pack: PackSource };

/** Every pack that parses (schema failures are reported by validateContent). */
export function loadPacks(): LoadedPack[] {
  const out: LoadedPack[] = [];
  for (const file of listCourseSources()) {
    const parsed = PackSchema.safeParse(readJson(`content/courses/${file}`));
    if (parsed.success) out.push({ file, courseId: file.replace(/\.json$/, ""), pack: parsed.data });
  }
  return out;
}

const RESERVED_CONTENT_DIRS = new Set(["courses", "sources", "audio", "reports"]);

/** Language folders under content/ (`content/<code>/`), sorted. */
export function contentLanguageDirs(): string[] {
  const root = safeResolve("content");
  return readdirSync(root)
    .filter((entry) => {
      if (RESERVED_CONTENT_DIRS.has(entry)) return false;
      if (!new RegExp(`^${LANGUAGE_CODE_PATTERN}$`).test(entry)) return false;
      return existsSync(path.join(root, entry)) && readdirSync(path.join(root, entry)).length > 0;
    })
    .sort();
}

/**
 * Every TARGET language the compiler loops over: the target codes of all
 * parsed packs plus every `content/<code>/` folder (a folder without a
 * pack is an authoring-in-progress error the validator reports).
 */
/**
 * P3a: `content/<code>/` holds only `lexicon/` evidence (source manifest,
 * derived pools, review sheet, licence notes) — no authored lexemes
 * (`lexicon/lexemes.json`), no frozen id map, no other rich layer.
 */
export function isEvidenceOnlyLanguageDir(code: string): boolean {
  const root = safeResolve(`content/${code}`);
  if (!existsSync(root)) return false;
  const entries = readdirSync(root);
  // Evidence only: lexicon pools without authored lexemes, and/or the audio
  // pipeline's reception canary / voice manifest without authored
  // listening or reading sources (P3b).
  if (entries.some((e) => e !== "lexicon" && e !== "reception" && e !== "_drafts")) return false;
  if (existsSync(path.join(root, "lexicon", "lexemes.json"))) return false;
  if (existsSync(path.join(root, "reception", "listening.json")) || existsSync(path.join(root, "reception", "reading.json"))) return false;
  return true;
}

export function discoverTargets(packs: LoadedPack[] = loadPacks()): string[] {
  const codes = new Set<string>(contentLanguageDirs());
  for (const { pack } of packs) codes.add(pack.targetCode);
  return [...codes].sort();
}

export function packsForTarget(code: string, packs: LoadedPack[] = loadPacks()): LoadedPack[] {
  return packs.filter((p) => p.pack.targetCode === code);
}

/** P3d: the explicit role a course's profile declares (scripts/lib/course-roles.ts). */
export function courseRoleOf(courseId: string): CourseRole | undefined {
  const rel = `content/courses/${courseId}.profile.json`;
  if (!existsSync(safeResolve(rel))) return undefined;
  const parsed = CourseProfileOverrideSchema.safeParse(readJson(rel));
  return parsed.success ? parsed.data.role : undefined;
}

/** P3e §8: a course flagged betaUntilReviewed with no review recorded yet. */
export function courseIsBeta(courseId: string): boolean {
  const rel = `content/courses/${courseId}.profile.json`;
  if (!existsSync(safeResolve(rel))) return false;
  const parsed = CourseProfileOverrideSchema.safeParse(readJson(rel));
  return parsed.success && parsed.data.betaUntilReviewed === true && parsed.data.review === undefined;
}

/** A boolean flag of a course's profile (content/courses/<id>.profile.json), undefined when absent. */
export function courseProfileFlag(courseId: string, flag: "legacyLessonShapes" | "allowUnreviewed" | "basicPack"): boolean | undefined {
  const rel = `content/courses/${courseId}.profile.json`;
  if (!existsSync(safeResolve(rel))) return undefined;
  const parsed = CourseProfileOverrideSchema.safeParse(readJson(rel));
  return parsed.success ? parsed.data[flag] : undefined;
}

/** Primary / mirror / standalone courses of one target (LoadedPack form). */
export function courseRolesFor(code: string, packs: LoadedPack[] = loadPacks()): CourseRoles<LoadedPack & CourseRef> {
  const refs = packsForTarget(code, packs).map((p) => ({ ...p, id: p.pack.id, targetCode: p.pack.targetCode, nativeCode: p.pack.nativeCode }));
  return resolveCourseRoles(code, refs, courseRoleOf);
}

/** Distinct native codes of a target's courses, sorted. */
export function nativeCodesFor(code: string, packs: LoadedPack[] = loadPacks()): string[] {
  return [...new Set(packsForTarget(code, packs).map((p) => p.pack.nativeCode))].sort();
}

/** A target is test-only when it has courses and every one of them is `testOnly`. */
export function isTestOnlyTarget(code: string, packs: LoadedPack[] = loadPacks()): boolean {
  const mine = packsForTarget(code, packs);
  return mine.length > 0 && mine.every((p) => p.pack.testOnly === true);
}

/** Target codes whose courses are all test-only. */
export function testOnlyTargets(packs: LoadedPack[] = loadPacks()): string[] {
  return discoverTargets(packs).filter((code) => isTestOnlyTarget(code, packs));
}

/**
 * Which rich layers a TARGET language's authored sources provide: the
 * exercise types that need them are allowed in a pack exactly when the
 * layer exists for that language — no course literal anywhere.
 */
export function targetLayers(targetCode: string): {
  reception: boolean;
  pedagogy: boolean;
  assessment: boolean;
  speech: boolean;
  writing: boolean;
  interaction: boolean;
  ids: boolean;
  numberDrill: BuildLanguagePlugin["numberDrill"];
} {
  const has = (rel: string) => existsSync(safeResolve(`content/${targetCode}/${rel}`));
  return {
    reception: has("reception/listening.json") || has("reception/reading.json"),
    pedagogy: has("pedagogy"),
    assessment: has("assessment/objectives.json"),
    speech: has("speech/items.json"),
    writing: has("writing/tasks.json"),
    interaction: has("interaction/scenarios.json"),
    ids: has("lexemes.json"),
    numberDrill: buildPlugin(targetCode).numberDrill,
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type ValidationResult = { errors: string[]; warnings: string[] };

type AnyExercise = PackSource["sections"][number]["units"][number]["lessons"][number]["exercises"][number];

/** Content ids an exercise references must be namespaced under the pack's target language. */
function checkIdNamespace(e: AnyExercise, targetCode: string, push: (msg: string) => void) {
  const refs: [string, string | undefined][] = [];
  if ("clipId" in e) refs.push(["clipId", e.clipId]);
  if ("readingId" in e) refs.push(["readingId", e.readingId]);
  if ("speechItemId" in e) refs.push(["speechItemId", e.speechItemId]);
  if ("modelClipId" in e && typeof e.modelClipId === "string") refs.push(["modelClipId", e.modelClipId]);
  if ("writingTaskId" in e) refs.push(["writingTaskId", e.writingTaskId]);
  if ("scenarioId" in e) refs.push(["scenarioId", e.scenarioId]);
  if ("evidenceLexemeRefs" in e) for (const id of e.evidenceLexemeRefs) refs.push(["evidenceLexemeRefs", id]);
  if ("objectiveTargets" in e) for (const id of e.objectiveTargets ?? []) refs.push(["objectiveTargets", id]);
  for (const [field, value] of refs) {
    if (value !== undefined && idLanguage(value) !== targetCode) {
      push(`${e.id}: ${field} "${value}" is not namespaced under the pack's target language "${targetCode}"`);
    }
  }
}

export function validateExercise(
  courseId: string,
  e: AnyExercise,
  push: (msg: string) => void,
  targetCode: string = targetCodeOf(courseId)
) {
  const layers = targetLayers(targetCode);
  const plugin = buildPlugin(targetCode);
  checkIdNamespace(e, targetCode, push);
  // Number-drill agreement (Phase 5B §75-80): any exercise of a language
  // with a verified number speller whose prompt is a bare integer 0-100 is
  // a number drill, and its expected answer must agree with the
  // deterministic engine — the pack can never drift from the spelling rules.
  const speller = layers.numberDrill;
  if (speller) {
    const numeric = (s: string) => (/^\d{1,3}$/.test(s) ? Number(s) : null);
    if (e.type === "typeAnswer" && e.mode === "produceTarget") {
      const n = numeric(e.prompt);
      if (n !== null && n >= 0 && n <= 100) {
        const accepted = speller.accepted(n);
        if (e.answer !== accepted[0] || JSON.stringify(e.alternatives) !== JSON.stringify(accepted.slice(1))) {
          push(
            `${e.id}: number drill for ${n} must accept exactly [${accepted.join(", ")}] (engine spelling), got answer "${e.answer}" alternatives [${e.alternatives.join(", ")}]`
          );
        }
      }
    }
    if (e.type === "select") {
      const n = numeric(e.prompt);
      if (n !== null && n >= 0 && n <= 100) {
        const expected = speller.expected(n);
        if (e.options[e.correct]?.text !== expected) {
          push(
            `${e.id}: digit→word select for ${n} must key "${expected}" (engine spelling), got "${e.options[e.correct]?.text}"`
          );
        }
      }
    }
  }
  if (e.type === "select") {
    if (e.correct >= e.options.length) push(`${e.id}: correct index out of range`);
    const texts = e.options.map((o) => o.text);
    if (new Set(texts).size !== texts.length) push(`${e.id}: duplicate option text`);
  }
  if (e.type === "fillBlank") {
    if (e.correct >= e.options.length) push(`${e.id}: correct index out of range`);
    if (new Set(e.options).size !== e.options.length) push(`${e.id}: duplicate options`);
  }
  if (e.type === "wordBank") {
    const tokens = [...e.tokens];
    for (const word of e.answer) {
      const at = tokens.indexOf(word);
      if (at === -1) {
        push(`${e.id}: answer token "${word}" missing from tokens`);
        return;
      }
      tokens.splice(at, 1);
    }
  }
  if (e.type === "match") {
    const targets = e.pairs.map((p) => p.target);
    if (new Set(targets).size !== targets.length) push(`${e.id}: duplicate pair target`);
  }
  if (e.type === "listeningComprehension" || e.type === "readingComprehension") {
    if (e.correct >= e.options.length) push(`${e.id}: correct index out of range`);
    const texts = e.options.map((o) => o.text);
    if (new Set(texts).size !== texts.length) push(`${e.id}: duplicate option text`);
    if (!layers.reception) {
      push(`${e.id}: ${e.type} needs authored reception content (content/${targetCode}/reception) — not available for ${courseId}`);
    }
  }
  if (e.type === "dictation") {
    if (!layers.reception) {
      push(`${e.id}: dictation needs authored reception content (content/${targetCode}/reception) — not available for ${courseId}`);
    }
  }
  if (e.type === "speakRepetition" || e.type === "speakProduction") {
    if (!layers.speech) {
      push(`${e.id}: ${e.type} needs authored speech items (content/${targetCode}/speech) — not available for ${courseId}`);
    }
  }
  if (e.type === "guidedWriting" || e.type === "simpleForm") {
    if (!layers.writing) {
      push(`${e.id}: ${e.type} needs authored writing tasks (content/${targetCode}/writing) — not available for ${courseId}`);
    }
  }
  if (e.type === "interactionScenario") {
    if (!layers.interaction) {
      push(`${e.id}: interactionScenario needs authored scenarios (content/${targetCode}/interaction) — not available for ${courseId}`);
    }
  }
  if (e.type === "articleSelect") {
    if (e.correct >= e.articles.length) push(`${e.id}: correct index out of range`);
    if (new Set(e.articles).size !== e.articles.length) push(`${e.id}: duplicate articles`);
    const articles = plugin.articleRules;
    if (articles === null) {
      push(`${e.id}: articleSelect needs a language with gendered articles — ${targetCode} declares none`);
    } else {
      for (const a of e.articles) {
        if (articles.gender[a] === undefined && !articles.neutral.includes(a)) {
          push(`${e.id}: "${a}" is not an article of ${targetCode}`);
        }
      }
      // Elision safety (§57, the plugin's rule): an article pair whose
      // choice disappears before certain nouns cannot be drilled on them.
      const sensitive = articles.elisionSensitiveArticles ?? [];
      if (
        articles.elisionSensitiveNoun &&
        e.articles.some((a) => sensitive.includes(a)) &&
        articles.elisionSensitiveNoun.test(e.noun)
      ) {
        push(
          `${e.id}: ${sensitive.join("/")} drill on elision-sensitive noun "${e.noun}" — such nouns elide (or hide h-aspiré ambiguity); use a different article pair or noun`
        );
      }
    }
    if (!layers.pedagogy) {
      push(`${e.id}: articleSelect needs authored pedagogy (content/${targetCode}/pedagogy) — not available for ${courseId}`);
    }
  }
}

function audioManifestKeys(): Set<string> {
  const manifest = readFileSync(safeResolve("src/content/audio-manifest.ts"), "utf8");
  const keys = new Set<string>();
  for (const m of manifest.matchAll(/^\s*"((?:[^"\\]|\\.)*)": require\(/gm)) {
    keys.add(JSON.parse(`"${m[1]}"`));
  }
  return keys;
}

/** `<courseId>:<unit>-<lesson>-e<n>` — the exercise id convention every non-frozen pack follows. */
export function exerciseIdFollowsConvention(courseId: string, lessonId: string, exerciseId: string, index: number): boolean {
  const lessonOk = new RegExp(`^${courseId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:[a-z0-9]+-[a-z0-9]+$`).test(lessonId);
  return lessonOk && exerciseId === `${lessonId}-e${index}`;
}

export function validateContent(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const err = (m: string) => errors.push(m);

  const manifestKeys = audioManifestKeys();
  const seenPackIds = new Set<string>();
  const packs = loadPacks();

  for (const file of listCourseSources()) {
    const parsed = PackSchema.safeParse(readJson(`content/courses/${file}`));
    if (!parsed.success) {
      for (const issue of parsed.error.issues.slice(0, 5)) {
        err(`${file}: ${issue.path.join(".")} — ${issue.message}`);
      }
      continue;
    }
    const pack = parsed.data;
    if (pack.id !== file.replace(/\.json$/, "")) err(`${file}: id "${pack.id}" ≠ filename`);
    if (pack.id !== `${pack.targetCode}-${pack.nativeCode}`) {
      err(`${file}: id "${pack.id}" must be "<targetCode>-<nativeCode>" (${pack.targetCode}-${pack.nativeCode})`);
    }
    if (seenPackIds.has(pack.id)) err(`${file}: duplicate pack id`);
    seenPackIds.add(pack.id);
    if (pack.audio?.policy === "test-only" && pack.testOnly !== true) {
      err(`${file}: audio policy "test-only" is only valid on a testOnly pack`);
    }
    if (pack.audio?.policy === "device-tts" && pack.audio.reason === undefined) {
      err(`${file}: audio policy "device-tts" needs a recorded reason`);
    }
    const layers = targetLayers(pack.targetCode);
    const noBundledAudio = pack.audio?.policy === "device-tts" || pack.audio?.policy === "test-only";
    // P2b: pack audio is keyed by the TARGET language's primary course; a
    // secondary-native course validates against that course's manifest.
    // A standalone course (P3d) keys its own audio.
    const roles = courseRolesFor(pack.targetCode, packs);
    const audioCourseId = roles.standalone.some((p) => p.id === pack.id) ? pack.id : (roles.primary?.id ?? pack.id);
    errors.push(...objectiveMetadataErrors(pack, layers.assessment));
    if (pack.testOnly !== true && courseProfileFlag(pack.id, "legacyLessonShapes") !== true) errors.push(...lessonShapeErrors(pack));
    if (pack.testOnly !== true) {
      errors.push(...templateDefectErrors(pack, { checkWordRepeats: courseProfileFlag(pack.id, "basicPack") === true }));
    }
    // Language gates (QC 2026-10-28); inherited basic packs are left as they are.
    if (pack.testOnly !== true && courseProfileFlag(pack.id, "basicPack") !== true) {
      errors.push(...(buildPlugin(pack.targetCode).courseErrors?.(pack) ?? []));
    }

    const ids = new Set<string>();
    for (const section of pack.sections)
      for (const unit of section.units)
        for (const lesson of unit.lessons) {
          lesson.exercises.forEach((e, index) => {
            if (ids.has(e.id)) err(`${pack.id}: duplicate exercise id ${e.id}`);
            ids.add(e.id);
            if (pack.frozenExerciseIds !== true && !exerciseIdFollowsConvention(pack.id, lesson.id, e.id, index)) {
              err(`${pack.id}: exercise id "${e.id}" must be "${lesson.id}-e${index}" (<courseId>:<unit>-<lesson>-e<n>)`);
            }
            validateExercise(pack.id, e, err, pack.targetCode);
            if ("audioTarget" in e && e.audioTarget !== undefined) {
              // device-tts courses (no license-clean voice exists for the
              // language) carry no bundled audio by policy; the runtime
              // speaks their audioTargets through the device voice.
              if (!noBundledAudio && !manifestKeys.has(`${audioCourseId}:${e.audioTarget}`)) {
                err(`${pack.id}: ${e.id} audioTarget has no audio: "${e.audioTarget}"`);
              }
            }
            if ("gradeTargets" in e && e.gradeTargets !== undefined) {
              err(`${pack.id}: ${e.id} authors gradeTargets — compiler-only field`);
            }
          });
        }
  }

  // P3c review gate: authored / translated courses (native language other
  // than the original English) must be signed off by a native reviewer or
  // explicitly allowed unreviewed with a KNOWN_LIMITATIONS entry.
  const knownLimitations = existsSync(safeResolve("release/KNOWN_LIMITATIONS.md")) ? readFileSync(safeResolve("release/KNOWN_LIMITATIONS.md"), "utf8") : "";
  for (const { courseId, pack } of packs) {
    if (pack.testOnly || pack.nativeCode === "en") continue;
    const rel = `content/courses/${courseId}.profile.json`;
    const profile = existsSync(safeResolve(rel)) ? CourseProfileOverrideSchema.safeParse(readJson(rel)) : null;
    const data = profile?.success ? profile.data : null;
    if (profile && !profile.success) err(`${courseId}: ${rel} is invalid — ${profile.error.issues[0]?.message}`);
    else if (!data?.review && data?.allowUnreviewed !== true) {
      err(`${courseId}: no native review recorded — add review {native, date} to ${rel} after the REVIEW-CHECKLIST pass, or allowUnreviewed: true with a release/KNOWN_LIMITATIONS.md entry naming ${courseId}`);
    } else if (!data?.review && data?.allowUnreviewed === true && !knownLimitations.includes(courseId)) {
      err(`${courseId}: allowUnreviewed requires an entry naming the course in release/KNOWN_LIMITATIONS.md`);
    }
  }

  // Every language folder needs at least one course — except an
  // evidence-only folder (P3a: lexicon ETL pools without authored lexemes,
  // English until its course exists) — and a target's courses must agree
  // on what the language is called.
  for (const code of contentLanguageDirs()) {
    if (packsForTarget(code, packs).length === 0 && !isEvidenceOnlyLanguageDir(code)) {
      err(`content/${code}/ has rich sources but no course pack in content/courses/ targets "${code}"`);
    }
  }
  for (const code of discoverTargets(packs)) {
    const mine = packsForTarget(code, packs);
    const testFlags = new Set(mine.map((p) => p.pack.testOnly === true));
    if (testFlags.size > 1) err(`target ${code}: testOnly must be the same for every course of a language`);
  }

  // Frozen lexeme maps (P1b, every language that has one): schema, unique
  // ids, exact equality with the COMMITTED generated registry (the drift
  // test — stable ids are persisted in learner data), and full coverage of
  // every pack word of a course in that language.
  for (const { courseId, pack } of packs) {
    const code = pack.targetCode;
    const rel = `content/${code}/lexemes.json`;
    if (!existsSync(safeResolve(rel))) continue;
    const parsed = lexemeMapSchema(code).safeParse(readJson(rel));
    if (!parsed.success) {
      err(`${rel}: ${parsed.error.issues[0]?.message}`);
      continue;
    }
    const map = parsed.data;
    const values = Object.values(map);
    if (new Set(values).size !== values.length) err(`${code} lexeme ids are not unique`);
    const generatedRel = `${idsArtifactRoot(pack.testOnly === true)}/${code}.json`;
    if (existsSync(safeResolve(generatedRel))) {
      const generated = (readJson(generatedRel) as { surfaceToId: Record<string, string> }).surfaceToId;
      const a = JSON.stringify(Object.entries(map).sort());
      const b = JSON.stringify(Object.entries(generated).sort());
      if (a !== b) err(`${rel} drifted from ${generatedRel} — run bun run content:compile`);
    }
    const legacy = loadLegacyMaps([{ courseId, pack } as LoadedPack])[code] ?? {};
    for (const section of pack.sections)
      for (const unit of section.units)
        for (const word of unit.words)
          if (map[word.target] === undefined && legacy[word.target] === undefined) {
            err(`${courseId}: word "${word.target}" missing from ${rel} (and from the lexicon's legacySurfaces)`);
          }
  }

  // Catalog (GENERATED since P1c): the committed file's advertised counts
  // must still match the packs — the self-check that replaces hand
  // maintenance (P9.10: the French row once silently rotted at "10 units ·
  // 40 lessons"). A missing or old-format file is a warning here: the
  // compiler regenerates it, and the drift guard (content:check) catches a
  // stale commit.
  const catalogRel = "src/content/catalog.json";
  const catalog = existsSync(safeResolve(catalogRel)) ? CatalogSchema.safeParse(readJson(catalogRel)) : null;
  if (catalog === null || !catalog.success) {
    warnings.push(`${catalogRel} is missing or not in the generated format — run bun run content:compile`);
  } else {
    const expected = buildCatalog(packs);
    for (const course of catalog.data.courses) {
      const want = expected.courses.find((c) => c.id === course.id);
      if (!want) {
        err(`catalog.json: ${course.id} is not a shipped course — run bun run content:compile`);
      } else if (course.unitCount !== want.unitCount || course.lessonCount !== want.lessonCount) {
        err(
          `catalog.json: ${course.id} advertises ${course.unitCount} units · ${course.lessonCount} lessons but the pack has ${want.unitCount} · ${want.lessonCount} — run bun run content:compile`
        );
      }
    }
  }

  errors.push(...validateRegistry().errors);
  return { errors, warnings };
}

/**
 * §153: objective metadata (lesson objectives, exercise objectiveTargets)
 * exists only for courses whose target language has an authored
 * objectives source; any other course carrying it is an authoring error.
 * (That such courses DO declare objectives is the assessment validator's
 * curriculum-mapping rule, §144.)
 */
export function objectiveMetadataErrors(pack: PackSource, assessmentAvailable: boolean): string[] {
  if (assessmentAvailable) return [];
  const errors: string[] = [];
  for (const section of pack.sections)
    for (const unit of section.units)
      for (const lesson of unit.lessons) {
        if (lesson.objectives !== undefined) {
          errors.push(`${pack.id}/${lesson.id}: objectives need an authored objectives source (content/${pack.targetCode}/assessment) — not available for ${pack.id} (§153)`);
        }
        for (const e of lesson.exercises) {
          if ("objectiveTargets" in e && e.objectiveTargets !== undefined) {
            errors.push(`${pack.id}/${e.id}: objectiveTargets need an authored objectives source (content/${pack.targetCode}/assessment) (§153)`);
          }
        }
      }
  return errors;
}

/** Where a target's id registry is emitted (test-only courses never reach the bundle). */
export function idsArtifactRoot(testOnly: boolean): string {
  return testOnly ? `${TEST_ONLY_ROOT}/ids` : "src/content/ids";
}

/** The catalog every non-test course appears in, from the packs. */
export function buildCatalog(packs: LoadedPack[] = loadPacks()) {
  return {
    version: 1,
    courses: packs
      .filter((p) => p.pack.testOnly !== true)
      .map(({ pack }) => ({
        id: pack.id,
        targetLanguage: pack.targetLanguage,
        targetCode: pack.targetCode,
        nativeLanguage: pack.nativeLanguage,
        nativeCode: pack.nativeCode,
        flag: pack.flag,
        unitCount: pack.sections.reduce((n, s) => n + s.units.length, 0),
        lessonCount: pack.sections.reduce((n, s) => n + s.units.reduce((m, u) => m + u.lessons.length, 0), 0),
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  };
}

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------

export function validateRegistry(): ValidationResult {
  const errors: string[] = [];
  const parsed = SourceRegistrySchema.safeParse(readJson("content/sources/registry.json"));
  if (!parsed.success) {
    errors.push(`registry: ${parsed.error.issues[0]?.path.join(".")} — ${parsed.error.issues[0]?.message}`);
    return { errors, warnings: [] };
  }
  const registry = parsed.data;
  const sourceIds = registry.sources.map((s) => s.id);
  if (new Set(sourceIds).size !== sourceIds.length) errors.push("registry: duplicate source ids");
  for (const s of registry.sources) {
    if (!ALLOWED_LICENSES.includes(s.license)) {
      errors.push(`registry: license "${s.license}" is not allowlisted — do not ingest`);
    }
  }
  const covered = (rel: string) =>
    registry.sources.some((s) => s.covers.some((c) => rel === c || rel.startsWith(c)));
  for (const file of listCourseSources()) {
    if (!covered(`content/courses/${file}`)) {
      errors.push(`provenance gap: content/courses/${file} has no registered source`);
    }
  }
  if (!covered("assets/audio/")) errors.push("provenance gap: assets/audio/ uncovered");
  return { errors, warnings: [] };
}

export function loadRegistry(): SourceRegistry {
  return SourceRegistrySchema.parse(readJson("content/sources/registry.json"));
}

/** Registry sources that ship, in registry order (test-only sources back content that never reaches the app). */
export function shippedSources(registry: SourceRegistry): SourceRegistry["sources"] {
  return registry.sources.filter((s) => s.testOnly !== true);
}

export function renderAttributions(registry: SourceRegistry): string {
  const lines: string[] = [
    "<!-- Generated by scripts/compile-content.ts from content/sources/registry.json — do not edit by hand. -->",
    "",
    "# Attributions",
    "",
    "This file lists third-party sources this app builds on, generated from the",
    "provenance registry. It supplements — and never replaces — the repository's",
    "`LICENSE`; all existing copyright and MIT notices are preserved as-is.",
    "",
  ];
  for (const s of [...shippedSources(registry)].sort((a, b) => a.id.localeCompare(b.id))) {
    lines.push(`## ${s.name}`);
    lines.push("");
    lines.push(`- **License:** ${s.license}`);
    lines.push(`- **Source:** ${s.url}`);
    lines.push(`- **What:** ${s.kind}`);
    lines.push(`- **Retrieved:** ${s.retrievedAt}`);
    lines.push("");
    lines.push(s.attribution);
    if (s.notes) {
      lines.push("");
      lines.push(`> ${s.notes}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Compilation
// ---------------------------------------------------------------------------

export type CompiledFile = { relPath: string; contents: string };
export type CoverageRow = {
  total: number;
  withGradeTargets: number;
  byType: Record<string, { total: number; withGradeTargets: number }>;
};

/**
 * gradeTargets emission — ONLY where ambiguity is zero (courses whose
 * target language has a stable-id registry, word-mapped surfaces):
 *   select whose audioTarget is a mapped word → that word's lexeme id
 *   match → the mapped pair targets' ids
 * Everything else (sentence audioTargets, wordBank/typeAnswer/fillBlank)
 * stays unmarked until deliberate eligibility metadata exists.
 */
export function gradeTargetsFor(e: AnyExercise, map: Record<string, string>): string[] | undefined {
  if (e.type === "select") {
    // The exercise's unambiguous target surface: bundled-audio lessons key
    // it by audioTarget (Section 1); audio-less lessons key it by what the
    // select actually shows — the target prompt (target→native) or the
    // correct target option (native→target). Listen mode without audio can
    // never be unambiguous.
    const surface =
      e.audioTarget ??
      (e.mode === "targetToNative"
        ? e.prompt
        : e.mode === "nativeToTarget"
          ? e.options[e.correct]?.text
          : undefined);
    if (surface === undefined) return undefined;
    const id = map[surface];
    return id === undefined ? undefined : [id];
  }
  if (e.type === "match") {
    const ids = e.pairs.map((p) => map[p.target]).filter((v): v is string => v !== undefined);
    return ids.length > 0 ? [...new Set(ids)] : undefined;
  }
  return undefined;
}

export function compilePack(
  pack: PackSource,
  /** The target language's frozen surface → id map; undefined = no registry (legacy course). */
  idMap: Record<string, string> | undefined
): { pack: PackSource; coverage: CoverageRow } {
  const coverage: CoverageRow = { total: 0, withGradeTargets: 0, byType: {} };
  // Build-only pack fields never reach the runtime pack.
  const { frozenExerciseIds: _frozen, testOnly: _testOnly, ...shipped } = pack;
  const out: PackSource = {
    ...shipped,
    sections: pack.sections.map((section) => ({
      ...section,
      units: section.units.map((unit) => ({
        ...unit,
        lessons: unit.lessons.map((lesson) => ({
          ...lesson,
          exercises: lesson.exercises.map((e) => {
            coverage.total += 1;
            const byType = (coverage.byType[e.type] ??= { total: 0, withGradeTargets: 0 });
            byType.total += 1;
            const targets = idMap ? gradeTargetsFor(e, idMap) : undefined;
            if (targets === undefined) return { ...e };
            coverage.withGradeTargets += 1;
            byType.withGradeTargets += 1;
            return { ...e, gradeTargets: targets };
          }),
        })),
      })),
    })),
  };
  return { pack: out, coverage };
}

const INDEX_HEADER = "// Generated by scripts/compile-content.ts — do not edit.";

function renderPacksIndex(courseIds: string[], libPrefix: string): string {
  const imports = courseIds
    .map((id) => `import ${id.replace(/-/g, "_")} from "./${id}.json";`)
    .join("\n");
  const entries = courseIds
    .map((id) => `  "${id}": ${id.replace(/-/g, "_")} as Pack,`)
    .join("\n");
  return `${INDEX_HEADER}\n${imports}\nimport type { Pack } from "${libPrefix}/lib/types";\n\nexport const PACKS: Record<string, Pack> = {\n${entries}\n};\n`;
}

/** Frozen surface → id maps per target language that has one (content/<code>/lexemes.json). */
export function loadIdMaps(packs: LoadedPack[] = loadPacks()): Record<string, Record<string, string>> {
  const maps: Record<string, Record<string, string>> = {};
  for (const code of discoverTargets(packs)) {
    const rel = `content/${code}/lexemes.json`;
    if (!existsSync(safeResolve(rel))) continue;
    maps[code] = lexemeMapSchema(code).parse(readJson(rel));
  }
  return maps;
}

/** Legacy surface → id per language, from the rich lexicons' `legacySurfaces` (QC 2026-10-28). */
export function loadLegacyMaps(packs: LoadedPack[] = loadPacks()): Record<string, Record<string, string>> {
  const maps: Record<string, Record<string, string>> = {};
  for (const code of discoverTargets(packs)) {
    const rel = `content/${code}/lexicon/lexemes.json`;
    if (!existsSync(safeResolve(rel))) continue;
    const map: Record<string, string> = {};
    for (const lex of (readJson(rel) as { lexemes: { id: string; legacySurfaces?: string[] }[] }).lexemes) for (const s of lex.legacySurfaces ?? []) map[s] = lex.id;
    if (Object.keys(map).length > 0) maps[code] = map;
  }
  return maps;
}

export function compileAll(packs: LoadedPack[] = loadPacks()): {
  files: CompiledFile[];
  coverage: Record<string, CoverageRow>;
  packs: PackSource[];
  idMaps: Record<string, Record<string, string>>;
  legacyMaps: Record<string, Record<string, string>>;
} {
  const idMaps = loadIdMaps(packs);
  const legacyMaps = loadLegacyMaps(packs);
  const files: CompiledFile[] = [];
  const coverage: Record<string, CoverageRow> = {};
  const courseIds: string[] = [];
  const testCourseIds: string[] = [];
  const sources: PackSource[] = [];

  for (const { pack: source } of packs) {
    const canonical = idMaps[source.targetCode];
    const lookup = canonical && legacyMaps[source.targetCode] ? { ...legacyMaps[source.targetCode], ...canonical } : canonical;
    const { pack, coverage: row } = compilePack(source, lookup);
    sources.push(source);
    coverage[pack.id] = row;
    if (source.testOnly === true) {
      testCourseIds.push(pack.id);
      files.push({ relPath: `${TEST_ONLY_ROOT}/packs/${pack.id}.json`, contents: canonicalJson(pack) });
    } else {
      courseIds.push(pack.id);
      files.push({ relPath: `src/content/packs/${pack.id}.json`, contents: canonicalJson(pack) });
    }
  }
  files.push({ relPath: "src/content/packs/index.ts", contents: renderPacksIndex(courseIds, "../..") });
  if (testCourseIds.length > 0) {
    files.push({ relPath: `${TEST_ONLY_ROOT}/packs/index.ts`, contents: renderPacksIndex(testCourseIds, "../../..") });
  }
  files.push({ relPath: "src/content/catalog.json", contents: `${canonicalJson(buildCatalog(packs))}\n` });
  // The shipped coverage report lists shipped courses only.
  const shippedCoverage = Object.fromEntries(
    Object.entries(coverage).filter(([id]) => !testCourseIds.includes(id))
  );
  files.push({
    relPath: "content/reports/grade-targets.json",
    contents: canonicalJson({ perCourse: shippedCoverage }),
  });
  const registry = loadRegistry();
  files.push({
    relPath: "ATTRIBUTIONS.md",
    contents: renderAttributions(registry),
  });
  // In-app attributions (V1 publication): the Licenses screen renders every
  // registry entry — CC BY voices and CC BY-SA data are credited inside the
  // product, not only in the repository.
  files.push({
    relPath: "src/content/attributions.json",
    contents: canonicalJson({
      generator: "scripts/compile-content.ts",
      sources: shippedSources(registry).map((e) => ({
        id: e.id,
        name: e.name,
        kind: e.kind,
        license: e.license,
        url: e.url,
        attribution: e.attribution,
        covers: e.covers,
      })),
    }),
  });
  return { files, coverage, packs: sources, idMaps, legacyMaps };
}
