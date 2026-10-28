/**
 * Lexicon ETL v2 CLI (P3a) — acquisition and derivation for one target
 * language. NEVER run by CI: CI validates the committed derived data
 * offline. Three commands, mirrored by .github/workflows/lexicon-source.yml:
 *
 *   fetch   --lang es --dir <scratch> [--twice] [--cache <dir>]
 *           Download every catalogued source from its OFFICIAL URL into
 *           <scratch>/es/ (bounded: scripts/lib/lexicon-etl/fetch.ts) and
 *           decompress (gzip/bzip2/tar.gz). With --cache, each raw retrieval
 *           is kept there (the workflow restores it with actions/cache); a
 *           cached retrieval whose artifact matches the pinned sha256, or
 *           whose ETag/Last-Modified the server still reports, is reused
 *           without a download. With --twice (recon) the retrieval must equal
 *           the cached one or a second download, else the run refuses
 *           (reproducibility, as for Lexique 4).
 *   cache-key --lang es
 *           Print the actions/cache key: URL + ETag/Last-Modified of every
 *           source (HEAD requests only).
 *   recon   --lang es --dir <scratch>
 *           Hash every artifact present, pin sha256/bytes/date into
 *           content/es/lexicon/source-manifest.json (v2), capture each
 *           licence note under content/es/lexicon/sources/<id>.md and write
 *           derived/recon.json (line counts, sample entries).
 *   extract --lang es --dir <scratch>
 *           Verify every present artifact against its pin (a mismatch is
 *           source-version drift — refuse), then run the derivation and
 *           write content/es/lexicon/derived/*.json.
 *
 * Raw dumps live only in the scratch directory (and, for the small ones,
 * as workflow run artifacts); nothing of them is committed.
 */

import { execFileSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "fs";
import path from "path";

import { SourceManifestV2Schema, type SourceManifestV2 } from "../content/schema";

import { deriveLanguage } from "./lib/lexicon-etl/derive";
import { cacheKey, download, headMeta, linkOrCopy, SourceCache } from "./lib/lexicon-etl/fetch";
import { fileIdentity, readLines } from "./lib/lexicon-etl/jsonl";
import { buildManifestV2, type ArtifactIdentity } from "./lib/lexicon-etl/manifest";
import { sourcesFor, type SourceSpec } from "./lib/lexicon-etl/sources";
import { canonicalJson, readJson, safeResolve } from "./lib/pipeline";

function fail(message: string): never {
  console.error(`ERROR ${message}`);
  process.exit(1);
}

const [, , command, ...rest] = process.argv;
const opt = (name: string): string | undefined => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
};
const flag = (name: string) => rest.includes(`--${name}`);

if (!["fetch", "recon", "extract", "cache-key"].includes(command ?? "")) {
  fail("usage: bun scripts/lexicon-etl.ts <fetch|recon|extract|cache-key> --lang <code> --dir <scratch-dir> [--twice] [--cache <dir>]");
}
const lang = opt("lang") ?? fail("--lang <code> is required");
const scratch = opt("dir") ?? (command === "cache-key" ? path.join("/tmp", "lexicon-src") : fail("--dir <scratch-dir> is required"));
const dir = path.join(scratch, lang);
mkdirSync(dir, { recursive: true });
const manifestRel = `content/${lang}/lexicon/source-manifest.json`;
const derivedDir = safeResolve(`content/${lang}/lexicon/derived`);
const sourcesDocDir = safeResolve(`content/${lang}/lexicon/sources`);
const today = new Date().toISOString().slice(0, 10);

function loadManifest(): SourceManifestV2 | null {
  if (!existsSync(safeResolve(manifestRel))) return null;
  const parsed = SourceManifestV2Schema.safeParse(readJson(manifestRel));
  if (!parsed.success) fail(`${manifestRel} is not a v2 manifest: ${parsed.error.issues[0]?.message}`);
  return parsed.data;
}

function decompress(spec: SourceSpec, downloaded: string, target: string): void {
  if (spec.decompress === "gzip") {
    const bytes = Bun.gunzipSync(readFileSync(downloaded));
    writeFileSync(target, bytes);
    rmSync(downloaded);
  } else if (spec.decompress === "bzip2") {
    // bzip2 is not in Bun's zlib; the CLI exists on the runner (ubuntu) and in Git Bash.
    const out = execFileSync("bzip2", ["-dc", downloaded], { maxBuffer: 1 << 30 });
    writeFileSync(target, out);
    rmSync(downloaded);
  } else if (spec.decompress === "tar.gz") {
    const outDir = target.replace(/\.tar\.gz$/, "");
    mkdirSync(outDir, { recursive: true });
    execFileSync("tar", ["xzf", downloaded, "-C", outDir, "--strip-components=1"]);
    renameSync(downloaded, target);
  }
}

async function fetchAll(): Promise<void> {
  const twice = flag("twice");
  const cache = new SourceCache(opt("cache") ?? null);
  const pins = new Map((loadManifest()?.sources ?? []).filter((s) => s.retrieval.status === "retrieved").map((s) => [s.artifactFilename, s.retrieval.sha256]));
  for (const spec of sourcesFor(lang)) {
    const target = path.join(dir, spec.artifactFilename);
    if (existsSync(target)) {
      console.log(`present  ${spec.artifactFilename}`);
      continue;
    }
    const raw = spec.decompress ? `${target}.download` : target;
    const now = headMeta(spec.url);
    const cached = cache.get(spec.artifactFilename);
    const reusable = !twice && cached && cached.meta.url === spec.url && (cached.meta.artifactSha256 === pins.get(spec.artifactFilename) || cache.fresh(spec.artifactFilename, now));
    if (reusable) {
      linkOrCopy(cached.raw, raw);
      console.log(`cached   ${spec.artifactFilename} (retrieved ${cached.meta.retrievedAt}; ${cached.meta.artifactSha256 === pins.get(spec.artifactFilename) ? "matches the pinned sha256" : "server validators unchanged"} — no download)`);
    } else {
      console.log(`fetching ${spec.url}`);
      await download(spec.url, raw);
      const a = await fileIdentity(raw);
      if (twice) {
        if (cached && cached.meta.url === spec.url && cached.meta.sha256 === a.sha256) {
          console.log(`  reproducible against the cached retrieval of ${cached.meta.retrievedAt} (${a.bytes} bytes, ${a.sha256})`);
        } else {
          // First contact, or the server's bytes differ from the cached retrieval: a second download decides.
          const again = `${raw}.second`;
          await download(spec.url, again);
          const b = await fileIdentity(again);
          rmSync(again);
          if (a.sha256 !== b.sha256) fail(`${spec.artifactFilename}: the two retrievals differ (${a.sha256} ≠ ${b.sha256}) — refusing to pin an unstable artifact`);
          console.log(`  reproducible (${a.bytes} bytes, ${a.sha256})`);
        }
      }
      cache.put(spec.artifactFilename, raw, { ...now, sha256: a.sha256, bytes: a.bytes, retrievedAt: today, artifactSha256: null });
    }
    if (spec.decompress) decompress(spec, raw, target);
    if (!reusable) cache.setArtifactSha256(spec.artifactFilename, (await fileIdentity(target)).sha256);
    console.log(`  → ${spec.artifactFilename} (${statSync(target).size} bytes)`);
  }
  const wordfreq = sourcesFor(lang).find((s) => s.id === "wordfreq");
  if (wordfreq && !existsSync(path.join(dir, wordfreq.artifactFilename))) {
    console.log("wordfreq export: run `python scripts/lib/lexicon-etl/export-wordfreq.py <lang> <dir>/<lang>/wordfreq-<lang>.csv` with wordfreq==3.1.1 installed (the workflow does this).");
  }
}

async function identities(): Promise<Map<string, ArtifactIdentity | null>> {
  const out = new Map<string, ArtifactIdentity | null>();
  for (const spec of sourcesFor(lang)) {
    const file = path.join(dir, spec.artifactFilename);
    if (!existsSync(file)) {
      out.set(spec.artifactFilename, null);
      continue;
    }
    const idn = await fileIdentity(file);
    out.set(spec.artifactFilename, { ...idn, retrievedAt: today });
  }
  return out;
}

async function recon(): Promise<void> {
  const previous = loadManifest();
  const ids = await identities();
  const manifest = buildManifestV2(lang, ids, previous);
  SourceManifestV2Schema.parse(manifest);
  mkdirSync(path.dirname(safeResolve(manifestRel)), { recursive: true });
  writeFileSync(safeResolve(manifestRel), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`pinned ${manifest.sources.filter((s) => s.retrieval.status === "retrieved").length}/${manifest.sources.length} sources into ${manifestRel}`);
  // Licence notes per source id (what the catalogue says; the full licence texts are linked, never paraphrased).
  mkdirSync(sourcesDocDir, { recursive: true });
  const byId = new Map<string, SourceSpec[]>();
  for (const s of sourcesFor(lang)) byId.set(s.id, [...(byId.get(s.id) ?? []), s]);
  for (const [id, specs] of byId) {
    const lines = [
      `# ${specs[0].name}`,
      "",
      `- Registry id: \`${id}\``,
      `- Licence: ${specs[0].license}`,
      `- Citation: ${specs[0].citation}`,
      ...specs.map((s) => `- Artifact: ${s.artifactFilename} ← ${s.url}`),
      `- Recorded: ${today} by scripts/lexicon-etl.ts recon`,
      "",
      specs[0].notes,
      "",
    ];
    writeFileSync(path.join(sourcesDocDir, `${id}.md`), lines.join("\n"));
  }
  // Recon report: line counts and the first entries of each text artifact.
  mkdirSync(derivedDir, { recursive: true });
  const report: Record<string, unknown> = { generator: "scripts/lexicon-etl.ts recon", language: lang, recordedAt: today, artifacts: {} };
  for (const spec of sourcesFor(lang)) {
    const file = path.join(dir, spec.artifactFilename);
    const idn = ids.get(spec.artifactFilename);
    if (!idn) {
      (report.artifacts as Record<string, unknown>)[spec.artifactFilename] = { status: "not-retrieved" };
      continue;
    }
    let lines = 0;
    const samples: string[] = [];
    if (!spec.artifactFilename.endsWith(".tar.gz")) {
      for await (const line of readLines(file)) {
        lines += 1;
        if (samples.length < 2 && line.length < 400) samples.push(line);
      }
    }
    (report.artifacts as Record<string, unknown>)[spec.artifactFilename] = { status: "retrieved", sha256: idn.sha256, bytes: idn.bytes, lines, samples };
  }
  writeFileSync(path.join(derivedDir, "recon.json"), canonicalJson(report));
  console.log(`wrote content/${lang}/lexicon/derived/recon.json and sources/*.md`);
}

async function extract(): Promise<void> {
  const manifest = loadManifest() ?? fail(`${manifestRel} is missing — run recon first (fail-closed)`);
  const ids = await identities();
  for (const s of manifest.sources) {
    const idn = ids.get(s.artifactFilename);
    if (s.retrieval.status !== "retrieved") continue;
    if (!idn) fail(`${s.artifactFilename} is pinned but absent from ${dir} — fetch it first`);
    if (idn.sha256 !== s.retrieval.sha256) fail(`${s.artifactFilename}: sha256 ${idn.sha256} ≠ pinned ${s.retrieval.sha256} — source-version drift, refusing to derive (re-pin deliberately with recon)`);
  }
  const result = await deriveLanguage({ lang, dir, manifest, log: (line) => console.log(`  ${line}`) });
  mkdirSync(derivedDir, { recursive: true });
  for (const [name, payload] of Object.entries(result.files)) {
    writeFileSync(path.join(derivedDir, name), canonicalJson(payload));
    console.log(`wrote content/${lang}/lexicon/derived/${name}`);
  }
  console.log(`summary: ${JSON.stringify(result.summary)}`);
}

if (command === "cache-key") console.log(cacheKey(lang, sourcesFor(lang).map((spec) => headMeta(spec.url))));
else if (command === "fetch") await fetchAll();
else if (command === "recon") await recon();
else await extract();
