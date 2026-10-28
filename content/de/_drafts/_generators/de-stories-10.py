import importlib.util
spec = importlib.util.spec_from_file_location("lib", r"C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-app-hoc-ngoai-ngu\82ea6b33-e22d-4a2d-907b-9b4441f9e202\scratchpad\de-stories-lib.py")
lib = importlib.util.module_from_spec(spec); spec.loader.exec_module(lib)
story = lib.story

S = []
S.append(story("im_restaurant", "A1-2", "Im Restaurant",
 ("Hai người bạn đi ăn tối. Người phục vụ mang nhầm món — và hóa đơn làm họ bất ngờ.", "Two friends go out for dinner. The waiter brings the wrong dish — and the bill is a surprise."),
 ["Euro", "Runde", "Stimmung"],
 [("N", "Am Freitag gehen Hoa und Lukas in ein kleines Lokal in der Stadt. Die Stimmung ist super.", "Thứ Sáu Hoa và Lukas đến một quán ăn nhỏ trong thành phố. Không khí rất vui.", "On Friday Hoa and Lukas go to a small restaurant in town. The atmosphere is great."),
  ("N", "Der Kellner bringt die Speisekarte.", "Người phục vụ mang thực đơn đến.", "The waiter brings the menu."),
  ("A", "Guten Abend! Was möchten Sie trinken?", "Chào buổi tối! Hai bạn muốn uống gì?", "Good evening! What would you like to drink?"),
  ("B", "Ich habe großen Durst. Ein Wasser, bitte, und dann einen Saft.", "Tôi khát lắm. Cho tôi một ly nước, rồi một ly nước ép.", "I'm very thirsty. A water, please, and then a juice."),
  ("N", "Lukas nimmt ein Bier.", "Lukas gọi một ly bia.", "Lukas orders a beer."),
  ("N", "Dann lesen sie die Speisekarte genau.", "Rồi họ đọc kỹ thực đơn.", "Then they read the menu carefully."),
  ("B", "Ich esse kein Fleisch. Ich nehme den Salat mit Ei und Kartoffeln.", "Tôi không ăn thịt. Tôi gọi món xà lách với trứng và khoai tây.", "I don't eat meat. I'll have the salad with egg and potatoes."),
  ("A", "Und ich nehme das Hähnchen mit Pommes.", "Còn tôi gọi gà với khoai tây chiên.", "And I'll have the chicken with chips."),
  ("N", "Nach zwanzig Minuten bringt der Kellner das Essen.", "Hai mươi phút sau người phục vụ mang đồ ăn ra.", "After twenty minutes the waiter brings the food."),
  ("N", "Aber auf Hoas Teller liegen Wurst und Schinken!", "Nhưng trên đĩa của Hoa lại là xúc xích và giăm bông!", "But on Hoa's plate there are sausage and ham!"),
  ("B", "Entschuldigung, das ist falsch. Ich habe den Salat ohne Fleisch bestellt.", "Xin lỗi, nhầm rồi. Tôi đã gọi món xà lách không thịt.", "Excuse me, this is wrong. I ordered the salad without meat."),
  ("A", "Oh, das tut mir sehr leid! Ich bringe Ihnen sofort den Salat.", "Ôi, tôi rất xin lỗi! Tôi mang món xà lách ra ngay.", "Oh, I'm very sorry! I'll bring you the salad at once."),
  ("N", "Fünf Minuten später kommt der Salat. Er schmeckt wunderbar.", "Năm phút sau món xà lách được mang ra. Rất ngon.", "Five minutes later the salad arrives. It tastes wonderful."),
  ("N", "Zum Schluss möchte Lukas bezahlen.", "Cuối cùng Lukas muốn thanh toán.", "At the end Lukas wants to pay."),
  ("A", "Die Rechnung, bitte!", "Cho tôi hóa đơn!", "The bill, please!"),
  ("N", "Der Kellner kommt mit der Rechnung, aber er lacht.", "Người phục vụ mang hóa đơn đến, nhưng anh cười.", "The waiter comes with the bill, but he is laughing."),
  ("A", "Das Essen von Ihnen kostet heute nichts. Das war unser Fehler.", "Hôm nay món của cô miễn phí. Đó là lỗi của chúng tôi.", "Your meal is free today. That was our mistake."),
  ("A", "Und die Getränke? Die gehen auch auf uns. Diese Runde zahlt der Koch!", "Còn đồ uống? Cũng do quán mời. Lượt này đầu bếp trả!", "And the drinks? They're on us too. This round is on the cook!"),
  ("N", "Hoa und Lukas können es kaum glauben. Lukas gibt dem Kellner zehn Euro.", "Hoa và Lukas gần như không tin nổi. Lukas đưa cho người phục vụ mười euro.", "Hoa and Lukas can hardly believe it. Lukas gives the waiter ten euros."),
  ("B", "So einen Abend vergessen wir nie!", "Một buổi tối như thế này bọn mình sẽ không bao giờ quên!", "We'll never forget an evening like this!"),
  ("A", "Wir kommen bestimmt wieder.", "Chắc chắn chúng ta sẽ quay lại.", "We'll definitely come back.")],
 [("locate", "Hoa gọi món gì?", "What does Hoa order?", [("Gà với khoai tây chiên", "Chicken with chips"), ("Món xà lách với trứng và khoai tây", "The salad with egg and potatoes"), ("Xúc xích và giăm bông", "Sausage and ham")], 1),
  ("locate", "Lukas uống gì?", "What does Lukas drink?", [("Một ly bia", "A beer"), ("Một ly nước ép", "A juice"), ("Nước lọc", "Water")], 0),
  ("infer", "Vì sao món của Hoa được miễn phí?", "Why is Hoa's meal free?", [("Vì hôm đó là sinh nhật cô", "Because it is her birthday"), ("Vì Lukas quen đầu bếp", "Because Lukas knows the cook"), ("Vì quán đã mang nhầm món cho cô", "Because the restaurant brought her the wrong dish")], 2)],
 names=["Hoa", "Lukas"], token_map={"hoas": "name"}))

lib.write_batch("10", S)
