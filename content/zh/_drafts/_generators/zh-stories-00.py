"""zh-vi graded stories, batch 00: the micro-stories of band A1-0 (QC 2026-10-30 §2.2). They use only the words of units
1-3 (greetings, 是 / 叫 / 姓, the family, 有) and the closed-class lexemes, plus the grammar words of the seed and 3 new
lexemes each, so they have almost no verb: who is who, where home is, whose room this is. No 了 / 过 / 着 yet.
usage: python -I zh-stories-00.py <repo root>"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zh_stories_lib import Q, story, write_batch  # noqa: E402

S = []

S.append(story("micro_new_colleague", "A1-0", "你好，我叫阮南", "Nam gặp một chị công nhân người Trung Quốc ở nhà máy.",
    ["工厂", "广州", "河内"], [
    ("N", "他 是 阮南。", "Đây là Nguyễn Nam."),
    ("N", "阮南 是 越南人，也 是 工人。", "Nam là người Việt Nam, cũng là công nhân."),
    ("N", "她 是 小李，是 中国人。", "Cô ấy là Tiểu Lý, người Trung Quốc."),
    ("N", "他们 在 工厂。", "Hai người đang ở nhà máy."),
    ("B", "你好！请问，你 叫 什么 名字？", "Xin chào! Cho hỏi, bạn tên là gì?"),
    ("A", "你好！我 姓 李，你 叫 我 小李 吧。", "Chào bạn! Tôi họ Lý, bạn cứ gọi tôi là Tiểu Lý nhé."),
    ("B", "我 叫 阮南，我 是 越南人。", "Tôi tên là Nam, tôi là người Việt Nam."),
    ("A", "你 是 学生 吗？", "Bạn là sinh viên à?"),
    ("B", "不 是。我 是 工人。", "Không phải. Tôi là công nhân."),
    ("A", "我 也 是 工人！", "Tôi cũng là công nhân!"),
    ("B", "你 家 在 哪儿？", "Nhà bạn ở đâu?"),
    ("A", "我 家 在 广州。你 家 呢？", "Nhà tôi ở Quảng Châu. Còn nhà bạn?"),
    ("B", "我 家 在 河内。我 爸爸、妈妈 和 妹妹 都 在 那儿。", "Nhà tôi ở Hà Nội. Bố mẹ và em gái tôi đều ở đó."),
    ("B", "谢谢 你，小李！", "Cảm ơn bạn, Tiểu Lý!"),
    ("A", "不客气！", "Không có gì!"),
], [
    Q("Tiểu Lý là người nước nào?", ["Người Trung Quốc", "Người Việt Nam", "Câu chuyện không nói"]),
    Q("Bố mẹ của Nam đang ở đâu?", ["Ở Hà Nội", "Ở Quảng Châu", "Ở nhà máy"]),
    Q("Nam và Tiểu Lý giống nhau ở điểm nào?", ["Cả hai đều là công nhân", "Cả hai đều là sinh viên", "Cả hai đều là người Việt Nam"], "infer"),
]))

S.append(story("micro_family_photo", "A1-0", "我家的照片", "Hoa cho Tiểu Vương xem ảnh gia đình mình.",
    ["中国", "照片", "上海"], [
    ("N", "我 叫 阮花。我 是 越南人。", "Tôi tên là Hoa. Tôi là người Việt Nam."),
    ("N", "我 在 中国，我 是 工人。", "Tôi đang ở Trung Quốc, tôi là công nhân."),
    ("N", "这 是 我 家 的 照片。", "Đây là ảnh gia đình tôi."),
    ("N", "这 是 我 爸爸，那 是 我 妈妈。", "Đây là bố tôi, kia là mẹ tôi."),
    ("N", "这 是 我 爷爷 和 奶奶。", "Đây là ông nội và bà nội tôi."),
    ("N", "这 是 我 弟弟，他 是 学生。", "Đây là em trai tôi, nó là học sinh."),
    ("B", "阮花，这 是 你 姐姐 吗？", "Hoa ơi, đây là chị gái bạn à?"),
    ("A", "不 是，她 是 我 妹妹。", "Không phải, đó là em gái tôi."),
    ("B", "你 妹妹 也 在 中国 吗？", "Em gái bạn cũng ở Trung Quốc à?"),
    ("A", "不，她 在 家。她 也 是 学生。", "Không, nó ở nhà. Nó cũng là học sinh."),
    ("B", "你 爸爸 妈妈 呢？", "Còn bố mẹ bạn?"),
    ("A", "他们 都 在 家。", "Bố mẹ tôi đều ở nhà."),
    ("A", "小王，你 有 哥哥 吗？", "Tiểu Vương, bạn có anh trai không?"),
    ("B", "有。我 哥哥 也 是 工人，他 在 上海。", "Có. Anh tôi cũng là công nhân, anh ấy ở Thượng Hải."),
], [
    Q("Cậu bé trong ảnh là ai?", ["Em trai của Hoa", "Anh trai của Hoa", "Bố của Hoa"]),
    Q("Anh trai của Tiểu Vương làm nghề gì?", ["Công nhân", "Học sinh", "Câu chuyện không nói"]),
    Q("Trong gia đình Hoa, ai đang ở Trung Quốc?", ["Chỉ có Hoa", "Hoa và em gái", "Hoa và bố mẹ"], "infer"),
]))

S.append(story("micro_who_is_that", "A1-0", "那是谁？", "Ngày đầu ở nhà máy, Nam hỏi Tiểu Lý về những người xung quanh.",
    ["工厂", "经理", "真的"], [
    ("N", "阮南 和 小李 在 工厂。", "Nam và Tiểu Lý đang ở nhà máy."),
    ("B", "小李，请问，那 是 谁？", "Tiểu Lý, cho hỏi, kia là ai vậy?"),
    ("A", "那 是 王 经理。", "Đó là giám đốc Vương."),
    ("B", "他 是 中国人 吗？", "Ông ấy là người Trung Quốc à?"),
    ("A", "是，他 是 中国人。他 姓 王。", "Đúng, ông ấy là người Trung Quốc. Ông ấy họ Vương."),
    ("B", "那 她 是 谁？", "Thế cô kia là ai?"),
    ("A", "她 是 他 的 女儿。", "Cô ấy là con gái của ông ấy."),
    ("B", "她 也 是 工人 吗？", "Cô ấy cũng là công nhân à?"),
    ("A", "不 是。她 是 学生，她 叫 小王。", "Không phải. Cô ấy là sinh viên, tên là Tiểu Vương."),
    ("B", "那些 工人 呢？", "Còn những công nhân kia?"),
    ("A", "他们 都 是 越南人。", "Họ đều là người Việt Nam."),
    ("B", "真的 吗？", "Thật à?"),
    ("A", "是 啊。", "Thật mà."),
    ("B", "他们 叫 什么 名字？", "Họ tên là gì?"),
    ("A", "他 叫 阮海，她 叫 阮红。", "Anh kia tên là Hải, chị kia tên là Hồng."),
    ("B", "谢谢 你，小李！", "Cảm ơn bạn, Tiểu Lý!"),
    ("A", "不客气！", "Không có gì!"),
], [
    Q("Giám đốc Vương là người nước nào?", ["Người Trung Quốc", "Người Việt Nam", "Câu chuyện không nói"]),
    Q("Tiểu Vương là ai?", ["Con gái của giám đốc Vương", "Em gái của Tiểu Lý", "Một công nhân người Việt"]),
    Q("Vì sao Nam hỏi lại xem có thật không?", ["Vì Nam không ngờ có nhiều công nhân người Việt ở đó", "Vì Nam không nghe rõ", "Vì Nam không thích nhà máy"], "infer"),
]))

S.append(story("micro_home_far", "A1-0", "你家在哪儿？", "Lúc nghỉ giải lao, chú Lý hỏi Hồng về gia đình ở quê.",
    ["胡志明市", "远", "近"], [
    ("N", "这 是 阮红，那 是 老李。", "Đây là Hồng, kia là chú Lý."),
    ("B", "阮红，你 是 越南人 吗？", "Hồng, cháu là người Việt Nam à?"),
    ("A", "是，我 是 越南人。", "Vâng, cháu là người Việt Nam."),
    ("B", "你 家 在 哪儿？", "Nhà cháu ở đâu?"),
    ("A", "我 家 在 胡志明市。", "Nhà cháu ở Thành phố Hồ Chí Minh."),
    ("B", "那儿 离 这儿 很 远 吧？", "Chỗ đó cách đây xa lắm nhỉ?"),
    ("A", "是 啊。", "Vâng ạ."),
    ("B", "你 家 都 有 谁？", "Nhà cháu có những ai?"),
    ("A", "我 家 有 爸爸、妈妈、我 和 弟弟。", "Nhà cháu có bố, mẹ, cháu và em trai."),
    ("B", "你 弟弟 也 是 工人 吗？", "Em trai cháu cũng là công nhân à?"),
    ("A", "不 是，他 是 学生。", "Không ạ, nó là học sinh."),
    ("A", "老李，您 呢？您 家 在 哪儿？", "Chú Lý, còn chú? Nhà chú ở đâu ạ?"),
    ("B", "我 家 在 这儿，很 近。我 有 儿子 和 女儿。", "Nhà chú ở đây, gần lắm. Chú có con trai và con gái."),
    ("A", "他们 也 是 工人 吗？", "Họ cũng là công nhân ạ?"),
    ("B", "我 儿子 是 工人，我 女儿 是 学生。", "Con trai chú là công nhân, con gái chú là sinh viên."),
], [
    Q("Nhà của Hồng ở đâu?", ["Ở Thành phố Hồ Chí Minh", "Ở gần nhà máy", "Ở Hà Nội"]),
    Q("Em trai của Hồng làm gì?", ["Là học sinh", "Là công nhân", "Câu chuyện không nói"]),
    Q("Ai được gặp gia đình mình thường xuyên hơn?", ["Chú Lý", "Hồng", "Cả hai như nhau"], "infer"),
]))

S.append(story("micro_wrong_door", "A1-0", "对不起！", "Buổi tối ở ký túc xá, Nam gõ nhầm cửa phòng.",
    ["宿舍", "门口", "房间"], [
    ("N", "这 是 工人 宿舍。", "Đây là ký túc xá công nhân."),
    ("N", "阮南 在 门口。", "Nam đứng ở trước cửa."),
    ("B", "晚上好！请问，阮海 在 这儿 吗？", "Chào chị! Cho hỏi, anh Hải có ở đây không ạ?"),
    ("A", "晚上好。阮海？他 不 在 这儿。", "Chào anh. Hải à? Anh ấy không ở đây."),
    ("B", "对不起！这 不 是 阮海 的 房间 吗？", "Xin lỗi! Đây không phải phòng của anh Hải ạ?"),
    ("A", "不 是，这 是 我 和 我 妹妹 的。", "Không phải, đây là phòng của tôi và em gái tôi."),
    ("B", "对不起，对不起！", "Xin lỗi, xin lỗi chị!"),
    ("A", "没关系。你 是 越南人 吧？", "Không sao. Anh là người Việt Nam phải không?"),
    ("B", "是，我 叫 阮南。阮海 是 我 哥哥。", "Vâng, tôi tên là Nam. Anh Hải là anh trai tôi."),
    ("A", "你 哥哥 在 那边。", "Anh trai anh ở bên kia."),
    ("B", "谢谢 您！", "Cảm ơn chị!"),
    ("A", "不客气。晚安！", "Không có gì. Chúc ngủ ngon!"),
    ("B", "晚安！", "Chúc chị ngủ ngon!"),
], [
    Q("Nam đến tìm ai?", ["Anh trai của Nam", "Em gái của Nam", "Bố của Nam"]),
    Q("Căn phòng Nam gõ cửa là của ai?", ["Của chị ấy và em gái chị ấy", "Của anh Hải", "Của Nam"]),
    Q("Vì sao Nam xin lỗi mấy lần?", ["Vì Nam gõ nhầm phòng", "Vì Nam đến muộn", "Vì Nam quên tên chị ấy"], "infer"),
]))

write_batch("00-micro", S)
