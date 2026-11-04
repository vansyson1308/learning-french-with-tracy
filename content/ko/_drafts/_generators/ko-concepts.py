"""Concept cards of ko-vi: content/ko/_drafts/concepts/OUTPUT.jsonl (P4e session 2), and the paradigm tables of the
conjugationCloze verbs (ko_paradigms.py) as {paradigm: …} records.

31 cards for the grammar points of ko-plan.md §3 and the brief: Hangul, the three consonant series, 받침 and the sound
changes; greetings, speech levels, the copula; the particles in pairs (은/는, 이/가, 을/를, 에/에서, 도/만/하고/의);
해요체 and the irregular stems, 있어요/없어요, adjectives; the two number systems with counters, time and dates, the
homographs (개 dog / counter — coordinator decision 2026-11-05: no sense-keyed lexemes for v1.0); 안/못, -고 싶어요,
requests, rules, past, future, question words, 이/그/저, Hán-Việt and loanwords, connectors, family address.
Every Korean example passes the lesson checks (ko_text.Index). The staged registry gets the course's source
`original-korean-course` (content/sources/registry.json plus that entry; the committed registry feeds the
golden-pinned ATTRIBUTIONS.md, so it is staged like the rest of ko-vi until promote).
usage: python -I ko-concepts.py <repo root>
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from ko_paradigms import table_records  # noqa: E402
from ko_text import Index, load_lexicon  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")
ROOT = sys.argv[1]
OUT = f"{ROOT}/content/ko/_drafts/concepts/OUTPUT.jsonl"
COURSE = {"source": "original-korean-course"}
LEXL = load_lexicon(ROOT)
INDEX = Index(LEXL)
recs = []
problems = []


def ex(target, vi, en, note_vi=None, note_en=None):
    for p in INDEX.problems(target):
        problems.append(f"{target}: {p}")
    e = {"target": target, "translations": {"vi": vi, "en": en}}
    if note_vi:
        e["note"] = {"vi": note_vi, "en": note_en}
    return e


def concept(cid, title, short, expl, examples, exceptions, hint, objectives):
    if len(short[0]) > 140:
        problems.append(f"{cid}: shortRule {len(short[0])} chars")
    if len(expl[0]) > 700:
        problems.append(f"{cid}: explanation {len(expl[0])} chars")
    recs.append({
        "id": f"ko:concept:{cid}",
        "title": {"vi": title[0], "en": title[1]},
        "shortRule": {"vi": short[0], "en": short[1]},
        "explanation": {"vi": expl[0], "en": expl[1]},
        "examples": examples,
        "exceptions": [{"vi": v, "en": e} for v, e in exceptions],
        "memoryHint": {"vi": hint[0], "en": hint[1]},
        "objectives": [f"ko.obj.{o}" for o in objectives],
        "sourceRefs": [COURSE],
    })


# ---------------------------------------------------------------- script and sounds
concept("hangul",
        ("Chữ Hangul và khối âm tiết", "Hangul and syllable blocks"),
        ("Mỗi khối là một âm tiết: phụ âm đầu + nguyên âm (+ phụ âm cuối). Âm tiết bắt đầu bằng nguyên âm dùng ㅇ câm.", "Each block is a syllable: first consonant + vowel (+ final consonant). A vowel-initial syllable takes a silent ㅇ."),
        ("Tiếng Việt viết các chữ cái nối thành hàng: \"học\". Tiếng Hàn xếp chữ cái (jamo) thành một khối vuông cho mỗi âm tiết: ㅎ + ㅏ + ㄱ = 학. Nguyên âm dọc (ㅏ ㅓ ㅣ) đứng bên phải phụ âm, nguyên âm ngang (ㅗ ㅜ ㅡ) nằm dưới. Phụ âm cuối (받침) luôn ở dưới cùng. Khối mở đầu bằng nguyên âm thì viết ㅇ câm: 아, 우. Học thuộc 14 phụ âm và 10 nguyên âm cơ bản là bạn đánh vần được hầu hết từ.",
         "Vietnamese writes letters in a row; Korean stacks its letters (jamo) into one square block per syllable: ㅎ + ㅏ + ㄱ = 학. A vertical vowel (ㅏ ㅓ ㅣ) stands right of the consonant, a horizontal one (ㅗ ㅜ ㅡ) under it. The final consonant (받침) always sits at the bottom. A syllable that starts with a vowel is written with a silent ㅇ: 아, 우. Learn the 14 basic consonants and 10 vowels and you can sound out most words."),
        [ex("가방", "cái túi", "bag", "ㄱ+ㅏ, ㅂ+ㅏ+ㅇ: nguyên âm dọc bên phải", "ㄱ+ㅏ, ㅂ+ㅏ+ㅇ: vertical vowels to the right"),
         ex("우유", "sữa", "milk", "ㅇ câm + ㅜ, ㅇ + ㅠ: nguyên âm ngang nằm dưới", "silent ㅇ + ㅜ, ㅇ + ㅠ: horizontal vowels below"),
         ex("한국", "Hàn Quốc", "Korea", "ㅎ+ㅏ+ㄴ, ㄱ+ㅜ+ㄱ: phụ âm cuối ở dưới cùng", "ㅎ+ㅏ+ㄴ, ㄱ+ㅜ+ㄱ: finals at the bottom")],
        [("ㅇ ở đầu khối không đọc; ở cuối khối đọc là «ng»: 강 «kang».", "ㅇ is silent at the start of a block and reads «ng» at the end: 강.")],
        ("Mỗi khối là một tiếng, như một chữ trong tiếng Việt.", "One block, one syllable, like one Vietnamese word."),
        ["script.hangul", "reading.familiar_words"])

concept("consonant-series",
        ("Phụ âm thường, căng và bật hơi", "Plain, tense and aspirated consonants"),
        ("ㄱ ㄷ ㅂ ㅅ ㅈ có hai anh em: căng (ㄲ ㄸ ㅃ ㅆ ㅉ) và bật hơi (ㅋ ㅌ ㅍ ㅊ). Ba âm khác nghĩa: 달, 딸, 탈.", "ㄱ ㄷ ㅂ ㅅ ㅈ each have a tense twin (ㄲ ㄸ ㅃ ㅆ ㅉ) and most an aspirated one (ㅋ ㅌ ㅍ ㅊ): 달, 딸, 탈 differ."),
        ("Tiếng Việt phân biệt \"t\" và \"th\"; tiếng Hàn có ba mức. Phụ âm thường (ㄱ ㄷ ㅂ ㅈ) nhẹ, hơi thở vừa. Phụ âm căng (ㄲ ㄸ ㅃ ㅉ ㅆ) siết cổ họng, không có hơi, gần \"c, t, p\" rất gọn của tiếng Việt: 딸 gần «tal». Phụ âm bật hơi (ㅋ ㅌ ㅍ ㅊ) có luồng hơi mạnh, gần \"kh, th\": 탈. Đặt tờ giấy trước miệng: âm bật hơi làm giấy rung mạnh nhất. Đây chỉ là so sánh gần đúng.",
         "Vietnamese contrasts t and th; Korean has three levels. Plain ㄱ ㄷ ㅂ ㅈ are light with a little breath. Tense ㄲ ㄸ ㅃ ㅉ ㅆ tighten the throat with no breath: 딸. Aspirated ㅋ ㅌ ㅍ ㅊ carry a strong puff: 탈. Hold a sheet of paper before your mouth: the aspirated ones move it most. These comparisons are approximate."),
        [ex("달", "mặt trăng", "moon", "ㄷ thường", "plain ㄷ"),
         ex("딸", "con gái", "daughter", "ㄸ căng", "tense ㄸ"),
         ex("불", "lửa; đèn", "fire; light", "ㅂ thường", "plain ㅂ"),
         ex("코", "mũi", "nose", "ㅋ bật hơi", "aspirated ㅋ")],
        [("RR (chữ La-tinh dưới Hangul) viết căng bằng hai chữ: ㄸ là tt, ㄲ là kk. Đừng đọc thành hai âm.", "In RR a tense consonant is a double letter: ㄸ tt, ㄲ kk — one sound, not two.")],
        ("Thường: nhẹ. Căng: siết. Bật hơi: thổi.", "Plain: light. Tense: tight. Aspirated: a puff."),
        ["pronunciation.batchim_sounds", "script.hangul"])

concept("batchim",
        ("Phụ âm cuối (받침): bảy âm", "Final consonants (받침): seven sounds"),
        ("Ở cuối âm tiết, mọi phụ âm chỉ đọc thành 7 âm: k, n, t, l, m, p, ng. 옷, 낮, 꽃 đều kết thúc bằng âm «t».", "At the end of a syllable every consonant reads as one of seven sounds: k, n, t, l, m, p, ng. 옷, 낮, 꽃 all end in «t»."),
        ("Tiếng Việt cũng chỉ có vài âm cuối: c, t, p, n, m, ng. Tiếng Hàn giống vậy: viết nhiều chữ cuối khác nhau, nhưng đọc gọn thành 7 âm. ㄱ ㅋ ㄲ đọc «k»; ㄷ ㅅ ㅈ ㅊ ㅌ ㅎ ㅆ đọc «t»; ㅂ ㅍ đọc «p»; còn ㄴ ㄹ ㅁ ㅇ giữ âm của chúng. Âm cuối không bật ra, giống \"học\", \"hát\", \"họp\" của tiếng Việt. Hai chữ cuối (값, 앉다) thường chỉ đọc một chữ: 값 đọc «kap».",
         "Vietnamese has only a few final sounds too: c, t, p, n, m, ng. Korean writes many final letters but reads seven sounds. ㄱ ㅋ ㄲ read k; ㄷ ㅅ ㅈ ㅊ ㅌ ㅎ ㅆ read t; ㅂ ㅍ read p; ㄴ ㄹ ㅁ ㅇ keep their sound. Finals are unreleased, as in Vietnamese. A double final (값, 앉다) usually reads one letter: 값 is «kap»."),
        [ex("옷", "quần áo", "clothes", "ㅅ cuối đọc «t»", "final ㅅ reads t"),
         ex("꽃", "hoa", "flower", "ㅊ cuối đọc «t»", "final ㅊ reads t"),
         ex("부엌", "bếp", "kitchen", "ㅋ cuối đọc «k»", "final ㅋ reads k"),
         ex("값", "giá", "price", "ㅄ đọc «p»", "ㅄ reads p")],
        [("Chữ cuối kép đọc chữ nào tùy từ: 닭 đọc «tak», 여덟 đọc «yeo-deol». Học từng từ.", "Which letter of a double final is read depends on the word: 닭 «tak», 여덟 «yeodeol»."),
         ("Khi âm sau bắt đầu bằng nguyên âm, chữ cuối được đọc đầy đủ (xem thẻ nối âm).", "Before a vowel the final is read in full (see the liaison card).")],
        ("Bảy âm cuối: k n t l m p ng — như \"học, hát, họp\".", "Seven finals: k n t l m p ng."),
        ["pronunciation.batchim_sounds", "writing.hangul_input"])

concept("sound-changes",
        ("Nối âm và biến âm", "Liaison and sound changes"),
        ("Chữ cuối nối sang nguyên âm sau (한국어 «han-gu-geo»); ㅂ/ㄱ trước ㄴ, ㅁ đọc thành ㅁ/ㅇ (합니다 «ham-ni-da»).", "A final moves onto a following vowel (한국어 han-gu-geo); ㅂ/ㄱ before ㄴ, ㅁ become ㅁ/ㅇ (합니다 ham-ni-da)."),
        ("Tiếng Hàn đọc liền các khối. Nối âm (연음): chữ cuối chuyển sang khối sau khi khối sau bắt đầu bằng ㅇ: 음악 đọc «eu-mak», 옷이 «o-si». Mũi hoá (비음화): ㅂ, ㄷ, ㄱ trước ㄴ hoặc ㅁ đọc thành ㅁ, ㄴ, ㅇ: 합니다 «ham-ni-da», 감사합니다 «gam-sa-ham-ni-da». Bật hơi: ㅎ gặp ㄱ ㄷ ㅂ ㅈ thành ㅋ ㅌ ㅍ ㅊ: 좋다 «jo-ta». Căng hoá (경음화): sau ㄱ ㄷ ㅂ, phụ âm thường đọc căng: 학교 «hak-kkyo». Chữ viết không đổi; chỉ cách đọc đổi.",
         "Korean reads blocks together. Liaison (연음): a final moves to the next block when it starts with ㅇ: 음악 eu-mak, 옷이 o-si. Nasalisation (비음화): ㅂ ㄷ ㄱ before ㄴ or ㅁ become ㅁ ㄴ ㅇ: 합니다 ham-ni-da. Aspiration: ㅎ with ㄱ ㄷ ㅂ ㅈ gives ㅋ ㅌ ㅍ ㅊ: 좋다 jo-ta. Tensing (경음화): after ㄱ ㄷ ㅂ a plain consonant is read tense: 학교 hak-kkyo. The spelling never changes, only the sound."),
        [ex("한국어", "tiếng Hàn", "Korean", "nối âm: «han-gu-geo»", "liaison: han-gu-geo"),
         ex("감사합니다.", "Cảm ơn.", "Thank you.", "ㅂ trước ㄴ đọc ㅁ: «ham-ni-da»", "ㅂ before ㄴ reads ㅁ"),
         ex("좋아요.", "Tốt.", "Good.", "ㅎ trước nguyên âm thì câm: «jo-a-yo»", "ㅎ before a vowel is silent"),
         ex("학교", "trường học", "school", "căng hoá: «hak-kkyo»", "tensing: hak-kkyo")],
        [("RR viết theo cách đọc ở nối âm và mũi hoá (hamnida), nhưng không ghi căng hoá: 학교 vẫn là hakgyo.", "RR follows liaison and nasalisation (hamnida) but does not mark tensing: 학교 stays hakgyo.")],
        ("Đọc cả cụm một hơi, đừng ngắt từng khối.", "Read the whole word in one breath."),
        ["pronunciation.batchim_sounds", "listening.familiar_words"])

# ---------------------------------------------------------------- greetings and speech levels
concept("greetings",
        ("Chào và tạm biệt", "Hello and goodbye"),
        ("안녕하세요 dùng cả ngày. Tạm biệt có hai câu: 안녕히 가세요 (người kia đi) và 안녕히 계세요 (người kia ở lại).", "안녕하세요 works all day. Goodbye has two forms: 안녕히 가세요 (they leave) and 안녕히 계세요 (they stay)."),
        ("Tiếng Việt chào kèm cách gọi: chào anh, chào chị. Tiếng Hàn không cần đại từ: 안녕하세요 dùng với mọi người, sáng trưa tối đều được. Khi chia tay, chọn câu theo ai ở lại: bạn ra về thì nói 안녕히 계세요 với người ở lại; người khác ra về thì nói 안녕히 가세요. Cảm ơn: 감사합니다 trang trọng, 고마워요 thân mà vẫn lịch sự. Xin lỗi: 죄송합니다 trang trọng, 미안해요 nhẹ hơn. Ở chỗ làm, hết ca thì nói 수고하셨습니다.",
         "Vietnamese greets with a form of address; Korean needs none: 안녕하세요 suits everyone, at any hour. When parting, pick by who stays: you leave → 안녕히 계세요 to the one staying; they leave → 안녕히 가세요. Thanks: 감사합니다 formal, 고마워요 warm but polite. Sorry: 죄송합니다 formal, 미안해요 lighter. At work, end the shift with 수고하셨습니다."),
        [ex("안녕하세요.", "Xin chào.", "Hello."),
         ex("안녕히 계세요.", "Tôi về nhé (anh chị ở lại).", "Goodbye (you stay)."),
         ex("안녕히 가세요.", "Anh chị về nhé.", "Goodbye (you go)."),
         ex("수고하셨습니다.", "Anh chị vất vả rồi.", "Thanks for your hard work.")],
        [("안녕 (không có 하세요) chỉ dùng với bạn bè cùng tuổi hoặc trẻ em, không dùng với cấp trên.", "안녕 alone is for friends and children only, never for a boss.")],
        ("Ai đi thì 가세요, ai ở thì 계세요.", "The one who goes gets 가세요, the one who stays 계세요."),
        ["greetings.basic", "speaking.formulaic"])

concept("speech-levels",
        ("Ba kiểu nói: 해요, 합니다 và 반말", "Three speech levels: 해요, 합니다 and 반말"),
        ("Khoá học dùng kiểu 해요 (đuôi -요). Kiểu 합니다 (-습니다) cho câu cố định và lúc trang trọng; 반말 chỉ với bạn thân.", "The course speaks 해요 (ending in -요). 합니다 (-습니다) is for set phrases and formal moments; 반말 only for close friends."),
        ("Tiếng Việt thể hiện lịch sự bằng từ xưng hô và \"ạ\"; tiếng Hàn đổi đuôi động từ. 해요체: 가요, 먹어요 — lịch sự, thân thiện, dùng hằng ngày với đồng nghiệp, người bán hàng. 합쇼체: 갑니다, 감사합니다 — trang trọng, dùng khi phỏng vấn, báo cáo, thông báo. 반말: 가, 먹어 — thân mật, chỉ với bạn bè cùng tuổi, người nhỏ tuổi hơn. Với cấp trên, đừng bao giờ dùng 반말. Khi không chắc, dùng 해요.",
         "Vietnamese marks politeness with forms of address and ạ; Korean changes the verb ending. 해요체 (가요, 먹어요): polite and friendly, for everyday talk with colleagues and shop staff. 합쇼체 (갑니다, 감사합니다): formal, for interviews, reports, announcements. 반말 (가, 먹어): intimate, only with friends your age or younger people. Never use 반말 with a boss. When unsure, use 해요."),
        [ex("내일 가요.", "Mai tôi đi.", "I'm going tomorrow.", "해요: lịch sự hằng ngày", "해요: everyday polite"),
         ex("내일 갑니다.", "Mai tôi đi.", "I am going tomorrow.", "합니다: trang trọng", "합니다: formal"),
         ex("알겠습니다.", "Tôi hiểu rồi ạ.", "Understood.", "câu cố định ở chỗ làm", "a set phrase at work")],
        [("Một số câu cố định chỉ có kiểu 합니다: 감사합니다, 처음 뵙겠습니다, 알겠습니다.", "Some set phrases exist only in 합니다 style: 감사합니다, 처음 뵙겠습니다, 알겠습니다.")],
        ("Có -요 là an toàn.", "With -요 you are safe."),
        ["politeness.speech_levels", "speaking.formulaic"])

concept("copula",
        ("Câu \"A là B\": 이에요 / 예요, 아니에요", "\"A is B\": 이에요 / 예요, 아니에요"),
        ("Sau phụ âm: N이에요; sau nguyên âm: N예요. Phủ định: N이/가 아니에요. Trang trọng: N입니다.", "After a consonant N이에요, after a vowel N예요. Negative: N이/가 아니에요. Formal: N입니다."),
        ("Tiếng Việt nói \"Tôi là sinh viên\": \"là\" đứng giữa. Tiếng Hàn đặt \"là\" vào cuối, dính liền danh từ: 학생이에요. Chọn theo âm cuối: 학생 kết thúc bằng phụ âm ㅇ nên dùng 이에요; 의사 kết thúc bằng nguyên âm nên dùng 예요. Phủ định không dùng 이에요: N이/가 아니에요 (학생이 아니에요, 의사가 아니에요). Câu hỏi giữ nguyên, chỉ lên giọng: 학생이에요? Kiểu trang trọng 입니다 không đổi theo âm cuối.",
         "Vietnamese puts \"là\" in the middle; Korean puts it at the end, attached to the noun: 학생이에요. Pick by the last sound: 학생 ends in a consonant, so 이에요; 의사 ends in a vowel, so 예요. The negative drops 이에요: N이/가 아니에요. A question keeps the form and rises: 학생이에요? Formal 입니다 never changes."),
        [ex("저는 학생이에요.", "Tôi là học sinh.", "I'm a student."),
         ex("어머니는 의사예요.", "Mẹ tôi là bác sĩ.", "My mother is a doctor."),
         ex("저는 한국 사람이 아니에요.", "Tôi không phải là người Hàn.", "I'm not Korean."),
         ex("저는 응우옌 남입니다.", "Tôi là Nguyễn Nam.", "I am Nguyen Nam.", "trang trọng, khi phỏng vấn", "formal, at an interview")],
        [("Sau 아니에요 không có 이에요: đừng nói 아니에요이에요. 아니요 (không) là một từ khác.", "아니에요 takes no 이에요; 아니요 (no) is another word.")],
        ("Phụ âm + 이에요, nguyên âm + 예요.", "Consonant + 이에요, vowel + 예요."),
        ["sentences.copula", "particles.core"])

# ---------------------------------------------------------------- particles
concept("topic-eun-neun",
        ("Trợ từ chủ đề 은 / 는", "The topic particle 은 / 는"),
        ("은/는 đánh dấu điều mình đang nói đến: 저는… (còn tôi thì…). Sau phụ âm 은, sau nguyên âm 는.", "은/는 marks what you are talking about: 저는… (as for me…). 은 after a consonant, 는 after a vowel."),
        ("Tiếng Việt không có trợ từ; trật tự từ cho biết ai làm gì. Tiếng Hàn gắn trợ từ (조사) sau danh từ. 은/는 nghĩa gần \"còn … thì\": nó nêu chủ đề của câu, nhất là khi giới thiệu mình hay so sánh. 저는 베트남 사람이에요: còn tôi thì là người Việt. Chọn theo âm cuối: 이름은 (phụ âm), 저는 (nguyên âm). Khi chủ đề đã rõ, người Hàn thường bỏ luôn: 학생이에요.",
         "Vietnamese has no particles; word order shows who does what. Korean attaches particles (조사) to nouns. 은/는 is close to \"as for\": it sets the topic, especially when introducing yourself or contrasting. Pick by the last sound: 이름은 (consonant), 저는 (vowel). When the topic is clear, Koreans often drop it: 학생이에요."),
        [ex("저는 남이에요.", "Tôi là Nam.", "I'm Nam."),
         ex("제 이름은 란이에요.", "Tên tôi là Lan.", "My name is Lan."),
         ex("오늘은 바빠요.", "Hôm nay (thì) tôi bận.", "Today I'm busy.", "은 cho thấy so sánh với ngày khác", "은 contrasts with other days")],
        [("Bỏ 저는 là bình thường khi ai cũng biết bạn nói về mình.", "Dropping 저는 is normal when everyone knows you mean yourself.")],
        ("은/는 = \"còn … thì\".", "은/는 = \"as for …\"."),
        ["particles.core", "sentences.copula"])

concept("subject-i-ga",
        ("Trợ từ chủ ngữ 이 / 가, và khác 은 / 는", "The subject particle 이 / 가, and how it differs from 은 / 는"),
        ("이/가 chỉ ai, cái gì làm việc hoặc ở đâu đó, nhất là thông tin mới và với 있어요, 없어요, 아파요. Sau phụ âm 이, sau nguyên âm 가.", "이/가 marks who or what does or is, especially new information and with 있어요, 없어요, 아파요. 이 after a consonant, 가 after a vowel."),
        ("Cả 은/는 và 이/가 đều đứng sau chủ ngữ, nhưng nhiệm vụ khác. 은/는 nêu chủ đề đã biết; 이/가 đưa thông tin mới, trả lời câu hỏi \"ai? cái gì?\". 누가 와요? — 민수 씨가 와요. Với 있어요, 없어요 và cảm giác trong người, dùng 이/가: 시간이 있어요, 머리가 아파요. Ba dạng đặc biệt: 저 + 가 = 제가, 나 + 가 = 내가, 누구 + 가 = 누가. Mới học, hãy theo mẫu từng câu.",
         "Both 은/는 and 이/가 follow the subject, with different jobs. 은/는 sets a known topic; 이/가 brings new information and answers \"who? what?\": 누가 와요? — 민수 씨가 와요. With 있어요, 없어요 and how you feel, use 이/가: 시간이 있어요, 머리가 아파요. Three special forms: 저 + 가 = 제가, 나 + 가 = 내가, 누구 + 가 = 누가."),
        [ex("시간이 있어요.", "Tôi có thời gian.", "I have time."),
         ex("머리가 아파요.", "Tôi đau đầu.", "I have a headache."),
         ex("제가 할게요.", "Để tôi làm.", "I'll do it.", "저 + 가 = 제가", "저 + 가 = 제가")],
        [("Nhiều câu dùng được cả hai, nghĩa hơi khác: 저는 학생이에요 (giới thiệu) — 제가 학생이에요 (chính tôi là học sinh).", "Many sentences take either with a nuance: 저는 학생이에요 (introduction) vs 제가 학생이에요 (I am the one who is a student).")],
        ("Hỏi \"ai?\" thì trả lời bằng 이/가.", "Answer \"who?\" with 이/가."),
        ["particles.core", "existence.itda"])

concept("object-eul-reul",
        ("Tân ngữ 을 / 를 và động từ ở cuối câu", "The object particle 을 / 를, verb last"),
        ("Tiếng Hàn: Chủ ngữ – Tân ngữ – Động từ. 을/를 gắn sau tân ngữ: 밥을 먹어요. Sau phụ âm 을, sau nguyên âm 를.", "Korean order is subject – object – verb. 을/를 marks the object: 밥을 먹어요. 을 after a consonant, 를 after a vowel."),
        ("Tiếng Việt nói \"Tôi ăn cơm\": động từ ở giữa. Tiếng Hàn đặt động từ ở cuối: 저는 밥을 먹어요 (tôi – cơm – ăn). Trợ từ 을/를 cho biết cái gì bị ăn, uống, mua, xem…, nên trật tự trước động từ có thể đổi mà nghĩa vẫn giữ. Chọn theo âm cuối: 물을 (phụ âm), 커피를 (nguyên âm). Trong lời nói hằng ngày 을/를 hay bị bỏ: 커피 마셔요.",
         "Vietnamese says \"I eat rice\"; Korean puts the verb last: 저는 밥을 먹어요 (I – rice – eat). 을/를 shows what is eaten, drunk, bought, watched, so the order before the verb can move. 물을 after a consonant, 커피를 after a vowel. In casual speech 을/를 is often dropped: 커피 마셔요."),
        [ex("저는 밥을 먹어요.", "Tôi ăn cơm.", "I eat rice."),
         ex("커피를 마셔요.", "Tôi uống cà phê.", "I drink coffee."),
         ex("한국어를 공부해요.", "Tôi học tiếng Hàn.", "I study Korean.")],
        [("Một số động từ không lấy 을/를 dù tiếng Việt có tân ngữ: 친구를 만나요 (đúng), nhưng 버스를 타요 cũng có thể nói 버스에 타요.", "Some verbs differ from Vietnamese; 버스를 타요 can also be 버스에 타요.")],
        ("Động từ luôn đứng cuối.", "The verb always comes last."),
        ["particles.core", "verbs.haeyo_present"])

concept("e-eseo",
        ("에 và 에서: ở đâu, đến đâu, lúc nào", "에 and 에서: where, to where, when"),
        ("에 = ở (có, sống), đến (đi), vào lúc (giờ, ngày). 에서 = ở nơi làm một việc: 공장에서 일해요.", "에 = at (being), to (going), at (a time). 에서 = where an action happens: 공장에서 일해요."),
        ("Tiếng Việt dùng một chữ \"ở\" cho mọi trường hợp; tiếng Hàn tách đôi. Dùng 에 với 있어요/없어요 (화장실이 저기에 있어요), với đi, đến (회사에 가요) và với thời gian (세 시에, 월요일에). Dùng 에서 với nơi diễn ra hành động: làm việc, ăn, học, gặp (식당에서 먹어요). Mẹo: có động từ hành động thì dùng 에서; có, ở, đi, đến thì dùng 에. Các từ chỉ vị trí đứng trước: 책상 위에, 역 앞에서.",
         "Vietnamese uses one word, \"ở\"; Korean splits it. 에 goes with 있어요/없어요 (화장실이 저기에 있어요), with going and coming (회사에 가요) and with time (세 시에, 월요일에). 에서 marks where an action happens: working, eating, studying, meeting (식당에서 먹어요). Position words come before: 책상 위에, 역 앞에서."),
        [ex("회사에 가요.", "Tôi đi đến công ty.", "I go to the company."),
         ex("공장에서 일해요.", "Tôi làm việc ở nhà máy.", "I work at a factory."),
         ex("일곱 시에 일어나요.", "Tôi dậy lúc bảy giờ.", "I get up at seven."),
         ex("가방이 의자 위에 있어요.", "Cái túi ở trên ghế.", "The bag is on the chair.")],
        [("Với 살다 (sống) dùng được cả hai: 서울에 살아요 / 서울에서 살아요.", "With 살다 both work: 서울에 살아요 / 서울에서 살아요."),
         ("오늘, 내일, 어제, 지금 không lấy 에.", "오늘, 내일, 어제, 지금 take no 에.")],
        ("Làm gì đó → 에서; có, đi, giờ → 에.", "Doing something → 에서; being, going, time → 에."),
        ["particles.core", "existence.itda"])

concept("small-particles",
        ("도, 만, 하고, 의", "도, 만, 하고, 의"),
        ("도 = cũng (thay cho 은/는, 이/가, 을/를); 만 = chỉ; 하고 / 와 / 과 = và, với; 의 = của (thường đọc «에»).", "도 = also (replacing 은/는, 이/가, 을/를); 만 = only; 하고 / 와 / 과 = and, with; 의 = of."),
        ("Tiếng Việt đặt \"cũng\", \"chỉ\" trước động từ; tiếng Hàn gắn 도, 만 sau danh từ. 도 thay chỗ của 은/는, 이/가, 을/를: 저도 학생이에요 (tôi cũng là học sinh), 커피도 마셔요. 만 nghĩa là chỉ: 물만 마셔요. \"Và\" giữa hai danh từ: 하고 (khẩu ngữ), 와 sau nguyên âm, 과 sau phụ âm: 빵하고 우유, 우유와 빵. 의 là \"của\": 회사의 전화번호; với 저 thì thành 제 (제 가방). 의 làm trợ từ thường đọc «에».",
         "Vietnamese puts \"also\" and \"only\" before the verb; Korean attaches 도 and 만 to the noun. 도 takes the place of 은/는, 이/가, 을/를: 저도 학생이에요, 커피도 마셔요. 만 means only: 물만 마셔요. \"And\" between nouns: 하고 (spoken), 와 after a vowel, 과 after a consonant. 의 is \"of\": 회사의 전화번호; with 저 it becomes 제 (제 가방). As a particle 의 is usually said «에»."),
        [ex("저도 베트남 사람이에요.", "Tôi cũng là người Việt Nam.", "I'm Vietnamese too."),
         ex("물만 마셔요.", "Tôi chỉ uống nước.", "I only drink water."),
         ex("빵하고 우유를 사요.", "Tôi mua bánh mì và sữa.", "I buy bread and milk."),
         ex("제 가방이에요.", "Túi của tôi.", "It's my bag.")],
        [("Đừng nói 저는도: 도 đứng một mình, không đi sau 은/는.", "Never 저는도: 도 replaces 는.")],
        ("도 và 만 thay chỗ của trợ từ khác.", "도 and 만 replace the other particles."),
        ["particles.core"])

# ---------------------------------------------------------------- verbs
concept("haeyo-present",
        ("Thì hiện tại kiểu 해요", "The 해요 present"),
        ("Bỏ 다, thêm 아요 (sau ㅏ, ㅗ) hoặc 어요; 하다 thành 해요. Nguyên âm gặp nhau thì rút gọn: 가요, 와요, 마셔요.", "Drop 다, add 아요 (after ㅏ ㅗ) or 어요; 하다 becomes 해요. Meeting vowels contract: 가요, 와요, 마셔요."),
        ("Tiếng Việt không chia động từ; tiếng Hàn đổi đuôi. Từ điển ghi dạng có 다 (가다, 먹다). Bỏ 다 ra gốc (가, 먹). Gốc có ㅏ hoặc ㅗ ở âm cuối thì thêm 아요, còn lại thêm 어요: 앉아요, 먹어요. Gốc kết thúc bằng nguyên âm thì rút gọn: 가 + 아요 = 가요, 오 + 아요 = 와요, 마시 + 어요 = 마셔요, 주 + 어요 = 줘요. Mọi động từ 하다 thành 해요: 공부해요, 일해요. Cùng một dạng dùng cho tôi, bạn, anh ấy, và cho cả câu hỏi (lên giọng).",
         "Vietnamese does not conjugate; Korean changes the ending. Dictionary forms end in 다 (가다, 먹다). Drop 다 for the stem. A stem whose last vowel is ㅏ or ㅗ takes 아요, others 어요: 앉아요, 먹어요. Vowel stems contract: 가요, 와요, 마셔요, 줘요. Every 하다 verb becomes 해요. One form serves every person, and questions too (rising)."),
        [ex("학교에 가요.", "Tôi đi học.", "I go to school.", "가 + 아요 = 가요", "가 + 아요 = 가요"),
         ex("밥을 먹어요.", "Tôi ăn cơm.", "I eat.", "먹 + 어요", "먹 + 어요"),
         ex("물을 마셔요.", "Tôi uống nước.", "I drink water.", "마시 + 어요 = 마셔요", "마시 + 어요 = 마셔요"),
         ex("공장에서 일해요.", "Tôi làm việc ở nhà máy.", "I work at a factory.", "일하다 → 일해요", "일하다 → 일해요")],
        [("Một số gốc bất quy tắc (춥다 → 추워요, 모르다 → 몰라요): xem thẻ gốc bất quy tắc.", "Some stems are irregular (춥다 → 추워요, 모르다 → 몰라요): see the irregular stems card.")],
        ("ㅏ ㅗ → 아요; còn lại → 어요; 하다 → 해요.", "ㅏ ㅗ → 아요; others → 어요; 하다 → 해요."),
        ["verbs.haeyo_present"])

concept("irregular-stems",
        ("Gốc động từ bất quy tắc", "Irregular stems"),
        ("ㅂ → 워 (춥다 → 추워요), ㄷ → ㄹ (듣다 → 들어요), 르 → ㄹ라/ㄹ러 (모르다 → 몰라요), 으 rơi (바쁘다 → 바빠요).", "ㅂ → 워 (춥다 → 추워요), ㄷ → ㄹ (듣다 → 들어요), 르 → ㄹ라/ㄹ러 (모르다 → 몰라요), 으 drops (바쁘다 → 바빠요)."),
        ("Phần lớn động từ theo quy tắc 아요/어요, nhưng vài nhóm đổi gốc. Gốc ㅂ của nhiều tính từ thành 워: 덥다 → 더워요, 맵다 → 매워요, 어렵다 → 어려워요. Gốc ㄷ của 듣다, 걷다 thành ㄹ trước nguyên âm: 들어요, 걸어요. Gốc 르 thêm ㄹ: 모르다 → 몰라요, 부르다 → 불러요. Gốc kết thúc bằng 으 làm rơi 으: 쓰다 → 써요, 아프다 → 아파요. Gốc ㄹ (살다, 알다) giữ ㄹ ở 해요 nhưng mất ㄹ trước ㅅ, ㄴ: 사세요, 아세요.",
         "Most verbs follow 아요/어요, but a few groups change the stem. Many ㅂ adjectives turn into 워: 덥다 → 더워요, 맵다 → 매워요. The ㄷ of 듣다, 걷다 becomes ㄹ before a vowel: 들어요, 걸어요. 르 stems add ㄹ: 모르다 → 몰라요. A stem in 으 drops it: 쓰다 → 써요, 아프다 → 아파요. ㄹ stems (살다, 알다) keep ㄹ in 해요 but lose it before ㅅ, ㄴ: 사세요, 아세요."),
        [ex("오늘 추워요.", "Hôm nay lạnh.", "It's cold today.", "춥다 → 추워요", "춥다 → 추워요"),
         ex("음악을 들어요.", "Tôi nghe nhạc.", "I listen to music.", "듣다 → 들어요", "듣다 → 들어요"),
         ex("잘 몰라요.", "Tôi không rõ lắm.", "I don't really know.", "모르다 → 몰라요", "모르다 → 몰라요"),
         ex("요즘 바빠요.", "Dạo này tôi bận.", "I'm busy these days.", "바쁘다 → 바빠요", "바쁘다 → 바빠요")],
        [("Không phải mọi gốc ㅂ đều đổi: 입다 → 입어요, 좁다 → 좁아요. Không phải mọi gốc ㄷ đều đổi: 받다 → 받아요, 닫다 → 닫아요.", "Not every ㅂ stem changes: 입다 → 입어요, 좁다 → 좁아요; nor every ㄷ stem: 받다 → 받아요.")],
        ("Học dạng 해요 cùng với từ mới.", "Learn the 해요 form with each new verb."),
        ["verbs.haeyo_present"])

concept("itda-eopda",
        ("있어요 và 없어요: có, ở", "있어요 and 없어요: have, be there"),
        ("N이/가 있어요 = có N, N ở đó; N이/가 없어요 = không có. Nơi chốn đi với 에: 방에 침대가 있어요.", "N이/가 있어요 = there is / I have N; 없어요 = there isn't. The place takes 에: 방에 침대가 있어요."),
        ("Tiếng Việt dùng \"có\" cho cả hai nghĩa: \"tôi có xe\", \"trong phòng có giường\". Tiếng Hàn cũng vậy: 있어요 là \"có\" và cũng là \"ở\". Vật có thì đi với 이/가: 시간이 있어요, 표가 없어요. Nơi chốn đi với 에 (không phải 에서): 화장실이 어디에 있어요? Phủ định của 있어요 không phải 안 있어요 mà là 없어요. Tính từ 맛있다 (ngon) và 재미있다 (hay) cũng là 있다: 맛있어요, 맛없어요.",
         "Vietnamese \"có\" covers both \"have\" and \"there is\"; so does 있어요, which also means \"be (somewhere)\". The thing takes 이/가: 시간이 있어요, 표가 없어요. The place takes 에 (not 에서): 화장실이 어디에 있어요? The negative of 있어요 is 없어요, not 안 있어요. 맛있다 (tasty) and 재미있다 (fun) are built on 있다 too."),
        [ex("방에 침대가 있어요.", "Trong phòng có giường.", "There's a bed in the room."),
         ex("오늘은 시간이 없어요.", "Hôm nay tôi không có thời gian.", "I have no time today."),
         ex("화장실이 어디에 있어요?", "Nhà vệ sinh ở đâu?", "Where is the restroom?"),
         ex("김치가 맛있어요.", "Kim chi ngon.", "The kimchi is tasty.")],
        [("Với người lớn tuổi, kính ngữ của 있어요 (ở) là 계세요: 사장님이 사무실에 계세요.", "For an elder's whereabouts, 있어요 becomes 계세요.")],
        ("있어요 ↔ 없어요, không phải 안 있어요.", "있어요 ↔ 없어요, never 안 있어요."),
        ["existence.itda", "particles.core"])

concept("adjectives",
        ("Tính từ là động từ mô tả", "Adjectives are descriptive verbs"),
        ("Tính từ chia như động từ: 커요 (to), 좋아요 (tốt). Đứng trước danh từ thì thêm (으)ㄴ: 큰 집, 좋은 사람.", "Adjectives conjugate like verbs: 커요, 좋아요. Before a noun they take (으)ㄴ: 큰 집, 좋은 사람."),
        ("Tiếng Việt nói \"nhà to\", không cần \"là\": tính từ tự làm vị ngữ. Tiếng Hàn cũng vậy: 집이 커요 (nhà to), không dùng 이에요. Tính từ chia giống động từ: 커요, 컸어요, 비싸요. Khi đứng trước danh từ để bổ nghĩa, tính từ thêm ㄴ (sau nguyên âm) hoặc 은 (sau phụ âm): 큰 가방, 작은 방, 비싼 옷. Khác tiếng Việt, tính từ đứng trước danh từ: \"cái túi to\" là 큰 가방. 맛있다, 재미있다 dùng 는: 맛있는 음식.",
         "Vietnamese \"nhà to\" needs no \"là\"; neither does Korean: 집이 커요, without 이에요. Adjectives conjugate like verbs: 커요, 컸어요, 비싸요. Before a noun they add ㄴ (after a vowel) or 은 (after a consonant): 큰 가방, 작은 방, 비싼 옷 — and unlike Vietnamese they come first. 맛있다, 재미있다 take 는: 맛있는 음식."),
        [ex("방이 작아요.", "Phòng nhỏ.", "The room is small."),
         ex("큰 가방이에요.", "Đó là cái túi to.", "It's a big bag."),
         ex("맛있는 음식이에요.", "Đây là món ngon.", "It's tasty food.")],
        [("Gốc ㅂ đổi trước 은: 춥다 → 추운 날씨, 맵다 → 매운 음식.", "ㅂ stems change before 은: 추운 날씨, 매운 음식.")],
        ("Tính từ = động từ: không cần 이에요.", "An adjective is a verb: no 이에요."),
        ["verbs.haeyo_present", "speaking.describe"])

# ---------------------------------------------------------------- numbers and time
concept("sino-numbers",
        ("Số Hán-Hàn: 일, 이, 삼…", "Sino-Korean numbers: 일, 이, 삼…"),
        ("Số Hán-Hàn dùng cho tiền, phút, ngày tháng, số điện thoại, số tầng, số xe buýt: 오천 원, 십 분, 삼 층.", "Sino-Korean numbers are for money, minutes, dates, phone numbers, floors and bus numbers: 오천 원, 십 분, 삼 층."),
        ("Tiếng Hàn có hai bộ số. Bộ Hán-Hàn nghe gần âm Hán-Việt: 일 (nhất), 이 (nhị), 삼 (tam), 사 (tứ), 오 (ngũ), 육 (lục), 칠 (thất), 팔 (bát), 구 (cửu), 십 (thập). Ghép như tiếng Việt: 십일 = 11, 이십 = 20, 이십오 = 25. 백 = trăm, 천 = nghìn, 만 = mười nghìn. Khác tiếng Việt, tiếng Hàn đếm theo vạn: 만 원 là 10.000 won, 삼만 원 là 30.000 won. Số điện thoại đọc từng chữ số, số 0 đọc 공: 010 là «공일공».",
         "Korean has two number sets. Sino-Korean numbers sound close to Sino-Vietnamese: 일, 이, 삼, 사, 오, 육, 칠, 팔, 구, 십. They combine like Vietnamese: 십일 = 11, 이십 = 20. 백 = 100, 천 = 1,000, 만 = 10,000 — Korean counts in ten-thousands: 만 원 is 10,000 won, 삼만 원 30,000. Phone numbers are read digit by digit, 0 as 공."),
        [ex("오천 원이에요.", "Năm nghìn won.", "It's 5,000 won."),
         ex("십 분 걸려요.", "Mất mười phút.", "It takes ten minutes."),
         ex("사무실은 삼 층에 있어요.", "Văn phòng ở tầng ba.", "The office is on the third floor.")],
        [("Số 1 không đọc trước 십, 백, 천, 만: 10 là 십, không phải 일십; 10.000 là 만.", "1 is not said before 십, 백, 천, 만: 10 is 십, 10,000 is 만."),
         ("Viết bằng chữ số (5,000원) vẫn đọc bằng số Hán-Hàn.", "Written in digits (5,000원), it is still read in Sino-Korean.")],
        ("Tiền, phút, tầng, ngày: số Hán-Hàn.", "Money, minutes, floors, dates: Sino-Korean."),
        ["numbers.two_systems", "strategy.hanviet_loanwords"])

concept("native-numbers",
        ("Số thuần Hàn và lượng từ", "Native numbers and counters"),
        ("Đếm đồ vật, người, tuổi, giờ dùng số thuần Hàn + lượng từ: 사과 두 개, 세 명, 스무 살, 네 시. 하나 → 한, 둘 → 두.", "Counting things, people, age and hours uses native numbers + a counter: 두 개, 세 명, 스무 살, 네 시."),
        ("Bộ số thứ hai là số thuần Hàn: 하나, 둘, 셋, 넷, 다섯, 여섯, 일곱, 여덟, 아홉, 열. Tiếng Việt nói \"hai quả táo\": số – lượng từ – danh từ. Tiếng Hàn nói 사과 두 개: danh từ – số – lượng từ. Trước lượng từ, năm số đổi dạng: 하나 → 한, 둘 → 두, 셋 → 세, 넷 → 네, 스물 → 스무. Lượng từ hay gặp: 개 (cái), 명 (người), 살 (tuổi), 시 (giờ), 병 (chai), 잔 (ly), 장 (tờ), 권 (quyển), 마리 (con), 대 (chiếc máy, xe).",
         "The second set is native: 하나, 둘, 셋, 넷, 다섯, 여섯, 일곱, 여덟, 아홉, 열. Vietnamese says number – counter – noun; Korean says noun – number – counter: 사과 두 개. Before a counter five numbers shorten: 하나 → 한, 둘 → 두, 셋 → 세, 넷 → 네, 스물 → 스무. Common counters: 개 (things), 명 (people), 살 (age), 시 (o'clock), 병 (bottles), 잔 (cups), 장 (sheets), 권 (books), 마리 (animals), 대 (machines, cars)."),
        [ex("사과 두 개 주세요.", "Cho tôi hai quả táo.", "Two apples, please."),
         ex("직원이 세 명 있어요.", "Có ba nhân viên.", "There are three staff."),
         ex("저는 스무 살이에요.", "Tôi hai mươi tuổi.", "I'm twenty."),
         ex("물 한 병 주세요.", "Cho tôi một chai nước.", "A bottle of water, please.")],
        [("Từ 열하나 trở lên, nhiều người dùng số Hán-Hàn cho đồ vật nhiều (백 개). Giờ luôn dùng số thuần Hàn, phút luôn dùng số Hán-Hàn.", "From larger quantities many speakers switch to Sino-Korean (백 개). Hours are always native, minutes always Sino-Korean.")],
        ("Đếm cái, người, tuổi, giờ: 한 두 세 네.", "Counting things, people, years of age, hours: 한 두 세 네."),
        ["numbers.two_systems"])

concept("time-dates",
        ("Giờ, ngày và thứ", "Telling the time, dates and days"),
        ("Giờ bằng số thuần Hàn, phút bằng số Hán-Hàn: 세 시 십 분. Ngày tháng bằng số Hán-Hàn: 오월 오일. 반 = rưỡi.", "Hours in native numbers, minutes in Sino-Korean: 세 시 십 분. Dates in Sino-Korean: 오월 오일. 반 = half past."),
        ("Tiếng Việt nói \"ba giờ mười phút\" bằng một bộ số. Tiếng Hàn trộn hai bộ: giờ dùng số thuần Hàn (한 시, 두 시, 열두 시), phút dùng số Hán-Hàn (오 분, 삼십 분). 세 시 반 là ba giờ rưỡi. 오전 là buổi sáng, 오후 là buổi chiều (trước giờ): 오후 두 시. Tháng và ngày đều là số Hán-Hàn: 칠월 이십일 (20 tháng 7) — tiếng Hàn nói tháng trước, ngày sau. Các thứ trong tuần kết thúc bằng 요일: 월요일 (thứ Hai) … 일요일 (Chủ nhật). Thời gian đi với 에: 세 시에, 월요일에.",
         "Vietnamese tells time with one number set; Korean mixes both: hours are native (한 시, 두 시, 열두 시), minutes Sino-Korean (오 분, 삼십 분). 세 시 반 is half past three. 오전 is a.m., 오후 p.m., placed first: 오후 두 시. Months and days are Sino-Korean, month first: 칠월 이십일. Weekdays end in 요일: 월요일 … 일요일. Times take 에: 세 시에, 월요일에."),
        [ex("지금 세 시 반이에요.", "Bây giờ là ba giờ rưỡi.", "It's half past three."),
         ex("오후 두 시에 만나요.", "Hai giờ chiều gặp nhau nhé.", "Let's meet at 2 p.m."),
         ex("월요일에 회의가 있어요.", "Thứ Hai có cuộc họp.", "There's a meeting on Monday."),
         ex("몇 시예요?", "Mấy giờ rồi?", "What time is it?")],
        [("Hai tháng đọc khác: tháng 6 là 유월, tháng 10 là 시월.", "Two months are irregular: June is 유월, October 시월."),
         ("오늘, 내일, 어제 không lấy 에.", "오늘, 내일, 어제 take no 에.")],
        ("Giờ thuần Hàn, phút Hán-Hàn.", "Native hours, Sino-Korean minutes."),
        ["numbers.two_systems", "vocab.time_calendar"])

concept("homographs",
        ("Một chữ, hai nghĩa: 개, 이, 네, 일", "One spelling, two meanings: 개, 이, 네, 일"),
        ("Vài từ ngắn viết giống nhau mà nghĩa khác: 개 (con chó / cái), 이 (này / hai), 네 (vâng / bốn), 일 (một / ngày / việc).", "A few short words share a spelling: 개 (dog / counter), 이 (this / two), 네 (yes / four), 일 (one / day / work)."),
        ("Tiếng Việt cũng có từ đồng âm (\"đường\" để đi, \"đường\" để ăn). Tiếng Hàn có vài từ rất ngắn như vậy, nhìn vị trí là biết nghĩa. 개 đứng sau số là lượng từ \"cái\": 사과 두 개; đứng một mình là con chó: 개가 있어요. 이 trước danh từ là \"này\" (이 사람); trong số đếm là \"hai\" (이천 원). 네 đầu câu là \"vâng\"; trước lượng từ là \"bốn\" (네 명). 일 là \"một\" (일 층), \"ngày\" trong ngày tháng (오일) và \"việc\" (일을 해요). Trong khoá này, mỗi chữ có một thẻ từ cho nghĩa chính; nghĩa còn lại học qua thẻ này.",
         "Vietnamese has homonyms too. Korean has a few very short ones whose position shows the meaning. 개 after a number counts things (사과 두 개); alone it is a dog (개가 있어요). 이 before a noun is \"this\" (이 사람), in numbers \"two\" (이천 원). 네 at the start is \"yes\", before a counter \"four\" (네 명). 일 is \"one\" (일 층), a day in dates (오일) and \"work\" (일을 해요). The course gives each one word card for its main sense; this card teaches the others."),
        [ex("사과 두 개 주세요.", "Cho tôi hai quả táo.", "Two apples, please.", "개 sau số: lượng từ \"cái\"", "개 after a number: a counter"),
         ex("개가 있어요.", "Có một con chó.", "There's a dog.", "개 một mình: con chó", "개 alone: a dog"),
         ex("네, 네 명이에요.", "Vâng, bốn người.", "Yes, four people.", "네 đầu câu: vâng; trước 명: bốn", "네 first: yes; before 명: four"),
         ex("이천 원이에요.", "Hai nghìn won.", "It's 2,000 won.", "이 trong số: hai", "이 in a number: two")],
        [("Ghi chú cho đội phát triển: từ điển một nghĩa cho mỗi cách viết; từ điển có nghĩa riêng cho mỗi chữ để sau v1.0.", "Developer note: one sense per spelling in the lexicon; sense-keyed entries are deferred past v1.0.")],
        ("Nhìn chữ đứng trước và sau.", "Look at the words around it."),
        ["numbers.two_systems", "vocab.everyday_basics"])

# ---------------------------------------------------------------- sentences
concept("negation-an-mot",
        ("Phủ định: 안, 못, -지 않아요", "Negation: 안, 못, -지 않아요"),
        ("안 + động từ = không (không muốn, không làm); 못 + động từ = không thể. -지 않아요 nghĩa như 안, trang trọng hơn một chút.", "안 + verb = not (by choice); 못 + verb = cannot. -지 않아요 means the same as 안, a little more formal."),
        ("Tiếng Việt đặt \"không\" trước động từ; tiếng Hàn cũng đặt 안 ngay trước động từ: 술을 안 마셔요. Muốn nói không thể thì dùng 못: 김치를 못 먹어요 (tôi không ăn được kim chi). Cách thứ hai: gốc + 지 않아요 (마시지 않아요) hoặc gốc + 지 못해요. Với động từ 하다 ghép từ danh từ, 안 và 못 đứng trước 해요: 일 안 해요, 운동 못 해요. Phủ định của 있어요 là 없어요, của 이에요 là 아니에요.",
         "Vietnamese puts \"không\" before the verb; Korean puts 안 right before it: 술을 안 마셔요. For \"cannot\" use 못: 김치를 못 먹어요. The long form: stem + 지 않아요 (마시지 않아요) or stem + 지 못해요. With noun + 하다 verbs, 안 and 못 go before 해요: 일 안 해요, 운동 못 해요. 있어요 negates as 없어요, 이에요 as 아니에요."),
        [ex("술을 안 마셔요.", "Tôi không uống rượu.", "I don't drink alcohol."),
         ex("오늘은 못 가요.", "Hôm nay tôi không đi được.", "I can't go today."),
         ex("고기를 먹지 않아요.", "Tôi không ăn thịt.", "I don't eat meat."),
         ex("주말에는 일 안 해요.", "Cuối tuần tôi không làm việc.", "I don't work on weekends.")],
        [("Không nói 안 공부해요: với danh từ + 하다, 안 đứng trước 해요 (공부 안 해요).", "Not 안 공부해요: put 안 before 해요 (공부 안 해요).")],
        ("Không muốn → 안; không thể → 못.", "Won't → 안; can't → 못."),
        ["negation.an_mot", "verbs.haeyo_present"])

concept("want-like",
        ("Muốn và thích: -고 싶어요, 좋아해요", "Want and like: -고 싶어요, 좋아해요"),
        ("Gốc + 고 싶어요 = muốn làm: 가고 싶어요. Thích: N을/를 좋아해요 hoặc N이/가 좋아요.", "Stem + 고 싶어요 = want to: 가고 싶어요. Like: N을/를 좋아해요 or N이/가 좋아요."),
        ("Tiếng Việt đặt \"muốn\" trước động từ; tiếng Hàn đặt sau: gốc + 고 싶어요. 집에 가고 싶어요 (tôi muốn về nhà), 한국어를 배우고 싶어요. Nhớ ai, muốn gặp ai: 보고 싶어요. \"Thích\" có hai cách: 좋아해요 là động từ, đi với 을/를 (축구를 좋아해요); 좋아요 là tính từ \"tốt, thích\", đi với 이/가 (저는 김치가 좋아요). Ghét: 싫어해요 / 싫어요.",
         "Vietnamese puts \"muốn\" before the verb; Korean adds 고 싶어요 after the stem: 집에 가고 싶어요. Missing someone: 보고 싶어요. \"Like\" has two forms: 좋아해요 is a verb with 을/를 (축구를 좋아해요); 좋아요 is an adjective with 이/가 (저는 김치가 좋아요). Dislike: 싫어해요 / 싫어요."),
        [ex("집에 가고 싶어요.", "Tôi muốn về nhà.", "I want to go home."),
         ex("가족이 보고 싶어요.", "Tôi nhớ gia đình.", "I miss my family."),
         ex("축구를 좋아해요.", "Tôi thích bóng đá.", "I like football."),
         ex("저는 커피가 좋아요.", "Tôi thích cà phê.", "I like coffee.")],
        [("Không nói 축구가 좋아해요 hay 축구를 좋아요: 좋아해요 đi với 을/를, 좋아요 đi với 이/가.", "Not 축구가 좋아해요 or 축구를 좋아요.")],
        ("Muốn: -고 싶어요 ở cuối.", "Want: -고 싶어요 at the end."),
        ["wants.goshipda", "particles.core"])

concept("requests",
        ("Nhờ và yêu cầu: -(으)세요, -아/어 주세요, -지 마세요", "Requests: -(으)세요, -아/어 주세요, -지 마세요"),
        ("-(으)세요 = xin hãy (lịch sự): 앉으세요. -아/어 주세요 = làm giúp tôi: 도와주세요. -지 마세요 = xin đừng: 들어가지 마세요.", "-(으)세요 = please do: 앉으세요. -아/어 주세요 = do it for me: 도와주세요. -지 마세요 = please don't."),
        ("Tiếng Việt nói \"mời anh ngồi\", \"giúp tôi với\", \"đừng chạm\". Tiếng Hàn đổi đuôi động từ. Gốc kết thúc bằng nguyên âm + 세요 (가세요), bằng phụ âm + 으세요 (앉으세요). Nhờ ai làm cho mình: dạng 아/어 + 주세요 (다시 말해 주세요, 문을 열어 주세요). Cấm, khuyên đừng: gốc + 지 마세요 (여기에 앉지 마세요). Ở nhà máy, biển báo và thông báo hay dùng kiểu trang trọng -(으)십시오: 조심하십시오.",
         "Vietnamese says \"mời\", \"giúp tôi\", \"đừng\"; Korean changes the ending. Vowel stem + 세요 (가세요), consonant stem + 으세요 (앉으세요). For a favour: 아/어 form + 주세요 (다시 말해 주세요, 문을 열어 주세요). Don't: stem + 지 마세요. Factory signs and announcements use the formal -(으)십시오: 조심하십시오."),
        [ex("여기 앉으세요.", "Mời anh ngồi đây.", "Please sit here."),
         ex("천천히 말해 주세요.", "Xin nói chậm thôi.", "Please speak slowly."),
         ex("기계에 손을 넣지 마세요.", "Đừng cho tay vào máy.", "Don't put your hand into the machine."),
         ex("물 좀 주세요.", "Cho tôi xin chút nước.", "Some water, please.", "좀 làm lời nhờ nhẹ hơn", "좀 softens a request")],
        [("-(으)세요 cũng là câu hỏi kính trọng: 어디 가세요? (anh đi đâu đấy?).", "-(으)세요 also asks politely: 어디 가세요?")],
        ("Nhờ: 주세요. Đừng: 지 마세요.", "A favour: 주세요. Don't: 지 마세요."),
        ["verbs.requests_rules", "speaking.formulaic"])

concept("rules-permission",
        ("Được, không được, phải", "Allowed, not allowed, must"),
        ("-아/어도 돼요 = được phép; -(으)면 안 돼요 = không được; -아/어야 해요 = phải.", "-아/어도 돼요 = may; -(으)면 안 돼요 = must not; -아/어야 해요 = must."),
        ("Nội quy nhà máy và ký túc xá dùng ba mẫu này. Hỏi xin phép: 들어가도 돼요? (tôi vào được không?). Cấm: 여기서 담배를 피우면 안 돼요 — tiếng Hàn nói \"nếu làm thì không được\". Bắt buộc: 안전모를 써야 해요 (phải đội mũ bảo hộ). Dạng 아/어 giống dạng 해요 bỏ 요: 써요 → 써도, 써야. Trả lời ngắn: 네, 돼요 (được) / 아니요, 안 돼요 (không được).",
         "Factory and dormitory rules use three patterns. Asking: 들어가도 돼요? Forbidding: stem + (으)면 안 돼요 — literally \"if you do it, it is not okay\". Obligation: 안전모를 써야 해요. The 아/어 form is the 해요 form without 요: 써요 → 써도, 써야. Short answers: 네, 돼요 / 아니요, 안 돼요."),
        [ex("들어가도 돼요?", "Tôi vào được không?", "May I come in?"),
         ex("여기에 앉으면 안 돼요.", "Không được ngồi ở đây.", "You can't sit here."),
         ex("안전모를 써야 해요.", "Phải đội mũ bảo hộ.", "You must wear a helmet."),
         ex("아니요, 안 돼요.", "Không, không được.", "No, you can't.")],
        [("Trên biển báo thường chỉ có danh từ: 금연 (cấm hút thuốc), 출입 금지 (cấm vào).", "Signs often have a noun only: 금연, 출입 금지.")],
        ("Được: 도 돼요. Không được: 면 안 돼요. Phải: 야 해요.", "May: 도 돼요. Mustn't: 면 안 돼요. Must: 야 해요."),
        ["verbs.requests_rules", "reading.notices_info"])

concept("past",
        ("Thì quá khứ: -았어요 / -었어요", "The past: -았어요 / -었어요"),
        ("Lấy dạng 해요, thay 요 bằng ㅆ어요: 가요 → 갔어요, 먹어요 → 먹었어요, 해요 → 했어요.", "Take the 해요 form and turn 요 into ㅆ어요: 가요 → 갔어요, 먹어요 → 먹었어요, 해요 → 했어요."),
        ("Tiếng Việt thêm \"đã\" hoặc \"rồi\" và động từ giữ nguyên. Tiếng Hàn đổi đuôi. Cách dễ nhất: từ dạng 해요, bỏ 요, gắn ㅆ vào âm cuối rồi thêm 어요: 가 → 갔어요, 와 → 왔어요, 마셔 → 마셨어요, 해 → 했어요. Gốc bất quy tắc giữ cách đổi của nó: 추워요 → 추웠어요, 몰라요 → 몰랐어요. Danh từ: 학생이었어요 (sau phụ âm), 의사였어요 (sau nguyên âm). Từ chỉ thời gian quá khứ hay đi kèm: 어제, 지난주, 아까.",
         "Vietnamese adds a past-time word; Korean changes the ending. Easiest: from the 해요 form, drop 요, add ㅆ to the last block, then 어요: 가 → 갔어요, 와 → 왔어요, 마셔 → 마셨어요, 해 → 했어요. Irregular stems keep their change: 추웠어요, 몰랐어요. Nouns: 학생이었어요, 의사였어요. Past time words: 어제, 지난주, 아까."),
        [ex("어제 친구를 만났어요.", "Hôm qua tôi đã gặp bạn.", "I met a friend yesterday."),
         ex("아침을 먹었어요.", "Tôi đã ăn sáng.", "I had breakfast."),
         ex("주말에 청소했어요.", "Cuối tuần tôi đã dọn dẹp.", "I cleaned at the weekend."),
         ex("어제는 추웠어요.", "Hôm qua lạnh.", "It was cold yesterday.")],
        [("Quá khứ của 있어요 là 있었어요, của 없어요 là 없었어요.", "있어요 → 있었어요, 없어요 → 없었어요.")],
        ("Từ 해요: bỏ 요, thêm ㅆ어요.", "From 해요: drop 요, add ㅆ어요."),
        ["verbs.past_future"])

concept("future",
        ("Tương lai: -(으)ㄹ 거예요, -(으)ㄹ게요", "The future: -(으)ㄹ 거예요, -(으)ㄹ게요"),
        ("Gốc + ㄹ 거예요 / 을 거예요 = sẽ (kế hoạch, dự đoán). -(으)ㄹ게요 = tôi sẽ làm (hứa với người nghe).", "Stem + ㄹ / 을 거예요 = will (plans, guesses). -(으)ㄹ게요 = I'll do it (a promise to the listener)."),
        ("Tiếng Việt thêm \"sẽ\". Tiếng Hàn: gốc kết thúc bằng nguyên âm + ㄹ 거예요 (갈 거예요, 할 거예요), bằng phụ âm + 을 거예요 (먹을 거예요); gốc ㄹ chỉ thêm 거예요 (살 거예요). Dùng cho kế hoạch (내일 친구를 만날 거예요) và dự đoán (비가 올 거예요). Khi hứa với người đang nghe, nhất là ở chỗ làm, dùng -(으)ㄹ게요: 제가 할게요 (để tôi làm), 내일 일찍 올게요.",
         "Vietnamese adds sẽ. Korean: vowel stem + ㄹ 거예요 (갈 거예요), consonant stem + 을 거예요 (먹을 거예요); an ㄹ stem adds only 거예요 (살 거예요). For plans (내일 친구를 만날 거예요) and guesses (비가 올 거예요). When promising the listener, especially at work, use -(으)ㄹ게요: 제가 할게요, 내일 일찍 올게요."),
        [ex("내일 친구를 만날 거예요.", "Mai tôi sẽ gặp bạn.", "I'll meet a friend tomorrow."),
         ex("오후에 비가 올 거예요.", "Chiều nay trời sẽ mưa.", "It'll rain this afternoon."),
         ex("제가 할게요.", "Để tôi làm.", "I'll do it."),
         ex("내일 일찍 올게요.", "Mai tôi sẽ đến sớm.", "I'll come early tomorrow.")],
        [("-(으)ㄹ게요 chỉ nói về việc của mình, không dùng cho người khác hay để hỏi.", "-(으)ㄹ게요 is only for your own actions, never for others or questions.")],
        ("Kế hoạch: 거예요. Hứa: 게요.", "A plan: 거예요. A promise: 게요."),
        ["verbs.past_future"])

concept("question-words",
        ("Từ để hỏi", "Question words"),
        ("Từ để hỏi đứng đúng chỗ của câu trả lời, không đưa lên đầu: 어디에 가요? → 회사에 가요.", "A question word stands where the answer goes: 어디에 가요? → 회사에 가요."),
        ("Tiếng Việt cũng để từ để hỏi ở chỗ của câu trả lời: \"Bạn đi đâu?\" — \"Tôi đi chợ\". Tiếng Hàn giống vậy, động từ vẫn ở cuối: 어디에 가요? Các từ cần nhớ: 뭐 (gì), 누구 (ai), 어디 (đâu), 언제 (khi nào), 왜 (tại sao), 어떻게 (thế nào), 얼마 (bao nhiêu tiền), 몇 (mấy, đi với lượng từ: 몇 시, 몇 명). Với 이에요/예요: 뭐예요?, 누구예요?, 얼마예요? Câu hỏi có/không không cần từ hỏi: chỉ lên giọng ở cuối.",
         "Vietnamese also leaves the question word where the answer goes; so does Korean, verb last: 어디에 가요? Key words: 뭐 (what), 누구 (who), 어디 (where), 언제 (when), 왜 (why), 어떻게 (how), 얼마 (how much), 몇 (how many, with a counter: 몇 시, 몇 명). With the copula: 뭐예요?, 누구예요?, 얼마예요? Yes/no questions need no word: just rise at the end."),
        [ex("이름이 뭐예요?", "Bạn tên là gì?", "What's your name?"),
         ex("화장실이 어디예요?", "Nhà vệ sinh ở đâu?", "Where is the restroom?"),
         ex("몇 시에 와요?", "Mấy giờ bạn đến?", "What time are you coming?"),
         ex("이거 얼마예요?", "Cái này bao nhiêu tiền?", "How much is this?")],
        [("누구 + 가 thành 누가: 누가 와요? (Ai đến?)", "누구 + 가 becomes 누가: 누가 와요?")],
        ("Từ hỏi ở chỗ câu trả lời, động từ ở cuối.", "Question word where the answer goes, verb last."),
        ["questions.question_words"])

concept("demonstratives",
        ("Này, đó, kia: 이, 그, 저", "This, that, that over there: 이, 그, 저"),
        ("이 = này (gần mình), 그 = đó (gần người nghe, hoặc vừa nói), 저 = kia (xa cả hai): 이거, 그거, 저거; 여기, 거기, 저기.", "이 = near me, 그 = near you or just mentioned, 저 = far from both: 이거, 그거, 저거; 여기, 거기, 저기."),
        ("Tiếng Việt có \"này, đó, kia\" đứng sau danh từ: \"người này\". Tiếng Hàn có 이, 그, 저 đứng trước: 이 사람 (người này), 그 가방 (cái túi đó), 저 건물 (toà nhà kia). Ghép với 거 (cái) thành 이거, 그거, 저거; với chỗ thành 여기, 거기, 저기. 그 còn chỉ điều vừa nói đến. Trong lời nói hay dùng 이거, trong văn viết dùng 이것.",
         "Vietnamese puts này, đó, kia after the noun; Korean puts 이, 그, 저 before: 이 사람, 그 가방, 저 건물. With 거 (thing): 이거, 그거, 저거; with places: 여기, 거기, 저기. 그 also points to what was just mentioned. Speech says 이거, writing 이것."),
        [ex("이거 주세요.", "Cho tôi cái này.", "This one, please."),
         ex("저 사람은 누구예요?", "Người kia là ai?", "Who is that person?"),
         ex("화장실은 저기에 있어요.", "Nhà vệ sinh ở đằng kia.", "The restroom is over there.")],
        [("저 (kia) viết giống 저 (tôi). Đứng trước danh từ là \"kia\": 저 사람; đứng một mình làm chủ ngữ là \"tôi\": 저는.", "저 (that) is spelt like 저 (I): before a noun it means that; alone it means I.")],
        ("이 – gần tôi, 그 – gần bạn, 저 – xa cả hai.", "이 near me, 그 near you, 저 far from us."),
        ["questions.question_words", "vocab.everyday_basics"])

concept("hanviet-loanwords",
        ("Từ Hán-Hàn, âm Hán-Việt và từ mượn", "Sino-Korean words, Sino-Vietnamese readings and loanwords"),
        ("Nhiều từ Hàn có gốc Hán và nghe gần âm Hán-Việt: 가족 (gia tộc), 안전 (an toàn). Từ mượn tiếng Anh: 커피, 버스. Cẩn thận \"bạn giả\".", "Many Korean words are Sino-Korean and sound close to Sino-Vietnamese: 가족, 안전. English loanwords: 커피, 버스. Beware of false friends."),
        ("Khoảng một nửa từ vựng tiếng Hàn là từ Hán-Hàn, nên nhiều từ nghe quen với người Việt: 가족 (gia tộc → gia đình), 안전 (an toàn), 전화 (điện thoại), 주의 (chú ý), 은행 (ngân hàng). Âm chỉ gần, không giống hẳn. Từ thuần Hàn (물, 집, 먹다) không có âm Hán-Việt. Có \"bạn giả\": 공장 (công trường) là nhà máy; 출구 (xuất khẩu) là lối ra; 시험 (thí nghiệm) là kỳ thi; 질문 (chất vấn) chỉ là câu hỏi. Từ mượn tiếng Anh viết theo âm Hàn: 커피, 컴퓨터, 핸드폰 (điện thoại di động).",
         "About half of Korean vocabulary is Sino-Korean, so many words sound familiar to Vietnamese ears: 가족, 안전, 전화, 주의, 은행. The sounds are close, not identical. Native words (물, 집, 먹다) have no such reading. False friends: 공장 is a factory, not a building site; 출구 is an exit; 시험 is an exam; 질문 is just a question. English loanwords follow Korean sounds: 커피, 컴퓨터, 핸드폰."),
        [ex("가족", "gia đình", "family", "가족 = gia tộc", "Sino-Vietnamese gia tộc"),
         ex("안전", "an toàn", "safety", "an toàn — rất gần", "very close"),
         ex("공장", "nhà máy", "factory", "\"công trường\" là bạn giả", "a false friend"),
         ex("커피", "cà phê", "coffee", "từ mượn tiếng Anh", "an English loanword")],
        [("Từ nửa Hán nửa thuần (교통카드, 고용센터) và tên riêng không có âm Hán-Việt.", "Mixed words (교통카드, 고용센터) and names have no Sino-Vietnamese reading.")],
        ("Đoán bằng âm Hán-Việt, rồi kiểm tra lại.", "Guess with the Sino-Vietnamese reading, then check."),
        ["script.hanviet", "strategy.hanviet_loanwords"])

concept("connectors",
        ("Nối câu: 그리고, 그래서, 하지만, -고, -지만", "Linking: 그리고, 그래서, 하지만, -고, -지만"),
        ("Giữa hai câu: 그리고 (và), 그래서 (vì vậy), 하지만 (nhưng). Trong một câu: gốc + 고 (và), gốc + 지만 (nhưng).", "Between sentences: 그리고, 그래서, 하지만. Inside one: stem + 고 (and), stem + 지만 (but)."),
        ("Tiếng Việt nối bằng \"và\", \"nên\", \"nhưng\". Tiếng Hàn có hai cách. Đặt từ nối ở đầu câu thứ hai: 밥을 먹었어요. 그리고 커피를 마셨어요. 비가 와요. 그래서 집에 있어요. 한국어는 어려워요. 하지만 재미있어요. Hoặc gắn đuôi vào động từ đầu: 밥을 먹고 커피를 마셨어요 (ăn rồi uống), 어렵지만 재미있어요. Thì của câu đặt ở động từ cuối.",
         "Vietnamese links with và, nên, nhưng. Korean has two ways: a linking word at the start of the second sentence (그리고, 그래서, 하지만), or an ending on the first verb: 밥을 먹고 커피를 마셨어요, 어렵지만 재미있어요. The tense goes on the last verb."),
        [ex("비가 와요. 그래서 집에 있어요.", "Trời mưa. Vì vậy tôi ở nhà.", "It's raining, so I'm staying home."),
         ex("한국어는 어렵지만 재미있어요.", "Tiếng Hàn khó nhưng thú vị.", "Korean is hard but fun."),
         ex("밥을 먹고 일해요.", "Tôi ăn cơm rồi làm việc.", "I eat and then work.")],
        [("그런데 nghĩa là \"nhưng mà\" và cũng dùng để đổi chủ đề: 그런데, 내일 시간 있어요?", "그런데 also changes the subject: 그런데, 내일 시간 있어요?")],
        ("Câu ngắn + từ nối = câu rõ.", "Short sentences + a linker = clear writing."),
        ["writing.phrases_sentences"])

concept("family-address",
        ("Gọi người trong gia đình và ở chỗ làm", "Addressing family and colleagues"),
        ("Anh, chị gọi theo người nói: em trai gọi 형, 누나; em gái gọi 오빠, 언니. Ở chỗ làm: tên + 씨, chức vụ + 님.", "Older siblings depend on the speaker: a man says 형, 누나; a woman says 오빠, 언니. At work: name + 씨, title + 님."),
        ("Tiếng Việt gọi \"anh, chị\" ai cũng như ai. Tiếng Hàn chọn từ theo giới tính của người nói: em trai gọi anh là 형, gọi chị là 누나; em gái gọi anh là 오빠, gọi chị là 언니. Em trai, em gái đều là 동생 (남동생, 여동생). Khi nói về gia đình mình, người Hàn hay nói 우리 (우리 어머니), lịch sự hơn là 저희. Ở chỗ làm, gọi đồng nghiệp bằng tên + 씨 (흐엉 씨), gọi cấp trên bằng chức vụ + 님 (사장님, 반장님) — không gọi tên cấp trên.",
         "Vietnamese uses anh, chị for everyone; Korean picks by the speaker's sex: a man calls an older brother 형 and an older sister 누나; a woman says 오빠 and 언니. Younger siblings are 동생. About one's own family Koreans say 우리 (우리 어머니), or more humbly 저희. At work, colleagues are name + 씨 (흐엉 씨), superiors title + 님 (사장님, 반장님) — never a superior's name."),
        [ex("우리 언니는 간호사예요.", "Chị gái tôi là y tá.", "My older sister is a nurse.", "người nói là nữ", "said by a woman"),
         ex("형이 한 명 있어요.", "Tôi có một anh trai.", "I have an older brother.", "người nói là nam", "said by a man"),
         ex("반장님, 안녕하세요.", "Chào tổ trưởng ạ.", "Hello, team leader.")],
        [("씨 không dùng cho chính mình và không dùng với cấp trên.", "씨 is never used for yourself or for a superior.")],
        ("Nam gọi 형 / 누나, nữ gọi 오빠 / 언니.", "Men say 형 / 누나, women 오빠 / 언니."),
        ["vocab.everyday_basics", "politeness.speech_levels"])

# ---------------------------------------------------------------- output
REGISTRY_ENTRY = {
    "id": "original-korean-course",
    "name": "Learning French with Tracy — authored ko-vi course (Korean for Vietnamese speakers)",
    "kind": "authored teaching content (course pack, guidebooks, concept explanations, readings, listening scripts, speech and writing tasks, scenarios, assessment, exam-track items)",
    "license": "MIT",
    "url": "https://github.com/vansyson1308/learning-french-with-tracy",
    "attribution": "Korean course content for Vietnamese speakers by the Learning French with Tracy project.",
    "retrievedAt": "2026-11-05",
    "covers": ["content/courses/ko-vi.json", "content/ko/pedagogy/", "content/ko/reception/reading.json", "content/ko/reception/listening.json", "content/ko/speech/",
               "content/ko/writing/", "content/ko/interaction/", "content/ko/assessment/", "content/ko/exam/"],
    "notes": "P4e: clean-room authored; Vietnamese learner-facing text pending the D-10 review. The hand-chosen lexicon is recorded under original-lexicon-etl, its RR readings are the project's own rule output. Ships under the repository's MIT grant like the other course packs.",
}


def write_registry():
    reg = json.load(open(f"{ROOT}/content/sources/registry.json", encoding="utf-8"))
    sources = [s for s in reg["sources"] if s["id"] != REGISTRY_ENTRY["id"]]
    at = next((i + 1 for i, s in enumerate(sources) if s["id"] == "original-japanese-course"), len(sources))
    sources.insert(at, REGISTRY_ENTRY)
    reg["sources"] = sources
    path = f"{ROOT}/content/ko/_drafts/staged/content/sources/registry.json"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(reg, f, ensure_ascii=False, indent=2)
        f.write("\n")


lex = {x["surface"]: x for x in LEXL}
for p in problems:
    print(p, file=sys.stderr)
if problems:
    sys.exit(f"concepts: {len(problems)} problem(s)")
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8", newline="\n") as f:
    for r in recs + table_records(lex):
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
write_registry()
print("concepts:", len(recs), "cards,", len(table_records(lex)), "paradigm tables")
