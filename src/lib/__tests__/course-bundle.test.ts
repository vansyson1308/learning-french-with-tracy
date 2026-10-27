/**
 * P3g B: course content is loaded on demand. The app never imports every
 * course statically; a bundle loads through COURSE_LOADERS; readers do not
 * memoise the empty view of a course that is not loaded yet.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";

import { COURSE_LOADERS } from "../../content/course-loaders";
import { memoByCourse } from "../content-registry";
import { courseBundle, hasCourse, isCourseLoaded, loadCourse } from "../course-bundle";

const ROOT = path.resolve(import.meta.dir, "../../..");

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) return name === "__tests__" ? [] : sources(p);
    return /\.(ts|tsx)$/.test(name) ? [p] : [];
  });
}

describe("course bundles (P3g)", () => {
  test("no app module imports every course statically", () => {
    const banned = [/content\/course-bundles["']/, /content\/packs\/index["']/, /content\/packs["']/, /content\/artifacts["']/, /content\/artifacts\/index["']/, /content\/audio-manifest["']/];
    const offenders: string[] = [];
    for (const dir of ["src/app", "src/components", "src/lib"]) {
      for (const file of sources(path.join(ROOT, dir))) {
        const text = readFileSync(file, "utf8");
        if (banned.some((re) => re.test(text))) offenders.push(path.relative(ROOT, file));
      }
    }
    expect(offenders).toEqual([]);
  });

  test("every shipped course has a loader, and a loader yields its bundle", async () => {
    const catalog = JSON.parse(readFileSync(path.join(ROOT, "src/content/catalog.json"), "utf8")) as { courses: { id: string }[] };
    for (const c of catalog.courses) expect(hasCourse(c.id)).toBe(true);
    const bundle = await COURSE_LOADERS["es-vi"]();
    expect(bundle.id).toBe("es-vi");
    expect(bundle.pack.sections.length).toBeGreaterThan(0);
    expect(Object.keys(bundle.audio).every((k) => k.startsWith("es-vi:"))).toBe(true);
    const frVi = await COURSE_LOADERS["fr-vi"]();
    expect(Object.keys(frVi.audio).every((k) => k.startsWith("fr-en:"))).toBe(true); // fr-vi plays fr-en's clips
  });

  test("loadCourse resolves registered bundles and rejects unknown courses", async () => {
    expect(isCourseLoaded("es-vi")).toBe(true); // registered by the test setup
    expect((await loadCourse("es-vi")).id).toBe("es-vi");
    expect(courseBundle("es-vi")?.artifacts.dailyWords).toBeDefined();
    await expect(loadCourse("zz-none")).rejects.toThrow("Unknown course");
  });

  test("a memo never caches the empty view of a course that is not loaded", () => {
    let builds = 0;
    const view = memoByCourse((id) => {
      builds += 1;
      return id;
    });
    view("zz-none");
    view("zz-none");
    expect(builds).toBe(2);
    view("es-vi");
    view("es-vi");
    expect(builds).toBe(3);
  });
});
