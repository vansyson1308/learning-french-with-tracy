"""ja-vi interaction (P4c session 4), after en-scenarios-s6.py: 11 teaching scenarios (units s-v) and 10 reserved ones
(checkpoint 6, capstone), around life and work in Japan (konbini, restaurant, the way and the train, clinic, city office,
面接, factory safety, phoning the employer), with their partner clips. Writes
content/ja/_drafts/scenarios/OUTPUT.jsonl, appends the clips to listening/OUTPUT.jsonl, then checks that every id of
ja_lesson_refs.py exists, is not reserved, and that every teaching speech item, writing task and scenario has a lesson.

Partner lines are polite (です/ます) and reading-checked like every displayed Japanese string; the learner's accepted
answers are grading strings, wider than what is shown, always in です/ます style. The grader compares readings, so an
answer the recogniser writes in kana matches a variant written in kanji (P4b). A required concept is matched as a run of
the course tokenizer's tokens, and a set phrase is one token (お願いします, 大丈夫です, ありがとうございます): a concept
lists the phrase beside its stem, or "お願い" would never be found inside "お願いします". usage: python -I ja-scenarios-s6.py <repo root>
"""
import os, sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ja_lesson_refs import REFS  # noqa: E402
from ja_layers import DRAFTS, check_vi, clip, read_jsonl, report, write_jsonl  # noqa: E402

CONV, PRAC = "ja.obj.interaction.everyday_conversation", "ja.obj.interaction.practical_needs"
THANKS = ["ありがとうございます", "どうもありがとうございます", "ありがとうございました", "わかりました。ありがとうございます"]
SORRY_AGAIN = "すみません、もう一度お願いします。"
# id, family, objective, title, goal, steps [(partner, rephrase, learner prompt, intent, variants, concepts)], end, miss
TEACHING = [
 ("konbini_bento", "transaction", PRAC, "Ở cửa hàng tiện lợi", "Nhờ nhân viên hâm nóng cơm hộp, rồi nói bạn không cần túi.",
  [("いらっしゃいませ。お弁当はあたためますか。", "お弁当、あたためますか。", "Hãy nhờ nhân viên hâm nóng.", "heat", ["はい、お願いします", "お願いします", "はい", "はい、あたためてください", "あたためてください"], [["お願いします", "はい", "あたためて"]]),
   ("袋はいりますか。", "袋、いりますか。", "Hãy nói bạn không cần túi.", "no_bag", ["いいえ、結構です", "結構です", "いいえ、大丈夫です", "大丈夫です", "いいえ、いりません", "袋はいりません"], [["結構", "大丈夫", "大丈夫です", "いりません"]])],
  "全部で650円です。ありがとうございます。", "わかりました。ありがとうございました。"),
 ("restaurant_order", "transaction", PRAC, "Gọi món ở quán ăn", "Nói bạn đi một mình, rồi gọi một bát ramen và một cốc nước.",
  [("いらっしゃいませ。なんめいさまですか。", "何人ですか。", "Hãy nói bạn đi một mình.", "one_person", ["一人です", "一人", "一人でお願いします"], [["一人"]]),
   ("こちらへどうぞ。何にしますか。", "何を食べますか。", "Hãy gọi một bát ramen và một cốc nước.", "order", ["ラーメンと水をお願いします", "ラーメンと水をください", "ラーメンとお水をお願いします", "ラーメンとお水をください", "ラーメンを一つと水をお願いします"], [["ラーメン"], ["水"]])],
  "はい、ラーメンと水ですね。", SORRY_AGAIN),
 ("ask_station", "information_exchange", PRAC, "Hỏi đường đến ga", "Hỏi một người lạ ga ở đâu, rồi cảm ơn.",
  [("はい、なんですか。", "どうしましたか。", "Hãy hỏi ga ở đâu.", "ask_way", ["駅はどこですか", "すみません、駅はどこですか", "駅はどこにありますか", "すみません、駅はどこにありますか"], [["駅"], ["どこ"]]),
   ("まっすぐ行って、二つ目の角を右に曲がってください。", "まっすぐ行って、右です。", "Hãy cảm ơn.", "thank", THANKS, [["ありがとう", "ありがとうございます", "どうも"]])],
  "どういたしまして。気をつけて。", "すみません、わかりません。"),
 ("train_platform", "information_exchange", PRAC, "Ở sân ga", "Hỏi nhân viên nhà ga tàu này có đi Nagoya không, rồi nhắc lại số sân ga.",
  [("どうしましたか。", "何か困っていますか。", "Hãy hỏi tàu này có đi Nagoya không.", "ask_train", ["この電車は名古屋へ行きますか", "この電車は名古屋に行きますか", "名古屋へ行きますか", "名古屋に行きますか"], [["名古屋"]]),
   ("いいえ。名古屋は3番のホームです。", "3番です。", "Hãy nhắc lại số sân ga để chắc chắn.", "repeat", ["3番ですね", "3番のホームですね", "3番ですか"], [["3番"]])],
  "はい、そうです。", "すみません、もう一度言ってください。"),
 ("clinic_reception", "information_exchange", PRAC, "Ở quầy lễ tân phòng khám", "Nói đây là lần đầu bạn đến, rồi đưa thẻ bảo hiểm.",
  [("こんにちは。初めてですか。", "この病院は初めてですか。", "Hãy nói đúng, đây là lần đầu.", "first", ["はい、初めてです", "初めてです", "はい"], [["初めて", "はい"]]),
   ("保険証はありますか。", "保険証を見せてください。", "Hãy đưa thẻ bảo hiểm và nói một câu lịch sự.", "hand_over", ["はい、これです", "はい、どうぞ", "これです", "どうぞ", "はい、あります"], [["どうぞ", "これ", "あります"]])],
  "ありがとうございます。少し待ってください。", SORRY_AGAIN),
 ("clinic_doctor", "information_exchange", PRAC, "Đi khám bệnh", "Nói với bác sĩ bạn đau đầu và bị sốt từ hôm qua.",
  [("どうしましたか。", "どこが痛いですか。", "Hãy nói bạn đau đầu và bị sốt.", "symptom", ["頭が痛いです。熱もあります", "頭が痛いです", "熱があります", "頭が痛くて、熱があります", "頭が痛いです。熱があります"], [["頭", "熱"]]),
   ("いつからですか。", "昨日からですか、今日からですか。", "Hãy nói từ hôm qua.", "since", ["昨日からです", "昨日から", "昨日です"], [["昨日"]])],
  "この薬を一日3回飲んでください。お大事に。", "わかりました。看護師と話してください。"),
 ("call_sick", "information_exchange", CONV, "Gọi điện xin nghỉ ốm", "Gọi cho anh Tanaka ở chỗ làm, nói bạn bị sốt và hôm nay xin nghỉ.",
  [("はい、田中です。", "もしもし、田中です。", "Hãy chào và nói bạn là Nguyễn.", "give_name", ["お疲れさまです。グエンです", "グエンです", "もしもし、グエンです", "おはようございます。グエンです"], [["グエン"]]),
   ("グエンさん、どうしましたか。", "何かありましたか。", "Hãy nói bạn bị sốt và hôm nay xin nghỉ.", "sick", ["熱があります。今日は休みます", "熱があります。今日は休んでもいいですか", "今日は休みます", "熱があります", "風邪をひきました。今日は休みます"], [["熱", "風邪", "休みます", "休んで"]])],
  "わかりました。お大事に。", SORRY_AGAIN),
 ("call_late", "information_exchange", CONV, "Gọi điện báo đến muộn", "Báo cho chị Kimura tàu điện bị trễ, và bạn sẽ đến muộn khoảng 20 phút.",
  [("もしもし、木村です。", "はい、木村です。", "Hãy nói tàu điện bị trễ.", "train_late", ["電車が遅れています", "すみません、電車が遅れています", "電車が遅れました", "すみません、電車が遅れました"], [["電車"], ["遅れ"]]),
   ("そうですか。どのぐらい遅れますか。", "何時に来ますか。", "Hãy nói bạn đến muộn khoảng 20 phút.", "minutes", ["20分ぐらい遅れます", "20分ぐらいです", "20分遅れます", "20分ぐらい遅れると思います"], [["20分"]])],
  "わかりました。気をつけて来てください。", "わかりました。また電話してください。"),
 ("city_office", "transaction", PRAC, "Ở toà thị chính", "Nói với nhân viên toà thị chính bạn mới chuyển nhà, rồi đưa thẻ cư trú.",
  [("こんにちは。今日はどうしましたか。", "何をしに来ましたか。", "Hãy nói bạn mới chuyển nhà.", "moved", ["引っ越しました", "先週引っ越しました", "新しいアパートに引っ越しました", "大阪に引っ越しました"], [["引っ越し"]]),
   ("在留カードを見せてください。", "在留カードはありますか。", "Hãy đưa thẻ cư trú và nói một câu lịch sự.", "hand_over", ["はい、これです", "はい、どうぞ", "これです", "どうぞ", "はい、あります"], [["どうぞ", "これ", "あります"]])],
  "ありがとうございます。この書類に新しい住所を書いてください。", SORRY_AGAIN),
 ("interview_basics", "information_exchange", CONV, "Buổi phỏng vấn đầu tiên", "Trả lời người phỏng vấn: bạn đã làm việc ở đâu, và vì sao bạn muốn đến Nhật.",
  [("ナムさんは前、どこで働きましたか。", "前の仕事はなんですか。", "Hãy nói bạn đã làm ở một nhà máy tại Việt Nam.", "experience", ["ベトナムの工場で働きました", "ベトナムの工場です", "工場で働きました", "ベトナムで工場の仕事をしました"], [["工場"]]),
   ("どうして日本で働きたいですか。", "日本で働きたい理由はなんですか。", "Hãy nói bạn muốn học tiếng Nhật.", "reason", ["日本語を勉強したいです", "日本語の勉強をしたいです", "日本語を習いたいです", "日本語を勉強したいからです"], [["日本語"]])],
  "そうですか。頑張ってください。", "わかりました。また連絡します。"),
 ("factory_safety", "information_exchange", PRAC, "Chỉ dẫn an toàn ở nhà máy", "Nghe chỉ dẫn an toàn, nói bạn đã hiểu, rồi hỏi cách dừng máy.",
  [("仕事の前に、ヘルメットをかぶって、手袋をしてください。", "ヘルメットと手袋ですよ。", "Hãy nói bạn đã hiểu.", "understood", ["わかりました", "はい、わかりました", "はい", "はい、わかりました。かぶります"], [["わかりました", "はい"]]),
   ("機械は緑のボタンで動きます。", "緑のボタンです。", "Hãy hỏi làm sao để dừng máy.", "ask_stop", ["どうやって止めますか", "止めるボタンはどれですか", "どのボタンで止めますか", "機械はどうやって止めますか", "どうやって止まりますか"], [["止め", "止ま"]])],
  "赤いボタンです。気をつけてください。", "わからないときは、先輩に聞いてください。"),
]
RESERVED = [
 ("cp6_new_colleague", "conversation", CONV, "Đồng nghiệp mới", "Làm quen với một đồng nghiệp ở nhà máy.",
  [("はじめまして。木村です。新しい人ですか。", "新しい社員ですか。", "Hãy trả lời là đúng, rồi nói tên bạn: Hoa.", "give_name", ["はい、ホアです", "はい、ホアです。よろしくおねがいします", "ホアです", "はじめまして、ホアです"], [["ホア"]]),
   ("ホアさんの国はどこですか。", "どこから来ましたか。", "Hãy nói bạn đến từ Việt Nam.", "give_origin", ["ベトナムです", "ベトナムから来ました", "ベトナム人です"], [["ベトナム"]])],
  "そうですか。よろしくおねがいします。", "わかりました。また後で。"),
 ("cp6_interview", "information_exchange", CONV, "Phỏng vấn xin việc", "Trả lời hai câu hỏi trong buổi phỏng vấn.",
  [("おはようございます。お名前は。", "名前を教えてください。", "Hãy chào và nói tên bạn: Nam.", "give_name", ["おはようございます。ナムです", "ナムです", "ナムと申します", "おはようございます。ナムと申します"], [["ナム"]]),
   ("日本語ができますか。", "日本語は大丈夫ですか。", "Hãy nói bạn biết một chút.", "little", ["少しできます", "はい、少しできます", "少しです", "はい、少し", "ちょっとできます"], [["少し", "ちょっと"]])],
  "わかりました。来週、電話します。", "ありがとうございました。"),
 ("cp6_konbini_pay", "transaction", PRAC, "Trả tiền ở cửa hàng tiện lợi", "Hỏi trả bằng thẻ được không, rồi nói bạn cần hoá đơn.",
  [("全部で820円です。", "820円です。", "Hãy hỏi trả bằng thẻ được không.", "card", ["カードでいいですか", "カードで払えますか", "カードでお願いします", "カードでもいいですか"], [["カード"]]),
   ("はい、大丈夫です。レシートはいりますか。", "レシート、いりますか。", "Hãy nói bạn cần hoá đơn.", "receipt", ["はい、お願いします", "お願いします", "はい、ください", "はい、いります"], [["お願いします", "ください", "いります"]])],
  "ありがとうございました。", SORRY_AGAIN),
 ("cp6_way_bank", "information_exchange", PRAC, "Tìm ngân hàng", "Hỏi một người lạ ngân hàng ở đâu, rồi cảm ơn.",
  [("どうしましたか。", "何か困っていますか。", "Hãy hỏi ngân hàng ở đâu.", "ask_way", ["銀行はどこですか", "すみません、銀行はどこですか", "銀行はどこにありますか", "すみません、銀行はどこにありますか"], [["銀行"], ["どこ"]]),
   ("銀行は駅の前です。近いですよ。", "駅の前です。", "Hãy cảm ơn.", "thank", THANKS, [["ありがとう", "ありがとうございます", "どうも"]])],
  "どういたしまして。", "すみません、わかりません。"),
 ("cp6_clinic_cough", "information_exchange", PRAC, "Ở phòng khám", "Nói với y tá bạn bị ho, và bạn không sốt.",
  [("どうしましたか。", "どこか悪いですか。", "Hãy nói bạn bị ho.", "symptom", ["せきが出ます", "せきがあります", "せきです", "せきが出ています"], [["せき"]]),
   ("熱はありますか。", "熱、ありますか。", "Hãy nói bạn không sốt.", "no_fever", ["いいえ、ありません", "ありません", "熱はありません", "いいえ"], [["ありません", "いいえ"]])],
  "わかりました。水をたくさん飲んで、休んでください。", "看護師と話してください。"),
 ("cp6_call_office", "information_exchange", CONV, "Gọi điện đến công ty", "Xin nói chuyện với anh Tanaka; anh ấy không có ở đó, nên bạn sẽ gọi lại.",
  [("はい、さくら工場です。", "さくら工場です。", "Hãy xin nói chuyện với anh Tanaka.", "ask_person", ["田中さんはいらっしゃいますか", "田中さん、お願いします", "田中さんをお願いします", "田中さんと話したいです"], [["田中"]]),
   ("すみません。田中は今、いません。後で電話してください。", "田中は今、いません。", "Hãy đồng ý gọi lại sau.", "agree", ["わかりました。また電話します", "わかりました", "また後で電話します", "はい、また電話します"], [["わかりました", "電話します", "はい"]])],
  "ありがとうございます。失礼します。", "すみません。失礼します。"),
 ("a1cap_first_day", "conversation", CONV, "Ngày đầu ở nhà máy", "Trả lời đàn anh trong ngày đầu đi làm.",
  [("おはようございます。新しい人ですか。", "今日から働く人ですか。", "Hãy trả lời là đúng.", "confirm", ["はい、そうです", "はい", "そうです", "はい、今日からです"], [["はい", "そう"]]),
   ("ヘルメットはありますか。", "ヘルメット、ありますか。", "Hãy nói bạn không có.", "no_helmet", ["いいえ、ありません", "ありません", "すみません、ありません", "いいえ"], [["ありません", "いいえ"]])],
  "じゃあ、このヘルメットをかぶってください。", "わかりました。先輩に聞いてください。"),
 ("a1cap_neighbor", "conversation", CONV, "Làm quen với hàng xóm", "Trả lời một người hàng xóm mới: tên và nơi làm việc của bạn.",
  [("こんにちは。隣の部屋の人ですか。", "新しい人ですか。", "Hãy trả lời là đúng, rồi nói tên bạn: Mai.", "give_name", ["はい、マイです", "はい、マイです。よろしくおねがいします", "マイです", "はじめまして、マイです"], [["マイ"]]),
   ("マイさんの仕事はなんですか。", "どこで働いていますか。", "Hãy nói bạn làm việc ở nhà máy.", "give_work", ["工場で働いています", "工場です", "工場で働きます"], [["工場"]])],
  "そうですか。よろしくおねがいします。", "では、失礼します。"),
 ("a1cap_friend_plan", "conversation", CONV, "Hẹn một người bạn", "Nhận lời hẹn vào Chủ nhật, rồi nói giờ gặp.",
  [("日曜日は暇ですか。", "日曜日、時間がありますか。", "Hãy nói bạn rảnh.", "accept", ["はい、暇です", "暇です", "はい、大丈夫です", "大丈夫です", "はい、あります"], [["暇", "大丈夫", "大丈夫です", "はい"]]),
   ("何時に会いましょうか。", "何時がいいですか。", "Hãy nói gặp lúc 3 giờ.", "time", ["3時に会いましょう", "3時はどうですか", "3時です", "3時がいいです"], [["3時"]])],
  "じゃあ、日曜日の3時に会いましょう。", "わかりました。また来週。"),
 ("a1cap_lunch", "conversation", CONV, "Ăn trưa với đồng nghiệp", "Nhận lời ăn trưa với một đồng nghiệp, rồi nói bạn muốn ăn gì.",
  [("12時ですね。一緒に昼ご飯を食べませんか。", "昼ご飯、食べませんか。", "Hãy nhận lời.", "accept", ["はい、食べましょう", "いいですね", "はい、いいですね", "はい、お願いします", "いいですね。食べましょう"], [["はい", "いい", "食べましょう"]]),
   ("何を食べたいですか。", "何がいいですか。", "Hãy nói bạn muốn ăn mì ramen.", "food", ["ラーメンが食べたいです", "ラーメンがいいです", "ラーメンを食べたいです", "ラーメンです"], [["ラーメン"]])],
  "いいですね。行きましょう。", "わかりました。また明日。"),
]

scen, clips = [], []


def add_clip(cid, text, obj, speaker):
    clips.append(clip(cid, "message", [(speaker, text)], [obj]))


for rows, reserved in ((TEACHING, False), (RESERVED, True)):
    for n, (sid, fam, obj, title, goal, steps, end, miss) in enumerate(rows):
        base = f"ja.clip.ix_{sid}"
        # Partner voices alternate, so that a learner meets both: A is the female voice, B the male one.
        speaker = "A" if n % 2 == 0 else "B"
        check_vi(sid, title)
        check_vi(sid, goal)
        nodes = {}
        add_clip(f"{base}_miss", miss, obj, speaker)
        nodes["t_miss"] = {"kind": "terminal", "id": "t_miss", "outcome": "goal_not_met", "text": miss, "clipId": f"{base}_miss"}
        for i, (p, rp, prompt, intent, variants, concepts) in enumerate(steps):
            check_vi(sid, prompt)
            nxt = f"p{i + 1}" if i + 1 < len(steps) else "t_ok"
            add_clip(f"{base}_{i}", p, obj, speaker)
            add_clip(f"{base}_{i}_s", rp, obj, speaker)
            nodes[f"p{i}"] = {"kind": "partner", "id": f"p{i}", "text": p, "clipId": f"{base}_{i}", "rephraseText": rp, "rephraseClipId": f"{base}_{i}_s", "next": f"l{i}"}
            exp = [{"intent": intent, "acceptedVariants": variants, "requiredConcepts": concepts, "next": nxt}]
            nodes[f"l{i}"] = {"kind": "learner", "id": f"l{i}", "prompt": {"vi": prompt}, "expected": exp, "noMatchNext": f"r{i}", "scored": True}
            nodes[f"r{i}"] = {"kind": "partner", "id": f"r{i}", "text": rp, "clipId": f"{base}_{i}_s", "next": f"l{i}b"}
            nodes[f"l{i}b"] = {"kind": "learner", "id": f"l{i}b", "prompt": {"vi": prompt}, "expected": exp, "noMatchNext": "t_miss", "scored": False}
        add_clip(f"{base}_end", end, obj, speaker)
        nodes["t_ok"] = {"kind": "terminal", "id": "t_ok", "outcome": "goal_met", "text": end, "clipId": f"{base}_end"}
        scen.append({"id": f"ja.scenario.{sid}", "title": {"vi": title}, "goal": {"vi": goal}, "taskFamily": fam, "objectiveRefs": [obj], "startNodeId": "p0",
                     "nodes": nodes, "support": {"allowRepeat": True, "allowRephrase": True}, "reserved": reserved, "sourceRef": "original-project"})

write_jsonl(f"{DRAFTS}/scenarios/OUTPUT.jsonl", scen)
write_jsonl(f"{DRAFTS}/listening/OUTPUT.jsonl", clips, "a")
report()


def ids(step):
    return {r["id"]: r for r in read_jsonl(f"{DRAFTS}/{step}/OUTPUT.jsonl")}


KNOWN = {"clips": ids("listening"), "readings": ids("readings"), "speech": ids("speech"), "writing": ids("writing"), "scenarios": ids("scenarios")}
bad = [f"{lesson} {kind} {x}" for lesson, by in REFS.items() for kind, xs in by.items() for x in xs if x not in KNOWN[kind] or KNOWN[kind][x].get("reserved") is True]
bad += [f"{lesson} clip {x} is reserved for assessment" for lesson, by in REFS.items() for x in by.get("clips", []) + by.get("readings", []) if x.split(".")[-1].startswith(("cp", "a1cap", "pl_"))]
used = {kind: {x for by in REFS.values() for x in by.get(kind, [])} for kind in KNOWN}
unused = [x for kind in ("speech", "writing", "scenarios") for x, r in KNOWN[kind].items() if not r.get("reserved") and x not in used[kind]]
unused += [x for kind in ("readings",) for x in KNOWN[kind] if not x.split(".")[-1].startswith(("cp", "a1cap", "pl_")) and x not in used[kind]]
if bad or unused:
    sys.exit("ja_lesson_refs.py: " + "; ".join(bad + [f"unused {x}" for x in unused]))
print(len(scen), "scenarios", sum(s["reserved"] for s in scen), "reserved", len(clips), "clips", sum(len(s["nodes"]) for s in scen), "nodes", dict(Counter(s["taskFamily"] for s in scen)))
