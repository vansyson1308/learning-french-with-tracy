"""zh tone and pinyin primer (P4d session 3): content/zh/primer/script-primer.json, the full primer that extends P4b's.

The four tones and the neutral tone, each beside the nearest Vietnamese tone and where it is NOT the same (every
comparison is an approximation and says so); ten minimal pairs that differ only in tone; ten sound contrasts that trap
Vietnamese speakers (zh/ch/sh against z/c/s, r, j/q against Vietnamese q, the aspirated stops, ü, -n/-ng); the three
tone sandhi rules (3+3, 不, 一) with written and spoken pinyin; the basic strokes and stroke order; and a 20-item
checkpoint (10 tone or sound identifications with four pinyin options, 10 minimal pairs with two), pass mark 16.

Passing records the course's persisted `primerPassed` (v9, keyed by course id: no new migration). It switches nothing
off: pinyin is the reading of every hanzi for the whole of A1 and stays under the characters until the learner turns the
course's reading aid off (zh-plan decision 18; no `romajiUntilPrimer` for zh). Every pinyin here is checked by
scripts/lib/script-primer.ts — tones against the zh plugin's parser, the sandhi examples against scripts/lib/zh-sandhi.ts,
the checkpoint keys against the words the primer teaches; this file only lays out the content. Byte-deterministic.
usage: python -I zh-primer.py <repo root>
"""
import json
import sys

ROOT = sys.argv[1]


def t(vi, en):
    return {"vi": vi, "en": en}


def w(hanzi, pinyin, vi, en):
    return {"hanzi": hanzi, "pinyin": pinyin, "gloss": t(vi, en)}


def audio(say):
    return {"say": say, "status": "pending"}


TONES = [
    (1, "ā", "55", w("妈", "mā", "mẹ", "mother"), t(
        "Thanh 1 (55): cao và đều từ đầu đến cuối, như khi ngân một nốt nhạc. Gần nhất là thanh ngang (so sánh gần đúng), nhưng cao hơn hẳn: thanh ngang nằm ở giữa giọng, còn thanh 1 ở gần mức cao nhất. Giữ giọng phẳng tới hết, đừng để nó rơi xuống ở cuối.",
        "Tone 1 (55): high and level from start to end, like a sung note. The nearest Vietnamese tone is the level tone (an approximation), but tone 1 sits much higher, near the top of the voice. Keep it flat to the end; do not let it fall.")),
    (2, "á", "35", w("麻", "má", "cây gai; tê (tê tay)", "hemp; numb"), t(
        "Thanh 2 (35): đi lên từ giữa lên cao, như giọng hỏi lại ngạc nhiên «Á?» hay «Thế á?». Gần với thanh sắc (so sánh gần đúng), nhưng bắt đầu từ giữa giọng chứ không từ cao, lên đều, và không căng, không ngắt gọn ở cuối như thanh sắc giọng Bắc.",
        "Tone 2 (35): rises from mid to high, like a surprised “huh?”. Close to the Vietnamese high rising tone (an approximation), but it starts from the middle of the voice, rises evenly and ends without that tone's tense, clipped close in Northern speech.")),
    (3, "ǎ", "214", w("马", "mǎ", "ngựa", "horse"), t(
        "Thanh 3 (214): hạ xuống thấp rồi lên lại. Gần với thanh hỏi (so sánh gần đúng). Đọc một chữ riêng thì nghe đủ phần xuống và phần lên; trong câu nó thường chỉ còn phần thấp (21), không lên lại. Đừng đọc thành thanh ngã: thanh 3 không có chỗ thắt giọng ở giữa.",
        "Tone 3 (214): dips low, then rises. Close to the Vietnamese dipping tone (an approximation). Said alone it has the whole dip and rise; inside a sentence it usually keeps only the low part (21). It is never glottalised like the Vietnamese broken tone.")),
    (4, "à", "51", w("骂", "mà", "mắng", "to scold"), t(
        "Thanh 4 (51): rơi mạnh từ rất cao xuống thấp, dứt khoát như khi ra lệnh. Tiếng Việt không có thanh nào giống: không phải thanh huyền (huyền thấp và đi ngang, khoảng 21), cũng không phải thanh nặng (nặng ngắn và bị chặn lại). Bắt đầu ở mức cao nhất của giọng rồi cho rơi hết.",
        "Tone 4 (51): falls sharply from the very top to low, like a firm command. No Vietnamese tone matches it: it is not the low falling tone (low and almost level, about 21) and not the heavy tone (short and cut off). Start at the top of your voice and let it fall all the way.")),
    (5, "a", None, w("吗", "ma", "trợ từ hỏi (… không?)", "question particle"), t(
        "Thanh nhẹ: ngắn, nhẹ và không có dấu; độ cao tuỳ chữ đứng trước. Gặp ở trợ từ (吗, 了, 的) và chữ thứ hai của nhiều từ (妈妈, 学生 xué sheng). Đọc lướt và nhẹ, không thêm chỗ ngắt như thanh nặng.",
        "Neutral tone: short, light and unmarked; its pitch depends on the syllable before it. Particles (吗, 了, 的) and the second syllable of many words (妈妈, 学生 xué sheng) have it. Say it lightly, with no glottal stop like the Vietnamese heavy tone.")),
]

PAIRS = [
    (w("买", "mǎi", "mua", "to buy"), w("卖", "mài", "bán", "to sell"), t(
        "Chỉ khác thanh mà nghĩa ngược hẳn: thanh 3 là mua, thanh 4 là bán.",
        "Only the tone differs, and the meanings are opposites: tone 3 buys, tone 4 sells.")),
    (w("是", "shì", "là", "to be"), w("十", "shí", "mười", "ten"), t(
        "shì (thanh 4) là «là», shí (thanh 2) là «mười»: 我是 khác hẳn 十个.",
        "shì (tone 4) is “to be”, shí (tone 2) is “ten”: 我是 is nothing like 十个.")),
    (w("书", "shū", "sách", "book"), w("树", "shù", "cây", "tree"), None),
    (w("汤", "tāng", "canh", "soup"), w("糖", "táng", "đường, kẹo", "sugar, sweets"), None),
    (w("问", "wèn", "hỏi", "to ask"), w("闻", "wén", "ngửi", "to smell"), None),
    (w("课", "kè", "bài học, tiết học", "lesson, class"), w("渴", "kě", "khát", "thirsty"), None),
    (w("水", "shuǐ", "nước", "water"), w("睡", "shuì", "ngủ", "to sleep"), None),
    (w("鸡", "jī", "gà", "chicken"), w("几", "jǐ", "mấy", "how many"), None),
    (w("包", "bāo", "túi, cái bao", "bag"), w("饱", "bǎo", "no (bụng)", "full (after eating)"), None),
    (w("烟", "yān", "thuốc lá; khói", "cigarette; smoke"), w("盐", "yán", "muối", "salt"), None),
]

CONTRASTS = [
    ("zh – z", w("找", "zhǎo", "tìm", "to look for"), w("早", "zǎo", "sớm", "early"), t(
        "zh, ch, sh: cong đầu lưỡi lên chạm phía sau lợi trên (âm uốn lưỡi). z, c, s: đầu lưỡi thẳng, chạm sau răng trên. Chữ z của pinyin đọc gần như «t» và «x» liền nhau (ts), không phải «d» hay «gi» của tiếng Việt.",
        "zh, ch, sh: curl the tongue tip up behind the gum ridge (retroflex). z, c, s: tongue tip flat behind the upper teeth. Pinyin z is a ts sound, not Vietnamese d or gi.")),
    ("ch – c", w("茶", "chá", "trà", "tea"), w("词", "cí", "từ", "word"), t(
        "c của pinyin là «ts» bật hơi mạnh, không phải «c/k» của tiếng Việt. ch gần «ch» tiếng Việt nhưng cong lưỡi và bật hơi (so sánh gần đúng). Chữ i sau z, c, s, zh, ch, sh, r không đọc là «i»: 词 gần «tsư», 是 gần «sư» uốn lưỡi.",
        "Pinyin c is an aspirated ts, not Vietnamese c/k; ch is like Vietnamese ch with the tongue curled back and a puff of air. After z, c, s, zh, ch, sh and r the letter i is not an i sound.")),
    ("sh – s", w("是", "shì", "là", "to be"), w("四", "sì", "bốn", "four"), t(
        "sh gần «s» uốn lưỡi của giọng miền Nam (sông), s gần «x» (xa) — so sánh gần đúng. Khi đọc số, 四 sì (bốn) và 十 shí (mười) rất dễ nhầm: 四十 là bốn mươi, 十四 là mười bốn.",
        "sh is close to the curled s of Southern Vietnamese, s to Vietnamese x — approximately. Numbers trap learners here: 四 sì is four, 十 shí ten; 四十 is forty, 十四 fourteen.")),
    ("r – l", w("热", "rè", "nóng", "hot"), w("乐", "lè", "vui", "happy")),
    ("j – q", w("鸡", "jī", "gà", "chicken"), w("七", "qī", "bảy", "seven"), t(
        "q không phải «qu» của tiếng Việt: q đọc như «ch» bật hơi mạnh, j như «ch» không bật hơi. x (西 xī) gần «x» tiếng Việt nhưng mặt lưỡi nâng cao, môi dẹt.",
        "Pinyin q is not Vietnamese qu: it is an aspirated ch-like sound, and j the same without the puff of air. x (西 xī) is close to Vietnamese x with the tongue raised and the lips spread.")),
    ("d – t", w("都", "dōu", "đều", "all"), w("偷", "tōu", "lấy trộm", "to steal"), t(
        "Pinyin chia phụ âm theo bật hơi: b, d, g không bật hơi (d gần «t» tiếng Việt, không phải «đ»); p, t, k bật hơi mạnh (t gần «th», k gần «kh» nhưng không xát). Đặt tờ giấy trước miệng: nói t, p, k thì giấy rung.",
        "Pinyin sorts stops by aspiration: b, d, g have none (d is close to Vietnamese t, not to the Vietnamese crossed d); p, t, k have a strong puff (t is close to Vietnamese th). Hold a sheet of paper before your mouth: it moves for p, t and k.")),
    ("b – p", w("爸", "bà", "bố", "dad"), w("怕", "pà", "sợ", "to be afraid")),
    ("ü – u", w("绿", "lǜ", "xanh lá cây", "green"), w("路", "lù", "đường", "road"), t(
        "ü: tròn môi như «u» nhưng lưỡi đặt như «i» (gần «uy» đọc liền thành một âm). Sau j, q, x, y, chữ ü viết thành u mà vẫn đọc ü: 去 qù, 鱼 yú.",
        "ü: round the lips for u with the tongue placed for i. After j, q, x and y it is written u but still said ü: 去 qù, 鱼 yú.")),
    ("-n – -ng", w("班", "bān", "ca, lớp", "shift, class"), w("帮", "bāng", "giúp", "to help"), t(
        "-n: đầu lưỡi chạm lợi trên ở cuối âm; -ng: lưỡi lùi ra sau như «ng» tiếng Việt. Giọng miền Nam hay nhập hai âm cuối này; trong tiếng Trung, an/ang, en/eng, in/ing là những từ khác nhau.",
        "-n ends with the tongue tip on the gum ridge; -ng with the back of the tongue, as Vietnamese ng. Southern Vietnamese often merges the two; in Chinese an/ang, en/eng, in/ing are different words.")),
    ("-in – -ing", w("心", "xīn", "tim, lòng", "heart"), w("星", "xīng", "sao", "star")),
]

SANDHI = [
    ("third-third", t(
        "Hai thanh 3 đi liền nhau: chữ đầu đọc thành thanh 2.",
        "Two third tones in a row: the first is said as a second tone."), [
        ("你好", "nǐ hǎo", "ní hǎo", "xin chào", "hello"),
        ("可以", "kě yǐ", "ké yǐ", "có thể, được", "may, can"),
        ("水果", "shuǐ guǒ", "shuí guǒ", "hoa quả", "fruit"),
        ("很好", "hěn hǎo", "hén hǎo", "rất tốt", "very good"),
    ]),
    ("bu", t(
        "不 (bù) đọc thành bú khi đứng trước thanh 4; trước thanh 1, 2, 3 vẫn đọc bù.",
        "不 (bù) is said bú before a fourth tone; before tones 1, 2 and 3 it stays bù."), [
        ("不是", "bù shì", "bú shì", "không phải", "is not"),
        ("不要", "bù yào", "bú yào", "đừng; không cần", "don't; do not want"),
        ("不好", "bù hǎo", "bù hǎo", "không tốt", "not good"),
        ("不来", "bù lái", "bù lái", "không đến", "not come"),
    ]),
    ("yi", t(
        "一 (yī) đọc yí trước thanh 4 và yì trước thanh 1, 2, 3. Khi đếm, khi là số thứ tự hay đứng cuối, vẫn đọc yī.",
        "一 (yī) is said yí before a fourth tone and yì before tones 1, 2 and 3. Counting, as an ordinal or at the end it stays yī."), [
        ("一个", "yī gè", "yí gè", "một cái", "one (thing)"),
        ("一样", "yī yàng", "yí yàng", "giống nhau", "the same"),
        ("一天", "yī tiān", "yì tiān", "một ngày", "one day"),
        ("一起", "yī qǐ", "yì qǐ", "cùng nhau", "together"),
        ("第一", "dì yī", "dì yī", "thứ nhất", "first"),
    ]),
]

STROKES = [
    ("㇐", "héng", t("Nét ngang: viết từ trái sang phải.", "Horizontal: written left to right.")),
    ("㇑", "shù", t("Nét sổ: viết từ trên xuống dưới.", "Vertical: written top to bottom.")),
    ("㇒", "piě", t("Nét phẩy: kéo xiên từ trên phải xuống dưới trái.", "Left-falling: from upper right down to the left.")),
    ("㇏", "nà", t("Nét mác: kéo xiên từ trên trái xuống dưới phải, cuối nét hơi đậm.", "Right-falling: from upper left down to the right, widening at the end.")),
    ("㇔", "diǎn", t("Nét chấm: một nét ngắn chấm xuống.", "Dot: a short downward touch.")),
    ("㇕", "héngzhé", t("Nét gập: đi ngang rồi gập xuống, viết liền một nét.", "Horizontal-turn: across, then down, in one stroke.")),
]
STROKE_RULES = [
    (t("Ngang trước, sổ sau.", "Horizontal before vertical."), "十"),
    (t("Phẩy trước, mác sau.", "Left-falling before right-falling."), "人"),
    (t("Trên trước, dưới sau.", "Top before bottom."), "三"),
    (t("Trái trước, phải sau.", "Left before right."), "川"),
    (t("Ngoài trước, trong sau; nét đóng khung viết sau cùng («vào nhà rồi mới đóng cửa»).", "Outside before inside; the closing stroke comes last."), "国"),
]

sections = [
    {
        "kind": "tones",
        "id": "four-tones",
        "title": t("Bốn thanh và thanh nhẹ", "The four tones and the neutral tone"),
        "explanation": t(
            "Người Việt có lợi thế vì đã quen phân biệt thanh. Nhưng thanh tiếng Trung không trùng với thanh tiếng Việt: mỗi thanh dưới đây chỉ ghi thanh tiếng Việt gần nhất để bạn dễ bắt đầu — đó là so sánh gần đúng, không phải cùng một thanh. Hãy chú ý giọng bắt đầu ở độ cao nào và kết thúc ở đâu; các con số (55, 35, 214, 51) ghi độ cao đó trên thang 1 (thấp) đến 5 (cao).",
            "Vietnamese speakers already hear tones, but Chinese tones are not Vietnamese ones: each tone below names the nearest Vietnamese tone only as a starting point — an approximation, never the same tone. Track where your voice starts and ends; the numbers (55, 35, 214, 51) give that pitch on a scale from 1 (low) to 5 (high).",
        ),
        "tones": [
            {"tone": n, "mark": mark, **({"contour": contour} if contour else {}), "description": desc, "example": ex, "audio": audio(ex["hanzi"])}
            for n, mark, contour, ex, desc in TONES
        ],
        "minimalPairs": [{"a": a, "b": b, **({"note": note} if note else {})} for a, b, note in PAIRS],
        "notes": [
            t(
                "Dấu thanh của pinyin trông giống dấu tiếng Việt nhưng không cùng nghĩa: dấu ´ (thanh 2) đi lên như thanh sắc, nhưng dấu ` (thanh 4) là thanh rơi từ cao, không phải thanh huyền; dấu ˇ (thanh 3) là dấu móc, không phải dấu hỏi.",
                "Pinyin tone marks look like Vietnamese ones without meaning the same: ´ (tone 2) rises like the Vietnamese acute, but ` (tone 4) falls from high and is not the Vietnamese low falling tone, and ˇ (tone 3) is not the Vietnamese hook above.",
            ),
        ],
    },
    {
        "kind": "soundContrasts",
        "id": "initials-finals",
        "title": t("Những âm người Việt hay nhầm", "Sounds Vietnamese speakers mix up"),
        "explanation": t(
            "Nhiều chữ cái pinyin trông giống chữ quốc ngữ nhưng đọc khác. Mỗi cặp dưới đây chỉ khác nhau ở một âm; hãy nghe và nói theo từng cặp. Những so sánh với âm tiếng Việt đều là gần đúng.",
            "Many pinyin letters look like Vietnamese letters but sound different. Each pair below differs in one sound; listen and repeat pair by pair. Every comparison with a Vietnamese sound is an approximation.",
        ),
        "contrasts": [{"focus": f, "a": a, "b": b, **({"note": rest[0]} if rest else {})} for f, a, b, *rest in CONTRASTS],
        "notes": [
            t(
                "Tiếng Trung phổ thông không có âm cuối -c, -t, -p như tiếng Việt: một âm tiết chỉ kết thúc bằng nguyên âm, -n, -ng hoặc -r. 吃 chī không đọc thành «chịt».",
                "Standard Chinese has no final -c, -t or -p: a syllable ends in a vowel, -n, -ng or -r. 吃 chī has no stop at the end.",
            ),
            t(
                "er (二 èr «hai»): một âm duy nhất, nói «ơ» rồi cong lưỡi lên. 儿 ở cuối từ ghép vào chữ trước: 哪儿 nǎr (ở đâu), 一点儿 yìdiǎnr (một chút).",
                "er (二 èr “two”) is one sound: an “uh” said with the tongue curled up. 儿 at the end of a word joins the syllable before it: 哪儿 nǎr, 一点儿 yìdiǎnr.",
            ),
        ],
    },
    {
        "kind": "toneSandhi",
        "id": "tone-sandhi",
        "title": t("Biến điệu: khi thanh đổi theo chữ sau", "Tone sandhi: tones that change before others"),
        "explanation": t(
            "Khi nói, vài thanh đổi theo chữ đứng sau. Pinyin trong sách và trong ứng dụng vẫn ghi thanh gốc; bạn chỉ đổi khi nói. Ba quy tắc dưới đây cần biết ngay từ đầu; dòng «viết» là pinyin ghi trong bài, dòng «đọc» là cách nói.",
            "In speech a few tones change before the next syllable. Pinyin in books and in the app keeps the citation tone; you change it only when you speak. These three rules are needed from the start: “written” is the pinyin the lessons show, “said” is how it sounds.",
        ),
        "rules": [
            {"rule": rule, "text": text, "examples": [{"hanzi": h, "written": wr, "spoken": sp, "gloss": t(vi, en), "audio": audio(h)} for h, wr, sp, vi, en in examples]}
            for rule, text, examples in SANDHI
        ],
        "notes": [
            t(
                "Ba thanh 3 liền nhau (我很好) thường đọc wó hén hǎo hoặc wǒ hén hǎo, tuỳ cách ngắt; cứ nói chậm, rõ từng từ là được.",
                "Three third tones in a row (我很好) are said wó hén hǎo or wǒ hén hǎo depending on grouping; say it slowly, word by word.",
            ),
            t(
                "Trong số điện thoại, phòng, xe buýt, 一 thường đọc yāo để khỏi nhầm với 七 qī.",
                "In phone, room and bus numbers 一 is often said yāo, so that it is not heard as 七 qī.",
            ),
        ],
    },
    {
        "kind": "strokes",
        "id": "basic-strokes",
        "title": t("Các nét cơ bản và thứ tự viết", "Basic strokes and stroke order"),
        "explanation": t(
            "Mọi chữ Hán đều ghép từ một số ít nét cơ bản. Viết đúng thứ tự nét giúp chữ cân đối, dễ nhớ và dễ tra từ điển bằng cách viết tay.",
            "Every character is built from a handful of basic strokes. Writing them in the right order keeps characters balanced, easier to remember and easier to look up by handwriting.",
        ),
        "strokes": [{"shape": shape, "name": name, "description": desc} for shape, name, desc in STROKES],
        "rules": [{"rule": rule, "example": ex} for rule, ex in STROKE_RULES],
    },
]


def placed(n, key, distractors):
    """The key at a position that moves from item to item (n * 7 mod the option count): no position gives it away."""
    at = (n * 7) % (len(distractors) + 1)
    return distractors[:at] + [key] + distractors[at:], at


def item(n, say, key, distractors):
    opts, at = placed(n, key, distractors)
    return {"kind": "soundToPinyin", "id": f"c{n:02d}", "audio": audio(say), "options": opts, "correct": at}


# Listed key first; placed() moves it. Items 1-10: which tone (or sound) — four options; 11-20: a minimal pair or a
# sound contrast of the primer — two options.
items = [
    item(1, "妈", "mā", ["má", "mǎ", "mà"]),
    item(2, "买", "mǎi", ["mái", "mài", "māi"]),
    item(3, "十", "shí", ["shì", "shī", "shǐ"]),
    item(4, "水", "shuǐ", ["shuì", "shuí", "shuī"]),
    item(5, "课", "kè", ["kě", "ké", "kē"]),
    item(6, "糖", "táng", ["tāng", "tǎng", "tàng"]),
    item(7, "几", "jǐ", ["jī", "jí", "jì"]),
    item(8, "四", "sì", ["shì", "sī", "shí"]),
    item(9, "绿", "lǜ", ["lù", "lǚ", "lú"]),
    item(10, "星", "xīng", ["xīn", "xíng", "xìn"]),
    item(11, "卖", "mài", ["mǎi"]),
    item(12, "是", "shì", ["shí"]),
    item(13, "树", "shù", ["shū"]),
    item(14, "闻", "wén", ["wèn"]),
    item(15, "饱", "bǎo", ["bāo"]),
    item(16, "早", "zǎo", ["zhǎo"]),
    item(17, "词", "cí", ["chá"]),
    item(18, "帮", "bāng", ["bān"]),
    item(19, "七", "qī", ["jī"]),
    item(20, "怕", "pà", ["bà"]),
]

primer = {
    "version": 1,
    "language": "zh",
    "id": "zh.primer.script",
    "title": t("Thanh điệu, pinyin và nét chữ Hán", "Tones, pinyin and strokes"),
    "intro": t(
        "Tiếng Trung phổ thông có bốn thanh và một thanh nhẹ. Giống tiếng Việt, đổi thanh là đổi nghĩa: mǎi (买, mua) và mài (卖, bán) là hai từ khác hẳn nhau. Pinyin (bính âm) ghi cách đọc bằng chữ La-tinh, dấu thanh đặt trên nguyên âm; trong bài học, ứng dụng ghi pinyin nhỏ dưới mỗi chữ Hán. Phần này so sánh thanh tiếng Trung với thanh tiếng Việt, chỉ ra những âm người Việt hay nhầm, cách thanh đổi khi nói và các nét chữ cơ bản. Bấm vào một chữ để nghe.",
        "Standard Chinese has four tones plus a light, neutral tone. As in Vietnamese, a different tone makes a different word: mǎi (买, to buy) and mài (卖, to sell) have nothing in common. Pinyin writes the sounds in Latin letters with the tone mark over the vowel; in the lessons the app shows it small under every character. This introduction compares the tones with Vietnamese ones, points out the sounds Vietnamese speakers mix up, shows how tones change in speech and teaches the basic strokes. Tap a character to hear it.",
    ),
    "sections": sections,
    "checkpoint": {
        "title": t("Kiểm tra nhanh: thanh điệu và pinyin", "Quick check: tones and pinyin"),
        "intro": t(
            "20 câu: nghe một chữ rồi chọn cách đọc (pinyin) đúng — đúng thanh và đúng âm. Đúng từ 16 câu là qua. Dù qua hay chưa, pinyin vẫn hiện dưới chữ Hán trong bài học; làm lại bao nhiêu lần cũng được.",
            "20 questions: listen to a character and pick its pinyin — the right tone and the right sound. 16 correct passes. Pass or not, the pinyin stays under the characters in the lessons; retake it as often as you like.",
        ),
        "passMark": 16,
        "items": items,
    },
}

with open(f"{ROOT}/content/zh/primer/script-primer.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump(primer, f, ensure_ascii=False, indent=2)
    f.write("\n")
print("primer:", len(TONES), "tones,", len(PAIRS), "minimal pairs,", len(CONTRASTS), "contrasts,", sum(len(r[2]) for r in SANDHI), "sandhi examples,", len(items), "checkpoint items")
