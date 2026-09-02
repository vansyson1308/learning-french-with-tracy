/**
 * A1-claim red team (Phase 10 §23, §76): assume the estimate is wrong and
 * build learner histories that must NOT receive A1. Every persona runs
 * through the real pipeline — recorded attempts → deriveObjectiveStates
 * (latest real verdict, insufficient evidence falls through) →
 * deriveA1Estimate (authored attainment policy) — so a regression in any
 * layer would surface here.
 */
import { describe, expect, test } from "bun:test";

import { getPack } from "../content";
import { checkAnswer } from "../grading";
import { scoreObjectives } from "../assessment/checkpoint";
import {
  CHECKPOINT_ORDER,
  attainmentPolicy,
  checkpointFor,
  courseClaimableAt,
} from "../assessment/content";
import { A1_DOMAINS, deriveA1Estimate } from "../assessment/estimate";
import { OPTION_ORDER_SCORED_TYPES } from "../assessment/option-order";
import { deriveObjectiveStates, objectiveLessonMap } from "../assessment/states";
import type { CheckpointAttempt, CheckpointObjectiveResult, PlacementResult } from "../assessment/types";
import { buildCheckpointSessionDefinition } from "../session/sources";

const pack = getPack("fr-en");
const objectiveLessons = objectiveLessonMap(pack);
const policy = attainmentPolicy();
const required = policy.domains.flatMap((d) => d.requiredObjectiveIds);
const objectiveIds = Object.keys(objectiveLessons).concat(required);
const capstone = checkpointFor("fr.checkpoint.a1-capstone")!;
const capstoneObjectives = [...new Set(capstone.items.flatMap((i) => i.objectiveTargets))];

type Verdict = CheckpointObjectiveResult["result"];

function attempt(
  checkpointId: string,
  results: [string, Verdict][],
  completedAt: number,
  formId?: string
): CheckpointAttempt {
  return {
    checkpointId,
    checkpointVersion: 1,
    formId,
    formVersion: formId ? 1 : undefined,
    startedAt: completedAt - 1,
    completedAt,
    itemResults: [],
    objectiveResults: results.map(([objectiveId, result]) => ({
      objectiveId,
      result,
      correct: result === "demonstrated" ? 3 : result === "needs_practice" ? 1 : 1,
      total: result === "insufficient_evidence" ? 1 : 3,
    })),
    overallCorrectShare: 0.5,
  };
}

function estimateOf(
  attempts: CheckpointAttempt[],
  extra: { placement?: PlacementResult; speechAvailable?: boolean | null } = {}
) {
  const states = deriveObjectiveStates({
    objectiveIds: [...new Set(objectiveIds)],
    objectiveLessons,
    completedLessons: {},
    checkpointAttempts: attempts,
    placement: extra.placement,
  });
  return deriveA1Estimate({
    policy,
    states,
    courseClaimable: courseClaimableAt("A1"),
    speechAvailable: extra.speechAvailable,
  });
}

const expectNotA1 = (estimate: ReturnType<typeof estimateOf>) => {
  expect(estimate.overall).toBe("incomplete");
  expect(estimate.missingDomains.length).toBeGreaterThan(0);
};

describe("personas that must never receive A1 (§23)", () => {
  test("one demonstrated objective per domain", () => {
    const one = policy.domains.map((d) => d.requiredObjectiveIds[0]);
    const e = estimateOf([attempt("fr.checkpoint.section-3", one.map((id) => [id, "demonstrated"]), 10)]);
    expectNotA1(e);
    for (const d of e.domains) expect(d.status).toBe("partial");
  });

  test("only the capstone's representative objectives, perfect score, both forms", () => {
    const a = attempt("fr.checkpoint.a1-capstone", capstoneObjectives.map((id) => [id, "demonstrated"]), 10, "a");
    const b = attempt("fr.checkpoint.a1-capstone", capstoneObjectives.map((id) => [id, "demonstrated"]), 20, "b");
    const e = estimateOf([a, b]);
    expectNotA1(e);
    expect(e.missingDomains).toEqual([...A1_DOMAINS]);
  });

  test("skipped speech: everything else demonstrated, speech attempts only insufficient", () => {
    const nonSpeech = required.filter((id) => !/speaking|interaction/.test(id));
    const speech = required.filter((id) => /speaking|interaction/.test(id));
    const e = estimateOf(
      [
        attempt("fr.checkpoint.section-3", nonSpeech.filter((id) => /listening|reading/.test(id)).map((id) => [id, "demonstrated"]), 10),
        attempt("fr.checkpoint.section-5", nonSpeech.filter((id) => /writing/.test(id)).map((id) => [id, "demonstrated"]), 20),
        attempt("fr.checkpoint.section-4", speech.filter((id) => /speaking/.test(id)).map((id) => [id, "insufficient_evidence"]), 30),
        attempt("fr.checkpoint.section-6", speech.filter((id) => /interaction/.test(id)).map((id) => [id, "insufficient_evidence"]), 40),
      ],
      { speechAvailable: false }
    );
    expectNotA1(e);
    expect(e.missingDomains).toEqual(["spoken_production", "interaction"]);
    for (const d of e.domains.filter((x) => x.requiresSpeech)) {
      expect(d.status).toBe("technical_unavailable"); // never needs_practice, never failed
    }
  });

  test("insufficient evidence everywhere (thin sampling) is no evidence at all", () => {
    const e = estimateOf([
      attempt("fr.checkpoint.a1-capstone", required.map((id) => [id, "insufficient_evidence"]), 10, "a"),
    ]);
    expectNotA1(e);
    for (const d of e.domains) expect(d.status).toBe("no_evidence");
  });

  test("placement estimates only — 'comfortable' on every objective", () => {
    const placement: PlacementResult = {
      placementVersion: 3,
      completedAt: 5,
      recommendedLessonId: pack.sections[5].units[3].lessons[3].id,
      recommendedFloorIndex: 100,
      objectiveEstimates: required.map((objectiveId) => ({ objectiveId, estimate: "comfortable" as const })),
      itemResults: [],
    };
    const e = estimateOf([], { placement });
    expectNotA1(e);
    for (const d of e.domains) expect(d.status).toBe("no_evidence");
  });

  test("old demonstrated attempts superseded by newer needs_practice verdicts", () => {
    const old = attempt("fr.checkpoint.section-3", required.filter((id) => /listening|reading/.test(id)).map((id) => [id, "demonstrated"]), 10);
    const newer = attempt("fr.checkpoint.section-3", required.filter((id) => /listening|reading/.test(id)).map((id) => [id, "needs_practice"]), 20);
    const rest = [
      attempt("fr.checkpoint.section-4", required.filter((id) => /speaking/.test(id)).map((id) => [id, "demonstrated"]), 30),
      attempt("fr.checkpoint.section-5", required.filter((id) => /writing/.test(id)).map((id) => [id, "demonstrated"]), 40),
      attempt("fr.checkpoint.section-6", required.filter((id) => /interaction/.test(id)).map((id) => [id, "demonstrated"]), 50),
    ];
    const e = estimateOf([old, newer, ...rest]);
    expectNotA1(e);
    expect(e.missingDomains).toEqual(["spoken_reception", "written_reception"]);
    expect(e.domains[0].status).toBe("needs_practice");
  });

  test("a newer insufficient attempt never erases an older demonstrated verdict (and never fabricates one)", () => {
    const listening = required.filter((id) => /listening/.test(id));
    const old = attempt("fr.checkpoint.section-3", listening.map((id) => [id, "demonstrated"]), 10);
    const newer = attempt("fr.checkpoint.section-3", listening.map((id) => [id, "insufficient_evidence"]), 20);
    const e = estimateOf([old, newer]);
    expect(e.domains.find((d) => d.domain === "spoken_reception")!.status).toBe("demonstrated");
    expectNotA1(e); // the other domains are untouched
  });

  test("multiple incomplete capstone forms with disjoint partial results still only sample", () => {
    const [first, second, third, fourth, fifth] = capstoneObjectives;
    const a = attempt("fr.checkpoint.a1-capstone", [[first, "demonstrated"], [second, "needs_practice"], [third, "insufficient_evidence"]], 10, "a");
    const b = attempt("fr.checkpoint.a1-capstone", [[fourth, "demonstrated"], [fifth, "demonstrated"], [second, "demonstrated"]], 20, "b");
    const e = estimateOf([a, b]);
    expectNotA1(e);
    for (const d of e.domains) expect(["partial", "no_evidence"]).toContain(d.status);
  });

  test("technical speech failures recorded as insufficient never become verdicts", () => {
    const speaking = required.filter((id) => /speaking/.test(id));
    const e = estimateOf([attempt("fr.checkpoint.section-4", speaking.map((id) => [id, "insufficient_evidence"]), 10)]);
    expectNotA1(e);
    expect(e.domains.find((d) => d.domain === "spoken_production")!.status).toBe("no_evidence");
  });

  test("retake form manipulation: attempt counts only rotate forms; no verdict is created by rotation", () => {
    const attempts: CheckpointAttempt[] = [];
    for (let n = 0; n < 5; n += 1) {
      attempts.push(
        attempt("fr.checkpoint.a1-capstone", capstoneObjectives.map((id) => [id, "insufficient_evidence"]), 10 + n, n % 2 ? "b" : "a")
      );
    }
    const e = estimateOf(attempts);
    expectNotA1(e);
    for (const d of e.domains) expect(d.status).toBe("no_evidence");
  });
});

describe("MCQ position guessing against the shuffled checkpoints (§19, §76)", () => {
  const isMcq = (type: string) => OPTION_ORDER_SCORED_TYPES.has(type as never);
  const mcqCheckpoints = CHECKPOINT_ORDER.map((id) => checkpointFor(id)!).filter(
    (cp) => cp.items.filter((i) => isMcq(i.exercise.type)).length >= 8
  );

  function guess(cp: (typeof mcqCheckpoints)[number], attemptCount: number, position: number) {
    const definition = buildCheckpointSessionDefinition(cp, attemptCount);
    const firstResults: Record<string, boolean> = {};
    let scored = 0;
    let correct = 0;
    for (const step of definition.steps) {
      if (step.type !== "exercise" || !isMcq(step.exercise.type)) continue;
      const ok = checkAnswer(step.exercise, position as never);
      firstResults[step.stepId] = ok;
      scored += 1;
      if (ok) correct += 1;
    }
    const results = scoreObjectives(definition.assessment!, firstResults);
    return { share: scored ? correct / scored : 0, results };
  }

  test("a fixed-position guesser scores at chance on average; no position sustains an advantage", () => {
    expect(mcqCheckpoints.length).toBeGreaterThanOrEqual(2);
    let demonstrated = 0;
    let judged = 0;
    let shareSum = 0;
    let runs = 0;
    for (const cp of mcqCheckpoints) {
      for (let position = 0; position < 4; position += 1) {
        let positionShare = 0;
        for (let n = 0; n < 8; n += 1) {
          const { share, results } = guess(cp, n, position);
          positionShare += share;
          shareSum += share;
          runs += 1;
          for (const r of results) {
            if (r.result === "insufficient_evidence") continue;
            judged += 1;
            if (r.result === "demonstrated") demonstrated += 1;
          }
        }
        // A single 12-item sitting can be lucky (e.g. 9/12); the same
        // position across eight administrations cannot stay lucky.
        expect({ cp: cp.id, position, meanShare: positionShare / 8 }).toEqual({
          cp: cp.id,
          position,
          meanShare: expect.any(Number),
        });
        expect(positionShare / 8).toBeLessThan(0.5);
      }
    }
    const meanShare = shareSum / runs;
    expect(meanShare).toBeGreaterThan(0.15);
    expect(meanShare).toBeLessThan(0.4); // four options → chance is 0.25
    // Chance-level guessing demonstrates an objective only by luck on
    // 2-4 item samples; it must stay a small minority, never the norm.
    expect(judged).toBeGreaterThan(50);
    expect(demonstrated / judged).toBeLessThan(0.35);
  });

  test("the luckiest guessing history across all checkpoints still cannot complete the estimate", () => {
    const attempts: CheckpointAttempt[] = [];
    for (const cp of mcqCheckpoints) {
      for (let position = 0; position < 4; position += 1) {
        for (let n = 0; n < 8; n += 1) {
          const { results } = guess(cp, n, position);
          attempts.push({
            checkpointId: cp.id,
            checkpointVersion: cp.checkpointVersion,
            startedAt: attempts.length,
            completedAt: attempts.length + 1,
            itemResults: [],
            objectiveResults: results,
            overallCorrectShare: 0,
          });
        }
      }
    }
    // Even taking every lucky verdict in the learner's favour by ordering
    // demonstrated verdicts last, speech/writing/interaction remain
    // unreachable by guessing and the estimate stays incomplete.
    const favourable = [...attempts].sort((a, b) => {
      const score = (x: CheckpointAttempt) => x.objectiveResults.filter((r) => r.result === "demonstrated").length;
      return score(a) - score(b);
    }).map((a, i) => ({ ...a, startedAt: i, completedAt: i + 1 }));
    const e = estimateOf(favourable);
    expectNotA1(e);
    for (const domain of ["spoken_production", "written_production", "interaction"] as const) {
      expect(e.domains.find((d) => d.domain === domain)!.status).toBe("no_evidence");
    }
  });
});
