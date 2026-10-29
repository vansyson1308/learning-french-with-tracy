import importlib.util
spec = importlib.util.spec_from_file_location("lib", r"C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-app-hoc-ngoai-ngu\82ea6b33-e22d-4a2d-907b-9b4441f9e202\scratchpad\de-stories-lib.py")
lib = importlib.util.module_from_spec(spec); spec.loader.exec_module(lib)
story = lib.story

S = []
S.append(story("urlaub_im_internet", "A2-1", "Urlaub im Internet",
 ("Cả nhà Wagner lên kế hoạch nghỉ hè trên mạng. Mỗi người một mong muốn — và mẹ phải quyết định.", "The Wagner family plans their summer holiday online. Everyone wants something different — and Mum has to decide."),
 ["Urlaub", "Strand", "Insel", "Berg", "Reise"],
 [("N", "Es ist Abend. Familie Wagner sitzt zusammen vor dem Computer.", "Trời đã tối. Cả nhà Wagner ngồi quây quần trước máy tính.", "It is evening. The Wagner family sits together in front of the computer."),
  ("N", "Sie wollen den Urlaub planen. Jeder möchte etwas anderes.", "Họ muốn lên kế hoạch cho kỳ nghỉ. Mỗi người một mong muốn khác nhau.", "They want to plan their holiday. Everyone has a different wish."),
  ("A", "Ich möchte auf eine Insel abfliegen und am Strand liegen.", "Bố muốn bay ra một hòn đảo và nằm dài trên bãi biển.", "I'd like to fly to an island and lie on the beach."),
  ("B", "Und ich möchte in den Bergen wandern. Das interessiert mich mehr.", "Còn mẹ muốn đi bộ trên núi. Mẹ thích thế hơn.", "And I'd like to go hiking in the mountains. That interests me more."),
  ("N", "Die Kinder wünschen sich nur eins: ein Schwimmbad!", "Bọn trẻ chỉ mong một điều: một bể bơi!", "The children only wish for one thing: a swimming pool!"),
  ("N", "Die Mutter denkt lange nach. Dann hat sie eine Idee.", "Mẹ suy nghĩ rất lâu. Rồi mẹ nảy ra một ý.", "Mother thinks for a long time. Then she has an idea."),
  ("B", "Ich habe von einer kleinen Insel mit Bergen gehört. Lass mich mal suchen.", "Mẹ có nghe về một hòn đảo nhỏ có núi. Để mẹ tìm thử.", "I've heard of a small island with mountains. Let me have a look."),
  ("N", "Sie muss nur zwei Mal anklicken, und schon sieht man schöne Fotos.", "Mẹ chỉ cần nhấp chuột hai lần là đã thấy những bức ảnh đẹp.", "She only has to click twice, and there are already beautiful photos."),
  ("N", "Auf der Insel gibt es einen Strand, Berge zum Wandern und ein Hotel mit Schwimmbad.", "Trên đảo có bãi biển, núi để đi bộ và một khách sạn có bể bơi.", "On the island there is a beach, mountains for hiking and a hotel with a pool."),
  ("A", "Super! Aber ist das Hotel nicht sehr teuer?", "Tuyệt! Nhưng khách sạn có đắt lắm không?", "Great! But isn't the hotel very expensive?"),
  ("B", "Wir können auch eine Wohnung mieten. Hier vermietet eine Familie ihr Haus, nur zwei Kilometer vom Strand.", "Mình cũng có thể thuê một căn hộ. Ở đây có một gia đình cho thuê nhà, chỉ cách bãi biển hai ki-lô-mét.", "We can also rent a flat. Here a family is renting out their house, only two kilometres from the beach."),
  ("N", "Das Haus hat ein Doppelzimmer für die Eltern und ein Zimmer für die Kinder.", "Ngôi nhà có một phòng đôi cho bố mẹ và một phòng cho bọn trẻ.", "The house has a double room for the parents and a room for the children."),
  ("N", "Sie schreiben dem Vermieter eine Nachricht. Nach einer Stunde kommt die Antwort.", "Họ nhắn tin cho chủ nhà. Một tiếng sau có trả lời.", "They write a message to the landlord. After an hour the answer comes."),
  ("N", "Sie können zwei Wochen dort übernachten. Sie müssen das Geld nur bis Freitag überweisen.", "Họ có thể ở đó hai tuần. Họ chỉ cần chuyển khoản trước thứ Sáu.", "They can stay there for two weeks. They only have to transfer the money by Friday."),
  ("A", "Wann sollen wir abfahren? Und wann können wir ankommen?", "Khi nào mình nên đi? Và khi nào mình có thể đến nơi?", "When should we leave? And when can we arrive?"),
  ("B", "Wir müssen um sechs Uhr zum Flughafen fahren. Am Mittag können wir ankommen.", "Mình phải ra sân bay lúc sáu giờ sáng. Đến trưa là có thể tới nơi.", "We have to go to the airport at six. We can arrive at midday."),
  ("N", "Die Kinder können es sich schon vorstellen: Sonne, Wasser und Eis jeden Tag.", "Bọn trẻ đã có thể hình dung: nắng, nước và kem mỗi ngày.", "The children can already imagine it: sun, water and ice cream every day."),
  ("N", "Um zehn Uhr will der Vater den Computer ausmachen.", "Mười giờ bố muốn tắt máy tính.", "At ten Father wants to switch off the computer."),
  ("B", "Moment! Ich muss erst die Reise beenden. Noch ein Mal anklicken — fertig!", "Đợi đã! Mẹ phải hoàn tất việc đặt chuyến đi đã. Nhấp thêm một lần nữa — xong!", "Wait! I have to finish the trip first. One more click — done!"),
  ("N", "In der Nacht träumen alle vom Meer.", "Đêm đó cả nhà đều mơ thấy biển.", "That night everyone dreams of the sea.")],
 [("locate", "Bọn trẻ mong muốn điều gì?", "What do the children wish for?", [("Một bể bơi", "A swimming pool"), ("Núi để đi bộ", "Mountains for hiking"), ("Một hòn đảo", "An island")], 0),
  ("locate", "Ngôi nhà cách bãi biển bao xa?", "How far is the house from the beach?", [("Mười ki-lô-mét", "Ten kilometres"), ("Hai ki-lô-mét", "Two kilometres"), ("Hai mét", "Two metres")], 1),
  ("infer", "Vì sao hòn đảo là lựa chọn hay cho cả nhà?", "Why is the island a good choice for the whole family?", [("Vì nó rẻ nhất", "Because it is the cheapest"), ("Vì nó gần nhà", "Because it is near home"), ("Vì ở đó có bãi biển, núi và bể bơi cho mọi người", "Because it has a beach, mountains and a pool for everyone")], 2)],
 names=["Wagner"], token_map={"bergen": "Berg", "berge": "Berg", "lass": "lassen", "vermietet": "vermieten"}))

lib.write_batch("22", S)
