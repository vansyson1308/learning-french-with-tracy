# Tổng quan & quyết định — hoàn thiện app học ngoại ngữ (14/10/2026)

## 1. App đang ở đâu (kết quả đọc toàn bộ codebase)

**Rất tốt (chất lượng production):** engine tiếng Pháp — FSRS‑6, phiên học hằng ngày, từ điển Lexique 4 (SQLite + FTS), 15 loại bài tập, nghe/đọc với audio Piper đã kiểm chứng ASR, nói qua bộ nhận dạng của máy, viết có rubric, 18 kịch bản hội thoại, placement, 6 checkpoint + capstone A1 với "claim gate" trung thực; pipeline nội dung xác định (compile + drift check), registry giấy phép, ~1.170 test bun + 69 jest + e2e web, CI 5 múi giờ, bộ hồ sơ release/privacy đầy đủ, website đã live.

**Mỏng:** 7 khoá còn lại (de/es/it/ja/ko/pt/zh → tiếng Anh) chỉ là gói kế thừa từ Lingo Lessons: 5 unit / 20 bài (es 10/40), 5 loại bài tập, 60 từ, SM‑2 cũ, **không có bất kỳ lớp nào của tiếng Pháp** (không FSRS, không từ điển, không nghe/đọc/nói/viết/hội thoại, không placement/checkpoint). ja/ko/zh có lỗi nội dung thật (fillBlank hỏng 16/20/… câu, mất dấu cách tiếng Hàn, romanization không bao giờ hiển thị…). Chi tiết: `03-AUDIT-CONTENT.md` §1.

**Rào cản kỹ thuật lớn nhất:** lớp tiếng Pháp bị **gắn cứng** `"fr-en"` ở ~60 chỗ trong ~25 file runtime + schema zod (`language: "fr"`, regex id `fr.`), compiler chỉ load `content/fr`, validator cấm các loại bài "chỉ Pháp" ở khoá khác. Muốn "hoàn thiện ngôn ngữ còn lại" thì bắt buộc tách lớp này ra trước (Phase 1). Chi tiết: `02-AUDIT-ARCHITECTURE.md` §2.

**APK:** chưa có bản ký. Lý do: chưa có EAS project và chưa có keystore. **Build local trên Windows không cần EAS hoàn toàn khả thi** (prebuild + gradle + ký bằng apksigner — đúng cách repo đã dùng trong `android-direct-apk.yml`). Máy anh: Node 24, JDK 17 + 21 Temurin, Git, Claude Code 2.1.296, 32 GB RAM, 113 GB trống; **thiếu bun, Android SDK, adb** → script cài sẵn `plan/scripts/setup-windows-android.ps1`. Chi tiết: `04-AUDIT-BUILD-RELEASE.md`.

## 2. Thị trường nói gì (research 2026, có nguồn trong `05-RESEARCH-MARKET.md`)
- Người Việt học: **Anh** (EF hạng 64/123, Speaking yếu nhất 5.7 IELTS; Anh bắt buộc từ lớp 1 đến 2030), **Trung** (146k lượt thi HSK 2025, #1 thế giới), **Hàn** (70–85k TOPIK), **Nhật** (164k người học, 44k lao động sang Nhật/8 tháng). Pháp/Đức/Ý/Bồ qua tiếng Anh gần như không có thị trường.
- Người Việt cần **giải thích bằng tiếng Việt**; mọi app thắng ở VN đều bán bằng tiếng Việt. Duolingo Max (Video Call/Roleplay) **không tồn tại** cho khoá từ tiếng Việt.
- Subscription bị ghét và bị "bán lại" (Super Duolingo 350k/năm); gói thi **trả một lần** (Dungmori 1,29–3,29 triệu/level) là bình thường. Android 60 %, 50 % máy < 200 USD.
- Khoa học học tập: FSRS‑6 thắng SM‑2 ở 99,6 % người dùng; đọc mở rộng có hiệu quả; shadowing có bằng chứng; LLM chỉ đáng tin ở lỗi bề mặt; streak hữu ích nhưng energy/hearts/league gây hại.
- Lỗ hổng đối thủ: ELSA (gốc Việt) trả phí, online, bị chê "gameable"; không ai có chấm phát âm **offline + miễn phí + giải thích tiếng Việt**.

## 3. Quyết định đã chốt (anh chốt 14/10/2026)
| # | Quyết định | Ghi chú |
|---|---|---|
| D‑1 | **App dành cho người Việt: tiếng Việt là ngôn ngữ gốc + UI.** Mọi hướng dẫn, giải thích ngữ pháp, phản hồi, rubric, mục tiêu, màn hình đều bằng tiếng Việt (tiếng Anh là UI thứ hai). | `fr-en` giữ nguyên làm khoá gốc Anh duy nhất (đã xong, không tốn gì) |
| D‑2 | **Hoàn thiện đủ 8 ngoại ngữ đến mức ngang tiếng Pháp, tất cả từ tiếng Việt:** `fr-vi` (dịch từ fr-en) → `es-vi`, `de-vi`, `it-vi`, `pt-vi` (chữ Latin, rẻ, chạy theo cùng một khuôn) → `ja-vi`, `zh-vi`, `ko-vi` (cần plugin chữ viết). **Khuyến nghị thêm `en-vi`** (thị trường lớn nhất VN) sau khi khuôn đã chạy ổn. 7 gói `*-en` kế thừa sẽ được rút khỏi onboarding khi bản `-vi` tương ứng phát hành. | Mỗi khoá ≈ 40–80 ngày nội dung (LLM soạn + anh duyệt), kỹ thuật dùng chung |
| D‑3 | Đổi tên thương hiệu trung lập trước khi lên Play (anh chọn tên; package id có thể giữ). | Quyết định ở Phase 6 |
| D‑4 | FSRS/từ điển/đánh giá khoá theo **ngôn ngữ đích** (fr dùng chung cho fr-en và fr-vi); tiến độ bài học theo khoá. | |
| D‑5…D‑9 | Audio tổng hợp lúc build (Kokoro/MeloTTS/Piper, gate giấy phép); **mặc định không mạng**; miễn phí, sau này gói "ủng hộ"/gói thi mua một lần; ASR hệ thống + gói offline sherpa‑onnx + chấm phát âm GOP; LLM chỉ dạng ràng buộc, opt‑in. | Giữ nguyên như spec |
| Exam track | Mỗi khoá có "lộ trình thi" tương ứng: DELF A1 (fr), DELE A1 (es), Goethe A1 (de), CILS/CELI A1 (it), CAPLE A1 (pt), JLPT N5 (ja), HSK 1–2 (zh), TOPIK I (ko), VSTEP/TOEIC cơ bản (en). | Chỉ dùng cấu trúc/định dạng đề công khai, không sao chép đề thật |

## 4. Lộ trình (chi tiết `08-ROADMAP.md`; mỗi milestone = 1 prompt trong `prompts/`)
| Phase | Mục tiêu | Thời lượng |
|---|---|---|
| **0** | **APK ký tên cài lên điện thoại ngay** (build local Windows) + 7 sửa nhỏ an toàn; RC3 | 1–2 ngày |
| 1 | Tách lớp tiếng Pháp thành engine đa khoá (golden test → CourseProfile → schema/compiler → persistence v4/SQLite) | 2–3 tuần |
| 2 | UI tiếng Việt (i18n) + mô hình nội dung theo tiếng mẹ đẻ; sinh **fr‑vi** | 2 tuần |
| 3 | Pipeline nội dung chung (từ điển mở + tần suất cho cả 8 ngôn ngữ, audio đa engine, bộ công cụ soạn nội dung có LLM) → **es‑vi** là khoá mới đầu tiên (chứng minh khuôn) | 4–6 tuần |
| 4 | **de‑vi, it‑vi, pt‑vi** theo khuôn; plugin CJK; **ja‑vi, zh‑vi, ko‑vi**; (tuỳ chọn) **en‑vi**; mỗi khoá kèm lộ trình thi | 12–20 tuần |
| 5 | Tính năng đột phá: FSRS hiển thị, truyện phân cấp, nhập văn bản riêng, **chấm phát âm offline**, ngữ pháp từ lỗi, LLM ràng buộc tuỳ chọn | 8–12 tuần (song song P4) |
| 6 | Thương hiệu, listing, closed test 12 người × 14 ngày, device acceptance, nộp Play | 2–3 tuần |

## 5. Cách phối hợp (chi tiết `prompts/README.md`)
1. Em (điều phối) chỉ định prompt tiếp theo. 2. Anh mở `claude` trong repo (`C:\src\lft`), dán nguyên file prompt. 3. Claude Code làm trên nhánh `phase-N/...`, chạy mọi gate, kết thúc bằng khối `REPORT`. 4. Anh dán REPORT lại cho em; em đối chiếu Definition of Done rồi đưa prompt kế. 5. Việc phải tự tay làm (mật khẩu keystore, bật USB debugging, test trên máy, tài khoản) em sẽ liệt kê rõ từng lần.

**Bắt đầu: `prompts/P0-local-apk-windows.md`.** Trước đó anh chạy một lần `plan/scripts/setup-windows-android.ps1` (hoặc để Claude Code chạy — prompt P0 đã có bước này) rồi mở terminal mới.
