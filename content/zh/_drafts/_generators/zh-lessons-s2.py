"""zh-vi Section 2 lessons (building blocks): 是, 不/没, 吗 and question words (unit a), measure words and 这/那 + measure
word (b), 有, 在, location words and 的 (c), time, 了, 过 and 在/正在 (d), characters, Hán-Việt, tones and the scripts (e).
Every lesson shows a concept card. Mandarin has no conjugation and no article: measure-word and aspect fill-ins take
the slots of the blueprint's conjugationCloze and articleSelect (zh-plan.md §2). Typing (typeAnswer, through a pinyin
keyboard) starts here; pinyin typed for a hanzi key stays practice (P4b guard). Writes lessons/parts/s2.jsonl.
usage: python -I zh-lessons-s2.py <repo root>"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zh_lesson_lib import C, F, H, M, MP, N, NX, T, TX, W, Y, finish, lesson

# ---------------------------------------------------------------- ua: 是, 不/没, 吗, question words
lesson("ua-l0", [
    C("bu-mei"),
    T("也", ["不", "都", "很"]),
    F("我明天___去。", "不", ["没", "也", "都"], "Mai tôi không đi."),
    F("我昨天___去工厂。", "没", ["不", "是", "很"], "Hôm qua tôi đã không đi nhà máy."),
    F("我___有钱。", "没", ["不", "是", "也不"], "Tôi không có tiền."),
    TX("我不是老师。", "Tôi không phải là giáo viên.", ["Tôi là giáo viên.", "Tôi không có giáo viên.", "Thầy giáo không phải là tôi."]),
    NX("Tôi chưa ăn cơm.", "我还没吃饭。", ["我还不吃饭。", "我还没吃饭了。", "我不吃饭了。"]),
    W("Tôi không phải là học sinh.", "我|不|是|学生", ["没", "有"]),
    Y("Tôi không có em gái.", "我没有妹妹"),
    Y("Hôm qua tôi không đi.", "我昨天没去"),
])
lesson("ua-l1", [
    C("questions-ma"),
    F("你是越南人___？", "吗", ["呢", "的", "了"], "Bạn là người Việt Nam à?"),
    F("我很好，你___？", "呢", ["吗", "的", "是"], "Tôi khoẻ, còn bạn?"),
    F("你忙不___？", "忙", ["是", "好", "很"], "Bạn có bận không?"),
    TX("你是不是中国人？", "Bạn có phải người Trung Quốc không?", ["Bạn không phải người Trung Quốc.", "Bạn là người nước nào?", "Bạn có bạn người Trung Quốc không?"]),
    NX("Bạn có bận không?", "你忙吗？", ["你忙吗不？", "你是忙吗？", "你忙不忙吗？"]),
    NX("Mình đi thôi.", "我们走吧。", ["我们走吗。", "我们走呢。", "我们吧走。"]),
    W("Bạn là học sinh à?", "你|是|学生|吗", ["呢", "不"]),
    Y("Bạn có anh trai không?", "你有哥哥吗", "你有没有哥哥"),
    M("吗", "呢", "吧", "也", "都"),
])
lesson("ua-l2", [
    C("question-words"),
    T("什么", ["谁", "哪", "几"]), N("谁", ["什么", "哪", "几"]),
    F("这是___？", "什么", ["谁", "哪", "吗"], "Đây là cái gì?"),
    F("他是___？", "谁", ["什么", "哪", "几"], "Anh ấy là ai?"),
    F("你是___国人？", "哪", ["什么", "谁", "几"], "Bạn là người nước nào?"),
    NX("Bạn đi đâu?", "你去哪儿？", ["你去哪儿吗？", "你去什么？", "哪儿你去？"]),
    TX("这是谁的手机？", "Đây là điện thoại của ai?", ["Đây là điện thoại của tôi.", "Ai là người gọi điện?", "Ai có điện thoại?"]),
    W("Đây là cái gì?", "这|是|什么", ["谁", "吗"]),
    Y("Anh ấy là ai?", "他是谁"),
    M("什么", "谁", "哪", "哪儿", "几"),
])
lesson("ua-l3", [
    C("shi-sentences"),
    T("都", ["也", "还", "太"]), N("也", ["都", "很", "最"]),
    F("我___是越南人。", "也", ["都", "不也", "很"], "Tôi cũng là người Việt Nam."),
    F("我们___是工人。", "都", ["也", "很", "太"], "Chúng tôi đều là công nhân."),
    TX("他们都是中国人。", "Họ đều là người Trung Quốc.", ["Họ cũng là người Trung Quốc.", "Họ không phải người Trung Quốc.", "Chúng tôi đều là người Trung Quốc."]),
    NX("Chúng ta cùng đi nhé.", "我们一起去吧。", ["我们一起去吗。", "我们去一起吧。", "一起我们去吧。"]),
    W("Mọi người đều là bạn.", "大家|都|是|朋友", ["也", "不"]),
    Y("Tôi cũng là công nhân.", "我也是工人"),
    M("也", "都", "大家", "我们", "一起"),
])

# ---------------------------------------------------------------- ub: measure words
lesson("ub-l0", [
    C("measure-words"),
    T("本", ["杯", "张", "件"]), N("杯", ["本", "张", "只"]),
    F("三___书", "本", ["个", "张", "杯"], "ba quyển sách"),
    F("一___咖啡", "杯", ["本", "件", "只"], "một cốc cà phê"),
    F("一___猫", "只", ["本", "张", "杯"], "một con mèo"),
    F("两___票", "张", ["本", "只", "件"], "hai tấm vé"),
    NX("một cái áo", "一件衣服", ["一张衣服", "一本衣服", "衣服一件"]),
    W("Tôi có ba quyển sách.", "我|有|三|本|书", ["个", "张"]),
    Y("một cốc trà", "一杯茶"),
    M("个", "本", "杯", "只", "件"),
])
lesson("ub-l1", [
    C("zhe-na-measure"),
    T("这个", ["那个", "哪", "这儿"]), N("那个", ["这个", "哪儿", "那儿"]),
    F("___本书是我的。", "这", ["哪", "什么", "谁"], "Quyển sách này là của tôi."),
    F("我要那___衣服。", "件", ["本", "杯", "张"], "Tôi lấy cái áo kia."),
    NX("quyển sách này", "这本书", ["书这本", "这书本", "这个本书"]),
    TX("那件衣服很贵。", "Cái áo kia đắt.", ["Cái áo này đắt.", "Cái áo kia rẻ.", "Quần áo ở kia đắt."]),
    W("Tôi lấy cái này.", "我|要|这个", ["那个", "吗"]),
    Y("Quyển sách này là của tôi.", "这本书是我的"),
    M("这个", "那个", "这", "那", "哪"),
])
lesson("ub-l2", [
    C("liang-er"),
    T("双", ["条", "次", "斤"]), N("条", ["双", "张", "件"]),
    F("一___鞋", "双", ["个", "条", "张"], "một đôi giày"),
    F("一___鱼", "条", ["本", "双", "杯"], "một con cá"),
    F("两___苹果", "斤", ["本", "张", "双"], "hai cân táo"),
    NX("hai cái bánh bao", "两个包子", ["二个包子", "两包子个", "二包子"]),
    W("Cho tôi hai cân táo.", "我|要|两|斤|苹果", ["本", "张"]),
    Y("hai đôi giày", "两双鞋"),
    M("双", "条", "斤", "次", "张"),
])
lesson("ub-l3", [
    C("measure-words"),
    T("位", ["个", "种", "次"]), N("种", ["位", "次", "条"]),
    F("这___先生是我们经理。", "位", ["本", "只", "张"], "Vị này là giám đốc của chúng tôi."),
    F("你要几___包子？", "个", ["本", "次", "双"], "Bạn lấy mấy cái bánh bao?"),
    TX("我们公司有三百个工人。", "Công ty chúng tôi có ba trăm công nhân.", ["Công ty chúng tôi có ba mươi công nhân.", "Nhà máy có ba trăm người.", "Công ty chúng tôi có ba nghìn công nhân."]),
    NX("hai vị khách", "两位客人", ["二位客人", "两客人位", "两本客人"]),
    W("Bạn lấy mấy cái?", "你|要|几|个", ["什么", "本"]),
    Y("Tôi lấy một cái.", "我要一个"),
    M("位", "种", "个", "双", "条"),
])

# ---------------------------------------------------------------- uc: 有, 在, location words, 的
lesson("uc-l0", [
    C("you-zai"),
    T("在", ["有", "是", "去"]),
    F("银行___超市旁边。", "在", ["有", "是", "的"], "Ngân hàng ở cạnh siêu thị."),
    F("宿舍里___洗手间。", "有", ["在", "的", "不"], "Trong ký túc xá có nhà vệ sinh."),
    F("经理不___。", "在", ["有", "是", "的"], "Giám đốc không có ở đây."),
    NX("Tôi ở nhà máy.", "我在工厂。", ["我有工厂。", "我是工厂。", "工厂在我。"]),
    TX("这儿没有电梯。", "Ở đây không có thang máy.", ["Thang máy ở đây.", "Ở đây có thang máy.", "Ở kia không có thang máy."]),
    W("Bạn ở đâu?", "你|在|哪儿", ["有", "吗"]),
    Y("Tôi ở ký túc xá.", "我在宿舍"),
    M("在", "这儿", "那儿", "哪儿", "有"),
])
lesson("uc-l1", [
    C("location-words"),
    T("上", ["下", "里", "旁边"]), N("旁边", ["上", "里", "对面"]),
    F("手机在桌子___。", "上", ["里", "下", "旁边"], "Điện thoại ở trên bàn."),
    F("钥匙在包___。", "里", ["上", "的", "在"], "Chìa khoá ở trong túi."),
    NX("Siêu thị ở cạnh ngân hàng.", "超市在银行旁边。", ["超市在旁边银行。", "超市旁边在银行。", "超市有银行旁边。"]),
    TX("杯子在桌子下。", "Cái cốc ở dưới bàn.", ["Cái cốc ở trên bàn.", "Cái bàn ở dưới cốc.", "Cái cốc ở cạnh bàn."]),
    W("Điện thoại ở trong túi.", "手机|在|包|里", ["上", "有"]),
    Y("Chìa khoá ở trên bàn.", "钥匙在桌子上"),
    M("上", "下", "里", "旁边", "对面"),
])
lesson("uc-l2", [
    C("de-modifier"),
    T("的", ["在", "了", "吗"]),
    F("这是我___手机。", "的", ["在", "了", "吗"], "Đây là điện thoại của tôi."),
    F("这是公司___车。", "的", ["吗", "了", "在"], "Đây là xe của công ty."),
    NX("điện thoại của tôi", "我的手机", ["手机的我", "我手机的", "的我手机"]),
    NX("đồng nghiệp ở công ty", "公司的同事", ["同事的公司", "同事公司的", "公司同事的"]),
    TX("这是我妈妈。", "Đây là mẹ tôi.", ["Đây là mẹ bạn.", "Tôi là mẹ.", "Mẹ tôi ở đây."]),
    W("quần áo đẹp", "漂亮|的|衣服", ["在", "了"]),
    Y("Đây là sách của tôi.", "这是我的书"),
    MP(("我的手机", "điện thoại của tôi"), ("你的书", "sách của bạn"), ("他的钱包", "ví của anh ấy"), ("公司的车", "xe của công ty")),
])
lesson("uc-l3", [
    C("you-zai"),
    T("这儿", ["那儿", "哪儿", "旁边"]), N("对面", ["旁边", "里", "上"]),
    F("洗手间在___？", "哪儿", ["那儿", "这儿", "什么"], "Nhà vệ sinh ở đâu?"),
    F("超市在银行___。", "对面", ["上", "里", "的"], "Siêu thị ở đối diện ngân hàng."),
    TX("我在门口等你。", "Tôi đợi bạn ở cửa.", ["Bạn đợi tôi ở cửa.", "Tôi đợi bạn ở nhà.", "Tôi ở cửa."]),
    NX("Tôi ăn cơm ở căng tin.", "我在食堂吃饭。", ["我吃饭在食堂。", "我在吃饭食堂。", "食堂在我吃饭。"]),
    W("Ngân hàng ở đối diện công ty.", "银行|在|公司|对面", ["旁边", "有"]),
    Y("Nhà vệ sinh ở đâu?", "洗手间在哪儿"),
    M("这儿", "那儿", "哪儿", "对面", "门口"),
])

# ---------------------------------------------------------------- ud: time, 了, 过, 在/正在
lesson("ud-l0", [
    C("time-place-order"),
    T("今天", ["明天", "昨天", "现在"]), N("明天", ["今天", "昨天", "后天"]),
    F("现在几___？", "点", ["个", "块", "次"], "Bây giờ mấy giờ?"),
    F("我八点___班。", "上", ["下", "在", "了"], "Tôi đi làm lúc tám giờ."),
    NX("Mai tôi đi làm lúc tám giờ.", "我明天八点上班。", ["我上班明天八点。", "我明天上班八点。", "八点我明天上班。"]),
    TX("现在八点半。", "Bây giờ là tám giờ rưỡi.", ["Bây giờ là tám giờ.", "Bây giờ là tám giờ kém mười lăm.", "Bây giờ là chín giờ rưỡi."]),
    W("Hôm nay tôi nghỉ.", "我|今天|休息", ["明天", "了"], alts=("今天|我|休息",)),
    Y("Bây giờ là mấy giờ?", "现在几点", "现在几点了"),
    M("今天", "明天", "昨天", "现在", "点"),
])
lesson("ud-l1", [
    C("time-place-order"),
    T("星期一", ["星期二", "星期三", "星期天"]), N("星期天", ["星期六", "星期一", "星期五"]),
    F("今天星期___？", "几", ["什么", "多少", "哪"], "Hôm nay thứ mấy?"),
    F("今天___号？", "几", ["什么", "哪", "谁"], "Hôm nay ngày mấy?"),
    TX("我星期六休息。", "Tôi nghỉ thứ Bảy.", ["Tôi nghỉ Chủ nhật.", "Tôi làm thứ Bảy.", "Tôi nghỉ thứ Sáu."]),
    NX("Thứ Hai tôi đi làm.", "我星期一上班。", ["我星期二上班。", "我上班星期一。", "星期一我下班。"]),
    W("Hôm nay là thứ Năm.", "今天|是|星期四", ["号", "几"], alts=("今天|星期四",)),
    Y("Sinh nhật tôi là ngày năm tháng năm.", "我的生日是五月五号", "我生日是五月五号", "我的生日五月五号"),
    M("星期一", "星期二", "星期三", "星期四", "星期五"),
])
lesson("ud-l2", [
    C("aspect-le"),
    T("了", ["过", "着", "的"]),
    F("我吃饭___。", "了", ["的", "着", "在"], "Tôi ăn cơm rồi."),
    F("下雨___。", "了", ["的", "着", "是"], "Mưa rồi."),
    F("我买___两本书。", "了", ["的", "着", "在"], "Tôi đã mua hai quyển sách."),
    NX("Tôi chưa ăn.", "我还没吃。", ["我还没吃了。", "我不吃了。", "我吃了。"]),
    TX("他来了。", "Anh ấy đến rồi.", ["Anh ấy sắp đến.", "Anh ấy chưa đến.", "Anh ấy không đến."]),
    W("Tôi đã mua một quyển sách.", "我|买|了|一本|书", ["的", "在"]),
    Y("Tôi ăn cơm rồi.", "我吃饭了", "我吃了", "我已经吃饭了", "我已经吃了"),
    MP(("吃了", "đã ăn"), ("下雨了", "mưa rồi"), ("没吃", "chưa ăn"), ("来了", "đến rồi")),
])
lesson("ud-l3", [
    C("aspect-guo"), C("aspect-zai-zhe"),
    F("我去___北京。", "过", ["着", "的", "在"], "Tôi từng đến Bắc Kinh."),
    F("我___开会。", "在", ["了", "过", "的"], "Tôi đang họp."),
    F("你吃___饺子吗？", "过", ["着", "的", "在"], "Bạn đã từng ăn sủi cảo chưa?"),
    NX("Tôi chưa từng đến Thượng Hải.", "我没去过上海。", ["我不去过上海。", "我没去上海过。", "我去过没上海。"]),
    TX("他正在吃饭。", "Anh ấy đang ăn cơm.", ["Anh ấy đã ăn cơm rồi.", "Anh ấy từng ăn cơm ở đây.", "Anh ấy muốn ăn cơm."]),
    TX("门开着。", "Cửa đang mở.", ["Cửa đóng rồi.", "Hãy mở cửa.", "Cửa hỏng rồi."]),
    W("Tôi đang làm việc.", "我|在|工作", ["过", "了"]),
    Y("Tôi từng đến Trung Quốc.", "我去过中国", "我来过中国"),
    M("了", "过", "正在", "已经", "刚才"),
])

# ---------------------------------------------------------------- ue: characters, Hán-Việt, tones, scripts
lesson("ue-l0", [
    C("hanzi-radicals"),
    T("汉字", ["汉语", "中文", "字"]), N("汉语", ["汉字", "字", "越南语"]),
    F("我学习___。", "汉语", ["老师", "银行", "意思"], "Tôi học tiếng Trung."),
    F("这个字是什么___？", "意思", ["名字", "汉字", "老师"], "Chữ này nghĩa là gì?"),
    TX("你会写汉字吗？", "Bạn biết viết chữ Hán không?", ["Bạn biết đọc chữ Hán không?", "Bạn biết nói tiếng Trung không?", "Bạn học chữ Hán ở đâu?"]),
    NX("Tôi học tiếng Trung ở công ty.", "我在公司学习汉语。", ["我学习汉语在公司。", "我在汉语学习公司。", "公司在我学习汉语。"]),
    W("Tôi biết nói tiếng Trung.", "我|会|说|汉语", ["写", "字"]),
    Y("Tôi học tiếng Trung.", "我学习汉语", "我学汉语", "我学习中文", "我学中文"),
    M("汉字", "汉语", "字", "写", "学习"),
])
lesson("ue-l1", [
    C("hanviet-false-friends"),
    NX("Từ nào có âm Hán-Việt là \"ngân hàng\"?", "银行", ["老师", "意思", "学习"]),
    NX("Từ nào nghĩa là \"cẩn thận\" (không phải \"tiểu tâm\")?", "小心", ["安全", "方便", "意思"]),
    T("方便", ["安全", "小心", "容易"]), T("意思", ["名字", "汉字", "问题"]), N("老师", ["学生", "同学", "工人"]),
    TX("这儿很方便。", "Ở đây rất thuận tiện.", ["Ở đây có phương tiện.", "Ở đây rất an toàn.", "Ở đây không tiện."]),
    F("请___安全。", "注意", ["小心", "学习", "意思"], "Xin chú ý an toàn."),
    Y("Gõ từ \"ngân hàng\" bằng chữ Hán.", "银行"),
    M("银行", "学习", "安全", "老师", "学生"),
])
lesson("ue-l2", [
    C("pinyin-tones"), C("initials-traps"),
    H("买", ["卖", "来", "没"]), H("四", ["十", "是", "字"]), H("七", ["一", "去", "西"]), H("茶", ["菜", "查", "差"]),
    T("卖", ["买", "来", "要"]), N("十", ["四", "是", "字"]),
    F("我___苹果。", "买", ["卖", "来", "是"], "Tôi mua táo."),
    W("Tôi bán hoa quả.", "我|卖|水果", ["买", "吃"]),
    Y("Gõ số \"bốn mươi\" bằng chữ Hán.", "四十"),
    M("买", "卖", "四", "十", "是"),
])
lesson("ue-l3", [
    C("simplified-traditional"),
    T("东西", ["地方", "意思", "名字"]), N("地方", ["东西", "房子", "城市"]),
    TX("出口在那儿。", "Lối ra ở đằng kia.", ["Lối vào ở đằng kia.", "Hàng xuất khẩu ở đằng kia.", "Lối ra ở đây."]),
    NX("Từ nào trên biển báo nghĩa là \"lối vào\"?", "入口", ["出口", "门口", "路口"]),
    F("这是什么___？", "东西", ["地方", "意思", "名字"], "Đây là đồ gì?"),
    TX("我认识他。", "Tôi quen anh ấy.", ["Tôi nhận thức anh ấy.", "Tôi biết tên anh ấy.", "Tôi gặp anh ấy."]),
    W("Tôi không quen cô ấy.", "我|不|认识|她", ["没", "他"]),
    Y("Cái này nghĩa là gì?", "这个是什么意思", "这是什么意思", "这个什么意思"),
    M("东西", "地方", "意思", "认识", "方便"),
])
finish("s2")
