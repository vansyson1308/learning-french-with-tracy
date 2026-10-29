"""de-vi stories 41-43 (QC 2026-10-29 §1.1-§1.2): three A1-2 stories written with the 690-word A1
syllabus only, closing the context gap of the last 35 syllabus lexemes. Appends to (or replaces in)
content/de/stories/stories.json directly — the course is promoted, there is no staged copy.
usage: python -I de-stories-25.py"""
import importlib.util, json
spec = importlib.util.spec_from_file_location("lib", r"C:\src\lft\content\de\_drafts\_generators\de-stories-lib.py")
lib = importlib.util.module_from_spec(spec); spec.loader.exec_module(lib)
story = lib.story

S = []
S.append(story("die_anmeldung", "A1-2", "Die Anmeldung",
 ("Anh Minh muốn học tiếng Đức và đến đăng ký một khoá học. Cô thư ký giúp anh điền phiếu.", "Minh wants to learn German and goes to sign up for a course. The secretary helps him fill in the form."),
 ["Anrede", "wiederholen", "erlauben", "abgeben", "männlich"],
 [("N", "Herr Tran ist neu in der Stadt. Er will Deutsch lernen.", "Anh Tran mới đến thành phố. Anh muốn học tiếng Đức.", "Mr Tran is new in town. He wants to learn German."),
  ("N", "Heute geht er zur Schule und sucht die Anmeldung.", "Hôm nay anh đến trường và tìm chỗ đăng ký.", "Today he goes to the school and looks for the registration desk."),
  ("A", "Guten Tag! Was kann ich für Sie tun?", "Chào anh! Tôi có thể giúp gì cho anh?", "Good morning! What can I do for you?"),
  ("B", "Guten Tag. Darf ich Sie um Hilfe bitten? Ich will einen Kurs machen.", "Chào chị. Chị giúp tôi được không? Tôi muốn học một khoá.", "Good morning. May I ask you for help? I want to take a course."),
  ("A", "Gern. Sie müssen das Formular ausfüllen.", "Được ạ. Anh cần điền vào phiếu này.", "Of course. You need to fill in the form."),
  ("B", "Das ist leider schwer für mich. Können Sie mir helfen?", "Tiếc là việc đó khó với tôi. Chị giúp tôi được không?", "Unfortunately that's hard for me. Can you help me?"),
  ("A", "Ja, gern. Hier ist die Anrede: Herr oder Frau?", "Vâng. Đây là phần xưng hô: ông hay bà?", "Yes, of course. Here is the form of address: Mr or Mrs?"),
  ("B", "Herr. Also männlich.", "Ông. Tức là nam.", "Mr. So, male."),
  ("A", "Richtig. Und Ihr Vorname und Ihr Familienname?", "Đúng rồi. Còn tên và họ của anh?", "Right. And your first name and your surname?"),
  ("B", "Mein Vorname ist Minh, mein Familienname ist Tran.", "Tên tôi là Minh, họ là Tran.", "My first name is Minh, my surname is Tran."),
  ("A", "Wie bitte? Können Sie das bitte wiederholen?", "Xin lỗi, gì cơ? Anh nhắc lại được không?", "Sorry? Could you repeat that, please?"),
  ("B", "Ja, gern. Minh Tran.", "Vâng. Minh Tran.", "Yes, sure. Minh Tran."),
  ("A", "Danke. Und woher kommen Sie?", "Cảm ơn anh. Anh từ đâu đến?", "Thank you. And where are you from?"),
  ("B", "Ich komme aus Vietnam. Ich bin seit einem Monat hier.", "Tôi đến từ Việt Nam. Tôi ở đây được một tháng.", "I'm from Vietnam. I've been here for a month."),
  ("A", "Und Ihr Beruf? Was machen Sie?", "Còn nghề nghiệp của anh? Anh làm gì?", "And your job? What do you do?"),
  ("B", "Ich arbeite in einem Restaurant. Meine Frau ist Hausfrau.", "Tôi làm ở một nhà hàng. Vợ tôi ở nhà nội trợ.", "I work in a restaurant. My wife is a homemaker."),
  ("B", "Meine Frau will auch Deutsch lernen. Ist das möglich?", "Vợ tôi cũng muốn học tiếng Đức. Có được không?", "My wife wants to learn German too. Is that possible?"),
  ("A", "Ja, das ist möglich. Für Ihre Frau müssen Sie hier „weiblich“ ankreuzen.", "Được chứ. Với vợ anh, anh đánh dấu vào ô «nữ» ở đây.", "Yes, that's possible. For your wife you tick “female” here."),
  ("A", "Jetzt fehlt noch etwas: Ihre Unterschrift.", "Giờ còn thiếu một thứ: chữ ký của anh.", "Now one thing is still missing: your signature."),
  ("B", "Hier, bitte. Wo kann ich das Formular abgeben?", "Đây ạ. Tôi nộp phiếu ở đâu?", "Here you are. Where can I hand in the form?"),
  ("A", "Hier bei mir. Der Unterricht beginnt am Montag um neun Uhr.", "Nộp ở chỗ tôi. Lớp học bắt đầu thứ Hai lúc chín giờ.", "Here, with me. Lessons start on Monday at nine o'clock."),
  ("B", "Darf ich im Kurs mein Handy benutzen?", "Trong lớp tôi có được dùng điện thoại không?", "May I use my mobile phone in the course?"),
  ("A", "Das erlauben wir leider nicht. Aber Sie dürfen ein Buch mitbringen.", "Tiếc là chúng tôi không cho phép. Nhưng anh được mang theo sách.", "I'm afraid we don't allow that. But you may bring a book."),
  ("B", "Gut. Vielen Dank! Bis Montag!", "Được ạ. Cảm ơn chị nhiều! Hẹn thứ Hai!", "Fine. Thank you very much! See you on Monday!"),
  ("N", "Am Montag ist Herr Tran pünktlich da. Seine Frau ist auch da.", "Thứ Hai anh Tran có mặt đúng giờ. Vợ anh cũng đến.", "On Monday Mr Tran is there on time. His wife is there too."),
  ("N", "Im Kurs sind viele ausländische Leute. Die Leute wollen Deutsch lernen.", "Trong lớp có nhiều người nước ngoài. Mọi người đều muốn học tiếng Đức.", "There are many foreign people in the course. They want to learn German.")],
 [("locate", "Anh Minh làm việc ở đâu?", "Where does Minh work?", [("Ở một trường học", "At a school"), ("Ở một nhà hàng", "In a restaurant"), ("Ở nhà", "At home")], 1),
  ("locate", "Lớp học bắt đầu khi nào?", "When do the lessons start?", [("Thứ Hai lúc chín giờ", "On Monday at nine"), ("Thứ Bảy lúc tám giờ", "On Saturday at eight"), ("Hôm nay", "Today")], 0),
  ("infer", "Trong lớp, anh Minh không được làm gì?", "What may Minh not do in the course?", [("Mang theo sách", "Bring a book"), ("Đi cùng vợ", "Come with his wife"), ("Dùng điện thoại", "Use his phone")], 2)],
 names=["Tran", "Minh", "Vietnam", "Deutsch"],
 token_map={"sie": "de:w:sie-pronoun", "ihr": "de:w:ihr-determiner", "ihre": "de:w:ihr-determiner", "meine": "mein"}))

S.append(story("der_umzug", "A1-2", "Der Umzug",
 ("Lena chuyển đến căn hộ mới. Bạn cô là Jonas đến giúp, nhưng cái tủ quá to.", "Lena moves into a new flat. Her friend Jonas helps, but the wardrobe is too big."),
 ["umziehen", "aussehen", "automatisch", "Größe"],
 [("N", "Am Samstag muss Lena umziehen. Die neue Wohnung ist in der Stadt.", "Thứ Bảy Lena phải chuyển nhà. Căn hộ mới ở trong thành phố.", "On Saturday Lena has to move. The new flat is in town."),
  ("A", "Jonas, kannst du mir am Samstag helfen? Ich habe viele Möbel.", "Jonas, thứ Bảy cậu giúp tớ được không? Tớ có nhiều đồ đạc lắm.", "Jonas, can you help me on Saturday? I have lots of furniture."),
  ("B", "Klar! Was willst du mitnehmen?", "Tất nhiên! Cậu muốn mang theo những gì?", "Sure! What do you want to take?"),
  ("A", "Alles: das Sofa, den Tisch und den Schrank.", "Tất cả: ghế sofa, cái bàn và cái tủ.", "Everything: the sofa, the table and the wardrobe."),
  ("B", "Willst du dort auch fernsehen?", "Ở đó cậu cũng định xem tivi à?", "Do you want to watch TV there too?"),
  ("A", "Nein. Ich lese jetzt viel.", "Không. Giờ tớ đọc sách nhiều.", "No. I read a lot now."),
  ("N", "Am Samstag kommen Jonas und Lena um sieben Uhr.", "Thứ Bảy Jonas và Lena đến lúc bảy giờ.", "On Saturday Jonas and Lena arrive at seven o'clock."),
  ("N", "Die Wohnung ist klein, aber hell. Sie hat ein Schlafzimmer, eine Küche und einen großen Raum.", "Căn hộ nhỏ nhưng sáng. Có một phòng ngủ, một bếp và một phòng lớn.", "The flat is small but bright. It has a bedroom, a kitchen and a big room."),
  ("A", "Mit neuen Farben kann die Küche schön aussehen.", "Sơn màu mới thì căn bếp sẽ trông đẹp.", "With new colours the kitchen can look nice."),
  ("N", "Aber ein Teil der Möbel ist zu groß.", "Nhưng một phần đồ đạc lại quá to.", "But some of the furniture is too big."),
  ("B", "Der Schrank hat die falsche Größe. Er geht nicht durch die Tür.", "Cái tủ không vừa kích cỡ. Nó không lọt qua cửa.", "The wardrobe is the wrong size. It won't go through the door."),
  ("A", "Und was machen wir jetzt?", "Thế giờ mình làm gì?", "So what do we do now?"),
  ("B", "Wir können den Schrank verkaufen. Ich empfehle das Internet.", "Mình có thể bán cái tủ. Tớ khuyên đăng lên mạng.", "We can sell the wardrobe. I recommend the internet."),
  ("N", "Am Abend ist alles in der Wohnung. Lena will das Licht anmachen.", "Buổi tối mọi thứ đã vào căn hộ. Lena muốn bật đèn.", "In the evening everything is in the flat. Lena wants to turn on the light."),
  ("A", "Wo ist hier das Licht?", "Đèn ở đâu nhỉ?", "Where is the light here?"),
  ("B", "Du musst nichts machen. Das Licht geht automatisch an.", "Cậu không phải làm gì cả. Đèn tự động bật.", "You don't have to do anything. The light comes on automatically."),
  ("A", "Wunderbar!", "Tuyệt quá!", "Wonderful!"),
  ("N", "Dann benutzen sie den neuen Herd und kochen Reis mit Gemüse.", "Rồi họ dùng cái bếp mới và nấu cơm với rau.", "Then they use the new cooker and cook rice with vegetables."),
  ("N", "Jonas fragt nach der Adresse.", "Jonas hỏi địa chỉ.", "Jonas asks for the address."),
  ("A", "Die Straße kennst du schon. Und die Zahl an der Tür ist sieben.", "Con đường thì cậu biết rồi. Còn số trên cửa là bảy.", "You already know the street. And the number on the door is seven."),
  ("B", "Sieben, das ist gut. Ich besuche dich bald.", "Bảy, hay đấy. Tớ sẽ sớm đến thăm cậu.", "Seven, that's good. I'll visit you soon.")],
 [("locate", "Căn hộ mới của Lena ở đâu?", "Where is Lena's new flat?", [("Ở trong thành phố", "In town"), ("Ở một ngôi làng", "In a village"), ("Cạnh nhà Jonas", "Next to Jonas's house")], 0),
  ("infer", "Vì sao họ phải bán cái tủ?", "Why do they have to sell the wardrobe?", [("Vì nó cũ", "Because it is old"), ("Vì nó không lọt qua cửa", "Because it won't go through the door"), ("Vì Lena không thích nó", "Because Lena doesn't like it")], 1),
  ("locate", "Số trên cửa nhà Lena là bao nhiêu?", "What is the number on Lena's door?", [("Ba", "Three"), ("Mười hai", "Twelve"), ("Bảy", "Seven")], 2)],
 names=["Lena", "Jonas"]))

S.append(story("die_reise_nach_hamburg", "A1-2", "Die Reise nach Hamburg",
 ("Paul bắt đầu công việc mới ở Hamburg. Sáng hôm sau, chiếc xe của anh biến mất.", "Paul starts a new job in Hamburg. The next morning his car has gone."),
 ["Autobahn", "Blick", "Bauch", "Vorwahl"],
 [("N", "Paul arbeitet zurzeit in Berlin. Morgen will er in Hamburg mit einem neuen Job anfangen.", "Hiện giờ Paul làm việc ở Berlin. Ngày mai anh muốn bắt đầu công việc mới ở Hamburg.", "Paul currently works in Berlin. Tomorrow he wants to start a new job in Hamburg."),
  ("N", "Heute fährt er mit dem Auto über die Autobahn.", "Hôm nay anh lái xe theo đường cao tốc.", "Today he drives along the motorway."),
  ("N", "Am Abend will er seine Mutter anrufen. Aber er weiß die Vorwahl nicht. Er findet sie im Internet.", "Buổi tối anh muốn gọi cho mẹ. Nhưng anh không biết mã vùng. Anh tìm thấy nó trên mạng.", "In the evening he wants to call his mother. But he doesn't know the dialling code. He finds it on the internet."),
  ("A", "Hallo Paul! Wo bist du jetzt?", "Paul đấy à! Giờ con đang ở đâu?", "Hello Paul! Where are you now?"),
  ("B", "Ich bin schon in Hamburg. Ich war sieben Stunden auf der Autobahn.", "Con đến Hamburg rồi. Con đi đường cao tốc mất bảy tiếng.", "I'm already in Hamburg. I was on the motorway for seven hours."),
  ("A", "Und wie ist dein Zimmer?", "Phòng của con thế nào?", "And what's your room like?"),
  ("B", "Klein, aber der Blick ist wunderbar. Ich sehe den Fluss.", "Nhỏ thôi, nhưng cảnh nhìn ra tuyệt lắm. Con thấy cả dòng sông.", "Small, but the view is wonderful. I can see the river."),
  ("A", "Und wann musst du morgen anfangen?", "Thế ngày mai mấy giờ con phải bắt đầu?", "And when do you have to start tomorrow?"),
  ("B", "Um acht Uhr. Aber mit meinem Bauch ist etwas nicht in Ordnung.", "Lúc tám giờ. Nhưng bụng con hơi có vấn đề.", "At eight o'clock. But something is wrong with my stomach."),
  ("A", "Du musst einen Tee trinken und früh schlafen.", "Con phải uống một tách trà rồi đi ngủ sớm.", "You must drink a tea and go to bed early."),
  ("B", "Das mache ich. Gute Nacht!", "Con sẽ làm thế. Mẹ ngủ ngon!", "I'll do that. Good night!"),
  ("N", "Paul muss früh aufstehen. Er geht zur Straße. Aber sein Auto ist weg!", "Paul phải dậy sớm. Anh ra đường. Nhưng xe của anh biến mất rồi!", "Paul has to get up early. He goes out to the street. But his car is gone!"),
  ("B", "Wo ist mein Auto? Es war gestern hier!", "Xe của mình đâu? Hôm qua nó còn ở đây mà!", "Where is my car? It was here yesterday!"),
  ("N", "Ein Schild sagt: Hier dürfen keine Autos stehen.", "Một tấm biển ghi: Ở đây không được đỗ xe.", "A sign says: no cars may stand here."),
  ("N", "Paul hat keine Zeit. Er nimmt ein Taxi. Der Fahrer fährt schnell.", "Paul không có thời gian. Anh bắt taxi. Tài xế lái nhanh.", "Paul has no time. He takes a taxi. The driver drives fast."),
  ("N", "Um acht Uhr ist Paul pünktlich bei der Firma. Sein Chef sagt: Willkommen in Hamburg!", "Đúng tám giờ Paul có mặt ở công ty. Sếp anh nói: Chào mừng đến Hamburg!", "At eight o'clock Paul is at the company on time. His boss says: welcome to Hamburg!"),
  ("N", "Am Abend holt Paul sein Auto. Es kostet viel Geld.", "Buổi tối Paul đi lấy xe. Mất khá nhiều tiền.", "In the evening Paul collects his car. It costs a lot of money."),
  ("A", "Und, wie geht es deinem Bauch?", "Thế bụng con sao rồi?", "So, how is your stomach?"),
  ("B", "Gut! Zurzeit habe ich nur ein Problem: mein Auto.", "Ổn rồi mẹ! Giờ con chỉ có một vấn đề: cái xe.", "Fine! Right now I only have one problem: my car.")],
 [("locate", "Paul tìm mã vùng ở đâu?", "Where does Paul find the dialling code?", [("Trên mạng", "On the internet"), ("Trong một cuốn sách", "In a book"), ("Hỏi mẹ", "He asks his mother")], 0),
  ("infer", "Vì sao xe của Paul biến mất?", "Why has Paul's car gone?", [("Có người lấy trộm", "Someone stole it"), ("Anh đỗ ở chỗ không được đỗ", "He parked where parking isn't allowed"), ("Mẹ anh mượn xe", "His mother borrowed it")], 1),
  ("locate", "Paul đến công ty bằng gì?", "How does Paul get to the company?", [("Bằng xe của anh", "In his own car"), ("Bằng tàu", "By train"), ("Bằng taxi", "By taxi")], 2)],
 names=["Paul", "Berlin", "Hamburg"],
 token_map={"morgen": "de:w:morgen-adverb", "weg": "de:w:weg-adverb"}))

# The cast is A = de_DE-thorsten-high (male), B = de_DE-kerstin-low (female): the stories above were
# drafted with A as the woman (secretary, Lena, the mother), so swap the two speakers.
for st in S:
    for sen in st["sentences"]:
        sen["speaker"] = {"A": "B", "B": "A"}.get(sen["speaker"], sen["speaker"])

P = r"C:\src\lft\content\de\stories\stories.json"
doc = json.load(open(P, encoding="utf-8"))
ids = {s["id"] for s in S}
doc["stories"] = [s for s in doc["stories"] if s["id"] not in ids] + S
open(P, "w", encoding="utf-8", newline="\n").write(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")
print(len(doc["stories"]), "stories")
