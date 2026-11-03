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
tiếng Nhật đã đổi (5 clip kịch bản, các câu truyện và `audioTarget` của bài học; sau audit thêm
`ja.clip.ix_a1cap_neighbor_0_s` và ba câu truyện) sẽ vào cùng một lượt sinh âm thanh, như
P-ai-review yêu cầu.

## Audit độc lập 10 %

Một agent thứ ba, ngữ cảnh mới, đóng vai giáo viên tiếng Nhật bản ngữ đọc được tiếng Việt, chỉ đọc
(không sửa) worktree ở commit 42d78cd8, ngày 03/11/2026. Kết quả gốc:
`content/ja/_drafts/review/findings-audit.json`; cách lấy mẫu: `ja-vi-audit-sample.py` (cùng thư mục).

**Mẫu.** Một "dòng" là một đơn vị người duyệt chấm: một bài tập, một câu kiểm tra, một câu truyện,
một khối bài đọc, một clip, một từ vựng (nghĩa tiếng Việt và câu ví dụ), một dòng hướng dẫn bài học…
Tập để rút mẫu là các dòng lượt duyệt đầu **không** nêu tên: bỏ mọi id trong hai file lỗi (kể cả
`alsoAffects`), bài học trỏ tới bài nói / bài viết / kịch bản đã nêu, và mọi dòng của bài đọc, thẻ
ngữ pháp, hướng dẫn bài, kịch bản đã nêu. Các dòng mà quy tắc sửa có hệ thống đã đổi nhưng không lỗi
nào nêu tên vẫn ở trong tập. Hạt giống `random.Random(20261104)`, id được sắp xếp, rút
`ceil(10 %)` mỗi nhóm, bài tập trước, ngôn ngữ sau, rồi 10 bản sửa (5 đáp án, 5 ngôn ngữ P0/P1).

| Nhóm | Số dòng | Chưa bị nêu | Rút mẫu | Theo loại |
|---|---|---|---|---|
| Bài tập | 1.291 | 1.178 | 118 | bài học 87, kiểm tra 10, JLPT N5 21 (xếp lớp: 19 dòng, không dòng nào rơi vào mẫu) |
| Ngôn ngữ | 3.177 | 2.884 | 289 | truyện 117, từ vựng 73, hướng dẫn bài 45, clip 23, bài đọc 15, thẻ ngữ pháp 12, bảng kana 2, kịch bản 2 |
| **Tổng** | | | **407** | |

**Kết quả.**

| Nhóm | P0 | P1 | P2 | P0 + P1 |
|---|---|---|---|---|
| Bài tập (118) | 3 | 0 | 3 | 2,54 % |
| Ngôn ngữ (289) | 0 | 0 | 9 | 0 % |
| **Tổng (407)** | **3** | **0** | **12** | **0,74 %**, dưới ngưỡng 2 %: **đạt** |

Soát lại 10 bản sửa: 10/10 đúng. Một bản (`ja.story.power_cut` #3) đúng nhưng còn một ghi chú P2,
không tính là lỗi.

**Lưu ý về đáp án.** Ngưỡng 2 % tính trên mọi dòng đã đọc, như audit của en-vi và it-vi. Riêng
nhóm bài tập là 3/118 = 2,54 %, cao hơn 2 %. Với 3 lỗi, khoảng tin cậy 95 % rất rộng (khoảng 0,5 %
đến 7 %). Cả ba P0 cùng loại chính của lượt đầu (câu trả lời đúng bị chấm sai vì thiếu một cách
viết) và là "anh em" của các dạng quy tắc 8 chưa phủ tới. Vì vậy không sửa từng câu mà thêm ba quy
tắc vào bộ sinh nội dung (`_generators/ja_text.py`), và quy tắc 9 của `ja-check-answers.py` kiểm
tra lại cả ba trên mọi mục. Chạy quy tắc 9 trên dữ liệu trước khi sửa thì nó bắt đúng ba P0 của audit
và các mục cùng dạng, nên một lần sửa sau mà bỏ sót các dạng này thì pipeline dừng.

| Quy tắc (P0 của audit) | Nội dung | Số mục thay đổi |
|---|---|---|
| Lời nhờ không có を (`ja-vi:us-l3-e6`) | Mọi đáp án Nをお願いします nhận thêm N、お願いします; số đếm giữ trước động từ (切符、1枚お願いします). Áp dụng cho câu gõ, bài nói, kịch bản và bài viết | 3 câu gõ (`us-l3-e6`, `ud-l2-e7`, `us-l2-e5`), 2 bài nói (`ja.speak.m_tickets`, `ja.speak.cp4_tickets_three`, cùng 2 bài tập dùng chúng), 1 lượt kịch bản (`ja.scenario.restaurant_order` l1) |
| Xin lỗi cho việc đã làm (`ja.cpi.s4.sorry_cup`) | Đề bài kể một việc bạn đã làm rồi bảo "Hãy xin lỗi" (không có sẽ / đang / sắp / muốn): mọi đáp án kết thúc bằng すみません / 申し訳ありません nhận thêm すみませんでした / 申し訳ありませんでした | 2 bài nói (`ja.speak.cp4_sorry_cup`, `ja.speak.k_sorry`, cùng 2 bài tập dùng chúng) |
| Số lượng chen giữa N が và あります (`ja.cpi.s5.room`) | Ô bài viết mà mô tả tiếng Việt nêu số lượng (có một cái giường) nhận thêm ベッドが一つあり, ベッドはあり, ベッドは一つあり. Bộ chấm viết đọc 1つ như 一つ (ひとつ), nên không cần biến thể chữ số | 1 ô (`ja.write.cp5_room` bed, cùng câu kiểm tra dùng nó) |

Các P2 của audit:

| Mục | Quyết định |
|---|---|
| `ja-vi:up-l2-e5` (けど) | Đã sửa: nhận thêm 仕事は大変ですけど、楽しいです và …けれど… |
| `ja-vi:um-l0-e5`, `um-l0-e6` (số điện thoại bằng chữ số) | Chưa chắc, để lượt âm thanh: kiểm tra trong audit ASR/CER xem clip có đọc từng chữ số không (ゼロきゅうゼロ…) |
| `ja.cpi.s5.profile_hoa` (二十四歳) | Giữ nguyên: đã được nhận. Bộ chấm viết đổi chữ số sang số chữ Hán trước khi so (24歳 và 二十四歳 cùng thành 二十四 歳; đã chạy thử `normalizeWritten`) |
| `ja.clip.ix_a1cap_neighbor_0_s` | Đã sửa: câu nói lại là 隣の部屋の方ですか。 (clip mới, chờ lượt âm thanh) |
| `ja:concept:counters` ví dụ 2 | Đã sửa: ご家族は何人ですか。 |
| `ja:w:otoko` | Sửa theo cách khác: 男の先生が二人います。 / Có hai thầy giáo nam. `ja:w:onna` có cùng lỗi (女のトイレ…), sửa thành 女の先生は田中さんです。 |
| `ja:w:shikashi` | Đã sửa: 日本語は難しいです。しかし、おもしろいです。 / Tiếng Nhật khó. Tuy nhiên, rất thú vị. |
| `ja:w:dore` | Đã sửa tiếng Việt: Cái nào thì được? |
| `ja.story.pharmacy` #2 | Đã sửa: …薬局へ行きました。 |
| `ja.story.bag_on_the_train` #6 | Sửa theo cách khác: ナムさんはとても心配しています。 (心配する là từ mới của truyện) |
| `ja.story.garbage_day` #3 | Giữ ごみの箱: ごみ箱 đọc là ごみばこ, mà furigana lấy từ 箱 sẽ hiện はこ; ごみ置き場 không có trong từ vựng |
| `ja.story.dinner_for_colleagues` #0 | Đã sửa: 同じ会社の人です。 / Lan và Nam làm cùng một công ty. |
| `ja.story.power_cut` #3 (ghi chú khi soát bản sửa) | Giữ 何もわかりません: 見える không có trong từ vựng của khoá, và bộ kiểm tra truyện từ chối mọi từ không phải từ vựng (đã thử みえません) |

Sau các sửa, `ja-pipeline.sh` cho 0 lỗi tự kiểm tra (108 bài, 1.024 bài tập, 267 câu đánh giá;
45 truyện, 1.083 câu).

## Chưa chắc (anh quyết định — không chặn việc gì)

Đã quyết định:

1. **Bài gõ katakana** (`ja-vi:ue-l0-e7`, `ue-l3-e5`, `ue-l3-e6`, `uo-l0-e4`, `uo-l0-e5`,
   `ur-l1-e0…e2`, `ja.cpi.s2.type_vietnam`): điều phối viên chọn cách (a). Bài gõ có cờ mới
   `script: "katakana"`; bộ chấm so bài đó mà không đổi katakana sang hiragana (ぱん không còn được
   nhận cho パン; chữ katakana nửa độ rộng và dấu - gõ thay ー vẫn được nhận). Schema, validator (chỉ
   cho ngôn ngữ có cách so này, tức tiếng Nhật, và chỉ trên đáp án viết bằng katakana) và test có
   trước. Bộ sinh đặt cờ cho mọi bài gõ mà đề bài nói "katakana"; `uo-l0-e5` (コーヒー, đề bài nói
   "chữ Nhật") cũng có cờ, vì こーひー là viết sai. Quy tắc tự kiểm tra mới bắt bài gõ "katakana"
   không có cờ. Các bài khác và các ngôn ngữ khác không đổi. Phiếu điền (`simpleForm`, "Tên viết bằng
   katakana") chưa có cờ này: bộ chấm viết vẫn đổi kana.

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
vào profile. Gate biên dịch kiểm tra điều đó (`reviewGateErrors`). Audit độc lập ở trên đã đạt.
