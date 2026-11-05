"""ko-vi practice track on the public format of TOPIK I, paper-based (P4e session 5), after ja-exam.py. Original items
only: no official or sample question is copied or paraphrased. Two disjoint parallel forms, each a full administration.

What the official document fixes (NIIED, 한국어능력시험(TOPIK) 기본운영규정 제204호, 2024-09-12, read 2026-11-05; recorded
by ko-topik-format.py in exam/topik-i-format.json): TOPIK I has two sections, 듣기 30 items / 40 min and 읽기 40 items /
60 min, and the level by the total score, 1급 80-139 and 2급 140-200 of 200. What it does not fix, and the course chose:
the item types (the tasks below are the course's own design, on the kinds of text the course teaches), four options per
item, 100 points a section shared equally by its items, two plays of a recording. topik.go.kr renders by JavaScript and
was not read; no sample paper was compared.

Listening is heard through the device's ko-KR voice (ko-vi bundles no audio, D-11): with no voice the mock skips the
listening section, which stays unscored, and the result reports reading only and says so (src/app/exam/run.tsx).

The items live in four data modules, one per section and form (ko_topik_la.py, ko_topik_lb.py, ko_topik_ra.py,
ko_topik_rb.py). Every Korean string goes through ko_layers.check (lexicon words, allomorphs, number systems, no 반말 in
a key or a stimulus); a wrong option of a gap item is checked for its script only (it is wrong on purpose); every
Vietnamese string carries no Hangul. Appends its stimuli (use: "exam") to listening/OUTPUT.jsonl and readings/OUTPUT.jsonl
(run after the layer generators) and writes exam/OUTPUT.jsonl.
usage: python -I ko-exam.py <repo root> [--check la|lb|ra|rb]
"""
import importlib, os, re, sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ko_layers import DRAFTS, PROBLEMS, check, check_vi, clip, content_refs, refs, report, write_jsonl  # noqa: E402

TRACK = "topik_i"
KO = re.compile(r"[가-힣ㄱ-ㅣ]")
GAP = "(   )"
ONLY = sys.argv[sys.argv.index("--check") + 1] if "--check" in sys.argv else None
clips, readings, items = [], [], []
_pos = [0]


def O(k):
    return f"ko.obj.{k}"


LD, LI, LA = O("listening.short_dialogues"), O("listening.short_info"), O("listening.announcements")
RM, RN, RT = O("reading.short_messages"), O("reading.notices_info"), O("reading.short_texts")
GAP_OBJECTIVES = {k: O(k) for k in ["particles.core", "verbs.haeyo_present", "verbs.past_future", "questions.question_words", "negation.an_mot",
                                    "vocab.everyday_basics", "vocab.time_calendar", "vocab.work_korea", "numbers.two_systems", "sentences.copula",
                                    "existence.itda", "verbs.requests_rules", "wants.goshipda"]}

# Items per form, by task (the course's design; 30 + 40 = the regulation's item counts).
PER_FORM = {"l1": 6, "l2": 4, "l3": 4, "l4": 8, "l5": 8, "r1": 4, "r2": 10, "r3": 6, "r4": 8, "r5": 12}
SECTION_OF = {t: ("listening" if t[0] == "l" else "reading") for t in PER_FORM}


def place(where, correct, wrong):
    if len(wrong) != 3 or correct in wrong or len(set(wrong)) != 3:
        PROBLEMS.append(f"{where}: four distinct options needed ({correct!r} + {wrong})")
    p = _pos[0] % 4
    _pos[0] += 1
    o = list(wrong)
    o.insert(p, correct)
    return o, p


def item(form, task, n, exercise, obj, lex=None):
    slug = f"{form}_{task}_{n:02d}"
    ex = dict(exercise)
    ex["id"] = f"ko-exx-{TRACK}-{slug}"
    rec = {"id": f"ko.exi.{TRACK}.{slug}", "itemVersion": 1, "sectionId": SECTION_OF[task], "taskId": task, "exercise": ex, "objectiveTargets": [obj]}
    if lex:
        rec["lexemeRefs"] = lex
    items.append(rec)


def _vi_options(where, key, wrong):
    for t in [key, *wrong]:
        check_vi(where, t)
        if not t.strip():
            PROBLEMS.append(f"{where}: an empty option")


def _segs(where, segs):
    if not segs or any(s not in ("A", "B") for s, _ in segs):
        PROBLEMS.append(f"{where}: segments are (A|B, text)")
    return segs


def listening_item(form, task, n, segs, q, key, wrong, obj, korean_options=False):
    cid = f"ko.clip.topik_{form}_{task}_{n:02d}"
    _segs(cid, segs)
    kind = "dialogue" if len({s for s, _ in segs}) > 1 else ("announcement" if task == "l5" else "message")
    rec = clip(cid, kind, segs, [obj], max(1, min(6, len(segs))))
    rec["use"] = "exam"
    clips.append(rec)
    check_vi(cid, q)
    if korean_options:
        for t in [key, *wrong]:
            check(cid, t)  # a reply is a real sentence; only its fit is wrong
    else:
        _vi_options(cid, key, wrong)
    o, p = place(cid, key, wrong)
    item(form, task, n, {"type": "listeningComprehension", "clipId": cid, "question": q, "options": [{"text": t} for t in o], "correct": p}, obj)


def reading_record(rid, kind, title, blocks, obj, units):
    check(rid, title, plain=True)
    for b in blocks:
        check(rid, b, plain=not b.endswith((".", "?", "!")))
    text = " ".join(blocks)
    readings.append({"id": rid, "kind": kind, "title": title, "blocks": [{"kind": "paragraph", "text": b} for b in blocks], "objectiveRefs": [obj],
                     "lexemeRefs": refs(title + " " + text), "supportGlossary": [], "sourceRef": "original-project",
                     "authoringSpec": {"informationUnits": units, "inferenceDemand": "locate"}, "use": "exam"})
    return rid


def rc(form, task, n, rid, q, key, wrong, obj):
    check_vi(rid, q)
    _vi_options(rid, key, wrong)
    o, p = place(f"{rid} {q}", key, wrong)
    item(form, task, n, {"type": "readingComprehension", "readingId": rid, "question": q, "options": [{"text": t} for t in o], "correct": p}, obj)


L1_Q = "Bạn nghe một câu nói. Chọn câu đáp lại phù hợp nhất."
L2_Q = "Hai người đang ở đâu?"
L3_Q = "Hai người đang nói về chuyện gì?"
L4_Q = "Câu nào đúng với nội dung bạn nghe?"
R1_Q = "Hai câu này nói về chuyện gì?"
R4_Q = "Câu nào đúng với nội dung đoạn văn?"


def build(form, mod):
    """One section of one form from its data module ('la' = listening form a ...)."""
    data = importlib.import_module(f"ko_topik_{mod}")
    if mod[0] == "l":
        for n, (seg, key, wrong) in enumerate(data.L1, 1):
            listening_item(form, "l1", n, [seg] if isinstance(seg, tuple) else [("A", seg)], L1_Q, key, wrong, LD, korean_options=True)
        for n, (segs, key, wrong) in enumerate(data.L2, 1):
            listening_item(form, "l2", n, segs, L2_Q, key, wrong, LD)
        for n, (segs, key, wrong) in enumerate(data.L3, 1):
            listening_item(form, "l3", n, segs, L3_Q, key, wrong, LD)
        for n, (segs, key, wrong) in enumerate(data.L4, 1):
            listening_item(form, "l4", n, segs, L4_Q, key, wrong, LD)
        for n, (segs, q, key, wrong) in enumerate(data.L5, 1):
            listening_item(form, "l5", n, segs, q, key, wrong, LA if len({s for s, _ in segs}) == 1 else LI)
        return
    for n, (text, key, wrong) in enumerate(data.R1, 1):
        check(f"r1 {form}{n}", text)
        _vi_options(f"r1 {form}{n}", key, wrong)
        o, p = place(f"r1 {form}{n}", key, wrong)
        item(form, "r1", n, {"type": "select", "mode": "targetToNative", "prompt": text, "audioTarget": text, "options": [{"text": t} for t in o], "correct": p}, RT,
             content_refs(text) or None)
    for n, (sentence, key, wrong, obj) in enumerate(data.R2, 1):
        where = f"r2 {form}{n}"
        if sentence.count(GAP) != 1:
            PROBLEMS.append(f"{where}: {sentence!r} needs exactly one {GAP}")
        full = sentence.replace(GAP, key)
        check(where, full)
        for w in wrong:
            if not KO.search(w) or re.search(r"[A-Za-z0-9]", w):
                PROBLEMS.append(f"{where}: option {w!r} is not Hangul")
        if obj not in GAP_OBJECTIVES:
            PROBLEMS.append(f"{where}: objective {obj!r} is not one of {sorted(GAP_OBJECTIVES)}")
        o, p = place(where, key, wrong)
        item(form, "r2", n, {"type": "select", "mode": "nativeToTarget", "prompt": sentence, "audioTarget": full, "options": [{"text": t} for t in o], "correct": p},
             GAP_OBJECTIVES.get(obj, RT), content_refs(full) or None)
    for n, (kind, title, blocks, q, key, wrong) in enumerate(data.R3, 1):
        obj = RM if kind == "message" else RN
        rid = reading_record(f"ko.read.topik_{form}_r3_{n:02d}", kind, title, blocks, obj, max(2, len(blocks)))
        rc(form, "r3", n, rid, q, key, wrong, obj)
    for n, (kind, title, blocks, key, wrong) in enumerate(data.R4, 1):
        rid = reading_record(f"ko.read.topik_{form}_r4_{n:02d}", kind, title, blocks, RT, 3)
        rc(form, "r4", n, rid, R4_Q, key, wrong, RT)
    k = 0
    for n, (kind, title, blocks, qs) in enumerate(data.R5, 1):
        rid = reading_record(f"ko.read.topik_{form}_r5_{n:02d}", kind, title, blocks, RT, 5)
        if len(qs) != 2:
            PROBLEMS.append(f"{rid}: two questions per text")
        for q, key, wrong in qs:
            k += 1
            rc(form, "r5", k, rid, q, key, wrong, RT)


MODULES = ["la", "lb", "ra", "rb"]
for mod in MODULES:
    if ONLY is None or ONLY == mod:
        build(mod[1], mod)

per_task = Counter((i["id"].split(".")[-1].split("_")[0], i["taskId"]) for i in items)
for mod in MODULES if ONLY is None else [ONLY]:
    for task, n in PER_FORM.items():
        if task[0] == mod[0] and per_task[(mod[1], task)] != n:
            PROBLEMS.append(f"form {mod[1]} {task}: {per_task[(mod[1], task)]} items, the form needs {n}")
# The two forms share no stimulus text and no item payload.
seen = {}
for r in clips + readings:
    key = " ".join(s["text"] for s in r.get("segments", [])) or " ".join(b["text"] for b in r.get("blocks", []))
    if key in seen:
        PROBLEMS.append(f"{r['id']} repeats the text of {seen[key]}")
    seen[key] = r["id"]
if ONLY is not None:
    report()
    print(f"--check {ONLY}: {len(items)} items, {len(clips)} clips, {len(readings)} readings: ok")
    sys.exit(0)


# =============================================================== the track
def T(vi):
    """Vietnamese track text; the Korean names of the sections, in brackets, are proper names."""
    check_vi("track", re.sub(r"\([^)]*\)", "", vi))
    return {"vi": vi}


def task(tid, title, instr, n, fmt="mcq4", **kw):
    t = {"id": tid, "title": T(title), "instruction": T(instr), "format": fmt}
    t.update(kw)
    t["itemsPerForm"] = n
    return t


REGULATION = "https://www.niied.go.kr/convert/preview/1764681490990/index.html"
VOICE = ("Phần Nghe dùng giọng đọc tiếng Hàn cài trên máy (khoá học chưa có âm thanh thu sẵn): nếu máy chưa có giọng đọc, "
         "phần Nghe được bỏ qua, không tính điểm, và kết quả chỉ báo phần Đọc.")
track = {
 "id": f"ko.exam.{TRACK}", "trackVersion": 1, "name": "TOPIK I", "level": "TOPIK I", "formatFidelity": "partial",
 "title": T("Luyện đề TOPIK I (theo định dạng công khai)"),
 "description": T("Luyện theo định dạng bài thi giấy của Kỳ thi Năng lực tiếng Hàn TOPIK I (cấp 1–2), do Viện Giáo dục Quốc tế Quốc gia Hàn Quốc (NIIED) tổ chức, "
                  "theo Quy chế vận hành TOPIK số 204 (ngày 12/9/2024): phần Nghe 30 câu trong 40 phút, phần Đọc 40 câu trong 60 phút, tổng điểm tối đa 200, "
                  "cấp 1 từ 80 điểm và cấp 2 từ 140 điểm. Quy chế không nêu dạng câu hỏi, số lựa chọn hay điểm của từng câu, nên các dạng câu hỏi ở đây do khoá học tự thiết kế: "
                  "mỗi câu có bốn lựa chọn, mỗi phần tính 100 điểm chia đều cho các câu, mỗi đoạn nghe được phát hai lần. "
                  "Mọi câu hỏi đều do khoá học tự soạn, không lấy từ đề thi hay đề mẫu. " + VOICE +
                  " Cấp TOPIK không phải một bậc của khung CEFR, và đây không phải kỳ thi chính thức."),
 "formatSource": {
  "publisher": "National Institute for International Education (NIIED, 국립국제교육원)",
  "references": [
   {"url": REGULATION, "title": "한국어능력시험(TOPIK) 기본운영규정, 규정 제204호 (2024.9.12): 제3조제2항 (sections, items, times), 별표 1 (levels by total score)", "retrieved": "2026-11-05"},
   {"url": "https://www.topik.go.kr/TWGUIDE/TWGUIDE0010.do", "title": "topik.go.kr test guide — not read: the page renders by JavaScript and returned only its title on 2026-11-05; to compare by hand"},
  ],
  "checkedAgainstOfficialGuide": True,
  "checkedBy": "coding agent (owner-delegated)",
  "checkedAt": "2026-11-05",
  "note": T("Số câu, thời gian của hai phần và ngưỡng điểm cấp 1–2 được đối chiếu với Quy chế vận hành TOPIK số 204 của NIIED ngày 2026-11-05. "
            "Trang hướng dẫn topik.go.kr hiển thị bằng JavaScript nên chưa đọc được, và chưa đối chiếu với đề mẫu nào. "
            "Những điều quy chế không nêu do khoá học chọn: dạng câu hỏi, bốn lựa chọn mỗi câu, 100 điểm mỗi phần và hai lần nghe."),
 },
 "sections": [
  {"id": "listening", "skill": "listening", "title": T("Nghe hiểu (듣기)"), "minutes": 40, "maxPoints": 100, "playsPerRecording": 2, "tasks": [
    task("l1", "Dạng 1 — Câu đáp lại", "Nghe một câu nói, rồi chọn câu đáp lại phù hợp nhất. " + VOICE, PER_FORM["l1"]),
    task("l2", "Dạng 2 — Nơi chốn", "Nghe hội thoại và chọn nơi hai người đang ở.", PER_FORM["l2"]),
    task("l3", "Dạng 3 — Chủ đề", "Nghe hội thoại và chọn chuyện hai người đang nói.", PER_FORM["l3"]),
    task("l4", "Dạng 4 — Nội dung đúng", "Nghe hội thoại và chọn câu đúng với nội dung.", PER_FORM["l4"]),
    task("l5", "Dạng 5 — Thông báo và hội thoại dài hơn", "Nghe thông báo hoặc hội thoại và trả lời câu hỏi.", PER_FORM["l5"])]},
  {"id": "reading", "skill": "reading", "title": T("Đọc hiểu (읽기)"), "minutes": 60, "maxPoints": 100, "tasks": [
    task("r1", "Dạng 1 — Chủ đề", "Đọc hai câu và chọn chuyện hai câu nói tới.", PER_FORM["r1"]),
    task("r2", "Dạng 2 — Điền vào chỗ trống", "Chọn từ hoặc dạng đúng cho chỗ (   ).", PER_FORM["r2"], skill="structures"),
    task("r3", "Dạng 3 — Biển báo, thông báo, tin nhắn", "Đọc biển báo, thông báo hoặc tin nhắn và trả lời câu hỏi.", PER_FORM["r3"]),
    task("r4", "Dạng 4 — Nội dung đúng", "Đọc đoạn văn ngắn và chọn câu đúng với nội dung.", PER_FORM["r4"]),
    task("r5", "Dạng 5 — Đoạn văn", "Đọc đoạn văn và trả lời hai câu hỏi.", PER_FORM["r5"])]},
 ],
 "passRule": {"total": {"title": T("Tổng điểm: ngưỡng cấp 1 của định dạng là 80/200"), "min": 80}},
 "scoring": {"perItem": "share_of_section_points", "negativeMarking": False},
 "readiness": {
  "bands": [
   {"id": "ready_estimate", "minGroupShare": 0.55, "label": T("Mức sẵn sàng ước tính: tốt"),
    "message": T("Ở lần làm thử này, tổng điểm cao hơn ngưỡng 80/200 của định dạng một khoảng an toàn. Đây là mức sẵn sàng ước tính từ bài luyện của khoá học, không phải điểm hay cấp TOPIK.")},
   {"id": "getting_close", "minGroupShare": 0.4, "label": T("Mức sẵn sàng ước tính: gần đạt"),
    "message": T("Tổng điểm đã chạm ngưỡng 80/200 của định dạng nhưng chưa có khoảng an toàn. Hãy luyện thêm các dạng câu yếu bên dưới.")},
   {"id": "not_yet", "minGroupShare": 0, "label": T("Mức sẵn sàng ước tính: cần luyện thêm"),
    "message": T("Tổng điểm chưa tới ngưỡng 80/200 của định dạng. Hãy luyện các dạng câu yếu bên dưới, rồi thử đề còn lại.")}],
  "incomplete": T("Chưa đủ dữ liệu để ước tính: định dạng tính tổng điểm của cả phần Nghe và phần Đọc. Nếu máy chưa có giọng đọc tiếng Hàn, phần Nghe không được chấm "
                  "và kết quả chỉ báo phần Đọc. Hãy cài giọng đọc tiếng Hàn rồi làm lại đề để có ước tính đầy đủ."),
  "disclaimer": T("Mức sẵn sàng ước tính dựa trên bài luyện của khoá học: không phải kỳ thi chính thức, không do NIIED cấp, và không dự đoán kết quả thi thật. "
                  "Điểm ở đây là tỉ lệ câu đúng của mỗi phần nhân với 100. Cấp TOPIK không phải một bậc của khung CEFR."),
 },
 "items": items,
 "forms": [{"formId": f, "itemIds": [i["id"] for i in items if i["id"].split(".")[-1].startswith(f + "_")]} for f in "ab"],
}

write_jsonl(f"{DRAFTS}/listening/OUTPUT.jsonl", clips, "a")
write_jsonl(f"{DRAFTS}/readings/OUTPUT.jsonl", readings, "a")
write_jsonl(f"{DRAFTS}/exam/OUTPUT.jsonl", [track])
report()
print(len(items), "TOPIK I items", dict(sorted(Counter(i["taskId"] for i in items).items())), len(clips), "clips", len(readings), "readings")
