/**
 * Voice-cast speaker identity (QC 2026-10-21).
 *
 * The cast {A, B} gives dialogues and variety two different PEOPLE. Two
 * Piper qualities of one reader (de_DE-thorsten-high / -medium) are one
 * person, so B must differ from A by speaker, preferably by gender, and
 * still pass the intelligibility floor.
 *
 * Identity sources, strongest first:
 *   1. an explicit `speaker` on the candidate in content/audio/voice-casts.json;
 *   2. Piper: the voice name (`de_DE-<name>-<quality>`) + pinned speaker id,
 *      with the model card's dataset URL as a cross-check (two voices of one
 *      corpus count as one speaker unless (1) declares them apart);
 *   3. Kokoro: the voice pack (`kokoro-<lang><f|m>_<name>`), gender from the id;
 *   4. MeloTTS: model + speaker key.
 * Unknown identity (no card, an unpinned multi-speaker voice) is treated as
 * "maybe the same speaker": fail-safe — no B rather than a fake pair.
 */
import type { EngineId } from "./types";

export type Gender = "female" | "male";

/** A candidate's hand-declared identity in voice-casts.json (verified against its card). */
export type DeclaredIdentity = { speaker?: string; gender?: Gender };

export type SpeakerIdentity = {
  voiceId: string;
  /** Stable person key; null = unknown (never paired). */
  key: string | null;
  /** Normalised dataset URL from the model card (Piper), when stated. */
  datasetUrl: string | null;
  gender: Gender | null;
  /** Where the key came from (recorded in the cast note). */
  basis: string;
};

export type CastRow = { voiceId: string; clips: number; meanWer: number; technicalFailures: number };

/** Mean WER/CER above which a voice is not intelligible enough to ship (P3b selection floor). */
export const CAST_MAX_WER = 0.6;

function normaliseUrl(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/#?]+$/, "");
}

/** Dataset URL and speaker count from a Piper MODEL_CARD. */
export function piperCardFacts(cardText: string): { datasetUrl: string | null; speakers: number | null } {
  const speakers = /^\s*\*\s*Speakers:\s*(\d+)/im.exec(cardText);
  const section = /^##\s*Dataset\s*$([\s\S]*?)(?=^##\s|$(?![\s\S]))/im.exec(cardText);
  const url = section ? /^\s*\*\s*URL:\s*(\S+)/im.exec(section[1]) : null;
  return { datasetUrl: url ? normaliseUrl(url[1]) : null, speakers: speakers ? Number(speakers[1]) : null };
}

export function speakerIdentity(
  voice: { id: string; engine: EngineId; speaker?: number | string | null },
  cardText: string | null,
  declared: DeclaredIdentity = {}
): SpeakerIdentity {
  const pinned = voice.speaker ?? null;
  let key: string | null = null;
  let datasetUrl: string | null = null;
  let gender: Gender | null = declared.gender ?? null;
  let basis = "unknown";

  if (voice.engine === "piper") {
    const facts = cardText ? piperCardFacts(cardText) : { datasetUrl: null, speakers: null };
    datasetUrl = facts.datasetUrl;
    const name = voice.id.split("-")[1] ?? voice.id;
    if (!cardText) basis = "no model card";
    else if (!facts.datasetUrl) basis = "model card states no dataset URL";
    else if ((facts.speakers ?? 1) > 1 && pinned === null) basis = `multi-speaker voice (${facts.speakers}) with no pinned speaker`;
    else {
      key = `piper:${name}${pinned !== null ? `#${pinned}` : ""}`;
      basis = `model card: voice ${name}${pinned !== null ? ` speaker ${pinned}` : ""}, dataset ${facts.datasetUrl}`;
    }
  } else if (voice.engine === "kokoro") {
    const m = /^kokoro-([a-z])([fm])_(.+)$/.exec(voice.id);
    if (m) {
      key = `kokoro:${m[1]}${m[2]}_${m[3]}`;
      gender = gender ?? (m[2] === "f" ? "female" : "male");
      basis = `Kokoro voice pack ${m[1]}${m[2]}_${m[3]}`;
    } else basis = "unrecognised Kokoro voice id";
  } else {
    key = `melotts:${voice.id}#${pinned ?? "default"}`;
    basis = `MeloTTS ${voice.id} speaker ${pinned ?? "default"}`;
  }

  if (declared.speaker) {
    key = `declared:${declared.speaker}`;
    basis = `voice-casts.json declares speaker ${declared.speaker}`;
  }
  return { voiceId: voice.id, key, datasetUrl, gender, basis };
}

/** True when the two voices may be the same person (unknown counts as "may be"). */
export function sameSpeaker(a: SpeakerIdentity, b: SpeakerIdentity): boolean {
  if (a.key === null || b.key === null) return true;
  if (a.key === b.key) return true;
  const declaredBoth = a.key.startsWith("declared:") && b.key.startsWith("declared:");
  if (declaredBoth) return false;
  // Pinned speakers of one multi-speaker voice are different people.
  if (a.voiceId === b.voiceId) return false;
  // One corpus, two voice names: assume one reader unless declared apart.
  if (a.datasetUrl !== null && a.datasetUrl === b.datasetUrl) return true;
  return false;
}

/**
 * The cast from canary rows already sorted best-first (technical failures,
 * then WER): A = the best row within the floor; B = the best other row that
 * is a different person, within the floor and free of technical failures,
 * preferring the other gender when both genders are known.
 */
export function pickCast(rows: CastRow[], ids: Map<string, SpeakerIdentity>, maxWer = CAST_MAX_WER): { A: CastRow | null; B: CastRow | null; note: string } {
  const A = rows[0] && rows[0].meanWer <= maxWer ? rows[0] : null;
  if (!A) return { A: null, B: null, note: rows[0] ? `no voice within the floor (best ${rows[0].voiceId} mean WER/CER ${rows[0].meanWer} > ${maxWer})` : "no canary rows" };
  const unknown = (voiceId: string): SpeakerIdentity => ({ voiceId, key: null, datasetUrl: null, gender: null, basis: "no identity" });
  const idA = ids.get(A.voiceId) ?? unknown(A.voiceId);
  const skipped: string[] = [];
  const eligible: { row: CastRow; id: SpeakerIdentity }[] = [];
  for (const r of rows.slice(1)) {
    const id = ids.get(r.voiceId) ?? unknown(r.voiceId);
    if (r.meanWer > maxWer) skipped.push(`${r.voiceId} (mean WER/CER ${r.meanWer} > ${maxWer})`);
    else if (r.technicalFailures > 0) skipped.push(`${r.voiceId} (${r.technicalFailures} technical failure(s))`);
    else if (sameSpeaker(idA, id)) skipped.push(`${r.voiceId} (same speaker as A or unverifiable: ${id.basis})`);
    else eligible.push({ row: r, id });
  }
  const otherGender = (id: SpeakerIdentity) => idA.gender !== null && id.gender !== null && id.gender !== idA.gender;
  const chosen = eligible.find((e) => otherGender(e.id)) ?? eligible[0] ?? null;
  const skippedText = skipped.length > 0 ? `; skipped ${skipped.join(", ")}` : "";
  if (!chosen) return { A, B: null, note: `A=${A.voiceId} (${idA.basis}); no second voice: no other candidate is a verified different speaker within the floor${skippedText}` };
  const genderText = otherGender(chosen.id) ? `other gender (${chosen.id.gender} vs ${idA.gender})` : `gender ${chosen.id.gender ?? "unknown"} (no other-gender candidate within the floor)`;
  return {
    A,
    B: chosen.row,
    note: `A=${A.voiceId} (${idA.basis}); B=${chosen.row.voiceId}: different speaker (${chosen.id.basis}), ${genderText}, mean WER/CER ${chosen.row.meanWer} ≤ ${maxWer}${skippedText}`,
  };
}
