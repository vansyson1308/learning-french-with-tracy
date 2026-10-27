# P3g — Gia cố bản phát hành (phần B, C, E)

Ngày 2026-10-27 · nhánh `phase-3/p3g-release-hardening` · prompt `plan/prompts/P3g-rc4-release-hardening.md`
(phần A đã xong ở P3f; phần D — nghiệm thu trên điện thoại — gộp vào lượt nghiệm thu v1.0 theo `00-MASTER-PROMPT-v2.md`).

## Tóm tắt (tiếng Việt)
- **B — Nội dung tải theo khoá.** Mỗi khoá giờ là một gói riêng (`src/content/courses/<id>.ts`: pack + artifacts + audio của khoá đó), nạp bằng `import()` qua `src/content/course-loaders.ts`. App giữ màn hình chờ cho tới khi khoá đang học đã nạp; chọn khoá / onboarding nạp trước rồi mới đổi. Gói web khởi động giảm **7,37 MB → 3,19 MB**, mỗi khoá thành một chunk riêng. CI có gate `entry ≤ 4,5 MB` (`scripts/check-web-entry.ts`).
- **C — APK cho điện thoại**: chỉ arm64-v8a + armeabi-v7a (`plan/scripts/build-phone-apk.sh`) → **84,0 MB** (bản universal RC4: 133,7 MB). Emulator/CI vẫn dùng x86_64.
- **E — Vệ sinh bản phát hành** (test tự động): app không có đường mạng nào (`fetch`/`XMLHttpRequest`/`WebSocket`, danh sách cho phép rỗng); không file audio mồ côi hay thiếu; công cụ CI (LanguageTool, ASR) không lọt vào app.

## Kiểm tra
typecheck ✅ · lint ✅ · `bun run test` 1.545 ✅ · jest 76/76 ✅ · `content:check` ✅ · `audio:check` ✅ ·
e2e web en 15/15 ✅, vi 15/15 ✅ · guide en/vi 30 pass ✅ · exam (vi) 14/14 ✅ · golden: chỉ thêm module mới, tiếng Pháp không đổi.

## Ghi chú kỹ thuật
- `memoByCourse` không ghi nhớ kết quả rỗng của khoá chưa nạp; test và script đăng ký mọi gói (`src/content/course-bundles.ts`, app không được import — test import-graph).
- `src/content/audio-manifest.ts` vẫn là nguồn gốc (do `audio.ts apply` ghi); các lát audio theo khoá được sinh từ nó.
- Trên Android, bundle Hermes vẫn chứa mọi khoá (6,8 MB) nhưng module khoá chỉ được chạy khi dùng tới.

## Việc của chủ dự án
Không có việc mới (nghiệm thu thiết bị nằm trong `plan/OWNER-FINAL-CHECKLIST.md` D).
