# QĐ 1481/QĐ-BGDĐT, bậc 2, adults: format sources

The `en-vi` practice track `bac2-qd1481.json` follows what this decision states. Every item is original. MOET publishes no sample paper with the decision, so nothing could be copied, and the track is marked `formatFidelity: "partial"` (D-12).

**This is not VSTEP.** QĐ 729/QĐ-BGDĐT (VSTEP.3-5) covers bậc 3 to 5 only. Why the track is built this way: `plan/authoring/en-plan.md`.

## Documents

| Document | Number and date | Signed by | URL | Read | Copy |
|---|---|---|---|---|---|
| Decision on the format of the English proficiency test, level 2 of the 6-level framework, for adults | 1481/QĐ-BGDĐT, 10/5/2016, in force from signature (Art. 2); listed as in force | Nguyễn Vinh Hiển, Deputy Minister | [caselaw.vn](https://caselaw.vn/van-ban-phap-luat/145550-quyet-dinh-1481-qd-bgddt-nam-2016-ve-dinh-dang-de-thi-danh-gia-nang-luc-su-dung-tieng-anh-bac-2-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-danh-cho-nguoi-lon-do-bo-giao-duc-va-dao-tao-ban-hanh) | **yes**, 2026-10-31, body and attached format | Reproduction. The original file sits behind a login and was not opened. |
| The same decision | same | same | [hoatieu.vn](https://hoatieu.vn/phap-luat/quyet-dinh-1481-qd-bgddt-dinh-dang-de-thi-danh-gia-nang-luc-su-dung-tieng-anh-bac-2-danh-cho-nguoi-lon-111637) | **no**: HTTP 403 to the fetch tool, 2026-10-31. The block was not worked around. | Reproduction |
| The same decision, as the MOET national foreign language project published it | same | same | `https://ngoainguquocgia.moet.gov.vn/Portals/Legals/636638900335548835-QD%201481%20DD%20bac%202%20nguoi%20lon%20(10.5.2016).pdf`, linked as "Tệp 1" from [the University of Foreign Language Studies, Da Nang](https://ktdbclgd.ufl.udn.vn/van-ban-phap-quy/3124/) | **no**: 2026-11-02, the host answers 502 Bad Gateway (with an expired certificate), three tries. The Internet Archive was offline that day too. | **Official host, not yet opened.** Whether it is a signed scan is unknown. |
| Same format, MOET subdomain | not stated in what could be seen | not stated | `http://ntc.moet.gov.vn/content/dinh-dang-de-thi-bac-2-cua-bai-thi-danh-gia-nang-luc-ngoai-ngu-tieng-anh` | **no**: connection refused, and the name did not resolve from this machine, 2026-11-02. A search excerpt of it agrees with listening at about 25 minutes, 5 parts, 25 items, and speaking at 10 minutes with 2 of preparation. An excerpt is not a reading. | Official host, not opened |

**How it was read.** The caselaw.vn page was read through a fetch tool that passes the page through a small model, which limits long quotations. The figures below were asked for in three separate passes and agree. The quotations are short excerpts as that tool returned them. **No one has compared them with the signed copy**, so `checkedAgainstOfficialGuide` is `false` and the app shows the note. caselaw.vn is not an official source (QC 2026-11-01). The owner checks them against the signed scan before release: `plan/OWNER-FINAL-CHECKLIST.md`.

## What the decision states

| Skill | Time | Parts and items | Item types and content |
|---|---|---|---|
| Nghe | "Khoảng 25 phút, bao gồm thời gian 5 phút chuyển kết quả sang phiếu trả lời" | 5 parts, 25 items | 15 multiple choice, 10 gap-fill. Short announcements, dialogues and talks. Level 2 difficulty. |
| Đọc | 40 minutes, including transfer to the answer sheet | 4 parts, 30 items | 15 multiple choice, "8 câu ghép" matched to short notices, "7 câu trả lời câu hỏi". Texts total 700–750 words, level 2 to low level 3. Candidates choose an answer or fill in missing information on an information sheet. |
| Viết | 35 minutes | 3 tasks | 1: five complete sentences from given phrases. 2: a message or a work memo as instructed. 3: a letter or postcard about daily life as instructed. |
| Nói | "10 phút (bao gồm 2 phút chuẩn bị)" | 4 parts | 1: greetings. 2: social interaction, 3–5 questions on 2 topics, and the candidate asks up to 2 questions. 3: description of a person, an object, or a place to live, work or study. 4: discussion, where the candidate agrees or disagrees with a given opinion and suggestion. |

**Scoring.** Each skill is rated or converted to 0–25. The four are summed to at most 100, then converted to a scale of 10 and rounded to 0.5.

**Pass rule (quoted with its source: the decision).** "Có kết quả thi của cả 4 kỹ năng thi, tổng điểm của cả 4 kỹ năng đạt từ 6,5 điểm trở lên." The result table lists "Đạt bậc 2" at >7.5 and at 6.5–7.5, and "Không đạt bậc 2" below 6.5.

## What is unknown

- The split of items or item types across parts, and the texts per part. Only per-skill totals are stated.
- How many times a recording is played.
- Per-task points for writing, per-part timing and points for speaking, and word limits.
- Rubrics: the page mentions no marking criteria. It mentions no sample paper and no topic list.
- Whether speaking is one to one or in pairs. The decision only refers to an examiner.
- Which rounding method applies to 0.5.

## App consequences (the course's own design, stated in the track)

- **Part split.** Listening is 5+5+5 multiple choice and 5+5 gap items. Reading is 8 matching, 8+7 multiple choice and 7 information-sheet items. The totals follow the decision; the split does not come from it.
- **Gap-fill and short answers become three-way choices.** The real paper has the candidate write. The exam player has no typed answer linked to a clip or a reading, so these 17 items per form are choices. The app says so on each part.
- **Listening plays twice** (product rule §67). The decision does not state a number.
- **Speaking** shows 8 minutes plus 2 of preparation, which is the 10 the decision gives. The app plays the examiner, reduced to guided turns. Parts 3 and 4 are graded by recognised words, not by a rubric from the decision.
- **Writing** tasks carry no points (equal share), because the decision gives none. Rubrics are simple slots, so scores are approximate.
- **Pass rule in the engine:** total at least 65 of 100, every section taken. Because the decision rounds to 0.5, a real total just under 65 could round up to 6.5; the app does not assume this, and the note says so.
- **Vocabulary.** Bậc 2 is above the course's A1 syllabus. Items use wider words, and each listening and reading item lists its words outside the A1 list below the question, to tap for the Vietnamese gloss, in mock and practice alike (QC 2026-11-01). These are lexemes at band A2-1, so the 750 A1 words do not change. Writing and speaking items list none, because the list would give the model answer away. Only the reading total is enforced by the generator: 700–750 words per form, counting notices, matching statements and texts.
- **Readiness** is an estimate from course practice and never says a learner will pass.
- **Re-check before release:** TT 33/2026 replaces the 2014 framework, and a new bậc 2 format could appear.
- **No copying.** No official sample was seen or used.
