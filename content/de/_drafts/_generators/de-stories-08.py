import importlib.util
spec = importlib.util.spec_from_file_location("lib", r"C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-app-hoc-ngoai-ngu\82ea6b33-e22d-4a2d-907b-9b4441f9e202\scratchpad\de-stories-lib.py")
lib = importlib.util.module_from_spec(spec); spec.loader.exec_module(lib)
story = lib.story

S = []
S.append(story("der_erste_tag_im_kurs", "A1-2", "Der erste Tag im Kurs",
 ("Hôm nay Duc bắt đầu khóa học tiếng Đức. Anh phải đánh vần tên mình — và gặp một người bạn mới.", "Today Duc starts his German course. He has to spell his name — and meets a new friend."),
 ["Schüler", "Sprache", "Papier"],
 [("N", "Heute ist Montag. Duc beginnt einen Kurs für Deutsch an einer Schule in der Stadt.", "Hôm nay là thứ Hai. Duc bắt đầu một khóa học tiếng Đức ở một trường trong thành phố.", "Today is Monday. Duc is starting a German course at a school in town."),
  ("N", "Zuerst muss er zur Anmeldung.", "Trước tiên anh phải đến quầy đăng ký.", "First he has to go to the registration desk."),
  ("N", "Dort bekommt er ein Formular.", "Ở đó anh nhận một tờ khai.", "There he gets a form."),
  ("N", "Er schreibt seinen Vornamen, seinen Familiennamen, sein Geburtsjahr und seinen Geburtsort.", "Anh viết tên, họ, năm sinh và nơi sinh của mình.", "He writes his first name, his surname, his year of birth and his place of birth."),
  ("N", "Beim Familienstand kreuzt er ledig an.", "Ở mục tình trạng hôn nhân anh đánh dấu độc thân.", "Under marital status he ticks single."),
  ("N", "Dann geht er in die Klasse. Dort sitzen schon zwölf Leute.", "Rồi anh vào lớp. Ở đó đã có mười hai người ngồi sẵn.", "Then he goes into the classroom. Twelve people are already sitting there."),
  ("N", "Die Lehrerin heißt Frau Roth. Sie trägt eine Brille und lacht viel.", "Cô giáo tên là bà Roth. Cô đeo kính và hay cười.", "The teacher is called Ms Roth. She wears glasses and laughs a lot."),
  ("B", "Guten Morgen! Bitte sagen Sie Ihren Namen und buchstabieren Sie ihn.", "Chào buổi sáng! Mời các bạn nói tên mình và đánh vần.", "Good morning! Please say your name and spell it."),
  ("A", "Ich heiße Duc. D, U, C.", "Tôi tên là Duc. D, U, C.", "My name is Duc. D, U, C."),
  ("B", "Danke! Und woher kommen Sie?", "Cảm ơn bạn! Bạn đến từ đâu?", "Thank you! And where are you from?"),
  ("A", "Ich komme aus Vietnam. Ich spreche schon ein bisschen Deutsch.", "Tôi đến từ Việt Nam. Tôi đã nói được một chút tiếng Đức.", "I'm from Vietnam. I already speak a little German."),
  ("N", "Neben Duc sitzt eine Frau aus Polen. Sie heißt Ola.", "Bên cạnh Duc là một phụ nữ đến từ Ba Lan. Cô tên là Ola.", "Next to Duc sits a woman from Poland. Her name is Ola."),
  ("N", "Frau Roth liest einen Satz vor.", "Cô Roth đọc to một câu.", "Ms Roth reads a sentence aloud."),
  ("B", "Was bedeutet dieses Wort? Wer weiß es?", "Từ này nghĩa là gì? Ai biết nào?", "What does this word mean? Who knows?"),
  ("N", "Niemand sagt etwas. Dann sagt Ola leise ein Wort.", "Không ai nói gì. Rồi Ola khẽ nói một từ.", "Nobody says anything. Then Ola quietly says a word."),
  ("N", "Sie hat die richtige Antwort, und alle lachen froh.", "Cô trả lời đúng, và mọi người cười vui vẻ.", "She has the right answer, and everyone laughs happily."),
  ("N", "In der Pause trinken Duc und Ola zusammen einen Kaffee.", "Giờ nghỉ Duc và Ola cùng uống cà phê.", "In the break Duc and Ola have a coffee together."),
  ("B", "Die Sprache ist schwer, oder?", "Tiếng Đức khó nhỉ?", "The language is hard, isn't it?"),
  ("A", "Ja, aber zusammen schaffen wir das!", "Ừ, nhưng cùng nhau thì bọn mình sẽ làm được!", "Yes, but together we can do it!"),
  ("N", "Am Ende vom Unterricht gibt Frau Roth die Hausaufgaben: eine Seite im Buch und einen kleinen Test.", "Cuối buổi học cô Roth giao bài tập về nhà: một trang trong sách và một bài kiểm tra nhỏ.", "At the end of the lesson Ms Roth gives the homework: one page in the book and a short test."),
  ("N", "Duc schreibt alles auf ein Stück Papier. Er ist müde, aber froh. Er ist wieder ein Schüler!", "Duc ghi hết lên một mẩu giấy. Anh mệt nhưng vui. Anh lại được làm học trò!", "Duc writes everything on a piece of paper. He is tired, but happy. He is a pupil again!")],
 [("locate", "Cô giáo tên là gì?", "What is the teacher's name?", [("Bà Roth", "Ms Roth"), ("Ola", "Ola"), ("Bà Wolf", "Ms Wolf")], 0),
  ("locate", "Ola đến từ đâu?", "Where is Ola from?", [("Từ Việt Nam", "From Vietnam"), ("Từ Ba Lan", "From Poland"), ("Từ Đức", "From Germany")], 1),
  ("infer", "Vì sao mọi người cười vui vẻ?", "Why does everyone laugh happily?", [("Duc đánh vần tên đúng", "Duc spelt his name right"), ("Giờ nghỉ bắt đầu", "The break begins"), ("Ola trả lời đúng câu hỏi của cô giáo", "Ola answered the teacher's question correctly")], 2)],
 names=["Duc", "Roth", "Ola", "Vietnam", "Polen", "D", "U", "C"],
 token_map={"lehrerin": "Lehrer", "kreuzt": "ankreuzen"}))

lib.write_batch("08", S)
