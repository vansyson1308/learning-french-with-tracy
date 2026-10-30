# it-vi — duyệt bằng AI mô phỏng người bản ngữ (D-10)

Quyết định D-10 (29/10/2026, `plan/01-TONG-QUAN-VA-QUYET-DINH.md`): dự án không
thuê người duyệt bản ngữ. Khoá này được duyệt theo `plan/prompts/P-ai-review.md`
bởi các agent riêng, ngữ cảnh mới, đóng vai giáo viên tiếng Ý bản ngữ (italiano
standard) đọc được tiếng Việt. Đây **không phải** duyệt của người bản ngữ; app ghi
trung thực: "Nội dung được AI kiểm duyệt kỹ, chưa qua giáo viên bản ngữ."

## Phạm vi và kết quả lượt duyệt

| Lượt | Đã đọc | P0 | P1 | P2 | Tổng |
|---|---|---|---|---|---|
| Đáp án (chạy trước) | 963 dòng: bài tập, kịch bản, kiểm tra, xếp lớp, đề CILS | 116 | 4 | 5 | 125 |
| Ngôn ngữ (tiếng Ý, tiếng Việt, đối chiếu) | 2.393 dòng: truyện, đọc, nghe, kịch bản, từ vựng, hướng dẫn, thẻ ngữ pháp | 6 | 91 | 37 | 134 |

Hầu hết 116 lỗi P0 của lượt đáp án cùng một dạng: câu trả lời đúng của người học chưa
được chấp nhận, như thiếu cách viết khác hoặc thiếu trật tự từ khác.

Quyết định cho từng lỗi nằm trong `content/it/_drafts/review/decisions-answers.json`
và `decisions-language.json`:

| Quyết định | Số lỗi |
|---|---|
| Đã sửa trong nội dung | 246 |
| Giữ nguyên, có lý do: bộ chấm đã đọc chữ số 0–100 trước khi so | 12 |
| Giữ nguyên, có lý do: hướng dẫn chương c giải thích *primo piano* | 1 |

Trong 246 lỗi đã sửa có 10 lỗi được sửa ngay trong bộ sinh hướng dẫn và thẻ ngữ pháp.

## Đối chiếu thêm

- **LanguageTool (it):** 3.681 chuỗi tiếng Ý, 195 kết quả đều được cho phép và có lý do
  (`content/it/languagetool-allow.json`), 0 lỗi, 0 mục cũ. Chạy lại trên CI (job
  `languagetool`).
- **Dịch ngược:** 3.321 cặp, 52 cờ, đã đọc hết, không cờ nào còn mở
  (`content/it/_drafts/BACKTRANSLATION.md`). Script chạy trong chính phiên đã viết nội
  dung, nên bước này không độc lập.

## Audit độc lập 10 %

- Một agent khác, ngữ cảnh mới, đọc mẫu ngẫu nhiên (seed 20261031) trong các dòng lượt
  duyệt **không** đổi, tổng **310 dòng**:
  - 84 / 838 dòng bài tập;
  - 226 / 2.259 dòng ngôn ngữ.
- Kết quả: 0 P0, 1 P1, 15 P2 → **tỉ lệ P0+P1 = 0,3 %**, dưới ngưỡng 2 %. Không cần duyệt
  lại cả khoá.
- Audit cũng soát lại 10 bản sửa chọn ngẫu nhiên: cả 10 đều đúng. Với hai bản sửa, agent
  chỉ xét trên câu chữ, không mở bộ sinh để đối chiếu. Một bản sửa khi đó ghi "A novembre…"
  trong file quyết định, còn nội dung là "A ottobre e a novembre…": câu này được đổi sau
  lượt duyệt để giữ ngữ cảnh cho *ottobre*, và cả hai cách đều đúng.
- Audit không mở đủ toàn văn truyện và phương án của câu hỏi truyện và câu hỏi đề thi,
  nên các dòng này chỉ được xét trên chữ trong mẫu.
- 14 lỗi audit đã được sửa, 2 lỗi còn lại là chưa chắc (`findings-audit.json`,
  `decisions-audit.json`). Lỗi P1 là bản dịch ví dụ của *i pantaloni*. Hai trong các lỗi P2
  dẫn tới một thay đổi toàn khoá: "quán bar" đổi thành "quán cà phê", vì *bar* của Ý là quán
  cà phê chứ không phải quán rượu đêm. Thay đổi này rộng hơn hai dòng audit nêu.
- Cách chọn mẫu: `content/it/_drafts/review/it-vi-audit-sample.py`, số liệu trong
  `it-vi-audit-sample.json`.

## Chưa chắc (anh quyết định — không chặn việc gì)

1. **it.story.la_chiave_perduta#6:** *primo piano* đang dịch là "tầng một", trong khi ở
   Việt Nam "tầng một" thường là tầng trệt. Hướng dẫn chương c đã giải thích; có nên dịch
   thành "tầng trên" ở truyện không?
2. **it.story.il_vicino_nuovo#2:** "il vicino nuovo" đúng và trùng tên truyện, nhưng
   "il nuovo vicino" thường gặp hơn. Hiện giữ nguyên.

## Chấp nhận

Profile `it-vi` chỉ được ghi `review: { kind: "ai-simulated", … }` sau khi anh đánh ☑
dòng `ai-review:it-vi` trong `plan/OWNER-FINAL-CHECKLIST.md` B. Gate biên dịch kiểm tra
điều đó (`reviewGateErrors`).
