# objectives — es-vi (ngôn ngữ đích es, ngôn ngữ mẹ đẻ vi)

Bạn là tác giả nội dung của một ứng dụng học ngoại ngữ cục bộ cho người Việt. Mọi chữ người học nhìn thấy viết bằng tiếng Việt theo STYLE; ngôn ngữ đích viết đúng chính tả bản ngữ. Đầu ra là **một tệp JSONL**: mỗi dòng một record JSON hợp lệ theo schema dưới đây, không có văn bản nào khác. Không bịa id: chỉ dùng id trong `INPUT.json → allowedIds`. Không chép câu mô tả CEFR. Bản nháp này sẽ được validator kiểm tra tự động và người bản ngữ duyệt trước khi biên dịch.

## Nhiệm vụ

Soạn danh sách mục tiêu học tập (objectives) cho khoá học: khoảng 34 mục tiêu theo 9 nhóm (grammar, lexical, written_production, written_reception, spoken_reception, spoken_production, interaction, phonology, strategy), ~23 mục tiêu `essential`, mỗi mục tiêu có title và canDo bằng tiếng Việt, prerequisites, cefrAlignments (level, scaleName, relation direct|supports, sourceRef `cefr-cv-2020:<scale-slug>`), evidenceNote cho mọi alignment `direct`. Không bao giờ chép câu mô tả CEFR.

Số phiên dự kiến cho một khoá đầy đủ: 1. Ghi kết quả vào `content/es/_drafts/objectives/OUTPUT.jsonl` rồi chạy `bun scripts/author.ts ingest objectives --target es --native vi`; sửa đúng những dòng mà `REPORT.md` báo lỗi và chạy lại.

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

# Brief sư phạm: người Việt học tiếng Tây Ban Nha (`es-vi`)

## 1. Vì sao người Việt học
- Du học và định cư (Tây Ban Nha, Mexico, Mỹ Latinh), việc làm trong du lịch — khách sạn, hướng dẫn viên, dịch thuật thương mại với Mỹ Latinh; cộng đồng học vì sở thích (âm nhạc, phim, bóng đá) lớn nhất trong các ngôn ngữ Rôman sau tiếng Pháp.
- Kỳ thi mục tiêu ở A1: **DELE A1** (Instituto Cervantes; 4 phần: đọc, nghe, viết, nói) và **SIELE** (điểm theo thang). Chương trình này chỉ cung cấp *ước tính theo khung CEFR*, không mô phỏng đề thật.
- Biến thể: khoá chọn **tiếng Tây Ban Nha Mỹ Latinh trung tính** (gói `es-en` kế thừa dùng *ustedes*, không *vosotros*; giọng A ưu tiên es_MX). Ghi chú dạng Castilla (*vosotros*, /θ/) trong thẻ khái niệm, không dạy song song.

## 2. Người Việt thường vấp ở đâu
- **Ngữ âm**: /r/ rung (*perro* vs *pero*) — tiếng Việt không có; /x/ (*jamón*) dễ thành /h/; /ɲ/ (*niño*) gần "nh" Việt (lợi thế); nguyên âm đôi *ie/ue* (*tiempo, puerta*) hay bị tách; **trọng âm** là yếu tố mới hoàn toàn (tiếng Việt dùng thanh điệu) — *papá/papa*, *hablo/habló*; phụ âm cuối *-s, -n, -d* dễ bị nuốt vì tiếng Việt không phát âm phụ âm cuối hữu thanh.
- **Chữ viết**: bảng Latin quen thuộc; dấu sắc ở tiếng Việt khác dấu trọng âm ở tiếng Tây Ban Nha (*á* = trọng âm, không phải thanh); ¿ ¡ đầu câu; *ñ*, *ll*.
- **Ngữ pháp**: giống danh từ và mạo từ (*el/la/los/las*) — tiếng Việt không có; **chia động từ theo ngôi và thì** (tiếng Việt chỉ thêm *đã/đang/sẽ*) — *soy/eres/es*; **hai động từ "là"** *ser/estar*; hợp giống-số tính từ (*casa blanca / casas blancas*); đại từ chủ ngữ thường lược (*hablo*); trật tự tính từ sau danh từ (giống tiếng Việt — lợi thế); giới từ *a/en/de*; số nhiều *-s/-es*.
- **Từ vựng**: từ Hán-Việt không giúp; từ mượn tiếng Anh quen thuộc giúp nhận dạng từ cùng gốc (*hotel, taxi, restaurante*); "bạn giả" với tiếng Anh (*embarazada, éxito, carpeta*) cần cảnh báo cho người đã học tiếng Anh.

## 3. Những điều PHẢI dạy tường minh bằng tiếng Việt ở A1 (→ concept cards)
1. Giống danh từ: *-o* thường đực, *-a* thường cái, ngoại lệ *el día, la mano, el problema* (số liệu từ `derived/gender-stats.json`).
2. Mạo từ *el/la/los/las*, *un/una/unos/unas*; "el agua" (giống cái, mạo từ *el* trước *a-* có trọng âm).
3. Số nhiều *-s / -es*.
4. *Ser* và *estar*: bản chất vs trạng thái/vị trí — so sánh "là / đang / ở" của tiếng Việt.
5. Chia động từ hiện tại nhóm *-ar / -er / -ir* (bảng mẫu *hablar, comer, vivir*; bằng chứng `derived/morphology.json`).
6. Động từ bất quy tắc cốt lõi: *tener, ir, hacer, querer, poder* (hiện tại).
7. Lược chủ ngữ: đuôi động từ cho biết ngôi.
8. Hợp giống-số của tính từ; vị trí tính từ.
9. *Hay* (có/tồn tại) vs *tener* (có/sở hữu) — tiếng Việt dùng một từ "có".
10. Số 0–100; giờ; ngày tháng (*el lunes*, không mạo từ với tháng).
11. Phủ định *no* trước động từ; câu hỏi bằng ngữ điệu + ¿ ¡.
12. *Ir a* + nguyên thể (tương lai gần) — so sánh *sẽ*.
13. Quá khứ *pretérito* chỉ nhận biết các dạng cao tần (*fui, comí, hablé*) — so sánh *đã*.
14. Đại từ *me/te/le* với *gustar* ("tôi thích" = *me gusta* — đảo cấu trúc).
15. Giới từ *a/en/de/con/por/para* ở mức công thức.
16. Trọng âm và dấu sắc: quy tắc *-n/-s/nguyên âm* → âm tiết áp chót; dấu ghi ngoại lệ.
17. Phát âm *r/rr, j, ll/y, c/z* theo biến thể Mỹ Latinh (*seseo*).
18. Lịch sự: *tú* vs *usted*; *por favor / gracias / perdón*.

## 4. Kịch bản hội thoại ưu tiên (→ scenarios)
- Chào hỏi và giới thiệu (tên, quốc tịch "Soy de Vietnam", nghề); quán cà phê / nhà hàng gọi món và trả tiền; chợ và cửa hàng (giá, số lượng, "¿Cuánto cuesta?"); hỏi đường và phương tiện (*metro, autobús*); khách sạn / nhà trọ (đặt phòng, giấy tờ); hiệu thuốc / bác sĩ (triệu chứng đơn giản); điện thoại hẹn gặp; nơi làm việc (giờ làm, xin nghỉ); làm thủ tục (tên, địa chỉ, ngày sinh, số điện thoại).

## 5. Lộ trình thi (→ exam track, chỉ định dạng công khai)
- **DELE A1**: Đọc (4 bài, 25 câu, 45 phút), Nghe (4 bài, 25 câu, 20 phút), Viết (2 bài, 25 phút), Nói (4 bài, 15 phút + chuẩn bị). Dạng câu: ghép nối, trắc nghiệm 3 lựa chọn, điền mẫu, viết thư ngắn, mô tả tranh, hội thoại mô phỏng. KHÔNG sao chép đề thật; chỉ tái tạo định dạng.
- Trong ứng dụng: checkpoint §1–§6 + capstone A1 với 4 miền (nghe, đọc, nói, viết) + tương tác; cách nói kết quả: "ước tính theo khung CEFR".

## 6. Giọng audio và nhận dạng giọng nói
- Dàn giọng: xem `content/audio/voice-casts.json` (ứng viên es_MX-claude-high Apache-2.0, es_ES-davefx CC0, Kokoro ef_dora/em_alex, MeloTTS-ES; canary quyết định A/B).
- `recognitionLocale` `es-ES` (bộ nhận dạng thiết bị); bài nói chấp nhận biến thể *seseo*; chuẩn hoá ASR: bỏ dấu câu, giữ *ñ* và dấu sắc (plugin `scripts/lib/languages/es.ts`).


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
      "pattern": "^es\\.obj\\.[a-z0-9_]+\\.[a-z0-9_]+$"
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
        "pattern": "^es\\.obj\\.[a-z0-9_]+\\.[a-z0-9_]+$"
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
