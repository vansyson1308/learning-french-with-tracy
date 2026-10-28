# concepts — de-vi (ngôn ngữ đích de, ngôn ngữ mẹ đẻ vi)

Bạn là tác giả nội dung của một ứng dụng học ngoại ngữ cục bộ cho người Việt. Mọi chữ người học nhìn thấy viết bằng tiếng Việt theo STYLE; ngôn ngữ đích viết đúng chính tả bản ngữ. Đầu ra là **một tệp JSONL**: mỗi dòng một record JSON hợp lệ theo schema dưới đây, không có văn bản nào khác. Không bịa id: chỉ dùng id trong `INPUT.json → allowedIds`. Không chép câu mô tả CEFR. Bản nháp này sẽ được validator kiểm tra tự động và người bản ngữ duyệt trước khi biên dịch.

## Nhiệm vụ

Viết các thẻ khái niệm (concept) tiếng Việt cho Phần 2 (17–20 thẻ theo brief §3) và các bảng chia động từ (paradigm): record là một concept (title, shortRule, explanation, examples{target, translations.vi, note.vi}, exceptions, memoryHint, objectives, sourceRefs) HOẶC {paradigm: {lemma, gloss.vi, group, cells, evidence}}. Mọi ô chia phải có trong morphology.json; mọi số liệu trỏ tới derived/*.json; 'luôn luôn' chỉ khi ≥ 99,5 %.

Số phiên dự kiến cho một khoá đầy đủ: 1–2. Ghi kết quả vào `content/de/_drafts/concepts/OUTPUT.jsonl` rồi chạy `bun scripts/author.ts ingest concepts --target de --native vi`; sửa đúng những dòng mà `REPORT.md` báo lỗi và chạy lại.

## Khuôn mẫu (blueprint)

## 3. Pedagogy (`content/<target>/pedagogy/`)

17 concept cards (`concepts.json`: title, shortRule, explanation,
examples with notes, exceptions, memoryHint, objectives, sourceRefs):
gender ×4, être/avoir, -er verbs, futur proche, passé composé, cognates ×2,
false friends, numbers ×3, elision, liaison, h. 8 paradigm tables
(`paradigms.json`: lemma, gloss, group, cells inf/pre:1s…3p/participle,
evidence source) — every cell must be evidenced by the committed morphology
rows (`derived/morphology.json` for ETL languages, `verb-morphology.json`
for French). Rules of `RESEARCH.md`: clean-room prose; "always" only at
≥ 99.5 % with named exceptions, else "usually"; spoken cues never labelled
IPA; every statistic cites the derived evidence.

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
  "anyOf": [
    {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^de:concept:[a-z0-9]+(?:-[a-z0-9]+)*$"
        },
        "title": {
          "type": "object",
          "propertyNames": {
            "type": "string",
            "pattern": "^[a-z]{2,3}$"
          },
          "additionalProperties": {
            "type": "string",
            "minLength": 1
          }
        },
        "shortRule": {
          "type": "object",
          "propertyNames": {
            "type": "string",
            "pattern": "^[a-z]{2,3}$"
          },
          "additionalProperties": {
            "type": "string",
            "minLength": 1
          }
        },
        "explanation": {
          "type": "object",
          "propertyNames": {
            "type": "string",
            "pattern": "^[a-z]{2,3}$"
          },
          "additionalProperties": {
            "type": "string",
            "minLength": 1
          }
        },
        "examples": {
          "minItems": 1,
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "target": {
                "type": "string",
                "minLength": 1
              },
              "translations": {
                "type": "object",
                "propertyNames": {
                  "type": "string",
                  "pattern": "^[a-z]{2,3}$"
                },
                "additionalProperties": {
                  "type": "string",
                  "minLength": 1
                }
              },
              "note": {
                "type": "object",
                "propertyNames": {
                  "type": "string",
                  "pattern": "^[a-z]{2,3}$"
                },
                "additionalProperties": {
                  "type": "string",
                  "minLength": 1
                }
              }
            },
            "required": [
              "target",
              "translations"
            ],
            "additionalProperties": false
          }
        },
        "exceptions": {
          "type": "array",
          "items": {
            "type": "object",
            "propertyNames": {
              "type": "string",
              "pattern": "^[a-z]{2,3}$"
            },
            "additionalProperties": {
              "type": "string",
              "minLength": 1
            }
          }
        },
        "memoryHint": {
          "type": "object",
          "propertyNames": {
            "type": "string",
            "pattern": "^[a-z]{2,3}$"
          },
          "additionalProperties": {
            "type": "string",
            "minLength": 1
          }
        },
        "objectives": {
          "minItems": 1,
          "type": "array",
          "items": {
            "type": "string",
            "pattern": "^de\\.obj\\.[a-z0-9_]+\\.[a-z0-9_]+$"
          }
        },
        "sourceRefs": {
          "minItems": 1,
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "source": {
                "type": "string",
                "minLength": 1
              },
              "key": {
                "type": "string",
                "minLength": 1
              }
            },
            "required": [
              "source"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "id",
        "title",
        "shortRule",
        "explanation",
        "examples",
        "exceptions",
        "sourceRefs"
      ],
      "additionalProperties": false
    },
    {
      "type": "object",
      "properties": {
        "paradigm": {
          "type": "object",
          "properties": {
            "lemma": {
              "type": "string",
              "minLength": 1
            },
            "gloss": {
              "type": "object",
              "propertyNames": {
                "type": "string",
                "pattern": "^[a-z]{2,3}$"
              },
              "additionalProperties": {
                "type": "string",
                "minLength": 1
              }
            },
            "group": {
              "type": "string",
              "minLength": 1
            },
            "cells": {
              "type": "object",
              "propertyNames": {
                "type": "string",
                "enum": [
                  "inf",
                  "pre:1s",
                  "pre:2s",
                  "pre:3s",
                  "pre:1p",
                  "pre:2p",
                  "pre:3p",
                  "participle"
                ]
              },
              "additionalProperties": {
                "type": "string",
                "minLength": 1
              },
              "required": [
                "inf",
                "pre:1s",
                "pre:2s",
                "pre:3s",
                "pre:1p",
                "pre:2p",
                "pre:3p",
                "participle"
              ]
            },
            "evidence": {
              "type": "object",
              "properties": {
                "source": {
                  "type": "string",
                  "minLength": 1
                }
              },
              "required": [
                "source"
              ],
              "additionalProperties": false
            },
            "attributes": {
              "type": "object",
              "propertyNames": {
                "type": "string",
                "pattern": "^[a-z][a-zA-Z0-9]*$"
              },
              "additionalProperties": {
                "type": "string",
                "minLength": 1
              }
            }
          },
          "required": [
            "lemma",
            "gloss",
            "group",
            "cells",
            "evidence"
          ],
          "additionalProperties": false
        }
      },
      "required": [
        "paradigm"
      ],
      "additionalProperties": false
    }
  ]
}
```

## Id cho phép

Xem `INPUT.json → allowedIds`: 800 lexeme, 35 objective, 0 clip, 0 reading, 0 speech item, 0 writing task, 0 scenario, 0 lesson, 0 concept. Loại bài tập: select, typeAnswer, wordBank, fillBlank, match, articleSelect, conjugationCloze, listeningComprehension, readingComprehension, dictation, speakRepetition, speakProduction, guidedWriting, simpleForm, interactionScenario.

## Ví dụ mẫu (tiếng Pháp, đã có tiếng Việt)

```json
[
  {
    "id": "fr:concept:gender-two-classes",
    "title": {
      "en": "Every French noun has a gender",
      "vi": "Mọi danh từ tiếng Pháp đều có giống"
    },
    "shortRule": {
      "en": "Every noun is masculine (le) or feminine (la) — the article is part of the word.",
      "vi": "Mọi danh từ đều là giống đực (le) hoặc giống cái (la) — mạo từ là một phần của từ."
    },
    "explanation": {
      "en": "French sorts all nouns into two grammatical classes, masculine and feminine. This is a property of the word itself, not of the thing it names, so the reliable way to learn a noun is to learn it together with its article: 'le chat', 'la pomme'. The good news: a noun's ENDING often signals its gender, and the upcoming lessons teach only the ending patterns that a 36,940-noun analysis shows to be genuinely dependable.",
      "vi": "Tiếng Pháp xếp mọi danh từ vào hai lớp ngữ pháp: giống đực và giống cái. Đây là thuộc tính của chính từ đó, không phải của sự vật nó gọi tên, nên cách học danh từ đáng tin cậy là học cùng với mạo từ: 'le chat', 'la pomme'. Tin vui: ĐUÔI của danh từ thường báo hiệu giống của nó, và các bài sắp tới chỉ dạy những mẫu đuôi từ mà phân tích 36.940 danh từ cho thấy thật sự đáng tin."
    },
    "examples": [
      {
        "target": "le chat",
        "translations": {
          "en": "the cat",
          "vi": "con mèo"
        },
        "note": {
          "en": "masculine — le",
          "vi": "giống đực — le"
        }
      },
      {
        "target": "la pomme",
        "translations": {
          "en": "the apple",
          "vi": "quả táo"
        },
        "note": {
          "en": "feminine — la",
          "vi": "giống cái — la"
        }
      },
      {
        "target": "l'eau",
        "translations": {
          "en": "the water",
          "vi": "nước"
        },
        "note": {
          "en": "before a vowel sound the article shortens to l', hiding the gender — eau is feminine",
          "vi": "trước một nguyên âm, mạo từ rút thành l' nên che mất giống — eau là giống cái"
        }
      }
    ],
    "exceptions": [
      {
        "en": "Before a vowel sound, both le and la become l', so the article stops showing the gender. For those nouns, remember them with un/une instead: une eau minérale.",
        "vi": "Trước một âm nguyên âm, cả le và la đều thành l', nên mạo từ không còn cho biết giống nữa. Với những danh từ đó, hãy nhớ cùng un/une: une eau minérale."
      }
    ],
    "memoryHint": {
      "en": "Always learn 'le chat', never just 'chat'.",
      "vi": "Luôn học 'le chat', đừng bao giờ chỉ học 'chat'."
    },
    "objectives": [
      "fr.obj.gender.articles_basic"
    ],
    "sourceRefs": [
      {
        "source": "original-french-pedagogy"
      },
      {
        "source": "lexique-4",
        "key": "gender-suffix-stats"
      }
    ]
  },
  {
    "id": "fr:concept:cognate-tion-family",
    "title": {
      "en": "Hundreds of free words",
      "vi": "Hàng trăm từ “miễn phí”"
    },
    "shortRule": {
      "en": "A French noun in -tion is almost always the same word as in English — and feminine.",
      "vi": "Danh từ tiếng Pháp đuôi -tion hầu như luôn giống hệt từ tiếng Anh tương ứng — và là giống cái."
    },
    "explanation": {
      "en": "You already know a large stock of French: of the 16 -tion nouns frequent enough for this course's corpus-derived candidate pool, 15 are the same word in English — solution, question, direction, situation, attention, information, condition, conversation… (opération just swaps é for e). The gender comes free too: across the 36,940-noun analysis, -tion nouns run 99.5% feminine (1,895 measured), so say la solution, la direction — and remember l' hides the la in l'attention.",
      "vi": "Bạn đã biết một vốn từ tiếng Pháp lớn (qua tiếng Anh): trong 16 danh từ -tion đủ thông dụng để vào nhóm ứng viên lấy từ kho ngữ liệu của khóa học này, 15 từ giống hệt tiếng Anh — solution, question, direction, situation, attention, information, condition, conversation… (opération chỉ đổi é thành e). Giống của chúng cũng được tặng kèm: trong phân tích 36.940 danh từ, danh từ -tion là giống cái 99,5% (đo trên 1.895 từ), nên hãy nói la solution, la direction — và nhớ rằng l' che mất la trong l'attention."
    },
    "examples": [
      {
        "target": "la solution",
        "translations": {
          "en": "the solution",
          "vi": "giải pháp"
        },
        "note": {
          "en": "identical spelling",
          "vi": "cách viết giống hệt tiếng Anh"
        }
      },
      {
        "target": "la direction",
        "translations": {
          "en": "the direction",
          "vi": "hướng"
        },
        "note": {
          "en": "identical spelling",
          "vi": "cách viết giống hệt tiếng Anh"
        }
      },
      {
        "target": "l'attention",
        "translations": {
          "en": "attention",
          "vi": "sự chú ý"
        },
        "note": {
          "en": "feminine — the l' just hides it",
          "vi": "giống cái — l' chỉ che đi thôi"
        }
      }
    ],
    "exceptions": [
      {
        "en": "félicitation is the pool's one non-transparent -tion word: Félicitations ! means Congratulations!",
        "vi": "félicitation là từ -tion duy nhất trong nhóm không trong suốt: Félicitations ! nghĩa là Chúc mừng!"
      },
      {
        "en": "The words are shared, the sounds are not — French -tion says /sjɔ̃/, never /shun/.",
        "vi": "Từ thì giống nhau, âm thì không — -tion tiếng Pháp đọc /sjɔ̃/, không bao giờ đọc như tiếng Anh /shun/."
      }
    ],
    "memoryHint": {
      "en": "See -tion? Trust the meaning, say la.",
      "vi": "Thấy -tion? Tin vào nghĩa, nói la."
    },
    "objectives": [
      "fr.obj.strategy.cognate_transfer",
      "fr.obj.gender.ending_patterns"
    ],
    "sourceRefs": [
      {
        "source": "original-french-pedagogy"
      },
      {
        "source": "lexique-4",
        "key": "candidate-pool"
      },
      {
        "source": "lexique-4",
        "key": "gender-suffix-stats"
      }
    ]
  },
  {
    "paradigm": {
      "lemma": "être",
      "gloss": {
        "en": "to be",
        "vi": "là / thì / ở"
      },
      "group": "irregular",
      "cells": {
        "inf": "être",
        "pre:1s": "suis",
        "pre:2s": "es",
        "pre:3s": "est",
        "pre:1p": "sommes",
        "pre:2p": "êtes",
        "pre:3p": "sont",
        "participle": "été"
      },
      "evidence": {
        "source": "lexique-4"
      },
      "attributes": {
        "auxiliary": "avoir"
      }
    }
  }
]
```

## Định dạng đầu ra

- Một record mỗi dòng (JSONL), UTF-8, không dấu phẩy cuối, không bình luận.
- Mọi trường tiếng Việt không chứa `TODO:`; mọi id lấy từ allowedIds.
- Khi không chắc một sự kiện ngôn ngữ, viết 'thường' thay vì 'luôn luôn' và ghi `note`.
