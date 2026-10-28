"""Vietnamese review of the core words added on 2026-10-28 (frozen-core pass)."""
import json, sys
R = []
def rec(id_, gloss, vi, drop=None, add=None):
    r = {"id": id_, "glossVi": gloss, "exampleTranslationsVi": vi}
    if drop: r["dropExamples"] = drop
    if add: r["addExamples"] = [{"target": t, "en": e, "vi": v} for t, e, v in add]
    R.append(r)
rec("de:w:eins", "một (khi đếm)", ["số một", "một cộng hai", "một trăm lẻ một"])
rec("de:w:euro", "euro (tiền)", ["Trong ví tôi chỉ còn năm euro.", "Hôm qua tôi nhặt được hai euro."])
rec("de:w:halb", "rưỡi, một nửa (halb drei = 2 giờ 30)", [], drop=[0], add=[("Es ist halb drei.", "It is half past two.", "Bây giờ là hai giờ rưỡi.")])
rec("de:w:nicht", "không (phủ định)", ["Xin đừng làm phiền!", "Điều đó không đúng."])
rec("de:w:hier", "ở đây, đây", ["Tôi sinh ra ở ngôi làng này.", "Chúng ta ngồi xuống ghế sofa ở đây nhé."], drop=[2])
rec("de:w:auch", "cũng", [], drop=[0, 1], add=[("Ich lerne auch Deutsch.", "I am also learning German.", "Tôi cũng học tiếng Đức."), ("Du auch?", "You too?", "Bạn cũng vậy à?")])
rec("de:w:wo", "ở đâu", ["Bạn đang ở đâu?", "Tôi biết một cửa hàng bán những thứ như vậy."], drop=[2])
rec("de:w:wann", "khi nào, lúc nào", ["Khi nào anh ấy đến?", "Tôi không biết khi nào anh ấy đến."], drop=[2])
rec("de:w:heute", "hôm nay", ["Hôm nay là thứ Hai.", "Hôm nay không có giờ học.", "Đó là hôm nay chứ không phải hôm qua à?"])
rec("de:w:morgen-adverb", "ngày mai", ["sáng mai", "tối mai"])
rec("de:w:gestern", "hôm qua", ["Hôm qua tôi đã giúp anh ấy."], drop=[0])
rec("de:w:aber", "nhưng", ["Tôi không thích cam, nhưng tôi thích táo."])
with open(sys.argv[1], "w", encoding="utf-8", newline="\n") as f:
    for r in R:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
print(len(R))
