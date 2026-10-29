# fr-vi — duyệt bằng AI mô phỏng người bản ngữ (D-10)

Quyết định D-10 (29/10/2026, `plan/01-TONG-QUAN-VA-QUYET-DINH.md`): dự án không
thuê người duyệt bản ngữ. Nội dung được duyệt theo `plan/prompts/P-ai-review.md`
bởi các agent riêng, ngữ cảnh mới, đóng vai giáo viên bản ngữ. Đây **không phải**
duyệt của người bản ngữ; app ghi trung thực: "Nội dung được AI kiểm duyệt kỹ, chưa
qua giáo viên bản ngữ."

## Phạm vi

- Khoá `fr-vi`: phần tiếng Pháp là bản `fr-en` giữ nguyên từng byte (CLAUDE.md §4);
  chỉ tiếng Việt được duyệt.
- **3.154 chuỗi tiếng Việt** đã đọc: `content/fr/translations/vi.dictionary.json`,
  `content/fr/translations/vi.jsonl` (hướng dẫn, đề bài, đáp án, ô chữ, lựa chọn),
  phần tiếng Việt của mục tiêu, kịch bản và từ vựng.
- Thứ tự: đáp án trước (câu trả lời đúng có bị chấm sai không), rồi tiếng Việt tự
  nhiên, rồi đối chiếu tiếng Việt với tiếng Pháp.

## Kết quả lượt duyệt

| Mức | Số lỗi |
|---|---|
| P0 (đáp án sai, dạy sai) | 23 |
| P1 (chấm sai câu đúng, tiếng Việt rõ ràng không tự nhiên) | 28 |
| P2 (văn phong) | 30 |
| **Tổng** | **81** |

Quyết định cho từng lỗi nằm trong `content/fr/_drafts/review/decisions-fr-vi.json`:
- 77 đã sửa;
- 3 chưa chắc;
- 1 không áp dụng, kèm lý do.

Cách sửa: `content/fr/_drafts/review/apply-fr-vi.py`; `fr-vi` được dựng lại bằng
`bun scripts/translate-native.ts apply --from en --to vi --target fr`.

Lượt duyệt phát hiện ba lỗi có tính hệ thống, sửa ở engine, có test:
- ô chữ (wordBank) nhận thêm câu đúng khác (`alternatives`);
- gõ tiếng Việt không dấu: "đ" được coi như "d";
- chính tả nghe–viết (dictation) bỏ qua dấu câu.

## Audit độc lập 10 %

- Một agent khác, ngữ cảnh mới, chọn mẫu ngẫu nhiên (seed 20261029): 250 mục từ
  điển, 10 bản ghi, 30 bài tập — **290 dòng** chưa được sửa trong lượt duyệt.
- Kết quả: 4 lỗi P1, 0 P0 → **tỉ lệ P0+P1 = 1,4 %**, dưới ngưỡng 2 %. Không cần
  duyệt lại cả khoá.
- Đã sửa cả 4 lỗi P1 ("gọi thêm nước" ×2, "một thông tin" ×2).
- Audit cũng soát lại 10 bản sửa của lượt duyệt và tìm ra 2 chỗ sửa chưa đủ. Cả hai
  đã được bổ sung:
  - ô chữ u0-l1-e6/e7 nhận "Đây là cậu bé" / "Đây là cô bé";
  - "một tách trà" ở các câu anh em.
- 8 lỗi P2 của audit chưa sửa: văn phong, không làm sai nghĩa hay chấm sai. Chi
  tiết trong `content/fr/_drafts/review/fr-vi-audit.json`.

## Chưa chắc (anh quyết định — không chặn việc gì)

1. **fr-66, fr-67:** "nhập cảnh" trên phiếu khách sạn / phiếu đến — đúng hay
   không tuỳ cảnh; Claude để nguyên.
2. **fr-68:** thuật ngữ "nguyên mẫu" (theo `TRANSLATION-STYLE-vi.md`) hay "nguyên
   thể" (theo GLOSSARY): cần một quyết định chung cho cả dự án.
3. **fr-81:** "thứ Bảy" viết thường giữa câu là đúng tiếng Việt, nhưng danh sách
   lựa chọn đang lẫn chữ hoa và chữ thường.

## Chấp nhận

Profile `fr-vi` chỉ được ghi `review: { kind: "ai-simulated", … }` sau khi anh
đánh ☑ dòng `ai-review:fr-vi` trong `plan/OWNER-FINAL-CHECKLIST.md` B. Gate biên
dịch kiểm tra điều đó (`reviewGateErrors`).
