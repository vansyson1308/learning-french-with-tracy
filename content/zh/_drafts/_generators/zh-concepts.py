"""Concept cards of zh-vi: content/zh/_drafts/concepts/OUTPUT.jsonl (P4d session 2, after ja-concepts.py).

Twenty-eight cards cover plan/authoring/zh-plan.md §5: pinyin and tones against the Vietnamese tones, tone sandhi,
the initials Vietnamese speakers confuse, characters and radicals, Hán-Việt and false friends, simplified and
traditional; 是, 不/没, 吗/A不A/呢/吧, question words in place; measure words (with the Vietnamese loại từ), 两/二,
numbers and money, 这/那 + measure word; 有 and 在, location words after the noun, 的 before the noun, time and place
before the verb; 了, 过, 在/正在 and 着; 想/要/会/能/可以; 很 + adjective, 太…了, 有点儿; 比; polite speech at work;
greetings, family words and linking words for Sections 1 and 5. Mandarin verbs do not inflect: no paradigm table
(the build plugin declares concepts instead). Every Chinese example passes the reading checks of the lessons
(zh_text.Index: every hanzi inside a lexicon surface, homographs in their stored reading).
usage: python -I zh-concepts.py <repo root>
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from zh_text import Index, load_lexicon  # noqa: E402

ROOT = sys.argv[1]
OUT = f"{ROOT}/content/zh/_drafts/concepts/OUTPUT.jsonl"
COURSE = {"source": "original-chinese-course"}
INDEX = Index(load_lexicon(ROOT))
recs = []
problems = []


def ex(target, vi, en, note_vi=None, note_en=None):
    for p in INDEX.problems(target):
        problems.append(p)
    e = {"target": target, "translations": {"vi": vi, "en": en}}
    if note_vi:
        e["note"] = {"vi": note_vi, "en": note_en}
    return e


def concept(cid, title, short, expl, examples, exceptions, hint, objectives):
    if len(short[0]) > 140:
        problems.append(f"{cid}: shortRule {len(short[0])} chars")
    if len(expl[0]) > 700:
        problems.append(f"{cid}: explanation {len(expl[0])} chars")
    recs.append({
        "id": f"zh:concept:{cid}",
        "title": {"vi": title[0], "en": title[1]},
        "shortRule": {"vi": short[0], "en": short[1]},
        "explanation": {"vi": expl[0], "en": expl[1]},
        "examples": examples,
        "exceptions": [{"vi": v, "en": e} for v, e in exceptions],
        "memoryHint": {"vi": hint[0], "en": hint[1]},
        "objectives": [f"zh.obj.{o}" for o in objectives],
        "sourceRefs": [COURSE],
    })


# ---------------------------------------------------------------- sounds and script
concept("pinyin-tones",
        ("Pinyin và bốn thanh", "Pinyin and the four tones"),
        ("Tiếng Trung có bốn thanh và một thanh nhẹ; mỗi thanh gần một thanh tiếng Việt nhưng không giống hẳn.", "Mandarin has four tones and a neutral tone; each is close to a Vietnamese tone but not the same."),
        ("Bạn đã quen nghe thanh điệu (声调), đó là lợi thế lớn. Thanh 1 (ā) cao và bằng, cao hơn thanh ngang, giữ đều đến cuối. Thanh 2 (á) đi lên từ giữa, gần thanh sắc nhưng không gắt, không ngắt. Thanh 3 (ǎ) xuống thấp, gần thanh hỏi; trong câu thường chỉ còn phần thấp, không bao giờ có chỗ thắt như thanh ngã. Thanh 4 (à) rơi mạnh từ rất cao xuống thấp: không phải thanh huyền (thấp và êm), cũng không bị cắt như thanh nặng. Thanh nhẹ ngắn và nhẹ: 吗, 的, 了, chữ thứ hai của 妈妈.",
         "You already hear tones, which is a big head start. Tone 1 (ā) is high and level, higher than the Vietnamese level tone and held flat. Tone 2 (á) rises from the middle, close to the Vietnamese rising tone but neither tense nor clipped. Tone 3 (ǎ) dips low, close to the Vietnamese dipping tone; in speech usually only the low part, never the glottal break of the broken tone. Tone 4 (à) falls hard from the very top: not the low, soft Vietnamese falling tone, and not cut short like the heavy tone. The neutral tone is short and light: 吗, 的, 了, the second syllable of 妈妈."),
        [ex("喝", "uống", "to drink", "hē — thanh 1, cao và bằng", "hē — tone 1, high and level"),
         ex("买", "mua", "to buy", "mǎi — thanh 3, gần thanh hỏi", "mǎi — tone 3, close to hỏi"),
         ex("卖", "bán", "to sell", "mài — thanh 4, rơi từ cao", "mài — tone 4, a high fall"),
         ex("妈妈", "mẹ", "mum", "mā ma — âm tiết sau đọc nhẹ", "mā ma — the second syllable is neutral")],
        [("Pinyin của khoá học luôn ghi thanh gốc; khi nói, vài thanh đổi (xem thẻ biến điệu thanh).", "The course's pinyin always shows the citation tone; some tones change in speech (see the tone sandhi card).")],
        ("Thanh 4 như khi bạn ra lệnh dứt khoát: \"Đi!\" nhưng bắt đầu cao hơn.", "Tone 4 is like a firm command, starting higher."),
        ["script.pinyin_tones", "pronunciation.tones_sounds"])

concept("tone-sandhi",
        ("Biến điệu thanh: 不, 一 và hai thanh 3", "Tone sandhi: 不, 一 and two third tones"),
        ("Hai thanh 3 liền nhau: thanh đầu đọc thanh 2. 不 trước thanh 4 đọc bú; 一 trước thanh 4 đọc yí, trước thanh khác đọc yì.", "Two third tones: the first is said as tone 2. 不 before tone 4 is bú; 一 is yí before tone 4 and yì before the others."),
        ("Khi nói, vài thanh đổi theo thanh đứng sau. 你好 viết nǐ hǎo nhưng đọc gần như ní hǎo. 不 (bù) trước thanh 4 thành bú: 不是 bú shì, 不要 bú yào. 一 (yī) trước thanh 4 thành yí: 一个 yí ge; trước thanh 1, 2, 3 thành yì: 一杯 yì bēi, 一起 yì qǐ. Khi đếm hay đọc số, 一 giữ yī: 十一, 星期一. Pinyin dưới chữ trong khoá học luôn ghi thanh gốc, còn bài nghe đọc như người bản ngữ nói.",
         "In speech some tones change with the tone that follows. 你好 is written nǐ hǎo but said almost ní hǎo. 不 (bù) becomes bú before tone 4: 不是, 不要. 一 (yī) becomes yí before tone 4 (一个) and yì before tones 1, 2 and 3 (一杯, 一起). When counting, 一 stays yī: 十一, 星期一. The pinyin under the characters always shows the citation tone; the audio says it as a native speaker does."),
        [ex("你好", "xin chào", "hello", "viết nǐ hǎo, đọc ní hǎo", "written nǐ hǎo, said ní hǎo"),
         ex("不是", "không phải", "is not", "đọc bú shì", "said bú shì"),
         ex("一个", "một cái", "one (thing)", "đọc yí ge", "said yí ge"),
         ex("一杯茶", "một cốc trà", "a cup of tea", "đọc yì bēi", "said yì bēi")],
        [("Ứng dụng không chấm thanh khi bạn nói; nhưng nghe đúng thanh giúp bạn hiểu.", "The app does not grade tones when you speak, but hearing them right helps you understand.")],
        ("Gặp thanh 4 phía sau thì 不 và 一 \"leo lên\" thanh 2.", "Before a tone 4, 不 and 一 climb to tone 2."),
        ["pronunciation.tones_sounds", "script.pinyin_tones"])

concept("initials-traps",
        ("Âm đầu dễ nhầm: zh ch sh r, j q x, ü", "Tricky initials: zh ch sh r, j q x, ü"),
        ("zh, ch, sh, r uốn lưỡi (卷舌音); z, c, s không uốn. j, q, x đứng trước i, ü. ü tròn môi như u nhưng lưỡi ở vị trí i.", "zh, ch, sh, r are retroflex; z, c, s are not. j, q, x come before i and ü. ü is i said with rounded lips."),
        ("Chữ pinyin không đọc như chữ quốc ngữ. sh (是 shì) uốn lưỡi lên; s (四 sì) không uốn: đây là cặp người Việt hay nhầm (四 và 十). zh gần \"tr\" khi uốn lưỡi (như giọng miền Trung, miền Nam; giọng Bắc đọc tr như ch, không uốn), không bật hơi; ch như zh nhưng bật hơi. q (七 qī) gần \"ch\" bật hơi, x (谢 xiè) gần \"x\" nhưng lưỡi chạm răng dưới. c (菜 cài) đọc như \"ts\" bật hơi mạnh (gần \"x\" nhưng có tiếng bật ở đầu), không phải \"c\"; z (早 zǎo) là \"ts\" không bật hơi. ü (绿 lǜ) như \"uy\" tròn môi; sau j, q, x, y viết u nhưng vẫn đọc ü: 去 qù. Âm cuối -n và -ng khác nhau: 饭 fàn, 房 fáng.",
         "Pinyin letters are not read like Vietnamese spelling. sh (是 shì) curls the tongue; s (四 sì) does not — Vietnamese speakers often confuse 四 and 十. zh is like a curled 'tr' (as in Central and Southern Vietnamese; the Northern tr is said like ch, without the curl), unaspirated; ch is zh with a puff of air. q (七 qī) is an aspirated 'ch', x (谢 xiè) is close to Vietnamese x with the tongue behind the lower teeth. c (菜 cài) is an aspirated 'ts', not a 'k'; z (早 zǎo) is an unaspirated 'ts'. ü (绿 lǜ) is i with rounded lips; after j, q, x, y it is written u but still ü: 去 qù. Final -n and -ng differ: 饭 fàn, 房 fáng."),
        [ex("四", "bốn", "four", "sì — không uốn lưỡi", "sì — no curl"),
         ex("十", "mười", "ten", "shí — uốn lưỡi", "shí — retroflex"),
         ex("七", "bảy", "seven", "qī — bật hơi", "qī — aspirated"),
         ex("绿", "xanh lá", "green", "lǜ — âm ü", "lǜ — the ü vowel"),
         ex("去", "đi", "to go", "qù viết u, đọc ü", "qù: written u, said ü")],
        [("Người miền Nam Trung Quốc và Đài Loan thường nói sh gần như s: bạn sẽ nghe cả hai cách.", "Speakers in southern China and Taiwan often say sh almost like s: you will hear both.")],
        ("Mười (十) phải uốn lưỡi; bốn (四) thì không.", "Ten (十) curls the tongue; four (四) does not."),
        ["pronunciation.tones_sounds"])

concept("hanzi-radicals",
        ("Chữ Hán và bộ thủ", "Characters and radicals"),
        ("Mỗi chữ Hán (汉字) là một âm tiết có nghĩa; bộ thủ thường gợi nghĩa, phần còn lại thường gợi âm.", "Each character is a syllable with a meaning; the radical often hints at the meaning, the rest often at the sound."),
        ("Chữ Việt ghép từ chữ cái; chữ Hán thì mỗi chữ là một khối. Nhiều chữ là chữ hình thanh: một bộ chỉ nghĩa, một phần gợi âm. 妈 (mā, mẹ) có bộ 女 (nữ) và 马 (mǎ) gợi âm. Bộ 氵 (nước) có trong 河, 海, 洗; bộ 口 (miệng) có trong 吃, 喝, 叫, 吗; bộ 亻 (người) có trong 你, 他, 们; bộ 讠 (lời nói) có trong 说, 话, 请, 谢. Khoá học dạy nhận mặt chữ và gõ bằng pinyin, không bắt viết tay.",
         "Vietnamese builds words from letters; a Chinese character is a single block. Many are phono-semantic: one part hints at the meaning, another at the sound. 妈 (mā, mother) has the radical 女 (woman) and 马 (mǎ) for the sound. 氵 (water) is in 河, 海, 洗; 口 (mouth) in 吃, 喝, 叫, 吗; 亻 (person) in 你, 他, 们; 讠 (speech) in 说, 话, 请, 谢. The course teaches recognition and pinyin typing, never handwriting."),
        [ex("妈妈", "mẹ", "mother", "妈 = 女 + 马 (mǎ)", "妈 = 女 + 马 (mǎ)"),
         ex("喝", "uống", "to drink", "bộ 口: miệng", "radical 口: mouth"),
         ex("洗", "rửa", "to wash", "bộ 氵: nước", "radical 氵: water"),
         ex("说话", "nói chuyện", "to talk", "bộ 讠: lời nói", "radical 讠: speech")],
        [("Phần gợi âm chỉ là gợi ý: 他 (tā) và 地 không đọc giống nhau.", "The sound part is only a hint: 他 (tā) and 地 are not read alike.")],
        ("Nhìn bộ thủ để đoán nhóm nghĩa, nhìn pinyin để đọc.", "Look at the radical for the meaning group, at the pinyin for the sound."),
        ["script.hanzi_hanviet"])

concept("hanviet-false-friends",
        ("Âm Hán-Việt và \"bạn giả\"", "Sino-Vietnamese readings and false friends"),
        ("Âm Hán-Việt giúp đoán nghĩa nhiều từ (银行 ngân hàng); nhưng có \"bạn giả\": 小心 là cẩn thận, không phải \"tiểu tâm\".", "The Sino-Vietnamese reading helps guess many words (银行 bank); but beware false friends: 小心 means careful."),
        ("Rất nhiều từ tiếng Việt là từ Hán-Việt, nên nhiều từ tiếng Trung nghĩa giống hệt: 学生 học sinh, 安全 an toàn, 准备 chuẩn bị, 护照 hộ chiếu. Âm đọc thì khác: hãy đọc theo pinyin, đừng đọc theo Hán-Việt. Có những từ trông quen mà nghĩa khác: 方便 là thuận tiện (không phải phương tiện), 意思 là ý nghĩa, 东西 là đồ vật, 出口 trên biển báo là lối ra (nghĩa xuất khẩu chỉ gặp khi nói về hàng hoá; nhập khẩu là 进口, không phải 入口), 认识 là quen biết, 走 là đi. Ứng dụng hiện âm Hán-Việt dưới từ khi nó giúp được bạn.",
         "Much of the Vietnamese vocabulary is Sino-Vietnamese, so many Chinese words mean exactly the same: 学生 student, 安全 safety, 准备 to prepare, 护照 passport. The sounds differ: read the pinyin, not the Sino-Vietnamese. Some words look familiar but mean something else: 方便 is convenient (not 'means of transport'), 意思 is meaning, 东西 is a thing, 出口 on a sign is the exit (it means 'export' only about goods; 'import' is 进口, not 入口), 认识 is to know someone, 走 is to walk. The app shows the Sino-Vietnamese reading under a word when it helps."),
        [ex("银行", "ngân hàng", "bank", "Hán-Việt: ngân hàng — nghĩa giống", "same meaning as the Sino-Vietnamese word"),
         ex("安全", "an toàn", "safety", "an toàn — nghĩa giống", "same meaning"),
         ex("小心", "cẩn thận", "careful", "bạn giả: không phải \"tiểu tâm\"", "false friend"),
         ex("方便", "thuận tiện", "convenient", "bạn giả: không phải \"phương tiện\"", "false friend"),
         ex("出口", "lối ra", "exit", "trên biển báo: lối ra, không phải xuất khẩu", "on a sign: the exit, not 'export'")],
        [("Từ thông dụng như 知道 (biết), 告诉 (bảo) có âm Hán-Việt mà người Việt không dùng: ứng dụng không hiện âm đó.", "Common words like 知道 and 告诉 have readings no Vietnamese speaker uses: the app does not show them.")],
        ("Hán-Việt để nhớ nghĩa, pinyin để đọc.", "Sino-Vietnamese for the meaning, pinyin for the sound."),
        ["strategy.hanviet_false_friends", "script.hanzi_hanviet"])

concept("simplified-traditional",
        ("Chữ giản thể và phồn thể", "Simplified and traditional characters"),
        ("Khoá học dùng chữ giản thể như Trung Quốc đại lục; ở Đài Loan biển báo viết phồn thể. Bạn chỉ cần nhận ra.", "The course uses simplified characters as in mainland China; Taiwan writes traditional ones. You only need to recognise them."),
        ("Năm 1956 Trung Quốc đại lục giản hoá nhiều chữ: 车 thay cho 車, 学 thay cho 學, 说 thay cho 說. Đài Loan và Hồng Kông vẫn dùng chữ phồn thể. Nhiều chữ giống nhau ở cả hai bên: 人, 大, 工, 安全. Ở nhà máy Đài Loan bạn sẽ thấy 禁止吸菸, 車站, 小心: phần lớn vẫn nhận ra được. Khi bạn gõ hay nói, ứng dụng hiểu cả chữ phồn thể của từ đã học.",
         "In 1956 mainland China simplified many characters: 车 for 車, 学 for 學, 说 for 說. Taiwan and Hong Kong still write traditional characters. Many are the same on both sides: 人, 大, 工, 安全. In a Taiwan factory you will see 禁止吸菸, 車站, 小心: most stay recognisable. When you type or speak, the app accepts the traditional spelling of the words you have learnt."),
        [ex("车站", "bến xe; nhà ga", "station", "phồn thể: 車站", "traditional: 車站"),
         ex("学生", "học sinh", "student", "phồn thể: 學生", "traditional: 學生"),
         ex("安全", "an toàn", "safety", "giống nhau ở cả hai bên", "the same in both scripts")],
        [("Bộ 讠 giản thể là 言 trong phồn thể: 说 = 說, 话 = 話.", "The simplified radical 讠 is 言 in traditional: 说 = 說, 话 = 話.")],
        ("Giản thể ít nét hơn; nét chung thì giữ nguyên.", "Simplified has fewer strokes; the common parts stay."),
        ["script.hanzi_hanviet", "reading.notices_info"])

# ---------------------------------------------------------------- Section 1
concept("greetings",
        ("Chào hỏi, cảm ơn, xin lỗi", "Greetings, thanks and apologies"),
        ("你好 chào mọi người; 您好 lịch sự hơn. Cảm ơn: 谢谢, đáp 不客气. Xin lỗi: 对不起, đáp 没关系.", "你好 greets anyone; 您好 is more polite. Thanks: 谢谢, reply 不客气. Sorry: 对不起, reply 没关系."),
        ("Tiếng Việt chào kèm xưng hô: chào anh, chào chị. Tiếng Trung chỉ cần 你好; với cấp trên, khách hay người lớn tuổi dùng 您好. Buổi sáng nói 早上好, buổi tối 晚上好, trước khi ngủ 晚安. 请 là \"mời\" và \"xin vui lòng\": 请进, 请坐. 请问 mở đầu một câu hỏi lịch sự. Khi được cảm ơn, đáp 不客气; khi người khác xin lỗi, đáp 没关系.",
         "Vietnamese greets with a form of address: chào anh, chào chị. Chinese only needs 你好; with superiors, customers or older people use 您好. In the morning 早上好, in the evening 晚上好, before sleep 晚安. 请 means both 'please come' and 'please': 请进, 请坐. 请问 opens a polite question. Reply 不客气 to thanks and 没关系 to an apology."),
        [ex("您好！", "Xin chào (lịch sự).", "Hello (polite)."),
         ex("谢谢！", "Cảm ơn!", "Thank you!"),
         ex("对不起。", "Xin lỗi.", "Sorry."),
         ex("请问，洗手间在哪儿？", "Xin hỏi, nhà vệ sinh ở đâu?", "Excuse me, where is the toilet?")],
        [("Với bạn bè, 谢谢 đôi khi được đáp bằng một nụ cười hay 没事儿 (không sao đâu).", "Among friends, 谢谢 may be answered with a smile or 没事儿.")],
        ("Có 您 là lịch sự; có 请 là nhờ một cách nhẹ nhàng.", "With 您 you are polite; with 请 you ask gently."),
        ["greetings.basic"])

concept("family",
        ("Gia đình: anh, chị, em và lượng từ 口", "Family words and the measure word 口"),
        ("Tiếng Trung tách em trai 弟弟 và em gái 妹妹. Đếm người trong nhà dùng 口: 我家有四口人.", "Chinese keeps 弟弟 (younger brother) and 妹妹 (younger sister) apart. Count household members with 口."),
        ("Tiếng Việt có \"em\" chung cho em trai và em gái; tiếng Trung phải chọn: 弟弟 hay 妹妹. Anh trai là 哥哥, chị gái là 姐姐. Ông bà nội là 爷爷, 奶奶. Chữ thứ hai của các từ lặp (爸爸, 妈妈) đọc thanh nhẹ. Hỏi nhà bạn có mấy người: 你家有几口人？ Phủ định của 有 là 没有, không bao giờ là 不有: 我没有妹妹.",
         "Vietnamese 'em' covers younger brothers and sisters; Chinese must choose: 弟弟 or 妹妹. An older brother is 哥哥, an older sister 姐姐. Paternal grandparents are 爷爷, 奶奶. The second syllable of the doubled words (爸爸, 妈妈) is neutral. To ask how many people are in your family: 你家有几口人？ The negative of 有 is 没有, never 不有: 我没有妹妹."),
        [ex("我家有四口人。", "Nhà tôi có bốn người.", "There are four people in my family."),
         ex("我有一个弟弟。", "Tôi có một em trai.", "I have a younger brother."),
         ex("我没有妹妹。", "Tôi không có em gái.", "I have no younger sister.", "没有, không phải 不有", "没有, never 不有")],
        [("口 chỉ dùng khi đếm cả nhà; đếm anh chị em thì dùng 个: 两个哥哥.", "口 is only for counting a household; siblings take 个: 两个哥哥.")],
        ("Em trai có bộ 弓 (弟), em gái có bộ 女 (妹).", "弟 has 弓, 妹 has 女."),
        ["vocab.everyday_basics", "existence.you_zai"])

# ---------------------------------------------------------------- sentences and questions
concept("shi-sentences",
        ("Câu với 是: A 是 B", "Sentences with 是: A 是 B"),
        ("A 是 B nghĩa là A là B, trật tự như tiếng Việt. 是 không bao giờ đổi dạng.", "A 是 B means A is B, in Vietnamese order. 是 never changes form."),
        ("Câu 我是工人 có đúng trật tự của \"tôi là công nhân\". Không có mạo từ, không chia động từ: 我是, 你是, 他们是 đều như nhau. Phủ định thêm 不: 我不是老师. Câu hỏi thêm 吗: 你是学生吗？ 是 nối hai danh từ; không dùng 是 trước tính từ: nói 他很高, không nói 他是高.",
         "我是工人 has the order of Vietnamese 'tôi là công nhân'. No articles, no conjugation: 我是, 你是, 他们是 are all the same. The negative adds 不: 我不是老师. A question adds 吗: 你是学生吗？ 是 links two nouns; it is not used before an adjective: say 他很高, not 他是高."),
        [ex("我是越南人。", "Tôi là người Việt Nam.", "I am Vietnamese."),
         ex("他不是老师。", "Anh ấy không phải là giáo viên.", "He is not a teacher."),
         ex("你是学生吗？", "Bạn là học sinh à?", "Are you a student?")],
        [("Nói tên thường dùng 叫: 我叫阮海; 我是阮海 (\"tôi là Hải\") cũng đúng, nhất là khi gọi điện. Nói họ dùng 姓: 我姓阮.", "To give your name 叫 is usual: 我叫阮海; 我是阮海 ('this is Hai') is right too, above all on the phone. For the family name use 姓: 我姓阮.")],
        ("是 = là, chỉ giữa hai danh từ.", "是 = 'is', only between two nouns."),
        ["sentences.shi_questions"])

concept("bu-mei",
        ("Phủ định: 不 và 没", "Negation: 不 and 没"),
        ("不 phủ định hiện tại, tương lai, thói quen và ý muốn; 没 phủ định 有 và việc đã không xảy ra.", "不 negates the present, the future, habits and will; 没 negates 有 and things that did not happen."),
        ("Tiếng Việt dùng \"không\" cho cả hai. Tiếng Trung chọn theo thời điểm và nghĩa: 我不喝酒 — tôi không uống rượu (thói quen); 我明天不去 — mai tôi không đi. Với 有 luôn là 没有: 我没有钱. Việc đã không xảy ra: 我昨天没去 — hôm qua tôi đã không đi; 我还没吃饭 — tôi chưa ăn cơm. Sau 没 không có 了: nói 我没吃, không nói 我没吃了. 不 trước thanh 4 đọc bú (不是, 不去).",
         "Vietnamese uses 'không' for both. Chinese chooses by time and meaning: 我不喝酒 (habit); 我明天不去 (future). With 有 it is always 没有: 我没有钱. For something that did not happen: 我昨天没去; 我还没吃饭 (not yet). No 了 after 没: say 我没吃, not 我没吃了. Before tone 4, 不 is said bú (不是, 不去)."),
        [ex("我不喝酒。", "Tôi không uống rượu.", "I don't drink alcohol."),
         ex("我没有钱。", "Tôi không có tiền.", "I have no money."),
         ex("我昨天没去。", "Hôm qua tôi đã không đi.", "I didn't go yesterday."),
         ex("我还没吃饭。", "Tôi chưa ăn cơm.", "I haven't eaten yet.", "chưa: 还没", "not yet: 还没")],
        [("是 luôn đi với 不: 不是; tính từ thường đi với 不, kể cả khi nói về hôm qua: 昨天不冷 (trừ khi nói một thay đổi chưa xảy ra: 还没好).", "是 always takes 不: 不是; adjectives usually take 不, even about yesterday: 昨天不冷 (except a change that has not happened yet: 还没好).")],
        ("Có 有 hoặc \"chưa / đã không\" → 没; còn lại → 不.", "有, 'not yet' or 'did not' → 没; otherwise → 不."),
        ["sentences.shi_questions"])

concept("questions-ma",
        ("Câu hỏi có/không: 吗, A不A, 呢, 吧", "Yes/no questions: 吗, A不A, 呢, 吧"),
        ("Thêm 吗 cuối câu để hỏi có/không, hoặc ghép 是不是, 忙不忙. 呢 hỏi \"còn … thì sao?\"; 吧 là \"nhé, chắc là\".", "Add 吗 for a yes/no question, or pair 是不是, 忙不忙. 呢 asks 'what about …?'; 吧 means 'let's' or 'I suppose'."),
        ("Câu khẳng định thêm 吗 là thành câu hỏi, không đổi trật tự: 你是工人吗？ Cách thứ hai ghép khẳng định với phủ định: 你忙不忙？ 你是不是越南人？ — khi đã có A不A thì không thêm 吗. 呢 hỏi lại về người khác: 我很好，你呢？ 吧 làm câu thành lời rủ hay đoán: 我们走吧 (mình đi thôi), 你是阮海吧？ (bạn là Nguyễn Hải phải không?). Trả lời có/không bằng chính động từ: 是 / 不是, 有 / 没有, 去 / 不去.",
         "Adding 吗 turns a statement into a question without changing the order: 你是工人吗？ The second way pairs the positive with the negative: 你忙不忙？ 你是不是越南人？ — with A不A there is no 吗. 呢 bounces a question back: 我很好，你呢？ 吧 makes a suggestion or a guess: 我们走吧, 你是阮海吧？ Answer yes or no with the verb itself: 是 / 不是, 有 / 没有, 去 / 不去."),
        [ex("你忙吗？", "Bạn bận không?", "Are you busy?"),
         ex("你忙不忙？", "Bạn có bận không?", "Are you busy or not?"),
         ex("我很好，你呢？", "Tôi khoẻ, còn bạn?", "I'm fine, and you?"),
         ex("我们走吧。", "Mình đi thôi.", "Let's go.")],
        [("Tiếng Trung không có từ riêng cho \"có\" và \"không\" khi trả lời: nhắc lại động từ, hay dùng 对 (đúng).", "Chinese has no single word for yes or no: repeat the verb, or say 对 (right).")],
        ("吗 hỏi, 呢 hỏi lại, 吧 rủ.", "吗 asks, 呢 asks back, 吧 suggests."),
        ["sentences.shi_questions", "questions.question_words"])

concept("question-words",
        ("Từ để hỏi đứng đúng chỗ", "Question words stay in place"),
        ("Từ để hỏi đứng đúng chỗ của câu trả lời, như tiếng Việt; câu có từ để hỏi không thêm 吗.", "A question word stands where the answer will be, as in Vietnamese; such a question takes no 吗."),
        ("Câu hỏi giữ trật tự của câu trả lời: 这是什么？ → 这是茶。 他是谁？ → 他是我哥哥。 你去哪儿？ → 我去工厂。 Tiếng Việt cũng vậy (\"anh ấy là ai?\"), nên bạn không phải đảo câu. Các từ để hỏi: 什么 (gì), 谁 (ai), 哪 / 哪儿 (nào, đâu), 几 (mấy, số nhỏ), 多少 (bao nhiêu), 怎么 (thế nào), 怎么样 (ra sao), 为什么 (tại sao). Không nói 你去哪儿吗.",
         "The question keeps the order of its answer: 这是什么？ → 这是茶。 他是谁？ → 他是我哥哥。 你去哪儿？ → 我去工厂。 Vietnamese works the same way, so nothing moves. Question words: 什么 (what), 谁 (who), 哪 / 哪儿 (which, where), 几 (how many, small numbers), 多少 (how many, how much), 怎么 (how), 怎么样 (how is it), 为什么 (why). Never 你去哪儿吗."),
        [ex("这是什么？", "Đây là cái gì?", "What is this?"),
         ex("你去哪儿？", "Bạn đi đâu?", "Where are you going?"),
         ex("你有几个孩子？", "Bạn có mấy đứa con?", "How many children do you have?"),
         ex("多少钱？", "Bao nhiêu tiền?", "How much is it?")],
        [("几 hỏi số nhỏ và cần lượng từ (几个); 多少 hỏi số bất kỳ và có thể đứng thẳng trước danh từ (多少钱).", "几 asks for a small number and needs a measure word (几个); 多少 asks for any number and can go straight before a noun (多少钱).")],
        ("Câu hỏi = câu trả lời, thay chỗ cần biết bằng từ để hỏi.", "Question = answer with the unknown replaced by a question word."),
        ["questions.question_words"])

# ---------------------------------------------------------------- numbers and measure words
concept("measure-words",
        ("Lượng từ: số + lượng từ + danh từ", "Measure words: number + measure word + noun"),
        ("Giữa số và danh từ luôn có lượng từ (量词): 三本书, 一杯茶. 个 dùng chung cho người và nhiều vật.", "A measure word always stands between a number and a noun: 三本书, 一杯茶. 个 is the general one."),
        ("Tiếng Việt có loại từ: \"ba quyển sách\", \"một con mèo\", \"hai tấm vé\". Tiếng Trung giống vậy, và lượng từ là bắt buộc: 三本书, 一只猫, 两张票. Không có lượng từ là sai: không nói 三书. 个 (gè) dùng cho người và rất nhiều vật: 一个人, 三个苹果. Nhớ theo hình dạng: 张 cho vật phẳng (票, 纸, 桌子, 床), 条 cho vật dài (路, 河, 鱼), 件 cho áo và việc, 杯 cho cốc, 本 cho sách, 只 cho con vật nhỏ, 辆 cho xe, 双 cho đôi.",
         "Vietnamese has classifiers: 'ba quyển sách', 'một con mèo'. Chinese does too, and they are compulsory: 三本书, 一只猫, 两张票. Without one it is wrong: never 三书. 个 serves for people and many things: 一个人, 三个苹果. Remember them by shape: 张 for flat things (tickets, paper, tables, beds), 条 for long things (roads, rivers, fish), 件 for clothes and matters, 杯 for cups, 本 for books, 只 for small animals, 辆 for vehicles, 双 for pairs."),
        [ex("三本书", "ba quyển sách", "three books", "本: sách", "本: books"),
         ex("一杯咖啡", "một cốc cà phê", "a cup of coffee", "杯: cốc", "杯: cups"),
         ex("两张票", "hai tấm vé", "two tickets", "张: vật phẳng", "张: flat things"),
         ex("一件衣服", "một cái áo", "a piece of clothing", "件: áo, việc", "件: clothes, matters"),
         ex("一只猫", "một con mèo", "a cat", "只: con vật", "只: animals")],
        [("Không chắc thì 个 thường vẫn được hiểu, nhưng với sách, vé, cốc thì dùng 本, 张, 杯 mới tự nhiên.", "When unsure, 个 is usually understood, but books, tickets and cups sound natural only with 本, 张, 杯."),
         ("Danh từ chỉ thời gian như 天, 年 tự là đơn vị, không cần lượng từ: 三天, 两年.", "Time nouns such as 天 and 年 are units themselves: 三天, 两年.")],
        ("Lượng từ của tiếng Trung = loại từ của tiếng Việt, nhưng không bao giờ được bỏ.", "A Chinese measure word is a Vietnamese classifier that can never be dropped."),
        ["numbers.measure_words"])

concept("liang-er",
        ("Hai: 两 hay 二", "Two: 两 or 二"),
        ("Đếm và đọc số dùng 二; trước lượng từ dùng 两: 两个人, 两杯茶. Nói 二个 là sai.", "Counting and reading numbers use 二; before a measure word use 两: 两个人, 两杯茶. 二个 is wrong."),
        ("Tiếng Việt chỉ có một từ \"hai\". Tiếng Trung có hai: 二 (èr) khi đếm (一, 二, 三), trong số có nhiều chữ (十二, 二十), trong ngày tháng (二月, 二号) và số thứ tự (第二); 两 (liǎng) khi đếm vật, người, thời gian bằng lượng từ: 两个, 两本, 两天, 两点 (hai giờ). Đây là lỗi người mới học hay mắc nhất. Ứng dụng cũng hiểu chữ số: bạn gõ 2个 thì được tính như 两个, nhưng 二个 thì sai.",
         "Vietnamese has one word for two. Chinese has two: 二 (èr) for counting (一, 二, 三), inside longer numbers (十二, 二十), in dates (二月, 二号) and ordinals (第二); 两 (liǎng) for counting things, people and time with a measure word: 两个, 两本, 两天, 两点 (two o'clock). This is the beginner's most common mistake. The app reads digits too: 2个 counts as 两个, but 二个 is wrong."),
        [ex("两个人", "hai người", "two people", "trước lượng từ: 两", "before a measure word: 两"),
         ex("十二个", "mười hai cái", "twelve", "trong số nhiều chữ: 二", "inside a longer number: 二"),
         ex("二月", "tháng hai", "February"),
         ex("两点", "hai giờ", "two o'clock", "giờ: 两", "the hour: 两")],
        [("Trước 百 và 千 nói cả 两 và 二: 两百 hay 二百 đều được, 两千 hay dùng hơn.", "Before 百 and 千 both 两 and 二 occur: 两百 or 二百, 两千 is more common.")],
        ("Đếm số: 二. Đếm đồ: 两.", "Counting numbers: 二. Counting things: 两."),
        ["numbers.measure_words"])

concept("numbers-money",
        ("Số và tiền: 块, 元, 毛", "Numbers and money: 块, 元, 毛"),
        ("Số lớn ghép như tiếng Việt: 三十五, 一百. Tiền nói 块 (viết 元); 毛 là một hào. Giá đứng cuối câu: 这个十五块.", "Big numbers are built as in Vietnamese: 三十五, 一百. Money is 块 in speech (元 in writing); 毛 is a tenth."),
        ("一 đến 十 rồi ghép: 十一 (mười một), 二十 (hai mươi), 三十五 (ba mươi lăm), 一百 (một trăm), 一千 (một nghìn), 一万 (mười nghìn). Tiếng Trung đếm theo vạn: 一万 là 10.000, 十万 là 100.000. Số 0 ở giữa đọc 零: 一百零五 (105). Tiền tệ là nhân dân tệ: nói 块, trên bảng giá viết 元; 毛 là 0,1 tệ: 两块五 là 2,5 tệ. Hỏi giá: 多少钱？ Trong số điện thoại, số 1 thường đọc yāo.",
         "One to ten, then combine: 十一, 二十, 三十五, 一百, 一千, 一万 (10,000). Chinese counts in ten-thousands: 一万 is 10,000, 十万 100,000. A zero inside is 零: 一百零五 (105). The currency is the yuan: say 块, price tags write 元; 毛 is 0.1 yuan: 两块五 is 2.5 yuan. Ask the price with 多少钱？ In phone numbers, 1 is often said yāo."),
        [ex("三十五", "ba mươi lăm", "thirty-five"),
         ex("一百零五", "một trăm linh năm", "a hundred and five", "số 0 giữa: 零", "an inner zero: 零"),
         ex("这个十五块。", "Cái này mười lăm tệ.", "This is fifteen yuan."),
         ex("多少钱？", "Bao nhiêu tiền?", "How much?")],
        [("块 cũng là lượng từ \"miếng\": 一块面包 là một miếng bánh mì.", "块 is also the measure word 'piece': 一块面包.")],
        ("Tiền nói 块, viết 元.", "Say 块, write 元."),
        ["numbers.measure_words"])

concept("zhe-na-measure",
        ("这 / 那 + lượng từ: cái này, cái kia", "这 / 那 + measure word: this one, that one"),
        ("\"Quyển sách này\" là 这本书: 这 hay 那 đứng trước, kèm lượng từ, rồi mới đến danh từ.", "'This book' is 这本书: 这 or 那 comes first, with the measure word, then the noun."),
        ("Tiếng Việt đặt \"này\", \"kia\" sau danh từ: quyển sách này. Tiếng Trung đặt lên trước, và cần lượng từ: 这本书, 那件衣服, 这个人. Không có danh từ thì 这个 là \"cái này\", 那个 là \"cái kia\": 我要这个. Hỏi \"cái nào\": 哪个？ Đứng một mình làm chủ ngữ thì 这 và 那 không cần lượng từ: 这是我的书.",
         "Vietnamese puts 'này' and 'kia' after the noun. Chinese puts 这 and 那 in front, with a measure word: 这本书, 那件衣服, 这个人. Without a noun, 这个 is 'this one' and 那个 'that one': 我要这个. 'Which one' is 哪个？ As a subject on its own, 这 and 那 need no measure word: 这是我的书."),
        [ex("这本书", "quyển sách này", "this book"),
         ex("那件衣服很贵。", "Cái áo kia đắt.", "That piece of clothing is expensive."),
         ex("我要这个。", "Tôi lấy cái này.", "I'll take this one."),
         ex("这是我的书。", "Đây là sách của tôi.", "This is my book.", "这 làm chủ ngữ: không cần lượng từ", "这 as the subject: no measure word")],
        [("Nói nhanh, người ta hay dùng 这个 cho mọi thứ; nhưng 这本书 vẫn là cách chuẩn.", "In quick speech 这个 is used for everything; 这本书 is still the standard.")],
        ("这 + lượng từ + danh từ: ngược chỗ với \"này\".", "这 + measure word + noun: the opposite place of 'này'."),
        ["numbers.measure_words", "grammar.word_order"])

# ---------------------------------------------------------------- place, 的, order
concept("you-zai",
        ("有 và 在: có gì, ở đâu", "有 and 在: there is, is at"),
        ("Nơi chốn + 有 + vật: ở đâu có gì. Người/vật + 在 + nơi chốn: ai, cái gì ở đâu. Phủ định: 没有, 不在.", "Place + 有 + thing: there is. Person/thing + 在 + place: is at. Negatives 没有, 不在."),
        ("Hai câu này rất gần tiếng Việt. 宿舍里有洗手间 — trong ký túc xá có nhà vệ sinh: nơi chốn đứng trước, 有 rồi đến vật. 银行在超市旁边 — ngân hàng ở cạnh siêu thị: vật đứng trước, 在 rồi đến nơi chốn. 有 còn là \"có\" sở hữu: 我有手机. Phủ định của 有 là 没有; của 在 là 不在: 经理不在 (quản lý không có ở đây).",
         "Both patterns are close to Vietnamese. 宿舍里有洗手间 — the dormitory has a toilet: the place first, then 有, then the thing. 银行在超市旁边 — the bank is next to the supermarket: the thing first, then 在, then the place. 有 also means 'to have': 我有手机. The negative of 有 is 没有; of 在, 不在: 经理不在 (the manager is not here)."),
        [ex("宿舍里有洗手间。", "Trong ký túc xá có nhà vệ sinh.", "There is a toilet in the dormitory."),
         ex("银行在超市旁边。", "Ngân hàng ở cạnh siêu thị.", "The bank is next to the supermarket."),
         ex("经理不在。", "Quản lý không có ở đây.", "The manager is not in."),
         ex("这儿没有电梯。", "Ở đây không có thang máy.", "There is no lift here.")],
        [("在 còn là \"đang\" trước động từ: 我在吃饭 (xem thẻ 在 / 正在).", "在 before a verb also means 'be doing': 我在吃饭 (see the 在 / 正在 card).")],
        ("Có gì → 有; ở đâu → 在.", "What there is → 有; where it is → 在."),
        ["existence.you_zai"])

concept("location-words",
        ("Từ chỉ vị trí đứng sau danh từ", "Location words come after the noun"),
        ("\"Trên bàn\" là 桌子上, \"trong túi\" là 包里: từ chỉ vị trí đứng sau danh từ, ngược tiếng Việt.", "'On the table' is 桌子上, 'in the bag' 包里: the location word follows the noun."),
        ("Tiếng Việt nói \"trên bàn\", \"trong phòng\", \"cạnh công ty\". Tiếng Trung đảo lại: 桌子上 (bàn + trên), 房间里 (phòng + trong), 公司旁边 (công ty + cạnh). Các từ hay dùng: 上 trên, 下 dưới, 里 trong, 外边 ngoài, 前边 trước, 后边 sau, 旁边 cạnh, 对面 đối diện, 中间 ở giữa. Cả cụm đứng sau 在: 手机在包里. Tên nước, thành phố thì không thêm 里: 我在中国, không nói 中国里.",
         "Vietnamese says 'on table', 'in room', 'next to company'. Chinese reverses it: 桌子上, 房间里, 公司旁边. Common ones: 上 on, 下 under, 里 in, 外边 outside, 前边 in front, 后边 behind, 旁边 beside, 对面 opposite, 中间 in the middle. The whole phrase follows 在: 手机在包里. Countries and cities take no 里: 我在中国, not 中国里."),
        [ex("手机在桌子上。", "Điện thoại ở trên bàn.", "The phone is on the table."),
         ex("钥匙在包里。", "Chìa khoá ở trong túi.", "The key is in the bag."),
         ex("超市在银行对面。", "Siêu thị ở đối diện ngân hàng.", "The supermarket is opposite the bank.")],
        [("家 thường không cần 里: 我在家 (tôi ở nhà).", "家 usually needs no 里: 我在家.")],
        ("Danh từ trước, vị trí sau: 桌子上.", "Noun first, place word after: 桌子上."),
        ["existence.you_zai", "grammar.word_order"])

concept("de-modifier",
        ("的: định ngữ đứng trước danh từ", "的: the modifier comes before the noun"),
        ("Phần bổ nghĩa đứng trước danh từ, nối bằng 的: 我的手机, 漂亮的衣服. Ngược trật tự tiếng Việt.", "The modifier precedes the noun, joined by 的: 我的手机, 漂亮的衣服. The opposite of Vietnamese order."),
        ("Tiếng Việt nói \"điện thoại của tôi\", \"quần áo đẹp\", \"đồng nghiệp ở công ty\". Tiếng Trung đặt phần bổ nghĩa lên trước: 我的手机 (tôi 的 điện thoại), 漂亮的衣服, 公司的同事. 的 giống \"của\" nhưng đứng sau người sở hữu. Với người thân và nhóm của mình, 的 thường bỏ: 我妈妈, 我们公司. Tính từ một chữ cũng hay bỏ 的: 新手机.",
         "Vietnamese says 'phone of me', 'clothes pretty'. Chinese puts the modifier first: 我的手机, 漂亮的衣服, 公司的同事. 的 is like Vietnamese 'của' but comes after the owner. With family and one's own group 的 is usually dropped: 我妈妈, 我们公司. A one-syllable adjective often drops it too: 新手机."),
        [ex("我的手机", "điện thoại của tôi", "my phone"),
         ex("漂亮的衣服", "quần áo đẹp", "pretty clothes", "tiếng Việt: quần áo + đẹp; tiếng Trung: đẹp + 的 + quần áo", "the adjective comes first"),
         ex("公司的同事", "đồng nghiệp ở công ty", "colleagues at the company"),
         ex("我妈妈", "mẹ tôi", "my mother", "người thân: bỏ 的", "family: no 的")],
        [("Không có danh từ phía sau, 的 có nghĩa \"cái của\": 这是我的 — cái này là của tôi.", "With no noun after it, 的 means 'the one of': 这是我的 — this is mine.")],
        ("Ai/thế nào + 的 + cái gì.", "Whose/what kind + 的 + what."),
        ["grammar.word_order"])

concept("time-place-order",
        ("Thời gian và nơi chốn đứng trước động từ", "Time and place before the verb"),
        ("Trật tự: ai + khi nào + ở đâu + làm gì: 我明天在工厂加班. Thời gian cũng có thể đứng đầu câu.", "Order: who + when + where + does what: 我明天在工厂加班. The time may also open the sentence."),
        ("Tiếng Việt linh hoạt: \"tôi tăng ca ở nhà máy ngày mai\". Tiếng Trung giữ trật tự: thời gian và nơi chốn đứng trước động từ. 我八点上班 — tôi đi làm lúc tám giờ; 我在食堂吃饭 — tôi ăn ở nhà ăn. Thời gian có thể đứng trước hoặc sau chủ ngữ: 明天我休息 hay 我明天休息 đều đúng. Không đặt giờ sau động từ: không nói 我上班八点. Thời lượng (bao lâu) thì đứng sau động từ: 我等了十分钟.",
         "Vietnamese is flexible. Chinese keeps time and place before the verb: 我八点上班 — I start work at eight; 我在食堂吃饭 — I eat in the canteen. The time may stand before or after the subject: 明天我休息 and 我明天休息 are both right. Never put the clock time after the verb: not 我上班八点. A duration (how long) does follow the verb: 我等了十分钟."),
        [ex("我明天在工厂加班。", "Mai tôi tăng ca ở nhà máy.", "Tomorrow I'm working overtime at the factory."),
         ex("明天我休息。", "Mai tôi nghỉ.", "Tomorrow I'm off.", "thời gian có thể đứng đầu câu", "the time may open the sentence"),
         ex("我每天七点起床。", "Hằng ngày tôi dậy lúc bảy giờ.", "I get up at seven every day."),
         ex("我等了十分钟。", "Tôi đã đợi mười phút.", "I waited ten minutes.", "bao lâu: sau động từ", "how long: after the verb")],
        [("Ngày tháng đi từ lớn đến nhỏ: 二〇二六年五月一号, ngược với tiếng Việt.", "Dates go from large to small: year, month, day.")],
        ("Khi nào, ở đâu — rồi mới làm gì.", "When, where — then what."),
        ["grammar.word_order", "vocab.time_calendar"])

# ---------------------------------------------------------------- aspect
concept("aspect-le",
        ("了: việc đã xong, tình hình đã đổi", "了: done, or things have changed"),
        ("了 sau động từ: việc đã xong (我吃了). 了 cuối câu: tình hình đã khác trước (下雨了). 了 không phải thì quá khứ.", "了 after a verb: the action is done. 了 at the end: the situation has changed. 了 is not a past tense."),
        ("了 gần với \"rồi\" của tiếng Việt. 我吃饭了 — tôi ăn cơm rồi. 下雨了 — mưa rồi (lúc nãy chưa mưa). 我买了两本书 — tôi đã mua hai quyển sách. Nhưng 了 không phải thì quá khứ: thói quen trong quá khứ không có 了 (我以前每天喝茶), và câu với 是, tính từ hay 在 về quá khứ cũng không cần 了 (昨天很冷). Phủ định là 没 + động từ, bỏ 了: 我没吃. 太…了 là \"quá\": 太贵了.",
         "了 is close to Vietnamese 'rồi'. 我吃饭了 — I've eaten. 下雨了 — it has started raining. 我买了两本书 — I bought two books. But 了 is not a past tense: past habits take no 了 (我以前每天喝茶), nor do past sentences with 是, adjectives or 在 (昨天很冷). The negative is 没 + verb without 了: 我没吃. 太…了 means 'too': 太贵了."),
        [ex("我吃饭了。", "Tôi ăn cơm rồi.", "I've eaten."),
         ex("下雨了。", "Mưa rồi.", "It's raining now.", "tình hình mới", "a new situation"),
         ex("我买了两本书。", "Tôi đã mua hai quyển sách.", "I bought two books."),
         ex("我没吃。", "Tôi chưa ăn.", "I haven't eaten.", "phủ định: không có 了", "negative: no 了")],
        [("Câu hỏi \"đã … chưa?\" là 了吗 hay 了没有: 你吃饭了吗？", "'Have you … yet?' is 了吗 or 了没有: 你吃饭了吗？")],
        ("了 = rồi; 没 thì không có 了.", "了 = 'rồi'; never with 没."),
        ["aspect.le_guo_zai"])

concept("aspect-guo",
        ("过: đã từng", "过: have ever done"),
        ("Động từ + 过: đã từng làm (một lúc nào đó trong đời). Phủ định: 没 + động từ + 过.", "Verb + 过: have done it at some point. Negative: 没 + verb + 过."),
        ("过 (guo, thanh nhẹ) gần với \"từng\" của tiếng Việt: 我去过北京 — tôi từng đến Bắc Kinh. Nó nói về kinh nghiệm, không nói khi nào: 你吃过饺子吗？ — bạn đã từng ăn sủi cảo chưa? Phủ định giữ 过: 我没去过上海 — tôi chưa từng đến Thượng Hải. So với 了: 我去了北京 kể một chuyến đi cụ thể; 我去过北京 nói tôi có kinh nghiệm đó. Trong phỏng vấn: 我在工厂工作过 — tôi đã từng làm ở nhà máy.",
         "过 (neutral tone) is close to Vietnamese 'từng': 我去过北京 — I have been to Beijing. It tells of experience, not of when: 你吃过饺子吗？ Have you ever eaten dumplings? The negative keeps 过: 我没去过上海. Compared with 了: 我去了北京 reports one trip; 我去过北京 says I have that experience. At an interview: 我在工厂工作过 — I have worked in a factory."),
        [ex("我去过北京。", "Tôi từng đến Bắc Kinh.", "I have been to Beijing."),
         ex("你吃过饺子吗？", "Bạn đã từng ăn sủi cảo chưa?", "Have you ever had dumplings?"),
         ex("我没去过上海。", "Tôi chưa từng đến Thượng Hải.", "I have never been to Shanghai.", "没 + động từ + 过", "没 + verb + 过")],
        [("过 là thanh nhẹ trong nghĩa này; 过 trong 过年 (ăn Tết) đọc guò.", "过 is neutral in this sense; in 过年 it is guò.")],
        ("过 = từng.", "过 = 'ever'."),
        ["aspect.le_guo_zai"])

concept("aspect-zai-zhe",
        ("在 / 正在: đang; 着: trạng thái kéo dài", "在 / 正在: in progress; 着: an ongoing state"),
        ("在 hoặc 正在 trước động từ: đang làm (我在开会). 着 sau động từ: một trạng thái kéo dài (门开着).", "在 or 正在 before a verb: in progress (我在开会). 着 after a verb: a lasting state (门开着)."),
        ("Tiếng Việt nói \"đang\" trước động từ, tiếng Trung cũng vậy: 我在开会 — tôi đang họp; 他正在吃饭 — anh ấy đang ăn cơm (正在 nhấn mạnh \"ngay lúc này\"). Có thể thêm 呢 ở cuối: 我在开会呢. 着 (zhe) đứng sau động từ và tả trạng thái: 门开着 — cửa đang mở; 他穿着工作服 — anh ấy mặc đồng phục. Ở mức này bạn chỉ cần nhận ra 着 khi đọc. Phủ định của 在 + động từ là 没在: 我没在睡觉.",
         "Vietnamese puts 'đang' before the verb, and so does Chinese: 我在开会 — I'm in a meeting; 他正在吃饭 — he is eating right now (正在 stresses 'right now'). A final 呢 may follow: 我在开会呢. 着 (zhe) follows a verb and describes a state: 门开着 — the door is open; 他穿着工作服 — he is wearing his work clothes. At this level you only need to recognise 着 when reading. The negative of 在 + verb is 没在: 我没在睡觉."),
        [ex("我在开会。", "Tôi đang họp.", "I'm in a meeting."),
         ex("他正在吃饭。", "Anh ấy đang ăn cơm.", "He's eating right now."),
         ex("门开着。", "Cửa đang mở.", "The door is open.", "着: trạng thái", "着: a state")],
        [("在 + nơi chốn là \"ở\": 我在工厂. 在 + động từ là \"đang\": 我在工作.", "在 + a place means 'at': 我在工厂. 在 + a verb means 'be doing': 我在工作.")],
        ("在 + động từ = đang; động từ + 着 = đang ở trạng thái đó.", "在 + verb = doing now; verb + 着 = staying in that state."),
        ["aspect.le_guo_zai"])

# ---------------------------------------------------------------- modals, adjectives, comparison
concept("modals",
        ("想, 要, 会, 能, 可以", "想, 要, 会, 能, 可以"),
        ("想 muốn; 要 muốn, cần, sẽ; 会 biết (làm, đã học); 能 có thể (có khả năng); 可以 được phép.", "想 would like; 要 want, need, will; 会 can (learnt skill); 能 can (able); 可以 may."),
        ("Cả năm từ đứng trước động từ, như \"muốn\", \"biết\", \"có thể\" của tiếng Việt. 我想休息 — tôi muốn nghỉ (nhẹ nhàng). 我要一杯咖啡 — tôi lấy một cốc cà phê (dứt khoát hơn). 我会说汉语 — tôi biết nói tiếng Trung (đã học). 我今天不能上班 — hôm nay tôi không đi làm được (vì ốm, vì bận). 我可以进来吗？ — tôi vào được không? (xin phép). Phủ định: 不想, 不会, 不能, 不可以; phủ định của 要 (cần) thường là 不用.",
         "All five go before the verb, like Vietnamese 'muốn', 'biết', 'có thể'. 我想休息 — I'd like to rest (soft). 我要一杯咖啡 — I'll have a coffee (firmer). 我会说汉语 — I can speak Chinese (learnt). 我今天不能上班 — I can't work today (ill, busy). 我可以进来吗？ — may I come in? Negatives: 不想, 不会, 不能, 不可以; 'don't need to' is usually 不用."),
        [ex("我想休息。", "Tôi muốn nghỉ.", "I'd like to rest."),
         ex("我会说汉语。", "Tôi biết nói tiếng Trung.", "I can speak Chinese."),
         ex("我今天不能上班。", "Hôm nay tôi không đi làm được.", "I can't come to work today."),
         ex("我可以进来吗？", "Tôi vào được không?", "May I come in?")],
        [("不要 + động từ là \"đừng\": 不要动机器 — đừng động vào máy.", "不要 + verb means 'don't': 不要动机器.")],
        ("会: đã học; 能: làm được; 可以: được phép.", "会: learnt; 能: able; 可以: allowed."),
        ["modals.can_want"])

concept("hen-adjective",
        ("很 + tính từ, không có 是; 太…了, 有点儿", "很 + adjective, no 是; 太…了, 有点儿"),
        ("Tính từ làm vị ngữ không cần 是, thường có 很: 今天很冷. 太…了 là \"quá\"; 有点儿 là \"hơi\" (thường điều không vui).", "An adjective predicate takes no 是, usually 很: 今天很冷. 太…了 is 'too'; 有点儿 is 'a bit' (usually unwelcome)."),
        ("Tiếng Việt nói \"hôm nay lạnh\", không có \"là\"; tiếng Trung cũng vậy, nhưng thường thêm 很: 今天很冷. 很 ở đây nhẹ, không mạnh như \"rất\"; muốn nhấn mạnh thì dùng 非常 hay 真. Không bao giờ nói 他是高. 太…了 để than hay khen mạnh: 太贵了！ 太好了！ 有点儿 đứng trước tính từ khi điều đó hơi không vừa ý: 这个有点儿贵 — cái này hơi đắt. Phủ định: 不 + tính từ, bỏ 很: 不贵.",
         "Vietnamese says 'hôm nay lạnh' with no 'là'; Chinese too, usually with 很: 今天很冷. 很 is light here, not as strong as 'very'; for emphasis use 非常 or 真. Never say 他是高. 太…了 complains or praises strongly: 太贵了！ 太好了！ 有点儿 before an adjective marks something a little unwelcome: 这个有点儿贵. The negative is 不 + adjective without 很: 不贵."),
        [ex("今天很冷。", "Hôm nay lạnh.", "It's cold today.", "không có 是", "no 是"),
         ex("太贵了！", "Đắt quá!", "Too expensive!"),
         ex("这个有点儿贵。", "Cái này hơi đắt.", "This is a bit expensive."),
         ex("这个箱子不重。", "Cái thùng này không nặng.", "This box isn't heavy.")],
        [("Không có 很, một tính từ đơn thường mang ý so sánh: 这个大，那个小 — cái này to, cái kia nhỏ.", "Without 很, a bare adjective often contrasts: 这个大，那个小.")],
        ("Tính từ không đi với 是 — hãy thêm 很.", "No 是 before an adjective — add 很."),
        ["adjectives.hen_tai"])

concept("comparison-bi",
        ("So sánh với 比", "Comparing with 比"),
        ("A 比 B + tính từ: A hơn B. Không thêm 很 hay 非常 sau 比; muốn nói hơn nhiều thì thêm 多了 sau tính từ.", "A 比 B + adjective: A is more … than B. No 很 after 比; for 'much more' add 多了."),
        ("Tiếng Việt nói \"cái này to hơn cái kia\": tính từ trước, \"hơn\" sau. Tiếng Trung đặt 比 (hơn) giữa hai thứ rồi mới đến tính từ: 这个比那个大. Không nói 这个比那个很大; nói 这个比那个大多了 (to hơn nhiều) hay 大一点儿 (to hơn một chút). So sánh bằng: A 和 B 一样 + tính từ: 我和他一样高. Phủ định: A 没有 B + tính từ: 我没有他高 — tôi không cao bằng anh ấy.",
         "Vietnamese says 'this big more than that'. Chinese puts 比 between the two things, then the adjective: 这个比那个大. Not 这个比那个很大; say 大多了 (much bigger) or 大一点儿 (a bit bigger). Equal: A 和 B 一样 + adjective: 我和他一样高. Negative: A 没有 B + adjective: 我没有他高 — I'm not as tall as him."),
        [ex("这个比那个大。", "Cái này to hơn cái kia.", "This one is bigger than that one."),
         ex("地铁比公交车快。", "Tàu điện ngầm nhanh hơn xe buýt.", "The subway is faster than the bus."),
         ex("我和他一样高。", "Tôi cao bằng anh ấy.", "I'm as tall as him."),
         ex("今天比昨天冷多了。", "Hôm nay lạnh hơn hôm qua nhiều.", "Today is much colder than yesterday.")],
        [("比 không đứng cạnh 很, 非常, 太: chúng làm câu sai.", "比 never pairs with 很, 非常 or 太.")],
        ("A 比 B + tính từ.", "A 比 B + adjective."),
        ["adjectives.hen_tai"])

# ---------------------------------------------------------------- work and writing
concept("polite-work",
        ("Lịch sự ở chỗ làm: 您, 请, họ + chức vụ", "Politeness at work: 您, 请, surname + title"),
        ("Với cấp trên và khách: dùng 您 thay 你, thêm 请 khi nhờ, gọi họ + chức vụ: 王经理, 李组长.", "With superiors and customers: 您 instead of 你, 请 when asking, and surname + title: 王经理, 李组长."),
        ("Tiếng Việt thể hiện lịch sự bằng xưng hô (anh, chị, ạ). Tiếng Trung dùng 您 (nín) thay 你, thêm 请 trước lời nhờ (请等一下), và gọi người bằng họ + chức vụ: 王经理好！ 李组长，您好！ Với đồng nghiệp ngang tuổi gọi 小王, 小李; với người lớn tuổi 老王. Không gọi cấp trên bằng 你. Câu chào giữa đồng nghiệp: 辛苦了 (vất vả rồi). Khi xin nghỉ hay xin phép, thêm 可以…吗: 我可以请假吗？",
         "Vietnamese shows politeness through its address terms and a final polite particle. Chinese uses 您 (nín) for 你, puts 请 before a request (请等一下) and addresses people by surname + title: 王经理好！ 李组长，您好！ Same-age colleagues are 小王, 小李; older ones 老王. Never call a superior 你. Between colleagues: 辛苦了. To ask for leave or permission add 可以…吗: 我可以请假吗？"),
        [ex("王经理，您好！", "Chào quản lý Vương ạ!", "Hello, Manager Wang!"),
         ex("请等一下。", "Xin đợi một chút.", "Please wait a moment."),
         ex("辛苦了！", "Vất vả rồi!", "Thanks for your hard work!"),
         ex("我可以请假吗？", "Tôi xin nghỉ được không ạ?", "May I take leave?")],
        [("您 không có dạng số nhiều thông dụng: với nhiều người, nói 大家好 hay 你们好.", "您 has no common plural: to several people say 大家好 or 你们好.")],
        ("Cấp trên: 您 + 请 + chức vụ.", "Superiors: 您 + 请 + title."),
        ["politeness.register"])

concept("linking",
        ("Nối câu: 和, 但是, 然后, 因为…所以", "Linking: 和, 但是, 然后, 因为…所以"),
        ("和 chỉ nối hai danh từ. Nối hai câu dùng 但是 (nhưng), 然后 (sau đó), 因为…所以 (vì… nên).", "和 links nouns only. Link clauses with 但是 (but), 然后 (then), 因为…所以 (because… so)."),
        ("\"Và\" của tiếng Việt nối được mọi thứ; 和 thì chỉ nối danh từ hay đại từ: 我和我朋友, 米饭和菜. Hai việc nối tiếp nhau dùng 然后 hay 先…然后: 先吃饭，然后休息. Ý ngược dùng 但是: 我想去，但是没有时间. Lý do dùng 因为…所以, thường đi đôi, khác tiếng Việt hay bỏ một vế: 因为下雨，所以我没去. Cũng có thể chỉ dùng một trong hai.",
         "Vietnamese 'và' links anything; 和 links only nouns and pronouns: 我和我朋友, 米饭和菜. Actions in sequence take 然后 or 先…然后: 先吃饭，然后休息. Contrast takes 但是: 我想去，但是没有时间. Reasons take 因为…所以, often as a pair: 因为下雨，所以我没去. Either half may also stand alone."),
        [ex("我和我朋友", "tôi và bạn tôi", "my friend and I"),
         ex("先吃饭，然后休息。", "Ăn cơm trước, sau đó nghỉ.", "Eat first, then rest."),
         ex("我想去，但是没有时间。", "Tôi muốn đi, nhưng không có thời gian.", "I want to go, but I have no time."),
         ex("因为下雨，所以我没去。", "Vì trời mưa nên tôi không đi.", "Because it rained, I didn't go.")],
        [("Không dùng 和 để nối hai câu: không nói 我吃饭和看电视; nói 我吃饭，然后看电视.", "Never link two clauses with 和: say 我吃饭，然后看电视.")],
        ("和 = danh từ + danh từ.", "和 = noun + noun."),
        ["writing.phrases_sentences", "grammar.word_order"])

if problems:
    for p in problems:
        print(p, file=sys.stderr)
    raise SystemExit(f"{len(problems)} problem(s)")
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8", newline="\n") as f:
    for r in recs:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
print(len(recs), "concept cards")
