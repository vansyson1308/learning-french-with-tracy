import importlib.util
spec = importlib.util.spec_from_file_location("lib", r"C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-app-hoc-ngoai-ngu\82ea6b33-e22d-4a2d-907b-9b4441f9e202\scratchpad\de-stories-lib.py")
lib = importlib.util.module_from_spec(spec); spec.loader.exec_module(lib)
story = lib.story

S = []
S.append(story("die_einladung_zum_grillen", "A1-2", "Die Einladung zum Grillen",
 ("Đồng nghiệp mời Hùng và vợ đến dự tiệc nướng. Hùng lo không biết mặc gì và mang gì — rồi mọi chuyện diễn ra thật tự nhiên.", "A colleague invites Hung and his wife to a barbecue. Hung worries about what to wear and bring — then everything goes naturally."),
 ["Hemd", "Jacke", "Sommer"],
 [("N", "Am Mittwoch bekommt Hung eine Einladung von seiner Kollegin Petra.", "Thứ Tư Hùng nhận được lời mời từ đồng nghiệp Petra.", "On Wednesday Hung gets an invitation from his colleague Petra."),
  ("B", "Am Samstag grillen wir im Garten. Kommst du mit deiner Frau?", "Thứ Bảy nhà mình nướng thịt trong vườn. Anh đến cùng vợ nhé?", "On Saturday we're having a barbecue in the garden. Will you come with your wife?"),
  ("A", "Gern! Danke für die Einladung. Um wie viel Uhr?", "Rất sẵn lòng! Cảm ơn lời mời. Mấy giờ vậy?", "Gladly! Thanks for the invitation. What time?"),
  ("B", "Am Mittag, um zwölf Uhr. Wir essen zusammen zu Mittag und bleiben bis zum Abendessen.", "Buổi trưa, lúc mười hai giờ. Mọi người ăn trưa cùng nhau và ở lại đến bữa tối.", "At midday, at twelve. We'll have lunch together and stay until dinner."),
  ("N", "Zu Hause erzählt Hung seiner Ehefrau Mai von der Einladung.", "Về nhà Hùng kể với vợ là Mai về lời mời.", "At home Hung tells his wife Mai about the invitation."),
  ("A", "Was ziehen wir an? Und was sollen wir mitbringen?", "Mình mặc gì đây? Và nên mang gì đến?", "What shall we wear? And what should we bring?"),
  ("B", "Keine Sorge. Im Sommer ist die Kleidung beim Grillen ganz normal.", "Đừng lo. Mùa hè đi tiệc nướng thì mặc bình thường thôi.", "Don't worry. In summer people wear normal clothes at a barbecue."),
  ("B", "Wir bringen einen Salat mit und eine Flasche Wein.", "Mình mang một đĩa xà lách và một chai rượu vang.", "We'll bring a salad and a bottle of wine."),
  ("N", "Am Samstag macht Mai am Vormittag den Salat.", "Thứ Bảy Mai làm món xà lách vào buổi sáng.", "On Saturday Mai makes the salad in the morning."),
  ("N", "Hung zieht ein schwarzes Hemd an. Aber dann möchte er es wieder ausziehen und nimmt ein Hemd mit Blumen.", "Hùng mặc một chiếc áo sơ mi đen. Nhưng rồi anh lại muốn cởi ra và chọn một chiếc áo có hoa.", "Hung puts on a black shirt. But then he wants to take it off again and picks a shirt with flowers."),
  ("B", "Das sieht gut aus!", "Trông được đấy!", "That looks good!"),
  ("N", "Um zwölf Uhr sind sie bei Petra. Ihr Ehemann Klaus grillt schon das Fleisch.", "Mười hai giờ họ đến nhà Petra. Chồng chị là Klaus đang nướng thịt.", "At twelve they are at Petra's. Her husband Klaus is already grilling the meat."),
  ("A", "Guten Tag! Schön, Sie kennenzulernen.", "Xin chào! Rất vui được làm quen.", "Hello! Nice to meet you."),
  ("N", "Klaus lacht und sagt: Bei uns sagen alle du. Ich bin Klaus!", "Klaus cười và nói: Ở nhà tôi ai cũng xưng hô thân mật. Tôi là Klaus!", "Klaus laughs and says: Here everyone says du. I'm Klaus!"),
  ("N", "Auf dem Tisch stehen Teller, Gläser, Messer, Gabeln und Löffel.", "Trên bàn có đĩa, ly, dao, nĩa và thìa.", "On the table there are plates, glasses, knives, forks and spoons."),
  ("N", "Es gibt Brot mit Butter, Wurst, Fleisch und Gemüse.", "Có bánh mì phết bơ, xúc xích, thịt và rau.", "There is bread and butter, sausages, meat and vegetables."),
  ("B", "Guten Appetit!", "Chúc mọi người ngon miệng!", "Enjoy your meal!"),
  ("N", "Nach dem Essen spielen alle zusammen Ball im Garten. Hung macht auch mit.", "Ăn xong mọi người cùng chơi bóng trong vườn. Hùng cũng tham gia.", "After the meal everyone plays ball together in the garden. Hung joins in too."),
  ("N", "Klaus fragt Hung nach seinem Hobby.", "Klaus hỏi Hùng về sở thích của anh.", "Klaus asks Hung about his hobby."),
  ("A", "In meiner Freizeit koche ich gern. Vielleicht grillen wir nächstes Mal bei uns?", "Lúc rảnh tôi thích nấu ăn. Lần sau có lẽ mình nướng thịt ở nhà tôi nhé?", "In my free time I like cooking. Maybe next time we'll have a barbecue at our place?"),
  ("N", "Am Abend ziehen Hung und Mai ihre Jacken an.", "Buổi tối Hùng và Mai mặc áo khoác vào.", "In the evening Hung and Mai put on their jackets."),
  ("A", "Vielen Dank für alles! Auf Wiedersehen!", "Cảm ơn mọi người về tất cả! Tạm biệt!", "Thank you for everything! Goodbye!"),
  ("B", "Tschüss! Und viele Grüße an deine Familie!", "Tạm biệt! Gửi lời chào đến gia đình anh nhé!", "Bye! And best wishes to your family!")],
 [("locate", "Hùng và Mai mang gì đến?", "What do Hung and Mai bring?", [("Một đĩa xà lách và một chai rượu vang", "A salad and a bottle of wine"), ("Thịt và xúc xích", "Meat and sausages"), ("Một cái bánh", "A cake")], 0),
  ("locate", "Ai đang nướng thịt?", "Who is grilling the meat?", [("Petra", "Petra"), ("Klaus, chồng của Petra", "Klaus, Petra's husband"), ("Mai", "Mai")], 1),
  ("infer", "Vì sao Klaus cười khi Hùng chào rất lịch sự?", "Why does Klaus laugh when Hung greets him very politely?", [("Vì Hùng mặc áo có hoa", "Because Hung wears a flowery shirt"), ("Vì Hùng đến muộn", "Because Hung is late"), ("Vì ở nhà Klaus mọi người xưng hô thân mật", "Because at Klaus's place everyone uses du")], 2)],
 names=["Hung", "Petra", "Mai", "Klaus"], token_map={"zieht": "anziehen", "ziehen": "anziehen", "kennenzulernen": "kennenlernen", "gläser": "Glas", "kollegin": "Kollege", "grillt": "grillen"}))

lib.write_batch("16", S)
