import { describe, expect, test } from "bun:test";
import {
  default_enable_fuzz,
  default_enable_short_term,
  default_request_retention,
  default_w,
  generatorParameters,
  Rating,
  S_MAX as TS_FSRS_S_MAX,
  S_MIN as TS_FSRS_S_MIN,
} from "ts-fsrs";

import {
  fromPlainCard,
  fsrsScheduler,
  toPlainCard,
  validateFsrsCard,
} from "../learning/fsrs-adapter";
import {
  D_MAX,
  D_MIN,
  FSRS_PARAMS,
  FSRS_W,
  S_MAX,
  S_MIN,
} from "../learning/fsrs-defaults";
import type { FsrsCardState, Grade } from "../learning/scheduler";

const DAY = 86_400_000;
const MIN = 60_000;
/** Same epoch the Phase-1 Hermes spike used, so pinned values are comparable. */
const T0 = 1_700_000_000_000;

/** Reviews a card `grades.length` times, each at its current due time. */
function chain(grades: Grade[], start = T0) {
  let card = fsrsScheduler.initialCard(start);
  let at = start;
  for (const grade of grades) {
    const res = fsrsScheduler.review(card, grade, at);
    card = res.card;
    at = card.due;
  }
  return { card, lastDue: at };
}

describe("FSRS parameter guards", () => {
  test("FSRS_W matches ts-fsrs 5.4.1 defaults exactly (drift guard)", () => {
    expect([...FSRS_W]).toEqual([...default_w]);
    expect([...generatorParameters().w]).toEqual([...FSRS_W]);
    expect(FSRS_W).toHaveLength(21);
  });

  test("stability/difficulty bounds match ts-fsrs and fsrs-rs", () => {
    expect(S_MIN).toBe(TS_FSRS_S_MIN);
    expect(S_MAX).toBe(TS_FSRS_S_MAX);
    expect(D_MIN).toBe(1);
    expect(D_MAX).toBe(10);
  });

  test("our explicit params: retention 0.9, no fuzz, 365-DAY cap, short-term on", () => {
    expect(FSRS_PARAMS.request_retention).toBe(0.9);
    expect(FSRS_PARAMS.enable_fuzz).toBe(false);
    // maximum_interval is in DAYS. PopMots shipped 0.8 here and silently
    // capped every interval at 1-3 days — this pin is the regression guard.
    expect(FSRS_PARAMS.maximum_interval).toBe(365);
    expect(FSRS_PARAMS.maximum_interval).toBeGreaterThanOrEqual(30);
    expect(FSRS_PARAMS.enable_short_term).toBe(true);
    // Values we intentionally share with upstream defaults:
    expect(FSRS_PARAMS.request_retention).toBe(default_request_retention);
    expect(FSRS_PARAMS.enable_fuzz).toBe(default_enable_fuzz);
    expect(FSRS_PARAMS.enable_short_term).toBe(default_enable_short_term);
  });

  test("generatorParameters preserves our overrides", () => {
    const p = generatorParameters({ ...FSRS_PARAMS, w: [...FSRS_W] });
    expect(p.request_retention).toBe(0.9);
    expect(p.maximum_interval).toBe(365);
    expect(p.enable_fuzz).toBe(false);
    expect(p.enable_short_term).toBe(true);
    expect([...p.w]).toEqual([...FSRS_W]);
  });
});

describe("fsrsScheduler: card lifecycle", () => {
  test("initialCard is a plain new card with no deprecated fields", () => {
    const card = fsrsScheduler.initialCard(T0);
    expect(card).toEqual({
      due: T0,
      stability: 0,
      difficulty: 0,
      scheduled_days: 0,
      learning_steps: 0,
      reps: 0,
      lapses: 0,
      state: "new",
    });
    expect("elapsed_days" in card).toBe(false);
    expect("last_review" in card).toBe(false);
  });

  test("first rating: initial stability = w[grade-1] for all four grades", () => {
    const fresh = () => fsrsScheduler.initialCard(T0);

    const again = fsrsScheduler.review(fresh(), "again", T0).card;
    expect(again.stability).toBeCloseTo(FSRS_W[0], 9);
    expect(again.state).toBe("learning");

    const hard = fsrsScheduler.review(fresh(), "hard", T0).card;
    expect(hard.stability).toBeCloseTo(FSRS_W[1], 9);
    expect(hard.state).toBe("learning");

    const good = fsrsScheduler.review(fresh(), "good", T0).card;
    expect(good.stability).toBeCloseTo(FSRS_W[2], 9);
    expect(good.state).toBe("learning");
    expect(good.due).toBe(T0 + 10 * MIN); // second learning step of ["1m","10m"]
    expect(good.reps).toBe(1);
    expect(good.last_review).toBe(T0);

    const easy = fsrsScheduler.review(fresh(), "easy", T0).card;
    expect(easy.stability).toBeCloseTo(FSRS_W[3], 9);
    expect(easy.state).toBe("review"); // easy graduates immediately
    expect(easy.scheduled_days).toBeGreaterThanOrEqual(1);
  });

  test("learning card graduates to review after completing the steps", () => {
    const { card } = chain(["good", "good"]);
    expect(card.state).toBe("review");
    expect(card.scheduled_days).toBeGreaterThanOrEqual(1);
    expect(card.reps).toBe(2);
    expect(card.lapses).toBe(0);
  });

  test("maturity chain pins the spike's cross-engine value: 4 Goods → 46 days", () => {
    // The Phase-1 spike produced scheduled_days = 46 for this exact chain,
    // byte-identical between Node and the Hermes VM. A change here means the
    // engine or parameters changed — that must be a deliberate diff.
    const { card } = chain(["good", "good", "good", "good"]);
    expect(card.state).toBe("review");
    expect(card.scheduled_days).toBe(46);
    expect(card.reps).toBe(4);
    expect(card.lapses).toBe(0);
  });

  test("a mature card receiving an appropriate Good review schedules ≥30 days out", () => {
    // The PopMots guard: their maximum_interval misconfiguration silently
    // capped every interval at 1-3 days. This test fails on that whole bug class.
    const { card, lastDue } = chain(["good", "good", "good", "good"]);
    const next = fsrsScheduler.review(card, "good", lastDue + 5 * DAY).card;
    expect(next.scheduled_days).toBeGreaterThanOrEqual(30);
    expect(next.due - (lastDue + 5 * DAY)).toBeGreaterThanOrEqual(30 * DAY);
  });

  test("maximum_interval caps scheduling at 365 days (+≤2 for grade ordering)", () => {
    // ts-fsrs clamps each grade's interval to maximum_interval, THEN enforces
    // strict ordering hard < good < easy. When all three saturate at the cap,
    // good becomes cap+1 and easy cap+2 (verified in-source, next_interval).
    // So the true ceiling is 367, only in the saturated regime — harmless,
    // and pinned here so an upgrade changing it is visible.
    let card = fsrsScheduler.initialCard(T0);
    let at = T0;
    for (let i = 0; i < 12; i++) {
      card = fsrsScheduler.review(card, "easy", at).card;
      expect(card.scheduled_days).toBeLessThanOrEqual(367);
      at = card.due;
    }
    expect(card.scheduled_days).toBe(367); // saturated easy = cap + 2
    expect(fsrsScheduler.review(card, "hard", at).card.scheduled_days).toBe(365);
    expect(fsrsScheduler.review(card, "good", at).card.scheduled_days).toBe(366);
    // With uncapped growth (default cap 36500), stability >10,000 days would
    // schedule decades out — the cap is doing real work here.
  });

  test("lapse: Again on a mature review card → relearning, lapses+1, reduced stability", () => {
    const { card: mature, lastDue } = chain(["good", "good", "good", "good"]);
    const lapsed = fsrsScheduler.review(mature, "again", lastDue).card;
    expect(lapsed.state).toBe("relearning");
    expect(lapsed.lapses).toBe(1);
    expect(lapsed.stability).toBeGreaterThan(0);
    expect(lapsed.stability).toBeLessThan(mature.stability);
    // FSRS's partial stability retention: a lapse must not zero the card out
    // the way the legacy scheduler's interval-0 reset does.
    expect(lapsed.stability).toBeGreaterThan(S_MIN);
  });
});

describe("fsrsScheduler: retrievability and due", () => {
  test("new cards report 0 without throwing", () => {
    const card = fsrsScheduler.initialCard(T0);
    expect(fsrsScheduler.retrievability(card, T0)).toBe(0);
  });

  test("monotonically decreases over time, stays in [0,1]", () => {
    const { card, lastDue } = chain(["good", "good", "good", "good"]);
    const atReview = fsrsScheduler.retrievability(card, card.last_review!);
    const atDue = fsrsScheduler.retrievability(card, lastDue);
    const past3 = fsrsScheduler.retrievability(card, lastDue + 3 * DAY);
    const past30 = fsrsScheduler.retrievability(card, lastDue + 30 * DAY);
    expect(atReview).toBe(1);
    expect(atDue).toBeLessThan(atReview);
    expect(past3).toBeLessThan(atDue);
    expect(past30).toBeLessThan(past3);
    for (const r of [atDue, past3, past30]) {
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
    }
  });

  test("≈0.9 at the scheduled interval (request_retention) and pins the spike value", () => {
    const { card, lastDue } = chain(["good", "good", "good", "good"]);
    // At the due date, recall probability should sit near the 90% target
    // (whole-day rounding of the interval moves it slightly).
    expect(fsrsScheduler.retrievability(card, lastDue)).toBeCloseTo(0.9, 1);
    // Spike printed 0.896085 at due+3d, byte-identical across engines.
    expect(fsrsScheduler.retrievability(card, lastDue + 3 * DAY)).toBeCloseTo(
      0.896085,
      5
    );
  });

  test("isDue is a pure due-timestamp comparison", () => {
    const card: FsrsCardState = { ...fsrsScheduler.initialCard(T0), due: T0 + DAY };
    expect(fsrsScheduler.isDue(card, T0)).toBe(false);
    expect(fsrsScheduler.isDue(card, T0 + DAY)).toBe(true);
    expect(fsrsScheduler.isDue(card, T0 + 2 * DAY)).toBe(true);
  });
});

describe("fsrsScheduler: persistence contract", () => {
  test("JSON round-trip of the plain card continues scheduling identically", () => {
    const { card, lastDue } = chain(["good", "good", "good"]);
    const revived = JSON.parse(JSON.stringify(card)) as FsrsCardState;
    expect(revived).toEqual(card);

    const now = lastDue + 2 * DAY;
    const fromMemory = fsrsScheduler.review(card, "good", now).card;
    const fromStorage = fsrsScheduler.review(revived, "good", now).card;
    expect(fromStorage).toEqual(fromMemory);
  });

  test("deterministic: identical inputs produce identical outputs (fuzz off)", () => {
    const { card } = chain(["good", "good"]);
    const a = fsrsScheduler.review(card, "hard", card.due + DAY);
    const b = fsrsScheduler.review(card, "hard", card.due + DAY);
    expect(a.card).toEqual(b.card);
    expect(a.log.fsrsLog).toEqual(b.log.fsrsLog);
  });

  test("plain card and log carry no deprecated ts-fsrs fields", () => {
    const { card } = chain(["good"]);
    const res = fsrsScheduler.review(card, "good", card.due);
    expect(Object.keys(res.card).sort()).toEqual(
      [
        "difficulty",
        "due",
        "lapses",
        "last_review",
        "learning_steps",
        "reps",
        "scheduled_days",
        "stability",
        "state",
      ].sort()
    );
    expect(Object.keys(res.log.fsrsLog!).sort()).toEqual(
      [
        "difficulty",
        "due",
        "learning_steps",
        "rating",
        "review",
        "scheduled_days",
        "stability",
        "state",
      ].sort()
    );
  });

  test("mutation log: snapshot copy of prevCard, numeric rating, review = now", () => {
    const start = fsrsScheduler.initialCard(T0);
    const res = fsrsScheduler.review(start, "easy", T0);
    expect(res.log.grade).toBe("easy");
    expect(res.log.at).toBe(T0);
    expect(res.log.prevCard).toEqual(start);
    expect(res.log.prevCard).not.toBe(start); // defensive copy
    expect(res.log.fsrsLog!.rating).toBe(Rating.Easy); // 4
    expect(res.log.fsrsLog!.review).toBe(T0);

    const again = fsrsScheduler.review(res.card, "again", res.card.due);
    expect(again.log.fsrsLog!.rating).toBe(Rating.Again); // 1
  });

  test("rollback restores the exact pre-review card and re-review reproduces the result", () => {
    const { card, lastDue } = chain(["good", "good", "good"]);
    const res = fsrsScheduler.review(card, "good", lastDue);
    const restored = fsrsScheduler.rollback(res.card, res.log);
    expect(restored).toEqual(card);

    const redo = fsrsScheduler.review(restored, "good", lastDue);
    expect(redo.card).toEqual(res.card);
  });

  test("fromPlainCard reconstructs elapsed_days from last_review", () => {
    const { card } = chain(["good", "good"]);
    const input = fromPlainCard(card, card.last_review! + 3 * DAY);
    expect(input.elapsed_days).toBe(3);
    expect(fromPlainCard(fsrsScheduler.initialCard(T0), T0 + DAY).elapsed_days).toBe(0);
    // Clock skew (now before last_review) must not produce negative elapsed days.
    expect(fromPlainCard(card, card.last_review! - DAY).elapsed_days).toBe(0);
  });

  test("toPlainCard/fromPlainCard are mutually consistent", () => {
    const { card, lastDue } = chain(["good", "good", "good"]);
    const roundTripped = toPlainCard({
      ...fromPlainCard(card, lastDue),
      due: new Date(card.due),
      last_review: new Date(card.last_review!),
      state: 2,
    } as Parameters<typeof toPlainCard>[0]);
    expect(roundTripped).toEqual(card);
  });
});

describe("fsrsScheduler: fail-closed validation", () => {
  test("validateFsrsCard accepts every card the engine produces", () => {
    const { card } = chain(["good", "again", "good", "hard", "good", "easy"]);
    expect(validateFsrsCard(card)).toEqual([]);
  });

  test("rejects NaN, Infinity, out-of-range difficulty, unknown state", () => {
    const base = { ...chain(["good", "good"]).card };
    expect(validateFsrsCard({ ...base, stability: NaN })).not.toEqual([]);
    expect(validateFsrsCard({ ...base, due: Infinity })).not.toEqual([]);
    expect(validateFsrsCard({ ...base, difficulty: 11 })).not.toEqual([]);
    expect(validateFsrsCard({ ...base, difficulty: -1 })).not.toEqual([]);
    expect(validateFsrsCard({ ...base, reps: -1 })).not.toEqual([]);
    expect(
      validateFsrsCard({ ...base, state: "bogus" as FsrsCardState["state"] })
    ).not.toEqual([]);
    expect(
      validateFsrsCard({ ...base, last_review: NaN })
    ).not.toEqual([]);
  });
});
