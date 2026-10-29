import importlib.util
spec = importlib.util.spec_from_file_location("lib", r"C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-app-hoc-ngoai-ngu\82ea6b33-e22d-4a2d-907b-9b4441f9e202\scratchpad\de-stories-lib.py")
lib = importlib.util.module_from_spec(spec); spec.loader.exec_module(lib)
story = lib.story

S = []
S.append(story("der_flohmarkt", "A2-1", "Der Flohmarkt",
 ("Hai chị em Vy và Nam bán đồ cũ ở chợ trời. Một chiếc máy ảnh hỏng hóa ra lại là món hàng giá trị nhất.", "Sisters Vy and Nam sell old things at the flea market. A broken camera turns out to be the most valuable item."),
 ["Euro", "Kiste", "Stand"],
 [("N", "Am Sonntag gibt es auf dem Platz vor der Kirche einen Markt für alte Sachen.", "Chủ nhật trên quảng trường trước nhà thờ có một phiên chợ đồ cũ.", "On Sunday there is a market for old things in the square in front of the church."),
  ("N", "Vy und ihr Bruder Nam wollen dort alte Sachen verkaufen.", "Vy và em trai Nam muốn bán đồ cũ ở đó.", "Vy and her brother Nam want to sell old things there."),
  ("N", "Sie haben eine große Menge Zeug: Bücher, Spiele, einen Topf, Kleidung und eine alte Kamera.", "Hai chị em có cả đống đồ: sách, trò chơi, một cái nồi, quần áo và một chiếc máy ảnh cũ.", "They have a huge amount of stuff: books, games, a pot, clothes and an old camera."),
  ("N", "Die Kamera ist kaputt. Nam will sie nicht erst reparieren.", "Máy ảnh bị hỏng. Nam không muốn mất công sửa nó trước.", "The camera is broken. Nam doesn't want to repair it first."),
  ("N", "Um sieben Uhr machen sie ihren Stand fertig. Es ist noch dunkel und ziemlich kalt.", "Bảy giờ sáng hai chị em bày xong quầy hàng. Trời vẫn còn tối và khá lạnh.", "At seven they get their stall ready. It is still dark and quite cold."),
  ("N", "Daneben verkauft eine Frau aus der Bäckerei Brötchen. Ein Brötchen kostet nur 50 Cent.", "Bên cạnh có một chị ở tiệm bánh bán bánh mì nhỏ. Mỗi ổ chỉ 50 xu.", "Next to them a woman from the bakery is selling rolls. A roll costs only 50 cents."),
  ("N", "Die ersten Kunden kommen. Eine Dame fragt nach dem Preis für den Topf.", "Những vị khách đầu tiên đến. Một quý bà hỏi giá cái nồi.", "The first customers arrive. A lady asks the price of the pot."),
  ("B", "Fünf Euro. Er ist echt gut und noch ganz neu.", "Năm euro ạ. Nó tốt thật sự và vẫn còn mới tinh.", "Five euros. It's really good and still quite new."),
  ("N", "Die Dame bietet drei Euro an. Vy lacht und sagt: Gut, vier!", "Quý bà trả ba euro. Vy cười và nói: Thôi được, bốn ạ!", "The lady offers three euros. Vy laughs and says: All right, four!"),
  ("N", "Am Mittag haben sie schon viel verkauft. In ihrer Kasse sind schon 90 Euro.", "Đến trưa hai chị em đã bán được nhiều. Trong hộp tiền đã có 90 euro.", "By midday they have sold a lot. There are already 90 euros in their cash box."),
  ("N", "Dann kommt ein alter Mann. Er nimmt die kaputte Kamera und schaut sie lange an.", "Rồi một ông lão đến. Ông cầm chiếc máy ảnh hỏng lên và ngắm nó rất lâu.", "Then an old man comes. He picks up the broken camera and looks at it for a long time."),
  ("A", "Wieso verkaufen Sie diese Kamera? Wissen Sie, wie alt sie ist?", "Sao các cháu lại bán chiếc máy ảnh này? Các cháu có biết nó bao nhiêu tuổi không?", "Why are you selling this camera? Do you know how old it is?"),
  ("B", "Nein, keine Ahnung. Sie funktioniert nicht.", "Dạ không, cháu không biết. Nó không chạy được ạ.", "No, no idea. It doesn't work."),
  ("A", "Sie ist über sechzig Jahre alt. Für mich ist sie sehr wichtig. Ich biete Ihnen 80 Euro.", "Nó đã hơn sáu mươi năm tuổi. Với ta nó rất quan trọng. Ta trả các cháu 80 euro.", "It's over sixty years old. To me it's very important. I'll offer you 80 euros."),
  ("N", "Vy und Nam können es kaum glauben.", "Vy và Nam gần như không tin nổi.", "Vy and Nam can hardly believe it."),
  ("A", "Ich repariere alte Kameras. Das ist mein Hobby.", "Ta sửa máy ảnh cũ. Đó là sở thích của ta.", "I repair old cameras. That's my hobby."),
  ("N", "Am Abend schauen sie noch einmal in ihre Kasse. Zusammen haben sie 180 Euro.", "Buổi tối hai chị em xem lại hộp tiền. Tổng cộng 180 euro.", "In the evening they look in their cash box again. Together they have 180 euros."),
  ("A", "Wenigstens war das frühe Aufstehen eine gute Idee!", "Ít ra thì dậy sớm cũng là ý hay!", "At least getting up early was a good idea!"),
  ("N", "Am Ende tragen sie nur noch die Kiste nach Hause.", "Cuối cùng hai chị em chỉ còn khiêng cái thùng về nhà.", "In the end they only carry the box home.")],
 [("locate", "Một ổ bánh mì nhỏ giá bao nhiêu?", "How much does a roll cost?", [("50 xu", "50 cents"), ("Một euro", "One euro"), ("Năm euro", "Five euros")], 0),
  ("locate", "Ông lão trả bao nhiêu cho chiếc máy ảnh?", "How much does the old man offer for the camera?", [("Bốn euro", "Four euros"), ("80 euro", "80 euros"), ("Một trăm euro", "A hundred euros")], 1),
  ("infer", "Vì sao ông lão muốn mua chiếc máy ảnh hỏng?", "Why does the old man want the broken camera?", [("Vì ông muốn tặng cháu", "Because he wants to give it to his grandson"), ("Vì nó rẻ", "Because it's cheap"), ("Vì nó rất cũ và ông thích sửa máy ảnh cũ", "Because it's very old and he likes repairing old cameras")], 2)],
 names=["Vy", "Nam"], token_map={"bietet": "anbieten", "biete": "anbieten", "frühe": "früh"}))

lib.write_batch("20", S)
