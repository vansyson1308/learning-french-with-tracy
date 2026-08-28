/**
 * Phase 6 objective graph + claim policy (§143): the committed data
 * validates, and mutation fixtures prove every rule fires — including the
 * honesty invariants (direct requires an evidence boundary; the claim gate
 * can never be satisfied by competence categories alone).
 */
import { describe, expect, test } from "bun:test";

import type { ClaimPolicy, CourseObjectives } from "../../content/schema";
import {
  loadClaimPolicy,
  loadCourseObjectives,
  topologicalObjectiveOrder,
  validateAssessment,
  validateClaimPolicyData,
  validateObjectiveGraph,
} from "../lib/assessment";

describe("committed assessment data", () => {
  test("validateAssessment passes on the real content", () => {
    expect(validateAssessment().errors).toEqual([]);
  });

  test("the graph has the authored shape: 17 objectives, 8 essential, exactly 1 direct alignment", () => {
    const { objectives } = loadCourseObjectives();
    expect(objectives.length).toBe(17);
    expect(objectives.filter((o) => o.essential).length).toBe(8);
    const directs = objectives.flatMap((o) =>
      o.cefrAlignments.filter((a) => a.relation === "direct").map((a) => `${o.id}@${a.level}`)
    );
    // The single defensible direct claim (§166): written recognition of
    // familiar words IS what the course assesses — at Pre-A1 only.
    expect(directs).toEqual(["fr.obj.reading.familiar_words@PRE_A1"]);
  });

  test("topological order puts every prerequisite before its dependent", () => {
    const { objectives } = loadCourseObjectives();
    const order = topologicalObjectiveOrder(objectives);
    expect(order.length).toBe(objectives.length);
    const pos = new Map(order.map((id, i) => [id, i]));
    for (const o of objectives) {
      for (const p of o.prerequisites) {
        expect(pos.get(p)!).toBeLessThan(pos.get(o.id)!);
      }
    }
  });

  test("claim policy is activity-based and internally consistent", () => {
    const policy = loadClaimPolicy();
    expect(validateClaimPolicyData({ policy }).errors).toEqual([]);
    expect(policy.requiredDomains).toContain("spoken_production");
    expect(policy.requiredDomains).toContain("interaction");
  });
});

function fixture(): CourseObjectives {
  return {
    version: 1,
    language: "fr",
    objectives: [
      {
        id: "fr.obj.test.alpha",
        title: "Alpha",
        canDo: "I can do the alpha thing.",
        category: "grammar",
        prerequisites: [],
        cefrAlignments: [
          {
            level: "A1",
            scaleName: "Grammatical accuracy",
            relation: "supports",
            sourceRef: "cefr-cv-2020:grammatical-accuracy",
          },
        ],
        essential: true,
      },
      {
        id: "fr.obj.test.beta",
        title: "Beta",
        canDo: "I can do the beta thing.",
        category: "lexical",
        prerequisites: ["fr.obj.test.alpha"],
        cefrAlignments: [
          {
            level: "A1",
            scaleName: "Vocabulary range",
            relation: "supports",
            sourceRef: "cefr-cv-2020:vocabulary-range",
          },
        ],
        essential: false,
      },
    ],
  };
}

describe("validateObjectiveGraph — every rule fires", () => {
  test("fixture baseline is valid", () => {
    expect(validateObjectiveGraph({ objectives: fixture() }).errors).toEqual([]);
  });

  test("duplicate ids fail", () => {
    const objectives = fixture();
    objectives.objectives.push({ ...objectives.objectives[0] });
    expect(validateObjectiveGraph({ objectives }).errors.join("\n")).toContain("duplicate objective id");
  });

  test("unresolved prerequisites fail", () => {
    const objectives = fixture();
    objectives.objectives[1].prerequisites = ["fr.obj.test.ghost"];
    expect(validateObjectiveGraph({ objectives }).errors.join("\n")).toContain("does not resolve");
  });

  test("self-prerequisites fail", () => {
    const objectives = fixture();
    objectives.objectives[0].prerequisites = ["fr.obj.test.alpha"];
    expect(validateObjectiveGraph({ objectives }).errors.join("\n")).toContain("itself");
  });

  test("prerequisite cycles fail", () => {
    const objectives = fixture();
    objectives.objectives[0].prerequisites = ["fr.obj.test.beta"];
    expect(validateObjectiveGraph({ objectives }).errors.join("\n")).toContain("cycle");
  });

  test("unregistered sourceRefs fail", () => {
    const objectives = fixture();
    objectives.objectives[0].cefrAlignments[0].sourceRef = "wikipedia:grammar";
    expect(validateObjectiveGraph({ objectives }).errors.join("\n")).toContain("not in the registered CEFR source list");
  });

  test("a direct alignment without an evidence boundary fails (anti-overclaim)", () => {
    const objectives = fixture();
    objectives.objectives[0].cefrAlignments[0].relation = "direct";
    expect(validateObjectiveGraph({ objectives }).errors.join("\n")).toContain("requires an evidenceNote");
  });

  test("duplicate (level, scale) alignments fail", () => {
    const objectives = fixture();
    objectives.objectives[0].cefrAlignments.push({ ...objectives.objectives[0].cefrAlignments[0] });
    expect(validateObjectiveGraph({ objectives }).errors.join("\n")).toContain("duplicate CEFR alignment");
  });
});

describe("validateClaimPolicyData — the gate stays activity-based", () => {
  const policy = (over: Partial<ClaimPolicy> = {}): ClaimPolicy => ({
    version: 1,
    evaluatedLevels: ["PRE_A1", "A1"],
    requiredDomains: ["written_reception", "spoken_production", "interaction"],
    minAssessedObjectivesPerDomain: 1,
    claimWording: "CEFR-aligned estimate.",
    ...over,
  });

  test("baseline passes", () => {
    expect(validateClaimPolicyData({ policy: policy() }).errors).toEqual([]);
  });

  test("a competence category as a required domain fails (§8)", () => {
    for (const banned of ["lexical", "grammar", "phonology", "strategy"] as const) {
      expect(
        validateClaimPolicyData({ policy: policy({ requiredDomains: ["written_reception", banned] }) })
          .errors.join("\n")
      ).toContain("competence, not a communicative activity");
    }
  });

  test("duplicate levels and domains fail", () => {
    expect(
      validateClaimPolicyData({ policy: policy({ evaluatedLevels: ["A1", "A1"] }) }).errors.join("\n")
    ).toContain("duplicate evaluated level");
    expect(
      validateClaimPolicyData({
        policy: policy({ requiredDomains: ["interaction", "interaction"] }),
      }).errors.join("\n")
    ).toContain("duplicate required domain");
  });
});
