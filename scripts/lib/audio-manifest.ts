/**
 * Merging pack/lexicon audio entries into src/content/audio-manifest.ts
 * (P3f). The pack and lexicon layers both key a clip by `<course>:<text>`,
 * so a word taught in a lesson and listed in the lexicon arrives twice.
 * One key → one entry: an identical asset is kept once; different assets
 * for one key keep the pack's (the lexicon re-voices the same text); two
 * keys that differ only by Unicode normalisation are an error — the
 * runtime looks texts up verbatim and would play one of them silently.
 */

export type ManifestLayer = "pack" | "lexicon";
export type ManifestEntry = { key: string; file: string; layer?: ManifestLayer };

export function mergeManifestEntries(entries: ManifestEntry[]): { entries: { key: string; file: string }[]; errors: string[] } {
  const byKey = new Map<string, ManifestEntry>();
  const errors: string[] = [];
  for (const e of entries) {
    const prev = byKey.get(e.key);
    if (!prev) {
      byKey.set(e.key, e);
      continue;
    }
    if (prev.file === e.file) continue;
    if (prev.layer === "pack" && e.layer !== "pack") continue;
    if (e.layer === "pack" && prev.layer !== "pack") {
      byKey.set(e.key, e);
      continue;
    }
    errors.push(`${e.key}: two different assets for one key (${prev.file}, ${e.file})`);
  }
  const byNormalised = new Map<string, string>();
  for (const key of byKey.keys()) {
    const n = key.normalize("NFC");
    const other = byNormalised.get(n);
    if (other !== undefined && other !== key) errors.push(`"${other}" and "${key}" differ only in Unicode normalisation`);
    else byNormalised.set(n, key);
  }
  return { entries: [...byKey.values()].map(({ key, file }) => ({ key, file })), errors };
}
