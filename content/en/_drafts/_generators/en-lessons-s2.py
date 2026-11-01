"""en-vi section 2 lessons: articles and plurals, the verbs that change form, familiar words and traps, numbers and time, sounds and spelling.
Every lesson shows a concept card. a/an/the are drilled as fillBlank in sentences; articleSelect (AS) drills a against an by sound,
at the end of a lesson so that no earlier exercise id moves. Conjugation keys come from the committed paradigm tables.
Appends to lessons/OUTPUT.jsonl. usage: python -I en-lessons-s2.py <repo root>"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from en_lesson_lib import AS, C, F, H, J, M, MP, N, NX, T, TX, W, WT, Y, finish, lesson

ART = ["a", "an", "the", "some"]


def A(sentence, answer, vi):
    return F(sentence, answer, [x for x in ART if x != answer.lower()] if answer.islower() else [x.capitalize() for x in ART if x != answer.lower()], vi)


# ---------------------------------------------------------------- ua: articles and plurals
lesson("ua-l0", [
    C("articles"), A("I have ___ book.", "a", "Tôi có một quyển sách."), A("She eats ___ apple.", "an", "Cô ấy ăn một quả táo."), A("I wait for ___ hour.", "an", "Tôi đợi một tiếng đồng hồ."), A("She studies at ___ university.", "a", "Cô ấy học ở một trường đại học."), A("It is ___ old house.", "an", "Đó là một ngôi nhà cũ."), A("It is ___ new house.", "a", "Đó là một ngôi nhà mới."), W("Tôi có một quả táo.", "I have an apple.", ["a", "is"]), Y("một giờ đồng hồ", "an hour", "one hour", digits=False), Y("một quyển sách", "a book", "one book"), M("apple", "book", "hour", "university", "house"), AS("apple", "quả táo", "an"),
    AS("hour", "một giờ đồng hồ", "an"), AS("university", "trường đại học", "a"), AS("house", "ngôi nhà", "a"),
])
lesson("ua-l1", [
    C("articles"), T("door", ["window", "table", "key"]), A("I have a dog. ___ dog is small.", "The", "Tôi có một con chó. Con chó đó nhỏ."), A("Please close ___ door.", "the", "Làm ơn đóng cái cửa đó lại."), A("___ room is on the second floor.", "The", "Căn phòng ở tầng hai."), A("Open ___ window, please.", "the", "Làm ơn mở cái cửa sổ đó ra."), TX("The bathroom is next to the kitchen.", "Nhà vệ sinh ở cạnh nhà bếp.", ["Nhà bếp ở cạnh phòng ngủ.", "Nhà vệ sinh ở trong nhà bếp.", "Nhà bếp ở tầng hai."]), W("Chìa khóa ở trên bàn.", "The key is on the table.", ["a", "are"]), Y("Làm ơn đóng cửa lại.", "Please close the door.", "Close the door, please."), Y("Nhà bếp nhỏ.", "The kitchen is small.", "A small kitchen.", "The small kitchen.", "It is a small kitchen."), M("door", "window", "floor", "wall", "chair"),
    M("bathroom", "fridge", "kitchen", "wall", "key"),
])
lesson("ua-l2", [
    C("plurals"), F("I have two ___.", "boxes", ["box", "boxs", "the box"], "Tôi có hai cái hộp."), F("Hanoi and Hue are ___.", "cities", ["city", "citys", "a city"], "Hà Nội và Huế là những thành phố."), F("There are ten ___ here.", "people", ["person", "peoples", "a person"], "Ở đây có mười người."), F("I have three ___.", "children", ["child", "childs", "a child"], "Tôi có ba đứa con."), F("Two ___ are at the door.", "men", ["man", "mans", "a man"], "Hai người đàn ông đang ở cửa."), NX("Tôi có hai quyển sách.", "I have two books.", ["I have two book.", "I have a two books.", "I two books."]), F("___ keys are not mine.", "Those", ["That", "A", "An"], "Những chiếc chìa khóa kia không phải của tôi."), W("Những ngôi nhà này to.", "These houses are big.", ["This", "house", "is"]), Y("hai thành phố", "two cities"), Y("ba cái hộp", "three boxes"),
])
lesson("ua-l3", [
    C("plurals"), M("a few", "a little", "a lot of", "both", "more"), F("I need ___ money.", "some", ["a", "an", "two"], "Tôi cần một ít tiền."), F("Do you want ___ milk?", "some", ["a", "an", "two"], "Bạn có muốn một ít sữa không?"), F("How ___ money do you have?", "much", ["many", "a", "two"], "Bạn có bao nhiêu tiền?"), F("I have ___ friends in Hanoi.", "a few", ["a little", "much", "a"], "Tôi có một vài người bạn ở Hà Nội."), F("I have ___ water.", "a little", ["a few", "many", "a"], "Tôi có một chút nước."), NX("Tôi có một ít tiền.", "I have some money.", ["I have a money.", "I have moneys.", "I have two money."]), W("Tôi muốn thêm một ít bánh mì.", "I want some more bread.", ["a", "many"], ["I want more bread."]), Y("Tôi cần một ít bánh mì.", "I need some bread.", "I need a little bread."), Y("Không có sữa.", "There is no milk.", "There isn't any milk.", "No milk."),
    M("both", "those", "these", "bread", "milk"),
])

# ---------------------------------------------------------------- ub: verbs
lesson("ub-l0", [
    C("be"), J("I ___ a nurse.", "be", "pre:1s", "Tôi là y tá."), J("You ___ my teacher.", "be", "pre:2s", "Bạn là giáo viên của tôi."), J("He ___ at work.", "be", "pre:3s", "Anh ấy đang ở chỗ làm."), J("We ___ from Vietnam.", "be", "pre:1p", "Chúng tôi đến từ Việt Nam."), J("They ___ in the kitchen.", "be", "pre:3p", "Họ đang ở trong bếp."), J("It ___ a big city.", "be", "pre:3s", "Đó là một thành phố lớn."), NX("Tôi đói.", "I am hungry.", ["I hungry.", "I have hungry.", "I do hungry."]), W("Cô ấy có ở đây không?", "Is she here?", ["Does", "are"]), Y("Tôi không phải là giáo viên.", "I am not a teacher."), Y("Họ không ở nhà.", "They are not at home.", "They are not home."),
])
lesson("ub-l1", [
    C("present-do-does"), J("She ___ in a factory.", "work", "pre:3s", "Cô ấy làm việc ở một nhà máy."), J("He ___ in Hue.", "live", "pre:3s", "Anh ấy sống ở Huế."), J("My sister ___ English.", "study", "pre:3s", "Chị tôi học tiếng Anh."), J("He ___ to the market every day.", "go", "pre:3s", "Anh ấy đi chợ mỗi ngày."), J("Tom ___ two cars.", "have", "pre:3s", "Tom có hai chiếc ô tô."), J("She ___ TV in the evening.", "watch", "pre:3s", "Buổi tối cô ấy xem ti vi."), C("wh-questions"), J("Where ___ you live?", "do", "pre:2s", "Bạn sống ở đâu?"), J("Where ___ she work?", "do", "pre:3s", "Cô ấy làm việc ở đâu?"), NX("Tôi không biết.", "I don't know.", ["I no know.", "I not know.", "I am not know."]), Y("Bạn sống ở đâu?", "Where do you live?"), T("know", ["need", "see", "take"]),
])
lesson("ub-l2", [
    C("present-continuous"), J("I am ___ now.", "work", "ing", "Bây giờ tôi đang làm việc."), J("She is ___ rice.", "eat", "ing", "Cô ấy đang ăn cơm."), J("They are ___ TV.", "watch", "ing", "Họ đang xem ti vi."), J("He is ___ a message.", "write", "ing", "Anh ấy đang viết một tin nhắn."), J("We are ___ on the chairs.", "sit", "ing", "Chúng tôi đang ngồi trên ghế."), J("Tom is ___ to the bus stop.", "run", "ing", "Tom đang chạy đến bến xe buýt."), F("Look! She ___ now.", "is running", ["runs", "run", "running"], "Nhìn kìa! Cô ấy đang chạy."), Y("Bây giờ tôi đang học tiếng Anh.", "I am studying English now.", "Now I am studying English.", "I am learning English now.", "Now I am learning English."), Y("Cô ấy đang ngủ.", "She is sleeping."), N("look", ["come", "stay", "take"]),
])
lesson("ub-l3", [
    C("past-did"), J("Yesterday I ___ at home.", "be", "pas:s", "Hôm qua tôi ở nhà."), J("They ___ late.", "be", "pas:p", "Họ đã đến muộn."), J("She ___ yesterday.", "work", "pas:s", "Hôm qua cô ấy đã làm việc."), J("We ___ to Hue last week.", "go", "pas:p", "Tuần trước chúng tôi đã đi Huế."), J("I ___ a new bag.", "buy", "pas:s", "Tôi đã mua một cái túi mới."), J("He ___ my mother at the market.", "see", "pas:s", "Anh ấy đã gặp mẹ tôi ở chợ."), Y("Bạn đã đi đâu?", "Where did you go?"), Y("Hôm qua tôi đã mua một cái vé.", "I bought a ticket yesterday.", "Yesterday I bought a ticket."), C("future-going-to-will"), F("I am ___ to call him.", "going", ["go", "goes", "will"], "Tôi định gọi cho anh ấy."), M("make", "give", "find", "bring", "remember"),
    M("could", "find", "forget", "may", "remember"),
])

# ---------------------------------------------------------------- uc: familiar words and traps
lesson("uc-l0", [
    C("spelling-sound"), T("TV", ["computer", "menu", "card"]), N("hotel", ["TV", "computer", "menu"]), T("computer", ["hotel", "TV", "size"]), N("menu", ["card", "hotel", "photo"]), T("internet", ["hotel", "card", "size"]), F("The ___ is on the table.", "menu", ["internet", "hotel", "size"], "Thực đơn ở trên bàn."), F("I watch ___ in the evening.", "TV", ["menu", "card", "size"], "Buổi tối tôi xem ti vi."), M("TV", "hotel", "menu", "computer", "card"), W("Khách sạn có mạng không?", "Does the hotel have internet?", ["Do", "has"]), Y("Tôi cần một cái máy tính.", "I need a computer."),
])
lesson("uc-l1", [
    N("copy", ["photo", "size", "boss"]), N("size", ["photo", "boss", "card"]), F("I need a ___ of this document.", "copy", ["photo", "boss", "size"], "Tôi cần một bản sao của giấy tờ này."), F("My ___ is very kind.", "boss", ["copy", "size", "menu"], "Sếp của tôi rất tốt bụng."), F("This is a ___ of my family.", "photo", ["copy", "boss", "size"], "Đây là một tấm ảnh gia đình tôi."), F("Do you have this shirt in a small ___?", "size", ["photo", "boss", "menu"], "Bạn có áo sơ mi này cỡ nhỏ không?"), TX("The water is hot.", "Nước nóng.", ["Nước đang được yêu thích.", "Nước lạnh.", "Nước sạch."]), W("Sếp của tôi ở khách sạn.", "My boss is at the hotel.", ["I", "are"]), Y("sếp của tôi", "my boss"), Y("Tôi có một tấm ảnh.", "I have a photo.", "I have a picture."),
])
lesson("uc-l2", [
    C("adjectives-very-too"), NX("Tôi rất thích cà phê.", "I like coffee very much.", ["I very like coffee.", "I like very coffee.", "I very much coffee."]), NX("Cái này rất tốt.", "It is very good.", ["It very good.", "It is good very.", "It very is good."]), F("I ___ tea very much.", "like", ["very like", "am like", "very"], "Tôi rất thích trà."), F("It is ___ hot. I can't drink it.", "too", ["very much", "not", "only"], "Nó nóng quá. Tôi không uống được."), TX("We work together.", "Chúng tôi làm việc cùng nhau.", ["Chúng tôi làm việc một mình.", "Chúng tôi không làm việc.", "Chúng tôi chỉ làm việc hôm nay."]), TX("Maybe he is sick.", "Có lẽ anh ấy bị ốm.", ["Anh ấy chắc chắn bị ốm.", "Anh ấy không bị ốm.", "Tại sao anh ấy bị ốm?"]), W("Tôi rất thích công việc của tôi.", "I like my job very much.", ["am", "too"]), Y("Tôi rất thích nó.", "I like it very much.", "I really like it.", "I love it."), Y("Tại sao bạn đến muộn?", "Why are you late?", "Why did you come late?", "Why were you late?"), Y("Bạn khỏe không?", "How are you?", "Are you okay?", "Are you well?"),
    M("how", "maybe", "together", "why", "very"),
])
lesson("uc-l3", [
    NX("một ngôi nhà to", "a big house", ["a house big", "big a house", "a bigs house"]), NX("chiếc ô tô mới", "a new car", ["a car new", "new a car", "a news car"]), NX("Ngôi nhà to.", "The house is big.", ["The house big.", "The big house is.", "Big the house."]), F("These houses are ___.", "big", ["bigs", "a big", "an big"], "Những ngôi nhà này to."), C("adjectives-very-too"), W("Tôi có một chiếc ô tô mới.", "I have a new car.", ["cars", "is"]), W("Cái túi nhỏ.", "The bag is small.", ["are", "a"]), WT("It is a very good idea.", "Đó là|một|ý tưởng|rất|hay", ["không", "sách"]), Y("một con mèo nhỏ", "a small cat", "a little cat"), Y("Tôi có một ngôi nhà to.", "I have a big house."), MP(("a big house", "một ngôi nhà to"), ("a small bag", "một cái túi nhỏ"), ("an old car", "một chiếc xe cũ"), ("a new book", "một quyển sách mới")), AS("old car", "chiếc ô tô cũ", "an"),
])

# ---------------------------------------------------------------- ud: numbers, time, dates, prices
lesson("ud-l0", [
    C("numbers-time-prices"), N("eleven", ["seven", "twelve", "ten"]), T("twelve", ["two", "twenty", "eleven"]), M("one", "two", "three", "four", "five"), M("six", "seven", "eight", "nine", "ten"), F("A week has ___ days.", "seven", ["six", "eight", "ten"], "Một tuần có bảy ngày."), F("A year has ___ months.", "twelve", ["ten", "eleven", "two"], "Một năm có mười hai tháng."), Y("số mười", "ten", digits=False), Y("số mười một", "eleven", digits=False), W("Tôi có ba đứa con.", "I have three children.", ["child", "two"]), Y("Tôi có năm quyển sách.", "I have five books."),
])
lesson("ud-l1", [
    C("stress-weak-forms"), H("thirteen", ["thirty", "three", "third"]), H("fifteen", ["fifty", "five", "fourteen"]), H("eighty", ["eighteen", "eight", "seventy"]), M("thirteen", "fourteen", "fifteen", "sixteen", "seventeen"), M("twenty", "thirty", "forty", "fifty", "sixty"), M("seventy", "eighty", "ninety", "nineteen", "eighteen"), F("I am ___ years old.", "forty", ["fourteen", "four", "fifty"], "Tôi bốn mươi tuổi."), Y("hai mươi mốt", "twenty-one", digits=False), Y("năm mươi", "fifty", digits=False), Y("Mẹ tôi sáu mươi tuổi.", "My mother is sixty years old.", "My mother is sixty."),
    M("fourteen", "sixteen", "eighteen", "seventy", "ninety"), M("seventeen", "nineteen", "twelve", "eleven", "twenty"),
])
lesson("ud-l2", [
    C("prepositions-in-on-at"), NX("Tám giờ rưỡi.", "It's half past eight.", ["It's half past nine.", "It's half to eight.", "It's half eight past."]), NX("Chín giờ kém mười lăm.", "It's quarter to nine.", ["It's quarter past nine.", "It's quarter to eight.", "It's nine quarter."]), F("It's quarter ___ eight.", "past", ["half", "o'clock", "at"], "Bây giờ là tám giờ mười lăm."), F("The class starts ___ nine.", "at", ["in", "on", "to"], "Lớp học bắt đầu lúc chín giờ."), F("I sleep ___ night.", "at", ["in", "on", "to"], "Tôi ngủ vào ban đêm."), Y("Bây giờ là mấy giờ?", "What time is it?", "What is the time?"), Y("Bây giờ là mười giờ.", "It's ten o'clock.", "It's ten.", "It's ten in the morning."), Y("Bảy giờ rưỡi.", "It's half past seven.", "Half past seven.", "It's seven thirty.", "Seven thirty.", "It's 7:30."), W("Tôi bắt đầu lúc bảy giờ.", "I start at seven.", ["on", "in"], ["At seven I start."]), M("minute", "hour", "clock", "noon", "moment"),
    M("clock", "moment", "half", "quarter", "o'clock"),
])
lesson("ud-l3", [
    C("numbers-time-prices"), M("Monday", "Tuesday", "Wednesday", "Thursday", "Friday"), M("Saturday", "Sunday", "weekend", "birthday", "date"), M("January", "February", "March", "April", "May"), M("June", "July", "August", "September", "October"), F("My birthday is ___ May.", "in", ["on", "at", "to"], "Sinh nhật của tôi vào tháng Năm."), TX("Summer is hot and winter is cold.", "Mùa hè nóng, mùa đông lạnh.", ["Mùa hè lạnh, mùa đông nóng.", "Mùa xuân nóng, mùa đông lạnh.", "Mùa hè và mùa đông đều nóng."]), F("Today is the ___ of May.", "first", ["one", "zero", "half"], "Hôm nay là ngày mùng một tháng Năm."), Y("Nó giá hai mươi đô la.", "It costs twenty dollars.", "It's twenty dollars.", "It is $20.", "It costs $20."), Y("Hôm nay là thứ Sáu.", "Today is Friday.", "It's Friday today.", "It's Friday."), W("Sinh nhật của tôi vào tháng Sáu.", "My birthday is in June.", ["on", "at"]),
    M("January", "March", "July", "September", "Thursday"), M("February", "April", "August", "October", "weekend"), M("date", "first", "winter", "month", "summer"),
])

# ---------------------------------------------------------------- ue: sounds and spelling
lesson("ue-l0", [
    C("final-consonants"), H("bag", ["back", "bad", "bus"]), H("back", ["bag", "bad", "but"]), H("bus", ["but", "back", "bag"]), T("bag", ["bed", "seat", "watch"]), N("watch", ["bag", "bed", "seat"]), F("My ___ is on the table.", "bag", ["back", "bad", "but"], "Cái túi của tôi ở trên bàn."), F("I ___ my hands.", "wash", ["watch", "what", "want"], "Tôi rửa tay."), F("I ___ TV.", "watch", ["wash", "what", "work"], "Tôi xem ti vi."), Y("Tôi có một cái túi.", "I have a bag."), W("Tôi rửa tay.", "I wash my hands.", ["watch", "hand"]),
])
lesson("ue-l1", [
    C("th-sounds"), H("tree", ["three", "free", "see"]), T("think", ["this", "sit", "watch"]), N("this", ["think", "bed", "bad"]), H("bad", ["bed", "back", "bag"]), N("seat", ["sit", "bed", "bad"]), T("bed", ["bad", "seat", "bag"]), F("Please ___ here.", "sit", ["seat", "bed", "bad"], "Mời bạn ngồi đây."), F("This is my ___ on the train.", "seat", ["sit", "bed", "bad"], "Đây là chỗ ngồi của tôi trên tàu."), Y("Tôi nghĩ vậy.", "I think so."), Y("Cái này là của tôi.", "This is mine.", "It is mine."),
])
lesson("ue-l2", [
    C("s-ed-pronunciation"), NX("Từ nào có đuôi -s đọc là âm s?", "works", ["lives", "washes", "plays"]), NX("Từ nào có đuôi -s đọc là âm z?", "lives", ["works", "washes", "stops"]), J("She ___ in a bank.", "work", "pre:3s", "Cô ấy làm việc ở một ngân hàng."), J("He ___ his hands.", "wash", "pre:3s", "Anh ấy rửa tay."), J("Lan ___ soccer.", "play", "pre:3s", "Lan chơi bóng đá."), J("I ___ for you yesterday.", "wait", "pas:s", "Hôm qua tôi đã đợi bạn."), J("They ___ in Hue last year.", "live", "pas:p", "Năm ngoái họ sống ở Huế."), J("She ___ the bus.", "stop", "pas:s", "Cô ấy đã dừng xe buýt lại."), J("We ___ the room.", "clean", "pas:p", "Chúng tôi đã lau dọn căn phòng."), Y("Hôm qua tôi đã làm việc.", "I worked yesterday.", "Yesterday I worked."),
])
lesson("ue-l3", [
    C("stress-weak-forms"), C("spelling-sound"), Y("thông tin", "information", "info", "the information"), Y("nhà ga", "station", "the station", "a station"), Y("đủ", "enough"), Y("Tôi cần thông tin.", "I need information.", "I need some information."), F("Do you have ___ money?", "enough", ["information", "bad", "very"], "Bạn có đủ tiền không?"), F("Can you give me some ___?", "information", ["enough", "think", "bad"], "Bạn cho tôi một ít thông tin được không?"), NX("Câu nào đúng?", "I need some information.", ["I need an information.", "I need informations.", "I need two information."]), TX("I don't have enough time.", "Tôi không có đủ thời gian.", ["Tôi có nhiều thời gian.", "Tôi không có đủ tiền.", "Tôi không biết bây giờ là mấy giờ."]), WT("This bed is bad.", "Cái giường|này|tệ", ["tốt", "cái túi"]), W("Tôi không có đủ thông tin.", "I don't have enough information.", ["am", "bad"]),
])
finish("a")
