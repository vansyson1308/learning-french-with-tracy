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

import { PackSchema, type ClaimPolicy as Policy, type CourseObjective } from "../../content/schema";
import { validateCurriculumMapping } from "../lib/assessment";
import {
  buildCefrAlignment,
  buildObjectiveCoverage,
  evaluateClaimGate,
} from "../lib/assessment-reports";
import { readJson } from "../lib/pipeline";

const frPack = () => PackSchema.parse(readJson("content/courses/fr-en.json"));

describe("curriculum mapping — real data + mutations (§144)", () => {
  test("every French lesson declares resolving objectives; every objective is taught", () => {
    const result = validateCurriculumMapping({
      objectives: loadCourseObjectives(),
      packs: [{ courseId: "fr-en", pack: frPack() }],
      concepts: [],
    });
    expect(result.errors).toEqual([]);
  });

  test("a French lesson without objectives fails", () => {
    const pack = frPack();
    delete pack.sections[0].units[0].lessons[0].objectives;
    const result = validateCurriculumMapping({
      objectives: loadCourseObjectives(),
      packs: [{ courseId: "fr-en", pack }],
      concepts: [],
    });
    expect(result.errors.join("\n")).toContain("must declare objectives");
  });

  test("objective metadata on a non-French course fails (§153)", () => {
    const pack = frPack();
    const result = validateCurriculumMapping({
      objectives: loadCourseObjectives(),
      packs: [{ courseId: "es-en", pack }],
      concepts: [],
    });
    expect(result.errors.join("\n")).toContain("French-only metadata");
  });

  test("unknown objective references fail", () => {
    const pack = frPack();
    pack.sections[0].units[0].lessons[0].objectives = ["fr.obj.ghost.thing"];
    const result = validateCurriculumMapping({
      objectives: loadCourseObjectives(),
      packs: [{ courseId: "fr-en", pack }],
      concepts: [],
    });
    expect(result.errors.join("\n")).toContain("unknown objective");
  });

  test("an objective taught by no lesson fails (§23 anti-invention)", () => {
    const objectives = loadCourseObjectives();
    objectives.objectives.push({
      id: "fr.obj.test.untaught",
      title: "Untaught",
      canDo: "I can do a thing no lesson teaches.",
      category: "grammar",
      prerequisites: [],
      cefrAlignments: [
        { level: "A1", scaleName: "Grammatical accuracy", relation: "supports", sourceRef: "cefr-cv-2020:grammatical-accuracy" },
      ],
      essential: false,
    });
    const result = validateCurriculumMapping({
      objectives,
      packs: [{ courseId: "fr-en", pack: frPack() }],
      concepts: [],
    });
    expect(result.errors.join("\n")).toContain("taught by no lesson");
  });
});

describe("coverage + alignment reports are faithful", () => {
  test("every objective is taught and the S2 grammar drills carry explicit targets", () => {
    const rows = buildObjectiveCoverage({
      objectives: loadCourseObjectives().objectives,
      frPack: frPack(),
      concepts: readJson("content/fr/pedagogy/concepts.json") ? (readJson("content/fr/pedagogy/concepts.json") as { concepts: { id: string; objectives?: string[] }[] }).concepts : [],
      checkpointItemTargets: [],
      placementItemTargets: [],
    });
    expect(rows.length).toBe(17);
    for (const row of rows) {
      expect({ id: row.id, lessons: row.lessonsTeaching.length > 0 }).toEqual({ id: row.id, lessons: true });
    }
    const byId = new Map(rows.map((r) => [r.id, r]));
    expect(byId.get("fr.obj.reading.familiar_words")!.lessonsTeaching.length).toBe(20);
    expect(byId.get("fr.obj.gender.articles_basic")!.exercisesTargeting).toBeGreaterThanOrEqual(4);
    expect(byId.get("fr.obj.numbers.0_100")!.exercisesTargeting).toBeGreaterThanOrEqual(30);
    expect(byId.get("fr.obj.verbs.passe_compose_avoir")!.exercisesTargeting).toBe(5);
  });

  test("the alignment report exposes the single Pre-A1 direct and groups supports", () => {
    const report = buildCefrAlignment(loadCourseObjectives().objectives);
    const pre = report.levels.find((l) => l.level === "PRE_A1")!;
    const reading = pre.scales.find((s) => s.scaleName.startsWith("Reading"))!;
    expect(reading.direct).toEqual(["fr.obj.reading.familiar_words"]);
    const a1 = report.levels.find((l) => l.level === "A1")!;
    for (const scale of a1.scales) expect(scale.direct).toEqual([]);
  });
});

describe("claim gate honesty (§145)", () => {
  const spokenLess = () => loadCourseObjectives().objectives;
  const policy = (): Policy => loadClaimPolicy();

  test("real content: every evaluated level is NOT claimable", () => {
    const gate = evaluateClaimGate({
      objectives: spokenLess(),
      policy: policy(),
      checkpointItemTargets: [],
    });
    for (const level of gate.levels) {
      expect({ level: level.level, claimable: level.claimable }).toEqual({
        level: level.level,
        claimable: false,
      });
    }
  });

  test("full checkpoint coverage of every EXISTING objective still never claims a level (speaking missing)", () => {
    const objectives = spokenLess();
    // Saturate: 5 hypothetical scored items per objective.
    const items = objectives.flatMap((o) => [[o.id], [o.id], [o.id], [o.id], [o.id]]);
    const gate = evaluateClaimGate({ objectives, policy: policy(), checkpointItemTargets: items });
    for (const level of gate.levels) {
      expect(level.claimable).toBe(false);
      expect(level.unassessedDomains).toContain("spoken_production");
      expect(level.unassessedDomains).toContain("interaction");
      expect(level.evidenceLimitations.join(" ")).toContain("Spoken production is not assessed");
    }
  });

  test("lesson completion is not even an input: the gate takes content only", () => {
    // Structural: evaluateClaimGate's signature has no learner state. With
    // zero scored items nothing is claimable regardless of any imaginable
    // completion state.
    const gate = evaluateClaimGate({
      objectives: spokenLess(),
      policy: policy(),
      checkpointItemTargets: [],
    });
    expect(gate.levels.every((l) => !l.claimable)).toBe(true);
  });

  test("the gate CAN open when a level's domains are genuinely direct + assessed", () => {
    const mk = (id: string, category: CourseObjective["category"]): CourseObjective => ({
      id,
      title: id,
      canDo: `I can demonstrably do ${id}.`,
      category,
      prerequisites: [],
      cefrAlignments: [
        {
          level: "PRE_A1",
          scaleName: "Synthetic scale",
          relation: "direct",
          sourceRef: "cefr-cv-2020:overall-reading-comprehension",
        },
      ],
      essential: true,
      evidenceNote: "Synthetic full-coverage fixture.",
    });
    const objectives = [
      mk("fr.obj.syn.listen", "spoken_reception"),
      mk("fr.obj.syn.read", "written_reception"),
      mk("fr.obj.syn.speak", "spoken_production"),
      mk("fr.obj.syn.write", "written_production"),
      mk("fr.obj.syn.interact", "interaction"),
    ];
    const items = objectives.flatMap((o) => [[o.id], [o.id]]);
    const gate = evaluateClaimGate({
      objectives,
      policy: { ...policy(), evaluatedLevels: ["PRE_A1"] },
      checkpointItemTargets: items,
    });
    expect(gate.levels[0].claimable).toBe(true);
  });

  test("one scored item per objective is below the evidence floor (§64)", () => {
    const objectives = spokenLess();
    const items = objectives.map((o) => [o.id]);
    const gate = evaluateClaimGate({ objectives, policy: policy(), checkpointItemTargets: items });
    const a1 = gate.levels.find((l) => l.level === "A1")!;
    expect(a1.coveredCompetences).toEqual([]);
  });
});

import { loadCheckpoints, validateCheckpointsData } from "../lib/assessment";
import { loadConjugations } from "../lib/pedagogy";

describe("checkpoint banks — real data + mutations (§53, §64)", () => {
  const inputs = () => ({
    checkpoints: loadCheckpoints(),
    objectives: loadCourseObjectives(),
    conjugations: loadConjugations(),
    frPack: frPack(),
  });

  test("the committed banks validate", () => {
    expect(validateCheckpointsData(inputs()).errors).toEqual([]);
  });

  test("every essential objective has ≥2 scored items across the banks", () => {
    const { checkpoints, objectives } = inputs();
    const count = new Map<string, number>();
    for (const cp of checkpoints.checkpoints)
      for (const item of cp.items)
        for (const oid of item.objectiveTargets)
          count.set(oid, (count.get(oid) ?? 0) + 1);
    for (const o of objectives.objectives.filter((x) => x.essential)) {
      expect({ id: o.id, enough: (count.get(o.id) ?? 0) >= 2 }).toEqual({ id: o.id, enough: true });
    }
  });

  test("an unknown objective target fails", () => {
    const input = inputs();
    input.checkpoints.checkpoints[0].items[0].objectiveTargets = ["fr.obj.ghost.thing"];
    expect(validateCheckpointsData(input).errors.join("\n")).toContain("unknown objective");
  });

  test("a cloze whose answer disagrees with the authored table fails", () => {
    const input = inputs();
    const item = input.checkpoints.checkpoints[1].items.find(
      (i) => i.exercise.type === "conjugationCloze"
    )!;
    (item.exercise as { answer: string }).answer = "sui";
    expect(validateCheckpointsData(input).errors.join("\n")).toContain("authored cell");
  });

  test("lexical gradeTargets on a checkpoint item fail (§56)", () => {
    const input = inputs();
    (input.checkpoints.checkpoints[0].items[0].exercise as { gradeTargets?: string[] }).gradeTargets = [
      "fr:w:chat",
    ];
    expect(validateCheckpointsData(input).errors.join("\n")).toContain("must not carry lexical gradeTargets");
  });

  test("dropping essential coverage below the floor fails (§64)", () => {
    const input = inputs();
    for (const cp of input.checkpoints.checkpoints) {
      for (const item of cp.items) {
        item.objectiveTargets = item.objectiveTargets.filter(
          (t) => t !== "fr.obj.greetings.basic"
        );
        if (item.objectiveTargets.length === 0) item.objectiveTargets = ["fr.obj.vocab.places_travel"];
      }
    }
    expect(validateCheckpointsData(input).errors.join("\n")).toContain(
      "essential objective fr.obj.greetings.basic"
    );
  });

  test("an unknown section reference fails", () => {
    const input = inputs();
    input.checkpoints.checkpoints[0].sectionId = "fr-en:section-9";
    expect(validateCheckpointsData(input).errors.join("\n")).toContain("unknown section");
  });

  test("a number drill in a checkpoint must agree with the engine", () => {
    const input = inputs();
    const item = input.checkpoints.checkpoints[1].items.find(
      (i) => i.exercise.type === "typeAnswer"
    )!;
    (item.exercise as { answer: string }).answer = "soixante-et-treize";
    expect(validateCheckpointsData(input).errors.join("\n")).toContain("engine spelling");
  });
});

import { loadPlacement, validatePlacementData } from "../lib/assessment";

describe("placement bank — real data + mutations (§73-78)", () => {
  const inputs = () => ({
    placement: loadPlacement(),
    objectives: loadCourseObjectives(),
    conjugations: loadConjugations(),
    frPack: frPack(),
  });

  test("the committed placement plan validates", () => {
    expect(validatePlacementData(inputs()).errors).toEqual([]);
  });

  test("an unknown cluster objective fails", () => {
    const input = inputs();
    input.placement.stages[0].clusters[0].objectiveId = "fr.obj.ghost.thing";
    expect(validatePlacementData(input).errors.join("\n")).toContain("unknown objective");
  });

  test("an anchor that breaks curriculum order fails (§75)", () => {
    const input = inputs();
    // Point the greetings cluster (second) at lesson one — earlier than the
    // everyday cluster's anchor before it.
    input.placement.stages[0].clusters[1].anchorLessonId = "fr-en:u0-l0";
    expect(validatePlacementData(input).errors.join("\n")).toContain("breaks curriculum order");
  });

  test("an anchor outside the fr-en pack fails", () => {
    const input = inputs();
    input.placement.stages[0].clusters[0].anchorLessonId = "fr-en:zz-l9";
    expect(validatePlacementData(input).errors.join("\n")).toContain("not an fr-en lesson");
  });

  test("an unknown all-comfortable anchor fails", () => {
    const input = inputs();
    input.placement.allComfortableLessonId = "fr-en:zz-l9";
    expect(validatePlacementData(input).errors.join("\n")).toContain("not an fr-en lesson");
  });

  test("exceeding the item budget fails (§76)", () => {
    const input = inputs();
    const cluster = input.placement.stages[0].clusters[3]; // places: one item today
    const clone = JSON.parse(JSON.stringify(cluster.items[0]));
    clone.id = "fr.pli.s1.extra";
    clone.exercise.id = "fr-plx-s1-extra";
    cluster.items.push(clone);
    expect(validatePlacementData(input).errors.join("\n")).toContain("exceed the maxItems budget");
  });

  test("a duplicate item id fails", () => {
    const input = inputs();
    const cluster = input.placement.stages[0].clusters[0];
    cluster.items[1].id = cluster.items[0].id;
    expect(validatePlacementData(input).errors.join("\n")).toContain("duplicate item id");
  });

  test("an item whose primary target is not its cluster's objective fails", () => {
    const input = inputs();
    input.placement.stages[0].clusters[0].items[0].objectiveTargets = [
      "fr.obj.greetings.basic",
    ];
    expect(validatePlacementData(input).errors.join("\n")).toContain("≠ cluster objective");
  });

  test("lexical gradeTargets on a placement item fail (§78)", () => {
    const input = inputs();
    (input.placement.stages[0].clusters[0].items[0].exercise as { gradeTargets?: string[] }).gradeTargets =
      ["fr:w:chat"];
    expect(validatePlacementData(input).errors.join("\n")).toContain(
      "must not carry lexical gradeTargets"
    );
  });

  test("a cloze whose answer disagrees with the authored table fails", () => {
    const input = inputs();
    const item = input.placement.stages[1].clusters
      .flatMap((c) => c.items)
      .find((i) => i.exercise.type === "conjugationCloze")!;
    (item.exercise as { answer: string }).answer = "as";
    expect(validatePlacementData(input).errors.join("\n")).toContain("authored cell");
  });

  test("a number drill in placement must agree with the engine", () => {
    const input = inputs();
    const item = input.placement.stages[1].clusters
      .flatMap((c) => c.items)
      .find((i) => i.exercise.type === "typeAnswer")!;
    (item.exercise as { answer: string }).answer = "saize";
    expect(validatePlacementData(input).errors.join("\n")).toContain("engine spelling");
  });
});
