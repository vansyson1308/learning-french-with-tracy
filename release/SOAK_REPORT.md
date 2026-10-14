# Soak report (V1 publication, Part VI)

Two layers: an automated soak that drives the real store and engine through
fifty heavy days in the test runner (repeatable, runs in CI), and a device
soak the owner runs on the release candidate with the platform profilers
(the only place audio/speech memory and temp-file behaviour can be seen).

## Automated soak — `src/lib/__tests__/soak-cycles.test.ts`

Scenario per cycle (one calendar day, clock advanced by the test): a path
lesson of 11 graded steps + completion (perfect every other day) + an
immediate replay; a Today session of 20 assessments + completion XP; a
mistakes re-drill (practice role), clearing the mistake; a practice
session; every fifth day an export → staged import → invariant check of the
backup. Fifty cycles, evidence spread over all 126 curated French items in
two skills.

| Measure (Bun 1.3.11, this environment) | Result |
|---|---|
| Cycles completed | 50 |
| Review-log entries after 50 days | 1,600 of the 10,000 ring cap (≈1.0 MB serialized) |
| Cards created | 198 (item × skill), never more than one per key |
| Mistakes list | ≤ 1 at all times (duplicates never double) |
| Activity calendar | ≤ 70 days (pruned) |
| NaN / non-finite numbers in state | 0 |
| Backup round trips (days 5, 10, …, 50) | all staged and imported; invariants clean; day-50 import lossless |
| Cycle cost (35 store writes) | 30 ms on day 1 → 205 ms on day 50 |
| Heap after forced GC, every 10 cycles | 5.6 → 7.0 → 10.5 → 9.8 → 13.5 MB |

Reading the numbers:

- **Cost grows linearly with the review log, then plateaus.** Every store
  write re-serializes the whole persisted state (zustand persist), so one
  write costs ~0.2 ms per 100 KB of state in Bun. At the 10,000-entry cap
  the state is ≈ 6 MB and a write is on the order of 10–15 ms here; on a
  mid-range phone expect 3–5× that, per answered exercise, off the render
  path but on the JS thread. Bounded by design (ring cap), not a leak; a
  SQLite-backed log is the post-v1 remedy already named in the plan.
- **The heap after GC rises with the log** (the log lives in memory as
  well as on disk) and with the test's own bookkeeping; it does not climb
  once the log stops growing. Nothing else in the store accumulates.
- **Temporary audio**: covered by `speech-cache.test.ts` — every attempt's
  recording is deleted when its step ends and the `speech-attempts/`
  directory is swept at session boundaries; scored checks never keep a
  recording. This soak exercises the store, not the recorder.

The test fails if any bound is exceeded, if a cycle costs more than 400 ms,
if the growth is worse than linear in the log size, or if a backup stops
importing.

## Automated soak, two FSRS courses — `src/lib/__tests__/soak-two-courses.test.ts` (P1d)

Since persist v4 the cards and the review log live in the learner store,
not in the persisted blob. The second soak drives two FSRS courses
(`fr-en` and `es-en` with the FSRS capability forced on) for fifty days,
alternating course every day: per day one lesson (11 graded steps +
completion), one Today session (20 assessments + completion), one undo,
and a flush of the pending buffer after each; a course switch reloads the
active slice from the store. It runs twice — on the SQLite store through
`bun:sqlite` (the device path, same SQL and executor contract as
expo-sqlite) and on the JSON store (web / fallback).

| Measure (Bun 1.4.3, this environment) | SQLite store | JSON store |
|---|---|---|
| Cycles completed | 50 | 50 |
| Persisted blob (`progress-v2`) | 2.4 KB on day 1 → **19.3 KB on day 50** (limit 512 KB) | same |
| Blob ever carries `cards` / `reviewLog` | never | never |
| Learner store after 50 days | 1,500 log entries, 342 cards (≈ 1.0 MB as JSON) | same |
| Memory window (active course only) | 750 entries (cap 2,000) | same |
| Other course's cards in memory after a switch | 0 | 0 |
| Cycle cost (33 evidence writes + 3 flushes + reload) | 26 ms early → 58 ms late | 32 ms early → 157 ms late |
| Day-50 backup (envelope v2) | stages, invariants clean, both courses | same |

Reading the numbers:

- **The blob no longer grows with history.** Fifty heavy days leave it
  under 20 KB, two orders of magnitude under the 512 KB bound the test
  enforces; every store write re-serialises only this blob now.
- **SQLite commits are O(delta).** The late/early ratio stays ≈ 2 (the
  test allows 3): the extra cost is the course-switch reload of the 2,000-
  entry window and bun:sqlite overhead, not a trend with history.
- **The JSON store rewrites its whole document per flush**, so its cost
  grows linearly with the history (≈ 1 MB after fifty days → ~150 ms per
  day of three flushes). That is the web tier's and the test fallback's
  characteristic, recorded here; the device path is SQLite.
- The one-time import of a pre-v4 blob with 10,000 log entries and 800
  cards takes ≈ 200 ms on bun:sqlite (`learner-bootstrap.test.ts`, budget
  2 s).
- Timings are from a standalone run of the file; inside the full
  `bun run test` run (JIT warm, other suites resident) the same cycles
  measure 7 → 20 ms (SQLite) and 8 → 41 ms (JSON). Sizes and counts are
  identical in every run.

## Device soak — owner steps (release candidate build)

Prerequisites: an RC build installed from TestFlight / Play internal
testing (or the direct APK), the phone plugged into Xcode (Memory Report)
or Android Studio (Memory Profiler), Settings → the app has microphone and
speech permissions granted.

Run each block, then note memory and the temp directory state:

1. **Lessons ×20** — open a lesson, answer to the end (any answers), tap
   Continue on the summary, return to Learn. Every 5 lessons note memory.
2. **Today ×10** — Start today's session, complete it (skip speaking steps
   if you like), close the summary.
3. **Listening ×30** — in *Écoute !* lessons play every clip once at normal
   speed and once with Slow; leave the lesson without finishing it (the
   player must stop and release).
4. **Speaking ×20** — Section 4 lessons: 10 repetition attempts, then 10
   production attempts, each with Play back my recording once; after every
   5 attempts check the app's cache directory (iOS: Xcode → Devices →
   download container → `Library/Caches/speech-attempts`; Android:
   `adb shell run-as <package> ls cache/speech-attempts`) — it must be
   empty between steps.
5. **Vocabulary ×10** — open the browser, search three words, open two
   entries, back.
6. **Conversations ×5** — Have a conversation through to the end.
7. **Background/foreground ×10** — during a lesson and during a Today
   session: switch away for 30 s, come back; the step must resume without
   losing the answer in progress.
8. **Reopen** — force-quit, reopen: progress, streak and the lesson summary
   figures must match the Profile screen.

Pass criteria:

- Memory after block 2 sets the plateau; no block ends more than 25 % above
  it and the profiler shows no monotonic rise across blocks 3–7.
- `speech-attempts/` empty after every speaking step and after block 4.
- No crash, no frozen player, no orphaned recording, no "audio still
  playing" after leaving a lesson.
- Profile figures consistent with what was done (lessons, XP, streak).

Record results in `release/DEVICE_ACCEPTANCE.md` (soak rows) with device
model, OS version and build number.
