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
  | "insufficient_breadth"
  | "objectives_not_assessed"
  | "no_direct_objective"
  | "no_objectives_in_domain";

/** One scored item's evidence: targets + task family + shared source input. */
export type ScoredItemEvidence = {
  objectiveTargets: string[];
  taskFamily: string;
  /** Shared clip/text id; null = the item is its own independent input. */
  inputId: string | null;
};

export type DomainBreadth = {
  taskFamilies: string[];
  scaleNames: string[];
  distinctInputsByObjective: Record<string, number>;
};

export type ClaimGateResult = {
  policyVersion: number;
  minItemsForAssessed: number;
  breadthPolicy: {
    minItemsPerDirectObjective: number;
    minDistinctInputsPerDirectObjective: number;
    minTaskFamiliesPerDomain: number;
    minDistinctScalesPerDomain: number;
  };
  levels: {
    level: CefrLevel;
    claimable: boolean;
    domains: {
      domain: ObjectiveCategory;
      status: DomainStatus;
      directAssessedObjectives: string[];
      breadth?: DomainBreadth;
    }[];
    coveredCompetences: string[];
    unassessedDomains: ObjectiveCategory[];
    evidenceLimitations: string[];
  }[];
  wording: string;
};

/**
 * The gate — hardened in Phase 7 (P7 §10-14). Inputs are CONTENT ONLY:
 * objectives, policy, and the scored checkpoint items' evidence rows. There
 * is deliberately no learner-state parameter: completing lessons,
 * accumulating XP or knowing N words can never make a level claimable
 * (§100-101, §145).
 *
 * A domain covers a level only when, beyond having a direct objective at
 * all, its evidence clears every product-local breadth rule: enough items
 * per direct objective, enough INDEPENDENT source inputs (three questions
 * about one clip are one input, P7 §13), and — across the domain — enough
 * distinct task families and distinct aligned CEFR scale families. These
 * thresholds are internal evidence-sufficiency rules, not Council of Europe
 * cut scores (P7 §12).
 */
export function evaluateClaimGate(input: {
  objectives: CourseObjective[];
  policy: ClaimPolicy;
  checkpointItems: ScoredItemEvidence[];
}): ClaimGateResult {
  const { policy } = input;
  const minItems = policy.minItemsPerDirectObjective;

  // Per-objective evidence rollup from the scored items.
  const perObjective = new Map<
    string,
    { items: number; inputs: Set<string>; families: Set<string> }
  >();
  let standaloneCounter = 0;
  for (const item of input.checkpointItems) {
    // A standalone item (no shared clip/text) is its own independent input.
    const inputKey = item.inputId ?? `standalone:${standaloneCounter++}`;
    for (const oid of new Set(item.objectiveTargets)) {
      let row = perObjective.get(oid);
      if (!row) perObjective.set(oid, (row = { items: 0, inputs: new Set(), families: new Set() }));
      row.items += 1;
      row.inputs.add(inputKey);
      row.families.add(item.taskFamily);
    }
  }
  const evidenceFor = (oid: string) =>
    perObjective.get(oid) ?? { items: 0, inputs: new Set<string>(), families: new Set<string>() };

  const levels = policy.evaluatedLevels.map((level) => {
    const domains = policy.requiredDomains.map((domain) => {
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
      // An objective is assessed only with enough items AND enough
      // independent inputs (P7 §13).
      const assessed = direct.filter((o) => {
        const e = evidenceFor(o.id);
        return e.items >= minItems && e.inputs.size >= policy.minDistinctInputsPerDirectObjective;
      });
      if (assessed.length < policy.minAssessedObjectivesPerDomain) {
        return { domain, status: "objectives_not_assessed" as const, directAssessedObjectives: [] };
      }
      // Domain-level breadth (P7 §11, §14): distinct task families across
      // the assessed objectives' evidence, and distinct aligned CEFR scale
      // families among their direct alignments at this level.
      const families = new Set<string>();
      const distinctInputsByObjective: Record<string, number> = {};
      for (const o of assessed) {
        const e = evidenceFor(o.id);
        for (const f of e.families) families.add(f);
        distinctInputsByObjective[o.id] = e.inputs.size;
      }
      const scales = new Set<string>();
      for (const o of assessed) {
        for (const a of o.cefrAlignments) {
          if (a.level === level && a.relation === "direct") scales.add(a.scaleName);
        }
      }
      const breadth: DomainBreadth = {
        taskFamilies: [...families].sort(),
        scaleNames: [...scales].sort(),
        distinctInputsByObjective,
      };
      if (
        families.size < policy.minTaskFamiliesPerDomain ||
        scales.size < policy.minDistinctScalesPerDomain
      ) {
        return {
          domain,
          status: "insufficient_breadth" as const,
          directAssessedObjectives: assessed.map((o) => o.id).sort(),
          breadth,
        };
      }
      return {
        domain,
        status: "covered" as const,
        directAssessedObjectives: assessed.map((o) => o.id).sort(),
        breadth,
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
              evidenceFor(o.id).items >= minItems
          )
          .map((o) => o.id)
      ),
    ].sort();
    const unassessed = domains
      .filter((d) => d.status !== "covered")
      .map((d) => d.domain);
    const spokenReceptionCovered = domains.some(
      (d) => d.domain === "spoken_reception" && d.status === "covered"
    );
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
        ...(spokenReceptionCovered
          ? [
              "Listening evidence uses clear synthesized standard-French audio with limited speaker and accent diversity.",
            ]
          : []),
        ...(domains.some((d) => d.domain === "interaction" && d.status !== "covered")
          ? ["Interaction is not assessed."]
          : []),
      ],
    };
  });
  return {
    policyVersion: policy.version,
    minItemsForAssessed: minItems,
    breadthPolicy: {
      minItemsPerDirectObjective: policy.minItemsPerDirectObjective,
      minDistinctInputsPerDirectObjective: policy.minDistinctInputsPerDirectObjective,
      minTaskFamiliesPerDomain: policy.minTaskFamiliesPerDomain,
      minDistinctScalesPerDomain: policy.minDistinctScalesPerDomain,
    },
    levels,
    wording: policy.claimWording,
  };
}
