import importlib.util
spec = importlib.util.spec_from_file_location("lib", r"C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-app-hoc-ngoai-ngu\82ea6b33-e22d-4a2d-907b-9b4441f9e202\scratchpad\de-stories-lib.py")
lib = importlib.util.module_from_spec(spec); spec.loader.exec_module(lib)
story = lib.story

S = []
S.append(story("der_planet_ohne_gefuehle", "A1-2", "Der Planet ohne Gefühle",
 ("Trên một hành tinh xa xôi, luật pháp cấm mọi cảm xúc. Rồi một người lính trẻ tìm thấy một bông hoa.", "On a distant planet the law forbids all feelings. Then a young soldier finds a flower."),
 ["Raumschiff", "Technologie", "Realität", "Strafe"],
 [("N", "Weit weg von unserer Welt gibt es einen kleinen Planeten.", "Cách xa thế giới của chúng ta có một hành tinh nhỏ.", "Far away from our world there is a small planet."),
  ("N", "Dort lebt eine sehr komische Gesellschaft. Die Regierung hat ein hartes Gesetz: Gefühle sind verboten.", "Ở đó có một xã hội rất kỳ lạ. Chính phủ có một đạo luật hà khắc: cảm xúc bị cấm.", "A very strange society lives there. The government has a harsh law: feelings are forbidden."),
  ("N", "Niemand darf lachen, weinen oder lieben. Die Leute arbeiten nur. Sie haben keine Lust auf Spiele.", "Không ai được cười, khóc hay yêu. Mọi người chỉ làm việc. Họ không còn hứng thú với trò chơi.", "Nobody may laugh, cry or love. People only work. They have no desire for games."),
  ("N", "Ein General führt die Armee. Er ist hart und sagt immer: Ordnung ist alles.", "Một vị tướng chỉ huy quân đội. Ông nghiêm khắc và luôn nói: trật tự là tất cả.", "A general leads the army. He is strict and always says: order is everything."),
  ("N", "Ein junger Soldat heißt Kai. Er macht jeden Tag seine Arbeit und denkt nicht nach.", "Một người lính trẻ tên là Kai. Ngày nào anh cũng làm việc của mình mà không suy nghĩ.", "A young soldier is called Kai. He does his work every day and doesn't think about it."),
  ("N", "Eines Tages landet ein kleines Raumschiff nicht weit von ihm. Es kommt aus einer anderen Welt.", "Một ngày nọ, một con tàu vũ trụ nhỏ hạ cánh không xa chỗ anh. Nó đến từ một thế giới khác.", "One day a small spaceship lands not far from him. It comes from another world."),
  ("N", "Im Raumschiff findet Kai keinen Menschen, nur eine Blume in einem Glas.", "Trong tàu vũ trụ Kai không thấy người nào, chỉ có một bông hoa trong một cái lọ thủy tinh.", "In the spaceship Kai finds no person, only a flower in a glass."),
  ("N", "Die Blume ist rot und riecht wunderbar. Kai sieht sie lange an.", "Bông hoa màu đỏ và thơm ngát. Kai ngắm nó rất lâu.", "The flower is red and smells wonderful. Kai looks at it for a long time."),
  ("N", "Plötzlich passiert etwas in seinem Kopf. Er fühlt sich froh. Er lacht!", "Bỗng có điều gì đó xảy ra trong đầu anh. Anh thấy vui. Anh bật cười!", "Suddenly something happens in his head. He feels happy. He laughs!"),
  ("N", "Ein anderer Soldat hört ihn und meldet es dem General.", "Một người lính khác nghe thấy và báo cho vị tướng.", "Another soldier hears him and reports it to the general."),
  ("A", "Du hast das Gesetz gebrochen! Das Gericht entscheidet über deine Strafe.", "Ngươi đã vi phạm luật! Tòa án sẽ quyết định hình phạt của ngươi.", "You have broken the law! The court will decide your punishment."),
  ("N", "Vor dem Gericht steht Kai ganz ruhig. Er hat keine Angst.", "Trước tòa, Kai đứng rất bình tĩnh. Anh không sợ.", "In front of the court Kai stands very calmly. He isn't afraid."),
  ("A", "Ich habe nichts Falsches gemacht. Ich habe nur eine Blume gesehen. Seht ihr sie?", "Tôi không làm gì sai cả. Tôi chỉ nhìn thấy một bông hoa. Các người có thấy nó không?", "I haven't done anything wrong. I only saw a flower. Can you see it?"),
  ("N", "Er zeigt allen die Blume. Die Leute im Gericht schauen sie an.", "Anh đưa bông hoa cho mọi người xem. Những người trong tòa nhìn nó.", "He shows everyone the flower. The people in the court look at it."),
  ("N", "Und dann geschieht es: Eine alte Frau beginnt zu weinen. Ein Kind lacht.", "Và rồi điều đó xảy ra: một bà lão bắt đầu khóc. Một đứa trẻ bật cười.", "And then it happens: an old woman begins to cry. A child laughs."),
  ("N", "Bald lachen und weinen alle. Sogar der General weint.", "Chẳng mấy chốc mọi người đều cười và khóc. Ngay cả vị tướng cũng khóc.", "Soon everyone is laughing and crying. Even the general cries."),
  ("N", "Mit Technologie kann man vieles machen. Aber ohne Gefühle hat das Leben keinen Sinn.", "Với công nghệ người ta làm được nhiều thứ. Nhưng thiếu cảm xúc thì cuộc sống chẳng có ý nghĩa.", "With technology you can do a lot. But without feelings life has no meaning."),
  ("N", "Am nächsten Tag ändert die Regierung das Gesetz. Das ist jetzt die neue Realität auf dem Planeten.", "Hôm sau chính phủ thay đổi đạo luật. Đó là thực tế mới trên hành tinh.", "The next day the government changes the law. That is the new reality on the planet.")],
 [("locate", "Kai tìm thấy gì trong con tàu vũ trụ?", "What does Kai find in the spaceship?", [("Một bông hoa trong lọ", "A flower in a glass"), ("Một người từ thế giới khác", "A person from another world"), ("Một lá thư", "A letter")], 0),
  ("locate", "Ai báo chuyện Kai cười cho vị tướng?", "Who reports Kai's laughing to the general?", [("Một bà lão", "An old woman"), ("Một người lính khác", "Another soldier"), ("Một đứa trẻ", "A child")], 1),
  ("infer", "Vì sao chính phủ thay đổi đạo luật?", "Why does the government change the law?", [("Vì Kai bỏ trốn", "Because Kai ran away"), ("Vì người từ thế giới khác ra lệnh", "Because people from another world ordered it"), ("Vì mọi người, kể cả vị tướng, đã cảm nhận lại cảm xúc", "Because everyone, even the general, felt emotions again")], 2)],
 names=["Kai"], token_map=None))

lib.write_batch("19", S)
