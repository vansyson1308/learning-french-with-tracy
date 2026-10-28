# lessons — de-vi (ngôn ngữ đích de, ngôn ngữ mẹ đẻ vi)

Bạn là tác giả nội dung của một ứng dụng học ngoại ngữ cục bộ cho người Việt. Mọi chữ người học nhìn thấy viết bằng tiếng Việt theo STYLE; ngôn ngữ đích viết đúng chính tả bản ngữ. Đầu ra là **một tệp JSONL**: mỗi dòng một record JSON hợp lệ theo schema dưới đây, không có văn bản nào khác. Không bịa id: chỉ dùng id trong `INPUT.json → allowedIds`. Không chép câu mô tả CEFR. Bản nháp này sẽ được validator kiểm tra tự động và người bản ngữ duyệt trước khi biên dịch.

## Nhiệm vụ

Viết bài tập cho từng lesson stub của gói nháp (_drafts/pack.json): mỗi record {lessonId, exercises[], flow?}. Mỗi lesson Phần 2: 8–11 bài tập (select, fillBlank, typeAnswer, articleSelect/conjugationCloze nếu plugin cho phép); Phần 3: 5–6 (listeningComprehension/readingComprehension tham chiếu clip/reading id cho phép, select, match, dictation); Phần 4: speakProduction/speakRepetition (tham chiếu speech item id); Phần 5: guidedWriting/simpleForm (tham chiếu writing task id); Phần 6: interactionScenario (tham chiếu scenario id) + select/wordBank. Prompt/options chỉ dùng surface hoặc gloss của lexeme cho phép; đáp án đúng phải phân bố đều các vị trí.

Số phiên dự kiến cho một khoá đầy đủ: 3–4 (một phiên mỗi phần). Ghi kết quả vào `content/de/_drafts/lessons/OUTPUT.jsonl` rồi chạy `bun scripts/author.ts ingest lessons --target de --native vi`; sửa đúng những dòng mà `REPORT.md` báo lỗi và chạy lại.

## Khuôn mẫu (blueprint)

## 1. Course pack (`content/courses/<target>-vi.json`)

| Section | Title (fr) | Units | Lessons | Exercises | Exercise types | Words/unit | Guidebook chars/unit |
|---|---|---|---|---|---|---|---|
| 1 Beginner | Section 1: Beginner | 5 | 20 (4/unit) | 220 (11/lesson) | select 120, wordBank 40, fillBlank 20, match 20, typeAnswer 20 | 12 | 703–912 |
| 2 Building blocks | Section 2 | 5 | 20 | 191 (8–11/lesson) | select 101, conjugationCloze 33, fillBlank 23, articleSelect 20, typeAnswer 14 | 2–17 | 1,143–1,780 |
| 3 Understand everyday … | Section 3 | 5 | 20 | 104 (5–6/lesson) | listeningComprehension 35, select 32, readingComprehension 24, dictation 7, match 6 | 4–7 | 271–377 |
| 4 Speak your first … | Section 4 | 4 | 16 | 34 (1–3/lesson) | speakProduction 20, speakRepetition 9, select 5 | 4 | 342–386 |
| 5 Write everyday … | Section 5 | 4 | 16 | 24 (1–2/lesson) | guidedWriting 16, wordBank 6, simpleForm 2 | 3 | 136–271 (thin — see linters) |
| 6 Talk with someone | Section 6 | 4 | 16 | 31 (1–3/lesson) | select 13, wordBank 10, interactionScenario 8 | 3 | 220–338 |
| **Total** | | **27** | **108** | **604** | | **126 lexemes** | 16.7 K |

Section 1 is the inherited beginner pack translated (P2b workflow:
`scripts/translate-native.ts`); the toolkit authors sections 2–6. Lesson
`flow` entries interleave concept steps only in section 2 (17 concept
steps over 4+4+3+3+3 lessons). Section 2 unit themes: gender & articles,
high-yield verbs, cognates & false friends, numbers 0–100, connected
speech (elision/liaison for French; the brief names the equivalent for
each target). Section 3: listening words/phrases, messages & signs,
announcements & instructions, small dialogues, little stories. Section 4:
say hello, introduce yourself, numbers aloud, describe it. Section 5: write
who you are, simple sentences, short messages, forms & messages. Section 6:
first exchanges, café & shop, finding your way, making plans.

Exercise rules the validators enforce (`plan/03-AUDIT-CONTENT.md` §5):
ids `<courseId>:<unit>-l<n>-e<n>`; `select`/`fillBlank`/`listening`/`reading`
`correct` in range and no duplicate options; `wordBank` tokens are a
multiset of the answer + distractors; `match` no duplicate targets;
`articleSelect` never on a vowel/h-initial noun (French rule; the plugin's
`neutralBefore`/elision rule for other languages); every `audioTarget` must
exist in the audio manifest unless the course is `device-tts`; lessons in
sections 2–6 declare `objectives`. Options/prompts reference **lexeme
surfaces or glosses only** (the toolkit emits the allowed lists).

## Brief sư phạm cho người Việt

# Brief sư phạm: người Việt học tiếng Đức (`de-vi`)

## 1. Vì sao người Việt học
- Du học nghề và đại học (Ausbildung, chương trình điều dưỡng, kỹ thuật), đoàn tụ gia đình (yêu cầu A1 "Start Deutsch 1" cho thị thực vợ/chồng), lao động có tay nghề (Fachkräfte); cộng đồng Việt tại Đức lớn.
- Kỳ thi mục tiêu ở A1: **Goethe-Zertifikat A1: Start Deutsch 1** (4 phần: Hören, Lesen, Schreiben, Sprechen); **telc Deutsch A1**; **ÖSD A1**. Ứng dụng chỉ đưa ra *ước tính theo khung CEFR*.

## 2. Người Việt thường vấp ở đâu
- **Ngữ âm**: nguyên âm tròn môi *ü/ö* (tiếng Việt có *ư/ơ* gần nhưng không tròn môi); *ch* hai kiểu (*ich/ach*); âm cuối vô thanh hoá (*Hund* đọc [hʊnt]) — tiếng Việt không có phụ âm cuối hữu thanh nên dễ bỏ qua hoàn toàn (*und* → "un"); cụm phụ âm đầu (*Str-, Pf-, Schw-*) — tiếng Việt không có cụm phụ âm; **độ dài nguyên âm** phân biệt nghĩa (*Staat/Stadt*); trọng âm từ ghép.
- **Chữ viết**: danh từ viết hoa; *ß*; umlaut; từ ghép dài (*Straßenbahnhaltestelle*) — dạy cách tách.
- **Ngữ pháp**: **ba giống** (*der/die/das*) không đoán được từ nghĩa; **bốn cách** (chủ/đối/tặng/sở hữu) đổi mạo từ (*der → den → dem*) — tiếng Việt không biến hình; động từ ở **vị trí thứ hai** và tách động từ (*anrufen → rufe … an*); động từ ở cuối mệnh đề phụ (*weil … ist*); chia động từ theo ngôi; số nhiều nhiều mẫu (*-e, -en, -er, ¨-, -s*); *sein/haben* + Partizip II (Perfekt) — tiếng Việt dùng *đã*; giới từ đi với cách; *kein* vs *nicht*.
- **Từ vựng**: từ mượn tiếng Anh/quốc tế giúp (*Hotel, Taxi, Computer*); từ ghép minh bạch là lợi thế lớn (*Handschuh*); "bạn giả" với tiếng Anh (*Gift, bekommen, Chef*).

## 3. Những điều PHẢI dạy tường minh bằng tiếng Việt ở A1 (→ concept cards)
1. Ba giống và mạo từ *der/die/das* — học danh từ cùng mạo từ; đuôi gợi ý (*-ung, -heit, -keit* → die; *-chen, -lein* → das; *-er* thường der; số liệu `derived/gender-stats.json`).
2. Mạo từ không xác định *ein/eine*; phủ định *kein/keine*.
3. Số nhiều: 5 mẫu chính, luôn *die*.
4. Chủ cách và đối cách: *der/den*, *ein/einen* (giống đực đổi; cái/trung không đổi).
5. Tặng cách ở mức công thức (*mit dem Bus, im Haus*).
6. Chia động từ hiện tại: *-e, -st, -t, -en, -t, -en*; *sein, haben, werden*; đổi nguyên âm (*sprechen → sprichst*).
7. Động từ ở vị trí 2; đảo khi bắt đầu bằng trạng ngữ (*Heute gehe ich…*).
8. Động từ tách (*aufstehen, anrufen, einkaufen*).
9. Động từ khuyết thiếu *können, möchten, müssen* + nguyên thể cuối câu.
10. Perfekt với *haben/sein* (các Partizip cao tần; bằng chứng `derived/morphology.json`) — so sánh *đã*.
11. Câu hỏi có/không (động từ đầu câu) và câu hỏi W- (*wer, was, wo, wann, wie, warum*).
12. Số 0–100; giờ (*halb drei* = 2:30 — bẫy); ngày tháng.
13. Mệnh lệnh lịch sự (*Nehmen Sie…*); *du/Sie*.
14. Giới từ địa điểm cao tần (*in, auf, an, zu, nach*).
15. Phát âm: *ü/ö/ä*, *ch* hai kiểu, *r*, nguyên âm dài/ngắn, vô thanh hoá cuối từ.
16. Trật tự thời gian–cách–nơi (*te-ka-mo-lo*) ở mức nhận biết.
17. Từ ghép: đầu + cuối, giống theo từ cuối.
18. Cách viết hoa danh từ, *ß* và umlaut.

## 4. Kịch bản hội thoại ưu tiên (→ scenarios)
- Giới thiệu bản thân ở sở ngoại kiều / trường nghề; tiệm bánh và siêu thị; quán ăn; hỏi đường và tàu (*S-Bahn, Gleis*); phòng khám (hẹn giờ, triệu chứng); thuê nhà (giờ xem nhà); điện thoại xin nghỉ ốm; nơi làm việc (ca làm, công cụ); bưu điện / ngân hàng mở tài khoản (mức công thức).

## 5. Lộ trình thi (→ exam track)
- **Start Deutsch 1**: Hören 20 phút (3 phần, 15 câu), Lesen 25 phút (3 phần, 15 câu), Schreiben 20 phút (điền mẫu + thư ngắn), Sprechen 15 phút (giới thiệu, hỏi-đáp theo thẻ từ, yêu cầu/đề nghị theo tranh). Chỉ tái tạo định dạng; không sao chép đề.

## 6. Giọng audio và nhận dạng giọng nói
- Dàn giọng: `content/audio/voice-casts.json` (thorsten-high/medium CC0, kerstin-low CC0, mls CC BY 4.0). `recognitionLocale` `de-DE`; chuẩn hoá ASR gộp *ß → ss*, giữ umlaut (plugin generic `de`; cần plugin xây dựng riêng ở P3d cho mạo từ/cách).


## Văn phong

# Văn phong tiếng Việt cho nội dung người học nhìn thấy (STYLE-vi, P3c)

Áp dụng cho MỌI chuỗi người học đọc trong một khoá `<target>-vi`: hướng dẫn
bài tập, lựa chọn, câu hỏi, sách hướng dẫn (guidebook), thẻ khái niệm
(concept), câu "tôi có thể" (can-do), gợi ý sửa bài viết, mục tiêu và lời
dẫn hội thoại, mô tả ô điền, nhãn dữ kiện. Chuỗi giao diện (nút, tab,
cảnh báo) KHÔNG thuộc tài liệu này — chúng nằm trong `src/lib/i18n/`.
Bản dịch `fr-vi` tuân theo `TRANSLATION-STYLE-vi.md`; tài liệu này mở rộng
cho nội dung **viết mới** bằng tiếng Việt.

## 1. Giọng và ngôi

- Tiếng Việt chuẩn miền Bắc, văn viết trung tính. Người học là **bạn**;
  ứng dụng tự xưng **mình** chỉ khi nói về điều nó nghe được hay kiểm tra
  được ("Mình nghe thấy…"). Không dùng "em", "anh/chị", "quý vị".
- Câu ngắn (≤ 25 từ). Một ý mỗi câu. Không cảm thán dồn dập, không emoji
  ngoài các emoji nguồn đã có (📣 ✓ và cờ).
- Ngôn ngữ đích viết đúng chính tả bản ngữ (dấu, hoa/thường, ß, ñ, kana,
  Hán tự, Hangul). Không phiên âm bằng chữ Việt ("bông-giua") trong văn bản
  học — gợi ý cách đọc đặt trong thẻ khái niệm và luôn nói rõ "gần giống".
- Không dịch sát tiêu đề tiếng Anh (calque). Tránh các cụm như "hiệu quả cao"
  (high-yield), "tần suất cao" (high-frequency), "nền tảng cốt lõi" (core
  foundations) trong tiêu đề và lời nhắn cho người học. Viết như người Việt
  nói: "Những động từ dùng nhiều nhất", "Những từ hay gặp nhất".

## 2. Thuật ngữ ngữ pháp (cố định — xem thêm `GLOSSARY.md`)

| Khái niệm | Tiếng Việt | Ghi chú |
|---|---|---|
| noun / verb / adjective / adverb | danh từ / động từ / tính từ / trạng từ | |
| article (definite / indefinite) | mạo từ (xác định / không xác định) | |
| masculine / feminine / neuter | giống đực / giống cái / giống trung | không "nam/nữ" |
| singular / plural | số ít / số nhiều | |
| subject / object | chủ ngữ / tân ngữ | |
| conjugation; to conjugate | chia động từ | |
| infinitive | động từ nguyên thể | |
| present / past / future | thì hiện tại / quá khứ / tương lai | |
| case (nominative / accusative / dative / genitive) | cách (chủ cách / đối cách / tặng cách / sở hữu cách) | tiếng Đức |
| particle | trợ từ | tiếng Nhật / Hàn |
| counter / measure word | lượng từ | tiếng Nhật / Trung |
| tone | thanh điệu | tiếng Trung; so sánh với 6 thanh tiếng Việt |
| pitch accent | trọng âm cao độ | tiếng Nhật |
| politeness level | mức lịch sự | tiếng Nhật / Hàn |
| liaison / elision | nối âm / lược âm | tiếng Pháp |
| cognate / false friend | từ cùng gốc / "bạn giả" | |
| syllable / stress | âm tiết / trọng âm | |

Dùng tên tiếng Việt kèm thuật ngữ bản ngữ trong ngoặc ở lần đầu trong
một thẻ khái niệm: "cách (Kasus)", "trợ từ (助詞)".

## 3. So sánh với tiếng Việt (bắt buộc trong thẻ khái niệm)

Mỗi thẻ khái niệm nêu điểm người Việt hay vấp (từ `briefs/<target>-vi.md`)
bằng MỘT câu so sánh cụ thể: "Tiếng Việt nói *tôi đã đi*; tiếng Tây Ban Nha
đổi chính động từ: *fui*." Không giảng lý thuyết đối chiếu dài.

## 4. Sự thật và sự trung thực

- Quy tắc "luôn luôn" chỉ khi dữ liệu dẫn xuất ≥ 99,5 % và ngoại lệ được
  nêu tên; nếu không, viết "thường", "hầu hết". Số liệu phải trỏ tới
  `content/<target>/lexicon/derived/*.json`.
- Không tái tạo câu mô tả CEFR (descriptor) — chỉ nêu tên thang đo và mức.
  Danh sách cụm cấm nằm trong `scripts/lib/authoring/lint.ts`
  (CEFR_DESCRIPTOR_PHRASES).
- Kết quả kiểm tra là "ước tính theo khung CEFR", "không phải chứng chỉ",
  "không phải kỳ thi chính thức". Không hứa hẹn ("bạn sẽ nói trôi chảy").
- Không câu chuyện bịa về người thật; nhân vật hư cấu có tên bản ngữ
  thông thường (Léa, Mateo, Mia, Yuki, Minji, Xiaomei…).

## 5. Độ dài và mức đọc

| Chuỗi | Giới hạn |
|---|---|
| Sách hướng dẫn (guidebook) đơn vị | 600–2 000 ký tự, ≥ 3 tiêu đề phụ hoặc gạch đầu dòng; có ví dụ ngôn ngữ đích in nghiêng |
| Mô tả đơn vị | ≤ 90 ký tự |
| Giải thích khái niệm | 2–6 câu, ≤ 700 ký tự |
| Quy tắc ngắn (shortRule) | 1 câu, ≤ 140 ký tự |
| Câu can-do | 1 câu bắt đầu bằng "Tôi có thể", ≤ 220 ký tự, nêu hành động + bối cảnh |
| Hướng dẫn bài tập / lời dẫn hội thoại | ≤ 120 ký tự |
| Câu ví dụ ngôn ngữ đích (A1) | ≤ 12 từ (≤ 20 âm tiết tiếng Nhật/Trung) |
| Bài đọc | ≤ 60 token (unit ≤ 2), ≤ 90 token (unit 5) |

## 6. Mẫu câu cố định

- Hướng dẫn: "Chọn bản dịch đúng.", "Nghe rồi chọn câu bạn nghe thấy.",
  "Gõ bằng tiếng <đích>.", "Nói câu này bằng tiếng <đích>.", "Viết một
  câu ngắn…", "Chọn mạo từ đúng."
- Can-do: "Tôi có thể <hành động> <bối cảnh>." Không "Tôi biết…", không
  "Tôi hiểu ngữ pháp…".
- Phản hồi viết (rubric): "Thiếu <ô>: …", "Hơi dài: …", "Có vẻ không phải
  tiếng <đích>." — trung tính, không mỉa mai.
- Mục tiêu hội thoại: "<Việc cần làm> <ở đâu / với ai>." (một câu).

## 7. Những gì KHÔNG dịch / không đổi

Tên riêng, địa danh bản ngữ, tiêu đề đơn vị bằng ngôn ngữ đích khi nguồn
để nguyên (Section 3–6 kiểu *Écoute !*), id, mã khoá, số liệu, emoji, dấu
ngoặc giữ nguyên.

## 8. Kiểm tra trước khi nộp OUTPUT.jsonl

1. Mỗi dòng là một JSON hợp lệ đúng schema trong PROMPT.md.
2. Mọi id (lexeme, objective, clip) lấy từ danh sách cho phép — không bịa.
3. Không chuỗi tiếng Anh sót trong trường `vi`; không chuỗi `TODO:`.
4. Mỗi quy tắc "luôn luôn" có bằng chứng; mỗi số liệu có nguồn.
5. Đọc lại bằng mắt người học Việt: câu nào cần đọc hai lần thì viết lại.


## Schema của MỘT record (JSON Schema, sinh từ zod)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "lessonId": {
      "type": "string",
      "minLength": 1
    },
    "exercises": {
      "minItems": 1,
      "type": "array",
      "items": {
        "oneOf": [
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "const": "select"
              },
              "id": {
                "type": "string",
                "minLength": 1
              },
              "mode": {
                "type": "string",
                "enum": [
                  "targetToNative",
                  "nativeToTarget",
                  "listen"
                ]
              },
              "prompt": {
                "type": "string"
              },
              "audioTarget": {
                "type": "string",
                "minLength": 1
              },
              "options": {
                "minItems": 2,
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "text": {
                      "type": "string",
                      "minLength": 1
                    },
                    "emoji": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "text"
                  ],
                  "additionalProperties": false
                }
              },
              "correct": {
                "type": "integer",
                "minimum": 0,
                "maximum": 9007199254740991
              },
              "gradeTargets": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1
                }
              },
              "objectiveTargets": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "pattern": "^[a-z]{2,3}\\.obj\\.[a-z0-9_]+\\.[a-z0-9_]+$"
                }
              }
            },
            "required": [
              "type",
              "id",
              "mode",
              "prompt",
              "options",
              "correct"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "const": "wordBank"
              },
              "id": {
                "type": "string",
                "minLength": 1
              },
              "direction": {
                "type": "string",
                "enum": [
                  "targetToNative",
                  "nativeToTarget"
                ]
              },
              "prompt": {
                "type": "string"
              },
              "audioTarget": {
                "type": "string",
                "minLength": 1
              },
              "tokens": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1
                }
              },
              "answer": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1
                }
              },
              "gradeTargets": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1
                }
              },
              "objectiveTargets": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "pattern": "^[a-z]{2,3}\\.obj\\.[a-z0-9_]+\\.[a-z0-9_]+$"
                }
              }
            },
            "required": [
              "type",
              "id",
              "direction",
              "prompt",
              "tokens",
              "answer"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "const": "match"
              },
              "id": {
                "type": "string",
                "minLength": 1
              },
              "pairs": {
                "minItems": 2,
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "target": {
                      "type": "string",
                      "minLength": 1
                    },
                    "native": {
                      "type": "string",
                      "minLength": 1
                    }
                  },
                  "required": [
                    "target",
                    "native"
                  ],
                  "additionalProperties": false
                }
              },
              "gradeTargets": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1
                }
              },
              "objectiveTargets": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "pattern": "^[a-z]{2,3}\\.obj\\.[a-z0-9_]+\\.[a-z0-9_]+$"
                }
              }
            },
            "required": [
              "type",
              "id",
              "pairs"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "const": "typeAnswer"
              },
              "id": {
                "type": "string",
                "minLength": 1
              },
              "mode": {
                "type": "string",
                "enum": [
                  "translate",
                  "listen",
                  "produceTarget"
                ]
              },
              "prompt": {
                "type": "string"
              },
              "audioTarget": {
                "type": "string",
                "minLength": 1
              },
              "answer": {
                "type": "string",
                "minLength": 1
              },
              "alternatives": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              },
              "gradeTargets": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1
                }
              },
              "objectiveTargets": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "pattern": "^[a-z]{2,3}\\.obj\\.[a-z0-9_]+\\.[a-z0-9_]+$"
                }
              }
            },
            "required": [
              "type",
              "id",
              "mode",
              "prompt",
              "answer",
              "alternatives"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "const": "fillBlank"
              },
              "id": {
                "type": "string",
                "minLength": 1
              },
              "sentence": {
                "type": "string",
                "minLength": 1
              },
              "translation": {
                "type": "string",
                "minLength": 1
              },
              "audioTarget": {
                "type": "string",
                "minLength": 1
              },
              "options": {
                "minItems": 2,
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1
                }
              },
              "correct": {
                "type": "integer",
                "minimum": 0,
                "maximum": 9007199254740991
              },
              "gradeTargets": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1
                }
              },
              "objectiveTargets": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "pattern": "^[a-z]{2,3}\\.obj\\.[a-z0-9_]+\\.[a-z0-9_]+$"
                }
              }
            },
            "required": [
              "type",
              "id",
              "sentence",
              "translation",
              "options",
              "correct"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "const": "articleSelect"
              },
              "id": {
                "type": "string",
                "minLength": 1
              },
              "articles": {
                "minItems": 2,
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1
                }
              },
              "noun": {
                "type": "string",
                "minLength": 1
              },
              "gloss": {
                "type": "string",
                "minLength": 1
              },
              "correct": {
                "type": "integer",
                "minimum": 0,
                "maximum": 9007199254740991
              },
              "audioTarget": {
                "type": "string",
                "minLength": 1
              },
              "objectiveTargets": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "pattern": "^[a-z]{2,3}\\.obj\\.[a-z0-9_]+\\.[a-z0-9_]+$"
                }
              }
            },
            "required": [
              "type",
              "id",
              "articles",
              "noun",
              "gloss",
              "correct"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "const": "conjugationCloze"
              },
              "id": {
                "type": "string",
                "minLength": 1
              },
              "sentence": {
                "type": "string",
                "minLength": 1
              },
              "translation": {
                "type": "string",
                "minLength": 1
              },
              "verb": {
                "type": "string",
                "minLength": 1
              },
              "cell": {
                "type": "string",
                "pattern": "^[a-z]+(?::[a-z0-9]+)*$"
              },
              "answer": {
                "type": "string",
                "minLength": 1
              },
              "alternatives": {
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1
                }
              },
              "objectiveTargets": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "pattern": "^[a-z]{2,3}\\.obj\\.[a-z0-9_]+\\.[a-z0-9_]+$"
                }
              }
            },
            "required": [
              "type",
              "id",
              "sentence",
              "translation",
              "verb",
              "cell",
              "answer",
              "alternatives"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "const": "listeningComprehension"
              },
              "id": {
                "type": "string",
                "minLength": 1
              },
              "clipId": {
                "type": "string",
                "pattern": "^[a-z]{2,3}\\.clip\\.[a-z0-9_]+$"
              },
              "question": {
                "type": "string",
                "minLength": 1
              },
              "options": {
                "minItems": 2,
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "text": {
                      "type": "string",
                      "minLength": 1
                    },
                    "emoji": {
                      "type": "string",
                      "minLength": 1
                    }
                  },
                  "required": [
                    "text"
                  ],
                  "additionalProperties": false
                }
              },
              "correct": {
                "type": "integer",
                "minimum": 0,
                "maximum": 9007199254740991
              },
              "objectiveTargets": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "pattern": "^[a-z]{2,3}\\.obj\\.[a-z0-9_]+\\.[a-z0-9_]+$"
                }
              }
            },
            "required": [
              "type",
              "id",
              "clipId",
              "question",
              "options",
              "correct"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "const": "readingComprehension"
              },
              "id": {
                "type": "string",
                "minLength": 1
              },
              "readingId": {
                "type": "string",
                "pattern": "^[a-z]{2,3}\\.read\\.[a-z0-9_]+$"
              },
              "question": {
                "type": "string",
                "minLength": 1
              },
              "options": {
                "minItems": 2,
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "text": {
                      "type": "string",
                      "minLength": 1
                    },
                    "emoji": {
                      "type": "string",
                      "minLength": 1
                    }
                  },
                  "required": [
                    "text"
                  ],
                  "additionalProperties": false
                }
              },
              "correct": {
                "type": "integer",
                "minimum": 0,
                "maximum": 9007199254740991
              },
              "objectiveTargets": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "pattern": "^[a-z]{2,3}\\.obj\\.[a-z0-9_]+\\.[a-z0-9_]+$"
                }
              }
            },
            "required": [
              "type",
              "id",
              "readingId",
              "question",
              "options",
              "correct"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "const": "dictation"
              },
              "id": {
                "type": "string",
                "minLength": 1
              },
              "clipId": {
                "type": "string",
                "pattern": "^[a-z]{2,3}\\.clip\\.[a-z0-9_]+$"
              },
              "answer": {
                "type": "string",
                "minLength": 1
              },
              "alternatives": {
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1
                }
              },
              "objectiveTargets": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "pattern": "^[a-z]{2,3}\\.obj\\.[a-z0-9_]+\\.[a-z0-9_]+$"
                }
              }
            },
            "required": [
              "type",
              "id",
              "clipId",
              "answer",
              "alternatives"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "const": "speakRepetition"
              },
              "id": {
                "type": "string",
                "minLength": 1
              },
              "speechItemId": {
                "type": "string",
                "pattern": "^[a-z]{2,3}\\.speak\\.[a-z0-9_]+$"
              },
              "modelClipId": {
                "type": "string",
                "pattern": "^[a-z]{2,3}\\.clip\\.[a-z0-9_]+$"
              },
              "target": {
                "type": "string",
                "minLength": 1
              },
              "acceptedVariants": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1
                }
              },
              "requiredConcepts": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "minItems": 1,
                  "type": "array",
                  "items": {
                    "type": "string",
                    "minLength": 1
                  }
                }
              },
              "objectiveTargets": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "pattern": "^[a-z]{2,3}\\.obj\\.[a-z0-9_]+\\.[a-z0-9_]+$"
                }
              }
            },
            "required": [
              "type",
              "id",
              "speechItemId",
              "modelClipId",
              "target",
              "acceptedVariants"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "const": "speakProduction"
              },
              "id": {
                "type": "string",
                "minLength": 1
              },
              "speechItemId": {
                "type": "string",
                "pattern": "^[a-z]{2,3}\\.speak\\.[a-z0-9_]+$"
              },
              "instruction": {
                "type": "string",
                "minLength": 1
              },
              "cueEmoji": {
                "type": "string",
                "minLength": 1
              },
              "cueFacts": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "label": {
                      "type": "string",
                      "minLength": 1
                    },
                    "value": {
                      "type": "string",
                      "minLength": 1
                    }
                  },
                  "required": [
                    "label",
                    "value"
                  ],
                  "additionalProperties": false
                }
              },
              "target": {
                "type": "string",
                "minLength": 1
              },
              "acceptedVariants": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1
                }
              },
              "requiredConcepts": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "minItems": 1,
                  "type": "array",
                  "items": {
                    "type": "string",
                    "minLength": 1
                  }
                }
              },
              "evidenceLexemeRefs": {
                "type": "array",
                "items": {
                  "type": "string",
                  "pattern": "^[a-z]{2,3}:w:[a-z0-9-]+$"
                }
              },
              "revealTargetAfterAttempts": {
                "anyOf": [
                  {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 5
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "allowContextualBias": {
                "type": "boolean"
              },
              "modelClipId": {
                "anyOf": [
                  {
                    "type": "string",
                    "pattern": "^[a-z]{2,3}\\.clip\\.[a-z0-9_]+$"
                  },
                  {
                    "type": "null"
                  }
                ]
              },
              "allowedAttempts": {
                "type": "integer",
                "minimum": 1,
                "maximum": 3
              },
              "objectiveTargets": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "pattern": "^[a-z]{2,3}\\.obj\\.[a-z0-9_]+\\.[a-z0-9_]+$"
                }
              }
            },
            "required": [
              "type",
              "id",
              "speechItemId",
              "instruction",
              "target",
              "acceptedVariants",
              "evidenceLexemeRefs",
              "revealTargetAfterAttempts",
              "allowContextualBias",
              "modelClipId",
              "allowedAttempts"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "const": "guidedWriting"
              },
              "id": {
                "type": "string",
                "minLength": 1
              },
              "writingTaskId": {
                "type": "string",
                "pattern": "^[a-z]{2,3}\\.write\\.[a-z0-9_]+$"
              },
              "writingMode": {
                "type": "string",
                "enum": [
                  "guided",
                  "open"
                ]
              },
              "instruction": {
                "type": "string",
                "minLength": 1
              },
              "cueFacts": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "label": {
                      "type": "string",
                      "minLength": 1
                    },
                    "value": {
                      "type": "string",
                      "minLength": 1
                    }
                  },
                  "required": [
                    "label",
                    "value"
                  ],
                  "additionalProperties": false
                }
              },
              "rubric": {
                "type": "object",
                "properties": {
                  "requiredSlots": {
                    "minItems": 1,
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string",
                          "pattern": "^[a-z0-9]+(?:_[a-z0-9]+)*$"
                        },
                        "description": {
                          "type": "string",
                          "minLength": 3
                        },
                        "variants": {
                          "minItems": 1,
                          "type": "array",
                          "items": {
                            "type": "string",
                            "minLength": 1
                          }
                        },
                        "cueProvided": {
                          "type": "boolean"
                        }
                      },
                      "required": [
                        "id",
                        "description",
                        "variants",
                        "cueProvided"
                      ],
                      "additionalProperties": false
                    }
                  },
                  "minTokens": {
                    "type": "integer",
                    "minimum": 2,
                    "maximum": 40
                  },
                  "maxTokens": {
                    "type": "integer",
                    "minimum": 6,
                    "maximum": 120
                  },
                  "requireSentenceVerbs": {
                    "minItems": 1,
                    "type": "array",
                    "items": {
                      "type": "string",
                      "minLength": 1
                    }
                  }
                },
                "required": [
                  "requiredSlots",
                  "minTokens",
                  "maxTokens"
                ],
                "additionalProperties": false
              },
              "modelAnswers": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1
                }
              },
              "objectiveTargets": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "pattern": "^[a-z]{2,3}\\.obj\\.[a-z0-9_]+\\.[a-z0-9_]+$"
                }
              }
            },
            "required": [
              "type",
              "id",
              "writingTaskId",
              "writingMode",
              "instruction",
              "rubric",
              "modelAnswers"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "const": "simpleForm"
              },
              "id": {
                "type": "string",
                "minLength": 1
              },
              "writingTaskId": {
                "type": "string",
                "pattern": "^[a-z]{2,3}\\.write\\.[a-z0-9_]+$"
              },
              "instruction": {
                "type": "string",
                "minLength": 1
              },
              "cueFacts": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "label": {
                      "type": "string",
                      "minLength": 1
                    },
                    "value": {
                      "type": "string",
                      "minLength": 1
                    }
                  },
                  "required": [
                    "label",
                    "value"
                  ],
                  "additionalProperties": false
                }
              },
              "fields": {
                "minItems": 2,
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "string",
                      "pattern": "^[a-z0-9]+(?:_[a-z0-9]+)*$"
                    },
                    "label": {
                      "type": "string",
                      "minLength": 1
                    },
                    "slotId": {
                      "type": "string",
                      "pattern": "^[a-z0-9]+(?:_[a-z0-9]+)*$"
                    }
                  },
                  "required": [
                    "id",
                    "label",
                    "slotId"
                  ],
                  "additionalProperties": false
                }
              },
              "rubric": {
                "type": "object",
                "properties": {
                  "requiredSlots": {
                    "minItems": 1,
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "id": {
                          "type": "string",
                          "pattern": "^[a-z0-9]+(?:_[a-z0-9]+)*$"
                        },
                        "description": {
                          "type": "string",
                          "minLength": 3
                        },
                        "variants": {
                          "minItems": 1,
                          "type": "array",
                          "items": {
                            "type": "string",
                            "minLength": 1
                          }
                        },
                        "cueProvided": {
                          "type": "boolean"
                        }
                      },
                      "required": [
                        "id",
                        "description",
                        "variants",
                        "cueProvided"
                      ],
                      "additionalProperties": false
                    }
                  },
                  "minTokens": {
                    "type": "integer",
                    "minimum": 2,
                    "maximum": 40
                  },
                  "maxTokens": {
                    "type": "integer",
                    "minimum": 6,
                    "maximum": 120
                  },
                  "requireSentenceVerbs": {
                    "minItems": 1,
                    "type": "array",
                    "items": {
                      "type": "string",
                      "minLength": 1
                    }
                  }
                },
                "required": [
                  "requiredSlots",
                  "minTokens",
                  "maxTokens"
                ],
                "additionalProperties": false
              },
              "modelAnswers": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "minLength": 1
                }
              },
              "objectiveTargets": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "pattern": "^[a-z]{2,3}\\.obj\\.[a-z0-9_]+\\.[a-z0-9_]+$"
                }
              }
            },
            "required": [
              "type",
              "id",
              "writingTaskId",
              "instruction",
              "fields",
              "rubric",
              "modelAnswers"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "const": "interactionScenario"
              },
              "id": {
                "type": "string",
                "minLength": 1
              },
              "scenarioId": {
                "type": "string",
                "pattern": "^[a-z]{2,3}\\.scenario\\.[a-z0-9_]+$"
              },
              "objectiveTargets": {
                "minItems": 1,
                "type": "array",
                "items": {
                  "type": "string",
                  "pattern": "^[a-z]{2,3}\\.obj\\.[a-z0-9_]+\\.[a-z0-9_]+$"
                }
              }
            },
            "required": [
              "type",
              "id",
              "scenarioId"
            ],
            "additionalProperties": false
          }
        ]
      }
    },
    "flow": {
      "type": "array",
      "items": {
        "anyOf": [
          {
            "type": "object",
            "properties": {
              "concept": {
                "type": "string",
                "minLength": 1
              }
            },
            "required": [
              "concept"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "exercise": {
                "type": "string",
                "minLength": 1
              }
            },
            "required": [
              "exercise"
            ],
            "additionalProperties": false
          }
        ]
      }
    }
  },
  "required": [
    "lessonId",
    "exercises"
  ],
  "additionalProperties": false
}
```

## Id cho phép

Xem `INPUT.json → allowedIds`: 894 lexeme, 35 objective, 0 clip, 0 reading, 0 speech item, 0 writing task, 0 scenario, 108 lesson, 23 concept. Loại bài tập: select, typeAnswer, wordBank, fillBlank, match, articleSelect, conjugationCloze, listeningComprehension, readingComprehension, dictation, speakRepetition, speakProduction, guidedWriting, simpleForm, interactionScenario.

## Ví dụ mẫu (tiếng Pháp, đã có tiếng Việt)

```json
[
  {
    "lessonId": "fr-vi:ua-l0",
    "exercises": [
      {
        "type": "select",
        "id": "fr-vi:ua-l0-e0",
        "mode": "targetToNative",
        "prompt": "la maison",
        "options": [
          {
            "text": "ngôi nhà"
          },
          {
            "text": "văn phòng"
          },
          {
            "text": "chuyến đi"
          },
          {
            "text": "món quà"
          }
        ],
        "correct": 0
      },
      {
        "type": "select",
        "id": "fr-vi:ua-l0-e1",
        "mode": "targetToNative",
        "prompt": "la question",
        "options": [
          {
            "text": "câu hỏi"
          },
          {
            "text": "lý do"
          },
          {
            "text": "sự thật"
          },
          {
            "text": "tin nhắn"
          }
        ],
        "correct": 0
      },
      {
        "type": "select",
        "id": "fr-vi:ua-l0-e2",
        "mode": "targetToNative",
        "prompt": "le voyage",
        "options": [
          {
            "text": "chuyến đi"
          },
          {
            "text": "khoảnh khắc"
          },
          {
            "text": "ngôi nhà"
          },
          {
            "text": "tờ giấy"
          }
        ],
        "correct": 0
      },
      {
        "type": "select",
        "id": "fr-vi:ua-l0-e3",
        "mode": "targetToNative",
        "prompt": "le bureau",
        "options": [
          {
            "text": "văn phòng"
          },
          {
            "text": "ngôi nhà"
          },
          {
            "text": "sếp"
          },
          {
            "text": "món quà"
          }
        ],
        "correct": 0
      }
    ],
    "flow": [
      {
        "concept": "fr:concept:gender-two-classes"
      },
      {
        "exercise": "fr-vi:ua-l0-e0"
      },
      {
        "exercise": "fr-vi:ua-l0-e1"
      },
      {
        "exercise": "fr-vi:ua-l0-e2"
      }
    ]
  },
  {
    "lessonId": "fr-vi:uh-l1",
    "exercises": [
      {
        "type": "select",
        "id": "fr-vi:uh-l1-e0",
        "mode": "nativeToTarget",
        "prompt": "đóng",
        "options": [
          {
            "text": "fermer"
          },
          {
            "text": "ouvrir"
          },
          {
            "text": "acheter"
          },
          {
            "text": "payer"
          }
        ],
        "correct": 0,
        "objectiveTargets": [
          "fr.obj.reading.familiar_words"
        ]
      },
      {
        "type": "listeningComprehension",
        "id": "fr-vi:uh-l1-e1",
        "clipId": "fr.clip.uh_magasin_ferme",
        "question": "Câu này nghĩa là gì?",
        "options": [
          {
            "text": "Cửa hàng đóng cửa sau mười phút nữa."
          },
          {
            "text": "Cửa hàng mở cửa sau mười phút nữa."
          },
          {
            "text": "Cửa hàng đóng cửa lúc mười giờ."
          },
          {
            "text": "Hôm nay cửa hàng đóng cửa."
          }
        ],
        "correct": 0,
        "objectiveTargets": [
          "fr.obj.listening.announcements"
        ]
      },
      {
        "type": "listeningComprehension",
        "id": "fr-vi:uh-l1-e2",
        "clipId": "fr.clip.uh_musee_ouvre",
        "question": "Chủ nhật bảo tàng mở cửa lúc mấy giờ?",
        "options": [
          {
            "text": "Lúc 10 giờ"
          },
          {
            "text": "Lúc 12 giờ"
          },
          {
            "text": "Lúc 2 giờ"
          },
          {
            "text": "Đóng cửa"
          }
        ],
        "correct": 0,
        "objectiveTargets": [
          "fr.obj.listening.announcements",
          "fr.obj.listening.short_info"
        ]
      },
      {
        "type": "select",
        "id": "fr-vi:uh-l1-e3",
        "mode": "targetToNative",
        "prompt": "ouvrir",
        "options": [
          {
            "text": "mở"
          },
          {
            "text": "đóng"
          },
          {
            "text": "mua"
          },
          {
            "text": "lấy, đi (tàu xe)"
          }
        ],
        "correct": 0,
        "objectiveTargets": [
          "fr.obj.reading.familiar_words"
        ]
      }
    ]
  },
  {
    "lessonId": "fr-vi:uo-l2",
    "exercises": [
      {
        "type": "wordBank",
        "id": "fr-vi:uo-l2-e0",
        "direction": "nativeToTarget",
        "prompt": "Sắp xếp: tôi sống ở Paris",
        "tokens": [
          "à",
          "j'habite",
          "Paris"
        ],
        "answer": [
          "j'habite",
          "à",
          "Paris"
        ]
      },
      {
        "type": "guidedWriting",
        "id": "fr-vi:uo-l2-e1",
        "writingTaskId": "fr.write.o_city",
        "writingMode": "guided",
        "instruction": "Vẫn là Léa: hãy viết một câu nói bạn sống ở đâu.",
        "cueFacts": [
          {
            "label": "Thành phố của bạn",
            "value": "Paris"
          }
        ],
        "rubric": {
          "requiredSlots": [
            {
              "id": "city",
              "description": "nơi bạn sống",
              "variants": [
                "j'habite à Paris",
                "j'habite Paris"
              ],
              "cueProvided": true
            }
          ],
          "minTokens": 3,
          "maxTokens": 12,
          "requireSentenceVerbs": [
            "habite"
          ]
        },
        "modelAnswers": [
          "J'habite à Paris."
        ],
        "objectiveTargets": [
          "fr.obj.writing.personal_info"
        ]
      }
    ]
  }
]
```

## Định dạng đầu ra

- Một record mỗi dòng (JSONL), UTF-8, không dấu phẩy cuối, không bình luận.
- Mọi trường tiếng Việt không chứa `TODO:`; mọi id lấy từ allowedIds.
- Khi không chắc một sự kiện ngôn ngữ, viết 'thường' thay vì 'luôn luôn' và ghi `note`.
