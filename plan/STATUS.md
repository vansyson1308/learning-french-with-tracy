# STATUS — milestone tracker (Claude Code updates this at the end of every session)

| id | milestone | branch / PR | status | date | notes |
|---|---|---|---|---|---|
| P0 | Local signed APK (RC3) + small fixes | `phase-0/rc3-local-apk` (PR pending push) | in progress — waiting for owner: keystore + phone | 2026-10-14 | toolchain installed; 7 small fixes committed (`94413f7`) + library-permission block (`e5dcfd0`), all local gates green; unsigned release APK built; signing + install are owner actions (`release/ANDROID_RC3.md` §3a–§4) |
| P1a | Golden tests | – | not started | | |
| P1b | CourseProfile decouple | – | not started | | |
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
1. **P0 sign RC3** — in `cmd.exe` at `C:\src\lft` run `plan\scripts\sign-apk-windows.cmd 3` (creates `C:\keys\lft-upload.jks` on first run; you type the passwords). Back up the `.jks` + passwords offline in two places.
2. **P0 install + phone packets 0–3** — enable USB debugging, `adb install out\learning-french-with-tracy-v1.0.0-rc.3.apk`, run the commands in `release/ANDROID_RC3.md` §4, reply with the PACKET lines + files from `out\packets`.
3. **P0 merge + tag** — merge PR #28 when CI is green, then `git tag -a v1.0.0-rc.3 e5dcfd015c407bf445afae9d517661f367934104 -m "v1.0.0-rc.3" && git push origin v1.0.0-rc.3` (the session cannot push).
4. Paste the non-secret `outc.3-signing-report.txt` back so the fingerprint/hash rows in `release/ANDROID_SIGNING.md`, `RC_HISTORY.md`, `ANDROID_RC3.md` can be filled.
