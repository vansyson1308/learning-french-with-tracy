"""ja kana primer (P4c session 3, task 5): content/ja/primer/script-primer.json.

Full hiragana and katakana: the basic table, dakuten / handakuten, yōon, small っ, long vowels (ー), then a 20-item
checkpoint (kana -> rōmaji, sound -> kana, minimal pairs). Passing it (16/20) turns off the romaji line the ja-vi course
shows under Japanese text (profile `romajiUntilPrimer`, persisted `primerPassed`). Every rōmaji here is checked against
the app's Hepburn module (src/lib/languages/ja-romaji.ts) by scripts/lib/script-primer.ts; this file only lays out
the tables. Byte-deterministic. usage: python -I ja-primer.py <repo root>
"""
import json
import sys

ROOT = sys.argv[1]

BASIC = [
    ("", "あいうえお", ["a", "i", "u", "e", "o"]),
    ("k", "かきくけこ", ["ka", "ki", "ku", "ke", "ko"]),
    ("s", "さしすせそ", ["sa", "shi", "su", "se", "so"]),
    ("t", "たちつてと", ["ta", "chi", "tsu", "te", "to"]),
    ("n", "なにぬねの", ["na", "ni", "nu", "ne", "no"]),
    ("h", "はひふへほ", ["ha", "hi", "fu", "he", "ho"]),
    ("m", "まみむめも", ["ma", "mi", "mu", "me", "mo"]),
    ("y", "や_ゆ_よ", ["ya", None, "yu", None, "yo"]),
    ("r", "らりるれろ", ["ra", "ri", "ru", "re", "ro"]),
    ("w", "わ___を", ["wa", None, None, None, "o"]),
    ("n", "ん____", ["n", None, None, None, None]),
]
DAKUTEN = [
    ("g", "がぎぐげご", ["ga", "gi", "gu", "ge", "go"]),
    ("z", "ざじずぜぞ", ["za", "ji", "zu", "ze", "zo"]),
    ("d", "だぢづでど", ["da", "ji", "zu", "de", "do"]),
    ("b", "ばびぶべぼ", ["ba", "bi", "bu", "be", "bo"]),
    ("p", "ぱぴぷぺぽ", ["pa", "pi", "pu", "pe", "po"]),
]
YOON = [
    ("ky", "き", ["kya", "kyu", "kyo"]),
    ("sh", "し", ["sha", "shu", "sho"]),
    ("ch", "ち", ["cha", "chu", "cho"]),
    ("ny", "に", ["nya", "nyu", "nyo"]),
    ("hy", "ひ", ["hya", "hyu", "hyo"]),
    ("my", "み", ["mya", "myu", "myo"]),
    ("ry", "り", ["rya", "ryu", "ryo"]),
    ("gy", "ぎ", ["gya", "gyu", "gyo"]),
    ("j", "じ", ["ja", "ju", "jo"]),
    ("by", "び", ["bya", "byu", "byo"]),
    ("py", "ぴ", ["pya", "pyu", "pyo"]),
]
# Words for っ and long vowels: (kana, rōmaji). Hiragana words, then katakana words with ー.
HIRA_WORDS = [
    ("", [("きって", "kitte"), ("がっこう", "gakkou"), ("ざっし", "zasshi"), ("ちょっと", "chotto")]),
    ("", [("おばあさん", "obaasan"), ("おにいさん", "oniisan"), ("すうじ", "suuji"), ("おとうさん", "otousan")]),
]
KATA_WORDS = [
    ("", [("コーヒー", "kōhī"), ("ケーキ", "kēki"), ("スーパー", "sūpā"), ("ノート", "nōto")]),
    ("", [("カップ", "kappu"), ("ベッド", "beddo"), ("ネット", "netto"), ("チェック", "chekku")]),
]


def kata(text):
    return "".join(chr(ord(c) + 0x60) if "ぁ" <= c <= "ゖ" else c for c in text)


def cell(kana, romaji):
    return {"kana": kana, "romaji": romaji, "audio": {"say": kana, "status": "pending"}}


def gojuon_rows(rows, to_kata):
    out = []
    for consonant, kana, romaji in rows:
        cells = []
        for ch, r in zip(kana, romaji):
            cells.append(None if r is None else cell(kata(ch) if to_kata else ch, r))
        out.append({"consonant": consonant, "cells": cells})
    return out


def yoon_rows(to_kata):
    out = []
    for consonant, base, romaji in YOON:
        cells = [cell(kata(base + small) if to_kata else base + small, r) for small, r in zip("ゃゅょ", romaji)]
        out.append({"consonant": consonant, "cells": cells})
    return out


def word_rows(rows):
    return [{"consonant": c, "cells": [cell(k, r) for k, r in words]} for c, words in rows]


def t(vi, en):
    return {"vi": vi, "en": en}


VOWELS = ["a", "i", "u", "e", "o"]


def section(sid, script, title, explanation, columns, rows, notes=None):
    s = {"kind": "kanaTable", "id": sid, "title": title, "explanation": explanation, "script": script, "columns": columns, "rows": rows}
    if notes:
        s["notes"] = notes
    return s


sections = [
    section(
        "hiragana-basic",
        "hiragana",
        t("Hiragana: bảng cơ bản", "Hiragana: the basic table"),
        t(
            "Năm nguyên âm a, i, u, e, o là nền của cả bảng. Đọc ngắn, gọn: あ là «a», い là «i», う gần «ư» (môi không tròn), え là «ê», お là «ô». Mỗi hàng ghép một phụ âm với năm nguyên âm: か ka, き ki, く ku, け ke, こ ko. Vài chữ không theo đúng hàng: し shi, ち chi, つ tsu, ふ fu. ん là âm «n» đứng một mình ở cuối âm tiết.",
            "The five vowels a, i, u, e, o are the base of the whole table; keep them short and say う with unrounded lips. Each row joins one consonant to the five vowels: か ka, き ki, く ku, け ke, こ ko. A few kana break the pattern: し shi, ち chi, つ tsu, ふ fu. ん is a syllable-final n on its own.",
        ),
        VOWELS,
        gojuon_rows(BASIC, False),
        [
            t(
                "Ba chữ đọc khác khi làm trợ từ: は đọc «wa» (わたしは), へ đọc «ê» (がっこうへ), を đọc «ô» (パンを).",
                "Three kana are read differently as particles: は is «wa» (わたしは), へ is «e» (がっこうへ), を is «o» (パンを).",
            ),
            t(
                "Chữ ん đứng trước nguyên âm thì tách âm: きんえん đọc «kin-en», khác きねん «ki-nen».",
                "ん before a vowel keeps its own beat: きんえん is kin'en, not きねん kinen.",
            ),
        ],
    ),
    section(
        "hiragana-dakuten",
        "hiragana",
        t("Hiragana: dấu ゛ và ゜", "Hiragana: the marks ゛ and ゜"),
        t(
            "Hai vạch ゛ (dakuten) làm phụ âm đục hơn: k thành g, s thành z, t thành d, h thành b. Vòng tròn nhỏ ゜ (handakuten) chỉ đi với hàng h: h thành p. じ và ぢ cùng đọc «ji», ず và づ cùng đọc «zu»; thường gặp じ và ず.",
            "Two strokes ゛ (dakuten) voice the consonant: k becomes g, s becomes z, t becomes d, h becomes b. The small circle ゜ (handakuten) goes only on the h row: h becomes p. じ and ぢ are both «ji», ず and づ both «zu»; じ and ず are the usual ones.",
        ),
        VOWELS,
        gojuon_rows(DAKUTEN, False),
    ),
    section(
        "hiragana-yoon",
        "hiragana",
        t("Hiragana: âm ghép với ゃ ゅ ょ nhỏ", "Hiragana: combined sounds with small ゃ ゅ ょ"),
        t(
            "Một chữ hàng i (き, し, ち…) cộng với ゃ, ゅ, ょ viết nhỏ thành một âm tiết: きゃ «kya», しゅ «shu», ちょ «cho». Viết nhỏ hay viết to làm đổi nghĩa: びょういん (bệnh viện) khác びよういん (tiệm làm tóc).",
            "An i-row kana (き, し, ち…) plus a small ゃ, ゅ or ょ makes one syllable: きゃ kya, しゅ shu, ちょ cho. Small or full size changes the word: びょういん (hospital) is not びよういん (hair salon).",
        ),
        ["ya", "yu", "yo"],
        yoon_rows(False),
    ),
    section(
        "hiragana-small-tsu-long-vowels",
        "hiragana",
        t("っ nhỏ và nguyên âm dài", "Small っ and long vowels"),
        t(
            "っ viết nhỏ không có âm riêng: nó là một nhịp ngắt trước phụ âm sau, nên phụ âm ấy viết đôi trong romaji: きって «kit-te» (tem). Nguyên âm dài kéo dài gấp đôi: おばあさん (bà) dài hơn おばさん (cô, dì). Dòng thứ hai là những từ có nguyên âm dài.",
            "A small っ has no sound of its own: it is a short pause before the next consonant, which is written double in rōmaji: きって kitte (stamp). A long vowel lasts twice as long: おばあさん (grandmother) is longer than おばさん (aunt). The second row holds words with long vowels.",
        ),
        ["1", "2", "3", "4"],
        word_rows(HIRA_WORDS),
        [
            t(
                "おう và えい thường đọc thành ô dài và ê dài: おとうさん «ô-tô-san», とけい «tô-kê».",
                "おう and えい are usually said as a long o and a long e: おとうさん, とけい.",
            ),
        ],
    ),
    section(
        "katakana-basic",
        "katakana",
        t("Katakana: cùng những âm ấy, nét thẳng hơn", "Katakana: the same sounds, straighter strokes"),
        t(
            "Katakana ghi đúng những âm của hiragana nhưng bằng nét thẳng, góc cạnh. Dùng cho từ mượn tiếng nước ngoài (コーヒー cà phê), tên nước ngoài (ナム, ベトナム) và chữ trên biển báo. Dễ nhầm: シ (shi) và ツ (tsu), ソ (so) và ン (n) — xem hướng của nét ngắn.",
            "Katakana writes the same sounds as hiragana with straight, angular strokes: loanwords (コーヒー coffee), foreign names (ナム, ベトナム) and many signs. Easy to confuse: シ (shi) and ツ (tsu), ソ (so) and ン (n) — look at the direction of the short strokes.",
        ),
        VOWELS,
        gojuon_rows(BASIC, True),
    ),
    section(
        "katakana-dakuten",
        "katakana",
        t("Katakana: dấu ゛ và ゜", "Katakana: the marks ゛ and ゜"),
        t(
            "Dấu ゛ và ゜ dùng y như ở hiragana: カ ka → ガ ga, ハ ha → バ ba → パ pa.",
            "The marks ゛ and ゜ work as in hiragana: カ ka → ガ ga, ハ ha → バ ba → パ pa.",
        ),
        VOWELS,
        gojuon_rows(DAKUTEN, True),
    ),
    section(
        "katakana-yoon",
        "katakana",
        t("Katakana: âm ghép với ャ ュ ョ nhỏ", "Katakana: combined sounds with small ャ ュ ョ"),
        t(
            "Âm ghép viết giống hiragana, bằng ャ ュ ョ nhỏ: キャ «kya», シュ «shu», チョ «cho».",
            "Combined sounds work as in hiragana, with a small ャ ュ ョ: キャ kya, シュ shu, チョ cho.",
        ),
        ["ya", "yu", "yo"],
        yoon_rows(True),
    ),
    section(
        "katakana-long-vowels",
        "katakana",
        t("Katakana: dấu ー và ッ nhỏ", "Katakana: the bar ー and small ッ"),
        t(
            "Trong katakana, nguyên âm dài viết bằng dấu gạch ー: コーヒー «kô-hi», ケーキ «kê-ki». Romaji ghi nguyên âm dài bằng dấu gạch trên đầu: kōhī. ッ nhỏ là nhịp ngắt như っ: カップ «kap-pư» (cái cốc).",
            "In katakana a long vowel is written with the bar ー: コーヒー, ケーキ. Rōmaji marks it with a macron: kōhī. A small ッ is the same pause as っ: カップ kappu (cup).",
        ),
        ["1", "2", "3", "4"],
        word_rows(KATA_WORDS),
    ),
]


def placed(n, key, distractors):
    """The key at a position that moves from item to item (n * 7 mod the option count): no position gives it away."""
    at = (n * 7) % (len(distractors) + 1)
    return distractors[:at] + [key] + distractors[at:], at


def kana_item(n, kana, options):
    opts, at = placed(n, options[0], options[1:])
    return {"kind": "kanaToRomaji", "id": f"c{n:02d}", "kana": kana, "options": opts, "correct": at}


def sound_item(n, say, distractors):
    opts, at = placed(n, say, distractors)
    return {"kind": "soundToKana", "id": f"c{n:02d}", "audio": {"say": say, "status": "pending"}, "options": opts, "correct": at}


# Listed key first; placed() moves it.
items = [
    kana_item(1, "し", ["shi", "tsu", "chi", "su"]),
    kana_item(2, "つ", ["tsu", "su", "chi", "to"]),
    kana_item(3, "ふ", ["fu", "ho", "ha", "mu"]),
    kana_item(4, "ね", ["ne", "re", "wa", "nu"]),
    kana_item(5, "シ", ["shi", "tsu", "so", "n"]),
    kana_item(6, "ツ", ["tsu", "shi", "n", "so"]),
    kana_item(7, "ン", ["n", "so", "shi", "tsu"]),
    kana_item(8, "じゃ", ["ja", "jo", "ju", "sha"]),
    kana_item(9, "きょ", ["kyo", "kyu", "ko", "kya"]),
    kana_item(10, "ぱ", ["pa", "ba", "ha", "po"]),
    sound_item(11, "き", ["さ", "ち"]),
    sound_item(12, "ぬ", ["め", "ね"]),
    sound_item(13, "わ", ["れ", "ね"]),
    sound_item(14, "ソ", ["ン", "リ"]),
    sound_item(15, "ジュ", ["シュ", "チュ"]),
    sound_item(16, "おばあさん", ["おばさん"]),
    sound_item(17, "きって", ["きて"]),
    sound_item(18, "ビール", ["ビル"]),
    sound_item(19, "びょういん", ["びよういん"]),
    sound_item(20, "コーヒー", ["コピー"]),
]

primer = {
    "version": 1,
    "language": "ja",
    "id": "ja.primer.script",
    "title": t("Làm quen với chữ kana", "Getting started with kana"),
    "intro": t(
        "Tiếng Nhật dùng ba loại chữ cùng lúc: hiragana (cho từ thuần Nhật và đuôi ngữ pháp), katakana (cho từ mượn tiếng nước ngoài) và kanji (chữ Hán). Mỗi chữ kana ghi trọn một âm tiết chứ không phải một chữ cái, nên học thuộc bảng kana là đọc được mọi từ. Bấm vào một chữ để nghe.",
        "Japanese mixes three scripts: hiragana (native words and grammatical endings), katakana (loanwords) and kanji (Chinese characters). Each kana stands for a whole syllable, not a single letter, so once you know the kana tables you can read any word aloud. Tap a kana to hear it.",
    ),
    "sections": sections,
    "checkpoint": {
        "title": t("Kiểm tra nhanh bảng kana", "Quick kana check"),
        "intro": t(
            "20 câu: đọc chữ rồi chọn cách đọc, nghe rồi chọn chữ. Đúng từ 16 câu là qua. Khi qua, dòng romaji (chữ La-tinh) dưới chữ Nhật trong bài học sẽ tắt — lúc đó bạn đọc bằng kana. Làm lại bao nhiêu lần cũng được.",
            "20 questions: read a kana and pick its sound, listen and pick the kana. 16 correct passes. Once you pass, the rōmaji line under Japanese text in the lessons turns off and you read the kana. Retake it as often as you like.",
        ),
        "passMark": 16,
        "items": items,
    },
}

with open(f"{ROOT}/content/ja/primer/script-primer.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump(primer, f, ensure_ascii=False, indent=2)
    f.write("\n")
print("primer:", sum(len([c for r in s["rows"] for c in r["cells"] if c]) for s in sections), "cells,", len(items), "checkpoint items")
