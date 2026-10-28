import importlib.util
spec = importlib.util.spec_from_file_location("lib", r"C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-app-hoc-ngoai-ngu\82ea6b33-e22d-4a2d-907b-9b4441f9e202\scratchpad\de-stories-lib.py")
lib = importlib.util.module_from_spec(spec); spec.loader.exec_module(lib)
story = lib.story

S = []
S.append(story("krank_im_bett", "A2-1", "Krank im Bett",
 ("Herr Wagner bị ốm. Bác sĩ khuyên ông nghỉ ngơi và bỏ thuốc lá — nhưng điều khó nhất là phải nằm yên.", "Mr Wagner is ill. The doctor tells him to rest and give up smoking — but the hardest thing is lying still."),
 ["Medizin", "Pille", "husten", "langweilig"],
 [("N", "Herr Wagner steht am Montag nicht auf. Er fühlt sich sehr schlecht.", "Thứ Hai ông Wagner không dậy nổi. Ông thấy trong người rất mệt.", "On Monday Mr Wagner doesn't get up. He feels very bad."),
  ("N", "Sein Kopf tut weh, er hustet, und er hat Fieber.", "Ông đau đầu, ho, và bị sốt.", "His head hurts, he coughs, and he has a fever."),
  ("B", "Du musst zum Arzt gehen!", "Anh phải đi bác sĩ!", "You must go to the doctor!"),
  ("N", "Das sagt seine Ehefrau.", "Vợ ông nói vậy.", "His wife says that."),
  ("N", "In der Praxis wartet er eine Stunde. Dann ruft die Ärztin ihn ins Zimmer.", "Ở phòng khám ông đợi một tiếng. Rồi bà bác sĩ gọi ông vào phòng.", "At the practice he waits an hour. Then the doctor calls him into the room."),
  ("N", "Sie schaut in seinen Mund, in die Nase und in die Ohren.", "Bà xem miệng, mũi và tai của ông.", "She looks in his mouth, his nose and his ears."),
  ("N", "Dann misst sie das Fieber und fragt nach seinem Gewicht.", "Rồi bà đo nhiệt độ và hỏi cân nặng của ông.", "Then she takes his temperature and asks about his weight."),
  ("B", "Rauchen Sie?", "Ông có hút thuốc không?", "Do you smoke?"),
  ("A", "Ja, zehn Zigaretten am Tag.", "Có, mười điếu một ngày.", "Yes, ten cigarettes a day."),
  ("B", "Das ist nicht gut für Ihren Körper. Sie sollen aufhören.", "Như thế không tốt cho cơ thể ông. Ông nên bỏ đi.", "That's not good for your body. You should stop."),
  ("B", "Jetzt brauchen Sie Ruhe. Bleiben Sie drei Tage im Bett und trinken Sie viel Tee.", "Giờ ông cần nghỉ ngơi. Ông nằm nghỉ ba ngày và uống nhiều trà.", "Now you need rest. Stay in bed for three days and drink lots of tea."),
  ("N", "Sie gibt ihm Medizin für den Husten und eine Pille für das Fieber.", "Bà cho ông thuốc ho và một viên thuốc hạ sốt.", "She gives him cough medicine and a pill for the fever."),
  ("N", "Zu Hause liegt Herr Wagner im Bett. Seine Frau bringt ihm eine Tasse Tee.", "Ở nhà ông Wagner nằm trên giường. Vợ ông mang cho ông một tách trà.", "At home Mr Wagner lies in bed. His wife brings him a cup of tea."),
  ("N", "Am ersten Tag schläft er viel.", "Ngày đầu tiên ông ngủ rất nhiều.", "On the first day he sleeps a lot."),
  ("N", "Am nächsten Tag ist ihm langweilig. Er möchte aufstehen und arbeiten.", "Hôm sau ông thấy chán. Ông muốn dậy và làm việc.", "The next day he is bored. He wants to get up and work."),
  ("B", "Nein! Die Ärztin hat gesagt: drei Tage Ruhe.", "Không được! Bác sĩ đã nói: nghỉ ba ngày.", "No! The doctor said: three days' rest."),
  ("N", "Noch einen Tag später geht es ihm besser. Das Fieber ist weg.", "Một ngày sau nữa ông thấy khỏe hơn. Hết sốt rồi.", "One day later he feels better. The fever is gone."),
  ("A", "Weißt du was? Ich höre wirklich mit dem Rauchen auf.", "Em biết không? Anh sẽ bỏ thuốc thật đấy.", "You know what? I'm really going to stop smoking."),
  ("B", "Das ist die beste Medizin von allen!", "Đó là liều thuốc tốt nhất!", "That's the best medicine of all!")],
 [("locate", "Ông Wagner hút bao nhiêu điếu thuốc một ngày?", "How many cigarettes does Mr Wagner smoke a day?", [("Ba điếu", "Three"), ("Mười điếu", "Ten"), ("Hai mươi điếu", "Twenty")], 1),
  ("locate", "Bác sĩ bảo ông nằm nghỉ bao lâu?", "How long does the doctor tell him to stay in bed?", [("Ba ngày", "Three days"), ("Một tuần", "A week"), ("Một ngày", "One day")], 0),
  ("infer", "Vì sao vợ ông nói đó là liều thuốc tốt nhất?", "Why does his wife say that is the best medicine?", [("Vì thuốc của bác sĩ rất đắt", "Because the doctor's medicine is expensive"), ("Vì trà rất ngon", "Because the tea is very good"), ("Vì bỏ thuốc lá sẽ tốt cho sức khỏe của ông", "Because giving up smoking will be good for his health")], 2)],
 names=["Wagner"], token_map={"weh": "tun", "ärztin": "Arzt", "beste": "gut", "besser": "gut"}))

lib.write_batch("13", S)
