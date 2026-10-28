import importlib.util
spec = importlib.util.spec_from_file_location("lib", r"C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-app-hoc-ngoai-ngu\82ea6b33-e22d-4a2d-907b-9b4441f9e202\scratchpad\de-stories-lib.py")
lib = importlib.util.module_from_spec(spec); spec.loader.exec_module(lib)
story = lib.story

S = []
S.append(story("der_geist_im_schloss", "A1-2", "Der Geist im Schloss",
 ("Một nhóm khách tham quan lâu đài cũ. Người hướng dẫn kể chuyện về một hồn ma — rồi đèn bỗng tắt.", "A group visits an old castle. The guide tells a story about a ghost — then suddenly the lights go out."),
 ["Schloss", "Ton", "Maske", "Euro"],
 [("N", "Am Samstag macht eine Gruppe eine Führung durch ein altes Schloss.", "Thứ Bảy một nhóm khách đi tham quan có hướng dẫn trong một tòa lâu đài cổ.", "On Saturday a group takes a guided tour through an old castle."),
  ("N", "Der Eintritt kostet zehn Euro. Der Fahrer vom Bus wartet draußen.", "Vé vào cửa mười euro. Tài xế xe buýt đợi ở bên ngoài.", "Admission is ten euros. The bus driver waits outside."),
  ("N", "Die Frau von der Führung heißt Frau Krone. Sie erzählt die Geschichte vom Schloss.", "Người hướng dẫn tên là bà Krone. Bà kể lịch sử của tòa lâu đài.", "The guide is called Ms Krone. She tells the history of the castle."),
  ("B", "Vor vielen Jahren gab es hier einen Krieg. Ein junger König ist in diesem Zimmer gestorben.", "Nhiều năm trước ở đây có chiến tranh. Một vị vua trẻ đã chết trong căn phòng này.", "Many years ago there was a war here. A young king died in this room."),
  ("B", "Die Leute sagen: Seine Seele ist nie gegangen. Sein Geist lebt noch hier.", "Người ta bảo: linh hồn của ngài chưa bao giờ rời đi. Hồn ma của ngài vẫn còn ở đây.", "People say: his soul never left. His ghost still lives here."),
  ("N", "Einige Leute lachen. Ein Junge sagt: So ein Zeug glaube ich überhaupt nicht!", "Vài người bật cười. Một cậu bé nói: Mấy chuyện đó cháu chẳng tin chút nào!", "Some people laugh. A boy says: I don't believe that stuff at all!"),
  ("N", "Genau in diesem Augenblick geht das Licht aus. Alles ist völlig dunkel.", "Đúng lúc đó đèn tắt. Mọi thứ tối om.", "At that very moment the light goes out. Everything is completely dark."),
  ("N", "Eine Sekunde, zwei Sekunden — niemand sagt etwas.", "Một giây, hai giây — không ai nói gì.", "One second, two seconds — nobody says anything."),
  ("N", "Dann hört man einen komischen Ton und dann laute Worte: Wer ist in meinem Zimmer?", "Rồi có một âm thanh lạ, sau đó là tiếng nói to: Kẻ nào đang ở trong phòng của ta?", "Then a strange sound is heard, then loud words: Who is in my room?"),
  ("N", "Eine alte Dame sagt laut: Mein Gott! Ein Teufel!", "Một bà cụ hét lên: Lạy Chúa! Ma quỷ!", "An old lady screams: My God! A devil!"),
  ("B", "Achtung! Bitte bleiben Sie ruhig. Keine Bewegung!", "Chú ý! Xin mọi người bình tĩnh. Đừng ai cử động!", "Attention! Please stay calm. Nobody move!"),
  ("N", "Frau Krone macht das Licht von ihrem Handy an. Jetzt sieht man wieder etwas.", "Bà Krone bật đèn điện thoại. Giờ lại nhìn thấy được.", "Ms Krone switches on her phone light. Now you can see something again."),
  ("N", "Der Junge hält seiner Mutter den Arm und sagt nichts mehr.", "Cậu bé níu chặt tay mẹ. Cậu im bặt.", "The boy is holding his mother's arm. He says nothing more."),
  ("N", "Dann geht das Licht wieder an. Neben der Tür steht ein Mann und lacht.", "Rồi đèn sáng trở lại. Cạnh cửa có một người đàn ông đứng cười.", "Then the light comes on again. A man stands next to the door, laughing."),
  ("N", "Es ist der Fahrer vom Bus! Er hat eine Maske in der Hand.", "Đó là anh tài xế xe buýt! Anh cầm một chiếc mặt nạ trong tay.", "It's the bus driver! He has a mask in his hand."),
  ("A", "Entschuldigung! Das war nur ein Spaß. Frau Krone und ich machen das bei jeder Führung.", "Xin lỗi mọi người! Chỉ là đùa thôi. Bà Krone và tôi lần tham quan nào cũng làm vậy.", "Sorry! That was only a joke. Ms Krone and I do it on every tour."),
  ("N", "Zuerst sind die Leute böse. Aber dann lachen alle, sogar die alte Dame.", "Lúc đầu mọi người bực mình. Nhưng rồi ai cũng cười, kể cả bà cụ.", "At first people are angry. But then everyone laughs, even the old lady."),
  ("N", "Nur der Junge lacht nicht. Er schaut noch einmal in das dunkle Zimmer.", "Chỉ có cậu bé là không cười. Cậu nhìn lại căn phòng tối một lần nữa.", "Only the boy doesn't laugh. He looks into the dark room once more."),
  ("N", "Hat er dort etwas gesehen? Das erzählt er niemals jemandem.", "Cậu có nhìn thấy gì ở đó không? Chuyện đó cậu không bao giờ kể với ai.", "Did he see something there? He never tells anyone.")],
 [("locate", "Vé vào cửa giá bao nhiêu?", "How much is admission?", [("Mười euro", "Ten euros"), ("Hai euro", "Two euros"), ("Miễn phí", "Free")], 0),
  ("locate", "Ai đứng cười cạnh cửa khi đèn sáng lại?", "Who is standing by the door laughing when the light comes back?", [("Hồn ma vị vua", "The king's ghost"), ("Anh tài xế xe buýt", "The bus driver"), ("Cậu bé", "The boy")], 1),
  ("infer", "Vì sao cậu bé không cười ở cuối truyện?", "Why doesn't the boy laugh at the end?", [("Vì cậu đói", "Because he is hungry"), ("Vì cậu không thích anh tài xế", "Because he doesn't like the driver"), ("Vì có lẽ cậu đã thấy một điều gì đó trong căn phòng tối", "Because maybe he saw something in the dark room")], 2)],
 names=["Krone"], token_map={"einige": "function", "jemandem": "jemand", "dunkle": "dunkel"}))

lib.write_batch("21", S)
