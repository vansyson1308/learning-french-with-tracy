"""zh-vi Section 6 lessons: talking with someone — the restaurant and the shop (unit s), the way, the taxi and the
subway (t), the clinic (u), phoning the workplace (v). Session 2 writes the choice, fill-in, word-bank and typed items
each conversation needs; session 3 adds the interactionScenario items of zh-scenarios-s6.py (zh_lesson_refs.py: the bank
account in uu-l2, as ja-vi's city office; the safety briefing, the warehouse and the Taiwan factory day in unit v).
Two lessons show a concept card.
Writes lessons/parts/s6.jsonl. usage: python -I zh-lessons-s6.py <repo root>"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zh_lesson_lib import IX, C, F, H, M, N, NX, T, TX, W, Y, finish, lesson

# ---------------------------------------------------------------- us: restaurant and shop
lesson("us-l0", [
    T("服务员", ["菜单", "客人", "经理"]), N("菜单", ["服务员", "菜", "东西"]),
    NX("Bạn gọi nhân viên phục vụ trong nhà hàng:", "服务员！", ["菜单！", "欢迎！", "再见！"]),
    F("请给我___。", "菜单", ["服务员", "一共", "付"], "Cho tôi xem thực đơn."),
    W("Cho tôi một bát mì.", "我|要|一碗|面条", ["杯", "有"]),
    Y("Cho tôi một chai nước.", "我要一瓶水", "请给我一瓶水", "给我一瓶水"),
    M("服务员", "菜单", "碗", "瓶", "份"),
])
lesson("us-l1", [
    F("我要两___米饭。", "碗", ["本", "张", "双"], "Cho tôi hai bát cơm."),
    F("我要一___水。", "瓶", ["本", "张", "只"], "Cho tôi một chai nước."),
    TX("要几个？", "Lấy mấy cái?", ["Bao nhiêu tiền?", "Lấy cái nào?", "Có mấy người?"]),
    NX("Lấy hai cái.", "两个。", ["二个。", "两本。", "两。"]),
    Y("Cho tôi một phần sủi cảo.", "我要一份饺子", "请给我一份饺子", "给我一份饺子"),
    M("碗", "瓶", "份", "杯", "个"),
    IX("shop_fruit"),
])
lesson("us-l2", [
    T("辣", ["甜", "好吃", "饿"]), N("好吃", ["好玩儿", "好看", "好听"]),
    F("不要太___。", "辣", ["饿", "饱", "渴"], "Đừng cay quá."),
    TX("我饱了。", "Tôi no rồi.", ["Tôi đói rồi.", "Tôi khát rồi.", "Tôi mệt rồi."]),
    NX("Món này ngon quá!", "这个菜太好吃了！", ["这个菜太好喝了！", "这个菜很好吃吗！", "这个菜好吃太了！"]),
    Y("Tôi đói rồi.", "我饿了"),
])
lesson("us-l3", [
    T("一共", ["一起", "一定", "一样"]), N("付", ["买", "卖", "给"]),
    TX("今天我请客。", "Hôm nay tôi mời.", ["Hôm nay tôi là khách.", "Hôm nay bạn trả tiền.", "Hôm nay tôi không có tiền."]),
    F("一共多少___？", "钱", ["个", "次", "本"], "Tổng cộng bao nhiêu tiền?"),
    W("Để tôi trả.", "我|来|付", ["买", "给"]),
    Y("Tổng cộng bao nhiêu tiền?", "一共多少钱"),
    IX("restaurant_order"),
])

# ---------------------------------------------------------------- ut: the way, taxi, subway
lesson("ut-l0", [
    T("左边", ["右边", "前边", "后边"]), N("右边", ["左边", "旁边", "对面"]),
    TX("一直往前走。", "Cứ đi thẳng.", ["Rẽ trái.", "Quay lại.", "Đi về phía sau."]),
    F("超市在银行___。", "右边", ["左边", "上", "里"], "Siêu thị ở bên phải ngân hàng."),
    NX("Xin hỏi, ga tàu điện ngầm đi thế nào?", "请问，地铁站怎么走？", ["请问，地铁站怎么样？", "请问，地铁站是什么？", "请问，怎么地铁站走？"]),
    Y("Ở bên trái.", "在左边", "左边"),
    M("左边", "右边", "前边", "后边", "往"),
])
lesson("ut-l1", [
    T("远", ["近", "快", "慢"]), N("近", ["远", "小", "短"]),
    TX("远吗？不远，走五分钟。", "Có xa không? Không xa, đi bộ năm phút.", ["Có xa không? Xa lắm, đi xe năm phút.", "Có gần không? Không gần, đi bộ năm phút.", "Có xa không? Không xa, đi bộ mười lăm phút."]),
    F("工厂___这儿很远。", "离", ["从", "往", "在"], "Nhà máy cách đây rất xa."),
    NX("Ga tàu ở đối diện siêu thị.", "火车站在超市对面。", ["火车站在对面超市。", "火车站对面在超市。", "火车站有超市对面。"]),
    Y("Nhà tôi gần nhà máy.", "我家离工厂很近", "我家离工厂近"),
    IX("ask_subway"),
])
lesson("ut-l2", [
    T("出租车", ["公交车", "自行车", "火车"]),
    NX("Bạn nói với tài xế taxi: Đến ga tàu hoả.", "去火车站。", ["在火车站。", "火车站去。", "来火车站吗。"]),
    TX("到了，就在这儿停。", "Đến rồi, dừng ở đây.", ["Sắp đến rồi, đi tiếp.", "Dừng ở kia.", "Chưa đến, cứ đi thẳng."]),
    F("请在路口___车。", "停", ["开", "坐", "走"], "Xin dừng xe ở ngã tư."),
    W("Tôi bắt taxi đi sân bay.", "我|打车|去|机场", ["坐", "火车站"]),
    Y("Xin dừng ở đây.", "请在这儿停", "就在这儿停", "在这儿停", "请停在这儿", "请在这儿停车", "在这儿停车", "就在这儿停吧"),
])
lesson("ut-l3", [
    H("是左边吗？", ["是右边吗？", "在左边。", "是这边吗？"]),
    TX("到路口往右边走。", "Đến ngã tư thì đi về bên phải.", ["Đến ngã tư thì rẽ trái.", "Cứ đi thẳng qua ngã tư.", "Ngã tư ở bên phải."]),
    F("你___哪儿来？", "从", ["往", "离", "在"], "Bạn từ đâu đến?"),
    NX("Bên trái phải không?", "是左边吗？", ["是左边呢？", "左边是不是吗？", "在左边吧吗？"]),
    Y("Cứ đi thẳng.", "一直往前走", "一直走"),
    M("一直", "从", "离", "远", "近"),
    IX("taxi"),
])

# ---------------------------------------------------------------- uu: the clinic
lesson("uu-l0", [
    T("医院", ["医生", "药店", "病人"]), N("医生", ["病人", "医院", "老师"]),
    TX("我不舒服。", "Tôi thấy không khoẻ.", ["Tôi khoẻ.", "Tôi không bận.", "Tôi không thích."]),
    F("我头___。", "疼", ["好", "大", "高"], "Tôi đau đầu."),
    NX("Tôi bị sốt.", "我发烧了。", ["我发烧过。", "我发烧吗。", "我是发烧。"]),
    Y("Tôi đau bụng.", "我肚子疼", "我肚子很疼", "我的肚子疼", "我的肚子很疼"),
])
lesson("uu-l1", [
    T("头", ["手", "脚", "脸"]), N("手", ["头", "脚", "腿"]),
    M("头", "手", "眼睛", "脸", "肚子"),
    F("我的眼睛很___。", "疼", ["饿", "渴", "饱"], "Mắt tôi đau."),
    TX("你哪儿不舒服？", "Bạn khó chịu ở đâu?", ["Bạn ở đâu?", "Bạn khoẻ không?", "Bạn đi khám ở đâu?"]),
    Y("Tôi đau đầu.", "我头疼", "我头很疼", "我的头疼", "我的头很疼"),
    IX("clinic_reception"),
])
lesson("uu-l2", [
    TX("疼了几天了？", "Đau mấy ngày rồi?", ["Đau ở đâu?", "Đau lắm không?", "Mấy giờ thì đau?"]),
    F("疼了两___了。", "天", ["点", "个", "本"], "Đau hai ngày rồi."),
    NX("Tôi không sốt.", "我不发烧。", ["我没有发烧了。", "我发烧不。", "我不发烧了吗。"]),
    H("发烧吗？", ["发烧了。", "不发烧。", "发了吗？"]),
    W("Tôi đi khám bệnh.", "我|去|看病", ["药", "了"]),
    Y("Tôi muốn đi bệnh viện.", "我想去医院", "我要去医院"),
    IX("bank_account"),
])
lesson("uu-l3", [
    C("measure-words"),
    T("药", ["药店", "病", "水"]),
    TX("一天吃三次药。", "Một ngày uống thuốc ba lần.", ["Ba ngày uống thuốc một lần.", "Một ngày uống ba viên thuốc.", "Một ngày uống thuốc hai lần."]),
    F("一天吃三___药。", "次", ["个", "本", "张"], "Một ngày uống thuốc ba lần."),
    NX("Uống thuốc sau khi ăn.", "饭后吃药。", ["饭吃后药。", "吃药饭后。", "药后吃饭。"]),
    W("Tôi đi hiệu thuốc mua thuốc.", "我|去|药店|买|药", ["卖", "医院"]),
    Y("Một ngày uống ba lần.", "一天吃三次", "一天三次"),
    IX("clinic_doctor"),
])

# ---------------------------------------------------------------- uv: phoning the workplace
lesson("uv-l0", [
    T("喂", ["哦", "嗯", "啊"]), N("打电话", ["发", "上网", "电话"]),
    NX("Bạn nhấc máy điện thoại. Bạn nói:", "喂，您好！", ["再见，您好！", "晚安！", "喂，再见！"]),
    TX("我是二号车间的阮海。", "Tôi là Nguyễn Hải ở phân xưởng số hai.", ["Tôi là Nguyễn Hải ở phòng số hai.", "Nguyễn Hải làm ở phân xưởng số ba.", "Tôi gọi phân xưởng số hai."]),
    F("我给经理___电话。", "打", ["发", "看", "开"], "Tôi gọi điện cho giám đốc."),
    Y("Tôi gọi điện cho mẹ.", "我给妈妈打电话", "我给我妈妈打电话"),
])
lesson("uv-l1", [
    C("modals"),
    TX("我今天生病了，不能来上班。", "Hôm nay tôi ốm, không đi làm được.", ["Hôm nay tôi ốm, nhưng vẫn đi làm.", "Mai tôi ốm, không đi làm được.", "Hôm nay tôi không muốn đi làm."]),
    NX("Hiểu rồi, nghỉ ngơi cho khoẻ.", "明白了，好好休息。", ["明白了，好好工作。", "不明白，好好休息。", "明白吗，好好休息。"]),
    F("我今天不___来上班。", "能", ["是", "有", "在"], "Hôm nay tôi không đến làm được."),
    W("Hôm nay tôi không đi làm được.", "我|今天|不能|上班", ["没", "会"], alts=("今天|我|不能|上班",)),
    Y("Tôi muốn xin nghỉ một ngày.", "我想请假一天", "我要请假一天", "我想请一天假"),
    IX("call_sick"),
])
lesson("uv-l2", [
    TX("我一会儿再打给你。", "Lát nữa tôi gọi lại cho bạn.", ["Tôi vừa gọi cho bạn.", "Bạn gọi lại cho tôi nhé.", "Tôi không gọi cho bạn nữa."]),
    F("请___说一遍。", "再", ["又", "还", "也"], "Xin nói lại một lần nữa."),
    H("听不清楚。", ["听得清楚。", "看不清楚。", "说不清楚。"]),
    NX("Xin nói chậm một chút.", "请说慢一点儿。", ["请慢说一点儿吗。", "请说快一点儿。", "请一点儿说慢。"]),
    Y("Xin nói lại một lần nữa.", "请再说一遍", "请再说一次"),
    W("Lát nữa tôi gọi lại.", "我|一会儿|再|打|给你", ["又", "了"], alts=("一会儿|我|再|打|给你",)),
    IX("factory_safety"),
])
lesson("uv-l3", [
    T("微信", ["电话", "短信", "照片"]), N("发", ["打", "看", "收"]),
    TX("我给你发微信。", "Tôi nhắn WeChat cho bạn.", ["Bạn nhắn WeChat cho tôi.", "Tôi gọi điện cho bạn.", "Tôi không có WeChat."]),
    F("你有微信___？", "吗", ["的", "是", "在"], "Bạn có WeChat không?"),
    Y("Bạn có WeChat không?", "你有微信吗", "你有没有微信"),
    W("Gửi ảnh cho tôi nhé.", "给|我|发|照片|吧", ["的", "打"]),
    IX("warehouse_boxes"), IX("taiwan_first_day"),
])
finish("s6")
