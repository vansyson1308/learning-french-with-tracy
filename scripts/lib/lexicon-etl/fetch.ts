/**
 * Bounded downloads and the source cache for the lexicon ETL.
 *
 * 2026-10-28: the German run sat 2 h 49 min in one download — the Tatoeba
 * host trickled bytes, so the old "no data for 120 s" guard never fired.
 * Downloads now go through curl with the same bounds as scripts/ci/fetch.sh:
 * abort below 50 kB/s for 2 min, 5 retries resuming the partial file, and a
 * progress line every 30 s.
 *
 * The "twice" reproducibility rule no longer downloads every dump twice. A
 * run keeps each raw retrieval in a cache directory (restored by
 * actions/cache, keyed by URL + ETag/Last-Modified) with its sha256; the
 * next retrieval is compared with the cached one, and only a mismatch (or a
 * first contact) costs a second download.
 */
import { copyFileSync, existsSync, linkSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "fs";
import { createHash } from "crypto";
import path from "path";

/** Same bounds as scripts/ci/fetch.sh (a test keeps the two in step). */
export const CURL_BOUNDS = [
  "--fail",
  "--location",
  "--silent",
  "--show-error",
  "--retry",
  "5",
  "--retry-all-errors",
  "--retry-delay",
  "10",
  "--connect-timeout",
  "20",
  "--speed-limit",
  "50000",
  "--speed-time",
  "120",
  "-C",
  "-",
] as const;

const PROGRESS_MS = 30_000;

export async function download(url: string, out: string): Promise<void> {
  const part = `${out}.part`;
  const started = Date.now();
  const size = () => (existsSync(part) ? statSync(part).size : 0);
  const ticker = setInterval(() => console.log(`fetch: ${url} — ${size()} bytes after ${Math.round((Date.now() - started) / 1000)} s`), PROGRESS_MS);
  try {
    const proc = Bun.spawn(["curl", ...CURL_BOUNDS, "-o", part, url], { stdout: "inherit", stderr: "inherit" });
    const code = await proc.exited;
    if (code !== 0) throw new Error(`${url}: curl exited ${code} (bounded download: 5 retries, abort below 50 kB/s for 120 s)`);
    renameSync(part, out);
  } finally {
    clearInterval(ticker);
  }
}

export type SourceMeta = { url: string; etag: string | null; lastModified: string | null };

/** HEAD request (redirects followed): the validators of the final response. */
export function headMeta(url: string): SourceMeta {
  const res = Bun.spawnSync(["curl", "--silent", "--show-error", "--head", "--location", "--connect-timeout", "20", "--max-time", "60", url]);
  const text = res.exitCode === 0 ? res.stdout.toString() : "";
  // With --location every hop prints its headers; the last block is the file's.
  const last = text.split(/\r?\n\r?\n/).filter((b) => b.trim()).pop() ?? "";
  const header = (name: string) => new RegExp(`^${name}:\\s*(.+?)\\s*$`, "im").exec(last)?.[1] ?? null;
  return { url, etag: header("etag"), lastModified: header("last-modified") };
}

/** The actions/cache key of a language's sources: changes when any URL or validator changes. */
export function cacheKey(lang: string, metas: SourceMeta[]): string {
  const h = createHash("sha256");
  for (const m of metas) h.update(`${m.url}\t${m.etag ?? ""}\t${m.lastModified ?? ""}\n`);
  return `lexicon-src-${lang}-${h.digest("hex").slice(0, 16)}`;
}

/** `sha256` is the raw download; `artifactSha256` the artifact after decompression (what the manifest pins). */
export type CachedRetrieval = SourceMeta & { sha256: string; bytes: number; retrievedAt: string; artifactSha256: string | null };

export class SourceCache {
  constructor(private readonly dir: string | null) {
    if (dir) mkdirSync(dir, { recursive: true });
  }

  private paths(artifact: string) {
    const base = path.join(this.dir!, artifact);
    return { raw: `${base}.raw`, meta: `${base}.meta.json` };
  }

  get(artifact: string): { raw: string; meta: CachedRetrieval } | null {
    if (!this.dir) return null;
    const p = this.paths(artifact);
    if (!existsSync(p.raw) || !existsSync(p.meta)) return null;
    return { raw: p.raw, meta: JSON.parse(readFileSync(p.meta, "utf8")) as CachedRetrieval };
  }

  /** Same validators as the server reports now → the cached bytes are this retrieval's bytes. */
  fresh(artifact: string, now: SourceMeta): { raw: string; meta: CachedRetrieval } | null {
    const hit = this.get(artifact);
    if (!hit || hit.meta.url !== now.url) return null;
    const validated = (now.etag !== null && now.etag === hit.meta.etag) || (now.lastModified !== null && now.lastModified === hit.meta.lastModified);
    return validated ? hit : null;
  }

  put(artifact: string, raw: string, meta: CachedRetrieval): void {
    if (!this.dir) return;
    const p = this.paths(artifact);
    rmSync(p.raw, { force: true });
    linkOrCopy(raw, p.raw);
    writeFileSync(p.meta, `${JSON.stringify(meta, null, 2)}\n`);
  }

  setArtifactSha256(artifact: string, sha256: string): void {
    const hit = this.get(artifact);
    if (hit) writeFileSync(this.paths(artifact).meta, `${JSON.stringify({ ...hit.meta, artifactSha256: sha256 }, null, 2)}\n`);
  }
}

/** A hard link keeps one copy of a multi-GB dump on the runner disk. */
export function linkOrCopy(from: string, to: string): void {
  try {
    linkSync(from, to);
  } catch {
    copyFileSync(from, to);
  }
}
