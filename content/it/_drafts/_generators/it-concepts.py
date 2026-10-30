"""Build content/it/_drafts/concepts/OUTPUT.jsonl for it-vi (concept cards + paradigms). usage: python -I it-concepts.py <repo root>"""
import json, os, sys

ROOT = sys.argv[1]
OUT = f"{ROOT}/content/it/_drafts/concepts/OUTPUT.jsonl"
MORPH = f"{ROOT}/content/it/lexicon/derived/morphology.json"
COURSE = {"source": "original-italian-course"}
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
        "id": f"it:concept:{cid}",
        "title": {"vi": title[0], "en": title[1]},
        "shortRule": {"vi": short[0], "en": short[1]},
        "explanation": {"vi": expl[0], "en": expl[1]},
        "examples": examples,
        "exceptions": [{"vi": v, "en": e} for v, e in exceptions],
        "memoryHint": {"vi": hint[0], "en": hint[1]},
        "objectives": [f"it.obj.{o}" for o in objectives],
        "sourceRefs": list(refs),
    })


concept("gender-endings",
        ("Đuôi từ gợi ý giống", "Endings that hint at the gender"),
        ("-o thường là giống đực, -a thường là giống cái, -e phải học từng từ.", "-o is usually masculine, -a usually feminine, -e must be learned word by word."),
        ("Mọi danh từ tiếng Ý là giống đực hoặc giống cái. Trong dữ liệu từ điển của khoá học (11.233 danh từ), đuôi -o là giống đực ở 99,4 %, đuôi -a là giống cái ở 90,4 %. Đuôi -e gần như chia đôi: 1.249 từ giống đực, 1.038 từ giống cái, nên hãy học từng từ. Tiếng Việt không có giống, vì vậy luôn học danh từ cùng mạo từ.",
         "Every Italian noun is masculine or feminine. In the course's dictionary data (11,233 nouns), -o is masculine 99.4% of the time and -a feminine 90.4%. -e splits almost evenly: 1,249 masculine, 1,038 feminine, so learn those word by word. Always learn a noun with its article."),
        [ex("il libro", "quyển sách", "the book", "đuôi -o, giống đực", "-o, masculine"),
         ex("la casa", "ngôi nhà", "the house", "đuôi -a, giống cái", "-a, feminine"),
         ex("il pane", "bánh mì", "the bread", "đuôi -e, giống đực", "-e, masculine"),
         ex("la chiave", "chìa khóa", "the key", "đuôi -e, giống cái", "-e, feminine")],
        [("Ngoại lệ hay gặp: la mano (bàn tay), la foto, la radio là giống cái; il problema là giống đực.", "Common exceptions: la mano, la foto and la radio are feminine; il problema is masculine.")],
        ("Học «il libro», đừng chỉ học «libro».", "Learn 'il libro', never just 'libro'."),
        ["articles.definite"], (COURSE, GENDER))

concept("definite-articles",
        ("Mạo từ xác định: il, lo, la, l'", "Definite articles: il, lo, la, l'"),
        ("Giống và âm đầu của danh từ quyết định mạo từ: il libro, lo zaino, la casa, l'amico.", "The noun's gender and first sound pick the article: il libro, lo zaino, la casa, l'amico."),
        ("Giống đực dùng il trước phụ âm thường, lo trước s + phụ âm, z, gn, ps, và l' trước nguyên âm. Giống cái dùng la trước mọi phụ âm và l' trước nguyên âm. Mạo từ thay đổi theo âm của chữ đứng ngay sau nó, kể cả khi đó là tính từ: il vecchio amico. Chữ h không đọc nên l'hotel dùng l'.",
         "Masculine nouns take il before an ordinary consonant, lo before s + consonant, z, gn and ps, and l' before a vowel. Feminine nouns take la before any consonant and l' before a vowel. The article follows the sound right after it, even an adjective: il vecchio amico. H is silent, so l'hotel takes l'."),
        [ex("il libro", "quyển sách", "the book", "phụ âm thường", "ordinary consonant"),
         ex("lo studente", "sinh viên", "the student", "s + phụ âm", "s + consonant"),
         ex("lo zaino", "ba lô", "the backpack", "z", "z"),
         ex("l'amico", "người bạn nam", "the friend", "nguyên âm", "vowel"),
         ex("la scuola", "trường học", "the school", "giống cái: s + phụ âm không đổi gì", "feminine: s + consonant changes nothing")],
        [("Trước tên người thân số ít có từ sở hữu không dùng mạo từ: mia madre.", "No article before a singular family noun with a possessive: mia madre.")],
        ("Lo chỉ dành cho giống đực với âm đầu khó đọc: st-, sp-, z-, gn-.", "Lo is only for masculine nouns with a hard opening: st-, sp-, z-, gn-."),
        ["articles.definite"])

concept("indefinite-articles",
        ("Mạo từ không xác định: un, uno, una, un'", "Indefinite articles: un, uno, una, un'"),
        ("un libro, uno zaino, una casa, un'amica: chọn theo giống và âm đầu.", "un libro, uno zaino, una casa, un'amica: choose by gender and first sound."),
        ("Giống đực dùng un (cả trước nguyên âm: un amico) và uno trước s + phụ âm, z, gn, ps. Giống cái dùng una, và un' trước nguyên âm. Dấu lược chỉ xuất hiện ở giống cái. Vì vậy un amico không có dấu lược, còn un'amica thì có: nhìn dấu lược là biết người đó là nữ.",
         "Masculine nouns take un (also before a vowel: un amico) and uno before s + consonant, z, gn, ps. Feminine nouns take una, and un' before a vowel. The apostrophe appears only in the feminine: un amico has none, un'amica has one."),
        [ex("un libro", "một quyển sách", "a book"),
         ex("uno zaino", "một cái ba lô", "a backpack"),
         ex("un amico", "một người bạn nam", "a friend (male)", "giống đực: không có dấu lược", "masculine: no apostrophe"),
         ex("un'amica", "một người bạn nữ", "a friend (female)", "giống cái trước nguyên âm: có dấu lược", "feminine before a vowel: apostrophe")],
        [],
        ("Dấu lược = giống cái: un'amica.", "Apostrophe = feminine: un'amica."),
        ["articles.indefinite_elision"])

concept("plurals",
        ("Số nhiều: đổi đuôi và đổi mạo từ", "Plurals: the ending and the article change"),
        ("-o, -e → -i; -a → -e. Mạo từ: il → i, lo/l' → gli, la/l' → le.", "-o, -e → -i; -a → -e. Article: il → i, lo/l' → gli, la/l' → le."),
        ("Tiếng Việt thêm 'những', còn tiếng Ý đổi đuôi danh từ: il libro → i libri, la casa → le case, il pane → i pani, la chiave → le chiavi. Mạo từ cũng đổi theo: giống đực dùng i, nhưng gli trước nguyên âm và các âm của lo; giống cái luôn dùng le. Từ có dấu ở cuối, từ mượn và từ một âm tiết giữ nguyên: la città → le città, il film → i film.",
         "Vietnamese adds 'những'; Italian changes the noun's ending: il libro → i libri, la casa → le case, il pane → i pani, la chiave → le chiavi. The article changes too: masculine i, but gli before vowels and lo-sounds; feminine always le. Words with a final accent, loanwords and one-syllable words do not change: la città → le città, il film → i film."),
        [ex("i libri", "những quyển sách", "the books"),
         ex("gli amici", "những người bạn", "the friends", "l'amico → gli amici", "l'amico → gli amici"),
         ex("gli studenti", "các sinh viên", "the students", "lo studente → gli studenti", "lo studente → gli studenti"),
         ex("le case", "những ngôi nhà", "the houses"),
         ex("le città", "các thành phố", "the cities", "không đổi", "unchanged")],
        [("Bất quy tắc hay gặp: l'uomo → gli uomini, la mano → le mani, l'uovo → le uova, il braccio → le braccia.", "Common irregulars: l'uomo → gli uomini, la mano → le mani, l'uovo → le uova, il braccio → le braccia."),
         ("-ca, -ga giữ âm cứng: l'amica → le amiche, nhưng -co có thể mềm: l'amico → gli amici.", "-ca, -ga keep the hard sound: l'amica → le amiche, but -co may soften: l'amico → gli amici.")],
        ("Gli đi cùng lo và l': lo zaino → gli zaini, l'amico → gli amici.", "Gli goes with lo and l': lo zaino → gli zaini, l'amico → gli amici."),
        ["articles.plurals"])

concept("elision",
        ("Dấu lược: l', un', dov'è, c'è", "The apostrophe: l', un', dov'è, c'è"),
        ("Trước nguyên âm, lo và la thành l'; viết liền, không có khoảng trắng sau dấu lược.", "Before a vowel lo and la become l', written with no space after the apostrophe."),
        ("Tiếng Ý tránh hai nguyên âm đứng cạnh nhau nên lược bớt một âm: l'amico (không phải lo amico), l'acqua (không phải la acqua). Các cụm khác cũng vậy: dov'è (dove + è), c'è (ci + è), un'ora. Khi gõ, không đặt khoảng trắng sau dấu lược. Gặp l' thì không biết giống từ mạo từ, nên hãy nhìn đuôi từ hoặc từ điển.",
         "Italian avoids two vowels side by side and drops one: l'amico (not lo amico), l'acqua (not la acqua). Others work the same way: dov'è (dove + è), c'è (ci + è), un'ora. When typing, put no space after the apostrophe. L' hides the gender, so look at the ending or the dictionary."),
        [ex("l'acqua", "nước", "the water"),
         ex("l'albergo", "khách sạn", "the hotel"),
         ex("Dov'è la stazione?", "Nhà ga ở đâu?", "Where is the station?"),
         ex("C'è un bar qui.", "Ở đây có một quán bar.", "There is a bar here.")],
        [("Số nhiều không lược: gli amici, le amiche.", "The plural does not elide: gli amici, le amiche.")],
        ("Nghe liền một hơi: l'amico đọc như một từ.", "One breath: l'amico sounds like one word."),
        ["articles.indefinite_elision", "spelling.accents_apostrophe"])

concept("essere-avere",
        ("Essere và avere", "Essere and avere"),
        ("essere: sono, sei, è, siamo, siete, sono. avere: ho, hai, ha, abbiamo, avete, hanno.", "essere: sono, sei, è, siamo, siete, sono. avere: ho, hai, ha, abbiamo, avete, hanno."),
        ("Hai động từ này bất quy tắc và xuất hiện ở khắp nơi. Essere nghĩa là 'là' hoặc 'ở': Sono vietnamita, Sono a Roma. Avere nghĩa là 'có'. Tiếng Ý dùng avere trong nhiều cụm mà tiếng Việt dùng 'là' hoặc tính từ: Ho venti anni (tôi hai mươi tuổi), Ho fame (tôi đói), Ho sete (tôi khát), Ho sonno (tôi buồn ngủ). Chữ h trong ho, hai, ha, hanno không đọc.",
         "These two irregular verbs are everywhere. Essere means 'to be': Sono vietnamita, Sono a Roma. Avere means 'to have'. Italian uses avere in many phrases where Vietnamese uses 'là' or an adjective: Ho venti anni (I am twenty), Ho fame (I am hungry), Ho sete (I am thirsty), Ho sonno (I am sleepy). The h in ho, hai, ha, hanno is silent."),
        [ex("Sono di Hanoi.", "Tôi đến từ Hà Nội.", "I am from Hanoi."),
         ex("Marco è a casa.", "Marco ở nhà.", "Marco is at home."),
         ex("Ho due fratelli.", "Tôi có hai anh trai.", "I have two brothers."),
         ex("Ho venti anni.", "Tôi hai mươi tuổi.", "I am twenty years old.", "nói tuổi dùng avere", "age takes avere")],
        [("È có dấu là 'là'; e không dấu là 'và'. Ha có h là 'có'; a không có h là giới từ.", "È with an accent means 'is'; e means 'and'. Ha with h means 'has'; a is a preposition.")],
        ("Tuổi, đói, khát, buồn ngủ: tiếng Ý đều 'có'.", "Age, hunger, thirst, sleepiness: Italian 'has' them all."),
        ["verbs.essere_avere_present"], (COURSE, MORPHO))

concept("c-e-ci-sono",
        ("C'è và ci sono", "C'è and ci sono"),
        ("C'è + số ít, ci sono + số nhiều: 'có' để nói một thứ tồn tại ở đâu đó.", "C'è + singular, ci sono + plural: 'there is / there are'."),
        ("Tiếng Việt dùng một từ 'có' cho cả sở hữu và tồn tại. Tiếng Ý tách ra: avere để nói ai có gì (Ho un gatto), còn c'è / ci sono để nói có cái gì ở đâu đó (C'è un gatto in giardino). Danh từ theo sau quyết định dùng dạng nào: C'è un letto, Ci sono due letti. Câu hỏi chỉ cần lên giọng: C'è un bar qui vicino?",
         "Vietnamese uses one word 'có' for possession and existence. Italian separates them: avere for what someone has (Ho un gatto), c'è / ci sono for what exists somewhere (C'è un gatto in giardino). The noun after it decides the form: C'è un letto, Ci sono due letti."),
        [ex("Ho un gatto.", "Tôi có một con mèo.", "I have a cat.", "sở hữu", "possession"),
         ex("C'è un gatto in giardino.", "Có một con mèo trong vườn.", "There is a cat in the garden.", "tồn tại", "existence"),
         ex("Ci sono due letti.", "Có hai cái giường.", "There are two beds.")],
        [],
        ("Ai có gì: avere. Ở đâu có gì: c'è.", "Who has what: avere. What is where: c'è."),
        ["verbs.essere_avere_present"])

concept("present-regular",
        ("Ba nhóm động từ ở thì hiện tại", "The three verb groups in the present"),
        ("Bỏ -are, -ere, -ire rồi thêm đuôi theo người: -o, -i, -a/-e, -iamo, -ate/-ete/-ite, -ano/-ono.", "Drop -are, -ere, -ire and add the person's ending: -o, -i, -a/-e, -iamo, -ate/-ete/-ite, -ano/-ono."),
        ("Tiếng Việt không chia động từ, còn tiếng Ý có sáu đuôi. Nhóm -are: parlo, parli, parla, parliamo, parlate, parlano. Nhóm -ere: leggo, leggi, legge, leggiamo, leggete, leggono. Nhóm -ire: dormo, dormi, dorme, dormiamo, dormite, dormono. Đuôi -o luôn là 'tôi', -iamo luôn là 'chúng tôi'. Động từ -care, -gare thêm h để giữ âm cứng: cerchi, paghi. Động từ -iare chỉ giữ một i: mangi, studi.",
         "Vietnamese does not conjugate; Italian has six endings. -are: parlo, parli, parla, parliamo, parlate, parlano. -ere: leggo, leggi, legge, leggiamo, leggete, leggono. -ire: dormo, dormi, dorme, dormiamo, dormite, dormono. -o is always 'I', -iamo always 'we'. -care, -gare verbs add h to keep the hard sound: cerchi, paghi. -iare verbs keep one i: mangi, studi."),
        [ex("Parlo italiano.", "Tôi nói tiếng Ý.", "I speak Italian."),
         ex("Leggi il giornale?", "Bạn có đọc báo không?", "Do you read the newspaper?"),
         ex("Marco dorme.", "Marco đang ngủ.", "Marco is sleeping."),
         ex("Cerchi la stazione?", "Bạn đang tìm nhà ga à?", "Are you looking for the station?", "h giữ âm k", "h keeps the k sound")],
        [("Thì hiện tại tiếng Ý cũng dùng cho việc đang diễn ra: Mangio = tôi ăn / tôi đang ăn.", "The Italian present also covers what is happening now: Mangio = I eat / I am eating.")],
        ("-o là tôi, -i là bạn, -iamo là chúng tôi.", "-o is I, -i is you, -iamo is we."),
        ["verbs.regular_present"], (COURSE, MORPHO))

concept("isc-verbs",
        ("Nhóm -ire có -isc-", "-ire verbs with -isc-"),
        ("capire, finire, preferire: thêm -isc- ở tôi, bạn, anh ấy, họ; không thêm ở chúng tôi, các bạn.", "capire, finire, preferire: add -isc- for io, tu, lui, loro; not for noi, voi."),
        ("Nhiều động từ -ire chen thêm -isc- trước đuôi: capisco, capisci, capisce, capiamo, capite, capiscono. Chữ sc đọc khác nhau: capisco có âm 'sk', capisci có âm 's nặng'. Không có quy tắc nào cho biết động từ nào thuộc nhóm này, nên hãy học từng từ: capire, finire, preferire, pulire, spedire. Các động từ dormire, partire, sentire, aprire không có -isc-.",
         "Many -ire verbs insert -isc- before the ending: capisco, capisci, capisce, capiamo, capite, capiscono. The sc sounds different: capisco has 'sk', capisci has 'sh'. No rule tells which verbs do this, so learn them one by one: capire, finire, preferire, pulire, spedire. Dormire, partire, sentire, aprire have no -isc-."),
        [ex("Non capisco.", "Tôi không hiểu.", "I do not understand."),
         ex("Preferisco il tè.", "Tôi thích trà hơn.", "I prefer tea."),
         ex("Capiamo tutto.", "Chúng tôi hiểu hết.", "We understand everything.", "noi: không có -isc-", "noi: no -isc-")],
        [],
        ("Noi và voi không có -isc-.", "Noi and voi have no -isc-."),
        ["verbs.regular_present"], (COURSE, MORPHO))

concept("subject-drop",
        ("Không cần đại từ chủ ngữ", "No need for a subject pronoun"),
        ("Đuôi động từ đã cho biết ai làm: Parlo = tôi nói. Chỉ dùng io, tu… để nhấn mạnh.", "The verb ending already shows who: Parlo = I speak. Use io, tu… only for emphasis."),
        ("Tiếng Việt luôn cần chủ ngữ, nhưng tiếng Ý thường bỏ vì đuôi động từ đã rõ: Abito a Roma, Studio italiano. Người Ý thêm đại từ khi muốn nhấn mạnh hoặc đối lập: Io bevo il tè, lui beve il caffè. Khi trả lời bạn cứ dùng động từ một mình; nói đủ đại từ cũng đúng nhưng nghe như đang nhấn mạnh.",
         "Vietnamese always needs a subject; Italian usually drops it because the ending is clear: Abito a Roma, Studio italiano. Italians add a pronoun for emphasis or contrast: Io bevo il tè, lui beve il caffè."),
        [ex("Abito a Roma.", "Tôi sống ở Roma.", "I live in Rome."),
         ex("Io bevo il tè, lui beve il caffè.", "Tôi uống trà, còn anh ấy uống cà phê.", "I drink tea, he drinks coffee.", "nhấn mạnh sự đối lập", "contrast")],
        [],
        ("Đuôi động từ đã là chủ ngữ.", "The ending is the subject."),
        ["syntax.negation_questions"])

concept("tu-lei",
        ("Tu và Lei: thân mật và lịch sự", "Tu and Lei: informal and formal"),
        ("Tu với bạn bè, người thân. Lei với người lạ; động từ chia như ngôi thứ ba.", "Tu with friends and family. Lei with strangers; the verb is third person."),
        ("Tiếng Việt chọn xưng hô theo vai vế; tiếng Ý chọn giữa hai cách. Với bạn bè, trẻ em, người thân: tu (Come stai?). Với người lạ, người bán hàng, thầy cô, bác sĩ: Lei (Come sta?). Lei viết hoa khi lịch sự, và động từ chia như lui/lei: Lei parla italiano? Trong một cuộc trò chuyện, hãy giữ một cách xưng hô.",
         "Vietnamese chooses address terms by status; Italian chooses between two. With friends, children, family: tu (Come stai?). With strangers, shop staff, teachers, doctors: Lei (Come sta?). Lei is capitalised when formal, and the verb is third person: Lei parla italiano? Keep to one form in a conversation."),
        [ex("Come ti chiami?", "Bạn tên là gì?", "What is your name?", "tu", "tu"),
         ex("Come si chiama?", "Ông/bà tên là gì?", "What is your name?", "Lei", "Lei"),
         ex("Scusa, dov'è il bar?", "Xin lỗi bạn, quán bar ở đâu?", "Sorry, where is the bar?", "tu", "tu"),
         ex("Scusi, dov'è il bar?", "Xin lỗi ông/bà, quán bar ở đâu?", "Excuse me, where is the bar?", "Lei", "Lei")],
        [("Khi không chắc, hãy dùng Lei: lịch sự quá vẫn hơn suồng sã.", "When unsure, use Lei.")],
        ("Scusa cho bạn bè, scusi cho người lạ.", "Scusa for friends, scusi for strangers."),
        ["syntax.negation_questions", "greetings.basic"])

concept("adjective-agreement",
        ("Tính từ hợp giống và số", "Adjectives agree in gender and number"),
        ("Tính từ thường đứng sau danh từ và đổi đuôi theo nó: la casa piccola, i libri nuovi.", "Adjectives usually follow the noun and match it: la casa piccola, i libri nuovi."),
        ("Giống tiếng Việt, tính từ thường đứng sau danh từ: una casa grande. Khác tiếng Việt, tính từ đổi đuôi theo danh từ. Loại -o có bốn dạng: piccolo, piccola, piccoli, piccole. Loại -e có hai dạng: grande, grandi; gentile, gentili. Một số tính từ rất thường dùng có thể đứng trước danh từ: una bella casa, un buon caffè.",
         "As in Vietnamese, adjectives usually follow the noun: una casa grande. Unlike Vietnamese, they change with the noun. -o adjectives have four forms: piccolo, piccola, piccoli, piccole. -e adjectives have two: grande, grandi; gentile, gentili. A few very common ones can come first: una bella casa, un buon caffè."),
        [ex("un gatto nero", "một con mèo đen", "a black cat"),
         ex("una borsa nera", "một cái túi đen", "a black bag"),
         ex("le scarpe nere", "đôi giày đen", "the black shoes"),
         ex("una ragazza gentile", "một cô gái tử tế", "a kind girl", "-e giữ nguyên ở số ít", "-e stays in the singular")],
        [("Blu, rosa không đổi: la borsa blu, le borse blu.", "Blu and rosa do not change: la borsa blu, le borse blu.")],
        ("Nghe đuôi danh từ, lặp lại ở tính từ: casa piccola.", "Echo the ending: casa piccola."),
        ["speaking.describe", "vocab.everyday_basics"])

concept("negation-questions",
        ("Phủ định bằng non, hỏi bằng ngữ điệu", "Non for negation, intonation for questions"),
        ("Non đứng ngay trước động từ. Câu hỏi có cùng trật tự, chỉ khác ngữ điệu lên cao.", "Non goes right before the verb. Questions keep the word order; only the intonation rises."),
        ("Muốn phủ định, đặt non trước động từ: Non parlo tedesco. Câu hỏi có/không giữ nguyên trật tự câu, chỉ lên giọng ở cuối và viết dấu hỏi: Parli italiano? Từ để hỏi đứng đầu câu: Dove abiti? Come ti chiami? Quanto costa? Chi è? Cosa mangi? Quando parti? Perché studi? Perché nghĩa là cả 'tại sao' và 'vì': Perché studi? Perché lavoro in Italia.",
         "To negate, put non before the verb: Non parlo tedesco. Yes/no questions keep the word order, with rising intonation and a question mark: Parli italiano? Question words come first: Dove abiti? Come ti chiami? Quanto costa? Chi è? Cosa mangi? Quando parti? Perché means both 'why' and 'because'."),
        [ex("Non parlo tedesco.", "Tôi không nói tiếng Đức.", "I do not speak German."),
         ex("Parli italiano?", "Bạn có nói tiếng Ý không?", "Do you speak Italian?"),
         ex("Dove abiti?", "Bạn sống ở đâu?", "Where do you live?"),
         ex("Perché studi? Perché lavoro in Italia.", "Tại sao bạn học? Vì tôi làm việc ở Ý.", "Why do you study? Because I work in Italy.")],
        [("Non bao giờ đứng sau động từ. Non và mai đi cùng nhau: Non bevo mai il vino.", "Non never follows the verb. Non pairs with mai: Non bevo mai il vino.")],
        ("Non đứng trước động từ, giống 'không' trong tiếng Việt.", "Non sits before the verb, like Vietnamese 'không'."),
        ["syntax.negation_questions"])

concept("passato-prossimo",
        ("Thì quá khứ passato prossimo", "The passato prossimo"),
        ("avere hoặc essere + phân từ: Ho mangiato, Sono andato. Động từ di chuyển thường đi với essere.", "avere or essere + participle: Ho mangiato, Sono andato. Movement verbs usually take essere."),
        ("Tiếng Việt thêm 'đã'; tiếng Ý dùng trợ động từ và phân từ. Phân từ có quy luật: -are → -ato, -ere → -uto, -ire → -ito: parlato, avuto, dormito. Một số bất quy tắc: fatto, letto, scritto, preso, visto. Phần lớn động từ dùng avere: Ho mangiato. Động từ di chuyển và thay đổi trạng thái dùng essere: Sono andato, È arrivata. Với essere, phân từ đổi đuôi theo chủ ngữ. Ở A1 bạn chỉ cần nhận ra điều này.",
         "Vietnamese adds 'đã'; Italian uses an auxiliary and a participle. Regular participles: -are → -ato, -ere → -uto, -ire → -ito: parlato, avuto, dormito. Some are irregular: fatto, letto, scritto, preso, visto. Most verbs take avere: Ho mangiato. Movement and change-of-state verbs take essere: Sono andato, È arrivata. With essere the participle agrees with the subject. At A1 you only need to recognise this."),
        [ex("Ho mangiato la pizza.", "Tôi đã ăn pizza.", "I ate pizza."),
         ex("Hai dormito bene?", "Bạn ngủ ngon không?", "Did you sleep well?"),
         ex("Sono andato a Roma.", "Tôi đã đi Roma.", "I went to Rome.", "người nói là nam", "male speaker"),
         ex("Anna è arrivata ieri.", "Hôm qua Anna đã đến.", "Anna arrived yesterday.", "Anna là nữ: -a", "Anna is female: -a")],
        [("Bản thân stato là phân từ của cả essere và stare: Sono stato a Roma.", "Stato is the participle of both essere and stare: Sono stato a Roma.")],
        ("Đi, đến, về, ở lại: dùng essere.", "Go, come, return, stay: essere."),
        ["verbs.passato_recognition"], (COURSE, MORPHO))

concept("numbers",
        ("Số đếm: ghép và rụng nguyên âm", "Numbers: compounds and the dropped vowel"),
        ("Ghép viết liền: ventidue. Trước uno và otto rụng nguyên âm: ventuno, ventotto. Số 3 có dấu: ventitré.", "Compounds are one word: ventidue. Before uno and otto the vowel drops: ventuno, ventotto. Final 3 takes an accent: ventitré."),
        ("Từ 11 đến 16 có đuôi -dici: undici, dodici, tredici, quattordici, quindici, sedici. Từ 17 đến 19 đổi thứ tự: diciassette, diciotto, diciannove. Hàng chục: venti, trenta, quaranta, cinquanta, sessanta, settanta, ottanta, novanta, cento. Số ghép viết liền một từ. Nghe kỹ phụ âm kép: sette, otto, nonno khác sete, nono. Euro không đổi ở số nhiều: dieci euro.",
         "11-16 end in -dici: undici, dodici, tredici, quattordici, quindici, sedici. 17-19 flip the order: diciassette, diciotto, diciannove. Tens: venti, trenta, quaranta, cinquanta, sessanta, settanta, ottanta, novanta, cento. Compounds are one word. Listen for doubled consonants: sette, otto. Euro does not change in the plural: dieci euro."),
        [ex("ventuno", "hai mươi mốt", "twenty-one", "venti + uno, rụng i", "venti + uno, i drops"),
         ex("ventotto", "hai mươi tám", "twenty-eight"),
         ex("trentatré", "ba mươi ba", "thirty-three", "có dấu", "accent"),
         ex("Costa dieci euro.", "Giá mười euro.", "It costs ten euros.")],
        [],
        ("Uno và otto bắt đầu bằng nguyên âm nên hàng chục rụng nguyên âm cuối.", "Uno and otto start with a vowel, so the tens lose theirs."),
        ["numbers.0_100"])

concept("time-and-prices",
        ("Giờ giấc, ngày tháng, giá tiền", "Time, dates and prices"),
        ("Sono le otto, nhưng È l'una. Thứ và tháng viết thường. Quanto costa? — Costa due euro.", "Sono le otto, but È l'una. Days and months are lower case. Quanto costa? — Costa due euro."),
        ("Hỏi giờ: Che ora è? Trả lời bằng số nhiều: Sono le otto, Sono le due e mezza. Riêng một giờ là số ít: È l'una. Giờ lẻ: e un quarto (mười lăm phút), e mezza (rưỡi), meno un quarto (kém mười lăm). Lúc mấy giờ dùng alle: alle otto, all'una. Thứ và tháng không viết hoa: lunedì, marzo. Ngày trước tháng, giống tiếng Việt: il 5 marzo.",
         "Ask: Che ora è? Answer in the plural: Sono le otto, Sono le due e mezza. One o'clock is singular: È l'una. e un quarto (a quarter past), e mezza (half past), meno un quarto (a quarter to). At what time: alle otto, all'una. Days and months are not capitalised: lunedì, marzo. The day comes before the month: il 5 marzo."),
        [ex("Che ora è? Sono le tre.", "Mấy giờ rồi? Ba giờ.", "What time is it? It is three."),
         ex("È l'una.", "Một giờ.", "It is one o'clock."),
         ex("Il treno parte alle otto e mezza.", "Tàu chạy lúc tám giờ rưỡi.", "The train leaves at half past eight."),
         ex("Quanto costa? Due euro.", "Giá bao nhiêu? Hai euro.", "How much is it? Two euros.")],
        [],
        ("Một giờ là số ít, mọi giờ khác là số nhiều.", "One o'clock is singular, every other hour plural."),
        ["vocab.time_calendar", "numbers.0_100"])

concept("prepositions",
        ("Giới từ a, in, di, da, con, per", "Prepositions a, in, di, da, con, per"),
        ("a + thành phố, in + đất nước: a Roma, in Italia. di = của, da = từ, con = với, per = để, cho.", "a + city, in + country: a Roma, in Italia. di = of, da = from, con = with, per = for."),
        ("Thành phố dùng a, đất nước dùng in: Abito a Roma, in Italia. Di chỉ sở hữu và quê quán: il libro di Marco, Sono di Hanoi. Da chỉ nơi xuất phát hoặc đến chỗ của ai: Vengo da Napoli, Vado dal medico. Giới từ ghép với mạo từ thành một từ: a + il = al, di + la = della, in + il = nel, da + il = dal, su + il = sul. Ở A1 bạn chỉ cần nhận ra chúng trong các cụm đã học: al bar, alla stazione, nel piatto.",
         "Cities take a, countries in: Abito a Roma, in Italia. Di shows possession and origin: il libro di Marco, Sono di Hanoi. Da shows starting point or someone's place: Vengo da Napoli, Vado dal medico. Prepositions merge with articles: a + il = al, di + la = della, in + il = nel, da + il = dal, su + il = sul. At A1 just recognise them in learned phrases: al bar, alla stazione, nel piatto."),
        [ex("Abito a Roma.", "Tôi sống ở Roma.", "I live in Rome."),
         ex("Sono di Hanoi.", "Tôi đến từ Hà Nội.", "I am from Hanoi."),
         ex("Vado al bar.", "Tôi đến quán bar.", "I am going to the bar.", "a + il = al", "a + il = al"),
         ex("Vado alla stazione.", "Tôi đến nhà ga.", "I am going to the station.", "a + la = alla", "a + la = alla")],
        [("A casa, a scuola, in Italia, in centro: học thành cụm, đừng tìm quy tắc.", "A casa, a scuola, in Italia, in centro: learn them as chunks.")],
        ("Thành phố nhỏ gọn: a. Đất nước rộng: in.", "City: a. Country: in."),
        ["articles.indefinite_elision", "vocab.places_travel"])

concept("mi-piace",
        ("Mi piace và mi piacciono", "Mi piace and mi piacciono"),
        ("Mi piace + một thứ hoặc động từ; mi piacciono + nhiều thứ.", "Mi piace + one thing or a verb; mi piacciono + several things."),
        ("Trong tiếng Việt, người thích là chủ ngữ. Trong tiếng Ý thì ngược lại: thứ được thích mới là chủ ngữ, nghĩa đen là 'pizza làm tôi hài lòng'. Vì vậy động từ theo thứ được thích: Mi piace la pizza, Mi piacciono i gatti, Mi piace leggere. Muốn nói người khác: ti piace (bạn), gli piace (anh ấy), le piace (cô ấy). Phủ định: Non mi piace il caffè.",
         "In Vietnamese the person who likes is the subject. In Italian it is reversed: the liked thing is the subject, literally 'pizza pleases me'. So the verb follows the thing: Mi piace la pizza, Mi piacciono i gatti, Mi piace leggere. For others: ti piace, gli piace, le piace. Negative: Non mi piace il caffè."),
        [ex("Mi piace la pizza.", "Tôi thích pizza.", "I like pizza."),
         ex("Mi piacciono i gatti.", "Tôi thích mèo.", "I like cats.", "số nhiều: piacciono", "plural: piacciono"),
         ex("Ti piace leggere?", "Bạn có thích đọc sách không?", "Do you like reading?"),
         ex("Non mi piace il caffè.", "Tôi không thích cà phê.", "I do not like coffee.")],
        [],
        ("Hỏi: cái gì làm tôi thích? Một thứ: piace. Nhiều thứ: piacciono.", "Ask: what pleases me? One thing: piace. Several: piacciono."),
        ["verbs.modals_piacere"])

concept("modal-verbs",
        ("Volere, potere, dovere + nguyên thể", "Volere, potere, dovere + infinitive"),
        ("Voglio mangiare, Posso entrare?, Devo lavorare: động từ thứ hai giữ nguyên thể.", "Voglio mangiare, Posso entrare?, Devo lavorare: the second verb stays in the infinitive."),
        ("Ba động từ này đi với một động từ nguyên thể, giống tiếng Việt 'muốn ăn, có thể vào, phải làm'. Chúng bất quy tắc: voglio, vuoi, vuole, vogliamo; posso, puoi, può, possiamo; devo, devi, deve, dobbiamo. Khi gọi món hay xin điều gì, voglio nghe hơi thẳng thừng; hãy dùng vorrei: Vorrei un caffè. Với người lạ dùng può: Può ripetere?",
         "These three take an infinitive, like Vietnamese 'muốn ăn, có thể vào, phải làm'. They are irregular: voglio, vuoi, vuole, vogliamo; posso, puoi, può, possiamo; devo, devi, deve, dobbiamo. When ordering, voglio sounds blunt; use vorrei: Vorrei un caffè. With strangers use può: Può ripetere?"),
        [ex("Voglio imparare l'italiano.", "Tôi muốn học tiếng Ý.", "I want to learn Italian."),
         ex("Posso entrare?", "Tôi vào được không?", "May I come in?"),
         ex("Devo lavorare domani.", "Mai tôi phải làm việc.", "I have to work tomorrow."),
         ex("Vorrei un caffè, per favore.", "Cho tôi một ly cà phê.", "I would like a coffee, please.", "lịch sự", "polite")],
        [],
        ("Gọi món: vorrei, đừng dùng voglio.", "Ordering: vorrei, not voglio."),
        ["verbs.modals_piacere"], (COURSE, MORPHO))

concept("double-consonants",
        ("Phụ âm kép đổi nghĩa từ", "Double consonants change the meaning"),
        ("Phụ âm kép đọc dài hơn hẳn: pala / palla, caro / carro, sete / sette, nono / nonno.", "A double consonant is clearly longer: pala / palla, caro / carro, sete / sette, nono / nonno."),
        ("Tiếng Việt không có phụ âm kép nên tai người Việt dễ bỏ qua, mà trong tiếng Ý nó đổi nghĩa từ. Phụ âm kép đọc giữ lại một nhịp ngắn trước khi sang nguyên âm tiếp theo: pal-la, set-te, non-no. Khi nghe, hãy chú ý âm dừng ở giữa từ. Khi viết, từ sai một chữ là từ khác: sono (tôi là) và sonno (cơn buồn ngủ); anno (năm) là từ bạn cần viết đúng đủ hai chữ n.",
         "Vietnamese has no double consonants, so they are easy to miss, but in Italian they change the word. A double consonant holds for a short beat before the next vowel: pal-la, set-te, non-no. When listening, notice the hold in the middle. When writing, one letter makes another word: sono (I am) and sonno (sleepiness)."),
        [ex("la pala", "cái xẻng", "the shovel", "một chữ l", "one l"),
         ex("la palla", "quả bóng", "the ball", "hai chữ l, đọc dài", "two l's, held"),
         ex("sete", "cơn khát", "thirst"),
         ex("sette", "số bảy", "seven"),
         ex("Sono stanco, ho sonno.", "Tôi mệt, tôi buồn ngủ.", "I am tired, I am sleepy.", "sono và sonno", "sono and sonno")],
        [],
        ("Giữ một nhịp ở giữa: pal-la, non-no.", "Hold a beat in the middle: pal-la, non-no."),
        ["pronunciation.double_consonants"])

concept("stress-accents",
        ("Trọng âm và dấu viết", "Stress and written accents"),
        ("Trọng âm thường ở âm áp chót. Dấu trên nguyên âm cuối chỉ trọng âm, không phải thanh điệu.", "Stress usually falls on the second-to-last syllable. A final accent marks stress, not a tone."),
        ("Phần lớn từ tiếng Ý nhấn vào âm áp chót: ra-GAZ-zo, ma-TI-na. Nếu trọng âm rơi vào âm cuối, tiếng Ý viết dấu: cit-TÀ, caf-FÈ, u-ni-ver-si-TÀ. Người Việt dễ đọc dấu này như thanh huyền, nhưng nó chỉ báo chỗ nhấn. Dấu cũng phân biệt nghĩa: è (là) và e (và); sì (vâng) và si; là (ở đó) và la (mạo từ); dà và da.",
         "Most Italian words stress the second-to-last syllable: ra-GAZ-zo, ma-TI-na. When the last syllable is stressed, Italian writes an accent: cit-TÀ, caf-FÈ, u-ni-ver-si-TÀ. It marks stress, not a Vietnamese tone. Accents also separate words: è (is) and e (and); sì (yes) and si; là (there) and la (the)."),
        [ex("la città", "thành phố", "the city"),
         ex("il caffè", "cà phê", "the coffee"),
         ex("Marco è qui.", "Marco ở đây.", "Marco is here.", "è là động từ", "è is the verb"),
         ex("Marco e Anna.", "Marco và Anna.", "Marco and Anna.", "e là 'và'", "e is 'and'")],
        [("Vài từ nhấn sớm hơn: il tavolo, il numero, abito. Hãy nghe và lặp lại.", "A few words stress earlier: il tavolo, il numero, abito. Listen and repeat.")],
        ("Dấu ở cuối = nhấn ở cuối.", "Final accent = final stress."),
        ["spelling.accents_apostrophe", "pronunciation.double_consonants"])

concept("c-g-sounds",
        ("Chữ c, g, gn, gli, sc", "The letters c, g, gn, gli, sc"),
        ("c, g mềm trước e, i: cena, gelato. Thêm h để giữ cứng: che, chi, ghe, ghi. gn ≈ nh, gli ≈ li mềm.", "c, g soften before e, i: cena, gelato. H keeps them hard: che, chi, ghe, ghi. gn ≈ ny, gli ≈ soft li."),
        ("Trước a, o, u, chữ c đọc như k và g như g: casa, gatto. Trước e, i chúng mềm đi: cena (giống 'ch'), gelato (giống 'gi'). Muốn giữ âm cứng trước e, i thì thêm h: chiave, spaghetti. gn đọc gần như 'nh' tiếng Việt: bagno, gnocchi. gli gần như 'li' uốn lưỡi mềm: famiglia. sc trước e, i đọc như 's' nặng: pesce; trước a, o, u là 'sk': scuola.",
         "Before a, o, u, c sounds like k and g like hard g: casa, gatto. Before e, i they soften: cena, gelato. To keep them hard before e, i add h: chiave, spaghetti. gn is close to Vietnamese 'nh': bagno. gli is a soft 'li': famiglia. sc before e, i sounds like 'sh': pesce; before a, o, u it is 'sk': scuola."),
        [ex("la cena", "bữa tối", "the dinner", "c mềm", "soft c"),
         ex("la chiave", "chìa khóa", "the key", "ch = k", "ch = k"),
         ex("il bagno", "phòng tắm", "the bathroom", "gn", "gn"),
         ex("la famiglia", "gia đình", "the family", "gli", "gli"),
         ex("il pesce", "con cá", "the fish", "sc mềm", "soft sc")],
        [],
        ("Chữ h trong tiếng Ý là tấm khiên giữ c, g cứng.", "H is a shield that keeps c and g hard."),
        ["pronunciation.double_consonants"])

concept("greetings-register",
        ("Chào theo giờ và mức lịch sự", "Greetings by time of day and register"),
        ("buongiorno ban ngày, buonasera từ chiều muộn, ciao chỉ với người quen, arrivederci với người lạ.", "buongiorno by day, buonasera from late afternoon, ciao with people you know, arrivederci with strangers."),
        ("Ciao vừa là chào vừa là tạm biệt nhưng chỉ dùng với bạn bè, người thân. Vào cửa hàng, gặp thầy cô, bác sĩ: nói buongiorno hoặc buonasera, khi về nói arrivederci. Buonanotte chỉ dùng khi chia tay để đi ngủ. Salve là lời chào trung tính, dùng được khi không chắc. Người Ý chào rất nhiều: vào quán bar, vào thang máy, vào phòng khám đều chào.",
         "Ciao means both hello and goodbye but only with friends and family. In shops, with teachers and doctors: buongiorno or buonasera, and arrivederci when leaving. Buonanotte is only for parting to go to bed. Salve is a neutral greeting when unsure. Italians greet a lot: entering a bar, a lift, a waiting room."),
        [ex("Ciao, Marco!", "Chào Marco!", "Hi, Marco!"),
         ex("Buongiorno, signora.", "Chào bà ạ.", "Good morning, madam."),
         ex("Arrivederci e grazie.", "Tạm biệt và cảm ơn.", "Goodbye and thank you.")],
        [],
        ("Vào cửa hàng: đừng 'ciao', hãy 'buongiorno'.", "In a shop: not 'ciao' but 'buongiorno'."),
        ["greetings.basic"])

concept("false-friends",
        ("Từ quốc tế và bạn giả", "International words and false friends"),
        ("Từ quen giúp đoán nghĩa, nhưng camera là căn phòng, parente là họ hàng, fattoria là trang trại.", "Familiar words help, but camera is a room, parente a relative, fattoria a farm."),
        ("Bạn đã biết sẵn nhiều từ tiếng Ý vì chúng là từ quốc tế: il taxi, il computer, il film, la pizza, la musica. Khi gặp từ mới, hãy đoán trước. Nhưng người biết tiếng Anh cần cẩn thận: la camera là căn phòng, il parente là họ hàng, la fattoria là trang trại, la libreria là hiệu sách (thư viện là la biblioteca). Hãy kiểm tra từ điển trong ứng dụng khi câu không có nghĩa.",
         "You already know many Italian words: il taxi, il computer, il film, la pizza, la musica. Guess first when you meet a new word. But people who know English must take care: la camera is a room, il parente a relative, la fattoria a farm, la libreria a bookshop (a library is la biblioteca). Check the dictionary when a sentence makes no sense."),
        [ex("La camera è grande.", "Căn phòng rộng.", "The room is big.", "không phải máy ảnh", "not a camera"),
         ex("Studio in biblioteca.", "Tôi học ở thư viện.", "I study in the library.")],
        [],
        ("Câu vô nghĩa thì nghi ngờ bạn giả.", "If a sentence makes no sense, suspect a false friend."),
        ["strategy.cognates_false_friends"])

concept("possessives",
        ("Từ sở hữu: mio, mia, tuo, tua", "Possessives: mio, mia, tuo, tua"),
        ("Hợp với vật được sở hữu, không phải người sở hữu: mio padre, mia madre, la mia casa.", "They match the thing owned, not the owner: mio padre, mia madre, la mia casa."),
        ("Từ sở hữu đổi theo danh từ theo sau: mio/mia, tuo/tua, suo/sua, nostro/nostra. Suo và sua nghĩa là 'của anh ấy' hoặc 'của cô ấy' tùy ngữ cảnh: giống của từ theo danh từ chứ không theo người. Thông thường có mạo từ đi kèm: la mia casa, il mio libro. Riêng người thân số ít thì bỏ mạo từ: mia madre, tuo fratello.",
         "Possessives change with the noun that follows: mio/mia, tuo/tua, suo/sua, nostro/nostra. Suo and sua mean 'his' or 'her' depending on context: the gender follows the noun, not the person. Usually an article goes with them: la mia casa, il mio libro. Singular family nouns drop it: mia madre, tuo fratello."),
        [ex("la mia casa", "nhà của tôi", "my house"),
         ex("mio padre", "bố tôi", "my father", "người thân: không mạo từ", "family: no article"),
         ex("Sua figlia studia a Roma.", "Con gái của anh ấy học ở Roma.", "His daughter studies in Rome.", "sua theo figlia", "sua follows figlia")],
        [],
        ("Nhìn danh từ, đừng nhìn người.", "Look at the noun, not the person."),
        ["articles.definite", "vocab.everyday_basics"])

# ---------------------------------------------------------------- paradigms (cells from morphology.json)
morph = {v["lemma"]: v for v in json.load(open(MORPH, encoding="utf-8"))["verbs"]}
ATOMS = {"inf": "inf", "pre:1s": "ind:pre:1,sg", "pre:2s": "ind:pre:2,sg", "pre:3s": "ind:pre:3,sg", "pre:1p": "ind:pre:1,pl", "pre:2p": "ind:pre:2,pl", "pre:3p": "ind:pre:3,pl", "participle": "par:pas"}
# The source's first row is an old accented spelling for these monosyllables (the plugin's evidence rule covers the plain form).
STANDARD = {("avere", "pre:1s"): "ho", ("avere", "pre:3s"): "ha", ("stare", "pre:1s"): "sto", ("stare", "pre:3s"): "sta", ("sapere", "pre:1s"): "so", ("sapere", "pre:3s"): "sa", ("andare", "pre:3s"): "va", ("fare", "pre:3s"): "fa", ("dare", "pre:1s"): "do"}
REG = {"are": "are-regular", "ere": "ere-regular", "ire": "ire-regular", "isc": "isc-regular"}
PARADIGMS = [
    ("essere", "là, ở", "to be", "irregular", "essere"), ("avere", "có", "to have", "irregular", "avere"),
    ("andare", "đi", "to go", "irregular", "essere"), ("venire", "đến", "to come", "irregular", "essere"), ("stare", "ở; khỏe", "to stay, to be", "irregular", "essere"),
    ("fare", "làm", "to do, to make", "irregular", "avere"), ("dire", "nói", "to say", "irregular", "avere"), ("dare", "đưa, cho", "to give", "irregular", "avere"),
    ("sapere", "biết", "to know", "irregular", "avere"), ("volere", "muốn", "to want", "irregular", "avere"), ("potere", "có thể", "can", "irregular", "avere"), ("dovere", "phải", "must", "irregular", "avere"),
    ("bere", "uống", "to drink", "irregular", "avere"), ("uscire", "đi ra ngoài", "to go out", "irregular", "essere"),
    ("parlare", "nói", "to speak", "are", "avere"), ("mangiare", "ăn", "to eat", "are", "avere"), ("abitare", "sống, ở", "to live", "are", "avere"), ("lavorare", "làm việc", "to work", "are", "avere"),
    ("studiare", "học", "to study", "are", "avere"), ("cercare", "tìm", "to look for", "are", "avere"), ("pagare", "trả tiền", "to pay", "are", "avere"), ("comprare", "mua", "to buy", "are", "avere"),
    ("guardare", "xem, nhìn", "to watch", "are", "avere"), ("ascoltare", "nghe", "to listen", "are", "avere"), ("arrivare", "đến nơi", "to arrive", "are", "essere"), ("tornare", "trở về", "to return", "are", "essere"),
    ("entrare", "đi vào", "to enter", "are", "essere"), ("restare", "ở lại", "to stay", "are", "essere"),
    ("leggere", "đọc", "to read", "ere", "avere"), ("scrivere", "viết", "to write", "ere", "avere"), ("prendere", "lấy; đi (xe)", "to take", "ere", "avere"), ("vedere", "nhìn thấy", "to see", "ere", "avere"),
    ("dormire", "ngủ", "to sleep", "ire", "avere"), ("sentire", "nghe; cảm thấy", "to hear, to feel", "ire", "avere"), ("partire", "khởi hành", "to leave", "ire", "essere"),
    ("capire", "hiểu", "to understand", "isc", "avere"), ("finire", "kết thúc", "to finish", "isc", "avere"), ("preferire", "thích hơn", "to prefer", "isc", "avere"),
]
for lemma, vi, en, group, aux in PARADIGMS:
    rows = morph[lemma]["rows"]
    cells = {}
    for cell, atom in ATOMS.items():
        cells[cell] = STANDARD.get((lemma, cell)) or [r["mot"] for r in rows if r["infoVer"] == atom][0]
    recs.append({"paradigm": {"lemma": lemma, "gloss": {"vi": vi, "en": en}, "group": REG.get(group, group), "cells": cells, "attributes": {"auxiliary": aux}, "evidence": {"source": "kaikki-en"}}})

os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w", encoding="utf-8", newline="\n").write("\n".join(json.dumps(r, ensure_ascii=False) for r in recs) + "\n")
for r in recs:
    if "id" in r:
        if len(r["explanation"]["vi"]) > 700:
            print("explanation >700", r["id"], len(r["explanation"]["vi"]))
        if len(r["shortRule"]["vi"]) > 140:
            print("shortRule >140", r["id"], len(r["shortRule"]["vi"]))
print(len(recs), "records")
