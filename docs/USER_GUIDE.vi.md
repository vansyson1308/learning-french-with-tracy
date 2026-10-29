# Hướng dẫn sử dụng

Mọi điều trong hướng dẫn này mô tả ứng dụng đúng như cách nó hoạt động ở bản phát hành hiện tại; mỗi mục được kiểm tra trên bản phát hành trước khi hướng dẫn được xem là hoàn chỉnh (xem hồ sơ kiểm chứng trong kho mã nguồn, `docs/USER_GUIDE_VALIDATION.md`). Đây là bản dịch trung thành của `docs/USER_GUIDE.md`; các nhãn trong ứng dụng ở đây là nhãn tiếng Việt (Hồ sơ → **Ngôn ngữ hiển thị**). Nội dung khóa học (nghĩa từ, câu hỏi, sổ tay) vẫn bằng tiếng Anh cho đến khi khóa tiếng Pháp dành cho người Việt ra mắt; những mục đánh dấu *(chưa kiểm chứng bằng tiếng Việt)* mới chỉ được kiểm tra với giao diện tiếng Anh trên điện thoại.

## 1. Ứng dụng này là gì

Learning French with Tracy là một khóa tiếng Pháp miễn phí. Ứng dụng chạy hoàn toàn trên điện thoại của bạn: một lộ trình học gồm sáu phần, một phiên học hằng ngày tự quyết định cần ôn gì, nghe, đọc, nói, viết và các hội thoại ngắn, các bài kiểm tra, bài kiểm tra điểm bắt đầu và bài kiểm tra A1 tổng kết. Không có tài khoản, không quảng cáo và không phân tích dữ liệu. Bảy khóa ngôn ngữ khác thừa hưởng từ mã nguồn mở gốc (Tây Ban Nha, Đức, Ý, Bồ Đào Nha, Nhật, Hàn, Trung) cũng có mặt ở dạng gốc, đơn giản hơn.

## 2. Cài đặt

- **iPhone:** từ App Store, hoặc qua lời mời TestFlight trong giai đoạn thử nghiệm. iOS 16.4 trở lên.
- **Android:** từ Google Play, hoặc qua liên kết thử nghiệm kín; có thể cài trực tiếp tệp `.apk` từ GitHub Releases trong giai đoạn thử nghiệm (Android sẽ cảnh báo “ứng dụng không xác định” với tệp không đến từ cửa hàng). Android 7.0 trở lên.

Ứng dụng cần khoảng 150 MB dung lượng và không cần quyền nào để cài. Các quyền duy nhất nó từng hỏi là micrô và nhận dạng giọng nói, và chỉ khi bạn bắt đầu một bài tập nói.

## 3. Lần mở đầu tiên

Màn hình đầu tiên hỏi bạn muốn học khóa nào. Tiếng Pháp là khóa mà ứng dụng được xây dựng xoay quanh và có hai bản: một bản giải thích bằng tiếng Việt (`fr-vi`) và một bản giải thích bằng tiếng Anh (`fr-en`) — cùng từ vựng, âm thanh, bài học và bài kiểm tra tiếng Pháp, chỉ khác ngôn ngữ giải thích; mỗi thẻ ghi rõ ("Giải thích bằng …"). Khi ứng dụng hiển thị tiếng Việt, bản tiếng Việt đứng đầu và được chọn sẵn; giữ nguyên (hoặc chạm vào khóa khác). Sau đó chọn **Mục tiêu XP mỗi ngày** — 10, 20, 30 hoặc 50 XP (một bài học được 15 XP, 20 nếu hoàn hảo) — rồi chạm **Học Tiếng Pháp** (nút ghi tên khóa bạn đã chọn). Bạn sẽ vào tab **Học**. Có thể đổi khóa sau tại Hồ sơ → Đang học → **Đổi**.

## 4. Chọn tiếng Pháp

Tiếng Pháp, tiếng Tây Ban Nha (`es-vi`) và tiếng Đức (`de-vi`, cả hai giải thích bằng tiếng Việt) là các khóa có đầy đủ tính năng: phiên Hôm nay, nghe, nói, viết, hội thoại, bài kiểm tra, bài kiểm tra điểm bắt đầu và bài kiểm tra A1 tổng kết. Cả hai bản tiếng Pháp đều có đủ. Trí nhớ tiếng Pháp của bạn dùng chung cho hai bản: một từ bạn ôn ở bản này cũng chính là thẻ ghi nhớ ở bản kia, kết quả bài kiểm tra điểm bắt đầu và bài kiểm tra cũng được giữ chung — chỉ số bài đã hoàn thành và XP được tính riêng theo từng bản. Phần giải thích tiếng Việt của bản `fr-vi` đang chờ người bản ngữ duyệt (xem `release/KNOWN_LIMITATIONS.md`); phần tiếng Pháp, âm thanh và cách chấm giống hệt bản tiếng Anh. Các khóa khác có lộ trình học, luyện lại lỗi sai và ôn từ.

### Tiếng Tây Ban Nha cho người Việt (`es-vi`) và luyện thi DELE A1

Khóa `es-vi` dạy tiếng Tây Ban Nha chuẩn Tây Ban Nha đến trình độ A1 — các từ Mỹ Latinh thông dụng (boleto, jugo, carro…) luôn được chấp nhận và hiện thành ghi chú — với cùng cấu trúc sáu phần như tiếng Pháp; mọi lời giải thích, câu hỏi và phản hồi đều bằng tiếng Việt. Khóa cũ `es-en` (giải thích bằng tiếng Anh) vẫn còn trong **Khoá khác** ở màn hình chọn khóa để tiến độ cũ không mất, nhưng không còn hiện khi bắt đầu lần đầu. Trong lúc phần tiếng Việt của khóa còn đang được duyệt, tab Học hiện nhãn **Bản beta — nội dung đang được duyệt**; nhãn tự tắt khi bản duyệt được ký.

Thẻ **Luyện thi DELE A1** ở tab Luyện tập mở phần luyện thi theo định dạng công khai năm 2020 của kỳ thi DELE A1 (Instituto Cervantes): Đọc (45 phút, 4 bài), Nghe (25 phút, 4 bài), Viết (25 phút, một biểu mẫu và một đoạn ngắn) và Nói (khoảng 10 phút, 3 bài). Một số bài ghép nhiều câu hỏi với một danh sách văn bản hoặc đáp án đánh chữ (A–I), giống kỳ thi thật. Bạn có thể **Luyện từng phần** (không tính giờ, có đáp án sau mỗi câu) hoặc **Thi thử có giờ** với hai đề song song A và B — làm lại sẽ nhận đề còn lại. Hết giờ một phần thì phần đó kết thúc, câu chưa làm được tính là chưa trả lời. Kết quả hiện điểm từng phần, hai nhóm điểm (Đọc + Viết, Nghe + Nói), mỗi nhóm cần 30 trên 50 điểm, và **mức sẵn sàng ước tính**. Đây không phải điểm thi thật, không do Instituto Cervantes cấp và không dự đoán kết quả kỳ thi. Mọi câu hỏi đều do khóa học tự soạn. Nút **Luyện từ vựng của các câu này** mở một phiên ôn từ bình thường (có ghi vào trí nhớ) với các từ trong những câu bạn làm sai. Nếu thiết bị không ghi âm được, phần Nói được bỏ qua và kết quả chỉ ghi "chưa đủ dữ liệu để ước tính". Âm thanh của các bài nghe tiếng Tây Ban Nha sẽ có sau khi quy trình tạo âm thanh chạy xong; trước đó các câu nghe hiện nút bỏ qua khi thiếu âm thanh.

### Tiếng Đức cho người Việt (`de-vi`) và luyện thi Goethe A1

Khóa `de-vi` dạy tiếng Đức chuẩn (Đức) đến trình độ A1 với cùng cấu trúc sáu phần; các dạng của Áo và Thụy Sĩ chỉ hiện thành ghi chú. Mọi lời giải thích, câu hỏi và phản hồi đều bằng tiếng Việt. Danh từ luôn được dạy kèm mạo từ và số nhiều (der Tisch, die Tische). Khóa dạy rõ cách 1 (Nominativ) và cách 4 (Akkusativ); trước Phần 4, cách 3 (Dativ) chỉ xuất hiện trong các cụm cố định như *mit dem Bus*, *in der Schule*. Khóa cũ `de-en` vẫn còn trong **Khoá khác** để tiến độ cũ không mất, nhưng không còn hiện khi bắt đầu lần đầu. Trong lúc khóa còn đang được duyệt, tab Học hiện nhãn **Bản beta — nội dung đang được duyệt**.

Thẻ **Luyện thi Goethe A1** ở tab Luyện tập theo định dạng chính thức của kỳ thi Goethe-Zertifikat A1: Start Deutsch 1:
- Nghe (Hören): khoảng 20 phút, 3 phần, 15 câu;
- Đọc (Lesen): 25 phút, 3 phần, 15 câu;
- Viết (Schreiben): 20 phút, gồm một biểu mẫu và một tin nhắn ngắn;
- Nói (Sprechen): khoảng 15 phút, 3 phần.

Thẻ này dùng giống thẻ DELE: **Luyện từng phần** hoặc **Thi thử có giờ** với hai đề song song. Điểm từng phần được quy ra tổng 100 như kỳ thi thật; kỳ thi thật cần 60 điểm. Kết quả hiện **mức sẵn sàng ước tính**.

Có hai chỗ khác với kỳ thi thật:
- phần Nói thật là thi theo nhóm, còn ứng dụng chỉ mô phỏng một người với giám khảo;
- Phần 1 bỏ phần đánh vần và nhắc lại số.

Giống kỳ thi thật, Hören Phần 1 và Phần 3 cho nghe mỗi bài hai lần, Phần 2 chỉ một lần.

Đây không phải điểm thi thật, không do Goethe-Institut cấp và không dự đoán kết quả. Mọi câu hỏi đều do khóa học tự soạn.

## 5. Bài kiểm tra điểm bắt đầu (xếp lớp)

Nếu bạn từng học tiếng Pháp, tab Học hiển thị **Đã từng học Tiếng Pháp? Tìm điểm bắt đầu của bạn**. Bài kiểm tra ngắn (vài phút), thích ứng theo câu trả lời của bạn, và luôn có **Tôi không biết** ở mọi câu — cứ dùng; không bao giờ bị phạt hai lần. Cuối bài, bạn thấy vị trí trong khóa mà ứng dụng gợi ý, với **Bắt đầu từ đây** hoặc **Bắt đầu từ đầu**. Các bài trước điểm bắt đầu được đánh dấu *Đã được bỏ qua nhờ bài kiểm tra đầu vào. Ôn lại bất cứ lúc nào.* Bạn có thể làm lại hoặc đặt lại bài kiểm tra tại Hồ sơ → **Mục tiêu Tiếng Pháp của bạn**.

## 6. Học (lộ trình)

Tab Học hiển thị lộ trình: các phần, chương và nút bài học. Bài hiện tại là bài bạn có thể chạm; các bài trước có thể học lại; các bài sau đang khóa. Trình đọc màn hình đọc trạng thái của từng nút (*Đã hoàn thành. Luyện lại.*, *Đang khóa. Hãy hoàn thành các bài trước.*, *Đã được bỏ qua nhờ bài kiểm tra đầu vào. Ôn lại bất cứ lúc nào.*). Mỗi chương có một sổ tay (biểu tượng quyển sách, nhãn *Sổ tay <chương>*) giải thích ngữ pháp bằng lời dễ hiểu.

## 7. Các phần và chương

1. **Section 1: Beginner** — chương *Basics 1*, *Greetings*, *Food*, *Animals*, *Travel*.
2. **Section 2: Building blocks** — *Gender & Articles*, *High-Yield Verbs*, *Cognates & False Friends*, *Numbers 0–100*, *Connected French* (nối âm và lược âm).
3. **Section 3: Understand everyday French** — *Écoute !*, *Messages & panneaux*, *Annonces & consignes*, *Petits dialogues*, *Petites histoires* (nghe và đọc).
4. **Section 4: Speak your first French** — *Dis bonjour !*, *Je me présente*, *Les chiffres à voix haute*, *Décris-le !*.
5. **Section 5: Write everyday French** — *Écris qui tu es*, *Des phrases simples*, *Petits messages*, *Formulaires et messages*.
6. **Section 6: Talk with someone** — *Premiers échanges*, *Au café, au magasin*, *Trouver son chemin*, *Faire des projets* (hội thoại với giọng của bạn đồng hành).

Tên phần và chương là nội dung khóa học (tiếng Anh/Pháp) cho đến khi có khóa tiếng Pháp dành cho người Việt. Mỗi phần kết thúc bằng một **bài kiểm tra** (phần 6 dẫn tới bài kiểm tra A1 tổng kết).

## 8. Các dạng bài tập trong bài học

- **Chọn** nghĩa (chạm một trong bốn lựa chọn; nút loa phát tiếng Pháp).
- **Sắp xếp từ** thành câu từ ngân hàng từ.
- **Ghép** các cặp từ.
- **Gõ** bản dịch (dấu được chấp nhận có hoặc không có dấu phụ; lỗi gõ ở từ ngắn sẽ được đánh dấu).
- **Điền vào chỗ trống** trong câu.
- Riêng tiếng Pháp: **chọn mạo từ** (le/la/l'/les), **chia** động từ trong câu khuyết, bài **số đếm**, và thẻ khái niệm giải thích quy tắc trước khi bạn luyện.
- Bài nghe và đọc (phần 3), nói (phần 4), viết (phần 5) và hội thoại (phần 6) — mô tả bên dưới.

Chạm **Kiểm tra** để chấm câu trả lời, **Tiếp tục** để đi tiếp. Các đáp án trắc nghiệm xuất hiện theo thứ tự khác nhau mỗi lần bạn học bài (cùng thứ tự nếu mở lại trong cùng ngày), nên vị trí không bao giờ là gợi ý. Câu trả lời sai sẽ quay lại sau trong cùng bài cho đến khi bạn làm đúng. **Tôi không biết** chỉ xuất hiện trong bài kiểm tra điểm bắt đầu và ở các bước cần âm thanh hoặc micrô (**Bỏ qua bước này**); bài tập thông thường luôn phải trả lời. Cuối bài có phần tóm tắt: lượt ôn, từ mới, chuỗi ngày và XP.

## 9. Từ vựng

Luyện tập → **Mở từ vựng** (cũng ở đầu tab Học) mở trình duyệt từ vựng. Lọc theo **Tất cả / Đã học / Chưa học / Danh từ / Động từ / Cụm từ**, sắp xếp **Theo khóa học**, hoặc tìm bằng tiếng Pháp hay tiếng Anh. Mỗi từ hiển thị nghĩa, mạo từ và giống, cách phát âm, một câu ví dụ, và thanh độ nhớ.

## 10. Từ điển phong phú

Mỗi từ tiếng Pháp trong khóa có một mục: từ loại, giống, cách phát âm (từ cơ sở dữ liệu từ vựng Lexique), câu ví dụ kèm bản dịch, và các từ dễ nhầm cần phân biệt. Chạm một từ trong bài đọc để mở mục của nó.

## 11. Trí nhớ: ôn tập hoạt động thế nào

Ứng dụng lập lịch ôn bằng thuật toán ôn tập ngắt quãng (FSRS). Mỗi từ, âm và cụm từ bạn gặp có một thẻ nhớ; mỗi lần bạn trả lời, ngày ôn tiếp theo của thẻ dịch chuyển — sớm hơn khi bạn gặp khó, muộn hơn khi bạn đã nhớ. Bạn không bao giờ phải tự chấm; câu trả lời của bạn là bằng chứng. Thanh độ nhớ trên một từ cho biết khả năng bạn nhớ nó ngay lúc này.

## 12. Hôm nay

Tab **Hôm nay** xây một phiên từ những gì trí nhớ của bạn cần: các lượt ôn đến hạn trước (dễ quên nhất trước), rồi nội dung mới từ chương hiện tại, rồi luyện tập hỗn hợp, rồi một màn ghép từ ngắn để kết thúc. Chọn **Độ dài phiên học** — 5, 10 hoặc 15 phút — và chạm **Bắt đầu phiên hôm nay**. Trên thiết bị ghi âm được, công tắc **Lúc này không nói được** xuất hiện phía trên nút: bật lên thì các lượt ôn nói được để ngoài phiên đó và vẫn đến hạn.

Với tiếng Pháp, `es-vi` và `de-vi`, phiên Hôm nay còn thêm **từ mới mỗi ngày** từ danh sách từ của khóa — chỉ lấy từ những chương bạn đã học tới, theo thứ tự khóa dạy. Chọn số từ ở Hồ sơ → Đang học → **Từ mới mỗi ngày** (0–15, mặc định 5; chọn 0 để tắt).

## 13. Ôn tập

Luyện tập → **Ôn từ vựng**, **Ôn nghe** và **Ôn nói** mỗi mục mở một phiên ôn cho kỹ năng đó. Trong phiên ôn, bạn có thể chạm **Hoàn tác lượt ôn này** ngay sau khi trả lời nếu lỡ chạm nhầm. Các lượt ôn nói bị bỏ qua vẫn đến hạn.

## 14. Luyện nghe

Bài nghe phát một đoạn ghi âm (**Phát âm thanh**, rồi **Phát lại**). Chạm **Chậm** để nghe lại chậm hơn. Khi luyện tập bạn có thể nghe lại bao nhiêu lần tùy ý; trong bài kiểm tra có chấm điểm, số lượt nghe bị giới hạn và được hiển thị. Trả lời câu hỏi hiểu, rồi **Kiểm tra**.

## 15. Luyện nói

Bài nói có hai dạng: **nhắc lại theo mẫu** (bạn nghe một đoạn mẫu và nói lại) và **tự nói** (bạn nhận một tình huống và các dữ kiện, rồi tạo câu). Chạm **Ghi âm câu trả lời**, nói, chạm **Dừng ghi âm**. Ứng dụng hiển thị *Mình nghe được: …* với những gì bộ nhận dạng của thiết bị hiểu, và *Nghe đúng rồi — chạm Kiểm tra để tiếp tục!* hoặc *Chưa đúng lắm. Thử lại, hoặc kiểm tra những gì bạn có.* Bạn có thể **Phát lại bản ghi của tôi** trước khi quyết định. Bạn có hai lượt thử; sau đó đáp án mẫu được hiển thị.

## 16. Quyền micrô

Bài nói đầu tiên xin quyền **micrô** và **nhận dạng giọng nói**. Nếu bạn từ chối, bài tập hiển thị **Cho phép micrô**, hoặc **Mở Cài đặt** khi hệ thống không hỏi lại nữa; mọi bước nói đều có **Bỏ qua bước này**. *(chưa kiểm chứng bằng tiếng Việt)*

- iPhone: Cài đặt → Quyền riêng tư & Bảo mật → Micrô, và Cài đặt → Quyền riêng tư & Bảo mật → Nhận dạng giọng nói.
- Android: Cài đặt → Ứng dụng → Learning French with Tracy → Quyền → Micrô.

## 17. Hành vi nhận dạng giọng nói của thiết bị và mạng

Việc nhận dạng do dịch vụ hệ thống của thiết bị thực hiện, không phải ứng dụng. Trước lượt thử đầu tiên, ứng dụng kiểm tra xem thiết bị có gói tiếng Pháp ngoại tuyến hay không. Nếu không, bạn thấy thông báo: *Nhận dạng giọng nói do dịch vụ hệ thống của thiết bị cung cấp. Nếu không có gói Tiếng Pháp ngoại tuyến, dịch vụ này có thể dùng Internet để nhận dạng lời bạn nói. Bản thân ứng dụng không bao giờ tải lên hay lưu bản ghi âm của bạn — và bạn luôn có thể bỏ qua phần nói.* Chạm **Đã hiểu** để tiếp tục hoặc bỏ qua. Ứng dụng xóa bản ghi tạm của mỗi lượt thử khi bước kết thúc và không giữ bản ghi lời nói nào. *(chưa kiểm chứng bằng tiếng Việt)*

## 18. Luyện viết

Luyện tập → **Luyện viết** (và các bài phần 5) cho các bài viết có hướng dẫn: một yêu cầu ngắn cùng các dữ kiện cần dùng (ví dụ tên, thành phố, giờ). Gõ tiếng Pháp của bạn vào **Câu trả lời Tiếng Pháp của bạn** và chạm **Kiểm tra**. Nhận xét nêu chính xác điều còn thiếu (“Bạn đã nêu lời chào, nhưng chưa có giờ”) hoặc điều cần đổi; không bao giờ chấm ngữ pháp mà nó không kiểm tra được. Bài biểu mẫu có các ô được gắn nhãn (Prénom, Âge, Ville…) — chỉ viết dữ kiện vào từng ô. Bài viết tự do (*Viết tự do bằng Tiếng Pháp*) chấp nhận mọi câu tiếng Pháp về chủ đề đó.

## 19. Luyện hội thoại

Luyện tập → **Trò chuyện** bắt đầu một cuộc trao đổi nói ngắn với giọng của bạn đồng hành: chào hỏi, gọi món, hỏi đường, mua vé. Mỗi lượt của bạn được ghi âm như bài nói; bạn đồng hành đáp lại những gì bạn nói. Nếu bạn đồng hành không hiểu, họ nói lại cách khác một lần; **Bỏ qua bước này** để đi tiếp. Bản ghi cuộc trao đổi ở lại trên màn hình để bạn đọc lại.

## 20. Đọc

Bài đọc (phần 3) là các thông báo, tin nhắn và văn bản ngắn. Chạm bất kỳ từ nào để xem nghĩa. Trả lời câu hỏi hiểu; trong bài kiểm tra, đoạn văn vẫn hiển thị khi bạn trả lời.

### Đọc & nghe (truyện phân cấp)

Tiếng Pháp, `es-vi` và `de-vi` có các truyện ngắn (150–400 từ) viết gần như hoàn toàn bằng những từ khóa học dạy. Mở truyện từ Luyện tập → **Đọc & nghe**, hoặc từ **Truyện hôm nay** ở thẻ Hôm nay. Danh sách đưa lên đầu truyện có **3–6 từ mới với bạn**, tính từ những từ bạn đã học; mỗi truyện ghi cấp (1–4) và số từ mới với bạn.

Trong màn hình đọc:
- **Nghe** phát truyện từng câu một và tô sáng câu đang đọc; nút loa ở một dòng phát từ câu đó.
- Truyện chưa có âm thanh đi kèm được đọc bằng giọng của chính điện thoại, có ghi **Giọng đọc của máy**. Giọng này chạy ngoại tuyến; chất lượng tùy điện thoại. Nếu điện thoại chưa có giọng đọc ngoại tuyến cho ngôn ngữ đó, bạn chỉ thấy văn bản, kèm một dòng gợi ý: cài giọng đọc ngoại tuyến của ngôn ngữ đó trong Cài đặt Android (*Đầu ra chuyển văn bản thành giọng nói*), rồi mở lại truyện. Ứng dụng không tự tải gì.
- **Chạm một từ** để xem nghĩa; các từ mới của truyện được gạch chân. **Học từ này** thêm bất kỳ từ nào khác vào phần kiểm tra từ ở cuối.
- **Chạm số thứ tự của câu** để xem bản dịch.
- **Mình đọc xong rồi** mở ba câu hỏi về truyện (chỉ có phản hồi, không chấm điểm và không lưu).
- **Kiểm tra từ mới** chạy một bài kiểm tra ngắn: mỗi từ mới được giới thiệu một lần rồi hỏi một lần. Chỉ bài kiểm tra này cập nhật lịch ôn tập của bạn; việc đọc thì không bao giờ.

## 21. Bài kiểm tra

Mỗi phần kết thúc bằng một bài kiểm tra (tab Học, sau bài cuối; *Hoàn thành các bài của phần này để mở khóa*). Bài kiểm tra có chấm điểm: thứ tự đáp án xáo mỗi lần, đoạn nghe có số lượt giới hạn, và bài kiểm tra nói cần micrô (**Đã hiểu — bắt đầu kiểm tra** sau thông báo quyền). Kết quả cho biết mục tiêu nào bạn đã thể hiện; bạn có thể làm lại bài kiểm tra sau thời gian chờ hiển thị trên màn hình kết quả.

## 22. Bài kiểm tra A1 tổng kết

Sau phần 6, **bài kiểm tra A1** (Hồ sơ → Mục tiêu Tiếng Pháp của bạn → **Làm bài kiểm tra A1**) kết hợp các mục nghe, đọc, nói, viết và hội thoại. Bài này cần nhận dạng giọng nói; trên thiết bị hoặc nền tảng không có, màn hình tổng kết sẽ nói rõ trước khi bạn bắt đầu.

## 23. Ước tính A1 theo khung CEFR

Hồ sơ → **Mục tiêu Tiếng Pháp của bạn** hiển thị năm kỹ năng — nghe, đọc, nói, viết, hội thoại — với số mục tiêu bắt buộc bạn đã thể hiện trong các bài kiểm tra (ví dụ *Nghe 1/3*), và một dòng tổng: *Đã thể hiện ở cả năm kỹ năng* hoặc *Chưa hoàn tất*. Một mục tiêu chỉ được tính khi một bài kiểm tra có chấm điểm cho thấy; riêng bài tổng kết không bao giờ hoàn tất một kỹ năng.

## 24. Vì sao đây không phải chứng chỉ chính thức

Ước tính là những gì các bài kiểm tra của chính khóa này quan sát được. Đây không phải kỳ thi CEFR chính thức, không phải chứng chỉ và không được cơ quan nào công nhận; trình độ chính thức chỉ có được qua một kỳ thi được công nhận. Màn hình Mục tiêu nói điều này bằng lời của chính nó ở **Ước tính này là gì và không phải là gì**.

## 25. Màn hình Mục tiêu

Ngoài ước tính, màn hình Mục tiêu cho bạn **Tìm điểm bắt đầu của bạn** / **Làm lại bài kiểm tra**. Khi điểm bắt đầu của bạn ở sau đầu lộ trình, màn hình còn có **Đặt lại điểm bắt đầu** (kèm xác nhận: *Giữ nguyên* hoặc *Đặt lại*); nếu không, nó ghi *Bắt đầu từ đầu.* Đặt lại điểm bắt đầu không bao giờ xóa bài đã hoàn thành hay lịch sử ôn tập.

## 26. XP, chuỗi ngày và hoạt động

Hồ sơ hiển thị **Chuỗi ngày**, **XP khóa học**, **XP hôm nay**, **Cần xem lại**, **Bài đã học** và **Từ đã học**, cùng dải hoạt động bảy ngày. Một ngày được tính vào chuỗi khi bạn hoàn thành một bài học hoặc một phiên Hôm nay (theo ngày lịch địa phương). Phiên luyện tập cho một lượng XP cố định nhỏ hơn và không bao giờ tính là bài đã hoàn thành.

## 27. Xuất bản sao lưu

Hồ sơ → Dữ liệu → **Xuất tiến độ** (*Lưu một tệp sao lưu toàn bộ dữ liệu.*) tạo một tệp sao lưu và mở bảng chia sẻ của hệ thống — lưu vào Tệp/Drive hoặc gửi cho chính bạn. Tệp chứa tiến độ của mọi khóa, gồm hai phần — cài đặt, điểm và kết quả kiểm tra của bạn, và các thẻ ôn tập ngắt quãng cùng lịch sử ôn; không chứa bản ghi âm, bản ghi lời nói hay định danh cá nhân. Lịch sử ôn chưa lưu của phiên bạn đang dở được ghi ra trước, nên tệp luôn đầy đủ. *(chưa kiểm chứng bằng tiếng Việt)*

## 28. Nhập / khôi phục bản sao lưu

Hồ sơ → Dữ liệu → **Nhập tiến độ** (*Khôi phục từ tệp sao lưu.*) → chọn tệp → xác nhận **Nhập**. Ứng dụng kiểm tra toàn bộ tệp trước khi chạm vào tiến độ hiện tại; nếu có gì sai, nó nói rõ lý do và tiến độ hiện tại không thay đổi. Bản sao lưu tạo bởi phiên bản ứng dụng mới hơn bị từ chối thay vì đoán. Bản sao lưu từ các phiên bản cũ (trước cơ sở dữ liệu cục bộ) nhập bình thường. Trước khi thay thế bất cứ điều gì, ứng dụng lưu một bản sao tiến độ hiện tại dưới tên `progress-before-import-<ngày>.json` trong thư mục tài liệu riêng của nó; nếu sau đó không xác minh được dữ liệu vừa nhập, tiến độ trước đó được tự động khôi phục và màn hình sẽ báo. *(chưa kiểm chứng bằng tiếng Việt)*

## 29. Dữ liệu và quyền riêng tư

Mọi thứ nằm trên thiết bị của bạn: một cơ sở dữ liệu cục bộ giữ thẻ và lịch sử ôn, một kho cài đặt giữ mọi thứ còn lại. Lần đầu một phiên bản có cơ sở dữ liệu cục bộ khởi động trên tiến độ cũ, nó chuyển lịch sử của bạn sang một lần và giữ bản sao tiến độ cũ là `progress-before-v4-<ngày>.json` trong thư mục tài liệu của ứng dụng. Ứng dụng không tự gửi yêu cầu mạng nào, không có tài khoản, không phân tích dữ liệu và không quảng cáo. Phần nói dùng bộ nhận dạng hệ thống của thiết bị (xem mục 17). Xóa ứng dụng sẽ xóa toàn bộ dữ liệu của nó. Chính sách đầy đủ ở Hồ sơ → **Quyền riêng tư** và trên trang web.

## 30. Trợ năng

Mọi điều khiển đều có nhãn và trạng thái cho trình đọc màn hình; câu trả lời đúng và sai được đánh dấu bằng ký hiệu và chữ, không chỉ bằng màu; cỡ chữ theo hệ thống (bài đọc tới 200%); chế độ tối theo hệ thống hoặc lựa chọn của bạn ở Hồ sơ → **Giao diện** (*Theo thiết bị / Sáng / Tối*). Các bước nói luôn có thể bỏ qua. Xem tuyên bố trợ năng trên trang web để biết trạng thái hiện tại theo từng tính năng.

Ngôn ngữ của chính ứng dụng — mọi màn hình, nút, gợi ý và thông báo — là tiếng Việt hoặc tiếng Anh: Hồ sơ → **Ngôn ngữ hiển thị** (*Theo thiết bị / Tiếng Việt / English*). *Theo thiết bị* dùng ngôn ngữ của điện thoại (tiếng Việt trên máy đặt tiếng Việt, còn lại là tiếng Anh). Nội dung khóa học (nghĩa từ, câu hỏi, sổ tay) giữ ngôn ngữ mà khóa được viết; khóa tiếng Pháp được chú nghĩa bằng tiếng Anh cho đến khi khóa tiếng Pháp dành cho người Việt ra mắt.

## 31. Dùng ngoại tuyến

Bài học, Hôm nay, từ vựng, đoạn nghe, đọc, viết và bài kiểm tra hoạt động mà không cần kết nối nào.

## 32. Những gì vẫn có thể cần mạng

- Nhận dạng giọng nói trên thiết bị không có gói tiếng Pháp ngoại tuyến (mục 17).
- Tải giọng đọc ngoại tuyến trong Cài đặt Android, nếu bạn muốn nghe các truyện chưa có âm thanh đi kèm (mục 20). Ứng dụng không bao giờ tự tải giọng này.
- Cài đặt và cập nhật ứng dụng từ cửa hàng.
- Mở các liên kết trang web (Quyền riêng tư, Hỗ trợ) từ màn hình Hồ sơ.

## 33. Khắc phục sự cố

- **Không có tiếng:** kiểm tra công tắc im lặng và âm lượng; đảm bảo âm thanh Bluetooth đi đúng nơi bạn muốn; chạm **Phát lại**.
- **Micrô không khả dụng:** cho phép micrô và nhận dạng giọng nói trong Cài đặt (mục 16); mở lại bài tập.
- **Nhận dạng giọng nói không khả dụng:** nền tảng không có bộ nhận dạng (ví dụ bản web). Dùng **Bỏ qua bước này**; các lượt ôn nói vẫn đến hạn.
- **Nhận dạng giọng nói cần Internet:** ứng dụng đã báo thiết bị của bạn không có gói tiếng Pháp ngoại tuyến. Hãy kết nối mạng, hoặc bỏ qua phần nói.
- **Nhận dạng sai:** nói chậm hơn và gần micrô hơn, ở nơi yên tĩnh; chỉ nói câu tiếng Pháp; xem *Mình nghe được: …* và thử lại.
- **Lúc này không nói được:** ở Hôm nay, chạm **Lúc này không nói được** trước khi bắt đầu; các lượt ôn nói được để lại sau.
- **Không có lượt ôn đến hạn:** học một bài mới trên lộ trình; Hôm nay sẽ có nội dung vào ngày mai.
- **Đặt lại điểm bắt đầu:** Hồ sơ → Mục tiêu Tiếng Pháp của bạn → Đặt lại điểm bắt đầu.
- **Nhập bản sao lưu thất bại:** dùng tệp do Xuất tiến độ tạo; không chỉnh sửa tệp; tệp bị cắt hoặc từ phiên bản mới hơn sẽ bị từ chối và không có gì thay đổi.
- **Chữ to hoặc lỗi bố cục:** mọi màn hình đều cuộn được; nếu một điều khiển không với tới ở cỡ chữ của bạn, hãy báo bằng mẫu trợ năng.
- **Cảnh báo cài ngoài cửa hàng trên Android:** bình thường với tệp không cài từ Google Play.
- **Câu hỏi về quyền riêng tư:** Hồ sơ → Quyền riêng tư, hoặc trang Hỗ trợ.

## 34. Đặt lại và hành vi xếp lớp

Đặt lại điểm bắt đầu chỉ xóa kết quả xếp lớp (các dấu “đã được bỏ qua” trên lộ trình); bài đã hoàn thành, XP, chuỗi ngày và thẻ ôn vẫn giữ. Để bắt đầu hoàn toàn mới, hãy xóa và cài lại ứng dụng (xuất bản sao lưu trước nếu bạn có thể muốn lấy lại).

## 35. Giấy phép và ghi công

Hồ sơ → **Giấy phép & ghi công** (*Thông báo phần mềm và nguồn dữ liệu.*) liệt kê mọi nguồn của bên thứ ba: nền tảng Lingo Lessons (MIT), dữ liệu từ vựng Lexique 4 (CC BY-SA 4.0), bộ lập lịch FSRS (ts-fsrs, MIT), và — ở mục **Âm thanh** — Piper (MIT) cùng từng giọng đọc được dùng để tổng hợp âm thanh đi kèm và giấy phép của nó. Danh sách tương tự có trên trang web.

## 36. Hỗ trợ và liên hệ

Trang Hỗ trợ trên trang web có FAQ và các kênh liên hệ; báo lỗi gửi tới GitHub Issues với các mẫu cho lỗi, vấn đề âm thanh hoặc giọng nói, vấn đề trợ năng và sửa tiếng Pháp. Email hỗ trợ là duymank250997@gmail.com (có thể thay đổi ở phiên bản sau; trang Hỗ trợ luôn hiển thị địa chỉ hiện tại). Không bao giờ gửi bản ghi âm giọng nói.
