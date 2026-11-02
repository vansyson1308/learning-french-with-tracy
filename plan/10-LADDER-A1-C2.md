# 10 — Thang A1 → C2 (D-15, QC 2026-11-03)

Mục tiêu của chủ dự án: một người học có thể đi từ con số 0 lên C2 trong cùng một app. Tài liệu này ghi các quyết định D-15. `plan/09-ROADMAP-BEYOND-A1.md` giữ phần chi tiết cho A2–B2 và kết quả rà soát engine; chỗ nào hai tài liệu khác nhau thì theo tài liệu này.

## 1. Các bản phát hành

| Bản | Nội dung | Ghi chú |
|---|---|---|
| v1.0 | A1 × 9 khoá | Giữ nguyên. Hoàn toàn offline, không tải gì. |
| v1.1 | A2 × 9 khoá | Bắt đầu dùng gói tải theo ngôn ngữ và cấp (§5). |
| v1.2 | B1 | |
| v2 | B2 | |
| v3 | C1–C2 | |

Thứ tự ngôn ngữ cho mỗi cấp mới: **en, ja, ko, zh, de, fr**, rồi **es, it, pt**. Tiếng Hàn vẫn phụ thuộc quyết định về giọng (D-11: chưa có giọng sạch).

## 2. Cách dạy thay đổi theo cấp

Một engine duy nhất; mỗi cấp thêm loại nội dung riêng, không tách app.

| Cấp | Nội dung chính |
|---|---|
| A1–A2 | Bài học có cấu trúc, truyện phân cấp, từ mới mỗi ngày (như hiện nay). |
| B1–B2 | Đơn vị theo chủ đề; bài nghe gốc dài hơn (hội thoại, độc thoại 2–5 phút); truyện đọc 1–3 nghìn từ; viết có phản hồi theo rubric; ngữ pháp sâu; văn phong (register). |
| C1–C2 | Văn bản thật, chạm để xem nghĩa và lưu câu (sentence mining): văn học công cộng (Wikisource, Gutenberg), bài CC BY / CC BY-SA (Wikipedia, Wikinews, dữ liệu mở của nhà nước), văn bản người học tự đưa vào (bộ nhập P5c); cụm từ cố định, thành ngữ, văn phong; bài luận và bài nói có phản hồi theo rubric (LLM tuỳ chọn, phải bật, P5f); track chiến lược thi. |

Giấy phép vẫn theo allowlist (CLAUDE.md quy tắc 2). Văn bản CC BY-SA chỉ nằm trong file dữ liệu, không bao giờ trong code.

## 3. Số từ mục tiêu (cộng dồn, mỗi ngôn ngữ)

Số tính theo họ từ (word family). Với CJK tính cả chữ và từ. Mỗi ngôn ngữ sẽ chỉnh lại theo danh sách của kỳ thi khi bắt đầu cấp đó.

| Cấp | Cộng dồn |
|---|---|
| A1 | khoảng 700 |
| A2 | khoảng 1.500 |
| B1 | 2.500–3.000 |
| B2 | 4.500–5.000 |
| C1 | khoảng 8.000 |
| C2 | 12.000 trở lên |

## 4. Track thi theo cấp

Nguồn định dạng phải là tài liệu chính thức, ghi vào `content/<lang>/exam/FORMAT-SOURCES.md`; thiếu nguồn thì `formatFidelity: "partial"`. Quy tắc trung thực không đổi: không ngưỡng đỗ không có nguồn, không khẳng định tương đương chính thức.

| Ngôn ngữ | Kỳ thi |
|---|---|
| fr | DELF A2–B2, DALF C1–C2 |
| es | DELE A2–C2 |
| de | Goethe A2–C2 |
| it | CILS / CELI |
| pt | CAPLE |
| ja | JLPT N4–N1 |
| zh | HSK 3–9 |
| ko | TOPIK II 3–6 |
| en | VSTEP 3–5; luyện theo kiểu IELTS, không dùng tên thương hiệu để khẳng định điều gì |

## 5. Dung lượng và phân phối

Nội dung và audio từ A2 trở lên cho 9 ngôn ngữ không thể nằm trong một APK (A1 đã gần chạm trần 12 MB audio mỗi ngôn ngữ, `release/ASSET_DELIVERY.md`).

Từ v1.1: **gói tải tuỳ chọn theo ngôn ngữ và cấp qua Play Asset Delivery (on-demand)**.
- Google Play tải gói; không có server riêng, không tài khoản, không analytics.
- Theo quy tắc 1 (không mạng mặc định): màn hình đồng ý trước khi tải; cập nhật chính sách riêng tư (`release/PRIVACY_POLICY.md`, `src/lib/privacy-policy.ts` và test của nó); ghi chú Data safety "không thu thập dữ liệu".
- Khi chưa có gói: dùng giọng của thiết bị.
- Thử bản sideload bằng `bundletool --local-testing`.

v1.0 không đổi: hoàn toàn offline, không tải gì.

## 6. Trung thực ở cấp cao

Kết quả vẫn là "ước tính theo khung CEFR", do claim gate quyết định. Ở C1–C2, phần kỹ năng sản sinh (nói, viết) có ghi chú rõ: chấm offline không đánh giá đầy đủ được.

## 7. Việc làm ngay (rẻ, tránh làm lại)

Kiểm tra engine và mô hình dữ liệu chịu được 10 nghìn từ trở lên mỗi ngôn ngữ, hàng trăm unit và gói theo cấp (tải lười theo cấp, chỉ mục SQLite, tốc độ tìm kiếm). Test quy mô tổng hợp: khoá `xx` với 12.000 từ và 300 unit, có ngân sách cho thời gian khởi động lạnh, thời gian dựng Today và bộ nhớ. Chỗ nào không đạt thì sửa trước P4c. Kết quả ghi ở §8.

## 8. Kết quả test quy mô (03/11/2026)

Khoá tổng hợp `xx-scale`: 12.000 từ, 300 unit, người học có khoảng 3.000 thẻ FSRS, 30 truy vấn tìm kiếm (gồm truy vấn 1 chữ cái). Bộ sinh dữ liệu có seed, không dùng `Math.random` (`src/lib/__tests__/helpers/synthetic-scale.ts`). Test: `src/lib/__tests__/synthetic-scale.test.ts` và `scripts/__tests__/synthetic-scale-lexicon.test.ts`.

Số đo trên laptop khi máy đang bận, lấy lần tốt nhất. Ngân sách được nới để chạy được trên CI.

| Phép đo | Trước khi sửa | Sau khi sửa | Ngân sách |
|---|---|---|---|
| Khởi động lạnh (đăng ký khoá, hồ sơ, bảng id, chỉ mục từ điển) | 166 ms (riêng bảng id 60 ms) | 130–190 ms (bảng id 5 ms; phần còn lại là đọc khoảng 12 MB JSON) | 1.500 ms |
| Dựng TODAY mỗi lần | 168–324 ms | 18–58 ms | 300 ms |
| Artifact văn bản | 3.731 ms | 94–204 ms | 3.000 ms |
| Dựng DB SQLite 12k từ | 1.006.534 ms (16,8 phút) | 0,6–1,1 giây | 10 giây |
| Tìm FTS p95 | 206 ms | 27–37 ms | 150 ms |
| Tìm trong JS p95 | 43 ms | 7–10 ms | 100 ms |
| Liệt kê theo ABC trong JS | 196 ms | 32–54 ms | 250 ms |
| Bộ nhớ tăng thêm | +28 MB | +33–38 MB | 150 MB |

Ngân sách FTS là 150 ms chứ không phải 50 ms: 8 trên 30 truy vấn chỉ có 1–2 chữ cái hoặc là "the"; riêng "t" trả về 9.073 kết quả, và SQLite tốn 20–30 ms chỉ để trả các dòng đó.

**Đã sửa (chỗ hỏng thật):**
- `buildRuntimeIndex` là O(n²); nay dùng một map tính trước.
- Ghi DB không nằm trong transaction; nay gói trong một transaction. Golden so sánh nội dung logic của DB và không đổi.
- `idToLegacy` là O(n²).
- Truy vấn FTS gắn một tham số cho mỗi kết quả, có thể vượt giới hạn biến của SQLite với truy vấn ngắn; nay là một câu lệnh có truy vấn con.
- Tìm trong JS chuẩn hoá lại mọi mục ở mỗi lần tìm; nay lưu sẵn.
- Phép sắp ABC chuẩn hoá cả hai khoá ở mỗi phép so sánh.
- `courseProfile` dựng object mới cho mỗi lần tra id.
- Chọn phương án nhiễu quét toàn bộ 12k từ cho mỗi câu; nay chuẩn bị pool một lần. Có test chứng minh cùng phương án và cùng chuỗi số ngẫu nhiên như trước.
- Hàng đợi ôn tập chạy 6 lần mỗi kế hoạch, nay còn 3.

**Không phải chỗ hỏng:** `getUnit`, `allWords` và `getWord` quét tuyến tính, nhưng `getWord` không được gọi, còn hai hàm kia chỉ chạy một lần mỗi lần render.

**Chưa đo:** thời gian trên điện thoại thật; việc đọc khoảng 12 MB JSON khi tải khoá là chi phí chính còn lại, và sẽ được thay bằng tải lười theo cấp khi có gói theo cấp (§5).
