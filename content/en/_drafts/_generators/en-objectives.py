"""Objectives of en-vi: content/en/_drafts/objectives/OUTPUT.jsonl, plus the policy files and RESEARCH.md, which the
toolkit does not generate for a new course: written straight into the staged layer (content/en/_drafts/staged/...).
Same construct families and CEFR scale alignments as the other courses; every line is written for English and for
Vietnamese learners. No descriptor text. usage: python -I en-objectives.py <repo root>"""
import json, os, sys

ROOT = sys.argv[1]
STAGED = f"{ROOT}/content/en/_drafts/staged"
SCALE = {
    "conversation": "Conversation (spoken interaction)",
    "sociolinguistic-appropriateness": "Sociolinguistic appropriateness",
    "vocabulary-range": "Vocabulary range",
    "grammatical-accuracy": "Grammatical accuracy",
    "orthographic-control": "Orthographic control",
    "phonological-control": "Phonological control",
    "identifying-cues-inferring": "Identifying cues and inferring (reception strategy)",
    "overall-reading-comprehension": "Overall reading comprehension",
    "overall-listening-comprehension": "Overall listening comprehension",
    "audio-media-recordings": "Listening to audio media and recordings",
    "announcements-instructions": "Listening to announcements and instructions",
    "understanding-conversation": "Understanding conversation between other speakers",
    "reading-correspondence": "Reading correspondence",
    "reading-orientation": "Reading for orientation",
    "overall-oral-production": "Overall oral production",
    "sustained-monologue-describing": "Sustained monologue: describing experience",
    "sustained-monologue-giving-information": "Sustained monologue: giving information",
    "overall-written-production": "Overall written production",
    "overall-written-interaction": "Overall written interaction",
    "notes-messages-forms": "Notes, messages and forms",
    "correspondence": "Correspondence",
    "overall-oral-interaction": "Overall oral interaction",
    "information-exchange": "Information exchange",
    "obtaining-goods-services": "Obtaining goods and services",
}
OUT = []


def obj(oid, category, essential, pre, aligns, title, can, note=None):
    rec = {
        "id": f"en.obj.{oid}",
        "title": {"en": title[0], "vi": title[1]},
        "canDo": {"en": can[0], "vi": can[1]},
        "category": category,
        "prerequisites": [f"en.obj.{p}" for p in pre],
        "cefrAlignments": [{"level": lvl, "scaleName": SCALE[s], "relation": rel, "sourceRef": f"cefr-cv-2020:{s}"} for lvl, rel, s in aligns],
        "essential": essential,
    }
    if note:
        rec["evidenceNote"] = note
    OUT.append(rec)


# ---------------------------------------------------------------- lexical
obj("greetings.basic", "lexical", True, [], [("PRE_A1", "supports", "conversation"), ("A1", "supports", "sociolinguistic-appropriateness")],
    ("Everyday greetings and polite words", "Lời chào và câu lịch sự hằng ngày"),
    ("I can recognise and type the everyday English greetings and polite words — hello, good morning, thank you, please, sorry, excuse me — and choose the one that fits the moment.",
     "Tôi có thể nhận ra và viết các lời chào và câu lịch sự hằng ngày bằng tiếng Anh — hello, good morning, thank you, please, sorry, excuse me — và chọn đúng câu cho tình huống."),
    "Written recognition and typing only. Saying these formulas aloud is assessed separately by en.obj.speaking.formulaic.")
obj("vocab.everyday_basics", "lexical", True, [], [("PRE_A1", "supports", "vocabulary-range"), ("A1", "supports", "vocabulary-range")],
    ("Common everyday words", "Từ thông dụng hằng ngày"),
    ("I can understand and name the course's everyday words — people, family, food and drink, familiar objects — when I read them.",
     "Tôi có thể hiểu và gọi tên những từ hằng ngày của khoá học — người, gia đình, đồ ăn thức uống và đồ vật quen thuộc — khi đọc thấy chúng."))
obj("vocab.places_work", "lexical", False, [], [("A1", "supports", "vocabulary-range")],
    ("Words for places, travel and work", "Từ về nơi chốn, đi lại và chỗ làm"),
    ("I can understand common words for places, travel and the workplace — station, ticket, street, office, factory, manager — when I read them.",
     "Tôi có thể hiểu các từ chỉ nơi chốn, đi lại và chỗ làm — station, ticket, street, office, factory, manager — khi đọc thấy chúng."))
obj("vocab.time_calendar", "lexical", False, [], [("A1", "supports", "vocabulary-range")],
    ("Words for time and the calendar", "Từ về thời gian và lịch"),
    ("I can use English words for time — today, tomorrow, week, month — and the days and months, such as Monday and May.",
     "Tôi có thể dùng từ tiếng Anh để nói về thời gian — today, tomorrow, week, month — cùng các thứ trong tuần và các tháng, như Monday, May."))
obj("numbers.0_100", "lexical", True, [], [("A1", "supports", "vocabulary-range")],
    ("Numbers 0-100", "Số từ 0 đến 100"),
    ("I can understand and write English numbers from zero to one hundred, and tell thirteen from thirty and fifteen from fifty.",
     "Tôi có thể hiểu và viết các số tiếng Anh từ zero đến one hundred, và phân biệt thirteen với thirty, fifteen với fifty."),
    "Numbers are read and typed here; spoken numbers are assessed by the listening and speaking objectives.")

# ---------------------------------------------------------------- written recognition and form
obj("reading.familiar_words", "written_reception", True, [], [("PRE_A1", "direct", "overall-reading-comprehension"), ("A1", "supports", "overall-reading-comprehension")],
    ("Reading familiar words and short phrases", "Đọc từ quen thuộc và cụm từ ngắn"),
    ("I can recognise familiar words and very short learned phrases on the page and match them to their meaning.",
     "Tôi có thể nhận ra từ quen thuộc và cụm từ rất ngắn đã học khi thấy chúng được viết ra, và nối chúng với nghĩa."),
    "Direct at Pre-A1 only: written recognition of familiar words and learned phrases. Reading short simple texts at A1 belongs to the reading objectives below.")
obj("writing.familiar_words", "written_production", True, [], [("A1", "supports", "orthographic-control")],
    ("Spelling familiar words", "Viết đúng chính tả từ quen thuộc"),
    ("I can type familiar words correctly, including words not written as they sound — daughter, hour, know — and I capitalise I, names, days and months.",
     "Tôi có thể gõ đúng chính tả các từ quen thuộc đã học, kể cả từ không viết như đọc — daughter, hour, know — và viết hoa I, tên người, thứ và tháng."),
    "Evidence is single words and short learned forms, not composed sentences.")

# ---------------------------------------------------------------- grammar
obj("articles.a_an_the", "grammar", True, [], [("A1", "supports", "grammatical-accuracy")],
    ("The articles a, an, the", "Mạo từ a, an, the"),
    ("I can choose a, an or the for familiar nouns by the first sound and by whether the listener knows which one — a dog, an apple, an hour, the door — and leave the article out before water or money.",
     "Tôi có thể chọn a, an hay the cho danh từ quen thuộc theo âm đầu và theo việc người nghe đã biết vật đó chưa — a dog, an apple, an hour, the door — và bỏ mạo từ trước water, money."))
obj("nouns.plurals_countability", "grammar", False, ["articles.a_an_the"], [("A1", "supports", "grammatical-accuracy")],
    ("Plurals and uncountable nouns", "Số nhiều và danh từ không đếm được"),
    ("I can write common plurals — books, boxes, cities — and irregular ones such as children and people, and I know that water, money and information have no plural.",
     "Tôi có thể viết số nhiều thường gặp — books, boxes, cities — và dạng bất quy tắc như children, people; tôi biết water, money, information không có số nhiều."))
obj("verbs.be_there_is", "grammar", True, [], [("A1", "supports", "grammatical-accuracy")],
    ("Be, and there is / there are", "Động từ be và there is / there are"),
    ("I can use am, is and are in statements, negatives and questions to say who I am, where I am and how I am, and there is / there are to say what is in a place.",
     "Tôi có thể dùng am, is, are ở câu khẳng định, phủ định và câu hỏi để nói mình là ai, ở đâu và thế nào, và dùng there is, there are để nói ở đâu có gì."))
obj("verbs.present_simple_do", "grammar", True, ["verbs.be_there_is"], [("A1", "supports", "grammatical-accuracy")],
    ("Present simple with do and does", "Hiện tại đơn với do và does"),
    ("I can talk about everyday actions in the present simple, adding -s for he and she — she works, he goes — and using do and does in questions and negatives.",
     "Tôi có thể nói việc thường ngày ở thì hiện tại đơn, thêm -s ở ngôi thứ ba — she works, he goes — và dùng do, does khi hỏi và phủ định."))
obj("syntax.questions_word_order", "grammar", False, ["verbs.present_simple_do"], [("A1", "supports", "grammatical-accuracy")],
    ("Question words and word order", "Từ để hỏi và trật tự từ trong câu hỏi"),
    ("I can ask questions with what, where, when, who, how much and how many in the right word order — Where do you live? How much is it?",
     "Tôi có thể đặt câu hỏi với what, where, when, who, how much, how many đúng trật tự từ — Where do you live? How much is it?"))
obj("verbs.present_continuous", "grammar", False, ["verbs.be_there_is"], [("A1", "supports", "grammatical-accuracy")],
    ("Present continuous", "Hiện tại tiếp diễn"),
    ("I can say what is happening now with be + -ing — I am working, She is eating — where Vietnamese uses the word 'đang'.",
     "Tôi có thể nói việc đang diễn ra bằng be + V-ing — I am working, She is eating — ở chỗ tiếng Việt dùng “đang”."))
obj("verbs.past_recognition", "grammar", False, ["verbs.present_simple_do"], [("A2", "supports", "grammatical-accuracy")],
    ("Recognising the past simple", "Nhận biết quá khứ đơn"),
    ("I can recognise and use a few very common past forms — was, were, worked, went, had, saw — and ask with did, where Vietnamese only adds 'đã'.",
     "Tôi có thể nhận ra và dùng một số dạng quá khứ rất thông dụng — was, were, worked, went, had, saw — và hỏi với did, ở chỗ tiếng Việt chỉ thêm “đã”."),
    "Taught with high-frequency verbs only: the full past system is not taught, and A1 production does not require it.")
obj("verbs.future_can_would", "grammar", False, ["verbs.be_there_is"], [("A2", "supports", "grammatical-accuracy")],
    ("Going to, will, can, would like", "Going to, will, can, would like"),
    ("I can say what I plan to do with going to and will, what I can do or may do with can, and what I want politely with would like.",
     "Tôi có thể nói việc sắp làm bằng going to, will; nói việc làm được hoặc xin phép bằng can; và nói điều mình muốn một cách lịch sự bằng would like."),
    "Learned patterns with common verbs only. The contrast between going to and will is taught, not assessed.")
obj("pronouns.possessives", "grammar", False, ["verbs.be_there_is"], [("A1", "supports", "grammatical-accuracy")],
    ("Pronouns and possessives", "Đại từ và từ sở hữu"),
    ("I can tell I, me, my and mine apart, and the same set for the other persons — He helps me, This is my bag — where Vietnamese uses one word.",
     "Tôi có thể phân biệt I, me, my, mine và các đại từ tương tự — He helps me, This is my bag — ở chỗ tiếng Việt dùng một từ “tôi”."))
obj("prepositions.time_place", "grammar", False, ["vocab.time_calendar"], [("A1", "supports", "grammatical-accuracy")],
    ("In, on, at and place words", "In, on, at và từ chỉ vị trí"),
    ("I can use in, on and at for times, days, months and places — at eight, on Monday, in May, at the station — and next to and behind to show position.",
     "Tôi có thể dùng in, on, at cho giờ, ngày, tháng và nơi chốn — at eight, on Monday, in May, at the station — và next to, behind khi chỉ vị trí."))
obj("adjectives.order_very", "grammar", False, ["verbs.be_there_is"], [("A1", "supports", "grammatical-accuracy")],
    ("Adjectives, very and too", "Tính từ, very và too"),
    ("I can put an adjective before its noun — a big house — use very and too in the right place, and recognise comparatives such as bigger and cheaper.",
     "Tôi có thể đặt tính từ trước danh từ — a big house — dùng very, too đúng chỗ, và nhận ra dạng so sánh hơn như bigger, cheaper."),
    "Comparatives are recognition only: A1 production does not require them.")

# ---------------------------------------------------------------- phonology and strategy
obj("pronunciation.final_sounds", "phonology", False, ["writing.familiar_words"], [("A1", "supports", "phonological-control")],
    ("Final sounds, th and stress", "Âm cuối, âm th và trọng âm"),
    ("I can hear the difference in pairs such as bag / back, think / this and sit / seat, I know the three ways to say -s and -ed, and I know where the stress falls in familiar words.",
     "Tôi có thể nghe phân biệt những cặp như bag / back, think / this, sit / seat, biết ba cách đọc -s và -ed, và biết trọng âm rơi vào đâu trong từ quen thuộc."),
    "Rule and contrast recognition only. The learner's own pronunciation is not assessed.")
obj("strategy.loanwords_false_friends", "strategy", False, [], [("A1", "supports", "identifying-cues-inferring")],
    ("Familiar words and false friends", "Từ quen tai và “bạn giả”"),
    ("I can guess new words from ones Vietnamese already uses — bus, taxi, TV, coffee — and avoid traps such as photo, which means a picture, while Vietnamese 'phô-tô' means a copy.",
     "Tôi có thể đoán nghĩa từ mới nhờ những từ tiếng Việt đã quen — bus, taxi, TV, coffee — và tránh bẫy như photo (tấm ảnh, còn “phô-tô” là copy)."))

# ---------------------------------------------------------------- spoken reception
obj("listening.familiar_words", "spoken_reception", True, ["vocab.everyday_basics"], [("PRE_A1", "direct", "overall-listening-comprehension"), ("A1", "supports", "overall-listening-comprehension")],
    ("Hearing familiar words and short phrases", "Nghe từ quen thuộc và cụm từ ngắn"),
    ("I can pick out familiar words and short learned phrases when they are read clearly and slowly.",
     "Tôi có thể nhận ra từ quen thuộc và cụm từ ngắn đã học khi nghe chúng được đọc rõ và chậm."),
    "Direct at Pre-A1 only: bundled, clear, synthesized clips of single words and short phrases, scored in the Section 3 checkpoint. Natural conversational speech and other accents are not assessed.")
obj("listening.short_info", "spoken_reception", True, ["listening.familiar_words", "numbers.0_100"], [("A1", "direct", "audio-media-recordings"), ("PRE_A1", "supports", "overall-listening-comprehension")],
    ("Hearing facts in a short recording", "Nghe thông tin trong đoạn ghi âm ngắn"),
    ("I can catch concrete facts — a time, a price, a number, a place — in a short, clear, slow recording about everyday matters.",
     "Tôi có thể nghe ra thông tin cụ thể như giờ, giá, con số, địa điểm trong một đoạn ghi âm ngắn, rõ và chậm về chuyện hằng ngày."),
    "Direct at A1 within the bundled audio: short synthesized recordings holding 1-3 facts, scored in the Section 3 checkpoint. Authentic-speed media are not assessed.")
obj("listening.announcements", "spoken_reception", True, ["listening.familiar_words"], [("A1", "direct", "announcements-instructions")],
    ("Announcements and instructions", "Thông báo và chỉ dẫn"),
    ("I can understand very short announcements and instructions spoken clearly and slowly — at a station, in a shop, in a factory or an office.",
     "Tôi có thể hiểu thông báo và chỉ dẫn rất ngắn nói rõ và chậm — ở nhà ga, trong cửa hàng, ở nhà máy hay văn phòng."),
    "Direct at A1 within the bundled audio: synthesized station, shop and workplace announcements and simple instructions, scored in the Section 3 checkpoint.")
obj("listening.short_dialogues", "spoken_reception", True, ["listening.familiar_words", "greetings.basic"], [("A1", "direct", "understanding-conversation")],
    ("Understanding short dialogues", "Nghe hiểu hội thoại ngắn"),
    ("I can follow the main point when two people say a few clear sentences to each other about daily life or work.",
     "Tôi có thể hiểu ý chính khi hai người nói rõ ràng với nhau vài câu về chuyện hằng ngày hoặc công việc."),
    "Direct at A1 within the bundled audio: two-voice synthesized exchanges of 2-4 turns (cast A and B are different speakers), scored in the Section 3 checkpoint. The learner only listens: interaction is assessed by the interaction objectives.")

# ---------------------------------------------------------------- written reception
obj("reading.short_messages", "written_reception", True, ["reading.familiar_words"], [("A1", "direct", "reading-correspondence")],
    ("Reading short messages", "Đọc tin nhắn ngắn"),
    ("I can understand short, simple text messages and emails about shifts, appointments and everyday tasks.",
     "Tôi có thể hiểu tin nhắn và thư điện tử ngắn, đơn giản về lịch làm, cuộc hẹn và việc cần làm hằng ngày."),
    "Direct at A1: original short messages read and answered in the Section 3 checkpoint.")
obj("reading.notices_info", "written_reception", True, ["reading.familiar_words"], [("A1", "direct", "reading-orientation")],
    ("Finding facts on notices", "Tìm thông tin trên biển báo"),
    ("I can find the facts I need on signs, workplace rules, opening hours and simple schedules.",
     "Tôi có thể tìm thông tin cần thiết trên biển báo, nội quy, giờ mở cửa và lịch làm việc đơn giản."),
    "Direct at A1: original notices and schedules with locate-type questions, scored in the Section 3 checkpoint.")
obj("reading.short_texts", "written_reception", True, ["reading.familiar_words", "verbs.be_there_is"], [("A1", "direct", "overall-reading-comprehension"), ("A2", "supports", "overall-reading-comprehension")],
    ("Reading very short texts", "Đọc đoạn văn rất ngắn"),
    ("I can read a very short text about familiar people and routines, slowly and more than once if I need to.",
     "Tôi có thể đọc hiểu đoạn văn rất ngắn về người và sinh hoạt quen thuộc, đọc chậm và đọc lại khi cần."),
    "Direct at A1: original 2-5 sentence descriptions and small stories, scored in the Section 3 checkpoint. Longer texts and unfamiliar topics are not assessed.")

# ---------------------------------------------------------------- spoken production
obj("speaking.formulaic", "spoken_production", True, ["greetings.basic"], [("PRE_A1", "supports", "overall-oral-production"), ("A1", "direct", "overall-oral-production"), ("A1", "supports", "sociolinguistic-appropriateness")],
    ("Saying polite formulas aloud", "Nói các câu lịch sự quen thuộc"),
    ("I can say the everyday greetings, thanks, apologies and requests aloud — hello, thank you, excuse me, could you help me — and choose the one that fits the moment.",
     "Tôi có thể nói thành tiếng các câu chào, cảm ơn, xin lỗi và nhờ vả hằng ngày — hello, thank you, excuse me, could you help me — và chọn đúng câu cho tình huống."),
    "Assessed from what an on-device speech recogniser heard: word recognition only, never a pronunciation-quality score.")
obj("speaking.self_intro", "spoken_production", True, ["verbs.be_there_is", "verbs.present_simple_do"], [("A1", "direct", "sustained-monologue-describing"), ("A1", "supports", "overall-oral-production")],
    ("Introducing yourself aloud", "Tự giới thiệu thành tiếng"),
    ("I can introduce myself aloud in short sentences — my name (My name is …), where I come from (I am from Vietnam), my job, where I live, what I like — in class or at work.",
     "Tôi có thể tự giới thiệu thành tiếng từng câu ngắn — tên (My name is …), quê (I am from Vietnam), việc làm, nơi sống và điều mình thích — ở lớp hay nơi làm việc."),
    "Assessed from recognised words in elicited sentences. The meaning cue is in Vietnamese; the English is never shown before the attempt.")
obj("speaking.give_info", "spoken_production", True, ["numbers.0_100"], [("A1", "direct", "sustained-monologue-giving-information"), ("A1", "supports", "overall-oral-production")],
    ("Giving simple facts aloud", "Nói thông tin đơn giản"),
    ("I can give simple facts aloud with numbers and common words — a phone number, a price, a time, how many.",
     "Tôi có thể nói thông tin đơn giản bằng con số và từ thông dụng — số điện thoại, giá, giờ, số lượng."),
    "Recognised digits and number words count as the same information; a wrong number is a wrong answer, and silence is never scored.")
obj("speaking.describe", "spoken_production", False, ["vocab.everyday_basics"], [("A1", "direct", "overall-oral-production"), ("A1", "supports", "sustained-monologue-describing")],
    ("Describing aloud", "Mô tả thành tiếng"),
    ("I can describe familiar people, places and objects aloud in short phrases: what it is and one simple feature.",
     "Tôi có thể tả người, nơi chốn và đồ vật quen thuộc bằng cụm từ ngắn: đó là gì và một đặc điểm đơn giản của nó."),
    "Short separate phrases only: connected description is beyond this course's A1 claim.")

# ---------------------------------------------------------------- written production
obj("writing.personal_info", "written_production", True, ["writing.familiar_words", "verbs.be_there_is"], [("A1", "direct", "overall-written-production"), ("A1", "direct", "overall-written-interaction"), ("A1", "supports", "orthographic-control")],
    ("Writing about yourself", "Viết về bản thân"),
    ("I can write short sentences about myself — name, age, where I come from, where I live, my job.",
     "Tôi có thể viết những câu ngắn về bản thân — tên, tuổi, quê, nơi ở và công việc."),
    "Assessed by guided rubric-scored writing with required information slots; open free writing is never scored evidence.")
obj("writing.phrases_sentences", "written_production", True, ["writing.personal_info", "verbs.present_simple_do"], [("A1", "direct", "overall-written-production"), ("A1", "supports", "grammatical-accuracy")],
    ("Writing simple sentences", "Viết câu đơn giản"),
    ("I can write short sentences about familiar people and things — who does what, where, what they like — and join them with and, but, because.",
     "Tôi có thể viết câu ngắn về người và việc quen thuộc — ai làm gì, ở đâu, thích gì — và nối câu bằng and, but, because."),
    "Assessed by guided tasks whose rubric requires a subject and verb from an authored list plus the task's information slots.")
obj("writing.short_message", "written_production", True, ["writing.personal_info", "vocab.time_calendar"], [("A1", "direct", "correspondence"), ("A1", "direct", "overall-written-interaction")],
    ("Writing a short message or email", "Viết tin nhắn hoặc email ngắn"),
    ("I can write a very short message or email: a greeting, one or two facts such as a time or a place, and a closing.",
     "Tôi có thể viết tin nhắn hoặc email rất ngắn: lời chào, một hai thông tin như giờ hoặc địa điểm, và lời kết."),
    "Assessed by guided tasks; the rubric requires the message's parts (greeting, fact, closing) and never judges style.")
obj("writing.form_filling", "written_production", False, ["writing.familiar_words", "numbers.0_100"], [("A1", "direct", "notes-messages-forms")],
    ("Filling in a form", "Điền biểu mẫu"),
    ("I can fill in a simple everyday form in English — first name, last name, address, phone number and similar facts.",
     "Tôi có thể điền biểu mẫu đơn giản bằng tiếng Anh — first name, last name, address, phone number và những thông tin tương tự."),
    "Assessed by separate labelled fields checked against the cue facts; an empty form is insufficient evidence, never a failure.")

# ---------------------------------------------------------------- interaction
obj("interaction.everyday_conversation", "interaction", True, ["speaking.formulaic", "speaking.self_intro", "listening.short_dialogues"], [("A1", "direct", "overall-oral-interaction"), ("A1", "direct", "conversation")],
    ("Short conversations", "Trò chuyện ngắn"),
    ("I can take part in a short conversation with a patient partner — greet, introduce myself at work, answer simple interview questions — and ask for a repeat when I need one (Can you repeat that?).",
     "Tôi có thể tham gia cuộc trò chuyện ngắn với người đối thoại kiên nhẫn — chào hỏi, giới thiệu mình ở chỗ làm, trả lời câu hỏi phỏng vấn đơn giản — và nhờ nhắc lại khi cần (Can you repeat that?)."),
    "Assessed by multi-turn deterministic scenarios where the recognised meaning decides the partner's next turn. Asking for a repeat is tracked and never penalised; a technical speech failure is insufficient evidence, never a failure.")
obj("interaction.practical_needs", "interaction", True, ["speaking.give_info", "listening.short_info", "numbers.0_100"], [("A1", "direct", "obtaining-goods-services"), ("A1", "direct", "information-exchange")],
    ("Practical tasks", "Việc thực tế"),
    ("I can handle very simple tasks — buy something, ask the way, see a doctor, make an appointment by phone, follow an instruction at work — and understand the short answer.",
     "Tôi có thể xử lý việc rất đơn giản — mua hàng, hỏi đường, đi khám, đặt hẹn qua điện thoại, làm theo chỉ dẫn ở chỗ làm — và hiểu câu trả lời ngắn."),
    "Assessed by multi-turn scenario items at a shop, on the street, at a clinic, on the phone and at work. Passing needs the goal met and first-attempt intent matches on scored turns; a repair keeps the conversation alive and is recorded.")

for r in OUT:
    if not r["canDo"]["vi"].startswith("Tôi có thể") or len(r["canDo"]["vi"]) > 220:
        raise SystemExit(f"can-do rule: {r['id']} ({len(r['canDo']['vi'])} chars)")

os.makedirs(f"{ROOT}/content/en/_drafts/objectives", exist_ok=True)
with open(f"{ROOT}/content/en/_drafts/objectives/OUTPUT.jsonl", "w", encoding="utf-8", newline="\n") as f:
    for r in OUT:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")


def write_staged(rel, text):
    path = f"{STAGED}/{rel}"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def write_json(rel, doc):
    write_staged(rel, json.dumps(doc, ensure_ascii=False, indent=2) + "\n")


write_json("content/en/assessment/claim-policy.json", {
    "version": 2,
    "evaluatedLevels": ["PRE_A1", "A1", "A2"],
    "requiredDomains": ["spoken_reception", "written_reception", "spoken_production", "written_production", "interaction"],
    "minAssessedObjectivesPerDomain": 1,
    "minItemsPerDirectObjective": 3,
    "minDistinctInputsPerDirectObjective": 2,
    "minTaskFamiliesPerDomain": 2,
    "minDistinctScalesPerDomain": 2,
    "claimWording": "CEFR-aligned estimate — not an official CEFR examination or certification.",
})

DOMAIN_WHY = {
    "spoken_reception": "Facts in a recording, announcements and dialogues: the three A1 listening activities the Section 3 checkpoint scores. Word recognition is direct at Pre-A1 only and is not listed here.",
    "written_reception": "Messages, notices and short texts: the three A1 reading activities the Section 3 checkpoint scores. Word recognition is direct at Pre-A1 only and is not listed here.",
    "spoken_production": "Formulas, self-introduction and simple facts: what a Vietnamese adult needs first at work and in daily life, all checked from recognised words.",
    "written_production": "Personal facts, sentences and a short message or email: the three guided writing activities the Section 5 checkpoint scores.",
    "interaction": "Conversation and practical tasks together: an A1 estimate needs both talking with someone and getting something done.",
}
EXCLUDED = {
    "en.obj.speaking.describe": "Short separate phrases only. It is practised and reported on its own; the estimate does not depend on it.",
    "en.obj.writing.form_filling": "Discrete labelled fields. It is practised and reported on its own, and proves less than guided sentences do, so the estimate does not depend on it.",
}
domains = []
for domain, why in DOMAIN_WHY.items():
    direct = [o for o in OUT if o["category"] == domain and any(a["relation"] == "direct" and a["level"] == "A1" for a in o["cefrAlignments"])]
    domains.append({
        "domain": domain,
        "requiredObjectiveIds": [o["id"] for o in direct if o["essential"]],
        "excludedObjectiveIds": [{"objectiveId": o["id"], "reason": EXCLUDED[o["id"]]} for o in direct if not o["essential"]],
        "rationale": why,
    })
write_json("content/en/assessment/attainment.json", {
    "version": 1,
    "language": "en",
    "level": "A1",
    "principle": "A learner's CEFR-aligned A1 estimate counts a communicative domain as demonstrated only when EVERY objective listed for that domain below carries a real 'demonstrated' checkpoint verdict under the latest-attempt policy. The list is the authored denominator: it names every essential objective that is aligned directly to an A1 descriptor scale in the domain. Non-essential direct objectives are listed under excludedObjectiveIds with the pedagogical reason; nothing is omitted silently. The A1 Capstone samples one representative objective per domain and therefore can contribute evidence but can never complete a domain on its own.",
    "domains": domains,
})

register = "\n".join(f"| `cefr-cv-2020:{k}` | {v} |" for k, v in SCALE.items())
write_staged("content/en/assessment/RESEARCH.md", f"""# en-vi assessment research base (clean-room)

Authored for this project (P4f, 2026-10-31). It is the provenance register for the
`sourceRef` keys used in `objectives.json` and records how the English objectives
were derived. **No CEFR descriptor text is reproduced anywhere in this repository.**
The structure follows the RESEARCH.md of the French, Spanish, German and Italian
courses; what they say about the framework model, the claim gate and parallel forms
applies unchanged and is not repeated here.

## Primary sources

- **Council of Europe, CEFR Companion Volume (2020)**: *Common European Framework of
  Reference for Languages: Learning, teaching, assessment. Companion Volume*, Council
  of Europe Publishing, Strasbourg, 2020.
  https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4
- **Council of Europe, CEFR descriptors page**:
  https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors

Nothing here quotes official descriptor wording, so no verbatim accuracy is claimed
or needed.

## How the English objectives were derived

The objectives keep the construct families and CEFR scale alignments of the other
courses (`plan/authoring/BLUEPRINT.md` §8), because the scales describe communicative
activities and competences independently of the language. Every `title`, `canDo` and
`evidenceNote` was written for English and for Vietnamese learners
(`plan/authoring/briefs/en-vi.md`), with a stronger pull toward work: scenarios and
instructions at a factory or an office replace some travel settings. The grammar
family differs most, because the transfer problems differ:

| Objective | Why it exists |
|---|---|
| `en.obj.articles.a_an_the` | Vietnamese has no articles (brief §3.2) |
| `en.obj.nouns.plurals_countability` | plural marking and uncountable nouns (brief §3.3) |
| `en.obj.verbs.be_there_is` | be is not simply "là"; "có" splits into have and there is (brief §3.1, §3.8) |
| `en.obj.verbs.present_simple_do` | third-person -s and do-support (brief §3.4) |
| `en.obj.syntax.questions_word_order` | question words move to the front (brief §3.12) |
| `en.obj.verbs.present_continuous` | be + -ing against "đang" (brief §3.5) |
| `en.obj.verbs.past_recognition` | the verb changes where Vietnamese adds "đã"; kept at A2 *supports* (brief §3.6) |
| `en.obj.verbs.future_can_would` | going to, will, can, would like; kept at A2 *supports* (brief §3.7, §3.10) |
| `en.obj.pronouns.possessives` | I / me / my / mine against one word "tôi" (brief §3.9) |
| `en.obj.prepositions.time_place` | in, on, at (brief §3.11) |
| `en.obj.adjectives.order_very` | adjective before noun, "I very like" (brief §2, §3.13) |
| `en.obj.pronunciation.final_sounds` | final consonants, th, -s/-ed, stress (brief §2, §3.15-16) |
| `en.obj.strategy.loanwords_false_friends` | words Vietnamese already uses, and phonetic false friends (brief §2) |

The speaking objectives cue meaning in **Vietnamese**; the English target is never
shown before the attempt.

## sourceRef register

Every `cefrAlignments[].sourceRef` in `objectives.json` uses a key below. Keys name
the CEFR scale consulted; they are references, not quotations.

| key | CEFR scale (Companion Volume 2020) |
|---|---|
{register}

## Descriptor paraphrase policy

- Learner-facing `canDo` text is original wording written for this course's actual
  content, in Vietnamese, with an English version for the build tools. It never copies
  Companion Volume descriptor sentences.
- Alignments record only level, scale name, relation and `sourceRef`.

## direct vs supports

Same rule as the other courses: `direct` only where the course genuinely assesses the
communicative ability at that level within its stated scope (evidence notes say what
is NOT assessed); everything else is `supports`. Doubt resolves to `supports`. The
interaction and speaking objectives rely on the same deterministic scenario and
recognised-word graders as French.

## Word lists

CEFR-J and the New General Service List are anchors for word choice only
(`content/en/lexicon/derived/anchors.json`, `content/en/lexicon/REVIEW.md`). A list
level is never an input to a level claim, and vocabulary counts never are.

## Exam track

The one exam track practises the MOET bậc 2 adult format (QĐ 1481/QĐ-BGDĐT), marked
`formatFidelity: "partial"`. It is a further goal beyond this A1 course. Sources:
`content/en/exam/FORMAT-SOURCES.md`; decision: `plan/authoring/en-plan.md`.

## Assessment limitations

As for the other courses: synthesized bundled audio only, recognised words only for
speech (never a pronunciation-quality score), rubric slots for writing, deterministic
scenarios for interaction. The A1 estimate is a CEFR-aligned estimate, not an official
examination or certification.
""")
print(len(OUT), "objectives,", sum(o["essential"] for o in OUT), "essential")
