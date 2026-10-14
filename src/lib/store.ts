import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  capCheckpointAttempts,
  emptyAssessmentState,
  type CheckpointAttempt,
  type PersistedAssessmentState,
  type PlacementResult,
} from "./assessment/types";
import { defaultCourseId } from "./course-profile";
import { addDays, dayString, localWeek } from "./dates";
import { serializeCardKey } from "./learning/card-key";
import { applyEvidence } from "./learning/engine";
import type { ReviewEvidence } from "./learning/evidence";
import { msg, type Message } from "./i18n/message";
import { fsrsScheduler } from "./learning/fsrs-adapter";
import { lastMutationIndex, type ReviewLogEntry } from "./learning/review-log";
import type { FsrsCardState } from "./learning/scheduler";
import {
  bootstrapLearner,
  flushLearnerWrites,
  loadCourseLearnerSlice,
  mergeCourseSlice,
  recordLearnerDelta,
  writeLearnerSafetyCopy,
} from "./persistence/learner";
import { logRefOf } from "./persistence/learner-types";
import {
  migrateProgress,
  PERSIST_VERSION,
  type UiLanguagePreference,
} from "./persistence/migrations";
import { isDue, reviewWord, type SrsEntry } from "./srs";

export const XP_PER_LESSON = 15;
export const XP_PERFECT_BONUS = 5;
export const DAILY_GOAL_OPTIONS = [10, 20, 30, 50] as const;
export const DEFAULT_DAILY_GOAL = 20;
/**
 * Course preselected at onboarding and used as the initial active course:
 * the compiler's `defaultCourseId` (the most complete course — French today;
 * P0 replaced the inherited Spanish default). The v0 flat-legacy migration
 * keeps its own `LEGACY_FLAT_COURSE_ID` in persistence/migrations.ts.
 */
export const DEFAULT_COURSE = defaultCourseId();
/** The AsyncStorage key. Never renamed — schema changes bump PERSIST_VERSION. */
export const PROGRESS_STORAGE_KEY = "progress-v2";
/** Days of per-day history kept for the streak calendar and quests. */
const DAY_HISTORY_LIMIT = 70;

export type ThemePreference = "system" | "light" | "dark";
export type WordStat = { correct: number; wrong: number; lastSeen: number };
export type MistakeRef = { lessonId: string; exerciseId: string };
export type DayActivity = {
  xp: number;
  lessons: number;
  perfect: number;
  /** Practice/review sessions and lesson replays (added in v1). */
  sessions?: number;
};

export type CourseProgress = {
  xp: number;
  completedLessons: Record<string, true>;
  mistakes: MistakeRef[];
  wordStats: Record<string, WordStat>;
  /** Legacy scheduler state — courses without the fsrs capability (from v2). */
  srs?: Record<string, SrsEntry>;
  /**
   * FSRS cards keyed by serialized CardKey — fsrs courses (from v2). In
   * MEMORY only since v4: persisted by the learner store (SQLite/JSON),
   * loaded per course on hydration / course switch, never serialised into
   * the AsyncStorage blob.
   */
  cards?: Record<string, FsrsCardState>;
  /** One-release rollback copy of the pre-v2 fr srs map. */
  srsLegacy?: Record<string, SrsEntry>;
};

function emptyCourseProgress(): CourseProgress {
  return {
    xp: 0,
    completedLessons: {},
    mistakes: [],
    wordStats: {},
    srs: {},
  };
}

type ProgressState = {
  activeCourseId: string;
  streak: number;
  lastActiveDay: string | null;
  dailyGoal: number;
  dailyXp: number;
  dailyXpDay: string | null;
  onboardingDone: boolean;
  /** "system" follows the device's light/dark setting. */
  themePreference: ThemePreference;
  /** UI language (v4; P2a renders it): "system" follows the device locale. */
  uiLanguage: UiLanguagePreference;
  courses: Record<string, CourseProgress>;
  /** Per-day activity across courses, for the streak calendar and quests. */
  activeDays: Record<string, DayActivity>;
  /**
   * Append-only evidence log (v2) — in MEMORY only since v4 (the learner
   * store keeps the full history; memory holds each loaded course's recent
   * window plus this session's entries), ring-capped at REVIEW_LOG_CAP.
   */
  reviewLog: ReviewLogEntry[];
  /** Per-course learner assessment state (checkpoints + placement, v4). */
  assessmentByCourse: Record<string, PersistedAssessmentState>;
  /**
   * When the learner acknowledged the network-backed speech recognition
   * disclosure (P9 §7); null/absent = not yet shown-and-acknowledged.
   * Additive optional field — no persist-version bump, backups pass it
   * through, and older states hydrate without it.
   */
  speechNoticeAckAt?: number | null;
  /** True once the learner store has loaded the active course (never persisted). */
  learnerReady: boolean;

  /** Acknowledge the §7 network-recognition disclosure (once, persisted). */
  acknowledgeSpeechNotice: () => void;
  /**
   * Records a completed checkpoint attempt (§60) for the active course.
   * Assessment record ONLY: no XP, no streak, no lesson completion, no
   * FSRS/wordStats writes (§59). Retention: most recent attempts per
   * checkpoint, capped; the latest is never dropped (§164).
   */
  recordCheckpointAttempt: (attempt: CheckpointAttempt) => void;
  /**
   * Store a completed placement diagnostic (§78-83) for the active course:
   * the result plus the floor the learner ACCEPTED (their recommendation,
   * or 0 for "start from the beginning"). Mutates assessment state only —
   * no completedLessons, no XP, no streak, no learning memory of any kind.
   */
  setPlacementResult: (result: PlacementResult, acceptedFloorIndex: number) => void;
  /** Clear the active course's placement floor (§86). The result record is kept as history. */
  resetPlacement: () => void;

  course: () => CourseProgress;
  completeLesson: (lessonId: string, perfect: boolean) => void;
  /** Mistake/review practice: counts as activity, never as lesson completion. */
  recordPracticeSession: () => void;
  /**
   * TODAY completion (§58-61): counts as daily activity and streak, adds
   * bounded XP (1 per completed designated assessment, capped at
   * XP_PER_LESSON) to course + daily XP — never writes completedLessons,
   * never counts as a lesson or a perfect lesson.
   */
  completeTodaySession: (assessmentXp: number) => void;
  addMistake: (mistake: MistakeRef) => void;
  clearMistake: (exerciseId: string) => void;
  recordWord: (target: string, correct: boolean) => void;
  reviewSrsWord: (target: string, correct: boolean) => void;
  /**
   * The single evidence path for all courses: fsrs courses → evidence gate
   * → FSRS; every other course → exact legacy recordWord/reviewSrsWord
   * translation. `courseId` is the SESSION's course (definition.courseId)
   * and must equal the active course — evidence never crosses courses.
   * Returns true when the FSRS scheduler was mutated (enables undo).
   */
  submitEvidence: (ev: ReviewEvidence, courseId?: string) => boolean;
  /** Reverts the course's most recent scheduler mutation (card + log entry). */
  undoLastReview: (courseId: string) => boolean;
  setActiveCourse: (courseId: string) => void;
  setThemePreference: (preference: ThemePreference) => void;
  setUiLanguage: (language: UiLanguagePreference) => void;
  finishOnboarding: (courseId: string, goal: number) => void;
  /** Commit the pending learner-store buffer (one transaction); safe when empty. */
  flushLearner: () => Promise<void>;
  /** Bring a course's cards + recent log into memory (hydration, course switch). */
  loadLearnerCourse: (courseId: string) => Promise<void>;
};

/**
 * The assessment state of a course (empty for a course that never assessed
 * anything). A malformed container — corrupt storage that a migration
 * moved rather than repaired — reads as empty: the UI never dereferences
 * it, and a backup of it still fails the import invariants.
 */
export function assessmentFor(
  state: Pick<ProgressState, "assessmentByCourse">,
  courseId: string
): PersistedAssessmentState {
  const a = state.assessmentByCourse?.[courseId];
  if (
    !a ||
    typeof a !== "object" ||
    !Array.isArray(a.checkpointAttempts) ||
    typeof a.placementFloor !== "number" ||
    !Number.isFinite(a.placementFloor) ||
    a.placementFloor < 0
  ) {
    return emptyAssessmentState();
  }
  return a;
}

function bumpDailyXp(state: ProgressState, amount: number, today: string) {
  const dailyXp = state.dailyXpDay === today ? state.dailyXp + amount : amount;
  return { dailyXp, dailyXpDay: today };
}

/** Streak/day fields shared by lesson completion, replays and practice. */
function activityBase(state: ProgressState, now: Date) {
  const today = dayString(now);
  const yesterday = dayString(addDays(now, -1));
  const streak =
    state.lastActiveDay === today
      ? state.streak
      : state.lastActiveDay === yesterday
        ? state.streak + 1
        : 1;
  return { today, streak };
}

function pruneDays(days: Record<string, DayActivity>) {
  const keys = Object.keys(days).sort();
  if (keys.length <= DAY_HISTORY_LIMIT) return days;
  const keep = new Set(keys.slice(-DAY_HISTORY_LIMIT));
  return Object.fromEntries(Object.entries(days).filter(([k]) => keep.has(k)));
}

function updateCourse(
  state: ProgressState,
  courseId: string,
  fn: (c: CourseProgress) => CourseProgress
): Partial<ProgressState> {
  const prev = state.courses[courseId] ?? emptyCourseProgress();
  return { courses: { ...state.courses, [courseId]: fn(prev) } };
}

function updateAssessment(
  state: ProgressState,
  courseId: string,
  fn: (a: PersistedAssessmentState) => PersistedAssessmentState
): Partial<ProgressState> {
  return {
    assessmentByCourse: {
      ...state.assessmentByCourse,
      [courseId]: fn(assessmentFor(state, courseId)),
    },
  };
}

/**
 * The blob: everything except what the learner store owns (cards, review
 * log) and the runtime-only readiness flag. Unknown forward-compatible
 * fields a newer build may have written survive (they are plain data);
 * functions are dropped by JSON serialisation as before.
 */
function partializeForPersist(state: ProgressState) {
  const { reviewLog: _log, learnerReady: _ready, courses, ...rest } = state;
  return { ...rest, courses: withoutLearnerData(courses) };
}

/** Strip the learner-owned fields from memory once the store holds them. */
function withoutLearnerData(courses: Record<string, CourseProgress>): Record<string, CourseProgress> {
  const out: Record<string, CourseProgress> = {};
  for (const [courseId, course] of Object.entries(courses)) {
    const { cards: _cards, ...rest } = course;
    out[courseId] = rest;
  }
  return out;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      activeCourseId: DEFAULT_COURSE,
      streak: 0,
      lastActiveDay: null,
      dailyGoal: DEFAULT_DAILY_GOAL,
      dailyXp: 0,
      dailyXpDay: null,
      onboardingDone: false,
      themePreference: "system",
      uiLanguage: "system",
      courses: {},
      activeDays: {},
      reviewLog: [],
      assessmentByCourse: {},
      speechNoticeAckAt: null,
      learnerReady: false,

      acknowledgeSpeechNotice: () => set({ speechNoticeAckAt: Date.now() }),

      course: () => get().courses[get().activeCourseId] ?? emptyCourseProgress(),

      completeLesson: (lessonId, perfect) =>
        set((state) => {
          const { today, streak } = activityBase(state, new Date());
          const prevDay = state.activeDays[today] ?? {
            xp: 0,
            lessons: 0,
            perfect: 0,
          };
          const alreadyCompleted =
            !!state.courses[state.activeCourseId]?.completedLessons[lessonId];

          if (alreadyCompleted) {
            // Replaying a finished lesson counts as activity, not as a fresh
            // completion — no XP, no lesson count (closes the replay-farming
            // exploit while keeping the streak reachable).
            const activeDays = pruneDays({
              ...state.activeDays,
              [today]: { ...prevDay, sessions: (prevDay.sessions ?? 0) + 1 },
            });
            return { streak, lastActiveDay: today, activeDays };
          }

          const earned = XP_PER_LESSON + (perfect ? XP_PERFECT_BONUS : 0);
          const daily = bumpDailyXp(state, earned, today);
          const activeDays = pruneDays({
            ...state.activeDays,
            [today]: {
              xp: prevDay.xp + earned,
              lessons: prevDay.lessons + 1,
              perfect: prevDay.perfect + (perfect ? 1 : 0),
              sessions: prevDay.sessions ?? 0,
            },
          });
          const courseUpdate = updateCourse(state, state.activeCourseId, (c) => ({
            ...c,
            xp: c.xp + earned,
            completedLessons: { ...c.completedLessons, [lessonId]: true },
          }));
          return { streak, lastActiveDay: today, activeDays, ...daily, ...courseUpdate };
        }),

      recordCheckpointAttempt: (attempt) =>
        set((state) =>
          updateAssessment(state, state.activeCourseId, (a) => ({
            ...a,
            checkpointAttempts: capCheckpointAttempts([...a.checkpointAttempts, attempt]),
          }))
        ),
      setPlacementResult: (result, acceptedFloorIndex) =>
        set((state) =>
          updateAssessment(state, state.activeCourseId, (a) => ({
            ...a,
            placement: result,
            placementFloor:
              Number.isFinite(acceptedFloorIndex) && acceptedFloorIndex > 0
                ? Math.floor(acceptedFloorIndex)
                : 0,
          }))
        ),
      resetPlacement: () =>
        set((state) =>
          updateAssessment(state, state.activeCourseId, (a) => ({ ...a, placementFloor: 0 }))
        ),
      recordPracticeSession: () =>
        set((state) => {
          const { today, streak } = activityBase(state, new Date());
          const prevDay = state.activeDays[today] ?? {
            xp: 0,
            lessons: 0,
            perfect: 0,
          };
          const activeDays = pruneDays({
            ...state.activeDays,
            [today]: { ...prevDay, sessions: (prevDay.sessions ?? 0) + 1 },
          });
          return { streak, lastActiveDay: today, activeDays };
        }),

      completeTodaySession: (assessmentXp) =>
        set((state) => {
          const { today, streak } = activityBase(state, new Date());
          const prevDay = state.activeDays[today] ?? {
            xp: 0,
            lessons: 0,
            perfect: 0,
          };
          const earned = Number.isFinite(assessmentXp)
            ? Math.max(0, Math.min(Math.round(assessmentXp), XP_PER_LESSON))
            : 0;
          const daily = bumpDailyXp(state, earned, today);
          const activeDays = pruneDays({
            ...state.activeDays,
            [today]: {
              ...prevDay,
              xp: prevDay.xp + earned,
              sessions: (prevDay.sessions ?? 0) + 1,
            },
          });
          const courseUpdate = updateCourse(state, state.activeCourseId, (c) => ({
            ...c,
            xp: c.xp + earned,
          }));
          return { streak, lastActiveDay: today, activeDays, ...daily, ...courseUpdate };
        }),

      addMistake: (mistake) =>
        set((state) =>
          updateCourse(state, state.activeCourseId, (c) =>
            c.mistakes.some((m) => m.exerciseId === mistake.exerciseId)
              ? c
              : { ...c, mistakes: [...c.mistakes, mistake] }
          )
        ),

      clearMistake: (exerciseId) =>
        set((state) =>
          updateCourse(state, state.activeCourseId, (c) => ({
            ...c,
            mistakes: c.mistakes.filter((m) => m.exerciseId !== exerciseId),
          }))
        ),

      recordWord: (target, correct) =>
        set((state) =>
          updateCourse(state, state.activeCourseId, (c) => {
            const prev = c.wordStats[target] ?? { correct: 0, wrong: 0, lastSeen: 0 };
            const quality = correct ? (prev.wrong > prev.correct ? 1 : 2) : 0;
            return {
              ...c,
              wordStats: {
                ...c.wordStats,
                [target]: {
                  correct: prev.correct + (correct ? 1 : 0),
                  wrong: prev.wrong + (correct ? 0 : 1),
                  lastSeen: Date.now(),
                },
              },
              srs: { ...c.srs, [target]: reviewWord(c.srs?.[target], quality) },
            };
          })
        ),

      reviewSrsWord: (target, correct) =>
        set((state) =>
          updateCourse(state, state.activeCourseId, (c) => ({
            ...c,
            srs: { ...c.srs, [target]: reviewWord(c.srs?.[target], correct ? 2 : 0) },
          }))
        ),

      submitEvidence: (ev, sessionCourseId) => {
        let mutated = false;
        if (sessionCourseId !== undefined && sessionCourseId !== get().activeCourseId) {
          console.warn(
            `submitEvidence: session course ${sessionCourseId} is not the active course ${get().activeCourseId} — evidence dropped`
          );
          return false;
        }
        set((state) => {
          const courseId = state.activeCourseId;
          const out = applyEvidence({
            courseId,
            course: state.courses[courseId] ?? emptyCourseProgress(),
            reviewLog: state.reviewLog,
            ev,
            now: Date.now(),
          });
          mutated = out.mutated;
          // The delta the learner store must eventually commit: the log entry
          // this evidence produced and, when the scheduler moved, the card.
          const entry = out.reviewLog[out.reviewLog.length - 1];
          const cardKey = serializeCardKey(ev.cardKey);
          const card = out.mutated ? out.course.cards?.[cardKey] : undefined;
          recordLearnerDelta({
            cardUpserts: card ? [{ courseId, cardKey, card }] : [],
            logAppends: entry ? [entry] : [],
            logRemovals: [],
          });
          return {
            courses: { ...state.courses, [courseId]: out.course },
            reviewLog: out.reviewLog,
          };
        });
        return mutated;
      },

      undoLastReview: (courseId) => {
        const state = get();
        const idx = lastMutationIndex(state.reviewLog, courseId);
        if (idx < 0) return false;
        const entry = state.reviewLog[idx];
        const fr = state.courses[courseId];
        const current = fr?.cards?.[entry.cardKey];
        if (!fr || !current || !entry.mutation) return false;
        // Integrity guard: only roll back the exact card this mutation
        // produced (its last_review IS the entry timestamp). A log entry
        // whose key resolves to some other card — e.g. a pre-fix entry
        // written under the wrong skill — is refused, never "restored"
        // onto a card the review never touched.
        if (current.last_review !== entry.at) return false;
        const restored = fsrsScheduler.rollback(current, {
          grade: entry.mutation.grade,
          at: entry.at,
          prevCard: entry.mutation.prevCard,
          fsrsLog: entry.mutation.fsrsLog,
        });
        set({
          courses: {
            ...state.courses,
            [courseId]: {
              ...fr,
              cards: { ...fr.cards, [entry.cardKey]: restored },
            },
          },
          // Card and log move together: the undone review never happened.
          reviewLog: [
            ...state.reviewLog.slice(0, idx),
            ...state.reviewLog.slice(idx + 1),
          ],
        });
        recordLearnerDelta({
          cardUpserts: [{ courseId, cardKey: entry.cardKey, card: restored }],
          logAppends: [],
          logRemovals: [logRefOf(entry)],
        });
        return true;
      },

      setActiveCourse: (courseId) => {
        set({ activeCourseId: courseId });
        void get().loadLearnerCourse(courseId);
      },

      setThemePreference: (preference) => set({ themePreference: preference }),

      setUiLanguage: (language) => set({ uiLanguage: language }),

      finishOnboarding: (courseId, goal) => {
        set({ activeCourseId: courseId, dailyGoal: goal, onboardingDone: true });
        void get().loadLearnerCourse(courseId);
      },

      flushLearner: () => flushLearnerWrites(),

      loadLearnerCourse: async (courseId) => {
        try {
          // Flushes the pending buffer first, so the store is the truth and
          // memory may drop every other course's learner data (it only ever
          // holds the active course's window — same as after the bootstrap).
          const slice = await loadCourseLearnerSlice(courseId);
          set((state) => {
            const isActive = state.activeCourseId === courseId;
            const memoryLog = isActive ? state.reviewLog.filter((e) => e.courseId === courseId) : state.reviewLog;
            const merged = mergeCourseSlice(state.courses[courseId]?.cards, memoryLog, courseId, slice);
            const courses = isActive ? withoutLearnerData(state.courses) : state.courses;
            return {
              courses: {
                ...courses,
                [courseId]: { ...(state.courses[courseId] ?? emptyCourseProgress()), cards: merged.cards },
              },
              reviewLog: merged.reviewLog,
            };
          });
        } catch (error) {
          console.warn(`learner store: could not load ${courseId}`, error);
        }
      },
    }),
    {
      name: PROGRESS_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      version: PERSIST_VERSION,
      partialize: (state) => partializeForPersist(state) as unknown as ProgressState,
      migrate: (persisted, version) =>
        migrateProgress(persisted, version, new Date()) as unknown as ProgressState,
      onRehydrateStorage: () => (_state, error) => {
        // No readable storage (the static-export render pass in Node, a
        // broken store): never touch the store here — a write would fail
        // the same way and surface as an unhandled rejection. The client
        // rehydrates again with real storage and bootstraps then.
        if (error) return;
        void runLearnerBootstrap();
      },
    }
  )
);

/**
 * After the blob hydrates: replay a left-over pending buffer, move a
 * pre-v4 blob's cards/review log into the learner store (once, safety copy
 * first), load the active course, and only then declare the store ready.
 * Fail-soft: a learner-store failure never blocks the app — memory keeps
 * whatever the blob carried and the next launch retries.
 */
let bootstrapPromise: Promise<void> = Promise.resolve();

/** Resolves when the most recent learner bootstrap has finished (tests, import). */
export function whenLearnerReady(): Promise<void> {
  return bootstrapPromise;
}

/**
 * Drop the in-memory learner data (cards, review log) and mark the store
 * not ready. Used before re-reading a different blob + learner store (backup
 * import, rollback) so the bootstrap loads from the store instead of
 * treating memory as a pre-v4 blob to import.
 */
export function resetLearnerMemory(): void {
  useProgress.setState((current) => ({
    courses: withoutLearnerData(current.courses),
    reviewLog: [],
    learnerReady: false,
  }));
}

export function runLearnerBootstrap(): Promise<void> {
  bootstrapPromise = runLearnerBootstrapNow();
  return bootstrapPromise;
}

async function runLearnerBootstrapNow(): Promise<void> {
  const state = useProgress.getState();
  try {
    const result = await bootstrapLearner({
      courses: state.courses,
      reviewLog: state.reviewLog,
      activeCourseId: state.activeCourseId,
      writeSafetyCopy: writeLearnerSafetyCopy,
    });
    useProgress.setState((current) => ({
      courses: {
        ...withoutLearnerData(current.courses),
        [current.activeCourseId]: {
          ...(current.courses[current.activeCourseId] ?? emptyCourseProgress()),
          cards: result.active.cards,
        },
      },
      // Memory keeps the loaded window; a pre-v4 log is now in the store.
      reviewLog: result.active.reviewLog,
      learnerReady: true,
    }));
  } catch (error) {
    console.warn("learner store: bootstrap failed — continuing with in-memory learner data", error);
    useProgress.setState({ learnerReady: true });
  }
}

/**
 * The "current" lesson on the PATH: the first incomplete lesson at or after
 * the accepted placement floor (§87-88). With no placement, the floor is 0
 * and this is simply the first incomplete lesson. Placement-cleared lessons
 * before the floor stay open (§81-84) — they are just never "current".
 */
export function currentLessonIndex(
  completed: Record<string, true>,
  lessonIds: string[],
  floorIndex = 0
) {
  const floor = Math.max(0, Math.min(Math.floor(floorIndex), lessonIds.length));
  const firstIncomplete = lessonIds.findIndex((id, i) => i >= floor && !completed[id]);
  return firstIncomplete === -1 ? lessonIds.length : firstIncomplete;
}

export function dailyXpToday(state: Pick<ProgressState, "dailyXp" | "dailyXpDay">) {
  const today = dayString(new Date());
  return state.dailyXpDay === today ? state.dailyXp : 0;
}

/**
 * The streak as it should be displayed *now*: the stored value goes stale if a
 * full day was missed (it's only recomputed on lesson completion).
 */
export function currentStreak(
  state: Pick<ProgressState, "streak" | "lastActiveDay">,
  now = new Date()
) {
  const today = dayString(now);
  const yesterday = dayString(addDays(now, -1));
  return state.lastActiveDay === today || state.lastActiveDay === yesterday
    ? state.streak
    : 0;
}

/** True once a lesson or practice session finished today (lights the flame). */
export function activeToday(state: Pick<ProgressState, "lastActiveDay">) {
  return state.lastActiveDay === dayString(new Date());
}

export function todayActivity(
  state: Pick<ProgressState, "activeDays">
): DayActivity {
  return (
    state.activeDays[dayString(new Date())] ?? { xp: 0, lessons: 0, perfect: 0 }
  );
}

export type Quest = {
  id: string;
  label: Message;
  target: number;
  value: number;
  done: boolean;
};

export function dailyQuests(
  state: Pick<ProgressState, "activeDays" | "dailyGoal">
): Quest[] {
  const today = todayActivity(state);
  const make = (id: string, label: Message, target: number, value: number): Quest => ({
    id,
    label,
    target,
    value: Math.min(value, target),
    done: value >= target,
  });
  return [
    make("xp", msg("quest.xp", { goal: state.dailyGoal }), state.dailyGoal, today.xp),
    make("lessons", msg("quest.lessons"), 3, today.lessons + (today.sessions ?? 0)),
    make("perfect", msg("quest.perfect"), 1, today.perfect),
  ];
}

/** Rolling 7-day window ending today, for the streak calendar strip. */
export function lastSevenDays(state: Pick<ProgressState, "activeDays">) {
  return localWeek(new Date()).map((d) => {
    const activity = state.activeDays[d.day];
    return {
      ...d,
      active: (activity?.lessons ?? 0) + (activity?.sessions ?? 0) > 0,
    };
  });
}

export function dueSrsWords(srs: Record<string, SrsEntry>, now = Date.now()) {
  return Object.entries(srs)
    .filter(([, entry]) => isDue(entry, now))
    .map(([target]) => target);
}
