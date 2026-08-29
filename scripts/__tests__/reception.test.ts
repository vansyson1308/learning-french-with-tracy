/**
 * Reception audio census + orphan detection (P8 Gate 0). The three counts
 * are different concepts with precise names — authored clips, unique asset
 * keys, physical files — and the committed census must stay internally
 * consistent with the sources on every compile.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync, rmSync, writeFileSync } from "fs";

import { FR_LEXEME_IDS } from "../../src/lib/learning/ids-fr";
import { loadCourseObjectives } from "../lib/assessment";
import { safeResolve } from "../lib/pipeline";
import {
  RECEPTION_ASSETS_DIR,
  loadListening,
  loadReadings,
  validateReception,
} from "../lib/reception";


describe("audio census (P8 Gate 0)", () => {
  test("committed census is internally consistent and matches the sources", () => {
    const census = JSON.parse(
      readFileSync("content/reports/reception-audio-census.json", "utf8")
    ) as {
      authoredClipCount: number;
      uniqueAssetCount: number;
      physicalAssetCount: number;
      generationComplete: boolean;
      sharedAssetGroups: { assetKey: string; clipIds: string[] }[];
    };
    const listening = loadListening()!;
    expect(census.authoredClipCount).toBe(listening.clips.length);
    // Dedup arithmetic: every shared group of N clips removes N-1 assets.
    const removed = census.sharedAssetGroups.reduce((n, g) => n + g.clipIds.length - 1, 0);
    expect(census.uniqueAssetCount).toBe(census.authoredClipCount - removed);
    // Generation has run: files on disk equal the distinct keys exactly.
    expect(census.physicalAssetCount).toBe(census.uniqueAssetCount);
    expect(census.generationComplete).toBe(true);
    // The known deliberate shares: dictation clips reusing teaching text,
    // and P9 interaction lines whose identical wording recurs across
    // scenarios (same voice + same text = one deterministic asset).
    const sharedIds = census.sharedAssetGroups.flatMap((g) => g.clipIds).sort();
    expect(sharedIds).toEqual([
      "fr.clip.ix_a1cap_invitation_end",
      "fr.clip.ix_a1cap_julie_name_s",
      "fr.clip.ix_a1cap_telephone_end",
      "fr.clip.ix_a1cap_voisin_hello_s",
      "fr.clip.ix_cafe_boisson_end",
      "fr.clip.ix_cafe_boisson_thanks_s",
      "fr.clip.ix_cp_boulangerie_want_s",
      "fr.clip.ix_cp_cafe_end",
      "fr.clip.ix_cp_cafe_price_s",
      "fr.clip.ix_cp_projets_place_s",
      "fr.clip.ix_cp_rencontre_bye_s",
      "fr.clip.ix_cp_rencontre_how_s",
      "fr.clip.ix_cp_rencontre_name_s",
      "fr.clip.ix_magasin_courses_want_s",
      "fr.clip.ix_rendez_vous_place_s",
      "fr.clip.ix_salut_ca_va_bye_s",
      "fr.clip.pl_lait",
      "fr.clip.uf_dictee_lait",
      "fr.clip.uf_dictee_train",
      "fr.clip.uf_train",
    ]);
  });

  test("an orphan asset file fails validation (mutation)", () => {
    const orphan = safeResolve(RECEPTION_ASSETS_DIR, "deadbeefdeadbeefdead.mp3");
    writeFileSync(orphan, "not really audio");
    try {
      const result = validateReception({
        readings: loadReadings(),
        listening: loadListening(),
        objectives: loadCourseObjectives(),
        lexemeIds: new Set(Object.values(FR_LEXEME_IDS)),
      });
      expect(result.errors.join("\n")).toContain("orphan asset deadbeefdeadbeefdead.mp3");
    } finally {
      rmSync(orphan);
    }
  });
});
