# zh-vi — duyệt bằng AI mô phỏng người bản ngữ (D-10)

Quyết định D-10 (29/10/2026, `plan/01-TONG-QUAN-VA-QUYET-DINH.md`): dự án không thuê người duyệt bản ngữ. Khoá này
được duyệt theo `plan/prompts/P-ai-review.md` bởi các agent riêng, ngữ cảnh mới, đóng vai giáo viên tiếng Trung bản ngữ
dạy người Việt (độc lập với các phiên đã viết nội dung). Đây **không phải** duyệt của người bản ngữ; app ghi trung thực:
"Nội dung được AI kiểm duyệt kỹ, chưa qua giáo viên bản ngữ."

Theo quyết định điều phối QC-2026-11-05 §1.3, vì lượt đáp án đầu có 18 lỗi P0, khoá zh-vi chạy thêm **một lượt đáp án
thứ hai trên toàn bộ** (không chỉ mẫu 10 %), rồi mới đến audit độc lập. Hai dòng đó trong bảng dưới đây còn "chờ".

## Phạm vi và kết quả từng lượt

| Lượt | Đã đọc | P0 | P1 | P2 | Tổng | Chưa chắc |
|---|---|---|---|---|---|---|
| Đáp án, lượt 1 (04/11/2026) | 1.547 mục có chấm điểm: 976 bài tập của 108 bài học (cùng 66 clip và 29 bài đọc chúng dùng), 115 câu kiểm tra (7 bài, kể cả bài tổng kết A1), 22 câu xếp lớp, 80 câu HSK 1 và 120 câu HSK 2 (mỗi cấp hai đề), 52 bài nói, 35 bài viết, 21 kịch bản (42 lượt người học có chấm), 126 câu hỏi truyện | 18 | 33 | 5 | 56 | 4 |
| Ngôn ngữ, lượt 1 (tiếng Trung, tiếng Việt, đối chiếu; 05/11/2026) | 27/27 sách hướng dẫn đơn vị; 108/108 bài học (cả 976 bài tập); 42/42 truyện (902 câu, 126 câu hỏi, 42 lời giới thiệu) và một lượt quét bằng script giọng đọc theo tên nhân vật; 29/29 bài đọc và 30/90 bài đọc HSK; 222/222 clip và 30/90 clip HSK (quét tên và giọng trên cả 312); 21 kịch bản; 52 bài nói; 35 bài viết; 28 thẻ ngữ pháp; toàn bộ bài nhập môn thanh điệu và pinyin; 199 mục Hán-Việt; 302/906 từ vựng (một phần ba) cùng một lượt quét biểu thức chính quy trên cả 906 câu ví dụ | 0 | 25 | 80 | 105 | 4 |
| Đáp án, lượt 2 (toàn bộ) | chờ | chờ | chờ | chờ | chờ | chờ |
| Audit độc lập 10 % | chờ | chờ | chờ | chờ | chờ | chờ |

Lượt ngôn ngữ ghi kết quả dần theo từng đơn vị (`findings-language.jsonl` trong thư mục làm việc của phiên, rồi gộp
thành `findings-language.json`), đúng yêu cầu QC-2026-11-05 §1.4.

Phần lớn 18 lỗi P0 của lượt đáp án cùng một dạng: câu trả lời đúng của người học chưa được chấp nhận — một thứ tự ô
chữ đúng (我很高兴认识你, 给我试一下, 发照片给我吧, từ chỉ thời gian đứng đầu câu), một cách nói mà chính khoá học dạy hoặc
chấp nhận ở chỗ khác (我的名字是阮海, 扫码可以吗, 我来晚了, 我吃过了), 没 bên cạnh 没有, thứ tự "giá + một đơn vị" (十八块一碗)
mà ba bài nói về giá đều thiếu, và ô bài viết hẹp hơn tiếng Trung tự nhiên (喜欢听音乐, 见面). Lỗi P1 nặng nhất của lượt
ngôn ngữ: 块 dịch là "đồng" trong truyện (người Việt hiểu là tiền Việt: lương "7.000 đồng"), 斤 dịch là "cân" (người Việt
hiểu là 1 ký, trong khi 一斤 là nửa ký), một giọng đọc cho hai nhân vật trong cùng cảnh, 有火 thay cho 着火 trong bài
diễn tập chữa cháy, thẻ ngữ pháp cấm 我是阮海 (câu đúng mà khoá học chấp nhận), và "tr miền Bắc" trong thẻ phát âm.

Quyết định cho từng lỗi nằm trong `content/zh/_drafts/review/decisions-answers.json` và `decisions-language.json` (cùng
thư mục với hai file lỗi gốc `findings-answers.json`, `findings-language.json`):

| Quyết định | Đáp án | Ngôn ngữ | Tổng |
|---|---|---|---|
| Đã sửa trong bộ sinh nội dung (kể cả bằng quy tắc chung) | 55 | 93 | 148 |
| Sửa theo cách khác (lý do ghi trong từng mục) | 1 | 8 | 9 |
| Giữ nguyên, có lý do | 0 | 2 | 2 |
| Chờ anh quyết định (xem "Chưa chắc") | 0 | 2 | 2 |
| **Tổng** | **56** | **105** | **161** |

File ngôn ngữ có thêm một mục `_summary` (phạm vi người duyệt đã đọc), ghi "not a finding". Hai lỗi đã được điều phối
viên quyết định và đã làm trong commit ab15feae: nghe chép nhận chữ phồn thể (màn hình hiện chữ giản thể), và bộ chấm
bài nói, kịch bản và bài viết hiểu phủ định (不是 không phải là 是, 不能 không phải là 能) cho mọi khoá; riêng kịch bản
`cp6_clinic_cough` được sửa thêm nội dung: khái niệm "không sốt" nay là 不发烧 / 没发烧 / 没有发烧 / 没有, nên 我很不舒服
không còn được tính là "không sốt".

"Sửa theo cách khác" phần lớn vì từ người duyệt đề nghị không có trong từ điển của khoá, nên chữ sẽ hiện không có
pinyin: 常 đứng riêng (不常吃 → 很少吃), 完 (送完外卖 → 送了这些外卖以后), 唱 và 睡 đứng riêng, 顶 (楼顶), 翻译, 国籍 (籍
không có trong bản CC-CEDICT đã ghim), 美 (câu "Mùa thu rất đẹp" đổi thành "Mùa thu thời tiết rất đẹp" → 秋天天气很好).
Mỗi mục ghi câu đã dùng thay.

## Sửa có hệ thống

Người duyệt chỉ nêu một phần các chỗ cùng dạng, nên mỗi dạng lặp lại được sửa bằng một quy tắc trong thư viện sinh nội
dung (`_generators/zh_text.py`, `zh_lesson_lib.py`, `zh_layers.py`, `zh-writing-s5.py`, `zh-speech-s4.py`,
`zh_stories_lib.py`) và được kiểm tra lại ở `zh-check-answers.py` (quy tắc 10) và `zh-check-stories.py` (quy tắc 9).
Một lần sửa sau này mà bỏ sót các dạng này thì bước tự kiểm tra dừng pipeline.

| Quy tắc | Số mục thay đổi | Trong đó người duyệt đã nêu | Thêm ngoài mẫu |
|---|---|---|---|
| Ô chữ: mọi thứ tự của cùng các ô mà nghĩa không đổi được nhận (từ chỉ thời gian trước hoặc sau chủ ngữ; 给 + người trước động từ hoặc sau tân ngữ, với 发/打/打电话/寄/送/写/传; 住在 + nơi ⇄ 在 + nơi + 住) | 5 bài ô chữ | 4 | 1 (`uk-l2-e4`) |
| Cùng các thứ tự đó cho câu gõ và ô bài viết (我打电话给妈妈, 我在宿舍住) | 4 câu gõ, 2 ô bài viết | 2 | 4 (`uj-l0-e6`, `uo-l2-e2`, `zh.write.p_ask`, `zh.write.r_note`, cùng 2 bài tập dùng chúng) |
| 没 ⇄ 没有 trước động từ hoặc danh từ (câu hỏi A没A và 没有 cuối câu giữ nguyên) | 2 câu gõ | 2 | 0 |
| Giá theo đơn vị, cả hai thứ tự, có hoặc không 钱 (一碗十八块 ⇄ 十八块一碗 ⇄ 十八块钱一碗) | 3 bài nói, cùng 3 bài tập/câu kiểm tra dùng chúng | 6 | 0 |
| Ngày: 月…号 ⇄ 月…日 | 1 câu gõ, 2 bài nói, 1 ô phiếu, cùng các bài dùng chúng | cả nhóm | 0 |
| 是 + danh từ chỉ người ⇄ 是一个 + danh từ (我是工人 ⇄ 我是一个工人) | 5 câu gõ, 3 bài nói (cùng 4 bài dùng chúng), 1 lượt kịch bản | 1 (`uo-l3-e0`) | 8 |
| Tính từ + 一点儿 ⇄ 一点 ⇄ 点儿 ⇄ 点 (便宜点吧); bộ đổi số không còn đọc 便宜一点 là "một giờ" | 1 câu gõ | 1 | 0 |
| 疼 ⇄ 痛 | 2 câu gõ, 1 kịch bản (2 lượt) | 2 | 1 (`zh.scenario.clinic_doctor`) |
| Số điện thoại gõ không có gạch nối (13812345678 là một token, 138-1234-5678 là ba: đã chạy thử `normalizeWritten`) | 5 phiếu, cùng 2 bài tập dùng chúng | 5 | 0 |
| Bài ghép thẻ không được có hai thẻ tiếng Việt giống nhau (match.tsx nhận thẻ theo chữ) | 1 | 1 | 0 |
| Khái niệm kịch bản không được là từ phủ định trơn (不 / 没 / 别 / 不是 / 不要 / 不用) | 2 kịch bản | 1 | 1 (`cp6_supermarket_pay`: nay 不要了 / 没有了 / 不用了) |
| Tiếng Việt cạnh 块/元 nói "tệ", không nói "đồng"; cạnh 斤 không có chữ "cân" trơn (một 斤 là nửa ký) — trong bài tập, câu kiểm tra, ví dụ từ điển, kịch bản và truyện | 46 câu/lựa chọn "tệ" trong 10 truyện (Đài Loan: "Đài tệ"), 3 thẻ của từ 块; 斤: 15 mục bài học/kiểm tra/từ điển/kịch bản và 5 dòng của 1 truyện | các truyện người duyệt nêu, `ub-l2-e4/e6`, từ 斤 / 公斤 | 11 mục 斤 (`ub-l2-e0`, `ub-l2-e8`, `ui-l0-e8`, `ui-l0-e10`, `ui-l1-e3/e4/e7/e9`, `zh.exi.hsk_2.a_l3_05`, ví dụ của 多少钱, kịch bản `shop_fruit`) |
| Giọng truyện: mỗi truyện có hội thoại khai báo vai (A nữ, B nam, một nhân vật một giọng; người thứ ba được kể bằng lời người dẫn: 司机问：“…”); không giọng nào gọi tên chính nhân vật của mình hay tự trả lời câu hỏi của mình | 40 truyện khai báo vai (`stories/casts.json`); chạy trên truyện cũ, quy tắc bắt 5 truyện | 4 | 1 (`forgotten_wallet`, câu tự hỏi gộp thành một câu) và 3 truyện có hai nhân vật cùng giọng được kể lại (`spring_festival_call`, `overtime_for_sister`, `cough_at_the_clinic`) |
| Giọng clip: câu 我叫 / 我是 + tên, hoặc câu đáp lời gọi tên, phải là giọng của tên đó (A nữ, B nam); clip mẫu của bài nói lấy giọng theo tên | 3 clip | 3 | 0 |

`zh_text.py` cũng sửa lỗi báo nhầm ghi ở phiên 5: 长 chỉ bị coi là zhǎng khi nó là một từ riêng (长得, 长了, 长高), không
phải khi nằm trong một từ dài hơn (组长了, 厂长).

## Từ mới (qua ETL tiếng Trung, cách đọc từ CC-CEDICT, nghĩa tiếng Việt viết tay)

| Từ | Pinyin | Nghĩa | Bậc | Dùng ở |
|---|---|---|---|---|
| 红色 / 白色 / 黄色 | hóng sè / bái sè / huáng sè | màu đỏ / trắng / vàng | A1 | `un-l1-e5` 我喜欢红色, `un-l1-e6`, bài nói áo trắng, ví dụ của 黄 |
| 下面 | xià miàn | phía dưới | A1 | 杯子在桌子下面 (`uc-l1-e5`) |
| 搬家 | bān jiā | chuyển nhà | A1 | truyện `moving_day` |
| 幸福 | xìng fú | hạnh phúc | A1 | 祝你们幸福 (truyện `wedding_cups`) |
| 办 | bàn | làm (thẻ, giấy tờ) | A1 | 我想办一张银行卡 (`ur-l0-e2`, `ur-l2-e2`) |
| 着火 | zháo huǒ (chuỗi 着 + 火; 着 đứng riêng vẫn là zhe) | cháy | A2-1 | truyện `fire_drill`; ví dụ của 楼梯 nay đọc đúng |
| 按 | àn | bấm | A2-1 | clip an toàn nhà máy 按这个红的 |
| 打扫 | dǎ sǎo (chuỗi 打 + 扫) | quét dọn | A2-1 | truyện `renting_a_flat` |

Từ vựng: 906 → 916 (A1 718 → 725, A2-1 188 → 191); id cũ không đổi. Các từ người duyệt gợi ý nhưng không có trong bản
CC-CEDICT đã ghim (国籍, 内用 / 外带, 国语, 菸, 抽烟, 鞋子, 嗓子, 张开, 楼顶, 师傅) không được thêm; nơi cần, câu được viết lại
bằng từ đã có, còn đáp án gõ (không bao giờ hiện ra) vẫn nhận chúng (别抽烟, 两双鞋子).

Bài nhập môn thanh điệu (`content/zh/primer/script-primer.json`) đổi một câu (thanh 2: «Á?» thay cho «hả?»); bản biên dịch
`src/content/primer/zh.json` và tờ duyệt `content/zh/primer/REVIEW.md` được sinh lại bằng chính hàm của bước biên dịch.
Tờ duyệt Hán-Việt `content/hanviet/REVIEW.md` cũng được sinh lại (ghi chú 出口, 作业, 小姐).

## Âm thanh

Khoá zh-vi chưa sinh âm thanh (bước kiểm tra bản nháp chỉ báo thiếu file âm thanh: 732 `audioTarget` và 312 clip). Các
câu tiếng Trung đã đổi — 5 clip (`ix_factory_safety_end`, `ix_clinic_doctor_miss`, `ix_cp6_interview_0_s`,
`hsk1_a_l4_03`, `hsk2_b_l2b_01`), 3 clip đổi giọng (`hsk2_b_l3_02`, `hsk2_a_l3_07`, `ul_model_name`), các `audioTarget` của
bài học và các câu truyện — sẽ vào cùng một lượt sinh âm thanh, như P-ai-review yêu cầu.

## Chưa chắc (anh quyết định — không chặn việc gì)

1. **经理 = "giám đốc" hay "quản lý"** (`zh:w:jingli`, đơn vị k và mọi kịch bản có 王经理). Người duyệt cho rằng ở nhà máy
   经理 là quản lý bộ phận, còn giám đốc là 厂长 / 总经理. Khoá học giữ "giám đốc; quản lý" vì đó là cách dịch quen ở công
   ty vốn Trung Quốc; đổi sang "quản lý" sẽ chạm khoảng 20 dòng tiếng Việt.
2. **老李 hay 李师傅** (truyện `micro_home_far` #11, `new_room` #20): một cô gái trẻ gọi người đàn ông lớn tuổi. Thẻ
   `zh:concept:polite-work` của khoá dạy 老 + họ cho đồng nghiệp lớn tuổi, và người trẻ ở đại lục vẫn nói vậy; 师傅 / 叔叔
   chưa có trong từ vựng. Khoá học giữ 老李.

Đã giữ nguyên có lý do (anh có thể đổi ý):

- Truyện `cough_at_the_clinic` #12: giữ 让我看一下你的嘴 (张开 / 嗓子 / 喉咙 chưa có trong từ vựng; 张 được lưu là lượng từ,
  thẻ từ của nó sẽ hiện "tờ").
- Đề HSK 1 `zh.read.hsk1_b_r4_05`: giữ 我的房间不大，很干净 (但是, 可是 thuộc cấp 2 của HSK 3.0, mà câu HSK 1 chỉ dùng từ
  cấp 1; câu không liên từ vẫn tự nhiên khi nói).

## Kiểm tra sau khi sửa

- `zh-pipeline.sh` chạy hai lần: kết quả giống nhau từng byte (224 file). Tự kiểm tra: 108 bài, 976 bài tập, 337 câu đánh
  giá (115 kiểm tra, 22 xếp lớp, 200 HSK), 0 lỗi, 0 mục "decided"; truyện: 42 truyện, 902 câu, 126 câu hỏi, 0 lỗi.
- `bun scripts/course-draft.ts validate --target zh`: 1.044 lỗi, tất cả là thiếu âm thanh (như trước khi sửa).
- `bun run content:validate`: đạt. `bun scripts/golden.ts --check`: fr và en không đổi; độ lệch zh giống hệt trước khi
  sửa (khoá chưa được biên dịch đến lúc promote) và không được re-bless.

## Chấp nhận

Profile `zh-vi` vẫn là `betaUntilReviewed`. Chỉ khi anh đánh ☑ dòng `ai-review:zh-vi` trong
`plan/OWNER-FINAL-CHECKLIST.md` B, Claude mới ghi `review: { kind: "ai-simulated", … }` vào profile. Gate biên dịch kiểm
tra điều đó (`reviewGateErrors`). Trước đó còn hai bước: lượt đáp án thứ hai trên toàn bộ khoá và audit độc lập 10 %
(QC-2026-11-05 §1.3); kết quả sẽ được ghi vào hai dòng "chờ" ở bảng đầu file.
