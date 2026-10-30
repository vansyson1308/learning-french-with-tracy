/**
 * Voice lineage gate (D-11, QC 2026-10-31). The licence gate reads a voice's own
 * dataset; a finetuned voice also inherits from its parent checkpoint. A voice
 * ships only when every link, from the voice back to the first checkpoint, is on
 * the allowlist. An unknown link fails. An author's published statement counts
 * as a link (Kokoro-82M: record the quote and URL).
 */
import { ALLOWED_LICENSES } from "../../content/schema";

import type { GateVerdict } from "./piper-audio";

export type LineageLink = { model: string; dataset: string; licence: string; url: string; quote?: string };
export type VoiceSource = { id: string; kind: string; lineage?: LineageLink[] };
export type PiperTraining = { kind: "scratch" } | { kind: "finetuned"; base: string } | { kind: "unknown"; line: string | null };

/** The `## Training` statement of a Piper MODEL_CARD. */
export function parsePiperTraining(cardText: string): PiperTraining {
  const line = /^##\s*Training\s*\n+(.+)$/im.exec(cardText)?.[1]?.trim() ?? null;
  if (line === null) return { kind: "unknown", line };
  if (/^trained from scratch/i.test(line)) return { kind: "scratch" };
  const base = /^fine-?tuned from (?:.*?\s)?(\w+) voice/i.exec(line)?.[1];
  return base ? { kind: "finetuned", base: base.toLowerCase() } : { kind: "unknown", line };
}

/** A Piper voice passes only when its card says it was trained from scratch. */
export function piperLineageVerdict(cardText: string): GateVerdict {
  const t = parsePiperTraining(cardText);
  if (t.kind === "scratch") return { ok: true, matched: "trained from scratch", reason: null };
  if (t.kind === "finetuned") return { ok: false, matched: null, reason: `finetuned from ${t.base}: its dataset is not on the allowlist or not verified` };
  return { ok: false, matched: null, reason: `model card states no training lineage (saw: ${t.line ?? "nothing"})` };
}

const badLinks = (links: LineageLink[]) => links.filter((l) => !ALLOWED_LICENSES.includes(l.licence));

/** Kokoro and MeloTTS voices share their engine's model: the lineage is declared per engine in content/audio/engines.json. */
export function engineLineageVerdict(engine: string, links: LineageLink[] | undefined): GateVerdict {
  if (!links || links.length === 0) return { ok: false, matched: null, reason: `${engine}: no declared lineage` };
  const bad = badLinks(links);
  if (bad.length > 0) return { ok: false, matched: null, reason: `${engine}: lineage link ${bad[0].model} / ${bad[0].dataset} has licence "${bad[0].licence}"` };
  return { ok: true, matched: "declared lineage", reason: null };
}

export type ManifestVoice = { id: string; engine?: string; language: string; status: string; files: Record<string, { path: string }> };

/** A manifest voice's registry entry (Piper qualities of one dataset share one entry). */
export function registryIdFor(voice: ManifestVoice): string {
  if ((voice.engine ?? "piper") === "piper") return `piper-voice-${voice.files.model.path.split("/")[2]}`;
  if (voice.engine === "kokoro") return `kokoro-voice-${voice.id.replace(/^kokoro-/, "")}`;
  return `melotts-${voice.language}`;
}

/** A selected voice must have a registry entry, so it cannot skip the lineage check. */
export function selectedVoiceErrors(selected: ManifestVoice[], sources: VoiceSource[]): string[] {
  const ids = new Set(sources.map((s) => s.id));
  return [...new Set(selected.map(registryIdFor))].filter((id) => !ids.has(id)).map((id) => `registry: selected voice ${id} has no registry entry`);
}

const isVoice = (s: VoiceSource) => s.kind.startsWith("neural TTS voice");

/** Registry check: every voice source carries a lineage and every link is allowlisted. */
export function lineageErrors(sources: VoiceSource[]): string[] {
  const errors: string[] = [];
  for (const s of sources.filter(isVoice)) {
    if (!s.lineage || s.lineage.length === 0) {
      errors.push(`registry: voice ${s.id} has no lineage (D-11: every link back to the first checkpoint)`);
      continue;
    }
    for (const l of badLinks(s.lineage)) errors.push(`registry: voice ${s.id}: lineage link ${l.model} / ${l.dataset} has licence "${l.licence}", not on the allowlist`);
  }
  return errors;
}
