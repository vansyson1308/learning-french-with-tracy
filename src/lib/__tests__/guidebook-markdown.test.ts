/**
 * Guidebook markdown-subset parser (§50): emphasis renders instead of being
 * stripped, structure is line-oriented, and malformed markers degrade to
 * literal text instead of swallowing the line.
 */
import { describe, expect, test } from "bun:test";

import { parseGuidebook, parseInline } from "../guidebook-markdown";

const plain = (text: string) => ({ text, bold: false, italic: false });
const bold = (text: string) => ({ text, bold: true, italic: false });
const italic = (text: string) => ({ text, bold: false, italic: true });

describe("parseInline", () => {
  test("bold, italic, and combined emphasis", () => {
    expect(parseInline("Le **chat** est *petit*.")).toEqual([
      plain("Le "),
      bold("chat"),
      plain(" est "),
      italic("petit"),
      plain("."),
    ]);
    expect(parseInline("***très important***")).toEqual([
      { text: "très important", bold: true, italic: true },
    ]);
  });

  test("unmatched or empty markers stay literal", () => {
    expect(parseInline("2 * 3 = 6")).toEqual([plain("2 * 3 = 6")]);
    expect(parseInline("un *mot")).toEqual([plain("un *mot")]);
    expect(parseInline("****")).toEqual([plain("****")]);
  });

  test("French accents and apostrophes pass through emphasis", () => {
    expect(parseInline("**l'été** à *Paris*")).toEqual([
      bold("l'été"),
      plain(" à "),
      italic("Paris"),
    ]);
  });
});

describe("parseGuidebook", () => {
  test("headings clamp to three levels and carry emphasis", () => {
    const blocks = parseGuidebook("# Un\n## Deux\n#### Profond **fort**");
    expect(blocks).toEqual([
      { kind: "heading", level: 1, spans: [plain("Un")] },
      { kind: "heading", level: 2, spans: [plain("Deux")] },
      { kind: "heading", level: 3, spans: [plain("Profond "), bold("fort")] },
    ]);
  });

  test("consecutive bullets group; blank lines separate; both markers work", () => {
    const blocks = parseGuidebook("- un\n* deux\n\n- trois");
    expect(blocks).toEqual([
      { kind: "bullets", items: [[plain("un")], [plain("deux")]] },
      { kind: "bullets", items: [[plain("trois")]] },
    ]);
  });

  test("an italic line is a paragraph, never a bullet (marker needs a space)", () => {
    expect(parseGuidebook("*juste en italique*")).toEqual([
      { kind: "paragraph", spans: [italic("juste en italique")] },
    ]);
  });

  test("paragraphs are line-oriented and skip blanks", () => {
    expect(parseGuidebook("Bonjour.\n\nÇa va **bien**.")).toEqual([
      { kind: "paragraph", spans: [plain("Bonjour.")] },
      { kind: "paragraph", spans: [plain("Ça va "), bold("bien"), plain(".")] },
    ]);
  });

  test("a bullet run flushes before a heading", () => {
    expect(parseGuidebook("- a\n# Titre")).toEqual([
      { kind: "bullets", items: [[plain("a")]] },
      { kind: "heading", level: 1, spans: [plain("Titre")] },
    ]);
  });
});
