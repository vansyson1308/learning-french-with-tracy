/**
 * Staging for course build-up (P3d).
 *
 * A new course is authored over many sessions, and its layers only
 * validate together: objectives need lessons that teach them, lessons need
 * the objectives, checkpoints and placement need both. Writing each step
 * straight into `content/` would leave the repository red between
 * sessions. While a course is being built, every authored file therefore
 * lives under `content/<lang>/_drafts/staged/<repo-relative path>` (drafts
 * are never bundled and content discovery ignores `_drafts/`).
 *
 * `withStaging` overlays the staged files onto the real tree for the
 * duration of one command (emit, ingest, lint, checklist), so every reader
 * and every validator sees the course as it will be; writes made during the
 * command are captured back into staging and the real tree is restored
 * byte for byte. `promote` moves the staged layer into place once the whole
 * repository validates with it.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import path from "path";

import { safeResolve } from "../pipeline";

export const stagedRoot = (lang: string) => `content/${lang}/_drafts/staged`;

/** Repo-relative real paths of every staged file of the language. */
export function listStaged(lang: string): string[] {
  const root = safeResolve(stagedRoot(lang));
  if (!existsSync(root)) return [];
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else out.push(path.relative(root, abs).split(path.sep).join("/"));
    }
  };
  walk(root);
  return out.sort();
}

/** Whether a repo-relative path is itself a draft (never staged). */
const isDraftPath = (rel: string) => /^content\/[^/]+\/_drafts\//.test(rel);

let activeHook: ((rel: string) => void) | null = null;

/** Called by writers before they overwrite a repo file (ingest's writeDoc). */
export function beforeWrite(rel: string): void {
  activeHook?.(rel);
}

/**
 * Run `fn` with the staged files overlaid on the real tree. Every file the
 * command writes (reported through `beforeWrite`) is moved into staging
 * afterwards; the real tree is restored exactly, even when `fn` throws.
 */
export function withStaging<T>(lang: string, fn: () => T): T {
  const originals = new Map<string, Buffer | null>();
  const createdDirs: string[] = [];
  const snapshot = (rel: string) => {
    if (isDraftPath(rel) || originals.has(rel)) return;
    const abs = safeResolve(rel);
    originals.set(rel, existsSync(abs) ? readFileSync(abs) : null);
    let dir = path.dirname(abs);
    const missing: string[] = [];
    while (!existsSync(dir)) {
      missing.push(dir);
      dir = path.dirname(dir);
    }
    createdDirs.push(...missing);
  };
  for (const rel of listStaged(lang)) {
    snapshot(rel);
    const abs = safeResolve(rel);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, readFileSync(safeResolve(`${stagedRoot(lang)}/${rel}`)));
  }
  const previousHook = activeHook;
  activeHook = snapshot;
  try {
    return fn();
  } finally {
    activeHook = previousHook;
    for (const [rel, original] of originals) {
      const abs = safeResolve(rel);
      if (existsSync(abs)) {
        const staged = safeResolve(`${stagedRoot(lang)}/${rel}`);
        mkdirSync(path.dirname(staged), { recursive: true });
        writeFileSync(staged, readFileSync(abs));
      }
      if (original === null) rmSync(abs, { force: true });
      else writeFileSync(abs, original);
    }
    for (const dir of [...new Set(createdDirs)].sort((a, b) => b.length - a.length)) {
      if (existsSync(dir) && readdirSync(dir).length === 0) rmSync(dir, { recursive: true, force: true });
    }
  }
}

/** Generated-artifact drift ("— run bun run content:compile"): resolved by the compile that follows promote, never an authoring error. */
export const isGeneratedDrift = (message: string) => /run bun run content:compile/.test(message);

/**
 * Move the staged layer into place. `validate` runs with the layer applied
 * (generated-artifact drift is set aside — the caller compiles right after);
 * when it reports other errors the real tree is restored and nothing is moved.
 */
export const isMissingAudio = (message: string) => / audioTarget has no audio: /.test(message);

/**
 * `allowMissingAudio`: the audio workflow (audio.yml) synthesises a course
 * from the real tree, so a new course is promoted first and its audio
 * generated right after; missing-audio errors are set aside (returned as
 * `pendingAudio`) and every other error still blocks the move.
 */
export function promote(
  lang: string,
  validate: () => string[],
  options: { allowMissingAudio?: boolean } = {}
): { moved: string[]; errors: string[]; pendingAudio: string[] } {
  const staged = listStaged(lang);
  if (staged.length === 0) return { moved: [], errors: [`nothing staged under ${stagedRoot(lang)}`], pendingAudio: [] };
  let errors: string[] = [];
  let pendingAudio: string[] = [];
  const moved: string[] = [];
  withStaging(lang, () => {
    const all = validate().filter((e) => !isGeneratedDrift(e));
    pendingAudio = options.allowMissingAudio ? all.filter(isMissingAudio) : [];
    errors = options.allowMissingAudio ? all.filter((e) => !isMissingAudio(e)) : all;
  });
  if (errors.length > 0) return { moved, errors, pendingAudio };
  for (const rel of staged) {
    const abs = safeResolve(rel);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, readFileSync(safeResolve(`${stagedRoot(lang)}/${rel}`)));
    moved.push(rel);
  }
  rmSync(safeResolve(stagedRoot(lang)), { recursive: true, force: true });
  return { moved, errors, pendingAudio };
}
