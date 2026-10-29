"""Build content/de/_drafts/concepts/OUTPUT.jsonl for de-vi (concept cards + paradigms)."""
import json

OUT = r"C:\src\lft\content\de\_drafts\concepts\OUTPUT.jsonl"
MORPH = r"C:\src\lft\content\de\lexicon\derived\morphology.json"
COURSE = {"source": "original-german-course"}
GENDER = {"source": "kaikki-en", "key": "gender-stats"}
MORPHO = {"source": "kaikki-en", "key": "verb-morphology"}

recs = []


def ex(target, vi, en, note_vi=None, note_en=None):
    e = {"target": target, "translations": {"vi": vi, "en": en}}
    if note_vi:
        e["note"] = {"vi": note_vi, "en": note_en}
    return e


def concept(cid, title, short, expl, examples, exceptions, hint, objectives, refs=(COURSE,)):
    recs.append({
        "id": f"de:concept:{cid}",
        "title": {"vi": title[0], "en": title[1]},
        "shortRule": {"vi": short[0], "en": short[1]},
        "explanation": {"vi": expl[0], "en": expl[1]},
        "examples": examples,
        "exceptions": [{"vi": v, "en": e} for v, e in exceptions],
        "memoryHint": {"vi": hint[0], "en": hint[1]},
        "objectives": [f"de.obj.{o}" for o in objectives],
        "sourceRefs": list(refs),
    })


concept("three-genders",
        ("Mọi danh từ tiếng Đức đều có giống", "Every German noun has a gender"),
        ("Danh từ là giống đực (der), giống cái (die) hoặc giống trung (das) — học mạo từ cùng danh từ.", "A noun is masculine (der), feminine (die) or neuter (das) — learn the article with the noun."),
        ("Tiếng Đức xếp mọi danh từ vào ba giống. Đây là thuộc tính của từ, không phải của sự vật: cái bàn (der Tisch) là giống đực, cái cửa (die Tür) là giống cái, cô bé (das Mädchen) lại là giống trung. Tiếng Việt không có mạo từ, nên hãy luôn học danh từ kèm der, die hoặc das.",
         "German sorts every noun into three genders. It is a property of the word, not of the thing: the table (der Tisch) is masculine, the door (die Tür) feminine, and the girl (das Mädchen) neuter. Always learn a noun with der, die or das."),
        [ex("der Tisch", "cái bàn", "the table", "giống đực — der", "masculine — der"),
         ex("die Tür", "cái cửa", "the door", "giống cái — die", "feminine — die"),
         ex("das Fenster", "cửa sổ", "the window", "giống trung — das", "neuter — das")],
        [("Giống không theo giới tính thật: das Mädchen (cô bé) là giống trung.", "Gender does not follow sex: das Mädchen (the girl) is neuter.")],
        ("Học «der Tisch», đừng chỉ học «Tisch».", "Learn 'der Tisch', never just 'Tisch'."),
        ["gender.articles_basic"])

concept("gender-endings",
        ("Đuôi từ gợi ý giống", "Endings that hint at the gender"),
        ("-ung, -heit, -keit, -ion, -tät hầu như luôn là die; -chen là das; -er thường là der.", "-ung, -heit, -keit, -ion, -tät are almost always die; -chen is das; -er is usually der."),
        ("Trong 12.358 danh từ của dữ liệu từ điển khoá học, đuôi -ung là giống cái ở 99,1 %, -heit/-keit ở 98,7 %, -ion ở 98,2 % và -tät ở cả 59/59 từ. Đuôi -e là giống cái ở 84,9 %, đuôi -er là giống đực ở 80,9 %. Từ nhỏ hóa -chen là giống trung. Khi gặp từ mới, hãy đoán theo đuôi trước rồi kiểm tra.",
         "Across 12,358 nouns in the course's dictionary data, -ung is feminine 99.1% of the time, -heit/-keit 98.7%, -ion 98.2% and -tät in all 59 words. -e is feminine 84.9% of the time and -er masculine 80.9%. Diminutives in -chen are neuter. Guess from the ending, then check."),
        [ex("die Wohnung", "căn hộ", "the flat", "-ung → die", "-ung → die"),
         ex("die Information", "thông tin", "the information", "-ion → die", "-ion → die"),
         ex("das Mädchen", "cô bé", "the girl", "-chen → das", "-chen → das"),
         ex("der Lehrer", "thầy giáo", "the teacher", "-er → thường der", "-er → usually der")],
        [("Đuôi -e có ngoại lệ hay gặp: der Junge, der Name, das Ende.", "-e has common exceptions: der Junge, der Name, das Ende."),
         ("Đuôi -er có ngoại lệ: die Mutter, die Tochter, das Fenster.", "-er has exceptions: die Mutter, die Tochter, das Fenster.")],
        ("-ung, -heit, -keit, -ion: chắc chắn die.", "-ung, -heit, -keit, -ion: safely die."),
        ["gender.articles_basic"], (COURSE, GENDER))

concept("ein-kein",
        ("Ein, eine và kein", "Ein, eine and kein"),
        ("Ein đi với der và das, eine đi với die; phủ định danh từ bằng kein / keine.", "Ein goes with der and das nouns, eine with die nouns; negate a noun with kein / keine."),
        ("Mạo từ không xác định giống như «một» trong tiếng Việt: ein Tisch (der), eine Tür (die), ein Fenster (das). Muốn nói «không có» một danh từ, đặt k- trước: kein Tisch, keine Tür, kein Fenster. Với động từ hoặc tính từ thì dùng nicht: Ich komme nicht.",
         "The indefinite article is like 'a': ein Tisch (der), eine Tür (die), ein Fenster (das). To say 'no' with a noun, add k-: kein Tisch, keine Tür, kein Fenster. With verbs or adjectives use nicht: Ich komme nicht."),
        [ex("Ich habe ein Auto.", "Tôi có một chiếc ô tô.", "I have a car."),
         ex("Ich habe kein Auto.", "Tôi không có ô tô.", "I don't have a car.", "danh từ → kein", "noun → kein"),
         ex("Das Wetter ist nicht schön.", "Thời tiết không đẹp.", "The weather is not nice.", "tính từ → nicht", "adjective → nicht")],
        [("Số nhiều không có ein, nhưng có keine: Ich habe keine Kinder.", "There is no plural ein, but there is keine: Ich habe keine Kinder.")],
        ("Danh từ → kein; còn lại → nicht.", "Noun → kein; everything else → nicht."),
        ["gender.plurals_kein", "gender.articles_basic"])

concept("plurals",
        ("Số nhiều: nhiều mẫu, một mạo từ", "Plurals: many patterns, one article"),
        ("Số nhiều có năm mẫu chính (-e, -en/-n, -er, ¨, -s), nhưng mạo từ số nhiều luôn là die.", "There are five main plural patterns (-e, -en/-n, -er, umlaut, -s), but the plural article is always die."),
        ("Tiếng Việt chỉ thêm «những, các»; tiếng Đức đổi chính danh từ. Hầu hết danh từ giống cái thêm -en hoặc -n (die Frau → die Frauen). Nhiều danh từ thêm -e (der Tisch → die Tische), -er kèm umlaut (das Kind → die Kinder, das Haus → die Häuser), chỉ thêm umlaut (die Mutter → die Mütter), hoặc -s với từ mượn (das Auto → die Autos). Mạo từ số nhiều luôn là die.",
         "Vietnamese adds 'những, các'; German changes the noun. Most feminine nouns add -en or -n (die Frauen). Many nouns add -e (die Tische), -er often with umlaut (die Kinder, die Häuser), an umlaut only (die Mütter), or -s for loanwords (die Autos). The plural article is always die."),
        [ex("die Frau → die Frauen", "người phụ nữ → những người phụ nữ", "woman → women", "-en", "-en"),
         ex("das Kind → die Kinder", "đứa trẻ → những đứa trẻ", "child → children", "-er", "-er"),
         ex("der Apfel → die Äpfel", "quả táo → những quả táo", "apple → apples", "chỉ thêm umlaut", "umlaut only"),
         ex("das Auto → die Autos", "ô tô → những chiếc ô tô", "car → cars", "-s (từ mượn)", "-s (loanword)")],
        [("Một số danh từ không đổi ở số nhiều: das Fenster → die Fenster.", "Some nouns do not change: das Fenster → die Fenster.")],
        ("Học ba thứ một lúc: der Tisch, die Tische.", "Learn three things at once: der Tisch, die Tische."),
        ["gender.plurals_kein"])

concept("accusative",
        ("Tân ngữ giống đực: der → den", "Masculine objects: der → den"),
        ("Khi danh từ giống đực làm tân ngữ, der đổi thành den và ein thành einen; die và das không đổi.", "When a masculine noun is the object, der becomes den and ein becomes einen; die and das stay."),
        ("Tiếng Việt dùng trật tự từ để biết ai làm gì. Tiếng Đức còn đổi mạo từ: chủ ngữ ở chủ cách (Nominativ), tân ngữ trực tiếp ở đối cách (Akkusativ). Ở trình độ A1, chỉ giống đực đổi: Der Bus kommt. → Ich nehme den Bus. Giống cái, giống trung và số nhiều giữ nguyên.",
         "Vietnamese uses word order to show who does what. German also changes the article: the subject is nominative, the direct object accusative. At A1 only the masculine changes: Der Bus kommt. → Ich nehme den Bus. Feminine, neuter and plural stay the same."),
        [ex("Der Kaffee ist heiß.", "Cà phê nóng.", "The coffee is hot.", "chủ ngữ — der", "subject — der"),
         ex("Ich trinke den Kaffee.", "Tôi uống cà phê.", "I drink the coffee.", "tân ngữ — den", "object — den"),
         ex("Ich habe einen Bruder.", "Tôi có một anh/em trai.", "I have a brother.", "ein → einen", "ein → einen"),
         ex("Ich habe eine Schwester.", "Tôi có một chị/em gái.", "I have a sister.", "eine không đổi", "eine stays")],
        [("Sau haben, möchten, brauchen, nehmen, kaufen tân ngữ ở đối cách: Ich möchte einen Tee.", "After haben, möchten, brauchen, nehmen, kaufen the object is accusative: Ich möchte einen Tee.")],
        ("Chỉ «anh chàng» der đổi áo: den, einen.", "Only masculine der changes its coat: den, einen."),
        ["cases.accusative"])

concept("dative-phrases",
        ("Tặng cách trong cụm cố định", "The dative in set phrases"),
        ("Sau mit, in, bei, zu… mạo từ đổi sang tặng cách: mit dem Bus, im Haus, zum Bahnhof.", "After mit, in, bei, zu… the article changes to the dative: mit dem Bus, im Haus, zum Bahnhof."),
        ("Tặng cách (Dativ) là cách thứ ba. Ở trình độ A1, bạn chỉ cần nhớ một số cụm hay gặp như một khối: mit dem Bus (bằng xe buýt), mit der Bahn (bằng tàu), im Haus (trong nhà; im = in dem), zum Bahnhof (đến nhà ga; zum = zu dem), zur Arbeit (đi làm; zur = zu der). Bảng đầy đủ sẽ học ở trình độ sau.",
         "The dative is the third case. At A1 you only need to remember some frequent phrases as chunks: mit dem Bus, mit der Bahn, im Haus (im = in dem), zum Bahnhof (zum = zu dem), zur Arbeit (zur = zu der). The full table comes at a later level."),
        [ex("Ich fahre mit dem Bus.", "Tôi đi bằng xe buýt.", "I go by bus."),
         ex("Wir sind im Haus.", "Chúng tôi ở trong nhà.", "We are in the house.", "im = in dem", "im = in dem"),
         ex("Wie komme ich zum Bahnhof?", "Tôi đến nhà ga bằng cách nào?", "How do I get to the station?", "zum = zu dem", "zum = zu dem")],
        [("in + chuyển động dùng đối cách: Ich gehe ins Kino (ins = in das).", "in + motion takes the accusative: Ich gehe ins Kino (ins = in das).")],
        ("Học cả cụm: mit dem Bus, zum Bahnhof, zur Arbeit.", "Learn the whole chunk: mit dem Bus, zum Bahnhof, zur Arbeit."),
        ["cases.accusative", "vocab.places_travel"])

concept("present-endings",
        ("Đuôi động từ ở thì hiện tại", "Present-tense endings"),
        ("Bỏ -en của nguyên thể rồi thêm -e, -st, -t, -en, -t, -en.", "Drop -en from the infinitive and add -e, -st, -t, -en, -t, -en."),
        ("Tiếng Việt không chia động từ: tôi ở, bạn ở. Tiếng Đức đổi đuôi theo ngôi. Với wohnen: ich wohne, du wohnst, er/sie/es wohnt, wir wohnen, ihr wohnt, sie/Sie wohnen. Gốc kết thúc bằng -t hoặc -d thêm -e- để dễ đọc: du arbeitest, er arbeitet.",
         "Vietnamese verbs never change. German endings follow the person. With wohnen: ich wohne, du wohnst, er/sie/es wohnt, wir wohnen, ihr wohnt, sie/Sie wohnen. Stems in -t or -d add -e- to stay pronounceable: du arbeitest, er arbeitet."),
        [ex("Ich wohne in Berlin.", "Tôi sống ở Berlin.", "I live in Berlin.", "ich → -e", "ich → -e"),
         ex("Du wohnst in Hamburg.", "Bạn sống ở Hamburg.", "You live in Hamburg.", "du → -st", "du → -st"),
         ex("Sie arbeitet heute.", "Hôm nay cô ấy làm việc.", "She works today.", "arbeit- + -e- + -t", "arbeit- + -e- + -t")],
        [("Sie viết hoa (ông/bà, lịch sự) chia giống sie (họ): Sie wohnen.", "Capital Sie (polite you) conjugates like sie (they): Sie wohnen.")],
        ("e – st – t – en – t – en: «e sờ tê, en tê en».", "e – st – t – en – t – en."),
        ["verbs.regular_present"], (COURSE, MORPHO))

concept("sein-haben",
        ("Sein và haben", "Sein and haben"),
        ("Sein (là, ở) và haben (có) bất quy tắc — học thuộc: ich bin, du bist, er ist; ich habe, du hast, er hat.", "Sein (be) and haben (have) are irregular — learn them: ich bin, du bist, er ist; ich habe, du hast, er hat."),
        ("Hai động từ này xuất hiện trong gần như mọi câu A1, và cũng dùng để tạo thì quá khứ Perfekt. Tiếng Việt nói «tôi hai mươi tuổi»; tiếng Đức cần sein: Ich bin zwanzig Jahre alt. Haben dùng cho sở hữu và nhiều cụm cố định: Ich habe Hunger (tôi đói), Ich habe Zeit (tôi rảnh).",
         "These two verbs appear in almost every A1 sentence and also build the Perfekt. Vietnamese says 'I twenty years old'; German needs sein: Ich bin zwanzig Jahre alt. Haben expresses possession and many set phrases: Ich habe Hunger, Ich habe Zeit."),
        [ex("Ich bin Studentin.", "Tôi là sinh viên.", "I am a student."),
         ex("Bist du müde?", "Bạn mệt không?", "Are you tired?"),
         ex("Wir haben Zeit.", "Chúng tôi rảnh.", "We have time."),
         ex("Hast du Hunger?", "Bạn đói không?", "Are you hungry?", "đói = có cơn đói", "hungry = to have hunger")],
        [("Khi nói nghề, không dùng mạo từ: Ich bin Lehrer (không phải ein Lehrer).", "No article with professions: Ich bin Lehrer.")],
        ("bin – bist – ist – sind – seid – sind.", "bin – bist – ist – sind – seid – sind."),
        ["verbs.sein_haben_present"], (COURSE, MORPHO))

concept("vowel-change",
        ("Động từ đổi nguyên âm", "Stem-changing verbs"),
        ("Một số động từ đổi nguyên âm ở du và er/sie/es: sprechen → sprichst, fahren → fährst, essen → isst.", "Some verbs change their vowel with du and er/sie/es: sprechen → sprichst, fahren → fährst, essen → isst."),
        ("Đuôi vẫn đều, chỉ nguyên âm của gốc đổi, và chỉ ở hai ngôi du và er/sie/es. Ba kiểu hay gặp: e → i (sprechen → du sprichst, nehmen → er nimmt), e → ie (lesen → du liest, sehen → er sieht), a → ä (fahren → du fährst, schlafen → er schläft). Ngôi ich, wir, ihr, sie giữ nguyên.",
         "The endings stay regular; only the stem vowel changes, and only with du and er/sie/es. Three common types: e → i (du sprichst, er nimmt), e → ie (du liest, er sieht), a → ä (du fährst, er schläft). ich, wir, ihr, sie keep the vowel."),
        [ex("Ich spreche Deutsch. Er spricht Englisch.", "Tôi nói tiếng Đức. Anh ấy nói tiếng Anh.", "I speak German. He speaks English.", "e → i", "e → i"),
         ex("Du fährst nach Berlin.", "Bạn đi Berlin.", "You are going to Berlin.", "a → ä", "a → ä"),
         ex("Sie liest ein Buch.", "Cô ấy đọc một cuốn sách.", "She reads a book.", "e → ie", "e → ie")],
        [("essen → du isst, er isst: gốc kết thúc bằng -ss nên du chỉ thêm -t.", "essen → du isst, er isst: the stem ends in -ss, so du only adds -t.")],
        ("Chỉ du và er/sie/es «đổi giọng».", "Only du and er/sie/es change their voice."),
        ["verbs.regular_present"], (COURSE, MORPHO))

concept("verb-second",
        ("Động từ đứng thứ hai", "The verb comes second"),
        ("Trong câu kể, động từ chia luôn ở vị trí thứ hai; nếu câu bắt đầu bằng từ khác, chủ ngữ đứng sau động từ.", "In a statement the conjugated verb is always in second place; if something else comes first, the subject follows the verb."),
        ("Tiếng Việt nói «Hôm nay tôi học» và «Tôi học hôm nay» với cùng trật tự chủ ngữ – động từ. Tiếng Đức giữ động từ ở ô thứ hai: Ich lerne heute. → Heute lerne ich. Ô thứ nhất có thể là chủ ngữ, từ chỉ thời gian hay nơi chốn, nhưng động từ không bao giờ rời ô thứ hai. Thứ tự thời gian – cách thức – nơi chốn thường gặp: Ich fahre heute mit dem Bus nach Hause.",
         "Vietnamese keeps subject–verb order. German keeps the verb in slot two: Ich lerne heute. → Heute lerne ich. Slot one can be the subject, a time or a place, but the verb never leaves slot two. A common order is time – manner – place: Ich fahre heute mit dem Bus nach Hause."),
        [ex("Ich lerne heute Deutsch.", "Hôm nay tôi học tiếng Đức.", "I am learning German today."),
         ex("Heute lerne ich Deutsch.", "Hôm nay tôi học tiếng Đức.", "Today I am learning German.", "Heute ở ô 1 → ich sau động từ", "Heute first → ich after the verb"),
         ex("Am Montag arbeite ich.", "Thứ Hai tôi làm việc.", "On Monday I work.")],
        [("Und, aber, oder không chiếm ô nào: Ich bin müde, aber ich arbeite.", "Und, aber, oder take no slot: Ich bin müde, aber ich arbeite.")],
        ("Động từ luôn là toa thứ hai của đoàn tàu.", "The verb is always the second carriage of the train."),
        ["word_order.verb_second"])

concept("questions",
        ("Câu hỏi có/không và câu hỏi W-", "Yes/no questions and W-questions"),
        ("Câu hỏi có/không đặt động từ lên đầu; câu hỏi W- đặt từ hỏi đầu tiên, động từ thứ hai.", "Yes/no questions put the verb first; W-questions put the question word first and the verb second."),
        ("Tiếng Việt thêm «không?» hoặc «à?» ở cuối câu. Tiếng Đức đổi chỗ: Du wohnst in Köln. → Wohnst du in Köln? Với câu hỏi lấy thông tin, từ hỏi đứng đầu: wer (ai), was (gì), wo (ở đâu), woher (từ đâu), wann (khi nào), wie (thế nào), warum (tại sao). Lưu ý: wer là «ai», không phải «ở đâu».",
         "Vietnamese adds a particle at the end. German swaps: Du wohnst in Köln. → Wohnst du in Köln? Information questions start with the W-word: wer, was, wo, woher, wann, wie, warum. Note that wer means 'who', not 'where'."),
        [ex("Kommst du aus Vietnam?", "Bạn đến từ Việt Nam à?", "Are you from Vietnam?", "động từ đầu câu", "verb first"),
         ex("Wo wohnst du?", "Bạn sống ở đâu?", "Where do you live?"),
         ex("Wer ist das?", "Đó là ai?", "Who is that?", "wer = ai", "wer = who"),
         ex("Wann beginnt der Kurs?", "Khóa học bắt đầu khi nào?", "When does the course start?")],
        [("Trả lời câu hỏi phủ định bằng doch: Kommst du nicht? — Doch!", "Answer a negative question with doch: Kommst du nicht? — Doch!")],
        ("W- hỏi thông tin; động từ đầu câu hỏi có/không.", "W- asks for information; verb-first asks yes or no."),
        ["word_order.verb_second"])

concept("separable-verbs",
        ("Động từ tách", "Separable verbs"),
        ("Tiền tố của động từ tách (an-, auf-, ein-, mit-…) chạy xuống cuối câu: anrufen → Ich rufe dich an.", "The prefix of a separable verb (an-, auf-, ein-, mit-…) goes to the end: anrufen → Ich rufe dich an."),
        ("Nhiều động từ thông dụng gồm một tiền tố và một động từ: an + rufen = anrufen (gọi điện), auf + stehen = aufstehen (thức dậy), ein + kaufen = einkaufen (mua sắm). Khi chia, phần động từ đứng thứ hai, tiền tố đứng cuối câu, tạo thành «hai mảnh» ôm lấy câu. Ở nguyên thể và cuối câu, chúng lại viết liền.",
         "Many common verbs are a prefix plus a verb: anrufen, aufstehen, einkaufen. When conjugated, the verb part sits in slot two and the prefix goes to the end, framing the sentence. In the infinitive they are written as one word again."),
        [ex("Ich stehe um sieben Uhr auf.", "Tôi thức dậy lúc bảy giờ.", "I get up at seven.", "aufstehen", "aufstehen"),
         ex("Wir kaufen am Samstag ein.", "Thứ Bảy chúng tôi đi mua sắm.", "We go shopping on Saturday.", "einkaufen", "einkaufen"),
         ex("Ich rufe dich morgen an.", "Ngày mai mình gọi cho bạn.", "I will call you tomorrow.", "anrufen", "anrufen")],
        [("Với động từ khuyết thiếu, động từ tách đứng nguyên ở cuối: Ich muss früh aufstehen.", "With a modal verb the separable verb stays whole at the end: Ich muss früh aufstehen.")],
        ("Tiền tố «đi dạo» xuống cuối câu.", "The prefix takes a walk to the end of the sentence."),
        ["verbs.separable_modal", "word_order.verb_second"], (COURSE, MORPHO))

concept("modal-verbs",
        ("Können, müssen, möchten", "Können, müssen, möchten"),
        ("Động từ khuyết thiếu đứng thứ hai, động từ chính ở nguyên thể và về cuối câu.", "The modal verb is in slot two; the main verb stays in the infinitive at the end."),
        ("Tiếng Việt đặt «có thể, phải, muốn» ngay trước động từ: tôi có thể nói. Tiếng Đức tách hai động từ ra hai đầu: Ich kann Deutsch sprechen. Ngôi ich và er/sie/es giống nhau và không có đuôi: ich kann, er kann; ich muss, sie muss. Möchte (muốn, lịch sự) chia: ich möchte, du möchtest, er möchte.",
         "Vietnamese puts 'can, must, want' right before the verb. German splits the two verbs: Ich kann Deutsch sprechen. ich and er/sie/es are identical and have no ending: ich kann, er kann; ich muss, sie muss. Möchte (would like) goes ich möchte, du möchtest, er möchte."),
        [ex("Ich kann gut schwimmen.", "Tôi bơi giỏi.", "I can swim well."),
         ex("Du musst heute arbeiten.", "Hôm nay bạn phải làm việc.", "You have to work today."),
         ex("Ich möchte einen Tee trinken.", "Tôi muốn uống một cốc trà.", "I would like to drink a tea."),
         ex("Ich möchte einen Kaffee.", "Cho tôi một cà phê.", "I'd like a coffee.", "không cần động từ thứ hai", "no second verb needed")],
        [("Không thêm -t ở ngôi er: er kann (không phải er kannt).", "No -t with er: er kann, not er kannt.")],
        ("Khuyết thiếu ở ô hai, nguyên thể ở cuối.", "Modal in slot two, infinitive at the end."),
        ["verbs.separable_modal"], (COURSE, MORPHO))

concept("perfekt",
        ("Quá khứ khi nói: Perfekt", "The spoken past: Perfekt"),
        ("Haben hoặc sein ở vị trí thứ hai + phân từ (thường ge-…-t hoặc ge-…-en) ở cuối câu.", "Haben or sein in slot two + the participle (usually ge-…-t or ge-…-en) at the end."),
        ("Tiếng Việt thêm «đã»: tôi đã ăn. Tiếng Đức khi nói chuyện thường dùng Perfekt: Ich habe gegessen. Phần lớn động từ dùng haben; động từ chỉ di chuyển hoặc thay đổi trạng thái dùng sein: Ich bin gefahren, Er ist gekommen. Ở trình độ này, chỉ cần nhận ra và dùng những phân từ hay gặp nhất.",
         "Vietnamese adds 'đã'. Spoken German mostly uses the Perfekt: Ich habe gegessen. Most verbs take haben; verbs of motion or change take sein: Ich bin gefahren, Er ist gekommen. At this level you only need to recognise and use the most frequent participles."),
        [ex("Ich habe Pizza gegessen.", "Tôi đã ăn pizza.", "I ate pizza.", "haben + gegessen", "haben + gegessen"),
         ex("Was hast du gemacht?", "Bạn đã làm gì?", "What did you do?"),
         ex("Wir sind nach Berlin gefahren.", "Chúng tôi đã đi Berlin.", "We went to Berlin.", "di chuyển → sein", "motion → sein")],
        [("Sein và haben thường dùng dạng quá khứ ngắn: ich war (tôi đã ở), ich hatte (tôi đã có).", "Sein and haben usually use the short past: ich war, ich hatte.")],
        ("Đi đâu đó → sein; làm gì đó → haben.", "Going somewhere → sein; doing something → haben."),
        ["verbs.perfekt_recognition"], (COURSE, MORPHO))

concept("numbers",
        ("Số đếm: đơn vị trước, hàng chục sau", "Numbers: units before tens"),
        ("Từ 21 đến 99, đọc đơn vị trước rồi «und» rồi hàng chục: 21 = einundzwanzig.", "From 21 to 99, say the unit, then und, then the tens: 21 = einundzwanzig."),
        ("Tiếng Việt đọc «hai mươi mốt» — chục trước, đơn vị sau. Tiếng Đức ngược lại: einundzwanzig (một và hai mươi), fünfundvierzig (năm và bốn mươi). Số 13–19 thêm -zehn: dreizehn, vierzehn. Lưu ý chính tả: sechzehn, siebzehn (bỏ bớt chữ), dreißig (có ß, không có z).",
         "Vietnamese says tens first. German reverses: einundzwanzig (one and twenty), fünfundvierzig. 13–19 add -zehn: dreizehn, vierzehn. Spelling traps: sechzehn, siebzehn (letters dropped), dreißig (with ß, no z)."),
        [ex("einundzwanzig", "hai mươi mốt (21)", "twenty-one (21)", "1 + 20", "1 + 20"),
         ex("Ich bin dreißig Jahre alt.", "Tôi ba mươi tuổi.", "I am thirty years old."),
         ex("Das kostet siebzehn Euro.", "Cái này giá mười bảy euro.", "That costs seventeen euros.")],
        [("eins khi đếm, nhưng ein trước danh từ: eins, zwei, drei — ein Euro.", "eins when counting, ein before a noun: eins, zwei, drei — ein Euro.")],
        ("Nghe đến hết rồi mới viết: einund… zwanzig!", "Listen to the end before writing: einund… zwanzig!"),
        ["numbers.0_100"])

concept("clock-time",
        ("Nói giờ: halb drei là 2 giờ 30", "Telling the time: halb drei is 2:30"),
        ("Halb + giờ tiếp theo = nửa tiếng trước giờ đó: halb drei là 2 giờ 30.", "Halb + the next hour = half an hour before it: halb drei is 2:30."),
        ("Cách nói chính thức đơn giản: Es ist acht Uhr dreißig (8:30). Trong đời thường người Đức hay nói halb neun — «nửa đường đến chín giờ», tức 8 giờ 30. Đây là bẫy lớn với người Việt vì «chín rưỡi» lại là 9 giờ 30. Viertel nach drei là 3:15, Viertel vor vier là 3:45. Hỏi giờ: Wie spät ist es? Lúc mấy giờ: um acht Uhr.",
         "The official way is simple: Es ist acht Uhr dreißig (8:30). In everyday speech Germans say halb neun — 'half way to nine', i.e. 8:30. Viertel nach drei is 3:15, Viertel vor vier is 3:45. Ask Wie spät ist es?; at a time: um acht Uhr."),
        [ex("Es ist halb drei.", "Bây giờ là 2 giờ 30.", "It is half past two.", "không phải 3:30!", "not 3:30!"),
         ex("Der Zug kommt um acht Uhr.", "Tàu đến lúc tám giờ.", "The train arrives at eight."),
         ex("Es ist Viertel nach vier.", "Bây giờ là 4 giờ 15.", "It is quarter past four.")],
        [("Ở thông báo nhà ga dùng giờ 24: 14:30 = vierzehn Uhr dreißig.", "Station announcements use the 24-hour clock: 14:30 = vierzehn Uhr dreißig.")],
        ("halb = đang đi nửa đường tới giờ sau.", "halb = halfway to the next hour."),
        ["numbers.0_100", "vocab.time_calendar"])

concept("du-sie",
        ("Du hay Sie?", "Du or Sie?"),
        ("Du với bạn bè, gia đình, trẻ em; Sie (viết hoa) với người lạ, người lớn tuổi và ở nơi làm việc.", "Du with friends, family and children; Sie (capitalised) with strangers, older people and at work."),
        ("Tiếng Việt có rất nhiều đại từ xưng hô; tiếng Đức chỉ có hai mức: du (thân mật) và Sie (lịch sự). Sie luôn viết hoa và chia động từ như ngôi «họ»: Wie heißen Sie? Khi không chắc, hãy dùng Sie và chờ người kia đề nghị dùng du. Mệnh lệnh lịch sự cũng dùng Sie: Nehmen Sie Platz!",
         "Vietnamese has many forms of address; German has two levels: du (informal) and Sie (polite). Sie is always capitalised and conjugated like 'they': Wie heißen Sie? When unsure, use Sie and wait to be offered du. Polite commands use Sie too: Nehmen Sie Platz!"),
        [ex("Wie heißt du?", "Bạn tên gì?", "What's your name?", "thân mật", "informal"),
         ex("Wie heißen Sie?", "Ông/bà tên gì?", "What is your name?", "lịch sự", "polite"),
         ex("Nehmen Sie bitte Platz.", "Mời ông/bà ngồi.", "Please take a seat.", "mệnh lệnh lịch sự", "polite command")],
        [("Ở nhiều nơi làm việc trẻ và quán cà phê, người ta dùng du ngay từ đầu.", "In many young workplaces and cafés people use du from the start.")],
        ("Không chắc thì dùng Sie.", "When unsure, use Sie."),
        ["greetings.basic", "interaction.everyday_conversation"])

concept("place-prepositions",
        ("Đi đâu: nach, zu, in", "Where to: nach, zu, in"),
        ("Nach + thành phố, nước; zu + người, cửa hàng, nơi chốn; in + tòa nhà khi đi vào bên trong.", "Nach + towns and countries; zu + people, shops and places; in + buildings you go into."),
        ("Tiếng Việt chỉ nói «đi» + nơi chốn. Tiếng Đức chọn giới từ theo loại nơi: Ich fahre nach Berlin (thành phố), Ich gehe zum Arzt (đến chỗ bác sĩ), Ich gehe ins Kino (vào rạp). Để nói «ở đâu», dùng in: Ich wohne in Berlin. Về nhà là nach Hause, ở nhà là zu Hause.",
         "Vietnamese just says 'go' + place. German picks a preposition by type of place: nach Berlin, zum Arzt, ins Kino. For 'where', use in: Ich wohne in Berlin. Going home is nach Hause, being at home is zu Hause."),
        [ex("Ich fahre nach Berlin.", "Tôi đi Berlin.", "I'm going to Berlin.", "thành phố → nach", "town → nach"),
         ex("Ich gehe zum Arzt.", "Tôi đi khám bác sĩ.", "I'm going to the doctor.", "người → zu", "person → zu"),
         ex("Wir gehen ins Kino.", "Chúng tôi đi xem phim.", "We're going to the cinema.", "vào bên trong → in", "into → in"),
         ex("Ich bin zu Hause.", "Tôi đang ở nhà.", "I'm at home.")],
        [("Nước có mạo từ dùng in: Ich fahre in die Schweiz.", "Countries with an article take in: Ich fahre in die Schweiz.")],
        ("nach Hause = về nhà; zu Hause = ở nhà.", "nach Hause = home (direction); zu Hause = at home."),
        ["vocab.places_travel", "cases.accusative"])

concept("sounds-umlaut-ch",
        ("Âm ü, ö và hai kiểu ch", "The sounds ü, ö and the two ch"),
        ("Ü và ö tròn môi; ch sau a, o, u đọc ở cổ họng, sau e, i đọc nhẹ ở giữa lưỡi.", "Ü and ö are rounded; ch after a, o, u is in the throat, after e, i it is soft in the middle of the tongue."),
        ("Tiếng Việt có ư và ơ nhưng không tròn môi. Để nói ü, đặt lưỡi như khi nói «i» rồi tròn môi như «u»: über, für. Ö: lưỡi như «ê», môi như «ô»: schön. Ch sau a, o, u gần giống «kh»: Buch, acht. Sau e, i, ä, ö, ü, ch nhẹ hơn, gần «x» đọc bằng giữa lưỡi: ich, nicht. Đây chỉ là gần giống — hãy nghe mẫu.",
         "Vietnamese has ư and ơ but unrounded. For ü, put the tongue as for 'i' and round the lips as for 'u': über, für. For ö, tongue as 'e', lips as 'o': schön. Ch after a, o, u is like a throat 'kh': Buch, acht; after e, i it is soft: ich, nicht. Listen to the models."),
        [ex("schon — schön", "đã — đẹp", "already — beautiful", "umlaut đổi nghĩa", "the umlaut changes the meaning"),
         ex("das Buch", "cuốn sách", "the book", "ch cổ họng", "throat ch"),
         ex("ich", "tôi", "I", "ch nhẹ", "soft ch")],
        [("Chs đọc như ks: sechs (sáu).", "chs is pronounced ks: sechs.")],
        ("Ü = nói «i» với môi «u».", "Ü = say 'i' with 'u' lips."),
        ["pronunciation.vowels_ch"])

concept("final-devoicing-length",
        ("Âm cuối «cứng» và nguyên âm dài – ngắn", "Hard final consonants and long – short vowels"),
        ("D, g, b ở cuối từ đọc gần như t, k, p; nguyên âm trước phụ âm đôi thường ngắn.", "Final d, g, b sound like t, k, p; a vowel before a double consonant is usually short."),
        ("Tiếng Việt không có phụ âm cuối hữu thanh, nên người Việt dễ bỏ hẳn âm cuối (und → «un»). Hãy đọc rõ âm cuối nhưng «cứng»: der Hund nghe gần «hunt», der Tag gần «tak». Độ dài nguyên âm phân biệt nghĩa: die Miete (tiền thuê nhà, ie dài) — die Mitte (ở giữa, i ngắn). Ie, ah, eh, oo thường là nguyên âm dài.",
         "Vietnamese has no voiced final consonants, so learners often drop them (und → 'un'). Pronounce the final sound, but hard: der Hund ~ 'hunt', der Tag ~ 'tak'. Vowel length changes meaning: die Miete (long ie) — die Mitte (short i). ie, ah, eh, oo usually mark long vowels."),
        [ex("der Hund", "con chó", "the dog", "d cuối → gần t", "final d → t"),
         ex("der Tag", "ngày", "the day", "g cuối → gần k", "final g → k"),
         ex("die Miete — die Mitte", "tiền thuê nhà — ở giữa", "rent — middle", "dài — ngắn", "long — short")],
        [("Ở số nhiều, âm lại «mềm»: die Hunde, die Tage.", "In the plural the sound is soft again: die Hunde, die Tage.")],
        ("Đừng nuốt âm cuối: und có d!", "Don't swallow the final sound: und has a d!"),
        ["pronunciation.vowels_ch"])

concept("capitals-eszett",
        ("Viết hoa danh từ, ß và umlaut", "Capital nouns, ß and umlauts"),
        ("Mọi danh từ viết hoa; ß sau nguyên âm dài, ss sau nguyên âm ngắn; không bỏ umlaut.", "Every noun is capitalised; ß after a long vowel, ss after a short one; never drop the umlaut."),
        ("Tiếng Đức là ngôn ngữ duy nhất viết hoa mọi danh từ, kể cả giữa câu: Ich trinke Wasser. Chữ ß (eszett) đọc như «ss» và đứng sau nguyên âm dài hoặc ei, au: die Straße, groß, heißen. Sau nguyên âm ngắn viết ss: der Fluss, essen. Nếu không gõ được umlaut, có thể viết ae, oe, ue — nhưng trong bài tập hãy gõ đúng ä, ö, ü.",
         "German capitalises every noun, even mid-sentence: Ich trinke Wasser. ß sounds like 'ss' and follows a long vowel or ei, au: die Straße, groß, heißen. After a short vowel write ss: der Fluss, essen. Without an umlaut key you may write ae, oe, ue — but type ä, ö, ü in exercises."),
        [ex("Ich trinke Wasser.", "Tôi uống nước.", "I drink water.", "Wasser viết hoa", "Wasser capitalised"),
         ex("die Straße", "đường phố", "the street", "a dài → ß", "long a → ß"),
         ex("der Fluss", "dòng sông", "the river", "u ngắn → ss", "short u → ss")],
        [("Ở Thụy Sĩ không dùng ß: Strasse.", "Switzerland does not use ß: Strasse.")],
        ("Danh từ = chữ hoa. Dài = ß, ngắn = ss.", "Noun = capital. Long = ß, short = ss."),
        ["spelling.capitals_umlaut"])

concept("compounds",
        ("Từ ghép: hiểu từng mảnh", "Compounds: read the pieces"),
        ("Từ ghép lấy giống của từ cuối cùng: das Haus → das Krankenhaus; der Tag → der Geburtstag.", "A compound takes the gender of its last part: das Haus → das Krankenhaus; der Tag → der Geburtstag."),
        ("Tiếng Đức ghép danh từ thành một từ viết liền, giống «nhà» + «thương» thành «nhà thương». Đọc từ cuối lên đầu: das Schlafzimmer là «phòng (Zimmer) để ngủ (schlafen)». Từ cuối quyết định nghĩa chính và giống, các mảnh đứng trước bổ nghĩa cho nó. Từ ghép dài như Straßenbahnhaltestelle = Straßenbahn + Haltestelle (trạm xe điện).",
         "German writes compound nouns as one word, like Vietnamese 'nhà' + 'thương'. Read from the end: das Schlafzimmer is a room (Zimmer) for sleeping (schlafen). The last part gives the main meaning and the gender; the parts before modify it. Long ones like Straßenbahnhaltestelle = Straßenbahn + Haltestelle."),
        [ex("das Krankenhaus", "bệnh viện", "the hospital", "krank (ốm) + das Haus", "krank + das Haus"),
         ex("das Wochenende", "cuối tuần", "the weekend", "die Woche + das Ende", "die Woche + das Ende"),
         ex("der Geburtstag", "sinh nhật", "the birthday", "die Geburt + der Tag", "die Geburt + der Tag")],
        [("Đôi khi có chữ nối -s- hoặc -n-: Geburt-s-tag, Woche-n-ende.", "Sometimes a linking -s- or -n- appears: Geburt-s-tag, Woche-n-ende.")],
        ("Từ cuối là «ông chủ» của từ ghép.", "The last word is the boss of the compound."),
        ["strategy.cognates_compounds", "gender.articles_basic"])

concept("false-friends",
        ("Từ quốc tế và «bạn giả»", "International words and false friends"),
        ("Nhiều từ giống tiếng Anh có cùng nghĩa (das Hotel, der Film), nhưng một số là bẫy: bekommen = nhận được, der Chef = sếp.", "Many English-like words share the meaning (das Hotel, der Film), but some are traps: bekommen = to get, der Chef = boss."),
        ("Nếu bạn biết tiếng Anh, bạn đoán được rất nhiều từ tiếng Đức: das Hotel, das Taxi, der Film, die Musik, das Internet. Nhưng hãy cẩn thận với vài «bạn giả»: bekommen nghĩa là nhận được (không phải become — trở thành là werden), der Chef là sếp (không phải đầu bếp), das Gift là chất độc (quà là das Geschenk), also nghĩa là vậy thì (không phải cũng).",
         "If you know English you can guess many German words. But watch out: bekommen means to get (become = werden), der Chef is the boss, das Gift is poison (gift = das Geschenk), also means so/well (not 'also')."),
        [ex("Ich bekomme eine Nachricht.", "Tôi nhận được một tin nhắn.", "I get a message.", "không phải become", "not 'become'"),
         ex("Mein Chef ist nett.", "Sếp của tôi tử tế.", "My boss is nice.", "Chef = sếp", "Chef = boss"),
         ex("Das Hotel ist groß.", "Khách sạn lớn.", "The hotel is big.", "từ quốc tế", "international word")],
        [("Từ quốc tế vẫn mang giống tiếng Đức và viết hoa: das Internet, die Musik.", "International words still take a German gender and a capital: das Internet, die Musik.")],
        ("Giống tiếng Anh? Đoán — rồi kiểm tra.", "Looks like English? Guess — then check."),
        ["strategy.cognates_compounds"])

# ---------------------------------------------------------------- paradigms (cells from morphology.json)
morph = {v["lemma"]: v for v in json.load(open(MORPH, encoding="utf-8"))["verbs"]}
ATOMS = {"inf": "inf", "pre:1s": "ind:pre:1,sg", "pre:2s": "ind:pre:2,sg", "pre:3s": "ind:pre:3,sg", "pre:1p": "ind:pre:1,pl", "pre:2p": "ind:pre:2,pl", "pre:3p": "ind:pre:3,pl", "participle": "par:pas"}
PARADIGMS = [
    ("sein", "là, thì, ở", "to be", "irregular"),
    ("haben", "có", "to have", "irregular"),
    ("werden", "trở nên; sẽ", "to become", "irregular"),
    ("wohnen", "sống, ở (nơi nào)", "to live (somewhere)", "regular"),
    ("arbeiten", "làm việc", "to work", "regular"),
    ("spielen", "chơi", "to play", "regular"),
    ("sprechen", "nói (một thứ tiếng); nói chuyện", "to speak", "irregular"),
    ("fahren", "đi (bằng xe), lái xe", "to drive, to go", "irregular"),
    ("essen", "ăn", "to eat", "irregular"),
    ("können", "có thể, biết (làm gì)", "can", "irregular"),
    ("müssen", "phải", "must", "irregular"),
    ("anrufen", "gọi điện", "to call (phone)", "irregular"),
]
for lemma, vi, en, group in PARADIGMS:
    rows = morph[lemma]["rows"]
    cells = {}
    for cell, atom in ATOMS.items():
        forms = [r["mot"] for r in rows if r["infoVer"] == atom]
        cells[cell] = forms[0]
    recs.append({"paradigm": {"lemma": lemma, "gloss": {"vi": vi, "en": en}, "group": group, "cells": cells, "evidence": {"source": "kaikki-en"}}})

open(OUT, "w", encoding="utf-8", newline="\n").write("\n".join(json.dumps(r, ensure_ascii=False) for r in recs) + "\n")
for r in recs:
    if "id" in r:
        if len(r["explanation"]["vi"]) > 700:
            print("explanation >700", r["id"], len(r["explanation"]["vi"]))
        if len(r["shortRule"]["vi"]) > 140:
            print("shortRule >140", r["id"], len(r["shortRule"]["vi"]))
print(len(recs), "records")
