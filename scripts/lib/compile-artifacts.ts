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
import { localizeObjective, missingNativeCodes, nativeTextRecordsOf } from "./native-text";
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
 * P1c emits ONE set of rich artifacts per target language, in the native
 * language of that language's courses; per-course artifacts (a target with
 * several native languages) arrive with P2b. Until then a target's courses
 * must agree on their nativeCode.
 */
export function artifactNativeCode(lang: string, packs: LoadedPack[]): string {
  const codes = nativeCodesFor(lang, packs);
  if (codes.length !== 1) {
    throw new Error(
      `${lang}: artifacts are emitted per target language and need exactly one nativeCode across its courses, found ${codes.length ? codes.join(", ") : "none"} (per-course artifacts arrive with P2b)`
    );
  }
  return codes[0];
}

function receptionAssetKind(lang: string, packs: LoadedPack[]): ReceptionAssetKind {
  return packsForTarget(lang, packs).some((p) => p.pack.audio?.policy === "test-only") ? "wav" : "mp3";
}

function schemaFailure(label: string, e: unknown): string {
  return `${label}: schema validation failed — ${(e as Error).message.split("\n")[0]}`;
}

/** Every rule of one target language's rich sources (schema failures reported, never thrown). */
export function validateTarget(lang: string, packs: LoadedPack[]): string[] {
  const errors: string[] = [];
  const mine = packsForTarget(lang, packs);
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
        assessmentSpeech: nativeCodes.map((nativeCode) => ({ nativeCode, exercises: assessmentBankSpeechExercises(lang) })),
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
        assessmentWriting: nativeCodes.map((nativeCode) => ({ nativeCode, exercises: assessmentBankWritingExercises(lang) })),
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
  if (nativeCodes.length > 1) {
    errors.push(
      `${lang}: courses use several native languages (${nativeCodes.join(", ")}) — per-course artifacts arrive with P2b; P1c compiles one native language per target`
    );
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
function compileTarget(lang: string, packs: LoadedPack[]): { files: CompiledFile[]; dbPlan: LexiconDbPlan | null } {
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
  // The course whose sections/lessons the assessment reports count against
  // (one native language per target in P1c → one course).
  const pack: PackSource = mine[0].pack;

  let dbPlan: LexiconDbPlan | null = null;
  const lexicon = hasRichLexicon(lang) ? loadRichLexicon(lang) : null;
  if (lexicon) {
    const manifest = loadSourceManifest(lang);
    const artifacts = compileLexiconArtifacts({ lexicon, manifest, registry, nativeCode, artifactRoot: root, reportsDir });
    files.push(...artifacts.files);
    dbPlan = lexiconDbPlan({ lexicon, contentHash: artifacts.contentHash, nativeCode, testOnly });
  }

  const concepts = loadPedagogyConcepts(lang);
  if (concepts) {
    files.push({ relPath: `${root}/concepts/${lang}-concepts.json`, contents: compileConceptsArtifact(concepts, nativeCode) });
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
    files.push({
      relPath: `${reportsDir}/cefr-claim-gate.json`,
      contents: canonicalJson({
        generator: "scripts/lib/assessment-reports.ts",
        ...claimGate,
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
  }
  // Phase-9 writing tasks + the deterministic known-vocabulary set the
  // rubric engine's plausibility floor uses; reserved tasks never leave
  // the pipeline.
  const writing = loadWritingTasks(lang);
  if (writing) {
    files.push({
      relPath: `${root}/writing/${lang}-writing.json`,
      contents: compileWritingArtifact({
        writing,
        nativeCode,
        knownVocabulary: buildKnownVocabulary({ plugin, lexicon, paradigms }),
        knownVocabularyKey: KNOWN_VOCABULARY_KEYS[lang],
      }),
    });
  }
  // Phase-9 interaction scenarios — every scenario incl. reserved (the
  // checkpoint executes reserved graphs); practice surfaces filter.
  const interaction = loadInteractionScenarios(lang);
  if (interaction) {
    files.push({ relPath: `${root}/interaction/${lang}-scenarios.json`, contents: compileInteractionArtifact(interaction, nativeCode) });
  }
  return { files, dbPlan };
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
    const { files: targetFiles, dbPlan } = compileTarget(lang, loaded);
    files.push(...targetFiles);
    if (dbPlan) {
      lexiconDbs.push(dbPlan);
      const root = artifactRootFor(dbPlan.testOnly);
      (dbsByRoot[root] ??= {})[lang] = { name: dbPlan.name, contentHash: dbPlan.contentHash };
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
