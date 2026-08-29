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

  test("the graph has the authored shape: 24 objectives, 15 essential, 8 direct alignments", () => {
    const { objectives } = loadCourseObjectives();
    expect(objectives.length).toBe(24); // 17 Phase-6 + 7 Phase-7 receptive
    // 8 Phase-6 essentials + the 7 receptive objectives flipped essential
    // in the same commit as the Section-3 checkpoint that assesses them.
    expect(objectives.filter((o) => o.essential).length).toBe(15);
    const directs = objectives.flatMap((o) =>
      o.cefrAlignments.filter((a) => a.relation === "direct").map((a) => `${o.id}@${a.level}`)
    );
    // Directs stay defensible-only (§166, P7 §92-96): the two Pre-A1
    // familiar-words claims (one per receptive modality) plus the five
    // Phase-7 A1 reception objectives the Section-3 checkpoint assesses.
    // Production/interaction still carry NO direct claim anywhere.
    expect(directs.sort()).toEqual([
      "fr.obj.listening.announcements@A1",
      "fr.obj.listening.familiar_words@PRE_A1",
      "fr.obj.listening.short_dialogues@A1",
      "fr.obj.listening.short_info@A1",
      "fr.obj.reading.familiar_words@PRE_A1",
      "fr.obj.reading.notices_info@A1",
      "fr.obj.reading.short_messages@A1",
      "fr.obj.reading.short_texts@A1",
    ]);
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
    version: 2,
    evaluatedLevels: ["PRE_A1", "A1"],
    requiredDomains: ["written_reception", "spoken_production", "interaction"],
    minAssessedObjectivesPerDomain: 1,
    minItemsPerDirectObjective: 3,
    minDistinctInputsPerDirectObjective: 2,
    minTaskFamiliesPerDomain: 2,
    minDistinctScalesPerDomain: 2,
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
import { collectScoredItemEvidence, validateCurriculumMapping } from "../lib/assessment";
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
    expect(rows.length).toBe(24);
    for (const row of rows) {
      expect({ id: row.id, lessons: row.lessonsTeaching.length > 0 }).toEqual({ id: row.id, lessons: true });
    }
    const byId = new Map(rows.map((r) => [r.id, r]));
    // 20 Section-1 lessons + the 3 Section-3 lessons whose word-level
    // reading work also targets written familiar-word recognition.
    expect(byId.get("fr.obj.reading.familiar_words")!.lessonsTeaching.length).toBe(23);
    // Phase-7 receptive objectives are all taught by real Section-3 lessons.
    expect(byId.get("fr.obj.listening.familiar_words")!.exercisesTargeting).toBeGreaterThanOrEqual(12);
    expect(byId.get("fr.obj.listening.short_dialogues")!.exercisesTargeting).toBeGreaterThanOrEqual(6);
    expect(byId.get("fr.obj.reading.notices_info")!.exercisesTargeting).toBeGreaterThanOrEqual(6);
    expect(byId.get("fr.obj.gender.articles_basic")!.exercisesTargeting).toBeGreaterThanOrEqual(4);
    expect(byId.get("fr.obj.numbers.0_100")!.exercisesTargeting).toBeGreaterThanOrEqual(30);
    expect(byId.get("fr.obj.verbs.passe_compose_avoir")!.exercisesTargeting).toBe(5);
  });

  test("the alignment report exposes the receptive directs and groups supports", () => {
    const report = buildCefrAlignment(loadCourseObjectives().objectives);
    const pre = report.levels.find((l) => l.level === "PRE_A1")!;
    const preDirects = pre.scales
      .filter((s) => s.direct.length > 0)
      .map((s) => [s.scaleName, s.direct]);
    // One familiar-words direct per receptive modality — nothing else at Pre-A1.
    expect(preDirects).toEqual([
      ["Listening comprehension (overall)", ["fr.obj.listening.familiar_words"]],
      ["Reading comprehension (overall)", ["fr.obj.reading.familiar_words"]],
    ]);
    const a1 = report.levels.find((l) => l.level === "A1")!;
    // A1 directs exist ONLY on the reception scales the Section-3
    // checkpoint assesses; production/interaction scales stay empty.
    for (const scale of a1.scales) {
      const receptive = /Listening|Reading|Understanding conversation/.test(scale.scaleName);
      if (!receptive) expect({ scale: scale.scaleName, direct: scale.direct }).toEqual({ scale: scale.scaleName, direct: [] });
    }
    const a1Directs = a1.scales.flatMap((s) => s.direct).sort();
    expect(a1Directs).toEqual([
      "fr.obj.listening.announcements",
      "fr.obj.listening.short_dialogues",
      "fr.obj.listening.short_info",
      "fr.obj.reading.notices_info",
      "fr.obj.reading.short_messages",
      "fr.obj.reading.short_texts",
    ]);
  });
});

describe("claim gate honesty (§145) — hardened (P7 §10-14, §149)", () => {
  const spokenLess = () => loadCourseObjectives().objectives;
  const policy = (): Policy => loadClaimPolicy();
  /** Evidence-row helper: standalone item unless an inputId is given. */
  const ev = (oid: string | string[], taskFamily = "select", inputId: string | null = null) => ({
    objectiveTargets: Array.isArray(oid) ? oid : [oid],
    taskFamily,
    inputId,
  });

  test("real content: every evaluated level is NOT claimable", () => {
    const gate = evaluateClaimGate({
      objectives: spokenLess(),
      policy: policy(),
      checkpointItems: [],
    });
    for (const level of gate.levels) {
      expect({ level: level.level, claimable: level.claimable }).toEqual({
        level: level.level,
        claimable: false,
      });
    }
  });

  test("real checkpoint evidence: reception domains covered at A1; A1 overall still false (P7 §149, §181)", () => {
    const evidence = [
      ...collectScoredItemEvidence("content/fr/assessment/checkpoints.json", "checkpoints"),
      ...collectScoredItemEvidence("content/fr/assessment/placement.json", "stages"),
    ];
    const gate = evaluateClaimGate({
      objectives: spokenLess(),
      policy: policy(),
      checkpointItems: evidence,
    });
    const a1 = gate.levels.find((l) => l.level === "A1")!;
    const domain = (id: string) => a1.domains.find((d) => d.domain === id)!;
    // The Section-3 bank satisfies the hardened breadth gate for both
    // reception domains: >=1 assessed direct objective (3 items / 2 inputs
    // each), >=2 task families, >=2 scales.
    expect(domain("spoken_reception").status).toBe("covered");
    expect(domain("written_reception").status).toBe("covered");
    // Production and interaction remain honestly unclaimed, so the OVERALL
    // A1 claim stays false — teaching reception must never imply A1 (§181).
    expect(domain("spoken_production").status).toBe("no_objectives_in_domain");
    expect(domain("interaction").status).toBe("no_objectives_in_domain");
    expect(a1.claimable).toBe(false);
    for (const level of gate.levels) {
      expect({ level: level.level, claimable: level.claimable }).toEqual({
        level: level.level,
        claimable: false,
      });
    }
  });

  test("full checkpoint coverage of every EXISTING objective still never claims a level (speaking missing)", () => {
    const objectives = spokenLess();
    // Saturate: 5 hypothetical standalone scored items per objective across
    // two task families — breadth is not the blocker here, speaking is.
    const items = objectives.flatMap((o) => [
      ev(o.id),
      ev(o.id),
      ev(o.id),
      ev(o.id, "typeAnswer"),
      ev(o.id, "typeAnswer"),
    ]);
    const gate = evaluateClaimGate({ objectives, policy: policy(), checkpointItems: items });
    for (const level of gate.levels) {
      expect(level.claimable).toBe(false);
      expect(level.unassessedDomains).toContain("spoken_production");
      expect(level.unassessedDomains).toContain("interaction");
      expect(level.evidenceLimitations.join(" ")).toContain("Spoken production is not assessed");
    }
  });

  test("lesson completion is not even an input: the gate takes content only", () => {
    const gate = evaluateClaimGate({
      objectives: spokenLess(),
      policy: policy(),
      checkpointItems: [],
    });
    expect(gate.levels.every((l) => !l.claimable)).toBe(true);
  });

  const mkObjective = (
    id: string,
    category: CourseObjective["category"],
    scaleName = "Synthetic scale"
  ): CourseObjective => ({
    id,
    title: id,
    canDo: `I can demonstrably do ${id}.`,
    category,
    prerequisites: [],
    cefrAlignments: [
      {
        level: "PRE_A1",
        scaleName,
        relation: "direct",
        sourceRef: "cefr-cv-2020:overall-reading-comprehension",
      },
    ],
    essential: true,
    evidenceNote: "Synthetic full-coverage fixture.",
  });

  /** Two direct objectives per domain on distinct scales — full breadth. */
  const fullBreadthFixture = () => {
    const domains: CourseObjective["category"][] = [
      "spoken_reception",
      "written_reception",
      "spoken_production",
      "written_production",
      "interaction",
    ];
    const objectives = domains.flatMap((d) => [
      mkObjective(`fr.obj.syn.${d}.a`, d, `${d} scale one`),
      mkObjective(`fr.obj.syn.${d}.b`, d, `${d} scale two`),
    ]);
    // 3 items per objective, two independent inputs, two task families.
    const items = objectives.flatMap((o) => [
      ev(o.id, "select", `${o.id}:input1`),
      ev(o.id, "select", `${o.id}:input2`),
      ev(o.id, "typeAnswer", `${o.id}:input2`),
    ]);
    return { objectives, items };
  };

  test("the gate CAN open when domains have genuine direct, broad, multi-input evidence", () => {
    const { objectives, items } = fullBreadthFixture();
    const gate = evaluateClaimGate({
      objectives,
      policy: { ...policy(), evaluatedLevels: ["PRE_A1"] },
      checkpointItems: items,
    });
    expect(gate.levels[0].claimable).toBe(true);
    for (const d of gate.levels[0].domains) {
      expect(d.status).toBe("covered");
      expect(d.breadth!.taskFamilies.length).toBeGreaterThanOrEqual(2);
      expect(d.breadth!.scaleNames.length).toBeGreaterThanOrEqual(2);
    }
  });

  test("§149: many questions about ONE clip are one input — never enough breadth", () => {
    const { objectives } = fullBreadthFixture();
    // Six items per objective, all about the same single clip.
    const items = objectives.flatMap((o) =>
      Array.from({ length: 6 }, () => ev(o.id, "listeningComprehension", "clip:only-one"))
    );
    const gate = evaluateClaimGate({
      objectives,
      policy: { ...policy(), evaluatedLevels: ["PRE_A1"] },
      checkpointItems: items,
    });
    expect(gate.levels[0].claimable).toBe(false);
    // Each objective has 6 items but only ONE distinct input → not assessed.
    for (const d of gate.levels[0].domains) {
      expect(d.status).toBe("objectives_not_assessed");
    }
  });

  test("§149: one task family per domain is insufficient breadth even with inputs", () => {
    const { objectives } = fullBreadthFixture();
    const items = objectives.flatMap((o) => [
      ev(o.id, "select", `${o.id}:input1`),
      ev(o.id, "select", `${o.id}:input2`),
      ev(o.id, "select", `${o.id}:input3`),
    ]);
    const gate = evaluateClaimGate({
      objectives,
      policy: { ...policy(), evaluatedLevels: ["PRE_A1"] },
      checkpointItems: items,
    });
    expect(gate.levels[0].claimable).toBe(false);
    for (const d of gate.levels[0].domains) {
      expect(d.status).toBe("insufficient_breadth");
      expect(d.breadth!.taskFamilies).toEqual(["select"]);
    }
  });

  test("§149: one aligned scale per domain is insufficient breadth", () => {
    const domains: CourseObjective["category"][] = ["written_reception"];
    const objectives = domains.flatMap((d) => [
      mkObjective(`fr.obj.syn.${d}.a`, d, "same scale"),
      mkObjective(`fr.obj.syn.${d}.b`, d, "same scale"),
    ]);
    const items = objectives.flatMap((o) => [
      ev(o.id, "select", `${o.id}:i1`),
      ev(o.id, "readingComprehension", `${o.id}:i2`),
      ev(o.id, "readingComprehension", `${o.id}:i3`),
    ]);
    const gate = evaluateClaimGate({
      objectives,
      policy: { ...policy(), evaluatedLevels: ["PRE_A1"], requiredDomains: ["written_reception"] },
      checkpointItems: items,
    });
    const d = gate.levels[0].domains[0];
    expect(d.status).toBe("insufficient_breadth");
    expect(d.breadth!.scaleNames).toEqual(["same scale"]);
  });

  test("§149: listening + reading fully covered but speaking absent → A1 overall false", () => {
    const receptive: CourseObjective["category"][] = ["spoken_reception", "written_reception"];
    const objectives = receptive.flatMap((d) => [
      { ...mkObjective(`fr.obj.syn.${d}.a`, d, `${d} scale one`), cefrAlignments: [{ level: "A1" as const, scaleName: `${d} scale one`, relation: "direct" as const, sourceRef: "cefr-cv-2020:overall-reading-comprehension" }] },
      { ...mkObjective(`fr.obj.syn.${d}.b`, d, `${d} scale two`), cefrAlignments: [{ level: "A1" as const, scaleName: `${d} scale two`, relation: "direct" as const, sourceRef: "cefr-cv-2020:overall-reading-comprehension" }] },
    ]);
    const items = objectives.flatMap((o) => [
      ev(o.id, "select", `${o.id}:i1`),
      ev(o.id, "listeningComprehension", `${o.id}:i2`),
      ev(o.id, "listeningComprehension", `${o.id}:i3`),
    ]);
    const gate = evaluateClaimGate({
      objectives,
      policy: { ...policy(), evaluatedLevels: ["A1"] },
      checkpointItems: items,
    });
    const a1 = gate.levels[0];
    expect(a1.domains.find((d) => d.domain === "spoken_reception")!.status).toBe("covered");
    expect(a1.domains.find((d) => d.domain === "written_reception")!.status).toBe("covered");
    expect(a1.claimable).toBe(false);
    expect(a1.unassessedDomains).toContain("spoken_production");
    expect(a1.unassessedDomains).toContain("interaction");
    // Covered synthetic listening carries the honesty limitation (P7 §123).
    expect(a1.evidenceLimitations.join(" ")).toContain("synthesized");
  });

  test("one scored item per objective is below the evidence floor (§64)", () => {
    const objectives = spokenLess();
    const items = objectives.map((o) => ev(o.id));
    const gate = evaluateClaimGate({ objectives, policy: policy(), checkpointItems: items });
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
