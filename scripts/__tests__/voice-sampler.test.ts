/**
 * Voice samplers (QC 2026-11-03 §1.2): deterministic selection from the
 * bundled clips, enough of each kind for every sampled language, and the
 * owner's top checklist line. Rendering needs ffmpeg and runs in CI
 * (.github/workflows/voice-sampler.yml).
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "fs";
import path from "path";

import { COUNTS, SAMPLER_COURSES, dialogueClips, packClips, pickSampler, spread, type Clip } from "../voice-sampler";

const ROOT = path.resolve(import.meta.dir, "../..");
const clip = (text: string): Clip => ({ text, file: `assets/audio/x/${text.length}.mp3` });

describe("voice sampler selection (pure)", () => {
  test("spread takes n items evenly, in order, and everything when there are fewer", () => {
    expect(spread([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 5)).toEqual([1, 3, 5, 7, 9]);
    expect(spread([1, 2], 5)).toEqual([1, 2]);
  });

  test("words are short and unpunctuated; sentences have four words or more and end like a sentence", () => {
    const pack = ["le pain", "merci", "Bonjour !", "Je bois de l'eau.", "Il fait beau.", "Où est la gare ?", "la grande maison rouge"].map(clip);
    const pick = pickSampler(pack, []);
    expect(pick.words.map((c) => c.text)).toEqual(["le pain", "merci"]);
    expect(pick.sentences.map((c) => c.text)).toEqual(["Je bois de l'eau.", "Où est la gare ?"]);
    expect(pick.dialogues).toEqual([]);
  });

  test("the pick does not depend on the input order", () => {
    const pack = Array.from({ length: 40 }, (_, i) => clip(`mot${String(i).padStart(2, "0")}`));
    expect(pickSampler([...pack].reverse(), []).words).toEqual(pickSampler(pack, []).words);
  });
});

describe("voice samplers on the committed audio", () => {
  for (const [lang, courseId] of Object.entries(SAMPLER_COURSES)) {
    const pack = packClips(lang);
    // en-vi audio lands with P4f; until then its sampler has nothing to play.
    test.skipIf(lang === "en" && pack.length === 0)(`${lang} (${courseId}): 10 words and 6 sentences from bundled files`, () => {
      const pick = pickSampler(pack, dialogueClips(lang));
      expect(pick.words).toHaveLength(COUNTS.words);
      expect(pick.sentences).toHaveLength(COUNTS.sentences);
      for (const c of [...pick.words, ...pick.sentences, ...pick.dialogues]) expect(existsSync(path.join(ROOT, c.file)), c.file).toBe(true);
    });
  }

  test("fr and de play two dialogues with both voices; pt has no reception layer", () => {
    for (const lang of ["fr", "de"]) {
      const pick = pickSampler(packClips(lang), dialogueClips(lang));
      expect(pick.dialogues, lang).toHaveLength(COUNTS.dialogues);
      for (const d of pick.dialogues) expect(d.text, lang).toContain(" / ");
    }
    expect(dialogueClips("pt")).toEqual([]);
  });

  test("the owner's checklist opens with the optional listening item", () => {
    const list = readFileSync(path.join(ROOT, "plan/OWNER-FINAL-CHECKLIST.md"), "utf8");
    const item = list.indexOf("Nghe 4 file mẫu giọng (5 phút)");
    expect(item).toBeGreaterThan(0);
    expect(item).toBeLessThan(list.indexOf("## 0."));
    expect(existsSync(path.join(ROOT, ".github/workflows/voice-sampler.yml"))).toBe(true);
  });
});
