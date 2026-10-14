# STATUS — milestone tracker (Claude Code updates this at the end of every session)

| id | milestone | branch / PR | status | date | notes |
|---|---|---|---|---|---|
| P0 | Local signed APK (RC3) + small fixes | `phase-0/rc3-local-apk` (PR pending push) | done (device test pending) | 2026-10-14 | toolchain installed; 7 small fixes + library-permission block, all gates green locally and on CI (5 TZ); release APK built and **signed by the owner** (`579a3906…7a9f`, signer `d280d1de…3182`); PR #28 merged; phone packets 0–3 and tag `v1.0.0-rc.3` still owner actions |
| P1a | Golden tests | `phase-1/golden-tests` / [PR #29](https://github.com/vansyson1308/learning-french-with-tracy/pull/29) | done | 2026-10-14 | compile manifest (45 files + SQLite logical dump) + 54 runtime snapshots (session, today, evidence, assessment, lexicon, grading, migrations); `bun scripts/golden.ts --check|--update --reason`; CI step "Golden tests" in all 5 TZ lanes; compiler artifact assembly extracted to `scripts/lib/compile-artifacts.ts` (zero drift) |
| P1b | CourseProfile decouple | `phase-1/course-profile` / PR_P1B | in progress — gates running | 2026-10-14 | compiler-generated course profiles + id registries + per-course artifact modules; language plugins `src/lib/languages/*`; every runtime module takes courseId; speech/UI language-neutral; `no-fr-hardcode` + es-en FSRS throwaway tests; goldens byte-identical (only new generated files blessed) |
| P1c | Schema/compiler generalise | – | not started | | |
| P1d | Persistence v4 | – | not started | | |
| P2a | i18n Vietnamese UI | – | not started | | |
| P2b | fr-vi | – | not started | | |
| P3a | Lexicon ETL v2 (en) | – | not started | | |
| P3b | Audio pipeline v2 | – | not started | | |
| P3c | Authoring toolkit | – | not started | | |
| P3d(es) | es-vi A1 + DELE A1 track | – | not started | | |
| P4a | inherited fixes / retire -en packs | – | not started | | |
| P3d(de/it/pt) | de-vi, it-vi, pt-vi | – | not started | | |
| P4b | CJK plugins | – | not started | | |
| P4c–e | ja-vi, zh-vi, ko-vi | – | not started | | |
| P4f | en-vi (recommended) | – | not started | | |
| P5a–f | breakthrough features | – | not started | | |
| P6a–b | brand, store, acceptance | – | not started | | |

Owner actions outstanding:
1. **P0 phone test** — enable USB debugging, `adb install out\learning-french-with-tracy-v1.0.0-rc.3.apk`, run packets 0–3 from `release/ANDROID_RC3.md` §4, reply with the PACKET lines + files from `out\packets`. (No device result observed yet.)
2. **P0 tag** — after PR #28 is merged: `git tag -a v1.0.0-rc.3 <merge-commit> -m "v1.0.0-rc.3" && git push origin v1.0.0-rc.3` (the session cannot push tags).
3. Keep `C:\keys\lft-upload.jks` + both passwords backed up offline in two places (never in a plain text file).
