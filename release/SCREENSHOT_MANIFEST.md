# Screenshot manifest (Part IX)

Screenshots are evidence, not marketing art: every store screenshot is
captured from the **final release candidate** (the build number in
`RC_HISTORY.md`), shows the real UI with real content, carries no device
frame with a fabricated status bar, and is replaced whenever the RC
changes. Web-tier previews exist for the documentation site only and are
labelled as such.

## Storyboard (same eight frames on every device class)

| # | Screen | How to reach it on the RC | Caption (optional, ≤ 40 chars) |
|---|---|---|---|
| 01 | Learn — the path (Section 1 with a few lessons done) | seed progress with the screenshot backup (below); Learn tab | Six sections, one path |
| 02 | Lesson — Choose exercise after a correct answer | Basics 1 lesson 1, answer the first item, before Continue | Learn with feedback |
| 03 | Today — session preview | Today tab, regular length | One session a day |
| 04 | Listening — player with Slow | *Écoute !* lesson 1, first item | Listen, replay, slow down |
| 05 | Speaking — *I heard:* result | Section 4 lesson, after one attempt (device only) | Speak and check |
| 06 | Writing — feedback naming a missing slot | Practice → Practice writing, submit a partial answer | Feedback that names it |
| 07 | Goals — CEFR-aligned A1 estimate with one skill partly shown | Goals after the section-1 checkpoint | Honest A1 estimate |
| 08 | Vocabulary — entry with gender, pronunciation, example | Vocabulary → any noun | A dictionary for every word |

Do not include: the onboarding grid (shows other languages more than
French), any screen with the speech notice mid-dialog, empty states.

## Seeding progress for frames 01/03/07

Use a backup file exported from a device where the section-1 lessons and
checkpoint were completed for real (P1 + I12 in `DEVICE_ACCEPTANCE.md`),
imported on the capture device via Profile → Import progress. Never hand-
edit the file; it must be a genuine export.

## Sizes and naming

| Store slot | Pixel size | Device / simulator | Files |
|---|---|---|---|
| App Store iPhone 6.9" (required) | 1320×2868 or 1290×2796 | iPhone 16 Pro Max / 15 Pro Max simulator or device | `store/ios/6.9/01-learn.png` … `08-vocabulary.png` |
| App Store iPhone 6.5" (optional, older) | 1284×2778 | iPhone 11 Pro Max class | `store/ios/6.5/…` |
| App Store iPad 13" (only if `supportsTablet` is true in app.json) | 2064×2752 or 2048×2732 | iPad Pro 13" simulator | `store/ios/ipad-13/…` |
| Play phone (required, 2–8) | 1080×2400 (16:9–9:16 within 320–3840 px) | Pixel 8 emulator or device | `store/android/phone/01-learn.png` … |
| Play 7" / 10" tablet (only if tablets are targeted) | 1600×2560 | Pixel Tablet emulator | `store/android/tablet/…` |
| Play feature graphic (required) | 1024×500 | rendered from `assets/brand/icon.svg` — mark + app name on the brand blue, no screenshot inside | `store/android/feature.png` |

PNG, no alpha (iOS rejects alpha), sRGB. Light mode for all eight; a dark
set (`…-dark.png`) may be added for frames 01, 03, 07.

## Capture commands (from the RC build, not a dev client)

iOS simulator:

```
xcrun simctl list devices | grep -i "iphone 16 pro max"
xcrun simctl boot "iPhone 16 Pro Max"
# install the RC .app / .ipa from the EAS build page
xcrun simctl install booted <path-to-RC.app>
xcrun simctl launch booted <bundle id from release/identity.json>
xcrun simctl io booted screenshot store/ios/6.9/01-learn.png
```

iPhone device: capture with the side + volume-up buttons, AirDrop the
PNGs, keep the original resolution.

Android emulator or device:

```
adb devices
adb install -r <RC.apk>            # or install the internal-testing build from Play
adb shell settings put system screen_brightness 255
adb exec-out screencap -p > store/android/phone/01-learn.png
```

Feature graphic: `node scripts/render-brand-assets.mjs` produces the icon
set; the 1024×500 feature graphic is rendered by the same script's
`feature` variant once the identity is confirmed (name text on the
graphic must be the confirmed display name).

## Web-tier previews (documentation only)

`node e2e/screenshots.mjs dist dist-screens` captures frames 01–04, 06–08
from the web export at 430×932 css px @3× (1290×2796). They are used on
the website's overview page and in `docs/USER_GUIDE.md` if illustrations
are added; they are **never** uploaded to a store (web rendering, no
native status bar, no speech frame).

## Record

| Store | Device class | RC build | Captured on | By | Files |
|---|---|---|---|---|---|
| | | | | | |
