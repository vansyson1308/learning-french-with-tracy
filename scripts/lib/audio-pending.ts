/**
 * Languages whose audio is still to be generated (QC 2026-10-29b §2.5).
 *
 * One audio run per language, but every run validates the WHOLE tree. When
 * two languages both await new audio, the first run would fail on the
 * other's missing files, and the second on the first's. The audio workflow
 * may therefore name the other pending languages (`inputs.pending` →
 * LFT_AUDIO_PENDING). Only missing-audio errors of THOSE languages are
 * demoted to warnings; every other error still fails. CI on a pull request
 * never sets it, so a PR stays red until every language's audio is in.
 */

const MISSING_AUDIO: readonly RegExp[] = [
  / audioTarget has no audio: /,
  /: generated asset \S+ missing — run /,
  /(^|: )orphan asset \S+: no authored clip resolves to it/,
  / story sentence assets missing /,
];

export function isMissingAudioError(message: string): boolean {
  return MISSING_AUDIO.some((r) => r.test(message));
}

/** The only place pending is legal: a manual dispatch of the audio workflow (QC 2026-10-29 evening §3). */
export const AUDIO_WORKFLOW_NAME = "Audio pipeline (v2)";

type CiEnv = { GITHUB_ACTIONS?: string; GITHUB_EVENT_NAME?: string; GITHUB_WORKFLOW?: string; [key: string]: string | undefined };

/**
 * Language codes from LFT_AUDIO_PENDING ("de" or "de,it"); invalid entries
 * are refused. On GitHub Actions a non-empty value outside a
 * workflow_dispatch of the audio workflow is an error, so a pull-request
 * CI run or a release / candidate build can never defer missing audio.
 */
export function pendingAudioLangs(value: string | undefined = process.env.LFT_AUDIO_PENDING, ci: CiEnv = process.env): Set<string> {
  const codes = (value ?? "").split(",").map((s) => s.trim()).filter((s) => s.length > 0);
  for (const c of codes) if (!/^[a-z]{2,3}$/.test(c)) throw new Error(`LFT_AUDIO_PENDING: "${c}" is not a language code`);
  if (codes.length > 0 && ci.GITHUB_ACTIONS === "true" && !(ci.GITHUB_EVENT_NAME === "workflow_dispatch" && ci.GITHUB_WORKFLOW === AUDIO_WORKFLOW_NAME)) {
    throw new Error(`LFT_AUDIO_PENDING is only allowed in a workflow_dispatch of "${AUDIO_WORKFLOW_NAME}" (got ${ci.GITHUB_EVENT_NAME ?? "?"} of "${ci.GITHUB_WORKFLOW ?? "?"}")`);
  }
  return new Set(codes);
}

/** The target language a course-level message names ("de-vi: …" → "de"), else null. */
export function courseLangOf(message: string): string | null {
  return /^([a-z]{2,3})-[a-z]{2,3}: /.exec(message)?.[1] ?? null;
}

/** Split errors into kept ones and demoted ones (missing audio of a pending language). */
export function demotePendingAudio(errors: readonly string[], langOf: (message: string) => string | null, pending: ReadonlySet<string>): { errors: string[]; demoted: string[] } {
  const kept: string[] = [];
  const demoted: string[] = [];
  for (const e of errors) {
    const lang = langOf(e);
    if (lang !== null && pending.has(lang) && isMissingAudioError(e)) demoted.push(e);
    else kept.push(e);
  }
  return { errors: kept, demoted };
}

/** A bundled audio file of a pending language (assets/audio/<lang>/ or <lang>-reception/): its orphans wait for that run. */
export function isPendingLanguageAsset(relPath: string, pending: ReadonlySet<string>): boolean {
  const m = /^assets\/audio\/([a-z]{2,3})(?:-reception)?\//.exec(relPath.replace(/\\/g, "/"));
  return m !== null && pending.has(m[1]);
}

/** CI guard (audio.yml dry run): pending never names the run's own language. */
if (import.meta.main) {
  const own = process.env.LANG_INPUT ?? "";
  const pending = pendingAudioLangs();
  if (pending.has(own)) {
    console.error(`LFT_AUDIO_PENDING must not include the run's own language (${own})`);
    process.exit(1);
  }
  console.log(`pending: ${[...pending].join(",") || "(none)"}`);
}
