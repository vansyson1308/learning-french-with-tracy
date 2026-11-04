"""Objectives of ko-vi: content/ko/_drafts/objectives/OUTPUT.jsonl, plus the policy files and RESEARCH.md, which the
toolkit does not generate for a new course: written straight into the staged layer (content/ko/_drafts/staged/...).
Same construct families and CEFR scale alignments as the other courses; every line is written for Korean and for
Vietnamese adults who work or will work in Korea (EPS). No descriptor text. The TOPIK I references (section and level
by name only) go to content/ko/_drafts/objectives/topik-references.json. usage: python -I ko-objectives.py <repo root>"""
import json, os, sys

ROOT = sys.argv[1]
STAGED = f"{ROOT}/content/ko/_drafts/staged"
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
# TOPIK I (한국어능력시험 I, levels 1–2) tests 듣기 (listening) and 읽기 (reading) only; speaking and writing are not part of
# it. Each objective names the TOPIK I section it prepares, by name only, or none.
TOPIK = {"listen": "듣기", "read": "읽기", "lex": "듣기, 읽기", "none": None}
OUT = []
TOPIK_ROWS = []


def obj(oid, category, essential, pre, aligns, topik, title, can, note=None):
    rec = {
        "id": f"ko.obj.{oid}",
        "title": {"en": title[0], "vi": title[1]},
        "canDo": {"en": can[0], "vi": can[1]},
        "category": category,
        "prerequisites": [f"ko.obj.{p}" for p in pre],
        "cefrAlignments": [{"level": lvl, "scaleName": SCALE[s], "relation": rel, "sourceRef": f"cefr-cv-2020:{s}"} for lvl, rel, s in aligns],
        "essential": essential,
    }
    if note:
        rec["evidenceNote"] = note
    OUT.append(rec)
    TOPIK_ROWS.append({"objectiveId": rec["id"], "topikI": TOPIK[topik], "levels": "1–2" if TOPIK[topik] else None})


# ---------------------------------------------------------------- lexical
obj("greetings.basic", "lexical", True, [], [("PRE_A1", "supports", "conversation"), ("A1", "supports", "sociolinguistic-appropriateness")], "lex",
    ("Greetings and set phrases", "Lời chào và câu nói cố định"),
    ("I can recognize the everyday greetings and set phrases — 안녕하세요, 감사합니다, 죄송합니다, 수고하셨습니다, 잘 부탁드립니다 — and pick the one that fits the moment and the person.",
     "Tôi có thể nhận ra các lời chào, câu nói cố định hằng ngày — 안녕하세요, 감사합니다, 죄송합니다, 수고하셨습니다, 잘 부탁드립니다 — và chọn câu hợp lúc, hợp người."),
    "Written recognition only. Saying these phrases aloud is assessed by ko.obj.speaking.formulaic.")
obj("vocab.everyday_basics", "lexical", True, [], [("PRE_A1", "supports", "vocabulary-range"), ("A1", "supports", "vocabulary-range")], "lex",
    ("Common everyday words", "Từ thông dụng hằng ngày"),
    ("I can understand and name the course's everyday words — people, family, food and drink, the home, familiar objects — when I read them.",
     "Tôi có thể hiểu và gọi tên những từ hằng ngày của khoá học — người, gia đình, đồ ăn thức uống, nhà ở, đồ vật quen thuộc — khi đọc thấy chúng."))
obj("vocab.work_korea", "lexical", False, [], [("A1", "supports", "vocabulary-range")], "lex",
    ("Words for work and life in Korea", "Từ về công việc và cuộc sống ở Hàn Quốc"),
    ("I can understand the words I need first at work and in town — 공장, 안전, 위험, 휴가, 월급, 고용센터, 외국인 등록증 — when I read or hear them.",
     "Tôi có thể hiểu những từ cần trước tiên ở chỗ làm và ngoài phố — 공장, 안전, 위험, 휴가, 월급, 고용센터, 외국인 등록증 — khi đọc hay nghe thấy."))
obj("vocab.time_calendar", "lexical", False, [], [("A1", "supports", "vocabulary-range")], "lex",
    ("Time, days and dates", "Giờ, thứ và ngày tháng"),
    ("I can use the words for time and the calendar — 오늘, 내일, 매일, the days of the week, months and dates such as 오월 삼 일.",
     "Tôi có thể dùng các từ chỉ thời gian và lịch — 오늘, 내일, 매일, các thứ trong tuần, tháng và ngày như 오월 삼 일."))
obj("numbers.two_systems", "lexical", True, [], [("A1", "supports", "vocabulary-range")], "lex",
    ("Two sets of numbers and the counters", "Hai hệ số đếm và lượng từ"),
    ("I can use Sino-Korean numbers for prices, dates, minutes and phone numbers, and native numbers with counters for hours, ages and things — 세 시 십 분, 스무 살, 두 병.",
     "Tôi có thể dùng số Hán-Hàn cho giá tiền, ngày, phút, số điện thoại và số thuần Hàn với lượng từ cho giờ, tuổi, đồ vật — 세 시 십 분, 스무 살, 두 병."),
    "Numbers are read here; spoken numbers are assessed by the listening and speaking objectives.")

# ---------------------------------------------------------------- script and written form
obj("script.hangul", "written_reception", True, [], [("PRE_A1", "supports", "overall-reading-comprehension"), ("A1", "supports", "orthographic-control")], "read",
    ("Reading Hangul", "Đọc chữ Hangul"),
    ("I can read every Hangul consonant and vowel, put them together into syllable blocks with or without a final consonant (받침), and tell apart pairs such as 달 / 딸 / 탈.",
     "Tôi có thể đọc mọi phụ âm và nguyên âm Hangul, ghép chúng thành khối âm tiết có hoặc không có phụ âm cuối (받침), và phân biệt các cặp như 달 / 딸 / 탈."),
    "Assessed by the Hangul primer checkpoint. Reading words and sentences belongs to the reading objectives.")
obj("script.hanviet", "written_reception", False, ["script.hangul"], [("A1", "supports", "vocabulary-range")], "lex",
    ("Sino-Korean words and Hán-Việt", "Từ Hán-Hàn và âm Hán-Việt"),
    ("I can see that many Korean words share a Sino-Vietnamese root with Vietnamese — 가족 \"gia tộc\", 안전 \"an toàn\", 기숙사 \"ký túc xá\" — and use it to remember their meaning.",
     "Tôi có thể nhận ra nhiều từ tiếng Hàn có chung gốc Hán-Việt với tiếng Việt — 가족 gia tộc, 안전 an toàn, 기숙사 ký túc xá — và dùng nó để nhớ nghĩa."),
    "Hangul only; hanja are shown as a reading aid, never taught to write. Native Korean words have no Hán-Việt reading.")
obj("reading.familiar_words", "written_reception", True, ["script.hangul"], [("PRE_A1", "direct", "overall-reading-comprehension"), ("A1", "supports", "overall-reading-comprehension")], "read",
    ("Reading familiar words and phrases", "Đọc từ và cụm từ quen thuộc"),
    ("I can recognize familiar words and very short learned phrases written in Hangul and match them to their meaning.",
     "Tôi có thể nhận ra từ quen thuộc và cụm từ rất ngắn đã học khi thấy chúng viết bằng Hangul, và nối chúng với nghĩa."),
    "Direct at Pre-A1 only: written recognition of familiar words and learned phrases. Reading short simple texts at A1 belongs to the reading objectives below.")
obj("writing.hangul_input", "written_production", True, ["script.hangul"], [("A1", "supports", "orthographic-control")], "none",
    ("Typing Korean in Hangul", "Gõ tiếng Hàn bằng Hangul"),
    ("I can type familiar words in Hangul on a phone keyboard, with the final consonant in the right block — 읽어요, 앉으세요, 없어요.",
     "Tôi có thể gõ từ quen thuộc bằng Hangul trên bàn phím điện thoại, đặt phụ âm cuối đúng khối — 읽어요, 앉으세요, 없어요."),
    "Typing starts in Section 2, after the Hangul primer; Section 1 uses tiles only. Spacing (띄어쓰기) is not graded at A1.")

# ---------------------------------------------------------------- grammar
obj("sentences.copula", "grammar", True, [], [("A1", "supports", "grammatical-accuracy")], "lex",
    ("Noun sentences with 이에요 / 예요", "Câu danh từ với 이에요 / 예요"),
    ("I can say what or who something is with N이에요 / N예요, its negative 아니에요, and the formal 입니다 — 저는 베트남 사람이에요.",
     "Tôi có thể nói ai, cái gì là gì bằng N이에요 / N예요, phủ định 아니에요 và dạng trang trọng 입니다 — 저는 베트남 사람이에요."))
obj("particles.core", "grammar", True, ["sentences.copula"], [("A1", "supports", "grammatical-accuracy")], "lex",
    ("The core particles", "Các tiểu từ cơ bản"),
    ("I can use the particles 은/는, 이/가, 을/를, 에, 에서, 도, 하고, (으)로 in learned patterns — 공장에서 일해요, 일곱 시에 가요 — where Vietnamese shows the role by word order.",
     "Tôi có thể dùng các tiểu từ 은/는, 이/가, 을/를, 에, 에서, 도, 하고, (으)로 theo mẫu đã học — 공장에서 일해요, 일곱 시에 가요 — ở chỗ tiếng Việt chỉ dựa vào trật tự từ."),
    "은/는 and 이/가 are taught as set patterns at A1, not as a full contrast. Each particle's form after a consonant or a vowel is practised.")
obj("verbs.haeyo_present", "grammar", True, ["particles.core"], [("A1", "supports", "grammatical-accuracy")], "lex",
    ("Verbs in the 해요 style", "Động từ ở thể 해요"),
    ("I can use common verbs and adjectives in the polite 해요 present — 가요, 먹어요, 해요, 마셔요 — with the verb at the end of the sentence.",
     "Tôi có thể dùng động từ và tính từ thông dụng ở thì hiện tại lịch sự 해요 — 가요, 먹어요, 해요, 마셔요 — với động từ đứng cuối câu."),
    "The 아/어 contraction is taught with the course's verbs; the irregular stems (ㅂ, ㄷ, 르, ㅎ) are recognition first.")
obj("verbs.past_future", "grammar", False, ["verbs.haeyo_present"], [("A1", "supports", "grammatical-accuracy")], "lex",
    ("Past and future", "Quá khứ và tương lai"),
    ("I can say what I did with 았어요 / 었어요 and what I will do with (으)ㄹ 거예요 and (으)ㄹ게요 — 어제 일했어요, 내일 갈게요.",
     "Tôi có thể nói việc đã làm bằng 았어요 / 었어요 và việc sẽ làm bằng (으)ㄹ 거예요, (으)ㄹ게요 — 어제 일했어요, 내일 갈게요."),
    "Vietnamese marks time with đã / sẽ and does not change the verb; the Korean ending carries it.")
obj("verbs.requests_rules", "grammar", True, ["verbs.haeyo_present"], [("A1", "supports", "grammatical-accuracy")], "lex",
    ("Requests and workplace rules", "Lời nhờ và nội quy chỗ làm"),
    ("I can understand and use requests and rules — 앉으세요, 만지지 마세요, 도와주세요, 들어가도 돼요?, 여기서 담배를 피우면 안 돼요.",
     "Tôi có thể hiểu và dùng lời nhờ, lời yêu cầu và nội quy — 앉으세요, 만지지 마세요, 도와주세요, 들어가도 돼요?, 여기서 담배를 피우면 안 돼요."),
    "Taught as learned patterns with common verbs; the safety rules of a factory come first.")
obj("negation.an_mot", "grammar", True, ["verbs.haeyo_present"], [("A1", "supports", "grammatical-accuracy")], "lex",
    ("Saying no: 안, 못 and -지 않아요", "Phủ định: 안, 못 và -지 않아요"),
    ("I can say that I do not do something with 안 or -지 않아요, and that I cannot with 못 — 술을 안 마셔요, 오늘은 못 가요.",
     "Tôi có thể nói mình không làm việc gì bằng 안 hoặc -지 않아요, và không thể làm bằng 못 — 술을 안 마셔요, 오늘은 못 가요."),
    "The difference between 안 (I don't) and 못 (I can't) is assessed in choices and typed answers.")
obj("existence.itda", "grammar", True, ["particles.core"], [("A1", "supports", "grammatical-accuracy")], "lex",
    ("있어요 and 없어요", "있어요 và 없어요"),
    ("I can say that something is or is not somewhere, or that I have or do not have it, with 있어요 and 없어요 — 시간이 있어요, 표가 없어요.",
     "Tôi có thể nói ở đâu có hay không có gì, mình có hay không có gì bằng 있어요 và 없어요 — 시간이 있어요, 표가 없어요."))
obj("questions.question_words", "grammar", False, ["sentences.copula"], [("A1", "supports", "grammatical-accuracy")], "lex",
    ("Questions", "Câu hỏi"),
    ("I can ask questions with rising intonation and with 뭐, 어디, 언제, 누구, 얼마, 몇 and 왜 in the place of the answer — 화장실이 어디예요?",
     "Tôi có thể đặt câu hỏi bằng ngữ điệu lên giọng và bằng 뭐, 어디, 언제, 누구, 얼마, 몇, 왜 đặt vào chỗ của câu trả lời — 화장실이 어디예요?"))
obj("wants.goshipda", "grammar", False, ["verbs.haeyo_present"], [("A2", "supports", "grammatical-accuracy")], "lex",
    ("Wanting and liking", "Muốn và thích"),
    ("I can say what I want to do with -고 싶어요 and what I like with 좋아해요 or 이/가 좋아요.",
     "Tôi có thể nói việc mình muốn làm bằng -고 싶어요 và điều mình thích bằng 좋아해요 hoặc 이/가 좋아요."),
    "Learned patterns with common verbs and nouns; kept at A2 supports.")
obj("politeness.speech_levels", "grammar", True, ["verbs.haeyo_present"], [("A1", "supports", "sociolinguistic-appropriateness")], "lex",
    ("Speech levels: 해요, 합니다, 반말", "Mức độ lời nói: 해요, 합니다, 반말"),
    ("I can speak in the polite 해요 style, use the formal 합니다 style in set phrases and at work (알겠습니다, 수고하셨습니다), and recognize 반말 between friends.",
     "Tôi có thể nói kiểu lịch sự 해요, dùng kiểu trang trọng 합니다 trong câu cố định và ở chỗ làm (알겠습니다, 수고하셨습니다), và nhận ra 반말 giữa bạn bè."),
    "반말 is recognition only. Honorific verbs (계세요, 드세요) are taught in set phrases, not as a system.")

# ---------------------------------------------------------------- phonology and strategy
obj("pronunciation.batchim_sounds", "phonology", False, ["script.hangul"], [("A1", "supports", "phonological-control")], "listen",
    ("Final consonants and sound changes", "Phụ âm cuối và biến âm"),
    ("I can hear the three kinds of consonant (plain, tense, aspirated — 가 / 까 / 카), and I know that a final consonant moves to the next vowel (읽어요) or changes before ㄴ and ㅁ (합니다 [함니다]).",
     "Tôi có thể nghe ba loại phụ âm (thường, căng, bật hơi — 가 / 까 / 카), và biết phụ âm cuối nối sang nguyên âm sau (읽어요) hoặc đổi trước ㄴ, ㅁ (합니다 [함니다])."),
    "Contrast recognition only. The learner's own pronunciation is not assessed.")
obj("strategy.hanviet_loanwords", "strategy", False, [], [("A1", "supports", "identifying-cues-inferring")], "lex",
    ("Hán-Việt, loanwords and false friends", "Hán-Việt, từ mượn và “bạn giả”"),
    ("I can guess new words through their Sino-Vietnamese reading and English loanwords — 전화 \"điện thoại\", 커피 — and avoid false friends such as 공장, a factory, not a building site.",
     "Tôi có thể đoán nghĩa từ mới nhờ âm Hán-Việt và từ mượn tiếng Anh — 전화 điện thoại, 커피 — và tránh “bạn giả” như 공장 là nhà máy, không phải công trường."))

# ---------------------------------------------------------------- spoken reception
LISTEN_NOTE = "Clips are heard through the device's Korean voice (device-tts course, QC 2026-11-05 §2.1); an item the learner could not hear is skipped and is no evidence."
obj("listening.familiar_words", "spoken_reception", True, ["vocab.everyday_basics"], [("PRE_A1", "direct", "overall-listening-comprehension"), ("A1", "supports", "overall-listening-comprehension")], "listen",
    ("Hearing familiar words and phrases", "Nghe từ và cụm từ quen thuộc"),
    ("I can pick out familiar words and short learned phrases when they are said clearly and slowly.",
     "Tôi có thể nhận ra từ quen thuộc và cụm từ ngắn đã học khi nghe chúng được nói rõ và chậm."),
    f"Direct at Pre-A1 only: clear single words and short phrases, scored in the Section 3 checkpoint. {LISTEN_NOTE}")
obj("listening.short_info", "spoken_reception", True, ["listening.familiar_words", "numbers.two_systems"], [("A1", "direct", "audio-media-recordings"), ("PRE_A1", "supports", "overall-listening-comprehension")], "listen",
    ("Hearing facts in a short recording", "Nghe thông tin trong đoạn ghi âm ngắn"),
    ("I can catch concrete facts — a time, a price, a date, a place — in a short, clear, slow recording about daily life or work.",
     "Tôi có thể nghe ra thông tin cụ thể như giờ, giá, ngày, địa điểm trong một đoạn ghi âm ngắn, rõ và chậm về cuộc sống hằng ngày hay công việc."),
    f"Direct at A1: short recordings holding 1-3 facts, scored in the Section 3 checkpoint. {LISTEN_NOTE}")
obj("listening.announcements", "spoken_reception", True, ["listening.familiar_words"], [("A1", "direct", "announcements-instructions")], "listen",
    ("Announcements and safety instructions", "Thông báo và chỉ dẫn an toàn"),
    ("I can understand very short announcements and instructions spoken clearly and slowly — in the subway, in a shop, and the safety rules of a factory.",
     "Tôi có thể hiểu thông báo và chỉ dẫn rất ngắn nói rõ và chậm — trên tàu điện, trong cửa hàng, và nội quy an toàn ở nhà máy."),
    f"Direct at A1: subway, shop and workplace announcements and simple instructions, scored in the Section 3 checkpoint. {LISTEN_NOTE}")
obj("listening.short_dialogues", "spoken_reception", True, ["listening.familiar_words", "greetings.basic"], [("A1", "direct", "understanding-conversation")], "listen",
    ("Understanding short dialogues", "Nghe hiểu hội thoại ngắn"),
    ("I can follow the main point when two people say a few clear sentences to each other about daily life or work.",
     "Tôi có thể hiểu ý chính khi hai người nói rõ ràng với nhau vài câu về chuyện hằng ngày hoặc công việc."),
    f"Direct at A1: exchanges of 2-4 turns, the second speaker at a lower pitch, scored in the Section 3 checkpoint. The learner only listens. {LISTEN_NOTE}")

# ---------------------------------------------------------------- written reception
obj("reading.short_messages", "written_reception", True, ["reading.familiar_words"], [("A1", "direct", "reading-correspondence")], "read",
    ("Reading short messages", "Đọc tin nhắn ngắn"),
    ("I can understand short, simple messages from a co-worker or a boss about shifts, times and everyday tasks.",
     "Tôi có thể hiểu tin nhắn ngắn, đơn giản của đồng nghiệp hay cấp trên về ca làm, giờ giấc và việc cần làm hằng ngày."),
    "Direct at A1: original short messages in Hangul, read and answered in the Section 3 checkpoint.")
obj("reading.notices_info", "written_reception", True, ["reading.familiar_words"], [("A1", "direct", "reading-orientation")], "read",
    ("Signs, notices and timetables", "Biển báo, thông báo và lịch"),
    ("I can find the facts I need on signs and simple notices — 위험, 금연, 출입 금지, 비상구, opening hours, a recycling day, a shift table.",
     "Tôi có thể tìm thông tin cần thiết trên biển báo và thông báo đơn giản — 위험, 금연, 출입 금지, 비상구, giờ mở cửa, ngày phân loại rác, bảng ca làm."),
    "Direct at A1: original notices and schedules with locate-type questions, scored in the Section 3 checkpoint.")
obj("reading.short_texts", "written_reception", True, ["reading.familiar_words", "verbs.haeyo_present"], [("A1", "direct", "overall-reading-comprehension"), ("A2", "supports", "overall-reading-comprehension")], "read",
    ("Reading very short texts", "Đọc đoạn văn rất ngắn"),
    ("I can read a very short text about familiar people and routines, slowly and more than once if I need to.",
     "Tôi có thể đọc hiểu đoạn văn rất ngắn về người và sinh hoạt quen thuộc, đọc chậm và đọc lại khi cần."),
    "Direct at A1: original 2-5 sentence descriptions and small stories, scored in the Section 3 checkpoint. Longer texts and unfamiliar topics are not assessed.")

# ---------------------------------------------------------------- spoken production
obj("speaking.formulaic", "spoken_production", True, ["greetings.basic"], [("PRE_A1", "supports", "overall-oral-production"), ("A1", "direct", "overall-oral-production"), ("A1", "supports", "sociolinguistic-appropriateness")], "none",
    ("Saying set phrases aloud", "Nói các câu cố định thành tiếng"),
    ("I can say the everyday greetings, thanks, apologies and requests aloud — 안녕하세요, 죄송합니다, 먼저 가보겠습니다 — and choose the one that fits the moment.",
     "Tôi có thể nói thành tiếng lời chào, cảm ơn, xin lỗi và nhờ vả hằng ngày — 안녕하세요, 죄송합니다, 먼저 가보겠습니다 — và chọn câu hợp lúc."),
    "Assessed from what an on-device ko-KR speech recogniser heard: word recognition only, never a pronunciation-quality score. Spacing in the transcript is ignored.")
obj("speaking.self_intro", "spoken_production", True, ["sentences.copula", "verbs.haeyo_present"], [("A1", "direct", "sustained-monologue-describing"), ("A1", "supports", "overall-oral-production")], "none",
    ("Introducing yourself", "Tự giới thiệu"),
    ("I can introduce myself aloud in short sentences, as at an interview or on the first day at work — name, country, age, job, 처음 뵙겠습니다 and 잘 부탁드립니다.",
     "Tôi có thể tự giới thiệu thành tiếng bằng câu ngắn, như khi phỏng vấn hay ngày đầu đi làm — tên, nước, tuổi, việc làm, 처음 뵙겠습니다 và 잘 부탁드립니다."),
    "Assessed from recognized words in elicited sentences. The meaning cue is in Vietnamese; the Korean is never shown before the attempt.")
obj("speaking.give_info", "spoken_production", True, ["numbers.two_systems"], [("A1", "direct", "sustained-monologue-giving-information"), ("A1", "supports", "overall-oral-production")], "none",
    ("Giving simple facts aloud", "Nói thông tin đơn giản"),
    ("I can give simple facts aloud with numbers and common words — a phone number, a price, a time, a date, how many.",
     "Tôi có thể nói thông tin đơn giản bằng con số và từ thông dụng — số điện thoại, giá, giờ, ngày, số lượng."),
    "Recognised digits and spelled-out Sino or native numbers count as the same information; a wrong number is a wrong answer, and silence is never scored.")
obj("speaking.describe", "spoken_production", False, ["vocab.everyday_basics", "verbs.haeyo_present"], [("A1", "direct", "overall-oral-production"), ("A1", "supports", "sustained-monologue-describing")], "none",
    ("Describing aloud", "Mô tả thành tiếng"),
    ("I can describe familiar people, places and objects aloud in short phrases: what it is and one simple feature.",
     "Tôi có thể tả người, nơi chốn và đồ vật quen thuộc bằng cụm từ ngắn: đó là gì và một đặc điểm đơn giản của nó."),
    "Short separate phrases only: connected description is beyond this course's A1 claim.")

# ---------------------------------------------------------------- written production
obj("writing.personal_info", "written_production", True, ["writing.hangul_input", "sentences.copula"], [("A1", "direct", "overall-written-production"), ("A1", "direct", "overall-written-interaction"), ("A1", "supports", "orthographic-control")], "none",
    ("Writing about yourself", "Viết về bản thân"),
    ("I can write short sentences about myself in Hangul — name, age, country, where I live, my job.",
     "Tôi có thể viết những câu ngắn về bản thân bằng Hangul — tên, tuổi, nước, nơi ở và công việc."),
    "Assessed by guided rubric-scored writing with required information slots; open free writing is never scored evidence.")
obj("writing.phrases_sentences", "written_production", True, ["writing.personal_info", "verbs.haeyo_present"], [("A1", "direct", "overall-written-production"), ("A1", "supports", "grammatical-accuracy")], "none",
    ("Writing simple sentences", "Viết câu đơn giản"),
    ("I can write short sentences about familiar people and things — who does what, where, when — and join them with 그리고, 그런데, 그래서.",
     "Tôi có thể viết câu ngắn về người và việc quen thuộc — ai làm gì, ở đâu, khi nào — và nối câu bằng 그리고, 그런데, 그래서."),
    "Assessed by guided tasks whose rubric requires a verb from an authored list plus the task's information slots.")
obj("writing.short_message", "written_production", True, ["writing.personal_info", "vocab.time_calendar"], [("A1", "direct", "correspondence"), ("A1", "direct", "overall-written-interaction")], "none",
    ("Writing a short message", "Viết tin nhắn ngắn"),
    ("I can write a very short message to a boss or a co-worker: a greeting, one or two facts such as a time or a reason, and a polite closing.",
     "Tôi có thể viết tin nhắn rất ngắn cho cấp trên hay đồng nghiệp: lời chào, một hai thông tin như giờ hay lý do, và lời kết lịch sự."),
    "Assessed by guided tasks; the rubric requires the message's parts (greeting, fact, closing) and never judges style.")
obj("writing.form_filling", "written_production", False, ["writing.hangul_input", "numbers.two_systems"], [("A1", "direct", "notes-messages-forms")], "none",
    ("Filling in a form", "Điền biểu mẫu"),
    ("I can fill in a simple form at the employment centre, a clinic or a bank — 이름, 주소, 전화번호, 생년월일, 외국인 등록 번호 — in Hangul and numbers.",
     "Tôi có thể điền biểu mẫu đơn giản ở trung tâm việc làm, phòng khám hay ngân hàng — 이름, 주소, 전화번호, 생년월일, 외국인 등록 번호 — bằng Hangul và chữ số."),
    "Assessed by separate labelled fields checked against the cue facts; an empty form is insufficient evidence, never a failure.")

# ---------------------------------------------------------------- interaction
obj("interaction.everyday_conversation", "interaction", True, ["speaking.formulaic", "speaking.self_intro", "listening.short_dialogues"], [("A1", "direct", "overall-oral-interaction"), ("A1", "direct", "conversation")], "none",
    ("Short conversations", "Trò chuyện ngắn"),
    ("I can take part in a short conversation with a patient partner — greet, introduce myself at work, answer simple interview questions — and ask for a repeat (다시 말해 주세요).",
     "Tôi có thể tham gia cuộc trò chuyện ngắn với người kiên nhẫn — chào hỏi, giới thiệu mình ở chỗ làm, trả lời câu hỏi phỏng vấn đơn giản — và nhờ nhắc lại (다시 말해 주세요)."),
    "Assessed by multi-turn deterministic scenarios where the recognized meaning decides the partner's next turn; the partner's lines are read by the device voice. Asking for a repeat is never penalized; a technical failure is insufficient evidence.")
obj("interaction.practical_needs", "interaction", True, ["speaking.give_info", "listening.short_info", "numbers.two_systems"], [("A1", "direct", "obtaining-goods-services"), ("A1", "direct", "information-exchange")], "none",
    ("Practical tasks in Korea", "Việc thực tế ở Hàn Quốc"),
    ("I can handle very simple tasks — pay at a convenience store, open a bank account, see a doctor, ask at the employment centre, phone my workplace to say I am ill — and understand the short answer.",
     "Tôi có thể xử lý việc rất đơn giản — trả tiền ở cửa hàng tiện lợi, mở tài khoản ngân hàng, đi khám, hỏi ở trung tâm việc làm, gọi điện báo chỗ làm là mình ốm — và hiểu câu trả lời ngắn."),
    "Assessed by multi-turn scenario items at a convenience store, a bank, a clinic, the employment centre, on the phone and at work. Passing needs the goal met and first-attempt intent matches on scored turns.")

for r in OUT:
    if not r["canDo"]["vi"].startswith("Tôi có thể") or len(r["canDo"]["vi"]) > 220:
        raise SystemExit(f"can-do rule: {r['id']} ({len(r['canDo']['vi'])} chars)")
ids = [r["id"] for r in OUT]
for r in OUT:
    for p in r["prerequisites"]:
        if p not in ids:
            raise SystemExit(f"{r['id']}: unknown prerequisite {p}")

os.makedirs(f"{ROOT}/content/ko/_drafts/objectives", exist_ok=True)
with open(f"{ROOT}/content/ko/_drafts/objectives/OUTPUT.jsonl", "w", encoding="utf-8", newline="\n") as f:
    for r in OUT:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
with open(f"{ROOT}/content/ko/_drafts/objectives/topik-references.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump({
        "generator": "content/ko/_drafts/_generators/ko-objectives.py",
        "source": "TOPIK I (한국어능력시험 I, levels 1–2), National Institute for International Education (NIIED), https://www.topik.go.kr/ — cited by section and level only; no item, can-do or syllabus text is reproduced.",
        "checkedAgainstOfficialSource": True,
        "checkedAt": "2026-11-05",
        "checkedWith": "한국어능력시험(TOPIK) 기본운영규정, 규정 제204호 (2024.9.12), NIIED — https://www.niied.go.kr/convert/preview/1764681490990/index.html; see content/ko/exam/FORMAT-SOURCES.md (ko-topik-format.py)",
        "note": "TOPIK I tests listening (듣기) and reading (읽기) only. Each objective names the TOPIK I section it prepares, or null when TOPIK I does not test it (speaking, writing, interaction). TOPIK levels are not CEFR levels and the app never says they are. The section names and the level range are to be checked against topik.go.kr before the exam-track session records `checkedAgainstOfficialGuide`.",
        "objectives": TOPIK_ROWS,
    }, f, ensure_ascii=False, indent=2)
    f.write("\n")


def write_staged(rel, text):
    path = f"{STAGED}/{rel}"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def write_json(rel, doc):
    write_staged(rel, json.dumps(doc, ensure_ascii=False, indent=2) + "\n")


write_json("content/ko/assessment/claim-policy.json", {
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
    "spoken_reception": "Facts in a recording, announcements and safety instructions, and dialogues: the three A1 listening activities the Section 3 checkpoint scores, heard through the device voice. An item that could not be heard is skipped and counts nowhere. Word recognition is direct at Pre-A1 only and is not listed here.",
    "written_reception": "Messages, notices and short texts: the three A1 reading activities the Section 3 checkpoint scores. Hangul and word recognition are direct at Pre-A1 only or supporting, and are not listed here.",
    "spoken_production": "Set phrases, self-introduction and simple facts: what a Vietnamese worker needs first in Korea, all checked from recognized words.",
    "written_production": "Personal facts, sentences and a short message: the three guided writing activities the Section 5 checkpoint scores.",
    "interaction": "Conversation and practical tasks together: an A1 estimate needs both talking with someone and getting something done.",
}
EXCLUDED = {
    "ko.obj.speaking.describe": "Short separate phrases only. It is practiced and reported on its own; the estimate does not depend on it.",
    "ko.obj.writing.form_filling": "Discrete labelled fields. It is practiced and reported on its own, and proves less than guided sentences do, so the estimate does not depend on it.",
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
write_json("content/ko/assessment/attainment.json", {
    "version": 1,
    "language": "ko",
    "level": "A1",
    "principle": "A learner's CEFR-aligned A1 estimate counts a communicative domain as demonstrated only when EVERY objective listed for that domain below carries a real 'demonstrated' checkpoint verdict under the latest-attempt policy. The list is the authored denominator: it names every essential objective that is aligned directly to an A1 descriptor scale in the domain. Non-essential direct objectives are listed under excludedObjectiveIds with the pedagogical reason; nothing is omitted silently. The A1 Capstone samples one representative objective per domain and therefore can contribute evidence but can never complete a domain on its own.",
    "domains": domains,
})

register = "\n".join(f"| `cefr-cv-2020:{k}` | {v} |" for k, v in SCALE.items())
write_staged("content/ko/assessment/RESEARCH.md", f"""# ko-vi assessment research base (clean-room)

Authored for this project (P4e, 2026-11-05). It is the provenance register for the
`sourceRef` keys used in `objectives.json` and records how the Korean objectives
were derived. **No CEFR descriptor text and no TOPIK item, can-do or syllabus text is
reproduced anywhere in this repository.** The structure follows the RESEARCH.md of the
French, Spanish, German, Italian, English and Japanese courses; what they say about the
framework model, the claim gate and parallel forms applies unchanged and is not repeated
here.

## Primary sources

- **Council of Europe, CEFR Companion Volume (2020)**: *Common European Framework of
  Reference for Languages: Learning, teaching, assessment. Companion Volume*, Council
  of Europe Publishing, Strasbourg, 2020.
  https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4
- **TOPIK I (한국어능력시험 I)**, National Institute for International Education:
  https://www.topik.go.kr/ — levels 1 and 2; sections 듣기 (listening) and 읽기 (reading).
  Each objective names the TOPIK I section it prepares in
  `content/ko/_drafts/objectives/topik-references.json`, checked on 2026-11-05 against the
  administrator's regulation (기본운영규정 제204호, 2024.9.12; content/ko/exam/FORMAT-SOURCES.md:
  듣기 30 items / 40 min, 읽기 40 items / 60 min, 1급 from 80 and 2급 from 140 of 200). TOPIK levels are not
  CEFR levels, and this course never says that they are.
- **EPS-TOPIK** (the Employment Permit System test run by HRD Korea) shares the scenario
  world of this course — factory, farm, safety, the employment centre — but the course
  reproduces neither its items nor its word list.

## How the Korean objectives were derived

The objectives keep the construct families and CEFR scale alignments of the other
courses (`plan/authoring/BLUEPRINT.md` §8). Every `title`, `canDo` and `evidenceNote`
was written for Korean and for Vietnamese adults who work or will work in Korea (EPS):
scenarios at a factory, a farm, a convenience store, the employment centre (고용센터), a
bank, a clinic and on the phone to an employer replace some travel settings. The script
and grammar families differ most, because the transfer problems differ:

| Objective | Why it exists |
|---|---|
| `ko.obj.script.hangul` | an alphabet in syllable blocks; the Hangul primer before Section 1 |
| `ko.obj.script.hanviet` | Sino-Korean words share Hán-Việt roots (가족 gia tộc) |
| `ko.obj.writing.hangul_input` | typing blocks with a final consonant; from Section 2 on |
| `ko.obj.sentences.copula` | N이에요/예요 at the end, where Vietnamese puts "là" in the middle |
| `ko.obj.particles.core` | particles mark roles that Vietnamese shows by word order; two forms each |
| `ko.obj.verbs.haeyo_present` | the verb changes and comes last (SOV) |
| `ko.obj.verbs.past_future` | the ending carries tense, where Vietnamese uses đã / sẽ |
| `ko.obj.verbs.requests_rules` | -(으)세요, -지 마세요, -아/어도 돼요: the language of workplace rules |
| `ko.obj.negation.an_mot` | 안 (don't) against 못 (can't); one Vietnamese "không" |
| `ko.obj.existence.itda` | 있어요/없어요 for "có" and "không có" |
| `ko.obj.numbers.two_systems` | Sino-Korean and native numbers, each with its counters |
| `ko.obj.politeness.speech_levels` | 해요체 by default, 합쇼체 in set phrases and at work, 반말 recognised |
| `ko.obj.pronunciation.batchim_sounds` | plain / tense / aspirated consonants; finals that move or change |
| `ko.obj.strategy.hanviet_loanwords` | Hán-Việt and English loans, false friends (공장, 출구, 시험) |

The speaking objectives cue meaning in **Vietnamese**; the Korean target is never
shown before the attempt. Speech is recognised with the `ko-KR` recogniser; spacing in a
transcript is ignored (P4b ko plugin).

## Audio (QC 2026-11-05 §2.1)

ko-vi bundles no audio yet (D-11: no Korean voice with a clean lineage). Listening items
are graded through the device's own Korean voice when one is installed; without one an
item says so, gives the install hint and is skipped. A skipped item is no evidence, so
the claim gate counts only listening items the learner actually heard.

## sourceRef register

Every `cefrAlignments[].sourceRef` in `objectives.json` uses a key below. Keys name
the CEFR scale consulted; they are references, not quotations.

| key | CEFR scale (Companion Volume 2020) |
|---|---|
{register}

## Descriptor paraphrase policy

- Learner-facing `canDo` text is original wording written for this course's actual
  content, in Vietnamese, with an English version for the build tools. It never copies
  Companion Volume descriptor sentences or TOPIK material.
- Alignments record only level, scale name, relation and `sourceRef`.

## direct vs supports

Same rule as the other courses: `direct` only where the course genuinely assesses the
communicative ability at that level within its stated scope (evidence notes say what
is NOT assessed); everything else is `supports`. Doubt resolves to `supports`.

## Word lists

No allowlisted Korean learner list can be fetched: the NIKL 한국어 학습용 어휘 목록 (KOGL
Type 1) is an owner download (OWNER-FINAL-CHECKLIST C). Word choice is anchored on
frequency (`content/ko/lexicon/REVIEW.md`). A list level is never an input to a level
claim, and vocabulary counts never are.

## Exam track

The TOPIK I practice track (later session) reproduces the public format of 듣기 and 읽기
with original items only, never past papers. Its readiness message is "mức sẵn sàng ước
tính", never a promise to pass.

## Assessment limitations

As for the other courses: recognized words only for speech (never a pronunciation-quality
score), rubric slots for writing, deterministic scenarios for interaction. Listening is
heard through the device voice, whose quality varies by phone; an item the learner could
not hear counts nowhere. The A1 estimate is a CEFR-aligned estimate, not an official
examination or certification.
""")
print(len(OUT), "objectives,", sum(o["essential"] for o in OUT), "essential")
