/**
 * Guidebook markdown subset (Phase 5B §50 spike decision: in-house).
 *
 * The guidebooks need headings, paragraphs, bold, italic and bullet lists —
 * nothing more. A React-Native markdown dependency brings a large tree for
 * that; this ~150-line pure parser is fully tested, theme-controlled and
 * offline by construction. The Phase-0-era renderer stripped every `*`
 * (losing all emphasis); this replaces it.
 *
 * Rules (deliberately narrow):
 *  - "# ", "## ", "### " open headings (deeper levels clamp to 3);
 *  - lines starting "- " or "* " are bullet items; consecutive items group;
 *  - every other non-empty line is a paragraph (authored guidebooks are
 *    line-oriented);
 *  - inline: ***both***, **bold**, *italic*; unmatched or empty markers
 *    stay literal text — a stray asterisk can never swallow the rest of
 *    the line.
 */

export type InlineSpan = { text: string; bold: boolean; italic: boolean };

export type GuidebookBlock =
  | { kind: "heading"; level: 1 | 2 | 3; spans: InlineSpan[] }
  | { kind: "paragraph"; spans: InlineSpan[] }
  | { kind: "bullets"; items: InlineSpan[][] };

const INLINE_TOKEN = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g;

export function parseInline(text: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE_TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) spans.push({ text: text.slice(last, index), bold: false, italic: false });
    const token = match[0];
    if (token.startsWith("***")) {
      spans.push({ text: token.slice(3, -3), bold: true, italic: true });
    } else if (token.startsWith("**")) {
      spans.push({ text: token.slice(2, -2), bold: true, italic: false });
    } else {
      spans.push({ text: token.slice(1, -1), bold: false, italic: true });
    }
    last = index + token.length;
  }
  if (last < text.length) spans.push({ text: text.slice(last), bold: false, italic: false });
  return spans.length > 0 ? spans : [{ text: "", bold: false, italic: false }];
}

export function parseGuidebook(markdown: string): GuidebookBlock[] {
  const blocks: GuidebookBlock[] = [];
  let bullets: InlineSpan[][] | null = null;
  const flushBullets = () => {
    if (bullets && bullets.length > 0) blocks.push({ kind: "bullets", items: bullets });
    bullets = null;
  };

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();
    if (line === "") {
      flushBullets();
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushBullets();
      const level = Math.min(heading[1].length, 3) as 1 | 2 | 3;
      blocks.push({ kind: "heading", level, spans: parseInline(heading[2]) });
      continue;
    }
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      bullets = bullets ?? [];
      bullets.push(parseInline(bullet[1]));
      continue;
    }
    flushBullets();
    blocks.push({ kind: "paragraph", spans: parseInline(line) });
  }
  flushBullets();
  return blocks;
}
