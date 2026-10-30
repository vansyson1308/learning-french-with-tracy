/**
 * P5b graded stories — runtime: the compiled stories of the shipped
 * courses, next-story selection for learner personas, the closing word
 * check's evidence plan, and the read-along playback machine.
 */
import { describe, expect, test } from "bun:test";

import { courseProfile } from "../course-profile";
import { syllabusWords } from "../learning/daily-words";
import { lexemeMetaFor } from "../learning/lexicon-index";
import type { FsrsCardState } from "../learning/scheduler";
import type { ExerciseStep, SessionStep } from "../session/types";
import { readingTokens, storyFor, storyHasAudio, storyLevel, storyList, type CompiledStory } from "../stories/content";
import { initialStoryPlayback, storyPlaybackReducer } from "../stories/playback";
import en from "../i18n/catalog/en.json";
import vi from "../i18n/catalog/vi.json";
import { nextStory, rankStories, STORY_TARGET_MAX_UNKNOWN, STORY_TARGET_MIN_UNKNOWN, TODAY_STORY_MAX_UNKNOWN, todayStorySuggestion, unknownLexemes } from "../stories/selection";
import { composeStoryWordCheck, STORY_WORD_CHECK_MAX, storyCheckLexemes } from "../stories/word-check";

const card = {} as FsrsCardState;
const cardsFor = (ids: Iterable<string>) => Object.fromEntries([...ids].map((id) => [`${id}|recognize`, card]));

describe("compiled stories of the shipped courses", () => {
  test("es-vi has 46 + 6 micro, fr-vi and fr-en 10 + 6 each, with the capability; basic packs have none", () => {
    expect(storyList("es-vi").length).toBe(52);
    expect(storyList("fr-vi").length).toBe(16);
    expect(storyList("fr-en").length).toBe(16);
    for (const id of ["es-vi", "fr-vi", "de-vi"]) expect(storyList(id).filter((s) => s.band === "A1-0")).toHaveLength(6);
    for (const id of ["es-vi", "fr-vi", "fr-en"]) expect(courseProfile(id).capabilities.stories).toBe(true);
    for (const id of ["de-en", "ja-en", "es-en"]) expect(storyList(id).length).toBe(0);
  });

  test("native text follows the course: Vietnamese for fr-vi, English for fr-en", () => {
    const vi = storyFor("fr-vi", "fr.story.le_chat_et_la_souris")!;
    const en = storyFor("fr-en", "fr.story.le_chat_et_la_souris")!;
    expect(vi.sentences[0].translation).toBe("Trong nhà bà Dubois có một con mèo.");
    expect(en.sentences[0].translation).toBe("In Madame Dubois's house, there is a cat.");
    expect(vi.sentences[0].text).toBe(en.sentences[0].text);
  });

  test("reading order is by band; levels are shown as 1–4, never CEFR labels", () => {
    const levels = storyList("es-vi").map(storyLevel);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
    expect(new Set(levels)).toEqual(new Set([1, 2, 3])); // A1-0 and A1-1 read as 1; the top-up adds A2-1 (3)
  });

  test("every new word and every tappable word has a gloss in the course's lexicon", () => {
    for (const courseId of ["es-vi", "fr-vi"]) {
      for (const story of storyList(courseId)) {
        for (const id of story.lexemes) expect({ courseId, id, gloss: !!lexemeMetaFor(courseId, id)?.gloss }).toEqual({ courseId, id, gloss: true });
      }
    }
  });

  test("reading tokens: one per word, every lexeme its own token, concatenating to the sentence", () => {
    for (const courseId of ["es-vi", "fr-vi"]) {
      for (const story of storyList(courseId)) {
        for (const s of story.sentences) {
          const tokens = readingTokens(s.pieces);
          expect(tokens.map((t) => t.word + t.trail).join("")).toBe(s.text);
          expect(tokens.filter((t) => t.lexemeId).map((t) => t.word)).toEqual(s.pieces.filter((p) => p.length === 2).map((p) => p[0]));
          // Multi-word expressions ("por favor") stay one tappable lexeme; plain words never hold a space.
          for (const t of tokens) if (!t.lexemeId) expect(/\s/.test(t.word)).toBe(false);
        }
      }
    }
    expect(readingTokens([["¡Hola, "], ["Ana", "es:w:x"], ["! ¿Qué?"]])).toEqual([
      { word: "¡Hola,", trail: " " },
      { word: "Ana", trail: "! ", lexemeId: "es:w:x" },
      { word: "¿Qué?", trail: "" },
    ]);
  });

  test("a story offers the bundled player only once its audio is generated (otherwise device voice, §2.4)", () => {
    for (const story of storyList("es-vi")) {
      if (!storyHasAudio("es-vi", story)) expect(story.sentences.some((s) => s.startSec === null || s.durationSec === null)).toBe(true);
    }
  });
});

describe("TODAY story suggestion (QC 2026-10-30 §2.2: ≤ 10 unknown words, else 'learn N more')", () => {
  const story = (id: string, lexemes: number, band: CompiledStory["band"] = "A1-1") =>
    ({ id, band, title: id, blurb: "", tokens: 0, lexemes: Array.from({ length: lexemes }, (_, i) => `es:w:${id}${i}`), newLexemes: [], sentences: [], questions: [] }) as CompiledStory;

  test("a story with at most 10 unknown words is suggested; 11 is not", () => {
    expect(todayStorySuggestion([story("a", 10)], {})).toMatchObject({ kind: "story", pick: { story: { id: "a" } } });
    expect(todayStorySuggestion([story("a", 11)], {})).toEqual({ kind: "learnMore", n: 1 });
  });

  test("N counts from the closest story, for this learner's cards", () => {
    const far = story("far", 36);
    const near = story("near", 14);
    expect(todayStorySuggestion([far, near], {})).toEqual({ kind: "learnMore", n: 4 });
    // Knowing 4 of the near story's words opens it.
    expect(todayStorySuggestion([far, near], cardsFor(near.lexemes.slice(0, 4)))).toMatchObject({ kind: "story", pick: { story: { id: "near" } } });
  });

  test("a far stretch never wins over a readable story further down the ranking", () => {
    // 1 unknown ranks as "easy" (after every stretch), yet it is the only readable one.
    const easy = story("easy", 3);
    const pick = todayStorySuggestion([story("far", 30), easy], cardsFor(easy.lexemes.slice(0, 2)));
    expect(pick).toMatchObject({ kind: "story", pick: { story: { id: "easy" } } });
  });

  test("no stories → nothing shown; the cap is 10", () => {
    expect(todayStorySuggestion([], {})).toBeNull();
    expect(TODAY_STORY_MAX_UNKNOWN).toBe(10);
  });

  test("the learn-more message names N in both UI languages", () => {
    expect(vi["stories.todayLearnMore"]).toBe("Mở truyện đầu tiên sau khi học thêm {n} từ");
    expect(en["stories.todayLearnMore"]).toContain("{n, plural");
  });
});

describe("next story for learner personas", () => {
  const stories = storyList("es-vi");

  test("a brand-new learner (no cards) gets the closest stretch: the fewest unknown words, lowest band", () => {
    const pick = nextStory(stories, {})!;
    expect(pick.reason).toBe("stretch");
    const fewest = Math.min(...stories.map((s) => s.lexemes.length));
    expect(pick.unknown.length).toBe(fewest);
    expect(pick.story.band).toBe("A1-0");
  });

  test("a learner after the first lesson gets a micro-story suggestion on TODAY (≤ 10 unknown), not a 36-word story", () => {
    // The first lesson of es-vi grades these words (el hombre, la mujer, el niño, la niña, el pan, el agua, la leche, comer, beber…).
    const firstLesson = ["es:w:hombre", "es:w:mujer", "es:w:nino", "es:w:nina", "es:w:pan", "es:w:agua", "es:w:leche", "es:w:comer", "es:w:beber", "es:w:manzana"];
    const s = todayStorySuggestion(stories, cardsFor(firstLesson));
    expect(s?.kind).toBe("story");
    if (s?.kind !== "story") return;
    expect(s.pick.story.band).toBe("A1-0");
    expect(s.pick.unknown.length).toBeLessThanOrEqual(TODAY_STORY_MAX_UNKNOWN);
  });

  test("a learner who knows a story's words except its new ones gets that story (3–6 unknown)", () => {
    const target = stories.find((s) => s.id === "es.story.la_llave_perdida")!;
    const known = target.lexemes.filter((id) => !target.newLexemes.includes(id));
    const pick = nextStory(stories, cardsFor(known))!;
    expect(pick.reason).toBe("target");
    expect(pick.unknown.length).toBeGreaterThanOrEqual(STORY_TARGET_MIN_UNKNOWN);
    expect(pick.unknown.length).toBeLessThanOrEqual(STORY_TARGET_MAX_UNKNOWN);
    // Every "target" story ranks before every other one.
    const ranked = rankStories(stories, cardsFor(known));
    const firstOther = ranked.findIndex((p) => p.reason !== "target");
    expect(ranked.slice(firstOther).every((p) => p.reason !== "target")).toBe(true);
  });

  test("after the word check (new words carded) the story drops out of the target window", () => {
    const target = stories.find((s) => s.id === "es.story.la_llave_perdida")!;
    const afterCheck = cardsFor(target.lexemes);
    expect(unknownLexemes(target, afterCheck)).toEqual([]);
    expect(rankStories(stories, afterCheck).find((p) => p.story.id === target.id)!.reason).toBe("easy");
  });

  test("a learner who knows every word rereads: all easy, the most unknown first", () => {
    const all = cardsFor(stories.flatMap((s) => s.lexemes));
    const ranked = rankStories(stories, all);
    expect(ranked.every((p) => p.reason === "easy" && p.unknown.length === 0)).toBe(true);
    expect(ranked.map((p) => p.story.id)).toEqual(stories.map((s) => s.id)); // stable reading order
  });
});

describe("word check after a story", () => {
  const story = storyFor("es-vi", "es.story.el_perro_de_ana")!;
  const compose = (cards: Record<string, FsrsCardState>, picked: string[] = [], listenClips: Record<string, string> = {}) =>
    composeStoryWordCheck({
      courseId: "es-vi",
      story,
      cards,
      picked,
      lookup: (id) => lexemeMetaFor("es-vi", id),
      pool: syllabusWords("es-vi"),
      listenClips,
      day: "2026-10-28",
    });
  const exercises = (steps: SessionStep[]) => steps.filter((s): s is ExerciseStep => s.type === "exercise");

  test("an uncarded new word is taught, then probed once as the assessment", () => {
    const steps = compose({});
    for (const id of story.newLexemes) {
      expect(steps.some((s) => s.type === "teach" && s.itemId === id)).toBe(true);
      const probes = exercises(steps).filter((s) => s.evidence?.itemId === id);
      expect(probes.length).toBe(1);
      expect(probes[0].evidence).toEqual({ itemId: id, srsRole: "assessment" });
    }
    // Exposure is not evidence: no other word of the story is graded.
    expect(new Set(exercises(steps).map((s) => s.evidence?.itemId))).toEqual(new Set(story.newLexemes));
  });

  test("a carded word gets only its probe; picked words join, words outside the story never", () => {
    const [carded] = story.newLexemes;
    const picked = story.lexemes.find((id) => !story.newLexemes.includes(id))!;
    const steps = compose(cardsFor([carded]), [picked, "es:w:examen"]);
    expect(steps.some((s) => s.type === "teach" && s.itemId === carded)).toBe(false);
    expect(exercises(steps).some((s) => s.evidence?.itemId === carded)).toBe(true);
    expect(exercises(steps).some((s) => s.evidence?.itemId === picked)).toBe(true);
    expect(exercises(steps).some((s) => s.evidence?.itemId === "es:w:examen")).toBe(false);
  });

  test("a word with a bundled clip also gets a listening probe (skill listen)", () => {
    const [id] = story.newLexemes;
    const listen = exercises(compose({}, [], { [id]: "es.clip.fake" })).filter((s) => s.evidence?.skill === "listen");
    expect(listen.map((s) => s.evidence)).toEqual([{ itemId: id, skill: "listen", srsRole: "assessment" }]);
    expect(listen[0].exercise.type).toBe("listeningComprehension");
  });

  test("at most eight words; the same story on the same day composes the same check", () => {
    expect(storyCheckLexemes(story, story.lexemes).length).toBe(STORY_WORD_CHECK_MAX);
    expect(JSON.stringify(compose({}))).toBe(JSON.stringify(compose({})));
  });
});

describe("read-along playback", () => {
  const reduce = storyPlaybackReducer(3);

  test("plays the sentences in order and stops after the last", () => {
    let s = reduce(initialStoryPlayback, { type: "play" });
    expect(s).toEqual({ index: 0, playing: true, finishedOnce: false });
    s = reduce(s, { type: "sentenceEnded" });
    s = reduce(s, { type: "sentenceEnded" });
    expect(s.index).toBe(2);
    s = reduce(s, { type: "sentenceEnded" });
    expect(s).toEqual({ index: null, playing: false, finishedOnce: true });
  });

  test("pause and background keep the place; play resumes there; a sentence button jumps", () => {
    let s = reduce(reduce(initialStoryPlayback, { type: "playFrom", index: 1 }), { type: "appBackground" });
    expect(s).toEqual({ index: 1, playing: false, finishedOnce: false });
    s = reduce(s, { type: "sentenceEnded" }); // a stale end while paused changes nothing
    expect(s.index).toBe(1);
    expect(reduce(s, { type: "play" })).toEqual({ index: 1, playing: true, finishedOnce: false });
    expect(reduce(s, { type: "playFrom", index: 7 })).toBe(s);
  });

  test("a story without sentences never plays", () => {
    expect(storyPlaybackReducer(0)(initialStoryPlayback, { type: "play" })).toBe(initialStoryPlayback);
  });
});

// Type-level guard: the runtime shape the reader consumes.
const _shape: CompiledStory["sentences"][number]["pieces"][number] = ["x"];
void _shape;
