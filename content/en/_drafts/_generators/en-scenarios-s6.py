"""en-vi interaction: 11 teaching scenarios (unit s-v) and 10 reserved ones (checkpoint 6, capstone), with their partner clips.
Writes content/en/_drafts/scenarios/OUTPUT.jsonl, appends the clips to listening/OUTPUT.jsonl, then checks that every id
of en_lesson_refs.py exists. Partner lines are A1 and level-checked; accepted answers may be wider, because they grade
what a learner says. usage: python -I en-scenarios-s6.py <repo root>
"""
import json, os, sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from en_lesson_refs import REFS
from en_refs import clip, report, write_jsonl

DRAFTS = sys.argv[1] + "/content/en/_drafts"
CONV, PRAC = "en.obj.interaction.everyday_conversation", "en.obj.interaction.practical_needs"
THANKS = ["Thank you very much!", "Thank you!", "Thanks!", "Thanks a lot!"]
OK_THANKS = ["Yes, thank you.", "Okay, thank you.", "Okay, thanks.", "Yes, please."]
YES_NO_YES = [["yes", "okay", "sure"]]
TEACHING = [
 ("intro_at_work", "conversation", CONV, "Làm quen ở chỗ làm", "Nói tên và nước của bạn với một đồng nghiệp mới.",
  [("Hi! I'm Anna, the team manager. What's your name?", "I'm Anna. And you? What's your name?", "Hãy nói tên của bạn: Minh.", "give_name", ["My name is Minh.", "I'm Minh.", "My name's Minh.", "Minh.", "Hi, I'm Minh."], [["minh"]]),
   ("Nice to meet you, Minh. Where are you from?", "Which country are you from?", "Hãy nói bạn đến từ Việt Nam.", "give_origin", ["I'm from Vietnam.", "I come from Vietnam.", "From Vietnam.", "I'm Vietnamese."], [["vietnam", "vietnamese"]])],
  "Welcome to the team!", "No problem. See you later!"),
 ("job_interview", "information_exchange", CONV, "Phỏng vấn xin việc", "Trả lời ba câu hỏi đơn giản trong buổi phỏng vấn.",
  [("Good morning. Please sit down. What is your name?", "Can you tell me your name?", "Hãy chào và nói tên của bạn: Lan.", "give_name", ["Good morning. My name is Lan.", "My name is Lan.", "I'm Lan.", "Good morning, I'm Lan.", "Lan."], [["lan"]]),
   ("What is your job now?", "What do you do?", "Hãy nói bạn đang làm công nhân ở một nhà máy.", "give_job", ["I work in a factory.", "I'm a factory worker.", "I'm a worker.", "I work at a factory."], [["factory", "worker"]]),
   ("Do you have experience?", "Did you work in a factory before?", "Hãy nói bạn có hai năm kinh nghiệm.", "experience", ["I have two years of experience.", "Two years.", "Yes, two years.", "Yes, I have two years of experience."], [["two"]])],
  "Thank you, Lan. We will call you next week.", "Thank you for coming. Goodbye."),
 ("shop_shirt", "transaction", PRAC, "Ở cửa hàng", "Hỏi giá một chiếc áo sơ mi, rồi trả bằng thẻ.",
  [("Hello! Can I help you?", "Do you want to buy something?", "Hãy hỏi chiếc áo sơ mi này giá bao nhiêu.", "ask_price", ["How much is this shirt?", "How much does this shirt cost?", "How much is the shirt?", "Excuse me, how much is this shirt?"], [["how much"], ["shirt"]]),
   ("It's twenty dollars.", "Twenty dollars, please.", "Hãy nói bạn lấy nó và muốn trả bằng thẻ.", "pay_card", ["I'll take it. Can I pay by card?", "Can I pay by card?", "I'll pay by card.", "I want to pay by card."], [["card"]])],
  "Yes, of course. Here is your receipt. Thank you!", "No problem. Goodbye!"),
 ("restaurant_order", "transaction", PRAC, "Gọi món ở quán ăn", "Gọi món ăn và đồ uống, rồi xin hoá đơn.",
  [("Good evening. What would you like to eat?", "What do you want to eat?", "Hãy gọi món gà và cơm.", "order_food", ["Chicken and rice, please.", "I'd like chicken and rice, please.", "I'd like chicken and rice.", "Chicken rice, please."], [["chicken"], ["rice"]]),
   ("And to drink?", "What would you like to drink?", "Hãy gọi một ly nước.", "order_drink", ["Water, please.", "A glass of water, please.", "I'd like some water, please."], [["water"]]),
   ("Here you are. Is that all?", "Do you want more?", "Hãy nói thế là đủ và xin hoá đơn.", "ask_bill", ["Yes, that's all. The bill, please.", "The bill, please.", "Can I have the bill, please?", "No, thanks. Can I have the bill?"], [["bill"]])],
  "Of course. That's twelve dollars.", "No problem. Have a nice evening!"),
 ("ask_directions", "information_exchange", PRAC, "Hỏi đường", "Hỏi một người lạ bưu điện ở đâu, rồi cảm ơn.",
  [("Yes? Can I help you?", "Are you looking for something?", "Hãy hỏi bưu điện ở đâu.", "ask_way", ["Excuse me, where is the post office?", "Where is the post office?", "Sorry, where is the post office?"], [["where"], ["post office"]]),
   ("Go straight and turn left at the traffic light.", "Go straight. Then turn left.", "Hãy cảm ơn.", "thank", THANKS, [["thank", "thanks"]])],
  "You're welcome. Have a good day!", "No problem. Goodbye!"),
 ("clinic_visit", "information_exchange", PRAC, "Đi khám bệnh", "Nói với bác sĩ bạn đau đầu từ hôm qua.",
  [("Good morning. What's the problem?", "How do you feel today?", "Hãy nói bạn bị đau đầu và sốt.", "symptom", ["I have a headache and a fever.", "I have a headache.", "I have a fever and a headache."], [["headache", "fever"]]),
   ("When did it start?", "What day did it start?", "Hãy nói nó bắt đầu từ hôm qua.", "since", ["Yesterday.", "It started yesterday.", "Yesterday morning."], [["yesterday"]])],
  "Take this medicine and rest for two days.", "Please wait here. The nurse will help you."),
 ("phone_appointment", "information_exchange", PRAC, "Gọi điện đặt hẹn", "Gọi điện đến phòng khám và đặt một cuộc hẹn.",
  [("Hello, Green Clinic. How can I help you?", "This is Green Clinic. What do you need?", "Hãy nói bạn muốn đặt một cuộc hẹn.", "ask_appointment", ["I'd like to make an appointment.", "I want to make an appointment.", "I need an appointment.", "Can I make an appointment?"], [["appointment"]]),
   ("Can you come on Monday at ten?", "Is Monday at ten o'clock okay?", "Hãy đồng ý.", "agree", ["Yes, that's fine.", "Yes, I can.", "Yes, thank you.", "Yes, Monday at ten is fine.", "Okay, thank you."], [["yes", "okay", "fine"]])],
  "Great. See you on Monday. Goodbye!", "I'm sorry. Please call again. Goodbye!"),
 ("email_question", "conversation", CONV, "Hỏi về một email", "Trả lời đồng nghiệp về một email bạn chưa nhận được.",
  [("Hi, did you get my email?", "I sent you an email. Did you read it?", "Hãy nói bạn chưa nhận được.", "not_received", ["No, I didn't.", "No, I didn't get it.", "Sorry, I didn't get it.", "No, not yet."], [["no", "not", "sorry"]]),
   ("It's about the meeting. Can I send it again?", "I can send the email again. Is that okay?", "Hãy đồng ý và cảm ơn.", "agree", OK_THANKS, YES_NO_YES)],
  "Okay, I'm sending it now.", "No problem. Talk to you later."),
 ("factory_instructions", "information_exchange", PRAC, "Chỉ dẫn ở nhà máy", "Nghe chỉ dẫn, nói bạn hiểu, rồi hỏi cách dừng máy.",
  [("Please wear your gloves before you start.", "You need gloves. Please wear them.", "Hãy nói rằng bạn hiểu.", "understood", ["Okay, I understand.", "I understand.", "Yes, I understand.", "Okay."], [["understand", "okay"]]),
   ("Press the green button to start the machine.", "To start, press the green button.", "Hãy hỏi làm sao để dừng máy.", "ask_stop", ["How do I stop the machine?", "Which button stops the machine?", "How can I stop it?", "Where is the stop button?"], [["stop", "stops"]])],
  "The red button. Be careful!", "Please ask your manager."),
 ("airport_checkin", "transaction", PRAC, "Ở sân bay", "Đưa giấy tờ cho nhân viên sân bay và chọn chỗ ngồi.",
  [("Good morning. Your passport and ticket, please.", "Can I see your passport?", "Hãy đưa giấy tờ và nói một câu lịch sự.", "hand_over", ["Here you are.", "Here it is.", "Here they are.", "Here you go."], [["here"]]),
   ("Thank you. Do you want a window seat?", "A seat near the window, okay?", "Hãy nói bạn muốn chỗ đó.", "accept_seat", ["Yes, please.", "Yes, a window seat, please.", "Okay, thank you."], YES_NO_YES)],
  "Here is your ticket. Your flight leaves at nine. Have a good trip!", "No problem. Please wait here."),
 ("hotel_checkin", "transaction", PRAC, "Ở khách sạn", "Hỏi một phòng cho hai đêm, rồi đưa hộ chiếu.",
  [("Good evening. Can I help you?", "Do you need a room?", "Hãy nói bạn muốn một phòng cho hai đêm.", "ask_room", ["I'd like a room for two nights.", "A room for two nights, please.", "I want a room for two nights.", "I need a room for two nights."], [["room"], ["two"]]),
   ("Okay. Your passport, please.", "Can I see your passport, please?", "Hãy đưa hộ chiếu và nói một câu lịch sự.", "hand_over", ["Here you are.", "Here it is.", "Here you go."], [["here"]])],
  "Thank you. Your room is on the third floor. Here is the key.", "No problem. Please ask again later."),
]
RESERVED = [
 ("cp6_new_colleague", "conversation", CONV, "Đồng nghiệp mới", "Làm quen với một đồng nghiệp ở văn phòng.",
  [("Hello! I'm Tom. I work in this office. Are you new here?", "Are you a new worker here?", "Hãy trả lời là đúng, rồi nói tên của bạn: Hoa.", "give_name", ["Yes, I'm Hoa.", "Yes, my name is Hoa.", "Yes, I'm new. I'm Hoa.", "I'm Hoa."], [["hoa"]]),
   ("Nice to meet you, Hoa. What is your job?", "What do you do here?", "Hãy nói bạn là kỹ sư.", "give_job", ["I'm an engineer.", "I work as an engineer.", "An engineer."], [["engineer"]])],
  "Great. Welcome to the company!", "Okay. See you later!"),
 ("cp6_shop_job", "information_exchange", CONV, "Xin việc ở cửa hàng", "Trả lời người quản lý cửa hàng khi xin việc.",
  [("Good afternoon. Can you tell me your name?", "What's your name, please?", "Hãy nói tên của bạn: Nam.", "give_name", ["My name is Nam.", "I'm Nam.", "My name's Nam.", "Good afternoon, I'm Nam.", "Nam."], [["nam"]]),
   ("Do you speak English?", "Can you speak English?", "Hãy nói bạn nói được một chút.", "little", ["Yes, a little.", "I speak a little English.", "A little."], [["little"]])],
  "Good. We will send you an email.", "Thank you. Goodbye."),
 ("cp6_shop_shoes", "transaction", PRAC, "Mua giày", "Hỏi giá một đôi giày, rồi trả bằng tiền mặt.",
  [("Hi! Do you need help?", "Can I help you?", "Hãy hỏi đôi giày này giá bao nhiêu.", "ask_price", ["How much are these shoes?", "How much do these shoes cost?", "How much are the shoes?", "Excuse me, how much are these shoes?"], [["how much"], ["shoes"]]),
   ("They are forty dollars.", "Forty dollars, please.", "Hãy nói bạn trả bằng tiền mặt.", "pay_cash", ["I'll pay in cash.", "In cash, please.", "I want to pay in cash.", "Cash, please."], [["cash"]])],
  "Thank you. Here is your bag.", "No problem. Goodbye!"),
 ("cp6_way_bank", "information_exchange", PRAC, "Tìm ngân hàng", "Hỏi một người lạ ngân hàng ở đâu, rồi cảm ơn.",
  [("Yes, can I help you?", "Do you need help?", "Hãy hỏi ngân hàng ở đâu.", "ask_way", ["Excuse me, where is the bank?", "Where is the bank?", "Sorry, where is the bank?"], [["where"], ["bank"]]),
   ("It's next to the supermarket. It's not far.", "It's near here, next to the supermarket.", "Hãy cảm ơn.", "thank", THANKS, [["thank", "thanks"]])],
  "You're welcome. Goodbye!", "No problem. Goodbye!"),
 ("cp6_clinic_cough", "information_exchange", PRAC, "Ở phòng khám", "Nói với y tá bạn bị ho và không sốt.",
  [("Hello. How can I help you?", "What's the problem?", "Hãy nói bạn bị ho.", "symptom", ["I have a cough.", "I've got a cough.", "A cough."], [["cough"]]),
   ("Do you have a fever?", "Are you hot? Do you have a fever?", "Hãy nói bạn không sốt.", "no_fever", ["No, I don't.", "No.", "No, I don't have a fever."], [["no"]])],
  "Okay. Drink water and rest.", "Please wait here. The doctor will help you."),
 ("cp6_call_office", "information_exchange", PRAC, "Gọi điện đến công ty", "Xin nói chuyện với ông Brown; ông ấy bận nên bạn sẽ gọi lại.",
  [("Hello, ABC Company.", "This is ABC Company. Who do you want to speak to?", "Hãy xin nói chuyện với ông Brown.", "ask_person", ["Can I speak to Mr Brown, please?", "I'd like to speak to Mr Brown.", "Mr Brown, please."], [["brown"]]),
   ("I'm sorry, he is in a meeting. Can you call later?", "He is busy now. Please call later. Is that okay?", "Hãy đồng ý.", "agree", ["Yes, I can.", "Okay, thank you.", "Yes, I'll call later.", "Okay."], YES_NO_YES)],
  "Thank you. Goodbye!", "I'm sorry. Goodbye!"),
 ("a1cap_new_worker", "conversation", CONV, "Ngày đầu ở nhà máy", "Trả lời người quản lý trong ngày đầu đi làm.",
  [("Good morning. Are you the new worker?", "You are new here, right?", "Hãy trả lời là đúng.", "confirm", ["Yes, I am.", "Yes.", "Yes, that's right."], [["yes"]]),
   ("Your shift starts at seven. Do you have your helmet?", "Do you have a helmet?", "Hãy nói bạn không có.", "no_helmet", ["No, I don't.", "No.", "No, I don't have a helmet.", "Sorry, no."], [["no"]])],
  "Okay. Take this helmet.", "No problem. Please ask your team."),
 ("a1cap_hotel_room", "transaction", PRAC, "Thuê phòng", "Hỏi một phòng cho một đêm, rồi trả bằng thẻ.",
  [("Good evening. How can I help you?", "Do you want a room?", "Hãy hỏi một phòng cho một đêm.", "ask_room", ["A room for one night, please.", "I'd like a room for one night.", "I want a room for one night.", "I need a room for one night."], [["room"]]),
   ("It's fifty dollars. Cash or card?", "Do you want to pay by cash or card?", "Hãy nói bạn trả bằng thẻ.", "pay_card", ["By card, please.", "Card, please.", "I'll pay by card."], [["card"]])],
  "Thank you. Here is your key.", "No problem. Goodbye!"),
 ("a1cap_friend_plan", "conversation", CONV, "Hẹn một người bạn", "Nhận lời hẹn vào Chủ nhật và nói giờ gặp.",
  [("Are you free on Sunday?", "Do you have time on Sunday?", "Hãy nói bạn rảnh.", "accept", ["Yes, I am.", "Yes, I'm free.", "Yes, of course.", "Sure."], [["yes", "sure"]]),
   ("Great! What time can we meet?", "When can we meet?", "Hãy nói gặp lúc ba giờ.", "time", ["At three.", "At three o'clock.", "Let's meet at three.", "Three o'clock."], [["three", "3"]])],
  "Okay, see you on Sunday!", "No problem. Another day!"),
 ("a1cap_airport_trip", "information_exchange", PRAC, "Hỏi đáp ở sân bay", "Trả lời nhân viên sân bay về chuyến đi của bạn.",
  [("Good afternoon. Where are you going?", "Where is your flight going?", "Hãy nói bạn đi Sydney.", "destination", ["To Sydney.", "I'm going to Sydney.", "Sydney."], [["sydney"]]),
   ("Okay. Is this your suitcase?", "This suitcase, is it yours?", "Hãy trả lời là đúng.", "confirm", ["Yes, it is.", "Yes.", "Yes, it's mine."], [["yes"]])],
  "Thank you. Have a good flight!", "No problem. Please wait here."),
]

scen, clips = [], []


def add_clip(cid, text, obj, speaker):
    clips.append(clip(cid, "message", [(speaker, text)], [obj]))


for rows, reserved in ((TEACHING, False), (RESERVED, True)):
    for n, (sid, fam, obj, title, goal, steps, end, miss) in enumerate(rows):
        base = f"en.clip.ix_{sid}"
        # Partner voices alternate, so that a learner meets both.
        speaker = "A" if n % 2 == 0 else "B"
        nodes = {}
        add_clip(f"{base}_miss", miss, obj, speaker)
        nodes["t_miss"] = {"kind": "terminal", "id": "t_miss", "outcome": "goal_not_met", "text": miss, "clipId": f"{base}_miss"}
        for i, (p, rp, prompt, intent, variants, concepts) in enumerate(steps):
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
        scen.append({"id": f"en.scenario.{sid}", "title": {"vi": title}, "goal": {"vi": goal}, "taskFamily": fam, "objectiveRefs": [obj], "startNodeId": "p0",
                     "nodes": nodes, "support": {"allowRepeat": True, "allowRephrase": True}, "reserved": reserved, "sourceRef": "original-project"})

write_jsonl(f"{DRAFTS}/scenarios/OUTPUT.jsonl", scen)
write_jsonl(f"{DRAFTS}/listening/OUTPUT.jsonl", clips, "a")
report()


def ids(step, key=None):
    return {json.loads(line)["id"]: json.loads(line) for line in open(f"{DRAFTS}/{step}/OUTPUT.jsonl", encoding="utf-8") if line.strip()}


KNOWN = {"clips": ids("listening"), "readings": ids("readings"), "speech": ids("speech"), "writing": ids("writing"), "scenarios": ids("scenarios")}
bad = [f"{lesson} {kind} {x}" for lesson, by in REFS.items() for kind, xs in by.items() for x in xs if x not in KNOWN[kind] or KNOWN[kind][x].get("reserved") is True]
used = {kind: {x for by in REFS.values() for x in by.get(kind, [])} for kind in KNOWN}
unused = [x for kind in ("speech", "writing", "scenarios") for x, r in KNOWN[kind].items() if not r.get("reserved") and x not in used[kind]]
if bad or unused:
    sys.exit("en_lesson_refs.py: " + "; ".join(bad + [f"unused {x}" for x in unused]))
print(len(scen), "scenarios", sum(s["reserved"] for s in scen), "reserved", len(clips), "clips", sum(len(s["nodes"]) for s in scen), "nodes", dict(Counter(s["taskFamily"] for s in scen)))
