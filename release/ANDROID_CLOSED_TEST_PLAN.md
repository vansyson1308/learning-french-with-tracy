# Android closed test plan (§36)

Applies if the Play Console requires a closed test before production access
for this new personal account (currently: at least 12 testers opted in for
14 continuous days — **VERIFY IN CONSOLE**).

## Targets

| Item | Target |
|---|---|
| Testers recruited | 15–20 people (buffer above the 12 required, so one drop-out does not reset the clock) |
| Minimum continuous duration | 14 days with ≥ 12 testers opted in at all times |
| Accounts | each tester's own Google account, given to the owner in advance for the tester list |
| Devices | at least two Android OEMs (for example Samsung + Pixel) and Android 10 or newer |

The coding agent cannot create testers. Real people supply real accounts.

## Timeline

1. **Day −7**: recruit; collect Google account emails; send `docs/BETA_TESTER_GUIDE.md`.
2. **Day 0**: upload the RC AAB to the **closed testing** track (track name "v1-closed"); add the tester list (email list); copy the opt-in URL into the message below; note the date in `RC_HISTORY.md`.
3. **Days 1–14**: testers install and use the app; owner watches the Console's tester count daily (must stay ≥ 12) and the crash/ANR panel.
4. **Day 3, 7, 11**: reminder message to testers.
5. **Day 14+**: apply for production access from the Console (it asks about the test); answer from the feedback form results.

## Tester onboarding message (template)

> Subject: Testing Learning French with Tracy (Android) — 14 days
>
> Thanks for helping. Steps: (1) sign in on your phone with the Google account you gave me; (2) open this link and tap "Become a tester": OPT-IN URL; (3) install from the Play Store link on that page; (4) use the app a few minutes a day for two weeks — a lesson, a Today session, one speaking exercise, one backup export; (5) report anything odd with the templates in the guide (never send voice recordings). Please stay opted in for the full 14 days — dropping out resets the requirement for everyone.

## Reminder message (template)

> Quick reminder: please open Learning French with Tracy today, do one lesson or Today session, and tell me anything that felt wrong. Two more weeks of daily testing and we can publish. Thank you!

## Feedback form (fields)

Device model · Android version · What you did today (Learn / Today / Listening / Speaking / Writing / Conversation / Backup) · Anything that failed or confused you · Would you keep using it? (yes / maybe / no) · Free text.

Collect through GitHub Issues (templates) or a simple form the owner hosts; the agent aggregates results into `DEVICE_ACCEPTANCE.md` and the RC bug loop.

## Test scenarios (what testers should cover at least once)

1. Fresh install → onboarding → Learn tab.
2. Starting-point check with at least one "I don't know".
3. Two lessons with every exercise type; system back button in a lesson (should confirm before leaving).
4. Today session; Undo this review; Can't speak now.
5. Listening: play, replay, Slow.
6. Speaking: permission grant on first use; deny on a second device if possible; the network-possible notice; record, stop, "I heard"; skip.
7. Writing and conversation once each.
8. Checkpoint 1.
9. Export progress → import progress.
10. Large font size; TalkBack for one lesson (optional but valuable).
11. Background the app while recording; return.
12. Bluetooth headphones during listening (if available).

## Exit criteria

- ≥ 12 testers opted in continuously for 14 days (Console confirms).
- No P0/P1 from testers open at the end; P2s triaged into `KNOWN_LIMITATIONS.md` or fixed with a new RC (a new RC re-uploaded to the same track does not reset the clock).
- Production access granted by Google.
