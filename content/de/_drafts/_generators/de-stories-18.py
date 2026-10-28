import importlib.util
spec = importlib.util.spec_from_file_location("lib", r"C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-app-hoc-ngoai-ngu\82ea6b33-e22d-4a2d-907b-9b4441f9e202\scratchpad\de-stories-lib.py")
lib = importlib.util.module_from_spec(spec); spec.loader.exec_module(lib)
story = lib.story

S = []
S.append(story("papa_holt_lina_ab", "A2-1", "Papa holt Lina ab",
 ("Hôm nay bố Tom ở nhà làm nội trợ và đi đón bé Lina ở nhà trẻ. Nhưng Lina không có ở đó!", "Today Dad Tom is a stay-at-home father and picks up little Lina from kindergarten. But Lina isn't there!"),
 ["Farbe", "Stern", "Fantasie", "grün"],
 [("N", "Tom ist Hausmann. Seine Frau arbeitet in einer Bank, und er bleibt mit den Kindern zu Hause.", "Tom là người chồng nội trợ. Vợ anh làm ở ngân hàng, còn anh ở nhà với các con.", "Tom is a househusband. His wife works at a bank, and he stays at home with the children."),
  ("N", "Am Vormittag muss er waschen, kochen und Essen kaufen. Das ist nicht leicht!", "Buổi sáng anh phải giặt giũ, nấu ăn và mua đồ ăn. Không hề dễ chút nào!", "In the morning he has to do the washing, cook and buy food. That isn't easy!"),
  ("N", "Um drei Uhr will er seine Tochter Lina vom Kindergarten abholen.", "Ba giờ chiều anh muốn đi đón con gái Lina ở nhà trẻ.", "At three he wants to pick up his daughter Lina from kindergarten."),
  ("N", "Er beeilt sich, denn er ist schon ein bisschen spät.", "Anh vội vàng, vì đã hơi muộn rồi.", "He hurries, because he is already a little late."),
  ("N", "Im Kindergarten malen die Kinder gerade Bilder. Eine Erwachsene, Frau Engel, hilft ihnen.", "Ở nhà trẻ bọn trẻ đang vẽ tranh. Một người lớn, cô Engel, đang giúp các bé.", "At the kindergarten the children are painting pictures. An adult, Ms Engel, is helping them."),
  ("A", "Guten Tag! Ich möchte Lina abholen.", "Chào cô! Tôi muốn đón Lina.", "Hello! I'd like to pick up Lina."),
  ("B", "Lina? Die ist nicht hier. Sie ist mit einer Gruppe im Park.", "Lina ạ? Bé không có ở đây. Bé đi công viên với một nhóm.", "Lina? She isn't here. She's in the park with a group."),
  ("N", "Tom hat keine Angst. Er weiß: Der Park ist direkt hinter dem Kindergarten.", "Tom không hoảng. Anh biết: công viên ở ngay sau nhà trẻ.", "Tom doesn't panic. He knows: the park is right behind the kindergarten."),
  ("N", "Durch den Ausgang hinten ist man sofort dort.", "Đi qua lối ra phía sau là đến ngay.", "Through the back exit you get there right away."),
  ("N", "Im Park spielen die Kinder zwischen den Bäumen. Zwei Jugendliche helfen dort.", "Trong công viên bọn trẻ chơi giữa những hàng cây. Hai thanh niên đang giúp ở đó.", "In the park the children are playing among the trees. Two young people are helping there."),
  ("N", "Lina sitzt auf einer Bank und malt mit vielen Farben einen großen Stern.", "Lina ngồi trên một chiếc ghế dài và vẽ một ngôi sao to với rất nhiều màu.", "Lina is sitting on a bench painting a big star in lots of colours."),
  ("B", "Papa! Schau mal! Der Stern ist für dich.", "Bố ơi! Nhìn này! Ngôi sao này tặng bố.", "Dad! Look! The star is for you."),
  ("A", "Wunderbar! Du hast viel Fantasie. Aber warum ist der Stern grün?", "Đẹp quá! Con giàu trí tưởng tượng ghê. Nhưng sao ngôi sao lại màu xanh lá?", "Wonderful! You've got lots of imagination. But why is the star green?"),
  ("B", "Weil du gern Grün magst!", "Vì bố thích màu xanh lá mà!", "Because you like green!"),
  ("N", "Zu Hause baden sie zusammen den Hund. Nach dem Park braucht er das wirklich.", "Ở nhà hai bố con cùng tắm cho con chó. Sau buổi ở công viên nó thật sự cần tắm.", "At home they wash the dog together. After the park he really needs it."),
  ("N", "Am Abend kommt die Mutter nach Hause. Lina zeigt ihr den Stern.", "Buổi tối mẹ về nhà. Lina cho mẹ xem ngôi sao.", "In the evening Mother comes home. Lina shows her the star."),
  ("N", "Tom hängt das Bild an die Wand. Als die Kinder im Bett sind, ruht er sich endlich aus.", "Tom treo bức tranh lên tường. Khi bọn trẻ đã đi ngủ, cuối cùng anh mới được nghỉ ngơi.", "Tom hangs the picture on the wall. When the children are in bed, he finally rests."),
  ("N", "Er ist müde, aber er lacht. Ein Tag als Hausmann ist hart, aber auch schön.", "Anh mệt, nhưng anh cười. Một ngày làm nội trợ thật vất vả, nhưng cũng thật đẹp.", "He is tired, but he laughs. A day as a househusband is hard, but also lovely.")],
 [("locate", "Vợ của Tom làm việc ở đâu?", "Where does Tom's wife work?", [("Ở ngân hàng", "At a bank"), ("Ở nhà trẻ", "At a kindergarten"), ("Ở bệnh viện", "At a hospital")], 0),
  ("locate", "Tom tìm thấy Lina ở đâu?", "Where does Tom find Lina?", [("Trong lớp học", "In the classroom"), ("Trên một chiếc ghế dài trong công viên", "On a bench in the park"), ("Ở nhà bà", "At Grandma's")], 1),
  ("infer", "Vì sao Lina vẽ ngôi sao màu xanh lá?", "Why does Lina paint the star green?", [("Vì cô bé chỉ có màu xanh lá", "Because she only has green"), ("Vì cô giáo bảo vậy", "Because the teacher said so"), ("Vì bố thích màu xanh lá", "Because her dad likes green")], 2)],
 names=["Tom", "Lina", "Engel"], token_map=None))

lib.write_batch("18", S)
