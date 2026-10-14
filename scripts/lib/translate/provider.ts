/**
 * Translation draft providers (P2b). The repo never calls a network: a
 * provider hands back a draft for a (key, source text) pair from material
 * the owner produced beforehand — today a JSONL file written with Claude
 * from the prompt template in plan/authoring/TRANSLATION-STYLE-vi.md.
 *
 * JSONL record: {"key": "<file>#<path>", "en": "<source>", "vi": "<draft>"}
 * (`vi` may be a string, or an object for structured exercises — see
 * `wordBank` / `typeAnswer` in the style guide). A record whose `en` no
 * longer matches the source is stale and is ignored (the review sheet
 * lists it), so a changed English string can never ship an old Vietnamese
 * draft.
 */
import { existsSync, readFileSync } from "fs";

export type Draft = string | Record<string, unknown>;

export interface DraftProvider {
  readonly id: string;
  /** The draft for `key` whose source text is `source`, or undefined. */
  lookup(key: string, source: string): Draft | undefined;
  /** Keys the provider holds whose source text no longer matches (stale). */
  stale(): { key: string; expected: string; found: string }[];
}

type Record_ = { key: string; en: string; vi?: Draft };

export class JsonlDraftProvider implements DraftProvider {
  readonly id: string;
  private readonly byKey = new Map<string, Record_>();
  private readonly staleKeys: { key: string; expected: string; found: string }[] = [];
  private readonly sources = new Map<string, string>();

  constructor(path: string, readonly from: string, readonly to: string) {
    this.id = `jsonl:${path}`;
    if (!existsSync(path)) return;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const rec = JSON.parse(trimmed) as Record<string, unknown>;
      const key = rec.key;
      const en = rec[from];
      if (typeof key !== "string" || typeof en !== "string") throw new Error(`${path}: bad record ${trimmed.slice(0, 80)}`);
      const vi = rec[to];
      this.byKey.set(key, { key, en, vi: typeof vi === "string" || (vi && typeof vi === "object") ? (vi as Draft) : undefined });
    }
  }

  lookup(key: string, source: string): Draft | undefined {
    const rec = this.byKey.get(key);
    this.sources.set(key, source);
    if (!rec || rec.vi === undefined || (typeof rec.vi === "string" && rec.vi.trim() === "")) return undefined;
    if (rec.en !== source) {
      this.staleKeys.push({ key, expected: source, found: rec.en });
      return undefined;
    }
    return rec.vi;
  }

  stale(): { key: string; expected: string; found: string }[] {
    return [...this.staleKeys];
  }

  /** Keys present in the file (for `extract` to keep existing drafts). */
  has(key: string): boolean {
    return this.byKey.has(key);
  }

  draftOf(key: string): Draft | undefined {
    return this.byKey.get(key)?.vi;
  }
}

/**
 * Exact-text dictionary (P2b): `{ "<source text>": "<draft>" }`. Most content
 * strings are short glosses that recur across exercises ("the water" ×24);
 * one dictionary entry drafts every occurrence identically. Per-key JSONL
 * drafts override it for the rare context-dependent string. Markdown and
 * structured (wordBank / typeAnswer) records never come from here.
 */
export class DictionaryDraftProvider implements DraftProvider {
  readonly id: string;
  private readonly entries: Record<string, string>;

  constructor(path: string) {
    this.id = `dictionary:${path}`;
    this.entries = existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as Record<string, string>) : {};
  }

  lookup(_key: string, source: string): Draft | undefined {
    const v = this.entries[source];
    return typeof v === "string" && v.trim() !== "" ? v : undefined;
  }

  stale(): { key: string; expected: string; found: string }[] {
    return [];
  }

  has(source: string): boolean {
    return typeof this.entries[source] === "string";
  }

  draftOf(source: string): string | undefined {
    const v = this.entries[source];
    return typeof v === "string" && v.trim() !== "" ? v : undefined;
  }
}

/** JSONL per-key drafts first, then the dictionary (plain, non-markdown slots only). */
export class LayeredDraftProvider implements DraftProvider {
  readonly id = "layered";
  constructor(readonly jsonl: JsonlDraftProvider, readonly dictionary: DictionaryDraftProvider, readonly dictionaryAllowed: (key: string) => boolean) {}

  lookup(key: string, source: string): Draft | undefined {
    const own = this.jsonl.lookup(key, source);
    if (own !== undefined) return own;
    return this.dictionaryAllowed(key) ? this.dictionary.lookup(key, source) : undefined;
  }

  stale(): { key: string; expected: string; found: string }[] {
    return this.jsonl.stale();
  }
}
