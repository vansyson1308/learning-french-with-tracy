#!/usr/bin/env bun
/**
 * Voice samplers (QC 2026-11-03 §1.2): one short MP3 per language, built only
 * from clips the app already bundles, so the owner can hear every voice in a
 * few minutes without a phone. Each file plays 10 words, 6 sentences and 2
 * dialogues at normal speed, then the same again slowed to 0.75×; a .txt
 * beside it lists what plays, in order.
 *
 *   bun scripts/voice-sampler.ts --out voice-samplers fr de pt en
 *
 * Needs ffmpeg. CI: .github/workflows/voice-sampler.yml (artifact
 * voice-samplers). Selection is deterministic: items spread evenly over the
 * sorted list, so a sampler changes only when the bundled audio does.
 */
import { spawnSync } from "child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";

const ROOT = path.resolve(import.meta.dir, "..");

/** The course whose pack audio each sampler uses (the primary course of the target). */
export const SAMPLER_COURSES: Record<string, string> = { fr: "fr-en", de: "de-en", pt: "pt-en", en: "en-vi" };
export const COUNTS = { words: 10, sentences: 6, dialogues: 2 } as const;
export const SLOW_TEMPO = 0.75;

export type Clip = { text: string; file: string };

/** n items spread evenly over the list (pure; tested). */
export function spread<T>(list: readonly T[], n: number): T[] {
  if (list.length <= n) return [...list];
  return Array.from({ length: n }, (_, i) => list[Math.floor(((i + 0.5) * list.length) / n)]);
}

const words = (t: string) => t.trim().split(/\s+/).length;

/** Words, sentences and dialogues for one sampler (pure; tested). */
export function pickSampler(pack: readonly Clip[], dialogues: readonly Clip[]): { words: Clip[]; sentences: Clip[]; dialogues: Clip[] } {
  const byText = (a: Clip, b: Clip) => (a.text < b.text ? -1 : a.text > b.text ? 1 : 0);
  const sorted = [...pack].sort(byText);
  return {
    words: spread(sorted.filter((c) => !/[.!?…]$/.test(c.text) && words(c.text) <= 2), COUNTS.words),
    sentences: spread(sorted.filter((c) => /[.!?]$/.test(c.text) && words(c.text) >= 4), COUNTS.sentences),
    dialogues: spread([...dialogues].sort(byText), COUNTS.dialogues),
  };
}

/** `"<key>": require("<rel>")` rows of a generated map, resolved from its folder. */
function requireMap(rel: string): Map<string, string> {
  const out = new Map<string, string>();
  const abs = path.join(ROOT, rel);
  if (!existsSync(abs)) return out;
  for (const m of readFileSync(abs, "utf8").matchAll(/^\s*"((?:[^"\\]|\\.)*)": require\("([^"]+)"\)/gm)) {
    out.set(JSON.parse(`"${m[1]}"`) as string, path.relative(ROOT, path.resolve(path.dirname(abs), m[2])).split(path.sep).join("/"));
  }
  return out;
}

export function packClips(lang: string): Clip[] {
  const prefix = `${SAMPLER_COURSES[lang]}:`;
  return [...requireMap("src/content/audio-manifest.ts")].filter(([k]) => k.startsWith(prefix)).map(([k, file]) => ({ text: k.slice(prefix.length), file }));
}

export function dialogueClips(lang: string): Clip[] {
  const rel = `content/${lang}/reception/listening.json`;
  if (!existsSync(path.join(ROOT, rel))) return [];
  const assets = requireMap(`src/content/reception/${lang}-clip-assets.ts`);
  const doc = JSON.parse(readFileSync(path.join(ROOT, rel), "utf8")) as { clips: { id: string; kind: string; segments: { speaker: string | number; text: string }[] }[] };
  return doc.clips
    .filter((c) => c.kind === "dialogue" && assets.has(c.id))
    .map((c) => ({ text: c.segments.map((s) => `${s.speaker}: ${s.text}`).join(" / "), file: assets.get(c.id)! }));
}

function ff(args: string[]): void {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ffmpeg ${args.join(" ")}: ${r.stderr}`);
}

/** Render one sampler: normal pass, 1.5 s pause, slow pass. Returns the listing. */
export function renderSampler(lang: string, outDir: string): string {
  const pick = pickSampler(packClips(lang), dialogueClips(lang));
  const order: [string, Clip[]][] = [["Words", pick.words], ["Sentences", pick.sentences], ["Dialogues", pick.dialogues]];
  const all = order.flatMap(([, list]) => list);
  if (all.length === 0) throw new Error(`${lang}: no bundled clip found for ${SAMPLER_COURSES[lang]}`);
  const tmp = mkdtempSync(path.join(tmpdir(), `sampler-${lang}-`));
  try {
    const gap = path.join(tmp, "gap.wav");
    const pause = path.join(tmp, "pause.wav");
    ff(["-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", "0.7", gap]);
    ff(["-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", "1.5", pause]);
    const parts = all.map((c, i) => {
      const wav = path.join(tmp, `${i}.wav`);
      ff(["-i", path.join(ROOT, c.file), "-ar", "24000", "-ac", "1", wav]);
      return wav;
    });
    const list = (files: string[], name: string) => {
      const p = path.join(tmp, name);
      writeFileSync(p, files.map((f) => `file '${f.split(path.sep).join("/")}'`).join("\n") + "\n");
      return p;
    };
    const normal = path.join(tmp, "normal.wav");
    ff(["-f", "concat", "-safe", "0", "-i", list(parts.flatMap((p) => [p, gap]), "normal.txt"), "-c", "copy", normal]);
    const slow = path.join(tmp, "slow.wav");
    ff(["-i", normal, "-filter:a", `atempo=${SLOW_TEMPO}`, slow]);
    mkdirSync(outDir, { recursive: true });
    ff(["-f", "concat", "-safe", "0", "-i", list([normal, pause, slow], "all.txt"), "-ac", "1", "-c:a", "libmp3lame", "-b:a", "64k", path.join(outDir, `${lang}.mp3`)]);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  const listing = [
    `${lang} voice sampler (${SAMPLER_COURSES[lang]}): normal speed, then the same at ${SLOW_TEMPO}×.`,
    ...order.flatMap(([title, list]) => (list.length === 0 ? [`${title}: none bundled`] : [`${title}:`, ...list.map((c) => `  ${c.text}`)])),
  ].join("\n");
  writeFileSync(path.join(outDir, `${lang}.txt`), listing + "\n");
  return listing;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const i = args.indexOf("--out");
  const outDir = i >= 0 ? args[i + 1] : "voice-samplers";
  const langs = args.filter((a, j) => !a.startsWith("--") && j !== i + 1);
  for (const lang of langs.length > 0 ? langs : Object.keys(SAMPLER_COURSES)) {
    if (!SAMPLER_COURSES[lang]) throw new Error(`no sampler course for ${lang}`);
    console.log(renderSampler(lang, outDir));
  }
}
