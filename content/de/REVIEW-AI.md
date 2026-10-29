# de-vi — duyệt bằng AI mô phỏng người bản ngữ (D-10)

Quyết định D-10 (29/10/2026, `plan/01-TONG-QUAN-VA-QUYET-DINH.md`): dự án không
thuê người duyệt bản ngữ. Khoá này được duyệt theo `plan/prompts/P-ai-review.md`
bởi các agent riêng, ngữ cảnh mới, đóng vai giáo viên tiếng Đức bản ngữ
(Bundesdeutsch) đọc được tiếng Việt. Đây **không phải** duyệt của người bản ngữ;
app ghi trung thực: "Nội dung được AI kiểm duyệt kỹ, chưa qua giáo viên bản ngữ."

## Phạm vi và kết quả lượt duyệt

| Lượt | Đã đọc | P0 | P1 | P2 | Tổng |
|---|---|---|---|---|---|
| Đáp án (chạy trước) | 704 bài tập + 8 kịch bản | 18 | 66 | 6 | 90 |
| Ngôn ngữ (tiếng Đức, tiếng Việt, đối chiếu) | 1.772 dòng: truyện, đọc, nghe, kịch bản, hướng dẫn, thẻ ngữ pháp, đề Goethe | 2 | 49 | 55 | 106 |

Quyết định cho từng lỗi nằm trong `content/de/_drafts/review/decisions-answers.json`
và `decisions-language.json`:

| Quyết định | Số lỗi |
|---|---|
| Đã sửa trong nội dung | 183 |
| Đã sửa bằng engine | 6 |
| Giữ nguyên, có lý do | 1 |
| Không áp dụng (thiếu từ trong từ vựng) | 1 |
| Chưa chắc | 5 |

Sửa ở engine, có test:
- **Câu gõ và ô chữ tiếng Đức:**
  - "ß" được coi như "ss";
  - "ae / oe / ue" được chấp nhận thay cho "ä / ö / ü";
  - chính tả nghe–viết và bài chia động từ vẫn chấm chặt.
- **Bộ đọc số tiếng Đức** cho câu nói: "8 Uhr" khớp với "acht Uhr", và tương tự cho giá tiền, giờ giấc.
- **File duyệt Tier-1:** trước ghi nhầm "español"; nay ghi đúng ngôn ngữ và biến thể của từng khoá.

Lỗi P0 tiêu biểu đã sửa:
- "40 Meter" → "40 Quadratmeter";
- "hält seine Mutter am Arm";
- "Meine Freundin heißt Lea";
- hai bài nghe–viết có clip hai dòng nay chấm theo cả clip;
- các câu hỏi có hai đáp án đúng: *macht*, *die Schlüssel*, *Handy/Telefon*;
- ô chữ chưa nhận trật tự từ bình thường ("Ich arbeite heute").

## Audit độc lập 10 %

- Một agent khác, ngữ cảnh mới, chọn mẫu ngẫu nhiên (seed 20261029) trong các dòng
  lượt duyệt **không** đổi, tổng **160 dòng**:
  - 70 bài tập (10 %);
  - 50 câu truyện;
  - 40 đoạn đọc / nghe / kịch bản.
- Kết quả: 0 P0, 1 P1, 5 P2 → **tỉ lệ P0+P1 = 0,6 %**, dưới ngưỡng 2 %. Không cần
  duyệt lại cả khoá.
- Audit cũng soát lại 10 bản sửa chọn ngẫu nhiên: cả 10 đều đúng.
- Cả 6 lỗi audit đã được sửa (`content/de/_drafts/review/apply-audit.py`,
  `decisions-audit.json`). Lỗi P1 là bài nói "hôm nay thứ mấy": nay nhận thêm
  "Es ist Montag".
- Mẫu truyện và đoạn đọc/nghe nhỏ hơn 10 % (5,4 % và 6,9 %). Chi tiết cách chọn mẫu
  nằm trong `content/de/_drafts/review/de-vi-audit.json`.

## Chưa chắc (anh quyết định — không chặn việc gì)

1. **de-lg-9:** giọng Piper có đọc "ICE" thành I-C-E không? Cần nghe clip sau khi tạo audio.
2. **de-lg-11, de-lg-12:** "Dr." có được đọc thành "Doktor" không? Cần nghe clip.
   Nếu sai, sửa cả clip lẫn câu trong kịch bản `a1cap_arzt`.
3. **de-lg-22, de-lg-33:** cách tả âm *ich-Laut* trong hướng dẫn unit-e và trên thẻ
   ngữ pháp. Cần cách diễn đạt của giáo viên; hai chỗ nên sửa cùng lúc.

Ghi chú thêm:
- *Quadratmeter* chưa có trong từ vựng. Truyện căn hộ tạm hiểu nó theo từ *Meter*
  (de-lg-36), vì "40 Meter" là lỗi P0.
- Ngoài mẫu audit còn hai chỗ nhân vật dùng chung giọng: *der_flohmarkt* câu 17 và
  *an_der_ampel*. Chỉ có một giọng nữ và một giọng nam, nên đây là giới hạn của bộ
  giọng.

## Chấp nhận

Profile `de-vi` chỉ được ghi `review: { kind: "ai-simulated", … }` sau khi anh
đánh ☑ dòng `ai-review:de-vi` trong `plan/OWNER-FINAL-CHECKLIST.md` B. Gate biên
dịch kiểm tra điều đó (`reviewGateErrors`).
