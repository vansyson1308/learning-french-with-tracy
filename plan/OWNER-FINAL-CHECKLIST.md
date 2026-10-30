# OWNER FINAL CHECKLIST — việc chỉ anh làm được, làm MỘT LẦN ở cuối

Quyết định của chủ dự án (2026-10-27, `plan/prompts/00-MASTER-PROMPT-v2.md`): không test điện thoại giữa chừng, không dừng chờ.
Mọi việc chỉ người làm được gom vào file này. Claude **thêm mục mới vào đây, không bao giờ dừng chờ**.
Anh làm danh sách này một lần, khi bản **v1.0 candidate** đã sẵn sàng (Claude sẽ ghi rõ ở đầu `plan/STATUS.md`).

Ký hiệu: ☐ chưa làm · ☑ xong · (từ milestone nào)

## A. Khoá ký và tài khoản (trước khi build bản v1.0 ký)
- ☐ **Giữ keystore an toàn**: `C:\keys\lft-upload.jks` + hai mật khẩu được sao lưu ngoại tuyến ở hai nơi (không ghi vào file văn bản thường). Đây là khoá đã ký RC3; mọi bản sau phải cùng khoá để cài đè được. (P0)
- ☐ **Gõ mật khẩu keystore một lần** khi Claude báo bản v1.0 candidate đã build: chạy script ký trong `out\` (tên file Claude ghi ở đầu STATUS), gõ mật khẩu, báo "XONG".
- ☐ **Đẩy tag** sau khi ký và CI xanh (phiên làm việc không đẩy tag được): `git tag -a v1.0.0 <commit> -m "v1.0.0"` rồi `git push origin v1.0.0`. Các tag RC cũ (rc.3, rc.4) không cần nữa. (P0, P3f)
- ☐ **Tài khoản Google Play Console** (cá nhân) và chương trình closed test (12 tester × 14 ngày) — Claude chuẩn bị nội dung ở P6a; anh tạo tài khoản và bấm nộp. (P6)
- ☐ (Tuỳ chọn, sau v1.0) Apple Developer Program + EAS project nếu muốn bản iOS. (RC2)

## B. Duyệt nội dung (D-10, 2026-10-29: không thuê người duyệt bản ngữ — AI mô phỏng người bản ngữ duyệt, anh chấp nhận từng khoá)
Mỗi khoá có `content/<ngôn ngữ>/REVIEW-AI.md`: số dòng đã duyệt, lỗi theo mức P0/P1/P2, mẫu audit độc lập 10 % và tỉ lệ lỗi, danh sách **chưa chắc**. Khi anh đánh dấu ☑ một dòng chấp nhận dưới đây (giữ nguyên mã `ai-review:<khoá>`), Claude ghi `review: { kind: "ai-simulated", … }` vào profile của khoá đó. Nhãn "Bản beta" khi ấy đổi thành ghi chú trung thực "Nội dung được AI kiểm duyệt kỹ, chưa qua giáo viên bản ngữ…". Gate biên dịch chỉ nhận `ai-simulated` khi dòng tương ứng đã được đánh ☑.
- ☐ **Chấp nhận duyệt AI** `ai-review:fr-vi` — đọc `content/fr/REVIEW-AI.md` (phần tiếng Pháp giữ nguyên bản fr-en).
- ☐ **Chấp nhận duyệt AI** `ai-review:es-vi` — đọc `content/es/REVIEW-AI.md`.
- ☐ **Chấp nhận duyệt AI** `ai-review:de-vi` — đọc `content/de/REVIEW-AI.md` (sau PR ai-review cho de-vi).
- ☐ **Chấp nhận duyệt AI** `ai-review:it-vi` — đọc `content/it/REVIEW-AI.md`.
- ☐ **Mục chưa chắc** (không chặn việc gì): xem phần "Chưa chắc" trong từng `REVIEW-AI.md` và quyết định giữ hay sửa; báo Claude.
- ☐ **Anh tự kiểm tra (tuỳ chọn)**: anh đọc tiếng Việt bản ngữ, tiếng Pháp trình độ đại học, tiếng Anh C1 — có thể đọc lướt `content/fr/REVIEW-vi.md` (tiếng Việt của fr-vi), mọi văn bản tiếng Việt trong `REVIEW-TIER1-vi.md` của es/de, và phần tiếng Anh của en-vi khi có.
- ☐ Mỗi khoá mới (it, pt, ja, zh, ko, en) có bước duyệt AI tích hợp sẵn trong P3d; Claude thêm dòng `ai-review:<khoá>` vào đây khi khoá đó xong.
- ☐ Nếu anh chấp nhận phát hành v1.0 khi một khoá **vẫn còn nhãn beta** (chưa đánh ☑ dòng chấp nhận), ghi rõ ở đây khoá nào.

## C. Nguồn dữ liệu chỉ tải tay được (tuỳ chọn, không chặn công việc)
- ☐ Danh sách từ học tiếng Hàn NIKL 한국어 학습용 어휘 목록 (KOGL Type 1) — korean.go.kr từ chối tải tự động; đặt file vào `sources/ko/nikl-learner-list.tsv` hoặc gửi Claude. Không có thì neo từ vựng tiếng Hàn theo tần suất. (P3a)
- ☐ (Tuỳ chọn) Nghe thử các bản canary giọng ja/zh/ko trong artifact của workflow audio trước khi sinh audio đầy đủ. (P3b)

### C1. Nghe thử các câu audio máy chấm "đáng ngờ" (QC 2026-10-29b §3.4)
Anh không cần biết tiếng Đức: chỉ nghe xem âm thanh có bị **méo/rè** (vỡ tiếng, rè, nuốt chữ, lặp âm) hay không. 11 câu tiếng Đức bị nhận dạng giọng nói (ASR) chấm lệch được sinh lại một lần với cùng giọng, độ nhiễu Piper khác (`resynthesis` trong `content/de/reception/audio-source-manifest.json`). Câu nào **vẫn bị chấm lệch sau lần sinh lại** sẽ được Claude chép vào đây từ báo cáo của lượt audio de tiếp theo (`bun scripts/audio.ts owner-checklist --lang de --report content/reports/de/audio-quality.json`), mỗi dòng có đường dẫn file mp3. Nghe được thì đánh ☑; méo/rè thì ghi "LỖI" bên cạnh, Claude sẽ thay câu hoặc đổi giọng.
Kết quả lượt audio de [40918763308](https://github.com/vansyson1308/learning-french-with-tracy/actions/runs/40918763308) (bot commit 92c26af): trong 11 câu sinh lại, 7 câu hết bị chấm lệch, 4 câu vẫn bị chấm lệch (hai dòng cuối là cùng một file):
- [ ] de: nghe xem có bị méo/rè không — `de-vi:Wir haben Pizza gegessen.` «Wir haben Pizza gegessen.» (`assets/audio/de/0ef4ad270fbe6f500e7a.mp3`) — máy nghe thành «Ihr habt Pizza gegessen», nên nghe kỹ chữ đầu.
- [ ] de: nghe xem có bị méo/rè không — `de.clip.goethe_a_h1_06` «Wie ist deine Telefonnummer? Null, eins, sieben, sechs — vier, drei, acht, neun.» (`assets/audio/de-reception/ab621e42e894b5e8f5ae.mp3`) — máy viết số bằng chữ số («017 64 38 9»), nhiều khả năng chỉ là lệch cách viết.
- [ ] de: nghe xem có bị méo/rè không — `de.clip.ix_goethe_a_thema_miss` «Kein Problem. Danke schön!» (`assets/audio/de-reception/bfe69cea6fdd71c77f3e.mp3`) — máy viết «Dankeschön» liền, nhiều khả năng chỉ là lệch cách viết.
- [ ] de: nghe xem có bị méo/rè không — `de.clip.ix_goethe_b_thema_miss` «Kein Problem. Danke schön!» (`assets/audio/de-reception/bfe69cea6fdd71c77f3e.mp3`) — cùng file với dòng trên.

**Câu truyện tiếng Đức.** Lượt audio de [41005780237](https://github.com/vansyson1308/learning-french-with-tracy/actions/runs/41005780237) (bot commit 7cfc116) đã render lại toàn bộ câu truyện bằng Opus. Trong 4 câu từng bị chấm lệch, `die_anmeldung#9` đã sạch; 3 câu sau vẫn bị chấm lệch sau lần render thứ hai, anh nghe giúp:
- [ ] de: nghe xem có bị méo/rè không — `de.story.der_umzug#6` «Nein. Ich lese jetzt viel.» (`assets/audio/de-reception/1c7761c658cce1fa50ae.opus`) — máy nghe thành «Aber hier ist jetzt viel».
- [ ] de: nghe xem có bị méo/rè không — `de.story.ein_fall_fuer_frau_weber#16` «Ist er der Täter?» (`assets/audio/de-reception/09ec3a1cdfc1c397ce42.opus`) — câu hỏi rất ngắn, máy nghe ra một từ vô nghĩa.
- [ ] de: nghe xem có bị méo/rè không — `de.story.die_anmeldung#12` «Ja, gern. Minh Tran.» (`assets/audio/de-reception/64c5f67d8329609d7036.opus`) — máy viết «Minitran»; nhiều khả năng chỉ là tên riêng.

8 câu truyện khác mới bị chấm lệch lần đầu, chỉ để tham khảo. Đó là các câu ngắn, có tên riêng như Bello, Peter hoặc là câu cảm thán; danh sách nằm trong `content/reports/de/audio-quality.json` → `resynthesisCandidates`.

## D. Một lượt nghiệm thu duy nhất trên điện thoại (bản v1.0 candidate)
Thay cho mọi lượt test lẻ trước đây (gói P0 RC3, smoke P1d, kiểm chữ P2a, đi một vòng fr-vi P2b, đi một vòng es-vi P3e, checklist RC4 — RC4 đã gác lại, không test). Claude sẽ viết bản đầy đủ bằng tiếng Việt (≤ 30 phút) vào `release/V1_ACCEPTANCE.md` khi candidate sẵn sàng; khung:
- ☐ **Cài đè lên RC3** (không gỡ): tiến độ RC3 (streak, XP, bài đã học, thẻ cần ôn, điểm bắt đầu) còn nguyên.
- ☐ Thời gian mở app; **chế độ máy bay** suốt lượt test (app phải chạy hoàn toàn ngoại tuyến).
- ☐ Giao diện tiếng Việt từ đầu đến cuối, không chữ bị cắt; chuyển qua English cũng ổn.
- ☐ Mỗi khoá: một bài học có âm thanh (cả chế độ nghe chậm), từ mới mỗi ngày, một truyện ngắn có chạm-để-tra-nghĩa.
- ☐ Nói: máy có bộ nhận dạng cho ngôn ngữ đó không? Nếu không, app phải hiện bảng "không khả dụng" + Bỏ qua, không lỗi.
- ☐ Một bài thi thử (một phần có giờ, phần nghe phát hai lần, một bài nói).
- ☐ Sao lưu: xuất → xoá dữ liệu app → nhập → mọi thứ trở lại.
- ☐ Dung lượng app trong Cài đặt → Ứng dụng.
- ☐ Mở một khoá tiếng Nhật/Hàn/Trung (gói cơ bản): phiên âm hiện dưới lựa chọn; Hồ sơ → "Hiện phiên âm" tắt được (P4a).
- ☐ Để ý app có tự thoát lúc mở không (L13 trong `release/KNOWN_LIMITATIONS.md`: chỉ thấy một lần trên emulator x86_64; điện thoại arm64 chưa ai thử). Các mục trên đã chạy tự động trên emulator API 34/30 (P3h, `plan/reports/P3h.md`), nên lượt này chỉ để xác nhận trên máy thật.
- ☐ Báo Claude kết quả (ĐẠT / LỖI + ảnh chụp). Lỗi P0/P1 → Claude sửa → candidate tiếp theo (cùng khoá).

## E. Thông tin cửa hàng (P6a)
- ☐ Xác nhận email hỗ trợ (`release/support-contact.json` hiện là `duymank250997@gmail.com`, tạm thời) và tên nhà phát triển hiển thị trên cửa hàng.
- ☐ Duyệt nội dung trang cửa hàng tiếng Việt + tiếng Anh và ảnh chụp màn hình Claude chuẩn bị.
