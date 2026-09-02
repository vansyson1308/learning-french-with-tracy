# Known limitations and open issues (Phase-10 close, updated by the V1 publication program)

Severity scale: **P0** data loss / crash / false claim that blocks release ·
**P1** major functional defect a learner would hit · **P2** minor defect or
measurable gap · **P3** cosmetic / register. Release **conditions** are
not defects; they are prerequisites the repository cannot satisfy by
itself.

**Open P0: none. Open P1: none.**

## Release conditions (external prerequisites)

| Condition | Owner action | Where |
|---|---|---|
| Store identity unproven — `com.ahmet.lingo` / EAS `c5e5ee9a…` / ASC `6781818623` / owner `ahmet909` are inherited from upstream | Option B chosen by the program (personal standalone identity); the owner confirms the identifier set once (OWNER DECISION), then `bun scripts/apply-identity.ts migrate …` applies it and `link` records the owner's EAS project / ASC app; the gate stays fail-closed until then | `RELEASE_IDENTITY.md`, `identity.json`, `PUBLISHING_RUNBOOK.md` B |
| Signing credentials and store accounts | Apple Developer Program + Play Console (personal), EAS project under the owner, EAS-managed or owner-held keys — never created here, never committed | `PUBLISHING_RUNBOOK.md` C–D, `APPLE_ACCOUNT_SETUP.md`, `GOOGLE_PLAY_ACCOUNT_SETUP.md` |
| Physical-device acceptance not run (no device in this environment) | walk the iPhone and Android matrices on the RC; record PASS/FAIL per row; DEVICE ACCEPTED requires zero open P0/P1 | `DEVICE_ACCEPTANCE.md` |
| Assistive-technology pass on devices (VoiceOver, TalkBack, Larger Text, contrast) | rows A1–A15 on both platforms; store accessibility claims wait for it (Reduce Motion is now explicit in code) | `ACCESSIBILITY_FINAL.md` |
| Device performance/memory soak not measured | the automated 50-day store soak passes; the device blocks (audio, speech, profiler) are an owner task | `SOAK_REPORT.md` |
| Hosted privacy-policy URL and support contact | the site (privacy, support, guide, licenses, accessibility, release) deploys from `main` via GitHub Pages; the owner enables Pages once if the first deploy asks, and supplies the public support email (never invented) | `PUBLICATION_STATUS.md`, `PRIVACY_FINAL.md`, `release/support-contact.json` |
| Legacy audio provenance | the 1,024 legacy recordings come from an undocumented TTS source in the upstream project; a provenance audit is a pre-commercial obligation (plan §I3.5) | `SECURITY_AUDIT.md` |

## P2 — minor defects and measurable gaps

| # | Item | Detail | Plan |
|---|---|---|---|
| L1 | Four Section-1 prompts have no bundled audio | *C'est un garçon.* / *C'est une fille.* replaced ungrammatical sentences whose recordings exist; no recording exists for the corrected sentences and the legacy manifest is immutable | add a pack-sentence mode to the Piper pipeline post-v1 (`CONTENT_REDTEAM.md` R1) |
| L2 | Web tier: static-export hydration notices (React #418/#419) and a `play()` interruption when leaving a screen mid-clip | no functional effect; React client-renders; the web audio player does not surface the media promise; counted (not failed) by the browser walks; web is the secondary tier | investigate when the web tier becomes a release target |
| L3 | Store download size unknown | only a universal debug-signed APK (135.8 MB) and a fat simulator bundle (126 MB) could be measured; the per-device AAB download and the App Store install size need an EAS/store build | measure from the first internal-track build |
| L4 | Speech recognition may use the network | when the OS has no on-device French model (older iOS, some Android OEM recognisers) the system service may send audio to the platform provider; the app discloses this before the first attempt and offers "skip speaking" | inherent to using the OS recogniser; disclosed in-app and in the policy |
| L5 | Speech quality across OEM recognisers untested | no device; the grader is deterministic over what the recogniser returns | device matrix |
| L6 | No Android Baseline Profile / startup optimisation | deliberately not added before a measurement exists | measure first (`PERFORMANCE.md`) |
| L7 | Extreme-timezone streak grandfathering | at UTC+14 a stored UTC-day equal to local-yesterday maps to local-today (the learner keeps the streak; never double-credited) | documented; tested in the Kiritimati lane |
| L8 | Telegraphic notes accepted by the writing rubric | *Salut Marie, café à deux heures* meets the note rubric by design (facts conveyed) | recorded in the dossier as a construct decision |
| L9 | Two liking verbs in one sentence trip the stuffing rule | *J'adore le thé et j'aime le pain* is refused with recoverable feedback | rare at A1; revisit if learner data shows it |

## P3 — cosmetic / register

| # | Item | Plan |
|---|---|---|
| L10 | Six partner lines in listening clips are curt or unidiomatic for a shopkeeper (*Vous voulez quoi ?*, *ça va seulement ?*, *votre boisson*, bare *un jus*) | re-synthesize with the dispatch-only audio pipeline post-v1 (`CONTENT_REDTEAM.md`, deferred table) |
| L11 | `package.json` `version` (1.0.0) differs from `expo.version` (1.1.0) | resolved by the identity migration (expo.version → 1.0.0, build 1) |
| L12 | Stored store listing (`STORE_METADATA.md`) was upstream's | replaced by `STORE_METADATA_FINAL.md` (owner-supplied fields marked, never invented) |

## Limitations by design (not defects)

- The AI tutor seam ships **disabled**; no model, key or endpoint exists in
  the app, and the app makes no network requests of its own.
- No accounts, no sync: progress lives on the device; backup is a manual
  export/import file.
- The seven non-French courses run on the legacy scheduler untouched; the
  French excellence layer is French-only.
- The A1 statement is a **CEFR-aligned A1 estimate** derived from the
  course's own checks; it is not an official or certified CEFR result and
  the assessment has no empirical validation (no response data, no item
  statistics, no standard setting) — `ASSESSMENT_DOSSIER.md`.
- No pronunciation scoring; spoken production is graded on what the
  recogniser transcribes.
- UI language is English only (no i18n).
- Web tier: the lexicon SQLite is replaced by a generated fallback; speech
  recognition is unavailable and the app says so.
