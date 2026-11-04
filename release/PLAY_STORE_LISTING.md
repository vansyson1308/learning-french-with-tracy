# Google Play store listing — closed test (D-16)

Scope: the **closed-testing** listing (D-16, owner 2026-11-03, coordinator
2026-11-05). No production release before v1.0. Wording follows the claims
policy in `STORE_METADATA_FINAL.md` (no "certified", no "100 % offline", no
"native speaker recordings", no user counts, no competitor names) and the
course facts at `main` 733552b: six main courses with an A1 claim gate that
says *claimable* (`content/reports/<lang>/cefr-claim-gate.json`), all
explained in Vietnamese; French also explained in English. zh-vi and ko-vi
are **not** listed until they merge. The small legacy packs still visible in
the app (Korean, Portuguese, Chinese — 5 units, explained in English) are not
advertised and are not used in screenshots.

Character counts are Unicode code points (Play limits: title 30, short 80,
full 4000). Re-check them in the Console field counters.

## Identity fields

| Field | Value |
|---|---|
| App name (title, ≤ 30) | `Learning French with Tracy` (26) — current `app.json` / `release/product.json` name. **OWNER (D-3):** a neutral brand is still to be chosen; the title can change later without a new package, the package cannot. |
| Package | `com.vansyson1308.learningfrenchwithtracy` (fixed at the first upload) |
| Default language | Vietnamese (`vi-VN`); second listing English (`en-US`) |
| App or game / free or paid | App · Free · no in-app purchases · no ads |
| Category | **Education** |
| Tags (pick in Console) | Language learning, Education |
| Contact email (public) | `duymank250997@gmail.com` (provisional, `release/support-contact.json`) — **OWNER confirms** |
| Website | https://vansyson1308.github.io/learning-french-with-tracy/ |
| Privacy policy URL | https://vansyson1308.github.io/learning-french-with-tracy/privacy/ (Vietnamese page: `…/vi/privacy/`) |

### Privacy policy URL — how it is published
`pages.yml` builds `dist-site/` with `scripts/build-site.ts`, which renders
`/privacy/` (English) and `/vi/privacy/` (Vietnamese) **from
`src/lib/privacy-policy.ts`** — the module the app shows and that
`release/PRIVACY_POLICY.md` is rendered from (`scripts/__tests__/privacy-policy.test.ts`
keeps the three identical). The workflow runs on every push to `main` that
touches `src/lib/privacy-policy.ts`, then `scripts/verify-site.sh` checks the
deployed pages over HTTPS. Policy **1.3 (2026-11-05)** — this branch — only
removes the French-only wording ("teaches beginner French", "French language
pack") so the policy matches a multi-course listing; nothing about data
handling changed. After merge, the Pages run publishes it; the owner opens the
URL once before entering it in the Console.

## Vietnamese listing (default)

**Short description (80):**
```text
Học tiếng Anh, Pháp, Tây Ban Nha, Đức, Ý, Nhật bằng tiếng Việt. Không quảng cáo.
```

**Full description:**
```text
Ứng dụng học ngoại ngữ cho người Việt, giải thích hoàn toàn bằng tiếng Việt. Miễn phí, không quảng cáo, không cần tài khoản.

SÁU KHOÁ CHÍNH, MỖI KHOÁ 27 CHƯƠNG (khoảng 108 bài) ĐẾN TRÌNH ĐỘ A1
• Tiếng Anh · Tiếng Pháp · Tiếng Tây Ban Nha · Tiếng Đức · Tiếng Ý · Tiếng Nhật
• Tiếng Pháp cũng có bản giải thích bằng tiếng Anh.

MỖI KHOÁ CÓ
• Phiên học hằng ngày: ôn trước, rồi bài mới, rồi luyện trộn — lịch ôn ngắt quãng FSRS cho từng từ và cụm từ.
• Nghe có nút nghe chậm, đọc truyện ngắn chạm-để-tra-nghĩa, luyện nói chấm bằng bộ nhận dạng giọng nói của máy, luyện viết có nhận xét chỉ rõ chỗ thiếu, hội thoại ngắn.
• Từ điển cho mọi từ trong khoá; kiểm tra đầu vào nếu bạn đã học trước.
• Bài kiểm tra cuối mỗi phần và màn hình Mục tiêu cho thấy bạn đã làm được gì.
• Luyện theo cấu trúc đề công khai: DELE A1 (Tây Ban Nha), Goethe-Zertifikat A1 (Đức), CILS A1 (Ý), JLPT N5 (Nhật), bậc 2 theo khung 6 bậc Việt Nam (Anh). Không phải đề thật.
• Tiếng Nhật: hiragana, katakana, kanji có cách đọc, âm Hán-Việt khi có.

TRUNG THỰC VỀ TRÌNH ĐỘ
Màn hình Mục tiêu cho một ước tính trình độ A1 theo khung CEFR, dựa trên các bài kiểm tra của chính khoá học. Đây không phải kỳ thi CEFR chính thức và không phải chứng chỉ; trình độ chính thức chỉ có qua kỳ thi của tổ chức được công nhận.
Nội dung được AI kiểm duyệt kỹ, chưa qua giáo viên bản ngữ. Các khoá Anh, Tây Ban Nha, Đức, Ý, Nhật đang mang nhãn Beta. Giọng đọc là giọng tổng hợp, không phải bản ghi người bản ngữ.

QUYỀN RIÊNG TƯ
Tiến độ học nằm trên điện thoại của bạn. Ứng dụng không tự gửi yêu cầu mạng nào, không phân tích dữ liệu, không quảng cáo. Riêng luyện nói dùng bộ nhận dạng giọng nói của hệ điều hành: trên máy không có gói nhận dạng ngoại tuyến cho ngôn ngữ đó, dịch vụ này có thể dùng Internet — ứng dụng báo trước, và phần nói luôn bỏ qua được.
Sao lưu: xuất tiến độ thành tệp do bạn giữ, nhập lại trên máy khác.

KHÔNG CÓ
Không năng lượng, không mạng sống, không bảng xếp hạng, không cửa hàng đá quý, không thông báo đẩy. Chỉ có chuỗi ngày học nhẹ nhàng.

Mã nguồn mở (MIT), dựa trên Lingo Lessons của Open Apps Studio. Dữ liệu từ vựng và giọng đọc có giấy phép mở; ghi công đầy đủ trong ứng dụng ở mục Giấy phép & ghi công.
```

## English listing (`en-US`)

**Short description (80):**
```text
Six beginner courses explained in Vietnamese, plus French for English speakers.
```

**Full description:**
```text
A language-learning app for Vietnamese speakers, with every explanation in Vietnamese — and a full French course explained in English. Free, no ads, no account.

SIX MAIN COURSES, 27 UNITS EACH (about 108 lessons), TO A1
• English · French · Spanish · German · Italian · Japanese — explained in Vietnamese
• French — also explained in English

IN EVERY COURSE
• A daily session: reviews first, then new material, then mixed practice, scheduled with FSRS spaced repetition for every word and phrase.
• Listening with a slow replay, short stories with tap-to-look-up words, speaking checked by your device's speech recognition, guided writing with feedback that names what is missing, short conversations.
• A dictionary for every word in the course; a starting-point check if you have studied before.
• Checkpoints at the end of each section and a Goals screen that shows what you have demonstrated.
• Exam-format practice built from public exam structures: DELE A1 (Spanish), Goethe-Zertifikat A1 (German), CILS A1 (Italian), JLPT N5 (Japanese), Vietnam's level 2 framework (English). Not real exam papers.
• Japanese: hiragana, katakana, kanji with readings, and Sino-Vietnamese readings where they exist.

HONEST ABOUT LEVELS
The Goals screen shows a CEFR-aligned A1 estimate from the course's own checks. It is not an official CEFR examination and not a certificate; an official level comes only from an accredited examination.
Content is carefully reviewed by AI, not yet by native-speaker teachers; the English, Spanish, German, Italian and Japanese courses carry a Beta label. Audio is synthesized, not recorded by native speakers.

PRIVACY
Your progress stays on your phone. The app makes no network requests of its own, has no analytics and no ads. Speaking practice uses your device's speech recognition: on a device without an offline model for that language, that system service may use the internet — the app tells you first, and speaking is always skippable.
Backups: export your progress as a file you keep, import it on another device.

NOT IN THIS APP
No energy, no hearts, no leagues, no gem shop, no push notifications. Just a gentle day streak.

Open source (MIT), built on Lingo Lessons by Open Apps Studio. Openly licensed word data and voices; full credits in the app under Licenses & attributions.
```

## "What's new" (release notes, ≤ 500)

```text
<vi-VN>
Bản kiểm thử kín đầu tiên: 6 khoá (Anh, Pháp, Tây Ban Nha, Đức, Ý, Nhật). Hãy thử một bài mỗi ngày và gửi góp ý theo hướng dẫn tester.
</vi-VN>
<en-US>
First closed-test build: six courses (English, French, Spanish, German, Italian, Japanese). Try a lesson a day and send feedback as described in the tester guide.
</en-US>
```

## Graphics

| Asset | Spec | Source / script | Status |
|---|---|---|---|
| App icon | 512×512 PNG | `release/store/play-icon-512.png` (`bun run brand:render`, `scripts/render-brand-assets.mjs`) | exists |
| Feature graphic | 1024×500 PNG/JPG, no alpha | `release/store/feature-graphic-1024x500.png` (same script; text from `release/product.json`) | exists — tagline says "French"; **re-render after D-3 / a multi-course tagline** in `release/product.json` (`tagline`), then `bun run brand:render` |
| Phone screenshots | 2–8, 1080×2400 class (Pixel 6 emulator gives 1080×2400), PNG, real UI | see the plan below | to capture |

### Screenshot plan (closed test; real native UI, no mock-ups)
Not captured in this task (no local emulator). Two routes, both from a
release-configuration build:

1. **CI emulator (preferred, nothing runs on the owner's PC):** `device-acceptance.yml`
   (Pixel 6 profile, API 34, x86_64) already takes Maestro screenshots
   (`scripts/device/maestro-flows.ts` → artifact `device-report-api34-<shard>/shots/`):
   `vi-learn`, `today`, `today-teach-card`, `story-reader`, `stories-list`,
   `exam-mock-intro`, `exam-mock-item`, `checkpoint-result`, `profile`. Pick from
   the latest green run on `main`; the acceptance APK only adds a hidden
   diagnostics route, the screens shown are the release screens.
2. **Phone later:** install from the closed-test track, `adb exec-out screencap -p > store/android/phone/NN-name.png` (`SCREENSHOT_MANIFEST.md`).

| # | Frame | Course | From |
|---|---|---|---|
| 01 | Learn path (Vietnamese UI) | en-vi | `vi-learn` |
| 02 | Today session preview | fr-vi or es-vi | `today` / `today-teach-card` |
| 03 | Story reader, tap-to-look-up | de-vi or it-vi | `story-reader` |
| 04 | Listening item with Slow | any -vi | add a Maestro `shot("listening-slow")` or phone |
| 05 | Japanese script lesson (kana / kanji + reading) | ja-vi | phone or a new flow |
| 06 | Exam-format practice intro | es-vi (DELE A1) or ja-vi (JLPT N5) | `exam-mock-intro` |
| 07 | Goals — A1 *estimate* wording visible | fr-vi | `checkpoint-result` / phone |
| 08 | Profile → Backup | any | `profile` |

Rules: Vietnamese UI for the `vi-VN` set, English UI for `en-US` (rerun the
flows with `UI_LANG=en`); no onboarding grid showing zh/ko; no speech notice
mid-dialog; no empty states. Record the RC build number in
`SCREENSHOT_MANIFEST.md`.

## App content answers (Play Console → Policy → App content)

| Section | Answer | Basis |
|---|---|---|
| Privacy policy | URL above | `PRIVACY_POLICY.md` 1.3 |
| App access | All functionality is available without special access (no login) | no accounts |
| Ads | No, the app does not contain ads | `MONETIZATION_POLICY_V1.md` |
| Content rating (IARC) | Email = contact email · Category: **Reference, News, or Educational** (VERIFY name in Console) · Violence: No · Sexual content / nudity: No · Profanity / crude humour: No · Controlled substances: **references only** — food-and-drink vocabulary and café/restaurant dialogues name drinks such as wine and beer (e.g. *vin*, *Bier*, *wine*, ビール); no use is shown or encouraged — answer *yes, references* if the question covers mentions · Gambling / simulated gambling: No · Fear / horror: No · User-generated content shared with others: No · Users interact or communicate: No · Shares user location: No · Digital purchases: No · Unrestricted internet / web browser: No (the app opens no web pages) | content grep 2026-11-05; `src/` has no external link |
| Expected rating | whatever IARC returns for the truthful answers (likely Everyone / PEGI 3, possibly a mild "alcohol reference" descriptor) — accept it; do not tune answers to a rating | — |
| Target audience | **13–15, 16–17, 18+** (not under 13) · "Appeals to children?": No · not enrolled in Designed for Families | `STORE_METADATA_FINAL.md`, `PRIVACY_FINAL.md` |
| News app | No | — |
| COVID-19 contact tracing / status | No | — |
| Data safety | see next section | `DATA_SAFETY.md` |
| Government app | No | — |
| Financial features | None | — |
| Health | No health features | — |
| Advertising ID | No (the app does not use the advertising ID; no ads SDK) | merged manifest has no `AD_ID` permission — check the build report |

## Data safety (consistent with `DATA_SAFETY.md`)

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **No** |
| Encrypted in transit / deletion request | not applicable (nothing collected) |
| Resulting label | "No data collected" · "No data shared with third parties" |
| Microphone | `RECORD_AUDIO` is used only after the user taps record; the audio goes to the Android speech recognizer (an OS service), never to the developer. If the Console insists that OS-recognizer audio must be declared, use the recorded fallback in `PRIVACY_FINAL.md` (Audio → "processed ephemerally", app functionality, not shared) and update `DATA_SAFETY.md` the same day. |

## Closed-test track

- Track: **Closed testing** → create a track named `v1-closed` (or use the default "Alpha"); countries: Vietnam (+ any tester's country).
- Testers: an email list in the Console (emails never go into this repository); feedback URL/email = the support email.
- Plan and tracker: `ANDROID_CLOSED_TEST_PLAN.md`, `PLAY_CLOSED_TEST_TRACKER.md`; tester guide `docs/PLAY_TESTER_GUIDE_VI.md`.
- Builds: `PLAY_SIGNING.md`; each upload is a new RC in `RC_HISTORY.md`.
