# Store metadata — final v1 drafts (Part IX)

The listing copy for both stores, written to what the app verifiably does
(`docs/USER_GUIDE_VALIDATION.md`) and to the policies in
`MONETIZATION_POLICY_V1.md` and `PRIVACY_FINAL.md`. Owner-supplied fields
are marked **OWNER** and are never invented here. Character limits are the
stores' current ones (`PUBLICATION_RESEARCH.md`).

## Claims policy

Allowed: free; no ads; no account; works offline (with the speech
exception stated); spaced repetition (FSRS); listening/reading/speaking/
writing/conversation practice; checkpoints; "CEFR-aligned A1 assessment";
"an estimate from this course's own checks".

Forbidden: "certified", "official CEFR", "recognised by", "guaranteed",
"fluent in N weeks", "AI tutor" (disabled), "100 % offline" (speech may use
the OS service), "native speaker recordings" (audio is synthesized),
"no data ever leaves your phone" (same speech exception), any number of
users/ratings, any comparison to other apps by name.

## Identity (after the owner's YES on the identity decision)

| Field | Value |
|---|---|
| Name (App Store 30 / Play 30) | Learning French with Tracy |
| Subtitle (App Store, 30) | Learn French offline, free |
| Short description (Play, 80) | Free French course: lessons, listening, speaking, writing — offline, no ads. |
| Bundle ID / package | per `release/identity.json` after confirmation |
| Category | Education (primary); Play: Education |
| Price | Free · no in-app purchases |
| Ads | None (Play "Contains ads": No; App Store no ad identifier) |
| Age rating | Apple questionnaire: no objectionable content → 4+; Play IARC questionnaire: no violence/sexual content/language/gambling/user interaction → Everyone / PEGI 3 |
| Target audience (Play) | 13 and over (not designed for children — no children-specific requirements claimed) |
| Privacy policy URL | https://vansyson1308.github.io/learning-french-with-tracy/privacy/ (live only after the site deploys; verify HTTP 200 before submission) |
| Support URL | https://vansyson1308.github.io/learning-french-with-tracy/support/ |
| Marketing URL | https://vansyson1308.github.io/learning-french-with-tracy/ |
| Support email / phone | **OWNER** |
| Seller / developer name | **OWNER** (personal accounts show the legal name) |
| Copyright | **OWNER** ("© year name"; the app's code is MIT, derivative of Lingo Lessons by Open Apps Studio — keep the notice in the listing's description or licenses page, see below) |

## Description (App Store ≤ 4000, Play full description ≤ 4000)

Learning French with Tracy is a free French course for English speakers. Everything runs on your phone: no account, no advertising, no analytics.

WHAT YOU GET
• A learning path in six sections: everyday basics; gender, articles, high-yield verbs, cognates and numbers; listening and reading; speaking; writing; and short conversations with a partner voice.
• Today: one session a day, built from what your memory needs — reviews first, then new material from your current unit, then mixed practice.
• Spaced repetition (FSRS): every word, sound and phrase gets a memory card that your answers move forward.
• Listening clips with a slow replay, reading passages with tap-to-look-up words, speaking exercises checked by your device's speech recognition, guided writing with feedback that names exactly what is missing.
• A rich dictionary for every word in the course: gender, pronunciation, example, confusable words.
• Checkpoints at the end of each section and an A1 capstone; a Goals screen that shows what you have demonstrated.
• A starting-point check if you have studied French before.
• Backup and restore of your progress as a file you keep.

HONEST ABOUT WHAT IT IS
The Goals screen shows a CEFR-aligned A1 estimate from this course's own checks. It is not an official CEFR examination and not a certificate; an official level comes only from an accredited examination.

PRIVACY
Your progress stays on your phone. The app makes no network requests of its own. Speaking exercises use your device's speech recognition; on a device without an offline French model that service may use the internet, which the app tells you before your first attempt — and speaking is always skippable.

Seven other beginner courses inherited from the open-source Lingo Lessons base (Spanish, German, Italian, Portuguese, Japanese, Korean, Chinese) are included in their original, simpler form.

Open source (MIT), built on Lingo Lessons by Open Apps Studio. Audio synthesized with Piper voices; lexical data from Lexique 4 (CC BY-SA 4.0). Full credits inside the app under Licenses & attributions.

## Keywords (App Store, ≤ 100 characters, comma-separated, no spaces after commas)

french,learn french,french course,vocabulary,spaced repetition,listening,speaking,a1,offline,flashcards

## Promotional text (App Store, ≤ 170, optional)

Free French from zero to your first conversations — offline, no ads, no account. Version 1.0.

## What's new (v1.0.0)

First release.

## Play-specific answers

| Question | Answer |
|---|---|
| App access | All functionality available without special access (no login) |
| Ads | No |
| Content rating (IARC) | complete the questionnaire truthfully: no violence, no sexual content, no profanity, no controlled substances, no gambling, no user-generated content, no user interaction, no sharing of location, no purchases |
| Target audience & content | 13+ (not designed for children) — see `PRIVACY_FINAL.md` |
| Data safety | per `PRIVACY_FINAL.md` (no collection; the recorded fallback if the console requires declaring the OS speech transmission) |
| News app / COVID / Financial / Health / Government | No |
| Store listing contact | **OWNER** email (required and public) |

## App Store–specific answers

| Question | Answer |
|---|---|
| App Privacy | Data Not Collected (`PRIVACY_FINAL.md`) |
| Export compliance | uses only OS-provided encryption; `ITSAppUsesNonExemptEncryption = false` is set in app.json |
| Content rights | the app contains only content the owner has rights to distribute (MIT base, CC BY/CC0 voices, CC BY-SA lexical data — credited) |
| Age rating | 4+ |
| Sign-in required for review | No (no accounts); reviewer notes in `PRIVACY_FINAL.md` |
| Accessibility Nutrition Labels | only features marked PASS in `ACCESSIBILITY_FINAL.md` after the device pass |

## Screenshots

Per `SCREENSHOT_MANIFEST.md`: captured from the final RC on device/
simulator, no mock UI, no placeholder art, current build number recorded.
