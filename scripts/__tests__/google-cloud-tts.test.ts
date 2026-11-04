/**
 * QC 2026-11-05 §2.2: the Google Cloud Text-to-Speech adapter is prepared
 * but OFF. The committed engine entry is disabled, its licence category is
 * pending owner approval (never on the allowlist, so no registry source can
 * use it), the key comes only from a CI secret and travels in a header, and
 * a dry run with a mocked HTTP client shows exactly what a run would send.
 */
import { describe, expect, test } from "bun:test";

import { ALLOWED_LICENSES, PENDING_LICENCE_CATEGORIES, SourceRegistrySchema } from "../../content/schema";
import { loadRegistry, pendingApprovalErrors, readJson, validateRegistry } from "../lib/pipeline";
import {
  COMMERCIAL_TTS_CATEGORY,
  GOOGLE_TTS_ENGINE_ID,
  googleSynthesisRequest,
  googleTtsBlockers,
  googleTtsEntryProblems,
  planGoogleRequests,
  synthesizeWithGoogle,
  type GoogleTtsEngineEntry,
  type HttpClient,
} from "../lib/tts/google-cloud";

const engines = readJson("content/audio/engines.json") as { engines: Record<string, unknown> };
const entry = engines.engines[GOOGLE_TTS_ENGINE_ID] as GoogleTtsEngineEntry;
const CI = { GITHUB_ACTIONS: "true", GOOGLE_CLOUD_TTS_API_KEY: "test-key-not-real" };
const JOBS = [
  { text: "안녕하세요.", speaker: "A" as const, wavPath: "/tmp/a.wav" },
  { text: "네, 안녕하세요.", speaker: "B" as const, wavPath: "/tmp/b.wav" },
];

function mockHttp(): { http: HttpClient; calls: { url: string; headers: Record<string, string>; body: unknown }[] } {
  const calls: { url: string; headers: Record<string, string>; body: unknown }[] = [];
  const http: HttpClient = async (url, init) => {
    calls.push({ url, headers: init.headers, body: JSON.parse(init.body) });
    return { ok: true, status: 200, json: async () => ({ audioContent: Buffer.from("RIFF....WAVE").toString("base64") }) };
  };
  return { http, calls };
}

describe("the committed state: prepared, off", () => {
  test("engine entry disabled, licence category pending, entry itself sound", () => {
    expect(entry.enabled).toBe(false);
    expect(entry.licenceCategory).toBe(COMMERCIAL_TTS_CATEGORY);
    expect(PENDING_LICENCE_CATEGORIES).toContain(COMMERCIAL_TTS_CATEGORY);
    expect(ALLOWED_LICENSES).not.toContain(COMMERCIAL_TTS_CATEGORY);
    expect(googleTtsEntryProblems(entry)).toEqual([]);
  });

  test("two different Korean voices for the A/B cast, from the official list", () => {
    expect(entry.voices.ko.A.name).toBe("ko-KR-Neural2-A");
    expect(entry.voices.ko.B.name).toBe("ko-KR-Neural2-C");
    expect(entry.voices.ko.A.ssmlGender).not.toBe(entry.voices.ko.B.ssmlGender);
  });

  test("the key is read from an environment variable only; no key appears in the repository's entry", () => {
    expect(entry.keyEnv).toBe("GOOGLE_CLOUD_TTS_API_KEY");
    expect(JSON.stringify(entry)).not.toMatch(/AIza[0-9A-Za-z_-]{20,}/);
    expect(entry.endpoint).not.toContain("key=");
  });

  test("blocked as committed, even on CI with a secret: disabled + pending category", () => {
    const reasons = googleTtsBlockers(entry, CI);
    expect(reasons.join("\n")).toContain("enabled is false");
    expect(reasons.join("\n")).toContain('"commercial-tts-output" is pending owner approval');
    expect(reasons).toHaveLength(2);
  });

  test("locally, without the secret, every gate says so", () => {
    expect(googleTtsBlockers({ ...entry, enabled: true }, {}, [...ALLOWED_LICENSES, COMMERCIAL_TTS_CATEGORY])).toEqual([
      "GOOGLE_CLOUD_TTS_API_KEY is not set (a CI secret of the audio workflow; never a file in the repository)",
      "a Google synthesis run happens only on GitHub Actions (the dispatch-only audio workflow)",
    ]);
  });

  test("synthesis refuses while blocked and never calls the network", async () => {
    const { http, calls } = mockHttp();
    await expect(synthesizeWithGoogle({ entry, lang: "ko", jobs: JOBS, env: CI, http, writeFile: () => {} })).rejects.toThrow("google-cloud-tts is off");
    expect(calls).toEqual([]);
  });
});

describe("the registry: recorded, never usable", () => {
  test("google-cloud-tts is pending approval with its terms quote and URL, and the registry validates", () => {
    const registry = loadRegistry();
    const pending = registry.pendingApproval?.find((p) => p.id === "google-cloud-tts");
    expect(pending?.licenceCategory).toBe(COMMERCIAL_TTS_CATEGORY);
    expect(pending?.termsUrl).toBe(entry.termsUrl);
    expect(pending?.termsQuote).toBe(entry.termsQuote);
    expect(registry.sources.some((s) => s.id === "google-cloud-tts")).toBe(false);
    expect(validateRegistry().errors).toEqual([]);
  });

  test("a source under the pending category fails the schema (not allowlisted)", () => {
    const registry = readJson("content/sources/registry.json") as { sources: Record<string, unknown>[] };
    const bad = { ...registry, sources: [...registry.sources, { ...registry.sources[0], id: "google-cloud-tts-ko", license: COMMERCIAL_TTS_CATEGORY }] };
    expect(SourceRegistrySchema.safeParse(bad).success).toBe(false);
  });

  test("once the category were allowlisted, the pending entry must move to sources", () => {
    const registry = loadRegistry();
    expect(pendingApprovalErrors(registry)).toEqual([]);
    expect(pendingApprovalErrors(registry, [...ALLOWED_LICENSES, COMMERCIAL_TTS_CATEGORY]).join()).toContain("move it to \"sources\"");
  });
});

describe("dry run with a mocked HTTP client (what an approved run would send)", () => {
  const approved = { ...entry, enabled: true };
  const allowed = [...ALLOWED_LICENSES, COMMERCIAL_TTS_CATEGORY];

  test("the plan needs no key and makes no request", () => {
    expect(planGoogleRequests(entry, "ko", JOBS)).toEqual({
      requests: 2,
      characters: 15,
      rows: [
        { voice: "ko-KR-Neural2-A", characters: 6, wavPath: "/tmp/a.wav" },
        { voice: "ko-KR-Neural2-C", characters: 9, wavPath: "/tmp/b.wav" },
      ],
    });
  });

  test("one POST per segment, the key in the X-Goog-Api-Key header only, LINEAR16 24 kHz", async () => {
    const { http, calls } = mockHttp();
    const written: string[] = [];
    const out = await synthesizeWithGoogle({ entry: approved, lang: "ko", jobs: JOBS, env: CI, http, allowed, writeFile: (p) => written.push(p) });
    expect(out).toEqual({ written: 2 });
    expect(written).toEqual(["/tmp/a.wav", "/tmp/b.wav"]);
    expect(calls.map((c) => c.url)).toEqual([entry.endpoint, entry.endpoint]);
    for (const c of calls) {
      expect(c.url).not.toContain("test-key-not-real");
      expect(c.headers["X-Goog-Api-Key"]).toBe("test-key-not-real");
    }
    expect(calls[1]!.body).toEqual({
      input: { text: "네, 안녕하세요." },
      voice: { languageCode: "ko-KR", name: "ko-KR-Neural2-C" },
      audioConfig: { audioEncoding: "LINEAR16", sampleRateHertz: 24000 },
    });
  });

  test("an HTTP error or an empty response stops the run", async () => {
    const failing: HttpClient = async () => ({ ok: false, status: 403, json: async () => ({}) });
    await expect(synthesizeWithGoogle({ entry: approved, lang: "ko", jobs: JOBS, env: CI, http: failing, allowed, writeFile: () => {} })).rejects.toThrow("HTTP 403");
    const empty: HttpClient = async () => ({ ok: true, status: 200, json: async () => ({}) });
    await expect(synthesizeWithGoogle({ entry: approved, lang: "ko", jobs: JOBS, env: CI, http: empty, allowed, writeFile: () => {} })).rejects.toThrow("no audioContent");
  });

  test("a request never puts the key in the URL", () => {
    const r = googleSynthesisRequest(entry, entry.voices.ko.A, "물", "k-123");
    expect(r.url).toBe("https://texttospeech.googleapis.com/v1/text:synthesize");
    expect(r.init.headers["X-Goog-Api-Key"]).toBe("k-123");
  });

  test("the entry check catches a shared voice and a long quote", () => {
    const same = { ...entry, voices: { ko: { A: entry.voices.ko.A, B: entry.voices.ko.A } }, termsQuote: "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen" };
    const problems = googleTtsEntryProblems(same).join("\n");
    expect(problems).toContain("two different voices");
    expect(problems).toContain("under 15 words");
  });
});
