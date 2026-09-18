# Security audit — whole repository (2026-09-18)

Scope: the repository `vansyson1308/learning-french-with-tracy` at `main`
`5dd38be` (after the Android RC2 program), audited as a whole: the shipped
app (Expo 57 / React Native, Android and iOS configuration, web tier), the
content and audio pipelines, every GitHub Actions workflow, the public
documentation site, dependencies, secrets (working tree and full history)
and the repository's GitHub settings that are visible without admin
rights. Method: static review plus tool runs listed in §7; nothing was
changed by the audit itself. The earlier Phase 10 audit
(`SECURITY_AUDIT.md`, secrets and supply chain, 2026-09-02) stays valid and
is extended here.

## 1. Verdict

**No secret is exposed, no exploitable vulnerability was found in the
application, and the app's privacy claims hold** (it makes no network
request of its own, stores nothing outside its private storage, and hardens
the one untrusted input it accepts — an imported backup file). Every
finding below is hygiene or governance: how the repository and its
workflows are protected, and one privacy-accuracy detail in the Android
configuration.

| Severity | Count | Findings |
|---|---|---|
| Critical | 0 | — |
| High | 0 | — |
| Medium | 3 | M1 disclosure route (Issues disabled, no SECURITY.md) · M2 unprotected `main` with write-capable workflows · M3 mutable action tags |
| Low | 7 | L1 expression interpolation in dispatch workflows · L2 CI token permissions · L3 `allowBackup` vs privacy wording · L4 public artifacts · L5 runtime advisory (deep-link DoS) · L6 build-time advisories · L7 destructive template script |
| Informational | 3 | I1 personal support mailbox · I2 EAS internal links · I3 site CSP |

Nothing here blocks the Android RC2 program or a store submission; M1–M3
are worth doing before the app is public on a store because that is when
the repository becomes a target.

Update, same day: every repository-side patch in §5 is applied in PR #27
(§8 records what is fixed, what only the owner can change in the GitHub
settings, and what is accepted as is).

## 2. Findings

Severity scale: P0 = exploitable now / data loss / privacy breach; Medium =
weakens a control that protects the code, the signing key or the release
path; Low = best practice with a real but narrow effect; Informational =
a fact to know, no action required.

### M1 — Vulnerability reports have no working route (Medium)

- GitHub **Issues are disabled** on the repository (`has_issues: false`;
  `/issues/new/choose` answers 404), yet the website's Support page, the
  privacy page, the user guide, `release/support-contact.json` and the four
  issue templates under `.github/ISSUE_TEMPLATE/` all direct people to
  GitHub Issues. There is no `SECURITY.md`, so GitHub shows no security
  policy and a researcher has no stated channel except the provisional
  support mailbox.
- Effect: bug and security reports bounce or land in a personal inbox with
  no triage record.
- Fix (owner, GitHub UI + one file):
  1. Settings → General → Features → enable **Issues** (the templates then
     work as documented).
  2. Settings → Code security → enable **Private vulnerability reporting**
     (reports become private security advisories instead of public issues).
  3. Add `SECURITY.md` (proposed text in §5.1) naming the private reporting
     form and the support email, and asking reporters not to file
     vulnerabilities as public issues.

### M2 — `main` is unprotected while six workflows can write to the repository (Medium)

- `main` has no branch protection or ruleset (`protected: false`): force
  pushes and deletion are possible, no status check is required, and the
  automation credential merged every program PR without a required review.
- Six workflows hold `contents: write` on the default `GITHUB_TOKEN`:
  `pack-audio.yml`, `reception-audio.yml`, `lexique-source.yml` (commit and
  push generated content to the dispatched branch), `eas-build.yml` (push
  the one-time `eas init` commit), `android-direct-apk.yml` (create a
  GitHub Release), `pages.yml` (`pages: write`, `id-token: write`). Combined
  with M3, a compromised third-party action inside any of them could push
  to `main` or publish a release.
- Fix (owner, GitHub UI): Settings → Rules → Rulesets → new branch ruleset
  for `main`: require a pull request before merging, require the status
  checks `checks (UTC)`, `checks (America/Los_Angeles)`, `checks (Asia/Tokyo)`,
  `checks (Pacific/Kiritimati)`, `checks (Pacific/Pago_Pago)` and
  `export-size` to pass, block force pushes and deletions. A solo owner can
  leave "required approvals" at 0 and still get the status-check gate.
  Optionally restrict who can push (the audio and lexique workflows push to
  the *dispatched* branch, which is never `main` in practice — dispatch
  them on a topic branch).

### M3 — Third-party actions are pinned by mutable tags (Medium)

- Every `uses:` reference is a major tag: `actions/checkout@v4`,
  `actions/setup-java@v4`, `actions/setup-node@v4`, `actions/setup-python@v5`,
  `actions/upload-artifact@v4`, `actions/download-artifact@v4`,
  `actions/configure-pages@v5`, `actions/upload-pages-artifact@v4`,
  `actions/deploy-pages@v4`, `oven-sh/setup-bun@v2`,
  `reactivecircus/android-emulator-runner@v2`. A tag can be moved to new
  code by the action's maintainer or an attacker who takes over the
  repository or a maintainer account; the affected workflows hold write
  tokens (M2), the Pages OIDC token, the owner's `EXPO_TOKEN` (`eas-build.yml`)
  and the direct-APK signing keystore secrets (`android-direct-apk.yml`).
- Fix: pin each action to the full commit SHA of the release you use,
  with the version in a comment (`uses: actions/checkout@<40-hex-sha> # v4.x.y`),
  and add the Dependabot `github-actions` ecosystem (§5.2) so the SHAs are
  bumped by reviewed pull requests. Settings → Actions → General can
  additionally restrict actions to GitHub-authored and verified creators.

### L1 — Workflow inputs interpolated into shell (Low)

- `${{ inputs.base_url }}` (`site-verify.yml`), `${{ inputs.artifact }}`
  (`android-emulator-smoke.yml`), `${{ github.ref_name }}` (commit steps of
  `pack-audio.yml`, `reception-audio.yml`, `lexique-source.yml`) and
  `${{ needs.deploy.outputs.page_url }}` (`pages.yml` verify job) are
  expanded inside `run:` blocks before the shell sees them. Branch names may
  contain `$`, `;`, `&`, `|`, quotes; free-text inputs may contain anything.
  `${{ inputs.mode }}` is a `choice` input and therefore constrained by
  GitHub — safe as written.
- Exploitability is limited: every affected workflow is `workflow_dispatch`
  only, which requires write access, and `pull_request` never reaches them.
- Fix: pass values through `env:` and reference the variable (pattern in
  §5.3). Zero behaviour change.

### L2 — `ci.yml` relies on the default token permissions and has no timeouts (Low)

- `ci.yml` (the only workflow that runs on `push` and `pull_request`)
  declares no `permissions:` block, so its `GITHUB_TOKEN` gets the
  repository default (read-only on repositories created after February
  2023, but a setting rather than a guarantee), and no `timeout-minutes`.
- Fix: `permissions: contents: read` at the top of `ci.yml` and
  `timeout-minutes: 30` on both jobs (§5.4). Also confirm Settings →
  Actions → General → Workflow permissions = "Read repository contents and
  packages permissions".

### L3 — Android `allowBackup="true"` versus the privacy wording (Low, privacy accuracy)

- The generated manifest carries Expo's default
  `android:allowBackup="true"` with no `fullBackupContent` /
  `dataExtractionRules`. Android Auto Backup may therefore copy the app's
  private data (progress store, review log, assessment state) to the
  user's Google Drive through the operating system, and `adb backup` can
  extract it on older Android versions.
- The privacy policy says progress "stays in the app's private storage on
  your device" and describes only the backups the learner creates with
  Export. The data is not sensitive (no credentials, no audio, no
  transcripts), but the statement is not exact on Android.
- Fix, either of: set `"android": { "allowBackup": false }` in `app.json`
  (the app already has its own Export/Import, and its progress data is
  under 2 MB) — or keep OS backup and add one sentence to the policy's
  "Backups you create" section disclosing that the operating system's own
  backup may include the app's data. Recommendation: `allowBackup: false`,
  which makes the policy true as written.

### L4 — Build outputs are public artifacts (Low)

- The repository is public, so any signed-in GitHub user can download
  workflow artifacts: the debug-signed QA APK (30 days), emulator
  screenshots, and — once RC2 is built by `eas-build.yml` — the signed RC
  APK plus `build-facts.json` containing the EAS artifact URL (90 days). The
  direct-APK workflow publishes to a GitHub Release by design.
- No secret is exposed; the effect is wider-than-intended distribution of
  pre-release builds and of the EAS internal link that
  `ANDROID_RC2.md` §4 wants kept to testers.
- Fix: `retention-days: 7` for `android-rc-*`, print `build-facts.json`
  only to the job summary instead of uploading it, and keep the QA APK's
  30 days (it is not signed for distribution).

### L5 — Runtime dependency advisory reachable through deep links (Low, accepted)

- `decode-uri-component@0.2.2` (GHSA-vcc3-ghjq-m6fr, moderate: exponential
  decoding of malformed percent-encoded input) is reached through
  `expo-router → query-string@7.1.3`, which parses incoming URLs. A crafted
  `learningfrenchtracy://…` or `https` link with pathological percent
  encoding could freeze the app when the user opens it (local denial of
  service; force-closing the app recovers; no data is affected).
- Not patchable by an override today: the fixed release 0.5.0 is ESM-only
  while `query-string@7` loads it with CommonJS `require`, and every
  `expo-router@57.x` (latest 57.0.21) pins `query-string ^7.1.3`.
- Disposition: accepted with monitoring — re-check at the next Expo SDK
  upgrade; a Dependabot alert (§5.2) tracks it.

### L6 — Build-time dependency advisories (Low, accepted)

- `image-size@1.2.1` (two high advisories: ICNS, JXL/HEIF parser infinite
  loops) is used by Metro to read image dimensions at bundle time;
  `uuid@7.0.3` (moderate, v3/v5/v6 buffer bounds) sits under the `xcode`
  config plugin. Both run only on the build machine over files in this
  repository; exploitation requires committing a crafted file, which the
  owner controls. Neither is in the shipped app bundle.
- `image-size` 2.x changes the API Metro uses, so a forced override is not
  safe. Disposition: accepted; tracked by Dependabot; resolved by the
  upstream Metro/Expo updates.

### L7 — Destructive template script still wired (Low)

- `scripts/reset-project.js` (create-expo-app leftover) is reachable as
  `bun run reset-project` and deletes or moves `src/` and `scripts/`. Not
  exploitable remotely; an integrity foot-gun for anyone who runs the wrong
  script.
- Fix: delete the file and the `reset-project` entry in `package.json`.

### I1 — Personal mailbox published as the support address (Informational)

- `duymank250997@gmail.com` appears in 13 tracked files and on the public
  website and store drafts, by the owner's decision (provisional). Expect
  spam and phishing attempts against that mailbox; a dedicated alias can be
  swapped in later through `release/support-contact.json` alone.

### I2 — EAS internal-distribution links are open to anyone who has them (Informational)

- Already recorded in `ANDROID_RC2.md`: the preview build's install page
  is link-accessible. Keep it in the private records, not on the website.

### I3 — Static site has no Content-Security-Policy (Informational)

- The seven pages contain zero scripts, zero inline handlers and zero
  external resources, and all markdown is HTML-escaped before rendering
  (`scripts/build-site.ts`), so there is nothing for a CSP to block today.
  A `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:">`
  is a cheap belt-and-braces addition if the site ever gains scripts.

## 3. Controls verified as sound

| Area | Evidence |
|---|---|
| No network activity in the app | `grep` for `fetch`, `XMLHttpRequest`, `WebSocket`, analytics/crash SDKs across `src/`: none; the CI guide walk records 0 requests outside the app's own origin; no `expo-updates` dependency, and the generated manifest sets `expo.modules.updates.ENABLED=false` (no over-the-air code path) |
| Permissions | `INTERNET`, `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`, `VIBRATE` only; storage and overlay permissions removed with `tools:node="remove"`; CI fails if one returns; release APK is not debuggable (badging) |
| Untrusted input: backup import | `src/lib/persistence/backup-core.ts` copies onto fresh objects, drops `__proto__` / `constructor` / `prototype`, runs invariants on a scratch state, takes a safety copy, commits atomically and verifies the read-back; refusal paths tested |
| Untrusted input: deep links | `MainActivity` is exported with the `learningfrenchtracy` scheme (required); every dynamic route handles an unknown id (checkpoint → back to the path, guidebook → empty, lesson → resolver fallback, vocabulary → not-found state) — no crash path found |
| SQL | all lexicon queries are parameterized (`?`); search input is split on non-letter/non-digit characters before it reaches `MATCH`, so FTS syntax cannot be injected |
| Secrets | regex families (GitHub PAT, AWS, OpenAI-style, Slack, Google API, Hugging Face, JWT, PEM private keys, Expo token, base64 keystore) over the working tree and **every commit on every ref**: clean; no `.env`, key, keystore or `store.config.json` was ever committed; `.gitignore` excludes them |
| Signing and tokens in CI | keystore secrets reach `android-direct-apk.yml` only as environment variables, are decoded into `mktemp`, deleted right after signing and never printed; `EXPO_TOKEN` is passed only to the steps that call EAS; the identity gate refuses store profiles under an unconfirmed identity |
| Supply chain | `bun.lock` carries sha512 integrity for every package and CI installs with `--frozen-lockfile`; Bun blocks lifecycle scripts of untrusted packages by default; tool versions pinned (Bun 1.3.11, eas-cli 23.2.0, expo-doctor 1.20.4, piper-tts pinned in the audio manifest, faster-whisper 1.0.3); Lexique downloads verified by double download and hash comparison; Piper voices fetched at a pinned revision with recorded hashes; no `curl | sh` anywhere |
| Static site | no scripts, no external resources, markdown escaped, external links `rel="noopener"`, HTTPS verified by the Pages `verify` job |
| iOS | App Transport Security at its default (no exceptions), privacy manifest present, `ITSAppUsesNonExemptEncryption=false` |
| Data at rest | progress in app-private AsyncStorage, the lexicon a read-only SQLite asset, speech recordings in a temporary cache swept at the end of a session; nothing is logged except one migration counter and one scheduler error object |
| Licensing of the dependency tree | unchanged since `SECURITY_AUDIT.md`: permissive licences only in the shipped bundle |

## 4. GitHub settings to confirm (owner, not visible without admin rights)

1. Settings → Code security: **Dependabot alerts** and **Dependabot security
   updates** on; **Secret scanning** and **Push protection** on (GitHub
   enables both by default for public repositories — confirm);
   **Private vulnerability reporting** on (M1).
2. Settings → Actions → General: workflow permissions "Read repository
   contents and packages", and "Allow actions created by GitHub and
   verified creators" (M3).
3. Settings → Rules: the `main` ruleset from M2.
4. Settings → General → Features: Issues on (M1).

## 5. Patches (proposed by the audit; applied in PR #27 — status in §8)

### 5.1 `SECURITY.md`

```markdown
# Security policy

Learning French with Tracy runs entirely on the learner's device, makes no
network requests of its own and has no server, account or payment system.
Security reports are still welcome for the app, its build pipeline and
this repository.

- Preferred: GitHub's private vulnerability reporting for this repository
  (Security tab → Report a vulnerability).
- Alternative: email duymank250997@gmail.com with "SECURITY" in the subject.
- Please do not open a public issue for a vulnerability and do not send
  voice recordings or personal data.

Supported version: the latest release on the Releases page. We aim to
acknowledge a report within 7 days.
```

### 5.2 `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: weekly }
  - package-ecosystem: bun
    directory: /
    schedule: { interval: weekly }
    open-pull-requests-limit: 5
    groups:
      expo:
        patterns: ["expo*", "@expo/*", "react-native*", "@react-native/*"]
```

(If Dependabot does not recognise the `bun` ecosystem on this account,
use `npm` — it then reads `package.json` and opens the same advisory
pull requests without touching `bun.lock`; run `bun install` in the PR.)

### 5.3 Expression interpolation → environment variables (L1)

```yaml
      - name: Verify the live pages
        env:
          BASE_URL: ${{ inputs.base_url }}
        run: scripts/verify-site.sh "$BASE_URL"
```

Same shape for `inputs.artifact` (`android-emulator-smoke.yml`),
`needs.deploy.outputs.page_url` (`pages.yml`) and `github.ref_name`
(`BRANCH: ${{ github.ref_name }}` … `git push origin HEAD:"$BRANCH"`).

### 5.4 `ci.yml` permissions and timeouts (L2)

```yaml
permissions:
  contents: read
jobs:
  checks:
    timeout-minutes: 30
  export-size:
    timeout-minutes: 30
```

### 5.5 `app.json` (L3)

```json
"android": { "allowBackup": false, "package": "com.vansyson1308.learningfrenchwithtracy", … }
```

### 5.6 Action pinning (M3)

Replace each `@vN` with the commit SHA of the release in use, keeping the
version as a comment; Dependabot (§5.2) then proposes updates. Do not copy
SHAs from anywhere but the action's own Releases page.

### 5.7 `package.json` / `scripts/reset-project.js` (L7)

Delete `scripts/reset-project.js` and the `"reset-project"` script.

### 5.8 Artifact exposure (L4)

In `eas-build.yml`: `retention-days: 7` for `android-rc-${{ inputs.profile }}`
and drop `build-facts.json` from the uploaded directory (it is already in
the job summary).

## 6. Not in scope / not testable here

- Runtime behaviour on a physical phone (microphone, speech service,
  TalkBack) — the RC2 device packets.
- GitHub settings behind admin rights (§4) — the API answers 403 without
  authentication.
- EAS project settings (the project does not exist yet).

## 7. Tool runs (2026-09-18, `main` `5dd38be`)

| Check | Command | Result |
|---|---|---|
| Dependency advisories | `bun audit` (Bun 1.3.11) | 4 advisories: 2 high (`image-size`, build-time), 2 moderate (`decode-uri-component` runtime via expo-router; `uuid` build-time) — L5, L6 |
| Secrets, working tree | `git grep` with the regex families listed in §3 | clean |
| Secrets, history | `git log --all -p` filtered on the same families + file-name scan for key/env files ever added | clean |
| Workflow analysis | YAML parse of all 11 workflows: triggers, permissions, timeouts, `uses:` pins, `${{ }}` inside `run:`, secrets usage, unsafe shell patterns | M2, M3, L1, L2 |
| Android manifest | `expo prebuild --platform android` (inspected, then discarded) | L3; permissions and exported components as expected |
| App code | grep for network clients, analytics SDKs, `eval` / `innerHTML` / `WebView` / `Linking.openURL`, `console.*`, string-built SQL, deep-link parameter handling | clean (§3) |
| Static site | scripts, inline handlers, external resources, escaping in `scripts/build-site.ts` | clean; I3 |
| Repository settings | REST API without authentication | public, `main` unprotected, Issues disabled, no `SECURITY.md`, no `dependabot.yml` — M1, M2 |

## 8. Remediation status (2026-09-18, PR #27)

| Finding | Status | Where |
|---|---|---|
| M1 disclosure route | **Repository side done**: `SECURITY.md` (private vulnerability reporting preferred; the support mailbox with "SECURITY" in the subject as the fallback; no public issues, no recordings; acknowledgement within 7 days). **Owner**: switch on Issues and private vulnerability reporting (§4) | `SECURITY.md`, README pointer |
| M2 unprotected `main` | **Owner only** — a ruleset on `main` is a repository setting, not a file (§4) | — |
| M3 mutable action tags | **Fixed**: all 41 `uses:` across the 11 workflows are pinned to a full commit SHA with the version tag kept as a comment; `.github/dependabot.yml` (github-actions weekly) moves the SHA and the comment together. Each SHA is the commit GitHub's own runner resolved for that tag in this repository's job logs ("Set up job" → `Download action repository … (SHA:…)`: checkout, setup-bun, setup-python and upload-artifact from run 33231288258; download-artifact, setup-java and android-emulator-runner from the emulator-smoke runs; configure-pages, upload-pages-artifact and deploy-pages from the Pages runs) — not copied from a third party. `eas-build.yml` no longer uses `actions/setup-node` (that workflow has never run here, so no runner-resolved SHA existed; the runner image's own Node ≥ 20 serves `npx eas-cli`) | `.github/workflows/*.yml`, `.github/dependabot.yml` |
| L1 expression interpolation | **Fixed**: every `${{ }}` that used to be expanded into a `run:` script now arrives through `env:` — `MODE_INPUT` and `BRANCH` (pack-audio, reception-audio, lexique-source), `ARTIFACT_NAME` (android-emulator-smoke), `BASE_URL` (site-verify), `PAGE_URL` (pages); the run id uses `$GITHUB_RUN_ID`. A YAML walk over all workflows finds no expression inside any `run:` block | six workflows |
| L2 CI token / timeouts | **Fixed**: `permissions: contents: read` and `timeout-minutes: 30` on both jobs | `ci.yml` |
| L3 `allowBackup` | **Fixed**: `expo.android.allowBackup: false`; `expo prebuild --platform android` now emits `android:allowBackup="false"` (verified, native directory discarded). Privacy policy 1.1 (effective 2026-09-18) adds one paragraph on device backups: iPhone backups can include the app's private storage; Android opts out, so progress is copied off the phone only by the learner's own export | `app.json`, `src/lib/privacy-policy.ts`, `release/PRIVACY_POLICY.md` |
| L4 public artifacts | **Fixed**: `retention-days: 7`; `build-facts.json` (EAS artifact URL) is no longer copied into the uploaded directory — it stays in the job summary | `eas-build.yml` |
| L5, L6 advisories | **Accepted** as analysed above; the Dependabot `bun` entry opens the fix when one exists (`decode-uri-component` is still not overridable — it needs every `expo-router` 57.x to move off `query-string` 7) | `bun audit` |
| L7 destructive script | **Fixed**: `scripts/reset-project.js` and the `reset-project` script are gone | `package.json` |
| I1 support mailbox | Informational, owner's choice — unchanged | — |
| I2 EAS internal links | Informational, inherent to internal distribution — unchanged | — |
| I3 site CSP | **Fixed**: every generated page carries `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'">`; the built site still has no script, no inline style attribute and no external resource (only outbound `href` links) | `scripts/build-site.ts` |

Verification of the patched tree (local, then CI on PR #27): YAML parse of
all 11 workflows (every `uses:` a 40-hex SHA, no `${{` inside any `run:`);
`expo prebuild --platform android` manifest shows `android:allowBackup="false"`;
`tsc --noEmit` clean; `expo lint` clean; `bun run test` 1184 pass under UTC
and UTC+14; `bun run test:integration` 69 pass; `content:check`,
`audio:check` (713 files) pass; `release:identity` passes for the default and
`preview` profiles and refuses `production`; `scripts/build-site.ts` builds
8 pages, all with the CSP tag, 0 scripts, 0 inline styles.

### Still owner-only (GitHub settings, in this order)

1. Settings → General → Features: **Issues** on.
2. Settings → Code security: **Private vulnerability reporting** on (the
   route `SECURITY.md` points to); **Dependabot alerts** and **Dependabot
   security updates** on; confirm **Secret scanning** and **Push protection**
   are on.
3. Settings → Actions → General: workflow permissions **Read repository
   contents and packages**; **Allow actions created by GitHub and verified
   creators** (the pinned actions are all by GitHub, Oven and
   ReactiveCircus).
4. Settings → Rules → New branch ruleset for `main`: require a pull request,
   require status checks to pass (the six CI checks: `checks (UTC)`,
   `checks (America/Los_Angeles)`, `checks (Asia/Tokyo)`,
   `checks (Pacific/Kiritimati)`, `checks (Pacific/Pago_Pago)`,
   `export-size`), block force pushes, restrict deletions. Bypass list:
   nobody (the maintainer merges through pull requests too).
