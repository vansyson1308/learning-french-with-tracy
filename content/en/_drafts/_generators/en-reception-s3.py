"""en-vi reception: readings and listening clips of section 3, checkpoint 3, the capstone and placement (original English).
Writes content/en/_drafts/readings/OUTPUT.jsonl and listening/OUTPUT.jsonl (s4 and s6 append their clips), the staged
listening.json head that declares the voice cast, and content/en/reception/audio-source-manifest.json with the pins of
the pack manifest. Exam-track texts belong to the exam step. usage: python -I en-reception-s3.py <repo root>
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from en_refs import check, clip, refs, report, write_jsonl

ROOT = sys.argv[1]
DRAFTS = f"{ROOT}/content/en/_drafts"
CAST = {"A": "kokoro-af_heart", "B": "kokoro-am_michael"}
R_MSG, R_NOTICE, R_TEXT, R_WORDS = "en.obj.reading.short_messages", "en.obj.reading.notices_info", "en.obj.reading.short_texts", "en.obj.reading.familiar_words"
FW, INFO, ANN, DLG = "en.obj.listening.familiar_words", "en.obj.listening.short_info", "en.obj.listening.announcements", "en.obj.listening.short_dialogues"
NUM, TIME, PAST = "en.obj.numbers.0_100", "en.obj.vocab.time_calendar", "en.obj.verbs.past_recognition"


def gl(surface, vi):
    return {"surface": surface, "gloss": {"vi": vi}}


def para(blocks):
    return [{"kind": "paragraph", "text": b} for b in blocks]


def lines(pairs):
    return [{"kind": "line", "speaker": s, "text": t} for s, t in pairs]


# id, kind, title, blocks, objectives, glossary, information units
READINGS = [
 # Unit f: words a learner can already read.
 ("uf_desk", "description", "My desk", para(["A computer", "A pen and a notebook", "A cup of tea", "Two books"]), [R_WORDS], [gl("notebook", "quyển vở")], 4),
 ("uf_card", "notice", "Name card", para(["Mai Tran", "Student", "Hanoi, Vietnam", "Phone number: 0912 345 678"]), [R_WORDS], [gl("Student", "sinh viên, học sinh")], 4),
 # Unit g: messages and notices.
 ("ug_msg_lan", "message", "A message from Lan", para(["Hi Minh,", "I'm at the coffee shop near the station. Can you come at three? I'm waiting for you.", "See you soon, Lan"]), [R_MSG], [gl("coffee shop", "quán cà phê"), gl("I'm waiting for you", "mình đang đợi bạn")], 3),
 ("ug_msg_tom", "message", "A message from Tom", para(["Hello Hoa,", "The meeting is at ten tomorrow, not at nine. Please bring the report.", "Thanks, Tom"]), [R_MSG], [gl("meeting", "cuộc họp"), gl("report", "báo cáo")], 3),
 ("ug_signs", "notice", "Signs at the station", para(["Entrance", "Exit", "No smoking", "Toilets: on the left"]), [R_NOTICE], [gl("Entrance", "lối vào"), gl("Exit", "lối ra"), gl("No smoking", "cấm hút thuốc")], 4),
 ("ug_post", "notice", "Post office", para(["Today the post office is closed.", "Tomorrow we open at nine.", "Thank you!"]), [R_NOTICE], [gl("closed", "đóng cửa"), gl("post office", "bưu điện")], 2),
 ("ug_hours", "notice", "Opening hours", para(["Green Market", "Monday to Friday: 8:00–18:00", "Saturday: 8:00–12:00", "Sunday: closed"]), [R_NOTICE, NUM], [gl("Market", "chợ"), gl("closed", "đóng cửa")], 3),
 ("ug_shift", "notice", "Shift schedule", para(["Morning shift: 6:00–14:00", "Afternoon shift: 14:00–22:00", "Please arrive ten minutes early."]), [R_NOTICE, NUM], [gl("shift", "ca làm"), gl("early", "sớm")], 3),
 ("ug_rules", "notice", "Factory rules", para(["Wear gloves and a helmet.", "Do not touch the machine.", "Do not smoke.", "Wash your hands before lunch."]), [R_NOTICE, R_MSG], [gl("gloves", "găng tay"), gl("helmet", "mũ bảo hộ"), gl("touch", "chạm vào")], 4),
 # Unit i: dialogues and a short reply.
 ("ui_new_worker", "dialogue", "A new worker", lines([("Anna", "Hi! Are you the new worker?"), ("Minh", "Yes, I am. My name is Minh."), ("Anna", "Nice to meet you, Minh. I'm Anna."), ("Minh", "Nice to meet you too.")]), [DLG, R_MSG], [gl("new worker", "công nhân mới")], 3),
 ("ui_at_shop", "dialogue", "At the shop", lines([("Tom", "Excuse me, how much is this bag?"), ("Lan", "It's ten dollars."), ("Tom", "Can I pay by card?"), ("Lan", "Yes, of course.")]), [DLG, R_MSG], [gl("pay by card", "trả bằng thẻ")], 3),
 ("ui_sorry", "message", "Sorry, Tom", para(["Hi Tom,", "Sorry, I can't come to the meeting today. I am sick. See you on Monday.", "Mai"]), [R_MSG], [gl("sick", "bị ốm")], 3),
 # Unit j: little stories.
 ("uj_nam_day", "narrative", "A day at work", para(["Nam lives in Hanoi. He works in a factory. Every morning he takes the bus at six. His shift starts at seven. In the evening he cooks dinner with his wife."]), [R_TEXT], [gl("factory", "nhà máy"), gl("shift", "ca làm"), gl("cooks", "nấu ăn")], 5),
 ("uj_nam_family", "description", "Nam's family", para(["Nam has a small family. His wife is a nurse. They have a son and a daughter. The son is ten years old. The daughter is six. They also have a cat."]), [R_TEXT, R_WORDS], [gl("nurse", "y tá"), gl("also", "cũng")], 5),
 ("uj_yesterday", "narrative", "Yesterday", para(["Yesterday Lan did not go to work. She visited her mother in the village. They cooked fish and rice. Lan went home at eight in the evening. She was tired but happy."]), [R_TEXT, PAST], [gl("visited", "đã đến thăm"), gl("village", "làng"), gl("went", "đã đi (quá khứ của go)")], 5),
 ("uj_saturday", "narrative", "Tom's Saturday", para(["On Saturday Tom wakes up late. He drinks coffee and eats an egg. In the afternoon he plays football with his friends. In the evening he watches a movie."]), [R_TEXT], [gl("wakes up", "thức dậy"), gl("late", "muộn"), gl("movie", "bộ phim")], 4),
 ("uj_station", "description", "The station in the morning", para(["It is seven o'clock. There are many people at the station. A train arrives and a train leaves. A woman buys a ticket. A boy eats a banana."]), [R_TEXT], [gl("arrives", "đến nơi"), gl("leaves", "rời đi")], 4),
 ("uj_office", "description", "Our office", para(["Our office is on the third floor. There are ten desks and two printers. The manager's room is next to the stairs. The kitchen is small but clean."]), [R_TEXT, R_NOTICE], [gl("third floor", "tầng ba"), gl("printers", "máy in"), gl("stairs", "cầu thang")], 4),
 # Checkpoint 3 (never used in lessons).
 ("cp3_msg_hoa", "message", "A message from Hoa", para(["Hi Nam,", "My train arrives at five. Can you meet me at the station? I have two big bags.", "Thanks, Hoa"]), [R_MSG], [], 3),
 ("cp3_notice_shop", "notice", "Shoe shop", para(["Open every day from 9:00 to 20:00.", "Closed on Sunday morning.", "Please pay at the cash desk."]), [R_NOTICE, NUM], [gl("cash desk", "quầy thu ngân")], 3),
 ("cp3_mail_staff", "message", "To all staff", para(["Dear colleagues,", "The printer on the second floor does not work today. Please use the printer in the manager's office.", "Best regards, Sarah"]), [R_MSG, R_NOTICE], [gl("colleagues", "đồng nghiệp")], 3),
 ("cp3_text_linh", "description", "My friend Linh", para(["Linh is my friend. She is twenty-six years old. She works in a hospital in Hue. She has a small apartment near the river. She loves music."]), [R_TEXT], [gl("apartment", "căn hộ")], 5),
 ("cp3_text_david", "narrative", "David's week", para(["David works from Monday to Friday. He usually drives to the office. On Saturday he goes to the market. On Sunday he stays at home and reads a book."]), [R_TEXT], [gl("drives", "lái xe")], 4),
 # Capstone and placement.
 ("a1cap_msg_father", "message", "A message from home", para(["Hi Mai,", "I am at work until six. There is some soup in the fridge. Please wash the cups.", "Your father"]), [R_MSG], [gl("fridge", "tủ lạnh")], 3),
 ("a1cap_invite", "message", "A party", para(["Hello Peter,", "We have a party on Friday evening at my house. It starts at seven. Can you come?", "Best regards, Mary"]), [R_MSG], [gl("party", "bữa tiệc")], 3),
 ("pl_notice_cafe", "notice", "Restaurant", para(["Lunch: 11:00–14:00", "Dinner: 17:00–21:00", "Closed on Monday"]), [R_NOTICE], [], 3),
 ("pl_message", "message", "A message", para(["Hi Tuan, I'm at home today. Please call me tonight. Lan"]), [R_MSG], [], 2),
]


def reading(r):
    slug, kind, title, blocks, objs, glossary, units = r
    rid = f"en.read.{slug}"
    text = " ".join(b["text"] for b in blocks)
    check(rid, f"{title}. {text}")
    return {"id": rid, "kind": kind, "title": title, "blocks": blocks, "objectiveRefs": objs, "lexemeRefs": refs(text), "supportGlossary": glossary,
            "sourceRef": "original-project", "authoringSpec": {"informationUnits": units, "inferenceDemand": "locate"}}


C = lambda slug, kind, segs, objs, units=1: clip(f"en.clip.{slug}", kind, segs, objs, units)
A = lambda text: [("A", text)]
B = lambda text: [("B", text)]
CLIPS = []
# Unit f: words, phrases, short sentences.
for slug, text in [("thank_you", "Thank you."), ("excuse_me", "Excuse me."), ("of_course", "Of course."), ("a_teacher", "a teacher"), ("a_doctor", "a doctor"), ("the_door", "the door"), ("a_key", "a key"), ("the_window", "the window")]:
    CLIPS.append(C(f"uf_{slug}", "word_phrase", A(text), [FW]))
for slug, seg in [("what_time", A("What time is it?")), ("not_understand", B("I don't understand.")), ("say_again", A("Please say it again.")), ("speak_slowly", B("Please speak slowly.")), ("how_spell", A("How do you spell it?")), ("what_mean", B("What does it mean?"))]:
    CLIPS.append(C(f"uf_{slug}", "word_phrase", seg, [FW]))
# Unit h: announcements, instructions, facts.
CLIPS += [
 C("uh_train_hanoi", "announcement", A("The train to Hanoi leaves at eight o'clock."), [ANN, INFO, NUM], 2),
 C("uh_train_late", "announcement", A("The train from Hue is ten minutes late."), [ANN, INFO], 2),
 C("uh_flight", "announcement", B("Flight twenty-one to Sydney leaves at nine thirty."), [ANN, INFO, NUM], 3),
 C("uh_bus_seven", "announcement", B("Bus number seven arrives in three minutes."), [ANN, INFO, NUM], 2),
 C("uh_shop_close", "announcement", A("The shop closes in five minutes. Please pay now."), [ANN], 2),
 C("uh_shop_floor", "announcement", B("Shoes are on the second floor."), [ANN], 1),
 C("uh_press", "instruction", A("Press the green button to start the machine."), [ANN, FW], 1),
 C("uh_stop", "instruction", B("Stop the machine and call the manager."), [ANN, FW], 2),
 C("uh_gloves", "instruction", A("Please wear your gloves and helmet."), [ANN, FW], 1),
 C("uh_coffee_price", "factual", A("The coffee costs two dollars."), [INFO, NUM], 2),
 C("uh_ticket_price", "factual", B("The ticket costs twenty dollars."), [INFO, NUM], 2),
 C("uh_meeting_time", "factual", B("The meeting is at half past nine."), [INFO, NUM], 2),
 C("uh_shift_end", "factual", A("The morning shift ends at two o'clock."), [INFO, NUM], 2),
]
# Unit i: short dialogues.
CLIPS += [
 C("ui_meet", "dialogue", [("A", "Hi! I'm Anna."), ("B", "Nice to meet you. I'm Minh.")], [DLG], 2),
 C("ui_how", "dialogue", [("A", "How are you?"), ("B", "I'm fine, thanks. And you?")], [DLG], 1),
 C("ui_order", "dialogue", [("B", "What would you like?"), ("A", "A coffee, please.")], [DLG], 1),
 C("ui_pay", "dialogue", [("A", "That's four dollars."), ("B", "Can I pay by card?"), ("A", "Yes, of course.")], [DLG, NUM], 2),
 C("ui_time", "dialogue", [("B", "Excuse me, what time is it?"), ("A", "It's half past two.")], [DLG, NUM], 1),
 C("ui_box", "dialogue", [("A", "Can you help me with this box?"), ("B", "Sure. Where do you want it?"), ("A", "Next to the door, please.")], [DLG, INFO], 2),
 C("ui_late", "dialogue", [("A", "Why are you late?"), ("B", "The bus was late. I'm sorry.")], [DLG, INFO], 1),
 C("ui_hold", "dialogue", [("B", "Can I speak to Mr Brown?"), ("A", "Hold on, please.")], [DLG, INFO], 1),
 C("ui_welcome", "dialogue", [("A", "Thank you for your help."), ("B", "You're welcome.")], [DLG], 1),
]
# Unit j: one sentence from each story.
CLIPS += [
 C("uj_nam_bus", "factual", B("Nam takes the bus to work every morning."), [INFO], 3),
 C("uj_nam_wife", "factual", A("Nam's wife is a nurse."), [INFO], 2),
 C("uj_lan_mother", "factual", B("Yesterday Lan visited her mother."), [INFO, PAST], 2),
 C("uj_tom_football", "factual", A("On Saturday Tom plays football with his friends."), [INFO], 3),
 C("uj_station", "factual", B("A woman buys a ticket at the station."), [INFO], 2),
]
# Checkpoint 3: 11 listening, 2 dictation. Never used in lessons.
CLIPS += [
 C("cp3_train_hue", "announcement", A("The train to Hue leaves at six."), [ANN, INFO, NUM], 2),
 C("cp3_plane", "announcement", B("The plane leaves at noon."), [ANN, INFO], 1),
 C("cp3_supermarket", "announcement", A("The supermarket closes at ten tonight."), [ANN], 2),
 C("cp3_page", "instruction", B("Please open your book at page twelve."), [ANN, NUM], 1),
 C("cp3_shirt_price", "factual", A("The shirt costs thirty dollars."), [INFO, NUM], 2),
 C("cp3_class", "factual", B("The English class starts at seven."), [INFO, NUM], 2),
 C("cp3_party", "factual", A("The party is on Saturday evening."), [INFO], 2),
 C("cp3_dlg_tea", "dialogue", [("A", "Do you want tea or coffee?"), ("B", "Tea, please.")], [DLG], 1),
 C("cp3_dlg_live", "dialogue", [("B", "Where do you live?"), ("A", "I live near the river.")], [DLG], 1),
 C("cp3_dlg_movie", "dialogue", [("A", "Are you free tonight?"), ("B", "Yes. Let's watch a movie.")], [DLG], 2),
 C("cp3_dlg_doctor", "dialogue", [("B", "What's wrong?"), ("A", "I have a headache.")], [DLG], 1),
 C("cp3_dict_night", "message", A("I work at night."), [FW], 1),
 C("cp3_dict_bus", "message", B("The bus leaves at nine."), [FW], 1),
 # Capstone: 4 listening items across two forms. Placement: 3.
 C("a1cap_bank", "factual", A("The bank opens at nine o'clock."), [INFO, NUM], 2),
 C("a1cap_bus", "announcement", B("Bus number twelve stops near the hospital."), [ANN, NUM], 2),
 C("a1cap_pharmacy", "factual", A("The pharmacy is next to the post office."), [INFO], 2),
 C("a1cap_bag", "factual", B("The bag costs fifteen dollars."), [INFO, NUM], 2),
 C("pl_milk", "word_phrase", A("the milk"), [FW]),
 C("pl_shop", "announcement", B("The shop closes at six."), [ANN, NUM], 2),
 C("pl_pay", "instruction", A("Please pay at the door."), [ANN], 1),
]

rows = [reading(r) for r in READINGS]
write_jsonl(f"{DRAFTS}/readings/OUTPUT.jsonl", rows)
write_jsonl(f"{DRAFTS}/listening/OUTPUT.jsonl", CLIPS)

# The ingest would take the cast from voice-casts.json; the course declares it here, as the Italian listening.json does.
head = {"version": 1, "language": "en", "voiceCast": {s: {"voiceId": v, "speaker": None} for s, v in CAST.items()}, "clips": []}
staged = f"{DRAFTS}/staged/content/en/reception/listening.json"
os.makedirs(os.path.dirname(staged), exist_ok=True)
with open(staged, "w", encoding="utf-8", newline="\n") as f:
    f.write(json.dumps(head, indent=2, ensure_ascii=False) + "\n")

# Reception voice manifest: pins copied from the pack manifest; storyAudio is the stories step's.
pack = json.load(open(f"{ROOT}/content/audio/pack-audio-manifest.json", encoding="utf-8"))
ROLE = {"kokoro-af_heart": "speaker A — female voice for announcements, monologues and dialogue turns", "kokoro-am_michael": "speaker B — male voice for the second speaker of dialogues"}
voices = []
for vid in CAST.values():
    v = next(x for x in pack["voices"] if x["id"] == vid)
    voices.append({**v, "role": ROLE[vid], "multiSpeaker": False})
manifest = {"version": 2, "pipelineVersion": 3, "storyPipelineVersion": 4,
            "note": "Pinned TTS sources for the English reception audio (P4f): the two Kokoro-82M voices of the en-vi cast, with the same pins as the pack manifest; verified fail-closed on every run. Engines, licence gate and encoding live in content/audio/engines.json. Model weights are never committed.",
            "engines": "content/audio/engines.json", "voices": voices, "excludedVoices": []}
with open(f"{ROOT}/content/en/reception/audio-source-manifest.json", "w", encoding="utf-8", newline="\n") as f:
    f.write(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
report()
print(len(rows), "readings", len(CLIPS), "clips")
