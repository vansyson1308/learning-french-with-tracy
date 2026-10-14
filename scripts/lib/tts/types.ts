/**
 * Audio pipeline v2 (P3b) — the engine abstraction. One `TtsEngine` per
 * synthesis backend (Piper, Kokoro-82M, MeloTTS); the pipeline never calls
 * an engine directly from TypeScript: every engine renders deterministic
 * bash / Python job files so the dispatch-only workflow's run log shows the
 * exact recipe, and so the local `plan --dry-run` path stays offline.
 */

export type EngineId = "piper" | "kokoro" | "melotts";

/** A pinned file of a voice (downloaded twice at recon; hashes must agree). */
export type PinnedFile = { path: string; sha256: string | null; bytes: number | null };

/** The licence-relevant text of a voice: a Piper MODEL_CARD, or a model repository's card. */
export type LicenseCard = { text: string; source: string };

export type Voice = {
  id: string;
  engine: EngineId;
  language: string;
  note: string;
  /** Piper: model/config/modelCard; Kokoro: voiceFile (+ the shared model pinned by the engine); MeloTTS: checkpoint/config/card. */
  files: Record<string, PinnedFile>;
  /** Engine-specific selector: Piper speaker id, Kokoro voice name, MeloTTS speaker key. */
  speaker?: number | string | null;
  declaredDataset: string | null;
  declaredLicense: string | null;
  status: "candidate" | "eligible" | "excluded" | "selected";
  gateReason: string | null;
};

export type EnginesDoc = {
  version: number;
  engines: {
    piper: { package: string; pinnedVersion: string; voicesRepository: string; voicesRevision: string; install: string[]; sampleRateHz: number };
    kokoro: { package: string; pinnedVersion: string; g2pPackage: string; g2pPinnedVersion: string; modelRepository: string; modelRevision: string; modelFile: string; configFile: string; install: string[]; langCodes: Record<string, string>; sampleRateHz: number };
    melotts: { gitRepository: string; pinnedCommit: string; models: Record<string, { repository: string; revision: string | null; language: string; defaultSpeaker: string }>; install: string[]; sampleRateHz: number };
  };
  asr: {
    whisper: { package: string; pinnedVersion: string; models: { canary: string; generate: string } };
    sensevoice: { package: string; pinnedVersion: string; model: string; modelHub: string; languages: string[] };
  };
  licenseGate: { note: string; allow: string[]; deny: string[] };
  loudness: { integratedLufs: number; truePeakDb: number; loudnessRange: number };
  encoding: { sampleRateHz: number; channels: number; mp3Kbps: number };
};

/** One thing to download: an URL and the local name `<voiceId>.<kind>.<copy>`. */
export type DownloadItem = { voiceId: string; kind: string; url: string };

/** One clip segment to synthesise with a given voice. */
export type SynthJob = { voiceId: string; speaker: number | string | null; text: string; wavPath: string };

export interface TtsEngine {
  readonly id: EngineId;
  /** Bash lines that install the engine at its pinned version (idempotent). */
  install(engines: EnginesDoc): string[];
  /** Files to download for a voice (recon downloads each twice). */
  downloads(voice: Voice, engines: EnginesDoc): DownloadItem[];
  /** The licence-relevant text to gate, read from the downloaded files. */
  licenseCard(voice: Voice, downloadsDir: string): LicenseCard;
  /**
   * Bash lines that synthesise every job (grouped so a model is loaded once
   * per voice), writing one WAV per job at `job.wavPath`.
   */
  synthScript(jobs: SynthJob[], voicesById: Map<string, Voice>, downloadsDir: string, scratchDir: string, engines: EnginesDoc): string[];
}
