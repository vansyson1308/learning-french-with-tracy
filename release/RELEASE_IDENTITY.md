# Release identity audit (Phase 10 Gate 1)

**STORE DISTRIBUTION IDENTITY = BLOCKED** until the owner records
confirmation in `release/identity.json`.

## What the repository currently declares

| Field | Value | Where |
|---|---|---|
| Display name | Lingo Lessons | `app.json` `expo.name` |
| Slug / scheme | `lingo` / `lingo` | `app.json` |
| Expo account owner | `ahmet909` | `app.json` `expo.owner` |
| EAS project id | `c5e5ee9a-1aac-4b7c-ba0f-a97897c4d348` | `app.json` `extra.eas.projectId` |
| iOS bundle identifier | `com.ahmet.lingo` | `app.json` `ios.bundleIdentifier` |
| Android application id | `com.ahmet.lingo` | `app.json` `android.package` |
| App Store Connect app id | `6781818623` | `eas.json` `submit.production.ios.ascAppId` |
| Version scheme | `expo.version` 1.1.0, `appVersionSource: remote` (build numbers live on EAS) | `app.json`, `eas.json` |

## What is known about ownership

- This repository is a public fork of `Open-Apps-Studio/lingo-lessons`. Every
  value above is present, unchanged, in the upstream repository's history —
  they are the upstream author's Expo account, bundle identifier, EAS project
  and App Store record, not identifiers created for this fork.
- Nothing in this repository (no credentials, no store metadata export, no
  EAS project link the current user can open) demonstrates that the current
  project owner controls the `ahmet909` Expo account, the Apple Developer
  team that owns `com.ahmet.lingo`, the App Store Connect record
  `6781818623`, or a Google Play listing for `com.ahmet.lingo`.
- The four questions in the mandate (§8) therefore all resolve to **not
  provable from here**:
  1. Who owns the Expo project? — Unknown; the id belongs to the upstream account.
  2. Who owns the Apple bundle id? — Unknown; registered by the upstream author.
  3. Who owns the App Store Connect app record? — Unknown; upstream's live app.
  4. Who owns the Android application id / Play listing? — Unknown; no listing evidence either way.
  5. Are we updating upstream Lingo Lessons, or shipping a separate app? — **Owner decision; not inferable.**

## What Phase 10 did about it (no identity mutation)

- `release/identity.json` records the inherited identity verbatim with
  `ownership.status: "unconfirmed"` and `storeDistribution: "blocked"`.
- `scripts/lib/release-identity.ts` + `scripts/release-identity-gate.ts`
  implement a pure, fail-closed gate:
  - CI fails if `app.json`/`eas.json` identity fields drift from the record
    (an identity change must be a reviewed edit of the record, never a
    drive-by).
  - The `eas-build-pre-install` hook runs the gate on EAS Build: any profile
    whose `distribution` is not `internal` is refused while ownership is
    unconfirmed. Internal/development builds stay allowed.
  - A `confirmed` record must carry who, when, and evidence, or it is
    treated as unconfirmed.
- No value in `app.json`/`eas.json` was changed. No build was uploaded
  anywhere. No new bundle identifier or package name was invented.

## The decision the owner must make (exactly one of these)

**Option A — this fork is the continuing upstream app.** Prerequisites the
owner must hold personally: membership of the `ahmet909` Expo organisation
(or a transferred project), the Apple Developer team that owns
`com.ahmet.lingo` and app record `6781818623`, and (if Android is shipped)
the Play Console account for `com.ahmet.lingo`. Then edit
`release/identity.json`: `ownership.status: "confirmed"`, `confirmedBy`,
`confirmedOn`, at least one `evidence` line (e.g. "App Store Connect: Admin
role on app 6781818623"), `storeDistribution: "allowed"`. Nothing else
changes.

**Option B — this fork becomes a separate application.** The owner chooses
new, personally registered identifiers and updates, in one reviewed change:
`app.json` (`name`, `slug`, `scheme`, `owner`, `ios.bundleIdentifier`,
`android.package`, `extra.eas.projectId` — obtained from `eas init` under
the owner's account), `eas.json` (`submit.production.ios.ascAppId` for the
new App Store Connect record), `release/identity.json` (the same values plus
confirmation), the icon/splash if rebranding, and `README.md`. Existing MIT
and copyright notices are preserved regardless (they credit the upstream
authors and the Expo template; a rebrand never rewrites them).

Until one option is executed and recorded, the honest release state is:
**ENGINEERING COMPLETE — STORE DISTRIBUTION IDENTITY BLOCKED.**

## Version audit (§65)

- `app.json` `expo.version` is 1.1.0; `package.json` `version` is 1.0.0
  (cosmetic, not shipped). EAS `appVersionSource: remote` means the iOS
  build number and Android `versionCode` are held on EAS for project
  `c5e5ee9a…` — which this fork cannot read. Consequently no build number
  can be proposed with certainty.
- Proposed (record only, not applied): keep `expo.version` 1.1.0 for
  Option A only if the upstream store version is below 1.1.0; otherwise the
  owner sets the next semantic version. For Option B the first release is
  1.0.0 with build number / versionCode 1 under the new identity.
