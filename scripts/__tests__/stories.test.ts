/**
 * P5b graded stories — build side: tokenizer, lexical resolver, bands, the
 * validator's rules (on the committed stories and on broken copies) and the
 * compiled artifact's per-sentence audio offsets.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";

import type { Stories, StorySource } from "../../content/schema";
import { loadRichLexicon } from "../lib/lexicon";
import { courseRolesFor, loadPacks, safeResolve } from "../lib/pipeline";
import {
  buildLexemeIndex,
  compileStoriesArtifact,
  lexemeBands,
  loadStories,
  loadVerbForms,
  resolveToken,
  segmentSentence,
  storyClipId,
  storyPipelineVersion,
  validateStories,
} from "../lib/stories";
import { mp3KbpsFor } from "../lib/tts";
import { deriveSyllabus, loadSyllabus } from "../lib/syllabus";

const packs = loadPacks();
function target(lang: string) {
  const lexicon = loadRichLexicon(lang);
  const primary = courseRolesFor(lang, packs).primary!.pack;
  const syllabus = loadSyllabus(lang) ?? deriveSyllabus({ lang, level: "A1", minLexemes: 0, lexicon, pack: primary });
  return { lexicon, syllabus, stories: loadStories(lang)! };
}
const ES = target("es");
const FR = target("fr");
const validate = (lang: string, t: ReturnType<typeof target>, stories: Stories = t.stories) =>
  validateStories({ lang, stories, lexicon: t.lexicon, syllabus: t.syllabus, nativeCodes: ["vi", "en"], receptionVoices: null });
const words = (lang: string, text: string) => segmentSentence(lang, text).filter((p) => p.word).map((p) => p.text);

describe("tokenizer", () => {
  test("pieces concatenate to the sentence; French elision splits after the apostrophe", () => {
    const text = "C'est aujourd'hui : l'homme boit de l’eau.";
    expect(segmentSentence("fr", text).map((p) => p.text).join("")).toBe(text);
    expect(words("fr", text)).toEqual(["C'", "est", "aujourd'", "hui", "l'", "homme", "boit", "de", "l’", "eau"]);
  });
});

describe("lexical resolver", () => {
  const bands = lexemeBands(ES.syllabus);
  const index = buildLexemeIndex("es", ES.lexicon, loadVerbForms("es"), bands);
  const ctx = { index, functionWords: new Set(ES.stories.functionWords), tokenMap: {} as Record<string, string> };
  const resolve = (key: string) => resolveToken(key, ctx);

  test("conjugated forms resolve to their verb; a lemma beats a conjugated homograph", () => {
    expect(resolve("vuelven")).toEqual({ kind: "lexeme", lexemeId: "es:w:volver" });
    expect(resolve("río")).toEqual({ kind: "lexeme", lexemeId: "es:w:rio" }); // the river, not "río" of reír
  });

  test("plural and gender endings resolve nouns and adjectives only", () => {
    expect(resolve("niños")).toEqual({ kind: "lexeme", lexemeId: "es:w:nino" });
    expect(resolve("camiones")).toEqual({ kind: "lexeme", lexemeId: "es:w:camion" });
    expect(resolve("blancas")).toEqual({ kind: "lexeme", lexemeId: "es:w:blanco" });
  });

  test("function words, numbers and the unknown", () => {
    expect(resolve("los")).toEqual({ kind: "function" });
    expect(resolve("12")).toEqual({ kind: "number" });
    expect(resolve("zzzz")).toEqual({ kind: "unresolved" });
  });

  test("bands split each level's syllabus in two halves", () => {
    const first = ES.syllabus.entries[0].lexemeId;
    const last = ES.syllabus.entries[ES.syllabus.entries.length - 1].lexemeId;
    expect(bands.get(first)).toBe("A1-1");
    expect(bands.get(last)).toBe("A1-2");
    expect([...bands.values()].filter((b) => b === "A1-1").length).toBe(Math.ceil(ES.syllabus.entries.length / 2));
  });
});

describe("validator", () => {
  test("the committed stories pass: 20 Spanish, 10 French, every token resolved, ≥ 95 % known", () => {
    for (const [lang, t, n] of [["es", ES, 20], ["fr", FR, 10]] as const) {
      const r = validate(lang, t);
      expect(r.errors).toEqual([]);
      expect(r.analyses.length).toBe(n);
      for (const a of r.analyses) {
        expect(a.unresolved).toEqual([]);
        expect(a.coverage).toBeGreaterThanOrEqual(0.95);
        expect(a.tokens).toBeGreaterThanOrEqual(150);
      }
    }
  });

  const base = ES.stories.stories.find((s) => s.id === "es.story.el_perro_de_ana")!;
  const broken = (edit: (s: StorySource) => StorySource, cast?: Stories["voiceCast"]) =>
    validate("es", ES, { ...ES.stories, ...(cast ? { voiceCast: cast } : {}), stories: [edit(structuredClone(base))] }).errors.join("\n");

  test("an unresolved word, an undeclared beyond-band word and low coverage are errors", () => {
    expect(broken((s) => ({ ...s, sentences: [...s.sentences, { speaker: "N", text: "Zzzz.", translation: { vi: "x", en: "x" } }] }))).toContain("unresolved tokens zzzz");
    expect(broken((s) => ({ ...s, sentences: [...s.sentences, { speaker: "N", text: "Ana tiene un examen.", translation: { vi: "x", en: "x" } }] }))).toContain("es:w:examen beyond band A1-1");
    const repeated = Array.from({ length: 6 }, () => ({ speaker: "N" as const, text: "Un pájaro en el puente.", translation: { vi: "x", en: "x" } }));
    expect(broken((s) => ({ ...s, sentences: [...s.sentences, ...repeated] }))).toMatch(/% known at band A1-1/);
  });

  test("length, new-word, question, CEFR and voice rules", () => {
    expect(broken((s) => ({ ...s, sentences: s.sentences.slice(0, 10) }))).toMatch(/word tokens \(stories are 150–400\)/);
    expect(broken((s) => ({ ...s, newLexemes: [...s.newLexemes, "es:w:examen"] }))).toContain("es:w:examen never occurs");
    expect(broken((s) => ({ ...s, questions: s.questions.map((q) => ({ ...q, kind: "locate" as const })) }))).toContain("must ask for an inference");
    expect(broken((s) => ({ ...s, blurb: { vi: "Truyện cấp A1", en: "An A1 story" } }))).toContain("no CEFR/level labels");
    const sameVoice = { ...ES.stories.voiceCast, B: ES.stories.voiceCast.A };
    expect(broken((s) => s, sameVoice)).toContain("needs two distinct voices");
    expect(broken((s) => ({ ...s, blurb: { vi: "chỉ có tiếng Việt" } }))).toContain("missing en text");
  });
});

describe("story audio budget", () => {
  test("Spanish story sentences use pipeline 4 (24 kbps speech); French keeps its frozen pipeline 1", () => {
    const engines = JSON.parse(readFileSync(safeResolve("content/audio/engines.json"), "utf8"));
    expect(storyPipelineVersion("es")).toBe(4);
    expect(mp3KbpsFor(engines, 4)).toBe(24);
    expect(mp3KbpsFor(engines, 3)).toBe(32); // listening clips unchanged
    expect(storyPipelineVersion("fr")).toBe(1);
    expect(mp3KbpsFor(engines, 1)).toBe(64);
  });
});

describe("compiled artifact", () => {
  test("sentence offsets accumulate the generated durations; text and pieces round-trip", () => {
    const story = FR.stories.stories[0];
    const { analyses } = validate("fr", FR, { ...FR.stories, stories: [story] });
    const durations = new Map(story.sentences.map((_, i) => [storyClipId(story.id, i), 1.5]));
    durations.delete(storyClipId(story.id, 3)); // a gap: offsets stop being known from there
    const artifact = JSON.parse(compileStoriesArtifact({ stories: { ...FR.stories, stories: [story] }, analyses, nativeCode: "vi", durations }));
    const compiled = artifact.byId[story.id];
    expect(compiled.sentences.slice(0, 4).map((s: { startSec: number | null }) => s.startSec)).toEqual([0, 1.5, 3, 4.5]);
    expect(compiled.sentences[3].durationSec).toBeNull();
    expect(compiled.sentences[4].startSec).toBeNull();
    for (const [i, s] of compiled.sentences.entries()) {
      expect(s.pieces.map((p: string[]) => p[0]).join("")).toBe(story.sentences[i].text);
      expect(s.translation).toBe(story.sentences[i].translation.vi);
    }
    expect(compiled.blurb).toBe(story.blurb.vi);
    expect(compiled.newLexemes).toEqual(story.newLexemes);
    for (const id of story.newLexemes) expect(compiled.lexemes).toContain(id);
  });
});
