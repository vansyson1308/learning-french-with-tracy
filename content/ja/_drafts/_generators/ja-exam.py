"""ja-vi practice track on the public format of the JLPT N5 (content/ja/exam/FORMAT-SOURCES.md), after en-exam.py. Original
items only: no official sample question is copied or paraphrased. Two parallel forms, each a full administration.

What the official pages fix (read 2026-11-03): three test sections and their times (言語知識（文字・語彙） 20 min,
言語知識（文法）・読解 40 min, 聴解 30 min); the 大問 of each section and their aims (N5 大問のねらい, n5_revised.pdf: 漢字読み,
表記, 文脈規定, 言い換え類義; 文の文法1・2, 文章の文法, 内容理解（短文 ≈80字・中文 ≈250字）, 情報検索 ≈250字; 課題理解,
ポイント理解, 発話表現, 即時応答); four options to most items and three to some listening items (FAQ, answer sheet); the
two scoring sections, their ranges and pass marks (0-120 ≥ 38, 0-60 ≥ 19, total 0-180 ≥ 80, every section sat). What
they do not fix, and the course chose: the number of items per 大問 (the official pages give none since the 2020
revision), the split of the 120 points between the two test sections, the play count of a recording, and the scaled
scoring (尺度得点), which the app replaces by a share of correct answers.

Appends its stimuli (use: "exam") to listening/OUTPUT.jsonl and readings/OUTPUT.jsonl (run after the layer generators)
and writes exam/OUTPUT.jsonl. Every Japanese string goes through the reading and register checks of the layers
(ja_layers.check); a kanji-reading or spelling item hides its readings in the app (select.scriptAid "hidden") and is
written in kana around its target, as the paper is. Vocabulary is the course lexicon; a word outside it is written in
kana. usage: python -I ja-exam.py <repo root>"""
import os, re, sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ja_layers import DRAFTS, PROBLEMS, check, check_vi, refs, report, write_jsonl  # noqa: E402
from ja_layers import content_refs  # noqa: E402

TRACK = "jlpt_n5"
SECTION_OF = {"m": "moji_goi", "g": "bunpou_dokkai", "d": "bunpou_dokkai", "c": "choukai"}
LATIN = re.compile(r"[A-Za-z]")
JA = re.compile(r"[ぁ-ゖァ-ヺー㐀-䶿一-鿿]")
clips, readings, items = [], [], []
_pos = [0]


def O(k):
    return f"ja.obj.{k}"


KANJI, KANA, EV, PC, MV, AD, QW, ND, TE = (O(k) for k in ["script.kanji_hanviet", "script.kana", "vocab.everyday_basics", "particles.core", "verbs.masu_forms",
                                                     "adjectives.i_na", "questions.question_words", "sentences.noun_desu", "verbs.te_form"])
RM, RN, RT, LD, LI, GR, POL = (O(k) for k in ["reading.short_messages", "reading.notices_info", "reading.short_texts", "listening.short_dialogues",
                                             "listening.short_info", "greetings.basic", "politeness.levels"])


def place(correct, wrong):
    n = len(wrong) + 1
    if correct in wrong or len(set(wrong)) != len(wrong):
        PROBLEMS.append(f"{correct}: a distractor repeats an option: {wrong}")
    p = _pos[0] % n
    _pos[0] += 1
    o = list(wrong)
    o.insert(p, correct)
    return o, p


def item(form, task, n, exercise, obj, lex=None):
    slug = f"{form}_{task}_{n:02d}"
    ex = dict(exercise)
    ex["id"] = f"ja-exx-{TRACK}-{slug}"
    rec = {"id": f"ja.exi.{TRACK}.{slug}", "itemVersion": 1, "sectionId": SECTION_OF[task[0]], "taskId": task, "exercise": ex, "objectiveTargets": [obj]}
    if lex:
        rec["lexemeRefs"] = lex
    items.append(rec)


def _ja(where, text, plain=False):
    check(where, text, plain)


def _latin_only(where, text):
    if LATIN.search(text):
        PROBLEMS.append(f"{where}: Latin letters in {text!r}")


def _k2h(text):
    return "".join(chr(ord(c) - 0x60) if "ァ" <= c <= "ヶ" else c for c in text)


GAP = "（　）"


def gap_select(form, task, n, sentence, key, wrong, obj, lex_of=None):
    """A sentence with （　）: choose the word or form that fits (文脈規定, 文法形式の判断)."""
    if sentence.count(GAP) != 1:
        PROBLEMS.append(f"{sentence}: needs exactly one {GAP}")
    _ja(sentence, sentence.replace(GAP, key))
    for w in wrong:
        _ja(sentence, w, plain=True)
    o, p = place(key, wrong)
    lex = [i for i in refs(lex_of)] if lex_of else None
    item(form, task, n, {"type": "select", "mode": "nativeToTarget", "prompt": sentence, "options": [{"text": t} for t in o], "correct": p}, obj, lex or None)


def reading_item(form, n, sentence, target, key, wrong):
    """漢字読み: the sentence in kana around 【kanji word】; options are readings in kana. Readings are hidden in the app."""
    if f"【{target}】" not in sentence:
        PROBLEMS.append(f"{sentence}: no 【{target}】")
    _ja(sentence, sentence.replace("【", "").replace("】", ""))
    plain = sentence.replace(f"【{target}】", "")
    if re.search(r"[㐀-䶿一-鿿]", plain):
        PROBLEMS.append(f"{sentence}: only the target is in kanji (the readings are hidden)")
    lid = refs(target)
    if len(lid) != 1:
        PROBLEMS.append(f"{target}: not one lexeme ({lid})")
    from ja_layers import INDEX  # noqa: E402
    if INDEX.kana(target) != key:
        PROBLEMS.append(f"{target}: stored reading {INDEX.kana(target)!r} ≠ key {key!r}")
    for w in wrong:
        _ja(sentence, w, plain=True)
        if re.search(r"[㐀-䶿一-鿿]", w):
            PROBLEMS.append(f"{sentence}: a reading option is kana")
    o, p = place(key, wrong)
    item(form, "m1", n, {"type": "select", "mode": "nativeToTarget", "prompt": sentence, "options": [{"text": t} for t in o], "correct": p, "scriptAid": "hidden"}, KANJI, lid)


def spelling_item(form, n, sentence, kana, key, wrong, obj=KANJI):
    """表記: the sentence in kana with 【a word】; options are spellings, the wrong ones are not words (no reading check)."""
    if f"【{kana}】" not in sentence:
        PROBLEMS.append(f"{sentence}: no 【{kana}】")
    if re.search(r"[㐀-䶿一-鿿]", sentence):
        PROBLEMS.append(f"{sentence}: the sentence is kana (the readings are hidden)")
    _ja(sentence, sentence.replace("【", "").replace("】", ""))
    _ja(sentence, key, plain=True)
    lid = refs(key)
    if len(lid) != 1:
        PROBLEMS.append(f"{key}: not one lexeme ({lid})")
    from ja_layers import INDEX  # noqa: E402
    if _k2h(INDEX.kana(key)) != _k2h(kana):
        PROBLEMS.append(f"{key}: reading {INDEX.kana(key)!r} ≠ {kana!r}")
    for w in wrong:
        _latin_only(sentence, w)
        if refs(w) == lid:
            PROBLEMS.append(f"{sentence}: distractor {w} is the key's word")
    o, p = place(key, wrong)
    item(form, "m2", n, {"type": "select", "mode": "nativeToTarget", "prompt": sentence, "options": [{"text": t} for t in o], "correct": p, "scriptAid": "hidden"}, obj, lid)


def paraphrase_item(form, n, sentence, key, wrong):
    """言い換え類義: the sentence closest in meaning to the one shown."""
    _ja(sentence, sentence.replace("【", "").replace("】", ""))
    for t in [key, *wrong]:
        _ja(sentence, t)
    o, p = place(key, wrong)
    item(form, "m4", n, {"type": "select", "mode": "nativeToTarget", "prompt": sentence, "options": [{"text": t} for t in o], "correct": p}, EV, content_refs(key) or None)


STAR = "★"
BLANK = "＿＿"


def order_item(form, n, frame, chunks, obj=ND):
    """文の組み立て: the frame has three ＿＿ and one ★; chunks are given in the one right order; the key is the ★ chunk."""
    slots = re.findall(rf"{BLANK}|{STAR}", frame)
    if len(slots) != 4 or slots.count(STAR) != 1 or len(chunks) != 4 or len(set(chunks)) != 4:
        PROBLEMS.append(f"{frame}: needs three {BLANK}, one {STAR} and four distinct chunks")
        return
    star = slots.index(STAR)
    it = iter(chunks)
    full = re.sub(rf"{BLANK}|{STAR}", lambda m: next(it), frame).replace("　", "")
    _ja(frame, full)
    for c in chunks:
        _ja(frame, c, plain=True)
    key = chunks[star]
    o, p = place(key, [c for i, c in enumerate(chunks) if i != star])
    item(form, "g2", n, {"type": "select", "mode": "nativeToTarget", "prompt": frame, "options": [{"text": t} for t in o], "correct": p}, obj)


def reading(rid, kind, title, blocks, obj, units, chars=None):
    _ja(rid, title, plain=True)
    for b in blocks:
        _ja(rid, b, plain=not b.endswith(("。", "？", "か")))
    text = "".join(blocks)
    n = len(re.sub(r"[\s　。、：・（）0-9０-９\-]", "", text))
    if chars and not chars[0] <= n <= chars[1]:
        PROBLEMS.append(f"{rid}: {n} characters, the format's band is {chars}")
    readings.append({"id": rid, "kind": kind, "title": title, "blocks": [{"kind": "paragraph", "text": b} for b in blocks], "objectiveRefs": [obj], "lexemeRefs": refs(title + "。" + text),
                     "supportGlossary": [], "sourceRef": "original-project", "authoringSpec": {"informationUnits": units, "inferenceDemand": "locate"}, "use": "exam"})
    return rid, n


def rc(form, task, n, rid, q, key, wrong, obj):
    check_vi(rid, q)
    for t in [key, *wrong]:
        (_ja(rid, t, plain=True) if JA.search(t) else check_vi(rid, t))
    o, p = place(key, wrong)
    item(form, task, n, {"type": "readingComprehension", "readingId": rid, "question": q, "options": [{"text": t} for t in o], "correct": p}, obj)


def clip(cid, kind, segs, obj, units=2):
    for _, t in segs:
        _ja(cid, t)
    text = "".join(t for _, t in segs)
    clips.append({"id": cid, "kind": kind, "segments": [{"speaker": s, "text": t} for s, t in segs], "objectiveRefs": [obj], "lexemeRefs": refs(text),
                  "sourceRef": "original-project", "authoringSpec": {"informationUnits": units, "inferenceDemand": "locate"}, "scoredPlaybackPolicy": {"maxPlays": 2, "rate": 1}, "use": "exam"})
    return cid


def lc(form, task, n, cid, q, key, wrong, obj):
    check_vi(cid, q)
    for t in [key, *wrong]:
        (_ja(cid, t, plain=True) if JA.search(t) else check_vi(cid, t))
    o, p = place(key, wrong)
    item(form, task, n, {"type": "listeningComprehension", "clipId": cid, "question": q, "options": [{"text": t} for t in o], "correct": p}, obj)


# =============================================================== 言語知識（文字・語彙） 20 min
M1 = {
 "a": [("【毎朝】　7じに　おきます。", "毎朝", "まいあさ", ["まいにち", "まいばん", "まえあさ"]),
       ("わたしの　【先生】は　にほんじんです。", "先生", "せんせい", ["せんせ", "せいせい", "さんせい"]),
       ("【電車】で　かいしゃへ　いきます。", "電車", "でんしゃ", ["でんしや", "てんしゃ", "でんしょ"]),
       ("【午後】　3じに　あいましょう。", "午後", "ごご", ["ごうご", "ごごう", "ここ"]),
       ("この　みせは　【安い】です。", "安い", "やすい", ["たかい", "あさい", "やさい"]),
       ("つぎの　かどを　【右】に　まがって　ください。", "右", "みぎ", ["ひだり", "みき", "うえ"]),
       ("【来週】　くにへ　かえります。", "来週", "らいしゅう", ["らいしゅ", "こんしゅう", "らいしょう"])],
 "b": [("【毎晩】　しゅくだいを　します。", "毎晩", "まいばん", ["まいあさ", "まいぱん", "まいにち"]),
       ("【学校】は　えきの　ちかくです。", "学校", "がっこう", ["がこう", "がっこ", "かっこう"]),
       ("きょうは　【天気】が　いいですね。", "天気", "てんき", ["でんき", "てんぎ", "てんけ"]),
       ("【午前】　9じに　きて　ください。", "午前", "ごぜん", ["ごご", "ごせん", "ごぜい"]),
       ("この　かばんは　【高い】です。", "高い", "たかい", ["やすい", "ながい", "たけい"]),
       ("【左】の　ドアから　はいって　ください。", "左", "ひだり", ["みぎ", "ひたり", "した"]),
       ("【先月】　にほんへ　きました。", "先月", "せんげつ", ["らいげつ", "せんがつ", "さきげつ"])],
}
M2 = {
 "a": [("【がっこう】で　べんきょうします。", "がっこう", "学校", ["字校", "学交", "学枚"], KANJI),
       ("ともだちに　【でんわ】を　かけます。", "でんわ", "電話", ["雷話", "電語", "電活"], KANJI),
       ("まどから　【やま】が　みえます。", "やま", "山", ["出", "川", "止"], KANJI),
       ("よる、【テレビ】を　みます。", "テレビ", "テレビ", ["テレピ", "テルビ", "テレヒ"], KANA),
       ("まいあさ　【みず】を　のみます。", "みず", "水", ["氷", "木", "永"], KANJI)],
 "b": [("わからない　ときは　【せんせい】に　ききます。", "せんせい", "先生", ["先正", "失生", "洗生"], KANJI),
       ("【くるま】で　いきます。", "くるま", "車", ["東", "軍", "里"], KANJI),
       ("あそこに　【おとこ】の　ひとが　います。", "おとこ", "男", ["思", "田", "早"], KANJI),
       ("あさ、【コーヒー】を　のみます。", "コーヒー", "コーヒー", ["ローヒー", "コーヒ", "コオヒー"], KANA),
       ("【あめ】が　ふって　います。", "あめ", "雨", ["両", "雪", "南"], KANJI)],
}
M3 = {
 "a": [("さむいですから、まどを　（　）　ください。", "しめて", ["あけて", "つけて", "あらって"], "閉める"),
       ("きのう　デパートで　くつを　（　）。ちょっと　たかかったです。", "かいました", ["よみました", "ききました", "のみました"], "買う"),
       ("あたまが　（　）ですから、くすりを　のみます。", "いたい", ["たかい", "ながい", "おもしろい"], "痛い"),
       # D-10 review: はいれます (potential) is N4; くらい and ふるい do not clash with the new context, so they went too.
       ("この　へやは　（　）ですね。つくえと　いすが　たくさん　あります。", "ひろい", ["せまい", "みじかい", "わかい"], "広い"),
       ("らいしゅう、ともだちに　（　）を　かきます。", "てがみ", ["しゃしん", "えいが", "おかし"], "手紙"),
       ("ここは　（　）ですから、しずかに　して　ください。", "としょかん", ["スーパー", "えき", "コンビニ"], "図書館")],
 "b": [("くらいですから、でんきを　（　）　ください。", "つけて", ["けして", "しめて", "ぬいで"], "つける"),
       ("わたしは　まいばん　おふろに　（　）。", "はいります", ["のります", "すわります", "あびます"], "入る"),
       ("この　ケーキは　とても　（　）です。もう　一つ　たべたいです。", "おいしい", ["まずい", "いたい", "くらい"], "おいしい"),
       ("いま　（　）ですか。…くじはんです。", "なんじ", ["いくら", "どこ", "だれ"], "何時"),
       ("びょうきですから、（　）へ　いきます。", "びょういん", ["ぎんこう", "ゆうびんきょく", "こうえん"], "病院"),
       ("つぎの　かどを　みぎに　（　）　ください。", "まがって", ["おりて", "ねて", "あらって"], "曲がる")],
}
M4 = {
 "a": [("この　みせは　【やすい】です。", "この　みせは　たかくないです。", ["この　みせは　たかいです。", "この　みせは　ひろいです。", "この　みせは　あたらしいです。"]),
       ("きのうは　【やすみ】でした。", "きのうは　しごとが　ありませんでした。", ["きのうは　しごとでした。", "きのうは　びょうきでした。", "きのうは　いそがしかったです。"]),
       ("【りょうしん】は　げんきです。", "ちちと　ははは　げんきです。", ["あにと　あねは　げんきです。", "おとうとと　いもうとは　げんきです。", "ともだちは　げんきです。"])],
 "b": [("この　へやは　【くらい】です。", "この　へやは　あかるくないです。", ["この　へやは　せまくないです。", "この　へやは　しずかです。", "この　へやは　あついです。"]),
       ("【おととい】　テストが　ありました。", "ふつかまえに　テストが　ありました。", ["きのう　テストが　ありました。", "みっかまえに　テストが　ありました。", "せんしゅう　テストが　ありました。"]),
       ("わたしは　りょうりが　【へた】です。", "わたしは　りょうりが　じょうずじゃ　ありません。", ["わたしは　りょうりが　すきです。", "わたしは　りょうりが　じょうずです。", "わたしは　りょうりが　きらいじゃ　ありません。"])],
}
for form in "ab":
    for n, (s, target, key, wrong) in enumerate(M1[form], 1):
        reading_item(form, n, s, target, key, wrong)
    for n, (s, kana, key, wrong, obj) in enumerate(M2[form], 1):
        spelling_item(form, n, s, kana, key, wrong, obj)
    for n, (s, key, wrong, lemma) in enumerate(M3[form], 1):
        gap_select(form, "m3", n, s, key, wrong, EV, lemma)
    for n, (s, key, wrong) in enumerate(M4[form], 1):
        paraphrase_item(form, n, s, key, wrong)

# =============================================================== 言語知識（文法）・読解 40 min
G1 = {
 "a": [("わたしは　まいあさ　パン（　）たべます。", "を", ["に", "で", "が"], PC),
       ("にちようびは　こうえん（　）ともだちと　あそびました。", "で", ["を", "が", "へ"], PC),
       ("ベトナム（　）きました。いまは　おおさかに　すんで　います。", "から", ["を", "で", "の"], PC),
       ("これは　わたし（　）かばんです。", "の", ["が", "を", "に"], PC),
       ("きのうは　あめ（　）。", "でした", ["です", "じゃありません", "ます"], ND),
       ("にほんごの　べんきょうは　（　）ですか。", "どう", ["どの", "だれ", "いくつ"], QW),
       ("しゅくだいを　して（　）、テレビを　みます。", "から", ["まで", "より", "ね"], TE),
       ("ここは　きんえんです。たばこを　（　）ください。", "すわないで", ["すって", "すわなくて", "すいます"], TE),
       ("あたまが　いたいです（　）、がっこうを　やすみます。", "から", ["が", "まで", "の"], PC)],
 "b": [("まいにち　7時に　いえ（　）でます。", "を", ["で", "が", "へ"], PC),
       ("えき（　）バスに　のります。", "で", ["が", "を", "と"], PC),
       ("くつは　2かい（　）あります。", "に", ["で", "を", "へ"], PC),
       ("おちゃ（　）コーヒーを　ください。", "と", ["を", "で", "が"], PC),
       ("この　へやは　あまり　（　）。", "ひろくないです", ["ひろいです", "ひろかったです", "ひろいでした"], AD),
       ("「だれが　きましたか。」「たなかさん（　）きました。」", "が", ["を", "に", "で"], PC),
       ("きのうは　どこ（　）いきませんでした。", "も", ["が", "を", "で"], PC),
       ("ここに　なまえを　（　）ください。", "かいて", ["かき", "かく", "かいた"], TE),
       ("あの　ひとは　（　）ひとですか。", "どんな", ["どう", "どれ", "いつ"], QW)],
}
G2 = {
 "a": [("この　＿＿　＿＿　★　＿＿　です。", ["かさ", "は", "だれ", "の"]),
       ("あした　＿＿　＿＿　★　＿＿　か。", ["どこ", "へ", "いき", "ます"]),
       ("これは　＿＿　＿＿　★　＿＿。", ["わたしの", "へやの", "かぎ", "です"]),
       # D-10 review: つくえの ペンと ノートが うえに あります also parsed, with another chunk at ★; this frame has one order.
       ("つくえの　うえに　＿＿　＿＿　★　＿＿。", ["ペン", "と", "ノートが", "あります"])],
 "b": [("その　＿＿　＿＿　★　＿＿　か。", ["ほん", "は", "いくら", "です"]),
       ("まいばん　＿＿　＿＿　★　＿＿。", ["11時", "に", "ね", "ます"]),
       ("ねこは　＿＿　＿＿　★　＿＿　います。", ["おおきい", "き", "の", "したに"]),
       ("あれは　＿＿　＿＿　★　＿＿　か。", ["なん", "の", "ほん", "です"])],
}
for form in "ab":
    for n, (s, key, wrong, obj) in enumerate(G1[form], 1):
        gap_select(form, "g1", n, s, key, wrong, obj)
    for n, (frame, chunks) in enumerate(G2[form], 1):
        order_item(form, n, frame, chunks)

# 文章の文法: a composition with four gaps.
G3 = {
 "a": ("ナムさんの　さくぶん", ["わたしはベトナムから来ました。今、大阪の工場で働いています。工場は駅から（1）です。毎日5分歩いて行きます。",
                          "仕事は8時から5時（2）です。日曜日は休みです。日曜日は友達と公園へ行きます。公園でサッカーを（3）。とても楽しいです。（4）、日本語の勉強は難しいです。"],
       [("ちかい", ["とおい", "たかい", "ひろい"]), ("まで", ["から", "に", "で"]), ("します", ["しました", "しません", "しましょう"]), ("でも", ["それから", "だから", "じゃあ"])]),
 "b": ("ランさんの　さくぶん", ["わたしの部屋は寮の2階にあります。部屋は（1）ですが、きれいです。部屋に机とベッドがあります。テレビは（2）。",
                          "窓から山がみえます。（3）、窓を開けて、山を見ます。（4）、わたしはこの部屋が好きです。"],
       [("せまい", ["あかるい", "ひろい", "あたらしい"]), ("ありません", ["いません", "しません", "ではありません"]), ("毎朝", ["きのう", "先週", "去年"]), ("だから", ["でも", "しかし", "それから"])]),
}
TEXT_GRAMMAR_Q = "Chọn từ thích hợp cho chỗ trống （{}）."
for form in "ab":
    title, paras, gaps = G3[form]
    for k in range(1, 5):
        if f"（{k}）" not in "".join(paras):
            PROBLEMS.append(f"g3 {form}: no gap （{k}）")
    full = "".join(paras)
    for k, (key, _w) in enumerate(gaps, 1):
        full = full.replace(f"（{k}）", key)
    _ja(f"g3 {form}", full)
    rid, _ = reading(f"ja.read.jlpt_n5_{form}_g3", "narrative", title, paras, PC, 4)
    for n, (key, wrong) in enumerate(gaps, 1):
        rc(form, "g3", n, rid, TEXT_GRAMMAR_Q.format(n), key, wrong, PC)

# 読解: short passages (≈80 characters), a mid passage (≈250) and information retrieval (≈250).
D4 = {
 "a": [("メモ", ["グエンさんへ", "明日の会議は10時からです。会議の前に、この書類をコピーしてください。コピーは5枚お願いします。会議の部屋は2階です。わたしは9時半に来ます。", "木村"], RM,
        "Chị Kimura nhờ anh Nguyễn làm gì trước cuộc họp?", "Photo giấy tờ này 5 bản", ["Photo giấy tờ này 10 bản", "Đến phòng họp lúc 10 giờ", "Gọi điện cho chị Kimura"]),
       ("ごみの　だしかた", ["月曜日と木曜日：もえるごみ", "水曜日：びんとかん", "朝8時までに出してください。夜は出さないでください。", "ごみは、アパートの前の箱に入れてください。"], RN,
        "Rác cháy được bỏ vào những ngày nào?", "Thứ Hai và thứ Năm", ["Thứ Tư", "Thứ Hai và thứ Tư", "Mỗi tối"])],
 "b": [("メモ", ["ランさん", "今日は雨ですから、サッカーのれんしゅうはありません。れんしゅうは土曜日の3時からになりました。ばしょは学校の前の公園です。ボールを持って来てください。", "ミン"], RM,
        "Buổi tập bóng đá được chuyển sang khi nào?", "3 giờ thứ Bảy", ["3 giờ hôm nay", "3 giờ Chủ nhật", "Không còn buổi tập nào"]),
       ("病院の　受付", ["午前：9時から12時まで", "午後：3時から6時まで", "土曜日は午前だけです。日曜日は休みです。", "はじめての人は、保険証を持って来てください。受付は病院の1階です。"], RN,
        "Thứ Bảy, bạn có thể đến quầy lễ tân lúc mấy giờ?", "10 giờ sáng", ["4 giờ chiều", "1 giờ chiều", "7 giờ tối"])],
}
D5 = {
 "a": ("ナムさんの　毎日", ["わたしは去年の四月に日本へ来ました。今は名古屋の工場で働いています。工場の仕事は朝8時から夕方5時までです。休憩は1時間です。昼ご飯はいつも工場の食堂で食べます。食堂のラーメンは400円で、とてもおいしいです。",
                       "仕事は少し大変ですが、先輩はとても親切です。わからないことは先輩に聞きます。土曜日の午後は日本語の教室へ行きます。教室にはベトナム人や中国の人がいます。先生は木村さんです。来月、日本語の試験がありますから、毎晩、寮で勉強しています。"],
       [("Anh Nam ăn trưa ở đâu?", "Ở nhà ăn của nhà máy", ["Ở ký túc xá", "Ở quán ramen gần ga", "Ở lớp tiếng Nhật"]),
        ("Vì sao tối nào anh Nam cũng học?", "Vì tháng sau có kỳ thi tiếng Nhật", ["Vì thứ Bảy có lớp tiếng Nhật", "Vì công việc ở nhà máy vất vả", "Vì đàn anh nhờ anh ấy học"])]),
 "b": ("ランさんの　週末", ["わたしは京都の病院で働いています。病院の近くのアパートに住んでいます。アパートから病院まで自転車で15分ぐらいです。",
                       "先週の日曜日、友達と一緒に大阪へ行きました。電車で1時間ぐらいかかりました。大阪で買い物をして、晩ご飯にすしを食べました。すしは少し高かったですが、とてもおいしかったです。大阪は人がたくさんいて、とてもにぎやかでした。",
                       "来週の日曜日は休みですが、どこへも行きません。うちでせんたくやそうじをします。夜は友達に電話します。"],
       [("Chị Lan đi làm bằng gì?", "Xe đạp", ["Tàu điện", "Xe buýt", "Đi bộ"]),
        ("Chủ nhật tuần sau chị Lan làm gì?", "Giặt giũ và dọn dẹp ở nhà", ["Đi làm ở bệnh viện", "Đi Osaka với bạn", "Đi ăn sushi"])]),
}
D6 = {
 "a": ("日本語教室の　あんない", ["さくら町の　こうみんかん　2階", "月曜日のクラス：午前10時から12時まで　はじめての人", "水曜日のクラス：午後7時から9時まで　はじめての人",
                            "金曜日のクラス：午後7時から9時まで　日本語が少しできる人", "土曜日のクラス：午後2時から4時まで　日本語が少しできる人", "お金：1回500円です。きょうかしょはいりません。",
                            "はじめての人は、クラスの前に、受付で名前と住所と電話番号を書いてください。", "電話：06-1234-5678（木村）"],
       ("Anh Minh mới bắt đầu học tiếng Nhật. Anh ấy làm ở nhà máy từ 8 giờ sáng đến 5 giờ chiều, từ thứ Hai đến thứ Sáu. Anh ấy nên học lớp nào?",
        "Lớp thứ Tư", ["Lớp thứ Hai", "Lớp thứ Sáu", "Lớp thứ Bảy"])),
 "b": ("アルバイトの　あんない", ["コンビニ：月曜日から金曜日　夜10時から朝6時まで　1時間1200円", "レストラン：土曜日と日曜日　午前11時から午後3時まで　1時間1100円",
                            "スーパー：月曜日から金曜日　午後5時から9時まで　1時間1000円", "ほんや：土曜日と日曜日　午前9時から午後5時まで　1時間1000円",
                            "日本語が少しできる人をさがしています。電話をしてから、履歴書を持って来てください。", "せいふくは店にあります。ほかの時間も、電話でそうだんできます。",
                            "ばしょ：駅の前の　さくらビル　4階", "電話：06-8765-4321（田中）"],
       ("Chị Lan học ở trường tiếng Nhật từ thứ Hai đến thứ Sáu, từ 9 giờ sáng đến 3 giờ chiều. Chị ấy muốn làm thêm vào buổi tối các ngày trong tuần, không làm đêm. Chị ấy nên làm ở đâu?",
        "Siêu thị", ["Cửa hàng tiện lợi", "Nhà hàng", "Hiệu sách"])),
}
CHARS = {}
for form in "ab":
    for k, (title, blocks, obj, q, key, wrong) in enumerate(D4[form], 1):
        rid, n = reading(f"ja.read.jlpt_n5_{form}_d4_{k}", "message" if obj == RM else "notice", title, blocks, obj, 3, (50, 110))
        CHARS[rid] = n
        rc(form, "d4", k, rid, q, key, wrong, obj)
    title, blocks, qs = D5[form]
    rid, n = reading(f"ja.read.jlpt_n5_{form}_d5", "narrative", title, blocks, RT, 6, (190, 320))
    CHARS[rid] = n
    for k, (q, key, wrong) in enumerate(qs, 1):
        rc(form, "d5", k, rid, q, key, wrong, RT)
    title, blocks, (q, key, wrong) = D6[form]
    rid, n = reading(f"ja.read.jlpt_n5_{form}_d6", "notice", title, blocks, RN, 6, (150, 320))
    CHARS[rid] = n
    rc(form, "d6", 1, rid, q, key, wrong, RN)

# =============================================================== 聴解 30 min (each recording once)
C1 = {
 "a": [([("A", "ナムさん、明日は8時に工場に来てください。"), ("B", "8時ですね。わかりました。"), ("A", "あ、すみません。7時半に来てください。会議があります。")],
        "Ngày mai anh Nam phải đến nhà máy lúc mấy giờ?", "7 giờ rưỡi", ["8 giờ", "8 giờ rưỡi", "7 giờ"]),
       ([("B", "すみません、切手を3枚ください。"), ("A", "はい。封筒もいりますか。"), ("B", "いいえ、封筒はいりません。あ、はがきを2枚ください。")],
        "Người đàn ông mua gì?", "3 con tem và 2 tấm bưu thiếp", ["3 con tem và phong bì", "2 con tem và 3 tấm bưu thiếp", "Chỉ 3 con tem"]),
       ([("A", "明日、みんなで山へ行きます。お弁当を持って来てください。"), ("B", "飲み物も持って来ますか。"), ("A", "飲み物はいりません。わたしが持って行きます。かさを持って来てください。")],
        "Người nghe phải mang gì?", "Cơm hộp và ô", ["Cơm hộp và đồ uống", "Chỉ đồ uống", "Đồ uống và ô"]),
       ([("B", "すみません、駅はどこですか。"), ("A", "この道をまっすぐ行って、二つ目の信号を左に曲がってください。"), ("B", "二つ目の信号を左ですね。ありがとうございます。")],
        "Người đàn ông phải rẽ ở đâu?", "Rẽ trái ở đèn tín hiệu thứ hai", ["Rẽ phải ở đèn tín hiệu thứ hai", "Rẽ trái ở đèn tín hiệu thứ nhất", "Đi thẳng, không rẽ"]),
       ([("A", "グエンさん、この箱を倉庫に運んでください。"), ("B", "はい。全部ですか。"), ("A", "いいえ、大きい箱だけです。小さい箱はここに置いてください。")],
        "Anh Nguyễn phải mang gì vào kho?", "Chỉ những thùng to", ["Tất cả các thùng", "Chỉ những thùng nhỏ", "Không mang thùng nào"]),
       ([("B", "明日の面接は何時からですか。"), ("A", "10時からです。在留カードと写真を持って来てください。"), ("B", "履歴書も持って行きますか。"), ("A", "履歴書はもうもらいました。")],
        "Người đàn ông phải mang gì đến buổi phỏng vấn?", "Thẻ cư trú và ảnh", ["Thẻ cư trú và sơ yếu lý lịch", "Ảnh và sơ yếu lý lịch", "Chỉ sơ yếu lý lịch"]),
       ([("A", "すみません、この薬はいつ飲みますか。"), ("B", "朝と晩、ご飯の後に飲んでください。"), ("A", "昼は飲みませんか。"), ("B", "はい、昼は飲みません。")],
        "Phải uống thuốc này khi nào?", "Sau bữa sáng và bữa tối", ["Sau cả ba bữa", "Trước bữa sáng và bữa tối", "Chỉ buổi trưa"])],
 "b": [([("A", "明日の会議は2時からです。"), ("B", "2時ですね。"), ("A", "あ、すみません。3時からになりました。")],
        "Cuộc họp ngày mai bắt đầu lúc mấy giờ?", "3 giờ", ["2 giờ", "2 giờ rưỡi", "1 giờ"]),
       ([("B", "すみません、りんごを五つください。"), ("A", "はい。みかんもいかがですか。今日は安いですよ。"), ("B", "じゃあ、みかんも三つください。")],
        "Người đàn ông mua gì?", "5 quả táo và 3 quả quýt", ["3 quả táo và 5 quả quýt", "Chỉ 5 quả táo", "5 quả táo và 5 quả quýt"]),
       ([("A", "明日は雨ですから、かさを持って来てください。"), ("B", "ヘルメットも持って来ますか。"), ("A", "ヘルメットは工場にあります。手袋を持って来てください。")],
        "Người nghe phải mang gì?", "Ô và găng tay", ["Ô và mũ bảo hộ", "Mũ bảo hộ và găng tay", "Chỉ ô"]),
       ([("B", "すみません、銀行はどこですか。"), ("A", "この道をまっすぐ行って、一つ目の角を右に曲がってください。銀行は郵便局の隣です。")],
        "Ngân hàng ở đâu?", "Rẽ phải ở góc thứ nhất, cạnh bưu điện", ["Rẽ trái ở góc thứ nhất, cạnh bưu điện", "Rẽ phải ở góc thứ hai, cạnh bưu điện", "Rẽ phải ở góc thứ nhất, trước bưu điện"]),
       ([("A", "リンさん、このいすを教室に並べてください。"), ("B", "はい。いくつですか。"), ("A", "十です。机はもうあります。")],
        "Chị Linh phải làm gì?", "Xếp mười cái ghế trong lớp", ["Xếp mười cái bàn trong lớp", "Mang bàn ra khỏi lớp", "Xếp năm cái ghế trong lớp"]),
       ([("B", "明日、市役所へ行きます。何を持って行きますか。"), ("A", "在留カードと保険証を持って行ってください。"), ("B", "写真もいりますか。"), ("A", "写真はいりません。")],
        "Phải mang gì đến toà thị chính?", "Thẻ cư trú và thẻ bảo hiểm", ["Thẻ cư trú và ảnh", "Thẻ bảo hiểm và ảnh", "Chỉ ảnh"]),
       ([("A", "すみません、この薬は一日になんかい飲みますか。"), ("B", "1回です。寝る前に飲んでください。"), ("A", "わかりました。")],
        "Phải uống thuốc này thế nào?", "Một lần, trước khi đi ngủ", ["Hai lần, sáng và tối", "Một lần, sau bữa sáng", "Ba lần, sau bữa ăn"])],
}
C2 = {
 "a": [([("B", "昨日、どうして休みましたか。"), ("A", "熱がありましたから。今日はもう大丈夫です。")], "Vì sao hôm qua người phụ nữ nghỉ?", "Vì bị sốt", ["Vì đi thăm mẹ ở bệnh viện", "Vì tàu điện bị trễ", "Vì có việc ở toà thị chính"]),
       ([("A", "週末は何をしましたか。"), ("B", "土曜日は友達と映画を見ました。日曜日はうちで本を読みました。")], "Chủ nhật người đàn ông làm gì?", "Đọc sách ở nhà", ["Xem phim với bạn", "Đi làm", "Đi mua sắm"]),
       ([("A", "このシャツはいくらですか。"), ("B", "2000円です。白いシャツは1500円です。"), ("A", "じゃあ、白いのをください。")], "Người phụ nữ trả bao nhiêu tiền?", "1500 yên", ["2000 yên", "3500 yên", "500 yên"]),
       ([("B", "ランさんのお兄さんは何をしていますか。"), ("A", "兄は銀行で働いています。姉は看護師です。")], "Anh trai của chị Lan làm gì?", "Làm ở ngân hàng", ["Làm y tá", "Làm ở bệnh viện", "Làm ở nhà máy"]),
       ([("A", "明日の天気はどうですか。"), ("B", "朝は雨ですが、午後は晴れます。")], "Chiều mai thời tiết thế nào?", "Trời nắng", ["Trời mưa", "Trời có tuyết", "Trời nhiều mây"]),
       ([("B", "日本語の授業は何曜日ですか。"), ("A", "火曜日と金曜日です。時間は7時から9時までです。")], "Lớp tiếng Nhật vào những ngày nào?", "Thứ Ba và thứ Sáu", ["Thứ Hai và thứ Sáu", "Thứ Ba và thứ Năm", "Thứ Tư và thứ Sáu"])],
 "b": [([("B", "どうして遅れましたか。"), ("A", "すみません。電車が遅れましたから。")], "Vì sao người phụ nữ đến muộn?", "Vì tàu điện bị trễ", ["Vì ngủ dậy muộn", "Vì xe buýt không đến", "Vì bị ốm"]),
       ([("A", "昨日の夜は何をしましたか。"), ("B", "友達に手紙を書きました。それから、10時に寝ました。")], "Tối qua, việc đầu tiên người đàn ông làm là gì?", "Viết thư cho bạn", ["Đi ngủ lúc 10 giờ", "Gọi điện cho bạn", "Đọc sách"]),
       ([("A", "このかばんはいくらですか。"), ("B", "3000円です。黒いかばんは2500円です。"), ("A", "じゃあ、黒いのをください。")], "Người phụ nữ trả bao nhiêu tiền?", "2500 yên", ["3000 yên", "5500 yên", "500 yên"]),
       ([("B", "ナムさんの弟さんは学生ですか。"), ("A", "いいえ、弟は会社員です。妹は学生です。")], "Em trai của anh Nam làm gì?", "Nhân viên công ty", ["Sinh viên", "Giáo viên", "Bác sĩ"]),
       ([("A", "明日は寒いですか。"), ("B", "いいえ、明日は暖かいです。でも、風が強いですよ。")], "Thời tiết ngày mai thế nào?", "Ấm nhưng gió mạnh", ["Lạnh và gió mạnh", "Ấm và không có gió", "Lạnh nhưng không có gió"]),
       ([("B", "図書館は何時までですか。"), ("A", "月曜日から金曜日までは8時までです。土曜日は5時までです。日曜日は休みです。")], "Thứ Bảy thư viện mở đến mấy giờ?", "5 giờ", ["8 giờ", "6 giờ", "Thứ Bảy thư viện nghỉ"])],
}
SAY_Q = "Trong tình huống bạn vừa nghe, bạn nói gì?"
C3 = {
 "a": [("友達にプレゼントをもらいました。なんと言いますか。", "ありがとうございます。", ["いただきます。", "ごちそうさまでした。"]),
       ("朝、会社で先輩に会いました。なんと言いますか。", "おはようございます。", ["こんばんは。", "おやすみなさい。"]),
       ("今からご飯を食べます。なんと言いますか。", "いただきます。", ["ごちそうさまでした。", "いってきます。"]),
       ("仕事が終わりました。先に帰ります。なんと言いますか。", "お先に失礼します。", ["いただきます。", "いらっしゃいませ。"]),
       ("道がわかりません。人に聞きます。なんと言いますか。", "すみません、駅はどこですか。", ["駅へ行きましょう。", "駅で待ってください。"])],
 "b": [("夜、寝ます。家族になんと言いますか。", "おやすみなさい。", ["おはようございます。", "いってきます。"]),
       ("ご飯を食べました。なんと言いますか。", "ごちそうさまでした。", ["いただきます。", "どういたしまして。"]),
       ("朝、うちを出ます。家族になんと言いますか。", "いってきます。", ["ただいま。", "おかえりなさい。"]),
       ("お客さんが店に来ました。店員はなんと言いますか。", "いらっしゃいませ。", ["いってらっしゃい。", "おじゃまします。"]),
       ("先生の話がわかりませんでした。なんと言いますか。", "もう一度お願いします。", ["どういたしまして。", "いただきます。"])],
}
REPLY_Q = "Chọn câu đáp lại đúng nhất."
C4 = {
 "a": [("お名前はなんですか。", "グエンです。", ["ベトナムです。", "25歳です。"]),
       ("コーヒーとお茶と、どちらがいいですか。", "お茶をお願いします。", ["はい、そうです。", "いいえ、ちがいます。"]),
       ("いつ日本へ来ましたか。", "去年来ました。", ["電車で来ました。", "友達と来ました。"]),
       ("これ、どうぞ。", "ありがとうございます。", ["どういたしまして。", "おやすみなさい。"]),
       ("お国はどちらですか。", "ベトナムです。", ["大阪です。", "あちらです。"]),
       ("明日、一緒に昼ご飯を食べませんか。", "いいですね。", ["いただきます。", "ごちそうさまでした。"])],
 "b": [("おいくつですか。", "30歳です。", ["300円です。", "3時です。"]),
       ("すみません、今、何時ですか。", "3時半です。", ["三月です。", "3時間です。"]),
       ("どこに住んでいますか。", "駅の近くです。", ["毎日です。", "自転車です。"]),
       ("お元気ですか。", "はい、元気です。", ["はい、そうです。", "いいえ、結構です。"]),
       ("それはだれのかさですか。", "わたしのです。", ["あそこです。", "1000円です。"]),
       ("週末、どこかへ行きましたか。", "はい、京都へ行きました。", ["いいえ、行きません。", "はい、行きましょう。"])],
}
for form in "ab":
    for n, (segs, q, key, wrong) in enumerate(C1[form], 1):
        lc(form, "c1", n, clip(f"ja.clip.jlpt_n5_{form}_c1_{n:02d}", "dialogue", segs, LD, 3), q, key, wrong, LD)
    for n, (segs, q, key, wrong) in enumerate(C2[form], 1):
        lc(form, "c2", n, clip(f"ja.clip.jlpt_n5_{form}_c2_{n:02d}", "dialogue", segs, LD, 2), q, key, wrong, LD)
    for n, (situation, key, wrong) in enumerate(C3[form], 1):
        speaker = "A" if (n + (form == "b")) % 2 else "B"
        lc(form, "c3", n, clip(f"ja.clip.jlpt_n5_{form}_c3_{n:02d}", "message", [(speaker, situation)], LI, 1), SAY_Q, key, wrong, GR)
    for n, (line, key, wrong) in enumerate(C4[form], 1):
        speaker = "B" if (n + (form == "b")) % 2 else "A"
        lc(form, "c4", n, clip(f"ja.clip.jlpt_n5_{form}_c4_{n:02d}", "message", [(speaker, line)], LD, 1), REPLY_Q, key, wrong, LD)


# =============================================================== the track
def T(vi):
    """Vietnamese track text; the Japanese names of the sections and 大問 (in brackets, or a section title's head) are proper names."""
    bare = re.sub(r"\([^)]*\)|（[^）]*）", "", vi)
    for name in ("言語知識", "・読解", "・語彙", "聴解"):
        bare = bare.replace(name, "")
    check_vi("track", bare)
    return {"vi": vi}


def task(tid, title, instr, fmt, n, **kw):
    t = {"id": tid, "title": T(title), "instruction": T(instr), "format": fmt}
    t.update(kw)
    t["itemsPerForm"] = n
    return t


NAME = "Luyện đề JLPT N5 (theo định dạng công khai)"
OFFICIAL = "theo các trang chính thức của JLPT"
NOT_COUNTS = "Trang chính thức không công bố số câu của từng dạng, nên số câu ở đây do khoá học chọn."
SHOWN = "Ở đây câu hỏi hiện bằng tiếng Việt và các lựa chọn bằng tiếng Việt; trong đề thật, câu hỏi được đọc bằng tiếng Nhật và lựa chọn in bằng tiếng Nhật hoặc bằng tranh."
HEARD = "Ở đây câu hỏi hiện bằng tiếng Việt và các câu trả lời được in ra; trong đề thật, các câu trả lời chỉ được nghe, không in ra."
track = {
 "id": f"ja.exam.{TRACK}", "trackVersion": 1, "name": "JLPT N5", "level": "N5", "formatFidelity": "partial",
 "title": T(NAME),
 "description": T("Luyện theo định dạng công khai của Kỳ thi Năng lực Nhật ngữ (JLPT) cấp N5, do Quỹ Giao lưu Quốc tế Nhật Bản và Hiệp hội Hỗ trợ Giáo dục Quốc tế Nhật Bản tổ chức: "
                  "ba phần thi với thời gian 20, 40 và 30 phút, các dạng câu hỏi của từng phần, bốn lựa chọn cho phần lớn câu hỏi, và hai điểm thành phần cùng điểm sàn đã công bố. "
                  f"{NOT_COUNTS} Mọi câu hỏi đều do khoá học tự soạn, không lấy từ đề thi hay đề mẫu. "
                  "JLPT tính điểm quy đổi theo một mô hình thống kê; ứng dụng chỉ tính tỉ lệ câu đúng, nên điểm ở đây là ước tính gần đúng. "
                  "Phần Nghe được điều chỉnh: câu hỏi hiện bằng tiếng Việt, các lựa chọn được in ra, và mỗi đoạn chỉ nghe một lần. Phần Đọc có thể hiện cách đọc trên chữ Hán nếu bạn bật nó; câu hỏi về cách đọc và cách viết chữ Hán thì luôn ẩn. "
                  "JLPT N5 không phải một bậc của khung CEFR, và đây không phải kỳ thi chính thức."),
 "formatSource": {
  "publisher": "The Japan Foundation; Japan Educational Exchanges and Services",
  "references": [
   {"url": "https://www.jlpt.jp/guideline/testsections.html", "title": "試験科目と試験時間・問題の構成 (sections, times, 大問 marked for N5)", "retrieved": "2026-11-03"},
   {"url": "https://www.jlpt.jp/sp/e/guideline/testsections.html", "title": "Test Sections and Test Times (English page, same content)", "retrieved": "2026-11-03"},
   {"url": "https://www.jlpt.jp/guideline/pdf/n5_revised.pdf", "title": "N5 大問のねらい (the aim of each 大問 and the text lengths)", "retrieved": "2026-11-03"},
   {"url": "https://www.jlpt.jp/guideline/results.html", "title": "得点区分・合格点と基準点 (scoring sections, ranges, pass marks)", "retrieved": "2026-11-03"},
   {"url": "https://www.jlpt.jp/faq/index.html", "title": "よくある質問 (options per item, scaled scores)", "retrieved": "2026-11-03"},
   {"url": "https://www.jlpt.jp/samples/pdf/N5-kaitou.pdf", "title": "N5 解答用紙 from the 2009 sample set (answer sheet: four or three options per もんだい; format only)", "retrieved": "2026-11-03"},
  ],
  "checkedAgainstOfficialGuide": True,
  "checkedBy": "coding agent (owner-delegated)",
  "checkedAt": "2026-11-03",
  "note": T("Thời gian, các dạng câu hỏi, số lựa chọn, điểm thành phần và điểm sàn được đối chiếu với các trang chính thức của JLPT ngày 2026-11-03. "
            "Những điều trang chính thức không nêu do khoá học chọn: số câu của từng dạng, cách chia 120 điểm giữa hai phần thi đầu, và số lần nghe (ở đây một lần). "
            "JLPT tính điểm quy đổi, không cộng điểm từng câu; ứng dụng dùng tỉ lệ câu đúng, nên kết quả chỉ gần đúng."),
 },
 "sections": [
  {"id": "moji_goi", "skill": "structures", "title": T("言語知識（文字・語彙）— Chữ và từ vựng"), "minutes": 20, "maxPoints": 60, "tasks": [
    task("m1", "Dạng 1 — Cách đọc chữ Hán (漢字読み)", "Chọn cách đọc đúng của từ trong 【 】.", "mcq4", 7),
    task("m2", "Dạng 2 — Cách viết (表記)", "Từ trong 【 】 viết bằng chữ Hán hoặc katakana thế nào? Chọn cách viết đúng.", "mcq4", 5),
    task("m3", "Dạng 3 — Từ hợp ngữ cảnh (文脈規定)", "Chọn từ thích hợp cho chỗ （　）.", "mcq4", 6),
    task("m4", "Dạng 4 — Câu cùng nghĩa (言い換え類義)", "Chọn câu có nghĩa gần nhất với câu đã cho; phần trong 【 】 được nói theo cách khác.", "mcq4", 3)]},
  {"id": "bunpou_dokkai", "skill": "structures", "title": T("言語知識（文法）・読解 — Ngữ pháp và Đọc hiểu"), "minutes": 40, "maxPoints": 60, "tasks": [
    task("g1", "Dạng 1 — Chọn dạng ngữ pháp (文法形式の判断)", "Chọn từ hoặc dạng đúng cho chỗ （　）.", "mcq4", 9),
    task("g2", "Dạng 2 — Sắp xếp câu (文の組み立て)", "Sắp xếp bốn phần thành câu đúng, rồi chọn phần đứng ở vị trí ★.", "mcq4", 4),
    task("g3", "Dạng 3 — Ngữ pháp trong đoạn văn (文章の文法)", "Đọc đoạn văn và chọn từ thích hợp cho mỗi chỗ trống.", "mcq4", 4, skill="reading"),
    task("d4", "Dạng 4 — Đọc đoạn ngắn (内容理解・短文)", "Đọc mỗi đoạn ngắn (khoảng 80 chữ) và trả lời câu hỏi.", "mcq4", 2, skill="reading"),
    task("d5", "Dạng 5 — Đọc đoạn vừa (内容理解・中文)", "Đọc đoạn văn (khoảng 250 chữ) và trả lời hai câu hỏi.", "mcq4", 2, skill="reading"),
    task("d6", "Dạng 6 — Tìm thông tin (情報検索)", "Đọc thông báo và tìm thông tin cần thiết để trả lời.", "mcq4", 1, skill="reading")]},
  {"id": "choukai", "skill": "listening", "title": T("聴解 — Nghe hiểu"), "minutes": 30, "maxPoints": 60, "playsPerRecording": 1, "tasks": [
    task("c1", "Dạng 1 — Hiểu yêu cầu (課題理解)", f"Nghe hội thoại và chọn việc người đó phải làm. {SHOWN}", "mcq4", 7),
    task("c2", "Dạng 2 — Hiểu ý chính (ポイント理解)", f"Nghe hội thoại và chọn thông tin được hỏi. {SHOWN}", "mcq4", 6),
    task("c3", "Dạng 3 — Chọn câu nói (発話表現)", f"Nghe tình huống và chọn câu nên nói. Trong đề thật có tranh minh hoạ. {HEARD}", "mcq3", 5),
    task("c4", "Dạng 4 — Đáp lời ngay (即時応答)", f"Nghe một câu nói và chọn câu đáp lại đúng. {HEARD}", "mcq3", 6)]},
 ],
 "passRule": {
  "groups": [
   {"id": "gengo_dokkai", "title": T("Điểm thành phần Kiến thức ngôn ngữ và Đọc hiểu (hai phần thi đầu): tối thiểu 38/120"), "sections": ["moji_goi", "bunpou_dokkai"], "min": 38},
   {"id": "choukai_score", "title": T("Điểm thành phần Nghe hiểu: tối thiểu 19/60"), "sections": ["choukai"], "min": 19}],
  "total": {"title": T("Tổng điểm: tối thiểu 80/180"), "min": 80},
  "everySectionTaken": True},
 "scoring": {"perItem": "share_of_section_points", "negativeMarking": False},
 "readiness": {
  "bands": [
   {"id": "ready_estimate", "minGroupShare": 0.6, "label": T("Mức sẵn sàng ước tính: tốt"), "message": T("Ở lần làm thử này, cả hai điểm thành phần và tổng điểm đều cao hơn điểm sàn của định dạng một khoảng an toàn. Đây là mức sẵn sàng ước tính từ bài luyện của khoá học, không phải điểm JLPT.")},
   {"id": "getting_close", "minGroupShare": 0.45, "label": T("Mức sẵn sàng ước tính: gần đạt"), "message": T("Các điểm thành phần và tổng điểm đã chạm điểm sàn của định dạng nhưng chưa có khoảng an toàn. Hãy luyện thêm các phần yếu bên dưới.")},
   {"id": "not_yet", "minGroupShare": 0, "label": T("Mức sẵn sàng ước tính: cần luyện thêm"), "message": T("Có ít nhất một phần chưa vượt rõ điểm sàn. Hãy luyện các phần yếu bên dưới, rồi thử đề còn lại.")}],
  "incomplete": T("Chưa đủ dữ liệu để ước tính: định dạng này yêu cầu làm cả ba phần thi. Các phần đã làm vẫn được tính điểm."),
  "disclaimer": T("Mức sẵn sàng ước tính dựa trên bài luyện của khoá học: không phải kỳ thi chính thức, không do Quỹ Giao lưu Quốc tế Nhật Bản hay Hiệp hội Hỗ trợ Giáo dục Quốc tế Nhật Bản cấp, và không dự đoán kết quả thi thật. "
                  "JLPT tính điểm quy đổi; ở đây điểm là tỉ lệ câu đúng, nên chỉ gần đúng. JLPT N5 không phải một bậc của khung CEFR."),
 },
 "items": items,
 "forms": [{"formId": f, "itemIds": [i["id"] for i in items if i["id"].split(".")[-1].startswith(f + "_")]} for f in "ab"],
}

per_task = Counter((i["sectionId"], i["taskId"]) for i in items)
for s in track["sections"]:
    for t in s["tasks"]:
        if per_task[(s["id"], t["id"])] != 2 * t["itemsPerForm"]:
            PROBLEMS.append(f"{s['id']}/{t['id']}: {per_task[(s['id'], t['id'])]} items, two forms need {2 * t['itemsPerForm']}")
for i in items:
    n = len(i["exercise"]["options"])
    want = 3 if i["taskId"] in ("c3", "c4") else 4
    if n != want:
        PROBLEMS.append(f"{i['id']}: {n} options, the task needs {want}")

write_jsonl(f"{DRAFTS}/listening/OUTPUT.jsonl", clips, "a")
write_jsonl(f"{DRAFTS}/readings/OUTPUT.jsonl", readings, "a")
write_jsonl(f"{DRAFTS}/exam/OUTPUT.jsonl", [track])
report()
print(len(items), "items", dict(sorted(Counter(i["taskId"] for i in items).items())), len(clips), "clips", len(readings), "readings; characters", CHARS)
