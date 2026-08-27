/**
 * 54-core cross-check (Phase 5A §13–15): authored curriculum fields vs the
 * real Lexique 4 evidence rows committed by the derive step. Pure functions
 * over (rich lexicon, committed core subset) — runs fully offline.
 *
 * Honesty contract:
 *  - every comparison lands in one of the program's statuses
 *    (agree / external-missing / authored-missing / disagree / ambiguous /
 *    not-applicable) — nothing is silently "fixed";
 *  - "disagree" and "ambiguous" items are the manual-investigation queue;
 *    the cross-check NEVER mutates authored data;
 *  - épicène source gender (e) never silently satisfies an authored m/f —
 *    it reports as "ambiguous" with an explanatory note.
 */
import type { RichLexeme, RichLexicon } from "../../content/schema";
import { lexiqueFormEquals, lexiqueGenderFor, lexiquePosFor, type MatchStatus } from "./lexicon";
import { trimmedRowKey, type CoreLexemeRows } from "./lexique-derive-lib";

export type CrossCheckStatus =
  | "agree"
  | "external-missing"
  | "authored-missing"
  | "disagree"
  | "ambiguous"
  | "not-applicable";

export type FieldCheck = {
  field: "lookup" | "lemma" | "partOfSpeech" | "gender" | "pronunciation" | "frequency";
  status: CrossCheckStatus;
  authored: string | null;
  external: string | null;
  note?: string;
};

export type ItemCrossCheck = {
  id: string;
  surface: string;
  lookupForm: string;
  matchStatus: MatchStatus;
  matchKey: string | null;
  fields: FieldCheck[];
  /** "attention" iff any field disagrees or is ambiguous — the manual queue. */
  overall: "agree" | "attention" | "not-applicable";
};

export type CrossCheckReport = {
  items: ItemCrossCheck[];
  summary: {
    items: Record<string, number>;
    fields: Record<string, Record<string, number>>;
  };
};

/**
 * IPA comparison normalization (documented, deliberately narrow):
 *  - Unicode NFC on both sides;
 *  - stress marks, syllable separators and phonemic slashes stripped
 *    (ˈ ˌ . / and spaces) — suprasegmentals our authored values may carry
 *    but Lexique's phonemic strings do not;
 *  - ʀ folded to ʁ (uvular-r notation variants for the same French rhotic);
 *  - ASCII g folded to IPA ɡ (U+0261) — same segment, two codepoints.
 * Anything beyond these is a REAL difference and must surface as disagree.
 */
export function normalizeIpaForComparison(value: string): string {
  return value
    .normalize("NFC")
    .replace(/[ˈˌ./\s()]/g, "")
    .replace(/ʀ/g, "ʁ")
    .replace(/g/g, "ɡ");
}

function check(
  lex: RichLexeme,
  entry: CoreLexemeRows["entries"][number],
  audit: CoreLexemeRows["audit"][number]
): ItemCrossCheck {
  const base = {
    id: lex.id,
    surface: lex.surface,
    lookupForm: lex.lookupForm,
    matchStatus: audit.status,
    matchKey: audit.matchKey,
  };

  if (lex.partOfSpeech === "expression") {
    return {
      ...base,
      fields: [
        {
          field: "lookup",
          status: "not-applicable",
          authored: lex.surface,
          external: null,
          note: "expressions are project-authored and never lexique-matched",
        },
      ],
      overall: "not-applicable",
    };
  }

  const fields: FieldCheck[] = [];
  const observedReadings = entry.formRows
    .map((r) => `${r.lemme}/${r.cgram}${r.genre ? `/${r.genre}` : ""}`)
    .join(", ");

  // lookup: does the authored lookup form exist in the source at all?
  fields.push({
    field: "lookup",
    status: entry.formRows.length > 0 ? "agree" : "external-missing",
    authored: lex.lookupForm,
    external: entry.formRows.length > 0 ? observedReadings : null,
  });

  const matched =
    audit.status === "matched" && audit.matchKey !== null
      ? entry.formRows.find((r) => trimmedRowKey(r) === audit.matchKey) ?? null
      : null;

  const rowStatus: CrossCheckStatus =
    audit.status === "matched"
      ? "agree"
      : audit.status === "ambiguous"
        ? "ambiguous"
        : entry.formRows.length === 0
          ? "external-missing"
          : "disagree";

  // lemma + POS: from the matched row when there is one; otherwise report
  // what the source DOES say about this form so the investigation has the
  // evidence in hand.
  // Lemma equality applies the same documented ligature fold as matching
  // (the source writes "oeuf" for our "œuf" — same lemma, digraph spelling).
  const lemmaAgrees = matched !== null && lexiqueFormEquals(matched.lemme, lex.lemma);
  fields.push({
    field: "lemma",
    status: rowStatus === "agree" ? (lemmaAgrees ? "agree" : "disagree") : rowStatus,
    authored: lex.lemma,
    external: matched ? matched.lemme : entry.formRows.length > 0 ? observedReadings : null,
    ...(rowStatus === "disagree"
      ? { note: "the form exists in the source only under other readings" }
      : lemmaAgrees && matched !== null && matched.lemme !== lex.lemma
        ? { note: "source writes the ligature as a digraph (documented fold)" }
        : {}),
  });
  fields.push({
    field: "partOfSpeech",
    status:
      rowStatus === "agree"
        ? matched && lexiquePosFor(matched.cgram) === lex.partOfSpeech
          ? "agree"
          : "disagree"
        : rowStatus,
    authored: lex.partOfSpeech,
    external: matched ? matched.cgram : entry.formRows.length > 0 ? observedReadings : null,
  });

  // gender (nouns only).
  if (lex.partOfSpeech === "noun") {
    const authoredGender = lex.gender ?? null;
    if (authoredGender === null || authoredGender === "unknown") {
      fields.push({
        field: "gender",
        status: "authored-missing",
        authored: authoredGender,
        external: matched?.genre ?? null,
      });
    } else if (matched === null) {
      fields.push({ field: "gender", status: rowStatus, authored: authoredGender, external: null });
    } else {
      const external = lexiqueGenderFor(matched.genre);
      let status: CrossCheckStatus;
      let note: string | undefined;
      if (external === "unknown") {
        status = "external-missing";
      } else if (external === "both") {
        status = authoredGender === "both" ? "agree" : "ambiguous";
        note =
          authoredGender === "both"
            ? undefined
            : `source marks épicène (either gender); authored ${authoredGender} — verify the pedagogical article choice deliberately`;
      } else {
        status = external === authoredGender ? "agree" : "disagree";
      }
      fields.push({
        field: "gender",
        status,
        authored: authoredGender,
        external: matched.genre,
        ...(note ? { note } : {}),
      });
    }
  }

  // pronunciation: authored IPA vs the matched row's genuine-IPA column.
  if (lex.pronunciation === undefined) {
    fields.push({
      field: "pronunciation",
      status: "authored-missing",
      authored: null,
      external: matched?.ipa ?? null,
    });
  } else if (matched === null) {
    fields.push({
      field: "pronunciation",
      status: rowStatus,
      authored: lex.pronunciation.value,
      external: null,
    });
  } else if (matched.ipa === "") {
    fields.push({
      field: "pronunciation",
      status: "external-missing",
      authored: lex.pronunciation.value,
      external: null,
    });
  } else {
    const same =
      normalizeIpaForComparison(lex.pronunciation.value) === normalizeIpaForComparison(matched.ipa);
    fields.push({
      field: "pronunciation",
      status: same ? "agree" : "disagree",
      authored: lex.pronunciation.value,
      external: matched.ipa,
      ...(same ? {} : { note: "compare beyond the documented normalization (stress/syllable marks, ʀ→ʁ, g→ɡ) — investigate manually, never auto-correct" }),
    });
  }

  // frequency: authored raw value vs the matched row's 12_FreqLemme.
  if (matched === null) {
    fields.push({
      field: "frequency",
      status: lex.frequency === undefined ? "authored-missing" : rowStatus,
      authored: lex.frequency ? String(lex.frequency.rawValue) : null,
      external: null,
    });
  } else if (lex.frequency === undefined) {
    fields.push({
      field: "frequency",
      status: "authored-missing",
      authored: null,
      external: matched.freqLemme === null ? null : String(matched.freqLemme),
      note: "expected before frequency activation (P5A.3) — the activation flips these to agree",
    });
  } else if (matched.freqLemme === null) {
    fields.push({
      field: "frequency",
      status: "external-missing",
      authored: String(lex.frequency.rawValue),
      external: null,
    });
  } else {
    fields.push({
      field: "frequency",
      status: lex.frequency.rawValue === matched.freqLemme ? "agree" : "disagree",
      authored: String(lex.frequency.rawValue),
      external: String(matched.freqLemme),
    });
  }

  // Attention = the manual-investigation queue: any conflict or ambiguity,
  // plus words the 190k-form source does not contain at all (a core
  // curriculum word absent from Lexique needs a deliberate explanation).
  const attention =
    fields.some((f) => f.status === "disagree" || f.status === "ambiguous") ||
    fields.some((f) => f.field === "lookup" && f.status === "external-missing");
  return { ...base, fields, overall: attention ? "attention" : "agree" };
}

export function crossCheckCore(lexicon: RichLexicon, core: CoreLexemeRows): CrossCheckReport {
  const auditById = new Map(core.audit.map((row) => [row.id, row]));
  const entryById = new Map(core.entries.map((e) => [e.id, e]));
  const items = lexicon.lexemes.map((lex) => {
    const audit = auditById.get(lex.id);
    const entry = entryById.get(lex.id);
    if (!audit || !entry) {
      throw new Error(`core subset is missing lexeme ${lex.id} — regenerate the derived data`);
    }
    return check(lex, entry, audit);
  });

  const itemCounts: Record<string, number> = {};
  const fieldCounts: Record<string, Record<string, number>> = {};
  for (const item of items) {
    itemCounts[item.overall] = (itemCounts[item.overall] ?? 0) + 1;
    for (const f of item.fields) {
      fieldCounts[f.field] = fieldCounts[f.field] ?? {};
      fieldCounts[f.field][f.status] = (fieldCounts[f.field][f.status] ?? 0) + 1;
    }
  }
  return { items, summary: { items: itemCounts, fields: fieldCounts } };
}
