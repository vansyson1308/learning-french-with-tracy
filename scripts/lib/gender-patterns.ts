/**
 * Gender-pattern derivation (Phase 5B §51–53): turns the committed
 * population aggregates (derived/gender-suffix-stats.json — 36,940
 * gendered noun lemmas from the pinned Lexique 4 artifact) into the
 * TEACHABLE pattern list, with longest-distinctive-suffix logic so a
 * short ending's statistics are never contaminated by a longer, more
 * reliable ending it contains (the recorded "-on vs -ion" trap).
 *
 * Honesty rules (program §53):
 *  - reliability wording is derived, never asserted: "almost always"
 *    requires ≥ 99% within the pattern's own population; "usually" ≥ 90%;
 *    nothing below 90% is teachable;
 *  - a pattern needs real coverage (≥ 100 lemmas) — no boutique rules;
 *  - a shorter ending is judged on the words it actually describes: its
 *    pure remainder fixes the gender, differently-gendered longer endings
 *    stay subtracted (and reported), same-gendered ones are reabsorbed;
 *  - every reported pattern carries its raw numbers so the report and the
 *    concepts can show them.
 */

import type { GenderSuffixStats, SuffixAggregate } from "./lexique-derive-lib";

export type DerivedGenderPattern = {
  /** The suffix as taught (no leading dash in data; UI adds it). */
  suffix: string;
  gender: "masculine" | "feminine";
  /**
   * Reliability within the pattern's own population AFTER subtracting any
   * longer derived pattern that ends differently-gendered (subsumption).
   */
  reliabilityPct: number;
  lemmaCount: number;
  wording: "almost always" | "usually";
  /** Longer suffixes subtracted from this pattern's bucket, if any. */
  subtracted: string[];
};

export const PATTERN_MIN_COUNT = 100;
export const PATTERN_MIN_RELIABILITY = 90;
export const PATTERN_ALMOST_ALWAYS = 99;

function majority(agg: { m: number; f: number; total: number }): {
  gender: "masculine" | "feminine";
  pct: number;
} {
  // Épicène rows count toward the total (they genuinely weaken a claim
  // that "-X nouns are masculine") but toward neither gender.
  if (agg.m >= agg.f) return { gender: "masculine", pct: (100 * agg.m) / agg.total };
  return { gender: "feminine", pct: (100 * agg.f) / agg.total };
}

/**
 * Derives the teachable patterns from the researched-suffix aggregates.
 * Subsumption: for each candidate, any LONGER candidate suffix whose
 * ending contains it (e.g. "-ion" inside "-on", "-sion" inside "-ion")
 * and whose majority gender differs is subtracted from the shorter
 * bucket before reliability is computed — so "-on" is judged on the
 * non-"-ion" nouns it actually describes. Candidates that survive the
 * thresholds are reported longest-first within equal endings-groups and
 * alphabetically for determinism.
 */
export function deriveGenderPatterns(stats: GenderSuffixStats): DerivedGenderPattern[] {
  // Work over the union of researched suffixes and data-driven endings so
  // a strong pattern the researched list missed can still surface.
  const byEnding = new Map<string, SuffixAggregate>();
  for (const agg of [...stats.researchedSuffixes, ...stats.dataDrivenEndings]) {
    const existing = byEnding.get(agg.ending);
    // researchedSuffixes aggregate the same population; prefer the larger
    // sample when the same ending appears in both lists (they should
    // agree; defensive max keeps determinism if one list truncated).
    if (!existing || agg.total > existing.total) byEnding.set(agg.ending, agg);
  }

  const candidates = [...byEnding.values()].filter((a) => a.total >= PATTERN_MIN_COUNT);

  const derived: DerivedGenderPattern[] = [];
  for (const candidate of candidates) {
    const longer = candidates.filter(
      (other) => other.ending !== candidate.ending && other.ending.endsWith(candidate.ending)
    );
    // Judge the shorter ending on the words it actually describes. Step 1:
    // the PURE remainder (subtract every containment-maximal longer
    // candidate — maximality avoids double-subtraction along chains like
    // -tion ⊂ -ion) determines the ending's own gender: raw "-on" reads
    // feminine only through "-ion"; its remainder is masculine. Step 2:
    // longer endings whose own majority AGREES with that gender are
    // reabsorbed (they are the same rule — "-ie" stays one broad pattern,
    // not seven micro-rules), while DISAGREEING ones stay subtracted and
    // are reported.
    const maximalLonger = longer.filter(
      (l) => !longer.some((l2) => l2.ending !== l.ending && l.ending.endsWith(l2.ending))
    );
    const pure = { ...candidate };
    for (const other of maximalLonger) {
      pure.m -= other.m;
      pure.f -= other.f;
      pure.e -= other.e;
      pure.total -= other.total;
    }
    const ownGender = (pure.total >= 30 ? majority(pure) : majority(candidate)).gender;
    const subtractSet = maximalLonger.filter((l) => majority(l).gender !== ownGender);
    const adjusted = { ...candidate };
    for (const other of subtractSet) {
      adjusted.m -= other.m;
      adjusted.f -= other.f;
      adjusted.e -= other.e;
      adjusted.total -= other.total;
    }
    if (adjusted.total < PATTERN_MIN_COUNT) continue;
    const { gender, pct } = majority(adjusted);
    if (pct < PATTERN_MIN_RELIABILITY) continue;
    derived.push({
      suffix: candidate.ending,
      gender,
      reliabilityPct: Number(pct.toFixed(1)),
      lemmaCount: adjusted.total,
      wording: pct >= PATTERN_ALMOST_ALWAYS ? "almost always" : "usually",
      subtracted: subtractSet.map((o) => o.ending).sort(),
    });
  }

  // Drop a pattern fully explained by a longer, at-least-as-reliable one
  // with the SAME gender (e.g. don't teach both "-ion" and "-tion" and
  // "-sion" — the longest forms win; a shorter form survives only when it
  // is genuinely broader, i.e. covers ≥ 1.5× the lemmas of its longest
  // same-gender refinement).
  const kept = derived.filter((pattern) => {
    const refinements = derived.filter(
      (other) =>
        other.suffix !== pattern.suffix &&
        other.suffix.endsWith(pattern.suffix) &&
        other.gender === pattern.gender &&
        other.reliabilityPct >= pattern.reliabilityPct
    );
    if (refinements.length === 0) return true;
    const biggest = Math.max(...refinements.map((r) => r.lemmaCount));
    return pattern.lemmaCount >= biggest * 1.5;
  });

  return kept.sort(
    (a, b) =>
      b.reliabilityPct - a.reliabilityPct ||
      b.lemmaCount - a.lemmaCount ||
      a.suffix.localeCompare(b.suffix, "fr")
  );
}
