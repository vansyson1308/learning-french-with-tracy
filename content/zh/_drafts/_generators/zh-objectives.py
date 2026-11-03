"""Objectives of zh-vi: content/zh/_drafts/objectives/OUTPUT.jsonl, plus the policy files and RESEARCH.md, which the
toolkit does not generate for a new course: written straight into the staged layer (content/zh/_drafts/staged/...).
Same construct families and CEFR scale alignments as the other courses; every line is written for Mandarin and for
Vietnamese learners who work or will work for a Chinese-speaking employer (in China, in Taiwan or at home). No
descriptor text. The HSK 3.0 references (level and skill, by name only) go to content/zh/_drafts/objectives/hsk-standard.json.
usage: python -I zh-objectives.py <repo root>"""
import json, os, sys

ROOT = sys.argv[1]
STAGED = f"{ROOT}/content/zh/_drafts/staged"
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
# HSK 3.0 (Chinese Proficiency Grading Standards for International Chinese Language Education, GF0025-2021): the band
# and the language skill each objective practises, by name only.
SKILL = {"listen": ("听", "listening"), "speak": ("说", "speaking"), "read": ("读", "reading"), "write": ("写", "writing"),
         "talk": ("说", "speaking (interaction)"), "written": ("写", "writing (interaction)"), "competence": ("语言要素", "language elements: sounds, characters, words, grammar"), "strategy": ("学习策略", "learning strategies")}
OUT = []
HSK_ROWS = []


def obj(oid, category, essential, pre, aligns, skill, hsk, title, can, note=None):
    rec = {
        "id": f"zh.obj.{oid}",
        "title": {"en": title[0], "vi": title[1]},
        "canDo": {"en": can[0], "vi": can[1]},
        "category": category,
        "prerequisites": [f"zh.obj.{p}" for p in pre],
        "cefrAlignments": [{"level": lvl, "scaleName": SCALE[s], "relation": rel, "sourceRef": f"cefr-cv-2020:{s}"} for lvl, rel, s in aligns],
        "essential": essential,
    }
    if note:
        rec["evidenceNote"] = note
    OUT.append(rec)
    HSK_ROWS.append({"objectiveId": rec["id"], "hskLevel": hsk, "skill": {"zh": SKILL[skill][0], "en": SKILL[skill][1]}})


# ---------------------------------------------------------------- lexical
obj("greetings.basic", "lexical", True, [], [("PRE_A1", "supports", "conversation"), ("A1", "supports", "sociolinguistic-appropriateness")], "competence", "1",
    ("Greetings and set phrases", "Lời chào và câu nói cố định"),
    ("I can recognize and choose the everyday greetings and set phrases — 你好, 谢谢, 对不起, 没关系, 请问, 辛苦了 — and pick the one that fits the moment and the person.",
     "Tôi có thể nhận ra và chọn lời chào, câu nói cố định hằng ngày — 你好, 谢谢, 对不起, 没关系, 请问, 辛苦了 — hợp lúc, hợp người."),
    "Written recognition and choice only. Saying these phrases aloud is assessed by zh.obj.speaking.formulaic.")
obj("vocab.everyday_basics", "lexical", True, [], [("PRE_A1", "supports", "vocabulary-range"), ("A1", "supports", "vocabulary-range")], "competence", "1",
    ("Common everyday words", "Từ thông dụng hằng ngày"),
    ("I can understand and name the course's everyday words — people, family, food and drink, the home, familiar objects — when I read them.",
     "Tôi có thể hiểu và gọi tên những từ hằng ngày của khoá học — người, gia đình, đồ ăn thức uống, nhà ở, đồ vật quen thuộc — khi đọc thấy chúng."))
obj("vocab.work_china", "lexical", False, [], [("A1", "supports", "vocabulary-range")], "competence", "2",
    ("Words for work with a Chinese-speaking employer", "Từ về công việc với chủ người Hoa"),
    ("I can understand the words I need first at a factory, a warehouse or an office — 工厂, 机器, 安全, 小心, 加班, 工资, 请假 — when I read or hear them.",
     "Tôi có thể hiểu những từ cần trước tiên ở nhà máy, kho hay văn phòng — 工厂, 机器, 安全, 小心, 加班, 工资, 请假 — khi đọc hay nghe thấy."))
obj("vocab.time_calendar", "lexical", False, [], [("A1", "supports", "vocabulary-range")], "competence", "1",
    ("Time, days and dates", "Giờ, thứ và ngày tháng"),
    ("I can use the words for time and the calendar — 今天, 明天, 每天, 星期一 to 星期天, the months and dates such as 五月一号.",
     "Tôi có thể dùng các từ chỉ thời gian và lịch — 今天, 明天, 每天, 星期一 đến 星期天, các tháng và ngày như 五月一号."))
obj("numbers.measure_words", "lexical", True, [], [("A1", "supports", "vocabulary-range"), ("A1", "supports", "grammatical-accuracy")], "competence", "1",
    ("Numbers, prices and measure words", "Số đếm, giá tiền và lượng từ"),
    ("I can read numbers up to 10,000, prices in 块 and 元, and the measure words used most — 个, 本, 杯, 只, 件, 张 — and say 两个, never 二个.",
     "Tôi có thể đọc số đến 10.000, giá tiền bằng 块 và 元, các lượng từ hay dùng nhất — 个, 本, 杯, 只, 件, 张 — và nói 两个, không nói 二个."),
    "Numbers are read and chosen or typed here; spoken numbers are assessed by the listening and speaking objectives.")

# ---------------------------------------------------------------- script and written form
obj("script.pinyin_tones", "written_reception", True, [], [("PRE_A1", "supports", "overall-reading-comprehension"), ("A1", "supports", "phonological-control")], "competence", "1",
    ("Pinyin and the four tones", "Pinyin và bốn thanh điệu"),
    ("I can read pinyin with its tone marks, tell the four tones and the neutral tone apart, and match a syllable I hear to its spelling — mā, má, mǎ, mà.",
     "Tôi có thể đọc pinyin có dấu thanh, phân biệt bốn thanh và thanh nhẹ, và nối âm tiết nghe được với cách viết — mā, má, mǎ, mà."),
    "Assessed by the tone and pinyin primer checkpoint. Pinyin is a reading aid: it is never accepted as production evidence for a word written in characters.")
obj("script.hanzi_hanviet", "written_reception", False, ["script.pinyin_tones"], [("A1", "supports", "vocabulary-range"), ("A1", "supports", "orthographic-control")], "strategy", "1",
    ("About 470 characters, helped by Hán-Việt", "Khoảng 470 chữ Hán, nhờ âm Hán-Việt"),
    ("I can recognize the characters of the course's words — 人, 学, 工作, 银行, 安全 — and use their Hán-Việt reading, where it helps, to remember the meaning.",
     "Tôi có thể nhận ra chữ Hán trong các từ của khoá học — 人, 学, 工作, 银行, 安全 — và dùng âm Hán-Việt, khi có ích, để nhớ nghĩa."),
    "Recognition with pinyin available. Writing characters by hand is not taught or assessed; traditional characters are recognised, never required.")
obj("reading.familiar_words", "written_reception", True, ["script.pinyin_tones"], [("PRE_A1", "direct", "overall-reading-comprehension"), ("A1", "supports", "overall-reading-comprehension")], "read", "1",
    ("Reading familiar words and phrases", "Đọc từ và cụm từ quen thuộc"),
    ("I can recognize familiar words and very short learned phrases written in characters with pinyin, and match them to their meaning.",
     "Tôi có thể nhận ra từ quen thuộc và cụm từ rất ngắn đã học khi thấy chúng viết bằng chữ Hán có pinyin, và nối chúng với nghĩa."),
    "Direct at Pre-A1 only: written recognition of familiar words and learned phrases. Reading short simple texts at A1 belongs to the reading objectives below.")
obj("writing.pinyin_input", "written_production", True, ["script.pinyin_tones"], [("A1", "supports", "orthographic-control")], "competence", "1",
    ("Typing Chinese with a pinyin keyboard", "Gõ tiếng Trung bằng bàn phím pinyin"),
    ("I can type familiar words in characters on a phone with a pinyin keyboard and pick the right character from the list — 是 not 事, 买 not 卖.",
     "Tôi có thể gõ từ quen thuộc bằng chữ Hán trên điện thoại với bàn phím pinyin và chọn đúng chữ trong danh sách — 是 chứ không phải 事, 买 chứ không phải 卖."),
    "Evidence is single words and short learned phrases in characters. An answer typed in pinyin for a key in characters is accepted but is practice, not production evidence (P4b evidence guard).")

# ---------------------------------------------------------------- grammar
obj("sentences.shi_questions", "grammar", True, [], [("A1", "supports", "grammatical-accuracy")], "competence", "1",
    ("是 sentences, 不 and 没, questions with 吗", "Câu với 是, 不 và 没, câu hỏi với 吗"),
    ("I can say what or who something is with 是, make it negative with 不 or 没, and ask yes-no questions with 吗 or 是不是 — 你是越南人吗？",
     "Tôi có thể nói ai, cái gì là gì bằng 是, phủ định bằng 不 hoặc 没, và hỏi có/không bằng 吗 hoặc 是不是 — 你是越南人吗？"))
obj("grammar.word_order", "grammar", True, ["sentences.shi_questions"], [("A1", "supports", "grammatical-accuracy")], "competence", "1",
    ("Word order: time and place before the verb, 的 before the noun", "Trật tự từ: thời gian, nơi chốn trước động từ; 的 trước danh từ"),
    ("I can put time and place before the verb — 我明天在家吃饭 — and the describing word with 的 before the noun — 我的手机, 红色的车 — the reverse of Vietnamese.",
     "Tôi có thể đặt thời gian, nơi chốn trước động từ — 我明天在家吃饭 — và từ bổ nghĩa với 的 trước danh từ — 我的手机, 红色的车 — ngược với tiếng Việt."))
obj("aspect.le_guo_zai", "grammar", True, ["grammar.word_order"], [("A1", "supports", "grammatical-accuracy")], "competence", "2",
    ("了, 过, 在 and 着", "了, 过, 在 và 着"),
    ("I can say that something has happened with 了, that I have done it before with 过, and that it is going on with 在 or 正在 — close to the Vietnamese words for 'already', 'ever' and 'in the middle of'.",
     "Tôi có thể nói việc đã xảy ra bằng 了, việc đã từng làm bằng 过, việc đang diễn ra bằng 在 hay 正在 — gần với rồi, từng, đang của tiếng Việt."),
    "Taught as learned patterns with common verbs; 着 is recognition only. 了 is not a past tense, and the course never says it is.")
obj("existence.you_zai", "grammar", True, ["sentences.shi_questions"], [("A1", "supports", "grammatical-accuracy")], "competence", "1",
    ("有 and 在: having, being somewhere", "有 và 在: có, ở đâu"),
    ("I can say what I have and what there is with 有 (negative 没有), and where something or someone is with 在 — 银行在超市旁边.",
     "Tôi có thể nói mình có gì, ở đâu có gì bằng 有 (phủ định 没有), và cái gì, ai ở đâu bằng 在 — 银行在超市旁边."))
obj("questions.question_words", "grammar", False, ["sentences.shi_questions"], [("A1", "supports", "grammatical-accuracy")], "competence", "1",
    ("Question words in place", "Từ để hỏi đặt đúng chỗ"),
    ("I can ask questions with 什么, 谁, 哪儿, 几, 多少 and 怎么 put where the answer goes, with no change of word order — 你在哪儿工作？",
     "Tôi có thể đặt câu hỏi với 什么, 谁, 哪儿, 几, 多少, 怎么 ở đúng chỗ của câu trả lời, không đổi trật tự từ — 你在哪儿工作？"))
obj("modals.can_want", "grammar", False, ["grammar.word_order"], [("A2", "supports", "grammatical-accuracy")], "competence", "2",
    ("Wanting and being able: 想, 要, 会, 能, 可以", "Muốn và có thể: 想, 要, 会, 能, 可以"),
    ("I can say what I want or intend with 想 and 要, what I know how to do with 会, and whether I can or may with 能 and 可以.",
     "Tôi có thể nói điều mình muốn, định làm bằng 想 và 要, việc mình biết làm bằng 会, và việc mình làm được, được phép bằng 能 và 可以."),
    "Learned patterns with common verbs; the fine contrast between 能 and 可以 is practice only; kept at A2 supports.")
obj("adjectives.hen_tai", "grammar", False, ["sentences.shi_questions"], [("A1", "supports", "grammatical-accuracy")], "competence", "1",
    ("Adjectives with 很 and 太…了", "Tính từ với 很 và 太…了"),
    ("I can describe with an adjective after 很, with no 是 — 今天很冷 — and react with 太…了 — 太贵了！",
     "Tôi có thể miêu tả bằng tính từ đứng sau 很, không cần 是 — 今天很冷 — và phản ứng bằng 太…了 — 太贵了！"))
obj("politeness.register", "grammar", False, ["greetings.basic"], [("A1", "supports", "sociolinguistic-appropriateness")], "competence", "1",
    ("Polite forms at work", "Cách nói lịch sự ở chỗ làm"),
    ("I can speak politely to a boss or a customer — 您, 请, 请问, a surname with 经理 or 先生 — and recognise the friendly style co-workers use with each other.",
     "Tôi có thể nói lịch sự với cấp trên hay khách hàng — 您, 请, 请问, họ kèm 经理 hay 先生 — và nhận ra cách nói thân mật đồng nghiệp dùng với nhau."),
    "The friendly style is recognition only.")

# ---------------------------------------------------------------- phonology and strategy
obj("pronunciation.tones_sounds", "phonology", False, ["script.pinyin_tones"], [("A1", "supports", "phonological-control")], "competence", "1",
    ("Tones, tone changes and retroflex sounds", "Thanh điệu, biến điệu và âm uốn lưỡi"),
    ("I can hear tone pairs such as 买 mǎi / 卖 mài, the tone changes of 不, 一 and two third tones, and the difference between zh, ch, sh and z, c, s.",
     "Tôi có thể nghe phân biệt cặp thanh như 买 mǎi / 卖 mài, biến điệu của 不, 一 và hai thanh 3 liền nhau, và khác biệt giữa zh, ch, sh với z, c, s."),
    "Contrast recognition only. The learner's own pronunciation is not assessed, and a recogniser transcript is never a pronunciation score.")
obj("strategy.hanviet_false_friends", "strategy", False, [], [("A1", "supports", "identifying-cues-inferring")], "strategy", "1",
    ("Hán-Việt and false friends", "Hán-Việt và “bạn giả”"),
    ("I can guess new words through their Sino-Vietnamese reading — 银行 (bank), 准备 (to prepare) — and avoid false friends such as 小心, which means careful, and 方便, which means convenient.",
     "Tôi có thể đoán nghĩa từ mới nhờ âm Hán-Việt — 银行 ngân hàng, 准备 chuẩn bị — và tránh “bạn giả” như 小心 là cẩn thận, 方便 là thuận tiện."))

# ---------------------------------------------------------------- spoken reception
obj("listening.familiar_words", "spoken_reception", True, ["vocab.everyday_basics"], [("PRE_A1", "direct", "overall-listening-comprehension"), ("A1", "supports", "overall-listening-comprehension")], "listen", "1",
    ("Hearing familiar words and phrases", "Nghe từ và cụm từ quen thuộc"),
    ("I can pick out familiar words and short learned phrases when they are said clearly and slowly.",
     "Tôi có thể nhận ra từ quen thuộc và cụm từ ngắn đã học khi nghe chúng được nói rõ và chậm."),
    "Direct at Pre-A1 only: bundled, clear, synthesized clips of single words and short phrases, scored in the Section 3 checkpoint. Natural conversational speech and regional accents are not assessed.")
obj("listening.short_info", "spoken_reception", True, ["listening.familiar_words", "numbers.measure_words"], [("A1", "direct", "audio-media-recordings"), ("PRE_A1", "supports", "overall-listening-comprehension")], "listen", "1",
    ("Hearing facts in a short recording", "Nghe thông tin trong đoạn ghi âm ngắn"),
    ("I can catch concrete facts — a time, a price, a date, a place — in a short, clear, slow recording about daily life or work.",
     "Tôi có thể nghe ra thông tin cụ thể như giờ, giá, ngày, địa điểm trong một đoạn ghi âm ngắn, rõ và chậm về cuộc sống hằng ngày hay công việc."),
    "Direct at A1 within the bundled audio: short synthesized recordings holding 1-3 facts, scored in the Section 3 checkpoint. Authentic-speed media are not assessed.")
obj("listening.announcements", "spoken_reception", True, ["listening.familiar_words"], [("A1", "direct", "announcements-instructions")], "listen", "2",
    ("Announcements and safety instructions", "Thông báo và chỉ dẫn an toàn"),
    ("I can understand very short announcements and instructions spoken clearly and slowly — at a station, in a shop, and the safety rules of a factory or warehouse.",
     "Tôi có thể hiểu thông báo và chỉ dẫn rất ngắn nói rõ và chậm — ở nhà ga, trong cửa hàng, và nội quy an toàn ở nhà máy hay kho hàng."),
    "Direct at A1 within the bundled audio: synthesized station, shop and workplace announcements and simple instructions, scored in the Section 3 checkpoint.")
obj("listening.short_dialogues", "spoken_reception", True, ["listening.familiar_words", "greetings.basic"], [("A1", "direct", "understanding-conversation")], "listen", "2",
    ("Understanding short dialogues", "Nghe hiểu hội thoại ngắn"),
    ("I can follow the main point when two people say a few clear sentences to each other about daily life or work.",
     "Tôi có thể hiểu ý chính khi hai người nói rõ ràng với nhau vài câu về chuyện hằng ngày hoặc công việc."),
    "Direct at A1 within the bundled audio: two-voice synthesized exchanges of 2-4 turns (cast A and B are different speakers), scored in the Section 3 checkpoint. The learner only listens: interaction is assessed by the interaction objectives.")

# ---------------------------------------------------------------- written reception
obj("reading.short_messages", "written_reception", True, ["reading.familiar_words"], [("A1", "direct", "reading-correspondence")], "read", "2",
    ("Reading short messages", "Đọc tin nhắn ngắn"),
    ("I can understand short, simple messages from a co-worker or a boss — on WeChat or a note — about shifts, times and everyday tasks.",
     "Tôi có thể hiểu tin nhắn ngắn, đơn giản của đồng nghiệp hay cấp trên — trên WeChat hay giấy nhắn — về ca làm, giờ giấc và việc hằng ngày."),
    "Direct at A1: original short messages in simplified characters with pinyin available, read and answered in the Section 3 checkpoint.")
obj("reading.notices_info", "written_reception", True, ["reading.familiar_words"], [("A1", "direct", "reading-orientation")], "read", "2",
    ("Signs, notices and timetables", "Biển báo, thông báo và lịch"),
    ("I can find the facts I need on signs and simple notices — 禁止吸烟, 小心, 出口, 入口, opening hours, a shift table.",
     "Tôi có thể tìm thông tin cần thiết trên biển báo và thông báo đơn giản — 禁止吸烟, 小心, 出口, 入口, giờ mở cửa, bảng ca làm."),
    "Direct at A1: original notices and schedules with locate-type questions, scored in the Section 3 checkpoint. Signs may be shown in traditional characters for recognition (Taiwan).")
obj("reading.short_texts", "written_reception", True, ["reading.familiar_words", "aspect.le_guo_zai"], [("A1", "direct", "overall-reading-comprehension"), ("A2", "supports", "overall-reading-comprehension")], "read", "2",
    ("Reading very short texts", "Đọc đoạn văn rất ngắn"),
    ("I can read a very short text about familiar people and routines, slowly and more than once if I need to.",
     "Tôi có thể đọc hiểu đoạn văn rất ngắn về người và sinh hoạt quen thuộc, đọc chậm và đọc lại khi cần."),
    "Direct at A1: original 2-5 sentence descriptions and small stories with pinyin available, scored in the Section 3 checkpoint. Longer texts and unfamiliar topics are not assessed.")

# ---------------------------------------------------------------- spoken production
obj("speaking.formulaic", "spoken_production", True, ["greetings.basic"], [("PRE_A1", "supports", "overall-oral-production"), ("A1", "direct", "overall-oral-production"), ("A1", "supports", "sociolinguistic-appropriateness")], "speak", "1",
    ("Saying set phrases aloud", "Nói các câu cố định thành tiếng"),
    ("I can say the everyday greetings, thanks, apologies and requests aloud — 你好, 谢谢, 对不起, 请再说一遍 — and choose the one that fits the moment.",
     "Tôi có thể nói thành tiếng lời chào, cảm ơn, xin lỗi và nhờ vả hằng ngày — 你好, 谢谢, 对不起, 请再说一遍 — và chọn câu hợp lúc."),
    "Assessed from what an on-device zh-CN speech recogniser heard: characters recognised, never a tone or pronunciation-quality score. Simplified and traditional transcripts count as equal.")
obj("speaking.self_intro", "spoken_production", True, ["sentences.shi_questions"], [("A1", "direct", "sustained-monologue-describing"), ("A1", "supports", "overall-oral-production")], "speak", "1",
    ("Introducing yourself", "Tự giới thiệu"),
    ("I can introduce myself aloud in short sentences, as at an interview or on the first day at work — name, country, age, job, 认识你很高兴.",
     "Tôi có thể tự giới thiệu thành tiếng bằng câu ngắn, như khi phỏng vấn hay ngày đầu đi làm — tên, nước, tuổi, việc làm, 认识你很高兴."),
    "Assessed from recognised words in elicited sentences. The meaning cue is in Vietnamese; the Chinese is never shown before the attempt.")
obj("speaking.give_info", "spoken_production", True, ["numbers.measure_words"], [("A1", "direct", "sustained-monologue-giving-information"), ("A1", "supports", "overall-oral-production")], "speak", "1",
    ("Giving simple facts aloud", "Nói thông tin đơn giản"),
    ("I can give simple facts aloud with numbers and common words — a phone number, a price, a time, a date, how many.",
     "Tôi có thể nói thông tin đơn giản bằng con số và từ thông dụng — số điện thoại, giá, giờ, ngày, số lượng."),
    "Recognised digits and character numerals count as the same information (两 and 二 are kept apart before a measure word); a wrong number is a wrong answer, and silence is never scored.")
obj("speaking.describe", "spoken_production", False, ["vocab.everyday_basics", "adjectives.hen_tai"], [("A1", "direct", "overall-oral-production"), ("A1", "supports", "sustained-monologue-describing")], "speak", "2",
    ("Describing aloud", "Mô tả thành tiếng"),
    ("I can describe familiar people, places and objects aloud in short phrases: what it is and one simple feature.",
     "Tôi có thể tả người, nơi chốn và đồ vật quen thuộc bằng cụm từ ngắn: đó là gì và một đặc điểm đơn giản của nó."),
    "Short separate phrases only: connected description is beyond this course's A1 claim.")

# ---------------------------------------------------------------- written production
obj("writing.personal_info", "written_production", True, ["writing.pinyin_input", "sentences.shi_questions"], [("A1", "direct", "overall-written-production"), ("A1", "direct", "overall-written-interaction"), ("A1", "supports", "orthographic-control")], "write", "1",
    ("Writing about yourself", "Viết về bản thân"),
    ("I can write short sentences about myself in characters with a pinyin keyboard — name, age, country, where I live, my job.",
     "Tôi có thể viết những câu ngắn về bản thân bằng chữ Hán với bàn phím pinyin — tên, tuổi, nước, nơi ở và công việc."),
    "Assessed by guided rubric-scored writing with required information slots; open free writing is never scored evidence. A slot met only through pinyin for a key in characters is practice, not production evidence.")
obj("writing.phrases_sentences", "written_production", True, ["writing.personal_info", "grammar.word_order"], [("A1", "direct", "overall-written-production"), ("A1", "supports", "grammatical-accuracy")], "write", "2",
    ("Writing simple sentences", "Viết câu đơn giản"),
    ("I can write short sentences about familiar people and things — who does what, where, when — and join them with 和, 但是, 然后.",
     "Tôi có thể viết câu ngắn về người và việc quen thuộc — ai làm gì, ở đâu, khi nào — và nối câu bằng 和, 但是, 然后."),
    "Assessed by guided tasks whose rubric requires a verb from an authored list plus the task's information slots.")
obj("writing.short_message", "written_production", True, ["writing.personal_info", "vocab.time_calendar"], [("A1", "direct", "correspondence"), ("A1", "direct", "overall-written-interaction")], "written", "2",
    ("Writing a short message", "Viết tin nhắn ngắn"),
    ("I can write a very short message to a boss or a co-worker, as on WeChat: a greeting, one or two facts such as a time or a reason, and a polite closing.",
     "Tôi có thể viết tin nhắn rất ngắn cho cấp trên hay đồng nghiệp, như trên WeChat: lời chào, một hai thông tin như giờ hay lý do, và lời kết lịch sự."),
    "Assessed by guided tasks; the rubric requires the message's parts (greeting, fact, closing) and never judges style.")
obj("writing.form_filling", "written_production", False, ["writing.pinyin_input", "numbers.measure_words"], [("A1", "direct", "notes-messages-forms")], "written", "2",
    ("Filling in a form", "Điền biểu mẫu"),
    ("I can fill in a simple form at a bank, a clinic or a company — 姓名, 国籍, 电话, 地址, 护照号码 — in characters and numbers.",
     "Tôi có thể điền biểu mẫu đơn giản ở ngân hàng, phòng khám hay công ty — 姓名, 国籍, 电话, 地址, 护照号码 — bằng chữ Hán và chữ số."),
    "Assessed by separate labelled fields checked against the cue facts; an empty form is insufficient evidence, never a failure.")

# ---------------------------------------------------------------- interaction
obj("interaction.everyday_conversation", "interaction", True, ["speaking.formulaic", "speaking.self_intro", "listening.short_dialogues"], [("A1", "direct", "overall-oral-interaction"), ("A1", "direct", "conversation")], "talk", "2",
    ("Short conversations", "Trò chuyện ngắn"),
    ("I can take part in a short conversation with a patient partner — greet, introduce myself at work, answer simple interview questions — and ask for a repeat (请再说一遍).",
     "Tôi có thể tham gia cuộc trò chuyện ngắn với người kiên nhẫn — chào hỏi, giới thiệu mình ở chỗ làm, trả lời câu hỏi phỏng vấn đơn giản — và nhờ nhắc lại (请再说一遍)."),
    "Assessed by multi-turn deterministic scenarios where the recognized meaning decides the partner's next turn. Asking for a repeat is tracked and never penalized; a technical speech failure is insufficient evidence, never a failure.")
obj("interaction.practical_needs", "interaction", True, ["speaking.give_info", "listening.short_info", "numbers.measure_words"], [("A1", "direct", "obtaining-goods-services"), ("A1", "direct", "information-exchange")], "talk", "2",
    ("Practical tasks with Chinese speakers", "Việc thực tế với người nói tiếng Trung"),
    ("I can handle very simple tasks — buy and pay in a shop, open a bank account, see a doctor, ask the way, phone my workplace to say I am ill — and understand the short answer.",
     "Tôi có thể xử lý việc rất đơn giản — mua và trả tiền ở cửa hàng, mở tài khoản ngân hàng, đi khám, hỏi đường, gọi điện báo chỗ làm là mình ốm — và hiểu câu trả lời ngắn."),
    "Assessed by multi-turn scenario items in a shop, at a bank, at a clinic, on the street, on the phone and at work. Passing needs the goal met and first-attempt intent matches on scored turns; a repair keeps the conversation alive and is recorded.")

for r in OUT:
    if not r["canDo"]["vi"].startswith("Tôi có thể") or len(r["canDo"]["vi"]) > 220:
        raise SystemExit(f"can-do rule: {r['id']} ({len(r['canDo']['vi'])} chars)")

os.makedirs(f"{ROOT}/content/zh/_drafts/objectives", exist_ok=True)
with open(f"{ROOT}/content/zh/_drafts/objectives/OUTPUT.jsonl", "w", encoding="utf-8", newline="\n") as f:
    for r in OUT:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
with open(f"{ROOT}/content/zh/_drafts/objectives/hsk-standard.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump({
        "generator": "content/zh/_drafts/_generators/zh-objectives.py",
        "source": "Chinese Proficiency Grading Standards for International Chinese Language Education (国际中文教育中文水平等级标准, GF0025-2021), Ministry of Education of the PRC and the National Language Commission, 2021 — cited by band and skill only; no text of the standard is reproduced. The word levels come from ivankra/hsk30 (content/zh/lexicon/derived/hsk-course.json).",
        "checkedAgainstOfficialSource": False,
        "note": "HSK 3.0 is not a CEFR level, and the course never says it is: each objective is filed under the HSK band (1 or 2) whose syllabus it practises and the skill it trains. The band and skill names are to be checked against the published standard before release (owner/coordinator).",
        "objectives": HSK_ROWS,
    }, f, ensure_ascii=False, indent=2)
    f.write("\n")


def write_staged(rel, text):
    path = f"{STAGED}/{rel}"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def write_json(rel, doc):
    write_staged(rel, json.dumps(doc, ensure_ascii=False, indent=2) + "\n")


write_json("content/zh/assessment/claim-policy.json", {
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
    "written_reception": "Messages, notices and short texts: the three A1 reading activities the Section 3 checkpoint scores. Pinyin and word recognition are direct at Pre-A1 only or supporting, and are not listed here.",
    "spoken_production": "Set phrases, self-introduction and simple facts: what a Vietnamese worker needs first with a Chinese-speaking employer, all checked from recognized words.",
    "written_production": "Personal facts, sentences and a short message: the three guided writing activities the Section 5 checkpoint scores.",
    "interaction": "Conversation and practical tasks together: an A1 estimate needs both talking with someone and getting something done.",
}
EXCLUDED = {
    "zh.obj.speaking.describe": "Short separate phrases only. It is practiced and reported on its own; the estimate does not depend on it.",
    "zh.obj.writing.form_filling": "Discrete labelled fields. It is practiced and reported on its own, and proves less than guided sentences do, so the estimate does not depend on it.",
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
write_json("content/zh/assessment/attainment.json", {
    "version": 1,
    "language": "zh",
    "level": "A1",
    "principle": "A learner's CEFR-aligned A1 estimate counts a communicative domain as demonstrated only when EVERY objective listed for that domain below carries a real 'demonstrated' checkpoint verdict under the latest-attempt policy. The list is the authored denominator: it names every essential objective that is aligned directly to an A1 descriptor scale in the domain. Non-essential direct objectives are listed under excludedObjectiveIds with the pedagogical reason; nothing is omitted silently. The A1 Capstone samples one representative objective per domain and therefore can contribute evidence but can never complete a domain on its own.",
    "domains": domains,
})

register = "\n".join(f"| `cefr-cv-2020:{k}` | {v} |" for k, v in SCALE.items())
write_staged("content/zh/assessment/RESEARCH.md", f"""# zh-vi assessment research base (clean-room)

Authored for this project (P4d, 2026-11-04). It is the provenance register for the
`sourceRef` keys used in `objectives.json` and records how the Chinese objectives
were derived. **No CEFR descriptor text and no text of the HSK standard is reproduced
anywhere in this repository.** The structure follows the RESEARCH.md of the French,
Spanish, German, Italian, English and Japanese courses; what they say about the
framework model, the claim gate and parallel forms applies unchanged and is not
repeated here.

## Primary sources

- **Council of Europe, CEFR Companion Volume (2020)**: *Common European Framework of
  Reference for Languages: Learning, teaching, assessment. Companion Volume*, Council
  of Europe Publishing, Strasbourg, 2020.
  https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4
- **Chinese Proficiency Grading Standards for International Chinese Language Education
  (GF0025-2021)**, Ministry of Education of the PRC and the National Language
  Commission, 2021 (HSK 3.0). Each objective is filed under an HSK band and skill by
  name in `content/zh/_drafts/objectives/hsk-standard.json`
  (`checkedAgainstOfficialSource: false` until checked).
- **HSK 3.0 word levels**: ivankra/hsk30 (MIT), a transcription of the standard's word
  list, used as a build-time anchor (`content/zh/lexicon/derived/hsk-course.json`).
  HSK bands are not CEFR levels, and this course never says that they are.

## How the Chinese objectives were derived

The objectives keep the construct families and CEFR scale alignments of the other
courses (`plan/authoring/BLUEPRINT.md` §8). Every `title`, `canDo` and `evidenceNote`
was written for Mandarin and for Vietnamese adults who work or will work for a
Chinese-speaking employer, in China, in Taiwan or in Vietnam
(`plan/authoring/briefs/zh-vi.md`): scenarios at a factory, a warehouse, a shop, a
bank, a clinic and on the phone replace some travel settings. The script and grammar
families differ most, because the transfer problems differ:

| Objective | Why it exists |
|---|---|
| `zh.obj.script.pinyin_tones` | pinyin and four tones plus the neutral tone; the primer before Section 1 (brief §2, §3.1-3.2) |
| `zh.obj.script.hanzi_hanviet` | characters remembered through Hán-Việt where the reading helps (brief §2, §3.4-3.5) |
| `zh.obj.writing.pinyin_input` | typing characters through a pinyin keyboard and choosing the right one (brief §2) |
| `zh.obj.sentences.shi_questions` | 是, 不 and 没, 吗 and A不A (brief §3.6) |
| `zh.obj.numbers.measure_words` | measure words, like Vietnamese classifiers but obligatory after numbers; 两 against 二 (brief §3.7) |
| `zh.obj.existence.you_zai` | 有 and 在 (brief §3.8) |
| `zh.obj.grammar.word_order` | modifier with 的 before the noun, time and place before the verb (brief §3.9-3.10) |
| `zh.obj.aspect.le_guo_zai` | 了, 过, 在/正在, 着 against Vietnamese rồi, từng, đang (brief §3.11) |
| `zh.obj.modals.can_want` | 想, 要, 能, 会, 可以; kept at A2 *supports* (brief §3.12) |
| `zh.obj.questions.question_words` | question words in place (brief §3.14) |
| `zh.obj.adjectives.hen_tai` | 很 and 太…了, no 是 before an adjective (brief §3.15) |
| `zh.obj.politeness.register` | 您, 请, titles at work (brief §3.16) |
| `zh.obj.pronunciation.tones_sounds` | tone pairs, sandhi of 不, 一 and 3-3, retroflex sounds (brief §2, §3.2-3.3) |
| `zh.obj.strategy.hanviet_false_friends` | Hán-Việt and false friends (brief §2, §3.5) |

The speaking objectives cue meaning in **Vietnamese**; the Chinese target is never
shown before the attempt. Speech is recognised with the `zh-CN` recogniser; simplified
and traditional transcripts count as the same words (P4b traditional fold).

## sourceRef register

Every `cefrAlignments[].sourceRef` in `objectives.json` uses a key below. Keys name
the CEFR scale consulted; they are references, not quotations.

| key | CEFR scale (Companion Volume 2020) |
|---|---|
{register}

## Descriptor paraphrase policy

- Learner-facing `canDo` text is original wording written for this course's actual
  content, in Vietnamese, with an English version for the build tools. It never copies
  Companion Volume descriptor sentences or text of the HSK standard.
- Alignments record only level, scale name, relation and `sourceRef`.

## direct vs supports

Same rule as the other courses: `direct` only where the course genuinely assesses the
communicative ability at that level within its stated scope (evidence notes say what
is NOT assessed); everything else is `supports`. Doubt resolves to `supports`.

## Word lists

HSK 3.0 levels 1-2 are anchors for word choice only (`content/zh/lexicon/REVIEW.md`).
A list level is never an input to a level claim, and vocabulary or character counts
never are.

## Exam track

The HSK 1-2 practice track (later session) reproduces the public format of the
sections — 听力, 阅读, and 书写 at level 2 — with original items only, never past
papers. Its readiness message is "mức sẵn sàng ước tính", never a promise to pass.

## Assessment limitations

As for the other courses: synthesized bundled audio only, recognized words only for
speech (never a tone or pronunciation-quality score), rubric slots for writing,
deterministic scenarios for interaction. Pinyin typed for a key in characters is
accepted but is practice, not production evidence. The A1 estimate is a CEFR-aligned
estimate, not an official examination or certification.
""")
print(len(OUT), "objectives,", sum(o["essential"] for o in OUT), "essential")
