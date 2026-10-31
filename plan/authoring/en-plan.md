# P4f — exam track decision and working notes for `en-vi`

## Decision (2026-10-31): no "VSTEP bậc 1–2" and no TOEIC set; the track models QĐ 1481 at bậc 2

`plan/prompts/P4f-en-vi-vstep.md` and D-13 ask for "VSTEP A1–A2" and a "TOEIC-basics" set. Research from official sources (agent, 2026-10-31; re-read each document before authoring) says neither can be done honestly as written.

**VSTEP has no bậc 1–2 format.** QĐ 729/QĐ-BGDĐT (11/3/2015) covers bậc 3–5 only, and the VNU site says VSTEP targets B1–C1. Calling a track "VSTEP bậc 1–2" would be a false level claim, which non-negotiable 3 forbids. A learner could also read it as a certificate.

**MOET has separate formats that do not use the name VSTEP:**

| Document | Covers | Format |
|---|---|---|
| [QĐ 1481/QĐ-BGDĐT](https://hoatieu.vn/phap-luat/quyet-dinh-1481-qd-bgddt-dinh-dang-de-thi-danh-gia-nang-luc-su-dung-tieng-anh-bac-2-danh-cho-nguoi-lon-111637), 10/5/2016 (read on caselaw.vn: `content/en/exam/FORMAT-SOURCES.md`) | Bậc 2, adults | Listening 5 parts, 25 items (15 multiple choice, 10 gap-fill), about 25 min with 5 for transfer; Reading 4 parts, 30 items (15 multiple choice, 8 matching, 7 short answer), 700–750 words, 40 min; Writing 3 tasks, 35 min; Speaking 4 parts, 10 min with 2 of preparation. Each skill 0–25; pass: all four taken, total ≥ 6.5/10, rounded to 0.5 |
| [QĐ 1479/QĐ-BGDĐT](https://hoatieu.vn/phap-luat/quyet-dinh-1479-qd-bgddt-ve-dinh-dang-de-thi-danh-gia-nang-luc-su-dung-tieng-anh-bac-1-tieu-hoc-2016-111624), 10/5/2016 | Bậc 1, primary pupils | Written for children; scoring not read. Not suitable for adults |

**So:**
- **Track:** "Luyện đề đánh giá năng lực tiếng Anh bậc 2 (theo định dạng QĐ 1481/QĐ-BGDĐT)", `content/en/exam/bac2-qd1481.json`, level A2, `formatFidelity: "partial"`: QĐ 1481 gives per-skill totals and per-skill item types (corrected 2026-10-31; the earlier note said no item split at all), but no split by part, no rubric and no official sample, so the part design and the question types are the course's own. Gap-fill and short-answer items become three-way choices. The description says this in Vietnamese.
- **Honest about the gap:** `en-vi` teaches A1, and this is an A2 format. The description says it is a further goal, not something the A1 course prepares a learner to pass. The readiness message never says "sẽ đỗ". The 6.5/10 pass mark comes from the decision itself, so it may be quoted with its source.
- **VSTEP** may be named only to say that VSTEP.3-5 covers bậc 3–5 and that this track is not VSTEP.
- **TOEIC:** no set. ETS's guidelines bar the name from product names and advertising keywords, require a notice on an app's opening screen, and copyrighted items need a licence. ETS itself points beginners to TOEIC Bridge. TOEIC Listening & Reading is far above A1. A learner may meet the word in guide text at most, with ETS's required notice if it ever appears in the app.
- **A1:** no exam simulation. The capstone remains the A1 check.

**Re-check before release:** TT 33/2026 replaces the 2014 framework, and assessments under the old framework may continue until 31/12/2027. A new bậc 2 format could appear; the track must then change.

This departs from the wording of P4f and D-13. It is recorded in `plan/STATUS.md` and the P4f report for the coordinator.

## Pedagogy notes
- IPA: General American primary, British variants noted.
- Speech: `en-US` recogniser, with `en-GB` accepted, per P4f.
- Audio: Kokoro `am_michael` (A), `af_heart` (B), per `content/audio/voice-casts.json`. The brief's MeloTTS-EN mention is out: MeloTTS fails the lineage gate (D-11).
- Scenarios per P4f: job interview basics, workplace instructions, email and phone, shop, directions, clinic, introducing yourself at work.
- Onboarding: `en-vi` becomes the default suggestion for Vietnamese UI users once it passes the claim gate.
