/**
 * Phase 6 assessment pipeline: course objectives, CEFR alignments, claim
 * policy — loading, graph validation (§25, §143) and the honesty
 * invariants that keep alignments defensible (§166).
 */

import {
  CheckpointsSchema,
  ClaimPolicySchema,
  CourseObjectivesSchema,
  PackSchema,
  PlacementSchema,
  type Checkpoint,
  type Checkpoints,
  type ClaimPolicy,
  type Conjugations,
  type CourseObjective,
  type CourseObjectives,
  type PackSource,
  type PlacementContent,
} from "../../content/schema";
import { loadConjugations, loadPedagogyConcepts } from "./pedagogy";
import { listCourseSources, readJson, validateExercise, type ValidationResult } from "./pipeline";
import { readFileSync } from "fs";

export const OBJECTIVES_SOURCE = "content/fr/assessment/objectives.json";
export const CLAIM_POLICY_SOURCE = "content/fr/assessment/claim-policy.json";
export const ASSESSMENT_RESEARCH = "content/fr/assessment/RESEARCH.md";

/**
 * The sourceRef register (must each be documented in RESEARCH.md). An
 * alignment referencing an unregistered key fails validation — provenance
 * is a first-class content rule, exactly like the lexicon registry.
 */
export const CEFR_SOURCE_REFS: readonly string[] = [
  "cefr-cv-2020:overall-reading-comprehension",
  "cefr-cv-2020:conversation",
  "cefr-cv-2020:sociolinguistic-appropriateness",
  "cefr-cv-2020:vocabulary-range",
  "cefr-cv-2020:grammatical-accuracy",
  "cefr-cv-2020:orthographic-control",
  "cefr-cv-2020:phonological-control",
  "cefr-cv-2020:identifying-cues-inferring",
];

export function loadCourseObjectives(): CourseObjectives {
  return CourseObjectivesSchema.parse(readJson(OBJECTIVES_SOURCE));
}

export function loadClaimPolicy(): ClaimPolicy {
  return ClaimPolicySchema.parse(readJson(CLAIM_POLICY_SOURCE));
}

/**
 * Deterministic topological order over the prerequisite graph (§25).
 * Throws on unresolved references or cycles — callers treat that as a
 * content error, never a runtime condition.
 */
export function topologicalObjectiveOrder(objectives: CourseObjective[]): string[] {
  const byId = new Map(objectives.map((o) => [o.id, o]));
  const state = new Map<string, "visiting" | "done">();
  const order: string[] = [];
  const visit = (id: string, chain: string[]) => {
    const s = state.get(id);
    if (s === "done") return;
    if (s === "visiting") {
      throw new Error(`prerequisite cycle: ${[...chain, id].join(" → ")}`);
    }
    const objective = byId.get(id);
    if (!objective) throw new Error(`unresolved prerequisite ${id}`);
    state.set(id, "visiting");
    for (const p of objective.prerequisites) visit(p, [...chain, id]);
    state.set(id, "done");
    order.push(id);
  };
  for (const o of objectives) visit(o.id, []);
  return order;
}

/** Pure rule engine over the authored objective graph. */
export function validateObjectiveGraph(input: {
  objectives: CourseObjectives;
}): ValidationResult {
  const errors: string[] = [];
  const err = (m: string) => errors.push(`objectives: ${m}`);
  const objectives = input.objectives.objectives;

  const seen = new Set<string>();
  for (const o of objectives) {
    if (seen.has(o.id)) err(`duplicate objective id ${o.id}`);
    seen.add(o.id);
  }

  const refs = new Set(CEFR_SOURCE_REFS);
  for (const o of objectives) {
    for (const p of o.prerequisites) {
      if (!seen.has(p)) err(`${o.id}: prerequisite "${p}" does not resolve`);
      if (p === o.id) err(`${o.id}: lists itself as a prerequisite`);
    }
    for (const a of o.cefrAlignments) {
      if (!refs.has(a.sourceRef)) {
        err(`${o.id}: sourceRef "${a.sourceRef}" is not in the registered CEFR source list`);
      }
      // Honesty invariant (§166): a DIRECT alignment must state its
      // evidence boundary — an unexplained direct claim is an overclaim.
      if (a.relation === "direct" && (o.evidenceNote === undefined || o.evidenceNote.length < 10)) {
        err(`${o.id}: direct alignment at ${a.level} requires an evidenceNote stating the assessed boundary`);
      }
    }
    // Duplicate (level, scale) alignments hide review mistakes.
    const keys = o.cefrAlignments.map((a) => `${a.level}|${a.scaleName}`);
    if (new Set(keys).size !== keys.length) err(`${o.id}: duplicate CEFR alignment (level, scale)`);
  }

  if (errors.length === 0) {
    try {
      topologicalObjectiveOrder(objectives);
    } catch (e) {
      err((e as Error).message);
    }
  }

  // Every registered sourceRef key must be documented in RESEARCH.md — the
  // register and the prose never drift apart.
  try {
    const research = readFileSync(ASSESSMENT_RESEARCH, "utf8");
    for (const key of CEFR_SOURCE_REFS) {
      if (!research.includes(key)) {
        err(`RESEARCH.md does not document registered sourceRef "${key}"`);
      }
    }
  } catch {
    err(`${ASSESSMENT_RESEARCH} is missing`);
  }

  return { errors, warnings: [] };
}

/** Claim-policy internal consistency (§136): rules must be satisfiable in principle. */
export function validateClaimPolicyData(input: { policy: ClaimPolicy }): ValidationResult {
  const errors: string[] = [];
  const err = (m: string) => errors.push(`claim-policy: ${m}`);
  const { policy } = input;
  const dup = new Set<string>();
  for (const level of policy.evaluatedLevels) {
    if (dup.has(level)) err(`duplicate evaluated level ${level}`);
    dup.add(level);
  }
  const domains = new Set(policy.requiredDomains);
  if (domains.size !== policy.requiredDomains.length) err("duplicate required domain");
  // The gate must never be satisfiable by competence categories alone.
  for (const banned of ["lexical", "grammar", "phonology", "strategy"] as const) {
    if (domains.has(banned)) {
      err(`required domain "${banned}" is a competence, not a communicative activity — the claim gate must be activity-based (§8)`);
    }
  }
  return { errors, warnings: [] };
}

/**
 * Curriculum ↔ objective cross-references (§140, §144): every French lesson
 * declares resolving objectives; exercise objectiveTargets and concept
 * objectives resolve; non-French courses carry NO objective metadata
 * (§153); and every objective is actually taught by at least one lesson —
 * an untaught objective is an invented one (§23).
 */
export function validateCurriculumMapping(input: {
  objectives: CourseObjectives;
  packs: { courseId: string; pack: PackSource }[];
  concepts: { id: string; objectives?: string[] }[];
}): ValidationResult {
  const errors: string[] = [];
  const err = (m: string) => errors.push(`curriculum-mapping: ${m}`);
  const known = new Set(input.objectives.objectives.map((o) => o.id));
  const taught = new Set<string>();

  for (const { courseId, pack } of input.packs) {
    const isFrench = courseId === "fr-en";
    for (const section of pack.sections) {
      for (const unit of section.units) {
        for (const lesson of unit.lessons) {
          if (!isFrench) {
            if (lesson.objectives !== undefined) {
              err(`${courseId}/${lesson.id}: objectives are French-only metadata (§153)`);
            }
          } else if (lesson.objectives === undefined) {
            err(`${lesson.id}: French lesson must declare objectives (§144)`);
          } else {
            for (const o of lesson.objectives) {
              if (!known.has(o)) err(`${lesson.id}: unknown objective ${o}`);
              taught.add(o);
            }
            if (new Set(lesson.objectives).size !== lesson.objectives.length) {
              err(`${lesson.id}: duplicate lesson objectives`);
            }
          }
          for (const e of lesson.exercises) {
            const targets = (e as { objectiveTargets?: string[] }).objectiveTargets;
            if (targets === undefined) continue;
            if (!isFrench) {
              err(`${courseId}/${e.id}: objectiveTargets are French-only metadata (§153)`);
              continue;
            }
            for (const o of targets) {
              if (!known.has(o)) err(`${e.id}: unknown objectiveTarget ${o}`);
            }
          }
        }
      }
    }
  }

  for (const concept of input.concepts) {
    for (const o of concept.objectives ?? []) {
      if (!known.has(o)) err(`${concept.id}: unknown concept objective ${o}`);
    }
  }

  for (const o of input.objectives.objectives) {
    if (!taught.has(o.id)) {
      err(`objective ${o.id} is taught by no lesson — remove it or map the curriculum honestly (§23)`);
    }
  }

  return { errors, warnings: [] };
}

/**
 * Item objectiveTargets from an authored assessment bank, for the coverage
 * reports and the claim gate. Tolerates the file not existing yet (the
 * banks land in later Phase-6 stages); once present, their own schema
 * validation governs shape — this only collects targets.
 */
export function collectAssessmentItemTargets(
  relPath: string,
  containerKey: "checkpoints" | "stages"
): string[][] {
  let doc: unknown;
  try {
    doc = readJson(relPath);
  } catch {
    return [];
  }
  const containers = (doc as Record<string, unknown>)[containerKey];
  if (!Array.isArray(containers)) return [];
  const out: string[][] = [];
  for (const container of containers) {
    const items = (container as { items?: unknown }).items;
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      const targets = (item as { objectiveTargets?: unknown }).objectiveTargets;
      if (Array.isArray(targets) && targets.every((t) => typeof t === "string")) {
        out.push(targets as string[]);
      }
    }
  }
  return out;
}

/**
 * Rich scored-item evidence for the hardened claim gate (P7 §11-13): the
 * objective targets PLUS the task family (exercise type) and the shared
 * source input (clip/text) the item is about. `inputId` null means the item
 * is its own independent input (standalone vocabulary/grammar items).
 */
export type ScoredItemEvidence = {
  objectiveTargets: string[];
  taskFamily: string;
  inputId: string | null;
};

export function collectScoredItemEvidence(
  relPath: string,
  containerKey: "checkpoints" | "stages"
): ScoredItemEvidence[] {
  let doc: unknown;
  try {
    doc = readJson(relPath);
  } catch {
    return [];
  }
  const containers = (doc as Record<string, unknown>)[containerKey];
  if (!Array.isArray(containers)) return [];
  const out: ScoredItemEvidence[] = [];
  for (const container of containers) {
    const items = (container as { items?: unknown }).items;
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      const targets = (item as { objectiveTargets?: unknown }).objectiveTargets;
      const exercise = (item as { exercise?: unknown }).exercise as
        | { type?: unknown; clipId?: unknown; readingId?: unknown }
        | undefined;
      if (!Array.isArray(targets) || !targets.every((t) => typeof t === "string")) continue;
      const clip = typeof exercise?.clipId === "string" ? exercise.clipId : null;
      const reading = typeof exercise?.readingId === "string" ? exercise.readingId : null;
      out.push({
        objectiveTargets: targets as string[],
        taskFamily: typeof exercise?.type === "string" ? exercise.type : "unknown",
        inputId: clip ?? reading,
      });
    }
  }
  return out;
}

/** Disk-reading aggregator for the CLIs. */
export function validateAssessment(): ValidationResult {
  let objectives: CourseObjectives;
  try {
    objectives = loadCourseObjectives();
  } catch (e) {
    return {
      errors: [`objectives: schema validation failed — ${(e as Error).message.split("\n")[0]}`],
      warnings: [],
    };
  }
  let policy: ClaimPolicy;
  try {
    policy = loadClaimPolicy();
  } catch (e) {
    return {
      errors: [`claim-policy: schema validation failed — ${(e as Error).message.split("\n")[0]}`],
      warnings: [],
    };
  }
  const graph = validateObjectiveGraph({ objectives });
  const claim = validateClaimPolicyData({ policy });
  // Packs that fail their own schema are reported by validateContent; the
  // mapping check simply skips them here (same posture as lesson flows).
  const packs: { courseId: string; pack: PackSource }[] = [];
  for (const file of listCourseSources()) {
    const parsed = PackSchema.safeParse(readJson(`content/courses/${file}`));
    if (parsed.success) packs.push({ courseId: file.replace(/\.json$/, ""), pack: parsed.data });
  }
  let concepts: { id: string; objectives?: string[] }[] = [];
  try {
    concepts = loadPedagogyConcepts().concepts;
  } catch {
    // concept schema failures are reported by validatePedagogy
  }
  const mapping = validateCurriculumMapping({ objectives, packs, concepts });
  let checkpointErrors: string[] = [];
  try {
    const checkpoints = loadCheckpoints();
    const frPack = packs.find((p) => p.courseId === "fr-en");
    if (frPack) {
      checkpointErrors = validateCheckpointsData({
        checkpoints,
        objectives,
        conjugations: loadConjugations(),
        frPack: frPack.pack,
      }).errors;
    }
  } catch (e) {
    checkpointErrors = [
      `checkpoints: schema validation failed — ${(e as Error).message.split("\n")[0]}`,
    ];
  }
  let placementErrors: string[] = [];
  try {
    const placement = loadPlacement();
    const frPack = packs.find((p) => p.courseId === "fr-en");
    if (frPack) {
      placementErrors = validatePlacementData({
        placement,
        objectives,
        conjugations: loadConjugations(),
        frPack: frPack.pack,
      }).errors;
    }
  } catch (e) {
    placementErrors = [
      `placement: schema validation failed — ${(e as Error).message.split("\n")[0]}`,
    ];
  }
  return {
    errors: [...graph.errors, ...claim.errors, ...mapping.errors, ...checkpointErrors, ...placementErrors],
    warnings: [],
  };
}

// ---------------------------------------------------------------------------
// Checkpoints (§49-66)
// ---------------------------------------------------------------------------

export const CHECKPOINTS_SOURCE = "content/fr/assessment/checkpoints.json";

export function loadCheckpoints(): Checkpoints {
  return CheckpointsSchema.parse(readJson(CHECKPOINTS_SOURCE));
}

/**
 * Checkpoint bank rules (§53, §64, §136): ids unique and stable, every item
 * maps to resolving objectives, exercise payloads pass the same content
 * rules as lesson exercises (number-engine agreement, elision safety,
 * option dedup), conjugation answers equal the evidence-verified authored
 * cells, no lexical gradeTargets anywhere, section refs resolve, and every
 * ESSENTIAL objective keeps ≥2 scored items across all checkpoints.
 */
export function validateCheckpointsData(input: {
  checkpoints: Checkpoints;
  objectives: CourseObjectives;
  conjugations: Conjugations;
  frPack: PackSource;
  minItemsPerEssentialObjective?: number;
}): ValidationResult {
  const errors: string[] = [];
  const err = (m: string) => errors.push(`checkpoints: ${m}`);
  const known = new Map(input.objectives.objectives.map((o) => [o.id, o]));
  const sectionIds = new Set(input.frPack.sections.map((s) => s.id));
  const verbs = new Map(input.conjugations.verbs.map((v) => [v.lemma, v]));

  const cpIds = new Set<string>();
  const itemIds = new Set<string>();
  const essentialItemCount = new Map<string, number>();

  for (const cp of input.checkpoints.checkpoints) {
    if (cpIds.has(cp.id)) err(`duplicate checkpoint id ${cp.id}`);
    cpIds.add(cp.id);
    if (!sectionIds.has(cp.sectionId)) err(`${cp.id}: unknown section ${cp.sectionId}`);
    for (const item of cp.items) {
      if (itemIds.has(item.id)) err(`duplicate item id ${item.id}`);
      itemIds.add(item.id);
      const e = item.exercise;
      if ("gradeTargets" in e && e.gradeTargets !== undefined) {
        err(`${item.id}: checkpoint items must not carry lexical gradeTargets (§56)`);
      }
      if ("objectiveTargets" in e && (e as { objectiveTargets?: unknown }).objectiveTargets !== undefined) {
        err(`${item.id}: put objective mapping on the ITEM, not inside the exercise payload`);
      }
      validateExercise("fr-en", e, (m) => err(`${item.id}: ${m}`));
      let touchesEssential = false;
      for (const oid of item.objectiveTargets) {
        const objective = known.get(oid);
        if (!objective) {
          err(`${item.id}: unknown objective ${oid}`);
          continue;
        }
        if (objective.essential) {
          touchesEssential = true;
          essentialItemCount.set(oid, (essentialItemCount.get(oid) ?? 0) + 1);
        }
      }
      if (item.essential && !touchesEssential) {
        err(`${item.id}: marked essential but targets no essential objective`);
      }
      if (e.type === "conjugationCloze") {
        const table = verbs.get(e.verb);
        if (!table) {
          err(`${item.id}: verb ${e.verb} has no authored conjugation table`);
        } else if (table.cells[e.cell] !== e.answer) {
          err(`${item.id}: answer "${e.answer}" ≠ authored cell ${e.cell} = "${table.cells[e.cell]}"`);
        }
      }
    }
  }

  const minPerEssential = input.minItemsPerEssentialObjective ?? 2;
  for (const o of input.objectives.objectives) {
    if (!o.essential) continue;
    const count = essentialItemCount.get(o.id) ?? 0;
    if (count < minPerEssential) {
      err(
        `essential objective ${o.id} has ${count} checkpoint item(s) — needs ≥${minPerEssential} (§64)`
      );
    }
  }

  return { errors, warnings: [] };
}

/** Compiled runtime artifact for checkpoint sessions. */
export function compileCheckpointsArtifact(checkpoints: Checkpoints): string {
  const byId: Record<string, Checkpoint> = {};
  for (const cp of checkpoints.checkpoints) byId[cp.id] = cp;
  return `${JSON.stringify(
    {
      version: checkpoints.version,
      language: checkpoints.language,
      order: checkpoints.checkpoints.map((c) => c.id),
      byId,
    },
    null,
    2
  )}\n`;
}

// ---------------------------------------------------------------------------
// Placement (§67-89, §115-121)
// ---------------------------------------------------------------------------

export const PLACEMENT_SOURCE = "content/fr/assessment/placement.json";

export function loadPlacement(): PlacementContent {
  return PlacementSchema.parse(readJson(PLACEMENT_SOURCE));
}

/**
 * Placement bank rules (§73-77, §136): ids unique, cluster objectives and
 * anchor lessons resolve, anchors appear in strictly increasing curriculum
 * order (the earliest-weak-frontier walk in §75 depends on it), the item
 * budget respects maxItems, every item's primary target is its cluster's
 * objective, exercise payloads pass the shared content rules, conjugation
 * answers equal the evidence-verified cells, and nothing carries lexical
 * gradeTargets (placement mutates no learning memory, §78).
 */
export function validatePlacementData(input: {
  placement: PlacementContent;
  objectives: CourseObjectives;
  conjugations: Conjugations;
  frPack: PackSource;
}): ValidationResult {
  const errors: string[] = [];
  const err = (m: string) => errors.push(`placement: ${m}`);
  const known = new Map(input.objectives.objectives.map((o) => [o.id, o]));
  const verbs = new Map(input.conjugations.verbs.map((v) => [v.lemma, v]));

  const lessonOrder = new Map<string, number>();
  for (const section of input.frPack.sections) {
    for (const unit of section.units) {
      for (const lesson of unit.lessons) lessonOrder.set(lesson.id, lessonOrder.size);
    }
  }

  if (!lessonOrder.has(input.placement.allComfortableLessonId)) {
    err(`allComfortableLessonId ${input.placement.allComfortableLessonId} is not an fr-en lesson`);
  }

  const stageIds = new Set<string>();
  const clusterIds = new Set<string>();
  const itemIds = new Set<string>();
  let totalItems = 0;
  let previousAnchorIndex = -1;

  for (const stage of input.placement.stages) {
    if (stageIds.has(stage.id)) err(`duplicate stage id ${stage.id}`);
    stageIds.add(stage.id);
    for (const cluster of stage.clusters) {
      if (clusterIds.has(cluster.id)) err(`duplicate cluster id ${cluster.id}`);
      clusterIds.add(cluster.id);
      if (!known.has(cluster.objectiveId)) {
        err(`${cluster.id}: unknown objective ${cluster.objectiveId}`);
      }
      const anchorIndex = lessonOrder.get(cluster.anchorLessonId);
      if (anchorIndex === undefined) {
        err(`${cluster.id}: anchor ${cluster.anchorLessonId} is not an fr-en lesson`);
      } else {
        // Strictly increasing across the whole walk: a later cluster must
        // never point earlier than one already probed (§75).
        if (anchorIndex <= previousAnchorIndex) {
          err(
            `${cluster.id}: anchor ${cluster.anchorLessonId} breaks curriculum order — ` +
              `clusters must anchor strictly later than the previous cluster`
          );
        }
        previousAnchorIndex = Math.max(previousAnchorIndex, anchorIndex);
      }
      for (const item of cluster.items) {
        totalItems += 1;
        if (itemIds.has(item.id)) err(`duplicate item id ${item.id}`);
        itemIds.add(item.id);
        const e = item.exercise;
        if ("gradeTargets" in e && e.gradeTargets !== undefined) {
          err(`${item.id}: placement items must not carry lexical gradeTargets (§78)`);
        }
        if ("objectiveTargets" in e && (e as { objectiveTargets?: unknown }).objectiveTargets !== undefined) {
          err(`${item.id}: put objective mapping on the ITEM, not inside the exercise payload`);
        }
        validateExercise("fr-en", e, (m) => err(`${item.id}: ${m}`));
        if (item.objectiveTargets[0] !== cluster.objectiveId) {
          err(
            `${item.id}: primary objective ${item.objectiveTargets[0]} ≠ cluster objective ${cluster.objectiveId}`
          );
        }
        for (const oid of item.objectiveTargets) {
          if (!known.has(oid)) err(`${item.id}: unknown objective ${oid}`);
        }
        if (e.type === "conjugationCloze") {
          const table = verbs.get(e.verb);
          if (!table) {
            err(`${item.id}: verb ${e.verb} has no authored conjugation table`);
          } else if (table.cells[e.cell] !== e.answer) {
            err(`${item.id}: answer "${e.answer}" ≠ authored cell ${e.cell} = "${table.cells[e.cell]}"`);
          }
        }
      }
    }
  }

  if (totalItems > input.placement.maxItems) {
    err(`${totalItems} items exceed the maxItems budget of ${input.placement.maxItems} (§76)`);
  }

  return { errors, warnings: [] };
}

/** Compiled runtime artifact for placement sessions. */
export function compilePlacementArtifact(placement: PlacementContent): string {
  return `${JSON.stringify(
    {
      version: placement.version,
      language: placement.language,
      placementVersion: placement.placementVersion,
      maxItems: placement.maxItems,
      allComfortableLessonId: placement.allComfortableLessonId,
      stages: placement.stages,
    },
    null,
    2
  )}\n`;
}

/** Compiled runtime artifact: objective metadata for progress UI. */
export function compileObjectivesArtifact(objectives: CourseObjectives): string {
  const byId: Record<string, unknown> = {};
  for (const o of objectives.objectives) {
    byId[o.id] = {
      id: o.id,
      title: o.title,
      canDo: o.canDo,
      category: o.category,
      essential: o.essential,
      prerequisites: o.prerequisites,
      cefrAlignments: o.cefrAlignments,
    };
  }
  return `${JSON.stringify(
    {
      version: objectives.version,
      language: objectives.language,
      order: objectives.objectives.map((o) => o.id),
      byId,
    },
    null,
    2
  )}\n`;
}
