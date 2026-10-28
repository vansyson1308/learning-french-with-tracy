/**
 * P3h-fix: a hung `maestro test` must fail fast and loudly. The hang path
 * itself is exercised by scripts/device/test-flow-timeout.sh with a fake
 * Maestro that never returns (no emulator needed); the workflow checks pin
 * the shard matrix, the per-job limit and the suite watchdog.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dir, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

describe("device acceptance: hung Maestro", () => {
  // On Windows `bash` may resolve to WSL; the script runs in Git Bash by hand
  // and here on Linux CI.
  test.skipIf(process.platform === "win32")(
    "a fake Maestro that sleeps forever ends as FAIL (timeout) with .hang/ diagnostics",
    () => {
      const run = spawnSync("bash", [join(ROOT, "scripts/device/test-flow-timeout.sh")], {
        encoding: "utf8",
        timeout: 120_000,
      });
      expect(run.stdout).toContain("FLOW TIMEOUT TESTS PASSED");
      expect(run.status).toBe(0);
    },
    130_000,
  );

  test("every maestro test is time-boxed and pinned to the device", () => {
    const runner = read("scripts/device/flow-runner.sh");
    expect(runner).toMatch(/timeout --kill-after="\$FLOW_KILL_AFTER" "\$FLOW_TIMEOUT" \\\n\s+"\$MAESTRO" --device "\$DEVICE" test/);
    expect(read("scripts/device/acceptance.sh")).not.toMatch(/"\$MAESTRO" test/);
  });

  test("the workflow shards both API levels and ends a hang as a failure", () => {
    const wf = read(".github/workflows/device-acceptance.yml");
    expect(wf).toContain("api: [34, 30]");
    expect(wf).toContain("shard: [core, lessons, backup-upgrade]");
    expect(wf).toMatch(/name: Emulator API \$\{\{ matrix\.api \}\} \(\$\{\{ matrix\.shard \}\}\)\n\s+needs: \[build, build-rc3\]\n\s+runs-on: ubuntu-latest\n\s+timeout-minutes: 90\n/);
    expect(wf).toContain("script: timeout --kill-after=2m 75m bash scripts/device/acceptance.sh");
    expect(wf).toContain('MAESTRO_CLI_NO_ANALYTICS: "1"');
    expect(wf).toContain('MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED: "true"');
    expect(wf).toContain('MAESTRO_DRIVER_STARTUP_TIMEOUT: "120000"');
    expect(wf).not.toMatch(/continue-on-error/);
  });

  test("each shard runs its own part of the suite", () => {
    const sh = read("scripts/device/acceptance.sh");
    for (const shard of ["all", "core", "lessons", "backup-upgrade"]) expect(sh).toContain(`  ${shard})\n`);
    expect(sh).toContain("trap 'WATCHDOG=1; exit 1' TERM INT");
  });
});
