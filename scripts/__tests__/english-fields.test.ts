import { describe, expect, test } from "bun:test";
import { englishFieldErrors, looksVietnamese } from "../lib/english-fields";

describe("english fields (QC 2026-10-29 §1.3)", () => {
  test("Vietnamese text in an en field is caught", () => {
    expect(looksVietnamese("Tổng điểm — cả bốn phần")).toBe(true);
    expect(looksVietnamese("số điện thoại")).toBe(true);
    expect(looksVietnamese("Gửi")).toBe(true);
  });

  test("French, Spanish, German and Portuguese accents are not Vietnamese", () => {
    expect(looksVietnamese("Être and avoir — the two anchor verbs")).toBe(false);
    expect(looksVietnamese("Masculine exceptions: le côté, l'été")).toBe(false);
    expect(looksVietnamese("¿Dónde está la estación? — Größe, Straße")).toBe(false);
    expect(looksVietnamese("São Paulo, coração, avó")).toBe(false);
  });

  test("a quoted Vietnamese word or one proper name inside English is allowed", () => {
    expect(looksVietnamese("Vietnamese uses 'là' for identity and 'đang, ở' for states.")).toBe(false);
    expect(looksVietnamese("Vietnamese says «tôi đã đi»; Spanish changes the verb.")).toBe(false);
    expect(looksVietnamese("My surname is Nguyễn.")).toBe(false);
  });

  test("an en copied from its vi sibling is caught even when few words carry Vietnamese letters", () => {
    expect(looksVietnamese("Teil 2 — Bốn thông báo")).toBe(false);
    expect(englishFieldErrors({ title: { vi: "Teil 2 — Bốn thông báo", en: "Teil 2 — Bốn thông báo" } }, "f.json")).toEqual([
      'english-fields: f.json title.en is Vietnamese: "Teil 2 — Bốn thông báo"',
    ]);
    expect(englishFieldErrors({ name: { vi: "Berlin", en: "Berlin" } }, "f.json")).toEqual([]);
  });

  test("a copy with an accent outside the target alphabet is Vietnamese; the target's own words pass", () => {
    const doc = { a: { vi: "Tên", en: "Tên" }, b: { vi: "Größe", en: "Größe" }, c: { vi: "le côté", en: "le côté" } };
    expect(englishFieldErrors(doc, "content/de/writing/tasks.json")).toEqual(['english-fields: content/de/writing/tasks.json a.en is Vietnamese: "Tên"', 'english-fields: content/de/writing/tasks.json c.en is Vietnamese: "le côté"']);
    // ê is French: a lone "Tên" copy in French content is not distinguishable by letters alone.
    expect(englishFieldErrors(doc, "content/fr/pedagogy/concepts.json")).toEqual(['english-fields: content/fr/pedagogy/concepts.json b.en is Vietnamese: "Größe"']);
  });

  test("errors name the file and the path; only en keys are checked", () => {
    const doc = {
      passRule: { groups: [{ title: { vi: "Tổng điểm", en: "Tổng điểm — cả bốn phần" } }] },
      other: { vi: "lời chào", en: "greeting" },
    };
    expect(englishFieldErrors(doc, "content/de/exam/x.json")).toEqual([
      'english-fields: content/de/exam/x.json passRule.groups[0].title.en is Vietnamese: "Tổng điểm — cả bốn phần"',
    ]);
  });
});
