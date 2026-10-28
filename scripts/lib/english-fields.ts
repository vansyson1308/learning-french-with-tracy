/**
 * QC 2026-10-29 §1.3: an `en` native-text field must be English. The check
 * looks for letters only Vietnamese uses (ă đ ơ ư, ĩ ũ and the
 * hook/dot-below/tilde tone forms); the accents shared with French,
 * Spanish, German, Italian and Portuguese (é è ê ô â à ç ñ ü ã õ …) do not
 * count. Quoted spans ('…', "…", «…», *…*) are ignored, so an English
 * explanation may cite a Vietnamese word. A string is flagged when at least
 * two words, or a third of its words, carry such letters — one proper name
 * ("Nguyễn") inside an English sentence passes.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { safeResolve } from "./pipeline";

const VI_ONLY = /[ăắằẳẵặđơớờởỡợưứừửữựạảấầẩẫậẹẻẽếềểễệỉịĩọỏốồổỗộụủũỳỵỷỹ]/iu;
const QUOTED = /'[^']*'|"[^"]*"|«[^»]*»|“[^”]*”|\*[^*]*\*/gu;

export function looksVietnamese(text: string): boolean {
  const words = text.replace(QUOTED, " ").split(/[^\p{L}]+/u).filter(Boolean);
  if (words.length === 0) return false;
  const vi = words.filter((w) => VI_ONLY.test(w)).length;
  return vi >= 2 || vi * 3 >= words.length;
}

/**
 * Accented letters a target language's own text may use. An `en` copied from
 * its `vi` sibling that carries an accent outside the file's target alphabet
 * is untranslated Vietnamese ("Tên", "Hôm nay" in content/de); target words
 * shown in both languages ("Größe", "le côté") keep their own letters.
 */
const TARGET_ACCENTS: Record<string, string> = {
  de: "äöüß",
  fr: "àâæçéèêëîïôœùûüÿ",
  es: "áéíñóúü",
  it: "àèéìíîòóùú",
  pt: "áâãàçéêíóôõú",
};
const ACCENTED = /[^\x00-\x7f]/u;

function foreignToTarget(text: string, target: string | undefined): boolean {
  const own = target ? TARGET_ACCENTS[target] : undefined;
  if (own === undefined) return false;
  return [...text.toLowerCase()].some((ch) => /\p{L}/u.test(ch) && ACCENTED.test(ch) && !own.includes(ch));
}

/** Every `en` string of a JSON document that reads as Vietnamese. */
export function englishFieldErrors(doc: unknown, file: string): string[] {
  const target = /^content\/([a-z]{2,3})\//.exec(file)?.[1];
  const errors: string[] = [];
  const walk = (node: unknown, path: string) => {
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${path}[${i}]`));
    } else if (node !== null && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) {
        const here = path ? `${path}.${k}` : k;
        // A copy of the sibling `vi` text with a Vietnamese-only letter is caught even when the ratio is low.
        const copied = typeof v === "string" && (node as Record<string, unknown>).vi === v && (VI_ONLY.test(v) || foreignToTarget(v, target));
        if (k === "en" && typeof v === "string" && (looksVietnamese(v) || copied)) {
          errors.push(`english-fields: ${file} ${here} is Vietnamese: "${v.length > 80 ? `${v.slice(0, 80)}…` : v}"`);
        }
        walk(v, here);
      }
    }
  };
  walk(doc, "");
  return errors;
}

/** Authored content only: drafts and generated reports are skipped. */
const SKIP_DIRS = new Set(["_drafts", "reports"]);

export function validateEnglishFields(root = "content"): string[] {
  const base = safeResolve(root);
  const errors: string[] = [];
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) visit(join(dir, entry.name));
      } else if (entry.name.endsWith(".json")) {
        const path = join(dir, entry.name);
        const rel = `${root}/${relative(base, path).split("\\").join("/")}`;
        errors.push(...englishFieldErrors(JSON.parse(readFileSync(path, "utf8")), rel));
      }
    }
  };
  visit(base);
  return errors;
}
