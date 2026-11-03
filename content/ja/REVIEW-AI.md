# ja-vi — duyệt bằng AI mô phỏng người bản ngữ (D-10)

Quyết định D-10 (29/10/2026, `plan/01-TONG-QUAN-VA-QUYET-DINH.md`): dự án không
thuê người duyệt bản ngữ. Khoá này được duyệt theo `plan/prompts/P-ai-review.md`
bởi hai agent riêng, ngữ cảnh mới, đóng vai giáo viên tiếng Nhật bản ngữ dạy người
Việt (độc lập với các phiên đã viết nội dung). Đây **không phải** duyệt của người bản
ngữ; app ghi trung thực: "Nội dung được AI kiểm duyệt kỹ, chưa qua giáo viên bản ngữ."

## Phạm vi và kết quả lượt duyệt

| Lượt | Đã đọc | P0 | P1 | P2 | Tổng |
|---|---|---|---|---|---|
| Đáp án (chạy trước) | 1.534 mục có chấm điểm: 1.024 bài tập, 112 câu kiểm tra, 21 câu xếp lớp, 134 câu đề luyện JLPT N5 (cùng 48 clip, 10 bài đọc), 52 bài nói, 35 bài viết, 21 kịch bản (42 lượt người học), 135 câu hỏi truyện | 62 | 18 | 7 | 87 |
| Ngôn ngữ (tiếng Nhật, tiếng Việt, đối chiếu) | toàn bộ 45 truyện (1.084 câu, 135 câu hỏi, 45 lời giới thiệu), 25 thẻ ngữ pháp, bảng kana và 20 câu kiểm tra, 160 mục Hán-Việt, 38 bài đọc, 268 clip, 21 kịch bản, 52 bài nói, 35 bài viết, 27 hướng dẫn bài học; 319 / 957 từ vựng (một phần ba) và 342 / 1.024 bài tập (một phần ba), cộng một lượt quét bằng biểu thức chính quy trên cả 957 câu ví dụ và mọi chuỗi tiếng Nhật của 1.024 bài tập | 3 | 40 | 64 | 107 |

Người duyệt đáp án ghi 2 lỗi "chưa chắc", người duyệt ngôn ngữ 17. Phần lớn 62 lỗi P0 của
lượt đáp án cùng một dạng: câu trả lời đúng của người học chưa được chấp nhận (thiếu
わたしは / わたしの, thiếu cách viết kana của bài chia động từ, thiếu cách viết kanji mà
bàn phím điện thoại đưa ra, thiếu số viết bằng chữ số hoặc chữ Hán).

Quyết định cho từng lỗi nằm trong `content/ja/_drafts/review/decisions-answers.json`
và `decisions-language.json` (cùng thư mục với hai file lỗi gốc):

| Quyết định | Đáp án | Ngôn ngữ | Tổng |
|---|---|---|---|
| Đã sửa trong bộ sinh nội dung | 79 | 92 | 171 |
| Sửa theo cách khác (lý do ghi trong từng mục) | 6 | 9 | 15 |
| Sửa một phần, phần còn lại giữ có lý do | 0 | 1 | 1 |
| Giữ nguyên, có lý do | 1 | 5 | 6 |
| Chờ anh quyết định (xem "Chưa chắc") | 1 | 0 | 1 |
| **Tổng** | **87** | **107** | **194** |

File ngôn ngữ có thêm một mục `_summary` (phạm vi người duyệt đã đọc), ghi "not a finding".

"Sửa theo cách khác" phần lớn vì từ người duyệt đề nghị nằm ngoài mức từ của truyện (日本人,
人 và 社員 không thuộc bậc A1-0; 次の月 không có từ 月; その後 thuộc bậc A1-2), hoặc vì chữ
kanji không có cách đọc trong từ điển của khoá (降りました, もう一度 ngoài cụm cố định). Mỗi
mục ghi câu đã dùng thay.

## Sửa có hệ thống

Người duyệt chỉ đọc mẫu, nên các dạng lỗi lặp lại được sửa bằng quy tắc trong thư viện sinh
nội dung (`_generators/ja_text.py`, `ja_lesson_lib.py`, `ja_paradigms.py`, `ja_stories_lib.py`)
và được kiểm tra lại ở `ja-check-answers.py` (quy tắc 8) và `ja-check-stories.py` (quy tắc 8).
Một lần sửa sau này mà bỏ sót các dạng này thì bước tự kiểm tra dừng pipeline.

| Quy tắc | Số mục thay đổi | Trong đó người duyệt đã nêu | Thêm ngoài mẫu |
|---|---|---|---|
| Chủ ngữ hoặc người sở hữu mà câu tiếng Việt nói rõ: "Tôi …" → わたしは…, "Bố tôi …" → わたしの… | 29 câu gõ | 26 | 3 |
| Số trước lượng từ viết cả bằng chữ số và chữ Hán (3つ ⇄ 三つ, 11時 ⇄ 十一時) | 8 câu gõ | 6 | 2 |
| Từ chỉ thời gian đầu câu có hoặc không có は (昨日は… ⇄ 昨日、…) | 6 câu gõ | 2 | 4 |
| Cách viết kanji của bàn phím (分かりました, 行ってきます, 彼女, お疲れ様です, 気を付けて, お願い) và 大きな / 小さな, cho câu gõ, bài nói, kịch bản và bài viết | 29 mục | 21 | 8 |
| Bài chia động từ nhận cả cách viết kana | 9 bài | 9 | 0 |
| Nghe chép nhận mọi cách viết trộn kanji và kana của từng từ | 5 bài | 5 | 0 |
| Câu ví dụ trong từ điển đọc theo cùng quy tắc của bài học (số trước lượng từ bằng chữ số khi furigana vẫn đúng, なん trước です, không có kanji thiếu cách đọc) | 108 câu ví dụ | 12 theo mã, 18 nữa trong danh sách của lỗi `ja:w:gozen` | khoảng 78 |
| Truyện: dấu ？ ！ toàn khổ | 27 câu | cả nhóm | 0 |
| Truyện: bước kiểm tra bắt từ chỉ tương lai đi với động từ quá khứ, và lời người kể dùng 父 / 母 / 兄 / 姉 cho gia đình nhân vật | quy tắc mới, 0 lỗi còn lại | — | — |

Câu ví dụ tiếng Nhật trong từ điển hiện furigana lúc chạy, giống bài học. Vì thế 九時 (くじ)
sẽ hiện きゅうじ và 十分 dễ bị đọc là じゅうぶん. Bước kiểm tra mới đọc cả 957 câu ví dụ. Riêng
các từ số chữ Hán (二, 三, 九 …) được để nguyên chữ Hán trong ví dụ của chính nó, và cách đọc đã
được chọn bằng tay cho đúng (九百円 きゅうひゃくえん, 十時 じゅうじ).

Sau khi sửa, hai lần chạy `ja-pipeline.sh` cho kết quả giống nhau từng byte. Bước tự kiểm
tra: 108 bài, 1.024 bài tập, 267 câu đánh giá, 0 lỗi; truyện: 45 truyện, 1.083 câu (bỏ một
câu của `power_cut`), 135 câu hỏi, 0 lỗi.

## Dòng romaji (sửa trong mã)

Trình đọc truyện ghép cả câu rồi mới đổi sang Hepburn, nên từ kana và trợ từ dính nhau:
パンを thành "pan'o". Nay romaji tách từ theo đúng các mảnh mà bộ cắt câu của truyện đã
chia ("pan o"); dấu ' chỉ đứng trong một từ (きんえん → kin'en). Dòng romaji của bài học
cũng được sửa: を luôn là một từ riêng, đuôi động từ không bị tách (食べました là
tabemashita, không phải "tabema shita"), và します / あります / います sau trợ từ là một từ
(何かありましたか → nani ka arimashita ka). Test viết trước, đỏ rồi xanh
(`src/lib/__tests__/romaji-line.test.ts`, `story-reading.test.ts`); ảnh chụp của test tích
hợp truyện từng ghi đúng lỗi này và đã được cập nhật.

## Âm thanh

Khoá ja-vi chưa sinh âm thanh (bước kiểm tra bản nháp chỉ báo thiếu file âm thanh). Các câu
tiếng Nhật đã đổi (5 clip kịch bản, các câu truyện và `audioTarget` của bài học) sẽ vào cùng
một lượt sinh âm thanh, như P-ai-review yêu cầu.

## Audit độc lập 10 %

Chờ audit. Một agent khác, ngữ cảnh mới, sẽ đọc lại mẫu ngẫu nhiên 10 % các dòng không đổi
trong lượt duyệt, và soát lại một số bản sửa. Nếu tỉ lệ P0 + P1 vượt 2 %, lượt duyệt của khoá
phải làm lại. Kết quả sẽ được ghi ở đây.

## Chưa chắc (anh quyết định — không chặn việc gì)

Đang giữ nguyên, chờ anh:

1. **Bài gõ katakana** (`ja-vi:ue-l0-e7`, `ue-l3-e5`, `ue-l3-e6`, `uo-l0-e4`, `uo-l0-e5`,
   `ur-l1-e0…e2`, `ja.cpi.s2.type_vietnam`): đề bài nói "gõ bằng katakana", nhưng bộ chấm gõ tự
   đổi katakana sang hiragana trước khi so, nên ぱん cũng được nhận. Nội dung không sửa được
   việc này. Hai cách: (a) thêm cờ cho bài gõ để chấm không đổi katakana (sửa engine, schema và
   validator); (b) bỏ chữ "bằng katakana" khỏi đề bài. Anh chọn cách nào thì báo Claude.

Đã giữ nguyên có lý do (anh có thể đổi ý):

- `ja.story.watch_for_father` #18, #19: giữ 白の時計, vì 白い thuộc bậc A1-2, cao hơn truyện A1-1.
  白の時計 vẫn đúng ngữ pháp.
- `ja.story.dorm_rules` #16: giữ 何かありませんか (質問 thuộc bậc A1-2); tiếng Việt sửa thành
  "Em còn gì muốn hỏi không?".
- `ja.story.umbrella` #13: giữ 晴れです (晴れる thuộc bậc A2-1).
- `ja.story.garbage_day` #8: giữ 食べ物のごみ. もえるごみ có động từ thể thường, mà truyện trước
  bậc A2-1 không dùng; bài học và đề JLPT đã dạy もえるごみ.
- `ja.write.r_form_clinic` (và hai phiếu cùng dạng): giữ nhãn 誕生日, vì phiếu chỉ hỏi ngày và
  tháng. 生年月日 cần thêm năm vào gợi ý và thang chấm.
- `ja.write.r_form_office` và các phiếu cùng dạng: không thêm cách viết tên không dấu chấm, số
  điện thoại không gạch nối. Đọc mã nguồn thì thấy bộ chấm viết đã bỏ ・, - và khoảng trắng trước
  khi so (chưa chạy thử).
- Hướng dẫn bài j: giữ câu "dùng furigana trên chữ kanji", vì trình đọc truyện đã hiện furigana từ
  commit 6a72e3bc.

## Chấp nhận

Profile `ja-vi` vẫn là `betaUntilReviewed`. Chỉ khi anh đánh ☑ dòng `ai-review:ja-vi` trong
`plan/OWNER-FINAL-CHECKLIST.md` B, Claude mới ghi `review: { kind: "ai-simulated", … }`
vào profile. Gate biên dịch kiểm tra điều đó (`reviewGateErrors`). Nên đánh ☑ sau khi phần
audit độc lập ở trên có kết quả.
