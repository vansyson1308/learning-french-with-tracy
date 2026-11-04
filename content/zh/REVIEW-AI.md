# zh-vi — duyệt bằng AI mô phỏng người bản ngữ (D-10)

Quyết định D-10 (29/10/2026, `plan/01-TONG-QUAN-VA-QUYET-DINH.md`): dự án không thuê người duyệt bản ngữ. Khoá này
được duyệt theo `plan/prompts/P-ai-review.md` bởi các agent riêng, ngữ cảnh mới, đóng vai giáo viên tiếng Trung bản ngữ
dạy người Việt (độc lập với các phiên đã viết nội dung). Đây **không phải** duyệt của người bản ngữ; app ghi trung thực:
"Nội dung được AI kiểm duyệt kỹ, chưa qua giáo viên bản ngữ."

Theo quyết định điều phối QC-2026-11-05 §1.3, vì lượt đáp án đầu có 18 lỗi P0, khoá zh-vi chạy thêm **một lượt đáp án
thứ hai trên toàn bộ** (không chỉ mẫu 10 %), rồi mới đến audit độc lập. Cả hai đã xong (05/11/2026, mục "Lượt đáp án 2"
và "Audit độc lập 10 %" bên dưới); audit đạt.

## Phạm vi và kết quả từng lượt

| Lượt | Đã đọc | P0 | P1 | P2 | Tổng | Chưa chắc |
|---|---|---|---|---|---|---|
| Đáp án, lượt 1 (04/11/2026) | 1.547 mục có chấm điểm: 976 bài tập của 108 bài học (cùng 66 clip và 29 bài đọc chúng dùng), 115 câu kiểm tra (7 bài, kể cả bài tổng kết A1), 22 câu xếp lớp, 80 câu HSK 1 và 120 câu HSK 2 (mỗi cấp hai đề), 52 bài nói, 35 bài viết, 21 kịch bản (42 lượt người học có chấm), 126 câu hỏi truyện | 18 | 33 | 5 | 56 | 4 |
| Ngôn ngữ, lượt 1 (tiếng Trung, tiếng Việt, đối chiếu; 05/11/2026) | 27/27 sách hướng dẫn đơn vị; 108/108 bài học (cả 976 bài tập); 42/42 truyện (902 câu, 126 câu hỏi, 42 lời giới thiệu) và một lượt quét bằng script giọng đọc theo tên nhân vật; 29/29 bài đọc và 30/90 bài đọc HSK; 222/222 clip và 30/90 clip HSK (quét tên và giọng trên cả 312); 21 kịch bản; 52 bài nói; 35 bài viết; 28 thẻ ngữ pháp; toàn bộ bài nhập môn thanh điệu và pinyin; 199 mục Hán-Việt; 302/906 từ vựng (một phần ba) cùng một lượt quét biểu thức chính quy trên cả 906 câu ví dụ | 0 | 25 | 80 | 105 | 4 |
| Đáp án, lượt 2 (toàn bộ; 05/11/2026) | cả 1.547 mục có chấm điểm như lượt 1 (976 bài tập, 115 câu kiểm tra, 22 câu xếp lớp, 200 câu HSK, 52 bài nói, 35 bài viết, 21 kịch bản với 42 lượt có chấm, 126 câu hỏi truyện); mọi đáp án đáng ngờ được chạy qua chính bộ chấm của app | 14 | 41 | 32 | 87 | 2 |
| Audit độc lập 10 % (05/11/2026) | 414 dòng mà ba lượt trên không nêu, rút ngẫu nhiên (hạt giống 20261105): 126 mục có chấm điểm và 288 dòng ngôn ngữ; soát lại 10 bản sửa P0/P1 (10/10 đúng) | 0 | 1 | 10 | 11 | 0 |

Lượt ngôn ngữ ghi kết quả dần theo từng đơn vị (`findings-language.jsonl` trong thư mục làm việc của phiên, rồi gộp
thành `findings-language.json`), đúng yêu cầu QC-2026-11-05 §1.4.

Phần lớn 18 lỗi P0 của lượt đáp án cùng một dạng: câu trả lời đúng của người học chưa được chấp nhận — một thứ tự ô
chữ đúng (我很高兴认识你, 给我试一下, 发照片给我吧, từ chỉ thời gian đứng đầu câu), một cách nói mà chính khoá học dạy hoặc
chấp nhận ở chỗ khác (我的名字是阮海, 扫码可以吗, 我来晚了, 我吃过了), 没 bên cạnh 没有, thứ tự "giá + một đơn vị" (十八块一碗)
mà ba bài nói về giá đều thiếu, và ô bài viết hẹp hơn tiếng Trung tự nhiên (喜欢听音乐, 见面). Lỗi P1 nặng nhất của lượt
ngôn ngữ: 块 dịch là "đồng" trong truyện (người Việt hiểu là tiền Việt: lương "7.000 đồng"), 斤 dịch là "cân" (người Việt
hiểu là 1 ký, trong khi 一斤 là nửa ký), một giọng đọc cho hai nhân vật trong cùng cảnh, 有火 thay cho 着火 trong bài
diễn tập chữa cháy, thẻ ngữ pháp cấm 我是阮海 (câu đúng mà khoá học chấp nhận), và "tr miền Bắc" trong thẻ phát âm.

Quyết định cho từng lỗi nằm trong `content/zh/_drafts/review/decisions-answers.json`, `decisions-language.json`,
`decisions-answers2.json` và `decisions-audit.json` (cùng thư mục với các file lỗi gốc `findings-answers.json`,
`findings-language.json`, `findings-answers2.json`, `findings-audit.json`):

| Quyết định | Đáp án 1 | Ngôn ngữ | Đáp án 2 | Audit | Tổng |
|---|---|---|---|---|---|
| Đã sửa trong bộ sinh nội dung hoặc bộ chấm (kể cả bằng quy tắc chung) | 55 | 94 | 86 | 8 | 243 |
| Sửa theo cách khác (lý do ghi trong từng mục) | 1 | 9 | 1 | 2 | 13 |
| Giữ nguyên, có lý do | 0 | 2 | 0 | 1 | 3 |
| Chờ anh quyết định | 0 | 0 | 0 | 0 | 0 |
| **Tổng** | **56** | **105** | **87** | **11** | **259** |

Hai mục "chờ anh quyết định" của lượt ngôn ngữ đã được điều phối viên quyết định (xem "Chưa chắc" bên dưới), nên cột ngôn
ngữ chuyển một mục sang "đã sửa" (经理) và một mục sang "sửa theo cách khác" (老李 / 李师傅).

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
| Số điện thoại gõ không có gạch nối (13812345678 là một token; 138-1234-5678 là năm, vì dấu gạch là một token riêng — lượt 1 ghi nhầm "ba", lượt 2 đã kiểm lại; số có dấu cách 138 1234 5678 được nhận từ lượt 2, nguyên nhân (b)) | 5 phiếu, cùng 2 bài tập dùng chúng | 5 | 0 |
| Bài ghép thẻ không được có hai thẻ tiếng Việt giống nhau (match.tsx nhận thẻ theo chữ) | 1 | 1 | 0 |
| Khái niệm kịch bản không được là từ phủ định trơn (不 / 没 / 别 / 不是 / 不要 / 不用) | 2 kịch bản | 1 | 1 (`cp6_supermarket_pay`: nay 不要了 / 没有了 / 不用了) |
| Tiếng Việt cạnh 块/元 nói "tệ", không nói "đồng"; cạnh 斤 không có chữ "cân" trơn (một 斤 là nửa ký) — trong bài tập, câu kiểm tra, ví dụ từ điển, kịch bản và truyện | 46 câu/lựa chọn "tệ" trong 10 truyện (Đài Loan: "Đài tệ"), 3 thẻ của từ 块; 斤: 15 mục bài học/kiểm tra/từ điển/kịch bản và 5 dòng của 1 truyện | các truyện người duyệt nêu, `ub-l2-e4/e6`, từ 斤 / 公斤 | 11 mục 斤 (`ub-l2-e0`, `ub-l2-e8`, `ui-l0-e8`, `ui-l0-e10`, `ui-l1-e3/e4/e7/e9`, `zh.exi.hsk_2.a_l3_05`, ví dụ của 多少钱, kịch bản `shop_fruit`) |
| Giọng truyện: mỗi truyện có hội thoại khai báo vai (A nữ, B nam, một nhân vật một giọng; người thứ ba được kể bằng lời người dẫn: 司机问：“…”); không giọng nào gọi tên chính nhân vật của mình hay tự trả lời câu hỏi của mình | 40 truyện khai báo vai (`stories/casts.json`); chạy trên truyện cũ, quy tắc bắt 5 truyện | 4 | 1 (`forgotten_wallet`, câu tự hỏi gộp thành một câu) và 3 truyện có hai nhân vật cùng giọng được kể lại (`spring_festival_call`, `overtime_for_sister`, `cough_at_the_clinic`) |
| Giọng clip: câu 我叫 / 我是 + tên, hoặc câu đáp lời gọi tên, phải là giọng của tên đó (A nữ, B nam); clip mẫu của bài nói lấy giọng theo tên | 3 clip | 3 | 0 |

`zh_text.py` cũng sửa lỗi báo nhầm ghi ở phiên 5: 长 chỉ bị coi là zhǎng khi nó là một từ riêng (长得, 长了, 长高), không
phải khi nằm trong một từ dài hơn (组长了, 厂长).

## Lượt đáp án 2 (05/11/2026)

Người duyệt mới (ngữ cảnh mới) đọc lại toàn bộ 1.547 mục sau các sửa đổi lượt 1 và chạy mọi đáp án đáng ngờ qua chính bộ
chấm của app. 87 lỗi: 14 P0, 41 P1, 32 P2 (2 "chưa chắc", cả hai đã quyết: nhận 我名字叫阮海; 美 thành cụm 很美 / 真美).
Năm sửa đổi lượt 1 chưa đủ và đã làm lại: câu HSK 1 `a_l4_03` (clip có 就 nên câu hỏi nay là "Ngày mai người nói bao nhiêu
tuổi?", clip không đổi), `zh.write.p_link`, `zh.write.cp5_mail_shift`, số điện thoại gõ có dấu cách (cả năm phiếu), và
`uv-l0-e5` 我打电话给我妈妈 (quy tắc 给 nay nhận người là đại từ + danh từ). Phần lớn lỗi thuộc bốn nguyên nhân gốc; ba
nguyên nhân đầu được sửa trong **bộ chấm**, bằng dữ liệu riêng của plugin tiếng Trung (`src/lib/languages/zh.ts`); mọi
ngôn ngữ khác không khai báo dữ liệu đó nên kết quả không đổi (tiếng Nhật cũng chưa bật):

| Nguyên nhân | Sửa | Dữ liệu của plugin zh |
|---|---|---|
| (a) ô bài viết chỉ khớp đúng một chuỗi từ liền nhau: 喝一杯咖啡, 吃了早饭, 请一天假, 叫李组长 không khớp 喝咖啡 / 吃早饭 / 请假 / 叫组长 | `LanguageRules.slotRuns` + `src/lib/languages/runs.ts`: giữa các từ của ô (hoặc bên trong một từ li hợp như 请假) được chèn những thành phần không đổi nghĩa; không bao giờ ở hai đầu ô; từ sai vẫn trượt | `insertions`: 了 / 过 / 着 / 完 / 一下 / 点儿 / 一点儿; lượng từ có hoặc không có số đứng trước (一杯, 两个, 一天, 个); họ đứng trước chức danh (李组长, 王经理) |
| (b) ranh giới từ của bộ tách từ: 早上好 là một từ, 138 1234 5678 là ba token | cùng bộ so khớp: các token liền nhau có chữ nối lại bằng các từ của ô thì khớp (13812345678 = 138 1234 5678); không bao giờ khớp bên trong một token dài hơn (早上 không nằm trong 早上好, 电影 không nằm trong 电影院) | `joinTokens: true`; các ô chào thêm 早上好 / 晚上好 / 下午好 / 早 / 组长早 / 经理早 / 您早 |
| (c) bài nói chỉ nhận đúng nguyên câu: 谢谢啊, 组长，谢谢, 王经理，早上好, 我今年二十五岁了 trượt | `LanguageRules.utteranceFrame`, đọc trong `src/lib/speech/grader.ts` (cả bộ chấm kịch bản): câu nghe được = phần đệm + một đáp án + phần đệm, mọi chữ nội dung giữ nguyên | đầu câu: 嗯 / 那 và lời gọi; cuối câu: lời gọi và trợ từ — 啊 / 呀 sau mọi câu, 了 sau tuổi hoặc 明白 / 懂 / 知道, 吧 sau lời đề nghị (请 / 给 / 一起 / 咱们) hoặc 见, 呢 sau câu có từ để hỏi; không thêm trợ từ sau câu đã có trợ từ. Lời gọi: chức danh là từ của khoá (组长, 经理, 老师, 医生, 大家 …), họ + chức danh, 老 / 小 + họ |
| (d) khái niệm kịch bản một chữ hoặc một số nhận cả câu sai: 两 nhận 两个星期, 二十 nhận 二十五, 有 nhận 我有事, 三点 nhận 三点半, 这儿 nhận 这儿不能停 | sửa nội dung: khái niệm là cụm (两天, 有时间 / 有空, 在这儿停 / 就在这儿, 好啊 / 走吧, 怎么停, 头疼 …); câu trả lời là số hay giờ chỉ khớp theo đáp án nguyên câu (warehouse_boxes l1, a1cap_friend_plan l1) | — |

Quy tắc mới ở bước tự kiểm tra (`zh-check-answers.py` quy tắc 11) và trong thư viện sinh nội dung:

| Quy tắc | Phạm vi trên nội dung đã commit trước lượt này |
|---|---|
| `concept-number`: khái niệm là số hoặc giờ mà một số / giờ dài hơn nối tiếp (二十 → 二十五, 两 → 两个星期, 三点 → 三点半) hoặc kết thúc (二十个 trong 一百二十个) | 5 dạng ở 5 lượt (二十, 两, 三点, 第一, 一点) |
| `concept-inside-word`: khái niệm một chữ Hán mà bộ tách từ cũng tìm thấy bên trong một từ dài hơn khoá không lưu (dò trên từ HSK 1–3 và lát CC-CEDICT đã ghim): 有 trong 有事, 好 trong 只好, 头 trong 点头 | 13 dạng ở 11 lượt (水, 好 ×3, 是, 对, 给, 头, 停, 关, 能, 走, 有) |
| `speech-twin`: bài nói dự trữ (kiểm tra, tổng kết, xếp lớp) nhận mọi câu bài cùng loại trong bài học nhận, đổi dữ kiện (`zh_text.SPEECH_TWINS`, 15 cặp) | 4 bài hẹp hơn bài học (cp4_thanks_water, cp4_name_hua, pl_name_nam, cp4_desc_dog) |
| `dou_spellings`: 每天 + động từ ⇄ 每天都 + động từ | 3 câu gõ (uj-l1-e6, uo-l2-e1, uu-l3-e5) |
| `age_spellings`: tuổi cuối câu ⇄ thêm 了 (我今年二十岁了) | 2 câu gõ (ul-l0-e6, uo-l1-e2) và 2 bài nói |
| `week_spellings`: 星期一 ⇄ 周一, 星期天 / 星期日 ⇄ 周日 | 3 bài nói (m_day và hai bài cùng loại) và 2 ô ngày của bài viết (cp5_mail_shift, a1cap_mail_absent) |
| `one_spellings`: 是 + nghề ⇄ 是一名 + nghề (quốc tịch chỉ 一个) | 1 câu gõ (ua-l3-e7), 1 bài nói (cp4_student) |
| `order_variants`: người sau 给 có thể là đại từ + danh từ (给我妈妈打电话 ⇄ 打电话给我妈妈) | 1 câu gõ (uv-l0-e5) |
| bài nói tự giới thiệu mở đầu bằng 你好 / 您好 / 大家好; bài tả tranh nói 真 / 好 như 很 (`zh-speech-s4.py`) | 3 bài nói tên và 7 bài tả |

Tổng cộng 33 câu gõ / ô chữ, 36/52 bài nói, 19/35 bài viết và 15/21 kịch bản có thêm đáp án hoặc đổi khái niệm. Bốn bài
viết mở (o_open, p_open, q_open, r_open) có danh mục rộng theo các mẫu câu của khoá, nên một bài đúng không còn nhận lời
nhắc sai "đừng quên …". Kiểm thử: `src/lib/__tests__/answer-runs.test.ts` (16 kiểm thử, theo từng nguyên nhân a–c, cùng
kiểm thử "các ngôn ngữ khác không đổi") và `scripts/__tests__/zh-answer-pass2.test.ts` (174 câu ví dụ của người duyệt chạy
qua bộ chấm trên nội dung thật: các câu đúng được nhận, các câu sai bị từ chối; viết trước khi sửa: 134 trượt).

## Audit độc lập 10 % (05/11/2026)

Một agent thứ tư, ngữ cảnh mới, đóng vai giáo viên tiếng Trung bản ngữ đọc được tiếng Việt, chỉ đọc (không sửa) worktree
ở commit d5070ff4 (lớp đã promote `content/courses/zh-vi.json` và `content/zh/**`). Kết quả gốc:
`content/zh/_drafts/review/findings-audit.json`; cách lấy mẫu: `audit-sample.py` (cùng thư mục), chạy
`python -I -X utf8 audit-sample.py <repo> <thư mục ra>`.

**Mẫu.** Một "dòng" là một đơn vị người duyệt chấm: một bài tập, một câu kiểm tra / xếp lớp / HSK, một bài nói, một bài
viết, một lượt kịch bản có chấm, một câu hỏi truyện; bên ngôn ngữ: một câu truyện (hoặc lời giới thiệu), một khối bài đọc,
một clip, một từ vựng (nghĩa và câu ví dụ), một mục thẻ ngữ pháp, một dòng sách hướng dẫn, một mục bài nhập môn, một mục
Hán-Việt, mục tiêu của một kịch bản. Tập rút mẫu là các dòng **cả ba lượt** không nêu tên: bỏ mọi id trong ba file lỗi (kể
cả `alsoAffects`, khoảng câu truyện; id truyện trơn bỏ cả câu hỏi và lời giới thiệu), bài tập trỏ tới bài nói / bài viết /
kịch bản đã nêu, mọi nút và clip của kịch bản đã nêu, mọi khối của bài đọc đã nêu. Các dòng mà quy tắc sửa có hệ thống đã
đổi nhưng không lỗi nào nêu tên vẫn ở trong tập. Id được sắp xếp, `random.Random(20261105)`, rút `ceil(10 %)` mỗi nhóm,
bài tập trước, ngôn ngữ sau, rồi 10 bản sửa P0/P1 từ 131 mục "fixed" của ba file quyết định. Đáp án đáng ngờ được chạy qua
chính bộ chấm của app (`checkAnswer`, `gradeSpokenAttempt`, `matchIntent`, `evaluateGuidedWriting`, quy tắc zh với từ
điển của khoá) bằng một script ngoài repo.

| Nhóm | Số dòng | Chưa bị nêu | Rút mẫu | Theo loại (rút / chưa bị nêu) |
|---|---|---|---|---|
| Có chấm điểm | 1.568 | 1.260 | 126 | bài tập 74/806, HSK 25/198, kiểm tra 11/78, câu hỏi truyện 11/120, bài viết 2/12, bài nói 1/14, xếp lớp 1/18, lượt kịch bản 1/14 |
| Ngôn ngữ | 3.338 | 2.871 | 288 | từ vựng 96/906, truyện 76/868, clip 29/224, bài đọc 24/201, thẻ ngữ pháp 20/181, Hán-Việt 18/196, sách hướng dẫn 18/235, nhập môn 5/53, kịch bản 2/7 |
| **Tổng** | | | **414** | |

**Kết quả.**

| Nhóm | P0 | P1 | P2 | P0 + P1 |
|---|---|---|---|---|
| Có chấm điểm (126) | 0 | 1 (bài tập) | 4 (bài tập 2, bài viết 1, HSK 1) | 0,79 % |
| Ngôn ngữ (288) | 0 | 0 | 6 (từ vựng 3, truyện 2, bài đọc 1) | 0 % |
| **Tổng (414)** | **0** | **1** | **10** | **0,24 %**, dưới ngưỡng 2 %: **đạt** |

Riêng đáp án (nhóm có chấm điểm) là 1/126 = 0,79 %, cũng dưới 2 % (khoảng tin cậy 95 % với một lỗi: khoảng 0,02 % đến
4,3 %). Các loại khác không có lỗi nào. Soát lại 10 bản sửa (4 từ đáp án 1, 3 từ ngôn ngữ, 3 từ đáp án 2; 3 P0, 7 P1):
10/10 đúng và đủ.

**P1 thành quy tắc.** Lỗi P1 duy nhất (`zh-vi:ul-l2-e7`, bài nói `zh.speak.l_like`: 我特别喜欢唱歌 bị từ chối trong khi
我很喜欢唱歌 và 我非常喜欢唱歌 được nhận) thuộc đúng loại chính của các lượt trước: một câu đúng thiếu một biến thể. Không sửa
từng câu mà thêm `zh_text.tebie_spellings` vào các biến thể từ của `variant_spellings`: 很 / 非常 trước một động từ hoặc
tính từ cũng nhận 特别 (特别 là từ của khoá); không bao giờ trong mệnh đề có 比 (sau 比 không có phó từ mức độ), và không
đổi 很多 / 很少 trước danh từ (很多人, không nói 特别多人). Vì `variant_spellings` dùng chung, quy tắc tới câu gõ, bài nói,
ô bài viết và lượt kịch bản; quy tắc 10 của `zh-check-answers.py` đóng nó (thiếu một dạng 特别 là pipeline dừng), và quy
tắc 1 (cặp từ cùng điền được một chỗ trống), quy tắc 比 và quy tắc 是 + tính từ cũng biết 特别.

| Phạm vi của quy tắc | Số mục |
|---|---|
| Bài nói | 12 (9 bài dạy, 3 bài dự trữ: `cp4_thanks_water`, `cp4_desc_dog`, `pl_big_car`), cùng 13 bản sao trong bài học, kiểm tra và xếp lớp |
| Câu gõ trong bài học | 8 (`uf-l0-e6`, `uf-l2-e6`, `ug-l3-e6`, `un-l0-e6`, `un-l3-e6`, `ut-l1-e5`, `uu-l0-e5`, `uu-l1-e5`) |
| Ô bài viết | 2 (`zh.write.q_late` bus, `zh.write.cp5_room` small, cùng bản sao của chúng) |
| Lượt kịch bản | 2 (`clinic_doctor` l0, `a1cap_weekend` l1, mỗi lượt cả lần thử lại) |
| **Tổng bản ghi nguồn** | **24** |

Các P2 của audit:

| Mục | Quyết định |
|---|---|
| `zh-vi:uq-l2-e0` (九点钟) | Đã sửa: nhận thêm 我明天九点钟到 / 我明天九点钟来 (và thứ tự 明天我…). Không thêm quy tắc chung 点 ⇄ 点钟: 一点 còn là "một chút", và 三点半, 九点多 không được thêm 钟 |
| `zh.write.cp5_note_late` (一刻钟) | Đã sửa: ô số phút nhận 十五分钟 / 一刻钟 / 一刻 |
| `zh.exi.hsk_1.b_l3_03` (🏨) | Đã sửa: "A. Bệnh viện" là 🏥 (bộ tranh dùng chung cho b_l3_01–05) |
| `zh-vi:uf-l1-e6` (thẻ ghép trùng chữ đầu) | Đã sửa: nghĩa của 下雨 là "trời mưa"; 雨 vẫn là "mưa" |
| `zh:w:jiating` | Đã sửa: 我的家庭很幸福。 / Gia đình tôi rất hạnh phúc. |
| `zh:w:nan-south` | Sửa theo cách khác: 越南在中国南边。 / Việt Nam ở phía nam Trung Quốc. (广州在中国南方 sẽ hiện 南方 là một từ riêng, nên chính từ 南 không có trong câu ví dụ của nó) |
| `zh:w:nar-45` (nà r) | Giữ nguyên, có lý do: cách đọc lưu một âm tiết pinyin cho mỗi chữ (lớp pinyin trên chữ xếp theo từng chữ; `zh-lexicon.test.ts` ghim `reading.pinyin` = `pronunciation.value`). Viết nàr cần một quy tắc hiển thị trong app cho cả 10 từ có 儿 hoá, không phải sửa nội dung; ghi ở `release/KNOWN_LIMITATIONS.md` |
| `zh.story.night_shift_warehouse` #13 | Đã sửa: 不能发给顾客。 |
| `zh.story.train_to_shanghai` #13 | Đã sửa tiếng Việt: Tàu chạy rồi. |
| `zh.read.ug_rules` #2 (停机器) | Sửa theo cách khác: 机器有问题，请马上把机器关了，告诉组长。 停机 không có trong từ vựng và không có trong lát CC-CEDICT đã ghim (chữ 机 đứng riêng cũng không có cách đọc); 关掉 cần 掉, cũng không phải từ của khoá; 把 và 关 được dạy ở đơn vị c. Cùng chữ 停机器 ở clip `zh.clip.ug_tingji` (nay 机器有问题，快把机器关了！) và câu ví dụ của 停 (nay 雨停了。 / Mưa tạnh rồi.); hai đáp án đọc hiểu nay là "Tắt máy ngay (rồi báo tổ trưởng)". Kịch bản `factory_safety` vẫn nhận 怎么停机器 từ người học |

Kiểm thử: `scripts/__tests__/zh-answer-audit.test.ts` (các câu của người duyệt và của quy tắc chạy qua bộ chấm trên nội
dung thật; một câu sai vẫn bị từ chối; không câu nào có 特别 sau 比 hay 特别多 / 特别少 + danh từ; các dòng hiển thị đã sửa).

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

Lượt đáp án 2 không đổi clip nào (`listening.json` giữ nguyên từng byte, cả phân vai giọng của bước âm thanh) và không đổi
`audioTarget` nào; chỉ một câu truyện đổi chữ (`new_room` #20: 我知道了。谢谢您！). Câu HSK 1 `a_l4_03` chỉ đổi câu hỏi tiếng
Việt.

Sau audit đổi chữ Trung ở một clip (`zh.clip.ug_tingji`: 机器有问题，快把机器关了！), một câu truyện
(`night_shift_warehouse` #13: 不能发给顾客), một khối bài đọc (`zh.read.ug_rules` #2, không có âm thanh riêng) và ba câu
ví dụ từ điển (停 雨停了。, 家庭 我的家庭很幸福。, 南 越南在中国南边。); tất cả vào cùng lượt sinh âm thanh. `train_to_shanghai`
#13 chỉ đổi tiếng Việt.

## Chưa chắc (đã quyết — điều phối viên, 05/11/2026)

1. **经理 = "quản lý"** (giám đốc là 总经理): đã làm. Nghĩa của `zh:w:jingli` là "quản lý"; mọi dòng tiếng Việt dịch 经理 là
   "giám đốc" trong bộ sinh nội dung (44 chỗ: ví dụ từ điển, bài học, đề bài viết, kịch bản, thẻ ngữ pháp, sách hướng dẫn
   đơn vị k, một câu HSK 2, hai truyện) nay nói "quản lý".
2. **李师傅 cho thợ cả / tài xế, 老李 cho đồng nghiệp ngang hàng**: `micro_home_far` #11 là đồng nghiệp cùng giờ nghỉ, giữ
   老李. `new_room` #20 là bác thợ lớn tuổi ở ký túc xá, đúng ra là 李师傅 — nhưng 师傅 chưa có trong từ vựng và chữ 傅 không có
   trong lát CC-CEDICT đã ghim (`content/zh/lexicon/derived/hsk-course.json`), nên câu sẽ hiện một chữ Hán không có pinyin.
   Câu của cô gái bỏ lời gọi (我知道了。谢谢您！ — "Cháu biết rồi. Cháu cảm ơn chú!"), lời kể vẫn là 老李. **Việc của anh:**
   muốn dùng 李师傅 thì cần tải lại các file nguồn đã ghim (CC-CEDICT, hsk30, wordfreq) và chạy lại `zh-subset.py` có 师傅;
   phiên này không tải gì.

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

Lượt đáp án 2 (khoá đã promote ở 540f5d60, nên `zh-pipeline.sh` sinh lại lớp staged rồi `author.ts promote` chuyển vào
`content/`; bước biên dịch dừng vì thiếu âm thanh, như lần promote trước, nên `src/content` không đổi):

- `zh-pipeline.sh` chạy lại sau promote: lớp staged giống hệt `content/` (22 file); chạy thêm một lần: giống nhau từng byte
  (215 file). Tự kiểm tra: 0 lỗi, 0 mục "decided" (quy tắc 11 mới chạy trên mọi kịch bản và bài nói); truyện: 0 lỗi.
- Kiểm thử mới: `answer-runs.test.ts` 16 và `zh-answer-pass2.test.ts` 174 — đạt (trước khi sửa nội dung: 134 trượt).
- `bun run content:validate` (mọi khoá): 1.044 lỗi, tất cả thiếu âm thanh zh (732 `audioTarget`, 312 clip), như ở HEAD;
  không lỗi nào khác. Không ngôn ngữ nào khác khai báo `slotRuns` / `utteranceFrame` (có kiểm thử), nên không đáp án nào
  của khoá khác đổi kết quả. `course-draft.ts validate --target zh`: cùng 1.044 lỗi âm thanh.
- `bun scripts/golden.ts --check`: fr và en không đổi; 57 độ lệch, đúng danh sách ở HEAD (khoá zh chưa biên dịch), chỉ khác
  mã băm của CSDL từ điển zh (nghĩa của 经理); không re-bless.
- `bun run typecheck`, `bun run lint`: đạt. `bunx jest --runInBand`: 16 bộ, 129 kiểm thử đạt.
- `bun run test`: 3.323 đạt, 5 trượt — 4 trượt giống hệt ở HEAD (kiểm tra nội dung, độ lệch biên dịch, hai kiểm thử golden:
  cùng nguyên nhân thiếu âm thanh / chưa biên dịch), và `picture-cue-lint` quá thời gian khi máy bận, chạy riêng thì đạt.

Sau audit (sửa trong bộ sinh nội dung, `zh-pipeline.sh`, rồi `author.ts promote --allow-missing-audio`; bước biên dịch dừng
vì thiếu âm thanh nên `src/content` không đổi):

- `zh-pipeline.sh` chạy lại sau promote: lớp staged giống hệt `content/` (22 file); hai lần chạy giống nhau từng byte (295
  file). Tự kiểm tra: 108 bài, 976 bài tập, 337 câu đánh giá, 0 lỗi, 0 mục "decided"; truyện: 42 truyện, 902 câu, 0 lỗi.
- `zh-answer-audit.test.ts` (mới) và các kiểm thử bị ảnh hưởng (`zh-answer-pass2`, `answer-runs`, `zh-lexicon`, re-key v8):
  đạt. `course-draft.ts validate --target zh` và `bun run content:validate`: 1.044 lỗi, tất cả thiếu âm thanh zh (732
  `audioTarget`, 312 clip), như trước. `golden.ts --check`: fr và en không đổi; 57 độ lệch, đúng danh sách ở HEAD; không
  re-bless. `typecheck`, `lint`: đạt. `bun run test`: 3.348 đạt, 4 trượt, đúng 4 trượt ở HEAD. `jest --runInBand`: 129/129.

## Chấp nhận

Profile `zh-vi` vẫn là `betaUntilReviewed`. Chỉ khi anh đánh ☑ dòng `ai-review:zh-vi` trong
`plan/OWNER-FINAL-CHECKLIST.md` B, Claude mới ghi `review: { kind: "ai-simulated", … }` vào profile. Gate biên dịch kiểm
tra điều đó (`reviewGateErrors`). Lượt đáp án thứ hai trên toàn bộ khoá và audit độc lập 10 % (QC-2026-11-05 §1.3) đã
xong; audit đạt (0,24 % P0 + P1; riêng đáp án 0,79 %).
