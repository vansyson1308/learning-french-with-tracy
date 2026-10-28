# P3h-fix — PR #43: API 30 emulator job hangs 3½ h and ends "cancelled" (coordinator QC 2026-10-28)

## Diagnosis (from run 40540164089, job "Emulator API 30", artifact device-report-api30)
- API 34: **success** (49 min). Build jobs + all 12 classic checks: success. Only API 30 is the problem.
- API 30 log: 8 checks PASS up to `exam mock: reading part` (16:46:27). Then `flow "lesson de-en"` starts: `logs/lesson_de-en.log` is **0 bytes**, no `maestro/07-lesson-de-en` output dir was ever created, and the last Maestro driver activity in logcat is 16:46:24. Nothing happens until the job's 210-min `timeout-minutes` kills it at 20:05:56 → conclusion **cancelled**.
- So the **Maestro CLI hung at start-up** (before connecting to its on-device driver) — not the app: logcat shows no crash/ANR for the app. `acceptance.sh` runs `maestro test` with no per-flow timeout, and the CLI has analytics/update checks enabled (`MAESTRO_CLI_NO_ANALYTICS` not set).
- Why the agent never woke up: a job killed by `timeout-minutes` is **cancelled**, not **failed** — auto-fix/notifications fire on failures, so nobody was told. A hang must become a fast, explicit failure.

## Fix (all in this PR)
1. **Per-flow hard timeout** in `run_flow`: `timeout --kill-after=30s "${FLOW_TIMEOUT:-600}" "$MAESTRO" test …`; exit 124/137 → record `FAIL … (timeout after Ns)` and still run the one retry. On timeout, before retrying, collect diagnostics into `logs/<flow>.hang/`: `adb shell dumpsys activity top`, `adb exec-out screencap -p`, `adb shell ps -A | grep -i maestro`, `adb devices -l`, the CLI's own log (`~/.maestro/tests/*/maestro.log`, newest), then reset the driver: `adb shell am force-stop dev.mobile.maestro; adb shell am force-stop dev.mobile.maestro.test; adb forward --remove-all; pkill -f maestro-cli || true`.
2. **Disable Maestro network side-calls**: in the workflow env `MAESTRO_CLI_NO_ANALYTICS: "1"`, `MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED: "true"`, and `MAESTRO_DRIVER_STARTUP_TIMEOUT: "120000"` (ms). Pin `--device emulator-5554` on every `maestro test`.
3. **Suite watchdog**: wrap the whole `acceptance.sh` in `timeout 75m` inside the runner script and set the job `timeout-minutes: 90`, so a residual hang ends as **failure** with the report uploaded (the `if: always()` steps already exist) — never as "cancelled" after 3½ h.
4. **Shard the suite** so each job stays well under the limit and failures localise: matrix `api: [34, 30]` × `shard: [core, lessons, backup-upgrade]` (core = onboarding/screens/today/checkpoint/speech/exam; lessons = per-course lesson + audio evidence; backup-upgrade = export/pm clear/import + RC3 upgrade). Each shard boots its own emulator. Keep all shards required for merge.
5. **Stale-driver hygiene between flows**: after each flow that ends with `stopApp`, call `adb shell am force-stop dev.mobile.maestro.test` only if a timeout happened (do not restart the driver on every flow — it slows API 34).
6. Unit-test the timeout path: a fake `MAESTRO` that sleeps forever must produce `FAIL (timeout)` within FLOW_TIMEOUT+30 s and a `.hang/` diagnostics folder (bash test run in CI on ubuntu, no emulator needed).
7. Re-run CI. If API 30 still times out on `lesson de-en` specifically with the driver healthy, read the hang diagnostics and fix the real cause; do **not** drop API 30 or mark it optional without writing the reason in `plan/reports/P3h.md` and asking the coordinator.

## Waking up reliably
After pushing, do not rely only on PR auto-fix: schedule your own check-in (session wake-up/reminder) for when the slowest shard should be done (≈ 60 min), read the run conclusion via the API, and continue (fix or merge). Never leave a PR red without a scheduled follow-up.

## Done when
PR #43: all shards on API 34 and API 30 green, total emulator wall time < 90 min per shard, hang path tested; merged; then P4a.
