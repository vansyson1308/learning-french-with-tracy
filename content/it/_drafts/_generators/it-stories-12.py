"""it-vi graded stories, batch 12: band A2-1, past tense and longer plots. usage: python -I it-stories-12.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from it_stories_lib import story, write_batch

Q = lambda vi, en, opts, ans, kind="locate": (kind, vi, en, opts, ans)
S = []
S.append(story("la_bicicletta_rubata", "A2-1", "La bicicletta rubata",
 ("Xe đạp của Quân bị lấy trộm, và anh đi trình báo.", "Quan's bicycle is stolen and he goes to the police."),
 ["il ladro", "la denuncia", "rubare", "il rumore"],
 [("N", "Ieri mattina Quân è uscito di casa alle otto, come sempre.", "Sáng hôm qua Quân ra khỏi nhà lúc tám giờ như mọi khi.", "Yesterday morning Quan left home at eight, as always."),
  ("N", "La sua bicicletta non era davanti alla porta.", "Xe đạp của anh không còn trước cửa.", "His bicycle was not in front of the door."),
  ("A", "Ma dov'è la mia bicicletta? L'ho lasciata qui ieri sera!", "Xe đạp của tôi đâu rồi? Tối qua tôi để ở đây mà!", "But where is my bicycle? I left it here last night!"),
  ("N", "Ha cercato nella via e dietro la casa, ma non l'ha trovata.", "Anh đã tìm trên phố và sau nhà, nhưng không thấy.", "He looked in the street and behind the house, but did not find it."),
  ("N", "Una vicina è arrivata con il cane.", "Một bà hàng xóm đến cùng con chó.", "A neighbour arrived with her dog."),
  ("B", "Buongiorno! Cosa è successo?", "Chào anh! Có chuyện gì vậy?", "Good morning! What has happened?"),
  ("A", "Qualcuno ha rubato la mia bicicletta.", "Có người đã lấy trộm xe đạp của tôi.", "Someone has stolen my bicycle."),
  ("B", "Mi dispiace! Stanotte ho sentito un rumore, ma non ho guardato fuori.", "Tiếc quá! Đêm qua tôi nghe có tiếng động, nhưng không nhìn ra ngoài.", "I am sorry! Last night I heard a noise, but I did not look outside."),
  ("B", "Deve andare alla polizia e fare una denuncia.", "Anh phải đến cảnh sát và làm đơn trình báo.", "You must go to the police and file a report."),
  ("N", "Quân è andato alla polizia a piedi.", "Quân đi bộ đến đồn cảnh sát.", "Quan walked to the police station."),
  ("N", "Ha aspettato un'ora e poi ha parlato con una donna molto gentile.", "Anh đợi một tiếng rồi nói chuyện với một phụ nữ rất tử tế.", "He waited an hour and then spoke with a very kind woman."),
  ("B", "Di che colore è la bicicletta? È nuova?", "Xe đạp màu gì? Có mới không?", "What colour is the bicycle? Is it new?"),
  ("A", "È rossa e abbastanza vecchia, ma per me è importante.", "Màu đỏ và khá cũ, nhưng với tôi nó quan trọng.", "It is red and quite old, but it is important to me."),
  ("N", "Quân ha scritto il suo nome e il suo indirizzo sul modulo.", "Quân viết tên và địa chỉ vào mẫu đơn.", "Quan wrote his name and address on the form."),
  ("N", "Dopo tre giorni il suo telefono ha suonato.", "Ba ngày sau điện thoại của anh reo.", "Three days later his phone rang."),
  ("B", "Signor Quân? Abbiamo trovato una bicicletta rossa vicino al fiume.", "Anh Quân phải không? Chúng tôi tìm thấy một chiếc xe đạp đỏ gần sông.", "Mr Quan? We have found a red bicycle near the river."),
  ("N", "Quân è corso alla polizia e ha visto la sua bicicletta.", "Quân chạy đến đồn và thấy xe đạp của mình.", "Quan ran to the police station and saw his bicycle."),
  ("A", "È lei! Grazie mille. E il ladro?", "Đúng nó rồi! Cảm ơn nhiều. Còn tên trộm?", "It is mine! Thank you very much. And the thief?"),
  ("B", "Non lo sappiamo. Ma adesso compri una catena forte!", "Chúng tôi không biết. Nhưng giờ anh mua một sợi xích chắc nhé!", "We do not know. But now buy a strong chain!"),
  ("N", "Quel giorno Quân ha comprato una catena nuova, e da allora la bicicletta dorme in casa.", "Hôm đó Quân mua một sợi xích mới, và từ đó xe đạp ở trong nhà.", "That day Quan bought a new chain, and since then the bicycle has slept indoors.")],
 [Q("Quân biết tin xe đạp ở đâu sau bao lâu?", "How long before Quan hears about the bicycle?", [("Ba ngày", "Three days"), ("Một giờ", "An hour"), ("Một tuần", "A week")], 0),
  Q("Xe đạp được tìm thấy ở đâu?", "Where is the bicycle found?", [("Gần sông", "Near the river"), ("Sau nhà", "Behind the house"), ("Ở đồn cảnh sát", "At the police station")], 0),
  Q("Vì sao giờ Quân để xe đạp trong nhà?", "Why does Quan now keep the bicycle indoors?", [("Vì anh sợ bị mất lần nữa", "Because he is afraid of losing it again"), ("Vì trời mưa", "Because it rains"), ("Vì xe đã cũ", "Because it is old")], 0, "infer")],
 names=["Quân"], token_map={"vicina": "il vicino", "signor": "il signore", "era": "essere"}))
write_batch("12-a2", S)
