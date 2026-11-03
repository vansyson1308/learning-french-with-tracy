/**
 * P4b stage 5 (task 4): reading renderers. A Latin course renders exactly
 * as before (snapshot taken before the ruby layer existed); ja/zh/ko
 * courses show furigana above kanji, pinyin under hanzi and Revised
 * Romanization under hangul, and — for a Vietnamese-native course only —
 * the Hán-Việt reading of a Sino-Vietnamese word as a secondary line.
 */
import { render, screen } from "@testing-library/react-native";
import React from "react";

import xcIndex from "../src/content/test-only/lexicon/xc-index.json";
import xcPack from "../src/content/test-only/packs/xc-en.json";
import { ExerciseRenderer } from "../src/components/session/exercise-renderer";
import { getPack } from "../src/lib/content";
import { registerCourseBundle } from "../src/lib/course-bundle";
import { __registerCourseProfileForTests, courseProfile } from "../src/lib/course-profile";
import { useProgress } from "../src/lib/store";
import type { Exercise, Pack } from "../src/lib/types";

const noop = () => {};

/**
 * The synthetic CJK test course (content/xc: 学生 / 食べる with furigana,
 * 汉语 with pinyin, 신라 / 학여울 with RR) registered under real ja/zh/ko
 * course profiles — English-native and Vietnamese-native clones.
 */
const CJK_COURSES = {
  "ja-xc": { base: "ja-en", native: "en" },
  "zh-xc": { base: "zh-en", native: "en" },
  "ko-xc": { base: "ko-en", native: "en" },
  "ja-xcvi": { base: "ja-en", native: "vi" },
  "zh-xcvi": { base: "zh-en", native: "vi" },
  "ko-xcvi": { base: "ko-en", native: "vi" },
} as const;

beforeAll(() => {
  for (const [id, { base, native }] of Object.entries(CJK_COURSES)) {
    __registerCourseProfileForTests({ ...courseProfile(base), id, nativeCode: native });
    registerCourseBundle({ id, pack: { ...(xcPack as unknown as Pack), id }, artifacts: { lexiconIndex: xcIndex }, audio: {} });
  }
});

afterAll(() => {
  for (const id of Object.keys(CJK_COURSES)) __registerCourseProfileForTests(null, id);
});

const selectPrompt = (prompt: string): Exercise => ({
  type: "select",
  id: "xc-t:select",
  mode: "targetToNative",
  prompt,
  options: [{ text: "student" }, { text: "to eat" }],
  correct: 0,
});

const selectOptions = (options: string[]): Exercise => ({
  type: "select",
  id: "xc-t:pick",
  mode: "nativeToTarget",
  prompt: "student",
  options: options.map((text) => ({ text })),
  correct: 0,
});

const match = (targets: string[]): Exercise => ({
  type: "match",
  id: "xc-t:match",
  pairs: targets.map((target, i) => ({ target, native: `n${i}` })),
});

function readings(): string[] {
  return screen.queryAllByTestId("ruby-reading").map((n) => String(n.props.children));
}

type JsonNode = { type: string; props: Record<string, unknown>; children: (JsonNode | string)[] | null };

/** The texts of the first run that carries a reading, in render order (reading above or below its base). */
function firstRunOrder(): string[] {
  const texts = (node: JsonNode | string): string[] =>
    typeof node === "string" ? [node] : (node.children ?? []).flatMap(texts);
  const visit = (node: JsonNode | string): string[] | null => {
    if (typeof node === "string") return null;
    const kids = node.children ?? [];
    if (kids.some((k) => typeof k !== "string" && k.props.testID === "ruby-reading")) return kids.flatMap(texts);
    for (const k of kids) {
      const hit = visit(k);
      if (hit) return hit;
    }
    return null;
  };
  return visit(screen.toJSON() as JsonNode) ?? [];
}

function firstOfType(courseId: string, type: Exercise["type"]): Exercise {
  for (const section of getPack(courseId).sections)
    for (const unit of section.units)
      for (const lesson of unit.lessons)
        for (const exercise of lesson.exercises) if (exercise.type === type) return exercise;
  throw new Error(`${courseId} has no ${type} exercise`);
}

function renderStep(courseId: string, exercise: Exercise, targetLanguage: string) {
  return render(
    <ExerciseRenderer
      exercise={exercise}
      answer={null}
      status="none"
      courseId={courseId}
      targetLanguage={targetLanguage}
      onAnswer={noop}
      onMatchComplete={noop}
      onMatchWordResult={noop}
    />
  );
}

describe("Latin course renders as before (fr-en)", () => {
  beforeEach(() => useProgress.setState({ activeCourseId: "fr-en", readingAid: {} }));

  for (const type of ["select", "match", "fillBlank", "wordBank", "typeAnswer"] as const) {
    test(`${type} snapshot is unchanged and carries no reading layer`, () => {
      const view = renderStep("fr-en", firstOfType("fr-en", type), "French");
      expect(view.toJSON()).toMatchSnapshot();
      expect(screen.queryAllByTestId("ruby-text")).toHaveLength(0);
      expect(screen.queryAllByTestId("reading-hanviet")).toHaveLength(0);
    });
  }
});

function onCourse(courseId: string, readingAid: Record<string, boolean> = {}) {
  useProgress.setState({ activeCourseId: courseId, readingAid });
}

describe("ja: furigana above kanji", () => {
  test("a word prompt carries its furigana segments above the base text", () => {
    onCourse("ja-xc");
    const view = renderStep("ja-xc", selectPrompt("学生"), "Japanese");
    expect(view.toJSON()).toMatchSnapshot();
    expect(readings()).toEqual(["がく", "せい"]);
    expect(firstRunOrder()).toEqual(["がく", "学"]); // above: the reading precedes the base text
    expect(screen.getByTestId("ruby-text").props.accessibilityLabel).toBe("学生 (がくせい)");
    expect(screen.queryByTestId("reading-hanviet")).toBeNull(); // English-native course
  });

  test("okurigana stay plain; a sentence is read word by word, unknown runs stay plain", () => {
    onCourse("ja-xc");
    renderStep("ja-xc", selectPrompt("学生です。"), "Japanese");
    expect(readings()).toEqual(["がく", "せい"]);
    renderStep("ja-xc", selectOptions(["食べる", "学生"]), "Japanese");
    expect(readings()).toEqual(["た", "がく", "せい"]);
  });

  test("fill-blank options, word-bank tiles and a translate prompt get readings", () => {
    onCourse("ja-xc");
    const fill: Exercise = { type: "fillBlank", id: "xc-t:fill", sentence: "パンを___。", translation: "I eat bread.", options: ["食べる", "学生"], correct: 0 };
    renderStep("ja-xc", fill, "Japanese");
    expect(readings()).toEqual(["た", "がく", "せい"]);
    const bank: Exercise = { type: "wordBank", id: "xc-t:bank", direction: "nativeToTarget", prompt: "I am a student.", tokens: ["学生", "です"], answer: ["学生", "です"] };
    renderStep("ja-xc", bank, "Japanese");
    expect(readings()).toEqual(["がく", "せい"]);
    const typed: Exercise = { type: "typeAnswer", id: "xc-t:type", mode: "translate", prompt: "学生です。", answer: "I am a student.", alternatives: [] };
    renderStep("ja-xc", typed, "Japanese");
    expect(readings()).toEqual(["がく", "せい"]);
  });

  test("the per-course reading switch turns the layer off", () => {
    onCourse("ja-xc", { "ja-xc": false });
    renderStep("ja-xc", selectPrompt("学生"), "Japanese");
    expect(screen.queryAllByTestId("ruby-text")).toHaveLength(0);
    expect(screen.getByText("学生")).toBeOnTheScreen();
  });
});

describe("P4c session 5: an item that asks for a reading hides it (select.scriptAid)", () => {
  const COURSE = "ja-xchide";
  beforeAll(() => {
    __registerCourseProfileForTests({ ...courseProfile("ja-en"), id: COURSE, nativeCode: "vi", romajiUntilPrimer: true });
    registerCourseBundle({ id: COURSE, pack: { ...(xcPack as unknown as Pack), id: COURSE }, artifacts: { lexiconIndex: xcIndex }, audio: {} });
  });
  afterAll(() => __registerCourseProfileForTests(null, COURSE));
  test("scriptAid hidden: no furigana, no Hán-Việt and no romaji on the prompt or the options", () => {
    useProgress.setState({ activeCourseId: COURSE, readingAid: {}, primerPassed: {} });
    const kanjiReading: Exercise = { ...selectPrompt("学生"), mode: "nativeToTarget", options: [{ text: "がくせい" }, { text: "せんせい" }], scriptAid: "hidden" };
    renderStep(COURSE, kanjiReading, "Tiếng Nhật");
    expect(screen.queryAllByTestId("ruby-text")).toHaveLength(0);
    expect(screen.queryAllByTestId("reading-romaji")).toHaveLength(0);
    expect(screen.queryAllByTestId("reading-hanviet")).toHaveLength(0);
    expect(screen.getByText("学生")).toBeOnTheScreen();
    const spelling: Exercise = { ...selectOptions(["食べる", "学生"]), scriptAid: "hidden" };
    renderStep(COURSE, spelling, "Tiếng Nhật");
    expect(readings()).toEqual([]);
  });

  test("without it the same item keeps its readings", () => {
    useProgress.setState({ activeCourseId: COURSE, readingAid: {}, primerPassed: {} });
    renderStep(COURSE, { ...selectPrompt("学生"), mode: "nativeToTarget", options: [{ text: "がくせい" }, { text: "せんせい" }] }, "Tiếng Nhật");
    expect(readings()).toEqual(["がく", "せい"]);
  });
});

describe("zh: pinyin under each hanzi", () => {
  test("a sentence shows one syllable under each hanzi of a known word", () => {
    onCourse("zh-xc");
    const view = renderStep("zh-xc", selectPrompt("我学汉语。"), "Chinese");
    expect(view.toJSON()).toMatchSnapshot();
    expect(readings()).toEqual(["hàn", "yǔ"]);
    expect(firstRunOrder()).toEqual(["汉", "hàn"]); // below: the reading follows the base text
    expect(screen.getByTestId("ruby-text").props.accessibilityLabel).toBe("我学汉语。 (hàn yǔ)");
  });

  test("match targets carry their pinyin", () => {
    onCourse("zh-xc");
    renderStep("zh-xc", match(["汉语"]), "Chinese");
    expect(readings()).toEqual(["hàn", "yǔ"]);
  });
});

describe("ko: Revised Romanization under hangul", () => {
  test("match targets carry their RR, a compound boundary included", () => {
    onCourse("ko-xc");
    const view = renderStep("ko-xc", match(["신라", "학여울"]), "Korean");
    expect(view.toJSON()).toMatchSnapshot();
    expect(readings().sort()).toEqual(["hangnyeoul", "silla"]);
  });
});

describe("P4c: romaji until the kana primer checkpoint is passed", () => {
  const COURSE = "ja-xcromaji";
  beforeAll(() => {
    __registerCourseProfileForTests({ ...courseProfile("ja-en"), id: COURSE, nativeCode: "vi", romajiUntilPrimer: true });
    registerCourseBundle({ id: COURSE, pack: { ...(xcPack as unknown as Pack), id: COURSE }, artifacts: { lexiconIndex: xcIndex }, audio: {} });
  });
  afterAll(() => __registerCourseProfileForTests(null, COURSE));

  const at = (primerPassed: Record<string, true>, readingAid: Record<string, boolean> = {}) =>
    useProgress.setState({ activeCourseId: COURSE, readingAid, primerPassed });
  const romaji = () => screen.queryAllByTestId("reading-romaji").map((n) => String(n.props.children));

  test("before the checkpoint: a romaji line under the prompt, read from the stored kana", () => {
    at({});
    const view = renderStep(COURSE, selectPrompt("学生です。"), "Tiếng Nhật");
    expect(view.toJSON()).toMatchSnapshot();
    expect(romaji()).toEqual(["gakusei desu."]);
    expect(readings()).toEqual(["がく", "せい"]);
  });

  test("after the checkpoint: no romaji, furigana as before", () => {
    at({ [COURSE]: true });
    const view = renderStep(COURSE, selectPrompt("学生です。"), "Tiếng Nhật");
    expect(view.toJSON()).toMatchSnapshot();
    expect(romaji()).toEqual([]);
    expect(readings()).toEqual(["がく", "せい"]);
  });

  test("the reading-aid switch still controls the furigana; the romaji line follows the primer only", () => {
    at({}, { [COURSE]: false });
    renderStep(COURSE, selectPrompt("学生です。"), "Tiếng Nhật");
    expect(readings()).toEqual([]);
    expect(romaji()).toEqual(["gakusei desu."]);
    at({ [COURSE]: true }, { [COURSE]: false });
    renderStep(COURSE, selectPrompt("学生です。"), "Tiếng Nhật");
    expect(screen.queryAllByTestId("ruby-text")).toHaveLength(0);
    expect(romaji()).toEqual([]);
  });

  test("never on a production answer: word-bank tiles and fill-blank options carry no romaji", () => {
    at({});
    const bank: Exercise = { type: "wordBank", id: "xc-t:bank", direction: "nativeToTarget", prompt: "Tôi là sinh viên.", tokens: ["学生", "です"], answer: ["学生", "です"] };
    renderStep(COURSE, bank, "Tiếng Nhật");
    expect(romaji()).toEqual([]);
    const fill: Exercise = { type: "fillBlank", id: "xc-t:fill", sentence: "パンを___。", translation: "Tôi ăn bánh mì.", options: ["食べる", "学生"], correct: 0 };
    renderStep(COURSE, fill, "Tiếng Nhật");
    expect(romaji()).toHaveLength(1); // the sentence only; the options (食べる, 学生) have none
  });

  test("other courses never show it", () => {
    onCourse("ja-xcvi");
    renderStep("ja-xcvi", selectPrompt("学生です。"), "Tiếng Nhật");
    expect(romaji()).toEqual([]);
  });
});

describe("Hán-Việt: Vietnamese-native courses, Sino-Vietnamese words only", () => {
  test("ja: 学生 shows học sinh; the kun word 食べる and a sentence show none", () => {
    onCourse("ja-xcvi");
    renderStep("ja-xcvi", selectPrompt("学生"), "Tiếng Nhật");
    expect(screen.getByTestId("reading-hanviet")).toHaveTextContent("học sinh");
    renderStep("ja-xcvi", selectPrompt("食べる"), "Tiếng Nhật");
    expect(readings()).toEqual(["た"]);
    expect(screen.queryByTestId("reading-hanviet")).toBeNull();
    renderStep("ja-xcvi", selectPrompt("学生です。"), "Tiếng Nhật");
    expect(readings()).toEqual(["がく", "せい"]);
    expect(screen.queryByTestId("reading-hanviet")).toBeNull();
  });

  test("zh: 汉语 shows Hán ngữ under its pinyin", () => {
    onCourse("zh-xcvi");
    const view = renderStep("zh-xcvi", match(["汉语"]), "Tiếng Trung");
    expect(view.toJSON()).toMatchSnapshot();
    expect(screen.getByTestId("reading-hanviet")).toHaveTextContent("Hán ngữ");
  });

  test("ko: a word the tables do not list (신라) gets no Hán-Việt", () => {
    onCourse("ko-xcvi");
    renderStep("ko-xcvi", match(["신라"]), "Tiếng Hàn");
    expect(readings()).toEqual(["silla"]);
    expect(screen.queryByTestId("reading-hanviet")).toBeNull();
  });
});
