import importlib.util
spec = importlib.util.spec_from_file_location("lib", r"C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-app-hoc-ngoai-ngu\82ea6b33-e22d-4a2d-907b-9b4441f9e202\scratchpad\de-stories-lib.py")
lib = importlib.util.module_from_spec(spec); spec.loader.exec_module(lib)
story = lib.story

S = []
S.append(story("eine_internationale_hochzeit", "A2-1", "Eine internationale Hochzeit",
 ("Anna người Đức và Duc người Việt tổ chức đám cưới ở một khách sạn bên hồ. Chiếc nhẫn suýt thì bị quên.", "Anna from Germany and Duc from Vietnam get married at a hotel by a lake. The ring is almost forgotten."),
 ["Braut", "Ring", "Programm", "Jacke", "See"],
 [("N", "Anna und Duc heiraten im Juni. Die Hochzeit ist in einem großen Hotel am See.", "Anna và Duc cưới nhau vào tháng Sáu. Đám cưới diễn ra ở một khách sạn lớn bên hồ.", "Anna and Duc get married in June. The wedding is at a big hotel by a lake."),
  ("N", "Es ist eine internationale Hochzeit: Anna kommt aus Deutschland, Duc aus Vietnam.", "Đó là một đám cưới quốc tế: Anna đến từ Đức, Duc đến từ Việt Nam.", "It is an international wedding: Anna comes from Germany, Duc from Vietnam."),
  ("N", "Viele Gäste kommen aus dem Ausland. Für sie ist hier alles fremd.", "Nhiều khách đến từ nước ngoài. Với họ, mọi thứ ở đây đều xa lạ.", "Many guests come from abroad. For them everything here is unfamiliar."),
  ("N", "Alle Doppelzimmer im Hotel sind besetzt.", "Tất cả phòng đôi trong khách sạn đều đã có người.", "All the double rooms in the hotel are taken."),
  ("N", "Das Programm für den Tag ist lang. Am Morgen frühstücken alle zusammen.", "Chương trình trong ngày rất dài. Buổi sáng mọi người cùng ăn sáng.", "The programme for the day is long. In the morning everyone has breakfast together."),
  ("N", "Dann gehen sie in die Kirche. Die Braut trägt ein langes Kleid.", "Rồi họ vào nhà thờ. Cô dâu mặc một chiếc váy dài.", "Then they go to the church. The bride wears a long dress."),
  ("N", "Aber wo ist der Ring? Duc hat plötzlich Angst.", "Nhưng chiếc nhẫn đâu rồi? Duc bỗng thấy sợ.", "But where is the ring? Duc is suddenly afraid."),
  ("N", "Er sucht in seiner Jacke. Dort steckt der Ring! Er hat ihn nicht verloren.", "Anh lục túi áo khoác. Chiếc nhẫn nằm ở đó! Anh không làm mất nó.", "He looks in his jacket. There is the ring! He hasn't lost it."),
  ("N", "Nach der Kirche gratulieren alle Anna und Duc.", "Sau lễ ở nhà thờ, mọi người chúc mừng Anna và Duc.", "After the church everyone congratulates Anna and Duc."),
  ("N", "Beim Mittagessen hält Annas Vater eine Rede. Er erzählt viel darüber, wie Anna als Kind war.", "Trong bữa trưa, bố Anna phát biểu. Ông kể nhiều về chuyện Anna hồi nhỏ thế nào.", "At lunch Anna's father gives a speech. He talks a lot about what Anna was like as a child."),
  ("A", "Anna wollte immer alles allein machen. Und sie hat nie gern ein Spiel verloren!", "Anna lúc nào cũng muốn tự làm mọi thứ. Và nó chưa bao giờ chịu thua trò chơi nào!", "Anna always wanted to do everything on her own. And she never liked losing a game!"),
  ("N", "Alle lachen. Duc lacht auch, aber er versteht nicht alles.", "Mọi người cười ồ. Duc cũng cười, nhưng anh không hiểu hết.", "Everyone laughs. Duc laughs too, but he doesn't understand everything."),
  ("N", "Zwar lernt er Deutsch, aber der Vater spricht sehr schnell. Später erklärt Anna ihm alles noch einmal.", "Tuy anh đang học tiếng Đức, nhưng bố cô nói rất nhanh. Sau đó Anna giải thích lại hết cho anh.", "He is learning German, but her father speaks very fast. Later Anna explains everything to him again."),
  ("N", "Am Abend gibt es Musik. Die Gäste tanzen wie in einer Disco. Sogar die Oma will mitmachen.", "Buổi tối có nhạc. Khách khứa nhảy như ở vũ trường. Ngay cả bà cũng muốn tham gia.", "In the evening there is music. The guests dance as if in a club. Even Grandma wants to join in."),
  ("N", "Spät bringt der Kellner einen großen Kuchen mit viel Schokolade. Er schmeckt ein bisschen bitter.", "Muộn hơn, người phục vụ mang ra một chiếc bánh lớn với nhiều sô-cô-la. Bánh hơi đắng.", "Late on, the waiter brings a big cake with lots of chocolate. It tastes a little bitter."),
  ("N", "Duc teilt den Kuchen mit allen Gästen.", "Duc chia bánh cho tất cả khách.", "Duc shares the cake with all the guests."),
  ("B", "Das ist der schönste Tag in meinem Leben.", "Đây là ngày đẹp nhất trong đời em.", "This is the most beautiful day of my life."),
  ("A", "Für mich auch. Ich hoffe, alle unsere Tage werden genauso schön.", "Với anh cũng vậy. Anh mong mọi ngày của chúng ta đều đẹp như thế.", "For me too. I hope all our days will be just as lovely."),
  ("N", "Erst sehr spät enden die Party und der Tag.", "Mãi rất khuya bữa tiệc và ngày hôm ấy mới kết thúc.", "Only very late do the party and the day come to an end.")],
 [("locate", "Đám cưới tổ chức ở đâu?", "Where is the wedding?", [("Ở một khách sạn bên hồ", "At a hotel by a lake"), ("Ở nhà bố mẹ Anna", "At Anna's parents' house"), ("Ở Việt Nam", "In Vietnam")], 0),
  ("locate", "Chiếc nhẫn ở đâu?", "Where is the ring?", [("Trong túi của Anna", "In Anna's bag"), ("Trong túi áo khoác của Duc", "In Duc's jacket"), ("Trong nhà thờ", "In the church")], 1),
  ("infer", "Vì sao Duc không hiểu hết bài phát biểu?", "Why doesn't Duc understand the whole speech?", [("Vì nhạc quá to", "Because the music is too loud"), ("Vì anh đang mải ăn bánh", "Because he is busy eating cake"), ("Vì bố của Anna nói rất nhanh", "Because Anna's father speaks very fast")], 2)],
 names=["Anna", "Duc", "Deutschland", "Vietnam"], token_map={"annas": "name", "schönste": "schön"}))

lib.write_batch("24", S)
