"""Objectives of ja-vi: content/ja/_drafts/objectives/OUTPUT.jsonl, plus the policy files and RESEARCH.md, which the
toolkit does not generate for a new course: written straight into the staged layer (content/ja/_drafts/staged/...).
Same construct families and CEFR scale alignments as the other courses; every line is written for Japanese and for
Vietnamese learners who work or will work in Japan. No descriptor text. The JF Standard references (by category name
only) go to content/ja/_drafts/objectives/jf-standard.json. usage: python -I ja-objectives.py <repo root>"""
import json, os, sys

ROOT = sys.argv[1]
STAGED = f"{ROOT}/content/ja/_drafts/staged"
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
# JF Standard for Japanese-Language Education (The Japan Foundation, 2010): activity category per objective, by name only.
JF = {
    "listen": ("受容 — 聞く", "reception: listening"), "read": ("受容 — 読む", "reception: reading"),
    "speak": ("産出 — 話す", "production: speaking"), "write": ("産出 — 書く", "production: writing"),
    "talk": ("やりとり — 口頭", "interaction: spoken"), "written": ("やりとり — 書く", "interaction: written"),
    "competence": ("言語能力", "communicative language competence"), "strategy": ("方略", "strategies"),
}
OUT = []
JF_ROWS = []


def obj(oid, category, essential, pre, aligns, jf, title, can, note=None):
    rec = {
        "id": f"ja.obj.{oid}",
        "title": {"en": title[0], "vi": title[1]},
        "canDo": {"en": can[0], "vi": can[1]},
        "category": category,
        "prerequisites": [f"ja.obj.{p}" for p in pre],
        "cefrAlignments": [{"level": lvl, "scaleName": SCALE[s], "relation": rel, "sourceRef": f"cefr-cv-2020:{s}"} for lvl, rel, s in aligns],
        "essential": essential,
    }
    if note:
        rec["evidenceNote"] = note
    OUT.append(rec)
    JF_ROWS.append({"objectiveId": rec["id"], "jfLevel": "A1", "jfCategory": {"ja": JF[jf][0], "en": JF[jf][1]}})


# ---------------------------------------------------------------- lexical
obj("greetings.basic", "lexical", True, [], [("PRE_A1", "supports", "conversation"), ("A1", "supports", "sociolinguistic-appropriateness")], "competence",
    ("Greetings and set phrases", "Lời chào và câu nói cố định"),
    ("I can recognize and type the everyday greetings and set phrases — おはようございます, すみません, お願いします, 失礼します, お疲れさまです — and pick the one that fits the moment and the person.",
     "Tôi có thể nhận ra và gõ các lời chào, câu nói cố định hằng ngày — おはようございます, すみません, お願いします, 失礼します, お疲れさまです — và chọn câu hợp lúc, hợp người."),
    "Written recognition and typing only. Saying these phrases aloud is assessed by ja.obj.speaking.formulaic.")
obj("vocab.everyday_basics", "lexical", True, [], [("PRE_A1", "supports", "vocabulary-range"), ("A1", "supports", "vocabulary-range")], "competence",
    ("Common everyday words", "Từ thông dụng hằng ngày"),
    ("I can understand and name the course's everyday words — people, family, food and drink, the home, familiar objects — when I read them.",
     "Tôi có thể hiểu và gọi tên những từ hằng ngày của khoá học — người, gia đình, đồ ăn thức uống, nhà ở, đồ vật quen thuộc — khi đọc thấy chúng."))
obj("vocab.work_japan", "lexical", False, [], [("A1", "supports", "vocabulary-range")], "competence",
    ("Words for work and life in Japan", "Từ về công việc và cuộc sống ở Nhật"),
    ("I can understand the words I need first at work and in town — 工場, 安全, 危ない, 休み, 給料, 市役所, 在留カード — when I read or hear them.",
     "Tôi có thể hiểu những từ cần trước tiên ở chỗ làm và ngoài phố — 工場, 安全, 危ない, 休み, 給料, 市役所, 在留カード — khi đọc hay nghe thấy."))
obj("vocab.time_calendar", "lexical", False, [], [("A1", "supports", "vocabulary-range")], "competence",
    ("Time, days and dates", "Giờ, thứ và ngày tháng"),
    ("I can use the words for time and the calendar — 今日, 明日, 毎日, the days of the week, the months and dates such as 三日 and 二十日.",
     "Tôi có thể dùng các từ chỉ thời gian và lịch — 今日, 明日, 毎日, các thứ trong tuần, các tháng và ngày như 三日, 二十日."))
obj("numbers.counters", "lexical", True, [], [("A1", "supports", "vocabulary-range")], "competence",
    ("Numbers, prices and counters", "Số đếm, giá tiền và lượng từ"),
    ("I can read and type numbers up to 10,000, prices in yen, and the counters used most — つ, 人, 枚, 個, 回, 階 — and ask いくつ and いくら.",
     "Tôi có thể đọc và gõ số đến 10.000, giá tiền bằng yên và các lượng từ hay dùng nhất — つ, 人, 枚, 個, 回, 階 — và hỏi いくつ, いくら."),
    "Numbers are read and typed here; spoken numbers are assessed by the listening and speaking objectives.")

# ---------------------------------------------------------------- script and written form
obj("script.kana", "written_reception", True, [], [("PRE_A1", "supports", "overall-reading-comprehension"), ("A1", "supports", "orthographic-control")], "competence",
    ("Reading hiragana and katakana", "Đọc hiragana và katakana"),
    ("I can read every hiragana and katakana, with dakuten, small ゃゅょ and っ, and the long mark ー, and tell apart pairs such as シ and ツ.",
     "Tôi có thể đọc toàn bộ hiragana và katakana, cả dấu dakuten, chữ nhỏ ゃゅょ, っ và dấu trường âm ー, và phân biệt các cặp như シ với ツ."),
    "Assessed by the kana primer checkpoint, which also ends the romaji support. Reading words and sentences belongs to the reading objectives.")
obj("script.kanji_hanviet", "written_reception", False, ["script.kana"], [("A1", "supports", "vocabulary-range"), ("A1", "supports", "orthographic-control")], "strategy",
    ("About 100 kanji, helped by Hán-Việt", "Khoảng 100 chữ kanji, nhờ âm Hán-Việt"),
    ("I can recognize about 100 basic kanji in familiar words — 日, 人, 会社, 電車, 安全 — and use the Hán-Việt reading to remember their meaning.",
     "Tôi có thể nhận ra khoảng 100 chữ kanji cơ bản trong từ quen thuộc — 日, 人, 会社, 電車, 安全 — và dùng âm Hán-Việt để nhớ nghĩa."),
    "Recognition with furigana available. Writing kanji by hand is not taught or assessed.")
obj("reading.familiar_words", "written_reception", True, ["script.kana"], [("PRE_A1", "direct", "overall-reading-comprehension"), ("A1", "supports", "overall-reading-comprehension")], "read",
    ("Reading familiar words and phrases", "Đọc từ và cụm từ quen thuộc"),
    ("I can recognize familiar words and very short learned phrases on the page, in kana or with furigana, and match them to their meaning.",
     "Tôi có thể nhận ra từ quen thuộc và cụm từ rất ngắn đã học khi thấy chúng viết bằng kana hoặc có furigana, và nối chúng với nghĩa."),
    "Direct at Pre-A1 only: written recognition of familiar words and learned phrases. Reading short simple texts at A1 belongs to the reading objectives below.")
obj("writing.kana_input", "written_production", True, ["script.kana"], [("A1", "supports", "orthographic-control")], "competence",
    ("Typing Japanese in kana", "Gõ tiếng Nhật bằng kana"),
    ("I can type familiar words in kana on a phone keyboard, with long vowels, っ and ん in the right place — おばあさん, きって, きんえん.",
     "Tôi có thể gõ từ quen thuộc bằng kana trên bàn phím điện thoại, đặt đúng trường âm, っ và ん — おばあさん, きって, きんえん."),
    "Evidence is single words and short learned forms. A kana answer for a kanji key is accepted but is practice, not production evidence (P4b evidence guard).")

# ---------------------------------------------------------------- grammar
obj("sentences.noun_desu", "grammar", True, [], [("A1", "supports", "grammatical-accuracy")], "competence",
    ("Noun sentences with です", "Câu danh từ với です"),
    ("I can say what or who something is with AはBです, its negative じゃありません and its past でした — わたしはベトナム人です.",
     "Tôi có thể nói ai, cái gì là gì bằng AはBです, phủ định じゃありません và quá khứ でした — わたしはベトナム人です."))
obj("particles.core", "grammar", True, ["sentences.noun_desu"], [("A1", "supports", "grammatical-accuracy")], "competence",
    ("The core particles", "Các trợ từ cơ bản"),
    ("I can use the particles は, が, を, に, で, へ, の, と, も in learned patterns — 工場で働きます, 七時に起きます — where Vietnamese shows the role by word order.",
     "Tôi có thể dùng các trợ từ は, が, を, に, で, へ, の, と, も theo mẫu đã học — 工場で働きます, 七時に起きます — ở chỗ tiếng Việt chỉ dựa vào trật tự từ."),
    "は and が are taught as set patterns at A1, not as a full contrast.")
obj("verbs.masu_forms", "grammar", True, ["particles.core"], [("A1", "supports", "grammatical-accuracy")], "competence",
    ("Verbs in the ます form", "Động từ thể ます"),
    ("I can use verbs of the three groups in the polite forms ます, ません, ました, ませんでした, with the verb at the end of the sentence.",
     "Tôi có thể dùng động từ của cả ba nhóm ở các dạng lịch sự ます, ません, ました, ませんでした, với động từ đứng cuối câu."))
obj("verbs.te_form", "grammar", True, ["verbs.masu_forms"], [("A1", "supports", "grammatical-accuracy")], "competence",
    ("The て form: requests and rules", "Thể て: nhờ, yêu cầu và nội quy"),
    ("I can understand and use the て form in requests and rules — 待ってください, 触らないでください, 入ってもいいですか — and say what I am doing now with ています.",
     "Tôi có thể hiểu và dùng thể て khi nhờ, yêu cầu và nói nội quy — 待ってください, 触らないでください, 入ってもいいですか — và nói việc đang làm bằng ています."),
    "Taught as learned patterns with common verbs; the full て-form rules are practice, and the plain form is recognition only.")
obj("adjectives.i_na", "grammar", False, ["sentences.noun_desu"], [("A1", "supports", "grammatical-accuracy")], "competence",
    ("い and な adjectives", "Tính từ い và な"),
    ("I can use い and な adjectives before a noun and at the end of a sentence, in the present, the negative and the past — 高いです, 高くないです, 静かな町.",
     "Tôi có thể dùng tính từ い và な trước danh từ và cuối câu, ở hiện tại, phủ định và quá khứ — 高いです, 高くないです, 静かな町."))
obj("existence.aru_iru", "grammar", True, ["particles.core"], [("A1", "supports", "grammatical-accuracy")], "competence",
    ("あります and います", "あります và います"),
    ("I can say where something or someone is with あります for things and います for people and animals, where Vietnamese uses one word, có.",
     "Tôi có thể nói ở đâu có gì, có ai bằng あります cho đồ vật và います cho người, con vật, ở chỗ tiếng Việt chỉ dùng một từ “có”."))
obj("questions.question_words", "grammar", False, ["sentences.noun_desu"], [("A1", "supports", "grammatical-accuracy")], "competence",
    ("Questions with か", "Câu hỏi với か"),
    ("I can ask questions by adding か, with 何, どこ, いつ, だれ, いくら and どうして in the place of the answer — 駅はどこですか.",
     "Tôi có thể đặt câu hỏi bằng cách thêm か, đặt 何, どこ, いつ, だれ, いくら, どうして vào chỗ của câu trả lời — 駅はどこですか."))
obj("wants.tai_suki", "grammar", False, ["verbs.masu_forms"], [("A2", "supports", "grammatical-accuracy")], "competence",
    ("Wanting and liking", "Muốn và thích"),
    ("I can say what I want to do with たいです, what I want with が欲しいです, and what I like with が好きです.",
     "Tôi có thể nói việc mình muốn làm bằng たいです, thứ mình muốn có bằng が欲しいです và điều mình thích bằng が好きです."),
    "Learned patterns with common verbs and nouns; kept at A2 supports.")
obj("politeness.levels", "grammar", False, ["verbs.masu_forms"], [("A1", "supports", "sociolinguistic-appropriateness")], "competence",
    ("Polite and plain speech", "Lời lịch sự và lời thường"),
    ("I can speak in the polite です/ます style at work and with strangers, recognize the plain style between friends, and use 〜さん after a name, never after my own.",
     "Tôi có thể nói kiểu lịch sự です/ます ở chỗ làm và với người lạ, nhận ra kiểu nói thường giữa bạn bè, và dùng 〜さん sau tên người khác, không bao giờ sau tên mình."),
    "The plain style is recognition only. Honorific and humble verbs are not taught beyond set phrases.")

# ---------------------------------------------------------------- phonology and strategy
obj("pronunciation.length_pitch", "phonology", False, ["script.kana"], [("A1", "supports", "phonological-control")], "competence",
    ("Long vowels, double consonants, pitch", "Trường âm, âm ngắt, cao độ"),
    ("I can hear the difference in pairs such as おばさん / おばあさん, きて / きって and はし / はし, and I know that Japanese pitch is not a Vietnamese tone.",
     "Tôi có thể nghe phân biệt những cặp như おばさん / おばあさん, きて / きって, はし / はし, và biết cao độ tiếng Nhật không phải thanh điệu tiếng Việt."),
    "Contrast recognition only. The learner's own pronunciation is not assessed.")
obj("strategy.hanviet_loanwords", "strategy", False, [], [("A1", "supports", "identifying-cues-inferring")], "strategy",
    ("Hán-Việt, loanwords and false friends", "Hán-Việt, từ mượn và “bạn giả”"),
    ("I can guess new words through their Sino-Vietnamese reading and through English loanwords — 電話, コーヒー — and avoid false friends such as 工場, which is a factory, not a building site.",
     "Tôi có thể đoán nghĩa từ mới nhờ âm Hán-Việt và từ mượn tiếng Anh — 電話 điện thoại, コーヒー — và tránh “bạn giả” như 工場 là nhà máy, không phải công trường."))

# ---------------------------------------------------------------- spoken reception
obj("listening.familiar_words", "spoken_reception", True, ["vocab.everyday_basics"], [("PRE_A1", "direct", "overall-listening-comprehension"), ("A1", "supports", "overall-listening-comprehension")], "listen",
    ("Hearing familiar words and phrases", "Nghe từ và cụm từ quen thuộc"),
    ("I can pick out familiar words and short learned phrases when they are said clearly and slowly.",
     "Tôi có thể nhận ra từ quen thuộc và cụm từ ngắn đã học khi nghe chúng được nói rõ và chậm."),
    "Direct at Pre-A1 only: bundled, clear, synthesized clips of single words and short phrases, scored in the Section 3 checkpoint. Natural conversational speech and regional accents are not assessed.")
obj("listening.short_info", "spoken_reception", True, ["listening.familiar_words", "numbers.counters"], [("A1", "direct", "audio-media-recordings"), ("PRE_A1", "supports", "overall-listening-comprehension")], "listen",
    ("Hearing facts in a short recording", "Nghe thông tin trong đoạn ghi âm ngắn"),
    ("I can catch concrete facts — a time, a price, a date, a place — in a short, clear, slow recording about daily life or work.",
     "Tôi có thể nghe ra thông tin cụ thể như giờ, giá, ngày, địa điểm trong một đoạn ghi âm ngắn, rõ và chậm về cuộc sống hằng ngày hay công việc."),
    "Direct at A1 within the bundled audio: short synthesized recordings holding 1-3 facts, scored in the Section 3 checkpoint. Authentic-speed media are not assessed.")
obj("listening.announcements", "spoken_reception", True, ["listening.familiar_words"], [("A1", "direct", "announcements-instructions")], "listen",
    ("Announcements and safety instructions", "Thông báo và chỉ dẫn an toàn"),
    ("I can understand very short announcements and instructions spoken clearly and slowly — on a platform, in a shop, and the safety rules of a factory.",
     "Tôi có thể hiểu thông báo và chỉ dẫn rất ngắn nói rõ và chậm — ở sân ga, trong cửa hàng, và nội quy an toàn ở nhà máy."),
    "Direct at A1 within the bundled audio: synthesized station, shop and workplace announcements and simple instructions, scored in the Section 3 checkpoint.")
obj("listening.short_dialogues", "spoken_reception", True, ["listening.familiar_words", "greetings.basic"], [("A1", "direct", "understanding-conversation")], "listen",
    ("Understanding short dialogues", "Nghe hiểu hội thoại ngắn"),
    ("I can follow the main point when two people say a few clear sentences to each other about daily life or work.",
     "Tôi có thể hiểu ý chính khi hai người nói rõ ràng với nhau vài câu về chuyện hằng ngày hoặc công việc."),
    "Direct at A1 within the bundled audio: two-voice synthesized exchanges of 2-4 turns (cast A and B are different speakers), scored in the Section 3 checkpoint. The learner only listens: interaction is assessed by the interaction objectives.")

# ---------------------------------------------------------------- written reception
obj("reading.short_messages", "written_reception", True, ["reading.familiar_words"], [("A1", "direct", "reading-correspondence")], "read",
    ("Reading short messages", "Đọc tin nhắn ngắn"),
    ("I can understand short, simple messages from a co-worker or a boss about shifts, times and everyday tasks.",
     "Tôi có thể hiểu tin nhắn ngắn, đơn giản của đồng nghiệp hay cấp trên về ca làm, giờ giấc và việc cần làm hằng ngày."),
    "Direct at A1: original short messages in kana with furigana on kanji, read and answered in the Section 3 checkpoint.")
obj("reading.notices_info", "written_reception", True, ["reading.familiar_words"], [("A1", "direct", "reading-orientation")], "read",
    ("Signs, notices and timetables", "Biển báo, thông báo và lịch"),
    ("I can find the facts I need on signs and simple notices — 禁止, 危険, 出口, opening hours, a garbage calendar, a shift table.",
     "Tôi có thể tìm thông tin cần thiết trên biển báo và thông báo đơn giản — 禁止, 危険, 出口, giờ mở cửa, lịch đổ rác, bảng ca làm."),
    "Direct at A1: original notices and schedules with locate-type questions, scored in the Section 3 checkpoint.")
obj("reading.short_texts", "written_reception", True, ["reading.familiar_words", "verbs.masu_forms"], [("A1", "direct", "overall-reading-comprehension"), ("A2", "supports", "overall-reading-comprehension")], "read",
    ("Reading very short texts", "Đọc đoạn văn rất ngắn"),
    ("I can read a very short text about familiar people and routines, slowly and more than once if I need to.",
     "Tôi có thể đọc hiểu đoạn văn rất ngắn về người và sinh hoạt quen thuộc, đọc chậm và đọc lại khi cần."),
    "Direct at A1: original 2-5 sentence descriptions and small stories with furigana, scored in the Section 3 checkpoint. Longer texts and unfamiliar topics are not assessed.")

# ---------------------------------------------------------------- spoken production
obj("speaking.formulaic", "spoken_production", True, ["greetings.basic"], [("PRE_A1", "supports", "overall-oral-production"), ("A1", "direct", "overall-oral-production"), ("A1", "supports", "sociolinguistic-appropriateness")], "speak",
    ("Saying set phrases aloud", "Nói các câu cố định thành tiếng"),
    ("I can say the everyday greetings, thanks, apologies and requests aloud — おはようございます, すみません, お先に失礼します — and choose the one that fits the moment.",
     "Tôi có thể nói thành tiếng lời chào, cảm ơn, xin lỗi và nhờ vả hằng ngày — おはようございます, すみません, お先に失礼します — và chọn câu hợp lúc."),
    "Assessed from what an on-device ja-JP speech recogniser heard: word recognition only, never a pronunciation-quality score. Kana and kanji transcripts count as equal.")
obj("speaking.self_intro", "spoken_production", True, ["sentences.noun_desu", "verbs.masu_forms"], [("A1", "direct", "sustained-monologue-describing"), ("A1", "supports", "overall-oral-production")], "speak",
    ("Introducing yourself (自己紹介)", "Tự giới thiệu (自己紹介)"),
    ("I can introduce myself aloud in short sentences, as at an interview or on the first day at work — name, country, age, job, はじめまして and よろしくおねがいします.",
     "Tôi có thể tự giới thiệu thành tiếng bằng câu ngắn, như khi phỏng vấn hay ngày đầu đi làm — tên, nước, tuổi, việc làm, はじめまして và よろしくおねがいします."),
    "Assessed from recognized words in elicited sentences. The meaning cue is in Vietnamese; the Japanese is never shown before the attempt.")
obj("speaking.give_info", "spoken_production", True, ["numbers.counters"], [("A1", "direct", "sustained-monologue-giving-information"), ("A1", "supports", "overall-oral-production")], "speak",
    ("Giving simple facts aloud", "Nói thông tin đơn giản"),
    ("I can give simple facts aloud with numbers and common words — a phone number, a price, a time, a date, how many.",
     "Tôi có thể nói thông tin đơn giản bằng con số và từ thông dụng — số điện thoại, giá, giờ, ngày, số lượng."),
    "Recognised digits, kanji numerals and kana numbers count as the same information; a wrong number is a wrong answer, and silence is never scored.")
obj("speaking.describe", "spoken_production", False, ["vocab.everyday_basics", "adjectives.i_na"], [("A1", "direct", "overall-oral-production"), ("A1", "supports", "sustained-monologue-describing")], "speak",
    ("Describing aloud", "Mô tả thành tiếng"),
    ("I can describe familiar people, places and objects aloud in short phrases: what it is and one simple feature.",
     "Tôi có thể tả người, nơi chốn và đồ vật quen thuộc bằng cụm từ ngắn: đó là gì và một đặc điểm đơn giản của nó."),
    "Short separate phrases only: connected description is beyond this course's A1 claim.")

# ---------------------------------------------------------------- written production
obj("writing.personal_info", "written_production", True, ["writing.kana_input", "sentences.noun_desu"], [("A1", "direct", "overall-written-production"), ("A1", "direct", "overall-written-interaction"), ("A1", "supports", "orthographic-control")], "write",
    ("Writing about yourself", "Viết về bản thân"),
    ("I can write short sentences about myself in kana with the kanji I know — name, age, country, where I live, my job.",
     "Tôi có thể viết những câu ngắn về bản thân bằng kana và những chữ kanji đã biết — tên, tuổi, nước, nơi ở và công việc."),
    "Assessed by guided rubric-scored writing with required information slots; open free writing is never scored evidence. A slot met only through kana for a kanji key is practice, not production evidence.")
obj("writing.phrases_sentences", "written_production", True, ["writing.personal_info", "verbs.masu_forms"], [("A1", "direct", "overall-written-production"), ("A1", "supports", "grammatical-accuracy")], "write",
    ("Writing simple sentences", "Viết câu đơn giản"),
    ("I can write short sentences about familiar people and things — who does what, where, when — and join them with そして, でも, それから.",
     "Tôi có thể viết câu ngắn về người và việc quen thuộc — ai làm gì, ở đâu, khi nào — và nối câu bằng そして, でも, それから."),
    "Assessed by guided tasks whose rubric requires a verb from an authored list plus the task's information slots.")
obj("writing.short_message", "written_production", True, ["writing.personal_info", "vocab.time_calendar"], [("A1", "direct", "correspondence"), ("A1", "direct", "overall-written-interaction")], "written",
    ("Writing a short message", "Viết tin nhắn ngắn"),
    ("I can write a very short message to a boss or a co-worker: a greeting, one or two facts such as a time or a reason, and a polite closing.",
     "Tôi có thể viết tin nhắn rất ngắn cho cấp trên hay đồng nghiệp: lời chào, một hai thông tin như giờ hay lý do, và lời kết lịch sự."),
    "Assessed by guided tasks; the rubric requires the message's parts (greeting, fact, closing) and never judges style.")
obj("writing.form_filling", "written_production", False, ["writing.kana_input", "numbers.counters"], [("A1", "direct", "notes-messages-forms")], "written",
    ("Filling in a form", "Điền biểu mẫu"),
    ("I can fill in a simple form at a city office, a clinic or a shop — 名前, 住所, 電話番号, 生年月日 — in kana, katakana and numbers.",
     "Tôi có thể điền biểu mẫu đơn giản ở toà thị chính, phòng khám hay cửa hàng — 名前, 住所, 電話番号, 生年月日 — bằng kana, katakana và chữ số."),
    "Assessed by separate labelled fields checked against the cue facts; an empty form is insufficient evidence, never a failure.")

# ---------------------------------------------------------------- interaction
obj("interaction.everyday_conversation", "interaction", True, ["speaking.formulaic", "speaking.self_intro", "listening.short_dialogues"], [("A1", "direct", "overall-oral-interaction"), ("A1", "direct", "conversation")], "talk",
    ("Short conversations", "Trò chuyện ngắn"),
    ("I can take part in a short conversation with a patient partner — greet, introduce myself at work, answer simple interview questions — and ask for a repeat (もう一度お願いします).",
     "Tôi có thể tham gia cuộc trò chuyện ngắn với người kiên nhẫn — chào hỏi, giới thiệu mình ở chỗ làm, trả lời câu hỏi phỏng vấn đơn giản — và nhờ nhắc lại (もう一度お願いします)."),
    "Assessed by multi-turn deterministic scenarios where the recognized meaning decides the partner's next turn. Asking for a repeat is tracked and never penalized; a technical speech failure is insufficient evidence, never a failure.")
obj("interaction.practical_needs", "interaction", True, ["speaking.give_info", "listening.short_info", "numbers.counters"], [("A1", "direct", "obtaining-goods-services"), ("A1", "direct", "information-exchange")], "talk",
    ("Practical tasks in Japan", "Việc thực tế ở Nhật"),
    ("I can handle very simple tasks — pay at a konbini, ask the way, see a doctor, ask at the city office, phone my workplace to say I am ill — and understand the short answer.",
     "Tôi có thể xử lý việc rất đơn giản — trả tiền ở cửa hàng tiện lợi, hỏi đường, đi khám, hỏi ở toà thị chính, gọi điện báo chỗ làm là mình ốm — và hiểu câu trả lời ngắn."),
    "Assessed by multi-turn scenario items at a konbini, on the street, at a clinic, at the city office, on the phone and at work. Passing needs the goal met and first-attempt intent matches on scored turns; a repair keeps the conversation alive and is recorded.")

for r in OUT:
    if not r["canDo"]["vi"].startswith("Tôi có thể") or len(r["canDo"]["vi"]) > 220:
        raise SystemExit(f"can-do rule: {r['id']} ({len(r['canDo']['vi'])} chars)")

os.makedirs(f"{ROOT}/content/ja/_drafts/objectives", exist_ok=True)
with open(f"{ROOT}/content/ja/_drafts/objectives/OUTPUT.jsonl", "w", encoding="utf-8", newline="\n") as f:
    for r in OUT:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
with open(f"{ROOT}/content/ja/_drafts/objectives/jf-standard.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump({
        "generator": "content/ja/_drafts/_generators/ja-objectives.py",
        "source": "JF Standard for Japanese-Language Education 2010 (The Japan Foundation), https://jfstandard.jp/ — cited by level and activity category only; no Can-do text is reproduced.",
        "checkedAgainstOfficialSource": False,
        "note": "The JF Standard uses the CEFR levels; each objective is filed under the JF activity category it practises. The category names are to be checked against the official JF Standard tree before release (owner/coordinator).",
        "objectives": JF_ROWS,
    }, f, ensure_ascii=False, indent=2)
    f.write("\n")


def write_staged(rel, text):
    path = f"{STAGED}/{rel}"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def write_json(rel, doc):
    write_staged(rel, json.dumps(doc, ensure_ascii=False, indent=2) + "\n")


write_json("content/ja/assessment/claim-policy.json", {
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
    "spoken_reception": "Facts in a recording, announcements and safety instructions, and dialogues: the three A1 listening activities the Section 3 checkpoint scores. Word recognition is direct at Pre-A1 only and is not listed here.",
    "written_reception": "Messages, notices and short texts: the three A1 reading activities the Section 3 checkpoint scores. Kana and word recognition are direct at Pre-A1 only or supporting, and are not listed here.",
    "spoken_production": "Set phrases, self-introduction and simple facts: what a Vietnamese worker needs first in Japan, all checked from recognized words.",
    "written_production": "Personal facts, sentences and a short message: the three guided writing activities the Section 5 checkpoint scores.",
    "interaction": "Conversation and practical tasks together: an A1 estimate needs both talking with someone and getting something done.",
}
EXCLUDED = {
    "ja.obj.speaking.describe": "Short separate phrases only. It is practiced and reported on its own; the estimate does not depend on it.",
    "ja.obj.writing.form_filling": "Discrete labelled fields. It is practiced and reported on its own, and proves less than guided sentences do, so the estimate does not depend on it.",
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
write_json("content/ja/assessment/attainment.json", {
    "version": 1,
    "language": "ja",
    "level": "A1",
    "principle": "A learner's CEFR-aligned A1 estimate counts a communicative domain as demonstrated only when EVERY objective listed for that domain below carries a real 'demonstrated' checkpoint verdict under the latest-attempt policy. The list is the authored denominator: it names every essential objective that is aligned directly to an A1 descriptor scale in the domain. Non-essential direct objectives are listed under excludedObjectiveIds with the pedagogical reason; nothing is omitted silently. The A1 Capstone samples one representative objective per domain and therefore can contribute evidence but can never complete a domain on its own.",
    "domains": domains,
})

register = "\n".join(f"| `cefr-cv-2020:{k}` | {v} |" for k, v in SCALE.items())
write_staged("content/ja/assessment/RESEARCH.md", f"""# ja-vi assessment research base (clean-room)

Authored for this project (P4c, 2026-11-03). It is the provenance register for the
`sourceRef` keys used in `objectives.json` and records how the Japanese objectives
were derived. **No CEFR descriptor text and no JF Standard Can-do text is reproduced
anywhere in this repository.** The structure follows the RESEARCH.md of the French,
Spanish, German, Italian and English courses; what they say about the framework model,
the claim gate and parallel forms applies unchanged and is not repeated here.

## Primary sources

- **Council of Europe, CEFR Companion Volume (2020)**: *Common European Framework of
  Reference for Languages: Learning, teaching, assessment. Companion Volume*, Council
  of Europe Publishing, Strasbourg, 2020.
  https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4
- **The Japan Foundation, JF Standard for Japanese-Language Education 2010**:
  https://jfstandard.jp/ — the JF Standard uses the CEFR levels. Each objective is
  filed under a JF activity category by name in `content/ja/_drafts/objectives/jf-standard.json`
  (`checkedAgainstOfficialSource: false` until the tree is checked).
- **JLPT**: the Japan Foundation and JEES publish no official vocabulary, kanji or
  grammar lists; the N5/N4 word lists used to choose words are community lists
  (OpenJLPT 0.1.0, levels from Jonathan Waller's lists). JLPT N5 is not a CEFR level,
  and this course never says that it is.

## How the Japanese objectives were derived

The objectives keep the construct families and CEFR scale alignments of the other
courses (`plan/authoring/BLUEPRINT.md` §8). Every `title`, `canDo` and `evidenceNote`
was written for Japanese and for Vietnamese adults who work or will work in Japan
(`plan/authoring/briefs/ja-vi.md`): scenarios at a factory, a konbini, a city office,
a clinic and on the phone to an employer replace some travel settings. The script and
grammar families differ most, because the transfer problems differ:

| Objective | Why it exists |
|---|---|
| `ja.obj.script.kana` | three scripts; the kana primer before Section 1 (brief §2, §3.1) |
| `ja.obj.script.kanji_hanviet` | about 100 kanji, remembered through Hán-Việt (brief §2, §3.2) |
| `ja.obj.writing.kana_input` | typing kana with long vowels, っ and ん (brief §2) |
| `ja.obj.sentences.noun_desu` | AはBです (brief §3.3) |
| `ja.obj.particles.core` | particles mark roles that Vietnamese shows by word order (brief §3.4-3.5) |
| `ja.obj.verbs.masu_forms` | the verb changes for tense, negation and politeness; SOV order (brief §3.6, §3.16) |
| `ja.obj.verbs.te_form` | requests, rules and the progressive (brief §3.7) |
| `ja.obj.adjectives.i_na` | adjectives that conjugate (brief §3.8) |
| `ja.obj.existence.aru_iru` | one Vietnamese "có", two Japanese verbs (brief §3.9) |
| `ja.obj.numbers.counters` | counters, like Vietnamese classifiers but many more (brief §3.10-3.11) |
| `ja.obj.questions.question_words` | か and question words in place (brief §3.12) |
| `ja.obj.wants.tai_suki` | たい, 欲しい, 好き; kept at A2 *supports* (brief §3.13) |
| `ja.obj.politeness.levels` | です/ます against the plain style; さん (brief §3.14, §3.18) |
| `ja.obj.pronunciation.length_pitch` | long vowels, double consonants, pitch is not tone (brief §2, §3.15) |
| `ja.obj.strategy.hanviet_loanwords` | Hán-Việt and katakana loans, false friends (brief §2, §3.17) |

The speaking objectives cue meaning in **Vietnamese**; the Japanese target is never
shown before the attempt. Speech is recognised with the `ja-JP` recogniser; kana and
kanji transcripts count as the same words (P4b reading layer).

## sourceRef register

Every `cefrAlignments[].sourceRef` in `objectives.json` uses a key below. Keys name
the CEFR scale consulted; they are references, not quotations.

| key | CEFR scale (Companion Volume 2020) |
|---|---|
{register}

## Descriptor paraphrase policy

- Learner-facing `canDo` text is original wording written for this course's actual
  content, in Vietnamese, with an English version for the build tools. It never copies
  Companion Volume descriptor sentences or JF Standard Can-do statements.
- Alignments record only level, scale name, relation and `sourceRef`.

## direct vs supports

Same rule as the other courses: `direct` only where the course genuinely assesses the
communicative ability at that level within its stated scope (evidence notes say what
is NOT assessed); everything else is `supports`. Doubt resolves to `supports`.

## Word lists

OpenJLPT N5 and N4 are anchors for word choice only (`content/ja/lexicon/derived/jlpt-course.json`,
`content/ja/lexicon/REVIEW.md`). A list level is never an input to a level claim, and
vocabulary or kanji counts never are.

## Exam track

The JLPT N5 practice track (later session) reproduces the public format of the
sections — 文字・語彙, 文法・読解, 聴解 — with original items only, never past papers. Its
readiness message is "mức sẵn sàng ước tính", never a promise to pass.

## Assessment limitations

As for the other courses: synthesized bundled audio only, recognized words only for
speech (never a pronunciation-quality score), rubric slots for writing, deterministic
scenarios for interaction. Kana typed for a kanji key is accepted but is practice, not
production evidence. The A1 estimate is a CEFR-aligned estimate, not an official
examination or certification.
""")
print(len(OUT), "objectives,", sum(o["essential"] for o in OUT), "essential")
