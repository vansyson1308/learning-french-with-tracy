/**
 * A tiny ICU-style message formatter (P2a). Supports exactly what the
 * catalogue uses — `{name}` placeholders, `{n, plural, =0 {…} one {…}
 * other {…}}` with `#` for the number, and `{x, select, a {…} other {…}}`
 * — with nesting inside branches. No Intl dependency: the two UI
 * languages have trivial plural rules (English one/other, Vietnamese has
 * no plural inflection), so nothing depends on the engine's ICU data.
 * Parsed templates are cached; a malformed template formats as itself
 * (never throws in the UI).
 */

export type Params = Readonly<Record<string, string | number | readonly string[]>>;
export type PluralLanguage = "en" | "vi";

type Node =
  | { kind: "text"; text: string }
  | { kind: "arg"; name: string }
  | { kind: "plural"; name: string; branches: Branch[] }
  | { kind: "select"; name: string; branches: Branch[] }
  | { kind: "list"; name: string; style: "and" | "or" | "comma" };
type Branch = { selector: string; nodes: Node[] };

const cache = new Map<string, Node[]>();

/** Conjunctions for `{x, list, and|or|comma}` — the only language-specific text outside the catalogues. */
const LIST_JOINERS: Record<PluralLanguage, { and: string; or: string; comma: string }> = {
  en: { and: " and ", or: " or ", comma: ", " },
  vi: { and: " và ", or: " hoặc ", comma: ", " },
};

function joinList(items: readonly string[], style: "and" | "or" | "comma", lang: PluralLanguage): string {
  const joiner = LIST_JOINERS[lang];
  if (style === "comma" || items.length <= 1) return items.join(joiner.comma);
  return `${items.slice(0, -1).join(joiner.comma)}${joiner[style]}${items[items.length - 1]}`;
}

export function pluralCategory(n: number, lang: PluralLanguage): "one" | "other" {
  if (lang === "vi") return "other";
  return Number.isInteger(n) && Math.abs(n) === 1 ? "one" : "other";
}

class Parser {
  private i = 0;
  constructor(private readonly s: string) {}

  parseNodes(stopAtBrace: boolean): Node[] {
    const nodes: Node[] = [];
    let text = "";
    while (this.i < this.s.length) {
      const ch = this.s[this.i];
      if (ch === "}" && stopAtBrace) break;
      if (ch === "{") {
        if (text) nodes.push({ kind: "text", text });
        text = "";
        nodes.push(this.parseArgument());
        continue;
      }
      text += ch;
      this.i += 1;
    }
    if (text) nodes.push({ kind: "text", text });
    return nodes;
  }

  private parseArgument(): Node {
    this.expect("{");
    const name = this.readUntil(/[,}]/).trim();
    if (this.peek() === "}") {
      this.i += 1;
      return { kind: "arg", name };
    }
    this.expect(",");
    const type = this.readUntil(/[,}]/).trim();
    if (type === "list") {
      this.expect(",");
      const style = this.readUntil(/[}]/).trim();
      this.expect("}");
      if (style !== "and" && style !== "or" && style !== "comma") throw new Error(`unknown list style "${style}"`);
      return { kind: "list", name, style };
    }
    this.expect(",");
    const branches: Branch[] = [];
    this.skipSpaces();
    while (this.peek() !== "}") {
      const selector = this.readUntil(/[{]/).trim();
      this.expect("{");
      const nodes = this.parseNodes(true);
      this.expect("}");
      branches.push({ selector, nodes });
      this.skipSpaces();
    }
    this.expect("}");
    if (type === "plural") return { kind: "plural", name, branches };
    if (type === "select") return { kind: "select", name, branches };
    throw new Error(`unknown argument type "${type}"`);
  }

  private peek(): string {
    if (this.i >= this.s.length) throw new Error("unexpected end of message");
    return this.s[this.i];
  }
  private expect(ch: string): void {
    if (this.peek() !== ch) throw new Error(`expected "${ch}" at ${this.i}`);
    this.i += 1;
  }
  private readUntil(re: RegExp): string {
    let out = "";
    while (this.i < this.s.length && !re.test(this.s[this.i])) {
      out += this.s[this.i];
      this.i += 1;
    }
    return out;
  }
  private skipSpaces(): void {
    while (this.i < this.s.length && /\s/.test(this.s[this.i])) this.i += 1;
  }
}

function parse(template: string): Node[] | null {
  const cached = cache.get(template);
  if (cached) return cached;
  try {
    const nodes = new Parser(template).parseNodes(false);
    cache.set(template, nodes);
    return nodes;
  } catch {
    return null;
  }
}

function render(nodes: Node[], params: Params, lang: PluralLanguage, hash: string | null): string {
  let out = "";
  for (const node of nodes) {
    if (node.kind === "text") {
      out += hash === null ? node.text : node.text.replace(/#/g, hash);
    } else if (node.kind === "arg") {
      const v = params[node.name];
      out += v === undefined ? `{${node.name}}` : Array.isArray(v) ? joinList(v, "comma", lang) : String(v);
    } else if (node.kind === "list") {
      const v = params[node.name];
      out += Array.isArray(v) ? joinList(v, node.style, lang) : v === undefined ? `{${node.name}}` : String(v);
    } else if (node.kind === "plural") {
      const raw = params[node.name];
      const n = typeof raw === "number" ? raw : Array.isArray(raw) ? raw.length : Number(raw);
      const number = Number.isFinite(n) ? n : 0;
      const exact = node.branches.find((b) => b.selector === `=${number}`);
      const branch =
        exact ??
        node.branches.find((b) => b.selector === pluralCategory(number, lang)) ??
        node.branches.find((b) => b.selector === "other");
      out += branch ? render(branch.nodes, params, lang, String(number)) : "";
    } else {
      const value = String(params[node.name] ?? "other");
      const branch = node.branches.find((b) => b.selector === value) ?? node.branches.find((b) => b.selector === "other");
      out += branch ? render(branch.nodes, params, lang, hash) : "";
    }
  }
  return out;
}

/** Format one template. Unknown placeholders stay visible as `{name}` so a missing param is noticed in QA, never a crash. */
export function formatMessage(template: string, params: Params = {}, lang: PluralLanguage = "en"): string {
  const nodes = parse(template);
  if (!nodes) return template;
  return render(nodes, params, lang, null);
}

/** Placeholder names a template references (for catalogue parity tests). */
export function placeholdersOf(template: string): string[] {
  const nodes = parse(template);
  if (!nodes) return [];
  const names = new Set<string>();
  const walk = (list: Node[]) => {
    for (const node of list) {
      if (node.kind === "text") continue;
      names.add(node.name);
      if (node.kind === "plural" || node.kind === "select") for (const b of node.branches) walk(b.nodes);
    }
  };
  walk(nodes);
  return [...names].sort();
}
