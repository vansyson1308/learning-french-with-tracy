# Flakes — CI runs that failed and passed on the same commit

Each entry: the failing run, the passing re-run on the **same** commit, what failed, and what was changed so the next one costs less. A failure is only recorded here after a re-run on the same commit was green; a second red on the same commit is a bug, not a flake.

## 2026-11-05 — Device acceptance on `main` 749c0143 (after PR #66, zh-vi) and on PR #67 3bbc624a

- **Failed:** in run [41941469339](https://github.com/vansyson1308/learning-french-with-tracy/actions/runs/41941469339) (main) and run [41941519738](https://github.com/vansyson1308/learning-french-with-tracy/actions/runs/41941519738) (PR #67), attempt 1, at the same time. Only the API 34 **lessons** shard failed, both times on the same flow: "lesson en-vi — Scrolling DOWN until id: courses-course-en-vi is visible … FAILED" (the retry failed too), then "audio events en-vi — no playback event although 1057 clips are bundled". The second step depends on the first. On main, onboarding (vi) had also passed only on its retry. API 30 lessons and every other shard were green.
- **Passed:** attempt 2 of both runs on the same commits, all 6 shards green. PR #66 itself had passed this shard.
- **Pattern:** this is the second time `switchCourse` failed its scroll to a course card on API 34 lessons (fr-vi on 2026-10-31, en-vi now). The list grew to include zh-vi in #66, so the card sits lower and the scroll does more work. Follow-up when work resumes: in `scripts/device/maestro-flows.ts` `switchCourse`, open the course through a deep link or scroll with a lower visibility percentage, so that a slow emulator cannot fail the whole lesson flow. Not done now because the owner paused the work.

## 2026-11-04 — Device acceptance on `main` fca73ec (after PR #65, D-16)

- **Failed:** run [41887905668](https://github.com/vansyson1308/learning-french-with-tracy/actions/runs/41887905668) attempt 1, API 30 **backup-upgrade** only. The first failure was "onboarding after pm clear", which ran for about 10 minutes and failed on the retry. The backup import and re-export that come after it then failed on `profile-stat`. The same flows passed on API 34, and the RC3 upgrade flows later in the same API 30 shard passed.
- **Passed:** attempt 2 of the same run, with the failed job re-run on the same commit; all 6 shards green.
- **Changed:** nothing. The app restart after a FAIL (flow-runner `restart_app`) did not stop the two backup steps from failing, because they depend on the onboarding that failed. If "onboarding after pm clear" fails again on API 30, look at that flow first.

## 2026-11-02 — Device acceptance on `main` 4a8d1e8 (after PR #60)

- **Failed:** run [41525391190](https://github.com/vansyson1308/learning-french-with-tracy/actions/runs/41525391190) attempt 1: API 34 **core** and API 30 **backup-upgrade**, before any test ran. `sdkmanager` reported "Error reading Zip content from a SeekableByteChannel" while installing a package from Google's repository (the API 34 system image; the emulator package on API 30), then the emulator never started. PR #60 changed only a CI workflow, a script and the owner checklist.
- **Passed:** attempt 2 of the same run (failed jobs re-run on the same commit), all 6 shards green.
- **Changed:** nothing; a corrupt download inside the emulator action is outside the suite. If it recurs, cache the SDK packages or add a retry around the action.

## 2026-10-31 — Device acceptance on `main` cc6c93f (after PR #57)

- **Failed:** run [41156642768](https://github.com/vansyson1308/learning-french-with-tracy/actions/runs/41156642768), 2026-10-31 01:42 UTC: API 34 **core** and API 34 **lessons**; the four API 30 / backup-upgrade shards were green.
  - core: the first failure was `read & listen: story…` (the scroll to `stories-item-es.story.el_perro_de_ana` timed out); every later flow of the shard then failed too (`session-check`, `checkpoint-speech-blocked`, `exam-overview`). One stuck screen failed the rest of the shard.
  - lessons: `courses-course-fr-vi` not found, then "no playback event although 164 clips are bundled".
- **Passed:** re-run [41457803396](https://github.com/vansyson1308/learning-french-with-tracy/actions/runs/41457803396) on the same commit cc6c93f, 2026-11-02: all 6 shards green. The same code had also passed on `audio/voice-lineage` (run 41418559883).
- **Not noticed for two days:** nobody read `main` after the merge. Rule since QC 2026-11-02: a red `main` is the first thing checked on every wake.
- **Changed so a cascade cannot hide the cause** (`scripts/device/flow-runner.sh`, on `audio/voice-lineage`): after a failed attempt and after a FAIL, the runner force-stops the app and starts it again on its home route, so the next flow starts from a known screen. The report keeps the first failed flow on its own line (`**First failure:**`). Tested without an emulator by `scripts/device/test-flow-timeout.sh`.
