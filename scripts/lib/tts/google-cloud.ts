/**
 * Google Cloud Text-to-Speech adapter — PREPARED, OFF (QC 2026-11-05 §2.2).
 *
 * The recommended clean route for bundled Korean audio (and pt-PT, D-12):
 * a commercial cloud TTS whose terms let the generated audio power an app.
 * Nothing here can run until the owner approves it. `googleTtsBlockers`
 * lists what stands in the way, and `synthesizeWithGoogle` refuses while
 * any blocker remains:
 *
 *   1. engines.json `engines["google-cloud-tts"].enabled` is false;
 *   2. its licence category `commercial-tts-output` is not on the licence
 *      allowlist (content/schema.ts LICENSE_ALLOWLIST) — the registry records
 *      it under `pendingApproval` (OWNER-FINAL-CHECKLIST B2);
 *   3. the API key is read ONLY from the environment variable the entry
 *      names (a CI secret of the dispatch-only audio workflow) — never from
 *      a file in the repository, never in a URL: it travels in the
 *      `X-Goog-Api-Key` header;
 *   4. a real run happens only on GitHub Actions (GITHUB_ACTIONS=true).
 *
 * The dry run (`planGoogleRequests`) needs no key and makes no request: it
 * prints what a run would send. Tests drive the synthesis with a mocked
 * HTTP client.
 */

import { ALLOWED_LICENSES } from "../../../content/schema";

export const GOOGLE_TTS_ENGINE_ID = "google-cloud-tts";
export const COMMERCIAL_TTS_CATEGORY = "commercial-tts-output";

export type GoogleVoice = { name: string; languageCode: string; ssmlGender: "FEMALE" | "MALE" };

/** The engines.json entry (content/audio/engines.json `engines["google-cloud-tts"]`). */
export type GoogleTtsEngineEntry = {
  enabled: boolean;
  license: string;
  licenceCategory: string;
  endpoint: string;
  keyEnv: string;
  audioEncoding: "LINEAR16";
  sampleRateHz: number;
  termsUrl: string;
  termsQuote: string;
  termsRetrievedAt: string;
  voiceListUrl: string;
  /** The A/B cast per language: two different voices (D-11 casts never share a voice). */
  voices: Record<string, { A: GoogleVoice; B: GoogleVoice; fallback?: { A: GoogleVoice; B: GoogleVoice } }>;
  note?: string;
};

export type GoogleJob = { text: string; speaker: "A" | "B"; wavPath: string };

export type HttpClient = (url: string, init: { method: "POST"; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

type Env = Readonly<Record<string, string | undefined>>;

/** Everything that keeps a real run from happening; empty = the owner approved and the secret is set. */
export function googleTtsBlockers(entry: GoogleTtsEngineEntry, env: Env, allowed: readonly string[] = ALLOWED_LICENSES): string[] {
  const out: string[] = [];
  if (entry.enabled !== true) out.push(`engines.json ${GOOGLE_TTS_ENGINE_ID}.enabled is false (owner approval pending: OWNER-FINAL-CHECKLIST B2)`);
  if (!allowed.includes(entry.licenceCategory)) out.push(`licence category "${entry.licenceCategory}" is pending owner approval — not on the allowlist (content/schema.ts)`);
  if (!/^[A-Z][A-Z0-9_]*$/.test(entry.keyEnv)) out.push(`keyEnv "${entry.keyEnv}" is not an environment variable name`);
  else if ((env[entry.keyEnv] ?? "").length === 0) out.push(`${entry.keyEnv} is not set (a CI secret of the audio workflow; never a file in the repository)`);
  if (env.GITHUB_ACTIONS !== "true") out.push("a Google synthesis run happens only on GitHub Actions (the dispatch-only audio workflow)");
  return out;
}

/** Problems of the entry itself (pure): the cast, the endpoint, the terms record. */
export function googleTtsEntryProblems(entry: GoogleTtsEngineEntry): string[] {
  const out: string[] = [];
  if (!entry.endpoint.startsWith("https://texttospeech.googleapis.com/")) out.push(`endpoint ${entry.endpoint} is not the Cloud Text-to-Speech API`);
  if (/[?&]key=/.test(entry.endpoint)) out.push("the endpoint must not carry the API key (it goes in the X-Goog-Api-Key header)");
  if (entry.termsQuote.split(/\s+/).filter(Boolean).length >= 15) out.push("termsQuote must stay under 15 words");
  if (!/^https:\/\//.test(entry.termsUrl)) out.push("termsUrl must be an https URL");
  for (const [lang, cast] of Object.entries(entry.voices)) {
    for (const c of [cast, ...(cast.fallback ? [cast.fallback] : [])]) {
      if (c.A.name === c.B.name) out.push(`${lang}: the A/B cast needs two different voices (${c.A.name})`);
      for (const v of [c.A, c.B]) if (!v.name.startsWith(`${v.languageCode}-`)) out.push(`${lang}: voice ${v.name} is not a ${v.languageCode} voice`);
    }
  }
  return out;
}

/** The request one segment needs. The key is passed in, used only in a header. */
export function googleSynthesisRequest(entry: GoogleTtsEngineEntry, voice: GoogleVoice, text: string, apiKey: string) {
  return {
    url: entry.endpoint,
    init: {
      method: "POST" as const,
      headers: { "Content-Type": "application/json; charset=utf-8", "X-Goog-Api-Key": apiKey },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: voice.languageCode, name: voice.name },
        audioConfig: { audioEncoding: entry.audioEncoding, sampleRateHertz: entry.sampleRateHz },
      }),
    },
  };
}

function castFor(entry: GoogleTtsEngineEntry, lang: string) {
  const cast = entry.voices[lang];
  if (!cast) throw new Error(`${GOOGLE_TTS_ENGINE_ID}: no voice cast for ${lang}`);
  return cast;
}

/** Dry run: what a run would send (voice, characters), with no key and no network. */
export function planGoogleRequests(entry: GoogleTtsEngineEntry, lang: string, jobs: readonly GoogleJob[]) {
  const cast = castFor(entry, lang);
  const rows = jobs.map((j) => ({ voice: cast[j.speaker].name, characters: [...j.text].length, wavPath: j.wavPath }));
  return { requests: rows.length, characters: rows.reduce((n, r) => n + r.characters, 0), rows };
}

/**
 * Synthesise every job (LINEAR16 → WAV bytes handed to `writeFile`). Refuses
 * while a blocker remains; a non-OK response or a response without audio
 * stops the run (no partial silence is ever written as a clip).
 */
export async function synthesizeWithGoogle(args: {
  entry: GoogleTtsEngineEntry;
  lang: string;
  jobs: readonly GoogleJob[];
  env: Env;
  http: HttpClient;
  writeFile: (path: string, bytes: Uint8Array) => void;
  allowed?: readonly string[];
}): Promise<{ written: number }> {
  const blockers = googleTtsBlockers(args.entry, args.env, args.allowed);
  if (blockers.length > 0) throw new Error(`${GOOGLE_TTS_ENGINE_ID} is off: ${blockers.join("; ")}`);
  const problems = googleTtsEntryProblems(args.entry);
  if (problems.length > 0) throw new Error(`${GOOGLE_TTS_ENGINE_ID}: ${problems.join("; ")}`);
  const key = args.env[args.entry.keyEnv]!;
  const cast = castFor(args.entry, args.lang);
  let written = 0;
  for (const job of args.jobs) {
    const { url, init } = googleSynthesisRequest(args.entry, cast[job.speaker], job.text, key);
    const res = await args.http(url, init);
    if (!res.ok) throw new Error(`${GOOGLE_TTS_ENGINE_ID}: HTTP ${res.status} for ${job.wavPath}`);
    const body = (await res.json()) as { audioContent?: unknown };
    if (typeof body.audioContent !== "string" || body.audioContent.length === 0) throw new Error(`${GOOGLE_TTS_ENGINE_ID}: no audioContent for ${job.wavPath}`);
    args.writeFile(job.wavPath, Uint8Array.from(Buffer.from(body.audioContent, "base64")));
    written += 1;
  }
  return { written };
}
