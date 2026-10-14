/**
 * Pure assembly of every generated artifact (P1a, per target language
 * since P1c): validation of all sources, then the full list of (relPath,
 * contents) the compiler writes — packs, catalog, and for EVERY target
 * language that has rich sources: lexicon index/fallback, concepts,
 * assessment, reception, speech, writing, interaction, the language's
 * content/reports/*.json, plus course profiles / artifact modules and
 * ATTRIBUTIONS.md. No file is written here; `scripts/compile-content.ts`
 * writes (or drift-checks) the result and builds the SQLite databases,
 * and the compile golden test recompiles through this function to prove
 * that a refactor changed nothing observable.
 *
 * Targets are discovered from the packs and content/<code>/ folders; a
 * test-only target (every course `testOnly`) compiles into
 * src/content/test-only/** and never reaches the app bundle. Report files
 * of the language that shipped before P1c keep their historical root
 * location (content/reports/<name>.json, golden-pinned); every later
 * language reports under content/reports/<lang>/.
 */
import path from "path";

import { existsSync } from "fs";

import type { PackSource } from "../../content/schema";
import { buildPlugin } from "./languages";
import {
  assessmentSourcePath,
  collectAssessmentItemTargets,
  collectScoredItemEvidence,
  compileCheckpointsArtifact,
  compileObjectivesArtifact,
  compilePlacementArtifact,
  placementForCourse,
  hasAssessment,
  loadAttainmentPolicy,
  loadCheckpoints,
  loadClaimPolicy,
  loadCourseObjectives,
  loadPlacement,
  validateAssessment,
} from "./assessment";
import { buildCefrAlignment, buildObjectiveCoverage, evaluateClaimGate } from "./assessment-reports";
import { compileCourseProfileArtifacts, type LexiconDbInfo } from "./course-profiles";
import { deriveGenderPatterns } from "./gender-patterns";
import {
  assessmentBankInteractionExercises,
  compileInteractionArtifact,
  loadInteractionScenarios,
  validateInteraction,
} from "./interaction";
import { hasRichLexicon, loadRichLexicon, loadSourceManifest, validateLexicon } from "./lexicon";
import { compileLexiconArtifacts, lexiconDbPlan, type LexiconDbPlan } from "./lexicon-build";
import type { GenderSuffixStats } from "./lexique-derive-lib";
import { exerciseNativeFieldPaths, setPath } from "./native-fields";
import { localizeObjective, missingExerciseOverlays, missingNativeCodes, nativeTextRecordsOf } from "./native-text";
import { compileConceptsArtifact, loadParadigms, loadPedagogyConcepts, validatePedagogy } from "./pedagogy";
import {
  canonicalJson,
  compileAll,
  discoverTargets,
  isTestOnlyTarget,
  loadPacks,
  loadRegistry,
  nativeCodesFor,
  packsForTarget,
  readJson,
  safeResolve,
  targetLayers,
  TEST_ONLY_ROOT,
  validateContent,
  type CompiledFile,
  type CoverageRow,
  isEvidenceOnlyLanguageDir,
  type LoadedPack,
} from "./pipeline";
import {
  compileAudioCensus,
  compileClipAssetsModule,
  compileListeningArtifact,
  compileReadingsArtifact,
  loadClipDurations,
  loadListening,
  loadReadings,
  validateReception,
  type ReceptionAssetKind,
} from "./reception";
import { assessmentBankSpeechExercises, compileSpeechItemsArtifact, loadSpeechItems, validateSpeech } from "./speech";
import {
  assessmentBankWritingExercises,
  buildKnownVocabulary,
  compileWritingArtifact,
  loadWritingTasks,
  validateWriting,
} from "./writing";

/**
 * Languages whose report files predate P1c and stay at the historical
 * root (content/reports/<name>.json) because the P1a goldens pin them
 * there; moving them is a deliberate, told rename. Every other language
 * reports under content/reports/<lang>/.
 */
const LEGACY_REPORT_ROOT_LANGS: ReadonlySet<string> = new Set(["fr"]);

export function reportsDirFor(lang: string): string {
  return LEGACY_REPORT_ROOT_LANGS.has(lang) ? "content/reports" : `content/reports/${lang}`;
}

export function artifactRootFor(testOnly: boolean): string {
  return testOnly ? TEST_ONLY_ROOT : "src/content";
}

/** Artifact field name of the writing token set (historical "knownFrench" stays golden-pinned). */
const KNOWN_VOCABULARY_KEYS: Readonly<Record<string, string>> = { fr: "knownFrench" };

/**
 * The PRIMARY native language of a target (P2b): the smallest native code
 * among its courses (`en` for French, so every pre-P2b artifact keeps its
 * name and bytes). Its artifacts are `<lang>-*`; every other native
 * language of the target gets its own native-language artifacts named by
 * the course id (`fr-vi-*`), reports stay with the primary.
 */
export function artifactNativeCode(lang: string, packs: LoadedPack[]): string {
  const codes = nativeCodesFor(lang, packs);
  if (codes.length === 0) throw new Error(`${lang}: content/${lang}/ has no course pack`);
  return codes[0];
}

/** The (courseId, nativeCode) pairs of a target beyond its primary native language, sorted. */
export function secondaryNativeCourses(lang: string, packs: LoadedPack[]): { courseId: string; nativeCode: string }[] {
  const primary = artifactNativeCode(lang, packs);
  return packsForTarget(lang, packs)
    .filter((p) => p.pack.nativeCode !== primary)
    .map((p) => ({ courseId: p.pack.id, nativeCode: p.pack.nativeCode }))
    .sort((a, b) => a.courseId.localeCompare(b.courseId));
}

function receptionAssetKind(lang: string, packs: LoadedPack[]): ReceptionAssetKind {
  return packsForTarget(lang, packs).some((p) => p.pack.audio?.policy === "test-only") ? "wav" : "mp3";
}

function schemaFailure(label: string, e: unknown): string {
  return `${label}: schema validation failed — ${(e as Error).message.split("\n")[0]}`;
}

/**
 * P3a: a target language may exist as EVIDENCE ONLY — `content/<lang>/lexicon/`
 * holding a source manifest, the derived pools and a review sheet, but no
 * authored lexemes and no course pack (English until P4f). Such a language
 * has nothing to compile and nothing learner-facing to validate; any other
 * rich layer without a course pack is an error.
 */
export function isEvidenceOnlyTarget(lang: string, packs: LoadedPack[]): boolean {
  return packsForTarget(lang, packs).length === 0 && isEvidenceOnlyLanguageDir(lang);
}

/** Every rule of one target language's rich sources (schema failures reported, never thrown). */
export function validateTarget(lang: string, packs: LoadedPack[]): string[] {
  const errors: string[] = [];
  const mine = packsForTarget(lang, packs);
  if (mine.length === 0) {
    if (isEvidenceOnlyTarget(lang, packs)) {
      // Only the manifest's shape is checked (fail-closed pins); nothing else exists yet.
      try {
        loadSourceManifest(lang);
      } catch (e) {
        errors.push(schemaFailure(`${lang} source manifest`, e));
      }
      return errors;
    }
    return [`${lang}: content/${lang}/ has rich sources but no course pack (content/courses/${lang}-<native>.json)`];
  }
  const nativeCodes = nativeCodesFor(lang, packs);
  const plugin = buildPlugin(lang);
  const layers = targetLayers(lang);

  errors.push(...validateLexicon(lang, packs).errors);
  errors.push(...validatePedagogy(lang, packs).errors);
  errors.push(...validateAssessment(lang, packs).errors);

  let lexemeIds = new Set<string>();
  let lexicon = null as ReturnType<typeof loadRichLexicon> | null;
  try {
    lexicon = hasRichLexicon(lang) ? loadRichLexicon(lang) : null;
    lexemeIds = new Set((lexicon?.lexemes ?? []).map((l) => l.id));
  } catch {
    // reported by validateLexicon
  }
  let objectives = null as ReturnType<typeof loadCourseObjectives> | null;
  try {
    objectives = hasAssessment(lang) ? loadCourseObjectives(lang) : null;
  } catch {
    // reported by validateAssessment
  }
  let listening = null as ReturnType<typeof loadListening>;
  let readings = null as ReturnType<typeof loadReadings>;
  try {
    listening = loadListening(lang);
    readings = loadReadings(lang);
    errors.push(
      ...validateReception({
        lang,
        readings,
        listening,
        objectives,
        lexemeIds,
        packs: mine.map((p) => p.pack),
        assetKind: receptionAssetKind(lang, packs),
      }).errors
    );
  } catch (e) {
    errors.push(schemaFailure("reception", e));
  }
  if (layers.reception && readings === null && listening === null) {
    errors.push(`reception: content/${lang}/reception exists but has neither reading.json nor listening.json`);
  }
  let speech = null as ReturnType<typeof loadSpeechItems>;
  try {
    speech = loadSpeechItems(lang);
    errors.push(
      ...validateSpeech({
        lang,
        speech,
        objectives,
        listening,
        lexemeIds,
        packs: mine.map((p) => p.pack),
        assessmentSpeech: nativeCodes.map((nativeCode) => ({ nativeCode, exercises: assessmentBankSpeechExercises(lang, nativeCode) })),
        plugin,
      }).errors
    );
  } catch (e) {
    errors.push(schemaFailure("speech", e));
  }
  let writing = null as ReturnType<typeof loadWritingTasks>;
  try {
    writing = loadWritingTasks(lang);
    let paradigms = null as ReturnType<typeof loadParadigms>;
    try {
      paradigms = layers.pedagogy ? loadParadigms(lang, plugin) : null;
    } catch {
      // reported by validatePedagogy
    }
    errors.push(
      ...validateWriting({
        lang,
        writing,
        objectives,
        lexemeIds,
        knownVocabulary: new Set(buildKnownVocabulary({ plugin, lexicon, paradigms })),
        nativeCodes,
        packs: mine.map((p) => p.pack),
        assessmentWriting: nativeCodes.map((nativeCode) => ({ nativeCode, exercises: assessmentBankWritingExercises(lang, nativeCode) })),
        plugin,
      }).errors
    );
  } catch (e) {
    errors.push(schemaFailure("writing", e));
  }
  let interaction = null as ReturnType<typeof loadInteractionScenarios>;
  try {
    interaction = loadInteractionScenarios(lang);
    errors.push(
      ...validateInteraction({
        lang,
        interaction,
        objectives,
        listening,
        packs: mine.map((p) => p.pack),
        assessmentInteraction: assessmentBankInteractionExercises(lang),
        plugin,
      }).errors
    );
  } catch (e) {
    errors.push(schemaFailure("interaction", e));
  }

  // Native-language completeness (P1c): every native text record carries
  // every nativeCode a course of this language uses — the compiler would
  // otherwise fail closed on the first missing one.
  let concepts = null as ReturnType<typeof loadPedagogyConcepts>;
  try {
    concepts = loadPedagogyConcepts(lang);
  } catch {
    // reported by validatePedagogy
  }
  const safe = <T>(load: () => T): T | null => {
    try {
      return load();
    } catch {
      return null;
    }
  };
  errors.push(
    ...missingNativeCodes(
      nativeTextRecordsOf({
        lexicon,
        concepts,
        paradigms: layers.pedagogy ? safe(() => loadParadigms(lang, plugin)) : null,
        objectives,
        checkpoints: hasAssessment(lang) ? safe(() => loadCheckpoints(lang)) : null,
        placement: hasAssessment(lang) ? safe(() => loadPlacement(lang)) : null,
        readings,
        speech,
        writing,
        interaction,
      }),
      nativeCodes
    ).map((m) => `native-text (${lang}): ${m}`)
  );
  // P2b: assessment item payloads need a complete overlay for every
  // secondary native language, and a secondary-native course must mirror
  // its primary course exercise for exercise (content/courses/<id>.map.json).
  if (hasAssessment(lang)) {
    const checkpoints = safe(() => loadCheckpoints(lang));
    const placement = safe(() => loadPlacement(lang));
    if (checkpoints) {
      errors.push(
        ...missingExerciseOverlays(checkpoints.checkpoints.flatMap((cp) => cp.items), checkpoints.exerciseNativeCode, nativeCodes).map((m) => `assessment (${lang}): ${m}`)
      );
    }
    if (placement) {
      errors.push(
        ...missingExerciseOverlays(placement.stages.flatMap((s) => s.clusters.flatMap((c) => c.items)), placement.exerciseNativeCode, nativeCodes).map((m) => `placement (${lang}): ${m}`)
      );
    }
  }
  errors.push(...validateSecondaryNativeCourses(lang, packs));
  return errors;
}

/**
 * Cross-course consistency (P2b): a course in a secondary native language
 * is the SAME course in another native language — same sections, units,
 * lessons, objectives and exercise types, exercise for exercise through its
 * `<id>.map.json`; only native-language fields may differ.
 */
export function validateSecondaryNativeCourses(lang: string, packs: LoadedPack[]): string[] {
  const errors: string[] = [];
  const primary = artifactNativeCode(lang, packs);
  const primaryPack = packsForTarget(lang, packs).find((p) => p.pack.nativeCode === primary)?.pack;
  if (!primaryPack) return errors;
  for (const { courseId } of secondaryNativeCourses(lang, packs)) {
    const mine = packsForTarget(lang, packs).find((p) => p.pack.id === courseId)?.pack;
    const mapRel = `content/courses/${courseId}.map.json`;
    if (!mine) continue;
    if (!existsSync(safeResolve(mapRel))) {
      errors.push(`${courseId}: missing ${mapRel} (exercise id map to ${primaryPack.id})`);
      continue;
    }
    const mapDoc = readJson(mapRel) as { source?: string; exercises?: Record<string, string> };
    const map = mapDoc.exercises ?? {};
    if (mapDoc.source !== primaryPack.id) errors.push(`${courseId}: ${mapRel} maps to ${mapDoc.source ?? "?"}, expected ${primaryPack.id}`);
    const primaryExercises = new Map<string, Record<string, unknown>>();
    primaryPack.sections.forEach((s) => s.units.forEach((u) => u.lessons.forEach((l) => l.exercises.forEach((e) => primaryExercises.set(e.id, e as Record<string, unknown>)))));
    if (mine.sections.length !== primaryPack.sections.length) errors.push(`${courseId}: ${mine.sections.length} sections, ${primaryPack.id} has ${primaryPack.sections.length}`);
    mine.sections.forEach((section, s) => {
      const ps = primaryPack.sections[s];
      if (!ps) return;
      if (section.id !== ps.id) errors.push(`${courseId}: section ${s} id ${section.id} ≠ ${ps.id}`);
      if (section.units.length !== ps.units.length) errors.push(`${courseId}: section ${section.id} has ${section.units.length} units, ${primaryPack.id} has ${ps.units.length}`);
      section.units.forEach((unit, u) => {
        const pu = ps.units[u];
        if (!pu) return;
        if (unit.id !== pu.id) errors.push(`${courseId}: unit ${unit.id} ≠ ${pu.id}`);
        if (unit.words.length !== pu.words.length || unit.words.some((w, i) => w.target !== pu.words[i]?.target)) errors.push(`${courseId}: unit ${unit.id} words differ from ${primaryPack.id}`);
        if (unit.lessons.length !== pu.lessons.length) errors.push(`${courseId}: unit ${unit.id} has ${unit.lessons.length} lessons, ${primaryPack.id} has ${pu.lessons.length}`);
        unit.lessons.forEach((lesson, l) => {
          const pl = pu.lessons[l];
          if (!pl) return;
          if (JSON.stringify(lesson.objectives ?? null) !== JSON.stringify(pl.objectives ?? null)) errors.push(`${courseId}: lesson ${lesson.id} objectives differ from ${pl.id}`);
          if (lesson.exercises.length !== pl.exercises.length) errors.push(`${courseId}: lesson ${lesson.id} has ${lesson.exercises.length} exercises, ${pl.id} has ${pl.exercises.length}`);
          lesson.exercises.forEach((e, x) => {
            const mappedId = map[e.id];
            const pe = pl.exercises[x] as Record<string, unknown> | undefined;
            if (mappedId === undefined) {
              errors.push(`${courseId}: ${e.id} is not in ${mapRel}`);
              return;
            }
            if (!pe || pe.id !== mappedId) {
              errors.push(`${courseId}: ${e.id} maps to ${mappedId} but position ${x} of ${pl.id} is ${pe?.id ?? "missing"}`);
              return;
            }
            const nativePaths = new Set(exerciseNativeFieldPaths(e as Record<string, unknown>));
            // Native-language fields are blanked; token/answer arrays whose
            // LENGTH legitimately differs between languages (word banks,
            // typed answers and their alternatives) are dropped whole.
            const stripNative = (ex: Record<string, unknown>) => {
              let out: Record<string, unknown> = { ...ex, id: "" };
              for (const p of nativePaths) {
                const top = p.split(".")[0];
                if (top === "tokens" || top === "answer" || top === "alternatives") delete out[top];
                else out = setPath(out, p, "");
              }
              return out;
            };
            if (JSON.stringify(stripNative(e as Record<string, unknown>)) !== JSON.stringify(stripNative(pe))) {
              errors.push(`${courseId}: ${e.id} differs from ${mappedId} outside its native-language fields`);
            }
          });
        });
      });
    });
    const mapped = new Set(Object.values(map));
    for (const id of primaryExercises.keys()) if (!mapped.has(id)) errors.push(`${courseId}: ${primaryPack.id} exercise ${id} has no counterpart in ${mapRel}`);
  }
  return errors;
}

/** Every validator's errors, in the compiler's order. Empty = sources are valid. */
export function validateAllSources(): string[] {
  const packs = loadPacks();
  const errors = [...validateContent().errors];
  for (const lang of discoverTargets(packs)) errors.push(...validateTarget(lang, packs));
  return errors;
}

export type CompiledArtifacts = {
  /** Every text artifact, in write order. The SQLite databases are NOT here (binary). */
  files: CompiledFile[];
  coverage: Record<string, CoverageRow>;
  /** One SQLite build plan per target language with a rich lexicon. */
  lexiconDbs: LexiconDbPlan[];
};

/** Rich artifacts + reports of ONE target language. */
function compileTarget(lang: string, packs: LoadedPack[]): { files: CompiledFile[]; dbPlans: LexiconDbPlan[] } {
  const files: CompiledFile[] = [];
  const mine = packsForTarget(lang, packs);
  if (mine.length === 0) throw new Error(`${lang}: content/${lang}/ has no course pack`);
  const nativeCode = artifactNativeCode(lang, packs);
  const testOnly = isTestOnlyTarget(lang, packs);
  const root = artifactRootFor(testOnly);
  const reportsDir = reportsDirFor(lang);
  const plugin = buildPlugin(lang);
  const layers = targetLayers(lang);
  const registry = loadRegistry();
  // The course whose sections/lessons the assessment reports count against:
  // the primary-native course (reports are target-level facts; a secondary
  // native course mirrors it exercise for exercise — validated).
  const pack: PackSource = mine.find((p) => p.pack.nativeCode === nativeCode)?.pack ?? mine[0].pack;

  const dbPlans: LexiconDbPlan[] = [];
  const lexicon = hasRichLexicon(lang) ? loadRichLexicon(lang) : null;
  if (lexicon) {
    const manifest = loadSourceManifest(lang);
    const artifacts = compileLexiconArtifacts({ lexicon, manifest, registry, nativeCode, artifactRoot: root, reportsDir });
    files.push(...artifacts.files);
    dbPlans.push(lexiconDbPlan({ lexicon, contentHash: artifacts.contentHash, nativeCode, testOnly }));
    // Secondary native languages (P2b): their own index, fallback and database.
    for (const { courseId, nativeCode: code } of secondaryNativeCourses(lang, packs)) {
      const secondary = compileLexiconArtifacts({ lexicon, manifest, registry, nativeCode: code, artifactRoot: root, reportsDir: null, artifactPrefix: courseId });
      files.push(...secondary.files);
      dbPlans.push(lexiconDbPlan({ lexicon, contentHash: secondary.contentHash, nativeCode: code, testOnly, assetPrefix: courseId }));
    }
  }

  const concepts = loadPedagogyConcepts(lang);
  if (concepts) {
    files.push({ relPath: `${root}/concepts/${lang}-concepts.json`, contents: compileConceptsArtifact(concepts, nativeCode) });
    for (const { courseId, nativeCode: code } of secondaryNativeCourses(lang, packs)) {
      files.push({ relPath: `${root}/concepts/${courseId}-concepts.json`, contents: compileConceptsArtifact(concepts, code) });
    }
  }
  const paradigms = layers.pedagogy ? loadParadigms(lang, plugin) : null;

  // §51–53 committed pattern report: every statistically-derived pattern from
  // the real noun-lemma population (the curriculum teaches a curated subset;
  // this report is the honest full record the curation draws from).
  const genderStatsRel = `content/${lang}/lexicon/derived/gender-suffix-stats.json`;
  if (existsSync(safeResolve(genderStatsRel))) {
    const genderStats = readJson(genderStatsRel) as GenderSuffixStats & { source: { sha256: string } };
    files.push({
      relPath: `${reportsDir}/gender-patterns.json`,
      contents: canonicalJson({
        source: genderStats.source,
        generator: "scripts/lib/gender-patterns.ts",
        thresholds: { minLemmas: 100, minReliabilityPct: 90, almostAlwaysPct: 99 },
        population: genderStats.population,
        patterns: deriveGenderPatterns(genderStats),
      }),
    });
  }

  // §131-135 assessment reports: objective coverage, CEFR alignment, and the
  // overall-level claim gate — deterministic content-only artifacts.
  if (hasAssessment(lang)) {
    const objectivesDoc = loadCourseObjectives(lang);
    const policy = loadClaimPolicy(lang);
    const checkpointsRel = assessmentSourcePath(lang, "checkpoints");
    const placementRel = assessmentSourcePath(lang, "placement");
    files.push({
      relPath: `${reportsDir}/course-objective-coverage.json`,
      contents: canonicalJson({
        generator: "scripts/lib/assessment-reports.ts",
        objectives: buildObjectiveCoverage({
          objectives: objectivesDoc.objectives.map((o) => localizeObjective(o, nativeCode)),
          pack,
          concepts: concepts?.concepts ?? [],
          checkpointItemTargets: collectAssessmentItemTargets(checkpointsRel, "checkpoints"),
          placementItemTargets: collectAssessmentItemTargets(placementRel, "stages"),
        }),
      }),
    });
    files.push({
      relPath: `${reportsDir}/cefr-alignment.json`,
      contents: canonicalJson({
        generator: "scripts/lib/assessment-reports.ts",
        ...buildCefrAlignment(objectivesDoc.objectives),
      }),
    });
    files.push({
      relPath: `${root}/assessment/${lang}-objectives.json`,
      contents: compileObjectivesArtifact(objectivesDoc, nativeCode),
    });
    const checkpoints = loadCheckpoints(lang);
    files.push({
      relPath: `${root}/assessment/${lang}-checkpoints.json`,
      contents: compileCheckpointsArtifact(checkpoints, nativeCode),
    });
    for (const { courseId, nativeCode: code } of secondaryNativeCourses(lang, packs)) {
      files.push({ relPath: `${root}/assessment/${courseId}-objectives.json`, contents: compileObjectivesArtifact(objectivesDoc, code) });
      files.push({ relPath: `${root}/assessment/${courseId}-checkpoints.json`, contents: compileCheckpointsArtifact(checkpoints, code) });
    }
    files.push({
      relPath: `${reportsDir}/checkpoint-coverage.json`,
      contents: canonicalJson({
        generator: "scripts/lib/assessment-reports.ts",
        checkpoints: checkpoints.checkpoints.map((cp) => ({
          id: cp.id,
          checkpointVersion: cp.checkpointVersion,
          sectionId: cp.sectionId,
          itemCount: cp.items.length,
          criteria: cp.criteria,
          objectives: Object.fromEntries(
            [...cp.items.reduce((m, item) => {
              for (const oid of item.objectiveTargets) m.set(oid, (m.get(oid) ?? 0) + 1);
              return m;
            }, new Map<string, number>()).entries()].sort(([a], [b]) => a.localeCompare(b))
          ),
        })),
      }),
    });
    const claimGate = evaluateClaimGate({
      objectives: objectivesDoc.objectives,
      policy,
      checkpointItems: collectScoredItemEvidence(checkpointsRel, "checkpoints", lang),
    });
    // The gate is a TARGET-language fact (the assessment system is the
    // target corpus); every course of the target inherits it (P2b).
    const courseCoverage = mine
      .map((p) => p.pack.id)
      .sort()
      .map((courseId) => ({ courseId, nativeCode: mine.find((p) => p.pack.id === courseId)?.pack.nativeCode ?? "", inherits: true }));
    files.push({
      relPath: `${reportsDir}/cefr-claim-gate.json`,
      contents: canonicalJson({
        generator: "scripts/lib/assessment-reports.ts",
        ...claimGate,
        ...(courseCoverage.length > 1 ? { courses: courseCoverage } : {}),
      }),
    });
    // Phase 10 Gate 2: the LEARNER-attainment denominator — the authored
    // per-domain list of objectives a learner must demonstrate. Shipped as
    // data so the runtime estimate can never invent its own rule.
    const attainment = loadAttainmentPolicy(lang);
    files.push({
      relPath: `${root}/assessment/${lang}-attainment.json`,
      contents: canonicalJson({
        generator: "scripts/compile-content.ts",
        level: attainment.level,
        domains: attainment.domains.map((d) => ({
          domain: d.domain,
          requiredObjectiveIds: [...d.requiredObjectiveIds].sort(),
        })),
      }),
    });
    // P9 §45-§47: the COURSE-claimability half of the claim split, as a tiny
    // runtime artifact — whether this course's reserved assessment system
    // covers each evaluated level, plus the exact non-certification wording.
    // The LEARNER half derives at runtime from the learner's own attempts.
    files.push({
      relPath: `${root}/assessment/${lang}-claim.json`,
      contents: canonicalJson({
        generator: "scripts/compile-content.ts",
        claimWording: policy.claimWording,
        levels: claimGate.levels.map((level) => ({
          level: level.level,
          courseClaimable: level.claimable,
          unassessedDomains: level.unassessedDomains,
        })),
      }),
    });
    const placement = loadPlacement(lang);
    files.push({
      relPath: `${root}/assessment/${lang}-placement.json`,
      contents: compilePlacementArtifact(placement, nativeCode),
    });
    for (const { courseId, nativeCode: code } of secondaryNativeCourses(lang, packs)) {
      files.push({
        relPath: `${root}/assessment/${courseId}-placement.json`,
        contents: compilePlacementArtifact(placementForCourse(placement, pack.id, courseId), code),
      });
    }
    files.push({
      relPath: `${reportsDir}/placement-coverage.json`,
      contents: canonicalJson({
        generator: "scripts/lib/assessment-reports.ts",
        placementVersion: placement.placementVersion,
        maxItems: placement.maxItems,
        totalItems: placement.stages.reduce(
          (n, s) => n + s.clusters.reduce((m, c) => m + c.items.length, 0),
          0
        ),
        allComfortableLessonId: placement.allComfortableLessonId,
        stages: placement.stages.map((s) => ({
          id: s.id,
          clusters: s.clusters.map((c) => ({
            id: c.id,
            objectiveId: c.objectiveId,
            anchorLessonId: c.anchorLessonId,
            itemCount: c.items.length,
          })),
        })),
        objectivesNotProbed: objectivesDoc.objectives
          .map((o) => o.id)
          .filter(
            (oid) =>
              !placement.stages.some((s) => s.clusters.some((c) => c.objectiveId === oid))
          )
          .sort((a, b) => a.localeCompare(b)),
      }),
    });
  }

  // Phase-7 reception artifacts — emitted once the sources exist (P7 §43).
  const readings = loadReadings(lang);
  if (readings) {
    files.push({ relPath: `${root}/reception/${lang}-reading.json`, contents: compileReadingsArtifact(readings, nativeCode) });
    for (const { courseId, nativeCode: code } of secondaryNativeCourses(lang, packs)) {
      files.push({ relPath: `${root}/reception/${courseId}-reading.json`, contents: compileReadingsArtifact(readings, code) });
    }
  }
  const listening = loadListening(lang);
  if (listening) {
    const assetKind = receptionAssetKind(lang, packs);
    files.push({
      relPath: `${root}/reception/${lang}-listening.json`,
      contents: compileListeningArtifact(listening, loadClipDurations(`${reportsDir}/reception-audio-quality.json`)),
    });
    files.push({
      relPath: `${root}/reception/${lang}-clip-assets.ts`,
      contents: compileClipAssetsModule(listening, path.posix.relative(`${root}/reception`, "."), assetKind),
    });
    files.push({ relPath: `${reportsDir}/reception-audio-census.json`, contents: compileAudioCensus(listening, assetKind) });
  }
  // Phase-8 speech items; reserved items never leave the pipeline.
  const speech = loadSpeechItems(lang);
  if (speech) {
    files.push({ relPath: `${root}/speech/${lang}-speech-items.json`, contents: compileSpeechItemsArtifact(speech, nativeCode) });
    for (const { courseId, nativeCode: code } of secondaryNativeCourses(lang, packs)) {
      files.push({ relPath: `${root}/speech/${courseId}-speech-items.json`, contents: compileSpeechItemsArtifact(speech, code) });
    }
  }
  // Phase-9 writing tasks + the deterministic known-vocabulary set the
  // rubric engine's plausibility floor uses; reserved tasks never leave
  // the pipeline.
  const writing = loadWritingTasks(lang);
  if (writing) {
    const knownVocabulary = buildKnownVocabulary({ plugin, lexicon, paradigms });
    files.push({
      relPath: `${root}/writing/${lang}-writing.json`,
      contents: compileWritingArtifact({ writing, nativeCode, knownVocabulary, knownVocabularyKey: KNOWN_VOCABULARY_KEYS[lang] }),
    });
    for (const { courseId, nativeCode: code } of secondaryNativeCourses(lang, packs)) {
      files.push({
        relPath: `${root}/writing/${courseId}-writing.json`,
        contents: compileWritingArtifact({ writing, nativeCode: code, knownVocabulary, knownVocabularyKey: KNOWN_VOCABULARY_KEYS[lang] }),
      });
    }
  }
  // Phase-9 interaction scenarios — every scenario incl. reserved (the
  // checkpoint executes reserved graphs); practice surfaces filter.
  const interaction = loadInteractionScenarios(lang);
  if (interaction) {
    files.push({ relPath: `${root}/interaction/${lang}-scenarios.json`, contents: compileInteractionArtifact(interaction, nativeCode) });
    for (const { courseId, nativeCode: code } of secondaryNativeCourses(lang, packs)) {
      files.push({ relPath: `${root}/interaction/${courseId}-scenarios.json`, contents: compileInteractionArtifact(interaction, code) });
    }
  }
  return { files, dbPlans };
}

/**
 * Assemble every generated text artifact in memory. Sources are NOT
 * validated here (call `validateAllSources()` first, as the compiler does).
 */
export function compileAllArtifacts(): CompiledArtifacts {
  const loaded = loadPacks();
  const { files, coverage, packs, idMaps } = compileAll(loaded);
  const lexiconDbs: LexiconDbPlan[] = [];
  const dbsByRoot: Record<string, Record<string, LexiconDbInfo>> = {};
  for (const lang of discoverTargets(loaded)) {
    if (isEvidenceOnlyTarget(lang, loaded)) continue;
    const { files: targetFiles, dbPlans } = compileTarget(lang, loaded);
    files.push(...targetFiles);
    for (const dbPlan of dbPlans) {
      lexiconDbs.push(dbPlan);
      const root = artifactRootFor(dbPlan.testOnly);
      (dbsByRoot[root] ??= {})[dbPlan.assetPrefix] = { name: dbPlan.name, contentHash: dbPlan.contentHash };
    }
  }

  // P1b: course profiles, id registries, per-course artifact modules, db
  // assets and flags — derived from everything emitted above, once for the
  // shipped courses and once for the test-only ones.
  for (const testOnly of [false, true]) {
    const root = artifactRootFor(testOnly);
    const group = packs.filter((p) => (p.testOnly === true) === testOnly);
    if (group.length === 0) continue;
    const profileArtifacts = compileCourseProfileArtifacts({
      packs: group,
      files,
      lexiconDbs: dbsByRoot[root] ?? {},
      idMaps: Object.fromEntries(Object.entries(idMaps).filter(([code]) => group.some((p) => p.targetCode === code))),
      artifactRoot: root,
    });
    files.push(...profileArtifacts.files);
  }

  return { files, coverage, lexiconDbs };
}
