/**
 * Course capabilities (Phase 3): PRODUCT rollout flags, hand-set — the
 * smallest mechanism that keeps `if (courseId === "fr-en")` out of UI
 * files. Content-derived capabilities (lexicon, pronunciation, …) belong
 * to the future richer catalog; a rollout decision is not computable from
 * content, so it lives here until then.
 */

export type CourseCapabilities = {
  /** TODAY tab + guided daily session (French-first rollout). */
  dailySession: boolean;
  /** Rich lexicon + vocabulary browser (Phase 4, French-first). */
  lexicon: boolean;
  /** Placement diagnostic (`/placement/*`). */
  placement: boolean;
  /** Scored checkpoints + capstone (`/checkpoint/[id]`). */
  checkpoints: boolean;
  /** Can-do goals screen + CEFR estimate (`/goals`). */
  goals: boolean;
  /** Listening review over due listen cards (`/lesson/srs-listening`). */
  listening: boolean;
  /** Speaking review over due speak cards (`/lesson/srs-speaking`). */
  speaking: boolean;
  /** Writing practice with rubric feedback (`/lesson/writing-practice`). */
  writing: boolean;
  /** Conversation practice scenarios (`/lesson/conversation`). */
  conversation: boolean;
};

const NONE: CourseCapabilities = {
  dailySession: false,
  lexicon: false,
  placement: false,
  checkpoints: false,
  goals: false,
  listening: false,
  speaking: false,
  writing: false,
  conversation: false,
};

const FLAGS: Record<string, Partial<CourseCapabilities>> = {
  "fr-en": {
    dailySession: true,
    lexicon: true,
    placement: true,
    checkpoints: true,
    goals: true,
    listening: true,
    speaking: true,
    writing: true,
    conversation: true,
  },
};

export function courseCapabilities(courseId: string): CourseCapabilities {
  return { ...NONE, ...FLAGS[courseId] };
}

/**
 * The capability a "magic" lesson route id needs, or undefined for a real
 * lesson id / the course-agnostic magic ids ("srs", "mistakes").
 */
export function lessonRouteCapability(
  lessonId: string
): keyof CourseCapabilities | undefined {
  switch (lessonId) {
    case "srs-listening":
      return "listening";
    case "srs-speaking":
      return "speaking";
    case "writing-practice":
      return "writing";
    case "conversation":
      return "conversation";
    default:
      return undefined;
  }
}
