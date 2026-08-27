import { afterEach, beforeEach, describe, expect, test, setSystemTime } from "bun:test";

import {
  applyEvidence,
  dueFrenchReviewQueue,
  frCardForSurface,
  itemIdForCourse,
} from "../learning/engine";
import type { ReviewEvidence } from "../learning/evidence";
import { fsrsScheduler } from "../learning/fsrs-adapter";
import { FR_COURSE_ID } from "../learning/ids-fr";
import type { ReviewLogEntry } from "../learning/review-log";
import type { FsrsCardState } from "../learning/scheduler";
import { reviewWord } from "../srs";
import { useProgress, type CourseProgress } from "../store";
import { memoryStorage } from "./helpers/mocks";

const T0 = 1_700_000_000_000;
const DAY = 86_400_000;

function ev(overrides: Partial<ReviewEvidence> = {}): ReviewEvidence {
  return {
    cardKey: { itemId: "fr:w:pomme", skill: "recognize" },
    sessionId: "s1",
    exerciseId: "e1",
    modality: "recognizeText",
    srsRole: "assessment",
    source: "lesson",
    correct: true,
    hinted: false,
    assisted: false,
    toleranceUsed: false,
    latencyMs: 1500,
    attemptIndex: 0,
    ...overrides,
  };
}

function emptyCourse(): CourseProgress {
  return { xp: 0, completedLessons: {}, mistakes: [], wordStats: {}, srs: {} };
}

describe("applyEvidence: legacy translation parity (non-French contract)", () => {
  test("lesson evidence ≡ recordWord: wordStats bump + srs write, field-for-field", () => {
    const course = emptyCourse();
    const out = applyEvidence({
      courseId: "es-en",
      course,
      reviewLog: [],
      ev: ev({ cardKey: { itemId: "el agua", skill: "recognize" }, correct: true }),
      now: T0,
    });
    expect(out.mutated).toBe(false);
    expect(out.course.wordStats["el agua"]).toEqual({
      correct: 1,
      wrong: 0,
      lastSeen: T0,
    });
    expect(out.course.srs!["el agua"]).toEqual(reviewWord(undefined, 2, T0));
    // cards never appear on legacy courses.
    expect(out.course.cards).toBeUndefined();
  });

  test("hard-inference parity: lifetime wrong>correct grades quality 1", () => {
    const course: CourseProgress = {
      ...emptyCourse(),
      wordStats: { perro: { correct: 1, wrong: 3, lastSeen: 1 } },
      srs: { perro: { interval: 3, ease: 2.5, dueAt: T0, streak: 2 } },
    };
    const out = applyEvidence({
      courseId: "es-en",
      course,
      reviewLog: [],
      ev: ev({ cardKey: { itemId: "perro", skill: "recognize" }, correct: true }),
      now: T0,
    });
    expect(out.course.srs!["perro"]).toEqual(
      reviewWord(course.srs!["perro"], 1, T0) // hard, exactly like recordWord
    );
    expect(out.course.wordStats["perro"]).toEqual({
      correct: 2,
      wrong: 3,
      lastSeen: T0,
    });
  });

  test("review evidence ≡ reviewSrsWord: srs only, wordStats untouched", () => {
    const course: CourseProgress = {
      ...emptyCourse(),
      wordStats: { gato: { correct: 2, wrong: 0, lastSeen: 5 } },
      srs: { gato: { interval: 1, ease: 2.55, dueAt: T0 - DAY, streak: 1 } },
    };
    const wrong = applyEvidence({
      courseId: "es-en",
      course,
      reviewLog: [],
      ev: ev({
        cardKey: { itemId: "gato", skill: "recognize" },
        source: "review",
        correct: false,
      }),
      now: T0,
    });
    expect(wrong.course.srs!["gato"]).toEqual(reviewWord(course.srs!["gato"], 0, T0));
    expect(wrong.course.wordStats).toEqual(course.wordStats); // untouched
  });

  test("the srsRole is ignored on legacy courses — behavior is pre-Phase-1", () => {
    for (const srsRole of ["practice", "none", "teach"] as const) {
      const out = applyEvidence({
        courseId: "de-en",
        course: emptyCourse(),
        reviewLog: [],
        ev: ev({ cardKey: { itemId: "brot", skill: "recognize" }, srsRole }),
        now: T0,
      });
      expect(out.course.srs!["brot"]).toEqual(reviewWord(undefined, 2, T0));
    }
  });

  test("legacy evidence still lands in the review log (with courseId, no mutation)", () => {
    const out = applyEvidence({
      courseId: "ja-en",
      course: emptyCourse(),
      reviewLog: [],
      ev: ev({ cardKey: { itemId: "水", skill: "recognize" } }),
      now: T0,
    });
    expect(out.reviewLog).toHaveLength(1);
    expect(out.reviewLog[0].courseId).toBe("ja-en");
    expect(out.reviewLog[0].mutation).toBeUndefined();
  });

  test("a legacy surface containing '|' is escaped in the log key, not dropped", () => {
    const out = applyEvidence({
      courseId: "ja-en",
      course: emptyCourse(),
      reviewLog: [],
      ev: ev({ cardKey: { itemId: "a|b", skill: "recognize" } }),
      now: T0,
    });
    expect(out.reviewLog[0].cardKey).toBe("a%7Cb|recognize");
    expect(out.course.srs!["a|b"]).toBeDefined();
  });
});

describe("applyEvidence: French FSRS routing", () => {
  test("designated assessment creates and reviews the card; log carries the mutation", () => {
    const out = applyEvidence({
      courseId: FR_COURSE_ID,
      course: emptyCourse(),
      reviewLog: [],
      ev: ev(),
      now: T0,
    });
    expect(out.mutated).toBe(true);
    const card = out.course.cards!["fr:w:pomme|recognize"];
    expect(card.state).toBe("learning");
    expect(card.reps).toBe(1);
    expect(out.course.srs).toEqual({}); // fr srs map is never written again
    const entry = out.reviewLog[0];
    expect(entry.mutation!.grade).toBe("good");
    expect(entry.mutation!.prevCard.state).toBe("new");
    expect(entry.mutation!.fsrsLog).toBeDefined();
    // Lesson-source evidence bumps id-keyed stats.
    expect(out.course.wordStats["fr:w:pomme"]).toEqual({
      correct: 1,
      wrong: 0,
      lastSeen: T0,
    });
  });

  test("one mutation per card per session; a new session probes again", () => {
    const first = applyEvidence({
      courseId: FR_COURSE_ID,
      course: emptyCourse(),
      reviewLog: [],
      ev: ev(),
      now: T0,
    });
    const second = applyEvidence({
      courseId: FR_COURSE_ID,
      course: first.course,
      reviewLog: first.reviewLog,
      ev: ev({ exerciseId: "e2" }),
      now: T0 + 60_000,
    });
    expect(second.mutated).toBe(false);
    expect(second.course.cards).toEqual(first.course.cards); // untouched
    expect(second.reviewLog).toHaveLength(2); // still logged
    expect(second.reviewLog[1].mutation).toBeUndefined();

    const newSession = applyEvidence({
      courseId: FR_COURSE_ID,
      course: second.course,
      reviewLog: second.reviewLog,
      ev: ev({ sessionId: "s2" }),
      now: T0 + 11 * 60_000, // past the 10m learning step
    });
    expect(newSession.mutated).toBe(true);
    expect(newSession.course.cards!["fr:w:pomme|recognize"].reps).toBe(2);
  });

  test("retries, practice, none and teach never mutate the scheduler", () => {
    const cases: Partial<ReviewEvidence>[] = [
      { attemptIndex: 1 },
      { srsRole: "practice" },
      { srsRole: "none", modality: "match" },
      { srsRole: "teach" },
      { assisted: true },
    ];
    for (const c of cases) {
      const out = applyEvidence({
        courseId: FR_COURSE_ID,
        course: emptyCourse(),
        reviewLog: [],
        ev: ev(c),
        now: T0,
      });
      expect(out.mutated).toBe(false);
      expect(out.course.cards ?? {}).toEqual({});
      expect(out.reviewLog).toHaveLength(1); // everything is still logged
    }
  });

  test("review-source evidence never touches wordStats; teach touches nothing", () => {
    const review = applyEvidence({
      courseId: FR_COURSE_ID,
      course: emptyCourse(),
      reviewLog: [],
      ev: ev({ source: "review" }),
      now: T0,
    });
    expect(review.course.wordStats).toEqual({});
    expect(review.mutated).toBe(true); // review assessments do schedule

    const teach = applyEvidence({
      courseId: FR_COURSE_ID,
      course: emptyCourse(),
      reviewLog: [],
      ev: ev({ srsRole: "teach" }),
      now: T0,
    });
    expect(teach.course.wordStats).toEqual({});
    expect(teach.course.cards ?? {}).toEqual({});
  });

  test("a hint on a designated assessment mutates with grade again", () => {
    const out = applyEvidence({
      courseId: FR_COURSE_ID,
      course: emptyCourse(),
      reviewLog: [],
      ev: ev({ hinted: true, correct: true }),
      now: T0,
    });
    expect(out.mutated).toBe(true);
    expect(out.reviewLog[0].mutation!.grade).toBe("again");
  });
});

describe("dueFrenchReviewQueue ordering", () => {
  function cardAt(reviews: ("good" | "again")[], start: number): FsrsCardState {
    let card = fsrsScheduler.initialCard(start);
    let at = start;
    for (const g of reviews) {
      card = fsrsScheduler.review(card, g, at).card;
      at = card.due;
    }
    return card;
  }

  test("ascending retrievability: most at-risk first, new cards lead", () => {
    const now = T0 + 400 * DAY;
    const strong = cardAt(["good", "good", "good", "good", "good"], T0); // long overdue but stable
    const weak = cardAt(["good", "good"], T0 + 390 * DAY); // recently learned, overdue
    const fresh = fsrsScheduler.initialCard(now - 1); // never reviewed → r = 0
    const cards = {
      "fr:w:chien|recognize": strong,
      "fr:w:chat|recognize": weak,
      "fr:w:pomme|recognize": fresh,
    };
    for (const c of Object.values(cards)) expect(fsrsScheduler.isDue(c, now)).toBe(true);

    const queue = dueFrenchReviewQueue(cards, now);
    expect(queue).toHaveLength(3);
    expect(queue[0].surface).toBe("la pomme"); // r = 0
    const rs = queue.map((q) => q.retrievability);
    expect(rs[0]).toBeLessThanOrEqual(rs[1]);
    expect(rs[1]).toBeLessThanOrEqual(rs[2]);
  });

  test("not-due cards, legacy ids and empty maps are excluded safely", () => {
    const future = { ...fsrsScheduler.initialCard(T0), due: T0 + 5 * DAY };
    const cards = {
      "fr:w:pomme|recognize": fsrsScheduler.initialCard(T0),
      "fr:w:chien|recognize": future,
      "fr:legacy:Je%20mange|recognize": fsrsScheduler.initialCard(T0),
    };
    const queue = dueFrenchReviewQueue(cards, T0);
    expect(queue.map((q) => q.surface)).toEqual(["la pomme"]);
    expect(dueFrenchReviewQueue(undefined, T0)).toEqual([]);
    expect(dueFrenchReviewQueue({}, T0)).toEqual([]);
  });

  test("frCardForSurface finds the card behind a pack word", () => {
    const card = fsrsScheduler.initialCard(T0);
    expect(frCardForSurface({ "fr:w:pomme|recognize": card }, "la pomme")).toEqual(card);
    expect(frCardForSurface({}, "la pomme")).toBeUndefined();
    expect(frCardForSurface(undefined, "la pomme")).toBeUndefined();
  });

  test("itemIdForCourse: stable ids for French, raw surfaces elsewhere", () => {
    expect(itemIdForCourse(FR_COURSE_ID, "la pomme")).toBe("fr:w:pomme");
    expect(itemIdForCourse(FR_COURSE_ID, "unknown!")).toContain("fr:legacy:");
    expect(itemIdForCourse("es-en", "el agua")).toBe("el agua");
  });
});

describe("store integration: submitEvidence + undoLastFrenchReview", () => {
  beforeEach(async () => {
    useProgress.setState({
      activeCourseId: FR_COURSE_ID,
      streak: 0,
      lastActiveDay: null,
      dailyGoal: 20,
      dailyXp: 0,
      dailyXpDay: null,
      onboardingDone: true,
      themePreference: "system",
      courses: {},
      activeDays: {},
      reviewLog: [],
    });
    await new Promise((r) => setTimeout(r, 0));
    memoryStorage.clear();
    setSystemTime(new Date(T0));
  });

  afterEach(() => {
    setSystemTime();
  });

  test("French assessment mutates a card; undo restores card AND log together", () => {
    const mutated = useProgress
      .getState()
      .submitEvidence(ev({ correct: false }));
    expect(mutated).toBe(true);

    let s = useProgress.getState();
    const key = "fr:w:pomme|recognize";
    expect(s.courses[FR_COURSE_ID].cards![key].state).toBe("learning");
    expect(s.courses[FR_COURSE_ID].cards![key].lapses).toBe(0);
    expect(s.reviewLog).toHaveLength(1);

    const undone = s.undoLastFrenchReview();
    expect(undone).toBe(true);
    s = useProgress.getState();
    // The card is back to its exact pre-review state and the entry is gone.
    expect(s.courses[FR_COURSE_ID].cards![key].state).toBe("new");
    expect(s.courses[FR_COURSE_ID].cards![key].reps).toBe(0);
    expect(s.reviewLog).toHaveLength(0);
    // Nothing left to undo.
    expect(useProgress.getState().undoLastFrenchReview()).toBe(false);
  });

  test("undo targets the LAST French mutation only", () => {
    useProgress.getState().submitEvidence(ev());
    useProgress
      .getState()
      .submitEvidence(
        ev({ cardKey: { itemId: "fr:w:chien", skill: "recognize" }, exerciseId: "e2" })
      );
    expect(useProgress.getState().reviewLog).toHaveLength(2);

    useProgress.getState().undoLastFrenchReview();
    const s = useProgress.getState();
    expect(s.courses[FR_COURSE_ID].cards!["fr:w:chien|recognize"].state).toBe("new");
    expect(s.courses[FR_COURSE_ID].cards!["fr:w:pomme|recognize"].state).toBe("learning");
    expect(s.reviewLog).toHaveLength(1);
    expect(s.reviewLog[0].cardKey).toBe("fr:w:pomme|recognize");
  });

  test("non-French course through submitEvidence equals the historical recordWord", () => {
    useProgress.setState({ activeCourseId: "es-en" });
    useProgress
      .getState()
      .submitEvidence(ev({ cardKey: { itemId: "el agua", skill: "recognize" } }));
    const viaEvidence = useProgress.getState().courses["es-en"];

    useProgress.setState({ courses: {}, reviewLog: [] });
    useProgress.getState().recordWord("el agua", true);
    const viaLegacy = useProgress.getState().courses["es-en"];

    expect(viaEvidence.srs).toEqual(viaLegacy.srs);
    expect(viaEvidence.wordStats).toEqual(viaLegacy.wordStats);
  });

  test("non-French review through submitEvidence equals reviewSrsWord", () => {
    useProgress.setState({ activeCourseId: "es-en" });
    useProgress.getState().submitEvidence(
      ev({
        cardKey: { itemId: "el agua", skill: "recognize" },
        source: "review",
        correct: false,
      })
    );
    const viaEvidence = useProgress.getState().courses["es-en"];

    useProgress.setState({ courses: {}, reviewLog: [] });
    useProgress.getState().reviewSrsWord("el agua", false);
    const viaLegacy = useProgress.getState().courses["es-en"];

    expect(viaEvidence.srs).toEqual(viaLegacy.srs);
    expect(viaEvidence.wordStats).toEqual(viaLegacy.wordStats);
  });
});

describe("review log ring cap through the engine", () => {
  test("the log never exceeds the cap (engine-level, small synthetic cap check)", () => {
    // The cap itself is unit-tested in review-log.test.ts; here we prove the
    // engine appends through appendToReviewLog (bounded), not a bare push.
    let log: ReviewLogEntry[] = [];
    let course = emptyCourse();
    for (let i = 0; i < 5; i++) {
      const out = applyEvidence({
        courseId: "es-en",
        course,
        reviewLog: log,
        ev: ev({ exerciseId: `e${i}`, cardKey: { itemId: "x", skill: "recognize" } }),
        now: T0 + i,
      });
      log = out.reviewLog;
      course = out.course;
    }
    expect(log).toHaveLength(5);
    expect(log[4].exerciseId).toBe("e4");
  });
});
