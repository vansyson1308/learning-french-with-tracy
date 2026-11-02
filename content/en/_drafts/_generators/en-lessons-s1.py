"""en-vi section 1 lessons: first words, and English production from the first lesson (word banks, typed answers).
Each lesson has its own shape, 7 to 11 exercises; five lessons show a concept card. Starts lessons/OUTPUT.jsonl.
usage: python -I en-lessons-s1.py <repo root>"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from en_lesson_lib import AS, C, F, H, J, M, MP, N, NX, T, TX, W, WT, Y, finish, lesson

# ---------------------------------------------------------------- u0: greetings
lesson("u0-l0", [
    T("hello", ["goodbye", "sorry", "yes"]), T("goodbye", ["hello", "please", "no"]), N("hi", ["goodbye", "sorry", "okay"]),
    H("hello", ["goodbye", "okay", "please"]), Y("Xin chào!", "Hello!"), TX("Hello, Lan!", "Xin chào, Lan!", ["Tạm biệt, Lan!", "Cảm ơn, Lan!", "Xin lỗi, Lan!"]),
    W("Tạm biệt, Nam!", "Goodbye, Nam!", ["Hello", "Sorry"]), M("hello", "goodbye", "yes", "no"),
])
lesson("u0-l1", [
    T("please", ["sorry", "yes", "no"]), T("thank you", ["please", "goodbye", "sorry"]), C("politeness"), T("excuse me", ["thank you", "good night", "yes"]), F("Water, ___.", "please", ["sorry", "goodbye", "no"], "Cho tôi nước, làm ơn."), F("___ you very much.", "Thank", ["Sorry", "Please", "Hello"], "Cảm ơn bạn rất nhiều."), TX("Excuse me, where is the bus?", "Xin lỗi, xe buýt ở đâu?", ["Cảm ơn, xe buýt ở đây.", "Xin lỗi, tôi đến muộn.", "Xe buýt có đắt không?"]), Y("Một người giúp bạn. Hãy nói cảm ơn.", "Thank you!", "Thank you very much!"), Y("Bạn lỡ va vào một người. Hãy xin lỗi.", "Sorry!", "I am sorry!", "Excuse me!", "I am so sorry!"),
])
lesson("u0-l2", [
    T("good morning", ["good night", "goodbye", "thank you"]), N("good night", ["good morning", "hello", "excuse me"]), NX("Buổi sáng, bạn gặp thầy giáo. Bạn nói gì?", "Good morning!", ["Good night!", "Goodbye!", "Sorry!"]), NX("Trước khi đi ngủ, bạn nói gì với mẹ?", "Good night!", ["Good morning!", "Hello!", "Excuse me!"]), W("Chào buổi sáng, Anna!", "Good morning, Anna!", ["night", "Goodbye"]), W("Chúc bạn ngủ ngon, Tom!", "Good night, Tom!", ["morning", "Sorry"]), Y("Chào buổi sáng!", "Good morning!", "Morning!"), Y("Chúc ngủ ngon!", "Good night!"),
])
lesson("u0-l3", [
    M("please", "sorry", "good morning", "good night", "okay"), C("final-consonants"), F("___, thank you.", "Yes", ["Goodbye", "Sorry", "Hi"], "Vâng, cảm ơn."), F("___, I am okay.", "Yes", ["No", "Please", "Hi"], "Vâng, tôi ổn."), WT("No, thank you.", "Không|cảm ơn", ["vâng", "xin lỗi"]), W("Vâng, làm ơn.", "Yes, please.", ["No", "Sorry"]), W("Không, cảm ơn.", "No, thank you.", ["Yes", "please"]), Y("Không, cảm ơn.", "No, thank you.", "No, thanks."), Y("Được, cảm ơn.", "Okay, thank you.", "Okay, thanks."),
])

# ---------------------------------------------------------------- u1: who am I
lesson("u1-l0", [
    T("I", ["you", "name", "friend"]), T("you", ["I", "man", "woman"]), C("be"), F("I ___ Minh.", "am", ["is", "are", "be"], "Tôi là Minh."), F("You ___ my friend.", "are", ["am", "is", "be"], "Bạn là bạn của tôi."), F("My name ___ Lan.", "is", ["am", "are", "be"], "Tên tôi là Lan."), W("Tôi là Lan.", "I am Lan.", ["is", "you"]), NX("Tên tôi là Hoa.", "My name is Hoa.", ["My name Hoa.", "I name is Hoa.", "Name my is Hoa."]), Y("Tôi là Tuấn.", "I am Tuan."),
])
lesson("u1-l1", [
    T("sir", ["girl", "baby", "woman"]),
    T("man", ["woman", "boy", "girl"]), T("person", ["name", "friend", "student"]), N("girl", ["boy", "baby", "man"]), F("The ___ is my friend.", "woman", ["name", "English", "Vietnam"], "Người phụ nữ là bạn của tôi."), F("She is a good ___.", "person", ["name", "Vietnam", "English"], "Cô ấy là một người tốt."), W("Người đàn ông là bạn của tôi.", "The man is my friend.", ["woman", "am"]), M("man", "woman", "boy", "girl", "baby"), Y("Em bé ở đây.", "The baby is here.", "A baby is here."),
])
lesson("u1-l2", [
    T("teacher", ["student", "worker", "friend"]), N("worker", ["teacher", "student", "person"]),
    F("I am ___ worker.", "a", ["an", "the", "is"], "Tôi là công nhân."), F("She ___ a teacher.", "is", ["am", "are", "be"], "Cô ấy là giáo viên."), F("He is a ___.", "student", ["English", "Vietnam", "name"], "Anh ấy là sinh viên."), NX("Tôi là sinh viên.", "I am a student.", ["I am student.", "I a student.", "I student."]), NX("Cô ấy là giáo viên.", "She is a teacher.", ["She teacher.", "She is teacher.", "She are a teacher."]), W("Anh ấy là công nhân.", "He is a worker.", ["am", "She", "an"]), Y("Tôi là công nhân.", "I am a worker."), Y("Bạn là sinh viên à?", "Are you a student?", "You are a student?"),
])
lesson("u1-l3", [
    M("Vietnam", "Vietnamese", "English", "language", "neighbor"), F("I am from ___.", "Vietnam", ["Vietnamese", "English", "name"], "Tôi đến từ Việt Nam."), F("I am ___.", "Vietnamese", ["Vietnam", "English", "from"], "Tôi là người Việt."), TX("Who is your neighbor?", "Hàng xóm của bạn là ai?", ["Bạn đến từ đâu?", "Bạn tên là gì?", "Bạn của bạn ở đâu?"]), F("English is a ___.", "language", ["name", "person", "worker"], "Tiếng Anh là một ngôn ngữ."), W("Tôi đến từ Việt Nam.", "I am from Vietnam.", ["is", "to"]), Y("Tôi là người Việt.", "I am Vietnamese.", "I am from Vietnam."), Y("Tôi nói tiếng Anh.", "I speak English."),
])

# ---------------------------------------------------------------- u2: family
lesson("u2-l0", [
    T("family", ["father", "name", "friend"]), T("father", ["mother", "son", "wife"]), N("mother", ["father", "sister", "daughter"]), F("This is my ___.", "mother", ["name", "have", "English"], "Đây là mẹ tôi."), NX("Đây là bố tôi.", "This is my father.", ["This is father my.", "This is the my father.", "This my father."]), W("Đây là gia đình tôi.", "This is my family.", ["you", "have", "the"]), Y("mẹ tôi", "my mother"), M("father", "mother", "son", "daughter"),
])
lesson("u2-l1", [
    T("son", ["daughter", "wife", "husband"]), C("pronouns-possessives"), F("___ son is ten.", "My", ["I", "Me", "Mine"], "Con trai tôi mười tuổi."), F("Is this ___ daughter?", "your", ["you", "yours", "I"], "Đây là con gái bạn à?"), F("She has a son. ___ son is Nam.", "Her", ["She", "His", "He"], "Cô ấy có một con trai. Con trai cô ấy tên là Nam."), F("He has a daughter. ___ daughter is Mai.", "His", ["Her", "He", "Him"], "Anh ấy có một con gái. Con gái anh ấy tên là Mai."), W("Đây là con trai tôi.", "This is my son.", ["I", "daughter"]), NX("Đây là con gái chúng tôi.", "This is our daughter.", ["This is we daughter.", "This is daughter our.", "This our is daughter."]), Y("con gái tôi", "my daughter"),
])
lesson("u2-l2", [
    M("husband", "wife", "brother", "sister", "family"), H("husband", ["brother", "father", "family"]), J("I ___ a brother.", "have", "pre:1s", "Tôi có một anh trai."), J("She ___ two children.", "have", "pre:3s", "Cô ấy có hai con."), J("We ___ a son.", "have", "pre:1p", "Chúng tôi có một con trai."), F("I have two ___.", "children", ["child", "childs", "son"], "Tôi có hai con."), Y("Tôi có một chị gái.", "I have a sister.", "I have an older sister."), W("Tôi có hai con.", "I have two children.", ["child", "am"]),
])
lesson("u2-l3", [
    T("grandmother", ["grandfather", "aunt", "uncle"]), M("aunt", "uncle", "parent", "grandmother", "grandfather"), F("My ___ have a dog.", "parents", ["parent", "mother", "father"], "Bố mẹ tôi có một con chó."), F("A bird is an ___.", "animal", ["uncle", "aunt", "family"], "Con chim là một con vật."), TX("Their cat is small.", "Con mèo của họ nhỏ.", ["Con mèo của tôi nhỏ.", "Con chó của họ nhỏ.", "Con mèo của họ to."]), W("Bà tôi có một con mèo.", "My grandmother has a cat.", ["have", "dog"]), Y("Chú tôi có một con chó.", "My uncle has a dog."), Y("Ông tôi có một con chim.", "My grandfather has a bird."),
    M("animal", "aunt", "their", "dog", "bird"),
])

# ---------------------------------------------------------------- u3: food and drink
lesson("u3-l0", [
    T("rice", ["noodle", "egg", "fish"]), T("water", ["tea", "coffee", "beer"]), N("coffee", ["tea", "water", "beer"]), F("I eat ___.", "rice", ["water", "tea", "coffee"], "Tôi ăn cơm."), F("I drink ___.", "water", ["rice", "egg", "fish"], "Tôi uống nước."), W("Tôi ăn cơm và cá.", "I eat rice and fish.", ["drink", "a"], ["I eat fish and rice."]), Y("Tôi uống trà.", "I drink tea.", "I am drinking tea."), M("rice", "water", "tea", "coffee", "fish"),
])
lesson("u3-l1", [
    T("noodle", ["chicken", "egg", "beer"]), T("chicken", ["fish", "egg", "tea"]), J("He ___ chicken.", "eat", "pre:3s", "Anh ấy ăn thịt gà."), J("She ___ tea.", "drink", "pre:3s", "Cô ấy uống trà."), F("My father ___ beer.", "drinks", ["drink", "eat", "eats"], "Bố tôi uống bia."), W("Mẹ tôi uống cà phê.", "My mother drinks coffee.", ["drink", "eats"]), Y("Bố tôi ăn cá.", "My father eats fish.", "My father is eating fish."), Y("Anh ấy uống bia.", "He drinks beer.", "He is drinking beer."),
    M("fruit", "noodle", "egg", "chicken", "beer"),
])
lesson("u3-l2", [
    T("want", ["eat", "drink", "have"]),
    C("articles"), F("I want ___ egg.", "an", ["a", "the", "some"], "Tôi muốn một quả trứng."), NX("Tôi uống nước.", "I drink water.", ["I drink a water.", "I drinks water.", "I water drink."]), NX("Cho tôi một ly cà phê.", "A coffee, please.", ["An coffee, please.", "Coffee a, please.", "A coffee, sorry."]), W("Tôi muốn một quả trứng.", "I want an egg.", ["a", "eat"]), Y("Tôi muốn nước.", "I want water.", "I want some water."), Y("Tôi muốn ăn cơm.", "I want to eat rice.", "I want to eat some rice."), M("food", "banana", "soup", "juice", "fruit"), TX("I want some soup.", "Tôi muốn một ít súp.", ["Tôi muốn một quả chuối.", "Tôi không muốn súp.", "Tôi có một ít súp."]), AS("egg", "quả trứng", "an"),
    AS("banana", "quả chuối", "a"),
])
lesson("u3-l3", [
    M("breakfast", "lunch", "dinner", "meat", "vegetable"), F("We eat ___ at noon.", "lunch", ["breakfast", "dinner", "water"], "Chúng tôi ăn bữa trưa vào buổi trưa."), F("I drink a ___ of water.", "glass", ["cook", "meal", "knife"], "Tôi uống một ly nước."), F("A ___ of beer, please.", "bottle", ["bowl", "cake", "knife"], "Cho tôi một chai bia."), TX("The waiter brings the food.", "Người phục vụ mang thức ăn đến.", ["Người phục vụ ăn thức ăn.", "Đầu bếp nấu thức ăn.", "Tôi mang thức ăn đến."]), W("Tôi ăn sáng lúc bảy giờ.", "I eat breakfast at seven.", ["lunch", "in"], ["At seven I eat breakfast."]), Y("Tôi không ăn thịt.", "I don't eat meat."), Y("Mẹ tôi nấu bữa tối.", "My mother cooks dinner.", "My mother is cooking dinner."),
    M("bottle", "juice", "sugar", "vegetable", "waiter"),
])

# ---------------------------------------------------------------- u4: getting around
lesson("u4-l0", [
    T("bus", ["taxi", "car", "train"]), T("motorbike", ["car", "bus", "train"]), N("car", ["motorbike", "bus", "train"]), M("bus", "car", "train", "motorbike", "bike"), F("I go by ___.", "bus", ["ticket", "station", "street"], "Tôi đi bằng xe buýt."), W("Tôi đi xe máy.", "I go by motorbike.", ["train", "at"]), Y("Tôi đi bằng tàu hỏa.", "I go by train.", "I take the train.", "I travel by train."), TX("I ride a bike.", "Tôi đi xe đạp.", ["Tôi đi xe máy.", "Tôi có một chiếc ô tô.", "Tôi đi tắc xi."]),
])
lesson("u4-l1", [
    T("station", ["airport", "street", "home"]), N("airport", ["station", "street", "ticket"]), F("A ___, please.", "ticket", ["station", "street", "home"], "Cho tôi một vé."), F("The train is at the ___.", "station", ["ticket", "bus", "motorbike"], "Tàu ở nhà ga."), F("The plane is at the ___.", "airport", ["ticket", "road", "train"], "Máy bay ở sân bay."), W("Cho tôi hai vé.", "Two tickets, please.", ["ticket", "Sorry"]), TX("I am on the street.", "Tôi đang ở trên phố.", ["Tôi đang ở nhà ga.", "Tôi đang ở sân bay.", "Tôi đang ở nhà."]), Y("Tôi có một cái vé.", "I have a ticket."),
])
lesson("u4-l2", [
    T("where", ["go", "home", "street"]), N("home", ["street", "station", "bus"]),
    C("wh-questions"), F("___ is the station?", "Where", ["Who", "Go", "Yes"], "Nhà ga ở đâu?"), F("I go ___.", "home", ["to home", "the home", "at home"], "Tôi về nhà."), NX("Tôi về nhà.", "I go home.", ["I go to home.", "I go the home.", "I home go."]), NX("Sân bay ở đâu?", "Where is the airport?", ["The airport where?", "Where the airport?", "Is where the airport?"]), NX("Tôi đến nhà ga.", "I go to the station.", ["I go the station.", "I station go.", "I go station to."]), W("Xe buýt ở đâu?", "Where is the bus?", ["are", "go"]), Y("Nhà ga ở đâu?", "Where is the station?"), Y("Tôi về nhà.", "I go home.", "I am going home."),
])
lesson("u4-l3", [
    M("road", "plane", "truck", "bank", "map"), T("park", ["bank", "road", "plane"]), F("The bank is ___ the station.", "near", ["go", "where", "home"], "Ngân hàng ở gần nhà ga."), F("The park is ___ the bank and the station.", "between", ["behind", "near", "under"], "Công viên ở giữa ngân hàng và nhà ga."), TX("The taxi is at the corner.", "Tắc xi ở góc phố.", ["Tắc xi ở sân bay.", "Xe buýt ở góc phố.", "Tắc xi ở phía sau nhà."]), W("Ngân hàng ở gần sân bay.", "The bank is near the airport.", ["behind", "are"]), Y("Bến xe buýt ở đâu?", "Where is the bus stop?"), Y("Tôi có một cái bản đồ.", "I have a map."),
    M("between", "road", "corner", "taxi", "truck"), AS("airport", "sân bay", "an"),
])
finish("w")
