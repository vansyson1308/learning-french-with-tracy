# Brief sư phạm: người Việt học tiếng Nhật (`ja-vi`)

## 1. Vì sao người Việt học
- Nhu cầu lớn nhất trong các ngôn ngữ châu Á: thực tập sinh kỹ năng, kỹ sư, điều dưỡng (EPA), du học, công ty Nhật tại Việt Nam. Kỳ thi mục tiêu: **JLPT N5** (tương ứng ~A1), **JFT-Basic** (A2 cho thị thực kỹ năng đặc định), **NAT-TEST 5Q**. Ứng dụng chỉ đưa ra *ước tính theo khung CEFR* và căn chỉnh nội dung với N5 qua `derived/anchors.json` (OpenJLPT).

## 2. Người Việt thường vấp ở đâu
- **Chữ viết**: ba hệ chữ — hiragana, katakana (từ mượn), kanji (N5 ≈ 100 chữ). Người Việt không có nền Hán tự nhưng có **từ Hán-Việt**: âm On của kanji thường gần âm Hán-Việt (*学 gaku ~ học, 山 san ~ sơn*) — lợi thế lớn để ghi nhớ nghĩa, cần dạy tường minh. Dấu dài (ー), dakuten, chữ nhỏ (っ, ゃ).
- **Ngữ âm**: **nguyên âm dài** (*obasan/obāsan*), **phụ âm kép** (*kite/kitte*), **trọng âm cao độ** (*hashi*), âm *n* mora (*kin'en*); tiếng Việt có thanh điệu nên cao độ dễ bị gán thành thanh; *r* Nhật giữa r/l/đ; không phụ âm cuối trừ *n*.
- **Ngữ pháp**: **trật tự SOV** (động từ cuối câu) — tiếng Việt SVO; **trợ từ** は/が/を/に/で/へ/の đánh dấu vai trò (tiếng Việt dùng trật tự); động từ chia theo thì/khẳng-phủ định/lịch sự (ます/ません/ました) — tiếng Việt không chia; tính từ い/な chia như động từ; **lượng từ** (つ, 人, 本, 枚) — tiếng Việt cũng có loại từ (cái, con) → tương đồng hữu ích; mức lịch sự (です/ます vs thể thường); lược chủ ngữ; số đếm hai hệ (一, 二 / ひとつ, ふたつ).
- **Từ vựng**: từ Hán-Việt hỗ trợ đọc nghĩa kanji; katakana từ tiếng Anh (コーヒー) dễ nhận; "bạn giả" Hán-Việt (*手紙* "thư" không phải "giấy vệ sinh" như tiếng Trung; *勉強* "học" vs "miễn cưỡng").

## 3. Những điều PHẢI dạy tường minh bằng tiếng Việt ở A1/N5 (→ concept cards)
1. Hiragana và katakana: bảng, dakuten, chữ nhỏ, trường âm.
2. Kanji N5 và âm Hán-Việt: cách dùng từ Hán-Việt để nhớ nghĩa (nêu rõ khi âm KHÔNG gần).
3. Câu danh từ: AはBです / ではありません / でした.
4. Trợ từ は vs が (chủ đề vs chủ ngữ) ở mức công thức.
5. Trợ từ を (tân ngữ), に (đích/thời gian), で (nơi hành động/phương tiện), へ, の (sở hữu), と, も.
6. Động từ thể ます: hiện tại/tương lai, phủ định, quá khứ; ba nhóm động từ (bằng chứng `derived/morphology.json`).
7. Thể て: yêu cầu (てください), đang làm (ています).
8. Tính từ い và な: hiện tại, phủ định, quá khứ.
9. Tồn tại あります/います (vật/người) — tiếng Việt "có".
10. Lượng từ cơ bản: つ, 人, 本, 枚, 個, 回; hỏi いくつ/何人.
11. Số 1–10 000, giờ, ngày tháng, tuổi, giá (円).
12. Câu hỏi với か; từ hỏi 何/どこ/いつ/だれ/いくら.
13. Muốn: ～たいです; thích: ～が好きです.
14. Mức lịch sự: です/ます vs thể thường (nhận biết); kính ngữ chào hỏi cố định.
15. Nguyên âm dài, phụ âm kép, trọng âm cao độ: cặp tối thiểu.
16. Trật tự SOV và lược chủ ngữ — so sánh tiếng Việt.
17. Từ mượn katakana và cách phiên âm tiếng Việt/Anh.
18. Chào hỏi theo giờ và tình huống (おはようございます, すみません, お願いします).

## 4. Kịch bản hội thoại ưu tiên (→ scenarios)
- Giới thiệu tại công ty/trường (はじめまして); cửa hàng tiện lợi (thanh toán, túi); nhà hàng gọi món; ga tàu (vé, sân ga, chuyển tuyến); bưu điện; phòng khám (triệu chứng cơ bản); điện thoại xin nghỉ; nơi làm việc (chào, xin lỗi, báo cáo đơn giản); toà thị chính (thẻ cư trú).

## 5. Lộ trình thi (→ exam track)
- **JLPT N5**: Ngôn ngữ (chữ–từ vựng 20 phút; ngữ pháp–đọc 40 phút), Nghe 30 phút; trắc nghiệm 4 lựa chọn; không có nói/viết. Ứng dụng bổ sung nói/viết cho ước tính CEFR. Chỉ tái tạo định dạng; không sao chép đề.

## 6. Giọng audio, cách đọc và nhận dạng giọng nói
- Dàn giọng: Kokoro ja (jf_alpha, jm_kumo — Apache-2.0), MeloTTS-JP (MIT); canary với SenseVoice/Whisper. `recognitionLocale` `ja-JP`.
- Cách đọc (kana, romaji) tính trước từ `derived/readings.json` (JMdict + kaikki) — hiển thị furigana cho kanji ở N5; không dùng thư viện lúc chạy. Chuẩn hoá ASR theo ký tự (CER).
