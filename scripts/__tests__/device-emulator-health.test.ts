/**
 * Emulators that die (API 30, run after run on 2026-10-30): the emulator version
 * is pinned, the locale restart runs before install inside the health check, and
 * an unhealthy device gets exactly one wipe and reboot, which the report records.
 * The retry path itself is exercised by scripts/device/test-emulator-health.sh.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dir, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

describe("device acceptance: emulator boot", () => {
  // On Windows `bash` may resolve to WSL; the script runs in Git Bash by hand and here on Linux CI.
  test.skipIf(process.platform === "win32")(
    "healthy costs no reboot; dead gets one wipe and reboot; dead twice fails",
    () => {
      const run = spawnSync("bash", [join(ROOT, "scripts/device/test-emulator-health.sh")], { encoding: "utf8", timeout: 120_000 });
      expect(run.stdout).toContain("EMULATOR HEALTH TESTS PASSED");
      expect(run.status).toBe(0);
    },
    130_000,
  );

  test("the workflow pins the emulator and shares its options with the retry", () => {
    const wf = read(".github/workflows/device-acceptance.yml");
    // Its framework restart races the emulator-runner's own adb commands ("Broken pipe").
    expect(wf).not.toMatch(/EMULATOR_OPTIONS: .*-change-locale/);
    expect(wf).toContain("emulator-options: ${{ env.EMULATOR_OPTIONS }}");
    expect(wf).toContain("avd-name: ${{ env.AVD_NAME }}");
    // A silent emulator update is what the API 30 deaths line up with.
    expect(wf).toMatch(/emulator-build: "\d+"/);
  });

  test("the locale restart and the health check come before the app is installed, and every report carries the retry count", () => {
    const sh = read("scripts/device/acceptance.sh");
    const health = sh.indexOf("if ! ensure_healthy");
    expect(health).toBeGreaterThan(0);
    expect(health).toBeLessThan(sh.indexOf('adb install "$APK"'));
    expect(sh.indexOf("BOOT_PREPARE=locale_vi")).toBeGreaterThan(0);
    expect(sh.indexOf("BOOT_PREPARE=locale_vi")).toBeLessThan(health);
    // Every function it needs is defined before the call.
    for (const fn of ["set_locale() {", "wait_framework() {", "start_logcat() {"]) expect(sh.indexOf(fn)).toBeLessThan(health);
    expect(sh).toContain("record_infra");
    expect(sh).toContain('record "emulator health" FAIL');
    const lib = read("scripts/device/emulator-health.sh");
    for (const check of ["get-state", "getprop sys.boot_completed", "pm path android", "-wipe-data"]) expect(lib).toContain(check);
  });
});
