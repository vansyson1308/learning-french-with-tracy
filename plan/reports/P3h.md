# P3h — Nghiệm thu thiết bị tự động (emulator Android + Maestro)

Ngày 2026-10-27 · nhánh `phase-3/p3h-device-ci` · prompt `plan/prompts/00-MASTER-PROMPT-v2.md` (mục P3h).
Mọi kết quả dưới đây là **emulator**, không phải điện thoại.

## Tóm tắt (tiếng Việt)
- **Bộ flow sinh từ nội dung** (`scripts/device/maestro-flows.ts`, `bun run device:flows`): bài học đầu của **mọi khoá đang phát hành** (10 khoá), onboarding tiếng Việt, Hôm nay (từ mới mỗi ngày), checkpoint es phần 1 (phải đạt 12/12 ngay lần đầu), phần đọc của bài thi thử DELE A1 (trả lời đúng cả 25 câu), Hồ sơ, xuất/nhập sao lưu, nhánh "không có bộ nhận dạng giọng nói", ảnh chụp mọi màn hình bằng vi và en. Đáp án lấy thẳng từ nội dung đã biên dịch; câu gõ phím được chuyển sang ASCII và kiểm lại bằng chính bộ chấm của khoá.
- **Trình chạy** `scripts/device/acceptance.sh` (`bun run device:acceptance <apk>`) ghi `REPORT.md`, gồm các bước sau:
  - cài mới và đi một vòng bằng tiếng Việt;
  - tắt bộ nhận dạng giọng nói rồi chạy nhánh "không khả dụng";
  - mỗi khoá một bài học, kiểm sự kiện phát âm thanh (`PlaybackState PLAYING`) với mọi khoá có clip;
  - sao lưu: xuất → `pm clear` → nhập → so sánh streak / XP / bài / thẻ / điểm xếp lớp;
  - chế độ máy bay: một bài học và Hôm nay;
  - cold start bằng `am start -W` (6 lần, bỏ lần đầu, lấy trung vị, ngưỡng 3,5 s trên API 34) và bộ nhớ (PSS);
  - ảnh chụp bằng tiếng Anh;
  - **nâng cấp từ RC3**: cài APK RC3 (commit e5dcfd0), nạp dữ liệu RC3 (envelope v1 / persist v3) qua màn nhập của chính RC3, xuất, `adb install -r` bản mới, xuất lại, so sánh;
  - quét logcat liên tục tìm crash Java / native, ANR, lỗi trình phát.
- **CI** `.github/workflows/device-acceptance.yml`: build APK x86_64 và APK RC3 (cache), chạy trên emulator **API 34 và API 30** (google_apis, pixel_6, KVM), Maestro 2.12.0 có kiểm SHA-256, mọi action ghim theo commit. Báo cáo được đưa lên step summary và lưu thành artifact.
- **App**: chỉ thêm `testID`, không đổi hành vi: ô gõ, word bank, khung bài tập `exercise-<id>`, thẻ khái niệm, tổng kết bài, kết quả checkpoint.

## Kết quả trên emulator API 34 (máy dev, lượt chạy thứ 3, 2026-10-27, **tất cả PASS**)
- Cài mới, onboarding tiếng Việt, ảnh mọi màn hình (vi + en), Hôm nay, checkpoint 12/12, nhánh không có bộ nhận dạng (checkpoint nói bị chặn có lý do, thi thử "không khả dụng"), phần đọc DELE A1 (25 câu): **PASS**.
- Bài học đầu của 10 khoá (de-en, es-en, es-vi, fr-en, fr-vi, it-en, ja-en, ko-en, pt-en, zh-en): **PASS**, mỗi bài 3–5 phút. Âm thanh có sự kiện phát ở cả 6 khoá có clip (4–18 clip mỗi bài). it/ja/ko/zh chưa có clip trong gói nên ghi INFO.
- Sao lưu xuất → `pm clear` → nhập: streak / XP / bài / thẻ / điểm xếp lớp **giống hệt**.
- Chế độ máy bay (không có đường mạng): một bài es-vi và Hôm nay **PASS**.
- **Cold start**: trung vị **2.194 ms** (4590 · 2194 · 1807 · 1764 · 2320, bỏ lần mở đầu; ngưỡng 3.500 ms). Hai lượt trước lần lượt đo được 3.458 ms và 2.864 ms.
- **Bộ nhớ**: TOTAL PSS ≈ 159 MB trên tab Học.
- **Nâng cấp từ RC3** (dữ liệu RC3 thật: streak 5, có thẻ ôn, có điểm xếp lớp): sau `adb install -r` mọi số liệu **không đổi**.
- Logcat: không có crash Java, ANR hay lỗi trình phát ở cả 5 chặng.
- Một số flow chỉ PASS ở lần chạy lại (onboarding, ba bước RC3) do hộp thoại "System UI không phản hồi" của emulator hiện ra giữa chừng; báo cáo ghi rõ lỗi lần đầu của từng flow.
- **Lỗi app tìm được nhờ ảnh chụp**: dòng "Hoàn thành một bài học để bắt đầu chuỗi ngày" trên Hồ sơ (vi) tràn ra ngoài thẻ. Đã sửa (`flexShrink`), APK mới được kiểm lại qua CI. Cũng nhờ ảnh chụp mà thấy 5 màn trước đây chỉ chụp được màn splash; giờ mỗi màn chờ một testID riêng.
- API 30 và lượt chạy trên APK cuối cùng: chạy trong CI của PR (`device-acceptance.yml`). Theo yêu cầu của chủ dự án, không chạy emulator trên máy nữa vì tốn ổ C. Đã xoá AVD (6 GB) và các output của Maestro.

## Vấn đề tìm thấy và cách xử lý
- **L13 — crash native hiếm lúc mở app trên x86_64.** Chỉ gặp một lần trong hàng chục lần mở app: SIGSEGV trong `android_unsafe_frame_pointer_chase` (GWP-ASan đi ngược stack qua Hermes). Bộ test ghi lại là INFO rồi chạy lại flow; crash Java hay native khác vẫn là FAIL. Đã ghi vào `release/KNOWN_LIMITATIONS.md` và theo dõi trên điện thoại arm64 ở OWNER-FINAL-CHECKLIST D.
- **Sau mỗi lần đổi ngôn ngữ máy** (khởi động lại zygote), emulator hay hiện hộp thoại "System UI không phản hồi". Trình chạy bấm "Đợi" theo resource-id (không phụ thuộc ngôn ngữ); nếu hộp thoại quay lại thì bấm "Đóng ứng dụng".
- Mọi flow được chạy lại tối đa một lần. Nếu lần đầu hỏng, báo cáo ghi rõ "passed on retry" kèm lỗi lần đầu, không giấu.

### Lần chạy CI đầu tiên (emulator mới tinh, API 34 + 30): 5 nguyên nhân, đã sửa
Đây đều là lỗi của bộ test, không phải của app. Logcat của cả hai API không có crash, ANR hay lỗi trình phát.
1. **Nhập sao lưu hỏng ở cả hai API.** Từ API 29, bộ chọn file của Android lấy danh sách Downloads/Gần đây từ MediaStore, mà `adb push` không đăng ký file vào đó. Trên máy dev, file đã được quét từ những lượt trước nên vẫn thấy; trên emulator mới thì bộ chọn trống. Cách sửa:
   - Trình chạy đẩy file vào thư mục Download rồi yêu cầu MediaStore quét.
   - Kiểm tra bằng `content query` cho tới khi file đã có trong MediaStore.
   - Bước chọn file hiểu cả nhãn tiếng Việt (Tệp đã tải xuống, Gần đây) lẫn tiếng Anh.
2. **API 30 không ghi nhận âm thanh.** Từ API 33, log ghi `state=PLAYING(3)`; API 30 chỉ ghi `state=3`. Cách sửa:
   - Biểu thức nhận cả hai dạng.
   - Thêm tín hiệu thứ hai, độc lập: nhật ký trình phát của dịch vụ âm thanh (`dumpsys audio`). Chỉ đếm trình phát thuộc uid của app, được tạo sau khi bài học bắt đầu và đã chuyển sang "started".
   - Logic nằm trong `scripts/device/audio-evidence.ts`, có test cho cả hai định dạng.
3. **API 30: lesson es-en, ja-en và "upgraded: profile" không chạm được nút.** Phần tử chỉ vừa lọt vào màn hình thì có thể nằm dưới thanh điều hướng của API 30 (giao diện edge-to-edge), nên cú chạm rơi vào thanh. Cách sửa:
   - Mọi bước cuộn dùng `centerElement: true`. Có test kiểm tra mọi flow.
   - Flow Hồ sơ cuộn thẳng tới nút Nhập thay vì chỉ cuộn tới nút Xuất.
4. **Không tải được artifact báo cáo.** Tên file log có dấu `:` (ví dụ "RC3: export…"), mà upload-artifact không cho phép ký tự này. Cách sửa: đặt tên log theo slug và đổi tên mọi đường dẫn có ký tự bị cấm trước khi tải lên.
5. Hai lỗi còn lại là hệ quả của lỗi 1: so sánh sao lưu sau khi xoá dữ liệu cho thấy 0 thẻ, vì bước nhập chưa từng chạy.

## Kiểm tra
typecheck ✅ · lint ✅ · `bun run test` 1.555 ✅ (gồm 10 test mới của bộ sinh flow: mọi id có trong app, câu gõ là ASCII, checkpoint đòi N/N, seed RC3 nhập được) · jest 76/76 ✅ · `content:check` ✅ · `audio:check` ✅ (1.721 file) · golden ✅ (tiếng Pháp không đổi) · device-acceptance trên emulator API 34 (máy dev) ✅; API 34 + 30 trên APK cuối: CI của PR.

## Việc của chủ dự án
Không có việc mới. Lượt trên điện thoại vẫn nằm ở `plan/OWNER-FINAL-CHECKLIST.md` D (thêm một dòng: để ý app có tự thoát lúc mở không — L13).
