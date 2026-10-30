"""it-vi graded stories, batch 8: everyday stories, closing the last gaps. usage: python -I it-stories-08.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from it_stories_lib import story, write_batch

Q = lambda vi, en, opts, ans, kind="locate": (kind, vi, en, opts, ans)
S = []
S.append(story("la_nostra_casa", "A1-2", "La nostra casa al mare",
 ("Một gia đình dọn dẹp ngôi nhà ven biển trước kỳ nghỉ.", "A family cleans their seaside house before the holidays."),
 ["lavarsi", "bisognare", "tanto"],
 [("N", "Ogni estate la famiglia Greco va al mare.", "Mỗi mùa hè gia đình Greco đi biển.", "Every summer the Greco family goes to the seaside."),
  ("N", "La nostra casa è piccola e bianca, dice la madre.", "Nhà của chúng tôi nhỏ và trắng, người mẹ nói.", "Our house is small and white, the mother says."),
  ("N", "Il nostro giardino ha tanti fiori.", "Khu vườn của chúng tôi có nhiều hoa.", "Our garden has many flowers."),
  ("N", "Quando arrivano, la casa è molto sporca.", "Khi họ đến, nhà rất bẩn.", "When they arrive, the house is very dirty."),
  ("A", "Bisogna pulire tutto! Chi mi aiuta?", "Phải dọn hết! Ai giúp mẹ nào?", "We have to clean everything! Who will help me?"),
  ("B", "Ora no, mamma. Il mare è lì e fa caldo!", "Bây giờ thì không, mẹ ơi. Biển ở ngay đó và trời nóng!", "Not now, Mum. The sea is right there and it is hot!"),
  ("A", "Prima la casa, poi il mare.", "Trước tiên là nhà, rồi mới đến biển.", "First the house, then the sea."),
  ("N", "Il padre apre le finestre e lava i piatti.", "Bố mở cửa sổ và rửa bát.", "Dad opens the windows and washes the dishes."),
  ("N", "La figlia pulisce la cucina e il bagno.", "Con gái lau bếp và phòng tắm.", "The daughter cleans the kitchen and the bathroom."),
  ("N", "Il figlio porta le sedie in giardino.", "Con trai mang ghế ra vườn.", "The son carries the chairs into the garden."),
  ("N", "La madre mette i vestiti nell'armadio.", "Mẹ xếp quần áo vào tủ.", "Mum puts the clothes in the wardrobe."),
  ("N", "Dopo due ore la casa è pulita.", "Sau hai giờ nhà đã sạch.", "After two hours the house is clean."),
  ("A", "Bravi! Ora potete andare, ma prima lavatevi le mani.", "Giỏi lắm! Giờ các con đi được rồi, nhưng rửa tay trước đã.", "Well done! Now you can go, but wash your hands first."),
  ("N", "I ragazzi si lavano e corrono al mare.", "Bọn trẻ rửa tay và chạy ra biển.", "The children wash and run to the sea."),
  ("N", "L'acqua è fredda, ma il sole è forte.", "Nước lạnh nhưng nắng gắt.", "The water is cold, but the sun is strong."),
  ("N", "La sera mangiano il pesce in giardino.", "Buổi tối họ ăn cá trong vườn.", "In the evening they eat fish in the garden."),
  ("B", "Grazie, mamma. Questa è la nostra casa più bella!", "Cảm ơn mẹ. Đây là ngôi nhà đẹp nhất của mình!", "Thank you, Mum. This is our most beautiful house!"),
  ("N", "Sono stanchi ma felici.", "Họ mệt nhưng vui.", "They are tired but happy.")],
 [Q("Ai rửa bát?", "Who washes the dishes?", [("Người bố", "The father"), ("Người mẹ", "The mother"), ("Con gái", "The daughter")], 0),
  Q("Họ dọn nhà bao lâu?", "How long do they clean the house?", [("Hai giờ", "Two hours"), ("Một ngày", "A day"), ("Mười phút", "Ten minutes")], 0),
  Q("Vì sao con trai muốn đi biển ngay?", "Why does the son want to go to the sea at once?", [("Vì trời nóng", "Because it is hot"), ("Vì cậu đói", "Because he is hungry"), ("Vì nhà đã sạch", "Because the house is clean")], 0, "infer")],
 names=["Greco"], token_map={"ora": "it:w:ora-adverb", "lavatevi": "lavarsi", "lavano": "lavarsi"}))
S.append(story("il_biscotto_dolce", "A1-2", "Un biscotto sul treno",
 ("Một cuộc nói chuyện lịch sự trên tàu giữa hai người lạ.", "A polite conversation between two strangers on a train."),
 ["dolce", "la signorina", "ci"],
 [("N", "Sul treno per Napoli ci sono due persone.", "Trên tàu đi Napoli có hai người.", "On the train to Naples there are two people."),
  ("N", "Una signora vecchia mangia un biscotto molto dolce.", "Một bà cụ ăn một cái bánh quy rất ngọt.", "An old lady is eating a very sweet biscuit."),
  ("N", "Davanti c'è una signorina con un libro.", "Phía trước có một cô gái với quyển sách.", "In front there is a young woman with a book."),
  ("A", "Scusi, Lei è italiana?", "Xin lỗi, cháu là người Ý à?", "Excuse me, are you Italian?"),
  ("B", "No, signora. Sono vietnamita, ma abito qui. E Lei?", "Không ạ. Cháu là người Việt, nhưng sống ở đây. Còn bà?", "No, madam. I am Vietnamese, but I live here. And you?"),
  ("A", "Io sono di Napoli. Vuole un biscotto?", "Tôi người Napoli. Cháu ăn bánh quy không?", "I am from Naples. Would you like a biscuit?"),
  ("B", "Grazie, è molto gentile. Che buono!", "Cảm ơn bà, bà thật tử tế. Ngon quá!", "Thank you, you are very kind. How good!"),
  ("A", "Lei ha una famiglia in Italia?", "Cháu có gia đình ở Ý không?", "Do you have family in Italy?"),
  ("B", "No, i miei genitori sono a Hanoi. Li chiamo ogni domenica.", "Không, bố mẹ cháu ở Hà Nội. Chủ nhật nào cháu cũng gọi cho họ.", "No, my parents are in Hanoi. I call them every Sunday."),
  ("A", "Brava! Io ho due figli, ma non li vedo mai.", "Giỏi lắm! Tôi có hai con, nhưng chẳng bao giờ gặp.", "Well done! I have two children, but I never see them."),
  ("B", "Mi dispiace, signora. Dove abitano?", "Cháu rất tiếc. Họ sống ở đâu ạ?", "I am sorry, madam. Where do they live?"),
  ("A", "A Milano. Ci vado a Natale.", "Ở Milano. Giáng sinh tôi đến đó.", "In Milan. I go there at Christmas."),
  ("N", "Il treno arriva a Napoli alle tre.", "Tàu đến Napoli lúc ba giờ.", "The train arrives in Naples at three."),
  ("A", "Ci vediamo a Napoli? Conosco un bar molto buono.", "Mình gặp lại ở Napoli nhé? Tôi biết một quán bar rất ngon.", "Shall we meet in Naples? I know a very good bar."),
  ("B", "Grazie, ma oggi ho il treno per Salerno.", "Cảm ơn bà, nhưng hôm nay cháu đi tàu đến Salerno.", "Thank you, but today I have the train to Salerno."),
  ("A", "Allora un'altra volta. Ecco il mio numero.", "Vậy để lần khác. Đây là số của tôi.", "Another time, then. Here is my number."),
  ("B", "Grazie, signora! Buona giornata e a presto!", "Cảm ơn bà! Chúc bà một ngày tốt lành và hẹn gặp lại!", "Thank you, madam! Have a good day and see you soon!"),
  ("N", "La signorina è contenta: ora ha un'amica a Napoli.", "Cô gái vui: giờ cô có một người bạn ở Napoli.", "The young woman is happy: now she has a friend in Naples.")],
 [Q("Bà ấy mời cô gái ăn gì?", "What does the lady offer?", [("Bánh quy", "A biscuit"), ("Cà phê", "A coffee"), ("Trái cây", "Fruit")], 0),
  Q("Bố mẹ cô gái ở đâu?", "Where are the young woman's parents?", [("Ở Hà Nội", "In Hanoi"), ("Ở Napoli", "In Naples"), ("Ở Milano", "In Milan")], 0),
  Q("Bà ấy có buồn vì các con không?", "Is the lady sad about her children?", [("Có lẽ có, vì ít khi gặp họ", "Probably, as she rarely sees them"), ("Không, họ sống cùng bà", "No, they live with her"), ("Không, bà không có con", "No, she has no children")], 0, "infer")],
 names=["Napoli", "Hanoi", "Milano", "Salerno"], token_map={"lei": "it:w:lei-pronoun"}))
EXTRA = {
 "la_nostra_casa": [("N", "Il giorno dopo vanno tutti al mercato e comprano la frutta.", "Hôm sau cả nhà đi chợ và mua trái cây.", "The next day they all go to the market and buy fruit."), ("N", "La vacanza comincia bene.", "Kỳ nghỉ bắt đầu tốt đẹp.", "The holiday begins well.")],
 "il_biscotto_dolce": [("N", "La sera la signorina scrive un messaggio alla signora.", "Tối cô gái nhắn tin cho bà.", "In the evening the young woman writes a message to the lady."), ("N", "Il sabato dopo vanno insieme al bar.", "Thứ Bảy sau họ cùng đi quán bar.", "The following Saturday they go to the bar together.")],
}
for st in S:
    for sp, it, vi, en in EXTRA.get(st["id"].split(".")[-1], []):
        st["sentences"].append({"speaker": sp, "text": it, "translation": {"vi": vi, "en": en}})
write_batch("08-altre", S)
