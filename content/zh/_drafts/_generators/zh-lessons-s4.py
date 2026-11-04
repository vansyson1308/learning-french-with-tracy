"""zh-vi Section 4 lessons: speaking at work — greetings and titles (unit k), introducing yourself at an interview (l),
numbers aloud: phone, prices, times (m), describing people and things with 很, colours and 比 (n). Session 2 writes the
choice, fill-in, word-bank and typed items that prepare each spoken task; session 3 adds the speakProduction and
speakRepetition items (zh-CN recogniser) pointing at the records of zh-speech-s4.py (zh_lesson_refs.py). A review lesson
(uk-l3, ul-l3, un-l3) re-uses an item with one more objective. Four lessons show a concept card.
Writes lessons/parts/s4.jsonl. usage: python -I zh-lessons-s4.py <repo root>"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zh_lesson_lib import C, F, H, M, N, NX, SP, T, TX, W, Y, finish, lesson

# ---------------------------------------------------------------- uk: greetings at work
lesson("uk-l0", [
    C("polite-work"),
    T("辛苦了", ["加油", "没问题", "好的"]), N("经理", ["组长", "老板", "工人"]),
    NX("Cuối ca, tổ trưởng nói với cả tổ:", "辛苦了！", ["加油！", "生日快乐！", "早上好！"]),
    NX("Bạn chào giám đốc Vương buổi sáng.", "王经理，早上好！", ["王经理，晚安！", "王，早上好！", "经理王，早上好！"]),
    F("王经理___！", "好", ["吗", "呢", "了"], "Chào giám đốc Vương!"),
    W("Tôi về trước, mai gặp.", "我|先|走|了|明天见", ["再见", "来"]),
    M("辛苦了", "加油", "好的", "没问题", "我明白了"),
    SP("k_rep_zaoshang"), SP("k_greet_morning"),
])
lesson("uk-l1", [
    F("___好！我是新来的工人。", "您", ["他", "她", "它"], "Xin chào! Tôi là công nhân mới đến."),
    NX("Câu nào lịch sự khi nói với giám đốc?", "您好，王经理。", ["你好，小王。", "喂，王经理。", "嗯，你好。"]),
    TX("您贵姓？", "Ông họ gì ạ?", ["Ông bao nhiêu tuổi ạ?", "Ông làm nghề gì ạ?", "Ông là người nước nào ạ?"]),
    Y("Chào giám đốc (lịch sự).", "经理好", "经理，您好", "您好，经理"),
    W("Xin đợi một chút.", "请|等|一下", ["一点儿", "看"]),
    T("好的", ["没问题", "辛苦了", "不客气"]),
    SP("k_rep_xinku"), SP("k_xinku"), SP("k_thanks"),
])
lesson("uk-l2", [
    T("上班", ["下班", "加班", "上课"]), N("下班", ["上班", "下课", "下车"]),
    TX("你几点下班？", "Mấy giờ bạn tan ca?", ["Mấy giờ bạn vào ca?", "Hôm nay bạn có tăng ca không?", "Bạn làm ở đâu?"]),
    F("我早上七点___。", "上班", ["下班", "睡觉", "晚安"], "Tôi vào ca lúc bảy giờ sáng."),
    W("Tôi tan ca lúc năm giờ chiều.", "我|下午|五点|下班", ["上班", "了"], alts=("下午|五点|我|下班",)),
    Y("Hôm nay tôi tăng ca.", "我今天加班", "我今天要加班"),
    M("上班", "下班", "经理", "辛苦了", "加油"),
    SP("k_rep_xianzou"), SP("k_xianzou"), SP("k_sorry"), SP("k_excuse"),
])
lesson("uk-l3", [
    H("辛苦了", ["新年", "加油", "心情"]), H("没问题", ["没关系", "没事儿", "问题"]), H("我明白了", ["我明天来", "我不明白", "我们白天"]),
    NX("Tổ trưởng giao việc, bạn trả lời: Vâng, không vấn đề gì.", "好的，没问题。", ["好的，没关系。", "不客气，没问题。", "对不起，没问题。"]),
    F("___，我明白了。", "好的", ["不客气", "对不起", "晚安"], "Vâng, tôi hiểu rồi."),
    Y("Tôi hiểu rồi.", "我明白了", "明白了", "我懂了"),
    SP("k_greet_morning", ("politeness.register",)), SP("k_xinku", ("politeness.register",)), SP("k_xianzou", ("politeness.register",)),
])

# ---------------------------------------------------------------- ul: introducing yourself
lesson("ul-l0", [
    T("认识", ["介绍", "知道", "喜欢"]), N("高兴", ["累", "忙", "难"]),
    TX("认识您很高兴。", "Rất vui được gặp ông.", ["Rất vui được làm việc với ông.", "Tôi không quen ông.", "Ông có vui không?"]),
    F("我今年二十五___。", "岁", ["年", "个", "号"], "Năm nay tôi hai mươi lăm tuổi."),
    NX("Tôi là người Việt Nam, năm nay hai mươi ba tuổi.", "我是越南人，今年二十三岁。", ["我是越南人，今年二十三年。", "我是越南人，二十三岁今年。", "我越南人，今年是二十三岁。"]),
    W("Rất vui được quen bạn.", "认识|你|很|高兴", ["我", "快乐"], alts=("我|很|高兴|认识|你",)),
    Y("Năm nay tôi hai mươi tuổi.", "我今年二十岁"),
    M("认识", "高兴", "介绍", "岁", "今年"),
    SP("l_rep_renshi"), SP("l_name"), SP("l_from"),
])
lesson("ul-l1", [
    H("二十五岁", ["十五岁", "二十岁", "五十二岁"]),
    TX("你多大了？", "Bạn bao nhiêu tuổi?", ["Bạn cao bao nhiêu?", "Bạn làm việc mấy năm rồi?", "Nhà bạn có to không?"]),
    F("我在工厂工作___三年。", "过", ["着", "的", "在"], "Tôi đã từng làm ở nhà máy ba năm."),
    NX("Tôi đã làm ở nhà máy hai năm.", "我在工厂工作了两年。", ["我在工厂工作了二年。", "我工作了两年在工厂。", "我在工厂工作两年了吗。"]),
    W("Tôi hai mươi tám tuổi.", "我|二十八|岁", ["年", "个"]),
    Y("Năm nay bạn bao nhiêu tuổi?", "你今年多大", "你今年多大了", "你今年几岁", "你今年几岁了", "你今年多少岁", "你今年多少岁了"),
    SP("l_age"), SP("l_work"),
])
lesson("ul-l2", [
    C("modals"),
    T("会", ["能", "想", "可以"]),
    F("我___说一点儿汉语。", "会", ["想", "要", "是"], "Tôi biết nói một chút tiếng Trung."),
    F("你___来我们公司吗？", "想", ["会", "是", "在"], "Bạn muốn vào công ty chúng tôi không?"),
    TX("我今天不能上班。", "Hôm nay tôi không đi làm được.", ["Hôm nay tôi không muốn đi làm.", "Hôm nay tôi không biết đi làm.", "Hôm nay tôi được nghỉ."]),
    NX("Tôi muốn làm việc ở Trung Quốc.", "我想在中国工作。", ["我想工作在中国。", "我在想中国工作。", "我会在中国工作。"]),
    Y("Tôi biết nói tiếng Trung.", "我会说汉语", "我会说中文"),
    W("Tôi vào được không?", "我|可以|进来|吗", ["会", "呢"]),
    SP("l_like"), SP("l_rep_jieshao"),
])
lesson("ul-l3", [
    T("介绍", ["认识", "希望", "喜欢"]),
    TX("我来介绍一下，这是我的同事小王。", "Để tôi giới thiệu, đây là đồng nghiệp của tôi, Tiểu Vương.", ["Để tôi giới thiệu, đây là giám đốc Vương.", "Đây là bạn học của tôi, Tiểu Vương.", "Tiểu Vương giới thiệu tôi với đồng nghiệp."]),
    F("我___你介绍一下。", "给", ["在", "是", "比"], "Tôi giới thiệu với bạn một chút."),
    NX("Tôi hy vọng được làm việc ở công ty của các anh chị.", "我希望在你们公司工作。", ["我希望工作在你们公司。", "我在希望你们公司工作。", "你们希望在我的公司工作。"]),
    W("Tôi thích công việc này.", "我|喜欢|这个|工作", ["想", "那个"]),
    Y("Tôi thích âm nhạc.", "我喜欢音乐", "我喜欢听音乐", "我爱音乐"),
    M("介绍", "希望", "喜欢", "觉得", "想"),
    SP("l_name", ("greetings.basic",)), SP("l_from", ("vocab.work_china",)), SP("l_work", ("vocab.work_china",)),
])

# ---------------------------------------------------------------- um: numbers aloud
lesson("um-l0", [
    T("手机", ["电脑", "号码", "照片"]), N("号码", ["手机", "电话", "名字"]),
    TX("你的手机号码是多少？", "Số di động của bạn là bao nhiêu?", ["Điện thoại của bạn bao nhiêu tiền?", "Bạn có mấy cái điện thoại?", "Số phòng của bạn là bao nhiêu?"]),
    F("你的电话号码是___？", "多少", ["几", "谁", "哪"], "Số điện thoại của bạn là bao nhiêu?"),
    H("七点十分", ["七点四十", "十点七分", "一点十分"]),
    W("Bạn có điện thoại di động không?", "你|有|手机|吗", ["呢", "号码"]),
    Y("Số điện thoại của bạn là bao nhiêu?", "你的电话号码是多少", "你电话号码是多少", "你的电话是多少"),
    M("电话", "手机", "号码", "电脑", "照片"),
    SP("m_tickets"),
])
lesson("um-l1", [
    H("两块五", ["两块", "五块二", "二十五块"]),
    TX("这个二十五块。", "Cái này hai mươi lăm tệ.", ["Cái này mười lăm tệ.", "Cái này năm mươi hai tệ.", "Cái này hai trăm năm mươi tệ."]),
    F("一共一百___。", "块", ["个", "本", "次"], "Tổng cộng một trăm tệ."),
    NX("hai tệ rưỡi", "两块五", ["二块五", "五块两", "两块半五"]),
    W("Cái này bao nhiêu tiền?", "这个|多少|钱", ["个", "贵"]),
    Y("Hai mươi lăm tệ.", "二十五块", "二十五块钱", "二十五元"),
    SP("m_rep_price"), SP("m_price"),
])
lesson("um-l2", [
    T("分", ["点", "刻", "小时"]), H("三点半", ["三点", "四点半", "十点半"]),
    TX("我们几点见？", "Mấy giờ chúng ta gặp?", ["Chúng ta gặp ở đâu?", "Mấy giờ bạn đi?", "Hôm nào chúng ta gặp?"]),
    F("下午两点___分", "十", ["个", "岁", "块"], "hai giờ mười phút chiều"),
    NX("ngày một tháng năm", "五月一号", ["一月五号", "五号一月", "五月一年"]),
    Y("Chúng ta gặp lúc ba giờ chiều.", "我们下午三点见", "我们下午三点见面"),
    M("点", "分", "刻", "半", "小时"),
    SP("m_time"), SP("m_rep_half"),
])
lesson("um-l3", [
    T("电影", ["音乐", "故事", "歌"]), N("唱歌", ["跑", "玩儿", "旅游"]),
    TX("我喜欢看电影。", "Tôi thích xem phim.", ["Tôi thích nghe nhạc.", "Tôi không thích xem phim.", "Tôi muốn đi xem phim."]),
    F("我的爱好是___。", "唱歌", ["电话", "手机", "号码"], "Sở thích của tôi là hát."),
    W("Cuối tuần tôi đi du lịch.", "我|周末|去|旅游", ["电影", "在"], alts=("周末|我|去|旅游",)),
    Y("Tôi thích nghe nhạc.", "我喜欢听音乐", "我喜欢听歌", "我爱听音乐", "我爱听歌"),
    M("电影", "音乐", "唱歌", "旅游", "爱好"),
    SP("m_day"), SP("m_birthday"),
])

# ---------------------------------------------------------------- un: describing
lesson("un-l0", [
    C("hen-adjective"),
    T("大", ["小", "高", "多"]), N("小", ["大", "少", "短"]),
    F("他很___。", "高", ["是", "有", "的"], "Anh ấy cao."),
    NX("Hôm nay lạnh.", "今天很冷。", ["今天是冷。", "今天冷很。", "今天是很冷。"]),
    TX("这个箱子很大。", "Cái thùng này to.", ["Cái thùng này nhỏ.", "Cái thùng kia to.", "Cái thùng này nặng."]),
    W("Cái túi này rất nhỏ.", "这个|包|很|小", ["是", "大"]),
    Y("Anh ấy rất cao.", "他很高", "他非常高"),
    M("大", "小", "高", "新", "老"),
    SP("n_person"),
])
lesson("un-l1", [
    T("颜色", ["名字", "衣服", "东西"]), N("红", ["白", "黑", "蓝"]), T("绿", ["蓝", "黄", "黑"]),
    F("我的车是白___。", "的", ["了", "吗", "很"], "Xe của tôi màu trắng."),
    TX("你喜欢什么颜色？", "Bạn thích màu gì?", ["Bạn mặc áo màu gì?", "Cái này màu gì?", "Bạn thích cái áo nào?"]),
    W("Tôi thích màu đỏ.", "我|喜欢|红色", ["白色", "是"]),
    Y("Cái áo này màu trắng.", "这件衣服是白的", "这件衣服是白色的", "这件衣服白色的"),
    M("红", "白", "黑", "蓝", "绿"),
    SP("n_rep_zhong"), SP("n_box"), SP("n_car"),
])
lesson("un-l2", [
    C("comparison-bi"),
    F("这个比那个___。", "大", ["很大", "是大", "太大"], "Cái này to hơn cái kia."),
    NX("Tàu điện ngầm nhanh hơn xe buýt.", "地铁比公交车快。", ["地铁比公交车很快。", "公交车比地铁快。", "地铁快比公交车。"]),
    TX("我和他一样高。", "Tôi cao bằng anh ấy.", ["Tôi cao hơn anh ấy.", "Anh ấy cao hơn tôi.", "Tôi và anh ấy đều thấp."]),
    W("Hôm nay lạnh hơn hôm qua.", "今天|比|昨天|冷", ["很", "热"]),
    Y("Cái này rẻ hơn cái kia.", "这个比那个便宜"),
    M("比", "一样", "最", "快", "慢"),
    SP("n_rep_bai"), SP("n_cat"),
])
lesson("un-l3", [
    T("漂亮", ["可爱", "年轻", "热情"]), N("年轻", ["老", "漂亮", "高"]),
    TX("她很漂亮。", "Cô ấy xinh.", ["Cô ấy cao.", "Cô ấy trẻ.", "Cô ấy đáng yêu."]),
    F("这个孩子很___。", "可爱", ["老", "贵", "重"], "Đứa bé này rất đáng yêu."),
    NX("Tốt quá!", "太好了！", ["太好吗！", "好太了！", "太好的！"]),
    W("Anh ấy rất nhiệt tình.", "他|很|热情", ["是", "热"]),
    Y("Cô ấy rất trẻ.", "她很年轻", "她非常年轻"),
    SP("n_room"), SP("n_person", ("adjectives.hen_tai",)),
])
finish("s4")
