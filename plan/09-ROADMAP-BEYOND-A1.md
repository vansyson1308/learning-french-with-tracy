# 09 — Lộ trình sau A1 (D-14, QC 2026-10-31)

v1.0 vẫn là **A1 cho cả 9 khoá** cộng các tính năng P5. Tài liệu này chỉ là kế hoạch, xây sau v1.0, để việc làm hôm nay không chặn đường lên A2 → B1 → B2.

## 1. Thứ tự

1. **en** (A2–B2, VSTEP): nhu cầu lớn nhất ở thị trường Việt Nam.
2. **ja** (JLPT N4–N3), **ko** (TOPIK I lên TOPIK II 3–4): du học và làm việc.
3. **de** (A2–B1 Goethe): làm việc, Ausbildung, điều dưỡng.
4. **zh** (HSK 3–4), **fr** (A2–B1 DELF).
5. **es, it, pt** (A2–B1).

Tiếng Hàn phụ thuộc giọng: `ko` hiện không có giọng sạch (D-11). Phải có quyết định về giọng trước P4e, và quyết định đó cũng áp dụng cho các cấp sau.

## 2. Cấp độ và mốc thi theo từng ngôn ngữ

Tên kỳ thi lấy từ QC 2026-10-31. Định dạng chưa được kiểm tra: trước khi soạn, đọc tài liệu chính thức và ghi vào `content/<lang>/exam/FORMAT-SOURCES.md` như CILS và Goethe. Không có nguồn thì đánh dấu `formatFidelity: "partial"` như ACESSO.

| Khoá | Cấp tiếp theo | Mốc thi | Lý do với người Việt |
|---|---|---|---|
| en | A2, B1, B2 | VSTEP 3/5–4/5 | Chuẩn đầu ra, công việc |
| ja | tương đương A2–B1 | JLPT N4, N3 | Du học, làm việc |
| ko | tương đương A2–B2 | TOPIK I, TOPIK II 3–4 | Du học, làm việc |
| de | A2, B1 | Goethe A2, B1 | Ausbildung, điều dưỡng |
| zh | tương đương A2–B1 | HSK 3–4 | Thương mại, du học |
| fr | A2, B1 | DELF A2, B1 | Du học |
| es, it, pt | A2, B1 | chọn khi bắt đầu | Nhu cầu nhỏ hơn |

Quy đổi JLPT, TOPIK và HSK sang CEFR ở bảng trên chỉ để lập kế hoạch. App vẫn tuân theo claim gate và không khẳng định tương đương chính thức.

## 3. Khối lượng nội dung

### Đã đo ở A1 (đếm từ repo ngày 31/10/2026)

| Khoá | Bài học | Bài tập | Từ trong syllabus | Truyện / câu | Bài đọc | Clip nghe | Bài nói | Bài viết | Kịch bản |
|---|---|---|---|---|---|---|---|---|---|
| fr | 108 | 604 | chưa có file syllabus | 16 / 293 | 19 | 177 | 50 | 34 | 18 |
| es | 109 | 718 | 627 | 52 / 1.165 | 27 | 222 | 54 | 38 | 20 |
| de | 108 | 704 | 690 | 57 / 1.233 | 40 | 244 | 54 | 36 | 22 |
| it | 108 | 721 | 735 | 46 / 864 | 34 | 220 | 54 | 36 | 20 |

QC yêu cầu tính từ số liệu tiếng Pháp. Số bài học của tiếng Pháp dùng được làm mốc, nhưng phần truyện còn ít và chưa có syllabus, nên cột từ và truyện lấy theo es, de và it.

### Ước tính cho mỗi cấp, chưa được kiểm chứng

Đây là giả định để lập kế hoạch: mỗi cấp cần nhiều nội dung hơn cấp trước, vì câu dài hơn và kỹ năng rộng hơn. Khi bắt đầu một cấp, thay bằng danh sách từ của kỳ thi tương ứng.

| Cấp | Từ mới | Bài học | Bài tập | Truyện | Thời lượng nghe |
|---|---|---|---|---|---|
| A1 (đã có) | khoảng 700 | khoảng 108 | khoảng 700 | 40–50 | khoảng 1 giờ, ước tính từ số ký tự |
| A2 | thêm 800 | thêm 110–130 | thêm 800–1.000 | 40–50, dài hơn | 2–3 giờ |
| B1 | thêm 1.500 | thêm 130–160 | thêm 1.000–1.300 | 40–50, 400–800 từ | 4–6 giờ |
| B2 | thêm 3.000 | thêm 150–200 | thêm 1.300–1.600 | 30–40, dài | 6–10 giờ |

Ước tính thời lượng A1: clip nghe và câu truyện cộng lại khoảng 50 nghìn ký tự, ở khoảng 14 ký tự mỗi giây, là chừng 1 giờ.

## 4. Kết quả rà soát engine

Một agent đọc code, sau đó tôi đọc lại các chỗ cản trước khi sửa. Không có thử nghiệm với nội dung A2 thật.

### Đã sửa, có test (`beyond-a1.test.ts` ở `scripts/` và `src/lib/`)

| Chỗ cản | Trước đây | Bây giờ |
|---|---|---|
| Ước lượng của người học | Luôn ghi A1 và xét khả năng khẳng định ở A1, kể cả khi chính sách là A2 | Lấy cấp từ chính sách |
| Màn Mục tiêu | Chữ "A1" cứng; link luôn sang capstone tiếng Pháp | Dùng tham số `{level}` và capstone theo khoá và cấp |
| Band truyện | Dừng ở A2-2 | Đến B2-2 trong một danh sách chung; band lạ báo lỗi thay vì âm thầm xếp sai |
| Danh sách từ cấp sau | Cấp "A2" nguyên vẹn bị bỏ qua không báo | Chia đôi như cấp đầu; cấp không có band báo lỗi |
| Xếp lớp | Giới hạn 28 câu, đã dùng hết ở fr, es, de | Giới hạn 60; số `maxItems` của từng khoá vẫn được kiểm tra |

### Còn phải làm khi bắt đầu A2, chưa sửa

- **Từ mới mỗi ngày:** syllabus đang là một cấp cho mỗi ngôn ngữ. Cần các file theo cấp và một artifact gộp theo thứ tự (`scripts/lib/syllabus.ts`).
- **Chính sách và ước lượng theo nhiều cấp:** mỗi khoá chỉ có một `attainment.json` (`compile-artifacts.ts`, `assessment.ts`). Cần một file cho mỗi cấp và cách chọn cấp đang học.
- **Mục tiêu capstone:** validator gộp mục tiêu qua các cấp (`assessment.ts:172,185`), cần lọc theo cấp.
- **Họ nhiệm vụ:** enum đang hợp với A1 (`schema.ts`), cần thêm giá trị cho B1 trở lên.
- **Độ dài truyện:** 150–400 từ cho mọi band (`stories.ts`), cần khoảng theo band.
- **Chấm viết:** mặc định bỏ qua dấu theo lý do của A1 (`rubric.ts`), cần cờ theo từng rubric.
- **Công cụ soạn:** khung và prompt viết sẵn A1 (`ingest.ts`, `review-tiers.ts`, `steps.ts`, `lexicon-author.ts`, `compile-artifacts.ts`).
- **Tên `deriveA1Estimate`, `a1-*` testID, khoá `goals.takeA1`:** chỉ là tên, không ảnh hưởng người học; đổi khi làm phần này.

### Không cần đổi

Claim gate đã theo từng cấp; kết quả xếp lớp là một bài học, không phải một cấp; track thi có `level` là chuỗi và band là dữ liệu; dữ liệu đã lưu không gắn với cấp. Phần dữ liệu đã lưu là suy luận từ code; khi thêm bài học, chỉ nên thêm vào cuối vì mức sàn xếp lớp là chỉ số bài học.

Chưa đọc kỹ: `backup-core.ts`, `store.ts`, giới hạn của bài tập và phần nghe so với B2, schema SQL của lexicon, các plugin ngôn ngữ.

## 5. Âm thanh

Ngân sách A1 đã gần chạm trần: tiếng Ý 10,3 MB trên trần 12 MB mỗi ngôn ngữ. A2 trở lên cần gói theo cấp hoặc giọng của thiết bị; xem `release/ASSET_DELIVERY.md`. Quyết định khi bắt đầu A2, không phải bây giờ.
