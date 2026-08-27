/**
 * Deterministic French number spelling, 0–100 (Phase 5B §75–80).
 *
 * System facts (standard French numeration; see
 * content/fr/pedagogy/RESEARCH.md §D): 17–19 compound with dix-; the tens
 * 20/30/40/50/60 take their unit with a hyphen EXCEPT 21/31/41/51/61,
 * which use "et un"; 70s are soixante-dix + the teens (71 = soixante et
 * onze — the one "et onze"); 80 is quatre-vingts with a final -s ONLY
 * when nothing follows (quatre-vingts but quatre-vingt-un — and no "et"
 * anywhere in the 80s/90s); 90s are quatre-vingt-dix + the teens; 100 is
 * cent.
 *
 * Orthography: the traditional spelling spaces around "et" (vingt et un);
 * the 1990 rectifications hyphenate throughout (vingt-et-un). BOTH are
 * official — this course DISPLAYS the traditional form and grading
 * accepts both (§77). France French is the default; septante/nonante are
 * a recognition note in the concept content, never a graded answer (§78).
 */

const UNITS = [
  "zéro",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
] as const;

const TENS: Record<number, string> = {
  20: "vingt",
  30: "trente",
  40: "quarante",
  50: "cinquante",
  60: "soixante",
};

export type FrenchNumberSpelling = {
  value: number;
  /** Traditional orthography (displayed): "vingt et un". */
  traditional: string;
  /** 1990 rectified orthography (accepted): "vingt-et-un". */
  rectified: string;
};

/** 0–16 and 17–19 as plain compounds (shared by the 10s and the 90s). */
function teenLike(n: number): string {
  if (n <= 16) return UNITS[n];
  return `dix-${UNITS[n - 10]}`;
}

/**
 * The traditional spelling of an integer 0–100. Throws on anything else —
 * the curriculum unit owns exactly this range.
 */
export function frenchNumber(value: number): FrenchNumberSpelling {
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new Error(`frenchNumber covers integers 0–100, got ${value}`);
  }
  let traditional: string;
  if (value <= 19) {
    traditional = teenLike(value);
  } else if (value === 100) {
    traditional = "cent";
  } else if (value >= 80) {
    // quatre-vingts keeps its plural -s only when bare (§ research D).
    const rest = value - 80;
    traditional = rest === 0 ? "quatre-vingts" : `quatre-vingt-${teenLike(rest)}`;
  } else if (value >= 60) {
    // 60–79 build on soixante: 61 takes "et un" like the other x1 tens,
    // and 71 is the lone "et onze".
    const rest = value - 60;
    if (rest === 0) traditional = "soixante";
    else if (rest === 1) traditional = "soixante et un";
    else if (rest === 11) traditional = "soixante et onze";
    else traditional = `soixante-${teenLike(rest)}`;
  } else {
    const ten = Math.floor(value / 10) * 10;
    const unit = value - ten;
    if (unit === 0) traditional = TENS[ten];
    else if (unit === 1) traditional = `${TENS[ten]} et un`;
    else traditional = `${TENS[ten]}-${UNITS[unit]}`;
  }
  return {
    value,
    traditional,
    rectified: traditional.replace(/ /g, "-"),
  };
}

/**
 * Every spelling grading should accept for the number: the traditional
 * form plus the rectified form when it differs. (Case/accents are the
 * grader's concern, not this module's.)
 */
export function acceptedNumberSpellings(value: number): string[] {
  const spelling = frenchNumber(value);
  return spelling.rectified === spelling.traditional
    ? [spelling.traditional]
    : [spelling.traditional, spelling.rectified];
}
