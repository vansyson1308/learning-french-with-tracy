/**
 * Phase 6 assessment pipeline: course objectives, CEFR alignments, claim
 * policy — loading, graph validation (§25, §143) and the honesty
 * invariants that keep alignments defensible (§166).
 */

import {
  ClaimPolicySchema,
  CourseObjectivesSchema,
  type ClaimPolicy,
  type CourseObjective,
  type CourseObjectives,
} from "../../content/schema";
import { readJson, type ValidationResult } from "./pipeline";
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
  return { errors: [...graph.errors, ...claim.errors], warnings: [] };
}
