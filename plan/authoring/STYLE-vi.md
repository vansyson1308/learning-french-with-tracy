# Văn phong tiếng Việt cho nội dung người học nhìn thấy (STYLE-vi, P3c)

Áp dụng cho MỌI chuỗi người học đọc trong một khoá `<target>-vi`: hướng dẫn
bài tập, lựa chọn, câu hỏi, sách hướng dẫn (guidebook), thẻ khái niệm
(concept), câu "tôi có thể" (can-do), gợi ý sửa bài viết, mục tiêu và lời
dẫn hội thoại, mô tả ô điền, nhãn dữ kiện. Chuỗi giao diện (nút, tab,
cảnh báo) KHÔNG thuộc tài liệu này — chúng nằm trong `src/lib/i18n/`.
Bản dịch `fr-vi` tuân theo `TRANSLATION-STYLE-vi.md`; tài liệu này mở rộng
cho nội dung **viết mới** bằng tiếng Việt.

## 1. Giọng và ngôi

- Tiếng Việt chuẩn miền Bắc, văn viết trung tính. Người học là **bạn**;
  ứng dụng tự xưng **mình** chỉ khi nói về điều nó nghe được hay kiểm tra
  được ("Mình nghe thấy…"). Không dùng "em", "anh/chị", "quý vị".
- Câu ngắn (≤ 25 từ). Một ý mỗi câu. Không cảm thán dồn dập, không emoji
  ngoài các emoji nguồn đã có (📣 ✓ và cờ).
- Ngôn ngữ đích viết đúng chính tả bản ngữ (dấu, hoa/thường, ß, ñ, kana,
  Hán tự, Hangul). Không phiên âm bằng chữ Việt ("bông-giua") trong văn bản
  học — gợi ý cách đọc đặt trong thẻ khái niệm và luôn nói rõ "gần giống".
- Không dịch sát tiêu đề tiếng Anh (calque). Tránh các cụm như "hiệu quả cao"
  (high-yield), "tần suất cao" (high-frequency), "nền tảng cốt lõi" (core
  foundations) trong tiêu đề và lời nhắn cho người học. Viết như người Việt
  nói: "Những động từ dùng nhiều nhất", "Những từ hay gặp nhất".

## 2. Thuật ngữ ngữ pháp (cố định — xem thêm `GLOSSARY.md`)

| Khái niệm | Tiếng Việt | Ghi chú |
|---|---|---|
| noun / verb / adjective / adverb | danh từ / động từ / tính từ / trạng từ | |
| article (definite / indefinite) | mạo từ (xác định / không xác định) | |
| masculine / feminine / neuter | giống đực / giống cái / giống trung | không "nam/nữ" |
| singular / plural | số ít / số nhiều | |
| subject / object | chủ ngữ / tân ngữ | |
| conjugation; to conjugate | chia động từ | |
| infinitive | động từ nguyên thể | |
| present / past / future | thì hiện tại / quá khứ / tương lai | |
| case (nominative / accusative / dative / genitive) | cách (chủ cách / đối cách / tặng cách / sở hữu cách) | tiếng Đức |
| particle | trợ từ | tiếng Nhật / Hàn |
| counter / measure word | lượng từ | tiếng Nhật / Trung |
| tone | thanh điệu | tiếng Trung; so sánh với 6 thanh tiếng Việt |
| pitch accent | trọng âm cao độ | tiếng Nhật |
| politeness level | mức lịch sự | tiếng Nhật / Hàn |
| liaison / elision | nối âm / lược âm | tiếng Pháp |
| cognate / false friend | từ cùng gốc / "bạn giả" | |
| syllable / stress | âm tiết / trọng âm | |

Dùng tên tiếng Việt kèm thuật ngữ bản ngữ trong ngoặc ở lần đầu trong
một thẻ khái niệm: "cách (Kasus)", "trợ từ (助詞)".

## 3. So sánh với tiếng Việt (bắt buộc trong thẻ khái niệm)

Mỗi thẻ khái niệm nêu điểm người Việt hay vấp (từ `briefs/<target>-vi.md`)
bằng MỘT câu so sánh cụ thể: "Tiếng Việt nói *tôi đã đi*; tiếng Tây Ban Nha
đổi chính động từ: *fui*." Không giảng lý thuyết đối chiếu dài.

## 4. Sự thật và sự trung thực

- Quy tắc "luôn luôn" chỉ khi dữ liệu dẫn xuất ≥ 99,5 % và ngoại lệ được
  nêu tên; nếu không, viết "thường", "hầu hết". Số liệu phải trỏ tới
  `content/<target>/lexicon/derived/*.json`.
- Không tái tạo câu mô tả CEFR (descriptor) — chỉ nêu tên thang đo và mức.
  Danh sách cụm cấm nằm trong `scripts/lib/authoring/lint.ts`
  (CEFR_DESCRIPTOR_PHRASES).
- Kết quả kiểm tra là "ước tính theo khung CEFR", "không phải chứng chỉ",
  "không phải kỳ thi chính thức". Không hứa hẹn ("bạn sẽ nói trôi chảy").
- Không câu chuyện bịa về người thật; nhân vật hư cấu có tên bản ngữ
  thông thường (Léa, Mateo, Mia, Yuki, Minji, Xiaomei…).

## 5. Độ dài và mức đọc

| Chuỗi | Giới hạn |
|---|---|
| Sách hướng dẫn (guidebook) đơn vị | 600–2 000 ký tự, ≥ 3 tiêu đề phụ hoặc gạch đầu dòng; có ví dụ ngôn ngữ đích in nghiêng |
| Mô tả đơn vị | ≤ 90 ký tự |
| Giải thích khái niệm | 2–6 câu, ≤ 700 ký tự |
| Quy tắc ngắn (shortRule) | 1 câu, ≤ 140 ký tự |
| Câu can-do | 1 câu bắt đầu bằng "Tôi có thể", ≤ 220 ký tự, nêu hành động + bối cảnh |
| Hướng dẫn bài tập / lời dẫn hội thoại | ≤ 120 ký tự |
| Câu ví dụ ngôn ngữ đích (A1) | ≤ 12 từ (≤ 20 âm tiết tiếng Nhật/Trung) |
| Bài đọc | ≤ 60 token (unit ≤ 2), ≤ 90 token (unit 5) |

## 6. Mẫu câu cố định

- Hướng dẫn: "Chọn bản dịch đúng.", "Nghe rồi chọn câu bạn nghe thấy.",
  "Gõ bằng tiếng <đích>.", "Nói câu này bằng tiếng <đích>.", "Viết một
  câu ngắn…", "Chọn mạo từ đúng."
- Can-do: "Tôi có thể <hành động> <bối cảnh>." Không "Tôi biết…", không
  "Tôi hiểu ngữ pháp…".
- Phản hồi viết (rubric): "Thiếu <ô>: …", "Hơi dài: …", "Có vẻ không phải
  tiếng <đích>." — trung tính, không mỉa mai.
- Mục tiêu hội thoại: "<Việc cần làm> <ở đâu / với ai>." (một câu).

## 7. Những gì KHÔNG dịch / không đổi

Tên riêng, địa danh bản ngữ, tiêu đề đơn vị bằng ngôn ngữ đích khi nguồn
để nguyên (Section 3–6 kiểu *Écoute !*), id, mã khoá, số liệu, emoji, dấu
ngoặc giữ nguyên.

## 8. Kiểm tra trước khi nộp OUTPUT.jsonl

1. Mỗi dòng là một JSON hợp lệ đúng schema trong PROMPT.md.
2. Mọi id (lexeme, objective, clip) lấy từ danh sách cho phép — không bịa.
3. Không chuỗi tiếng Anh sót trong trường `vi`; không chuỗi `TODO:`.
4. Mỗi quy tắc "luôn luôn" có bằng chứng; mỗi số liệu có nguồn.
5. Đọc lại bằng mắt người học Việt: câu nào cần đọc hai lần thì viết lại.
