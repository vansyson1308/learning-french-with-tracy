/**
 * Static documentation site builder (V1 publication program, Part III).
 *
 * Generates dist-site/ from repository sources so the public pages can never
 * drift from the app: the privacy policy is rendered from the same module
 * the app shows (src/lib/privacy-policy.ts), the user guide from
 * docs/USER_GUIDE.md, licenses from ATTRIBUTIONS.md, and the overview,
 * support, accessibility and release pages from site/content/*.md.
 *
 * Deliberately tiny and dependency-free: no scripts, no analytics, no
 * cookies, no external assets, system fonts, light/dark via CSS only.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import path from "path";

import {
  PRIVACY_POLICY_EFFECTIVE,
  PRIVACY_POLICY_SECTIONS,
  PRIVACY_POLICY_VERSION,
} from "../src/lib/privacy-policy";

const ROOT = path.resolve(import.meta.dir, "..");
const OUT = path.join(ROOT, "dist-site");
const app = JSON.parse(readFileSync(path.join(ROOT, "app.json"), "utf8")).expo as { name: string; version: string };
const contact = JSON.parse(readFileSync(path.join(ROOT, "release/support-contact.json"), "utf8")) as {
  email: string | null;
  issues: string;
  siteBase: string;
};
const product = JSON.parse(readFileSync(path.join(ROOT, "release/product.json"), "utf8")) as { displayName: string };
// The public name is the owner-decided product name; app.json is aligned to
// it by the identity migration (a test pins the two together after that).
const APP_NAME = product.displayName;

// ---------------------------------------------------------------------------
// Minimal Markdown → HTML (headings, paragraphs, lists, code, tables, quotes,
// emphasis, links). Everything is HTML-escaped first; the subset is exactly
// what the authored documents use, and unknown syntax stays literal text.
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inline(text: string): string {
  let t = esc(text);
  t = t.replace(/`([^`]+)`/g, (_m, c: string) => `<code>${c}</code>`);
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?=[^*\w]|$)/g, "$1<em>$2</em>");
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) => {
    const safe = /^(https?:\/\/|\.{0,2}\/|#|mailto:)/.test(href) ? href : "#";
    const ext = /^https?:\/\//.test(safe) ? ' rel="noopener"' : "";
    return `<a href="${safe}"${ext}>${label}</a>`;
  });
  return t;
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function markdownToHtml(md: string): { html: string; headings: { level: number; text: string; id: string }[] } {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  const headings: { level: number; text: string; id: string }[] = [];
  const usedIds = new Set<string>();
  let i = 0;
  const listStack: { type: "ul" | "ol"; indent: number }[] = [];
  const closeLists = (toIndent = -1) => {
    while (listStack.length > 0 && listStack[listStack.length - 1].indent > toIndent) {
      out.push(`</li></${listStack.pop()!.type}>`);
    }
  };
  let para: string[] = [];
  const flushPara = () => {
    if (para.length > 0) {
      out.push(`<p>${inline(para.join(" "))}</p>`);
      para = [];
    }
  };
  while (i < lines.length) {
    const line = lines[i];
    // fenced code
    if (/^```/.test(line)) {
      flushPara();
      closeLists();
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i += 1;
      out.push(`<pre><code>${esc(buf.join("\n"))}</code></pre>`);
      continue;
    }
    // table
    if (/^\|/.test(line) && i + 1 < lines.length && /^\|\s*:?-{2,}/.test(lines[i + 1])) {
      flushPara();
      closeLists();
      const header = line.split("|").slice(1, -1).map((c) => c.trim());
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        rows.push(lines[i].split("|").slice(1, -1).map((c) => c.trim()));
        i += 1;
      }
      out.push(
        `<div class="table-wrap"><table><thead><tr>${header.map((h) => `<th>${inline(h)}</th>`).join("")}</tr></thead><tbody>${rows
          .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
          .join("")}</tbody></table></div>`
      );
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      flushPara();
      closeLists();
      const level = h[1].length;
      const text = h[2].trim();
      let id = slug(text) || `section-${headings.length + 1}`;
      while (usedIds.has(id)) id = `${id}-x`;
      usedIds.add(id);
      headings.push({ level, text, id });
      out.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
      i += 1;
      continue;
    }
    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      flushPara();
      const m = /^(\s*)([-*+]|\d+\.)\s+(.*)$/.exec(line)!;
      const indent = m[1].length;
      const type: "ul" | "ol" = /\d/.test(m[2]) ? "ol" : "ul";
      const top = listStack[listStack.length - 1];
      if (!top || indent > top.indent) {
        out.push(`<${type}><li>${inline(m[3])}`);
        listStack.push({ type, indent });
      } else {
        closeLists(indent);
        const cur = listStack[listStack.length - 1];
        if (cur && cur.indent === indent) {
          out.push(`</li><li>${inline(m[3])}`);
        } else {
          out.push(`<${type}><li>${inline(m[3])}`);
          listStack.push({ type, indent });
        }
      }
      i += 1;
      continue;
    }
    if (/^>\s?/.test(line)) {
      flushPara();
      closeLists();
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ""));
      out.push(`<blockquote><p>${inline(buf.join(" "))}</p></blockquote>`);
      continue;
    }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
      flushPara();
      closeLists();
      out.push("<hr>");
      i += 1;
      continue;
    }
    if (line.trim() === "") {
      flushPara();
      // A blank line inside a list keeps the list open only if the next
      // non-blank line is still a list item at some indent.
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === "") j += 1;
      if (!(j < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[j]))) closeLists();
      i += 1;
      continue;
    }
    // continuation of a list item (indented text)
    if (listStack.length > 0 && /^\s{2,}\S/.test(line)) {
      out.push(` ${inline(line.trim())}`);
      i += 1;
      continue;
    }
    closeLists();
    para.push(line.trim());
    i += 1;
  }
  flushPara();
  closeLists();
  return { html: out.join("\n"), headings };
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const NAV: { href: string; label: string }[] = [
  { href: "", label: "Overview" },
  { href: "guide/", label: "User guide" },
  { href: "support/", label: "Support" },
  { href: "privacy/", label: "Privacy" },
  { href: "accessibility/", label: "Accessibility" },
  { href: "licenses/", label: "Licenses" },
  { href: "release/", label: "Release" },
];

const CSS = `
:root{color-scheme:light dark;--bg:#fbfaf7;--fg:#1d1d1f;--muted:#5d5d63;--accent:#1d4ed8;--line:#e5e2da;--code:#f1efe8}
@media (prefers-color-scheme:dark){:root{--bg:#141416;--fg:#ececee;--muted:#a7a7ad;--accent:#8ab4ff;--line:#2a2a2e;--code:#202024}}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--fg);font:17px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
a{color:var(--accent)}a:focus-visible,button:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.skip{position:absolute;left:-999px;top:0;background:var(--bg);padding:.5rem 1rem}.skip:focus{left:1rem;z-index:10}
header{border-bottom:1px solid var(--line)}
.wrap{max-width:52rem;margin:0 auto;padding:0 1.25rem}
header .wrap{display:flex;flex-wrap:wrap;align-items:center;gap:.75rem 1.25rem;padding:1rem 1.25rem}
.brand{font-weight:700;text-decoration:none;color:var(--fg);font-size:1.1rem}
nav ul{list-style:none;display:flex;flex-wrap:wrap;gap:.25rem 1rem;margin:0;padding:0}
nav a{text-decoration:none;padding:.25rem 0}nav a[aria-current=page]{font-weight:700;border-bottom:2px solid var(--accent)}
main{padding:1.5rem 0 3rem}main h1{font-size:2rem;line-height:1.2;margin:.5rem 0 1rem}
main h2{font-size:1.4rem;margin-top:2.2rem;border-top:1px solid var(--line);padding-top:1rem}main h3{font-size:1.15rem;margin-top:1.6rem}
code,pre{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.92em}
pre{background:var(--code);padding:1rem;overflow-x:auto;border-radius:8px}code{background:var(--code);padding:.1em .3em;border-radius:4px}pre code{background:none;padding:0}
.table-wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;margin:1rem 0}th,td{border:1px solid var(--line);padding:.5rem .6rem;text-align:left;vertical-align:top}th{background:var(--code)}
blockquote{margin:1rem 0;padding:.25rem 1rem;border-left:4px solid var(--line);color:var(--muted)}
.toc{background:var(--code);padding:1rem 1.25rem;border-radius:8px;margin:1rem 0 2rem}.toc ol{margin:.5rem 0 0;padding-left:1.25rem}
.meta{color:var(--muted);font-size:.95rem}
footer{border-top:1px solid var(--line);color:var(--muted);font-size:.92rem;padding:1.5rem 0 3rem}
footer p{margin:.4rem 0}
@media (max-width:600px){body{font-size:16px}main h1{font-size:1.6rem}}
`;

function page(opts: { title: string; nav: string; body: string; rel: string; description: string }): string {
  const nav = NAV.map((n) => `<li><a href="${opts.rel}${n.href}"${n.href === opts.nav ? ' aria-current="page"' : ""}>${n.label}</a></li>`).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(opts.title)} · ${esc(APP_NAME)}</title>
<meta name="description" content="${esc(opts.description)}">
<meta name="referrer" content="no-referrer">
<link rel="stylesheet" href="${opts.rel}styles.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header><div class="wrap"><a class="brand" href="${opts.rel}">${esc(APP_NAME)}</a><nav aria-label="Site"><ul>${nav}</ul></nav></div></header>
<main id="main" class="wrap">
${opts.body}
</main>
<footer><div class="wrap">
<p>${esc(APP_NAME)} is free, has no ads, no accounts and no analytics. The app makes no network requests of its own; this site sets no cookies and loads nothing from third parties.</p>
<p>Derived from <a href="https://github.com/Open-Apps-Studio/lingo-lessons" rel="noopener">Lingo Lessons</a> by Open Apps Studio (MIT). Source code: <a href="https://github.com/vansyson1308/learning-french-with-tracy" rel="noopener">GitHub</a>.</p>
</div></footer>
</body>
</html>
`;
}

function readMd(rel: string): string {
  const p = path.join(ROOT, rel);
  if (!existsSync(p)) throw new Error(`missing source ${rel}`);
  return readFileSync(p, "utf8");
}

function withToc(md: string, minHeadings = 6): string {
  const { html, headings } = markdownToHtml(md);
  const items = headings.filter((h) => h.level === 2);
  if (items.length < minHeadings) return html;
  const toc = `<nav class="toc" aria-label="Contents"><strong>Contents</strong><ol>${items
    .map((h) => `<li><a href="#${h.id}">${inline(h.text)}</a></li>`)
    .join("")}</ol></nav>`;
  // insert after the first h1
  const idx = html.indexOf("</h1>");
  return idx >= 0 ? `${html.slice(0, idx + 5)}\n${toc}\n${html.slice(idx + 5)}` : `${toc}\n${html}`;
}

function contactMarkdown(): string {
  const lines: string[] = [];
  if (contact.email) lines.push(`- Email: [${contact.email}](mailto:${contact.email})`);
  lines.push(`- Bug reports and questions: [GitHub Issues](${contact.issues}) (templates for bugs, speech/audio, accessibility and French corrections).`);
  return lines.join("\n");
}

function build() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  writeFileSync(path.join(OUT, "styles.css"), CSS.trim() + "\n");
  writeFileSync(path.join(OUT, ".nojekyll"), "");
  writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${contact.siteBase}/sitemap.xml\n`);

  const pages: { dir: string; nav: string; title: string; description: string; body: string }[] = [];
  const sub = (name: string, md: string) => md.replace(/\{\{APP_NAME\}\}/g, APP_NAME).replace(/\{\{VERSION\}\}/g, app.version).replace(/\{\{CONTACT\}\}/g, contactMarkdown()).replace(/\{\{ISSUES\}\}/g, contact.issues);

  pages.push({ dir: "", nav: "", title: "Overview", description: `${APP_NAME}: a free, local-first French course to a CEFR-aligned A1 estimate.`, body: markdownToHtml(sub("index", readMd("site/content/index.md"))).html });
  pages.push({ dir: "guide", nav: "guide/", title: "User guide", description: `How to use ${APP_NAME}, from installation to backups.`, body: withToc(sub("guide", readMd("docs/USER_GUIDE.md"))) });
  pages.push({ dir: "support", nav: "support/", title: "Support", description: `Help, FAQ and contact for ${APP_NAME}.`, body: withToc(sub("support", readMd("site/content/support.md"))) });

  const privacyMd = [
    `# Privacy Policy`,
    ``,
    `**${APP_NAME}** · Policy version ${PRIVACY_POLICY_VERSION}, effective ${PRIVACY_POLICY_EFFECTIVE}. This is the same text shown inside the app under Profile → Privacy.`,
    ``,
    ...PRIVACY_POLICY_SECTIONS.flatMap((s) => [`## ${s.title}`, ``, ...s.paragraphs.flatMap((p) => [p, ``])]),
    `## Contact`,
    ``,
    `Privacy questions and deletion requests: the app stores everything on your device, so deleting the app deletes your data; for questions use the routes below.`,
    ``,
    contactMarkdown(),
    ``,
  ].join("\n");
  pages.push({ dir: "privacy", nav: "privacy/", title: "Privacy Policy", description: `Privacy policy for ${APP_NAME}.`, body: withToc(privacyMd) });
  pages.push({ dir: "accessibility", nav: "accessibility/", title: "Accessibility", description: `Accessibility statement for ${APP_NAME}.`, body: withToc(sub("a11y", readMd("site/content/accessibility.md"))) });
  const attributions = readMd("ATTRIBUTIONS.md").replace(/^<!--[\s\S]*?-->\s*/, "");
  pages.push({ dir: "licenses", nav: "licenses/", title: "Licenses and attributions", description: `Third-party sources and licenses used by ${APP_NAME}.`, body: withToc(`# Licenses and attributions\n\nApplication code is MIT-licensed (the original LICENSE, including the 650 Industries, Inc. notice, is preserved). Authored French lexicon data is CC BY-SA 4.0. Everything below is generated from the provenance registry and is identical to the app's Licenses screen.\n\n${attributions.replace(/^# Attributions\s*/m, "")}`) });
  pages.push({ dir: "release", nav: "release/", title: "Release", description: `Current release and known limitations of ${APP_NAME}.`, body: withToc(sub("release", readMd("site/content/release.md"))) });

  const urls: string[] = [];
  for (const p of pages) {
    const dir = p.dir ? path.join(OUT, p.dir) : OUT;
    mkdirSync(dir, { recursive: true });
    const rel = p.dir ? "../" : "./";
    writeFileSync(path.join(dir, "index.html"), page({ title: p.title, nav: p.nav, body: p.body, rel, description: p.description }));
    urls.push(`${contact.siteBase}/${p.dir ? `${p.dir}/` : ""}`);
  }
  writeFileSync(path.join(OUT, "404.html"), page({ title: "Not found", nav: "x", body: `<h1>Page not found</h1><p>Try the <a href="./">overview</a> or the <a href="./guide/">user guide</a>.</p>`, rel: "./", description: "Not found" }));
  writeFileSync(
    path.join(OUT, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`
  );
  console.log(`site built: ${pages.length} pages → dist-site/ (support email ${contact.email ? "present" : "NOT SUPPLIED — owner field"})`);
}

if (import.meta.main) build();
