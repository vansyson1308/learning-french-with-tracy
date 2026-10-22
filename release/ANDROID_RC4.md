# Android RC4 — first device candidate since RC3 (P3f D)

**RC4 status (2026-10-22): release APK built and checked on the owner's PC;
owner signing, the upgrade install over RC3 and the 15-minute checklist (§4)
are owner actions — no device result has been observed.**

## 1. Commit and changes

| Item | Value |
|---|---|
| Branch | `release/rc4` |
| Commit built | `3ff3b96` (`main` `4a0bc7e` = PR #40 merged, + the build bump) |
| Version | `1.0.0` / **build 2 / versionCode 2** (`bun run release:bump`) |
| App changes vs RC3 | everything merged since RC3: SQLite learner store + migrations v4–v6 (P1d, P2b, P3e), golden tests, course profiles, Vietnamese UI (P2a), `fr-vi` (P2b), audio pipeline v2, `es-vi` A1 (P3d: 109 lessons / 713 exercises after P3e–P3f) with the DELE A1 track (2020 model), daily new words, tiered review / beta label, locale default course, French simpleForm card; Spanish audio at 32 kbps (7.4 MB) |
| Signing key | the same owner-held `C:\keys\lft-upload.jks` as RC3 → installs **over** RC3 (`adb install -r`) |

## 2. Build (owner's PC, local)

`bunx expo prebuild --platform android --no-install --clean` then `gradlew :app:assembleRelease --no-daemon`
(JDK 17, SDK 36 / build-tools 36.0.0 / NDK 27.1): BUILD SUCCESSFUL in 22 m 41 s.

Gates on the built commit: `release:identity` passed, typecheck, 1,538 bun tests, `compile-content --check`,
`audio:check` (1,721 baseline files, 12 MB per-language gate); CI green on PR #40 before the merge.

## 3. Artifact checks (unsigned)

| Check | Result |
|---|---|
| File | `android/app/build/outputs/apk/release/app-release.apk` — 133,664,309 bytes, SHA-256 `79abde99bb8753424e2054fb8f20d39c4b623424aaf0b26a19c884dd7471fbc3` |
| Package / version | `com.vansyson1308.learningfrenchwithtracy`, versionCode `2`, versionName `1.0.0`, targetSdk 36 |
| Permissions | exactly `INTERNET`, `MODIFY_AUDIO_SETTINGS`, `RECORD_AUDIO`, `VIBRATE` (+ the app-internal `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`) — unchanged vs RC3 |
| Debuggable | no `application-debuggable` |
| Native code | universal: arm64-v8a, armeabi-v7a, x86, x86_64 |
| Size per ABI (estimate: shared entries 44.0 MB, of which audio 13.1 MB, + that ABI's libs) | arm64-v8a ≈ 67.2 MB · armeabi-v7a ≈ 60.0 MB · x86 ≈ 68.5 MB · x86_64 ≈ 68.7 MB (universal 133.7 MB; RC3 universal 125.2 MB) |
| Signed APK | `out\learning-french-with-tracy-v1.0.0-rc.4.apk` — size, SHA-256 and `apksigner verify` recorded here after the owner signs |

Signing: the owner runs `out\ky-apk-rc4.cmd` (zipalign → `apksigner sign` with `lft-upload.jks` → `apksigner verify --print-certs`);
the signer SHA-256 must equal RC3's `d280d1de…3182` (`ANDROID_SIGNING.md`), otherwise RC4 cannot install over RC3.

## 4. Kiểm tra trên điện thoại — 15 phút (anh làm, ghi KẾT QUẢ vào cột cuối)

Chuẩn bị: điện thoại đang có **RC3** (đừng gỡ). Cắm USB, bật gỡ lỗi USB.

| # | Việc | Cách làm | Mong đợi | Kết quả (ĐẠT / LỖI + ghi chú) |
|---|---|---|---|---|
| 0 | Cài đè lên RC3 | `adb install -r out\learning-french-with-tracy-v1.0.0-rc.4.apk` | `Success`; không phải gỡ app cũ | |
| 1 | Tiến độ RC3 còn nguyên | Mở app (trước đó ghi lại streak / XP / số bài đã học / Cần ôn ở RC3) | Streak, XP, bài đã học, số thẻ cần ôn **giống hệt** RC3 | |
| 2 | Thời gian mở lần đầu | Vuốt tắt app, bấm giờ từ lúc chạm biểu tượng đến khi thấy tab Học | Ghi số giây (cold start) | ___ giây |
| 3 | Giao diện tiếng Việt | Hồ sơ → Ngôn ngữ hiển thị → Tiếng Việt | Chữ có dấu không bị cắt trên nút / tiêu đề / tab | |
| 4 | Chọn khóa theo tiếng Việt | Hồ sơ → Đang học → **Đổi** (danh sách khóa) | Các khóa giải thích bằng Tiếng Việt (Tiếng Pháp, Tiếng Tây Ban Nha) đứng đầu; `es-en` chỉ nằm trong "Khoá khác" | |
| 5 | Một bài fr-vi | Chọn fr-vi, làm 1 bài | Âm thanh tiếng Pháp phát; câu hỏi tiếng Việt | |
| 6 | Một bài es-vi có âm thanh | Chọn Tiếng Tây Ban Nha, làm 1 bài | Nhãn **"Bản beta — nội dung đang được duyệt"**; âm thanh tiếng Tây Ban Nha **phát rõ** (file 32 kbps) | |
| 7 | Từ mới mỗi ngày | Tab Hôm nay → Bắt đầu phiên hôm nay | Có thẻ dạy từ mới; Hồ sơ → Đang học → "Từ mới mỗi ngày" chỉnh được 0–15 | |
| 8 | Luyện thi DELE A1 | Luyện tập → Luyện thi DELE A1 → Thi thử có giờ → làm phần **Nghe** (mỗi đoạn nghe được 2 lần) rồi một bài **Nói** | Đồng hồ đếm ngược; ghi âm được; có kết quả "mức sẵn sàng ước tính" | |
| 9 | Sao lưu xuất / nhập | Hồ sơ → **Xuất tiến độ**; rồi Hồ sơ → **Nhập** file vừa xuất | Xuất được file; nhập lại không mất tiến độ | |
| 10 | Dung lượng app | Cài đặt Android → Ứng dụng → Learning French with Tracy → Bộ nhớ | Ghi "Kích thước ứng dụng" | ___ MB |

Gửi lại Claude: bảng này (điền cột cuối) + ảnh chụp bất kỳ lỗi nào.

## 5. Results

Not run yet. Results go here, into `release/DEVICE_ACCEPTANCE.md` §4 and the RC4 row of `release/RC_HISTORY.md`.
