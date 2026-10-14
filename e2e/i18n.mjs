/**
 * Catalogue-driven labels for the browser walks (P2a). Selectors in the
 * e2e scripts are testIDs; the few assertions that read visible text take
 * their expected strings from the UI catalogue of the language the export
 * was built with (UI_LANG=vi|en, default en), through a compact port of
 * src/lib/i18n/format.ts (placeholders, plural, select, lists).
 */
import { readFileSync } from "node:fs";

export const UI_LANG = process.env.UI_LANG === "vi" ? "vi" : "en";
const CATALOG = JSON.parse(readFileSync(`src/lib/i18n/catalog/${UI_LANG}.json`, "utf8"));
const JOIN = { en: { and: " and ", or: " or " }, vi: { and: " và ", or: " hoặc " } }[UI_LANG];

function plural(n) {
  return UI_LANG === "vi" ? "other" : Number.isInteger(n) && Math.abs(n) === 1 ? "one" : "other";
}

function branches(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    while (i < src.length && /\s/.test(src[i])) i++;
    if (i >= src.length) break;
    let sel = "";
    while (i < src.length && src[i] !== "{") sel += src[i++];
    let depth = 0;
    let body = "";
    i++;
    for (; i < src.length; i++) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}") {
        if (depth === 0) break;
        depth--;
      }
      body += src[i];
    }
    i++;
    out.push({ selector: sel.trim(), body });
  }
  return out;
}

function render(tpl, params, hash) {
  let out = "";
  let i = 0;
  while (i < tpl.length) {
    const ch = tpl[i];
    if (ch === "#" && hash !== null) {
      out += hash;
      i++;
      continue;
    }
    if (ch !== "{") {
      out += ch;
      i++;
      continue;
    }
    let depth = 0;
    let inner = "";
    i++;
    for (; i < tpl.length; i++) {
      if (tpl[i] === "{") depth++;
      else if (tpl[i] === "}") {
        if (depth === 0) break;
        depth--;
      }
      inner += tpl[i];
    }
    i++;
    const comma = inner.indexOf(",");
    if (comma < 0) {
      const v = params[inner.trim()];
      out += v === undefined ? `{${inner.trim()}}` : Array.isArray(v) ? v.join(", ") : String(v);
      continue;
    }
    const name = inner.slice(0, comma).trim();
    const rest = inner.slice(comma + 1);
    const comma2 = rest.indexOf(",");
    const type = (comma2 < 0 ? rest : rest.slice(0, comma2)).trim();
    const spec = comma2 < 0 ? "" : rest.slice(comma2 + 1);
    const v = params[name];
    if (type === "list") {
      const style = spec.trim();
      const items = Array.isArray(v) ? v : [String(v)];
      out += style === "comma" || items.length <= 1 ? items.join(", ") : `${items.slice(0, -1).join(", ")}${JOIN[style] ?? ", "}${items[items.length - 1]}`;
      continue;
    }
    const b = branches(spec);
    if (type === "plural") {
      const n = Number(v);
      const branch = b.find((x) => x.selector === `=${n}`) ?? b.find((x) => x.selector === plural(n)) ?? b.find((x) => x.selector === "other");
      out += branch ? render(branch.body, params, String(n)) : "";
    } else {
      const branch = b.find((x) => x.selector === String(v)) ?? b.find((x) => x.selector === "other");
      out += branch ? render(branch.body, params, hash) : "";
    }
  }
  return out;
}

/** The label for a catalogue key in the export's UI language. */
export function t(key, params = {}) {
  const tpl = CATALOG[key];
  if (tpl === undefined) throw new Error(`unknown catalogue key: ${key}`);
  return render(tpl, params, null);
}

/** `language.<code>` → the language name in the UI language. */
export const languageName = (code) => t(`language.${code}`);
