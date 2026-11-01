"""Concept cards and paradigm tables of en-vi: content/en/_drafts/concepts/OUTPUT.jsonl.

Twenty cards cover the 18 points of plan/authoring/briefs/en-vi.md §3 (point 15 is three cards: final consonants, th,
-s/-ed). Paradigm cells are computed by the same rules as scripts/lib/languages/en-morph.ts, with the irregular forms of
lexicon/irregular-forms.json, then checked against derived/morphology.json the way the validator does. A verb whose
cells lack evidence stays out of the tables: nothing is added to the evidence. usage: python -I en-concepts.py <repo root>
"""
import json, os, re, sys

ROOT = sys.argv[1]
OUT = f"{ROOT}/content/en/_drafts/concepts/OUTPUT.jsonl"
COURSE = {"source": "original-english-course"}
MORPHO = {"source": "kaikki-en", "key": "verb-morphology"}
recs = []


def ex(target, vi, note_vi=None, note_en=None):
    """The en translation of an English example is the example itself: the target language is English."""
    e = {"target": target, "translations": {"vi": vi, "en": target}}
    if note_vi:
        e["note"] = {"vi": note_vi, "en": note_en}
    return e


def concept(cid, title, short, expl, examples, exceptions, hint, objectives, refs=(COURSE,)):
    recs.append({
        "id": f"en:concept:{cid}",
        "title": {"vi": title[0], "en": title[1]},
        "shortRule": {"vi": short[0], "en": short[1]},
        "explanation": {"vi": expl[0], "en": expl[1]},
        "examples": examples,
        "exceptions": [{"vi": v, "en": e} for v, e in exceptions],
        "memoryHint": {"vi": hint[0], "en": hint[1]},
        "objectives": [f"en.obj.{o}" for o in objectives],
        "sourceRefs": list(refs),
    })


concept("be",
        ("Động từ be: am, is, are", "The verb be: am, is, are"),
        ("I am, he/she/it is, you/we/they are. Phủ định thêm not; câu hỏi đưa be lên đầu.", "I am, he/she/it is, you/we/they are. Add not for the negative; put be first in a question."),
        ("Be (là, thì, ở) đổi dạng theo chủ ngữ: I am, she is, they are. Tiếng Việt nói được \"Tôi mệt\" hay \"Nhà to\", nhưng tiếng Anh phải có be: I am tired, The house is big. Be cũng không chỉ là \"là\": Lan is at home nghĩa là Lan ở nhà. Phủ định thêm not sau be: I am not, she is not. Câu hỏi đưa be lên trước chủ ngữ: Are you ready? Khi nói, dạng rút gọn rất hay dùng: I'm, she's, isn't, aren't.",
         "Be changes with the subject: I am, she is, they are. Vietnamese can say 'Tôi mệt' with no verb, but English needs be: I am tired, The house is big. Be is more than 'là': Lan is at home. For the negative add not after be: I am not, she is not. For a question put be before the subject: Are you ready? In speech the short forms are very common: I'm, she's, isn't, aren't."),
        [ex("I am a worker.", "Tôi là công nhân."),
         ex("She is tired.", "Cô ấy mệt.", "tiếng Việt không có động từ ở đây, tiếng Anh phải có", "Vietnamese has no verb here; English must have one"),
         ex("Lan is at home.", "Lan ở nhà.", "be còn nghĩa là \"ở\"", "be also says where someone is"),
         ex("Are you ready?", "Bạn sẵn sàng chưa?", "be đứng đầu câu hỏi", "be comes first in a question"),
         ex("He isn't here.", "Anh ấy không có ở đây.")],
        [("Không nói \"I amn't\": dạng phủ định rút gọn của I am là I'm not.", "Never 'I amn't': the short negative of I am is I'm not.")],
        ("Tiếng Việt bỏ được, tiếng Anh thì không: câu nào cũng cần một động từ.", "Vietnamese can drop it, English cannot: every sentence needs a verb."),
        ["verbs.be_there_is"], (COURSE, MORPHO))

concept("articles",
        ("Mạo từ: a, an, the", "Articles: a, an, the"),
        ("a + âm phụ âm, an + âm nguyên âm, the khi người nghe biết là cái nào. Danh từ không đếm được không đi với a.", "a before a consonant sound, an before a vowel sound, the when the listener knows which. Uncountable nouns take no a."),
        ("Tiếng Việt không có mạo từ (article): \"cái\", \"con\" là loại từ, không phải mạo từ. Vì vậy đây là lỗi người Việt gặp nhiều nhất. Danh từ đếm được số ít cần a hoặc an: a dog, an apple. Chọn theo âm, không theo chữ: an hour, a university. Lần đầu nhắc đến dùng a; khi cả hai đã biết cái nào thì dùng the: I have a dog. The dog is small. Danh từ không đếm được như water, money không đi với a. Nói chung về một loại thì không dùng the: I like coffee.",
         "Vietnamese has no articles, so this is the most frequent error. A singular countable noun needs a or an: a dog, an apple. Choose by sound, not spelling: an hour, a university. Use a the first time; use the once both people know which: I have a dog. The dog is small. Uncountable nouns such as water and money take no a. For things in general use no the: I like coffee."),
        [ex("I have a dog. The dog is small.", "Tôi có một con chó. Con chó nhỏ.", "lần đầu a, lần sau the", "a the first time, the after that"),
         ex("an hour", "một giờ đồng hồ", "h không đọc nên âm đầu là nguyên âm", "the h is silent, so it starts with a vowel sound"),
         ex("a university", "một trường đại học", "chữ u nhưng âm đầu là phụ âm", "a letter u but a consonant sound"),
         ex("I drink water.", "Tôi uống nước.", "không đếm được: không có a", "uncountable: no a"),
         ex("I am a nurse.", "Tôi là y tá.", "tên nghề cần a", "a job name needs a")],
        [("Nhiều cụm cố định không có mạo từ: go home, at work, by bus, in bed. Hãy học cả cụm.", "Many fixed phrases have no article: go home, at work, by bus, in bed. Learn the whole phrase.")],
        ("Nghe âm đầu, đừng nhìn chữ đầu.", "Listen to the first sound; do not look at the first letter."),
        ["articles.a_an_the"])

concept("plurals",
        ("Số nhiều: -s, -es, -ies và từ bất quy tắc", "Plurals: -s, -es, -ies and irregular words"),
        ("Thêm -s; sau s, x, ch, sh thêm -es; phụ âm + y thành -ies. Học riêng children, men, women, people.", "Add -s; add -es after s, x, ch, sh; consonant + y becomes -ies. Learn children, men, women, people separately."),
        ("Số nhiều (plural): tiếng Việt nói \"hai quyển sách\" mà danh từ không đổi, nhưng tiếng Anh phải đổi: two books. Có con số rồi vẫn phải thêm -s. Hầu hết danh từ thêm -s: book, books. Sau s, x, ch, sh thêm -es: box, boxes. Phụ âm + y đổi thành -ies: city, cities. Một số từ thường dùng đổi hẳn: child, children; man, men; woman, women; person, people; foot, feet; tooth, teeth.",
         "Vietnamese says 'hai quyển sách' with no change to the noun, but English must change it: two books. Even after a number the -s stays. Most nouns add -s: book, books. After s, x, ch, sh add -es: box, boxes. Consonant + y becomes -ies: city, cities. Some common words change completely: child, children; man, men; woman, women; person, people; foot, feet; tooth, teeth."),
        [ex("two books", "hai quyển sách", "có số vẫn thêm -s", "the -s stays after a number"),
         ex("three boxes", "ba cái hộp"),
         ex("two cities", "hai thành phố"),
         ex("Two children are here.", "Hai đứa trẻ đang ở đây.", "bất quy tắc", "irregular"),
         ex("We need some information.", "Chúng tôi cần một ít thông tin.", "không đếm được: không có -s", "uncountable: no -s")],
        [("Không đếm được, nên không thêm -s: water, rice, money, information, news.", "Uncountable, so no -s: water, rice, money, information, news."),
         ("People đã là số nhiều: people are, không nói peoples ở nghĩa \"mọi người\".", "People is already plural: people are, and never 'peoples' for ordinary use.")],
        ("Từ hai trở lên: nhớ -s.", "Two or more: remember the -s."),
        ["nouns.plurals_countability"])

concept("present-do-does",
        ("Hiện tại đơn: thêm -s và do, does", "Present simple: -s, and do, does"),
        ("He, she, it thêm -s. Hỏi và phủ định dùng do, does; sau does động từ không có -s.", "He, she, it add -s. Questions and negatives use do, does; after does the verb has no -s."),
        ("Hiện tại đơn (present simple) nói việc thường làm và điều luôn đúng. Tiếng Việt không chia động từ, nhưng tiếng Anh thêm -s sau he, she, it hoặc tên một người: I work, she works. Tiếng Việt chỉ cần \"có… không\", \"không\"; tiếng Anh cần trợ động từ (auxiliary) do hoặc does: Do you work here? Does she work here? I don't work, she doesn't work. Sau does và doesn't, -s không còn nữa: She doesn't work, không phải \"doesn't works\". Have đổi thành has, go thành goes, do thành does, study thành studies.",
         "This tense is for habits and things that are true. Vietnamese does not conjugate, but English adds -s after he, she, it or one person's name: I work, she works. Where Vietnamese uses 'có… không' and 'không', English needs do or does: Do you work here? Does she work here? I don't work, she doesn't work. After does and doesn't the -s disappears: She doesn't work, not 'doesn't works'. Have becomes has, go goes, do does, study studies."),
        [ex("I work in a factory.", "Tôi làm ở nhà máy."),
         ex("She works in a bank.", "Cô ấy làm ở ngân hàng.", "she + works", "she + works"),
         ex("Do you speak English?", "Bạn có nói tiếng Anh không?"),
         ex("Does he live here?", "Anh ấy có sống ở đây không?", "does + live, không có -s", "does + live, no -s"),
         ex("She doesn't smoke.", "Cô ấy không hút thuốc.")],
        [("Be và các động từ như can, will không dùng do: Are you…?, Can you…?", "Be and verbs such as can and will do not use do: Are you…?, Can you…?")],
        ("Chữ -s chỉ xuất hiện một lần: she works, does she work.", "The -s appears only once: she works, does she work."),
        ["verbs.present_simple_do"], (COURSE, MORPHO))

concept("present-continuous",
        ("Hiện tại tiếp diễn: be + V-ing", "Present continuous: be + -ing"),
        ("am, is, are + động từ thêm -ing: việc đang diễn ra lúc này, giống \"đang\".", "am, is, are + verb with -ing: what is happening now, like 'đang'."),
        ("Tiếng Việt thêm \"đang\" trước động từ; tiếng Anh dùng be và thêm -ing: I am working. Không được bỏ be: nói She is eating, không nói \"She eating\". Tiếng Việt có thể bỏ \"đang\" khi đã rõ, nhưng tiếng Anh thì phải chọn: I work là việc thường ngày, I am working là việc lúc này. Chính tả: make thành making, stop thành stopping, sit thành sitting.",
         "Vietnamese adds 'đang' before the verb; English uses be and -ing: I am working. Be cannot be dropped: She is eating, not 'She eating'. Vietnamese may leave 'đang' out when it is clear, but English must choose: I work is a habit, I am working is now. Spelling: make gives making, stop gives stopping, sit gives sitting."),
        [ex("I am working now.", "Bây giờ tôi đang làm việc."),
         ex("She is eating.", "Cô ấy đang ăn."),
         ex("Are you listening?", "Bạn có đang nghe không?"),
         ex("They aren't sleeping.", "Họ không ngủ.")],
        [("Động từ chỉ trạng thái thường không có -ing: I want coffee, I know him, I like it.", "State verbs usually take no -ing: I want coffee, I know him, I like it.")],
        ("Đang = be + -ing, cần cả hai phần.", "'Đang' = be + -ing, and both parts are needed."),
        ["verbs.present_continuous"], (COURSE, MORPHO))

concept("past-did",
        ("Quá khứ đơn: was, were, -ed và did", "Past simple: was, were, -ed and did"),
        ("Thêm -ed hoặc dùng dạng bất quy tắc: worked, went. Hỏi và phủ định dùng did + động từ nguyên thể.", "Add -ed or use the irregular form: worked, went. Questions and negatives use did + the base verb."),
        ("Tiếng Việt thêm \"đã\", và có thể bỏ khi đã có \"hôm qua\". Tiếng Anh đổi chính động từ, kể cả khi đã có yesterday: Yesterday I worked. Động từ thường thêm -ed: work, worked. Nhiều động từ hay gặp phải học thuộc: go, went; have, had; see, saw. Be có hai dạng: I was, you were. Hỏi và phủ định dùng did, rồi động từ trở về nguyên thể: Did you go? I didn't go, không phải \"didn't went\".",
         "Vietnamese adds 'đã' and may drop it after 'hôm qua'. English changes the verb itself, even with yesterday: Yesterday I worked. Regular verbs add -ed: work, worked. Many common verbs must be learned: go, went; have, had; see, saw. Be has two forms: I was, you were. Questions and negatives use did, and the verb returns to its base form: Did you go? I didn't go, not 'didn't went'."),
        [ex("Yesterday I worked.", "Hôm qua tôi làm việc.", "đã có yesterday vẫn phải đổi động từ", "the verb changes even with yesterday"),
         ex("I went home.", "Tôi đã về nhà.", "go → went", "go → went"),
         ex("Did you see the manager?", "Bạn có gặp quản lý không?", "did + see", "did + see"),
         ex("He didn't come.", "Anh ấy đã không đến."),
         ex("We were at work.", "Chúng tôi đã ở chỗ làm.")],
        [("Be không dùng did: Were you there?, I wasn't there.", "Be does not use did: Were you there?, I wasn't there."),
         ("Một số động từ giữ nguyên dạng: put, cost, read (viết giống nhau, read đọc khác đi).", "A few verbs keep the same spelling: put, cost, read (spelled the same, but read sounds different).")],
        ("Dấu quá khứ chỉ một lần: went, hoặc did go.", "Mark the past only once: went, or did go."),
        ["verbs.past_recognition"], (COURSE, MORPHO))

concept("future-going-to-will",
        ("Going to và will", "Going to and will"),
        ("Going to cho việc đã định. Will cho việc vừa quyết định, lời hứa, dự đoán. Tiếng Việt đều là \"sẽ\".", "Going to for a plan. Will for a decision made now, a promise, a prediction. Vietnamese uses 'sẽ' for both."),
        ("Tiếng Việt có một từ \"sẽ\"; tiếng Anh thường dùng hai cách. Be going to + động từ nói việc đã định từ trước: I am going to call him. Will + động từ nói việc vừa quyết định, lời hứa hoặc điều bạn đoán: I'll call you. It will rain. Sau will, động từ không thêm -s: She will come, không phải \"will comes\". Phủ định của will là won't. Ở trình độ này, dùng nhầm hai cách này thường vẫn được hiểu, nên đừng quá lo.",
         "Vietnamese has one word, 'sẽ'; English usually has two ways. Be going to + verb is for a plan: I am going to call him. Will + verb is for a decision made now, a promise or a guess: I'll call you. It will rain. After will the verb takes no -s: She will come, not 'will comes'. The negative of will is won't. At this level, mixing them up is usually still understood, so do not worry too much."),
        [ex("I am going to call him.", "Tôi định gọi cho anh ấy.", "việc đã định", "a plan"),
         ex("I'll send it now.", "Tôi sẽ gửi ngay.", "vừa quyết định", "decided now"),
         ex("She will come at nine.", "Cô ấy sẽ đến lúc chín giờ."),
         ex("It won't take long.", "Sẽ không lâu đâu.")],
        [("Lịch đã cố định thường dùng hiện tại đơn: The train leaves at six.", "A fixed schedule often uses the present simple: The train leaves at six.")],
        ("Đã định: going to. Vừa nghĩ ra: will.", "Already planned: going to. Just decided: will."),
        ["verbs.future_can_would"], (COURSE, MORPHO))

concept("there-is-have",
        ("There is, there are và have", "There is, there are and have"),
        ("Ai có gì: have. Ở đâu có gì: there is với một thứ, there are với nhiều thứ.", "Who has what: have. What is in a place: there is for one thing, there are for several."),
        ("Tiếng Việt dùng một từ \"có\" cho hai ý, còn tiếng Anh tách ra. Have nói ai sở hữu gì: I have a car, she has two children. There is, there are nói ở đâu có gì: There is a bank near here, There are two beds. Câu \"Có một ngân hàng ở gần đây\" không dịch bằng have. Hỏi: Is there a bank near here? Are there any seats? Trong cách nói của người Anh, bạn còn gặp have got với nghĩa như have: I've got a car.",
         "Vietnamese uses one word, 'có', for two ideas, and English splits them. Have says who owns what: I have a car, she has two children. There is and there are say what is in a place: There is a bank near here, There are two beds. Do not translate that use of 'có' with have. To ask: Is there a bank near here? Are there any seats? In British English you also meet have got, meaning have: I've got a car."),
        [ex("I have a car.", "Tôi có một chiếc xe.", "sở hữu", "possession"),
         ex("There is a bank near here.", "Gần đây có một ngân hàng.", "ở đâu có gì", "what is in a place"),
         ex("There are two beds.", "Có hai cái giường."),
         ex("Is there a bathroom here?", "Ở đây có nhà vệ sinh không?"),
         ex("I've got a brother.", "Tôi có một người anh.", "have got: giống have", "have got: the same as have")],
        [("There is với danh từ không đếm được: There is some water.", "There is goes with uncountable nouns: There is some water.")],
        ("Ai có: have. Chỗ nào có: there is.", "Who has it: have. Where it is: there is."),
        ["verbs.be_there_is"], (COURSE, MORPHO))

concept("pronouns-possessives",
        ("Đại từ và từ sở hữu: I, me, my, mine", "Pronouns and possessives: I, me, my, mine"),
        ("I làm chủ ngữ, me làm tân ngữ, my đứng trước danh từ, mine đứng một mình.", "I is the subject, me the object, my goes before a noun, mine stands alone."),
        ("Tiếng Việt dùng \"tôi\" ở mọi vị trí và \"của tôi\" khi sở hữu. Tiếng Anh có bốn dạng: I help her, she helps me, this is my bag, this bag is mine. Bảng đầy đủ: I, me, my, mine; you, you, your, yours; he, him, his, his; she, her, her, hers; we, us, our, ours; they, them, their, theirs. It là đại từ cho đồ vật và con vật. Tiếng Anh cần phân biệt he với she, trong khi tiếng Việt có thể dùng một từ như \"nó\" hay \"bạn ấy\", nên hãy chú ý.",
         "Vietnamese uses 'tôi' in every position and 'của tôi' for possession. English has four forms: I help her, she helps me, this is my bag, this bag is mine. The full table: I, me, my, mine; you, you, your, yours; he, him, his, his; she, her, her, hers; we, us, our, ours; they, them, their, theirs. It is the pronoun for things and animals. English must separate he from she, while Vietnamese can use one word, so pay attention."),
        [ex("She helps me.", "Cô ấy giúp tôi.", "me sau động từ", "me after the verb"),
         ex("This is my bag.", "Đây là túi của tôi.", "my trước danh từ", "my before a noun"),
         ex("This bag is mine.", "Cái túi này là của tôi.", "mine đứng một mình", "mine stands alone"),
         ex("Tom is here. His wife is a doctor.", "Tom ở đây. Vợ anh ấy là bác sĩ.", "his theo người có vợ", "his follows the husband")],
        [("Her vừa là tân ngữ vừa là sở hữu: I see her, her name.", "Her is both object and possessive: I see her, her name.")],
        ("My cần một danh từ theo sau, mine thì không.", "My needs a noun after it, mine does not."),
        ["pronouns.possessives"])

concept("can-would-like",
        ("Can và would like", "Can and would like"),
        ("Can + động từ nguyên thể: làm được, xin phép. Would like: nói điều mình muốn một cách lịch sự.", "Can + base verb: ability, permission. Would like: say what you want politely."),
        ("Can giống \"có thể\", \"biết\": I can swim. Sau can không có to và không thêm -s: She can swim, không phải \"can swims\" hay \"can to swim\". Câu hỏi đưa can lên đầu: Can I sit here? Câu này cũng là cách xin phép. Phủ định: can't. Would like lịch sự hơn want, đi với danh từ hoặc to + động từ: I would like a coffee, I would like to see a doctor. Khi nói thường rút gọn: I'd like.",
         "Can is like 'có thể', 'biết': I can swim. After can there is no to and no -s: She can swim, not 'can swims' or 'can to swim'. For a question put can first: Can I sit here? That is also how to ask permission. The negative is can't. Would like is more polite than want, with a noun or to + verb: I would like a coffee, I would like to see a doctor. In speech it is usually short: I'd like."),
        [ex("She can swim.", "Cô ấy biết bơi."),
         ex("Can I sit here?", "Tôi ngồi đây được không?", "xin phép", "asking permission"),
         ex("I can't come today.", "Hôm nay tôi không đến được."),
         ex("I'd like a coffee, please.", "Cho tôi một ly cà phê.", "lịch sự hơn I want", "more polite than I want"),
         ex("I would like to see a doctor.", "Tôi muốn gặp bác sĩ.")],
        [("Can phát âm yếu trong câu khẳng định, nhưng can't đọc rõ. Hãy nghe kỹ để không nhầm.", "Can is weak in a statement, but can't is clear. Listen closely so as not to confuse them.")],
        ("Sau can: không to, không -s.", "After can: no to, no -s."),
        ["verbs.future_can_would"])

concept("prepositions-in-on-at",
        ("Giới từ in, on, at; next to, behind", "Prepositions in, on, at; next to, behind"),
        ("Giờ: at. Thứ: on. Tháng, năm: in. Chỗ cụ thể: at; trên mặt: on; bên trong, thành phố: in.", "Hours: at. Days: on. Months, years: in. A specific point: at; a surface: on; inside, a city: in."),
        ("Tiếng Việt dùng \"lúc\", \"vào\", \"ở\", \"trong\"; tiếng Anh chọn theo quy luật riêng. Với thời gian: at eight o'clock, on Monday, in May. Với nơi chốn: at the station (một điểm), on the table (trên mặt), in the box, in Hanoi (bên trong, trong thành phố). Chỉ vị trí: next to (bên cạnh), behind (phía sau), in front of (phía trước), between (ở giữa). Đặt giới từ trước danh từ, giống tiếng Việt.",
         "Vietnamese uses 'lúc', 'vào', 'ở', 'trong'; English has its own pattern. For time: at eight o'clock, on Monday, in May. For place: at the station (a point), on the table (a surface), in the box, in Hanoi (inside, a city). For position: next to, behind, in front of, between. The preposition comes before the noun, as in Vietnamese."),
        [ex("The meeting is at nine.", "Cuộc họp lúc chín giờ."),
         ex("I don't work on Sunday.", "Chủ nhật tôi không làm việc."),
         ex("My birthday is in May.", "Sinh nhật tôi vào tháng Năm."),
         ex("He is at the station.", "Anh ấy ở nhà ga."),
         ex("The bank is next to the hotel.", "Ngân hàng ở cạnh khách sạn.")],
        [("Các cụm phải học riêng: in the morning, in the afternoon, nhưng at night; at home, at work.", "Learn these as they are: in the morning, in the afternoon, but at night; at home, at work.")],
        ("Giờ, thứ, tháng: at, on, in, từ nhỏ đến lớn.", "Hour, day, month: at, on, in, small to large."),
        ["prepositions.time_place"])

concept("wh-questions",
        ("Câu hỏi với what, where, when, who, how", "Questions with what, where, when, who, how"),
        ("Từ để hỏi đứng đầu, rồi do, does, did hoặc be, rồi chủ ngữ: Where do you live?", "The question word comes first, then do, does, did or be, then the subject: Where do you live?"),
        ("Tiếng Việt để từ để hỏi ngay chỗ của thông tin: \"Bạn sống ở đâu?\". Tiếng Anh đưa nó lên đầu câu và cần thêm trợ động từ: Where do you live? When does she start? Với be, đảo be lên trước chủ ngữ: Where is the station? What is your name? How much hỏi giá và danh từ không đếm được; how many đi với danh từ đếm được số nhiều: How much is it? How many children do you have?",
         "Vietnamese leaves the question word where the information goes: 'Bạn sống ở đâu?'. English puts it first and needs a helper verb: Where do you live? When does she start? With be, put be before the subject: Where is the station? What is your name? How much asks about price and uncountable nouns; how many goes with countable plural nouns: How much is it? How many children do you have?"),
        [ex("Where do you live?", "Bạn sống ở đâu?", "where đứng đầu câu", "where comes first"),
         ex("What time does it start?", "Mấy giờ bắt đầu?"),
         ex("Where is the station?", "Nhà ga ở đâu?", "với be không có do", "no do with be"),
         ex("How much is it?", "Giá bao nhiêu?"),
         ex("How many people are here?", "Ở đây có bao nhiêu người?")],
        [("Khi who là chủ ngữ thì không có do: Who works here?", "When who is the subject there is no do: Who works here?")],
        ("Từ để hỏi lên đầu, trợ động từ theo sau.", "Question word first, helper verb next."),
        ["syntax.questions_word_order"])

concept("adjectives-very-too",
        ("Tính từ, very, too và so sánh hơn", "Adjectives, very, too and comparatives"),
        ("Tính từ đứng trước danh từ và không đổi dạng. Very đi với tính từ; rất thích là like very much.", "Adjectives go before the noun and do not change. Very goes with adjectives; to say you like something a lot use like very much."),
        ("Tính từ (adjective): tiếng Việt nói \"nhà to\"; tiếng Anh nói a big house. Tính từ không có số nhiều: big houses. Sau be, tính từ đứng một mình: The house is big. Very đi với tính từ: very big. Đừng nói \"I very like\": tiếng Anh nói I like it very much. Too mang ý quá mức, thường không tốt: too expensive. So sánh hơn: thêm -er với từ ngắn (cheaper), more với từ dài (more expensive), rồi than. Ở đây bạn chỉ cần nhận ra chúng.",
         "Vietnamese says 'nhà to'; English says a big house. Adjectives have no plural: big houses. After be an adjective stands alone: The house is big. Very goes with adjectives: very big. Never 'I very like': say I like it very much. Too means more than is good: too expensive. Comparatives: add -er to short words (cheaper), use more with long ones (more expensive), then than. You only need to recognize them here."),
        [ex("a big house", "một ngôi nhà to", "tính từ trước danh từ", "adjective before noun"),
         ex("The house is very big.", "Ngôi nhà rất to."),
         ex("I like it very much.", "Tôi rất thích nó.", "không nói I very like", "not 'I very like'"),
         ex("It is too expensive.", "Nó đắt quá."),
         ex("This shop is cheaper than that shop.", "Cửa hàng này rẻ hơn cửa hàng kia.")],
        [("Một số từ đổi hẳn: good, better; bad, worse.", "A few words change completely: good, better; bad, worse.")],
        ("Too không phải là lời khen.", "Too is not a compliment."),
        ["adjectives.order_very"])

concept("numbers-time-prices",
        ("Số, giờ, ngày tháng và giá tiền", "Numbers, time, dates and prices"),
        ("-teen nhấn ở cuối, -ty nhấn ở đầu. half past = rưỡi, quarter to = kém mười lăm. Người Mỹ viết tháng trước ngày.", "-teen is stressed at the end, -ty at the start. half past, quarter to. Americans write the month before the day."),
        ("Nghe kỹ thirteen với thirty: thir-TEEN nhấn ở cuối, THIR-ty nhấn ở đầu. Giờ: eight o'clock (tám giờ), half past eight (tám giờ rưỡi), quarter past eight (tám giờ mười lăm), quarter to nine (chín giờ kém mười lăm). Tiếng Việt viết ngày trước tháng; người Mỹ thường viết tháng trước, nên 5/12 là ngày 12 tháng 5. Khi viết giá, dấu $ đứng trước số, nhưng khi đọc thì dollars đứng sau: $10 đọc là ten dollars. Thứ và tháng luôn viết hoa.",
         "Listen closely to thirteen and thirty: thir-TEEN is stressed at the end, THIR-ty at the start. Time: eight o'clock, half past eight, quarter past eight, quarter to nine. Vietnamese writes the day first; Americans usually write the month first, so 5/12 is May 12. When writing a price the $ comes before the number, but in speech dollars comes after: $10 is ten dollars. Days and months are always capitalized."),
        [ex("It's half past eight.", "Tám giờ rưỡi."),
         ex("It's quarter to nine.", "Chín giờ kém mười lăm."),
         ex("The meeting is on May 12.", "Cuộc họp vào ngày 12 tháng 5."),
         ex("It costs ten dollars.", "Giá mười đô la.", "viết là $10", "written $10"),
         ex("twenty-one", "hai mươi mốt", "có dấu gạch nối", "with a hyphen")],
        [("Số điện thoại đọc từng chữ số; 0 có thể đọc là zero hoặc oh.", "Phone numbers are read digit by digit; 0 can be read as zero or oh.")],
        ("Teen ở cuối, ty ở đầu: nhấn đúng chỗ là khác số.", "Teen at the end, ty at the start: the stress changes the number."),
        ["numbers.0_100", "vocab.time_calendar"])

concept("final-consonants",
        ("Phụ âm cuối và cụm phụ âm", "Final consonants and consonant clusters"),
        ("Đọc rõ âm cuối từ: bag khác back. Cụm phụ âm đọc liền, không chen thêm nguyên âm: street.", "Say the final sound clearly: bag is not back. Say clusters together, with no extra vowel: street."),
        ("Tiếng Việt có âm cuối nhưng không bật hơi, và không có các âm cuối như s, z, sh, âm cuối của watch hay của bridge. Vì vậy người Việt hay bỏ đuôi: bus thành \"bớt\", watch mất đuôi. Tiếng Anh dùng âm cuối để phân biệt từ: bag và back, card và car. Cụm phụ âm là hai, ba phụ âm đứng liền: street, desk, asked. Đừng chen thêm nguyên âm (\"sơ-tơ-rít\") và đừng bỏ âm nào. Hãy tập đọc chậm, rồi nhanh dần.",
         "Vietnamese has final consonants but does not release them, and has no final s, z, sh, or the endings of watch and bridge. So learners often drop endings: bus, watch. English uses the final sound to separate words: bag and back, card and car. A cluster is two or three consonants together: street, desk, asked. Do not add a vowel between them and do not drop one. Practise slowly, then faster."),
        [ex("bag / back", "cái túi / phía sau", "chỉ khác âm cuối", "only the last sound differs"),
         ex("card / car", "cái thẻ / ô tô", "đọc rõ âm d", "say the d clearly"),
         ex("I take the bus.", "Tôi đi xe buýt.", "đọc rõ âm s cuối", "say the final s"),
         ex("The street is long.", "Con đường dài.", "ba phụ âm: s, t, r", "three consonants: s, t, r"),
         ex("He asked me.", "Anh ấy đã hỏi tôi.", "cuối từ có âm s, k, t liền nhau", "the word ends in s, k, t together")],
        [],
        ("Không có âm cuối, người nghe sẽ đoán sai từ.", "Without the final sound, the listener guesses the wrong word."),
        ["pronunciation.final_sounds"])

concept("th-sounds",
        ("Âm th, và cặp sit, seat", "The th sounds, and the pair sit, seat"),
        ("Th: đặt lưỡi nhẹ giữa hai hàm răng. Think không rung cổ, this có rung cổ. Sit ngắn, seat dài.", "Th: put the tongue lightly between the teeth. Think has no voice, this has voice. Sit is short, seat is long."),
        ("Tiếng Việt không có hai âm th này, nên người Việt hay thay bằng \"t\", \"d\" hay \"s\". Hãy đặt đầu lưỡi nhẹ giữa hai hàm răng rồi đẩy hơi ra. Think, three, thank không rung cổ. This, the, mother có rung cổ. Nguyên âm cũng cần chú ý: sit ngắn và lỏng, seat dài và căng hơn. Bad mở miệng rộng hơn bed. Chúng là những từ khác nhau, nên hãy nghe và nhắc lại theo cặp.",
         "Vietnamese lacks these two th sounds, so learners often replace them with t, d or s. Put the tip of the tongue lightly between the teeth and push air out. Think, three and thank have no voice. This, the and mother have voice. Vowels need care too: sit is short and loose, seat is long and tighter. Bad opens the mouth wider than bed. These are different words, so listen and repeat them in pairs."),
        [ex("think / this", "nghĩ / cái này", "không rung cổ / có rung cổ", "no voice / voice"),
         ex("three", "số ba", "đừng đọc thành tree", "do not say tree"),
         ex("sit / seat", "ngồi / chỗ ngồi", "ngắn / dài", "short / long"),
         ex("bad / bed", "tệ / cái giường", "miệng rộng / miệng hẹp hơn", "wider / narrower mouth")],
        [("Th trong Thomas và Thailand đọc là \"t\".", "The th in Thomas and Thailand sounds like t.")],
        ("Lưỡi thò ra một chút là đúng chỗ.", "If the tongue shows a little, it is in the right place."),
        ["pronunciation.final_sounds"])

concept("s-ed-pronunciation",
        ("Đọc -s và -ed: ba cách", "Saying -s and -ed: three ways"),
        ("-s: s, z, hoặc thêm một âm tiết sau s, sh, ch. -ed: t, d, hoặc thêm một âm tiết sau t, d.", "-s: s, z, or an extra syllable after s, sh, ch. -ed: t, d, or an extra syllable after t, d."),
        ("Đuôi -s và -ed mang nghĩa (ngôi thứ ba, số nhiều, quá khứ), nên không được bỏ, dù tiếng Việt không có các âm cuối này. -s đọc là s sau âm không rung (works, books), là z sau âm rung (lives, dogs), và thêm một âm tiết sau s, sh, ch (washes, watches, boxes). -ed đọc là t sau âm không rung (worked, stopped), là d sau âm rung (lived, called), và thêm một âm tiết chỉ sau t, d (wanted, needed). Đừng đọc worked thành hai âm tiết.",
         "The endings -s and -ed carry meaning (third person, plural, past), so they cannot be dropped, even though Vietnamese has no such final sounds. -s sounds like s after a voiceless sound (works, books), like z after a voiced sound (lives, dogs), and adds a syllable after s, sh, ch (washes, watches, boxes). -ed sounds like t after a voiceless sound (worked, stopped), like d after a voiced sound (lived, called), and adds a syllable only after t, d (wanted, needed). Do not say worked as two syllables."),
        [ex("She works.", "Cô ấy làm việc.", "đuôi s", "ends in s"),
         ex("He lives here.", "Anh ấy sống ở đây.", "đuôi z", "ends in z"),
         ex("She washes her hands.", "Cô ấy rửa tay.", "thêm một âm tiết", "one more syllable"),
         ex("I worked.", "Tôi đã làm việc.", "đuôi t, một âm tiết", "ends in t, one syllable"),
         ex("We lived in Hue.", "Chúng tôi đã sống ở Huế.", "đuôi d", "ends in d"),
         ex("I wanted it.", "Tôi đã muốn nó.", "thêm một âm tiết", "one more syllable")],
        [],
        ("Chỉ sau t, d thì -ed mới thành âm tiết riêng.", "Only after t or d does -ed become its own syllable."),
        ["pronunciation.final_sounds", "verbs.present_simple_do"])

concept("stress-weak-forms",
        ("Trọng âm, dạng yếu và ngữ điệu", "Stress, weak forms and intonation"),
        ("Mỗi từ có một âm tiết được nhấn. Từ nhỏ như to, of, can đọc yếu. Câu hỏi yes/no thường lên giọng.", "Each word has one stressed syllable. Small words such as to, of, can are weak. Yes/no questions usually rise."),
        ("Tiếng Việt mỗi tiếng có thanh điệu riêng và đọc đều nhau; tiếng Anh không có thanh, mà có trọng âm (stress): nhấn một âm tiết rồi đọc lướt các âm còn lại: WA-ter, ho-TEL, com-PU-ter. Nhấn sai có thể khiến người nghe không hiểu. Trong câu, từ nội dung được nhấn, còn từ nhỏ đọc yếu: to, of, a, can, and có nguyên âm rất ngắn. Câu hỏi yes/no thường lên giọng ở cuối (Are you ready?), câu hỏi có từ để hỏi thường xuống giọng (Where do you live?). Đừng đọc từng tiếng rời nhau như tiếng Việt.",
         "Vietnamese gives each syllable its own tone and even timing; English has no tones but stresses one syllable and passes lightly over the rest: WA-ter, ho-TEL, com-PU-ter. Wrong stress can block understanding. In a sentence the content words are stressed and small words are weak: to, of, a, can, and have a very short vowel. Yes/no questions usually rise at the end (Are you ready?); question-word questions usually fall (Where do you live?). Do not read word by word."),
        [ex("water", "nước", "nhấn âm đầu", "stress the first syllable"),
         ex("hotel", "khách sạn", "nhấn âm sau", "stress the second syllable"),
         ex("I can swim.", "Tôi biết bơi.", "can đọc yếu, swim đọc mạnh", "can is weak, swim is strong"),
         ex("I go to work.", "Tôi đi làm.", "to đọc rất nhẹ", "to is very light"),
         ex("Are you ready?", "Bạn sẵn sàng chưa?", "lên giọng ở cuối", "rises at the end")],
        [],
        ("Nhấn một âm, lướt các âm còn lại.", "Stress one syllable, pass over the rest."),
        ["pronunciation.final_sounds"])

concept("politeness",
        ("Lịch sự: please, could you, sorry, excuse me", "Politeness: please, could you, sorry, excuse me"),
        ("Tiếng Anh lịch sự bằng please, could you, would like. Excuse me trước khi làm phiền, sorry sau đó.", "English is polite through please, could you, would like. Excuse me before you bother someone, sorry after."),
        ("Tiếng Việt thể hiện lịch sự bằng xưng hô và từ \"ạ\". Tiếng Anh chỉ có you, nên sự lịch sự nằm ở cách nói: thêm please, dùng Could you…? thay cho câu mệnh lệnh, và nói thank you sau mỗi việc nhỏ. Help me nghe như ra lệnh; Could you help me, please? thì lịch sự. Excuse me dùng trước khi hỏi hoặc xin đi qua. Sorry dùng sau khi đã làm phiền. Ở chỗ làm, hãy gọi người khác đúng cách họ giới thiệu.",
         "Vietnamese shows politeness through address terms and the particle 'ạ'. English has only you, so politeness lies in how you say things: add please, use Could you…? instead of a command, say thank you for small things. Help me sounds like an order; Could you help me, please? is polite. Excuse me comes before asking or passing. Sorry comes after you have bothered someone. At work, address people the way they introduce themselves."),
        [ex("Could you help me, please?", "Bạn giúp tôi được không?"),
         ex("Excuse me, where is the bank?", "Xin lỗi, ngân hàng ở đâu?", "trước khi hỏi", "before asking"),
         ex("Sorry, I'm late.", "Xin lỗi, tôi đến muộn.", "sau khi đã làm phiền", "after the fact"),
         ex("Thank you very much.", "Cảm ơn bạn rất nhiều."),
         ex("Good morning, Mr Smith.", "Chào ông Smith.", "Mr + họ", "Mr + last name")],
        [("Mr, Mrs, Ms đi với họ, không đi với tên: Mr Smith, không nói Mr Tom. Khác với \"ông Nam\" trong tiếng Việt.", "Mr, Mrs, Ms go with the last name, not the first: Mr Smith, never Mr Tom. Vietnamese does the opposite.")],
        ("Câu nhờ nào cũng thêm được please.", "Any request can take please."),
        ["speaking.formulaic", "greetings.basic"])

concept("spelling-sound",
        ("Chính tả không theo âm: -tion, -ough", "Spelling that does not follow sound: -tion, -ough"),
        ("Chữ viết tiếng Anh không đọc theo một quy tắc. Đuôi -tion đọc giống nhau, nhóm -ough thì nhiều cách.", "English spelling does not follow one rule. The ending -tion sounds the same each time, -ough has many sounds."),
        ("Chữ quốc ngữ gần như viết sao đọc vậy, còn tiếng Anh thì không. Hãy học những nhóm hay gặp. Đuôi -tion thường đọc gần giống \"sần\" nhẹ: station, information. Nhóm -ough có nhiều cách đọc: enough kết thúc bằng âm f, though kết thúc bằng nguyên âm, through nghe như \"thru\". Nhiều chữ không đọc: k trong know, w trong write, h trong hour, gh trong daughter. Vì vậy, mỗi khi học từ mới, hãy nghe âm và nhìn chữ cùng lúc.",
         "Vietnamese writing is close to its sound; English is not. Learn the common groups. The ending -tion usually sounds alike: station, information. The group -ough has many sounds: enough ends in f, though ends in a vowel, through sounds like 'thru'. Many letters are silent: k in know, w in write, h in hour, gh in daughter. So when you learn a new word, hear it and see it together."),
        [ex("station", "nhà ga", "đuôi -tion", "the ending -tion"),
         ex("information", "thông tin", "đuôi -tion", "the ending -tion"),
         ex("enough", "đủ", "kết thúc bằng âm f", "ends in f"),
         ex("I know the answer.", "Tôi biết câu trả lời.", "k không đọc", "the k is silent"),
         ex("My daughter is here.", "Con gái tôi ở đây.", "gh không đọc", "the gh is silent")],
        [("Tiếng Anh Mỹ và Anh viết khác nhau một số từ: color, colour. Khoá học dùng cách viết Mỹ.", "American and British spelling differ in some words: color, colour. This course uses American spelling.")],
        ("Từ mới: nghe trước, rồi mới nhìn chữ.", "New word: listen first, then look at the letters."),
        ["writing.familiar_words", "pronunciation.final_sounds"])

# ---------------------------------------------------------------- paradigms
irregular = json.load(open(f"{ROOT}/content/en/lexicon/irregular-forms.json", encoding="utf-8"))["verbs"]
morph = {v["lemma"]: v["rows"] for v in json.load(open(f"{ROOT}/content/en/lexicon/derived/morphology.json", encoding="utf-8"))["verbs"]}
DOUBLING = {"admit", "begin", "commit", "control", "forget", "occur", "permit", "prefer", "refer", "regret", "submit"}


def doubles(lemma):
    return lemma in DOUBLING or re.match(r"^(?:[^aeiou]*|qu)[aeiou][^aeiouwxy]$", lemma)


def third(lemma):
    if lemma == "be":
        return "is"
    if lemma == "have":
        return "has"
    if re.search(r"[^aeiou]y$", lemma):
        return lemma[:-1] + "ies"
    return lemma + "es" if re.search(r"(?:s|x|z|ch|sh|o)$", lemma) else lemma + "s"


def ing(lemma):
    if lemma == "be" or re.search(r"(?:ee|oe|ye)$", lemma):
        return lemma + "ing"
    if lemma.endswith("e"):
        return lemma[:-1] + "ing"
    return lemma + lemma[-1] + "ing" if doubles(lemma) else lemma + "ing"


def regular_past(lemma):
    if lemma.endswith("e"):
        return lemma + "d"
    if re.search(r"[^aeiou]y$", lemma):
        return lemma[:-1] + "ied"
    return lemma + lemma[-1] + "ed" if doubles(lemma) else lemma + "ed"


def cells_of(lemma, irr):
    pasts = [p.strip() for p in irr["past"].split(",")] if irr else [regular_past(lemma)]
    plain = "are" if lemma == "be" else lemma
    return {"inf": lemma, "pre:1s": "am" if lemma == "be" else lemma, "pre:2s": plain, "pre:3s": third(lemma), "pre:1p": plain, "pre:2p": plain, "pre:3p": plain,
            "pas:s": pasts[0], "pas:p": pasts[-1], "participle": irr["participle"] if irr else regular_past(lemma), "ing": ing(lemma)}


def evidenced(cell, atom):
    if cell == "inf":
        return atom == "inf"
    if cell == "participle":
        return atom == "par:pas"
    if cell == "ing":
        return atom == "par:pre"
    if cell == "pre:3s":
        return atom == "ind:pre:3"
    if cell.startswith("pas:"):
        return atom.startswith("ind:pas:") or atom == "par:pas" or atom == "pl"
    return atom in ("inf", "pl", "ind:pre:1", "ind:pre:2")


# Lemma, Vietnamese gloss, English gloss. `cut`, `fall`, `cross`, `reply`, `practice` lack evidence and are left out (see the check below).
TABLES = [
    ("be", "là, ở", "to be"), ("have", "có", "to have"), ("do", "làm", "to do"),
    # regular: one per spelling pattern, then the verbs an adult worker needs first
    ("work", "làm việc", "to work"), ("live", "sống, ở", "to live"), ("study", "học", "to study"), ("stop", "dừng", "to stop"), ("play", "chơi", "to play"), ("wash", "rửa", "to wash"),
    ("want", "muốn", "to want"), ("need", "cần", "to need"), ("like", "thích", "to like"), ("love", "yêu", "to love"), ("help", "giúp", "to help"), ("call", "gọi", "to call"),
    ("ask", "hỏi", "to ask"), ("use", "dùng", "to use"), ("start", "bắt đầu", "to start"), ("finish", "xong, kết thúc", "to finish"), ("wait", "chờ", "to wait"), ("walk", "đi bộ", "to walk"),
    ("talk", "nói chuyện", "to talk"), ("listen", "nghe", "to listen"), ("look", "nhìn", "to look"), ("watch", "xem", "to watch"), ("clean", "lau dọn", "to clean"), ("check", "kiểm tra", "to check"),
    ("arrive", "đến nơi", "to arrive"), ("carry", "mang, vác", "to carry"), ("try", "thử", "to try"),
    # high-frequency irregular pasts
    ("go", "đi", "to go"), ("come", "đến", "to come"), ("get", "nhận, lấy", "to get"), ("make", "làm ra", "to make"), ("take", "lấy, mang đi", "to take"), ("give", "đưa, cho", "to give"),
    ("see", "nhìn thấy", "to see"), ("say", "nói", "to say"), ("tell", "bảo, kể", "to tell"), ("know", "biết", "to know"), ("think", "nghĩ", "to think"), ("eat", "ăn", "to eat"),
    ("drink", "uống", "to drink"), ("buy", "mua", "to buy"), ("pay", "trả tiền", "to pay"), ("sell", "bán", "to sell"), ("send", "gửi", "to send"), ("read", "đọc", "to read"),
    ("write", "viết", "to write"), ("speak", "nói (một thứ tiếng)", "to speak"), ("hear", "nghe thấy", "to hear"), ("find", "tìm thấy", "to find"), ("meet", "gặp", "to meet"), ("leave", "rời đi", "to leave"),
    ("put", "đặt", "to put"), ("sit", "ngồi", "to sit"), ("stand", "đứng", "to stand"), ("sleep", "ngủ", "to sleep"), ("wake", "thức dậy", "to wake"), ("begin", "bắt đầu", "to begin"),
    ("break", "làm vỡ", "to break"), ("drive", "lái xe", "to drive"), ("understand", "hiểu", "to understand"), ("wear", "mặc, đội", "to wear"), ("feel", "cảm thấy", "to feel"), ("forget", "quên", "to forget"),
    ("bring", "mang đến", "to bring"), ("teach", "dạy", "to teach"), ("run", "chạy", "to run"), ("spend", "tiêu, dành", "to spend"),
]
lex_ids = {x["lemma"]: x["id"] for x in json.load(open(f"{ROOT}/content/en/lexicon/lexemes.json", encoding="utf-8"))["lexemes"] if x["partOfSpeech"] == "verb"}
missing = []
for lemma, vi, en in TABLES:
    lex_id = lex_ids.get(lemma)
    if lex_id is None:
        raise SystemExit(f"{lemma}: not a verb in the lexicon")
    irr = irregular.get(lex_id)
    cells = cells_of(lemma, irr)
    rows = morph.get(lemma)
    gaps = [f"{c}={f}" for c, f in cells.items() if not rows or not any(r["mot"] == f and any(evidenced(c, a) for a in r["infoVer"].split(",")) for r in rows)]
    if gaps:
        missing.append(f"{lemma}: {', '.join(gaps)}")
        continue
    recs.append({"paradigm": {"lemma": lemma, "gloss": {"vi": vi, "en": en}, "group": "irregular" if irr else "regular", "cells": cells, "evidence": {"source": "kaikki-en"}}})
if missing:
    raise SystemExit("no evidence, take out of TABLES: " + "; ".join(missing))

problems = []
for r in recs:
    if "id" not in r:
        continue
    if len(r["explanation"]["vi"]) > 700:
        problems.append(f"{r['id']}: explanation {len(r['explanation']['vi'])} chars")
    if len(r["shortRule"]["vi"]) > 140:
        problems.append(f"{r['id']}: shortRule {len(r['shortRule']['vi'])} chars")
    for e in r["examples"]:
        if len(re.findall(r"[A-Za-z0-9'-]+", e["target"])) > 12:
            problems.append(f"{r['id']}: example too long: {e['target']}")
if problems:
    sys.stdout.buffer.write(("\n".join(problems) + "\n").encode("utf-8"))
    raise SystemExit(f"{len(problems)} problem(s)")
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(json.dumps(r, ensure_ascii=False) for r in recs) + "\n")
n = sum(1 for r in recs if "id" in r)
print(n, "concepts,", len(recs) - n, "paradigm tables")
