/**
 * Phase 6 assessment pipeline: course objectives, CEFR alignments, claim
 * policy — loading, graph validation (§25, §143) and the honesty
 * invariants that keep alignments defensible (§166).
 */

import {
  AttainmentPolicySchema,
  CheckpointsSchema,
  ClaimPolicySchema,
  CourseObjectivesSchema,
  PackSchema,
  PlacementSchema,
  type AttainmentPolicy,
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
  // Phase-7 reception scales (documented in RESEARCH.md §Phase-7 additions)
  "cefr-cv-2020:overall-listening-comprehension",
  "cefr-cv-2020:audio-media-recordings",
  "cefr-cv-2020:announcements-instructions",
  "cefr-cv-2020:understanding-conversation",
  "cefr-cv-2020:reading-correspondence",
  "cefr-cv-2020:reading-orientation",
  // Phase-8 oral-production scales (documented in RESEARCH.md §Phase-8 additions)
  "cefr-cv-2020:overall-oral-production",
  "cefr-cv-2020:sustained-monologue-describing",
  "cefr-cv-2020:sustained-monologue-giving-information",
  // Phase-9 written-production + interaction scales (documented in
  // content/fr/writing/RESEARCH.md and content/fr/interaction/RESEARCH.md,
  // with per-row verification status).
  "cefr-cv-2020:overall-written-production",
  "cefr-cv-2020:overall-written-interaction",
  "cefr-cv-2020:notes-messages-forms",
  "cefr-cv-2020:correspondence",
  "cefr-cv-2020:overall-oral-interaction",
  "cefr-cv-2020:information-exchange",
  "cefr-cv-2020:obtaining-goods-services",
];

export function loadCourseObjectives(): CourseObjectives {
  return CourseObjectivesSchema.parse(readJson(OBJECTIVES_SOURCE));
}

export function loadClaimPolicy(): ClaimPolicy {
  return ClaimPolicySchema.parse(readJson(CLAIM_POLICY_SOURCE));
}

export const ATTAINMENT_SOURCE = "content/fr/assessment/attainment.json";
/** The cross-domain sampler that must never complete a domain by itself. */
export const CAPSTONE_CHECKPOINT_ID = "fr.checkpoint.a1-capstone";

export function loadAttainmentPolicy(): AttainmentPolicy {
  return AttainmentPolicySchema.parse(readJson(ATTAINMENT_SOURCE));
}

/**
 * Learner attainment policy rules (Phase 10 Gate 2, §10-§14):
 *  - the policy covers exactly the claim policy's required domains, once each;
 *  - every required/excluded objective exists, belongs to the domain, and
 *    is DIRECTLY aligned at the policy level;
 *  - every ESSENTIAL direct objective of the domain is required — nothing
 *    is dropped silently; every non-essential direct objective is either
 *    required or excluded with a written reason;
 *  - every required objective is reachable: some checkpoint form targets it
 *    with at least that checkpoint's minItemsPerObjective items, so a
 *    "demonstrated" verdict is actually attainable;
 *  - the capstone (a one-objective-per-domain sampler) never targets a
 *    domain's whole required set — it can contribute, never complete.
 */
export function validateAttainmentPolicyData(input: {
  attainment: AttainmentPolicy;
  objectives: CourseObjectives;
  policy: ClaimPolicy;
  checkpoints: Checkpoints;
}): ValidationResult {
  const errors: string[] = [];
  const err = (m: string) => errors.push(`attainment: ${m}`);
  const { attainment, policy } = input;
  const known = new Map(input.objectives.objectives.map((o) => [o.id, o]));
  const level = attainment.level;

  if (!policy.evaluatedLevels.includes(level)) {
    err(`level ${level} is not an evaluated claim level (${policy.evaluatedLevels.join(", ")})`);
  }
  const seenDomains = new Set<string>();
  for (const d of attainment.domains) {
    if (seenDomains.has(d.domain)) err(`domain ${d.domain} declared twice`);
    seenDomains.add(d.domain);
    if (!policy.requiredDomains.includes(d.domain)) {
      err(`domain ${d.domain} is not a claim-policy required domain`);
    }
  }
  for (const required of policy.requiredDomains) {
    if (!seenDomains.has(required)) err(`required domain ${required} has no attainment policy`);
  }

  const isDirectAtLevel = (id: string) =>
    known.get(id)?.cefrAlignments.some((a) => a.level === level && a.relation === "direct") ??
    false;

  // Reachability: objective → max items targeting it inside a single form
  // of a single checkpoint, compared against that checkpoint's floor.
  const reachable = new Set<string>();
  const capstoneTargets = new Set<string>();
  for (const cp of input.checkpoints.checkpoints) {
    const forms =
      cp.forms && cp.forms.length > 0
        ? cp.forms
        : [{ formId: "full", itemIds: cp.items.map((i) => i.id) }];
    for (const form of forms) {
      const ids = new Set(form.itemIds);
      const perObjective = new Map<string, number>();
      for (const item of cp.items) {
        if (!ids.has(item.id)) continue;
        for (const oid of item.objectiveTargets) {
          perObjective.set(oid, (perObjective.get(oid) ?? 0) + 1);
          if (cp.id === CAPSTONE_CHECKPOINT_ID) capstoneTargets.add(oid);
        }
      }
      for (const [oid, count] of perObjective) {
        if (count >= cp.criteria.minItemsPerObjective) reachable.add(oid);
      }
    }
  }

  for (const d of attainment.domains) {
    const required = new Set<string>();
    for (const id of d.requiredObjectiveIds) {
      if (required.has(id)) err(`${d.domain}: ${id} listed twice`);
      required.add(id);
      const o = known.get(id);
      if (!o) {
        err(`${d.domain}: unknown objective ${id}`);
        continue;
      }
      if (o.category !== d.domain) err(`${d.domain}: ${id} belongs to ${o.category}`);
      if (!isDirectAtLevel(id)) err(`${d.domain}: ${id} is not directly aligned at ${level}`);
      if (!reachable.has(id)) {
        err(
          `${d.domain}: ${id} is required but no checkpoint form carries enough items to demonstrate it — the estimate could never be completed`
        );
      }
    }
    const excluded = new Set<string>();
    for (const ex of d.excludedObjectiveIds) {
      if (required.has(ex.objectiveId)) err(`${d.domain}: ${ex.objectiveId} both required and excluded`);
      excluded.add(ex.objectiveId);
      const o = known.get(ex.objectiveId);
      if (!o) {
        err(`${d.domain}: unknown excluded objective ${ex.objectiveId}`);
        continue;
      }
      if (o.category !== d.domain) err(`${d.domain}: excluded ${ex.objectiveId} belongs to ${o.category}`);
      if (o.essential) {
        err(`${d.domain}: ${ex.objectiveId} is ESSENTIAL and cannot be excluded from attainment`);
      }
    }
    for (const o of input.objectives.objectives) {
      if (o.category !== d.domain || !isDirectAtLevel(o.id)) continue;
      if (required.has(o.id) || excluded.has(o.id)) continue;
      err(
        `${d.domain}: direct-${level} objective ${o.id} is neither required nor explicitly excluded — nothing may be omitted silently`
      );
    }
    if (required.size > 0 && [...required].every((id) => capstoneTargets.has(id))) {
      err(
        `${d.domain}: the capstone targets every required objective — a one-sitting sampler must never be able to complete a domain by itself`
      );
    }
  }
  return { errors, warnings: [] };
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

/** speechItemId → authored task family (lazy; empty when no speech source). */
let speechFamilyCache: Map<string, string> | null = null;
function speechTaskFamilies(): Map<string, string> {
  if (speechFamilyCache) return speechFamilyCache;
  speechFamilyCache = new Map();
  try {
    const doc = readJson("content/fr/speech/items.json") as {
      items?: { id?: unknown; taskFamily?: unknown }[];
    };
    for (const item of doc.items ?? []) {
      if (typeof item.id === "string" && typeof item.taskFamily === "string") {
        speechFamilyCache.set(item.id, item.taskFamily);
      }
    }
  } catch {
    // No speech source yet — exercise types remain the fallback family.
  }
  return speechFamilyCache;
}

let writingFamilyCache: Map<string, string> | null = null;

/** writingTaskId → authored taskFamily (P9 §21-analog honesty for writing). */
function writingTaskFamilies(): Map<string, string> {
  if (writingFamilyCache) return writingFamilyCache;
  writingFamilyCache = new Map();
  try {
    const doc = readJson("content/fr/writing/tasks.json") as {
      tasks?: { id?: unknown; taskFamily?: unknown }[];
    };
    for (const task of doc.tasks ?? []) {
      if (typeof task.id === "string" && typeof task.taskFamily === "string") {
        writingFamilyCache.set(task.id, task.taskFamily);
      }
    }
  } catch {
    // No writing source yet — exercise types remain the fallback family.
  }
  return writingFamilyCache;
}

let interactionFamilyCache: Map<string, string> | null = null;

/** scenarioId → authored taskFamily (P9 §35: the scenario IS the input). */
function interactionTaskFamilies(): Map<string, string> {
  if (interactionFamilyCache) return interactionFamilyCache;
  interactionFamilyCache = new Map();
  try {
    const doc = readJson("content/fr/interaction/scenarios.json") as {
      scenarios?: { id?: unknown; taskFamily?: unknown }[];
    };
    for (const scenario of doc.scenarios ?? []) {
      if (typeof scenario.id === "string" && typeof scenario.taskFamily === "string") {
        interactionFamilyCache.set(scenario.id, scenario.taskFamily);
      }
    }
  } catch {
    // No interaction source yet — exercise types remain the fallback family.
  }
  return interactionFamilyCache;
}

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
        | {
            type?: unknown;
            clipId?: unknown;
            readingId?: unknown;
            speechItemId?: unknown;
            writingTaskId?: unknown;
            scenarioId?: unknown;
          }
        | undefined;
      if (!Array.isArray(targets) || !targets.every((t) => typeof t === "string")) continue;
      const clip = typeof exercise?.clipId === "string" ? exercise.clipId : null;
      const reading = typeof exercise?.readingId === "string" ? exercise.readingId : null;
      const speechItemId =
        typeof exercise?.speechItemId === "string" ? exercise.speechItemId : null;
      const writingTaskId =
        typeof exercise?.writingTaskId === "string" ? exercise.writingTaskId : null;
      const scenarioId =
        typeof exercise?.scenarioId === "string" ? exercise.scenarioId : null;
      // Speech/writing/interaction items (P8 §21, P9 §21/§35): the honest
      // task family is the AUTHORED one (formulaic_exchange / transaction /
      // …), not the exercise type; the elicitation prompt — or the whole
      // scenario — is the input identity.
      const speechFamily =
        speechItemId !== null ? speechTaskFamilies().get(speechItemId) : undefined;
      const writingFamily =
        writingTaskId !== null ? writingTaskFamilies().get(writingTaskId) : undefined;
      const interactionFamily =
        scenarioId !== null ? interactionTaskFamilies().get(scenarioId) : undefined;
      out.push({
        objectiveTargets: targets as string[],
        taskFamily:
          speechFamily ??
          writingFamily ??
          interactionFamily ??
          (typeof exercise?.type === "string" ? exercise.type : "unknown"),
        inputId: clip ?? reading ?? speechItemId ?? writingTaskId ?? scenarioId,
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
  let attainmentErrors: string[] = [];
  try {
    attainmentErrors = validateAttainmentPolicyData({
      attainment: loadAttainmentPolicy(),
      objectives,
      policy,
      checkpoints: loadCheckpoints(),
    }).errors;
  } catch (e) {
    attainmentErrors = [
      `attainment: schema validation failed — ${(e as Error).message.split("\n")[0]}`,
    ];
  }
  return {
    errors: [
      ...graph.errors,
      ...claim.errors,
      ...mapping.errors,
      ...checkpointErrors,
      ...placementErrors,
      ...attainmentErrors,
    ],
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

    // Parallel forms (P9 §38-§39): every declared form must be a VALID
    // administration on its own — its items resolve, no dead bank items,
    // and every objective the bank targets keeps at least the criteria
    // floor of items inside EVERY form (otherwise a retake on that form
    // could only ever yield structural insufficient_evidence).
    if (cp.forms) {
      const bankIds = new Set(cp.items.map((i) => i.id));
      const formIds = new Set<string>();
      const coveredByForms = new Set<string>();
      for (const form of cp.forms) {
        if (formIds.has(form.formId)) err(`${cp.id}: duplicate form id ${form.formId}`);
        formIds.add(form.formId);
        const seen = new Set<string>();
        const perObjective = new Map<string, number>();
        for (const itemId of form.itemIds) {
          if (!bankIds.has(itemId)) {
            err(`${cp.id}/${form.formId}: item ${itemId} is not in the bank`);
            continue;
          }
          if (seen.has(itemId)) err(`${cp.id}/${form.formId}: duplicate item ${itemId}`);
          seen.add(itemId);
          coveredByForms.add(itemId);
          const item = cp.items.find((i) => i.id === itemId)!;
          for (const oid of new Set(item.objectiveTargets)) {
            perObjective.set(oid, (perObjective.get(oid) ?? 0) + 1);
          }
        }
        const bankObjectives = new Set(cp.items.flatMap((i) => i.objectiveTargets));
        for (const oid of bankObjectives) {
          if ((perObjective.get(oid) ?? 0) < cp.criteria.minItemsPerObjective) {
            err(
              `${cp.id}/${form.formId}: objective ${oid} has ${perObjective.get(oid) ?? 0} item(s) — every form needs ≥${cp.criteria.minItemsPerObjective} (P9 §39)`
            );
          }
        }
      }
      for (const item of cp.items) {
        if (!coveredByForms.has(item.id)) {
          err(`${cp.id}: item ${item.id} appears in no form — dead bank item`);
        }
      }
    }
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
