"""Concept cards of ja-vi: content/ja/_drafts/concepts/OUTPUT.jsonl.

Twenty-three cards cover the 18 points of plan/authoring/briefs/ja-vi.md §3 (point 5, the particles, is three cards;
points 6 and 11 are two each) plus family words and invitations, which Section 1 and unit b teach. No paradigm table:
the ja tables need morphology rows for every cell (scripts/lib/languages/ja.ts) and today's derivation tags only the
dictionary and ます forms, so verb forms are taught through these cards and fill-in items, not conjugationCloze.
Every Japanese example passes the same checks as the lessons (ja_text.Index). usage: python -I ja-concepts.py <repo root>
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from ja_text import Index, load_lexicon  # noqa: E402

ROOT = sys.argv[1]
OUT = f"{ROOT}/content/ja/_drafts/concepts/OUTPUT.jsonl"
COURSE = {"source": "original-japanese-course"}
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
        "id": f"ja:concept:{cid}",
        "title": {"vi": title[0], "en": title[1]},
        "shortRule": {"vi": short[0], "en": short[1]},
        "explanation": {"vi": expl[0], "en": expl[1]},
        "examples": examples,
        "exceptions": [{"vi": v, "en": e} for v, e in exceptions],
        "memoryHint": {"vi": hint[0], "en": hint[1]},
        "objectives": [f"ja.obj.{o}" for o in objectives],
        "sourceRefs": [COURSE],
    })


concept("kana",
        ("Hiragana và katakana", "Hiragana and katakana"),
        ("Mỗi chữ kana là một âm tiết; hiragana cho từ Nhật và đuôi ngữ pháp, katakana cho từ mượn.", "Each kana is a syllable; hiragana writes Japanese words and endings, katakana writes loanwords."),
        ("Tiếng Việt ghi âm bằng chữ cái; tiếng Nhật ghi bằng âm tiết: か là \"ka\", き là \"ki\". Hiragana viết từ thuần Nhật và phần đuôi ngữ pháp (ます, です, trợ từ). Katakana viết từ mượn và tên nước ngoài: コーヒー, グエン. Dấu ゛ làm âm đục: か → が. Chữ nhỏ ゃ, ゅ, ょ ghép với chữ trước: き + ゃ = きゃ. っ nhỏ là một nhịp ngắt, ー kéo dài nguyên âm trong katakana.",
         "Vietnamese writes sounds with letters; Japanese writes syllables: か is ka, き is ki. Hiragana writes native words and grammatical endings (ます, です, particles). Katakana writes loanwords and foreign names: コーヒー, グエン. The mark ゛ voices a sound: か → が. Small ゃ, ゅ, ょ join the kana before: き + ゃ = きゃ. A small っ is a short pause, and ー lengthens a vowel in katakana."),
        [ex("わたし", "tôi", "I", "toàn hiragana", "all hiragana"),
         ex("コーヒー", "cà phê", "coffee", "từ mượn: katakana, ー kéo dài âm", "a loanword: katakana, ー lengthens the vowel"),
         ex("きって", "con tem", "stamp", "っ nhỏ: ngắt một nhịp", "small っ: a one-beat pause"),
         ex("ベトナム", "Việt Nam", "Vietnam")],
        [("は và へ khi là trợ từ đọc là わ và え: わたしは, 会社へ.", "As particles, は and へ are read わ and え: わたしは, 会社へ."),
         ("を chỉ dùng làm trợ từ và đọc như お.", "を is used only as a particle and sounds like お.")],
        ("Hiragana mềm, tròn; katakana thẳng, góc cạnh.", "Hiragana is round and soft; katakana is straight and angular."),
        ["script.kana", "writing.kana_input"])

concept("kanji-hanviet",
        ("Kanji và âm Hán-Việt", "Kanji and Sino-Vietnamese readings"),
        ("Nhiều từ kanji đọc gần âm Hán-Việt: nhớ âm Hán-Việt giúp đoán nghĩa, nhưng hãy cẩn thận với \"bạn giả\".", "Many kanji words sound close to their Sino-Vietnamese reading, which helps guess the meaning; beware of false friends."),
        ("Kanji là chữ Hán. Tiếng Việt có hàng nghìn từ Hán-Việt, nên nhiều từ Nhật nghe quen: 電話 (でんわ, điện thoại), 会社 (かいしゃ, hội xã — công ty), 安全 (あんぜん, an toàn). Âm Nhật không giống hẳn, chỉ gần. Từ thuần Nhật viết bằng kanji thì không đọc theo âm này: 山 là やま, 水 là みず. Có \"bạn giả\": 工場 là nhà máy chứ không phải công trường, 勉強 là học chứ không phải miễn cưỡng.",
         "Kanji are Chinese characters. Vietnamese has thousands of Sino-Vietnamese words, so many Japanese words sound familiar: 電話 (telephone), 会社 (company) and 安全 (safety) are close to their Sino-Vietnamese readings. The sounds are close, not the same. Native Japanese words written in kanji do not follow these readings: 山 is やま, 水 is みず. Watch the false friends: 工場 is a factory, not a building site; 勉強 means studying, not reluctance."),
        [ex("電話", "điện thoại", "telephone", "điện thoại — rất gần", "very close to the Sino-Vietnamese reading"),
         ex("安全", "an toàn", "safety", "an toàn — gần", "close to the Sino-Vietnamese reading"),
         ex("工場", "nhà máy", "factory", "\"công trường\" là bạn giả", "'công trường' is a false friend"),
         ex("勉強", "việc học", "study", "không phải \"miễn cưỡng\"", "not 'reluctance'"),
         ex("山", "núi", "mountain", "từ thuần Nhật: やま, không theo âm Hán-Việt", "a native word: やま, no Sino-Vietnamese reading")],
        [("Âm Hán-Việt chỉ giúp với từ đọc theo âm Hán (on). Từ một chữ thường đọc theo âm Nhật (kun) và không giống tiếng Việt.", "The reading helps only with on-readings. A one-kanji word is usually read the Japanese way (kun) and sounds nothing like Vietnamese.")],
        ("Đoán nghĩa bằng âm Hán-Việt, rồi kiểm tra lại.", "Guess with the Sino-Vietnamese reading, then check."),
        ["script.kanji_hanviet", "strategy.hanviet_loanwords"])

concept("katakana-loanwords",
        ("Từ mượn katakana", "Katakana loanwords"),
        ("Từ mượn, thường từ tiếng Anh, viết bằng katakana và đọc theo âm Nhật: mỗi phụ âm đi kèm một nguyên âm.", "Loanwords, mostly from English, are written in katakana and said the Japanese way: each consonant takes a vowel."),
        ("Tiếng Việt mượn \"cà phê\" từ tiếng Pháp; tiếng Nhật mượn コーヒー từ tiếng Anh. Âm tiếng Nhật hầu như không có phụ âm cuối, nên phụ âm được thêm nguyên âm: bus → バス, bread → パン (từ tiếng Bồ Đào Nha). Đọc to từ katakana rồi nghĩ đến tiếng Anh: テレビ là TV, パソコン là máy tính cá nhân. Tên người Việt cũng viết bằng katakana: グエン, ナム.",
         "Vietnamese borrowed 'cà phê' from French; Japanese borrowed コーヒー from English. Japanese has almost no final consonants, so a vowel is added: bus → バス, and パン (bread) comes from Portuguese. Read a katakana word aloud and think of English: テレビ is TV, パソコン is a personal computer. Vietnamese names are written in katakana too: グエン, ナム."),
        [ex("バス", "xe buýt", "bus"),
         ex("テレビ", "ti vi", "TV", "rút gọn từ television", "short for television"),
         ex("パソコン", "máy tính", "computer", "personal computer rút gọn", "short for personal computer"),
         ex("コンビニ", "cửa hàng tiện lợi", "convenience store")],
        [("Một số từ katakana không đến từ tiếng Anh: パン (bánh mì) từ tiếng Bồ Đào Nha, アルバイト từ tiếng Đức.", "Some katakana words are not English: パン comes from Portuguese.")],
        ("Đọc to, nghe ra tiếng Anh.", "Say it aloud and hear the English."),
        ["strategy.hanviet_loanwords", "script.kana"])

concept("length-pitch",
        ("Trường âm, âm ngắt và cao độ", "Long vowels, the small っ and pitch"),
        ("Độ dài âm đổi nghĩa: おばさん khác おばあさん, きて khác きって. Cao độ lên xuống, không phải thanh điệu.", "Length changes meaning: おばさん vs おばあさん, きて vs きって. Pitch goes up and down; it is not a tone."),
        ("Mỗi âm tiết kana dài bằng một nhịp. Nguyên âm dài chiếm hai nhịp: おばあさん (bà) có năm nhịp, おばさん (cô) có bốn. っ nhỏ là một nhịp im lặng: きって (tem). ん cũng là một nhịp riêng. Tiếng Việt có sáu thanh trên mỗi âm tiết; tiếng Nhật chỉ có cao và thấp giữa các nhịp, nên đừng gắn dấu thanh tiếng Việt vào từ Nhật.",
         "Every kana is one beat long. A long vowel takes two beats: おばあさん (grandmother) has five beats, おばさん (aunt) four. Small っ is a silent beat: きって (stamp). ん is a beat of its own too. Vietnamese has six tones on each syllable; Japanese only has high and low between beats, so do not put Vietnamese tones on Japanese words."),
        [ex("おばさん", "cô, dì", "aunt", "bốn nhịp", "four beats"),
         ex("おばあさん", "bà", "grandmother", "năm nhịp: あ kéo dài", "five beats: a long あ"),
         ex("切手", "con tem", "stamp", "きって: có っ", "きって: with っ"),
         ex("ビール", "bia", "beer", "ー kéo dài: ビ-ー-ル", "ー lengthens the vowel")],
        [("Trong hiragana, nguyên âm dài viết thêm một chữ: おう, えい thường đọc là ô dài, ê dài: がっこう, せんせい.", "In hiragana a long vowel adds a kana: おう and えい usually sound like long o and long e: がっこう, せんせい.")],
        ("Đếm nhịp bằng ngón tay khi đọc.", "Count the beats on your fingers."),
        ["pronunciation.length_pitch"])

concept("greetings",
        ("Chào theo giờ và tình huống", "Greetings by time and situation"),
        ("Lời chào đổi theo buổi và theo chỗ: おはようございます buổi sáng, こんにちは ban ngày, お疲れさまです ở chỗ làm.", "Greetings change with the time and the place: おはようございます in the morning, こんにちは by day, お疲れさまです at work."),
        ("Tiếng Việt chào kèm lời gọi: chào anh, chào chị. Tiếng Nhật không cần đại từ, nhưng chọn câu theo giờ và tình huống. Ở chỗ làm, おはようございます dùng khi bắt đầu ca, kể cả ca chiều. お疲れさまです là câu chào đồng nghiệp trong ngày. すみません vừa là xin lỗi, vừa là \"xin phép\" khi gọi ai đó. ありがとうございます lịch sự hơn ありがとう.",
         "Vietnamese greets with a form of address: chào anh, chào chị. Japanese needs no pronoun but picks the phrase by time and situation. At work, おはようございます starts a shift, even an afternoon one. お疲れさまです greets colleagues during the day. すみません is both 'sorry' and 'excuse me' to get attention. ありがとうございます is more polite than ありがとう."),
        [ex("おはようございます。", "Chào buổi sáng.", "Good morning."),
         ex("お疲れさまです。", "Anh chị vất vả rồi.", "Thanks for your hard work.", "chào đồng nghiệp", "a greeting between colleagues"),
         ex("すみません、トイレはどこですか。", "Xin lỗi, nhà vệ sinh ở đâu?", "Excuse me, where is the toilet?"),
         ex("ありがとうございます。", "Cảm ơn.", "Thank you.")],
        [("Với cấp trên và khách, dùng dạng dài: ありがとうございます, không nói ありがとう.", "With superiors and customers use the long form ありがとうございます, not ありがとう.")],
        ("Không chắc thì chọn câu dài hơn: dài là lịch sự.", "When unsure, pick the longer phrase: longer is more polite."),
        ["greetings.basic", "politeness.levels"])

concept("noun-desu",
        ("Câu danh từ: AはBです", "Noun sentences: A は B です"),
        ("A là B: AはBです. Phủ định: じゃありません. Quá khứ: でした. Thêm か là thành câu hỏi.", "A is B: A は B です. Negative じゃありません, past でした; add か for a question."),
        ("Tiếng Việt đặt \"là\" giữa câu; tiếng Nhật đặt です ở cuối: わたしは学生です. です làm câu lịch sự. Phủ định đổi です thành じゃありません (viết trang trọng là ではありません). Quá khứ là でした. Câu hỏi chỉ cần thêm か vào cuối, không đổi trật tự từ. Tiếng Nhật không có \"một\" như a/an: 会社員です là \"tôi là nhân viên công ty\".",
         "Vietnamese puts 'là' in the middle; Japanese puts です at the end: わたしは学生です. です makes the sentence polite. The negative changes です to じゃありません (in writing ではありません). The past is でした. A question just adds か at the end, with no change of word order. Japanese has no word like 'a': 会社員です means 'I am an office worker'."),
        [ex("わたしは学生です。", "Tôi là sinh viên.", "I am a student."),
         ex("わたしは先生じゃありません。", "Tôi không phải là giáo viên.", "I am not a teacher."),
         ex("昨日は休みでした。", "Hôm qua là ngày nghỉ.", "Yesterday was a day off."),
         ex("ナムさんは会社員ですか。", "Anh Nam là nhân viên công ty à?", "Is Nam an office worker?")],
        [("Không thêm さん sau tên mình: わたしはナムです, không nói ナムさんです.", "Never add さん to your own name.")],
        ("です ở cuối, giống dấu chấm của câu lịch sự.", "です sits at the end, like the full stop of a polite sentence."),
        ["sentences.noun_desu"])

concept("sov-subject",
        ("Động từ ở cuối câu, chủ ngữ hay được bỏ", "Verb last, subject often dropped"),
        ("Trật tự thường là: ai は — khi nào — ở đâu で — cái gì を — động từ. Khi đã rõ ai làm, bỏ chủ ngữ.", "The usual order is: who は — when — where で — what を — verb. Drop the subject once it is clear."),
        ("Tiếng Việt nói \"Tôi ăn bánh mì\": chủ ngữ, động từ, tân ngữ. Tiếng Nhật đặt động từ ở cuối: パンを食べます. Trợ từ cho biết vai trò của từ, nên phần trước động từ có thể đổi chỗ. Khi người nghe đã biết ai làm, tiếng Nhật bỏ chủ ngữ: 六時に起きます. Tiếng Việt cũng nói được \"Sáu giờ dậy\", nên điều này không lạ.",
         "Vietnamese says 'I eat bread' in that order: subject, verb, object. Japanese puts the verb last: パンを食べます. Particles mark each word's role, so the parts before the verb can move. When the listener knows who acts, Japanese drops the subject: 六時に起きます. Vietnamese can leave out the subject in the same way."),
        [ex("パンを食べます。", "(Tôi) ăn bánh mì.", "(I) eat bread.", "động từ ở cuối", "the verb comes last"),
         ex("毎日、会社で働きます。", "Ngày nào tôi cũng làm việc ở công ty.", "I work at the company every day."),
         ex("明日、病院へ行きます。", "Mai tôi đi bệnh viện.", "Tomorrow I am going to the hospital.", "không có わたしは", "no わたしは")],
        [("Khi giới thiệu bản thân hay so sánh, vẫn nói わたしは: わたしはベトナム人です.", "To introduce yourself or to contrast, keep わたしは.")],
        ("Nghe đến cuối câu mới biết làm gì.", "Wait for the end of the sentence to hear the action."),
        ["particles.core", "writing.phrases_sentences"])

concept("wa-ga",
        ("は và が", "は and が"),
        ("は nêu chủ đề đang nói tới; が chỉ chủ ngữ trong các mẫu cố định: あります, います, 好き, 誰が.", "は marks the topic; が marks the subject in set patterns: あります, います, 好き, 誰が."),
        ("Tiếng Việt không có trợ từ, chỉ dựa vào trật tự từ. は (đọc là わ) giới thiệu cái mình đang nói tới: わたしは学生です. が dùng trong những mẫu bạn học thuộc: 部屋にテレビがあります, 日本の料理が好きです, 頭が痛いです. Khi hỏi \"ai\", \"cái gì\" làm chủ ngữ thì dùng が: 誰が来ましたか. Ở mức sơ cấp, hãy học mẫu câu cùng trợ từ của nó.",
         "Vietnamese has no particles and relies on word order. は (read わ) introduces what you are talking about: わたしは学生です. が belongs to patterns you learn whole: 部屋にテレビがあります, 日本の料理が好きです, 頭が痛いです. A question word as the subject takes が: 誰が来ましたか. At this level, learn each pattern with its particle."),
        [ex("わたしはグエンです。", "Tôi là Nguyễn.", "I am Nguyen.", "は: chủ đề", "は: the topic"),
         ex("部屋にテレビがあります。", "Trong phòng có ti vi.", "There is a TV in the room.", "あります đi với が", "あります takes が"),
         ex("日本の料理が好きです。", "Tôi thích món ăn Nhật.", "I like Japanese food.", "好き đi với が", "好き takes が"),
         ex("誰が来ましたか。", "Ai đã đến?", "Who came?", "từ để hỏi làm chủ ngữ: が", "a question word as subject: が")],
        [("Trong câu phủ định và câu so sánh, が thường đổi thành は: テレビはありません.", "In negatives and contrasts, が often becomes は: テレビはありません.")],
        ("は = \"còn về…\"; が = mẫu câu cố định.", "は = 'as for…'; が = a set pattern."),
        ["particles.core"])

concept("particle-o",
        ("を: đánh dấu tân ngữ", "を: the object"),
        ("を đứng sau thứ bị tác động: パンを食べます. Đọc như お.", "を follows what the action is done to: パンを食べます. It sounds like お."),
        ("Tiếng Việt biết tân ngữ nhờ vị trí sau động từ: ăn bánh mì. Tiếng Nhật đánh dấu tân ngữ bằng を và đặt động từ sau nó: パンを食べます, 水を飲みます, 日本語を勉強します. を viết bằng chữ riêng nhưng đọc như お. Một số động từ chỉ việc đi qua một nơi cũng dùng を: 道を渡ります.",
         "Vietnamese shows the object by its place after the verb. Japanese marks it with を and puts the verb after it: パンを食べます, 水を飲みます, 日本語を勉強します. を has its own kana but sounds like お. Verbs of passing through a place take を too: 道を渡ります."),
        [ex("水を飲みます。", "Tôi uống nước.", "I drink water."),
         ex("日本語を勉強します。", "Tôi học tiếng Nhật.", "I study Japanese."),
         ex("ボタンを押してください。", "Hãy ấn nút.", "Please press the button."),
         ex("道を渡ります。", "Tôi băng qua đường.", "I cross the road.", "đi qua một nơi: を", "passing through a place: を")],
        [("Thích, hiểu, có dùng が chứ không dùng を: 日本語がわかります, 音楽が好きです.", "Like, understand and have take が, not を: 日本語がわかります.")],
        ("を = cái bị ăn, bị uống, bị làm.", "を = what is eaten, drunk, done."),
        ["particles.core", "verbs.masu_forms"])

concept("particles-ni-de-he",
        ("に, で, へ: giờ, nơi chốn, hướng", "に, で, へ: time, place, direction"),
        ("に: giờ cụ thể, nơi có ai/cái gì, nơi đến. で: nơi diễn ra hành động, phương tiện. へ: hướng đi.", "に: a clock time, where something is, a destination. で: where an action happens, the means. へ: the direction."),
        ("Tiếng Việt dùng \"ở\" cho cả \"ở nhà máy có nhiều máy\" và \"làm việc ở nhà máy\". Tiếng Nhật tách ra: 工場に機械があります (に: nơi có), 工場で働きます (で: nơi làm). に cũng chỉ giờ: 七時に起きます; và nơi đến: 日本に来ました. へ (đọc là え) chỉ hướng đi: 会社へ行きます; với 行く, 来る, 帰る, に và へ đều được. で còn chỉ phương tiện: バスで行きます. Từ chỉ thời gian tương đối như 今日, 明日, 毎日 không đi với に.",
         "Vietnamese uses 'ở' for both 'there are machines at the factory' and 'I work at the factory'. Japanese splits them: 工場に機械があります (に: where it is), 工場で働きます (で: where it happens). に also marks a clock time, 七時に起きます, and a destination, 日本に来ました. へ (read え) marks direction, 会社へ行きます; with 行く, 来る and 帰る both に and へ work. で also marks the means: バスで行きます. Relative time words such as 今日, 明日, 毎日 take no に."),
        [ex("7時に起きます。", "Tôi dậy lúc bảy giờ.", "I get up at seven.", "giờ cụ thể: に", "a clock time: に"),
         ex("工場で働きます。", "Tôi làm việc ở nhà máy.", "I work at a factory.", "nơi hành động: で", "where the action happens: で"),
         ex("会社へ行きます。", "Tôi đi đến công ty.", "I go to the company.", "hướng: へ", "direction: へ"),
         ex("バスで駅へ行きます。", "Tôi đi xe buýt đến ga.", "I go to the station by bus.", "phương tiện: で", "the means: で"),
         ex("毎日、日本語を勉強します。", "Ngày nào tôi cũng học tiếng Nhật.", "I study Japanese every day.", "毎日 không có に", "毎日 takes no に")],
        [("乗ります đi với に: 電車に乗ります. Xuống thì dùng を: 電車を降ります.", "乗ります takes に: 電車に乗ります. Getting off takes を: 電車を降ります.")],
        ("に: điểm (giờ, chỗ đứng, đích). で: sân khấu của hành động.", "に: a point (time, spot, goal). で: the stage of an action."),
        ["particles.core", "verbs.masu_forms"])

concept("particles-no-to-mo",
        ("の, と, も, や, から, まで", "の, と, も, や, から, まで"),
        ("の nối hai danh từ (của); と và や là \"và\"; も là \"cũng\" và thay cho は, が, を; から/まで là từ/đến.", "の links nouns (of); と and や are 'and'; も is 'also' and replaces は, が, を; から/まで are from/to."),
        ("Tiếng Việt nói \"tên của tôi\"; tiếng Nhật đặt người sở hữu trước: わたしの名前. と nối đủ các thứ được kể: パンと牛乳; や chỉ kể vài thứ trong số nhiều thứ: パンや果物. と còn là \"cùng với\": 友達と行きます. も là \"cũng\" và đứng ở chỗ của は: わたしもベトナム人です. から là \"từ\", まで là \"đến\": 九時から五時まで.",
         "Vietnamese says 'tên của tôi'; Japanese puts the owner first: わたしの名前. と joins a full list, パンと牛乳; や names a few of many, パンや果物. と also means 'with': 友達と行きます. も means 'also' and takes the place of は: わたしもベトナム人です. から is 'from' and まで 'to': 九時から五時まで."),
        [ex("わたしの名前はナムです。", "Tên tôi là Nam.", "My name is Nam.", "người sở hữu đứng trước の", "the owner comes before の"),
         ex("パンと牛乳を買います。", "Tôi mua bánh mì và sữa.", "I buy bread and milk."),
         ex("友達と映画を見ます。", "Tôi xem phim với bạn.", "I watch a film with a friend.", "と: cùng với", "と: with"),
         ex("わたしもベトナム人です。", "Tôi cũng là người Việt Nam.", "I am Vietnamese too.", "も thay cho は", "も replaces は"),
         ex("9時から5時まで働きます。", "Tôi làm từ chín giờ đến năm giờ.", "I work from nine to five.")],
        [("も không đứng cạnh は hay を: nói わたしも, không nói わたしはも.", "も never stands next to は or を: わたしも, not わたしはも.")],
        ("の = \"của\" nhưng đảo ngược: わたしの = của tôi.", "の = 'of', reversed: わたしの = my."),
        ["particles.core"])

concept("questions",
        ("Câu hỏi với か và từ để hỏi", "Questions with か and question words"),
        ("Thêm か vào cuối câu là thành câu hỏi. Từ để hỏi đứng đúng chỗ của câu trả lời.", "Add か at the end to ask. The question word stands where the answer will go."),
        ("Tiếng Việt thêm \"không\", \"à\" ở cuối câu; tiếng Nhật thêm か: 学生ですか. Trật tự từ không đổi. Từ để hỏi đứng ở chỗ câu trả lời sẽ đứng: トイレはどこですか — トイレはあそこです. Hay gặp: 何 (cái gì), どこ (ở đâu), いつ (khi nào), 誰 (ai), いくら (bao nhiêu tiền), いくつ (mấy cái), 何時 (mấy giờ). Câu hỏi viết bằng chữ Nhật thường kết thúc bằng 。, không cần dấu ?.",
         "Vietnamese adds 'không' or 'à' at the end; Japanese adds か: 学生ですか. The word order stays the same. A question word stands where the answer will stand: トイレはどこですか — トイレはあそこです. Common ones: 何 (what), どこ (where), いつ (when), 誰 (who), いくら (how much), いくつ (how many), 何時 (what time). A written Japanese question usually ends with 。, not ?."),
        [ex("これはなんですか。", "Đây là cái gì?", "What is this?", "何 trước です đọc là なん", "何 before です is read なん"),
         ex("駅はどこですか。", "Ga ở đâu?", "Where is the station?"),
         ex("誕生日はいつですか。", "Sinh nhật bạn là khi nào?", "When is your birthday?"),
         ex("このかばんはいくらですか。", "Cái túi này bao nhiêu tiền?", "How much is this bag?")],
        [("Trả lời câu hỏi có/không bằng はい hoặc いいえ, rồi lặp lại động từ hoặc です: はい、学生です.", "Answer a yes/no question with はい or いいえ and repeat the verb or です: はい、学生です.")],
        ("か ở cuối = dấu hỏi nói thành tiếng.", "か at the end is a spoken question mark."),
        ["questions.question_words"])

concept("kosoado",
        ("これ, それ, あれ, どれ", "これ, それ, あれ, どれ"),
        ("こ: gần người nói; そ: gần người nghe; あ: xa cả hai; ど: hỏi. これ đứng một mình, この đứng trước danh từ.", "こ: near me; そ: near you; あ: far from both; ど: asks. これ stands alone, この comes before a noun."),
        ("Tiếng Việt có \"này, đó, kia\"; tiếng Nhật có bốn bộ theo cùng một khuôn. これ, それ, あれ, どれ là cái này, cái đó, cái kia, cái nào. この, その, あの, どの đi trước danh từ: この本. ここ, そこ, あそこ, どこ là chỗ này, chỗ đó, đằng kia, ở đâu. こちら, そちら, あちら, どちら là cách nói lịch sự về phía hay người.",
         "Vietnamese has 'này, đó, kia'; Japanese has four sets built the same way. これ, それ, あれ, どれ are this one, that one, that one over there, which one. この, その, あの, どの come before a noun: この本. ここ, そこ, あそこ, どこ are here, there, over there, where. こちら, そちら, あちら, どちら are the polite words for directions or people."),
        [ex("これはわたしのかばんです。", "Đây là cái túi của tôi.", "This is my bag."),
         ex("そのかさはいくらですか。", "Cái ô đó bao nhiêu tiền?", "How much is that umbrella?", "その đứng trước danh từ", "その comes before a noun"),
         ex("トイレはあそこです。", "Nhà vệ sinh ở đằng kia.", "The toilet is over there."),
         ex("こちらはやまださんです。", "Đây là anh Yamada.", "This is Mr Yamada.", "giới thiệu người: こちら", "introducing someone: こちら")],
        [("Không nói この một mình: この本 là đúng, \"これ本\" là sai.", "この never stands alone: この本, not これ本.")],
        ("こ-そ-あ-ど: này, đó, kia, nào.", "ko-so-a-do: this, that, that over there, which."),
        ["questions.question_words", "vocab.everyday_basics"])

concept("masu-form",
        ("Động từ thể ます", "Polite verbs: the ます form"),
        ("ます: làm (bây giờ hoặc sẽ); ません: không làm; ました: đã làm; ませんでした: đã không làm.", "ます: do (now or later); ません: don't; ました: did; ませんでした: didn't."),
        ("Tiếng Việt thêm \"đã\", \"không\", \"sẽ\" trước động từ; tiếng Nhật đổi đuôi động từ. 行きます là \"đi\" và cả \"sẽ đi\": ngữ cảnh cho biết. 行きません là không đi, 行きました là đã đi, 行きませんでした là đã không đi. Đây là cách nói lịch sự, dùng với người mới gặp, ở chỗ làm và với khách. Từ điển ghi dạng gốc (行く); khi nói lịch sự, bạn dùng dạng ます.",
         "Vietnamese adds 'đã', 'không', 'sẽ' before the verb; Japanese changes the verb's ending. 行きます means 'go' and also 'will go': the context tells. 行きません is don't go, 行きました went, 行きませんでした didn't go. This is the polite style, for new people, work and customers. Dictionaries list the plain form (行く); in polite speech you use the ます form."),
        [ex("明日、会社へ行きます。", "Mai tôi đi làm.", "I will go to work tomorrow.", "ます cũng là tương lai", "ます also covers the future"),
         ex("お酒を飲みません。", "Tôi không uống rượu.", "I don't drink alcohol."),
         ex("昨日、映画を見ました。", "Hôm qua tôi đã xem phim.", "I watched a film yesterday."),
         ex("今朝、ご飯を食べませんでした。", "Sáng nay tôi đã không ăn cơm.", "I didn't eat breakfast this morning.")],
        [("ありません là phủ định của あります; ありませんでした là quá khứ của nó.", "ありません is the negative of あります; ありませんでした its past.")],
        ("ます–ません–ました–ませんでした: bốn đuôi cho mọi động từ.", "ます–ません–ました–ませんでした: four endings for every verb."),
        ["verbs.masu_forms"])

concept("verb-groups",
        ("Ba nhóm động từ", "The three verb groups"),
        ("Nhóm 1 đổi âm cuối sang hàng い (行く → 行きます); nhóm 2 bỏ る (食べる → 食べます); nhóm 3: する, 来る.", "Group 1 moves the last kana to the i-row (行く → 行きます); group 2 drops る (食べる → 食べます); group 3: する, 来る."),
        ("Mọi động từ ở dạng gốc kết thúc bằng âm hàng う. Nhóm 1: đổi âm cuối sang hàng い rồi thêm ます: 飲む → 飲みます, 買う → 買います, 帰る → 帰ります. Nhóm 2 thường kết thúc bằng -える hoặc -いる: bỏ る rồi thêm ます: 食べる → 食べます, 起きる → 起きます. Nhóm 3 chỉ có hai động từ: する → します, 来る → 来ます (きます). Danh từ + する cũng thuộc nhóm 3: 勉強します. Một số động từ trông như nhóm 2 nhưng thuộc nhóm 1: 帰る, 入る, 走る, 切る.",
         "Every plain verb ends in a u-row kana. Group 1: move the last kana to the i-row and add ます: 飲む → 飲みます, 買う → 買います, 帰る → 帰ります. Group 2 usually ends in -eru or -iru: drop る and add ます: 食べる → 食べます, 起きる → 起きます. Group 3 has just two verbs: する → します, 来る → 来ます (きます). Noun + する belongs here too: 勉強します. Some verbs look like group 2 but are group 1: 帰る, 入る, 走る, 切る."),
        [ex("飲みます", "uống", "drink", "nhóm 1: む → み", "group 1: む → み"),
         ex("帰ります", "về", "go home", "nhóm 1 dù kết thúc bằng える", "group 1 although it ends in -eru"),
         ex("食べます", "ăn", "eat", "nhóm 2: bỏ る", "group 2: drop る"),
         ex("来ます", "đến", "come", "nhóm 3: đọc là きます", "group 3: read きます"),
         ex("勉強します", "học", "study", "danh từ + します", "noun + します")],
        [("Khi học động từ mới, hãy học cả dạng ます: từ điển ghi 帰る, nhưng nói 帰ります.", "Learn each new verb with its ます form: the dictionary says 帰る, you say 帰ります.")],
        ("Học thuộc nhóm 3, nhớ vài ngoại lệ nhóm 1, còn lại theo quy tắc.", "Memorise group 3 and a few group 1 exceptions; the rest follows the rule."),
        ["verbs.masu_forms"])

concept("invitations",
        ("Rủ rê: ましょう và ませんか", "Invitations: ましょう and ませんか"),
        ("〜ませんか: mời lịch sự (bạn có… không?); 〜ましょう: cùng làm nhé.", "〜ませんか: a polite invitation (won't you…?); 〜ましょう: let's."),
        ("Tiếng Việt rủ bằng \"đi… không?\" hay \"cùng… nhé\". Tiếng Nhật dùng đuôi động từ: 一緒に昼ご飯を食べませんか (cùng ăn trưa không?) là lời mời nhẹ nhàng, để người kia dễ từ chối. 食べましょう (ăn thôi) là khi cả hai đã đồng ý, hoặc khi gợi ý cùng làm. Trả lời lời mời: いいですね (hay đấy) hoặc ちょっと… (hơi… — từ chối khéo).",
         "Vietnamese invites with '…không?' or 'cùng… nhé'. Japanese uses the verb ending: 一緒に昼ご飯を食べませんか (shall we have lunch?) is a soft invitation that is easy to refuse. 食べましょう (let's eat) is for when both agree or to propose doing it together. Answer with いいですね (sounds good) or ちょっと… (a gentle no)."),
        [ex("一緒に昼ご飯を食べませんか。", "Cùng ăn trưa không?", "Shall we have lunch together?"),
         ex("ええ、食べましょう。", "Ừ, ăn thôi.", "Yes, let's eat."),
         ex("明日はちょっと…。", "Mai thì hơi…", "Tomorrow is a bit…", "từ chối khéo", "a gentle refusal")],
        [("〜ませんか là phủ định về hình thức nhưng không phải phủ định: đó là lời mời.", "〜ませんか looks negative but is an invitation.")],
        ("ませんか = mời; ましょう = cùng làm.", "ませんか = invite; ましょう = together."),
        ["verbs.masu_forms", "interaction.everyday_conversation"])

concept("aru-iru",
        ("あります và います", "あります and います"),
        ("Đồ vật, cây cối: あります. Người, con vật: います. Mẫu: nơi に + vật/người が + あります/います.", "Things and plants: あります. People and animals: います. Pattern: place に + thing/person が + あります/います."),
        ("Tiếng Việt chỉ có một chữ \"có\". Tiếng Nhật chọn theo thứ được nói đến: 机の上に本があります (vật), 部屋に田中さんがいます (người), 公園に犬がいます (con vật). Nơi chốn đi với に, thứ tồn tại đi với が. Hỏi \"ở đâu\": 本はどこにありますか. あります còn là \"có, sở hữu\": 時間がありません (tôi không có thời gian).",
         "Vietnamese has just 'có'. Japanese chooses by what exists: 机の上に本があります (a thing), 部屋に田中さんがいます (a person), 公園に犬がいます (an animal). The place takes に, the thing that exists が. To ask where: 本はどこにありますか. あります also means to have: 時間がありません."),
        [ex("机の上にかばんがあります。", "Trên bàn có cái túi.", "There is a bag on the desk."),
         ex("部屋にナムさんがいます。", "Trong phòng có anh Nam.", "Nam is in the room."),
         ex("公園に犬がいます。", "Ở công viên có con chó.", "There is a dog in the park.", "con vật: います", "animals: います"),
         ex("今日は時間がありません。", "Hôm nay tôi không có thời gian.", "I have no time today.")],
        [("Cây, hoa là vật: あります. Rô-bốt, xe chạy được vẫn dùng あります.", "Trees and flowers are things: あります. A robot or a car still takes あります.")],
        ("Biết cử động theo ý mình: います. Còn lại: あります.", "Moves of its own will: います. Everything else: あります."),
        ["existence.aru_iru", "particles.core"])

concept("adjectives",
        ("Tính từ い và な", "い and な adjectives"),
        ("い: 大きいです, 大きくないです, 大きかったです. な: 静かです, 静かじゃありません, 静かな部屋.", "い: 大きいです, 大きくないです, 大きかったです. な: 静かです, 静かじゃありません, 静かな部屋."),
        ("Tiếng Việt đặt tính từ sau danh từ: phòng mới. Tiếng Nhật đặt trước: 新しい部屋. Tính từ い tự chia: phủ định bỏ い thêm くない (大きくないです), quá khứ thêm かった (大きかったです). Tính từ な giống danh từ: 静かです, 静かじゃありません, 静かでした; trước danh từ thêm な: 静かな部屋. Nối hai tính từ: 大きくて新しい, 静かできれい.",
         "Vietnamese puts the adjective after the noun; Japanese puts it before: 新しい部屋. い adjectives change themselves: the negative drops い and adds くない (大きくないです), the past adds かった (大きかったです). な adjectives behave like nouns: 静かです, 静かじゃありません, 静かでした, and take な before a noun: 静かな部屋. To join two: 大きくて新しい, 静かできれい."),
        [ex("新しい会社です。", "Đó là công ty mới.", "It is a new company.", "tính từ đứng trước", "the adjective comes first"),
         ex("この部屋は大きくないです。", "Phòng này không to.", "This room is not big."),
         ex("昨日は寒かったです。", "Hôm qua trời lạnh.", "It was cold yesterday."),
         ex("静かな部屋です。", "Đó là căn phòng yên tĩnh.", "It is a quiet room.", "な trước danh từ", "な before a noun")],
        [("いい chia thành よくないです, よかったです.", "いい becomes よくないです, よかったです."),
         ("きれい và 嫌い kết thúc bằng い nhưng là tính từ な: きれいな部屋.", "きれい and 嫌い end in い but are な adjectives: きれいな部屋.")],
        ("い tự chia; な mượn です.", "い changes itself; な borrows です."),
        ["adjectives.i_na"])

concept("numbers",
        ("Số đếm và tiền yên", "Numbers and yen"),
        ("Đếm theo vạn: 万 là 10.000, nên 20.000 là 二万. Giá viết số Ả Rập + 円: 350円.", "Japanese counts in ten-thousands: 万 is 10,000, so 20,000 is 二万. Prices are digits + 円: 350円."),
        ("Một đến mười: いち, に, さん, よん, ご, ろく, なな, はち, きゅう, じゅう. Số 4 và 7 có hai cách đọc; khi nói số điện thoại hay giá, dùng よん và なな cho rõ. Tiếng Việt đếm theo nghìn; tiếng Nhật đếm theo vạn: 一万 (10.000), 十万 (100.000). Vài số đổi âm: 三百 さんびゃく, 六百 ろっぴゃく, 八百 はっぴゃく, 三千 さんぜん. Giá tiền thường viết bằng số Ả Rập: 1500円.",
         "One to ten: いち, に, さん, よん, ご, ろく, なな, はち, きゅう, じゅう. 4 and 7 have two readings; for phone numbers and prices use よん and なな. Vietnamese counts in thousands; Japanese counts in ten-thousands: 一万 (10,000), 十万 (100,000). Some sounds change: 三百 さんびゃく, 六百 ろっぴゃく, 八百 はっぴゃく, 三千 さんぜん. Prices are usually written in digits: 1500円."),
        [ex("いくらですか。", "Bao nhiêu tiền?", "How much is it?"),
         ex("350円です。", "Ba trăm năm mươi yên.", "It is 350 yen."),
         ex("1万円", "mười nghìn yên", "ten thousand yen", "1万: một vạn", "1万: one ten-thousand"),
         ex("電話番号は090-1234-5678です。", "Số điện thoại là 090-1234-5678.", "The phone number is 090-1234-5678.", "đọc từng chữ số", "read digit by digit")],
        [("Số 0 trong số điện thoại đọc là ゼロ hoặc れい.", "0 in a phone number is ゼロ or れい.")],
        ("Bốn số không là một 万.", "Four zeros make one 万."),
        ["numbers.counters"])

concept("counters",
        ("Lượng từ: つ, 人, 枚, 個, 回", "Counters: つ, 人, 枚, 個, 回"),
        ("Số đi kèm lượng từ hợp với thứ được đếm, rồi đặt trước động từ: りんごを三つ買います.", "A number takes the counter that fits what is counted, then stands before the verb: りんごを三つ買います."),
        ("Tiếng Việt cũng có loại từ: cái, con, tờ. Tiếng Nhật đặt số và lượng từ sau tân ngữ, trước động từ: 切手を二枚ください. つ đếm đồ vật nói chung (một đến mười: 一つ, 二つ… 十 là とお). 人 đếm người: 一人 (ひとり), 二人 (ふたり), từ ba trở đi là số + にん. 枚 cho vật mỏng như vé, giấy, áo; 個 cho vật nhỏ, tròn; 回 cho số lần; 階 cho tầng. Hỏi số lượng: いくつ, 何人.",
         "Vietnamese has classifiers too: cái, con, tờ. Japanese puts the number and counter after the object, before the verb: 切手を二枚ください. つ counts things in general (一つ, 二つ…; ten is とお). 人 counts people: 一人 (ひとり), 二人 (ふたり), and from three on a number + にん. 枚 is for flat things such as tickets, paper, shirts; 個 for small round things; 回 for times; 階 for floors. To ask how many: いくつ, 何人."),
        [ex("りんごを三つください。", "Cho tôi ba quả táo.", "Three apples, please."),
         ex("切手を2枚ください。", "Cho tôi hai con tem.", "Two stamps, please.", "tem mỏng: 枚", "a stamp is flat: 枚"),
         ex("家族は何人ですか。", "Gia đình bạn có mấy người?", "How many people are in your family?"),
         ex("一人です。", "Một người.", "One person.", "ひとり, không phải いちにん", "ひとり, not いちにん")],
        [("Một người, hai người đọc riêng: ひとり, ふたり. Bốn người là よにん.", "One and two people are ひとり, ふたり; four people is よにん.")],
        ("Không biết lượng từ nào thì dùng つ cho đồ vật.", "When unsure, use つ for things."),
        ["numbers.counters"])

concept("time-dates",
        ("Giờ, thứ và ngày tháng", "Time, days and dates"),
        ("Giờ: số + 時, phút: số + 分, rưỡi: 半. Năm, tháng, ngày viết theo thứ tự năm → tháng → ngày.", "Time: number + 時, minutes: number + 分, half past: 半. Dates go year → month → day."),
        ("Tiếng Việt nói \"bảy giờ rưỡi\"; tiếng Nhật nói 七時半. Ba giờ đọc khác: 四時 よじ, 七時 しちじ, 九時 くじ. Thứ trong tuần gắn với một chữ: 月曜日 thứ hai, 火曜日 thứ ba… 日曜日 chủ nhật. Ngày mùng 1 đến 10 và ngày 20 có cách đọc riêng: ついたち, 二日 ふつか, 三日 みっか… 二十日 はつか. Tiếng Việt viết ngày trước; tiếng Nhật viết năm trước: 2002年5月14日.",
         "Vietnamese says 'bảy giờ rưỡi'; Japanese says 七時半. Three hours sound different: 四時 よじ, 七時 しちじ, 九時 くじ. Each weekday has a kanji: 月曜日 Monday, 火曜日 Tuesday… 日曜日 Sunday. Days 1 to 10 and the 20th have their own readings: ついたち, 二日 ふつか, 三日 みっか… 二十日 はつか. Vietnamese writes the day first; Japanese writes the year first: 2002年5月14日."),
        [ex("今、何時ですか。", "Bây giờ là mấy giờ?", "What time is it now?"),
         ex("7時半に起きます。", "Tôi dậy lúc bảy giờ rưỡi.", "I get up at half past seven."),
         ex("月曜日から金曜日まで働きます。", "Tôi làm từ thứ hai đến thứ sáu.", "I work from Monday to Friday."),
         ex("誕生日は五月です。", "Sinh nhật tôi vào tháng năm.", "My birthday is in May.")],
        [("Giờ cụ thể đi với に (7時に), nhưng 今日, 明日, 毎日 thì không.", "A clock time takes に (7時に), but 今日, 明日, 毎日 do not.")],
        ("Từ lớn đến nhỏ: năm, tháng, ngày, giờ.", "From big to small: year, month, day, hour."),
        ["vocab.time_calendar", "numbers.counters"])

concept("te-form",
        ("Thể て: hãy, đừng, đang", "The te form: please, don't, -ing"),
        ("〜てください: hãy làm; 〜ないでください: đừng làm; 〜ています: đang làm.", "〜てください: please do; 〜ないでください: please don't; 〜ています: be doing."),
        ("Nội quy và chỉ dẫn ở nhà máy hay dùng thể て. Nhóm 2 bỏ る thêm て: 食べて, 見て. Nhóm 1 đổi âm cuối: 書く → 書いて, 飲む → 飲んで, 待つ → 待って, 話す → 話して; 行く → 行って. Nhóm 3: して, 来て. 〜てください là \"hãy\", 〜ないでください là \"đừng\" (触らないでください). 〜ています như \"đang\" trong tiếng Việt: 雨が降っています. 〜てもいいですか là xin phép: 休んでもいいですか.",
         "Rules and instructions at a factory use the te form. Group 2 drops る and adds て: 食べて, 見て. Group 1 changes the last kana: 書く → 書いて, 飲む → 飲んで, 待つ → 待って, 話す → 話して; 行く → 行って. Group 3: して, 来て. 〜てください is 'please', 〜ないでください 'please don't' (触らないでください). 〜ています works like Vietnamese 'đang': 雨が降っています. 〜てもいいですか asks permission: 休んでもいいですか."),
        [ex("ヘルメットをかぶってください。", "Hãy đội mũ bảo hộ.", "Please wear a helmet."),
         ex("機械に触らないでください。", "Đừng chạm vào máy.", "Please don't touch the machine.", "đừng: ないでください", "don't: ないでください"),
         ex("今、雨が降っています。", "Bây giờ trời đang mưa.", "It is raining now."),
         ex("ここに座ってもいいですか。", "Tôi ngồi đây được không?", "May I sit here?")],
        [("〜ています còn chỉ trạng thái kéo dài: 大阪に住んでいます (tôi sống ở Osaka), 結婚しています (đã kết hôn).", "〜ています also marks a lasting state: 大阪に住んでいます, 結婚しています.")],
        ("て nối việc này với việc khác: hãy, đừng, đang, được không.", "て links an action to what follows: please, don't, -ing, may I."),
        ["verbs.te_form"])

concept("tai-suki",
        ("Muốn và thích: たい, 好き, 欲しい", "Want and like: たい, 好き, 欲しい"),
        ("Muốn làm: thân động từ + たいです. Thích: 〜が好きです. Muốn có: 〜が欲しいです.", "Want to do: verb stem + たいです. Like: 〜が好きです. Want a thing: 〜が欲しいです."),
        ("Tiếng Việt nói \"muốn đi\", \"thích cà phê\". Tiếng Nhật thêm たい vào thân động từ ます: 行きます → 行きたいです, 食べます → 食べたいです. Phủ định: 行きたくないです. Thích, ghét, giỏi, kém đi với が: コーヒーが好きです, 料理が上手です. Muốn có một vật: 車が欲しいです. Trong phỏng vấn, 日本で働きたいです là câu rất hay dùng.",
         "Vietnamese says 'muốn đi', 'thích cà phê'. Japanese adds たい to the ます stem: 行きます → 行きたいです, 食べます → 食べたいです. Negative: 行きたくないです. Like, dislike, good at and bad at take が: コーヒーが好きです, 料理が上手です. Wanting a thing: 車が欲しいです. In interviews, 日本で働きたいです is a common sentence."),
        [ex("日本で働きたいです。", "Tôi muốn làm việc ở Nhật.", "I want to work in Japan."),
         ex("音楽が好きです。", "Tôi thích âm nhạc.", "I like music.", "好き đi với が", "好き takes が"),
         ex("新しいスマホが欲しいです。", "Tôi muốn có điện thoại mới.", "I want a new smartphone."),
         ex("料理が上手ですね。", "Bạn nấu ăn giỏi nhỉ.", "You are good at cooking.")],
        [("Không dùng たい để mời người khác hay hỏi cấp trên: nói 〜ませんか thay cho \"anh muốn… không\".", "Do not use たい to invite or to ask a superior; use 〜ませんか instead.")],
        ("たい = muốn làm; 欲しい = muốn có; 好き = thích (đi với が).", "たい = want to do; 欲しい = want to have; 好き = like (with が)."),
        ["wants.tai_suki"])

concept("politeness",
        ("Lời lịch sự và lời thường", "Polite and plain speech"),
        ("Bạn nói です/ます với người lạ, ở chỗ làm và với khách. Lời thường (行く, 食べた) là cách bạn bè nói với nhau.", "Use です/ます with strangers, at work and with customers. Plain forms (行く, 食べた) are how friends talk."),
        ("Tiếng Việt thể hiện lịch sự bằng xưng hô (anh, chị, em) và \"ạ\". Tiếng Nhật thể hiện bằng đuôi câu: 行きます là lịch sự, 行く là thân mật. Dạng thường cũng là dạng trong từ điển. Ở bài này bạn chỉ cần nhận ra dạng thường: 行かない (không đi), 行った (đã đi). Nhân viên cửa hàng còn dùng kính ngữ như お持ちですか, ご利用ですか; bạn không cần nói như vậy, です/ます là đủ.",
         "Vietnamese shows politeness through forms of address (anh, chị, em) and 'ạ'. Japanese shows it in the sentence ending: 行きます is polite, 行く casual. The plain form is also the dictionary form. Here you only need to recognise it: 行かない (not go), 行った (went). Shop staff also use honorific forms such as お持ちですか; you need not speak like that, です/ます is enough."),
        [ex("明日、行きますか。", "Mai bạn có đi không?", "Are you going tomorrow?", "lịch sự", "polite"),
         ex("お持ちですか。", "Quý khách có mang theo không?", "Do you have it?", "kính ngữ của nhân viên", "staff honorific")],
        [("Với cấp trên, đừng chuyển sang lời thường dù họ nói thường với bạn.", "With a superior, keep です/ます even if they speak plainly to you.")],
        ("Không chắc thì cứ です/ます.", "When in doubt, です/ます."),
        ["politeness.levels"])

concept("family-terms",
        ("Gia đình mình và gia đình người", "My family, your family"),
        ("Nói về gia đình mình dùng từ khiêm tốn (父, 母); nói về gia đình người khác dùng từ kính trọng (お父さん, お母さん).", "For your own family use the humble words (父, 母); for someone else's use the respectful ones (お父さん, お母さん)."),
        ("Tiếng Việt dùng cùng một từ \"bố\" cho bố mình và bố bạn. Tiếng Nhật có hai bộ từ. Khi nói với người ngoài về gia đình mình: 父, 母, 兄, 姉. Khi nói về gia đình người khác: お父さん, お母さん, お兄さん, お姉さん. Em trai 弟 và em gái 妹 thì tách rõ, không gộp như \"em\" của tiếng Việt. Trong nhà, người Nhật cũng gọi bố mẹ mình là お父さん, お母さん.",
         "Vietnamese uses the same word 'bố' for your father and someone else's. Japanese has two sets. Talking to outsiders about your own family: 父, 母, 兄, 姉. Talking about someone else's: お父さん, お母さん, お兄さん, お姉さん. Younger brother 弟 and younger sister 妹 are always distinct, unlike Vietnamese 'em'. At home, Japanese also call their parents お父さん, お母さん."),
        [ex("父は会社員です。", "Bố tôi là nhân viên công ty.", "My father is an office worker.", "bố mình: 父", "my father: 父"),
         ex("お父さんはお元気ですか。", "Bố bạn có khoẻ không?", "How is your father?", "bố người khác: お父さん", "your father: お父さん"),
         ex("弟が一人います。", "Tôi có một em trai.", "I have one younger brother.")],
        [("Gọi trực tiếp bố mẹ mình trong nhà: お父さん, お母さん, không gọi là 父, 母.", "When you call your own parents at home, say お父さん, お母さん, not 父, 母.")],
        ("Có お…さん là nói về nhà người khác.", "With お…さん you are talking about someone else's family."),
        ["vocab.everyday_basics"])

if problems:
    for p in problems:
        print(p, file=sys.stderr)
    raise SystemExit(f"{len(problems)} problem(s)")
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8", newline="\n") as f:
    for r in recs:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
print(len(recs), "concept cards")
