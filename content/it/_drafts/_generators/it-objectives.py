"""content/it/_drafts/objectives/OUTPUT.jsonl: the blueprint's construct families with Italian can-do statements.
CEFR alignments, categories and evidence notes keep the shape of the German course (same claim policy);
every can-do is rewritten for Italian. usage: python -I it-objectives.py <repo root>"""
import json, os, sys

root = sys.argv[1]
de = json.load(open(f"{root}/content/de/assessment/objectives.json", encoding="utf-8"))["objectives"]
# old id suffix → (new id suffix, title en, title vi, can-do en, can-do vi)
M = {
    "greetings.basic": ("greetings.basic", "Everyday greetings & politeness", "Lời chào & phép lịch sự hằng ngày",
        "I can recognise and write the everyday Italian greetings and politeness formulas — ciao, buongiorno, buonasera, arrivederci, grazie, prego, per favore, scusi — and pick the right one for the situation.",
        "Tôi có thể nhận ra và viết các lời chào và câu lịch sự hằng ngày trong tiếng Ý — ciao, buongiorno, buonasera, arrivederci, grazie, prego, per favore, scusi — và chọn đúng câu cho tình huống."),
    "vocab.everyday_basics": ("vocab.everyday_basics", "Common everyday words", "Từ thông dụng hằng ngày",
        "I can understand and name the course's core everyday words — people, food and drink, animals and familiar objects — with their articles when I read them.",
        "Tôi có thể hiểu và gọi tên các từ cốt lõi hằng ngày của khoá học — người, đồ ăn thức uống, con vật và những đồ vật quen thuộc — kèm mạo từ của chúng khi đọc thấy."),
    "vocab.places_travel": ("vocab.places_travel", "Words for places & travel", "Từ về nơi chốn & đi lại",
        "I can understand common Italian words for places and travel needs — la città, la stazione, l'albergo, il biglietto, il binario — when I read them.",
        "Tôi có thể hiểu các từ tiếng Ý chỉ nơi chốn và nhu cầu đi lại thường gặp — la città, la stazione, l'albergo, il biglietto, il binario — khi đọc thấy chúng."),
    "vocab.time_calendar": ("vocab.time_calendar", "Words for time & the calendar", "Từ về thời gian & lịch",
        "I can use Italian words to talk about time — il giorno, l'ora, il minuto, la settimana, il mese, l'anno — and the days of the week such as lunedì.",
        "Tôi có thể dùng các từ tiếng Ý để nói về thời gian — il giorno, l'ora, il minuto, la settimana, il mese, l'anno — và các ngày trong tuần như lunedì."),
    "numbers.0_100": ("numbers.0_100", "Numbers 0-100", "Số 0-100",
        "I can understand and write every Italian number from zero to cento, including the vowel drop in ventuno and trentotto and the accent in ventitré.",
        "Tôi có thể hiểu và viết mọi số tiếng Ý từ zero đến cento, kể cả việc rụng nguyên âm trong ventuno, trentotto và dấu trong ventitré."),
    "reading.familiar_words": ("reading.familiar_words", "Reading familiar words & short phrases", "Đọc từ quen thuộc & cụm từ ngắn",
        "I can recognise familiar Italian words and very short learned phrases when I see them written, and match them to their meaning.",
        "Tôi có thể nhận ra các từ tiếng Ý quen thuộc và những cụm từ rất ngắn đã học khi thấy chúng được viết ra, và nối chúng với nghĩa."),
    "writing.familiar_words": ("writing.familiar_words", "Writing familiar words & learned forms", "Viết từ quen thuộc & dạng đã học",
        "I can type familiar Italian words and learned forms with correct spelling, double consonants and accents — la città, il caffè, la mamma, ventitré.",
        "Tôi có thể gõ đúng chính tả các từ tiếng Ý quen thuộc và các dạng đã học, có phụ âm kép và dấu — la città, il caffè, la mamma, ventitré."),
    "gender.articles_basic": ("articles.definite", "Definite articles by gender and sound", "Mạo từ xác định theo giống và âm đầu",
        "I can choose the right definite article — il, lo, la or l' — for familiar nouns from their gender and first sound, and I learn each new noun with its article.",
        "Tôi có thể chọn đúng mạo từ xác định — il, lo, la hay l' — cho các danh từ quen thuộc theo giống và âm đầu, và học mỗi danh từ mới cùng mạo từ của nó."),
    "gender.plurals_kein": ("articles.plurals", "Plurals: i, gli, le and the noun's ending", "Số nhiều: i, gli, le và đuôi danh từ",
        "I can form the main plurals — il libro → i libri, l'amico → gli amici, la casa → le case, la città → le città — with the matching article.",
        "Tôi có thể lập các dạng số nhiều chính — il libro → i libri, l'amico → gli amici, la casa → le case, la città → le città — với mạo từ tương ứng."),
    "cases.accusative": ("articles.indefinite_elision", "Indefinite articles & elision", "Mạo từ không xác định & lược âm",
        "I can choose un, uno, una or un' and write the apostrophe correctly — un amico, uno zaino, una casa, un'amica, l'acqua — and recognise al, della, nel in learned phrases.",
        "Tôi có thể chọn un, uno, una hay un' và viết đúng dấu lược — un amico, uno zaino, una casa, un'amica, l'acqua — và nhận ra al, della, nel trong các cụm đã học."),
    "verbs.sein_haben_present": ("verbs.essere_avere_present", "Essere & avere in the present", "Essere & avere ở thì hiện tại",
        "I can use the present forms of essere and avere with every person — sono, sei, è, siamo, ho, hai, ha, abbiamo — to say who I am, how I am and what I have, and c'è / ci sono for what exists.",
        "Tôi có thể dùng các dạng hiện tại của essere và avere với mọi ngôi — sono, sei, è, siamo, ho, hai, ha, abbiamo — để nói mình là ai, thế nào và có gì, và c'è / ci sono để nói có cái gì đó."),
    "verbs.regular_present": ("verbs.regular_present", "Regular verb endings in the present", "Đuôi động từ ở thì hiện tại",
        "I can conjugate common verbs in -are, -ere and -ire in the present — parlo, parli, parla; leggo; dormo — and the -isc- verbs such as capisco, preferisci.",
        "Tôi có thể chia các động từ thường dùng đuôi -are, -ere, -ire ở thì hiện tại — parlo, parli, parla; leggo; dormo — và nhóm -isc- như capisco, preferisci."),
    "word_order.verb_second": ("syntax.negation_questions", "Dropped subject, non & questions", "Lược chủ ngữ, non & câu hỏi",
        "I can leave out the subject pronoun, negate with non before the verb — Non parlo tedesco — and ask questions by intonation and with question words — Parli italiano? Dove abiti?",
        "Tôi có thể lược đại từ chủ ngữ, phủ định bằng non trước động từ — Non parlo tedesco — và đặt câu hỏi bằng ngữ điệu và từ để hỏi — Parli italiano? Dove abiti?"),
    "verbs.separable_modal": ("verbs.modals_piacere", "Modal verbs & mi piace", "Động từ khuyết thiếu & mi piace",
        "I can use volere, potere and dovere with an infinitive — Voglio mangiare, Posso entrare? Devo lavorare — and say what I like with mi piace and mi piacciono.",
        "Tôi có thể dùng volere, potere, dovere với động từ nguyên thể — Voglio mangiare, Posso entrare? Devo lavorare — và nói điều mình thích bằng mi piace, mi piacciono."),
    "verbs.perfekt_recognition": ("verbs.passato_recognition", "Recognising the passato prossimo", "Nhận biết thì quá khứ passato prossimo",
        "I can recognise and use a few very common past forms and tell the two auxiliaries apart — Ho mangiato, Sono andato, Cosa hai fatto? — where Vietnamese only adds \"đã\".",
        "Tôi có thể nhận ra và dùng một số dạng quá khứ rất thông dụng và phân biệt hai trợ động từ — Ho mangiato, Sono andato, Cosa hai fatto? — ở chỗ tiếng Việt chỉ thêm “đã”."),
    "spelling.capitals_umlaut": ("spelling.accents_apostrophe", "Accents & the apostrophe", "Dấu trọng âm & dấu lược",
        "I can write the final-stress accent that changes meaning or form — è / e, la città, il caffè, sì / si — and the apostrophe of l'amico, un'amica, dov'è.",
        "Tôi có thể viết dấu trọng âm cuối làm đổi nghĩa hoặc dạng từ — è / e, la città, il caffè, sì / si — và dấu lược của l'amico, un'amica, dov'è."),
    "pronunciation.vowels_ch": ("pronunciation.double_consonants", "Double consonants & stress", "Phụ âm kép & trọng âm",
        "I can tell double from single consonants by ear — pala / palla, caro / carro, sete / sette, nono / nonno — and I know c, g, sc, gn and gli and where the stress falls.",
        "Tôi có thể nghe phân biệt phụ âm kép với phụ âm đơn — pala / palla, caro / carro, sete / sette, nono / nonno — và biết c, g, sc, gn, gli và vị trí trọng âm."),
    "strategy.cognates_compounds": ("strategy.cognates_false_friends", "International words & false friends", "Từ quốc tế & “bạn giả”",
        "I can guess new words from international words — il taxi, il computer, la pizza — and I know the traps for people who know English, such as la camera (room), il parente (relative), la fattoria (farm).",
        "Tôi có thể đoán nghĩa từ mới nhờ các từ quốc tế — il taxi, il computer, la pizza — và tôi biết các bẫy với người biết tiếng Anh như la camera (căn phòng), il parente (họ hàng), la fattoria (trang trại)."),
    "speaking.formulaic": ("speaking.formulaic", "Speaking familiar formulas", "Nói các câu giao tiếp quen thuộc",
        "I can say the everyday Italian greetings and politeness formulas aloud — ciao, buongiorno, grazie, per favore, scusi, arrivederci — and pick the right one for the situation.",
        "Tôi có thể nói thành tiếng các lời chào và câu lịch sự hằng ngày bằng tiếng Ý — ciao, buongiorno, grazie, per favore, scusi, arrivederci — và chọn đúng câu cho tình huống."),
    "speaking.self_intro": ("speaking.self_intro", "Introducing yourself aloud", "Nói giới thiệu bản thân",
        "I can say simple sentences about myself aloud — my name (Mi chiamo …), where I am from (Sono di Hanoi), where I live, what I speak and what I like — one short sentence at a time.",
        "Tôi có thể nói thành tiếng những câu đơn giản về bản thân — tôi tên gì (Mi chiamo …), từ đâu đến (Sono di Hanoi), sống ở đâu, nói tiếng gì và thích gì — từng câu ngắn một."),
    "writing.form_filling": ("writing.form_filling", "Filling in a simple form", "Điền biểu mẫu đơn giản",
        "I can fill in a simple everyday form in Italian — nome, cognome, età, indirizzo, numero di telefono and similar concrete facts.",
        "Tôi có thể điền một biểu mẫu đơn giản hằng ngày bằng tiếng Ý — nome, cognome, età, indirizzo, numero di telefono và những thông tin cụ thể tương tự."),
    "interaction.everyday_conversation": ("interaction.everyday_conversation", "Everyday conversation", "Trò chuyện hằng ngày",
        "I can take part in a short, simple conversation with a patient partner — greet, ask and answer everyday questions, close — asking the other person to repeat or say it differently (Può ripetere?).",
        "Tôi có thể tham gia một cuộc trò chuyện ngắn, đơn giản với người đối thoại kiên nhẫn — chào hỏi, hỏi và trả lời những câu hằng ngày, rồi kết thúc — nhờ người kia nhắc lại hoặc nói cách khác khi cần (Può ripetere?)."),
    "interaction.practical_needs": ("interaction.practical_needs", "Practical needs & simple transactions", "Nhu cầu thực tế & giao dịch đơn giản",
        "I can ask for everyday things and handle very simple transactions — order, buy, ask the way, ask the time or the price (Quanto costa?) — and understand the short answer.",
        "Tôi có thể hỏi những thứ cần thiết hằng ngày và xử lý giao dịch rất đơn giản — gọi món, mua hàng, hỏi đường, hỏi giờ hoặc giá (Quanto costa?) — và hiểu câu trả lời ngắn."),
}
ID = {k: v[0] for k, v in M.items()}
SAFE = {"Perfekt": "passato prossimo"}
out = []
for o in de:
    suffix = o["id"][len("de.obj."):]
    if suffix in M:
        new, te, tv, ce, cv = M[suffix]
        title, can = {"en": te, "vi": tv}, {"en": ce, "vi": cv}
    else:
        new, title = suffix, o["title"]
        # Language-neutral receptive and productive constructs: only the language name changes.
        can = {k: v.replace("German", "Italian").replace("tiếng Đức", "tiếng Ý") for k, v in o["canDo"].items()}
    r = {**o, "id": f"it.obj.{new}", "title": title, "canDo": can, "prerequisites": [f"it.obj.{ID.get(p[len('de.obj.'):], p[len('de.obj.'):])}" for p in o["prerequisites"]]}
    if "evidenceNote" in r:
        note = r["evidenceNote"].replace("the German is never shown", "the Italian is never shown").replace("de.obj.", "it.obj.")
        if suffix == "verbs.perfekt_recognition":
            note = "Introduced with high-frequency participles only: the full past system is not taught, and agreement after essere is recognition only (A1 production does not require it)."
        if suffix == "cases.accusative":
            note = "Articulated prepositions (al, della, nel) appear only in learned phrases, never as a paradigm."
        r["evidenceNote"] = note
    out.append(r)
for r in out:
    blob = json.dumps(r, ensure_ascii=False)
    for bad in ("de.obj", "Deutsch", "German", "tiếng Đức"):
        if bad in blob:
            raise SystemExit(f"{r['id']}: {bad}")
os.makedirs(f"{root}/content/it/_drafts/objectives", exist_ok=True)
with open(f"{root}/content/it/_drafts/objectives/OUTPUT.jsonl", "w", encoding="utf-8", newline="\n") as f:
    for r in out:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
print(len(out), "objectives")
