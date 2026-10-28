# P4a — Sửa các gói kế thừa và cho nghỉ khi khoá `-vi` ra đời

Ngày 2026-10-27 · nhánh `phase-4/inherited-packs` · prompt `plan/prompts/P4a-fix-inherited-courses.md`.

## Tóm tắt (tiếng Việt)

**1. Sửa dữ liệu** (120 thay đổi, có luật validator để lỗi không quay lại):
- **Câu điền chỗ trống**:
  - ja: 16 câu lỗi (14 câu `___。` có đáp án là cả câu, 2 câu không có chỗ trống) được viết lại thành câu điền thật. Ví dụ `犬は___です。` với các lựa chọn 大きい / 小さい / 速い / かわいい.
  - zh: cả 20 câu, ví dụ `我喜欢喝___。`.
  - ko: khôi phục khoảng trắng cho 20 câu (`저는 ___ 먹어요.`).
  - it: 3 câu mất dấu nháy (`Bevo ___.` với lựa chọn `l'acqua`; `___ la stazione?` với lựa chọn `Dov'è`).
  - Đáp án đúng được rải đều các vị trí.
- **60 câu typeAnswer ja/ko/zh**: trước đây chấp nhận gõ phiên âm của chính câu đề làm "bản dịch". Nay đáp án thay thế là các cách nói tiếng Anh thật (dạng rút gọn, số nhiều, từ đồng nghĩa).
- **Hướng dẫn tiếng Đức**: câu sai "*Ich* là từ chỉ thời gian" được sửa thành quy tắc động từ ở vị trí thứ hai (*Ich esse Brot.* — *Heute esse ich Brot.*).
- **Bỏ từ lặp giữa các chương** trong 7 gói cơ bản (de 5, es 11, it 4, ja 2, ko 3, pt 4, zh 4); lần xuất hiện đầu được giữ.
- **Luật mới** (`scripts/lib/lesson-shape.ts` `templateDefectErrors`, chạy trong `content:validate`):
  - fillBlank có đúng một `___` và đáp án không phải cả câu;
  - đáp án thay thế không được là phiên âm của câu đề (từ mượn như "hotel", "panda" không bị báo nhầm);
  - gói cơ bản (`"basicPack": true`) không liệt kê một từ ở hai chương.

**2. Phiên âm** (`Word.romanization`, 180 mục trước đây không hiện ở đâu):
- Hiện dưới lựa chọn của câu chọn đáp án, câu điền chỗ trống, cột tiếng đích của bài ghép cặp, đề bài, thẻ từ mới, từ khoá trong hướng dẫn, và đáp án đúng khi trả lời sai.
- Công tắc theo từng khoá ở Hồ sơ: "Hiện phiên âm / Show reading aid", mặc định bật (A1). Công tắc chỉ hiện với khoá có phiên âm (ja/ko/zh).
- Dữ liệu người học **v7**: `readingAid` (courseId → bật/tắt), có migration v6 → v7, fixture `v6-reading-aid.json`, kiểm tra tính hợp lệ khi nhập sao lưu, và test round-trip.
- **Sửa thêm lỗi cũ**: file sao lưu trước đây không ghi `dailyNewWords` (số từ mới mỗi ngày), nhập lại thì về mặc định 5. Giờ đã được ghi.

**3. Giọng tiếng Tây Ban Nha**: không cần đổi. Từ P3b/P3e, es-en đã dùng `kokoro-ef_dora` (Apache-2.0). Canary trên chính văn bản es-en:

| Giọng | WER |
|---|---|
| `kokoro-ef_dora` (đang dùng) | 0,083 |
| `es_MX-claude-high` | 0,142 |
| `es_ES-davefx` | 0,529 |

Không còn clip nào dùng davefx. Tiếng Bồ Đào Nha giữ pt-BR.

**4. Ẩn gói khỏi onboarding**:
- Trình biên dịch gắn `hiddenFromOnboarding: true` cho khoá standalone, và cho gói cơ bản khi mục tiêu đó đã có khoá `-vi` đạt claim A1 (đọc từ `<code>-claim.json` của chính lần biên dịch).
- Onboarding và màn Khoá học dùng cờ này: khoá ẩn nằm dưới "Khoá khác / Other courses".
- Không đụng tới dữ liệu người học. Hiện chỉ áp dụng cho `es-en`.

**5. (Tuỳ chọn) FSRS cho gói cơ bản**: chưa làm. Các gói này không có sổ id ổn định, nên chuyển SM-2 → FSRS cần thêm một sổ id cho mỗi ngôn ngữ, mà các gói sẽ lần lượt được thay bằng khoá `-vi`. Đã ghi trong `release/KNOWN_LIMITATIONS.md`.

**6. Tài liệu**:
- `KNOWN_LIMITATIONS.md`: mục "Basic packs".
- `STORE_METADATA_FINAL.md`: bản nháp danh sách khoá cho trang cửa hàng.
- STATUS.

## Kiểm tra
typecheck ✅ · lint ✅ · `bun run test` 1.572 ✅ (mới: `template-defects`, `migrations-v7`, luật ẩn gói trong `course-roles`) · jest 76/76 ✅ · `content:validate` / `content:check` ✅ · `audio:check` ✅ · golden ✅ (re-bless có lý do: 7 gói cơ bản, profile es-en, snapshot migration v7; tiếng Pháp không đổi) · i18n keys ✅ · e2e web (en) 15/15 ✅ · guide walk 30 pass ✅ · kiểm tay trên bản web: ja-en hiện "otoko no hito" dưới 男の人; tắt công tắc ở Hồ sơ thì phiên âm biến mất và giá trị được lưu (`readingAid: {"ja-en": false}`, version 7). Không chạy emulator trên máy (theo yêu cầu chủ dự án); CI device-acceptance chạy trên PR.

## Việc của chủ dự án
Thử nhanh trên máy một khoá (ja-en: thấy phiên âm dưới lựa chọn, tắt được ở Hồ sơ). Đã gộp vào lượt nghiệm thu một lần ở `plan/OWNER-FINAL-CHECKLIST.md` D.
