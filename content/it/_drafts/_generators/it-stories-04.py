"""it-vi graded stories, batch 4: remaining syllabus words in everyday situations. usage: python -I it-stories-04.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from it_stories_lib import story, write_batch

Q = lambda vi, en, opts, ans, kind="locate": (kind, vi, en, opts, ans)
S = []
S.append(story("l_esame", "A1-2", "L'esame di Linh",
 ("Linh chuẩn bị cho kỳ thi tiếng Ý.", "Linh prepares for her Italian exam."),
 ["l'esame", "difficile", "la paura", "sbagliato"],
 [("N", "Linh è giovane e studia l'italiano da un anno.", "Linh còn trẻ và học tiếng Ý được một năm.", "Linh is young and has been studying Italian for a year."),
  ("N", "Domani ha un esame molto importante.", "Ngày mai cô có một kỳ thi rất quan trọng.", "Tomorrow she has a very important exam."),
  ("N", "Ieri ha ripetuto tutte le parole e tutte le frasi.", "Hôm qua cô đã ôn tất cả từ và câu.", "Yesterday she went over all the words and sentences."),
  ("A", "Ho paura, professore. L'esame è difficile!", "Em sợ, thưa thầy. Kỳ thi khó quá!", "I am afraid, sir. The exam is difficult!"),
  ("B", "No, Linh. Per te è facile. Sei brava e sei pronta.", "Không đâu, Linh. Với em thì dễ. Em giỏi và đã sẵn sàng.", "No, Linh. For you it is easy. You are clever and you are ready."),
  ("A", "Ma se una risposta è sbagliata?", "Nhưng nếu một câu trả lời sai thì sao?", "But what if an answer is wrong?"),
  ("B", "Non è un problema. Leggi bene ogni domanda e ogni pagina.", "Không sao. Đọc kỹ từng câu hỏi và từng trang.", "It is not a problem. Read every question and every page carefully."),
  ("B", "Non dimenticare la penna e il passaporto.", "Đừng quên bút và hộ chiếu.", "Do not forget your pen and passport."),
  ("N", "La sera Linh è sola a casa e non ha voglia di mangiare.", "Buổi tối Linh ở nhà một mình và không muốn ăn.", "In the evening Linh is alone at home and does not feel like eating."),
  ("N", "Sua madre chiama dal Vietnam.", "Mẹ cô gọi từ Việt Nam.", "Her mother calls from Vietnam."),
  ("A", "Mamma, sono un po' triste.", "Mẹ ơi, con hơi buồn.", "Mum, I am a little sad."),
  ("B", "Non avere paura. Credo in te. Buona fortuna!", "Đừng sợ. Mẹ tin con. Chúc may mắn!", "Do not be afraid. I believe in you. Good luck!"),
  ("N", "La mattina dopo Linh si alza presto, fa colazione ed esce.", "Sáng hôm sau Linh dậy sớm, ăn sáng rồi ra ngoài.", "The next morning Linh gets up early, has breakfast and goes out."),
  ("N", "L'esame comincia alle nove e finisce a mezzogiorno.", "Kỳ thi bắt đầu lúc chín giờ và kết thúc lúc giữa trưa.", "The exam starts at nine and ends at midday."),
  ("N", "Le domande non sono difficili.", "Các câu hỏi không khó.", "The questions are not difficult."),
  ("N", "Un mese dopo arriva un'email: Linh ha passato l'esame!", "Một tháng sau có email: Linh đã đậu kỳ thi!", "A month later an email arrives: Linh has passed the exam!"),
  ("A", "Mamma, è una buona notizia! Sono davvero felice!", "Mẹ ơi, tin tốt! Con thật sự hạnh phúc!", "Mum, it is good news! I am really happy!")],
 [Q("Kỳ thi kết thúc lúc nào?", "When does the exam end?", [("Giữa trưa", "At midday"), ("Chín giờ", "At nine"), ("Buổi tối", "In the evening")], 0),
  Q("Ai gọi cho Linh?", "Who calls Linh?", [("Mẹ cô", "Her mother"), ("Thầy giáo", "Her teacher"), ("Một người bạn", "A friend")], 0),
  Q("Vì sao Linh không muốn ăn?", "Why does Linh not feel like eating?", [("Vì cô lo về kỳ thi", "Because she is worried about the exam"), ("Vì cô bị ốm", "Because she is ill"), ("Vì cô đã ăn rồi", "Because she has already eaten")], 0, "infer")],
 names=["Linh"], token_map={"ripetuto": "ripetere", "passato": "passare"}))
write_batch("04-resto", S)
