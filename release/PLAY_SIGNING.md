# Ký và tải bản AAB lên Google Play (D-16, closed test)

Bản đọc của anh: `out\play-signing.md` (cùng nội dung; `out\` không vào git). Anh **chỉ gõ mật khẩu keystore**; mọi lệnh khác dán nguyên văn. Không bao giờ gửi mật khẩu cho Claude, không ghi vào file.

Khoá dùng: **khoá upload hiện có** `C:\keys\lft-upload.jks`, alias `upload` (đã ký RC3). Vân tay SHA-256 phải là
`D2:80:D1:DE:AC:D8:2B:6F:AE:B5:2F:0C:1A:CE:53:27:76:CD:1C:6F:73:AA:DB:BF:31:33:DA:ED:DC:ED:31:82`
(viết gọn `d280d1de…3182`, `release/ANDROID_SIGNING.md`). Không bao giờ tạo khoá thứ hai.

## Cách Play App Signing hoạt động (đọc 1 phút)
- Anh ký AAB bằng **khoá upload** (khoá của anh). Google kiểm tra chữ ký đó, rồi ký lại các APK gửi xuống máy tester bằng **khoá ký ứng dụng** do Google giữ.
- Hệ quả: app cài từ Play **không cài đè** được lên APK RC đã cài tay (khác chữ ký). Ai đã cài APK tay: **Hồ sơ → Xuất tiến độ** trước, gỡ app, cài từ Play, rồi **Nhập tiến độ**.
- Mất khoá upload không mất app: Google cho đặt lại khoá upload (Play Console → Kiểm tra và phát hành → Thiết lập → Tính toàn vẹn của ứng dụng). Vẫn phải giữ bản sao lưu `.jks` + mật khẩu ở hai nơi.

## Bước 1 — Kiểm tra khoá (một lần)
Mở **cmd** (không cần quyền admin) tại thư mục repo (`cd /d C:\src\lft`):
```
set "PATH=C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot\bin;%PATH%"
if not exist out mkdir out
keytool -exportcert -rfc -keystore C:\keys\lft-upload.jks -alias upload -file out\upload_certificate.pem
```
→ gõ **mật khẩu keystore**. Rồi (không cần mật khẩu):
```
keytool -printcert -file out\upload_certificate.pem
```
Dòng `SHA256:` phải bắt đầu `D2:80:D1:DE` và kết thúc `31:82`. Khác → **dừng**, báo Claude.
`out\upload_certificate.pem` chỉ là chứng chỉ công khai (không phải khoá bí mật); Play Console chỉ hỏi nó khi anh xin đặt lại khoá upload.

## Bước 2 — Build AAB (khoảng 15–30 phút)
Từ `main` mới nhất, khi CI xanh. Mở **Git Bash** tại repo:
```
git checkout main && git pull
bash plan/scripts/build-play-aab.sh
```
Kết quả: `out/play/learning-french-with-tracy-1.0.0-vc<N>-unsigned.aab` + file `.report.txt` (commit, ABI arm64-v8a + armeabi-v7a, targetSdk 36, SHA-256). Script dừng nếu bundle đã bị ký, sai ABI, còn bản chẩn đoán, hay có quyền đã gỡ.
(Không muốn build trên máy: GitHub → Actions → "Android Play AAB" → Run workflow → tải artifact, giải nén file `.aab` vào `out\play\`.)

## Bước 3 — Ký AAB (anh gõ mật khẩu)
Trong **cmd** tại repo:
```
plan\scripts\sign-aab-windows.cmd
```
→ `jarsigner` hỏi `Enter Passphrase for keystore:` → gõ mật khẩu (chữ không hiện ra là bình thường) → Enter.
Script tự kiểm tra: `jar verified`, vân tay đúng `D2:80:D1:DE…31:82`, rồi in SHA-256 và dung lượng vào `out\play\…vc<N>.aab.signing-report.txt`. Báo `WRONG KEY` → **không tải lên**, báo Claude.
File để tải lên: `out\play\learning-french-with-tracy-1.0.0-vc<N>.aab` (không có chữ `unsigned`).

Lệnh tương đương nếu muốn tự gõ:
```
jarsigner -keystore C:\keys\lft-upload.jks -sigalg SHA256withRSA -digestalg SHA-256 -signedjar out\play\learning-french-with-tracy-1.0.0-vc3.aab out\play\learning-french-with-tracy-1.0.0-vc3-unsigned.aab upload
jarsigner -verify out\play\learning-french-with-tracy-1.0.0-vc3.aab
keytool -printcert -jarfile out\play\learning-french-with-tracy-1.0.0-vc3.aab
```

## Bước 4 — Bật Play App Signing (ở lần tải đầu tiên)
Play Console → chọn app → **Kiểm tra và phát hành → Kiểm thử → Kiểm thử kín (Closed testing)** → **Tạo bản phát hành**. Ở mục **Ký ứng dụng / App integrity**:
- Giữ mặc định **"Google tạo và quản lý khoá ký ứng dụng"** (Use Google-generated key) → **Tiếp tục**.
- Không chọn "Xuất và tải khoá từ Java keystore" (đó là tải khoá ký ứng dụng, không cần cho kế hoạch này).
- Chứng chỉ của AAB đầu tiên anh tải lên trở thành **khoá upload** đã đăng ký. Sau đó vào **Thiết lập → Tính toàn vẹn của ứng dụng → Ký ứng dụng**: "Chứng chỉ khoá tải lên" phải có SHA-256 `D2:80:D1:DE…31:82`.

## Bước 5 — Tải lên track Closed testing
1. **Testers**: tạo danh sách email (12–20 tài khoản Google, `release/PLAY_CLOSED_TEST_TRACKER.md`), lưu; ghi phần "Phản hồi" = email hỗ trợ.
2. **Bản phát hành → Tải lên** file `.aab` đã ký ở bước 3.
3. Tên bản phát hành: `1.0.0 (<N>) RC<M>` (số trong `release/RC_HISTORY.md`). Ghi chú phát hành: dùng đoạn "Có gì mới" trong `release/PLAY_STORE_LISTING.md`.
4. **Lưu → Xem lại bản phát hành**. Cảnh báo về "không có tệp gỡ rối/deobfuscation" là bình thường (không dùng R8). Lỗi đỏ → chụp màn hình, báo Claude.
5. **Bắt đầu triển khai cho Kiểm thử kín**. Google xét duyệt (vài giờ đến vài ngày).
6. Khi duyệt xong: tab **Testers → Sao chép đường liên kết** (opt-in) → gửi kèm `docs/PLAY_TESTER_GUIDE_VI.md`.

Trước khi bấm triển khai, các mục **Thiết lập ứng dụng** trên Bảng điều khiển phải xong (chính sách quyền riêng tư, quyền truy cập, quảng cáo, phân loại nội dung, đối tượng mục tiêu, An toàn dữ liệu) — câu trả lời ở `release/PLAY_STORE_LISTING.md`.

## Mỗi bản cập nhật sau (sau mỗi lần merge một khoá)
Claude tăng số bản bằng `bun run release:bump` và ghi RC mới vào `release/RC_HISTORY.md` → anh lặp lại bước 2, 3, 5 (bước 1 và 4 chỉ làm một lần). Tải bản mới lên **cùng track**: không làm mất ngày đã tính của 14 ngày.

## Không bao giờ
- Commit hay gửi file `.jks`, mật khẩu, `out\`, `android\`.
- Ký bằng khoá debug hay khoá khác; tải bản có vân tay khác `D2:80:D1:DE…31:82`.
- Xin quyền phát hành production trước v1.0 (D-16 chỉ là closed test).
