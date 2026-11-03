"""ja-vi reception (P4c session 4): readings and listening clips of Section 3, checkpoint 3, the capstone and placement,
original Japanese after en-reception-s3.py. Writes content/ja/_drafts/readings/OUTPUT.jsonl and listening/OUTPUT.jsonl
(ja-speech-s4.py and ja-scenarios-s6.py append their clips). The ingest takes the voice cast from
content/audio/voice-casts.json: A kokoro-jf_alpha (female), B kokoro-jm_kumo (male); a clip whose speaker states a
gender sits on the matching voice. Exam-track texts belong to the exam step (session 5).

Furigana come from the lexicon at run time, so the text holds no readings: every kanji is inside a lexicon surface or
an inflection key (ja_layers.check), numbers before a counter are digits only where the stored ruby stays right (7時,
2階, 15分; never 10分), and words outside the lexicon are written in kana, glossed in supportGlossary when they carry
meaning. The factory signs (立入禁止, 安全第一, 禁煙, 足元注意, 消火器) are lexemes since session 5 (core-a2.txt, read
through ja-subset.py and the pinned JmdictFurigana file). A block that is a sentence (。！？) is register-checked;
a sign or a list line is a noun phrase. usage: python -I ja-reception-s3.py <repo root>
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ja_layers import DRAFTS, check, check_vi, clip, refs, report, write_jsonl  # noqa: E402

R_WORDS, R_MSG, R_NOTICE, R_TEXT = "ja.obj.reading.familiar_words", "ja.obj.reading.short_messages", "ja.obj.reading.notices_info", "ja.obj.reading.short_texts"
FW, INFO, ANN, DLG = "ja.obj.listening.familiar_words", "ja.obj.listening.short_info", "ja.obj.listening.announcements", "ja.obj.listening.short_dialogues"
NUM, TIME, WORK, EXIST = "ja.obj.numbers.counters", "ja.obj.vocab.time_calendar", "ja.obj.vocab.work_japan", "ja.obj.existence.aru_iru"


def gl(surface, vi):
    return {"surface": surface, "gloss": {"vi": vi}}


def para(blocks):
    return [{"kind": "paragraph", "text": b} for b in blocks]


def lines(pairs):
    return [{"kind": "line", "speaker": s, "text": t} for s, t in pairs]


SENTENCE_END = ("。", "？", "！", "?", "!")

# id, kind, title, blocks, objectives, glossary, information units
READINGS = [
 # Unit f: words a learner can already read.
 ("uf_room", "description", "わたしの部屋", para(["机といす", "ベッド", "テレビとパソコン", "窓が二つあります。"]), [R_WORDS, EXIST], [], 4),
 ("uf_card", "notice", "名前と住所", para(["名前：グエン・ミン", "国：ベトナム", "仕事：会社員", "住所：大阪", "電話番号：080-1234-5678"]), [R_WORDS], [], 5),
 # Unit g: signs, rules, notices and messages at work.
 ("ug_signs", "notice", "工場の中", para(["安全第一", "入口", "出口", "非常口", "危険", "立入禁止", "禁煙", "足元注意"]), [R_NOTICE, WORK], [], 6),
 ("ug_rules", "notice", "工場の規則", para(["ヘルメットをかぶってください。", "安全靴をはいてください。", "機械に触らないでください。", "工場の中は禁煙です。", "消火器は入口の横にあります。"]), [R_NOTICE, WORK], [], 5),
 ("ug_msg_senpai", "message", "メール", para(["ナムさん", "明日は7時からです。食堂の前で会いましょう。", "田中"]), [R_MSG], [], 3),
 ("ug_msg_boss", "message", "会議", para(["グエンさん、お疲れさまです。", "今日の会議は2時から4時までです。書類を持って来てください。", "木村"]), [R_MSG, TIME], [], 3),
 ("ug_shift", "notice", "シフト", para(["朝のシフト：6時から2時まで", "午後のシフト：2時から10時まで", "少し早く来てください。"]), [R_NOTICE, NUM], [], 3),
 ("ug_menu", "notice", "食堂のメニュー", para(["ラーメン　600円", "カレー　550円", "お弁当　500円", "お茶　100円"]), [R_NOTICE, NUM], [], 4),
 ("ug_hours", "notice", "市役所", para(["月曜日から金曜日まで", "午前8時半から午後5時まで", "土曜日と日曜日は休みです。"]), [R_NOTICE, TIME], [], 3),
 # Unit i: short conversations.
 ("ui_first_day", "dialogue", "はじめまして", lines([("田中", "はじめまして。田中です。"), ("ナム", "はじめまして。ナムです。ベトナムから来ました。"), ("田中", "ナムさん、よろしくおねがいします。"), ("ナム", "よろしくおねがいします。")]), [DLG, R_MSG], [], 3),
 ("ui_konbini", "dialogue", "コンビニで", lines([("店員", "いらっしゃいませ。お弁当はあたためますか。"), ("リン", "はい、お願いします。"), ("店員", "袋はいりますか。"), ("リン", "いいえ、結構です。")]), [DLG, R_MSG], [gl("あたためます", "hâm nóng")], 3),
 ("ui_clinic", "dialogue", "病院の受付で", lines([("受付", "保険証はありますか。"), ("ラン", "はい、これです。"), ("受付", "ここに名前と住所を書いてください。"), ("ラン", "はい、わかりました。")]), [DLG, R_MSG], [], 3),
 ("ui_sorry", "message", "すみません", para(["木村さん", "すみません。風邪をひきました。今日は休みます。明日は行きます。", "グエン"]), [R_MSG], [gl("ひきました", "bị (cảm)")], 3),
 # Unit j: little texts about life in Japan.
 ("uj_nam_day", "narrative", "ナムさんの一日", para(["ナムさんは大阪の工場で働いています。毎朝6時に起きます。7時に寮を出ます。仕事は8時から5時までです。夜は寮で晩ご飯を食べます。"]), [R_TEXT], [], 5),
 ("uj_family", "description", "リンさんの家族", para(["リンさんの家族はお父さんとお母さんと弟さんです。お父さんは医者です。お母さんは看護師です。弟さんは学生です。犬もいます。"]), [R_TEXT, R_WORDS], [], 5),
 ("uj_dorm_rules", "notice", "寮の規則", para(["夜10時から静かにしてください。", "お風呂は6時から11時までです。", "部屋でたばこを吸わないでください。", "ごみは朝8時までに出してください。"]), [R_NOTICE, R_TEXT], [], 4),
 ("uj_weekend", "narrative", "日曜日", para(["日曜日、ランさんは友達と公園へ行きました。写真をたくさん撮りました。それから、レストランでラーメンを食べました。とても楽しかったです。"]), [R_TEXT], [], 4),
 ("uj_station", "description", "朝の駅", para(["朝7時です。駅に人がたくさんいます。電車が来ます。女の人が切符を買います。男の子がパンを食べています。"]), [R_TEXT, EXIST], [], 4),
 ("uj_city_office", "notice", "市役所から", para(["引っ越しましたか。", "今月の二十日までに市役所の窓口に来てください。", "在留カードと保険証を持って来てください。"]), [R_NOTICE, R_TEXT], [], 3),
 # Checkpoint 3 (never used in lessons).
 ("cp3_msg_hoa", "message", "メール", para(["ナムさん", "電車は5時に着きます。駅に来てください。荷物が二つあります。", "ホア"]), [R_MSG], [], 3),
 ("cp3_notice_shop", "notice", "店", para(["毎日10時から8時まで", "日曜日の朝は休みです。", "レジで払ってください。"]), [R_NOTICE, NUM], [], 3),
 ("cp3_mail_staff", "notice", "皆さんへ", para(["皆さん、お疲れさまです。", "今日、2階のコピーはできません。1階を使ってください。", "木村"]), [R_MSG, R_NOTICE], [gl("コピー", "máy photocopy")], 3),
 ("cp3_text_linh", "description", "友達のリンさん", para(["リンさんはわたしの友達です。24歳です。京都の病院で働いています。川の近くのアパートに住んでいます。音楽が好きです。"]), [R_TEXT], [], 5),
 ("cp3_text_week", "narrative", "トゥアンさんの毎日", para(["トゥアンさんは月曜日から金曜日まで働きます。毎日自転車で会社へ行きます。土曜日はスーパーで買い物をします。日曜日はうちで本を読みます。"]), [R_TEXT], [], 4),
 # Capstone and placement.
 ("a1cap_msg_mother", "message", "メール", para(["マイへ", "お母さんは6時まで仕事です。冷蔵庫に晩ご飯があります。コップを洗ってください。", "母"]), [R_MSG], [], 3),
 ("a1cap_invite", "message", "パーティー", para(["ナムさん", "金曜日の夜、わたしのうちでパーティーをします。7時からです。来ませんか。", "リン"]), [R_MSG], [], 3),
 ("pl_notice_shop", "notice", "レストラン", para(["昼：11時から2時まで", "夜：5時から9時まで", "月曜日は休みです。"]), [R_NOTICE], [], 3),
 ("pl_message", "message", "メール", para(["トゥアンさん、今日はうちにいます。夜、電話してください。ラン"]), [R_MSG], [], 2),
]


def reading(r):
    slug, kind, title, blocks, objs, glossary, units = r
    rid = f"ja.read.{slug}"
    check(rid, title, plain=True)
    for b in blocks:
        check(rid, b["text"], plain=not b["text"].endswith(SENTENCE_END))
        if "speaker" in b:
            check(rid, b["speaker"], plain=True)
    for g in glossary:
        check_vi(rid, g["gloss"]["vi"])
    text = "".join(b["text"] for b in blocks)
    return {"id": rid, "kind": kind, "title": title, "blocks": blocks, "objectiveRefs": objs, "lexemeRefs": refs(title + "。" + text), "supportGlossary": glossary,
            "sourceRef": "original-project", "authoringSpec": {"informationUnits": units, "inferenceDemand": "locate"}}


C = lambda slug, kind, segs, objs, units=1: clip(f"ja.clip.{slug}", kind, segs, objs, units)
A = lambda text: [("A", text)]
B = lambda text: [("B", text)]
CLIPS = []
# Unit f: words, phrases, short sentences.
for slug, seg in [("arigatou", A("ありがとうございます。")), ("sumimasen", B("すみません。")), ("daijoubu", A("大丈夫です。")),
                  ("kikai", A("機械")), ("herumetto", B("ヘルメット")), ("tebukuro", A("手袋")), ("kaidan", B("階段")), ("mado", A("窓")),
                  ("nanji", A("今、何時ですか。")), ("wakarimasen", B("わかりません。")), ("mouichido", A("もう一度お願いします。")),
                  ("yukkuri", B("ゆっくり話してください。")), ("imi", A("これはどういう意味ですか。")), ("nihongo", B("日本語でお願いします。"))]:
    CLIPS.append(C(f"uf_{slug}", "word_phrase", seg, [FW]))
# Unit h: announcements, instructions, facts.
CLIPS += [
 C("uh_train_tokyo", "announcement", A("東京行きの電車は8時に出ます。"), [ANN, INFO, NUM], 2),
 C("uh_train_late", "announcement", B("電車は15分ぐらい遅れています。"), [ANN, INFO], 2),
 C("uh_platform", "announcement", A("3番のホームに電車が来ます。"), [ANN, INFO, NUM], 2),
 C("uh_next_station", "announcement", B("次は大阪です。"), [ANN], 1),
 C("uh_doors", "announcement", A("ドアが閉まります。ご注意ください。"), [ANN], 1),
 C("uh_shop_close", "announcement", B("この店は9時に閉まります。"), [ANN, INFO, NUM], 2),
 C("uh_shop_floor", "announcement", A("靴は2階です。"), [ANN, INFO], 1),
 C("uh_press", "instruction", B("緑のボタンを押してください。"), [ANN, FW], 1),
 C("uh_stop", "instruction", A("機械を止めて、上司を呼んでください。"), [ANN, FW], 2),
 C("uh_gloves", "instruction", B("手袋をして、ヘルメットをかぶってください。"), [ANN, FW], 2),
 C("uh_coffee_price", "factual", A("コーヒーは150円です。"), [INFO, NUM], 2),
 C("uh_bento_price", "factual", B("お弁当は500円です。"), [INFO, NUM], 2),
 C("uh_meeting_time", "factual", B("会議は9時半からです。"), [INFO, NUM], 2),
 C("uh_shift_end", "factual", A("朝のシフトは2時に終わります。"), [INFO, NUM], 2),
 C("uh_break", "factual", A("休憩は12時から1時までです。"), [INFO, NUM], 2),
]
# Unit i: short dialogues.
CLIPS += [
 C("ui_meet", "dialogue", [("B", "はじめまして。木村です。"), ("A", "はじめまして。リンです。よろしくおねがいします。")], [DLG], 2),
 C("ui_genki", "dialogue", [("A", "お元気ですか。"), ("B", "はい、元気です。")], [DLG], 1),
 C("ui_order", "dialogue", [("A", "何にしますか。"), ("B", "ラーメンを一つお願いします。")], [DLG], 1),
 C("ui_pay", "dialogue", [("A", "全部で680円です。"), ("B", "カードでいいですか。"), ("A", "はい、どうぞ。")], [DLG, NUM], 2),
 C("ui_time", "dialogue", [("B", "すみません、今、何時ですか。"), ("A", "3時半です。")], [DLG, NUM], 1),
 C("ui_box", "dialogue", [("A", "この箱を運んでください。"), ("B", "はい。どこに置きますか。"), ("A", "ドアの横にお願いします。")], [DLG, INFO], 2),
 C("ui_late", "dialogue", [("B", "どうして遅れましたか。"), ("A", "すみません。電車が遅れました。")], [DLG, INFO], 1),
 C("ui_phone", "dialogue", [("A", "もしもし、田中さんはいらっしゃいますか。"), ("B", "ちょっと待ってください。")], [DLG, INFO], 1),
 C("ui_thanks", "dialogue", [("A", "ありがとうございました。"), ("B", "どういたしまして。")], [DLG], 1),
]
# Unit j: one sentence from each text.
CLIPS += [
 C("uj_nam_osaka", "factual", B("ナムさんは大阪の工場で働いています。"), [INFO], 2),
 C("uj_lin_father", "factual", A("リンさんのお父さんは医者です。"), [INFO], 2),
 C("uj_lan_park", "factual", A("ランさんは日曜日に友達と公園へ行きました。"), [INFO, TIME], 3),
 C("uj_station", "factual", B("女の人が駅で切符を買います。"), [INFO], 2),
 C("uj_dorm", "instruction", A("夜10時から静かにしてください。"), [ANN, INFO], 1),
]
# Checkpoint 3: 11 listening, 3 dictation. Never used in lessons.
CLIPS += [
 C("cp3_train_kyoto", "announcement", A("京都行きの電車は6時に出ます。"), [ANN, INFO, NUM], 2),
 C("cp3_plane", "announcement", B("飛行機は12時に着きます。"), [ANN, INFO], 1),
 C("cp3_supermarket", "announcement", A("スーパーは夜10時に閉まります。"), [ANN, NUM], 2),
 C("cp3_page", "instruction", B("本の12ページを見てください。"), [ANN, NUM], 1),
 C("cp3_shirt_price", "factual", A("このシャツは3000円です。"), [INFO, NUM], 2),
 C("cp3_class", "factual", B("日本語の授業は7時からです。"), [INFO, NUM], 2),
 C("cp3_party", "factual", A("パーティーは土曜日の夜です。"), [INFO, TIME], 2),
 C("cp3_dlg_tea", "dialogue", [("A", "お茶とコーヒーと、どちらがいいですか。"), ("B", "お茶をお願いします。")], [DLG], 1),
 C("cp3_dlg_live", "dialogue", [("B", "どこに住んでいますか。"), ("A", "駅の近くに住んでいます。")], [DLG], 1),
 C("cp3_dlg_movie", "dialogue", [("A", "今晩、暇ですか。"), ("B", "はい。一緒に映画を見ませんか。")], [DLG], 2),
 C("cp3_dlg_doctor", "dialogue", [("B", "どうしましたか。"), ("A", "頭が痛いです。")], [DLG], 1),
 C("cp3_dict_work", "message", A("毎日、工場で働きます。"), [FW], 1),
 C("cp3_dict_station", "message", B("駅は近いです。"), [FW], 1),
 # An announcement dictation: the second task family of spoken reception (claim-gate breadth, as fr and en).
 C("cp3_dict_door", "announcement", A("ドアが閉まります。"), [ANN], 1),
 # Capstone: 4 listening items across two forms. Placement: 3.
 C("a1cap_bank", "factual", A("銀行は9時に開きます。"), [INFO, NUM], 2),
 C("a1cap_bus", "announcement", B("5番のバスは病院の前に止まります。"), [ANN, INFO, NUM], 2),
 C("a1cap_pharmacy", "factual", A("薬局は郵便局の隣です。"), [INFO], 2),
 C("a1cap_bag", "factual", B("このかばんは2500円です。"), [INFO, NUM], 2),
 C("pl_mizu", "word_phrase", A("水"), [FW]),
 C("pl_shop", "announcement", B("店は6時に閉まります。"), [ANN, NUM], 2),
 C("pl_pay", "instruction", A("レジで払ってください。"), [ANN], 1),
]

rows = [reading(r) for r in READINGS]
write_jsonl(f"{DRAFTS}/readings/OUTPUT.jsonl", rows)
write_jsonl(f"{DRAFTS}/listening/OUTPUT.jsonl", CLIPS)
report()
print(len(rows), "readings", sum(not r["id"].split(".")[-1].startswith(("cp3", "a1cap", "pl_")) for r in rows), "teaching;", len(CLIPS), "clips")
