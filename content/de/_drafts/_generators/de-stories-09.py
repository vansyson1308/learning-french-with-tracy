import importlib.util
spec = importlib.util.spec_from_file_location("lib", r"C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-app-hoc-ngoai-ngu\82ea6b33-e22d-4a2d-907b-9b4441f9e202\scratchpad\de-stories-lib.py")
lib = importlib.util.module_from_spec(spec); spec.loader.exec_module(lib)
story = lib.story

S = []
S.append(story("ein_jahr_mit_familie_schulz", "A2-1", "Ein Jahr mit Familie Schulz",
 ("Mỗi tháng trong năm, gia đình Schulz đều có một việc riêng — từ tuyết tháng Một đến cây thông Noel tháng Mười Hai.", "Every month the Schulz family has something special — from January snow to the December tree."),
 ["Winter", "Sommer", "regnen", "Keks", "Wind"],
 [("N", "Familie Schulz wohnt in einem Dorf in Bayern.", "Gia đình Schulz sống ở một ngôi làng ở Bayern.", "The Schulz family lives in a village in Bavaria."),
  ("N", "Im Januar und im Februar ist es kalt. Dann ist Winter, und oft liegt Schnee.", "Tháng Một và tháng Hai trời lạnh. Đó là mùa đông, và thường có tuyết.", "In January and February it is cold. Then it is winter, and there is often snow."),
  ("N", "Die Kinder spielen draußen im Schnee, und abends trinkt die Familie heißen Tee.", "Bọn trẻ chơi ngoài tuyết, còn buổi tối cả nhà uống trà nóng.", "The children play outside in the snow, and in the evening the family drinks hot tea."),
  ("N", "Im März beginnt der Frühling. Die Tage werden länger.", "Tháng Ba mùa xuân bắt đầu. Ngày dài dần.", "In March spring begins. The days get longer."),
  ("N", "Im April regnet es oft, aber dann scheint wieder die Sonne.", "Tháng Tư trời hay mưa, nhưng rồi nắng lại lên.", "In April it often rains, but then the sun shines again."),
  ("N", "Im Mai hat die Mutter Geburtstag. Sie feiern im Garten.", "Tháng Năm là sinh nhật mẹ. Cả nhà tổ chức trong vườn.", "In May it is Mother's birthday. They celebrate in the garden."),
  ("N", "Im Juni ist die Schule zu Ende, und im Juli und im August ist Sommer.", "Tháng Sáu năm học kết thúc, tháng Bảy và tháng Tám là mùa hè.", "In June school ends, and July and August are summer."),
  ("N", "Dann fährt die Familie ans Meer. Die Kinder schwimmen jeden Tag.", "Lúc đó cả nhà đi biển. Bọn trẻ ngày nào cũng bơi.", "Then the family goes to the sea. The children swim every day."),
  ("N", "Im September beginnt die Schule wieder.", "Tháng Chín năm học lại bắt đầu.", "In September school starts again."),
  ("N", "Im Oktober ist Herbst. Der Wind ist stark und kalt.", "Tháng Mười là mùa thu. Gió mạnh và lạnh.", "In October it is autumn. The wind is strong and cold."),
  ("N", "Im November gibt es wenig Sonne. Es wird früh dunkel.", "Tháng Mười Một có ít nắng. Trời tối sớm.", "In November there is little sun. It gets dark early."),
  ("N", "Dann sitzt die Familie oft zusammen, und der Vater liest Geschichten vor.", "Khi đó cả nhà hay ngồi bên nhau, và bố đọc truyện cho cả nhà nghe.", "Then the family often sits together, and Father reads stories aloud."),
  ("N", "Im Dezember kommen die Großeltern zu Besuch.", "Tháng Mười Hai ông bà đến chơi.", "In December the grandparents come to visit."),
  ("N", "Die Oma macht Kekse, und das ganze Haus riecht gut.", "Bà nướng bánh quy, và cả nhà thơm phức.", "Grandma bakes biscuits, and the whole house smells good."),
  ("B", "Welchen Monat magst du am liebsten?", "Con thích tháng nào nhất?", "Which month do you like best?"),
  ("N", "Das fragt die Mutter ihren Sohn Paul.", "Mẹ hỏi con trai Paul như vậy.", "Mother asks her son Paul that."),
  ("A", "Den Dezember! Da ist die Oma hier, und es gibt Kekse.", "Tháng Mười Hai ạ! Lúc đó bà ở đây, và có bánh quy.", "December! Grandma is here then, and there are biscuits."),
  ("B", "Und den Juli nicht? Da fahren wir doch ans Meer.", "Thế không thích tháng Bảy à? Lúc đó mình đi biển mà.", "And not July? That's when we go to the sea."),
  ("A", "Doch! Eigentlich mag ich jeden Monat.", "Có chứ ạ! Thật ra tháng nào con cũng thích.", "Yes, I do! Actually I like every month.")],
 [("locate", "Tháng nào là sinh nhật mẹ?", "In which month is Mother's birthday?", [("Tháng Năm", "May"), ("Tháng Bảy", "July"), ("Tháng Mười Hai", "December")], 0),
  ("locate", "Ai đến chơi vào tháng Mười Hai?", "Who comes to visit in December?", [("Bạn của Paul", "Paul's friend"), ("Ông bà", "The grandparents"), ("Cô giáo", "The teacher")], 1),
  ("infer", "Vì sao Paul nói thích tháng Mười Hai?", "Why does Paul say he likes December?", [("Vì có tuyết", "Because there is snow"), ("Vì cả nhà đi biển", "Because the family goes to the sea"), ("Vì bà đến và nướng bánh quy", "Because Grandma comes and bakes biscuits")], 2)],
 names=["Schulz", "Bayern", "Paul"],
 token_map={"länger": "lang", "welchen": "function", "besuch": "besuchen", "liebsten": "gern", "abends": "Abend"}))

lib.write_batch("09", S)
