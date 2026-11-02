/**
 * Voice-cast speaker rule (QC 2026-10-21): the second cast voice B is a
 * different PERSON from A (de: thorsten-high + thorsten-medium were the same
 * reader), preferably of the other gender, and still passes the
 * intelligibility floor (mean WER/CER ≤ 0.6, no technical failure). Speaker
 * identity comes from the model card (Piper: voice name + dataset URL) or an
 * explicit `speaker` in content/audio/voice-casts.json; anything unknown is
 * treated as "maybe the same speaker" (fail-safe: no B rather than a fake pair).
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";

import { safeResolve } from "../lib/pipeline";
import { pickCast, piperCardFacts, sameSpeaker, speakerIdentity, type CastRow } from "../lib/tts/speaker";

const card = (rel: string) => readFileSync(safeResolve(`content/audio/model-cards/${rel}`), "utf8");
const piper = (id: string, speaker: number | null = null) => ({ id, engine: "piper" as const, speaker });
const row = (voiceId: string, meanWer: number, technicalFailures = 0): CastRow => ({ voiceId, clips: 24, meanWer, technicalFailures });

describe("speaker identity from model cards", () => {
  test("a Piper card yields the dataset URL and the speaker count", () => {
    const facts = piperCardFacts(card("de/de_DE-thorsten-high.MODEL_CARD.txt"));
    expect(facts.datasetUrl).toBe("github.com/thorstenmueller/thorsten-voice");
    expect(facts.speakers).toBe(1);
  });

  test("thorsten-high and thorsten-medium are the same speaker; kerstin is another", () => {
    const high = speakerIdentity(piper("de_DE-thorsten-high"), card("de/de_DE-thorsten-high.MODEL_CARD.txt"), { gender: "male" });
    const medium = speakerIdentity(piper("de_DE-thorsten-medium"), card("de/de_DE-thorsten-medium.MODEL_CARD.txt"), { gender: "male" });
    const kerstin = speakerIdentity(piper("de_DE-kerstin-low"), card("de/de_DE-kerstin-low.MODEL_CARD.txt"), { gender: "female" });
    expect(sameSpeaker(high, medium)).toBe(true);
    expect(sameSpeaker(high, kerstin)).toBe(false);
  });

  test("two voices trained on one shared corpus count as the same speaker unless voice-casts.json declares them apart", () => {
    const mailabs = "# Model card\n\n* Speakers: 1\n\n## Dataset\n\n* URL: https://www.caito.de/2019/01/03/the-m-ailabs-speech-dataset/\n* License: See URL\n";
    const eva = speakerIdentity(piper("de_DE-eva_k-x_low"), mailabs);
    const ramona = speakerIdentity(piper("de_DE-ramona-low"), mailabs);
    expect(sameSpeaker(eva, ramona)).toBe(true);
    const evaDeclared = speakerIdentity(piper("de_DE-eva_k-x_low"), mailabs, { speaker: "m-ailabs:eva_k" });
    const ramonaDeclared = speakerIdentity(piper("de_DE-ramona-low"), mailabs, { speaker: "m-ailabs:ramona_deininger" });
    expect(sameSpeaker(evaDeclared, ramonaDeclared)).toBe(false);
  });

  test("an unknown identity (no card, or an unpinned multi-speaker voice) is never paired", () => {
    const noCard = speakerIdentity(piper("xx_XX-a-medium"), null);
    expect(noCard.key).toBeNull();
    const multi = speakerIdentity(piper("es_ES-sharvard-medium"), "* Speakers: 2\n\n## Dataset\n\n* URL: https://example.org/sharvard\n");
    expect(multi.key).toBeNull();
    const other = speakerIdentity(piper("de_DE-kerstin-low"), card("de/de_DE-kerstin-low.MODEL_CARD.txt"));
    expect(sameSpeaker(noCard, other)).toBe(true);
    expect(sameSpeaker(multi, other)).toBe(true);
  });

  test("pinned speakers of one multi-speaker voice are different people; Kokoro voices carry their gender in the id", () => {
    const text = "* Speakers: 2\n\n## Dataset\n\n* URL: https://example.org/sharvard\n";
    expect(sameSpeaker(speakerIdentity(piper("es_ES-sharvard-medium", 0), text), speakerIdentity(piper("es_ES-sharvard-medium", 1), text))).toBe(false);
    const sara = speakerIdentity({ id: "kokoro-if_sara", engine: "kokoro", speaker: null }, null);
    const nicola = speakerIdentity({ id: "kokoro-im_nicola", engine: "kokoro", speaker: null }, null);
    expect(sara.gender).toBe("female");
    expect(nicola.gender).toBe("male");
    expect(sameSpeaker(sara, nicola)).toBe(false);
  });
});

describe("pickCast", () => {
  const ids = new Map(
    [
      speakerIdentity(piper("de_DE-thorsten-high"), card("de/de_DE-thorsten-high.MODEL_CARD.txt"), { gender: "male" }),
      speakerIdentity(piper("de_DE-thorsten-medium"), card("de/de_DE-thorsten-medium.MODEL_CARD.txt"), { gender: "male" }),
      speakerIdentity(piper("de_DE-kerstin-low"), card("de/de_DE-kerstin-low.MODEL_CARD.txt"), { gender: "female" }),
      speakerIdentity(piper("de_DE-mls-medium"), card("de/de_DE-mls-medium.MODEL_CARD.txt")),
    ].map((i) => [i.voiceId, i])
  );

  test("German: B skips the second Thorsten and takes kerstin-low (other person, other gender, WER ≤ 0.6)", () => {
    const cast = pickCast([row("de_DE-thorsten-high", 0.2298), row("de_DE-thorsten-medium", 0.2544), row("de_DE-kerstin-low", 0.4905), row("de_DE-mls-medium", 1.1964, 6)], ids);
    expect(cast.A?.voiceId).toBe("de_DE-thorsten-high");
    expect(cast.B?.voiceId).toBe("de_DE-kerstin-low");
    expect(cast.note).toContain("de_DE-thorsten-medium");
    expect(cast.note).toContain("same speaker");
  });

  test("B never exceeds the intelligibility floor or carries technical failures", () => {
    const cast = pickCast([row("de_DE-thorsten-high", 0.2298), row("de_DE-thorsten-medium", 0.2544), row("de_DE-kerstin-low", 0.61), row("de_DE-mls-medium", 0.3, 1)], ids);
    expect(cast.A?.voiceId).toBe("de_DE-thorsten-high");
    expect(cast.B).toBeNull();
    expect(cast.note).toMatch(/no second voice/);
  });

  test("a different-gender voice is preferred over a same-gender different person with a lower WER", () => {
    const local = new Map(ids);
    local.set("de_DE-other-medium", { voiceId: "de_DE-other-medium", key: "piper:other", datasetUrl: "example.org/other", gender: "male", basis: "test" });
    const cast = pickCast([row("de_DE-thorsten-high", 0.2), row("de_DE-other-medium", 0.25), row("de_DE-kerstin-low", 0.49)], local);
    expect(cast.B?.voiceId).toBe("de_DE-kerstin-low");
    const noFemale = pickCast([row("de_DE-thorsten-high", 0.2), row("de_DE-other-medium", 0.25)], local);
    expect(noFemale.B?.voiceId).toBe("de_DE-other-medium");
  });

  test("no A above the floor", () => {
    const cast = pickCast([row("de_DE-mls-medium", 0.9)], ids);
    expect(cast.A).toBeNull();
    expect(cast.B).toBeNull();
  });
});

describe("committed German cast", () => {
  test("voice-casts.json: de cast A and B are different speakers", () => {
    const casts = JSON.parse(readFileSync(safeResolve("content/audio/voice-casts.json"), "utf8")) as { languages: Record<string, { cast: { A: string | null; B: string | null } }> };
    expect(casts.languages.de.cast).toEqual({ A: "parler-de-nicole", B: "parler-de-christopher" });
  });
});
