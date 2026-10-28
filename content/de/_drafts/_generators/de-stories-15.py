import importlib.util
spec = importlib.util.spec_from_file_location("lib", r"C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-app-hoc-ngoai-ngu\82ea6b33-e22d-4a2d-907b-9b4441f9e202\scratchpad\de-stories-lib.py")
lib = importlib.util.module_from_spec(spec); spec.loader.exec_module(lib)
story = lib.story

S = []
S.append(story("die_wahl_im_dorf", "A2-1", "Die Wahl im Dorf",
 ("Ngôi làng nhỏ sắp bầu người đứng đầu mới. Hai ứng viên — một người hứa nhiều, một người nói thật.", "The little village is choosing a new leader. Two candidates — one promises a lot, the other tells the truth."),
 ["Bürgermeister", "Politik", "Mitglied"],
 [("N", "In einem kleinen Dorf gibt es bald eine Wahl.", "Ở một ngôi làng nhỏ sắp có một cuộc bầu cử.", "In a small village there is going to be an election."),
  ("N", "Bei der Wahl suchen die Leute einen neuen Bürgermeister.", "Trong cuộc bầu cử, người dân chọn một trưởng làng mới.", "In the election the people choose a new mayor."),
  ("N", "Es gibt zwei Männer: Herr Groß und Herr Stein.", "Có hai người: ông Groß và ông Stein.", "There are two men: Mr Groß and Mr Stein."),
  ("N", "Herr Groß hat viel Geld und einen großen Ruf. Er ist ein Boss in einer Firma.", "Ông Groß giàu có và rất có tiếng. Ông là ông chủ một công ty.", "Mr Groß is rich and well known. He is the boss of a company."),
  ("N", "Herr Stein ist ein Bauer. Er ist ein Mitglied im Verein für Fußball, und alle kennen ihn.", "Ông Stein là một nông dân. Ông là thành viên câu lạc bộ bóng đá, và ai cũng biết ông.", "Mr Stein is a farmer. He is a member of the football club, and everyone knows him."),
  ("N", "Am Sonntag hält Herr Groß eine Rede auf dem Platz.", "Chủ nhật ông Groß phát biểu trên quảng trường.", "On Sunday Mr Groß gives a speech in the square."),
  ("A", "Ich verspreche euch alles: eine neue Schule, ein neues Schwimmbad und mehr Geld für jeden!", "Tôi hứa với bà con mọi thứ: một trường học mới, một bể bơi mới và nhiều tiền hơn cho mỗi người!", "I promise you everything: a new school, a new swimming pool and more money for everyone!"),
  ("N", "Viele Leute finden das super.", "Nhiều người thấy thế thật tuyệt.", "Lots of people think that's great."),
  ("N", "Dann spricht Herr Stein. Er ist ruhig und spricht langsam.", "Rồi đến lượt ông Stein. Ông điềm tĩnh và nói chậm rãi.", "Then Mr Stein speaks. He is calm and speaks slowly."),
  ("A", "Ich kann euch nicht alles versprechen. Das Dorf hat nicht viel Geld.", "Tôi không thể hứa với bà con mọi thứ. Làng mình không có nhiều tiền.", "I can't promise you everything. The village doesn't have much money."),
  ("A", "Aber ich kümmere mich um die wichtigen Sachen: die Straße, die Schule und die alten Leute.", "Nhưng tôi sẽ lo những việc quan trọng: con đường, trường học và người già.", "But I'll take care of the important things: the road, the school and the old people."),
  ("N", "Einige Leute lachen. Das ist ihnen zu wenig.", "Vài người bật cười. Thế thì ít quá.", "Some people laugh. That's too little for them."),
  ("N", "Am Abend redet die Familie Hahn über die Wahl.", "Buổi tối gia đình Hahn bàn về cuộc bầu cử.", "In the evening the Hahn family talks about the election."),
  ("B", "Wer sagt die Wahrheit? Das ist die Frage.", "Ai nói thật? Đó mới là câu hỏi.", "Who is telling the truth? That's the question."),
  ("N", "Die Tochter hat eine Idee. Sie schaut im Internet nach.", "Cô con gái có một ý. Cô lên mạng tra cứu.", "The daughter has an idea. She looks it up on the internet."),
  ("N", "Dort findet sie eine alte Nachricht: Herr Groß hat vor zwei Jahren schon einmal alles versprochen — in einer anderen Stadt. Dann hat er nichts gemacht.", "Ở đó cô thấy một bản tin cũ: hai năm trước ông Groß cũng đã hứa đủ thứ — ở một thành phố khác. Rồi ông chẳng làm gì cả.", "There she finds an old news story: two years ago Mr Groß had already promised everything — in another town. Then he did nothing."),
  ("B", "Er lügt also!", "Vậy là ông ta nói dối!", "So he's lying!"),
  ("N", "Die Tochter erzählt es allen im Dorf.", "Cô con gái kể chuyện đó cho cả làng.", "The daughter tells everyone in the village."),
  ("N", "Am Tag der Wahl ist die Entscheidung klar.", "Đến ngày bầu cử, quyết định đã rõ ràng.", "On election day the decision is clear."),
  ("N", "Herr Stein gewinnt. Er ist der neue Bürgermeister.", "Ông Stein thắng cử. Ông là trưởng làng mới.", "Mr Stein wins. He is the new mayor."),
  ("A", "Danke für euer Vertrauen. Politik ist kein Spiel. Wir machen das Dorf zusammen besser.", "Cảm ơn bà con đã tin tưởng. Chính trị không phải trò chơi. Chúng ta sẽ cùng nhau làm làng tốt đẹp hơn.", "Thank you for your trust. Politics isn't a game. We'll make the village better together.")],
 [("locate", "Ông Stein làm nghề gì?", "What does Mr Stein do?", [("Nông dân", "Farmer"), ("Ông chủ công ty", "Company boss"), ("Giáo viên", "Teacher")], 0),
  ("locate", "Ông Groß hứa những gì?", "What does Mr Groß promise?", [("Một con đường mới", "A new road"), ("Một trường học, một bể bơi mới và nhiều tiền hơn", "A new school, a new pool and more money"), ("Chăm lo người già", "Care for old people")], 1),
  ("infer", "Vì sao ông Stein thắng cử?", "Why does Mr Stein win?", [("Ông hứa nhiều hơn", "He promised more"), ("Ông giàu hơn", "He is richer"), ("Dân làng biết ông Groß đã từng hứa rồi không làm", "The villagers learned Mr Groß had broken promises before")], 2)],
 names=["Groß", "Stein", "Hahn"], token_map={"einige": "function"}))

lib.write_batch("15", S)
