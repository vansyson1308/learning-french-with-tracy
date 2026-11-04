/**
 * Korean verb paradigm (P4b stage 5, task 6): the cells a ko paradigm
 * table fills — the dictionary form, the polite informal 해요체 present /
 * past / future and the honorific present — and the written rules of the
 * regular groups (the plugin's group rules, scripts/lib/languages/ko.ts):
 *
 *  - present: the 아/어 form + 요, with the vowel contractions
 *    (가+아요 → 가요, 오+아요 → 와요, 주+어요 → 줘요, 마시+어요 → 마셔요,
 *    쓰+어요 → 써요, 되+어요 → 돼요); a final consonant keeps 아요/어요
 *    by vowel harmony (좋아요, 먹어요);
 *  - past: the 아/어 form + ㅆ어요 (갔어요, 먹었어요);
 *  - future: (으)ㄹ 거예요 (갈 거예요, 먹을 거예요, 살 거예요);
 *  - honorific present: (으)세요, a final ㄹ dropping (가세요, 읽으세요, 사세요);
 *  - 하다 verbs: 해요, 했어요, 할 거예요, 하세요.
 * Irregular verbs (ㅂ/ㄷ/ㅅ/르/ㅎ stems, 먹다 → 드세요 …) are group
 * "irregular": their tables are evidence-checked, never rule-generated.
 */

export const KO_PARADIGM_CELLS = ["inf", "haeyo:pre", "haeyo:pas", "haeyo:fut", "hon:pre"] as const;
export type KoCell = (typeof KO_PARADIGM_CELLS)[number];

export const KO_GROUPS = ["regular", "hada", "irregular"] as const;
export type KoGroup = (typeof KO_GROUPS)[number];

const BASE = 0xac00;
const V = { a: 0, ae: 1, ya: 2, eo: 4, e: 5, yeo: 6, o: 8, wa: 9, wae: 10, oe: 11, yo: 12, u: 13, wo: 14, eu: 18, i: 20 } as const;
const T_RIEUL = 8;
const T_SSANGSIOT = 20;

type Syl = { l: number; v: number; t: number };

function split(ch: string): Syl | null {
  const n = ch.charCodeAt(0) - BASE;
  if (n < 0 || n > 11171) return null;
  return { l: Math.floor(n / 588), v: Math.floor((n % 588) / 28), t: n % 28 };
}

function join({ l, v, t }: Syl): string {
  return String.fromCharCode(BASE + (l * 21 + v) * 28 + t);
}

/** Bright (yang) vowels take 아; every other vowel takes 어. */
const bright = (v: number) => v === V.a || v === V.ya || v === V.o || v === V.yo;

/** The 아/어 form of a stem (가, 와, 먹어, 마셔, 써, 해). */
export function koreanAeoForm(stem: string): string {
  if (stem.endsWith("하")) return `${stem.slice(0, -1)}해`;
  const head = stem.slice(0, -1);
  const last = split(stem.slice(-1));
  if (last === null) throw new Error(`not a hangul stem: ${stem}`);
  if (last.t !== 0) return `${stem}${bright(last.v) ? "아" : "어"}`;
  const withVowel = (v: number) => `${head}${join({ ...last, v })}`;
  switch (last.v) {
    case V.a:
    case V.eo:
    case V.ae:
    case V.e:
    case V.yeo:
      return stem; // 가 → 가, 서 → 서, 보내 → 보내
    case V.o:
      return withVowel(V.wa); // 오 → 와, 보 → 봐
    case V.u:
      return withVowel(V.wo); // 주 → 줘
    case V.i:
      return withVowel(V.yeo); // 마시 → 마셔
    case V.oe:
      return withVowel(V.wae); // 되 → 돼
    case V.eu: {
      // 쓰 → 써; after a bright syllable 바쁘 → 바빠
      const prev = head.length > 0 ? split(head.slice(-1)) : null;
      return withVowel(prev !== null && bright(prev.v) ? V.a : V.eo);
    }
    default:
      return `${stem}${bright(last.v) ? "아" : "어"}`;
  }
}

function withFinal(text: string, t: number): string {
  const last = split(text.slice(-1))!;
  return `${text.slice(0, -1)}${join({ ...last, t })}`;
}

/** Every cell of a regular or 하다 verb, or null for an irregular one / a non-verb. */
export function koreanParadigmCells(lemma: string, group: KoGroup): Record<KoCell, string> | null {
  if (group === "irregular" || !lemma.endsWith("다") || lemma.length < 2) return null;
  const stem = lemma.slice(0, -1);
  if (group === "hada" && !stem.endsWith("하")) return null;
  const last = split(stem.slice(-1));
  if (last === null) return null;
  const aeo = koreanAeoForm(stem);
  const future =
    last.t === 0 ? `${withFinal(stem, T_RIEUL)} 거예요` : last.t === T_RIEUL ? `${stem} 거예요` : `${stem}을 거예요`;
  const honorific = last.t === 0 ? `${stem}세요` : last.t === T_RIEUL ? `${withFinal(stem, 0)}세요` : `${stem}으세요`;
  return {
    inf: lemma,
    "haeyo:pre": `${aeo}요`,
    "haeyo:pas": `${withFinal(aeo, T_SSANGSIOT)}어요`,
    "haeyo:fut": future,
    "hon:pre": honorific,
  };
}

type EvidenceRow = { mot: string; infoVer: string };

/**
 * P4e: the 해요체 cells read from the kaikki conjugation table of one verb. The derivation tags a Korean row only
 * `inf`, `formal` or `informal` (the speech-level groups of the source table), so the cells are named here from
 * the table's own rows, never from the rules above:
 *  - haeyo:pre — an informal row that is an `inf` row (the 아/어 infinitive, 가 / 먹어 / 해) + 요;
 *  - haeyo:pas — an informal row that is that infinitive with ㅆ + 어요 (갔어요, 먹었어요, 했어요);
 *  - hon:pre — the informal row in 세요 (가세요, 먹으세요);
 *  - haeyo:fut — composed: the shortest formal row(s) closing on ㄹ (the prospective modifier 갈 / 먹을 / 살; the
 *    honorific 가실 is longer) + " 거예요". The source table states the modifier, not the phrase, so the row is
 *    marked `composed` too.
 * The tagged rows are added beside the source rows (which stay as they are); a verb whose table lacks a row gets no
 * row for that cell, so its paradigm table cannot validate (먹다: its honorific is 드세요, not in the table).
 */
export function tagKoreanCells(rows: EvidenceRow[]): EvidenceRow[] {
  const informal = new Set(rows.filter((r) => r.infoVer.split(",").includes("informal")).map((r) => r.mot));
  const inf = rows.filter((r) => r.infoVer.split(",").includes("inf") && !r.mot.endsWith("다")).map((r) => r.mot);
  const out: EvidenceRow[] = [];
  const add = (mot: string, cell: string) => {
    if (!out.some((r) => r.mot === mot && r.infoVer === cell)) out.push({ mot, infoVer: cell });
  };
  for (const a of inf) {
    if (informal.has(`${a}요`)) add(`${a}요`, "haeyo:pre");
    const last = split(a.slice(-1));
    if (last !== null && last.t === 0) {
      const past = `${withFinal(a, T_SSANGSIOT)}어요`;
      if (informal.has(past)) add(past, "haeyo:pas");
    }
  }
  for (const mot of informal) if (mot.endsWith("세요")) add(mot, "hon:pre");
  const prospective = rows
    .filter((r) => r.infoVer.split(",").includes("formal") && split(r.mot.slice(-1))?.t === T_RIEUL)
    .map((r) => r.mot)
    .sort((x, y) => x.length - y.length || (x < y ? -1 : x > y ? 1 : 0));
  // A page that merges two homographs (걷다 walk / roll up) states two modifiers of the same length: both are composed.
  for (const m of prospective.filter((x) => x.length === prospective[0]?.length)) add(`${m} 거예요`, "haeyo:fut,composed");
  return [...rows, ...out];
}

/** Group rules for authored paradigm tables: every cell of a regular / 하다 verb must be the rule's form. */
export function koreanGroupRules(table: { lemma: string; group: string; cells: Record<string, string> }, err: (m: string) => void): void {
  if (table.group !== "regular" && table.group !== "hada") return;
  const expected = koreanParadigmCells(table.lemma, table.group);
  if (expected === null) {
    err(`${table.lemma}: no ${table.group} rule conjugates it — check the group`);
    return;
  }
  for (const cell of KO_PARADIGM_CELLS) {
    const got = table.cells[cell];
    if (got !== undefined && got !== expected[cell]) err(`${table.lemma}: ${table.group} ${cell} must be "${expected[cell]}", got "${got}"`);
  }
}
