/**
 * P5b graded stories — build side: tokenizer, lexical resolver, bands, the
 * validator's rules (on the committed stories and on broken copies) and the
 * compiled artifact's per-sentence audio offsets.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";

import type { Stories, StorySource } from "../../content/schema";
import { buildPlugin } from "../lib/languages";
import { loadRichLexicon } from "../lib/lexicon";
import { courseRolesFor, loadIdMaps, loadPacks, safeResolve } from "../lib/pipeline";
import {
  bandOneOrder,
  buildLexemeIndex,
  MICRO_STORY_UNITS,
  microBandLexemes,
  storyTokenRange,
  bundledStoryIds,
  compileStoriesArtifact,
  compileStoryAssetsModule,
  lexemeBands,
  loadStories,
  loadVerbForms,
  parseStoryAudio,
  resolveToken,
  segmentSentence,
  STORY_AUDIO_MAX_BUNDLED,
  storyAssetFiles,
  storyAudioPolicy,
  storyAudioProblems,
  storyClipId,
  storyPipelineVersion,
  storyReadingOrder,
  storySentenceFile,
  validateStories,
} from "../lib/stories";
import { mp3KbpsFor } from "../lib/tts";
import { deriveSyllabus, loadSyllabus } from "../lib/syllabus";

const packs = loadPacks();
function target(lang: string) {
  const lexicon = loadRichLexicon(lang);
  const primary = courseRolesFor(lang, packs).primary!.pack;
  const syllabus = loadSyllabus(lang) ?? deriveSyllabus({ lang, level: "A1", minLexemes: 0, lexicon, pack: primary });
  const micro = microBandLexemes(lexicon, primary, loadIdMaps(packs)[lang]);
  return { lexicon, syllabus, micro, stories: loadStories(lang)! };
}
const ES = target("es");
const FR = target("fr");
const validate = (lang: string, t: ReturnType<typeof target>, stories: Stories = t.stories) =>
  validateStories({ lang, stories, lexicon: t.lexicon, syllabus: t.syllabus, microLexemes: t.micro, nativeCodes: ["vi", "en"], receptionVoices: null });
const words = (lang: string, text: string) => segmentSentence(lang, text).filter((p) => p.word).map((p) => p.text);

describe("tokenizer", () => {
  test("pieces concatenate to the sentence; French elision splits after the apostrophe", () => {
    const text = "C'est aujourd'hui : l'homme boit de l’eau.";
    expect(segmentSentence("fr", text).map((p) => p.text).join("")).toBe(text);
    expect(words("fr", text)).toEqual(["C'", "est", "aujourd'", "hui", "l'", "homme", "boit", "de", "l’", "eau"]);
  });

  test("the generated story asset map disables the require() lint rule only for Opus requires (coordinator 2026-10-30)", () => {
    const directive = "/* eslint-disable @typescript-eslint/no-require-imports -- generated: Metro static asset requires */";
    expect(compileStoryAssetsModule(ES.stories, "../../..")).toContain(directive);
    // No requires, or MP3 (allowed by eslint-config-expo): an unused directive would itself warn.
    expect(compileStoryAssetsModule(ES.stories, "../../..", { kind: "none", reason: "r" })).not.toContain(directive);
    expect(compileStoryAssetsModule(FR.stories, "../../..")).not.toContain(directive);
  });

  test("a number is never a word token, with or without separators (ICU differs by platform)", () => {
    expect(words("de", "Um 8.30 Uhr kostet es 90 Euro.")).toEqual(["Um", "Uhr", "kostet", "es", "Euro"]);
    expect(words("es", "Cuesta 48.000 euros, 1.000 más.")).toEqual(["Cuesta", "euros", "más"]);
    expect(segmentSentence("de", "Um 8.30 Uhr.").map((p) => p.text).join("")).toBe("Um 8.30 Uhr.");
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

describe("German inflection endings (P3d de)", () => {
  const lexicon = loadRichLexicon("de");
  const index = buildLexemeIndex("de", lexicon, loadVerbForms("de"));
  const endings = buildPlugin("de").storyEndings;
  const resolve = (key: string) => resolveToken(key, { index, functionWords: new Set<string>(), tokenMap: {}, endings });

  test("German plural and adjective endings resolve nouns and adjectives", () => {
    expect(resolve("frauen")).toEqual({ kind: "lexeme", lexemeId: "de:w:frau" });
    expect(resolve("kinder")).toEqual({ kind: "lexeme", lexemeId: "de:w:kind" });
    expect(resolve("kindern")).toEqual({ kind: "lexeme", lexemeId: "de:w:kind" });
    expect(resolve("kleinen")).toEqual({ kind: "lexeme", lexemeId: "de:w:klein" });
    expect(resolve("kleinem")).toEqual({ kind: "lexeme", lexemeId: "de:w:klein" });
    // Adjectives in -e take only -r / -m / -n / -s: böse → böser, bösem.
    expect(resolve("böser")).toEqual({ kind: "lexeme", lexemeId: "de:w:bose" });
    expect(resolve("bösem")).toEqual({ kind: "lexeme", lexemeId: "de:w:bose" });
    // -nen (Freundinnen) is tried last: "einen" is ein + -en, never Ei + -nen.
    expect(resolve("einen")).toEqual({ kind: "lexeme", lexemeId: "de:w:ein" });
    expect(resolve("freundinnen")).toEqual({ kind: "lexeme", lexemeId: "de:w:freundin" });
  });

  test("umlaut plurals are not guessed (they go in tokenMap, explicitly)", () => {
    expect(resolve("männer")).toEqual({ kind: "unresolved" });
  });

  test("without German endings the Romance list is used (Spanish and French unchanged)", () => {
    expect(buildPlugin("es").storyEndings).toBeUndefined();
    expect(resolveToken("kleinen", { index, functionWords: new Set<string>(), tokenMap: {} })).toEqual({ kind: "unresolved" });
  });
});

describe("validator", () => {
  test("the committed stories pass: 46 + 6 micro Spanish, 10 + 6 micro French, every token resolved, ≥ 95 % known", () => {
    for (const [lang, t, n] of [["es", ES, 52], ["fr", FR, 16]] as const) {
      const r = validate(lang, t);
      expect(r.errors).toEqual([]);
      expect(r.analyses.length).toBe(n);
      for (const a of r.analyses) {
        expect(a.unresolved).toEqual([]);
        expect(a.coverage).toBeGreaterThanOrEqual(0.95);
        const range = storyTokenRange(a.band);
        expect(a.tokens).toBeGreaterThanOrEqual(range.min);
        expect(a.tokens).toBeLessThanOrEqual(range.max);
      }
      expect(r.analyses.filter((a) => a.band === "A1-0")).toHaveLength(6);
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
    expect(broken((s) => ({ ...s, sentences: s.sentences.slice(0, 10) }))).toMatch(/word tokens \(band A1-1 stories are 150–400\)/);
    expect(broken((s) => ({ ...s, newLexemes: [...s.newLexemes, "es:w:examen"] }))).toContain("es:w:examen never occurs");
    expect(broken((s) => ({ ...s, questions: s.questions.map((q) => ({ ...q, kind: "locate" as const })) }))).toContain("must ask for an inference");
    expect(broken((s) => ({ ...s, blurb: { vi: "Truyện cấp A1", en: "An A1 story" } }))).toContain("no CEFR/level labels");
    const sameVoice = { ...ES.stories.voiceCast, B: ES.stories.voiceCast.A };
    expect(broken((s) => s, sameVoice)).toContain("needs two distinct voices");
    expect(broken((s) => ({ ...s, blurb: { vi: "chỉ có tiếng Việt" } }))).toContain("missing en text");
  });
});

describe("micro-stories, band A1-0 (QC 2026-10-30 §2.2)", () => {
  const DE = target("de");
  const primary = (lang: string) => courseRolesFor(lang, packs).primary!.pack;

  test("A1-0 is the primary course's unit 1–3 words plus closed-class lexemes, nothing else", () => {
    expect(MICRO_STORY_UNITS).toBe(3);
    for (const id of ["es:w:comer", "es:w:pan", "es:w:gracias", "es:w:yo"]) expect(ES.micro.has(id)).toBe(true);
    for (const id of ["es:w:perro", "es:w:tener", "es:w:estar"]) expect(ES.micro.has(id)).toBe(false);
    // German models pronouns and articles as lexemes; they count like function words.
    for (const id of ["de:w:ich", "de:w:und", "de:w:essen", "de:w:hallo-interjection"]) expect(DE.micro.has(id)).toBe(true);
    expect(DE.micro.has("de:w:sein")).toBe(false);
    const units = primary("es").sections.flatMap((s) => s.units);
    expect(units.slice(3).flatMap((u) => u.words.map((w) => w.target))).toContain("el perro");
  });

  test("A1-0 never re-resolves the words of existing stories ('Hallo' stays the syllabus interjection)", () => {
    const res = (micro: Set<string>) =>
      validateStories({ lang: "de", stories: DE.stories, lexicon: DE.lexicon, syllabus: DE.syllabus, microLexemes: micro, nativeCodes: [], receptionVoices: null })
        .analyses.filter((a) => a.band !== "A1-0")
        .map((a) => a.lexemes);
    expect(res(DE.micro)).toEqual(res(new Set()));
  });

  test("six micro-stories per language, 50–100 tokens, ≥ 95 % known from A1-0 alone", () => {
    for (const t of [ES, FR, DE]) {
      const r = validateStories({ lang: t.stories.language, stories: t.stories, lexicon: t.lexicon, syllabus: t.syllabus, microLexemes: t.micro, nativeCodes: ["vi", "en"], receptionVoices: null });
      const micro = r.analyses.filter((a) => a.band === "A1-0");
      expect(micro).toHaveLength(6);
      for (const a of micro) {
        expect(a.tokens).toBeGreaterThanOrEqual(50);
        expect(a.tokens).toBeLessThanOrEqual(100);
        expect(a.coverage).toBeGreaterThanOrEqual(0.95);
        expect(a.undeclared).toEqual([]);
      }
    }
    expect(storyTokenRange("A1-0")).toEqual({ min: 50, max: 100 });
    expect(storyTokenRange("A1-1")).toEqual({ min: 150, max: 400 });
  });

  test("a micro-story without the A1-0 vocabulary, too long, or using a later word fails", () => {
    const micro = ES.stories.stories.find((s) => s.band === "A1-0")!;
    const run = (story: StorySource, m: Set<string> = ES.micro) =>
      validateStories({ lang: "es", stories: { ...ES.stories, stories: [story] }, lexicon: ES.lexicon, syllabus: ES.syllabus, microLexemes: m, nativeCodes: ["vi", "en"], receptionVoices: null, storyAudio: { kind: "none", reason: "r" } }).errors.join("\n");
    expect(run(micro)).toBe("");
    expect(run(micro, new Set())).toContain("band A1-0 needs the primary course's unit 1–3 vocabulary");
    const long = { ...micro, sentences: [...micro.sentences, ...micro.sentences] };
    expect(run(long)).toMatch(/word tokens \(band A1-0 stories are 50–100\)/);
    const later = { ...micro, sentences: [...micro.sentences, { speaker: "N" as const, text: "Ana tiene un perro.", translation: { vi: "x", en: "x" } }] };
    expect(run(later)).toContain("beyond band A1-0");
  });

  test("the band-1 audio list starts after the micro-stories (they are read with the device voice)", () => {
    for (const t of [ES, FR, DE]) {
      const order = storyReadingOrder(t.stories);
      const first = order.findIndex((id) => t.stories.stories.find((s) => s.id === id)!.band !== "A1-0");
      expect(order.slice(0, first)).toHaveLength(6);
      expect(bandOneOrder(t.stories)).toEqual(order.slice(first));
    }
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

describe("band-1 story audio (QC 2026-10-29b §2.3)", () => {
  const DE = target("de");

  test("the voice manifests bundle the first ≤ 18 stories of the reading order (Opus); French keeps its 10 bundled stories", () => {
    for (const [lang, t, n] of [["es", ES, 18], ["de", DE, 18], ["fr", FR, 10]] as const) {
      const policy = storyAudioPolicy(lang);
      expect(policy.kind).toBe("band-1");
      if (policy.kind !== "band-1") continue;
      expect(policy.stories).toEqual(bandOneOrder(t.stories).slice(0, n));
      expect(storyAudioProblems(t.stories, policy)).toEqual({ errors: [], warnings: [] });
    }
    // Every French story but the micro-stories (device voice).
    expect(bundledStoryIds(FR.stories, storyAudioPolicy("fr")).size).toBe(bandOneOrder(FR.stories).length);
    expect(bundledStoryIds(DE.stories, storyAudioPolicy("de")).size).toBe(18);
    expect(storyAudioPolicy("de").kind === "band-1" && storyAudioPolicy("es").kind === "band-1").toBe(true);
    expect(STORY_AUDIO_MAX_BUNDLED).toBe(18);
  });

  test("parse: absent = all, false = none, band-1 = the list; anything else is refused", () => {
    expect(parseStoryAudio(undefined)).toEqual({ kind: "all" });
    expect(parseStoryAudio({ bundled: false, reason: "r" })).toEqual({ kind: "none", reason: "r" });
    expect(parseStoryAudio({ bundled: "band-1", stories: ["a"], reason: "r" })).toEqual({ kind: "band-1", stories: ["a"], reason: "r" });
    expect(() => parseStoryAudio({ bundled: true })).toThrow();
  });

  test("declaration problems: unknown, repeated, over the cap, no reason; a list that skips an earlier story warns", () => {
    const order = bandOneOrder(DE.stories);
    const bad = storyAudioProblems(DE.stories, { kind: "band-1", stories: [...order.slice(0, 19), order[0], "de.story.nope"], reason: "" });
    expect(bad.errors.join("\n")).toContain("a reason is required");
    expect(bad.errors.join("\n")).toContain("listed twice");
    expect(bad.errors.join("\n")).toContain("de.story.nope is not a story");
    expect(bad.errors.join("\n")).toContain("at most 18");
    const skip = storyAudioProblems(DE.stories, { kind: "band-1", stories: order.slice(1, 4), reason: "r" });
    expect(skip.errors).toEqual([]);
    expect(skip.warnings[0]).toContain(order[0]);
  });

  test("only bundled stories need sentence assets; the others validate without audio", () => {
    const order = storyReadingOrder(ES.stories);
    const policy = { kind: "band-1" as const, stories: order.slice(0, 2), reason: "r" };
    const files = storyAssetFiles("es", ES.stories, policy);
    const sentences = ES.stories.stories.filter((s) => policy.stories.includes(s.id)).reduce((n, s) => n + s.sentences.length, 0);
    expect(files.size).toBeLessThanOrEqual(sentences);
    expect(files.size).toBeGreaterThan(0);
    expect(storyAssetFiles("es", ES.stories, { kind: "none", reason: "r" }).size).toBe(0);
    // A policy bundling nothing: no "assets missing" error for any story.
    const result = validateStories({ lang: "es", stories: ES.stories, lexicon: ES.lexicon, syllabus: ES.syllabus, nativeCodes: ["vi", "en"], receptionVoices: null, storyAudio: { kind: "none", reason: "r" } });
    expect(result.errors.filter((e) => e.includes("assets missing"))).toEqual([]);
  });

  test("the compiled artifact says per story `audio: \"bundled\" | \"device-voice\"`, bundled only when declared and every sentence asset exists", () => {
    const stories = { ...ES.stories, stories: ES.stories.stories.slice(0, 3) };
    const { analyses } = validate("es", ES, stories);
    const [a, b, c] = stories.stories.map((s) => s.id);
    const policy = { kind: "band-1" as const, stories: [a, b], reason: "r" };
    const missingB = new Set(stories.stories[1].sentences.slice(0, 1).map((s) => storySentenceFile("es", stories, s)));
    const artifact = JSON.parse(compileStoriesArtifact({ stories, analyses, nativeCode: "vi", durations: new Map(), storyAudio: policy, hasAsset: (f) => !missingB.has(f) }));
    expect(artifact.byId[a].audio).toBe("bundled");
    expect(artifact.byId[b].audio).toBe("device-voice"); // declared, but one sentence has no asset
    expect(artifact.byId[c].audio).toBe("device-voice"); // not band-1
    const all = JSON.parse(compileStoriesArtifact({ stories, analyses, nativeCode: "vi", durations: new Map(), storyAudio: { kind: "all" }, hasAsset: () => true }));
    expect(Object.values(all.byId).map((s) => (s as { audio: string }).audio)).toEqual(["bundled", "bundled", "bundled"]);
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
