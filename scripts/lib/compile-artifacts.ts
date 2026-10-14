/**
 * Pure assembly of every generated artifact (P1a): validation of all
 * sources, then the full list of (relPath, contents) the compiler writes —
 * packs, lexicon index/fallback/db-asset module, concepts, assessment,
 * reception, speech, writing, interaction, every content/reports/*.json,
 * ATTRIBUTIONS.md. No file is written here; `scripts/compile-content.ts`
 * writes (or drift-checks) the result and builds the SQLite database, and
 * the compile golden test recompiles through this function to prove that a
 * refactor changed nothing observable.
 *
 * Extracted verbatim from compile-content.ts; behaviour is unchanged.
 */
import type { RichLexicon } from "../../content/schema";
import { validateLexicon, loadRichLexicon, loadSourceManifest } from "./lexicon";
import { deriveGenderPatterns } from "./gender-patterns";
import type { GenderSuffixStats } from "./lexique-derive-lib";
import { CONCEPTS_ARTIFACT, compileConceptsArtifact, loadPedagogyConcepts, validatePedagogy } from "./pedagogy";
import {
  collectAssessmentItemTargets,
  collectScoredItemEvidence,
  compileCheckpointsArtifact,
  compileObjectivesArtifact,
  compilePlacementArtifact,
  loadAttainmentPolicy,
  loadCheckpoints,
  loadClaimPolicy,
  loadCourseObjectives,
  loadPlacement,
  validateAssessment,
} from "./assessment";
import { buildCefrAlignment, buildObjectiveCoverage, evaluateClaimGate } from "./assessment-reports";
import {
  compileAudioCensus,
  compileClipAssetsModule,
  compileListeningArtifact,
  compileReadingsArtifact,
  loadClipDurations,
  loadListening,
  loadReadings,
  validateReception,
} from "./reception";
import {
  assessmentBankInteractionExercises,
  compileInteractionArtifact,
  loadInteractionScenarios,
  validateInteraction,
} from "./interaction";
import { assessmentBankWritingExercises, compileWritingArtifact, loadWritingTasks, validateWriting } from "./writing";
import { assessmentBankSpeechExercises, compileSpeechItemsArtifact, loadSpeechItems, validateSpeech } from "./speech";
import { PackSchema } from "../../content/schema";
import { compileCourseProfileArtifacts } from "./course-profiles";
import { compileLexiconArtifacts, dbAssetName } from "./lexicon-build";
import {
  canonicalJson,
  compileAll,
  loadRegistry,
  readJson,
  validateContent,
  type CompiledFile,
  type CoverageRow,
} from "./pipeline";

/** Every validator's errors, in the compiler's order. Empty = sources are valid. */
export function validateAllSources(): string[] {
  return [
    ...validateContent().errors,
    ...validateLexicon().errors,
    ...validatePedagogy().errors,
    ...validateAssessment().errors,
    ...validateReception({
      readings: loadReadings(),
      listening: loadListening(),
      objectives: loadCourseObjectives(),
      lexemeIds: new Set(loadRichLexicon().lexemes.map((l) => l.id)),
      frPack: readJson("content/courses/fr-en.json") as never,
    }).errors,
    ...validateSpeech({
      speech: loadSpeechItems(),
      objectives: loadCourseObjectives(),
      listening: loadListening(),
      lexemeIds: new Set(loadRichLexicon().lexemes.map((l) => l.id)),
      frPack: readJson("content/courses/fr-en.json") as never,
      assessmentSpeech: assessmentBankSpeechExercises(),
    }).errors,
    ...validateWriting({
      writing: loadWritingTasks(),
      objectives: loadCourseObjectives(),
      lexemeIds: new Set(loadRichLexicon().lexemes.map((l) => l.id)),
      frPack: readJson("content/courses/fr-en.json") as never,
      assessmentWriting: assessmentBankWritingExercises(),
    }).errors,
    ...validateInteraction({
      interaction: loadInteractionScenarios(),
      objectives: loadCourseObjectives(),
      listening: loadListening(),
      frPack: readJson("content/courses/fr-en.json") as never,
      assessmentInteraction: assessmentBankInteractionExercises(),
    }).errors,
  ];
}

export type CompiledArtifacts = {
  /** Every text artifact, in write order. The SQLite db is NOT here (binary). */
  files: CompiledFile[];
  coverage: Record<string, CoverageRow>;
  lexicon: RichLexicon;
  /** Inputs the SQLite build needs (`buildSqliteDb`). */
  lexiconContentHash: string;
  dbName: string;
};

/**
 * Assemble every generated text artifact in memory. Sources are NOT
 * validated here (call `validateAllSources()` first, as the compiler does).
 */
export function compileAllArtifacts(): CompiledArtifacts {
  const { files, coverage, packs, idMaps } = compileAll();
  const lexicon = loadRichLexicon();
  const lexiconArtifacts = compileLexiconArtifacts(lexicon, loadSourceManifest(), loadRegistry());
  files.push(...lexiconArtifacts.files);
  files.push({ relPath: CONCEPTS_ARTIFACT, contents: compileConceptsArtifact(loadPedagogyConcepts()) });

  // §51–53 committed pattern report: every statistically-derived pattern from
  // the real noun-lemma population (the curriculum teaches a curated subset;
  // this report is the honest full record the curation draws from).
  {
    const genderStats = readJson("content/fr/lexicon/derived/gender-suffix-stats.json") as GenderSuffixStats & {
      source: { sha256: string };
    };
    files.push({
      relPath: "content/reports/gender-patterns.json",
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
  // overall-level claim gate — deterministic content-only artifacts. The
  // checkpoint/placement item-target lists come from the authored assessment
  // content when present (empty arrays until those banks exist).
  {
    const objectivesDoc = loadCourseObjectives();
    const policy = loadClaimPolicy();
    const frPack = PackSchema.parse(readJson("content/courses/fr-en.json"));
    const concepts = loadPedagogyConcepts().concepts;
    const checkpointItemTargets = collectAssessmentItemTargets("content/fr/assessment/checkpoints.json", "checkpoints");
    const placementItemTargets = collectAssessmentItemTargets("content/fr/assessment/placement.json", "stages");
    files.push({
      relPath: "content/reports/course-objective-coverage.json",
      contents: canonicalJson({
        generator: "scripts/lib/assessment-reports.ts",
        objectives: buildObjectiveCoverage({
          objectives: objectivesDoc.objectives,
          frPack,
          concepts,
          checkpointItemTargets,
          placementItemTargets,
        }),
      }),
    });
    files.push({
      relPath: "content/reports/cefr-alignment.json",
      contents: canonicalJson({
        generator: "scripts/lib/assessment-reports.ts",
        ...buildCefrAlignment(objectivesDoc.objectives),
      }),
    });
    files.push({
      relPath: "src/content/assessment/fr-objectives.json",
      contents: compileObjectivesArtifact(objectivesDoc),
    });
    const checkpoints = loadCheckpoints();
    files.push({
      relPath: "src/content/assessment/fr-checkpoints.json",
      contents: compileCheckpointsArtifact(checkpoints),
    });
    files.push({
      relPath: "content/reports/checkpoint-coverage.json",
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
      checkpointItems: collectScoredItemEvidence(
        "content/fr/assessment/checkpoints.json",
        "checkpoints"
      ),
    });
    files.push({
      relPath: "content/reports/cefr-claim-gate.json",
      contents: canonicalJson({
        generator: "scripts/lib/assessment-reports.ts",
        ...claimGate,
      }),
    });
    // P9 §45-§47: the COURSE-claimability half of the claim split, as a tiny
    // runtime artifact — whether this course's reserved assessment system
    // covers each evaluated level, plus the exact non-certification wording.
    // The LEARNER half derives at runtime from the learner's own attempts.
    // Phase 10 Gate 2: the LEARNER-attainment denominator — the authored
    // per-domain list of objectives a learner must demonstrate. Shipped as
    // data so the runtime estimate can never invent its own rule.
    const attainment = loadAttainmentPolicy();
    files.push({
      relPath: "src/content/assessment/fr-attainment.json",
      contents: canonicalJson({
        generator: "scripts/compile-content.ts",
        level: attainment.level,
        domains: attainment.domains.map((d) => ({
          domain: d.domain,
          requiredObjectiveIds: [...d.requiredObjectiveIds].sort(),
        })),
      }),
    });
    files.push({
      relPath: "src/content/assessment/fr-claim.json",
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
    const placement = loadPlacement();
    files.push({
      relPath: "src/content/assessment/fr-placement.json",
      contents: compilePlacementArtifact(placement),
    });
    // Phase-7 reception artifacts — emitted once the sources exist (P7 §43).
    const readings = loadReadings();
    if (readings) {
      files.push({
        relPath: "src/content/reception/fr-reading.json",
        contents: compileReadingsArtifact(readings),
      });
    }
    const listening = loadListening();
    if (listening) {
      files.push({
        relPath: "src/content/reception/fr-listening.json",
        contents: compileListeningArtifact(listening, loadClipDurations()),
      });
      files.push({
        relPath: "src/content/reception/fr-clip-assets.ts",
        contents: compileClipAssetsModule(listening),
      });
      files.push({
        relPath: "content/reports/reception-audio-census.json",
        contents: compileAudioCensus(listening),
      });
    }
    // Phase-8 speech items — always emitted (empty until authored) so the
    // app's static import exists; reserved items never leave the pipeline.
    files.push({
      relPath: "src/content/speech/fr-speech-items.json",
      contents: compileSpeechItemsArtifact(loadSpeechItems()),
    });
    // Phase-9 writing tasks + the deterministic known-French vocabulary the
    // rubric engine's plausibility floor uses; reserved tasks never leave
    // the pipeline.
    files.push({
      relPath: "src/content/writing/fr-writing.json",
      contents: compileWritingArtifact(loadWritingTasks()),
    });
    // Phase-9 interaction scenarios — every scenario incl. reserved (the
    // checkpoint executes reserved graphs); practice surfaces filter.
    files.push({
      relPath: "src/content/interaction/fr-scenarios.json",
      contents: compileInteractionArtifact(loadInteractionScenarios()),
    });
    files.push({
      relPath: "content/reports/placement-coverage.json",
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

  // P1b: course profiles, id registries, per-course artifact modules, db
  // assets and flags — derived from everything emitted above.
  const dbName = dbAssetName(lexiconArtifacts.contentHash);
  const profileArtifacts = compileCourseProfileArtifacts({
    packs,
    files,
    lexiconDbs: { [lexicon.language]: { name: dbName, contentHash: lexiconArtifacts.contentHash } },
    idMaps,
  });
  files.push(...profileArtifacts.files);

  return {
    files,
    coverage,
    lexicon,
    lexiconContentHash: lexiconArtifacts.contentHash,
    dbName,
  };
}
