/**
 * The graded-story reader shows the lessons' reading display for a CJK
 * course: furigana over each word (the per-course reading-aid switch), the
 * romaji line while the course shows romaji until its kana primer is passed,
 * and Hán-Việt only where the lessons show it — on a single word (the
 * tap-to-gloss sheet) of a Vietnamese-native course. Latin-script courses
 * render exactly as before (snapshots taken before the reading layer).
 */
import { screen, userEvent, waitFor, within } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import React from "react";

import xcIndex from "../src/content/test-only/lexicon/xc-index.json";
import xcPack from "../src/content/test-only/packs/xc-en.json";
import { registerCourseBundle } from "../src/lib/course-bundle";
import { __registerCourseProfileForTests, courseProfile } from "../src/lib/course-profile";
import { storyAudioSourceFor, storyList, type CompiledStory, type CompiledStorySentence } from "../src/lib/stories/content";
import { useProgress } from "../src/lib/store";
import type { Pack } from "../src/lib/types";

const Speech = jest.requireMock("expo-speech") as { getAvailableVoicesAsync: jest.Mock };

beforeEach(() => {
  Speech.getAvailableVoicesAsync.mockReset();
  Speech.getAvailableVoicesAsync.mockImplementation(async () => []);
});

function seed(courseId: string, extra: Partial<ReturnType<typeof useProgress.getState>> = {}) {
  useProgress.setState({
    activeCourseId: courseId,
    streak: 0,
    lastActiveDay: null,
    dailyGoal: 20,
    dailyXp: 0,
    dailyXpDay: null,
    onboardingDone: true,
    themePreference: "light",
    courses: {},
    activeDays: {},
    reviewLog: [],
    readingAid: {},
    primerPassed: {},
    ...extra,
  });
}

type JsonNode = { type: string; props: Record<string, unknown>; children: (JsonNode | string)[] | null };

/** The rendered subtree with this testID (the sentence list, the word sheet): what the reading layer touches. */
function subtree(testID: string): JsonNode | null {
  const visit = (node: JsonNode | string): JsonNode | null => {
    if (typeof node === "string") return null;
    if (node.props.testID === testID) return node;
    for (const kid of node.children ?? []) {
      const hit = visit(kid);
      if (hit) return hit;
    }
    return null;
  };
  const root = screen.toJSON() as JsonNode | JsonNode[] | null;
  for (const node of Array.isArray(root) ? root : root ? [root] : []) {
    const hit = visit(node);
    if (hit) return hit;
  }
  return null;
}

const rubyCount = () => screen.queryAllByTestId("ruby-text").length;
const romajiLines = () => screen.queryAllByTestId("reading-romaji").map((n) => String(n.props.children));

describe("Latin-script courses render the reader exactly as before", () => {
  test("fr-en: reader and its word sheet", async () => {
    seed("fr-en");
    renderRouter("./src/app", { initialUrl: "/story/fr.story.le_chat_et_la_souris" });
    await waitFor(() => expect(screen.getByTestId("story-reader")).toBeOnTheScreen());
    expect(subtree("story-text")).toMatchSnapshot("fr-en sentences");
    await userEvent.press(screen.getAllByTestId("story-word-fr:w:chat")[0]);
    expect(screen.getByTestId("story-word-sheet")).toBeOnTheScreen();
    expect(subtree("story-word-sheet")).toMatchSnapshot("fr-en word sheet");
    expect(rubyCount()).toBe(0);
    expect(romajiLines()).toEqual([]);
  });

  test("de-vi: a device-voice story without a voice (text only)", async () => {
    const story = storyList("de-vi").find((s) => storyAudioSourceFor("de-vi", s) === "device-voice");
    expect(story).toBeDefined();
    seed("de-vi");
    renderRouter("./src/app", { initialUrl: `/story/${story!.id}` });
    await waitFor(() => expect(screen.getByTestId("story-device-voice-hint")).toBeOnTheScreen());
    expect(subtree("story-text")).toMatchSnapshot("de-vi sentences");
    expect(rubyCount()).toBe(0);
    expect(romajiLines()).toEqual([]);
  });
});

function sentence(
  i: number,
  speaker: CompiledStorySentence["speaker"],
  text: string,
  translation: string,
  pieces: CompiledStorySentence["pieces"]
): CompiledStorySentence {
  return { speaker, text, translation, pieces, assetKey: `xc.story.gakusei.s${i}`, startSec: null, durationSec: null };
}

/** A ja story over the synthetic CJK test words (学生, 食べる with furigana), as the story compiler emits it. */
const STORY: CompiledStory = {
  id: "xc.story.gakusei",
  band: "A1-0",
  title: "学生",
  blurb: "Một sinh viên ăn bánh mì.",
  tokens: 6,
  lexemes: ["xc:w:gakusei", "xc:w:taberu"],
  newLexemes: ["xc:w:gakusei"],
  sentences: [
    sentence(0, "N", "学生です。", "Tôi là sinh viên.", [["学生", "xc:w:gakusei"], ["です。"]]),
    sentence(1, "A", "パンを食べます。", "Tôi ăn bánh mì.", [["パンを"], ["食べます", "xc:w:taberu"], ["。"]]),
    // An unlinked word (学生 here) still gets its furigana from the course's readings.
    sentence(2, "N", "パンを食べる学生です。", "Sinh viên ăn bánh mì.", [["パンを"], ["食べる", "xc:w:taberu"], ["学生です。"]]),
  ],
  questions: [{ kind: "locate", prompt: "Ai ăn bánh mì?", options: ["Sinh viên", "Giáo viên", "Bác sĩ"], answer: 0 }],
  audio: "device-voice",
};

const JA_VI = "ja-xcstory";
const JA_EN = "ja-xcstoryen";

beforeAll(() => {
  for (const [id, nativeCode] of [[JA_VI, "vi"], [JA_EN, "en"]] as const) {
    const base = courseProfile("ja-en");
    __registerCourseProfileForTests({ ...base, id, nativeCode, romajiUntilPrimer: true, capabilities: { ...base.capabilities, stories: true } });
    registerCourseBundle({
      id,
      pack: { ...(xcPack as unknown as Pack), id },
      artifacts: { lexiconIndex: xcIndex, stories: { order: [STORY.id], byId: { [STORY.id]: STORY } } },
      audio: {},
    });
  }
});

afterAll(() => {
  __registerCourseProfileForTests(null, JA_VI);
  __registerCourseProfileForTests(null, JA_EN);
});

type Queries = Pick<typeof screen, "queryAllByTestId">;
const readings = (root: Queries = screen) => root.queryAllByTestId("ruby-reading").map((n) => String(n.props.children));

async function openStory(courseId: string, state: { readingAid?: Record<string, boolean>; primerPassed?: Record<string, true> }) {
  seed(courseId, state);
  renderRouter("./src/app", { initialUrl: `/story/${STORY.id}` });
  await waitFor(() => expect(screen.getByTestId("story-text")).toBeOnTheScreen());
}

describe("ja story: the lessons' reading display", () => {
  test("before the kana primer: furigana over each word and a romaji line under each sentence", async () => {
    await openStory(JA_VI, {});
    expect(subtree("story-text")).toMatchSnapshot("ja before primer");
    expect(readings()).toEqual(["がく", "せい", "た", "た", "がく", "せい"]);
    expect(romajiLines()).toHaveLength(3);
    expect(romajiLines()[0]).toBe("gakusei desu.");
    expect(screen.getAllByTestId("story-word-xc:w:gakusei")[0].props.accessibilityLabel).toBe("学生 (がくせい)");
  });

  test("tap-to-gloss keeps working; the sheet reads the single word as lessons do, Hán-Việt included (vi)", async () => {
    await openStory(JA_VI, {});
    await userEvent.press(screen.getAllByTestId("story-word-xc:w:gakusei")[0]);
    const sheet = screen.getByTestId("story-word-sheet");
    expect(screen.getByTestId("story-word-gloss")).toHaveTextContent("student");
    expect(readings(within(sheet))).toEqual(["がく", "せい"]);
    expect(within(sheet).getByTestId("reading-hanviet")).toHaveTextContent("học sinh");
    expect(within(sheet).getByTestId("reading-romaji")).toHaveTextContent("gakusei");
    expect(subtree("story-word-sheet")).toMatchSnapshot("ja word sheet before primer");
    // Hán-Việt never on a word in the running text (lessons show it on single words only).
    expect(within(screen.getByTestId("story-text")).queryAllByTestId("reading-hanviet")).toHaveLength(0);
    await userEvent.press(screen.getAllByTestId("story-word-xc:w:taberu")[0]);
    expect(screen.getByTestId("story-word-gloss")).toHaveTextContent("to eat");
  });

  test("after the primer: furigana stay, the romaji line goes", async () => {
    await openStory(JA_VI, { primerPassed: { [JA_VI]: true } });
    expect(subtree("story-text")).toMatchSnapshot("ja after primer");
    expect(readings()).toEqual(["がく", "せい", "た", "た", "がく", "せい"]);
    expect(romajiLines()).toEqual([]);
  });

  test("reading aid off: no furigana (the romaji line follows the primer only)", async () => {
    await openStory(JA_VI, { readingAid: { [JA_VI]: false } });
    expect(rubyCount()).toBe(0);
    expect(romajiLines()).toHaveLength(3);
  });

  test("reading aid off after the primer: the plain reader, tap-to-gloss unchanged", async () => {
    await openStory(JA_VI, { readingAid: { [JA_VI]: false }, primerPassed: { [JA_VI]: true } });
    expect(subtree("story-text")).toMatchSnapshot("ja reading aid off");
    expect(rubyCount()).toBe(0);
    expect(romajiLines()).toEqual([]);
    await userEvent.press(screen.getAllByTestId("story-word-xc:w:gakusei")[0]);
    expect(screen.getByTestId("story-word-gloss")).toHaveTextContent("student");
    expect(screen.queryAllByTestId("reading-hanviet")).toHaveLength(0);
  });

  test("an English-native course: furigana, never Hán-Việt", async () => {
    await openStory(JA_EN, { primerPassed: { [JA_EN]: true } });
    await userEvent.press(screen.getAllByTestId("story-word-xc:w:gakusei")[0]);
    expect(readings(within(screen.getByTestId("story-word-sheet")))).toEqual(["がく", "せい"]);
    expect(screen.queryAllByTestId("reading-hanviet")).toHaveLength(0);
  });
});
