# P5b — Truyện ngắn phân cấp: đọc & nghe từ vốn từ của chính người học

Ngày 2026-10-28 · nhánh `phase-5/stories` · prompt `plan/prompts/P5b-graded-stories.md`.

## Tóm tắt (tiếng Việt)

**1. Loại nội dung mới `story`** (`content/<lang>/stories/stories.json`, schema `storiesSchema`):
- Mỗi truyện dài 150–400 từ, có 8–60 câu. Người nói của từng câu là N (người kể), A hoặc B (hai giọng hội thoại).
- Mỗi câu có bản dịch tiếng Việt và tiếng Anh để chạm xem nghĩa.
- Mỗi truyện có 3–5 từ mới và 3 câu hỏi; ít nhất một câu hỏi bắt suy luận.
- Không ghi nhãn CEFR trong chữ hiển thị.
- Bộ giọng: người kể và hai giọng hội thoại khác nhau. Tiếng Pháp có bộ giọng riêng (siwis / upmc).

**2. Chấm cấp tự động** (`scripts/lib/stories.ts`):
- Mỗi token đều phải được xác định là một trong các loại sau:
  - một mục từ trong từ điển, kể cả dạng chia (dựa trên dữ liệu hình thái đã commit) và đuôi số nhiều/giống;
  - hư từ;
  - tên riêng đã khai báo;
  - số;
  - một mục ghi rõ trong `tokenMap`.
- Token không xác định được là lỗi.
- **Cấp** của mục từ lấy theo vị trí trong syllabus: nửa đầu là cấp 1 (A1-1), nửa sau là cấp 2 (A1-2).
- Truyện ở cấp X chỉ được dùng từ ≤ X, cộng với 3–5 từ mới đã khai báo. **≥ 95 % token phải là từ đã biết.**
- Từ trùng mặt chữ, ví dụ "río" (dòng sông) với "río" (tôi cười), được phân giải theo thứ tự: dạng từ điển, rồi từ trong syllabus, rồi cấp thấp hơn. Một `tokenMap` chung cho cả ngôn ngữ ghi các trường hợp ngược lại, như "son" → ser.
- Báo cáo `content/reports/<lang>/stories-coverage.json` ghi số token, độ phủ và từ mới của từng truyện.
- Công cụ soạn có thêm bước `stories`, kèm CLI `bun scripts/stories.ts bands|check --lang <code> [--tokens]` (in vốn từ theo cấp, chấm truyện, liệt kê từng cách phân giải để duyệt).

**3. Âm thanh:**
- Mỗi câu là một clip của lớp reception, dùng cùng cách tạo khoá và cùng workflow `audio.yml` với các clip nghe.
- Thời điểm bắt đầu của từng câu được lưu lúc build, lấy từ thời lượng mà bước QA ghi lại.
- Workflow giờ tái dùng cả các file reception đã duyệt, nên clip cũ của tiếng Pháp giữ nguyên từng byte.
- Validator: các file câu truyện không bị tính là file mồ côi, và thống kê âm thanh của phần nghe không đếm chúng.
- Chưa sinh âm thanh thì truyện chỉ có chữ, không bao giờ dùng TTS của máy.
- **Ngân sách 12 MB mỗi ngôn ngữ:**
  - Tiếng Tây Ban Nha đã dùng 7,4 MB. Ở 32 kbps, 463 câu truyện sẽ thêm khoảng 5 MB, vượt ngân sách.
  - Vì vậy câu truyện tiếng Tây Ban Nha dùng pipeline 4 (`storyPipelineVersion` trong file giọng, 24 kbps, giọng nói mono), ước tính tổng khoảng 11,2 MB. Clip nghe giữ 32 kbps.
  - Tiếng Pháp giữ pipeline 1 đã đóng băng (64 kbps), ước tính khoảng 8,8 MB.

**4. Trong app:**
- **Lối vào:**
  - Luyện tập → **Đọc & nghe** (danh sách, truyện gợi ý đứng đầu).
  - Tab Hôm nay có thẻ **Truyện hôm nay** ngay dưới phiên học — đây là cách em làm "ô finale tuỳ chọn".
- **Màn đọc:**
  - Nghe theo câu, câu đang đọc được tô sáng.
  - Chạm một từ để xem nghĩa. Từ mới được gạch chân. Nút "Học từ này" thêm từ đó vào phần kiểm tra.
  - Chạm số thứ tự để xem bản dịch câu.
  - Ba câu hỏi chỉ có phản hồi, không chấm điểm, không lưu.
- Mỗi từ là một view riêng, nên trình đọc màn hình và Maestro đều chạm được.
- **Phần kiểm tra từ** (`/session/story`):
  - Từ chưa có thẻ: thẻ dạy, rồi một câu hỏi nhận diện (assessment).
  - Từ đã có thẻ: chỉ câu hỏi nhận diện.
  - Từ có clip phát âm: thêm một câu hỏi nghe (`listen`).
  - Tất cả đi qua cổng bằng chứng bình thường (nguồn `story`, mỗi thẻ một lần mỗi phiên).
  - Việc đọc tự nó không bao giờ ghi vào lịch ôn.
- **Chọn truyện** (`src/lib/stories/selection.ts`): ưu tiên truyện có 3–6 từ chưa biết, cấp thấp trước. Nếu không có, chọn truyện có ít từ lạ nhất (người mới); nếu biết hết thì để đọc lại.
  - Không cần lưu "đã đọc": khi từ mới đã có thẻ, truyện tự rời khỏi khung gợi ý.
  - Vì vậy **không đổi dữ liệu người học, không cần migration**.
- Capability `stories` chỉ được thêm vào profile của khoá có truyện: es-vi, fr-vi, fr-en.

**5. Nội dung:** 30 truyện tự viết.
- **Tiếng Tây Ban Nha:** 20 truyện, 8 truyện cấp 1 và 12 truyện cấp 2, 151–171 token, độ phủ 95,0–96,8 %.
- **Tiếng Pháp:** 10 truyện cấp 2, 152–175 token. Từ điển tiếng Pháp chỉ có 126 mục, nên truyện dùng vốn từ hẹp. Ngay các động từ être/avoir cũng nằm ở nửa sau syllabus, nên không viết được truyện cấp 1.
- Truyện tiếng Anh: khoá en-vi chưa có (P4f), nên em không viết 20 truyện tiếng Anh như prompt ghi. Prompt v2 nói "mọi ngôn ngữ đã phát hành", mà hiện chỉ fr và es có khoá từ tiếng Việt. Truyện của de, it, pt, ja, zh, ko, en sẽ viết trong milestone của từng khoá. Đã ghi trong `release/KNOWN_LIMITATIONS.md`.

**6. Kiểm thử trên thiết bị:** flow Maestro `stories.yaml`, chạy trong shard `core` trên API 34 và 30:
- danh sách → màn đọc → xem bản dịch → chạm từ → ba câu hỏi → phần kiểm tra từ (thẻ dạy + câu hỏi, trả lời bằng nghĩa trong từ điển) → màn tổng kết.

## Quyết định cần ghi lại
- **Hư từ:** chỉ những từ thuộc lớp đóng (mạo từ, giới từ, liên từ, đại từ, sở hữu/chỉ định, nghi vấn, phó từ chỉ mức độ, số đếm; tiếng Pháp thêm "bien/beaucoup/voici").
  - Đại từ và nghi vấn trong từ điển tiếng Tây Ban Nha (yo, él, qué…) được coi là hư từ, nên không chạm xem nghĩa được.
  - Danh sách nằm ngay trong file nội dung, có thể duyệt.
- **"Thêm vào ôn tập"** nghĩa là đưa từ vào phần kiểm tra cuối truyện, chứ không tạo thẻ ngay. Thẻ chỉ sinh ra sau một lần truy hồi thật, đúng hợp đồng bằng chứng.
- **Kết quả câu hỏi đọc hiểu** không được lưu, không đưa vào ước tính CEFR.

## Kiểm tra
- **Biên dịch và golden:**
  - **Biên dịch:** typecheck ✅, lint ✅. Phần fr còn chạy ở nền.
  - **Golden:** re-bless có lý do. Chỉ có artifact truyện mới và capability `stories` trong profile/module của es-vi, fr-en, fr-vi; artifact tiếng Pháp cũ không đổi.
- **Unit:**
  - **Mới:** `scripts/__tests__/stories.test.ts` 9 test, `src/lib/__tests__/stories.test.ts` 17 test (persona, phần kiểm tra từ, trình phát, tách token).
  - **Đã sửa:** test cũ `course-profile`, `audio-dry-run`, `privacy-policy`.
- **jest:** `integration-tests/stories.test.tsx` 3/3 ✅.
- Kết quả cuối của `bun run test`, `content:check`, `audio:check` và i18n: xem PR.

## Việc của chủ dự án
- Duyệt bản dịch tiếng Việt của 30 truyện (OWNER-FINAL-CHECKLIST B).
- Trên điện thoại: đọc một truyện có chạm-để-tra-nghĩa (đã có sẵn trong D).
