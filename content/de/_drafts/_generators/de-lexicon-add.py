"""German lexicon-add: number words, Euro, halb (unit d "Số từ 0 đến 100"). usage: python -I de-lexicon-add.py <out.jsonl>"""
import json, sys
R = []
def num(lemma, vi_n, en_n, ex):
    R.append({"lemma": lemma, "partOfSpeech": "determiner", "glossEn": en_n, "glossVi": vi_n, "topic": "numbers", "examples": [{"target": t, "en": e, "vi": v} for t, e, v in ex]})
num("null", "không (số 0)", "zero", [("Die Nummer beginnt mit null.", "The number starts with zero.", "Số bắt đầu bằng số không.")])
num("eins", "một (khi đếm)", "one (counting)", [("Eins, zwei, drei!", "One, two, three!", "Một, hai, ba!")])
num("vier", "bốn", "four", [("Wir sind vier Personen.", "We are four people.", "Chúng tôi có bốn người.")])
num("fünf", "năm (số 5)", "five", [("Das Kind ist fünf Jahre alt.", "The child is five years old.", "Đứa trẻ năm tuổi.")])
num("sechs", "sáu", "six", [("Ich stehe um sechs Uhr auf.", "I get up at six o'clock.", "Tôi dậy lúc sáu giờ.")])
num("sieben", "bảy", "seven", [("Eine Woche hat sieben Tage.", "A week has seven days.", "Một tuần có bảy ngày.")])
num("acht", "tám", "eight", [("Der Zug kommt um acht Uhr.", "The train comes at eight o'clock.", "Tàu đến lúc tám giờ.")])
num("neun", "chín", "nine", [("Ich arbeite neun Stunden.", "I work nine hours.", "Tôi làm việc chín tiếng.")])
num("zehn", "mười", "ten", [("Das kostet zehn Euro.", "That costs ten euros.", "Cái đó giá mười euro.")])
num("elf", "mười một", "eleven", [("Es ist elf Uhr.", "It is eleven o'clock.", "Bây giờ là mười một giờ.")])
num("zwölf", "mười hai", "twelve", [("Ein Jahr hat zwölf Monate.", "A year has twelve months.", "Một năm có mười hai tháng.")])
num("dreizehn", "mười ba", "thirteen", [("Meine Schwester ist dreizehn.", "My sister is thirteen.", "Em gái tôi mười ba tuổi.")])
num("sechzehn", "mười sáu", "sixteen", [("Er ist sechzehn Jahre alt.", "He is sixteen years old.", "Cậu ấy mười sáu tuổi.")])
num("siebzehn", "mười bảy", "seventeen", [("Der Bus kommt um siebzehn Uhr.", "The bus comes at five p.m.", "Xe buýt đến lúc mười bảy giờ.")])
num("zwanzig", "hai mươi", "twenty", [("Das Ticket kostet zwanzig Euro.", "The ticket costs twenty euros.", "Vé giá hai mươi euro.")])
num("dreißig", "ba mươi", "thirty", [("Ich bin dreißig Jahre alt.", "I am thirty years old.", "Tôi ba mươi tuổi.")])
num("vierzig", "bốn mươi", "forty", [("Mein Vater ist vierzig.", "My father is forty.", "Bố tôi bốn mươi tuổi.")])
num("fünfzig", "năm mươi", "fifty", [("Das Hotel hat fünfzig Zimmer.", "The hotel has fifty rooms.", "Khách sạn có năm mươi phòng.")])
num("sechzig", "sáu mươi", "sixty", [("Eine Stunde hat sechzig Minuten.", "An hour has sixty minutes.", "Một giờ có sáu mươi phút.")])
num("siebzig", "bảy mươi", "seventy", [("Meine Oma ist siebzig.", "My grandma is seventy.", "Bà tôi bảy mươi tuổi.")])
num("hundert", "một trăm", "hundred", [("Das kostet hundert Euro.", "That costs a hundred euros.", "Cái đó giá một trăm euro.")])
R.append({"lemma": "Euro", "partOfSpeech": "noun", "gender": "masculine", "glossEn": "euro", "glossVi": "euro (tiền)", "topic": "shopping", "examples": [{"target": "Der Kaffee kostet drei Euro.", "en": "The coffee costs three euros.", "vi": "Cà phê giá ba euro."}]})
R.append({"lemma": "halb", "partOfSpeech": "adjective", "glossEn": "half", "glossVi": "rưỡi, một nửa (halb drei = 2 giờ 30)", "topic": "numbers", "examples": [{"target": "Es ist halb drei.", "en": "It is half past two.", "vi": "Bây giờ là hai giờ rưỡi."}]})
with open(sys.argv[1], "w", encoding="utf-8", newline="\n") as f:
    for r in R:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
print(len(R))
