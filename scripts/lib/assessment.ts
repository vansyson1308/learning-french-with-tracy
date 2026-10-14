/**
 * Phase 6 assessment pipeline (per target language since P1c): course
 * objectives, CEFR alignments, claim policy — loading, graph validation
 * (§25, §143) and the honesty invariants that keep alignments defensible
 * (§166). Native-language text (titles, can-do statements, checkpoint
 * copy) is resolved per course at compile time.
 */

import { existsSync, readFileSync } from "fs";

import {
  attainmentPolicySchema,
  checkpointsSchema,
  ClaimPolicySchema,
  courseObjectivesSchema,
  placementSchema,
  type AttainmentPolicy,
  type Checkpoints,
  type ClaimPolicy,
  type CourseObjective,
  type CourseObjectives,
  type PackSource,
  type ParadigmTable,
  type ParadigmTables,
  type PlacementContent,
} from "../../content/schema";
import { buildPlugin } from "./languages";
import { localizeCheckpoint, localizeObjective, localizePlacementStage } from "./native-text";
import { loadParadigms, loadPedagogyConcepts } from "./pedagogy";
import { loadPacks, readJson, safeResolve, targetLayers, validateExercise, type LoadedPack, type ValidationResult } from "./pipeline";

export function assessmentSourcePath(
  lang: string,
  kind: "objectives" | "claim-policy" | "attainment" | "checkpoints" | "placement" | "RESEARCH"
): string {
  return `content/${lang}/assessment/${kind}.${kind === "RESEARCH" ? "md" : "json"}`;
}

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
  // content/<lang>/writing/RESEARCH.md and content/<lang>/interaction/RESEARCH.md,
  // with per-row verification status).
  "cefr-cv-2020:overall-written-production",
  "cefr-cv-2020:overall-written-interaction",
  "cefr-cv-2020:notes-messages-forms",
  "cefr-cv-2020:correspondence",
  "cefr-cv-2020:overall-oral-interaction",
  "cefr-cv-2020:information-exchange",
  "cefr-cv-2020:obtaining-goods-services",
];

function checkLanguage(rel: string, doc: { language: string }, lang: string): void {
  if (doc.language !== lang) throw new Error(`${rel}: language "${doc.language}" ≠ folder "${lang}"`);
}

export function hasAssessment(lang: string): boolean {
  return existsSync(safeResolve(assessmentSourcePath(lang, "objectives")));
}

export function loadCourseObjectives(lang: string): CourseObjectives {
  const rel = assessmentSourcePath(lang, "objectives");
  const doc = courseObjectivesSchema(lang).parse(readJson(rel));
  checkLanguage(rel, doc, lang);
  return doc;
}

export function loadClaimPolicy(lang: string): ClaimPolicy {
  return ClaimPolicySchema.parse(readJson(assessmentSourcePath(lang, "claim-policy")));
}

export function loadAttainmentPolicy(lang: string): AttainmentPolicy {
  const rel = assessmentSourcePath(lang, "attainment");
  const doc = attainmentPolicySchema(lang).parse(readJson(rel));
  checkLanguage(rel, doc, lang);
  return doc;
}

export function loadCheckpoints(lang: string): Checkpoints {
  const rel = assessmentSourcePath(lang, "checkpoints");
  const doc = checkpointsSchema(lang).parse(readJson(rel));
  checkLanguage(rel, doc, lang);
  return doc;
}

export function loadPlacement(lang: string): PlacementContent {
  const rel = assessmentSourcePath(lang, "placement");
  const doc = placementSchema(lang).parse(readJson(rel));
  checkLanguage(rel, doc, lang);
  return doc;
}

/**
 * The cross-domain sampler that must never complete a domain by itself:
 * by convention a checkpoint id ending in "-capstone" (`fr.checkpoint.a1-capstone`).
 */
export function isCapstoneCheckpoint(checkpointId: string): boolean {
  return /-capstone$/.test(checkpointId);
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
          if (isCapstoneCheckpoint(cp.id)) capstoneTargets.add(oid);
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
  /** Path of the RESEARCH.md that must document every registered sourceRef. */
  researchPath?: string;
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

  // Every registered sourceRef key USED by this language's objectives must
  // be documented in its RESEARCH.md — the register and the prose never
  // drift apart.
  const researchPath = input.researchPath ?? assessmentSourcePath(input.objectives.language, "RESEARCH");
  const used = new Set(objectives.flatMap((o) => o.cefrAlignments.map((a) => a.sourceRef)));
  try {
    const research = readFileSync(safeResolve(researchPath), "utf8");
    for (const key of CEFR_SOURCE_REFS) {
      if (used.has(key) && !research.includes(key)) {
        err(`${researchPath} does not document registered sourceRef "${key}"`);
      }
    }
  } catch {
    err(`${researchPath} is missing`);
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
 * Curriculum ↔ objective cross-references (§140, §144) for the courses of
 * ONE target language: every lesson declares resolving objectives;
 * exercise objectiveTargets and concept objectives resolve; and every
 * objective is actually taught by at least one lesson — an untaught
 * objective is an invented one (§23). (Courses of languages WITHOUT an
 * objectives source are forbidden any objective metadata by the pack
 * validator, §153.)
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
    for (const section of pack.sections) {
      for (const unit of section.units) {
        for (const lesson of unit.lessons) {
          if (lesson.objectives === undefined) {
            err(`${courseId}/${lesson.id}: lesson must declare objectives (§144)`);
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

/** id → authored taskFamily from a `{ <key>: [{id, taskFamily}] }` source (empty when absent). */
function taskFamilyIndex(relPath: string, key: "items" | "tasks" | "scenarios"): Map<string, string> {
  const out = new Map<string, string>();
  try {
    const doc = readJson(relPath) as Record<string, { id?: unknown; taskFamily?: unknown }[] | undefined>;
    for (const entry of doc[key] ?? []) {
      if (typeof entry.id === "string" && typeof entry.taskFamily === "string") out.set(entry.id, entry.taskFamily);
    }
  } catch {
    // No such source yet — exercise types remain the fallback family.
  }
  return out;
}

const familyCache = new Map<string, { speech: Map<string, string>; writing: Map<string, string>; interaction: Map<string, string> }>();

function taskFamilies(lang: string) {
  let hit = familyCache.get(lang);
  if (!hit) {
    hit = {
      speech: taskFamilyIndex(`content/${lang}/speech/items.json`, "items"),
      writing: taskFamilyIndex(`content/${lang}/writing/tasks.json`, "tasks"),
      interaction: taskFamilyIndex(`content/${lang}/interaction/scenarios.json`, "scenarios"),
    };
    familyCache.set(lang, hit);
  }
  return hit;
}

/** Test seam: forget cached task-family indexes (sources rewritten in a test). */
export function resetTaskFamilyCacheForTests(): void {
  familyCache.clear();
}

export function collectScoredItemEvidence(
  relPath: string,
  containerKey: "checkpoints" | "stages",
  lang: string
): ScoredItemEvidence[] {
  let doc: unknown;
  try {
    doc = readJson(relPath);
  } catch {
    return [];
  }
  const containers = (doc as Record<string, unknown>)[containerKey];
  if (!Array.isArray(containers)) return [];
  const families = taskFamilies(lang);
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
      const speechFamily = speechItemId !== null ? families.speech.get(speechItemId) : undefined;
      const writingFamily = writingTaskId !== null ? families.writing.get(writingTaskId) : undefined;
      const interactionFamily = scenarioId !== null ? families.interaction.get(scenarioId) : undefined;
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

/** Disk-reading aggregator for the CLIs, for one target language. */
export function validateAssessment(lang: string, packs: LoadedPack[] = loadPacks()): ValidationResult {
  if (!hasAssessment(lang)) return { errors: [], warnings: [] };
  let objectives: CourseObjectives;
  try {
    objectives = loadCourseObjectives(lang);
  } catch (e) {
    return {
      errors: [`objectives: schema validation failed — ${(e as Error).message.split("\n")[0]}`],
      warnings: [],
    };
  }
  let policy: ClaimPolicy;
  try {
    policy = loadClaimPolicy(lang);
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
  const mine = packs.filter((p) => p.pack.targetCode === lang);
  // The placement walk is authored against the primary-native course (the
  // smallest native code); other courses of the target validate the same
  // walk re-pointed at their own lesson ids.
  const primaryCourseId = [...mine].sort((a, b) => a.pack.nativeCode.localeCompare(b.pack.nativeCode))[0]?.pack.id ?? lang;
  let concepts: { id: string; objectives?: string[] }[] = [];
  try {
    concepts = loadPedagogyConcepts(lang)?.concepts ?? [];
  } catch {
    // concept schema failures are reported by validatePedagogy
  }
  const mapping = validateCurriculumMapping({ objectives, packs: mine, concepts });
  let paradigms: ParadigmTables | null = null;
  try {
    paradigms = targetLayers(lang).pedagogy ? loadParadigms(lang) : null;
  } catch {
    // reported by validatePedagogy
  }
  const bankErrors: string[] = [];
  for (const { courseId, pack } of mine) {
    try {
      bankErrors.push(
        ...validateCheckpointsData({ checkpoints: loadCheckpoints(lang), objectives, paradigms, pack, courseId }).errors
      );
    } catch (e) {
      bankErrors.push(`checkpoints: schema validation failed — ${(e as Error).message.split("\n")[0]}`);
    }
    try {
      bankErrors.push(
        ...validatePlacementData({ placement: placementForCourse(loadPlacement(lang), primaryCourseId, courseId), objectives, paradigms, pack, courseId }).errors
      );
    } catch (e) {
      bankErrors.push(`placement: schema validation failed — ${(e as Error).message.split("\n")[0]}`);
    }
  }
  let attainmentErrors: string[] = [];
  try {
    attainmentErrors = validateAttainmentPolicyData({
      attainment: loadAttainmentPolicy(lang),
      objectives,
      policy,
      checkpoints: loadCheckpoints(lang),
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
      ...[...new Set(bankErrors)],
      ...attainmentErrors,
    ],
    warnings: [],
  };
}

// ---------------------------------------------------------------------------
// Checkpoints (§49-66)
// ---------------------------------------------------------------------------

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
  paradigms: ParadigmTables | null;
  /** The course whose sections the checkpoints unlock from. */
  pack: PackSource;
  courseId: string;
  minItemsPerEssentialObjective?: number;
}): ValidationResult {
  const errors: string[] = [];
  const err = (m: string) => errors.push(`checkpoints: ${m}`);
  const known = new Map(input.objectives.objectives.map((o) => [o.id, o]));
  const sectionIds = new Set(input.pack.sections.map((s) => s.id));
  const verbs = new Map<string, ParadigmTable>((input.paradigms?.tables ?? []).map((v) => [v.lemma, v]));

  const cpIds = new Set<string>();
  const itemIds = new Set<string>();
  const essentialItemCount = new Map<string, number>();

  for (const cp of input.checkpoints.checkpoints) {
    if (cpIds.has(cp.id)) err(`duplicate checkpoint id ${cp.id}`);
    cpIds.add(cp.id);
    if (!sectionIds.has(cp.sectionId)) err(`${cp.id}: unknown section ${cp.sectionId} (${input.courseId})`);

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
      validateExercise(input.courseId, e, (m) => err(`${item.id}: ${m}`), input.pack.targetCode);
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
          err(`${item.id}: verb ${e.verb} has no authored paradigm table`);
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

/** Compiled runtime artifact for checkpoint sessions (native text resolved). */
export function compileCheckpointsArtifact(checkpoints: Checkpoints, nativeCode: string): string {
  const byId: Record<string, unknown> = {};
  for (const cp of checkpoints.checkpoints) byId[cp.id] = localizeCheckpoint(cp, nativeCode, checkpoints.exerciseNativeCode);
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
  paradigms: ParadigmTables | null;
  pack: PackSource;
  courseId: string;
}): ValidationResult {
  const errors: string[] = [];
  const err = (m: string) => errors.push(`placement: ${m}`);
  const known = new Map(input.objectives.objectives.map((o) => [o.id, o]));
  const verbs = new Map<string, ParadigmTable>((input.paradigms?.tables ?? []).map((v) => [v.lemma, v]));

  const lessonOrder = new Map<string, number>();
  for (const section of input.pack.sections) {
    for (const unit of section.units) {
      for (const lesson of unit.lessons) lessonOrder.set(lesson.id, lessonOrder.size);
    }
  }

  if (!lessonOrder.has(input.placement.allComfortableLessonId)) {
    err(`allComfortableLessonId ${input.placement.allComfortableLessonId} is not a ${input.courseId} lesson`);
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
        err(`${cluster.id}: anchor ${cluster.anchorLessonId} is not a ${input.courseId} lesson`);
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
        validateExercise(input.courseId, e, (m) => err(`${item.id}: ${m}`), input.pack.targetCode);
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
            err(`${item.id}: verb ${e.verb} has no authored paradigm table`);
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

/**
 * The placement walk authored for the primary-native course, re-pointed at
 * the lessons of another course of the same target (P2b). Lesson ids are
 * `<courseId>:<unit>-<lesson>`; a secondary-native course keeps the same
 * unit/lesson slugs under its own prefix, so only the prefix changes.
 */
export function placementForCourse(placement: PlacementContent, primaryCourseId: string, courseId: string): PlacementContent {
  if (primaryCourseId === courseId) return placement;
  const remap = (lessonId: string) =>
    lessonId.startsWith(`${primaryCourseId}:`) ? `${courseId}:${lessonId.slice(primaryCourseId.length + 1)}` : lessonId;
  return {
    ...placement,
    allComfortableLessonId: remap(placement.allComfortableLessonId),
    stages: placement.stages.map((s) => ({
      ...s,
      clusters: s.clusters.map((c) => ({ ...c, anchorLessonId: remap(c.anchorLessonId) })),
    })),
  };
}

/** Compiled runtime artifact for placement sessions (native text resolved). */
export function compilePlacementArtifact(placement: PlacementContent, nativeCode: string): string {
  return `${JSON.stringify(
    {
      version: placement.version,
      language: placement.language,
      placementVersion: placement.placementVersion,
      maxItems: placement.maxItems,
      allComfortableLessonId: placement.allComfortableLessonId,
      stages: placement.stages.map((s) => localizePlacementStage(s, nativeCode, placement.exerciseNativeCode)),
    },
    null,
    2
  )}\n`;
}

/** Compiled runtime artifact: objective metadata for progress UI (native text resolved). */
export function compileObjectivesArtifact(objectives: CourseObjectives, nativeCode: string): string {
  const byId: Record<string, unknown> = {};
  for (const source of objectives.objectives) {
    const o = localizeObjective(source, nativeCode);
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

/** The courses (packs) of a target that the assessment validators cross-reference. */
export function packsOfTarget(lang: string, packs: LoadedPack[] = loadPacks()): LoadedPack[] {
  return packs.filter((p) => p.pack.targetCode === lang);
}

/** @internal re-export so callers can resolve the plugin without importing languages directly. */
export { buildPlugin };
