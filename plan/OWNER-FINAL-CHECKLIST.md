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
- ☐ **Mục chưa chắc** (không chặn việc gì): xem phần "Chưa chắc" trong từng `REVIEW-AI.md` và quyết định giữ hay sửa; báo Claude.
- ☐ **Anh tự kiểm tra (tuỳ chọn)**: anh đọc tiếng Việt bản ngữ, tiếng Pháp trình độ đại học, tiếng Anh C1 — có thể đọc lướt `content/fr/REVIEW-vi.md` (tiếng Việt của fr-vi), mọi văn bản tiếng Việt trong `REVIEW-TIER1-vi.md` của es/de, và phần tiếng Anh của en-vi khi có.
- ☐ Mỗi khoá mới (it, pt, ja, zh, ko, en) có bước duyệt AI tích hợp sẵn trong P3d; Claude thêm dòng `ai-review:<khoá>` vào đây khi khoá đó xong.
- ☐ Nếu anh chấp nhận phát hành v1.0 khi một khoá **vẫn còn nhãn beta** (chưa đánh ☑ dòng chấp nhận), ghi rõ ở đây khoá nào.

## C. Nguồn dữ liệu chỉ tải tay được (tuỳ chọn, không chặn công việc)
- ☐ Danh sách từ học tiếng Hàn NIKL 한국어 학습용 어휘 목록 (KOGL Type 1) — korean.go.kr từ chối tải tự động; đặt file vào `sources/ko/nikl-learner-list.tsv` hoặc gửi Claude. Không có thì neo từ vựng tiếng Hàn theo tần suất. (P3a)
- ☐ (Tuỳ chọn) Nghe thử các bản canary giọng ja/zh/ko trong artifact của workflow audio trước khi sinh audio đầy đủ. (P3b)

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
