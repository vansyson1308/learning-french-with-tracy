/**
 * The local-Windows-build read limiter (scripts/lib/fs-read-limit.cjs): Metro's
 * asset Promise.all over > 8,192 files hit EMFILE on Windows. The wrapper must
 * cap concurrency, keep every result and error, and install only once.
 */
import { describe, expect, test } from "bun:test";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { installReadLimit } = require("../lib/fs-read-limit.cjs") as {
  installReadLimit: (target: { readFile: (...a: unknown[]) => Promise<unknown> }, limit: number) => unknown;
};

function fakeFs() {
  let inFlight = 0;
  let peak = 0;
  const target = {
    readFile: async (name: unknown) => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 1));
      inFlight--;
      if (name === "bad") throw new Error("ENOENT bad");
      return `bytes:${String(name)}`;
    },
  };
  return { target, peak: () => peak };
}

describe("installReadLimit", () => {
  test("caps concurrent reads and returns every result in order", async () => {
    const { target, peak } = fakeFs();
    installReadLimit(target, 4);
    const names = Array.from({ length: 50 }, (_, i) => `f${i}`);
    const out = await Promise.all(names.map((n) => target.readFile(n)));
    expect(out).toEqual(names.map((n) => `bytes:${n}`));
    expect(peak()).toBeLessThanOrEqual(4);
  });

  test("a failed read rejects that call only and frees its slot", async () => {
    const { target } = fakeFs();
    installReadLimit(target, 1);
    const results = await Promise.allSettled([target.readFile("bad"), target.readFile("ok")]);
    expect(results[0].status).toBe("rejected");
    expect(results[1]).toEqual({ status: "fulfilled", value: "bytes:ok" });
  });

  test("installing twice does not stack wrappers; a bad limit is refused", async () => {
    const { target } = fakeFs();
    const original = installReadLimit(target, 2);
    const wrapped = target.readFile;
    expect(installReadLimit(target, 2)).toBe(original);
    expect(target.readFile).toBe(wrapped);
    expect(() => installReadLimit(fakeFs().target, 0)).toThrow(/positive integer/);
  });
});
