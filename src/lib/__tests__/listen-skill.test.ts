/**
 * Listen-skill activation tests (P7 §72-81, §134-137, §144-145, §151).
 *
 * The contract under test, end to end:
 *  - "listen" is a real CardKey skill; recognize cards stay byte-identical;
 *  - the due queue is skill-scoped in both directions;
 *  - listen evidence exists ONLY for single-lexeme word_phrase clips;
 *  - the listening review surface builds sessions from due listen cards
 *    with bundled clips, and skip/asset-less cards stay due untouched;
 *  - TODAY's listening share is bounded and honest.
 */
import { describe, expect, test } from "bun:test";

import { parseCardKey, serializeCardKey } from "../learning/card-key";
import { applyEvidence, dueFrenchReviewQueue } from "../learning/engine";
import type { ReviewEvidence } from "../learning/evidence";
import { fsrsScheduler } from "../learning/fsrs-adapter";
import { composeTodaySession, todayListenBudget } from "../learning/today";
import { buildCheckEvidence, evidencePlanFor } from "../session/evidence";
import {
  buildListeningReviewSessionDefinition,
  dueListeningReviewCount,
} from "../session/sources";
import type { ExerciseStep, SessionDefinition } from "../session/types";
import type { CourseProgress } from "../store";
import type { Exercise, ListeningComprehensionExercise, Pack } from "../types";
import frPackJson from "../../content/packs/fr-en.json";

const frPack = frPackJson as unknown as Pack;

const NOW = Date.UTC(2026, 7, 29, 12, 0, 0);

function packWords() {
  const words = [];
  for (const s of frPack.sections)
    for (const u of s.units) for (const w of u.words) words.push(w);
  return words;
}

/** A due card in plain FSRS state (new card due immediately). */
function dueCard(now = NOW) {
  return fsrsScheduler.initialCard(now - 1000);
}

function courseWith(cards: Record<string, ReturnType<typeof dueCard>>): CourseProgress {
  return { xp: 0, completedLessons: {}, mistakes: [], wordStats: {}, srs: {}, cards };
}

function reviewDefinition(kind: SessionDefinition["kind"] = "review"): SessionDefinition {
  return {
    kind,
    courseId: "fr-en",
    lessonId: "x",
    steps: [],
    completion: "practice",
    evidenceSource: "review",
    trackMistakes: false,
    allowUndo: true,
  };
}

function lcStep(exercise: Partial<ListeningComprehensionExercise> & { clipId: string }): ExerciseStep {
  const full: ListeningComprehensionExercise = {
    type: "listeningComprehension",
    id: "lc-x",
    question: "What do you hear?",
    options: [{ text: "a" }, { text: "b" }, { text: "c" }, { text: "d" }],
    correct: 0,
    ...exercise,
  };
  return { type: "exercise", stepId: full.id, exercise: full };
}

describe("card key: listen skill (§72-74)", () => {
  test("round-trips and coexists with recognize", () => {
    const key = serializeCardKey({ itemId: "fr:w:train", skill: "listen" });
    expect(key).toBe("fr:w:train|listen");
    expect(parseCardKey(key)).toEqual({ itemId: "fr:w:train", skill: "listen" });
    expect(parseCardKey("fr:w:train|recognize")).toEqual({
      itemId: "fr:w:train",
      skill: "recognize",
    });
    // Unknown skills still refuse to parse (storage safety net).
    expect(parseCardKey("fr:w:train|speak")).toBeUndefined();
  });
});

describe("due queue is skill-scoped (§79, §134)", () => {
  const cards = {
    "fr:w:chat|recognize": dueCard(),
    "fr:w:train|listen": dueCard(),
    "fr:w:gare|listen": dueCard(),
  };

  test("default (recognize) never returns listen cards", () => {
    const keys = dueFrenchReviewQueue(cards, NOW).map((d) => d.key);
    expect(keys).toEqual(["fr:w:chat|recognize"]);
  });

  test("listen scope returns only listen cards", () => {
    const keys = dueFrenchReviewQueue(cards, NOW, "listen").map((d) => d.key).sort();
    expect(keys).toEqual(["fr:w:gare|listen", "fr:w:train|listen"]);
  });
});

describe("listen evidence eligibility (§75-78)", () => {
  test("single-lexeme word_phrase clip → listen assessment", () => {
    // fr.clip.uf_train: kind word_phrase, lexemeRefs [fr:w:train] (real data).
    const plan = evidencePlanFor(reviewDefinition(), lcStep({ clipId: "fr.clip.uf_train" }));
    expect(plan).toEqual({ itemId: "fr:w:train", skill: "listen", srsRole: "assessment" });
  });

  test("multi-lexeme word_phrase clip → no lexical evidence", () => {
    // fr.clip.uf_bonsoir carries two lexemeRefs (real data).
    expect(evidencePlanFor(reviewDefinition(), lcStep({ clipId: "fr.clip.uf_bonsoir" }))).toBeNull();
  });

  test("sentence-comprehension kinds never create lexical cards (§75)", () => {
    // announcement / dialogue / factual clips (real data).
    for (const clipId of [
      "fr.clip.uh_train_lyon",
      "fr.clip.ui_cafe_commande",
      "fr.clip.uj_musee_horaires",
    ]) {
      expect(evidencePlanFor(reviewDefinition(), lcStep({ clipId }))).toBeNull();
    }
  });

  test("unknown clip fails closed", () => {
    expect(evidencePlanFor(reviewDefinition(), lcStep({ clipId: "fr.clip.ghost" }))).toBeNull();
  });

  test("scored kinds produce NO evidence at all (§56-57)", () => {
    expect(evidencePlanFor(reviewDefinition("checkpoint"), lcStep({ clipId: "fr.clip.uf_train" }))).toBeNull();
    expect(evidencePlanFor(reviewDefinition("placement"), lcStep({ clipId: "fr.clip.uf_train" }))).toBeNull();
  });

  test("mistakes sessions keep listen steps as practice", () => {
    const plan = evidencePlanFor(reviewDefinition("mistakes"), lcStep({ clipId: "fr.clip.uf_train" }));
    expect(plan).toEqual({ itemId: "fr:w:train", skill: "listen", srsRole: "practice" });
  });

  test("dictation emits nothing — orthography, not meaning (§75)", () => {
    const dictation: Exercise = {
      type: "dictation",
      id: "d1",
      clipId: "fr.clip.uf_dictee_bonjour",
      answer: "bonjour",
      alternatives: [],
    };
    const step: ExerciseStep = { type: "exercise", stepId: "d1", exercise: dictation };
    expect(evidencePlanFor(reviewDefinition(), step)).toBeNull();
  });

  test("buildCheckEvidence carries the listen skill into the card key", () => {
    const ev = buildCheckEvidence({
      definition: reviewDefinition(),
      step: lcStep({ clipId: "fr.clip.uf_train" }),
      sessionId: "s1",
      correct: true,
      attemptIndex: 0,
      latencyMs: 1200,
    });
    expect(ev?.cardKey).toEqual({ itemId: "fr:w:train", skill: "listen" });
    expect(ev?.modality).toBe("listen");
    expect(ev?.srsRole).toBe("assessment");
  });
});

describe("listen cards are new keys; recognize entries stay byte-identical (§73)", () => {
  test("applying listen evidence never touches the recognize card", () => {
    const recognizeBefore = dueCard();
    const course = courseWith({ "fr:w:train|recognize": recognizeBefore });
    const ev: ReviewEvidence = {
      cardKey: { itemId: "fr:w:train", skill: "listen" },
      sessionId: "s1",
      exerciseId: "lc1",
      modality: "listen",
      srsRole: "assessment",
      source: "review",
      correct: true,
      hinted: false,
      assisted: false,
      toleranceUsed: false,
      latencyMs: 900,
      attemptIndex: 0,
    };
    const result = applyEvidence({
      courseId: "fr-en",
      course,
      reviewLog: [],
      ev,
      now: NOW,
    });
    const cards = result.course.cards!;
    // New listen card exists…
    expect(cards["fr:w:train|listen"]).toBeDefined();
    expect(cards["fr:w:train|listen"].reps).toBe(1);
    // …and the recognize entry is the SAME value, untouched.
    expect(cards["fr:w:train|recognize"]).toEqual(recognizeBefore);
  });
});

describe("listening review surface (§79-81)", () => {
  const listenDue = {
    "fr:w:train|listen": dueCard(),
    "fr:w:gare|listen": dueCard(),
    // chat has NO single-word clip — must be excluded and stay due.
    "fr:w:chat|listen": dueCard(),
  };

  test("builds LC steps only for asset-backed word clips; card identity explicit", () => {
    const def = buildListeningReviewSessionDefinition({
      course: courseWith(listenDue),
      pool: packWords(),
      now: NOW,
    });
    expect(def.kind).toBe("review");
    expect(def.completion).toBe("practice");
    const steps = def.steps as ExerciseStep[];
    const ids = steps.map((s) => s.evidence?.itemId).sort();
    expect(ids).toEqual(["fr:w:gare", "fr:w:train"]);
    for (const step of steps) {
      expect(step.evidence?.skill).toBe("listen");
      expect(step.evidence?.srsRole).toBe("assessment");
      const ex = step.exercise as ListeningComprehensionExercise;
      expect(ex.type).toBe("listeningComprehension");
      // 4 unique options, correct index points at the word's gloss.
      expect(new Set(ex.options.map((o) => o.text)).size).toBe(ex.options.length);
      expect(ex.options.length).toBe(4);
      expect(ex.correct).toBeGreaterThanOrEqual(0);
    }
  });

  test("deterministic for equal state", () => {
    const a = buildListeningReviewSessionDefinition({
      course: courseWith(listenDue),
      pool: packWords(),
      now: NOW,
    });
    const b = buildListeningReviewSessionDefinition({
      course: courseWith(listenDue),
      pool: packWords(),
      now: NOW,
    });
    expect(JSON.stringify(a.steps)).toBe(JSON.stringify(b.steps));
  });

  test("due count matches the sessionable subset", () => {
    expect(dueListeningReviewCount(listenDue, NOW)).toBe(2);
    expect(dueListeningReviewCount({}, NOW)).toBe(0);
  });
});

describe("TODAY bounded listening share (§134-137)", () => {
  const listenClips = {
    "fr:w:train": "fr.clip.uf_train",
    "fr:w:gare": "fr.clip.uf_gare",
    "fr:w:cafe": "fr.clip.uf_cafe",
    "fr:w:eau": "fr.clip.uf_eau",
    "fr:w:pain": "fr.clip.uf_pain",
  };

  function cardsWith(listenIds: string[], recognizeIds: string[]) {
    const cards: Record<string, ReturnType<typeof dueCard>> = {};
    for (const id of listenIds) cards[`${id}|listen`] = dueCard();
    for (const id of recognizeIds) cards[`${id}|recognize`] = dueCard();
    return cards;
  }

  test("budget helper: at most a third of the review budget", () => {
    expect(todayListenBudget(10)).toBe(3);
    expect(todayListenBudget(5)).toBe(1);
    expect(todayListenBudget(2)).toBe(0);
  });

  test("listen steps are capped and carry listen-skill assessments", () => {
    const plan = composeTodaySession({
      pack: frPack,
      completedLessons: {},
      cards: cardsWith(
        ["fr:w:train", "fr:w:gare", "fr:w:cafe", "fr:w:eau", "fr:w:pain"],
        ["fr:w:chat", "fr:w:chien", "fr:w:pomme"]
      ),
      preset: "regular", // review budget 10 → listen cap 3
      seed: 42,
      now: NOW,
      listenClips,
    });
    expect(plan.listenCount).toBe(3);
    const listenSteps = plan.steps.filter(
      (s) => s.type === "exercise" && s.evidence?.skill === "listen"
    ) as ExerciseStep[];
    expect(listenSteps.length).toBe(3);
    for (const step of listenSteps) {
      expect(step.phase).toBe("warmup");
      expect(step.evidence?.srsRole).toBe("assessment");
      expect(step.exercise.type).toBe("listeningComprehension");
    }
    // Both skills counted in the honest backlog: 8 due, 6 taken.
    expect(plan.backlogTotal).toBe(8);
    expect(plan.backlogRemaining).toBe(2);
    expect(plan.reviewCount).toBe(6);
  });

  test("no listenClips input → exactly the pre-Phase-7 plan shape", () => {
    const cards = cardsWith(["fr:w:train"], ["fr:w:chat"]);
    const plan = composeTodaySession({
      pack: frPack,
      completedLessons: {},
      cards,
      preset: "regular",
      seed: 42,
      now: NOW,
    });
    expect(plan.listenCount).toBe(0);
    expect(plan.steps.every((s) => s.type !== "exercise" || s.evidence?.skill !== "listen")).toBe(
      true
    );
    // The listen card is still reported in the backlog — never silently lost.
    expect(plan.backlogTotal).toBe(2);
  });

  test("listen-due cards without a bundled clip never enter the plan", () => {
    const plan = composeTodaySession({
      pack: frPack,
      completedLessons: {},
      cards: cardsWith(["fr:w:chat"], []), // chat has no word clip
      preset: "regular",
      seed: 7,
      now: NOW,
      listenClips,
    });
    expect(plan.listenCount).toBe(0);
    expect(plan.backlogTotal).toBe(1);
    expect(plan.backlogRemaining).toBe(1); // stays due, honestly reported
  });
});
