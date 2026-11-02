/**
 * P4b stage 2 (QC 2026-11-03 §2): the Unihan character data behind the
 * Hán-Việt readings. Pure parsing and derivation; the developer-side CLI
 * (scripts/hanviet-unihan.ts) feeds it the pinned Unihan.zip and writes
 * content/hanviet/unihan-readings.json. Only that DERIVED data file is
 * committed (Unicode-3.0, data files only — scripts/lib/licence-scope.ts);
 * the zip never is. CI reads the committed file offline.
 *
 * Kept per character (when Unihan has it): kVietnamese, kMandarin,
 * kJapanese (on'yomi in katakana, kun'yomi in hiragana — the kana form the
 * on'yomi check needs), kJapaneseOn, kJapaneseKun, kHangul (source codes
 * after ":" dropped), and `variants`: the one-hop union of
 * kTraditionalVariant, kSimplifiedVariant, kSemanticVariant and kZVariant
 * (source tags after "<" dropped), plus both directions of the
 * kJinmeiyoKanji `YEAR:U+XXXX` links (a kyūjitai and its Jōyō shinjitai,
 * e.g. 氣 ↔ 気, 樂 ↔ 楽 — 230 pairs; Unihan_Variants.txt links almost no
 * shinjitai to its traditional form). kSpecializedSemanticVariant and
 * kSpoofingVariant are NOT used: they are context-bound or not variants at
 * all, and folding through them would confirm readings that do not apply.
 */
import { z } from "zod";

export const UNIHAN_READING_FIELDS = ["kVietnamese", "kMandarin", "kJapanese", "kJapaneseOn", "kJapaneseKun", "kHangul"] as const;
export type UnihanReadingField = (typeof UNIHAN_READING_FIELDS)[number];
export const UNIHAN_VARIANT_FIELDS = ["kTraditionalVariant", "kSimplifiedVariant", "kSemanticVariant", "kZVariant"] as const;

export const UNIHAN_READINGS_REL = "content/hanviet/unihan-readings.json";
export const UNIHAN_MANIFEST_REL = "content/hanviet/source-manifest.json";

export const UnihanManifestSchema = z.strictObject({
  version: z.literal(1),
  generator: z.literal("scripts/hanviet-unihan.ts"),
  source: z.strictObject({
    id: z.literal("unihan"),
    name: z.string().min(1),
    license: z.literal("Unicode-3.0"),
    unicodeVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    url: z.string().regex(/^https:\/\//),
    retrievedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sha256: z.string().regex(/^[0-9a-f]{64}$/),
    bytes: z.number().int().positive(),
    files: z.array(z.string().min(1)).min(1),
  }),
  charSet: z.string().min(10),
});
export type UnihanManifest = z.infer<typeof UnihanManifestSchema>;

const CharEntrySchema = z.strictObject({
  kVietnamese: z.string().min(1).optional(),
  kMandarin: z.string().min(1).optional(),
  kJapanese: z.string().min(1).optional(),
  kJapaneseOn: z.string().min(1).optional(),
  kJapaneseKun: z.string().min(1).optional(),
  kHangul: z.string().min(1).optional(),
  variants: z.string().min(1).optional(),
});
export type UnihanChar = z.infer<typeof CharEntrySchema>;

export const UnihanReadingsSchema = z.strictObject({
  generator: z.literal("scripts/hanviet-unihan.ts"),
  source: z.strictObject({ url: z.string().regex(/^https:\/\//), sha256: z.string().regex(/^[0-9a-f]{64}$/), unicodeVersion: z.string() }),
  fields: z.array(z.string()),
  variantFields: z.array(z.string()),
  chars: z.record(z.string(), CharEntrySchema),
});
export type UnihanReadings = z.infer<typeof UnihanReadingsSchema>;

/** `U+5B66\tkMandarin\txué` lines → char → field → raw value (comments and blank lines skipped). */
export function parseUnihanText(text: string, wanted: ReadonlySet<string>): Map<string, Map<string, string>> {
  const out = new Map<string, Map<string, string>>();
  for (const line of text.split(/\r?\n/)) {
    if (line.length === 0 || line.startsWith("#")) continue;
    const [cp, field, value] = line.split("\t");
    if (!cp?.startsWith("U+") || field === undefined || value === undefined || !wanted.has(field)) continue;
    const ch = String.fromCodePoint(parseInt(cp.slice(2), 16));
    let row = out.get(ch);
    if (!row) out.set(ch, (row = new Map()));
    row.set(field, value);
  }
  return out;
}

/** `U+5B78<kLau,kMatthews U+6588` → ["學", "斈"]. */
function variantChars(raw: string): string[] {
  return raw
    .split(/\s+/)
    .filter((t) => t.startsWith("U+"))
    .map((t) => String.fromCodePoint(parseInt(t.split("<")[0]!.slice(2), 16)));
}

/** `학:0E 항:0N` → `학 항`. */
function stripHangulSources(raw: string): string {
  return raw
    .split(/\s+/)
    .map((t) => t.split(":")[0])
    .filter((t): t is string => t !== undefined && t.length > 0)
    .join(" ");
}

/**
 * kJinmeiyoKanji `2010:U+6C17` on 氣 → the pair [氣, 気] (kyūjitai, Jōyō
 * shinjitai). Values that are only a year carry no link.
 */
export function jinmeiyoLinks(otherMappings: Map<string, Map<string, string>>): [string, string][] {
  const out: [string, string][] = [];
  for (const [ch, row] of otherMappings) {
    for (const tok of (row.get("kJinmeiyoKanji") ?? "").split(/\s+/)) {
      const m = /:U\+([0-9A-F]+)$/.exec(tok);
      if (m) out.push([ch, String.fromCodePoint(parseInt(m[1]!, 16))]);
    }
  }
  return out;
}

/**
 * Variant graph: char → one-hop variants (sorted, unique, self excluded)
 * from the four variant fields and the kJinmeiyoKanji links (both ways).
 */
export function buildVariantGraph(variants: Map<string, Map<string, string>>, links: readonly [string, string][]): Map<string, string[]> {
  const sets = new Map<string, Set<string>>();
  const add = (a: string, b: string) => {
    if (a === b) return;
    let s = sets.get(a);
    if (!s) sets.set(a, (s = new Set()));
    s.add(b);
  };
  for (const [ch, row] of variants) for (const f of UNIHAN_VARIANT_FIELDS) for (const v of variantChars(row.get(f) ?? "")) add(ch, v);
  for (const [a, b] of links) {
    add(a, b);
    add(b, a);
  }
  return new Map([...sets].map(([c, s]) => [c, [...s].sort(codePointCompare)]));
}

export function codePointCompare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * The derived document: every requested character plus its one-hop
 * variants, each with the reading fields Unihan has for it. Deterministic
 * (characters in code-point order, fields in UNIHAN_READING_FIELDS order).
 */
export function deriveUnihanReadings(input: {
  readings: Map<string, Map<string, string>>;
  /** buildVariantGraph(...) */
  graph: Map<string, string[]>;
  chars: Iterable<string>;
  manifest: UnihanManifest;
}): UnihanReadings {
  const all = new Set<string>();
  for (const c of input.chars) {
    all.add(c);
    for (const v of input.graph.get(c) ?? []) all.add(v);
  }
  const chars: Record<string, UnihanChar> = {};
  for (const c of [...all].sort(codePointCompare)) {
    const row = input.readings.get(c);
    const entry: Record<string, string> = {};
    for (const f of UNIHAN_READING_FIELDS) {
      const raw = row?.get(f);
      if (raw === undefined) continue;
      entry[f] = f === "kHangul" ? stripHangulSources(raw) : raw.trim().replace(/\s+/g, " ");
    }
    const vs = input.graph.get(c) ?? [];
    if (vs.length > 0) entry.variants = vs.join("");
    // Kept even when empty: "derived, Unihan has nothing" differs from "not derived".
    chars[c] = entry;
  }
  return {
    generator: "scripts/hanviet-unihan.ts",
    source: { url: input.manifest.source.url, sha256: input.manifest.source.sha256, unicodeVersion: input.manifest.source.unicodeVersion },
    fields: [...UNIHAN_READING_FIELDS],
    variantFields: [...UNIHAN_VARIANT_FIELDS, "kJinmeiyoKanji"],
    chars,
  };
}

/**
 * Canonical bytes of the derived file: the usual two-space JSON for the
 * header, one line per character (keeps the file small and its diffs
 * readable).
 */
export function renderUnihanReadings(doc: UnihanReadings): string {
  const head = JSON.stringify({ generator: doc.generator, source: doc.source, fields: doc.fields, variantFields: doc.variantFields }, null, 2);
  const rows = Object.keys(doc.chars)
    .sort(codePointCompare)
    .map((c) => `    ${JSON.stringify(c)}: ${JSON.stringify(doc.chars[c])}`);
  return `${head.slice(0, -2)},\n  "chars": {\n${rows.join(",\n")}\n  }\n}\n`;
}

/** Every Han character of a string (Script=Han; kana, hangul and punctuation ignored). */
export function hanChars(text: string): string[] {
  return [...text].filter((c) => /\p{Script=Han}/u.test(c));
}
