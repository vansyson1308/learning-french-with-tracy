# objectives — de-vi (ngôn ngữ đích de, ngôn ngữ mẹ đẻ vi)

Bạn là tác giả nội dung của một ứng dụng học ngoại ngữ cục bộ cho người Việt. Mọi chữ người học nhìn thấy viết bằng tiếng Việt theo STYLE; ngôn ngữ đích viết đúng chính tả bản ngữ. Đầu ra là **một tệp JSONL**: mỗi dòng một record JSON hợp lệ theo schema dưới đây, không có văn bản nào khác. Không bịa id: chỉ dùng id trong `INPUT.json → allowedIds`. Không chép câu mô tả CEFR. Bản nháp này sẽ được validator kiểm tra tự động và người bản ngữ duyệt trước khi biên dịch.

## Nhiệm vụ

Soạn danh sách mục tiêu học tập (objectives) cho khoá học: khoảng 34 mục tiêu theo 9 nhóm (grammar, lexical, written_production, written_reception, spoken_reception, spoken_production, interaction, phonology, strategy), ~23 mục tiêu `essential`, mỗi mục tiêu có title và canDo bằng tiếng Việt, prerequisites, cefrAlignments (level, scaleName, relation direct|supports, sourceRef `cefr-cv-2020:<scale-slug>`), evidenceNote cho mọi alignment `direct`. Không bao giờ chép câu mô tả CEFR.

Số phiên dự kiến cho một khoá đầy đủ: 1. Ghi kết quả vào `content/de/_drafts/objectives/OUTPUT.jsonl` rồi chạy `bun scripts/author.ts ingest objectives --target de --native vi`; sửa đúng những dòng mà `REPORT.md` báo lỗi và chạy lại.

## Khuôn mẫu (blueprint)

## 8. Assessment (`content/<target>/assessment/`)

34 objectives (`objectives.json`: grammar 8, lexical 5, written_production
5, written_reception 4, spoken_reception 4, spoken_production 4,
interaction 2, phonology 1, strategy 1; 23 essential; CEFR alignments 22
direct / 29 supports, cited by scale identity with `sourceRef`
`cefr-cv-2020`, **no descriptor text**; `direct` needs an evidenceNote).
7 checkpoints (`checkpoints.json`, demonstratedShare 0.66): section-1 12
select; section-2 18 (conjugationCloze 6, articleSelect 5, typeAnswer 3,
fillBlank 2, select 2); section-3 22 (listening 11, reading 7, dictation 2,
select 2); section-4 12 speakProduction; section-5 12 (guidedWriting 9,
simpleForm 3); section-6 6 interactionScenario; a1-capstone 20 (4 per
domain, 2 parallel forms of 10). Placement (`placement.json`): 4 stages
(foundations 4 clusters / 7 items, building_blocks 6 / 9, reception 4 / 6,
production 2 / 6), 28 items, maxItems 28, anchors strictly later per
cluster. `claim-policy.json` (v2): evaluated levels, required domains
(reception/production/interaction), ≥ 3 items and 2 distinct inputs per
direct objective, 2 task families + 2 scales per domain, fixed wording
"CEFR-aligned estimate — not an official CEFR examination or
certification". `attainment.json`: the per-domain essential objectives a
level estimate needs. Vocabulary / lesson / XP counts are never inputs.

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
    "id": {
      "type": "string",
      "pattern": "^de\\.obj\\.[a-z0-9_]+\\.[a-z0-9_]+$"
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
    "canDo": {
      "type": "object",
      "propertyNames": {
        "type": "string",
        "pattern": "^[a-z]{2,3}$"
      },
      "additionalProperties": {
        "type": "string",
        "minLength": 10
      }
    },
    "category": {
      "type": "string",
      "enum": [
        "lexical",
        "grammar",
        "spoken_reception",
        "written_reception",
        "spoken_production",
        "written_production",
        "interaction",
        "phonology",
        "strategy"
      ]
    },
    "prerequisites": {
      "type": "array",
      "items": {
        "type": "string",
        "pattern": "^de\\.obj\\.[a-z0-9_]+\\.[a-z0-9_]+$"
      }
    },
    "cefrAlignments": {
      "minItems": 1,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "level": {
            "type": "string",
            "enum": [
              "PRE_A1",
              "A1",
              "A2",
              "B1",
              "B2",
              "C1",
              "C2"
            ]
          },
          "scaleName": {
            "type": "string",
            "minLength": 1
          },
          "relation": {
            "type": "string",
            "enum": [
              "direct",
              "supports"
            ]
          },
          "sourceRef": {
            "type": "string",
            "minLength": 1
          }
        },
        "required": [
          "level",
          "scaleName",
          "relation",
          "sourceRef"
        ],
        "additionalProperties": false
      }
    },
    "essential": {
      "type": "boolean"
    },
    "evidenceNote": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "title",
    "canDo",
    "category",
    "prerequisites",
    "cefrAlignments",
    "essential"
  ],
  "additionalProperties": false
}
```

## Id cho phép

Xem `INPUT.json → allowedIds`: 800 lexeme, 0 objective, 0 clip, 0 reading, 0 speech item, 0 writing task, 0 scenario, 0 lesson, 0 concept. Loại bài tập: select, typeAnswer, wordBank, fillBlank, match, articleSelect, conjugationCloze, listeningComprehension, readingComprehension, dictation, speakRepetition, speakProduction, guidedWriting, simpleForm, interactionScenario.

## Ví dụ mẫu (tiếng Pháp, đã có tiếng Việt)

```json
[
  {
    "id": "fr.obj.greetings.basic",
    "title": {
      "en": "Everyday greetings & politeness",
      "vi": "Lời chào & phép lịch sự hằng ngày"
    },
    "canDo": {
      "en": "I can recognise and write the everyday French greetings and politeness formulas — bonjour, bonsoir, salut, au revoir, merci, s'il vous plaît — and pick the right one for the situation.",
      "vi": "Tôi có thể nhận ra và viết các lời chào và công thức lịch sự hằng ngày trong tiếng Pháp — bonjour, bonsoir, salut, au revoir, merci, s'il vous plaît — và chọn đúng câu cho tình huống."
    },
    "category": "lexical",
    "prerequisites": [],
    "cefrAlignments": [
      {
        "level": "PRE_A1",
        "scaleName": "Conversation (spoken interaction)",
        "relation": "supports",
        "sourceRef": "cefr-cv-2020:conversation"
      },
      {
        "level": "A1",
        "scaleName": "Sociolinguistic appropriateness",
        "relation": "supports",
        "sourceRef": "cefr-cv-2020:sociolinguistic-appropriateness"
      }
    ],
    "essential": true,
    "evidenceNote": "Formulas are assessed in written recognition and typed form only — spoken use is not yet assessed."
  },
  {
    "id": "fr.obj.verbs.futur_proche",
    "title": {
      "en": "Near future with aller",
      "vi": "Tương lai gần với aller"
    },
    "canDo": {
      "en": "I can talk about plans by putting aller in front of any verb — Je vais manger, Nous allons parler.",
      "vi": "Tôi có thể nói về dự định bằng cách đặt aller trước bất kỳ động từ nào — Je vais manger, Nous allons parler."
    },
    "category": "grammar",
    "prerequisites": [
      "fr.obj.verbs.aller_faire_present"
    ],
    "cefrAlignments": [
      {
        "level": "A1",
        "scaleName": "Grammatical accuracy",
        "relation": "supports",
        "sourceRef": "cefr-cv-2020:grammatical-accuracy"
      }
    ],
    "essential": false
  },
  {
    "id": "fr.obj.reading.notices_info",
    "title": {
      "en": "Finding information in notices & signs",
      "vi": "Tìm thông tin trong thông báo & biển hiệu"
    },
    "canDo": {
      "en": "I can find concrete information in everyday notices, signs, opening hours and simple practical texts.",
      "vi": "Tôi có thể tìm thông tin cụ thể trong thông báo, biển hiệu, giờ mở cửa và các văn bản thực dụng đơn giản hằng ngày."
    },
    "category": "written_reception",
    "prerequisites": [
      "fr.obj.reading.familiar_words"
    ],
    "cefrAlignments": [
      {
        "level": "A1",
        "scaleName": "Reading for orientation (signs & notices)",
        "relation": "direct",
        "sourceRef": "cefr-cv-2020:reading-orientation"
      }
    ],
    "essential": true,
    "evidenceNote": "Direct at A1: original notices/schedules with locate-type questions, scored in the Section-3 checkpoint."
  }
]
```

## Định dạng đầu ra

- Một record mỗi dòng (JSONL), UTF-8, không dấu phẩy cuối, không bình luận.
- Mọi trường tiếng Việt không chứa `TODO:`; mọi id lấy từ allowedIds.
- Khi không chắc một sự kiện ngôn ngữ, viết 'thường' thay vì 'luôn luôn' và ghi `note`.
