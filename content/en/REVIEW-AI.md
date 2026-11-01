# en-vi — duyệt bằng AI mô phỏng người bản ngữ (D-10)

Quyết định D-10 (29/10/2026, `plan/01-TONG-QUAN-VA-QUYET-DINH.md`): dự án không
thuê người duyệt bản ngữ. Khoá này được duyệt theo `plan/prompts/P-ai-review.md`
bởi các agent riêng, ngữ cảnh mới, đóng vai giáo viên tiếng Anh Mỹ bản ngữ đọc được
tiếng Việt. Đây **không phải** duyệt của người bản ngữ; app ghi trung thực: "Nội dung
được AI kiểm duyệt kỹ, chưa qua giáo viên bản ngữ."

## Phạm vi và kết quả lượt duyệt

| Lượt | Đã đọc | P0 | P1 | P2 | Tổng |
|---|---|---|---|---|---|
| Đáp án (chạy trước) | 1.055 dòng: bài tập, kiểm tra, xếp lớp, đề luyện bậc 2 | 107 | 17 | 16 | 140 |
| Ngôn ngữ (tiếng Anh, tiếng Việt, đối chiếu) | 2.561 dòng: truyện, đọc, nghe, kịch bản, từ vựng, hướng dẫn, thẻ ngữ pháp | 17 | 94 | 85 | 196 |

Trong 196 lỗi của lượt ngôn ngữ có 44 lỗi về IPA. Hầu hết 107 lỗi P0 của lượt đáp án cùng
một dạng: câu trả lời đúng của người học chưa được chấp nhận.

Người duyệt đáp án không thấy dữ liệu đáp án của kịch bản hội thoại, nên phần đó do phiên
viết nội dung tự rà theo cùng tiêu chuẩn: 16 nhóm thay đổi, ghi là `own review`. Việc này
không độc lập và không tính vào 140 lỗi.

Quyết định cho từng lỗi nằm trong `content/en/_drafts/review/decisions-answers.json`
và `decisions-language.json`:

| Quyết định | Số lỗi |
|---|---|
| Đã sửa trong nội dung | 325 (139 đáp án, 186 ngôn ngữ) |
| Sửa theo cách khác: giữ quy tắc Mr./Mrs./Ms. đi với họ, đổi tên nhân vật theo quyết định của anh | 1 |
| Giữ nguyên, có lý do: từ cần dùng vượt mức từ của truyện (ở 4 dòng, tiếng Việt được chỉnh cho khớp) | 6 |
| Giữ nguyên, chờ anh quyết định (xem "Chưa chắc") | 4 |

## IPA

868 từ, tất cả là General American:

| Nguồn | Số từ | Cách lấy |
|---|---|---|
| `kaikki-en` (Wiktionary, CC BY-SA 4.0) | 771 | Giữ nguyên giá trị trong `content/en/lexicon/derived/ipa-general-american.json`: 459 dòng gắn nhãn General American, 118 dòng gắn nhãn US, 194 dòng không nhãn khớp với cột viết tay |
| `original-english-course` | 97 | Viết tay: từ không có giá trị có giấy phép, hoặc giá trị bị lượt duyệt bác (`IPA_FIXED` trong `en-lex.py`) |

So với cột viết tay: 389 giống hệt, 370 chỉ khác cách ghi, 12 khác âm hoặc trọng âm
(`content/en/_drafts/review/ipa-diff.json`). Các số đếm từ fifteen đến seventeen được ghi
lại cho đồng nhất với các số đếm *-teen* khác: dùng /i/, có trọng âm phụ. Vì vậy ba từ này
giờ có nguồn `original-english-course`. Riêng *nineteen* vẫn theo `kaikki-en`.

Cách ghi của các giá trị kaikki chưa đồng nhất: xem mục 1 ở "Chưa chắc".

## Đối chiếu thêm

- **LanguageTool (en-US):** 4.724 chuỗi tiếng Anh, 396 kết quả đều được cho phép và có lý do
  (`content/en/languagetool-allow.json`), 0 lỗi, 0 mục cũ. Chạy trên máy; CI chưa chạy cho
  khoá này.
- **Dịch ngược:** 3.860 cặp, 43 cờ, đã đọc hết, không cờ nào còn mở
  (`content/en/_drafts/BACKTRANSLATION.md`). Script chạy trong chính phiên đã viết nội
  dung, nên bước này không độc lập.

## Audit độc lập 10 %

- Một agent khác, ngữ cảnh mới, đọc mẫu ngẫu nhiên (seed 20261102) trong các dòng lượt
  duyệt **không** đổi, tổng **329 dòng**:
  - 92 / 919 dòng bài tập;
  - 237 / 2.367 dòng ngôn ngữ.
- Kết quả: 2 P0, 2 P1, 13 P2 → **0,6 % P0 và 0,6 % P1, tổng 1,2 %**, dưới ngưỡng 2 %. Không
  cần duyệt lại cả khoá.
- Audit cũng soát lại 10 bản sửa chọn ngẫu nhiên: cả 10 đều đúng.
- Cả 17 lỗi audit đã được sửa (`findings-audit.json`, `decisions-audit.json`). Hai lỗi P0 đều
  là câu đúng bị từ chối: *Hello everyone* ở bài chào, *I really like soccer* ở bài viết.
- Giới hạn của những gì audit đã đọc:
  - Agent đọc từng dòng trong mẫu, không đọc liền mạch cả khoá. Dòng của một truyện được xét
    riêng; với `yuki_and_the_menu`, agent ghi rõ chỉ đọc dòng 11 đến 16.
  - Câu hỏi đề thi được đọc cùng phương án và mã bài đọc hoặc mã clip. Nếu bài đọc hoặc clip
    đó không rơi vào mẫu, agent không thấy văn bản của nó.
  - Agent không chạy app và không nghe gì: khoá này chưa có âm thanh khi audit chạy.
  - Tỉ lệ 1,2 % là ước tính từ một mẫu. 329 dòng không loại trừ được các lỗi chưa rơi vào mẫu.
- Cách chọn mẫu: `content/en/_drafts/review/en-vi-audit-sample.py`, số liệu trong
  `en-vi-audit-sample.json`.

## Chưa chắc (anh quyết định — không chặn việc gì)

Đang giữ nguyên, chờ anh:

1. **en:w:he (cách ghi IPA toàn khoá):** các giá trị kaikki ghi lẫn he /ˈhiː/ với she /ʃi/,
   có dấu chấm âm tiết và dấu nối. Âm đúng, nhưng hai mục có thể trông khác nhau dù không
   khác. Chuẩn hoá thì đổi khoảng 770 giá trị và cả ghi chú nguồn; đây là quyết định kỹ thuật
   nên làm lúc hiển thị hoặc biên dịch.
2. **en.story.raj_learns_vietnamese#11:** chuyện đùa *cá / chó* không phải "đổi một chút" với
   người Việt; *cá / cà* vừa đúng vừa vui hơn, nhưng *eggplant* vượt A1. Có đáng thêm một từ
   không?
3. **en.clip.bac2_a_l1_01:** ga ở Mỹ nói *track four*, còn clip nói *platform*. Đang giữ: bối
   cảnh là ga Việt Nam, *platform* là từ A2-1 khoá dạy, đáp án vẫn là Số 4.
4. **en-vi:ua-l1-e6:** có nên nhận *The key is on a table* không? Đang không nhận, vì bài này
   dạy *the*.

Đã sửa phần an toàn, phần còn lại chờ anh:

5. **en.exi.bac2_qd1481.a_s4_01, b_s4_01:** đã nhận *so*, *since* làm từ nêu lý do. Nhưng
   *I agree because* mà không nói lý do vẫn qua. Một ô bắt buộc chặt hơn là quyết định của
   người soạn.

Đã sửa theo cách người duyệt đề nghị, nhưng người duyệt không chắc đó có phải chủ ý ban đầu:

6. **en-vi:uf-l1-e7:** bài nghe chép *a key* trước đây nhận cả *key*; đã bỏ, vì nghe chép chấm
   đúng dạng và đây là bài duy nhất cho thiếu một từ. Muốn nhận lại thì báo Claude.
7. **en.story.yuki_and_the_menu#14:** *hot* đã dịch là "Cay thật" thay vì "Nóng thật", vì cả
   truyện nói về độ cay. Tiếng Anh giữ nguyên nên vẫn hiểu được cả hai nghĩa.

## Chấp nhận

Profile `en-vi` chỉ được ghi `review: { kind: "ai-simulated", … }` sau khi anh đánh ☑
dòng `ai-review:en-vi` trong `plan/OWNER-FINAL-CHECKLIST.md` B. Gate biên dịch kiểm tra
điều đó (`reviewGateErrors`).
