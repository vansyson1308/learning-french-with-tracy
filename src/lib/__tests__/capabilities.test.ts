/**
 * Course capabilities (P0): French-only surfaces are gated by hand-set
 * rollout flags so deep links into /goals, /placement/*, /checkpoint/* and
 * the magic lesson ids cannot grade evidence into a course that has no
 * such content.
 */
import { describe, expect, test } from "bun:test";

import {
  courseCapabilities,
  lessonRouteCapability,
  type CourseCapabilities,
} from "../capabilities";
import { catalog } from "../content";

const ALL_FLAGS: (keyof CourseCapabilities)[] = [
  "dailySession",
  "lexicon",
  "placement",
  "checkpoints",
  "goals",
  "listening",
  "speaking",
  "writing",
  "conversation",
];

describe("courseCapabilities", () => {
  test("fr-en has every capability", () => {
    const caps = courseCapabilities("fr-en");
    for (const flag of ALL_FLAGS) expect(caps[flag]).toBe(true);
  });

  test("every other shipped course has none of the French-only surfaces", () => {
    const others = catalog.courses.map((c) => c.id).filter((id) => id !== "fr-en");
    expect(others.length).toBeGreaterThan(0);
    for (const id of others) {
      const caps = courseCapabilities(id);
      for (const flag of ALL_FLAGS) expect(caps[flag]).toBe(false);
    }
  });

  test("an unknown course id is fully gated, never throws", () => {
    const caps = courseCapabilities("zz-zz");
    for (const flag of ALL_FLAGS) expect(caps[flag]).toBe(false);
  });

  test("the returned object is a fresh copy (callers cannot mutate the table)", () => {
    const a = courseCapabilities("fr-en");
    (a as { goals: boolean }).goals = false;
    expect(courseCapabilities("fr-en").goals).toBe(true);
  });
});

describe("lessonRouteCapability", () => {
  test("maps the four French magic ids to their flags", () => {
    expect(lessonRouteCapability("srs-listening")).toBe("listening");
    expect(lessonRouteCapability("srs-speaking")).toBe("speaking");
    expect(lessonRouteCapability("writing-practice")).toBe("writing");
    expect(lessonRouteCapability("conversation")).toBe("conversation");
  });

  test("course-agnostic magic ids and real lesson ids need nothing", () => {
    expect(lessonRouteCapability("srs")).toBeUndefined();
    expect(lessonRouteCapability("mistakes")).toBeUndefined();
    expect(lessonRouteCapability("fr-en:u1-l1")).toBeUndefined();
    expect(lessonRouteCapability("")).toBeUndefined();
  });
});
