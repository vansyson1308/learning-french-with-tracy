"""zh-vi Section 5 lessons: writing — typing about yourself with a pinyin keyboard (unit o), simple sentences and
linking words (p), WeChat messages to a manager (q), the bank form (r). The typed items here are hanzi keys; pinyin
typed for them is accepted as practice only (P4b guard). Session 3 adds the guidedWriting and simpleForm items pointing
at the tasks of zh-writing-s5.py (zh_lesson_refs.py). Five lessons show a concept card. Writes lessons/parts/s5.jsonl.
usage: python -I zh-lessons-s5.py <repo root>"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zh_lesson_lib import C, F, M, N, NX, T, TX, W, WR, Y, finish, lesson

# ---------------------------------------------------------------- uo: writing about yourself
lesson("uo-l0", [
    T("住", ["工作", "来", "去"]), N("国家", ["城市", "地方", "中国"]),
    NX("Bạn gõ gongzuo trên bàn phím pinyin. Chữ nào nghĩa là \"làm việc\"?", "工作", ["公司", "工厂", "工人"]),
    NX("Gõ shi ra nhiều chữ. Chữ nào nghĩa là \"là\"?", "是", ["十", "事", "试"]),
    Y("Gõ bằng chữ Hán: \"công việc\".", "工作"),
    Y("Gõ bằng chữ Hán: \"Việt Nam\".", "越南"),
    W("Tôi sống ở Hà Nội.", "我|住|在|河内", ["是", "去"]),
    M("住", "工作", "国家", "越南", "中国"),
    WR("o_name"), WR("o_age"),
])
lesson("uo-l1", [
    Y("Tôi tên là Nguyễn Hải.", "我叫阮海", "我是阮海", "我的名字是阮海", "我的名字叫阮海", "我名字叫阮海", "我名字是阮海"),
    Y("Tôi là người Việt Nam.", "我是越南人"),
    Y("Năm nay tôi hai mươi ba tuổi.", "我今年二十三岁"),
    F("我___在河内。", "住", ["是", "有", "叫"], "Tôi sống ở Hà Nội."),
    TX("我在一家中国公司工作。", "Tôi làm việc ở một công ty Trung Quốc.", ["Tôi làm việc ở Trung Quốc.", "Tôi có một công ty Trung Quốc.", "Tôi làm việc ở một nhà máy Việt Nam."]),
    W("Tôi làm việc ở nhà máy.", "我|在|工厂|工作", ["住", "是"]),
    WR("o_home"),
])
lesson("uo-l2", [
    C("time-place-order"),
    NX("Mai tôi làm việc ở công ty.", "我明天在公司工作。", ["我工作明天在公司。", "我明天工作在公司。", "我在公司工作明天。"]),
    Y("Hằng ngày tôi làm việc ở nhà máy.", "我每天在工厂工作", "我每天在工厂上班"),
    Y("Tôi sống ở ký túc xá công ty.", "我住在公司宿舍", "我住在公司的宿舍", "我住公司宿舍"),
    F("我明天___家休息。", "在", ["有", "是", "的"], "Mai tôi nghỉ ở nhà."),
    W("Thứ Bảy tôi đi siêu thị.", "我|星期六|去|超市", ["在", "了"], alts=("星期六|我|去|超市",)),
    TX("我住在胡志明市。", "Tôi sống ở Thành phố Hồ Chí Minh.", ["Tôi làm việc ở Thành phố Hồ Chí Minh.", "Tôi đến từ Hà Nội.", "Tôi sống ở Hà Nội."]),
    WR("o_family"),
])
lesson("uo-l3", [
    Y("Tôi là công nhân.", "我是工人", "我是一名工人"),
    Y("Tôi làm việc ở một công ty Trung Quốc.", "我在一家中国公司工作", "我在中国公司工作", "我在一个中国公司工作"),
    Y("Tôi đến từ Việt Nam.", "我是从越南来的", "我从越南来", "我是越南人", "我来自越南"),
    F("我是___越南来的。", "从", ["在", "往", "离"], "Tôi đến từ Việt Nam."),
    W("Bạn tôi sống ở Thượng Hải.", "我|朋友|住|在|上海", ["是", "去"]),
    TX("我们国家很漂亮。", "Đất nước chúng tôi rất đẹp.", ["Thành phố chúng tôi rất đẹp.", "Đất nước chúng tôi rất lớn.", "Nhà chúng tôi rất đẹp."]),
    WR("o_all"), WR("o_open"),
])

# ---------------------------------------------------------------- up: simple sentences and linking words
lesson("up-l0", [
    C("linking"),
    T("和", ["但是", "然后", "或者"]), N("但是", ["和", "然后", "所以"]),
    F("我___我朋友一起去。", "和", ["但是", "然后", "所以"], "Tôi đi cùng bạn tôi."),
    F("我想去，___没有时间。", "但是", ["和", "然后", "因为"], "Tôi muốn đi, nhưng không có thời gian."),
    Y("tôi và bạn tôi", "我和我朋友", "我和我的朋友"),
    W("Ăn cơm trước, sau đó nghỉ.", "先|吃饭|然后|休息", ["但是", "和"]),
    WR("p_who"),
])
lesson("up-l1", [
    NX("Mai tôi tăng ca ở nhà máy.", "我明天在工厂加班。", ["我加班明天在工厂。", "我在工厂加班明天。", "明天加班我在工厂。"]),
    Y("Tối tôi xem ti vi ở ký túc xá.", "我晚上在宿舍看电视"),
    Y("Sáng mai tôi đi ngân hàng.", "我明天上午去银行", "我明天早上去银行"),
    F("我___超市买东西。", "去", ["是", "有", "的"], "Tôi đi siêu thị mua đồ."),
    W("Tôi tăng ca ở nhà máy.", "我|在|工厂|加班", ["有", "了"]),
    M("和", "但是", "然后", "先", "一起"),
    WR("p_neg"), WR("p_ask"),
])
lesson("up-l2", [
    T("因为", ["所以", "如果", "或者"]), N("所以", ["因为", "但是", "如果"]),
    F("因为下雨，___我没去。", "所以", ["但是", "和", "或者"], "Vì trời mưa nên tôi không đi."),
    F("你喝茶___咖啡？", "还是", ["和", "但是", "所以"], "Bạn uống trà hay cà phê?"),
    Y("Nếu mai trời mưa, tôi không đi.", "如果明天下雨，我就不去", "如果明天下雨，我不去", "明天如果下雨，我就不去", "明天如果下雨，我不去",
      "如果明天下雨的话，我就不去", "如果明天下雨的话，我不去", "要是明天下雨，我就不去", "要是明天下雨，我不去"),
    W("Tôi mệt nên muốn nghỉ.", "我|很|累|所以|想|休息", ["但是", "和"]),
    M("因为", "所以", "如果", "或者", "虽然"),
    WR("p_link"),
])
lesson("up-l3", [
    C("aspect-le"),
    F("星期六我去___超市。", "了", ["着", "的", "在"], "Thứ Bảy tôi đã đi siêu thị."),
    NX("Hôm qua tôi không đi làm.", "我昨天没上班。", ["我昨天没上班了。", "我昨天上班了。", "我上班昨天没。"]),
    Y("Hôm qua tôi đã mua một cái áo.", "我昨天买了一件衣服"),
    Y("Tôi đã ăn cơm rồi.", "我已经吃饭了", "我吃饭了", "我已经吃了", "我吃了", "我吃过饭了", "我吃过了", "我已经吃过饭了", "我已经吃过了"),
    W("Hôm qua tôi đi siêu thị, sau đó về nhà.", "我|昨天|去了|超市|然后|回家", ["但是", "在"]),
    WR("p_open"),
])

# ---------------------------------------------------------------- uq: messages to the manager
lesson("uq-l0", [
    C("polite-work"),
    T("请假", ["生病", "休息", "放假"]), N("生病", ["请假", "发烧", "休息"]),
    TX("我今天生病了，想请假一天。", "Hôm nay tôi ốm, muốn xin nghỉ một ngày.", ["Hôm nay tôi ốm, muốn nghỉ một tuần.", "Mai tôi muốn xin nghỉ một ngày.", "Hôm nay tôi khoẻ rồi."]),
    F("明天我可以___吗？", "请假", ["生病", "短信", "下雨"], "Mai tôi xin nghỉ được không?"),
    Y("Hôm nay tôi ốm.", "我今天生病了", "我今天病了"),
    W("Tôi muốn xin nghỉ một ngày.", "我|想|请假|一天", ["生病", "两"]),
    WR("q_sick"),
])
lesson("uq-l1", [
    NX("Bạn nhắn cho quản lý: Hôm nay tôi sốt, không đi làm được.", "我今天发烧，不能上班。", ["我今天发烧，不会上班。", "我今天发烧，没能上班了。", "我今天上班，不能发烧。"]),
    TX("好的，收到。", "Vâng, đã nhận.", ["Vâng, tôi đến ngay.", "Không, chưa nhận.", "Cảm ơn, tạm biệt."]),
    F("我会晚到二十___。", "分钟", ["点", "岁", "次"], "Tôi đến muộn hai mươi phút."),
    Y("Tôi sẽ đến muộn ba mươi phút.", "我会晚到三十分钟", "我晚到三十分钟", "我要晚到三十分钟", "我会迟到三十分钟", "我要迟到三十分钟", "我会晚三十分钟到", "我会晚到半个小时", "我要晚到半个小时"),
    W("Vâng, đã nhận.", "好的|收到", ["没有", "你好"]),
    M("请假", "生病", "短信", "发烧", "收到"),
    WR("q_reply"),
])
lesson("uq-l2", [
    Y("Mai tôi đến lúc chín giờ.", "我明天九点到", "我明天九点来"),
    TX("今天下午三点开会。", "Ba giờ chiều nay họp.", ["Ba giờ sáng nay họp.", "Ba giờ chiều mai họp.", "Họp ba tiếng chiều nay."]),
    F("明天我___上班。", "不能", ["没", "不是", "没有"], "Mai tôi không đi làm được."),
    NX("Thứ Hai tuần sau tôi đi làm lại.", "我下星期一再上班。", ["我下星期一又上班了。", "我上星期一再上班。", "我再下星期一上班。"]),
    W("Tôi xin nghỉ thứ Sáu.", "我|星期五|请假", ["生病", "了"], alts=("星期五|我|请假",)),
    WR("q_late"),
])
lesson("uq-l3", [
    C("polite-work"),
    NX("Lời chào lịch sự nhất khi nhắn cho quản lý Vương:", "王经理，您好！", ["小王，你好！", "王，你好！", "喂，王！"]),
    F("王经理，___好！", "您", ["你们", "他", "我"], "Chào quản lý Vương ạ!"),
    Y("Cảm ơn ạ!", "谢谢您", "谢谢"),
    TX("没问题，好好休息。", "Không vấn đề gì, nghỉ ngơi cho khoẻ.", ["Có vấn đề, mai nói tiếp.", "Không sao, mai đi làm nhé.", "Không vấn đề gì, làm việc chăm chỉ nhé."]),
    W("Mai tôi xin nghỉ được không ạ?", "明天|我|可以|请假|吗", ["会", "呢"], alts=("我|明天|可以|请假|吗",)),
    WR("q_open"),
])

# ---------------------------------------------------------------- ur: the bank form
lesson("ur-l0", [
    T("护照", ["银行卡", "身份证", "签证"]), N("银行卡", ["信用卡", "护照", "身份证"]),
    TX("我想办一张银行卡。", "Tôi muốn làm một thẻ ngân hàng.", ["Tôi muốn làm một hộ chiếu.", "Tôi có một thẻ ngân hàng.", "Tôi mất thẻ ngân hàng."]),
    F("请___这张表。", "填", ["吃", "坐", "签字"], "Mời điền tờ đơn này."),
    F("请在这儿___。", "签字", ["吃", "喝", "唱歌"], "Xin ký vào đây."),
    NX("Xin điền tờ đơn này.", "请填这张表。", ["请填这本表。", "请这张表填。", "请填这个张表。"]),
    Y("thẻ ngân hàng", "银行卡"),
    M("护照", "银行卡", "身份证", "表", "签字"),
    WR("r_form_bank"),
])
lesson("ur-l1", [
    T("姓名", ["名字", "地址", "号码"]), N("地址", ["姓名", "号码", "电话"]),
    Y("Gõ \"họ tên\" bằng chữ Hán.", "姓名"),
    Y("Gõ \"địa chỉ\" bằng chữ Hán.", "地址"),
    TX("请写您的电话号码。", "Xin viết số điện thoại của ông.", ["Xin viết họ tên của ông.", "Xin gọi điện cho ông.", "Xin viết địa chỉ của ông."]),
    M("姓名", "地址", "电话", "护照", "号码"),
])
lesson("ur-l2", [
    F("我要两___银行卡。", "张", ["本", "个", "件"], "Tôi muốn làm hai thẻ ngân hàng."),
    TX("您的护照号码是多少？", "Số hộ chiếu của ông là bao nhiêu?", ["Ông có hộ chiếu không?", "Hộ chiếu của ông ở đâu?", "Số điện thoại của ông là bao nhiêu?"]),
    Y("Tôi muốn làm một thẻ ngân hàng.", "我想办一张银行卡", "我想要一张银行卡", "我要一张银行卡", "我要办一张银行卡", "我想办银行卡", "我要办银行卡"),
    W("Xin nhập mật khẩu.", "请|输入|密码", ["填", "号码"]),
    NX("một tờ đơn", "一张表", ["一本表", "一个表张", "表一张"]),
    WR("r_form_dorm"),
])
lesson("ur-l3", [
    T("密码", ["号码", "地址", "姓名"]),
    TX("请输入密码。", "Xin nhập mật khẩu.", ["Xin đổi mật khẩu.", "Xin nói mật khẩu.", "Xin viết số điện thoại."]),
    TX("请在这儿签字。", "Xin ký vào đây.", ["Xin điền vào đây.", "Xin ngồi ở đây.", "Xin đợi ở đây."]),
    F("我的地址是工厂宿舍三号___。", "楼", ["本", "张", "岁"], "Địa chỉ của tôi là toà số 3, ký túc xá nhà máy."),
    Y("Hộ chiếu của tôi ở trong túi.", "我的护照在包里", "我的护照在我的包里", "我护照在包里", "我的护照在包里面"),
    WR("r_note"), WR("r_open"),
])
finish("s5")
