import importlib.util
spec = importlib.util.spec_from_file_location("lib", r"C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-app-hoc-ngoai-ngu\82ea6b33-e22d-4a2d-907b-9b4441f9e202\scratchpad\de-stories-lib.py")
lib = importlib.util.module_from_spec(spec); spec.loader.exec_module(lib)
story = lib.story

S = []
S.append(story("auf_dem_markt", "A1-2", "Auf dem Markt",
 ("Bố đưa Anh đi chợ sáng thứ Bảy. Cô bé được tự trả tiền — và học được một bài học về giá cả.", "Dad takes Anh to the market on Saturday morning. She is allowed to pay by herself — and learns something about prices."),
 ["Kilo", "einkaufen", "Euro"],
 [("N", "Am Samstag gehen Anh und ihr Vater einkaufen.", "Thứ Bảy Anh và bố đi mua sắm.", "On Saturday Anh and her father go shopping."),
  ("N", "Sie gehen nicht in den Supermarkt, sondern auf den Markt.", "Họ không vào siêu thị mà đi chợ.", "They don't go to the supermarket, but to the market."),
  ("A", "Auf dem Markt ist das Obst oft besser, und man kann mit den Leuten reden.", "Ở chợ trái cây thường ngon hơn, và mình có thể trò chuyện với mọi người.", "At the market the fruit is often better, and you can talk to people."),
  ("N", "Anh ist zehn Jahre alt. Heute darf sie allein bezahlen.", "Anh mười tuổi. Hôm nay cô bé được tự trả tiền.", "Anh is ten. Today she is allowed to pay on her own."),
  ("N", "Der Vater gibt ihr zwanzig Euro.", "Bố đưa cho cô bé hai mươi euro.", "Her father gives her twenty euros."),
  ("A", "Wir brauchen Bananen, Birnen, Tomaten, ein Brot und ein bisschen Käse.", "Bố con mình cần chuối, lê, cà chua, một ổ bánh mì và một ít phô mai.", "We need bananas, pears, tomatoes, a loaf of bread and a bit of cheese."),
  ("N", "Zuerst gehen sie zum Obst.", "Trước tiên họ đến hàng trái cây.", "First they go to the fruit stall."),
  ("B", "Was kosten die Bananen?", "Chuối bao nhiêu tiền ạ?", "How much are the bananas?"),
  ("N", "Der Verkäufer lacht. Er ist alt und sehr nett.", "Người bán hàng cười. Ông đã lớn tuổi và rất dễ mến.", "The stallholder laughs. He is old and very nice."),
  ("A", "Heute sind die Bananen im Angebot. Sie sind sehr billig.", "Hôm nay chuối đang khuyến mãi. Rẻ lắm.", "Today the bananas are on offer. They are very cheap."),
  ("B", "Dann nehme ich ein Kilo Bananen und vier Birnen.", "Vậy cháu lấy một ký chuối và bốn quả lê.", "Then I'll take a kilo of bananas and four pears."),
  ("N", "Danach kauft Anh Tomaten und ein großes Brot.", "Sau đó Anh mua cà chua và một ổ bánh mì to.", "After that Anh buys tomatoes and a big loaf of bread."),
  ("N", "Beim Käse ist es teuer. Hundert Gramm kosten vier Euro.", "Hàng phô mai thì đắt. Một trăm gam giá bốn euro.", "At the cheese stall it is expensive. A hundred grams cost four euros."),
  ("B", "Papa, das ist zu teuer. Wir nehmen nur hundert Gramm.", "Bố ơi, đắt quá. Mình chỉ lấy một trăm gam thôi.", "Dad, that's too expensive. We'll only take a hundred grams."),
  ("N", "Zum Schluss schaut Anh in ihre Tasche.", "Cuối cùng Anh xem lại túi tiền.", "At the end Anh looks in her bag."),
  ("N", "Sie hat noch ein bisschen Geld.", "Cô bé vẫn còn một ít tiền.", "She still has a little money."),
  ("B", "Darf ich dafür ein Eis kaufen?", "Con lấy số tiền này mua kem được không ạ?", "May I buy an ice cream with that?"),
  ("A", "Ja, das hast du dir verdient. Du hast alles richtig gemacht!", "Được, con xứng đáng mà. Con làm đúng hết!", "Yes, you've earned it. You did everything right!"),
  ("N", "Auf dem Weg nach Hause isst Anh ihr Eis.", "Trên đường về nhà Anh ăn cây kem.", "On the way home Anh eats her ice cream."),
  ("N", "Sie ist stolz, denn jetzt weiß sie: Einkaufen ist nicht so einfach!", "Cô bé thấy tự hào, vì giờ cô đã biết: đi chợ không hề đơn giản!", "She is proud, because now she knows: shopping isn't that easy!")],
 [("locate", "Hôm nay chuối thế nào?", "What about the bananas today?", [("Rẻ vì đang khuyến mãi", "Cheap, because they are on offer"), ("Đắt hơn mọi khi", "More expensive than usual"), ("Đã bán hết", "Sold out")], 0),
  ("locate", "Anh mua gì bằng số tiền còn lại?", "What does Anh buy with the money left over?", [("Một ổ bánh mì", "A loaf of bread"), ("Một cây kem", "An ice cream"), ("Thêm phô mai", "More cheese")], 1),
  ("infer", "Vì sao Anh chỉ lấy một trăm gam phô mai?", "Why does Anh only take a hundred grams of cheese?", [("Cô bé không thích phô mai", "She doesn't like cheese"), ("Người bán hết phô mai", "The stall had run out"), ("Phô mai đắt và cô bé muốn tiết kiệm tiền", "The cheese is expensive and she wants to save money")], 2)],
 names=["Anh"], token_map={"sondern": "function", "verdient": "verdienen"}))

lib.write_batch("07", S)
