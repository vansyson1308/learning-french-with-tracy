import { describe, expect, test } from "bun:test";

import { resolveCourseRoles, type CourseRole } from "../lib/course-roles";
import { deriveProfiles, nativeArtifactPrefix, primaryNativeCodeOf } from "../lib/course-profiles";
import { loadPacks } from "../lib/pipeline";

const course = (id: string) => {
  const [targetCode, nativeCode] = id.split("-");
  return { id, targetCode, nativeCode };
};
const roles = (map: Record<string, CourseRole>) => (id: string) => map[id];

describe("course roles (P3d)", () => {
  test("no roles: the smallest native code is primary, the rest mirror it (P2b behaviour)", () => {
    const r = resolveCourseRoles("fr", [course("fr-vi"), course("fr-en")], roles({}));
    expect(r.primary?.id).toBe("fr-en");
    expect(r.mirrors.map((p) => p.id)).toEqual(["fr-vi"]);
    expect(r.standalone).toEqual([]);
    expect(r.errors).toEqual([]);
  });

  test("an explicit primary wins and a standalone course is neither primary nor mirror", () => {
    const r = resolveCourseRoles("es", [course("es-en"), course("es-vi")], roles({ "es-vi": "primary", "es-en": "standalone" }));
    expect(r.primary?.id).toBe("es-vi");
    expect(r.mirrors).toEqual([]);
    expect(r.standalone.map((p) => p.id)).toEqual(["es-en"]);
    expect(r.errors).toEqual([]);
  });

  test("standalone alone also moves the implicit primary off it", () => {
    const r = resolveCourseRoles("es", [course("es-en"), course("es-vi")], roles({ "es-en": "standalone" }));
    expect(r.primary?.id).toBe("es-vi");
  });

  test("two primaries, all-standalone and a shared native code are errors", () => {
    expect(resolveCourseRoles("es", [course("es-en"), course("es-vi")], roles({ "es-en": "primary", "es-vi": "primary" })).errors[0]).toMatch(/at most one/);
    expect(resolveCourseRoles("es", [course("es-en")], roles({ "es-en": "standalone" })).errors[0]).toMatch(/every course is/);
    const twins = [course("es-en"), { id: "es-en2", targetCode: "es", nativeCode: "en" }];
    expect(resolveCourseRoles("es", twins, roles({})).errors[0]).toMatch(/share native language/);
  });

  test("other targets' courses are ignored", () => {
    const r = resolveCourseRoles("fr", [course("fr-en"), course("es-vi")], roles({ "es-vi": "primary" }));
    expect(r.primary?.id).toBe("fr-en");
    expect(r.mirrors).toEqual([]);
  });

  test("artifact prefixes follow the role", () => {
    const packs = [course("es-en"), course("es-vi")];
    const r = roles({ "es-vi": "primary", "es-en": "standalone" });
    expect(primaryNativeCodeOf("es", packs, r)).toBe("vi");
    expect(nativeArtifactPrefix(course("es-vi"), packs, r)).toBe("es");
    expect(nativeArtifactPrefix(course("es-en"), packs, r)).toBe("es-en");
  });

  test("a standalone course reads only ids and its own lexicon, and keys its own audio", () => {
    const es = loadPacks()
      .map((p) => p.pack)
      .filter((p) => p.id === "es-en");
    expect(es.length).toBe(1);
    const vi = { ...es[0], id: "es-vi", nativeCode: "vi", nativeLanguage: "Vietnamese" };
    const present = [
      "src/content/ids/es.json",
      "src/content/lexicon/es-index.json",
      "src/content/lexicon/es-web-fallback.json",
      "src/content/lexicon/es-en-index.json",
      "src/content/lexicon/es-en-web-fallback.json",
      "src/content/concepts/es-concepts.json",
      "src/content/reception/es-listening.json",
      "src/content/reception/es-clip-assets.ts",
      "src/content/assessment/es-attainment.json",
    ];
    const profiles = deriveProfiles({
      packs: [es[0], vi],
      presentRelPaths: present,
      lexiconDbs: { es: { name: "es.db", contentHash: "a" }, "es-en": { name: "es-en.db", contentHash: "b" } },
      roleOf: roles({ "es-vi": "primary", "es-en": "standalone" }),
    });
    expect(Object.keys(profiles["es-en"].artifacts).sort()).toEqual(["ids", "lexiconDb", "lexiconFallback", "lexiconIndex"]);
    expect(profiles["es-en"].artifacts.lexiconIndex).toBe("src/content/lexicon/es-en-index.json");
    expect(profiles["es-en"].artifacts.lexiconDb).toBe("assets/lexicon/es-en.db");
    expect(profiles["es-en"].audioCourseId).toBeUndefined();
    expect(profiles["es-en"].role).toBe("standalone");
    expect(profiles["es-vi"].role).toBeUndefined();
    expect(profiles["es-vi"].artifacts.concepts).toBe("src/content/concepts/es-concepts.json");
    expect(profiles["es-vi"].artifacts.listening).toBe("src/content/reception/es-listening.json");
    expect(profiles["es-vi"].audioCourseId).toBeUndefined();
  });
});
