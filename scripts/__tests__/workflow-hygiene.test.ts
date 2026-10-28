/**
 * 2026-10-28 unstick: two ways a run could leave the loop waiting forever.
 *
 *  - A bot commit on a PR branch got no checks (its pull_request runs wait
 *    for a human approval), so bot-commit.sh dispatches CI itself.
 *  - A download that trickled bytes held the German lexicon ETL for 2 h 49 min,
 *    so every download goes through a bounded fetch and every job / network
 *    step carries `timeout-minutes`: a hang always ends as a failure.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

import { cacheKey, CURL_BOUNDS, SourceCache } from "../lib/lexicon-etl/fetch";

const ROOT = join(import.meta.dir, "..", "..");
const WF_DIR = join(ROOT, ".github/workflows");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

type Step = { name?: string; run?: string; uses?: string; env?: Record<string, string>; "timeout-minutes"?: number };
type Job = { "timeout-minutes"?: number; steps?: Step[]; uses?: string };
type Workflow = { on: Record<string, unknown>; permissions?: Record<string, string>; jobs: Record<string, Job> };

const workflows: [string, Workflow][] = readdirSync(WF_DIR)
  .filter((f) => f.endsWith(".yml"))
  .sort()
  .map((f) => [f, Bun.YAML.parse(readFileSync(join(WF_DIR, f), "utf8")) as Workflow]);

const steps = (wf: Workflow) => Object.values(wf.jobs).flatMap((j) => j.steps ?? []);

describe("every hang becomes a failure", () => {
  test("every job has timeout-minutes", () => {
    for (const [file, wf] of workflows) {
      for (const [id, job] of Object.entries(wf.jobs)) {
        if (job.uses) continue; // a reusable-workflow call carries its own limits
        expect(typeof job["timeout-minutes"], `${file} job ${id}`).toBe("number");
      }
    }
  });

  test("no raw curl download: every fetch goes through scripts/ci/fetch.sh", () => {
    for (const [file, wf] of workflows) {
      for (const step of steps(wf)) {
        for (const line of (step.run ?? "").split("\n")) {
          if (/\bcurl\s/.test(line)) expect(line, `${file}: ${step.name}`).toContain("localhost");
          if (/\bwget\s/.test(line)) throw new Error(`${file}: ${step.name} uses wget`);
        }
      }
    }
  });

  test("every network step (bounded fetch, ETL fetch, pip install) has its own timeout-minutes", () => {
    const network = /scripts\/ci\/fetch\.sh|lexicon-etl\.ts (fetch|cache-key)|pip install/;
    let seen = 0;
    for (const [file, wf] of workflows) {
      for (const step of steps(wf)) {
        if (!network.test(step.run ?? "")) continue;
        seen += 1;
        expect(typeof step["timeout-minutes"], `${file}: ${step.name}`).toBe("number");
        // A pure download step is bounded at 30 min; a step that also runs a model (ASR) is sized to its run.
        if (!/pip install/.test(step.run ?? "")) expect(step["timeout-minutes"]!, `${file}: ${step.name}`).toBeLessThanOrEqual(30);
      }
    }
    expect(seen).toBeGreaterThanOrEqual(6);
  });

  test("every Gradle build has a step timeout and bounded HTTP (read timeout + retries)", () => {
    let seen = 0;
    for (const [file, wf] of workflows) {
      const wfEnv = (wf as unknown as { env?: Record<string, string> }).env ?? {};
      for (const step of steps(wf)) {
        if (!/gradlew/.test(step.run ?? "")) continue;
        seen += 1;
        expect(typeof step["timeout-minutes"], `${file}: ${step.name}`).toBe("number");
        const opts = step.env?.GRADLE_OPTS ?? wfEnv.GRADLE_OPTS ?? "";
        expect(opts, `${file}: ${step.name}`).toContain("org.gradle.internal.http.socketTimeout=");
        expect(opts, `${file}: ${step.name}`).toContain("org.gradle.internal.repository.max.retries=");
      }
    }
    expect(seen).toBeGreaterThanOrEqual(4);
  });

  test("fetch.sh and the ETL downloader use the same curl bounds (50 kB/s floor for 120 s, 5 resuming retries)", () => {
    const sh = read("scripts/ci/fetch.sh");
    for (const flag of ["--fail", "--location", "--retry 5", "--retry-all-errors", "--connect-timeout 20", "--speed-time 120", "-C -", "while sleep 30"]) {
      expect(sh, flag).toContain(flag);
    }
    expect(sh).toContain('--speed-limit "${FETCH_SPEED_LIMIT:-50000}"');
    const ts = CURL_BOUNDS.join(" ");
    for (const flag of ["--fail", "--location", "--retry 5", "--retry-all-errors", "--connect-timeout 20", "--speed-limit 50000", "--speed-time 120", "-C -"]) {
      expect(ts, flag).toContain(flag);
    }
  });

  test.skipIf(process.platform === "win32")("fetch.sh downloads a file and leaves no .part behind", async () => {
    const dir = mkdtempSync(join(tmpdir(), "fetch-sh-"));
    const server = Bun.serve({ port: 0, fetch: () => new Response("x".repeat(100_000)) });
    try {
      const out = join(dir, "sub", "file.bin");
      // Async: a synchronous spawn would block the event loop serving the request.
      const proc = Bun.spawn(["bash", join(ROOT, "scripts/ci/fetch.sh"), `http://localhost:${server.port}/f`, out], { stdout: "ignore", stderr: "inherit" });
      expect(await proc.exited).toBe(0);
      expect(readFileSync(out, "utf8").length).toBe(100_000);
      expect(readdirSync(join(dir, "sub"))).toEqual(["file.bin"]);
    } finally {
      server.stop(true);
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("bot commits start their own checks", () => {
  const callers = workflows.filter(([, wf]) => steps(wf).some((s) => (s.run ?? "").includes("scripts/ci/bot-commit.sh")));

  test("bot-commit.sh dispatches ci.yml and device-acceptance.yml after a successful push", () => {
    const sh = read("scripts/ci/bot-commit.sh");
    expect(sh).toContain("for wf in ci.yml device-acceptance.yml");
    expect(sh).toContain('gh workflow run "$wf" --ref "$BRANCH"');
    const pushed = sh.indexOf('echo "bot-commit: pushed');
    expect(pushed).toBeGreaterThan(0);
    expect(sh.indexOf("dispatch_checks", pushed)).toBeGreaterThan(pushed);
  });

  test("the dispatched workflows accept workflow_dispatch", () => {
    for (const file of ["ci.yml", "device-acceptance.yml"]) {
      const wf = workflows.find(([f]) => f === file)![1];
      expect(Object.keys(wf.on), file).toContain("workflow_dispatch");
    }
  });

  test("every workflow that commits through bot-commit.sh grants actions: write and passes GH_TOKEN", () => {
    expect(callers.map(([f]) => f).sort()).toEqual(["audio.yml", "eas-build.yml", "lexicon-source.yml", "lexique-source.yml"]);
    for (const [file, wf] of callers) {
      expect(wf.permissions?.actions, file).toBe("write");
      for (const step of steps(wf).filter((s) => (s.run ?? "").includes("scripts/ci/bot-commit.sh"))) {
        expect(step.env?.GH_TOKEN, `${file}: ${step.name}`).toBe("${{ github.token }}");
      }
    }
  });
});

describe("lexicon source cache", () => {
  const meta = { url: "https://example.org/a.jsonl", etag: '"abc"', lastModified: "Tue, 27 Oct 2026 10:00:00 GMT" };

  test("the cache key changes with any URL or validator and is stable otherwise", () => {
    const a = cacheKey("de", [meta]);
    expect(a).toMatch(/^lexicon-src-de-[0-9a-f]{16}$/);
    expect(cacheKey("de", [meta])).toBe(a);
    expect(cacheKey("de", [{ ...meta, etag: '"abd"' }])).not.toBe(a);
    expect(cacheKey("de", [{ ...meta, url: "https://example.org/b.jsonl" }])).not.toBe(a);
  });

  test("a cached retrieval is fresh only for the same URL with an unchanged ETag or Last-Modified", () => {
    const dir = mkdtempSync(join(tmpdir(), "src-cache-"));
    try {
      const raw = join(dir, "dump.jsonl");
      writeFileSync(raw, "{}\n");
      const cache = new SourceCache(join(dir, "cache"));
      cache.put("a.jsonl", raw, { ...meta, sha256: "s", bytes: 3, retrievedAt: "2026-10-27", artifactSha256: null });
      cache.setArtifactSha256("a.jsonl", "t");
      expect(cache.get("a.jsonl")?.meta.artifactSha256).toBe("t");
      expect(readFileSync(cache.get("a.jsonl")!.raw, "utf8")).toBe("{}\n");
      expect(cache.fresh("a.jsonl", meta)).not.toBeNull();
      expect(cache.fresh("a.jsonl", { ...meta, lastModified: null })).not.toBeNull();
      expect(cache.fresh("a.jsonl", { ...meta, etag: '"new"', lastModified: "Wed, 28 Oct 2026 10:00:00 GMT" })).toBeNull();
      expect(cache.fresh("a.jsonl", { url: meta.url, etag: null, lastModified: null })).toBeNull();
      expect(cache.fresh("a.jsonl", { ...meta, url: "https://example.org/other" })).toBeNull();
      expect(new SourceCache(null).get("a.jsonl")).toBeNull();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
