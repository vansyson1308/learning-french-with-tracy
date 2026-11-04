"""ko Hangul primer, P4e session 2 (ko-plan.md §4): the P4b primer (14 consonants, 10 vowels, block examples) extended
with the tense consonants and the three-way contrast (가 까 카), the 11 compound vowels, 받침 and its seven sounds, the
double finals, the sound changes the course needs (연음 liaison, 비음화 nasalisation, ㅎ aspiration and the silent ㅎ,
palatalisation, 경음화 tensing for recognition), and a 20-item checkpoint (block → RR, sound → block, minimal pairs
달 / 딸 / 탈, 불 / 뿔 / 풀). Passing it (16/20) records the course's `primerPassed` (v9, generic since P4c); it turns
nothing off (decision 5: RR stays the reading aid), so the checkpoint carries its own pass and entry wording.

Every RR here is checked against the project's RR rules, every pronounced spelling against the word's RR (tensing,
which RR does not write, against the plain → tense initials), every checkpoint jamo against what the primer teaches
(scripts/lib/script-primer.ts). Vietnamese comparisons are stated as approximations.

Written to the STAGED layer (content/ko/_drafts/staged/content/ko/primer/script-primer.json): the committed P4b primer
is compiled into the golden-pinned src/content/primer/ko.json. Its first section is taken from the committed file as it
is. Byte-deterministic. usage: python -I ko-primer.py <repo root>
"""
import json, os, sys

ROOT = sys.argv[1]
COMMITTED = f"{ROOT}/content/ko/primer/script-primer.json"
OUT = f"{ROOT}/content/ko/_drafts/staged/content/ko/primer/script-primer.json"


def t(vi, en):
    return {"vi": vi, "en": en}


def item(text, rr, gloss=None, said=None, tensed=False):
    out = {"text": text, "rr": rr}
    if said:
        out["said"] = said
    if tensed:
        out["tensed"] = True
    if gloss:
        out["gloss"] = t(*gloss)
    out["audio"] = {"say": text, "status": "pending"}
    return out


def row(items, label=None):
    return ({"label": t(*label)} if label else {}) | {"items": items}


def sounds(sid, title, explanation, rows, jamo=None, notes=None):
    s = {"kind": "hangulSounds", "id": sid, "title": t(*title), "explanation": t(*explanation)}
    if jamo:
        s["jamo"] = jamo
    s["rows"] = rows
    if notes:
        s["notes"] = [t(*n) for n in notes]
    return s


def j(jamo, position, rr, name=None):
    return {"jamo": jamo, "position": position, "rr": rr, **({"name": name} if name else {})}


basic = json.load(open(COMMITTED, encoding="utf-8"))["sections"][0]

sections = [
    basic,
    sounds(
        "tense-aspirated",
        ("Phụ âm căng và bật hơi: 가, 까, 카", "Tense and aspirated consonants: 가, 까, 카"),
        ("Năm phụ âm ㄱ ㄷ ㅂ ㅅ ㅈ có thêm dạng căng, viết đôi: ㄲ ㄸ ㅃ ㅆ ㅉ. Âm căng đọc siết cổ, không có hơi, gần «c, t, p» rất gọn của tiếng Việt. Bốn phụ âm ㅋ ㅌ ㅍ ㅊ (đã học) là âm bật hơi, có luồng hơi mạnh, gần «kh, th». Ba âm này làm đổi nghĩa: 달 (mặt trăng), 딸 (con gái), 탈 (mặt nạ). So sánh với tiếng Việt chỉ là gần đúng; hãy nghe và nhại lại.",
         "ㄱ ㄷ ㅂ ㅅ ㅈ each have a tense form, written double: ㄲ ㄸ ㅃ ㅆ ㅉ, said with a tight throat and no breath. ㅋ ㅌ ㅍ ㅊ (already learnt) are aspirated, with a strong puff. The three change the meaning: 달 (moon), 딸 (daughter), 탈 (mask). Vietnamese comparisons are only approximate; listen and repeat."),
        [
            row([item("가", "ga"), item("까", "kka"), item("카", "ka")], ("Thường · căng · bật hơi", "Plain · tense · aspirated")),
            row([item("다", "da"), item("따", "tta"), item("타", "ta")]),
            row([item("바", "ba"), item("빠", "ppa"), item("파", "pa")]),
            row([item("자", "ja"), item("짜", "jja"), item("차", "cha")]),
            row([item("사", "sa"), item("싸", "ssa")], ("ㅅ chỉ có dạng căng ㅆ, không có dạng bật hơi", "ㅅ has a tense ㅆ but no aspirated form")),
            row([item("달", "dal", ("mặt trăng", "moon")), item("딸", "ttal", ("con gái", "daughter")), item("탈", "tal", ("mặt nạ", "mask"))], ("Cặp từ chỉ khác một âm", "Words that differ in one sound")),
            row([item("불", "bul", ("lửa", "fire")), item("뿔", "ppul", ("sừng", "horn")), item("풀", "pul", ("cỏ", "grass"))]),
            row([item("방", "bang", ("phòng", "room")), item("빵", "ppang", ("bánh mì", "bread"))]),
        ],
        jamo=[j("ㄲ", "initial", "kk", "쌍기역"), j("ㄸ", "initial", "tt", "쌍디귿"), j("ㅃ", "initial", "pp", "쌍비읍"), j("ㅆ", "initial", "ss", "쌍시옷"), j("ㅉ", "initial", "jj", "쌍지읒")],
        notes=[
            ("Mẹo: đặt bàn tay trước miệng. Với 카, 타, 파 bạn thấy hơi thổi mạnh; với 까, 따, 빠 gần như không có hơi.", "Hold your hand before your mouth: 카 타 파 push air, 까 따 빠 almost none."),
            ("RR viết âm căng bằng hai chữ (kk, tt, pp, ss, jj), nhưng đó là một âm, không phải hai.", "RR writes a tense consonant with two letters, but it is one sound."),
        ],
    ),
    sounds(
        "compound-vowels",
        ("Nguyên âm ghép", "Compound vowels"),
        ("Mười một nguyên âm ghép từ các nét đã học. ㅐ và ㅔ ngày nay đọc gần như nhau, gần «e» của tiếng Việt. Thêm một nét ngắn là có âm «y»: ㅒ «ye», ㅖ «ye». ㅗ hoặc ㅜ đứng trước làm âm «w»: ㅘ «oa», ㅝ «uơ», ㅟ «uy». ㅙ, ㅚ, ㅞ nghe gần giống nhau, gần «uê». ㅢ đọc «ưi» ở đầu từ; sau phụ âm thường đọc «i»; làm trợ từ 의 thường đọc «ê».",
         "Eleven vowels are built from the strokes you know. ㅐ and ㅔ sound nearly the same today. An extra short stroke adds a y-sound: ㅒ, ㅖ. A leading ㅗ or ㅜ adds a w-sound: ㅘ, ㅝ, ㅟ. ㅙ, ㅚ, ㅞ sound much alike. ㅢ is a quick «eu-i» at the start of a word, usually «i» after a consonant, and «e» as the particle 의."),
        [
            row([item("개", "gae"), item("게", "ge"), item("얘", "yae"), item("예", "ye")]),
            row([item("와", "wa"), item("왜", "wae"), item("외", "oe")]),
            row([item("워", "wo"), item("웨", "we"), item("위", "wi"), item("의", "ui")]),
            row([item("사과", "sagwa", ("quả táo", "apple")), item("회사", "hoesa", ("công ty", "company")), item("의자", "uija", ("cái ghế", "chair")), item("왜", "wae", ("tại sao", "why"))], ("Trong từ", "In words")),
        ],
        jamo=[j("ㅐ", "vowel", "ae"), j("ㅔ", "vowel", "e"), j("ㅒ", "vowel", "yae"), j("ㅖ", "vowel", "ye"), j("ㅘ", "vowel", "wa"), j("ㅙ", "vowel", "wae"), j("ㅚ", "vowel", "oe"),
              j("ㅝ", "vowel", "wo"), j("ㅞ", "vowel", "we"), j("ㅟ", "vowel", "wi"), j("ㅢ", "vowel", "ui")],
        notes=[("Khi gõ trên bàn phím, nguyên âm ghép gõ bằng hai phím: ㅗ + ㅏ = ㅘ, ㅜ + ㅓ = ㅝ.", "On a keyboard a compound vowel takes two keys: ㅗ + ㅏ = ㅘ, ㅜ + ㅓ = ㅝ.")],
    ),
    sounds(
        "final-consonants",
        ("Phụ âm cuối (받침): bảy âm", "Final consonants (받침): seven sounds"),
        ("Phụ âm ở đáy khối gọi là 받침. Viết có nhiều chữ, nhưng đọc chỉ có bảy âm cuối, giống các âm cuối của tiếng Việt: «k» (như «học»), «n», «t» (như «hát»), «l», «m», «p» (như «họp»), «ng». Âm cuối không bật ra: miệng khép lại rồi dừng. ㄱ ㅋ ㄲ đọc «k»; ㅅ ㅆ ㅈ ㅊ ㅌ (và ㄷ) đọc «t»; ㅂ ㅍ đọc «p».",
         "A consonant at the bottom of a block is a 받침. Many letters are written there, but only seven final sounds are said, like the Vietnamese finals: k, n, t, l, m, p, ng. Finals are unreleased. ㄱ ㅋ ㄲ read k; ㅅ ㅆ ㅈ ㅊ ㅌ (and ㄷ) read t; ㅂ ㅍ read p."),
        [
            row([item("국", "guk", ("canh", "soup")), item("부엌", "bueok", ("bếp", "kitchen")), item("밖", "bak", ("bên ngoài", "outside"))], ("Đọc «k»", "Read k")),
            row([item("옷", "ot", ("quần áo", "clothes")), item("낮", "nat", ("ban ngày", "daytime")), item("꽃", "kkot", ("hoa", "flower"))], ("Đọc «t»", "Read t")),
            row([item("밥", "bap", ("cơm", "rice")), item("앞", "ap", ("phía trước", "front"))], ("Đọc «p»", "Read p")),
            row([item("산", "san", ("núi", "mountain")), item("물", "mul", ("nước", "water")), item("몸", "mom", ("cơ thể", "body")), item("강", "gang", ("sông", "river"))], ("ㄴ ㄹ ㅁ ㅇ giữ âm của chúng", "ㄴ ㄹ ㅁ ㅇ keep their sound")),
        ],
        jamo=[j("ㄱ", "final", "k"), j("ㄴ", "final", "n"), j("ㄷ", "final", "t"), j("ㄹ", "final", "l"), j("ㅁ", "final", "m"), j("ㅂ", "final", "p"), j("ㅇ", "final", "ng"),
              j("ㅋ", "final", "k"), j("ㄲ", "final", "k"), j("ㅅ", "final", "t"), j("ㅆ", "final", "t"), j("ㅈ", "final", "t"), j("ㅊ", "final", "t"), j("ㅌ", "final", "t"), j("ㅍ", "final", "p")],
        notes=[("ㄹ cuối đọc gần «l» cong lưỡi nhẹ, không như «n».", "A final ㄹ is a light l, not an n.")],
    ),
    sounds(
        "double-finals",
        ("Hai phụ âm cuối", "Double final consonants"),
        ("Một số khối có hai phụ âm ở đáy: 값, 닭, 앉다. Đứng một mình hoặc trước phụ âm, thường chỉ đọc một trong hai chữ: 값 «kap», 닭 «tak», 여덟 «yeo-đơl». Trước nguyên âm thì chữ thứ hai nối sang khối sau: 값이 «kap-si». Học cách đọc cùng với từ.",
         "Some blocks carry two consonants at the bottom: 값, 닭, 앉다. Alone or before a consonant only one is usually read: 값 gap, 닭 dak, 여덟 yeodeol. Before a vowel the second moves on: 값이 gapsi. Learn the reading with the word."),
        [
            row([item("값", "gap", ("giá", "price")), item("닭", "dak", ("con gà", "chicken")), item("여덟", "yeodeol", ("tám", "eight"))]),
            row([item("앉다", "anda", ("ngồi", "to sit")), item("없다", "eopda", ("không có", "not to have")), item("읽다", "ikda", ("đọc", "to read")), item("많다", "manta", ("nhiều", "many"))], ("Trong động từ, tính từ", "In verbs and adjectives")),
        ],
        jamo=[j("ㄳ", "final", "k"), j("ㄵ", "final", "n"), j("ㄶ", "final", "n"), j("ㄺ", "final", "k"), j("ㄻ", "final", "m"), j("ㄼ", "final", "l"), j("ㄾ", "final", "l"), j("ㅀ", "final", "l"),
              j("ㅄ", "final", "p")],
    ),
    sounds(
        "sound-changes",
        ("Đọc liền: nối âm và biến âm", "Reading words together: liaison and sound changes"),
        ("Tiếng Hàn đọc liền các khối, nên vài âm đổi khi đứng cạnh nhau. Chữ viết không đổi; chỉ cách đọc đổi. Dòng trong ngoặc vuông là cách đọc. Bạn không cần thuộc tên quy tắc: nghe nhiều rồi sẽ quen.",
         "Korean reads blocks together, so some sounds change side by side. The spelling never changes, only the sound; the brackets show how a word is said. You need not learn the rule names: listening makes them familiar."),
        [
            row([item("한국어", "han-gugeo", ("tiếng Hàn", "Korean"), said="한구거"), item("음악", "eumak", ("âm nhạc", "music"), said="으막"), item("옷이", "osi", ("quần áo (chủ ngữ)", "clothes (subject)"), said="오시")],
                ("Nối âm (연음): phụ âm cuối nối sang nguyên âm sau", "Liaison (연음): a final moves onto the next vowel")),
            row([item("합니다", "hamnida", ("làm (trang trọng)", "do (formal)"), said="함니다"), item("감사합니다", "gamsahamnida", ("cảm ơn", "thank you"), said="감사함니다"), item("한국말", "han-gungmal", ("tiếng Hàn", "Korean"), said="한궁말")],
                ("Mũi hoá (비음화): ㅂ ㄱ trước ㄴ ㅁ đọc thành ㅁ ㅇ", "Nasalisation (비음화): ㅂ ㄱ before ㄴ ㅁ become ㅁ ㅇ")),
            row([item("좋다", "jota", ("tốt", "good"), said="조타"), item("축하합니다", "chukahamnida", ("chúc mừng", "congratulations"), said="추카함니다"), item("좋아요", "joayo", ("tốt", "good"), said="조아요")],
                ("ㅎ: gặp ㄱ ㄷ ㅂ ㅈ thì bật hơi; trước nguyên âm thì câm", "ㅎ aspirates ㄱ ㄷ ㅂ ㅈ; before a vowel it is silent")),
            row([item("같이", "gachi", ("cùng nhau", "together"), said="가치")], ("ㅌ trước 이 đọc thành ㅊ", "ㅌ before 이 becomes ㅊ")),
            row([item("학교", "hakgyo", ("trường học", "school"), said="학꾜", tensed=True), item("식당", "sikdang", ("quán ăn", "restaurant"), said="식땅", tensed=True), item("학생", "haksaeng", ("học sinh", "student"), said="학쌩", tensed=True)],
                ("Căng hoá (경음화): sau ㄱ ㄷ ㅂ, phụ âm thường đọc căng — RR không ghi", "Tensing (경음화): after ㄱ ㄷ ㅂ a plain consonant turns tense — RR does not show it")),
        ],
        notes=[("Dòng RR dưới chữ Hàn trong bài học ghi nối âm và mũi hoá (hamnida), nhưng không ghi căng hoá (hakgyo).", "The RR line in the lessons shows liaison and nasalisation (hamnida) but not tensing (hakgyo).")],
    ),
]


def placed(n, key, distractors):
    """The key at a position that moves from item to item (n * 7 mod the option count): no position gives it away."""
    at = (n * 7) % (len(distractors) + 1)
    return distractors[:at] + [key] + distractors[at:], at


def read_item(n, text, options):
    opts, at = placed(n, options[0], options[1:])
    return {"kind": "hangulToRr", "id": f"c{n:02d}", "text": text, "options": opts, "correct": at}


def sound_item(n, say, distractors):
    opts, at = placed(n, say, distractors)
    return {"kind": "soundToHangul", "id": f"c{n:02d}", "audio": {"say": say, "status": "pending"}, "options": opts, "correct": at}


# Listed key first; placed() moves it.
items = [
    read_item(1, "까", ["kka", "ga", "ka", "tta"]),
    read_item(2, "탈", ["tal", "dal", "ttal", "pal"]),
    read_item(3, "의사", ["uisa", "eusa", "isa", "wisa"]),
    read_item(4, "회사", ["hoesa", "hwasa", "husa", "hyesa"]),
    read_item(5, "꽃", ["kkot", "kkoch", "got", "kkon"]),
    read_item(6, "값", ["gap", "gaps", "gat", "gam"]),
    read_item(7, "한국어", ["han-gugeo", "hanguk-eo", "hankukeo", "hangeugeo"]),
    read_item(8, "합니다", ["hamnida", "hapnida", "habnida", "hanmida"]),
    read_item(9, "좋다", ["jota", "joda", "jotta", "jonda"]),
    read_item(10, "왜", ["wae", "oe", "we", "wa"]),
    sound_item(11, "딸", ["달", "탈"]),
    sound_item(12, "풀", ["불", "뿔"]),
    sound_item(13, "빵", ["방", "팡"]),
    sound_item(14, "짜다", ["자다", "차다"]),
    sound_item(15, "사과", ["사가", "사고"]),
    sound_item(16, "의자", ["이자", "위자"]),
    sound_item(17, "옷", ["오", "온"]),
    sound_item(18, "닭", ["담", "달"]),
    sound_item(19, "같이", ["가비", "가지"]),
    sound_item(20, "학교", ["하교", "한교"]),
]

primer = {
    "version": 1,
    "language": "ko",
    "id": "ko.primer.script",
    "title": t("Bảng chữ Hangul", "Hangul"),
    "intro": t(
        "Hangul là chữ ghi âm: mỗi chữ cái (jamo) là một phụ âm hoặc một nguyên âm, và các jamo xếp lại thành một khối vuông ứng với một âm tiết. Bắt đầu với 14 phụ âm và 10 nguyên âm cơ bản, rồi đến phụ âm căng và bật hơi, nguyên âm ghép, phụ âm cuối và cách đọc liền. Cuối cùng là một bài kiểm tra nhanh. Bấm vào một chữ để nghe.",
        "Hangul is an alphabet: each letter (jamo) is a consonant or a vowel, and the letters stack into a square block for each syllable. Start with the 14 basic consonants and 10 vowels, then the tense and aspirated consonants, the compound vowels, the final consonants and how words are read together. A quick check comes last. Tap a letter to hear it.",
    ),
    "sections": sections,
    "checkpoint": {
        "title": t("Kiểm tra nhanh chữ Hangul", "Quick Hangul check"),
        "intro": t(
            "20 câu: đọc chữ rồi chọn cách đọc La-tinh (RR), nghe rồi chọn chữ. Đúng từ 16 câu là qua. Làm lại bao nhiêu lần cũng được; bài học không bị khoá.",
            "20 questions: read a block and pick its RR, listen and pick the Hangul. 16 correct passes. Retake it as often as you like; no lesson is locked.",
        ),
        "passMark": 16,
        "messages": {
            "passed": t("Bạn đã qua! Bạn đã đọc được chữ Hangul. Dòng La-tinh (RR) dưới chữ Hàn trong bài học vẫn hiện để giúp bạn khi cần.",
                        "You passed! You can read Hangul. The RR line under Korean text stays in the lessons to help when you need it."),
            "passedBadge": t("Đã qua bài kiểm tra Hangul", "Hangul check passed"),
            "entryRecommended": t("Nên làm trước bài 1: bảng chữ Hangul và một bài kiểm tra nhanh.", "Best before lesson 1: the Hangul tables and a quick check."),
            "entryPassed": t("Đã qua bài kiểm tra Hangul — xem lại bảng chữ lúc nào cũng được.", "Hangul check passed — review the tables any time."),
        },
        "items": items,
    },
}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8", newline="\n") as f:
    json.dump(primer, f, ensure_ascii=False, indent=2)
    f.write("\n")
cells = sum(len(r["items"]) for s in sections if s["kind"] == "hangulSounds" for r in s["rows"])
print("primer:", len(sections), "sections,", cells, "example items,", len(items), "checkpoint items")
