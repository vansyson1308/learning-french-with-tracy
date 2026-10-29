# es-vi — duyệt bằng AI mô phỏng người bản ngữ (D-10)

Quyết định D-10 (29/10/2026, `plan/01-TONG-QUAN-VA-QUYET-DINH.md`): dự án không
thuê người duyệt bản ngữ. Khoá này được duyệt theo `plan/prompts/P-ai-review.md`
bởi các agent riêng, ngữ cảnh mới, đóng vai giáo viên tiếng Tây Ban Nha bản ngữ
(bán đảo) đọc được tiếng Việt. Đây **không phải** duyệt của người bản ngữ; app ghi
trung thực: "Nội dung được AI kiểm duyệt kỹ, chưa qua giáo viên bản ngữ."

## Lượt 1

| Lượt | Đã đọc | P0 | P1+P2 | Tổng |
|---|---|---|---|---|
| Đáp án | 718 bài tập | 8 | 47 | 55 |
| Ngôn ngữ (tiếng Tây Ban Nha, tiếng Việt, đối chiếu) | 1.145 mục | 2 | 84 | 86 |

Quyết định: `content/es/_drafts/review/decisions-answers.json` và `decisions-language.json`.

Lượt này phát hiện ba lỗi hệ thống, đã sửa ở engine và có test:
- ô chữ nhận thêm câu đúng khác (`alternatives`);
- gõ tiếng Việt không dấu: "đ" được coi như "d";
- nghe–viết bỏ qua dấu câu.

## Audit 1 — không đạt → duyệt lại cả khoá

- **Mẫu:** 160 dòng, seed 20261029.
- **Kết quả:** 4 lỗi P1, tức **2,5 %**, vượt ngưỡng 2 %. Theo quy trình, cả khoá
  được duyệt lại.
- **Các lỗi P1, đã sửa** (`apply-audit.py`):
  - bài nói chưa nhận "Esto es un perro";
  - biển giờ mở cửa ghi "Cerrado el lunes", phải là "los lunes";
  - "la fiebre va a pasar";
  - bảng chia động từ thiếu ngôi *vosotros*.
- 14 lỗi P2 cũng đã sửa.

## Lượt 2 (agent mới, cả khoá)

- **Đã đọc:**
  - 718 bài tập, 27 hướng dẫn;
  - 20 truyện (463 câu);
  - 27 bài đọc, 221 clip, 20 kịch bản;
  - 54 bài nói, 38 bài viết;
  - các bài kiểm tra, xếp lớp, đề DELE, 22 thẻ ngữ pháp.
- **Kết quả:** 0 P0, 17 P1, 49 P2, tổng **66**.
- **Quyết định** (`decisions-pass2.json`): 54 sửa nội dung, 5 sửa bằng engine,
  5 không áp dụng, 2 chưa chắc.
- **Engine:** thêm **bộ đọc số tiếng Tây Ban Nha** cho bài nói và bài viết
  ("16 €", "3,50 €", "10:30", "la 1"). Golden tiếng Pháp không đổi.
- **Clip đã khớp lại với chữ:** "¿Quiere algo más?", "Hemos terminado. Muchas
  gracias.", và clip mới "¡Buenos días!" cho bài chào.

## Audit 2 — đạt

- **Mẫu:** agent khác, seed mới 20261030, **178 dòng** chọn trên toàn bộ nội dung,
  cả dòng đã sửa lẫn chưa sửa:
  - 72 bài tập;
  - 46 câu truyện;
  - 60 đoạn đọc / nghe / kịch bản.
- **Kết quả:** 0 P0, 0 P1, 6 P2, tức **tỉ lệ P0+P1 = 0 %**. Cận trên 95 % khoảng
  1,7 %, vẫn dưới ngưỡng 2 %.
- **Kiểm tra lại bản sửa:** 10 bản sửa chọn ngẫu nhiên, cả 10 đều đúng.
- **Lỗi P2:** 2 đã sửa (`apply-audit-2.py`); các lỗi còn lại giữ nguyên, lý do
  ghi trong `decisions-audit-2.json`.

## Không áp dụng — cần thêm từ vào từ vựng

Các bản sửa sau cần từ chưa có trong từ vựng es, nên chưa ép vào:
- *mojada* ("toda la ropa mojada");
- *deberes* (từ Tây Ban Nha cho "bài tập về nhà"; hiện dùng *tarea*);
- *llover* ("ya no llueve");
- *chocar* / *caer*;
- *acordarse*.

Ngoài ra, "mayor" làm truyện tụt dưới mức 95 % từ đã biết.

Khi bổ sung từ vựng, các câu này nên được sửa lại.

## Chưa chắc (anh quyết định — không chặn việc gì)

1. Biển "Abierto / Cerrado" và *tarta* hay *pastel* (lượt 1).
2. **es-p2-50:** "El café es a las dos" đúng ngữ pháp. *quedar* (hẹn) chỉ học ở unit v.
3. **es-p2-66:** dịch "sopa de pollo con arroz" thành "súp gà với cơm" hay "súp gà
   có gạo" — cần người Việt chọn.
4. **es-p2-23 (cần thử trên máy thật):** bộ nhận dạng es-ES có viết giá tiền kèm "€"
   không? Bộ đọc số đã hiểu cả hai dạng.

## Chấp nhận

Profile `es-vi` chỉ được ghi `review: { kind: "ai-simulated", … }` sau khi anh đánh
☑ dòng `ai-review:es-vi` trong `plan/OWNER-FINAL-CHECKLIST.md` B. Gate biên dịch
kiểm tra điều đó (`reviewGateErrors`).
