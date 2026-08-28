/**
 * Phase 6 generated assessment reports (§131-135) and the overall-level
 * claim-gate engine (§98-103). Everything here is pure and deterministic:
 * the same content produces byte-identical reports (drift-guarded in CI),
 * and the claim gate takes NO learner state — lesson completion, XP or
 * vocabulary counts can never influence claimability (§100-101, §145).
 */

import type {
  CefrLevel,
  ClaimPolicy,
  CourseObjective,
  ObjectiveCategory,
  PackSource,
} from "../../content/schema";

// ---------------------------------------------------------------------------
// Curriculum coverage (§131-132)
// ---------------------------------------------------------------------------

export type ObjectiveCoverageRow = {
  id: string;
  title: string;
  category: ObjectiveCategory;
  essential: boolean;
  prerequisites: string[];
  cefrAlignments: { level: CefrLevel; scaleName: string; relation: "direct" | "supports" }[];
  lessonsTeaching: string[];
  conceptsTeaching: string[];
  /** Exercises inside teaching lessons (practice by curriculum inheritance). */
  exercisesPracticing: number;
  /** Exercises carrying an explicit objectiveTargets reference. */
  exercisesTargeting: number;
  /** Scored checkpoint items mapped to this objective (0 until authored). */
  checkpointItems: number;
  /** Placement items mapped to this objective (0 until authored). */
  placementItems: number;
};

export function buildObjectiveCoverage(input: {
  objectives: CourseObjective[];
  frPack: PackSource;
  concepts: { id: string; objectives?: string[] }[];
  checkpointItemTargets: string[][];
  placementItemTargets: string[][];
}): ObjectiveCoverageRow[] {
  const rows = new Map<string, ObjectiveCoverageRow>();
  for (const o of input.objectives) {
    rows.set(o.id, {
      id: o.id,
      title: o.title,
      category: o.category,
      essential: o.essential,
      prerequisites: [...o.prerequisites],
      cefrAlignments: o.cefrAlignments.map((a) => ({
        level: a.level,
        scaleName: a.scaleName,
        relation: a.relation,
      })),
      lessonsTeaching: [],
      conceptsTeaching: [],
      exercisesPracticing: 0,
      exercisesTargeting: 0,
      checkpointItems: 0,
      placementItems: 0,
    });
  }
  for (const section of input.frPack.sections) {
    for (const unit of section.units) {
      for (const lesson of unit.lessons) {
        for (const oid of lesson.objectives ?? []) {
          const row = rows.get(oid);
          if (!row) continue;
          row.lessonsTeaching.push(lesson.id);
          row.exercisesPracticing += lesson.exercises.length;
        }
        for (const e of lesson.exercises) {
          for (const oid of (e as { objectiveTargets?: string[] }).objectiveTargets ?? []) {
            const row = rows.get(oid);
            if (row) row.exercisesTargeting += 1;
          }
        }
      }
    }
  }
  for (const concept of input.concepts) {
    for (const oid of concept.objectives ?? []) {
      rows.get(oid)?.conceptsTeaching.push(concept.id);
    }
  }
  for (const targets of input.checkpointItemTargets) {
    for (const oid of targets) {
      const row = rows.get(oid);
      if (row) row.checkpointItems += 1;
    }
  }
  for (const targets of input.placementItemTargets) {
    for (const oid of targets) {
      const row = rows.get(oid);
      if (row) row.placementItems += 1;
    }
  }
  return [...rows.values()];
}

// ---------------------------------------------------------------------------
// CEFR alignment report (§133)
// ---------------------------------------------------------------------------

export type CefrAlignmentReport = {
  levels: {
    level: CefrLevel;
    scales: {
      scaleName: string;
      sourceRef: string;
      direct: string[];
      supports: string[];
    }[];
  }[];
};

export function buildCefrAlignment(objectives: CourseObjective[]): CefrAlignmentReport {
  const byLevel = new Map<CefrLevel, Map<string, { sourceRef: string; direct: string[]; supports: string[] }>>();
  for (const o of objectives) {
    for (const a of o.cefrAlignments) {
      let scales = byLevel.get(a.level);
      if (!scales) byLevel.set(a.level, (scales = new Map()));
      let entry = scales.get(a.scaleName);
      if (!entry) scales.set(a.scaleName, (entry = { sourceRef: a.sourceRef, direct: [], supports: [] }));
      (a.relation === "direct" ? entry.direct : entry.supports).push(o.id);
    }
  }
  const levelOrder: CefrLevel[] = ["PRE_A1", "A1", "A2", "B1", "B2", "C1", "C2"];
  return {
    levels: levelOrder
      .filter((l) => byLevel.has(l))
      .map((level) => ({
        level,
        scales: [...byLevel.get(level)!.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([scaleName, e]) => ({
            scaleName,
            sourceRef: e.sourceRef,
            direct: [...e.direct].sort(),
            supports: [...e.supports].sort(),
          })),
      })),
  };
}

// ---------------------------------------------------------------------------
// Overall-level claim gate (§98-103, §134-135, §145)
// ---------------------------------------------------------------------------

export type DomainStatus =
  | "covered"
  | "objectives_not_assessed"
  | "no_direct_objective"
  | "no_objectives_in_domain";

export type ClaimGateResult = {
  policyVersion: number;
  minItemsForAssessed: number;
  levels: {
    level: CefrLevel;
    claimable: boolean;
    domains: {
      domain: ObjectiveCategory;
      status: DomainStatus;
      directAssessedObjectives: string[];
    }[];
    coveredCompetences: string[];
    unassessedDomains: ObjectiveCategory[];
    evidenceLimitations: string[];
  }[];
  wording: string;
};

/**
 * The gate. Inputs are CONTENT ONLY — objectives, policy, and per-objective
 * scored-item counts from authored checkpoints. There is deliberately no
 * learner-state parameter: completing lessons, accumulating XP or knowing
 * N words can never make a level claimable (§100-101, §145).
 */
export function evaluateClaimGate(input: {
  objectives: CourseObjective[];
  policy: ClaimPolicy;
  checkpointItemTargets: string[][];
  minItemsForAssessed?: number;
}): ClaimGateResult {
  const minItems = input.minItemsForAssessed ?? 2;
  const itemCount = new Map<string, number>();
  for (const targets of input.checkpointItemTargets) {
    for (const oid of new Set(targets)) {
      itemCount.set(oid, (itemCount.get(oid) ?? 0) + 1);
    }
  }
  const levels = input.policy.evaluatedLevels.map((level) => {
    const domains = input.policy.requiredDomains.map((domain) => {
      const inDomain = input.objectives.filter((o) => o.category === domain);
      if (inDomain.length === 0) {
        return { domain, status: "no_objectives_in_domain" as const, directAssessedObjectives: [] };
      }
      const direct = inDomain.filter((o) =>
        o.cefrAlignments.some((a) => a.level === level && a.relation === "direct")
      );
      if (direct.length === 0) {
        return { domain, status: "no_direct_objective" as const, directAssessedObjectives: [] };
      }
      const assessed = direct.filter((o) => (itemCount.get(o.id) ?? 0) >= minItems);
      if (assessed.length < input.policy.minAssessedObjectivesPerDomain) {
        return { domain, status: "objectives_not_assessed" as const, directAssessedObjectives: [] };
      }
      return {
        domain,
        status: "covered" as const,
        directAssessedObjectives: assessed.map((o) => o.id).sort(),
      };
    });
    const claimable = domains.every((d) => d.status === "covered");
    const coveredCompetences = [
      ...new Set(
        input.objectives
          .filter(
            (o) =>
              ["lexical", "grammar", "phonology", "strategy"].includes(o.category) &&
              o.cefrAlignments.some((a) => a.level === level) &&
              (itemCount.get(o.id) ?? 0) >= minItems
          )
          .map((o) => o.id)
      ),
    ].sort();
    const unassessed = domains
      .filter((d) => d.status !== "covered")
      .map((d) => d.domain);
    return {
      level,
      claimable,
      domains,
      coveredCompetences,
      unassessedDomains: unassessed,
      evidenceLimitations: [
        ...(domains.some((d) => d.domain === "spoken_production" && d.status !== "covered")
          ? ["Spoken production is not assessed (no speaking assessment exists)."]
          : []),
        ...(domains.some((d) => d.domain === "spoken_reception" && d.status !== "covered")
          ? ["Listening is not assessed in scored assessment."]
          : []),
        ...(domains.some((d) => d.domain === "interaction" && d.status !== "covered")
          ? ["Interaction is not assessed."]
          : []),
      ],
    };
  });
  return {
    policyVersion: input.policy.version,
    minItemsForAssessed: minItems,
    levels,
    wording: input.policy.claimWording,
  };
}
