# STATUS — milestone tracker (Claude Code updates this at the end of every session)

> **TẠM DỪNG theo yêu cầu của chủ dự án (2026-11-04).** Không còn agent nào chạy, không còn lịch tự thức. Mọi thứ đã push.
> - **main:** xanh. Đã merge #58 voice-lineage, #59 en-vi, #60 voice sampler, #61 D-15, #62 P4b, #63 ja-vi, #64 sửa cách chấm ja.
> - **`phase-4/zh-vi` (P4d):** đã xong phiên 1–5: bộ từ, 108 bài, nhập môn thanh điệu, các lớp nội dung, kiểm tra và HSK 1–2, 42 truyện.
>   - Duyệt D-10: lượt đáp án xong, 56 lỗi, lưu ở `content/zh/_drafts/review/findings-answers.json`, chưa sửa. Lượt ngôn ngữ bị dừng trước khi ghi file, phải chạy lại.
>   - Bộ đọc audio tiếng Trung đang làm dở, để trên nhánh riêng `wip/zh-audio-frontend`. Chưa test, không merge nguyên trạng.
>   - Chưa có audio tiếng Trung, chưa mở PR.
> - **Chờ quyết định:** giọng tiếng Hàn (xem mục ngay dưới), rồi mới làm P4e ko-vi.
> - **Khi tiếp tục:** chạy lại lượt duyệt ngôn ngữ, sửa theo cả hai lượt duyệt, audit, hoàn thành bộ đọc audio, chạy canary và generate, rồi mở PR zh-vi.
>
> **Lần thức gần nhất:** 2026-11-04 05:10 UTC. **Lần thức kế tiếp:** không có (đang tạm dừng). Trạng thái run luôn đọc từ GitHub API (QC-2026-11-01 §0).
>
> **PR #63 (P4c ja-vi) đã merge (a545448):** 22/22 check xanh. Báo cáo ở `plan/reports/P4c-ja-vi.md`.
>
> **Cần quyết định của điều phối viên và chủ dự án (2026-11-04): giọng tiếng Hàn trước P4e.**
>
> Đã khảo sát mọi mô hình TTS tiếng Hàn đang có: XTTS-v2, OpenVoice v2, CosyVoice3, Qwen3-TTS, Chatterbox, Supertonic, Orpheus-ko, VibeVoice, Bark, F5/MaskGCT, Spark, Zonos, StyleTTS2-ko, ESPnet-KSS, MMS. **Không mô hình nào qua được D-11.** Mỗi cái hỏng ở một trong các lý do: không khai dữ liệu huấn luyện, giấy phép NC hoặc OpenRAIL-M, gốc Llama, hoặc không có tiếng Hàn. Lý do hỏng là ở dữ liệu, không ở code.
>
> Dữ liệu tiếng Hàn có giấy phép sạch:
> - Zeroth-Korean: CC BY 4.0, 51,6 giờ, 105 người nói.
> - Emilia-YODAS phần tiếng Hàn: CC BY 4.0 theo khai báo của người đăng.
> - FLEURS ko: CC BY 4.0, nhỏ.
>
> Các hướng:
> - **(1)** Tự huấn luyện giọng: code MIT/Apache (VITS/Matcha), huấn luyện từ đầu trên dữ liệu CC BY 4.0, đa người nói, không nhái giọng một người cụ thể. Cần GPU một lần, chủ dự án chạy.
> - **(2)** Gửi thư hỏi nguồn dữ liệu huấn luyện của Qwen3-TTS, CosyVoice và Chatterbox.
> - **(3)** Thuê thu âm một giọng nữ và một giọng nam theo hợp đồng CC-BY-4.0, rồi huấn luyện theo hướng (1).
> - **Chỉ dùng giọng của thiết bị (hiện trạng).** Theo D-5, phần nghe có chấm điểm phải dùng audio đóng gói, nên ko-vi sẽ không có nghe chấm điểm, không có thẻ nghe FSRS, và claim gate không khẳng định gì về nghe hay TOPIK nghe.
>
> **Đề xuất:** làm ko-vi với giọng của thiết bị; phần nghe không chấm điểm và claim giới hạn tương ứng, ghi rõ trong KNOWN_LIMITATIONS. Song song, mở hướng (1) như một việc của chủ dự án, và gửi thư theo hướng (2).
>
> Trong lúc chờ quyết định: làm P4d zh-vi trước, ko-vi làm sau.
>
> **Đã giải quyết (2026-11-03): giấy phép bộ đọc tiếng Nhật cho audio.**
>
> Audio ja-vi lần chạy 41633821152 dừng ở bước Synthesize. Bộ chuyển chữ thành âm tiếng Nhật của Kokoro (`misaki[ja]`) cần từ điển MeCab, cụ thể là UniDic qua fugashi. Mọi từ điển MeCab (UniDic, unidic-lite, NAIST-jdic, IPADIC) đều dùng giấy phép BSD hoặc bộ ba BSD/GPL/LGPL, và BSD không nằm trong allowlist. Trước đây quy trình chạy được chỉ vì bước cài MeloTTS có tải UniDic; MeloTTS đã bị loại theo D-11. Chưa có audio tiếng Nhật nào được phát hành: ja-en vẫn dùng giọng của thiết bị, và chỉ có canary P3e đã dùng từ điển này trên runner.
>
> Có hai hướng:
> - **(A)** Thêm BSD-3-Clause vào allowlist, chỉ cho công cụ chạy lúc build, với điều kiện không có gì của công cụ đó nằm trong APK.
> - **(B)** Bỏ hẳn MeCab. Dùng kana đã lưu sẵn cho mọi từ (JmdictFurigana, CC BY-SA) và chuyển kana thành âm vị theo bảng của misaki (Apache-2.0).
>
> **Đã chọn hướng B (03/11), không cần đổi allowlist.**
> - Kokoro đọc tiếng Nhật từ kana đã lưu sẵn. Bảng chuyển kana thành âm vị lấy từ misaki/cutlet (Apache-2.0/MIT), không dùng từ điển BSD nào; chi tiết ở `plan/reports/P4c-ja-audio-frontend.md`.
> - Mất trọng âm cao độ hoá ra không phải rủi ro: đường misaki cũ cũng không dùng trọng âm.
> - Canary run 41653925472, so với đường misaki cũ: giọng A jf_alpha 0,2301 (cũ 0,2255); giọng B jm_kumo 0,3977 (cũ 0,5026).
> - Có chốt tạo lại audio: khi dữ liệu cách đọc đổi thì phải tăng `phonemeFrontends.ja.version`, nếu không test sẽ báo lỗi.
> - Điều phối viên vẫn có thể chọn hướng A, nhưng giờ không còn việc gì bị chặn.
>
> **Ghi chú (2026-11-03, tối):**
> - **PR #62 (P4b) đã merge (a17e021):** 22/22 check xanh; `main` xanh (CI, Device acceptance, Pages).
> - **P4c ja-vi (`phase-4/ja-vi`), phiên 1 xong:**
>   - Bộ từ: 944 từ (A1 718, A2-1 226), từ nào cũng có nghĩa tiếng Việt, kana và furigana. Phủ 629/662 từ JLPT N5 của OpenJLPT; 33 từ còn lại có ghi lý do.
>   - Chữ: 100 kanji mục tiêu. Hán-Việt thêm 115 từ.
>   - Khung khoá: 37 mục tiêu, 108 bài (chưa có bài tập), pipeline cho ra kết quả giống hệt nhau mỗi lần chạy. Kế hoạch ở `plan/authoring/ja-plan.md`.
>   - Giọng B `kokoro-jm_kumo` có tỉ lệ lỗi canary 0,50, vẫn trong ngưỡng 0,6 của quy tắc chọn giọng. Kokoro không có giọng nam tiếng Nhật nào khác, MeloTTS đã bị loại (D-11), nên giữ theo quy tắc hiện hành.
>   - Tên hạng mục JF Standard sẽ đối chiếu với trang chính thức ở phiên duyệt.
>   - **Phiên 2–5 xong** (đã push):
>     - 108 bài, 1.020 bài tập (có 22 bài chia động từ), 25 thẻ khái niệm.
>     - Bài nhập môn kana có bài kiểm tra; migration v9 lưu `primerPassed`; hiện romaji cho đến khi qua bài kiểm tra.
>     - Bài viết gõ kana được tính là luyện tập.
>     - 957 từ, gồm 8 tên riêng (không đưa vào từ mới mỗi ngày) và các biển báo an toàn trong nhà máy.
>     - Tiếp nhận và sản sinh: 28 bài đọc, 220 clip, 52 bài nói, 35 bài viết, 21 tình huống.
>     - Đánh giá: 7 bài kiểm tra, xếp lớp 4 chặng.
>     - Track JLPT N5: 2 đề thi thử × 67 câu tự soạn. Định dạng đã đọc trên jlpt.jp, nên `checkedAgainstOfficialGuide` là true. `formatFidelity` là partial vì jlpt.jp không công bố số câu cho từng dạng; chủ dự án đối chiếu với sách chính thức.
>   - Phiên tiếp: 40–50 truyện, rồi duyệt D-10, audio, promote và PR.
>
> **Ghi chú (2026-11-03, QC-2026-11-03 / D-15):**
> - **Đã merge:** #59 en-vi (7aaefcc), #60 voice sampler (4a8d1e8), #61 D-15 (ad4c349). Cả ba PR đều qua đủ 22/22 check.
> - **Voice sampler:** artifact `voice-samplers` đã có trên main (run 41525390857), gồm fr 82 giây, de 88 giây, pt 72 giây, en 94 giây. Dòng tuỳ chọn ở đầu checklist.
> - **D-15:** đã có `plan/10-LADDER-A1-C2.md`, plan/09 cũng theo tài liệu này. Test quy mô 12.000 từ / 300 unit đạt mọi ngân sách sau khi sửa 9 chỗ. Ví dụ: dựng DB từ 16,8 phút còn khoảng 1 giây; dựng TODAY từ 324 ms còn dưới 60 ms. Chi tiết ở §8.
> - **main đỏ hai lần, cả hai đều chập chờn** (`plan/reports/flakes.md`): lần 41156642768 do dây chuyền lỗi trong shard; lần 41525391190 do sdkmanager tải file zip hỏng. Chạy lại đúng commit thì xanh.
> - **P4b** (`phase-4/cjk-plugins`): xong cả 5 giai đoạn, báo cáo ở `plan/reports/P4b.md`.
>   - Giai đoạn 1: giấy phép có phạm vi.
>   - Giai đoạn 2: Hán-Việt, 118 cặp.
>   - Giai đoạn 3: plugin ja/zh/ko, 173 test.
>   - Giai đoạn 4: cách đọc lấy từ JMdict, JmdictFurigana, CC-CEDICT và quy tắc RR; không dùng MeCab vì giấy phép không nằm trong allowlist.
>   - Giai đoạn 5: hiển thị furigana/pinyin/RR, chặn kana/pinyin làm bằng chứng sản sinh, bài nhập môn chữ viết, bảng chia, FTS trigram.
>   - Kết quả: 2.557 bun test và 104 jest test đều qua. Chờ PR.
>   - Chốt chặn kana/pinyin đã phủ cả phần chấm bài viết (b3108384). Bài viết tự do gõ toàn bằng kana/pinyin hiện bị chấm sai, chưa được coi là luyện tập; quyết định ở P4c.
>
> **Ghi chú (2026-11-02, tối, QC-2026-11-02):**
> - **Các lần tự thức bị lỗi (QC §0):** các lần check-in là `ScheduleWakeup` trong phiên desktop, không phải tác vụ hẹn giờ (`list_scheduled_tasks` trả về "No scheduled tasks found"). Phiên dừng sau 09:10 UTC. Hai lần hẹn 16:15 và 17:18 (giờ máy, +07:00) không chạy, và lần chạy gate cục bộ (task b7vegiakz) kết thúc với thông báo "Background shell command didn't finish before the previous session ended". Ứng dụng không cho xem nội dung lỗi của "(2 failed)", nên không chép được thông báo lỗi. Nguyên nhân có thể: máy ngủ hoặc ứng dụng đóng; giữ máy thức chỉ có tác dụng khi phiên còn mở. Từ nay gate dài chạy trên CI rồi đọc kết quả qua API; shell nền cục bộ chỉ dùng cho việc ngắn.
> - **Quy tắc:** mỗi lần thức dậy, việc đầu tiên là xem `main` có đỏ không.
> - **PR #58 (D-11 voice lineage) đã merge (c7f5226):** 22/22 check xanh, gồm cả 6 shard thiết bị, LanguageTool và export-size.
> - **en-vi (P4f), 03/11:** audio tiếng Anh xong (run 41503268148): 2.139 clip, 0 lỗi kỹ thuật. Trước đó có 2 lần chạy lỗi, đều đã sửa tận gốc. Lần 41474632304: Kokoro để quá nhiều khoảng lặng quanh từ ngắn, nên đã bật cắt khoảng lặng cho tiếng Anh. Lần 41478902962: bot gate phát hiện compiler suýt đặt en-vi làm khoá mặc định toàn cục. Đã sửa: mặc định toàn cục vẫn là fr-en; giao diện tiếng Việt chỉ gợi ý en-vi khi tiếng Anh qua gate claim A1. Lúc đầu tiếng Anh **chưa** qua gate, vì thiếu dạng bài thứ hai ở nghe và đọc. Đã thêm 3 câu kiểm tra theo mẫu tiếng Pháp, có người duyệt mới xem; giờ A1 claim được (vẫn chỉ là ước lượng tương ứng). Coverage ngữ cảnh 750/750. Chờ PR.
> - **main xanh trở lại:** chạy lại Device acceptance trên đúng cc6c93f (run 41457803396) thì cả 6 shard xanh. Lần đỏ trước (run 41156642768, API 34 core + lessons) là lỗi chập chờn, đã ghi vào `plan/reports/flakes.md`. Từ nay runner khởi động lại app sau mỗi flow FAIL, và báo cáo ghi riêng flow lỗi đầu tiên.
> - **CI đỏ trên `audio/voice-lineage`, do lỗi thật chứ không phải chập chờn:** (1) LanguageTool coi tên giọng `parler-de-nicole` trong `voiceCast` là văn bản tiếng Đức; LanguageTool đã ghim 6.6 + SHA-256 từ trước nên luật không đổi; đã bỏ `voiceCast`/`voiceId` khỏi chuỗi cần kiểm tra, có test. (2) File mẫu (fixture) chẩn đoán Opus là bản sao byte-giống-hệt của một câu truyện tiếng Tây Ban Nha đang phát hành, nên bước kiểm tra export thấy "fixture bytes" trong mọi bản build; đã remux kèm một tag để byte khác đi (âm thanh giữ nguyên), có test rằng không asset phát hành nào trùng byte với fixture, và test rằng ngoài route bị chặn thì không file nào import code chẩn đoán.
>
> **Ghi chú (2026-11-01):**
> - **Run audio fr 41166387785 thất bại lúc 2026-10-31 05:18 UTC**; phiên làm việc dừng ngay sau đó nên không ai xử lý trong khoảng 41 giờ, và câu "run tiếng Pháp vẫn đang chạy" là sai. Nguyên nhân: phần nghe của tiếng Pháp vốn đã qua pipeline v2 (392 clip được áp dụng); kế hoạch băm tên người đọc Parler thành `null`, còn validator băm đúng tên "Daniel", nên 152 file thành mồ côi và 121 clip + 40 câu truyện bị coi là thiếu. Đã sửa trong `scripts/audio.ts`, có test: kế hoạch và validator phải ra cùng một tập file cho fr, de, es.
> - **Nhánh `phase-4/en-vi` đã push.** Từ nay mọi commit được push trong 30 phút.
>
> **Ghi chú (2026-10-31):**
> - **QC-2026-10-31 (D-11 đến D-14):** thứ tự mới: it-vi → `audio/voice-lineage` → emulator-boot-hardening (đã merge #55) → P4f en-vi + VSTEP → P4b → ja → ko → zh → pt → P5 → P6a → v1.0. Gate lineage đã viết trên `audio/voice-lineage` (chưa push). Ngoài ba giọng QC nêu, gate còn đụng `fr_FR-upmc`, `vi_VN-vais1000`, audio `pt-en` cũ (`faber`) và MeloTTS. **Tiếng Hàn hiện không còn giọng sạch.**
> - **D-14:** `plan/09-ROADMAP-BEYOND-A1.md` đã viết; 5 chỗ cản lên A2+ đã sửa, có test, trên `plan/beyond-a1`. Phần còn phải làm khi bắt đầu A2 ghi trong tài liệu đó.
> - **PR #56 (it-vi) đã merge (4190d82):** 22/22 check xanh, cả 6 shard thiết bị. Xem `plan/reports/P3d-it.md`.
>
> **Ghi chú (2026-10-30, đêm):**
> - **PR #55 đã merge (a1302eb):** ghim emulator 37.2.12 và kiểm tra sức khỏe trước khi cài app (lỗi thì wipe và khởi động lại đúng một lần, ghi số lần vào báo cáo). Khác với quyết định của điều phối viên ở một điểm: `-change-locale` và `-prop` không dùng được, nên vẫn đặt locale rồi restart, nhưng bước này chạy trong kiểm tra sức khỏe. Bằng chứng ở PR #55. Việc ghim phiên bản có tác dụng hay không chỉ biết được sau nhiều lần chạy.
> - **PR #54 đã merge (300e678):** 22/22 check xanh trên head 8daf086, cả 6 shard thiết bị, 0 lần thử lại hạ tầng.
> - **Lint:** cảnh báo đến từ `.opus` không nằm trong danh sách đuôi được phép của eslint-config-expo. Generator ghi header eslint-disable chỉ cho map có Opus, `lint` chạy `--max-warnings 0`, map tiếng Pháp giữ nguyên từng byte (nằm trong PR it-vi).
> - **P3d(it) đang làm trên `phase-4/it-vi`:** plugin + gate tiếng Ý, 700 từ (syllabus A1 691), 108 bài, 25 thẻ, 38 bảng chia, 7 bài kiểm tra, xếp lớp, CILS A1 standard 2 đề × 56 câu đã qua validator. Còn: truyện, LanguageTool, duyệt D-10, audio.
> - **P3d(pt):** quyết định pt-PT ghi ở `plan/authoring/pt-plan.md`.

> **Ghi chú (2026-10-30, sáng):** PR #52 (QC 2026-10-30 §2) đã merge (97b63ce). Toàn bộ CI và 6 shard thiết bị đều xanh. Trước đó shard API 30 đỏ hai lần do emulator, và nhân dịp đó đã sửa luôn chỗ thử lại sau khi Maestro treo: driver của Maestro giờ được gỡ hẳn rồi cài lại.
> - Nhánh `phase-5/stories-topup-es` đã rebase lên `main`. Truyện A1-0 và truyện bổ sung được gộp: es có 46 truyện thường + 6 A1-0, de có 51 + 6, fr có 10 + 6.
> - Audio truyện chuyển sang Opus 16 kbps cho es và de. Danh sách truyện có audio thật nâng lên 18 truyện mỗi khoá; tiếng Pháp giữ mp3.
> - Audio es và de đã xong (es run 41002365173, de run 41005780237): 0 lỗi kỹ thuật; tổng audio 26,8 / 88 MB. PR #54 đang chờ CI.
> - PR #53 đã merge (1c8b033): sửa 7 câu có hai đáp án đúng ở zh-en, ja-en, pt-en và thêm linter. Câu hỏi máy tự sinh lúc chạy chưa đọc file khai báo đồng nghĩa.
> - Chờ chủ dự án quyết định: 852 cảnh báo lint do `.opus` trong hai file asset sinh tự động (`eslint.config.js` được hook bảo vệ). Cảnh báo không làm đỏ CI.

> **Ghi chú (2026-10-30):** PR #51 (ai-review: D-10 + chiến lược và pipeline audio) đã merge (b89ae3c). CI, cả 6 shard thiết bị và LanguageTool đều xanh.
> - **Audio thật:** es 1.643 clip, de 1.478 clip, 0 lỗi kỹ thuật. Trong 11 câu tiếng Đức sinh lại, 7 câu đã sạch; 4 câu còn lại nằm ở mục C1 của checklist để chủ dự án nghe thử. Tổng audio 24,7 / 88 MB.
> - **Kiểm tra phát Opus:** đạt trên API 30, API 34 và web, ở cả tốc độ thường lẫn chế độ chậm, không lỗi giải mã. Chuyển audio truyện sang Opus sẽ làm trong PR stories-topup-es.
> - **QC 2026-10-30 §1 ("offline today" đỏ):** nguyên nhân là đợt duyệt D-10 sửa một câu thành «Papá…», nên "papá" thành từ của truyện. Trả lời đúng vẫn đến hạn ôn lại sau 10 phút (bước ngắn hạn của FSRS), nên phiên Hôm nay mở bằng lượt ôn đó. Flow giờ chọn đáp án theo testID, bài học phải 0 lỗi, và Hôm nay trả lời lượt ôn trước rồi mới kiểm tra thẻ từ mới.
> - **Đang làm PR `fix/today-story-and-picture-cues` (QC §2):**
>   - linter cấm hai lựa chọn trùng hình, đã gỡ hình ở 39 câu hỏi trên 10 khoá, kể cả 6 câu của fr-en (đổi tiếng Pháp có chủ đích);
>   - khi máy tự sinh câu hỏi, hình trùng hoặc từ họ hàng thì cả câu chỉ hiện chữ;
>   - Hôm nay chỉ gợi ý truyện có tối đa 10 từ chưa biết, nếu không thì hiện "học thêm N từ";
>   - 18 truyện siêu ngắn A1-0 (es, de, fr mỗi thứ tiếng 6 truyện).
>
>   Ngoài ra đã sửa lỗi biên dịch lệch trên Windows (Intl.Segmenter coi chữ số là một từ).
> - Thứ tự tiếp theo: PR §2 → stories-topup-es (kèm chuyển audio truyện sang Opus) → P3d(it).

> **Ghi chú (2026-10-29, chiều):** PR #49 (de-vi) xanh trên CI:
> - **Audio tiếng Đức:** 0 lỗi kỹ thuật.
> - **LanguageTool tiếng Đức:** lần đầu tiên chạy hết. Trước đây job luôn bị huỷ vì mỗi request mất khoảng 0,9 s; nay gửi câu theo lô. 267 phát hiện được xử lý: sửa 19, cho phép 248 kèm lý do.
> - **Thiết bị:** 6 shard emulator xanh.
>
> D-10 (duyệt bằng AI mô phỏng người bản ngữ) đã xong cho cả ba khoá, audit độc lập đều dưới 2 %: fr-vi 1,4 %, es-vi 0 % sau lượt duyệt thứ hai, de-vi 0,6 %. Phần này nằm trên nhánh `phase-4/ai-review` (đã đẩy lên GitHub), cùng với các mục của QC-2026-10-29b:
> - pipeline audio kiểm tra nhanh trước ASR, có cache ASR, từ ngắn thêm khoảng lặng;
> - gate tổng audio 88 MB, chỉ bundle audio cho truyện band 1;
> - các truyện còn lại đọc bằng giọng máy;
> - bộ phát hiện clipping tính theo mẫu liên tiếp;
> - kiểm tra phát Opus.
>
> `phase-4/exam-engine-v2` cũng đã đẩy lên GitHub.
>
> Thứ tự tiếp theo: merge #49 → PR ai-review (mỗi ngôn ngữ es, de chạy audio một lần) → exam-engine-v2 → bổ sung truyện es → P3d(it).

> **Ghi chú (2026-10-28, khuya):** PR #48 đã merge: Gradle có giới hạn thời gian và số lần thử lại (build x86_64 trên PR #48 mất 11 phút 47 giây, trước đó từng treo 41 phút). P3d(de) áp dụng QC 2026-10-28: không sửa gói de-en, không làm migration v9 (dùng legacySurfaces, tiếng Đức nằm trong v8), có gate riêng cho tiếng Đức, đề Goethe A1 đã đối chiếu tài liệu chính thức (Modellsatz 02/2024, Durchführungsbestimmungen 1/9/2025), báo cáo độ phủ ngữ cảnh và kế hoạch 40–50 truyện mỗi ngôn ngữ. Từ điển tiếng Đức có 927 mục đã duyệt; bài học Phần 1 + 2 đang ở dạng nháp.

> **Ghi chú (2026-10-28, tối):** Đã gỡ kẹt theo `plan/prompts/P-unstick-2026-10-28.md` và merge ba PR. **#46** — commit của bot tự kích hoạt CI + device acceptance (đã chạy thật: không còn `action_required`); mọi lượt tải có giới hạn (dưới 50 kB/s trong 2 phút thì huỷ, thử lại 5 lần có nối tiếp, tiến độ 30 giây/lần); ETL dùng cache theo URL + ETag nên chạy lại không tải dump lần nữa; mọi job có `timeout-minutes`. **#47** — migration v8 chuyển tiến độ es-en lưu theo chữ (RC3) sang id, không mất mục nào; shard nâng cấp RC3 trên emulator so số đếm. **#45 (P5b)** — truyện ngắn phân cấp, audio tiếng Tây Ban Nha + Pháp đã sinh, cả 6 shard emulator xanh. Đang làm **P3d(de)** trên `phase-4/de-vi`: migration v9 cho tiếng Đức; ETL tiếng Đức sửa tận gốc (giống theo head template — das Taxi; danh từ tính từ hoá — der Deutsche; nghĩa từ chức năng không còn xoá trạng từ nicht/auch/noch); từ điển 894 mục đã duyệt tiếng Việt (800 mục cũ giữ nguyên id + 94 từ cốt lõi mới). Tiếp theo: bài học 27 đơn vị.

> **Ghi chú (2026-10-28):** Làm theo `plan/prompts/00-MASTER-PROMPT-v2.md` — chạy dài tới bản v1.0, không dừng chờ chủ dự án; RC4 gác lại. Mọi việc chỉ người làm được nằm trong **`plan/OWNER-FINAL-CHECKLIST.md`** (làm một lần ở cuối). P3h (PR #43) và P4a (PR #44) đã merge, CI emulator 6 shard xanh. **P5b xong**: truyện ngắn phân cấp — 20 truyện tiếng Tây Ban Nha, 10 truyện tiếng Pháp, mỗi câu có bản dịch và âm thanh riêng; đọc theo câu được tô sáng, chạm từ xem nghĩa, 3 câu hỏi, rồi phần kiểm tra từ mới đi qua FSRS; truyện gợi ý là truyện có 3–6 từ người học chưa biết. Lối vào: Luyện tập → Đọc & nghe, và thẻ Truyện hôm nay. Âm thanh của truyện do workflow audio sinh trên CI. Tiếp theo: **P3d(de)** (de-vi + Goethe A1).

| id | milestone | branch / PR | status | date | notes |
|---|---|---|---|---|---|
| P0 | Local signed APK (RC3) + small fixes | `phase-0/rc3-local-apk` (PR pending push) | done (device test → OWNER-FINAL-CHECKLIST D) | 2026-10-14 | toolchain installed; 7 small fixes + library-permission block, all gates green locally and on CI (5 TZ); release APK built and **signed by the owner** (`579a3906…7a9f`, signer `d280d1de…3182`); PR #28 merged; phone packets 0–3 and tag `v1.0.0-rc.3` still owner actions |
| P1a | Golden tests | `phase-1/golden-tests` / [PR #29](https://github.com/vansyson1308/learning-french-with-tracy/pull/29) | done | 2026-10-14 | compile manifest (45 files + SQLite logical dump) + 54 runtime snapshots (session, today, evidence, assessment, lexicon, grading, migrations); `bun scripts/golden.ts --check|--update --reason`; CI step "Golden tests" in all 5 TZ lanes; compiler artifact assembly extracted to `scripts/lib/compile-artifacts.ts` (zero drift) |
| P1b | CourseProfile decouple | `phase-1/course-profile` / [PR #30](https://github.com/vansyson1308/learning-french-with-tracy/pull/30) | done | 2026-10-14 | compiler-generated course profiles + id registries + per-course artifact modules; language plugins `src/lib/languages/*`; every runtime module takes courseId; speech/UI language-neutral; `no-fr-hardcode` + es-en FSRS throwaway tests; goldens byte-identical (only new generated files blessed) |
| P1c | Schema/compiler generalise | `phase-1/schema-generalise` / [PR #31](https://github.com/vansyson1308/learning-french-with-tracy/pull/31) | done | 2026-10-15 | `content/<target>/**` + packs discovered per language; id factories, `Record<nativeCode,string>` native text (`migrate-fr-schema-v2.ts`), `ParadigmTableSchema`, build plugins `scripts/lib/languages/*`, catalog generated, lexicon DB v3 per language (the one told rename; dump equality verified), synthetic `xx` test language compiles/validates/loads through the registry (jest), `reception-audio.ts --lang/--dry-run`; French artifacts byte-identical except the documented DB-rename cascade |
| P1d | Persistence v4 | `phase-1/persistence-v4` / [PR #32](https://github.com/vansyson1308/learning-french-with-tracy/pull/32) | done (device smoke → OWNER-FINAL-CHECKLIST D) | 2026-10-15 | persist v4 (`assessmentByCourse`, `uiLanguage`), learner store (expo-sqlite `learner-v4.db` / JSON on web) behind one interface with a crash-safe pending buffer flushed per session, one-time blob import with `progress-before-v4-*` safety copy, backup envelope v2 (blob + learner halves, v1 still imports, atomic commit with rollback of both halves), two-course soak: blob 19 KB after 50 days (bound 512 KB); French goldens byte-identical except the migration/backup snapshots |
| P2a | i18n Vietnamese UI | `phase-2/i18n` / [PR #33](https://github.com/vansyson1308/learning-french-with-tracy/pull/33) | done (device typography → OWNER-FINAL-CHECKLIST D) | 2026-10-15 | typed `t()`/`useT()` + ICU-lite formatter, 445-key `vi`/`en` catalogues (generated `MessageKey`, parity + sorted + no-English-in-lib lint tests), engines return `Message` keys (rubric, speech, panel, quests, backup), generated listening question keyed by course native code (goldens byte-identical), `uiLanguage` + Profile picker (Device / Tiếng Việt / English), typography tokens + `AppText`, DuoButton natural case for vi, bilingual privacy policy + `/vi/` site pages, e2e on testIDs + catalogue labels with a Vietnamese CI smoke, `USER_GUIDE.vi.md` |
| P2b | fr-vi | `phase-2/fr-vi` / [PR #34](https://github.com/vansyson1308/learning-french-with-tracy/pull/34) | done (native review + device walk → OWNER-FINAL-CHECKLIST B/D) | 2026-10-15 | `scripts/translate-native.ts extract|apply|status` (dictionary + per-key JSONL draft providers, no network, fail-closed), 3,139 Vietnamese drafts applied to `content/fr/**` (+`vi` keys, `exerciseNative.vi` overlays) → `content/courses/fr-vi.json` + 1:1 id map + `content/fr/REVIEW-vi.md`; validators: native coverage, cross-course consistency, placement re-pointing, audio alias; compiler emits per-native artifacts (`fr-vi-*`, own lexicon DB; `fr-en` byte-identical, same lexicon hash via native-view hashing), `audioCourseId`, claim gate per target with inheriting courses; D-4: learner store schema v2 (cards keyed by target language, in-place SQLite/JSON migration), persist v5 (`assessmentByTarget`), store-level shared-card tests; onboarding/switcher list the course explained in the UI language first; CI Vietnamese lane walks `fr-vi` |
| P3a | Lexicon ETL v2 | `phase-3/lexicon-etl-v2` / [PR #35](https://github.com/vansyson1308/learning-french-with-tracy/pull/35) | done (Korean NIKL list → OWNER-FINAL-CHECKLIST C) | 2026-10-15 | generic fail-closed lexicon derivation (`scripts/lexicon-etl.ts` + `.github/workflows/lexicon-source.yml`, dispatch-only): kaikki (en + vi editions), FrequencyWords, wordfreq, Tatoeba, JMdict/CEDICT, OpenJLPT/hsk30/CEFR-J/NGSL anchors, manifest v2 pins; `scripts/lexicon-author.ts` → Spanish lexicon 800 lexemes (frozen ids, `es-en` Vocabulary browser; scheduler unchanged until P4a), `REVIEW.md` with 293 `TODO:vi` for P3c; English pool + `vi-bridge.json` locally, de/it/pt/ja/ko/zh pools via the dispatched runs; Spanish build plugin; validators for native coverage / TODO markers / retrieved sources; French byte-identical |
| P3b | Audio pipeline v2 | `phase-3/audio-v2` / [PR #36](https://github.com/vansyson1308/learning-french-with-tracy/pull/36) | done | 2026-10-15 | engine abstraction `scripts/lib/tts/` (Piper / Kokoro-82M / MeloTTS, pinned in `content/audio/engines.json` with the licence gate v2), unified driver `scripts/audio.ts` (pack / lexicon / reception layers, canary → select → generate, per-language manifest merge and baselines), workflow `audio.yml` replaces pack-audio + reception-audio, ASR audit with SenseVoice for zh/ja/ko (vi moved to Whisper in P3c) and CER for ja/zh, loudness normalisation for v2 clips, `voice-casts.json` + language canaries for es/de/it/pt/ja/zh/ko/en/vi, French byte-identical (version 1, baselines migrated 713 files); the canary runs and the Spanish generate run are dispatched after the merge |
| P3c | Authoring toolkit | `phase-3/authoring-toolkit` / [PR #37](https://github.com/vansyson1308/learning-french-with-tracy/pull/37) | done | 2026-10-15 | `plan/authoring/BLUEPRINT.md` (French counts as the template), `STYLE-vi.md`, `GLOSSARY.md`, 9 Vietnamese pedagogy briefs; `scripts/author.ts emit|ingest` for 12 steps (prompt bundles with zod→JSON schema, allowed ids, French exemplars with Vietnamese; ingest validates, merges, runs validators, writes REPORT.md), quality linters (position bias, duplicates, distractor POS, guidebook length, type mix, lexeme coverage, CEFR-descriptor leak, reading caps — they flag French's audited issues), review checklist + compile gate (`review` / `allowUnreviewed` in the course profile; `fr-vi` explicitly unreviewed), self-test on `xx`; `es/vi` bundles for objectives + units committed under `content/es/_drafts/`; audio workflow serialized across languages after a rebase conflict |
| P3d(es) | es-vi A1 + DELE A1 track | `phase-3/es-vi` / [PR #39](https://github.com/vansyson1308/learning-french-with-tracy/pull/39) (merged) | done — QC follow-ups in P3e | 2026-10-22 | `es-vi` authored through the P3c toolkit with staging: 6 sections / 27 units / 108 lessons / 589 exercises (all 15 types), 34 objectives, 21 concepts + 11 paradigms, 887 lexemes reviewed in Vietnamese, 37 readings, 255 clips, 54 speech / 38 writing / 22 scenarios, 7 checkpoints (capstone 2 forms), 28-item placement; claim gate **A1 claimable** in all 5 domains; **course roles** (`primary` / `standalone`): `es-en` standalone (lessons byte-identical, own English dictionary, under "Khoá khác"), French byte-identical; **DELE A1 exam track** (public format only, original items, 2 disjoint forms × 56 items, estimated-readiness bands, format not re-checked against the official guide) + reusable exam engine (schema, validator, compiler, runtime, Practice card, overview, timed mock, section practice, weak areas → FSRS review, toolkit step `exam`); form exercises now show their cue card (Spanish; French needs a content task); 1,470 tests × 5 TZ, `e2e:exam` 14/14 |
| P3e | QC fixes on es-vi + harden the course template | `phase-3/es-vi-hardening` / [PR #40](https://github.com/vansyson1308/learning-french-with-tracy/pull/40) (merged) | done (owner review → OWNER-FINAL-CHECKLIST B) | 2026-10-22 | DELE A1 re-authored to the 2020 model (exam schema v2: lettered pools, score groups 30/50, 2 forms × 110 items; official guide still unreachable → `checkedAgainstOfficialGuide: false`); daily new-words stream (syllabus es 613 A1 lexemes, fr derived; persist v6 `dailyNewWords`); lesson-shape gate (≥ 5 exercises, no repeats; es-vi 712 exercises; French exempt); Peninsular Spanish with Latin-American forms accepted (`VARIETY.md`, variety gate); ko scored by CER → A `melotts-ko`, ja B `jm_kumo`, zh B `zm_yunjian`, vi A; bot-commit survives a moved branch; French simpleForm card (approved); default course by UI language (vi → fr-vi, en → fr-en); tiered review (Tier-1 vi 352 / es 313 lines), LanguageTool CI gate, back-translation pass (3,024 pairs; ETL homograph defect fixed for 35 lexemes), es-vi beta label; `plan/reports/P3e.md` |
| P3f | QC follow-up of #40, audio size budget, RC4 on the phone | PR #40 (merged) + `release/rc4` | done — D parked: RC4 built (3ff3b96), unsigned, not device-tested (owner decision 2026-10-27) | 2026-10-22 | `plan/prompts/P3f-qc-followup-and-rc4.md`: manifest duplicate keys + bot-commit typecheck + workflow_run on main; 32 kbps + syllabus-only lexicon audio + 12 MB/language gate + ASSET_DELIVERY.md; topic→unit map, vosotros, variety, DELE checked; RC4 build 2 signed by the owner + upgrade test over RC3; roadmap: P5b before P3d(de/it/pt), P4b with Hán-Việt |
| P3g | Release hardening (B per-course lazy content + web entry gate; C phone APK arm64 + armeabi; E hygiene tests) | `phase-3/p3g-release-hardening` (PR pending) | done | 2026-10-27 | web entry 7.37 → 3.19 MB (gate ≤ 4.5 MB in CI), one chunk per course; phone APK 84.0 MB (was 133.7 universal); no-network / no-orphan-audio / CI-tools-absent tests; `plan/reports/P3g.md` |
| P3h | Automated device acceptance (Android emulator API 34 + 30, Maestro flows, upgrade from RC3 data, offline, audio, backup, crash/ANR, cold start ≤ 3.5 s, screenshots vi/en) — required for merge | `phase-3/p3h-device-ci` / [PR #43](https://github.com/vansyson1308/learning-french-with-tracy/pull/43) (merged) | done (phone pass → OWNER-FINAL-CHECKLIST D) | 2026-10-27 | flows generated from content (`scripts/device/maestro-flows.ts`), driver `scripts/device/acceptance.sh`, workflow `device-acceptance.yml` (API 34 + 30, RC3 APK cached); API 34 emulator all PASS: 10 first lessons + audio events, checkpoint 12/12, DELE reading 25/25, speech-unavailable, backup round trip, offline, RC3 → current upgrade unchanged, cold start median 2.19 s, PSS ~159 MB; fixed Profile streak title overflow (vi); L13 x86_64 GWP-ASan launch crash documented; CI: per-flow timeout + `.hang/` diagnostics, 75 min watchdog, api [34, 30] × shard [core, lessons, backup-upgrade] — run 40605875665 all 6 shards green (longest 31 min, no hang); `plan/reports/P3h.md` |
| P4a | inherited fixes / retire -en packs | `phase-4/inherited-packs` / [PR #44](https://github.com/vansyson1308/learning-french-with-tracy/pull/44) (merged) | done (device smoke → OWNER-FINAL-CHECKLIST D) | 2026-10-27 | 120 data fixes in the basic packs (ja 16 / zh 20 real clozes, ko 20 spacing, it 3 apostrophes, 60 romanized typeAnswer alternatives → English, de word-order note, 33 repeated words) + validator `templateDefectErrors` (one blank, no whole-sentence blank, no romanized alternative, basic packs list a word once; `basicPack` profile flag); reading aid (romanization) in options/prompt/match/teach/guidebook/correct answer, per-course Profile switch, persist v7 `readingAid` (+ backup now carries `dailyNewWords`); Spanish voice already kokoro-ef_dora (canary 0.083 vs es_MX-claude 0.142) — no change; `hiddenFromOnboarding` compiled from basic pack + A1-claimable `-vi` twin (es-en today); FSRS for basic packs deferred; `plan/reports/P4a.md` |
| P5b | graded stories, all shipped languages (context for daily words) | `phase-5/stories` / [PR #45](https://github.com/vansyson1308/learning-french-with-tracy/pull/45) | done (merged b4d1133) (audio via the audio workflow; native review → OWNER-FINAL-CHECKLIST B) | 2026-10-28 | content type `story` + validator (every token resolved via lexicon/morphology/function words, ≥ 95 % known at syllabus band, 3–5 new words, 3 questions, no CEFR text); 20 es (8 band 1, 12 band 2) + 10 fr (band 2: 126-lexeme lexicon) original stories with vi/en sentence translations; per-sentence reception audio (offsets from QA durations); reader with read-along highlight, tap-to-gloss, sentence translation, questions; word check through the evidence gate (new words only + picked words); selection by unknown-word count from card states (no persisted change); Practice + Today entries; Maestro `stories.yaml` in the core shard; en stories move to P4f with en-vi; `plan/reports/P5b.md` |
| P3d(de) | de-vi + Goethe A1 | `phase-4/de-vi` / [PR #49](https://github.com/vansyson1308/learning-french-with-tracy/pull/49) | merging: audio 40815633778 ✓ (0 technical failures), CI 40850339435 ✓ incl. LanguageTool de-vi (4,676 strings, 0 failing), device acceptance 6 shards | 2026-10-29 | QC 2026-10-28 (`plan/prompts/QC-2026-10-28-de-vi.md`) applied:
  - de-en untouched (standalone, under "Khoá khác"); legacySurfaces instead of migration v9; German joins v8.
  - German gates: noun article/plural/capital, dative only in declared chunks before Section 4, V2/separable concept + ≥ 6 exercises, du/Sie register per scenario, LanguageTool (de-DE) on CI, `VARIETY.md`.
  - Goethe A1 track verified against goethe.de (Durchführungsbestimmungen 1.9.2025, Modellsatz 02/2024; `content/de/exam/FORMAT-SOURCES.md`), group Sprechen simulated one-to-one (KNOWN_LIMITATIONS).
  - QC 2026-10-29 §1:
    - A1 syllabus 690 lexemes (Wortliste-aligned + taught), the other 598 are band A2-1 (`syllabus-a2-1.json`);
    - context gate 100 % (690/690);
    - `en` fields validated in every course (381 German strings translated);
    - per-part play counts (Hören Teil 2 once);
    - Schreiben Teil 2 rubric points (estimate);
    - `release/ASSET_DELIVERY.md` projection: story audio not bundled (text-only), budget kept.
  - Stories: 43 (40 A2-1 + 3 A1-2); `plan/STORIES-PLAN.md` for es/fr top-ups.

  Content: 6 sections / 27 units / 108 lessons / 704 exercises (all 15 types, concept steps in 25 lessons, 23 of 23 cards shown), 35 objectives, 23 concepts + 12 paradigms, 1,288 lexemes (vi; A1 syllabus 690), 40 readings, 244 clips, 54 speech / 36 writing / 22 scenarios, 7 checkpoints, 28-item placement, Goethe A1 practice 2 forms × 35 items; Tier-1 review files vi 378 / de 309 lines; back-translation 5,043 pairs (`content/de/_drafts/BACKTRANSLATION.md`). Report `plan/reports/P3d-de.md` |
| P3d(it) | it-vi + CILS A1 | `phase-4/it-vi` | merged, PR #56 (4190d82); see `plan/reports/P3d-it.md` | | |
| P3d(pt) | pt-vi + CAPLE A1 | – | not started | | |
| P4b | CJK plugins + Hán-Việt readings (Unihan kVietnamese + reviewed overrides) | `phase-4/cjk-plugins` | in progress — stage 2 (Hán-Việt) done: 118 pairs ja/zh/ko in `content/hanviet/`, checked against Unihan 17.0.0, `hanVietFor` runtime helper; D-10 sheet `content/hanviet/REVIEW.md` pending. Stage 3 (tasks 2–3, code) done: ja/zh/ko runtime plugins (dictionary maximal-match tokenizer bound to the course lexicon via `withLexicon`, kana/width/ー/small-kana folds, kana-for-kanji and pinyin-for-hanzi as lenient practice matches from stored readings, word-level traditional→simplified from the lexicon, jamo composition + spacing-insensitive alternate, keystroke-jamo search fold, sino/native numbers and counters, 两/二, reading-speed bands) and the speech grader's reading layer (ja kana ≡ kanji); real recognizer transcripts pending (owner, checklist §C; fixture `src/lib/__fixtures__/speech/owner-recognizer-transcripts.json`) | | |
| P4c | ja-vi + JLPT N5 | `phase-4/ja-vi` | content, D-10 review and audit done; promoted with `--allow-missing-audio` (2026-11-03); audio run, CI and PR pending | 2026-11-03 | 108 lessons / 1,024 exercises, 957 lexemes, 45 stories, 7 checkpoints, 4-stage placement, JLPT N5 track 2 × 67; D-10 review 194 findings, independent audit 407 lines 0.74 % P0+P1 (`content/ja/REVIEW-AI.md`; answer keys 2.54 %, the three classes closed by generator rules + self-check rule 9); `typeAnswer.script: "katakana"` (owner decision, 9 items); `ja` joins `V8_REKEYED_TARGETS` (fixture `v3-rc3-ja.json`: ja-en surfaces → `ja:w:`, さかな keeps `ja:legacy:`); dry compile: ja A1 claimable, Vietnamese default stays en-vi, ja-en leaves onboarding; `content:validate` 1,020 errors, all missing ja audio (268 clips / 258 assets, 752 pack audioTargets) — the audio bot commit compiles and re-blesses the goldens |
| P4d | zh-vi + HSK 1–2 | – | not started | | |
| P4e | ko-vi + TOPIK I | – | not started | | |
| P4f | en-vi + bậc 2 track (QĐ 1481), not VSTEP | `phase-4/en-vi` | content and AI review done, audio and CI pending; see `plan/reports/P4f-en-vi.md` | | |
| P5a | FSRS visible | – | not started | | |
| P5c | own-text importer | – | not started | | |
| P5e | mistake-driven grammar | – | not started | | |
| P5d | pronunciation coach (en + one more) | – | not started | | |
| P5f | constrained LLM tutor (opt-in, off by default) | – | not started | | |
| P6a | brand / store prep | – | not started | | |
| CI-unstick | bot commits dispatch their own checks; bounded downloads; job timeouts (`plan/prompts/P-unstick-2026-10-28.md` A–C) | `ci/bot-and-fetch-hardening` / [PR #46](https://github.com/vansyson1308/learning-french-with-tracy/pull/46) | done (merged 65a4f28) | 2026-10-28 | PR #45 sat `action_required` (bot head); German ETL hung 2 h 49 min on a trickling Tatoeba download → `scripts/ci/fetch.sh` (abort < 50 kB/s for 120 s, 5 resuming retries, progress every 30 s), ETL source cache (actions/cache by URL + ETag/Last-Modified, no double download), timeout-minutes on every job; `workflow-hygiene.test.ts` |
| Migr-v8 | legacy progress re-key (es-en / de-en surface keys → registry ids), approved by the coordinator 2026-10-28 | `fix/legacy-progress-rekey` / [PR #47](https://github.com/vansyson1308/learning-french-with-tracy/pull/47) | done (merged bfc21f1) | 2026-10-28 | persist v8: `rekeyRegistryCourses` re-keys wordStats + legacy srs of every non-French course whose target has an id registry (curated id, else reversible `<code>:legacy:` id; collisions merge; idempotent); `V8_REKEYED_TARGETS` must equal the shipped registries (a new registry — de in P3d(de) — needs its own numbered step); fixture `v3-rc3-es-de.json`; legacy review queue and Practice/Profile now read through the item id (an es-en word learned after P3a never came back for review; Profile counted 0 French words); RC3 upgrade shard seeds es-en/de-en progress and compares raw RC3 counts with the upgraded build |
| v1.0 | v1.0 candidate (definition in `00-MASTER-PROMPT-v2.md`; acceptance in `release/V1_ACCEPTANCE.md`) | – | not started | | owner signs + accepts once (`plan/OWNER-FINAL-CHECKLIST.md`) |

Owner actions: none here — every human-only task is in `plan/OWNER-FINAL-CHECKLIST.md` (done once, at the v1.0 candidate).
