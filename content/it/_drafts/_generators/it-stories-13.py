"""it-vi graded stories, batch 13: band A2-1. usage: python -I it-stories-13.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from it_stories_lib import story, write_batch

Q = lambda vi, en, opts, ans, kind="locate": (kind, vi, en, opts, ans)
S = []
S.append(story("lo_sciopero", "A2-1", "Lo sciopero dei treni",
 ("Tàu đình công đúng ngày Mai phải đến phỏng vấn.", "A train strike falls on the day of Mai's interview."),
 ["annullato", "il rimborso", "lo sciopero"],
 [("N", "Mai ha trovato un annuncio per un lavoro a Bologna.", "Mai tìm thấy một thông báo tuyển dụng ở Bologna.", "Mai has found an advert for a job in Bologna."),
  ("N", "Ha scritto al capo e lui ha risposto subito.", "Cô viết cho sếp và ông trả lời ngay.", "She wrote to the boss and he answered at once."),
  ("N", "Il colloquio è lunedì alle dieci.", "Cuộc phỏng vấn vào thứ Hai lúc mười giờ.", "The interview is on Monday at ten."),
  ("N", "Lunedì mattina Mai si è alzata alle sei ed è andata alla stazione.", "Sáng thứ Hai Mai dậy lúc sáu giờ và đến nhà ga.", "On Monday morning Mai got up at six and went to the station."),
  ("N", "Alla stazione c'era molta gente davanti alla cassa.", "Ở nhà ga có rất đông người trước quầy vé.", "At the station there were many people in front of the ticket desk."),
  ("A", "Scusi, che cosa è successo?", "Xin lỗi, có chuyện gì vậy?", "Excuse me, what has happened?"),
  ("B", "Oggi c'è lo sciopero. Il treno delle sette è annullato.", "Hôm nay có đình công. Chuyến bảy giờ bị hủy.", "There is a strike today. The seven o'clock train is cancelled."),
  ("A", "E il prossimo treno per Bologna?", "Còn chuyến tiếp theo đi Bologna?", "And the next train to Bologna?"),
  ("B", "Non lo so. Forse alle undici.", "Tôi không biết. Có lẽ lúc mười một giờ.", "I do not know. Perhaps at eleven."),
  ("N", "Mai ha avuto paura: il colloquio è molto importante.", "Mai sợ: cuộc phỏng vấn rất quan trọng.", "Mai was afraid: the interview is very important."),
  ("N", "Ha chiamato subito l'ufficio di Bologna.", "Cô gọi ngay cho văn phòng ở Bologna.", "She called the Bologna office at once."),
  ("A", "Buongiorno, sono Mai. Mi dispiace, oggi c'è lo sciopero e arrivo tardi.", "Chào anh, tôi là Mai. Xin lỗi, hôm nay đình công và tôi đến muộn.", "Good morning, this is Mai. I am sorry, there is a strike today and I will be late."),
  ("B", "Non si preoccupi. Può venire alle due? Il capo aspetta.", "Chị đừng lo. Chị đến lúc hai giờ được không? Sếp sẽ đợi.", "Don't worry. Can you come at two? The boss will wait."),
  ("N", "Una donna alla stazione ha sentito tutto.", "Một phụ nữ ở nhà ga nghe thấy hết.", "A woman at the station heard everything."),
  ("B", "Io vado a Bologna in macchina. Vuole venire con me?", "Tôi đi Bologna bằng xe hơi. Chị đi cùng không?", "I am going to Bologna by car. Would you like to come with me?"),
  ("N", "Mai è andata con lei e ha chiesto il rimborso del biglietto.", "Mai đi cùng chị ấy và xin hoàn tiền vé.", "Mai went with her and asked for a refund on the ticket."),
  ("N", "È arrivata a Bologna a mezzogiorno e ha mangiato un panino.", "Cô đến Bologna lúc giữa trưa và ăn một cái bánh mì kẹp.", "She arrived in Bologna at midday and ate a sandwich."),
  ("N", "Il colloquio è andato bene e il capo è stato molto gentile.", "Cuộc phỏng vấn tốt đẹp và sếp rất tử tế.", "The interview went well and the boss was very kind."),
  ("B", "Lei è arrivata con lo sciopero: per me è una buona cosa. Comincia lunedì!", "Chị vẫn đến được dù đình công: với tôi đó là điều tốt. Thứ Hai chị bắt đầu nhé!", "You got here despite the strike: for me that is a good thing. You start on Monday!")],
 [Q("Vì sao tàu không chạy?", "Why are the trains not running?", [("Vì đình công", "Because of a strike"), ("Vì tuyết", "Because of the snow"), ("Vì tai nạn", "Because of an accident")], 0),
  Q("Mai đến Bologna bằng gì?", "How does Mai get to Bologna?", [("Xe hơi của một phụ nữ", "In a woman's car"), ("Tàu", "By train"), ("Xe buýt", "By bus")], 0),
  Q("Vì sao sếp nhận Mai?", "Why does the boss hire Mai?", [("Vì cô cố gắng đến dù khó khăn", "Because she managed to come despite the difficulty"), ("Vì cô đến rất sớm", "Because she came very early"), ("Vì cô là bạn của ông", "Because she is his friend")], 0, "infer")],
 names=["Mai", "Bologna"], token_map={"era": "essere", "preoccupi": "preoccuparsi"}))
write_batch("13-a2", S)
