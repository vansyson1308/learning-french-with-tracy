"""zh-vi graded stories, batch 06: band A2-1, continued (renting a flat, a job interview, the fire drill, a dinner for
the fellow countrymen, a letter home after one year). Same rules as batch 05.
usage: python -I zh-stories-06.py <repo root>"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zh_stories_lib import Q, story, write_batch  # noqa: E402

S = []

S.append(story("renting_a_flat", "A2-1", "我们租房子了", "Vợ chồng Sơn và Hồng không muốn ở ký túc xá nữa và đi thuê một căn nhà.",
    ["商量", "钥匙", "合同"], [
    ("N", "阮山 和 他 妻子 阮红 都 在 工厂 工作。", "Sơn và vợ là Hồng đều làm việc ở nhà máy."),
    ("N", "他们 不 想 住 宿舍 了，想 租 一 个 房子。", "Họ không muốn ở ký túc xá nữa, muốn thuê một căn nhà."),
    ("N", "星期天，他们 去 看 了 一 个 房子。", "Chủ nhật, họ đi xem một căn nhà."),
    ("N", "房子 离 工厂 很 近，走路 十 分钟。", "Căn nhà gần nhà máy, đi bộ mười phút."),
    ("N", "李 小姐 带 他们 进去。", "Chị Lý dẫn họ vào."),
    ("A", "这个 房子 有 两 个 房间，一 个 洗手间。", "Căn nhà này có hai phòng, một nhà vệ sinh."),
    ("A", "这 是 洗衣机，是 新 的。", "Đây là máy giặt, máy mới đấy."),
    ("B", "一 个 月 多少钱？", "Mỗi tháng bao nhiêu tiền ạ?"),
    ("A", "一 个 月 一千五百 块。", "Một tháng một nghìn năm trăm tệ."),
    ("B", "有点儿 贵。能 便宜 一点儿 吗？", "Hơi đắt ạ. Có thể bớt một chút không ạ?"),
    ("A", "如果 你们 租 一 年，一千四百 块。", "Nếu hai em thuê một năm thì một nghìn bốn trăm tệ."),
    ("B", "房间 有点儿 脏。", "Phòng hơi bẩn ạ."),
    ("A", "你们 来 以前，我 一定 让 人 打扫 干净。", "Trước khi hai em đến, chị nhất định sẽ cho người dọn sạch."),
    ("N", "阮山 和 阮红 商量 了 一下。", "Sơn và Hồng bàn bạc với nhau một lúc."),
    ("N", "阮红 说：“离 工厂 近，有 洗衣机，也 很 安静。我 觉得 不错。”", "Hồng nói: \"Gần nhà máy, có máy giặt, lại yên tĩnh. Em thấy được đấy.\""),
    ("B", "好，我们 租 一 年！", "Được, mình thuê một năm!"),
    ("N", "李 小姐 拿 出 了 合同。", "Chị Lý lấy hợp đồng ra."),
    ("A", "请 你们 看 一下 合同，没问题 就 在 这儿 签字。", "Hai em xem hợp đồng một chút, không có vấn đề gì thì ký vào đây."),
    ("N", "阮山 看 得 很 认真，然后 签字 了。", "Sơn đọc rất kỹ, rồi ký tên."),
    ("A", "这 是 你们 的 钥匙。", "Đây là chìa khoá của hai em."),
    ("N", "下 个 星期，他们 搬 到 了 新 家。", "Tuần sau, họ chuyển đến nhà mới."),
    ("N", "阮红 说：“我们 有 自己 的 家 了！”", "Hồng nói: \"Mình có nhà riêng rồi!\""),
    ("B", "是 啊。以后 你 做饭，我 洗 碗。", "Ừ. Từ giờ em nấu cơm, anh rửa bát."),
], [
    Q("Căn nhà cách nhà máy bao xa?", ["Đi bộ mười phút", "Đi xe buýt mười phút", "Đi bộ ba mươi phút"]),
    Q("Nếu thuê một năm thì mỗi tháng tiền nhà là bao nhiêu?", ["1.400 tệ", "1.500 tệ", "1.000 tệ"]),
    Q("Vì sao chị Lý bớt tiền nhà?", ["Vì hai người thuê cả một năm", "Vì căn nhà bẩn", "Vì nhà không có máy giặt"], "infer"),
], cast=("李小姐", "阮山")))

S.append(story("job_interview", "A2-1", "面试", "Hải muốn tìm việc lương cao hơn và đi phỏng vấn ở một nhà máy lớn.",
    ["面试", "流利", "复习"], [
    ("N", "阮海 在 一 个 小 工厂 打工 了 两 年。", "Hải đã làm thuê ở một nhà máy nhỏ được hai năm."),
    ("N", "他 想 找 一 个 新 工作，工资 高 一点儿 的。", "Anh ấy muốn tìm một công việc mới, lương cao hơn một chút."),
    ("N", "他 在 手机 上 看见 一 个 大 工厂 要 人。", "Anh ấy thấy trên điện thoại một nhà máy lớn đang tuyển người."),
    ("N", "星期五，他 去 那个 工厂 面试。", "Thứ Sáu, anh ấy đến nhà máy đó phỏng vấn."),
    ("A", "你好，请坐。你 叫 什么 名字？", "Chào anh, mời ngồi. Anh tên là gì?"),
    ("B", "您好！我 叫 阮海，是 越南人。", "Chào chị! Tôi tên là Nguyễn Hải, người Việt Nam."),
    ("A", "你 在 中国 多少 年 了？", "Anh ở Trung Quốc bao nhiêu năm rồi?"),
    ("B", "三 年 了。", "Ba năm rồi ạ."),
    ("A", "你 以前 做 过 什么 工作？", "Trước đây anh đã làm những việc gì?"),
    ("B", "我 在 工厂 搬 过 货，也 包装 过 产品。", "Tôi từng khuân hàng ở nhà máy, cũng từng đóng gói sản phẩm."),
    ("A", "你 用 过 机器 吗？", "Anh đã từng dùng máy móc chưa?"),
    ("B", "用 过。我 有 两 年 的 经验。", "Dùng rồi ạ. Tôi có hai năm kinh nghiệm."),
    ("A", "你 的 汉语 说 得 很 流利。你 会 写 汉字 吗？", "Anh nói tiếng Trung lưu loát quá. Anh có biết viết chữ Hán không?"),
    ("B", "会 写 一些。我 每天 晚上 都 复习。", "Tôi biết viết một ít. Tối nào tôi cũng ôn bài."),
    ("A", "很 好。我们 这儿 要 上 夜班，你 可以 吗？", "Tốt lắm. Ở đây phải làm ca đêm, anh làm được không?"),
    ("B", "可以。夜班 的 工资 是 多少？", "Được ạ. Lương ca đêm là bao nhiêu ạ?"),
    ("A", "一 个 月 六千 块，夜班 还有 三百 块。", "Một tháng sáu nghìn tệ, ca đêm còn thêm ba trăm tệ."),
    ("B", "一 个 星期 休息 几 天？", "Một tuần được nghỉ mấy ngày ạ?"),
    ("A", "休息 一 天。你 还有 问题 吗？", "Nghỉ một ngày. Anh còn câu hỏi nào không?"),
    ("B", "没有 了。谢谢 您！", "Không còn ạ. Cảm ơn chị!"),
    ("A", "好。我们 下 个 星期 给 你 打电话。", "Được. Tuần sau chúng tôi sẽ gọi điện cho anh."),
    ("N", "星期一，阮海 收到 了 一 个 电话。", "Thứ Hai, Hải nhận được một cuộc điện thoại."),
    ("A", "阮海，你好！你 什么 时候 能 来 上班？", "Chào anh Hải! Khi nào anh có thể đến làm việc?"),
    ("N", "阮海 非常 开心。", "Hải vô cùng vui mừng."),
], [
    Q("Hải đã ở Trung Quốc bao lâu?", ["Ba năm", "Hai năm", "Một năm"]),
    Q("Làm ca đêm, mỗi tháng được thêm bao nhiêu tiền?", ["300 tệ", "600 tệ", "6.000 tệ"]),
    Q("Cuộc điện thoại hôm thứ Hai có nghĩa là gì?", ["Hải đã được nhận vào làm", "Hải không được nhận", "Hải phải phỏng vấn lại"], "infer"),
], cast=("经理", "阮海")))

S.append(story("fire_drill", "A2-1", "安全课", "Quản lý Vương dạy công nhân cách dùng bình chữa cháy, rồi cả nhà máy diễn tập thoát hiểm.",
    ["离开", "所有", "紧急"], [
    ("N", "今天 下午 三 点，工厂 里 所有 的 员工 都 要 参加 安全 课。", "Ba giờ chiều nay, tất cả nhân viên trong nhà máy đều phải dự buổi học an toàn."),
    ("B", "大家 好！今天 我们 学习 怎么 用 灭火器。", "Chào mọi người! Hôm nay chúng ta học cách dùng bình chữa cháy."),
    ("B", "灭火器 在 每 个 车间 的 门口。", "Bình chữa cháy để ở cửa mỗi xưởng."),
    ("B", "如果 着火 了，先 别 急，然后 马上 告诉 组长。", "Nếu có cháy, trước hết đừng hoảng, rồi báo ngay cho tổ trưởng."),
    ("B", "小 火，可以 用 灭火器。", "Lửa nhỏ thì có thể dùng bình chữa cháy."),
    ("N", "王 主管 拿 着 一 个 灭火器。", "Quản lý Vương cầm một bình chữa cháy."),
    ("B", "你们 看，用 灭火器 很 容易。", "Mọi người xem, dùng bình chữa cháy rất dễ."),
    ("B", "但是，大 火 很 危险。大 火 的 时候，大家 一定 要 马上 离开。", "Nhưng đám cháy lớn rất nguy hiểm. Khi cháy lớn, mọi người nhất định phải rời đi ngay."),
    ("A", "王 主管，我们 从 哪儿 出去？", "Anh Vương, chúng em ra bằng lối nào ạ?"),
    ("B", "走 紧急 出口。", "Đi lối thoát hiểm."),
    ("B", "着火 的 时候，禁止 坐 电梯，要 走 楼梯。", "Khi có cháy, cấm đi thang máy, phải đi cầu thang bộ."),
    ("A", "为什么 不 能 坐 电梯？", "Vì sao không được đi thang máy ạ?"),
    ("B", "因为 电梯 可能 会 停，人 在 里边 很 危险。", "Vì thang máy có thể bị dừng, người ở bên trong rất nguy hiểm."),
    ("B", "还有，车间 里 禁止 吸烟！", "Còn nữa, trong xưởng cấm hút thuốc!"),
    ("N", "四 点，工厂 里 的 声音 很 大：“着火 了！着火 了！”", "Bốn giờ, trong nhà máy vang lên tiếng rất to: \"Cháy! Cháy!\""),
    ("N", "这 是 一 次 练习。", "Đây là một buổi diễn tập."),
    ("N", "所有 的 人 都 走 楼梯，从 紧急 出口 出去 了。", "Tất cả mọi người đều đi cầu thang bộ, ra ngoài theo lối thoát hiểm."),
    ("N", "三 分钟 以后，大家 都 在 工厂 外边。", "Ba phút sau, mọi người đều đã ở bên ngoài nhà máy."),
    ("B", "很 好！三 分钟，大家 都 出来 了。", "Tốt lắm! Ba phút, mọi người đều đã ra ngoài."),
    ("A", "王 主管，如果 真的 着火 了，我们 也 能 很 快 出来 吗？", "Anh Vương, nếu cháy thật thì chúng em cũng ra nhanh được như vậy không ạ?"),
    ("B", "能！所以 我们 要 练习。", "Được! Vì thế chúng ta mới phải tập."),
], [
    Q("Bình chữa cháy để ở đâu?", ["Ở cửa mỗi xưởng", "Trong văn phòng", "Cạnh thang máy"]),
    Q("Khi có cháy, vì sao không được đi thang máy?", ["Vì thang máy có thể dừng, người ở trong rất nguy hiểm", "Vì thang máy quá nhỏ", "Vì thang máy chỉ dành cho quản lý"]),
    Q("Vì sao quản lý Vương hài lòng với buổi diễn tập?", ["Vì chỉ trong ba phút mọi người đã ra ngoài hết", "Vì không ai phải tham gia", "Vì mọi người đi thang máy rất nhanh"], "infer"),
], cast=("员工", "王主管")))

S.append(story("dinner_for_countrymen", "A2-1", "我请客", "Nam nhắn vào nhóm WeChat của đồng hương: tối thứ Bảy anh mời cả nhóm đi ăn.",
    ["食堂", "请客", "员工"], [
    ("N", "工厂 里 有 很 多 越南 员工。", "Trong nhà máy có rất nhiều nhân viên người Việt."),
    ("N", "他们 在 微信 上 有 一 个 群，叫 “越南 老乡”。", "Trên WeChat họ có một nhóm, tên là \"Đồng hương Việt Nam\"."),
    ("N", "群 里 有 三十 个 人。", "Trong nhóm có ba mươi người."),
    ("N", "星期五 中午，阮南 在 食堂 吃饭 的 时候，在 群 里 发 了 一 句 话：“这个 星期六 晚上，我 请客！大家 都 来 吧！”", "Trưa thứ Sáu, lúc ăn cơm ở nhà ăn, Nam nhắn vào nhóm một câu: \"Tối thứ Bảy này mình mời! Mọi người đến nhé!\""),
    ("N", "群 里 的 人 都 很 开心。", "Mọi người trong nhóm đều rất vui."),
    ("A", "阮南，你 为什么 请客？", "Nam ơi, sao cậu lại mời?"),
    ("B", "我 现在 是 我们 组 的 组长！", "Bây giờ mình là tổ trưởng của tổ rồi!"),
    ("A", "真的 吗？太 好 了！", "Thật à? Tốt quá!"),
    ("A", "我们 去 哪儿 吃？", "Mình đi ăn ở đâu?"),
    ("B", "去 工厂 对面 的 越南 饭馆。", "Đến quán ăn Việt Nam đối diện nhà máy."),
    ("A", "那儿 的 面条 很 好吃！", "Mì ở đó ngon lắm!"),
    ("N", "星期六 晚上，二十 个 老乡 来 了。", "Tối thứ Bảy, hai mươi người đồng hương đã đến."),
    ("N", "饭馆 里 都 是 越南 老乡。", "Trong quán toàn là đồng hương người Việt."),
    ("N", "大家 吃 越南 菜，喝 酒，说 越南语。", "Mọi người ăn món Việt, uống rượu, nói tiếng Việt."),
    ("A", "阮南，以后 你 是 组长，别 忘 了 我们！","Nam ơi, sau này cậu làm tổ trưởng rồi, đừng quên bọn mình nhé!"),
    ("B", "不 会 忘！你们 都 是 我 的 老乡，也 是 我 的 朋友。", "Không quên đâu! Các bạn đều là đồng hương, cũng là bạn của mình."),
    ("N", "最后，大家 要 一起 付 钱，但是 阮南 说：“不用！今天 我 请客！”", "Cuối cùng, mọi người định cùng góp tiền trả, nhưng Nam nói: \"Không cần! Hôm nay mình mời!\""),
    ("N", "他们 一直 吃 到 晚上 十 点。", "Họ ăn uống mãi đến mười giờ tối."),
], [
    Q("Nhóm WeChat của các đồng hương có bao nhiêu người?", ["Ba mươi người", "Hai mươi người", "Mười người"]),
    Q("Tối thứ Bảy họ đi ăn ở đâu?", ["Ở quán ăn Việt đối diện nhà máy", "Ở nhà ăn của nhà máy", "Ở ký túc xá"]),
    Q("Cuối cùng ai trả tiền bữa tối?", ["Nam", "Mỗi người tự trả", "Cả nhóm cùng góp"], "infer"),
], cast=("老乡", "阮南")))

S.append(story("one_year_later", "A2-1", "一年以后", "Một năm sau ngày sang Trung Quốc, Hoa viết cho mẹ về những gì đã thay đổi.",
    ["水平", "提高", "成绩", "过年"], [
    ("N", "妈妈，你好！", "Mẹ ơi, mẹ khoẻ không!"),
    ("N", "时间 过 得 真 快，我 来 中国 已经 一 年 了。", "Thời gian trôi nhanh thật, con sang Trung Quốc đã được một năm rồi."),
    ("N", "去年 的 今天，我 一 个 人 坐 飞机 来 广州。", "Ngày này năm ngoái, con một mình đi máy bay sang Quảng Châu."),
    ("N", "那 时候，我 不 会 说 汉语，也 不 认识 汉字。", "Hồi đó con không biết nói tiếng Trung, cũng không biết chữ Hán."),
    ("N", "我 很 怕，也 很 想 家。", "Con rất sợ, cũng rất nhớ nhà."),
    ("N", "现在，我 能 用 汉语 和 同事 们 说话 了。", "Bây giờ con đã có thể nói chuyện với đồng nghiệp bằng tiếng Trung."),
    ("N", "我 的 汉语 水平 提高 了 很 多。", "Trình độ tiếng Trung của con đã tiến bộ nhiều."),
    ("N", "上 个 月，我 参加 了 工厂 的 汉语 考试，成绩 不错。", "Tháng trước con dự kỳ thi tiếng Trung của nhà máy, kết quả khá tốt."),
    ("N", "王 主管 说，明年 我 可以 去 办公室 工作。", "Quản lý Vương nói sang năm con có thể lên văn phòng làm việc."),
    ("N", "这 一 年，我 有 了 很 多 经验，也 有 了 很 多 朋友。", "Năm nay con có thêm nhiều kinh nghiệm, cũng có thêm nhiều bạn bè."),
    ("N", "小李 常常 带 我 去 吃 好吃 的 东西。", "Tiểu Lý hay dẫn con đi ăn đồ ngon."),
    ("N", "老王 教 我 说 广州 话。", "Chú Vương dạy con nói tiếng Quảng Châu."),
    ("N", "但是，我 还是 常常 想 你们。", "Nhưng con vẫn thường nhớ cả nhà."),
    ("N", "我 想 你 做 的 菜，也 想 我们 一起 吃 晚饭 的 时候。", "Con nhớ món mẹ nấu, nhớ cả những lúc cả nhà cùng ăn tối."),
    ("N", "今年 春节，我 一定 回 老家 过年。", "Tết năm nay con nhất định về quê ăn Tết."),
    ("N", "我 已经 买 了 机票，是 一月 二十 号 的。", "Con đã mua vé máy bay rồi, ngày hai mươi tháng Một."),
    ("N", "我 给 爸爸 买 了 一 件 衣服，给 弟弟 买 了 一 双 鞋。", "Con mua cho bố một chiếc áo, mua cho em trai một đôi giày."),
    ("N", "你 呢？你 想 要 什么？", "Còn mẹ? Mẹ muốn gì ạ?"),
    ("N", "妈妈，你 和 爸爸 要 注意 身体。", "Mẹ ơi, bố mẹ nhớ giữ gìn sức khoẻ nhé."),
    ("N", "我们 春节 见！", "Tết mình gặp nhau nhé!"),
    ("N", "你们 的 女儿：阮花", "Con gái của bố mẹ: Hoa"),
], [
    Q("Hoa đã ở Trung Quốc bao lâu?", ["Một năm", "Ba tháng", "Hai năm"]),
    Q("Hoa mua quà gì cho em trai?", ["Một đôi giày", "Một chiếc áo", "Một vé máy bay"]),
    Q("So với một năm trước, Hoa đã thay đổi thế nào?", ["Cô tự tin hơn, nói được tiếng Trung và có nhiều bạn", "Cô vẫn sợ và không có bạn bè", "Cô đã quên tiếng Việt"], "infer"),
]))

write_batch("06-a2-1", S)
