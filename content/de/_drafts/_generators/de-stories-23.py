import importlib.util
spec = importlib.util.spec_from_file_location("lib", r"C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-app-hoc-ngoai-ngu\82ea6b33-e22d-4a2d-907b-9b4441f9e202\scratchpad\de-stories-lib.py")
lib = importlib.util.module_from_spec(spec); spec.loader.exec_module(lib)
story = lib.story

S = []
S.append(story("an_der_ampel", "A2-1", "An der Ampel",
 ("Paul ngã xe đạp ở đèn giao thông. Người lái xe là một phụ nữ — và bà nói thật.", "Paul falls off his bike at the traffic lights. The driver is a woman — and she tells the truth."),
 ["Knie", "Reaktion", "Freundschaft"],
 [("N", "An einem Montag fährt Paul mit dem Fahrrad zur Arbeit.", "Một ngày thứ Hai, Paul đạp xe đi làm.", "One Monday Paul rides his bike to work."),
  ("N", "Die Straße ist breit, aber sehr gefährlich. Es gibt viele Autos.", "Con đường rộng, nhưng rất nguy hiểm. Có rất nhiều xe hơi.", "The street is wide, but very dangerous. There are lots of cars."),
  ("N", "An der Ampel will er nach links fahren. Plötzlich ist ein Auto ganz nah.", "Đến đèn giao thông anh muốn rẽ trái. Bỗng một chiếc xe hơi lao đến rất gần.", "At the traffic lights he wants to turn left. Suddenly a car is very close."),
  ("N", "Paul fällt vom Fahrrad. Sein Arm tut weh, und sein Knie auch.", "Paul ngã khỏi xe đạp. Tay anh đau, đầu gối cũng đau.", "Paul falls off his bike. His arm hurts, and his knee too."),
  ("N", "Die Fahrerin steigt aus und läuft zu ihm.", "Người phụ nữ lái xe bước xuống và chạy đến chỗ anh.", "The driver gets out and runs to him."),
  ("B", "Haben Sie sich verletzt? Es tut mir so leid! Meine Reaktion war zu spät.", "Anh có bị thương không? Tôi rất xin lỗi! Tôi phản ứng quá chậm.", "Are you hurt? I'm so sorry! My reaction was too late."),
  ("A", "Mein Arm tut weh. Aber ich glaube, es ist nicht so schlimm.", "Tay tôi đau. Nhưng tôi nghĩ không đến nỗi nào.", "My arm hurts. But I don't think it's that bad."),
  ("N", "Ein Mann auf der Straße ruft einen Arzt an.", "Một người đàn ông trên phố gọi bác sĩ.", "A man in the street calls a doctor."),
  ("B", "Bleiben Sie ruhig. Die Hilfe kommt gleich.", "Anh cứ bình tĩnh. Sẽ có người đến giúp ngay.", "Stay calm. Help is coming right away."),
  ("N", "Nach zehn Minuten ist der Arzt da. Er schaut sich den Arm genau an.", "Mười phút sau bác sĩ đến. Ông xem kỹ cánh tay.", "After ten minutes the doctor is there. He looks at the arm carefully."),
  ("A", "Der Arm ist nicht gebrochen. Da haben Sie Glück gehabt.", "Tay không bị gãy. Anh may mắn đấy.", "The arm isn't broken. You were lucky."),
  ("N", "Dann kommt auch die Polizei. Ein Polizist fragt: Können Sie mir Ihre Namen nennen? Was ist passiert?", "Rồi cảnh sát cũng đến. Một cảnh sát hỏi: Hai người cho tôi biết tên được không? Chuyện gì đã xảy ra?", "Then the police come too. An officer asks: Can you tell me your names? What happened?"),
  ("B", "Ich bin zu schnell gefahren. Es ist meine Schuld.", "Tôi đã lái quá nhanh. Đó là lỗi của tôi.", "I was driving too fast. It's my fault."),
  ("A", "Stimmt das?", "Có đúng vậy không?", "Is that right?"),
  ("A", "Ja, das stimmt.", "Vâng, đúng vậy.", "Yes, that's right."),
  ("N", "Zwar ist das Fahrrad kaputt, aber Paul ist sonst in Ordnung.", "Tuy chiếc xe đạp bị hỏng, nhưng ngoài ra Paul không sao.", "The bike is broken, but otherwise Paul is all right."),
  ("B", "Ich bezahle die Reparatur. Das ist das Einzige, was ich jetzt machen kann. Ich bitte Sie um Entschuldigung.", "Tôi sẽ trả tiền sửa xe. Đó là điều duy nhất tôi có thể làm lúc này. Tôi xin lỗi anh.", "I'll pay for the repair. That's the only thing I can do now. I apologise."),
  ("A", "Danke. Sagen Sie mir Bescheid, wenn das Fahrrad fertig ist.", "Cảm ơn chị. Khi xe sửa xong chị báo cho tôi nhé.", "Thank you. Let me know when the bike is ready."),
  ("N", "Am nächsten Tag ruft die Frau Paul an.", "Hôm sau người phụ nữ gọi điện cho Paul.", "The next day the woman calls Paul."),
  ("B", "Ich möchte mich noch einmal entschuldigen. Ich hoffe, es geht Ihnen besser.", "Tôi muốn xin lỗi anh một lần nữa. Tôi mong anh đã khỏe hơn.", "I'd like to apologise once more. I hope you're feeling better."),
  ("A", "Danke, viel besser. Der Arm tut kaum noch weh.", "Cảm ơn chị, đỡ nhiều rồi. Tay gần như không còn đau nữa.", "Thanks, much better. The arm hardly hurts any more."),
  ("B", "Darf ich Sie zum Essen einladen? Das Fahrrad ist auch fertig.", "Tôi mời anh đi ăn được không? Xe đạp cũng sửa xong rồi.", "May I invite you to a meal? The bike is ready too."),
  ("N", "Paul lacht. So beginnt eine Freundschaft.", "Paul bật cười. Một tình bạn bắt đầu như thế.", "Paul laughs. That's how a friendship begins.")],
 [("locate", "Paul bị đau ở đâu?", "Where does Paul hurt?", [("Ở tay và đầu gối", "His arm and his knee"), ("Ở đầu", "His head"), ("Ở chân và lưng", "His leg and his back")], 0),
  ("locate", "Ai nhận lỗi?", "Who takes the blame?", [("Paul", "Paul"), ("Người phụ nữ lái xe", "The woman driving"), ("Người đàn ông trên phố", "The man in the street")], 1),
  ("infer", "Vì sao Paul và người phụ nữ trở thành bạn?", "Why do Paul and the woman become friends?", [("Vì họ làm cùng công ty", "Because they work at the same company"), ("Vì bác sĩ giới thiệu họ", "Because the doctor introduced them"), ("Vì chị ấy thành thật nhận lỗi và mời anh đi ăn", "Because she honestly took the blame and invited him to a meal")], 2)],
 names=["Paul"], token_map={"weh": "tun", "fahrerin": "Fahrer", "steigt": "aussteigen", "einzige": "einzig"}))

lib.write_batch("23", S)
