import importlib.util
spec = importlib.util.spec_from_file_location("lib", r"C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-app-hoc-ngoai-ngu\82ea6b33-e22d-4a2d-907b-9b4441f9e202\scratchpad\de-stories-lib.py")
lib = importlib.util.module_from_spec(spec); spec.loader.exec_module(lib)
story = lib.story

S = []
S.append(story("der_schatz_im_alten_haus", "A2-1", "Der Schatz im alten Haus",
 ("Trên gác mái nhà bà, Jonas và Mia tìm thấy một tấm bản đồ cũ. Họ đi tìm kho báu — và tìm ra một thứ quý giá hơn tiền.", "In Grandma's attic Jonas and Mia find an old map. They search for treasure — and find something worth more than money."),
 ["Kiste", "Kreuz", "Dach", "Sommer"],
 [("N", "Jonas und Mia sind im Sommer bei ihrer Großmutter auf dem Land.", "Mùa hè Jonas và Mia ở nhà bà dưới quê.", "In summer Jonas and Mia stay with their grandmother in the country."),
  ("N", "Das Haus ist sehr alt. Oben unter dem Dach gibt es ein dunkles Zimmer.", "Ngôi nhà rất cũ. Trên tầng cao nhất, dưới mái nhà, có một căn phòng tối.", "The house is very old. Upstairs under the roof there is a dark room."),
  ("N", "Dort finden sie eine alte Kiste. In der Kiste liegt eine Karte.", "Ở đó các bé tìm thấy một chiếc thùng cũ. Trong thùng có một tấm bản đồ.", "There they find an old box. In the box there is a map."),
  ("B", "Schau mal! Auf der Karte ist ein Kreuz. Ist das ein Schatz?", "Nhìn này! Trên bản đồ có một dấu chữ thập. Có phải là kho báu không?", "Look! There's a cross on the map. Is that a treasure?"),
  ("A", "Vielleicht! Wir müssen herausfinden, wo dieser Ort ist.", "Có thể lắm! Mình phải tìm ra chỗ này ở đâu.", "Maybe! We have to find out where this place is."),
  ("N", "Sie zeigen der Großmutter die Karte.", "Hai bé đưa bản đồ cho bà xem.", "They show their grandmother the map."),
  ("N", "Sie schaut lange auf die Karte und lacht dann ein bisschen.", "Bà nhìn tấm bản đồ rất lâu rồi khẽ cười.", "She looks at the map for a long time and then laughs a little."),
  ("N", "Sie sagt nur: Folgt dem Weg zum Fluss, dann seht ihr es.", "Bà chỉ nói: Cứ đi theo con đường ra bờ sông, rồi các cháu sẽ thấy.", "She only says: Follow the path to the river, then you'll see."),
  ("N", "Die Kinder folgen dem Weg durch den Wald.", "Bọn trẻ đi theo con đường xuyên qua khu rừng.", "The children follow the path through the forest."),
  ("N", "Die Suche ist nicht leicht. Der Weg ist lang, und manchmal gibt es zwei Wege.", "Cuộc tìm kiếm không dễ. Con đường dài, và đôi khi có hai lối.", "The search isn't easy. The path is long, and sometimes there are two ways."),
  ("A", "Wahrscheinlich müssen wir hier rechts gehen.", "Có lẽ mình phải rẽ phải ở đây.", "We probably have to go right here."),
  ("N", "Am Fluss steht ein großer, alter Baum. Unter dem Baum ist ein Loch.", "Bên bờ sông có một cái cây to và già. Dưới gốc cây có một cái hố.", "By the river there is a big old tree. Under the tree there is a hole."),
  ("N", "Mia greift in das Loch und findet eine kleine Kiste.", "Mia thò tay vào hố và tìm thấy một chiếc hộp nhỏ.", "Mia reaches into the hole and finds a small box."),
  ("B", "Ist da Geld drin? Eine Million Dollar?", "Trong đó có tiền không? Một triệu đô la?", "Is there money inside? A million dollars?"),
  ("N", "In der Kiste ist kein Geld. Es sind alte Fotos und ein Brief.", "Trong hộp không có tiền. Chỉ có những bức ảnh cũ và một lá thư.", "There is no money in the box. There are old photos and a letter."),
  ("N", "Auf den Fotos sieht man eine junge Frau und einen jungen Mann am Fluss.", "Trên ảnh có một cô gái trẻ và một chàng trai trẻ bên bờ sông.", "In the photos you can see a young woman and a young man by the river."),
  ("N", "Zu Hause erklärt die Großmutter alles.", "Về đến nhà, bà giải thích mọi chuyện.", "At home Grandmother explains everything."),
  ("B", "Das sind dein Opa und ich. Hier haben wir uns kennengelernt. Das war unser Schatz.", "Đó là ông các cháu và bà. Hai ông bà quen nhau ở đó. Đó là kho báu của ông bà.", "That's your grandpa and me. We met there. That was our treasure."),
  ("N", "Die Kinder sind ein bisschen traurig, denn sie haben kein Geld gefunden.", "Bọn trẻ hơi buồn vì không tìm được tiền.", "The children are a little sad, because they haven't found any money."),
  ("N", "Aber dann hören sie die Geschichte von Opa, und sie verstehen: Der Schatz ist die Liebe.", "Nhưng rồi các bé nghe chuyện về ông, và các bé hiểu: kho báu chính là tình yêu.", "But then they hear the story of Grandpa, and they understand: the treasure is love.")],
 [("locate", "Bọn trẻ tìm thấy tấm bản đồ ở đâu?", "Where do the children find the map?", [("Trong một chiếc thùng cũ dưới mái nhà", "In an old box under the roof"), ("Dưới gốc cây bên sông", "Under the tree by the river"), ("Trong bếp", "In the kitchen")], 0),
  ("locate", "Trong chiếc hộp nhỏ có gì?", "What is in the small box?", [("Tiền", "Money"), ("Ảnh cũ và một lá thư", "Old photos and a letter"), ("Một triệu đô la", "A million dollars")], 1),
  ("infer", "Vì sao bà cười khi nhìn bản đồ?", "Why does Grandmother laugh when she sees the map?", [("Vì bản đồ vẽ sai", "Because the map is wrong"), ("Vì bà không biết chỗ đó", "Because she doesn't know the place"), ("Vì bà biết chỗ đó là nơi bà quen ông", "Because she knows it's where she met Grandpa")], 2)],
 names=["Jonas", "Mia"], token_map=None))

lib.write_batch("14", S)
