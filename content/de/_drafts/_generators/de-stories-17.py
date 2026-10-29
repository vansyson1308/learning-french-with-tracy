import importlib.util
spec = importlib.util.spec_from_file_location("lib", r"C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-app-hoc-ngoai-ngu\82ea6b33-e22d-4a2d-907b-9b4441f9e202\scratchpad\de-stories-lib.py")
lib = importlib.util.module_from_spec(spec); spec.loader.exec_module(lib)
story = lib.story

S = []
S.append(story("beim_amt", "A2-1", "Beim Amt",
 ("Thảo phải đăng ký cư trú ở thành phố mới. Viên chức hơi khó tính, và cô quên mang một thứ quan trọng.", "Thao has to register at the town office in her new city. The official is a little strict, and she has forgotten something important."),
 ["Konto", "Identität", "Vertrag"],
 [("N", "Thao ist seit drei Tagen in Deutschland. Ihre Heimat ist Vietnam.", "Thảo mới đến Đức được ba ngày. Quê hương của cô là Việt Nam.", "Thao has been in Germany for three days. Her home country is Vietnam."),
  ("N", "Heute muss sie sich in der Stadt anmelden. Das ist für alle Ausländer wichtig.", "Hôm nay cô phải đăng ký cư trú ở thành phố. Việc này quan trọng với mọi người nước ngoài.", "Today she has to register in the city. That is important for all foreigners."),
  ("N", "Sie hat es eilig, denn das Büro schließt um zwölf Uhr.", "Cô đang vội, vì văn phòng đóng cửa lúc mười hai giờ.", "She is in a hurry, because the office closes at twelve."),
  ("N", "In der großen Halle warten schon viele Leute. Thao nimmt eine Nummer und setzt sich.", "Trong sảnh lớn đã có nhiều người đang đợi. Thảo lấy số rồi ngồi xuống.", "Many people are already waiting in the big hall. Thao takes a number and sits down."),
  ("N", "Nach einer Stunde ist sie endlich dran. Der Beamte schaut sie ernst an.", "Sau một tiếng cuối cùng cũng đến lượt cô. Viên chức nhìn cô nghiêm nghị.", "After an hour it is finally her turn. The official looks at her seriously."),
  ("A", "Guten Tag. Ihren Ausweis, bitte.", "Xin chào. Cho tôi xem giấy tờ tùy thân.", "Good morning. Your ID, please."),
  ("N", "Thao gibt ihm ihren Pass. Er ist noch fünf Jahre gültig.", "Thảo đưa cho ông hộ chiếu. Hộ chiếu còn hạn năm năm.", "Thao gives him her passport. It is valid for another five years."),
  ("A", "Füllen Sie bitte dieses Formular aus. Schreiben Sie mit einem Kugelschreiber, nicht mit einem Bleistift.", "Xin cô điền vào tờ khai này. Viết bằng bút bi, đừng viết bằng bút chì.", "Please fill in this form. Write with a pen, not with a pencil."),
  ("N", "Auf dem Formular stehen viele Fragen: Wo sind Sie geboren? Sind Sie verheiratet? Sind Sie arbeitslos oder selbstständig?", "Trên tờ khai có rất nhiều câu hỏi: Cô sinh ở đâu? Cô đã kết hôn chưa? Cô thất nghiệp hay tự kinh doanh?", "There are many questions on the form: Where were you born? Are you married? Are you unemployed or self-employed?"),
  ("N", "Thao schreibt langsam. Jeden Buchstaben schreibt sie ganz genau.", "Thảo viết chậm rãi. Cô viết từng chữ cái thật cẩn thận.", "Thao writes slowly. She writes every letter very carefully."),
  ("A", "Und Ihre Adresse? Haben Sie einen Vertrag für die Wohnung?", "Còn địa chỉ của cô? Cô có hợp đồng thuê nhà không?", "And your address? Do you have a contract for the flat?"),
  ("N", "Thao sucht in ihrer Tasche. Der Vertrag ist nicht da! Sie hat ihn zu Hause vergessen.", "Thảo lục túi. Không thấy hợp đồng! Cô đã để quên ở nhà.", "Thao looks in her bag. The contract isn't there! She has left it at home."),
  ("B", "Oh nein! Es tut mir leid. Kann ich morgen noch einmal kommen?", "Ôi không! Tôi xin lỗi. Mai tôi quay lại được không ạ?", "Oh no! I'm sorry. Can I come back tomorrow?"),
  ("N", "Der Beamte denkt kurz nach. Dann lacht er ein bisschen.", "Viên chức suy nghĩ một chút. Rồi ông hơi mỉm cười.", "The official thinks for a moment. Then he smiles a little."),
  ("A", "Haben Sie vielleicht ein Foto von dem Vertrag auf dem Handy?", "Cô có ảnh chụp hợp đồng trong điện thoại không?", "Do you perhaps have a photo of the contract on your phone?"),
  ("N", "Thao schaut nach. Ja! Ihr Vermieter hat ihr ein Foto geschickt.", "Thảo xem lại. Có! Chủ nhà đã gửi cho cô một bức ảnh.", "Thao checks. Yes! Her landlord sent her a photo."),
  ("A", "Gut, das reicht heute. Jetzt sind Sie hier angemeldet. Willkommen in unserer Stadt!", "Được, hôm nay thế là đủ. Giờ cô đã được đăng ký ở đây. Chào mừng cô đến thành phố của chúng tôi!", "Good, that's enough for today. You are now registered here. Welcome to our city!"),
  ("N", "Danach geht Thao zur Bank. Sie möchte ein Konto für ihr Geld.", "Sau đó Thảo đến ngân hàng. Cô muốn mở một tài khoản để giữ tiền.", "After that Thao goes to the bank. She wants an account for her money."),
  ("N", "Dort fragt man wieder nach ihrer Identität und ihrer Adresse. Aber jetzt hat sie alles dabei.", "Ở đó người ta lại hỏi về danh tính và địa chỉ của cô. Nhưng giờ cô đã mang đủ mọi thứ.", "There they ask again about her identity and her address. But now she has everything with her.")],
 [("locate", "Văn phòng đóng cửa lúc mấy giờ?", "When does the office close?", [("Lúc mười hai giờ", "At twelve"), ("Lúc năm giờ", "At five"), ("Lúc mười giờ", "At ten")], 0),
  ("locate", "Thảo quên gì ở nhà?", "What has Thao left at home?", [("Hộ chiếu", "Her passport"), ("Hợp đồng thuê nhà", "The rental contract"), ("Bút bi", "Her pen")], 1),
  ("infer", "Vì sao cuối cùng Thảo vẫn đăng ký được ngay hôm đó?", "Why can Thao still register that day after all?", [("Vì viên chức quen chủ nhà của cô", "Because the official knows her landlord"), ("Vì cô quay về nhà lấy hợp đồng", "Because she went home for the contract"), ("Vì trong điện thoại cô có ảnh chụp hợp đồng", "Because she has a photo of the contract on her phone")], 2)],
 names=["Thao", "Deutschland", "Vietnam"], token_map={"füllen": "ausfüllen", "angemeldet": "anmelden", "geschickt": "schicken"}))

lib.write_batch("17", S)
