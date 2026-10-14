/**
 * Writes the deterministic 0.5 s tone for every listening clip of a
 * TEST-ONLY target language (`bun scripts/test-tone.ts --lang xx`): one
 * WAV per deterministic asset key under assets/audio/<lang>-reception/,
 * orphans removed. Never used for a shipped language.
 */
import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from "fs";
import path from "path";

import { isTestOnlyTarget, safeResolve } from "./lib/pipeline";
import { loadListening, receptionAssetKey, receptionAssetsDir, resolveClipSegments } from "./lib/reception";
import { generateToneWav } from "./lib/test-tone";

const langIndex = process.argv.indexOf("--lang");
const lang = langIndex >= 0 ? process.argv[langIndex + 1] : undefined;
if (!lang) {
  console.error("usage: bun scripts/test-tone.ts --lang <test-only language code>");
  process.exit(2);
}
if (!isTestOnlyTarget(lang)) {
  console.error(`${lang} is not a test-only target — tones are never generated for a shipped language`);
  process.exit(1);
}
const listening = loadListening(lang);
if (!listening) {
  console.error(`content/${lang}/reception/listening.json does not exist`);
  process.exit(1);
}
const dir = safeResolve(receptionAssetsDir(lang));
mkdirSync(dir, { recursive: true });
const wanted = new Set<string>();
for (const clip of listening.clips) {
  const name = `${receptionAssetKey(lang, resolveClipSegments(listening, clip))}.wav`;
  wanted.add(name);
  const abs = path.join(dir, name);
  if (!existsSync(abs)) {
    writeFileSync(abs, generateToneWav());
    console.log(`wrote ${receptionAssetsDir(lang)}/${name} (${clip.id})`);
  }
}
for (const file of readdirSync(dir)) {
  if (!wanted.has(file)) {
    unlinkSync(path.join(dir, file));
    console.log(`removed orphan ${receptionAssetsDir(lang)}/${file}`);
  }
}
console.log(`${wanted.size} tone asset(s) in place for ${lang}`);
