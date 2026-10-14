# Market research: turning "Learning French with Tracy" into a national language-learning app for Vietnam (October 2026)

Scope: global and Vietnamese market landscape, what Vietnamese learners want, what the learning science says works, which "breakthrough" features an indie, local-first, privacy-first Expo/React Native app can realistically ship, monetisation compatible with "free, no ads", and a ranked recommendation. Every number traces to a source in the list at the end; where a source is a vendor or a third-party aggregator, that is flagged.

---

## 0. Executive summary

- The product is a complete, well-engineered **French A1 course for English speakers**. Vietnam's mass market is overwhelmingly **Vietnamese speakers learning English, Chinese, Japanese and Korean**, in that order of demand, mostly for exams and jobs. French is a niche in Vietnam. A "national" app therefore means re-targeting the engine, not the French content: **Vietnamese UI and explanations, English/Chinese/Japanese/Korean as target languages, exam tracks**.
- The incumbents' weakest points in 2026 are exactly where a privacy-first, offline indie app can win: Duolingo's energy system and ad load for free users [6][8], paid-only AI conversation (Max is 7 language pairs, none from Vietnamese) [9][34], ELSA's price and offline-less, Premium-gated AI [17][18], and every big app's cloud dependency.
- The learning science consensus (spaced retrieval, comprehensible input, output practice with feedback) favours what the app already does; the two biggest gaps versus the market are **a spoken-conversation tutor** and **pronunciation feedback that is better than "did the recogniser get the words"**. Both are now feasible on-device on 2026 Android hardware, with caveats on RAM and model licensing.
- Vietnam is a price-sensitive, Android-majority (about 60%) market where grey-market reselling of Super Duolingo/ELSA accounts is widespread and most devices are sub-$400 [34][45][46]. "Free, no account, works offline, in Vietnamese" is a genuine differentiator here, not just an ethical stance.
- Ranked recommendation (section 6): Vietnamese-native UI + English course first; on-device ASR + pronunciation scoring; scripted roleplay before free LLM chat; exam-track modes (TOEIC/IELTS basics, HSK 1–2, JLPT N5, TOPIK I); FSRS-6 already there, make it visible; graded stories; "learn from your own text"; optional BYO-key cloud tutor; donations + one-time "supporter pack"; Play Store compliance plan. Do not: chase 8 languages at once, copy Duolingo's streak/energy economy, ship a general LLM chatbot as the headline, build servers, or add analytics "just a little".

---

## 1. Market landscape 2026

### 1.1 Size and growth

Numbers vary widely by analyst definition; use them for direction, not precision.

- Meticulous Research values the online language learning market at **USD 15.8B in 2025, USD 17.7B in 2026, growing to USD 50.6B by 2036 (11.1% CAGR)**. Self-learning apps hold the largest share; Asia-Pacific is both the largest and fastest-growing region; English is the largest language segment, driven by business and tests such as IELTS/TOEFL [1].
- An aggregator (VoxBooster) cites Mordor Intelligence at about USD 21.1B for 2025 with **Asia-Pacific at 45.75% of revenue**, and Business Research Insights at about USD 5.8B for the "apps" segment in 2025. Language-learning apps logged about 316M downloads in 2024 (Business of Apps) [2]. These are secondary citations; treat them as indicative.
- Duolingo alone: **58.7M DAU, 140.6M MAU, 12.7M paid subscribers, USD 298.5M quarterly revenue in Q2 2026** (DAU +23% YoY); FY2025 revenue USD 1,037.6M (+39%); FY2026 guidance implies about 16% growth. US share of revenue fell to 38% in 2025 and no other country exceeds 10% [3][4]. Revenue per DAU is falling (about USD 5.09 vs 5.29 a year earlier) as growth shifts to lower-ARPU markets [3].

### 1.2 The incumbents, one by one

**Duolingo** — Core loop: a linear path of 3–5 minute lessons, XP, leagues, streak; free with ads, Super (no ads, unlimited mistakes), Max (AI). Prices in the US: Super about USD 13.99/month or 84/year; Max USD 29.99/month or 168/year [9]. 2025–26 product moves: (a) **Energy replaced Hearts** (announced July 2025, rolled out gradually). Free users get 25 energy; energy drains with every exercise, not just mistakes; refill via gems, practice, friend invites, ads in some regions, or subscription. In an Android Authority poll of 17,961 readers, 62% disliked it [6]. (b) **"AI-first" memo** (28 April 2025) saying contractors would be replaced where AI could do the work; TikTok lost over 400,000 followers within weeks; the CEO later said the memo "did not give enough context", and in April 2026 dropped AI use as a formal performance-review metric [7]. (c) **Explain My Answer became free for everyone in January 2026**, leaving Video Call and Roleplay as Max's differentiators; Video Call with Lily is available for Spanish, French, German, Italian, Portuguese, Japanese and Korean **from English only** [9]. In Q2 2026 Duolingo said most new Super subscribers now get Video Call, with existing Super subscribers to follow "later this year" [4]. (d) Complaint themes in a June 2026 review spike (71 one-to-three-star App Store reviews in 48 hours, about 3.2x normal): aggressive notifications, the energy system, excessive ads, incorrect translations/unclear lessons [8]. Praise: free tier, playful interface, habit formation; the company reports 84% current-user retention and that learners who reach a 7-day streak are 3.6x more likely to complete a course (correlational, company data) [3][55].

**Babbel** — Core loop: expert-written, dialogue-based lessons organised by CEFR-ish levels; subscription-only beyond a free first lesson. **Babbel Speak** launched in open beta on 16 September 2025: a voice-led trainer that walks subscribers through curated real-life scenarios (ordering coffee, greeting a neighbour), with objectives stated upfront and "gentle animations" to lower speaking anxiety; English, Spanish, French, Italian, German; pedagogy decides progression, AI handles conversational flow [11]. Reviewers call it pricey for short subscriptions and thin for less popular languages [21]. Efficacy claims: Yale (3 months, 100% of participants improved oral proficiency, 75% over 40) and Michigan State (3 months Spanish, ACTFL-rated) studies, hours and n not stated [54].

**Busuu (Chegg)** — Core loop: structured courses plus community corrections from native speakers; **Busuu Conversations** (18 October 2024) added two-way AI dialogues with real-time feedback for English and Spanish inside the complete courses; 16 interface languages; over 120M registered users [14]. Reviewers: good personalised study plans; the best features are paid and it is "pricey" [21].

**Speak** — Core loop: hundreds of spoken sentences per week with real-time feedback, Live Roleplays, a "Speak Tutor" personalising the path. **USD 78M Series C at a USD 1B valuation (December 2024)**, OpenAI Startup Fund participating; integrates OpenAI's Realtime API; over 10M learners in 40+ countries; strongest in South Korea, expanding in Japan and Taiwan, with Southeast Asia named as a target; consumer price about USD 20/month or 99/year [12]. On the Vietnam App Store it lists Vietnamese among its 16 languages, rates 4.8 from 25k ratings, and prices annual plans at 1,299,000–2,349,000 VND and monthly at 249,000–509,000 VND [25]. This is the most direct "AI speaking tutor" threat in Vietnam.

**Praktika** — Core loop: conversation with lip-synced AI avatars (American, British, Asian, Indian accents); lessons adapt with use; orchestrates GPT-4, Gemini, Claude and Mistral; USD 35.5M Series A (May 2024), 1.2M MAU, almost USD 20M revenue in the prior 12 months [13].

**ELSA Speak (Vietnamese-founded, HQ US, office in Ho Chi Minh City)** — Core loop: short pronunciation drills scored phoneme-by-phoneme with a proprietary ASR, plus AI conversation/grammar coaches; USD 23M Series C (September 2023, UOB-led, total USD 60M), B2B push, growth in Taiwan, Japan, Middle East [15][89]. 10M+ Google Play installs, 4.5 stars, about 1M reviews [16]. Vietnamese list prices: Premium 1 year 2,745,000 VND (promo 999,000), lifetime 6,800,000; Pro 1 year 1,595,000 (promo 829,000); free tier limited to 2 exercises per topic; **requires an internet connection, no offline**; max 3 devices [17]. Vietnamese forum users (VOZ) complain that it is expensive, that scoring accepts added vowels and over-rewards stress, that AI features sit only in the top tier, that the scenario chat feels "tù" (stiff), and that it "tụt hậu" (fell behind) once general AI tools arrived; praise is limited to gradual pronunciation gains and being an early pioneer [18]. A JDI market note places ELSA second in Vietnam behind Duolingo with 54M downloads worldwide [29].

**Memrise, Lingvist, Drops, Mondly, Pimsleur, Rosetta Stone** — TechRadar's 2025–26 round-up: Memrise is video/flashcard-based but "not as deep"; Drops is vocabulary-only with a free-tier time limit and no conversation; Mondly is "not suited to advanced learners" and pricey without discounts; Pimsleur is audio-first, no free tier, expensive; Rosetta Stone USD 10.50/month annual or USD 199 lifetime, immersive but repetitive [21].

**LingQ** — Core loop: read/listen to any imported text (articles, YouTube/Netflix captions, EPUB/PDF), tap unknown words to save "LingQs", SRS review; free tier capped at 20 saved words and 5 imports; Premium USD 14.99/month or 119.99/year; weaknesses: steep learning curve, review pile-up, hard for complete beginners, no structured grammar [22]. This is the reference design for "learn from your own content".

**LingoDeer** — Launched with Korean, Japanese and Chinese; praised for alphabet/pronunciation guides and grammar "learning tips"; criticised as "twice as expensive as it should be" (USD 18.99/month, 164.99 lifetime), buggy, oddly ordered early lessons, weak speaking [23].

**HelloTalk / Tandem** — Language exchange with native speakers plus built-in translation and correction; HelloTalk claims over 70M registered users (2026) and over 1M paid users (2023); over half of users are from China, Japan, Korea and the US; freemium [24].

**Anki** — Free on desktop/Android, paid iOS app funds development; FSRS is integrated (opt-in) [52][86]. See section 3.

**Vietnamese JP/KR apps (Migii, Dungmori, Riki)** — Dungmori (iOS VN: 4.7 stars, about 2k ratings) sells JLPT-level course packs as one-time in-app purchases: N5 1,290,000 VND, N4 1,890,000, N3 2,649,000, N2 2,949,000, N1 3,290,000, N5 mock tests 400,000; features video lectures, teacher-answered comments, mock tests "following the real exam format", flashcards with spaced review, and in-app chat support [26]. Riki (Google Play 50K+ installs, 4.7–4.8 stars) offers video lectures N5–N1, instant-graded exercises, flashcards and a free document library [27]. The pattern: **course packs priced like a cram-school, sold per exam level, with human-teacher presence as the trust signal**.

**Prep.vn, Edupia, Elight** — Prep raised USD 7M Series A (May 2024) with "Virtual Speaking and Virtual Writing Rooms" for test prep, serving Tier 2–3 towns at comparatively low tuition [28]. Edupia claims over 5M users and 400,000 paying students; Vietnam's EdTech market is estimated at USD 364.7M (2024) with over 11% CAGR [29].

### 1.3 Platform players (the ceiling above everyone)

- **Google**: "Little Language Lessons" (29 April 2025) are Gemini-built experiments: Tiny Lesson (situation vocabulary/grammar), Slang Hang (realistic slang dialogues), Word Cam (camera-to-vocabulary) [19]. Gemini Nano is exposed to apps through ML Kit's Prompt API on supported Android devices, and Expo now wraps it (alpha) [70].
- **Apple**: Live Translation with AirPods supports English, French, German, Portuguese, Spanish, Italian, Mandarin (Simplified/Traditional), Japanese and Korean, requiring an Apple Intelligence iPhone on iOS 26; **Vietnamese is not supported on AirPods**, only in Messages Live Translation and as an Apple Intelligence beta language [20]. Apple's on-device Foundation Models are also exposed to third-party apps on iOS 26 [70].
- **OpenAI**: ChatGPT Voice is widely used ad hoc for conversation practice; reviewers rate it above Duolingo Max for conversation quality [9]. No dedicated language-learning product was found as of this research; the threat is "good enough free chat", not a structured course.

**Implication:** the platform players will commoditise "talk to an AI in language X". What they will not do is: a curriculum, a lexicon-driven SRS, exam alignment, Vietnamese-language explanations, or offline-by-design. Those are the moat.

### 1.4 What users praise and complain about (synthesis)

Praise clusters: free access, habit/streak scaffolding, short sessions, pronunciation feedback (ELSA), speaking confidence (Speak/Praktika), community corrections (Busuu/HelloTalk), import-your-own-content (LingQ). Complaint clusters: paywalls on the useful parts (Max, ELSA Premium, Busuu Premium Plus, LingQ free cap), energy/hearts limits on free practice, ads, notification pressure, shallow or mis-ordered content, stiff AI dialogues, scoring that is gameable, no offline, and price relative to local income [6][8][9][17][18][21][22][23].

---

## 2. Vietnam specifics

### 2.1 Which languages Vietnamese learners want (evidence)

**English — the mass market.** Vietnam ranked **64th of 123 in the 2025 EF EPI (score 500, "moderate")**, 7th of 25 in Asia; Hanoi 532, HCMC 508; ages 26–30 score highest (544) [42]. Vietnamese IELTS Academic averages 6.2 (29th of 39), with **Speaking the weakest skill at 5.7** and Listening 6.3 [41]. The Ministry of Education's programme "Bringing English as a second language in schools 2025–2035, vision 2045" makes English compulsory from Grade 1 by 2030, aims to retrain 200,000 teachers to teach in English by 2030, and explicitly names "digital and AI-based learning tools" as a lever [43]. VSTEP, the domestic CEFR-aligned test, is the only domestic certificate that exempts students from the English portion of the high-school graduation exam and is widely accepted for admissions and graduation [44]. On Duolingo, learning English from Vietnamese is the **second-largest course in Asia** after English-from-Chinese; Vietnamese learners studying English for job opportunities were double the global average; 65% of Vietnamese users were under 30 [31][33].

**Chinese — the fastest-rising.** Vietnamese candidates made **over 146,000 HSK attempts in 2025, first in the world**, ahead of Thailand (about 130,000) and Korea (60,000); about 530,000 cumulative attempts. Drivers: HSK exempts from the graduation-exam foreign-language paper and some university requirements; study-in-China boom; Chinese, Taiwanese and Singaporean FDI creating jobs in accounting, logistics, legal and media; a lecturer estimates HSK3 in 3.5–4 months for under 10M VND [40]. Duolingo's 2022 report already ranked Chinese second in Vietnam [32].

**Korean — the exam leader.** Vietnam had **over 70,000 TOPIK registrants in 2024 (+10% YoY)**, second only to China, with 15 test sessions planned for 2026 including online IBT [39]; a test-centre source says about 85,000 registered in 2025, placing Vietnam first in the world, with about 35,000 students studying Korean at 80+ universities and about 160 high schools [38]. Among Vietnamese Duolingo learners aged 13–29, Korean is the third most popular language [32].

**Japanese — the labour-export language.** Vietnam had **164,495 Japanese learners (Japan Foundation, 2024)** [36] and **70,333 JLPT examinees in 2025, 5th in the world** [37]. In the first eight months of 2025 Vietnam sent 97,963 workers abroad: **Japan 43,905, Taiwan 37,906, South Korea 8,923**, against an annual target of about 130,000 [35]. Japan and Taiwan alone account for about 83% of outbound workers, which sustains JLPT N5/N4 and basic Mandarin demand far outside the big cities.

**French, German, others.** No comparable national exam numbers surfaced for DELF or Goethe in this research; Duolingo's Vietnam ranking lists English, Chinese, Vietnamese, Japanese, Korean as the top five [32]. French is a legitimate niche (study abroad, ULIS/francophone universities) but not a mass-market driver.

**Motivation profile:** Duolingo's Vietnam data shows an unusually high "brain training" motivation (29%, the highest of any large market), school 24%, family/heritage 11%, and a notably low travel motivation (9%) [32]. Jobs and exams dominate; design for certificates, not holidays.

### 2.2 Device and platform profile

- Mobile OS share in Vietnam (StatCounter, September 2026): **Android 59.8%, iOS 40.2%** [46]. Android versions: 16 at 28.5%, 15 at 16.4%, 13 at 14.7%, 14 at 13.6% — so roughly 60% of Android phones are on 14+ and a long tail is on 13 and below [47].
- Smartphone shipments Q1 2025: Samsung 28% share, Xiaomi second (Redmi Note 14 shipped 350,000+ units), Apple fastest-growing (+37%); **sub-USD 200 devices were 50% of shipments**, the USD 200–400 band grew 19% [45]. Practical consequence: assume 4–8 GB RAM, mid-range CPUs, no NPU path, and users who care about storage and data.
- In-app spend: Vietnamese users spent about USD 100M on in-app purchases in January–May 2023, with iOS revenue 1.5x Android despite Android being 75% of downloads; most spend is games [48]. Google reports Vietnam's app/game in-app revenue grew 65%, the fastest in APAC, and Vietnamese developers' apps were downloaded 6B+ times in 2024 [49].

### 2.3 Pricing sensitivity and payment habits

- Local list prices: ELSA Premium 2,745,000 VND/year (promos to 999,000), ELSA Pro 1,595,000 (promo 829,000); Speak 1,299,000–2,349,000 VND/year; Dungmori JLPT packs 1.29M–3.29M VND one-time [17][25][26].
- A thriving **grey market resells Super Duolingo at 350,000 VND/year and Max at 650,000 VND/year** against "original" prices of 1.85M and 9.6M VND shown by the reseller, and does not sell family plans [34]. This tells you: (a) list prices are far above willingness to pay, (b) a meaningful share of "paid" users in Vietnam are on shared/regional-arbitrage accounts, (c) account-based paywalls get circumvented anyway. A free, account-less app sidesteps the whole problem.
- Duolingo's Max AI features (Video Call, Roleplay) do not exist for the English-from-Vietnamese course; a Vietnamese learner paying for Max only gets Super features [9][34]. The best-funded AI conversation feature in the world is simply absent for Vietnam's biggest course.

### 2.4 What Vietnamese learners complain about

Direct survey evidence is thin. A 2023 study of 123 southern Vietnamese university students found generally positive attitudes to smartphone English apps used "to practice and improve all language systems and skills", with no complaint data in the abstract [50]. Forum and review evidence is richer: ELSA users complain about price, gameable scoring, stiff AI chat, Premium-only AI, and no offline [17][18]; Duolingo users in June 2026 about energy limits, ads, notifications and incorrect translations [8]. IELTS data shows Speaking and Listening as the weak skills nationally [41], consistent with the common refrain that apps build recognition, not production [88] (vendor blog, treat as opinion).

### 2.5 Native-language UI and explanations

No survey quantifying "prefer Vietnamese UI" surfaced. The structural evidence is strong anyway: Duolingo's largest Asian courses are from-Vietnamese and from-Chinese [31]; the top local apps (Dungmori, Riki, Prep, Edupia, ELSA's Vietnamese site) all sell in Vietnamese with Vietnamese explanations and Vietnamese-speaking teacher presence [17][26][27][28]; and Vietnam's EF band is "moderate", i.e. most adult learners cannot comfortably learn Japanese or Chinese *through English* [42]. For a national app, Vietnamese must be the source/UI language, with English explanations as a secondary option.

---

## 3. Learning science consensus 2024–2026

### 3.1 Spaced retrieval (FSRS)

- Agarwal et al.'s systematic review of classroom retrieval practice coded 50 experiments (n=5,374, from over 2,000 abstracts); nearly all conditions showed a benefit, mostly medium to large; only 3 of 50 were in non-WEIRD countries [60].
- FSRS is now the de-facto open scheduler. On the Anki 10k revlog benchmark (about 350M reviews after filtering), **FSRS-6 beats SM-2 on log loss for 99.6% of users** and beats FSRS-5 in 88.2% of collections; optimised parameters beat defaults in 84.3% [51]. FSRS-6 adds a per-user forgetting-curve shape parameter and a same-day-review parameter [51]. Dozens of apps have adopted it (Anki, RemNote, Mochi, LinGoat, Discito, etc.); `ts-fsrs` implements FSRS-6 in TypeScript [52]. The app's existing FSRS layer is state-of-the-art; the opportunity is to make it *visible* (retention forecasts, "why this card now") and to upgrade to FSRS-6 with per-user optimisation if not already done.

### 3.2 Comprehensible input and graded reading

- Hamada (2020) re-analysed 22 extensive-reading studies (33 datasets, n=6,806): a raw effect of d=0.55 on reading comprehension, adjusted to **d=0.37** after controlling for selection bias; effects grow with duration (one semester 0.25, over a year 0.92) and with proficiency (lower-level d=0.30, higher d=0.71); earlier meta-analyses found vocabulary effects of d=0.47 (Jeon & Day 2016) and 0.18 (Nakanishi 2015) [59]. Takeaway: graded input works, modestly for beginners, strongly with volume and time; it is a complement to explicit vocabulary work, not a replacement.
- Market signal: Dreaming Spanish built a large CI business (7,000+ videos, USD 8/month) on an input-only method; critics note no SRS, no curriculum, and speaking delayed until 600+ hours [87] (competitor-authored review). An app that **combines** graded stories with FSRS-driven vocabulary is the sweet spot.

### 3.3 Output, pronunciation, shadowing

- A 2024 Oxford systematic review of 44 shadowing studies found shadowing generally associated with better comprehensibility, intelligibility and accentedness, and with gains in fluency and prosody; evidence on individual segments is inconclusive [62]. Shadowing is cheap to implement (play model audio, record, compare) and fits Vietnamese learners' weakest skills [41].
- Pronunciation scoring: the open speechocean762 corpus (5,000 utterances, 5 expert raters) is the standard benchmark. A 17 MB INT4 Citrinet-256 CTC pipeline (forced alignment + GOP + small ensemble heads) reports phone-level PCC 0.580 vs human inter-rater 0.555, sentence-level 0.710 vs 0.675, with 257 ms median latency on CPU — author-reported, model not open-sourced [63]. OpenPronounce (MIT) uses wav2vec2 phone recognition plus DTW against synthetic reference, Spearman 0.65 against human totals, but needs two 1.2 GB checkpoints and is calibrated for English only [64]. Lesson: **GOP-style scoring over a small CTC acoustic model is the mobile-feasible route**; wav2vec2-large pipelines are not.

### 3.4 LLM corrective feedback

A 2026 scoping review of 185 studies (Nov 2022–Mar 2026) concludes LLM feedback is "broadly comparable to teacher feedback for surface-level errors but weaker for content and argumentation"; surface-level uptake about 86% for ChatGPT vs 92% for teachers in one n=60 study; risks include inconsistent revisions, new errors introduced during restructuring, over-reliance, and satisfaction substituting for engagement; the literature has positive-results bias [61]. For an A1–A2 app, surface-level correction (articles, agreement, word order, particles) is exactly the useful band, and it is within reach of small on-device models when constrained by templates and grammars.

### 3.5 Gamification: what Duolingo's own data and independent research say

- Duolingo (company blog, 2022): a streak-milestone animation redesign raised day-7 retention by 1.7%; two equipped Streak Freezes raised DAU by 0.38%; learners with a 7-day streak are 3.6x more likely to complete a course (correlational); the company itself admits a broken streak "can be demotivating" and fear of losing a streak may stop learners from starting [55]. A third-party teardown adds that Friend Streaks make users 22% more likely to complete a daily lesson and that 32M DAU hold a 7+ day streak (unsourced) [56].
- Independent: a qualitative study of Duolingo (9 years of forum data + 15 interviews) documents "gamification misuse" — users fixating on points/leaderboards/badges, losing focus on learning, with harms to time use, learning performance and well-being; causes include competitiveness, overindulgence and herding [57]. A 2025 classroom quasi-experiment (n=220) found gamified reading improved scores (medium effect) and enjoyment, but interviewees described competition as "fierce" and exhausting; the authors say competition must be carefully managed [58].
- Net: a *gentle* streak with free, generous freezes and no leagues captures most of the habit benefit while avoiding the anxiety and misuse costs. Energy/hearts systems have no learning rationale and are purely monetisation levers [6].

### 3.6 Efficacy evidence for app-only learning

- Duolingo/Foreign Language Annals (2022): five units of Spanish/French reading-and-listening outcomes matched four university semesters; seven units matched five, in under half the time; speaking "similarly impressive" but unquantified; company-authored [53]. Later company-cited peer-reviewed work claims one semester of Duolingo French yields communication skills comparable to classroom learners (beginner level) [3].
- Babbel: three-month Yale and Michigan State studies, nearly all learners improved oral proficiency; n and hours unstated [54].
- Both are vendor-sponsored and beginner-level. The honest claim for any app is "A1 to A2 reliably; beyond that, output with humans".

---

## 4. "Breakthrough" feature opportunities for an indie, privacy-first, offline app

Assessment criteria: user value (for Vietnamese mass market), feasibility on Expo/RN in 2026, licensing, risk.

### 4.1 On-device LLM tutor

- **Models.** Qwen3-0.6B (about 400 MB Q4, 2 GB RAM), Qwen3-1.7B (about 1.2 GB Q4, 3 GB RAM), Qwen3-4B (2.6 GB, 4 GB RAM) — all Apache-2.0, 119-language family support; Gemma 3n E2B (about 3 GB footprint, built for phones, audio input) and Gemma 3 4B under Google's Gemma terms; Phi-4-mini (MIT) is English-skewed and a poor fit for Vietnamese [65][67]. Google states Gemma 3n E2B needs about 2 GB and E4B about 3 GB of memory and supports 140 text languages and ASR/AST audio input [65]. Gemma's terms allow in-app distribution but require passing use restrictions to downstream users, a Notice file, and deletion on termination [66]; Qwen's Apache-2.0 is simpler.
- **Runtimes.** `llama.rn` (MIT) binds llama.cpp for RN with Expo CNG support, GGUF models, Metal on iOS, experimental OpenCL/Hexagon on Android (Adreno 700+/8 Gen 1+), tool calling, GBNF grammars/JSON schema; Android arm64 only; requires New Architecture [68]. React Native ExecuTorch (Software Mansion) runs Llama/Phi/Qwen-class LLMs, Whisper STT and Kokoro TTS, with Expo support and a showcase app on both stores [69]. `expo-ai` (alpha) exposes Apple Foundation Models (iOS 26) and Gemini Nano via ML Kit Prompt API (Android, device-dependent), fully on-device [70].
- **Feasibility on mid-range Android.** Qwen3-0.6B/1.7B run on CPU within 2–3 GB RAM; the 1.7B class is the realistic ceiling for sub-USD 400 phones (50% of Vietnamese shipments are sub-USD 200 [45]). A 0.6B model handles classification, extraction and short Q&A, not open conversation [67].
- **Verdict.** High value as a *constrained* tutor: grammar-constrained correction of a learner's sentence, "explain this mistake in Vietnamese", generating variations of a scripted roleplay turn, grading a guided-writing answer against a rubric. Low value and high risk as an open chatbot (hallucinated grammar, poor Vietnamese explanations from 0.6B models, 1+ GB download, battery). Ship as an **optional download pack**, gate by RAM check, keep every prompt template-driven with JSON-schema output. Effort: medium-high (native module, model management, prompt engineering, QA).

### 4.2 On-device ASR

- The device recogniser (`expo-speech-recognition`, MIT) supports on-device recognition on Android 13+ with downloadable language packs and on iOS 17+; on-device mode also unlocks word timing/confidence on Android; Android 12 and below have no on-device mode [73]. Given about 60% of Vietnamese Android phones are on 14+ and a long tail on 13 and older [47], the device recogniser covers most but not all users and gives you nothing phoneme-level.
- `react-native-sherpa-onnx` (MIT; sherpa-onnx Apache-2.0) runs Zipformer, Paraformer, NeMo CTC, Whisper, SenseVoice, Moonshine and Qwen3-ASR models offline, streaming with endpointing, Android API 24+/iOS 13+, with Play Asset Delivery for models [71]. Sherpa-onnx's Zipformer models cover Chinese, English, Korean, French, Japanese, Russian, Thai; SenseVoice covers Chinese, Cantonese, English, Korean, Japanese [72]. Moonshine Tiny Streaming (34M params) reports 12.00% WER vs Whisper Tiny 12.81% at far lower latency (92 ms on a Pixel 10a), with language-specific models for Japanese, Korean, Vietnamese, Chinese, Spanish, Arabic and Ukrainian — but no French listed [74]. Whisper small is 14.3% WER on French read speech, 16.4% CER Japanese, 21.7% WER Korean, 19.5% CER Mandarin; tiny/base were not benchmarked [75].
- **Verdict.** High value, medium effort. Use small Zipformer/SenseVoice/Moonshine models per target language (tens of MB each) as optional packs; fall back to the device recogniser. Licensing is clean (Apache/MIT). Risk: per-language accuracy on non-native accented speech is unbenchmarked; test with Vietnamese speakers.

### 4.3 Pronunciation scoring (GOP)

- A CTC acoustic model plus forced alignment plus GOP is proven to reach or exceed human inter-rater agreement at phone and sentence level in a 17 MB model [63]. sherpa-onnx exposes CTC models and timestamps/alignment [71][72]. The research literature in 2025 keeps refining logit-based GOP for CTC models [see arXiv items cited via search; not fetched in full].
- **Verdict.** This is the single clearest "breakthrough" for Vietnam: ELSA's whole business is pronunciation scoring, it is paid, online-only, and users say it is gameable [17][18]. An offline, free, per-phoneme score with Vietnamese-language tips (e.g. final consonants, /θ/, vowel length, English stress; Japanese pitch; Mandarin tones) would be unique. Effort: high (you must build the alignment + GOP head yourself; no drop-in RN library exists). Start with English (best models and the speechocean762 benchmark), then Mandarin tone scoring.

### 4.4 On-device TTS

- Piper voices exist for Vietnamese (3 voices), Chinese (huayan), French (tom, siwis), German, Spanish, Italian, Portuguese, Dutch, Polish, Russian, Turkish, Arabic; **no Japanese or Korean Piper voices** [76]. Piper's maintained engine is GPL-3.0 (the archived Rhasspy engine was MIT) and voice licences vary per voice [80]. Kokoro-82M is Apache-2.0 with 8 languages: American/British English (A to D grades), Japanese (5 voices, C+ to C-), Mandarin (8 voices, all D), French (1 voice, B-), Spanish, Italian, Hindi, Brazilian Portuguese; **no Korean, Vietnamese or German** [77][78]; its G2P (misaki) lists ja/ko/zh/vi tokenizers but Korean voices are absent [79]. sherpa-onnx can run VITS/Piper/MeloTTS/MMS voices, Matcha, Kokoro, Supertonic and others [71]; Supertonic is named as a source of Korean and Japanese voices [76].
- **Verdict.** Medium value (the app already synthesises audio; the gain is consistency across platforms and better voices). Feasible per language: English/French/Chinese/Vietnamese via Piper or Kokoro; Japanese via Kokoro; Korean needs Supertonic/MeloTTS-class voices via sherpa-onnx or the OS voice. Watch Piper's GPL for the engine (use sherpa-onnx's VITS runtime instead) and per-voice licences.

### 4.5 FSRS-6 with visible scheduling

Already present. Upgrade to FSRS-6 via `ts-fsrs`, run per-user parameter optimisation on-device, and surface a "retention forecast" and "why now" explanation; benchmark evidence supports both [51][52]. Low effort, moderate perceived value (it is a trust signal for serious learners who know Anki).

### 4.6 Comprehensible-input graded stories

Evidence supports extensive reading with modest beginner effects that grow with volume [59]. Generate stories per frequency band from the lexicon (so every story is within the learner's known vocabulary plus a few new FSRS items), with synthesized audio and tap-to-gloss in Vietnamese. Feasible entirely offline with pre-generated content; an on-device LLM can personalise later. Medium effort (content pipeline), high value for retention and listening.

### 4.7 Roleplay conversations

Babbel Speak, Busuu Conversations, Duolingo Roleplay and Speak's Live Roleplays are all scripted-scenario-plus-feedback products [9][11][12][14]. The app already has "short spoken conversations". The winning move is **branching scripted scenarios tied to exam/job situations** (job interview in English, factory instructions in Japanese, convenience-store Korean), scored by ASR + GOP, with an optional LLM turn-generator. Low-to-medium effort, high value, zero cloud.

### 4.8 "Learn from your own content"

LingQ proves demand but caps free users and is hard for beginners [22]. An offline importer (paste text, SRT subtitles, EPUB) that tokenises, maps words to the frequency lexicon, highlights unknowns and feeds FSRS is feasible in JS for English/French/Spanish/etc.; Japanese and Chinese need a segmenter (bundled dictionaries), Korean needs morphological handling. Medium effort, high value for intermediate users, strong word-of-mouth feature.

### 4.9 Mistake-driven personal grammar

Log every error type from writing/speaking tasks, cluster by rule, schedule rule-level review with FSRS, and explain in Vietnamese. Research supports surface-level LLM correction [61]; a 1.7B model with grammar-constrained output can classify errors against a fixed taxonomy. Medium effort.

### 4.10 BYO API key cloud tutor (optional)

Lets power users plug in their own OpenAI/Gemini/Anthropic key for an unconstrained tutor, with the app making requests only when the user explicitly configures it. Preserves "no network requests by default". Low effort, but it reintroduces a network path: document it clearly in the Play Data safety form (data sent off-device is still "collected" unless ephemeral) [83]. Keep it behind an explicit opt-in screen.

### 4.11 Multi-native-language UI

Make Vietnamese the first-class source language with Vietnamese explanations, glosses and grammar notes for English, Chinese, Japanese and Korean targets; keep English-source French as the showcase. This is the highest-leverage single decision (section 2.5). High effort (content, not code).

### 4.12 Exam-track modes

Demand is concrete: JLPT N5–N4 (labour export, 70k examinees) [35][37], TOPIK I (70–85k) [38][39], HSK 1–3 (146k attempts, exam exemptions) [40], IELTS/TOEIC/VSTEP basics (English policy, Speaking 5.7) [41][43][44]. Local incumbents charge 1.3–3.3M VND per JLPT level [26]. An exam mode = vocabulary lists per level in FSRS, question-format practice, listening sets, a mock test and a readiness estimate. Medium-high effort per exam; start with JLPT N5 and HSK 1–2 (small, well-defined lists), then TOPIK I.

### 4.13 Community/sharing without a server

Export/import of decks, stories and progress as files or QR codes; share via Zalo/Messenger; optional opt-in open repository on GitHub for community packs. Low effort, modest value, keeps the no-server promise.

---

## 5. Monetisation compatible with "free, no ads"

- **Donations / supporter pack.** Anki funds itself by selling the iOS app while desktop/AnkiWeb stay free [86]. Dreaming Spanish offers a generous free tier with USD 8/month Premium [87]. A local analogue: free app, plus a one-time "Ủng hộ" (support) in-app purchase that unlocks cosmetic voices/themes or simply says thank you. Vietnamese users do pay one-time for exam packs (Dungmori) [26], so a **one-time exam pack at a fraction of cram-school prices (e.g. a few hundred thousand VND)** is culturally normal, while subscriptions are resented and arbitraged [34].
- **Google Play Pass.** Developers earn an algorithmic royalty and Google claims participants "more than doubled" Play revenue on average; any app can express interest if its design fits "content unlocked for subscribers" [84]. Play Pass has been available in 90 countries since June 2021 at USD 5/month [85]; this research did not confirm whether Vietnam is a Play Pass country, so verify in Play Console before planning on it.
- **Open-core.** Keep the engine and base courses free and open; charge for optional model packs or exam packs. Compatible with no-ads, no-account.
- **B2B/B2G.** The 2030 English programme funds teacher training and digital tools [43]; a free, offline, Vietnamese-first app is a natural fit for schools and labour-export training centres (Japan/Taiwan pipelines [35]), which can be licensed without consumer paywalls.

### Play Store policy landscape 2026

- **Personal developer accounts created after 13 November 2023** must run a closed test with at least 12 testers opted in continuously for 14 days before applying for production; review usually takes seven days or less [81].
- **Target API:** new apps and updates must target Android 16 (API 36) by 31 August 2026; existing apps must target at least API 35 to stay visible to new users; extensions to 1 November 2026 via a Play Console form [82]. Current Expo SDK/RN templates should be checked against this before the first release.
- **Data safety:** every published app must complete the form and link a privacy policy, even if it collects nothing; data processed only on-device never needs disclosure; data sent off-device (e.g. BYO-key tutor) must be declared, with an "ephemeral" exception only for data held in memory and discarded [83]. A no-network app can honestly declare "No data collected", which is a visible trust badge in Vietnam's app market.

---

## 6. Ranked recommendation

### The 10 features/decisions that most move this app toward a national app for Vietnamese users

1. **Make Vietnamese the native/source language and English the first target course (A1→A2), reusing the French engine.** Rationale: English-from-Vietnamese is Duolingo's second-largest Asian course [31]; EF "moderate" means most learners need Vietnamese explanations [42]; the 2030 policy creates institutional demand [43]. Effort: high (content), low (code). Everything else depends on it.
2. **On-device ASR + per-phoneme pronunciation scoring (GOP) with Vietnamese-language tips, English first.** Rationale: Speaking is Vietnam's weakest IELTS skill [41]; ELSA is paid, online-only and criticised as gameable [17][18]; a 17 MB CTC+GOP pipeline reaches human-level agreement [63]; sherpa-onnx provides the runtime under Apache/MIT [71]. Effort: high. This is the headline "breakthrough".
3. **Scripted, branching roleplays for job/exam situations scored by ASR, before any free-form LLM chat.** Rationale: Babbel, Busuu, Duolingo and Speak all converge on scenario-plus-feedback [9][11][12][14]; Duolingo Max does not offer it for Vietnamese learners at all [34]. Effort: medium.
4. **Exam-track modes: JLPT N5 and HSK 1–2 first, then TOPIK I and TOEIC/VSTEP basics.** Rationale: 70k JLPT and 146k HSK candidates, labour export of 44k to Japan and 38k to Taiwan in eight months [35][37][40]; incumbents charge 1.3–3.3M VND per level [26]. Effort: medium-high per exam.
5. **Chinese, Japanese and Korean courses rebuilt from Vietnamese with proper script/tone/pitch onboarding; drop the other thin packs from the storefront until they are real.** Rationale: Vietnam's top-5 Duolingo languages are EN, ZH, VI, JA, KO [32]; LingoDeer shows the demand and the quality bar for CJK scaffolding [23]. Effort: high.
6. **Graded stories generated from the frequency lexicon with synthesized audio and tap-to-gloss in Vietnamese.** Rationale: extensive reading d≈0.37, rising with volume [59]; Dreaming Spanish shows willingness to pay for input [87]. Effort: medium.
7. **"Learn from your own text" importer (paste/SRT/EPUB → lexicon mapping → FSRS).** Rationale: LingQ demand with a free cap of 20 words [22]; strong differentiator for intermediate learners and teachers. Effort: medium (CJK segmentation is the hard part).
8. **FSRS-6 with per-user optimisation and a visible retention forecast; keep the gentle daily session, free freezes, no leagues, no energy.** Rationale: FSRS-6 beats SM-2 for 99.6% of users [51]; Duolingo's own data shows streaks help but can demotivate [55]; energy is pure monetisation and widely hated [6][8]. Effort: low.
9. **Optional on-device LLM pack (Qwen3-1.7B class, Apache-2.0) for constrained tasks: error classification, Vietnamese explanations, roleplay variation; plus an explicit opt-in BYO-key cloud tutor.** Rationale: feasible via llama.rn/ExecuTorch with Expo [68][69]; 1.7B needs about 3 GB RAM [67]; keep default build network-free; declare the opt-in path in Data safety [83]. Effort: medium-high.
10. **Monetise with a one-time "supporter/exam pack" purchase and explore Play Pass; publish an open-source engine; pursue school and labour-export training centres as B2B.** Rationale: Anki/Dreaming Spanish models [86][87]; Vietnamese users buy one-time packs but arbitrage subscriptions [26][34]; policy funding for digital tools [43]. Effort: low-medium.

Launch sequencing: 1 → 8 → 2 (English) → 3 → 4 (JLPT N5, HSK 1–2) → 6 → 5 (JA/ZH/KO from Vietnamese) → 7 → 9 → 10. Pre-launch compliance: closed test with 12 testers for 14 days, target API 36, Data safety "No data collected" with a privacy policy link [81][82][83].

### 5 things to explicitly NOT do

1. **Do not ship eight target languages from English.** Vietnam does not learn German/Italian/Portuguese through English at scale; thin packs dilute trust. Ship fewer, deeper, Vietnamese-sourced courses [32].
2. **Do not copy Duolingo's engagement economy** (energy, hearts, leagues, gem shops, aggressive notifications). It is the top complaint cluster in 2026 [6][8] and independent research documents learning harm from gamification misuse [57].
3. **Do not lead with an open-ended LLM chatbot.** ChatGPT Voice already does it better for free [9]; small on-device models hallucinate grammar; the scoping review shows LLM feedback is only reliable for surface errors [61]. Use the LLM as a constrained component, not the product.
4. **Do not add a server, accounts or "just a little" analytics.** The no-data badge, offline operation and immunity to account-sharing arbitrage are the moat in a market where Super Duolingo is resold at 350,000 VND/year [34]; any network path must be an explicit opt-in and declared [83].
5. **Do not depend on Piper's GPL engine, Gemma's downstream terms or wav2vec2-large pipelines without a plan.** Use sherpa-onnx's Apache-2.0 runtime for VITS/Kokoro voices, prefer Apache-2.0 models (Qwen3, Kokoro), and build pronunciation scoring on small CTC models; 1.2 GB checkpoints will not ship on sub-USD 200 phones [45][63][64][66][80].

---

## Sources

1. Meticulous Research, Online Language Learning Market — https://www.meticulousresearch.com/product/online-language-learning-market-5025
2. VoxBooster, Language Learning Statistics 2026 (secondary aggregator) — https://voxbooster.com/blog/language-learning-statistics-2026
3. SQ Magazine, Duolingo statistics (aggregates company filings) — https://sqmagazine.co.uk/duolingo-statistics/
4. Duolingo, Q2 2026 shareholder letter — https://investors.duolingo.com/static-files/3c8277ee-bc94-4f5d-9b77-0db3e46f88b8
5. StockTitan, Duolingo reports Q2 2026 — https://www.stocktitan.net/news/DUOL/duolingo-reports-second-quarter-2026-50sfevgaxt3z.html
6. Android Authority, "I'm finally quitting Duolingo after this change" (energy system, Oct 2025) — https://www.androidauthority.com/quitting-duolingo-energy-system-3599842/
7. Ban the Bots, Duolingo AI backlash explainer — https://www.banthebots.org/explainers/duolingo-ai-backlash
8. Unstar, Duolingo complaint spike June 2026 — https://unstar.app/events/duolingo-language-chess-complaints-june-2026
9. Beginners in AI, Duolingo Max explained (updated May 2026) — https://beginnersinai.org/duolingo-max-explained/
10. Duolingo blog, 2025 Duolingo Language Report — https://blog.duolingo.com/2025-duolingo-language-report/
11. Babbel press release, Introducing Babbel Speak (16 Sep 2025) — https://www.babbel.com/press/en-us/releases/babbel-speak
12. Tech Funding News, Speak closes $78M at $1B valuation — https://techfundingnews.com/openai-backed-speak-closes-78m-at-1b-valuation-for-ai-powered-language-tutor/
13. TechCrunch, Praktika raises $35.5M — https://techcrunch.com/2024/05/22/praktika-raises-35-5m-to-use-ai-avatars-to-make-learning-languages-feel-more-natural
14. BusinessWire, Busuu launches AI conversation practice (18 Oct 2024) — https://businesswire.com/news/home/20241018047666/en/Busuu-Launches-New-AI-Conversation-Practice-Feature
15. TechCrunch, ELSA Series C — https://techcrunch.com/2023/09/12/elsa-series-c
16. Google Play, ELSA Speak listing — https://play.google.com/store/apps/details?id=us.nobarriers.elsa&hl=en_US
17. ELSA Vietnam, Review ELSA Speak / pricing (vendor page) — https://vn.elsaspeak.com/review-elsa-speak/
18. VOZ forum thread on ELSA Speak (user anecdotes) — https://voz.vn/t/may-thim-muon-mua-elsa-speak-nen-can-nhac.1092393/
19. Google blog, Little Language Lessons — https://blog.google/products-and-platforms/products/education/little-language-lessons/
20. Apple Newsroom, Live Translation on AirPods expands to the EU — https://www.apple.com/ie/newsroom/2025/11/live-translation-on-airpods-expands-to-the-eu/
21. TechRadar, Best language learning apps — https://techradar.com/best/best-language-learning-apps
22. StoryLearning, LingQ review — https://storylearning.com/lingq-review
23. Mezzofanti Guild, LingoDeer review — https://mezzoguild.com/lingodeer-review
24. Wikipedia, HelloTalk — https://en.wikipedia.org/wiki/HelloTalk
25. App Store (Vietnam), Speak: Language Learning — https://apps.apple.com/vn/app/speak-language-learning/id1286609883
26. App Store (Vietnam), DUNGMORI — https://apps.apple.com/vn/app/dungmori/id1486123836
27. Google Play, Riki — https://play.google.com/store/apps/details?id=vn.nihongo.riki&hl=en_US
28. VIR, Prep raises $7M Series A — https://vir.com.vn/language-platform-prep-raises-7-million-in-series-a-funding-110821.html
29. JDI Group, Vietnam EdTech in 2025 — https://jdi.group/vietnam-edtech-opportunities-for-business/
30. Similarweb, Top education apps Google Play Vietnam (Oct 2026) — https://www.similarweb.com/top-apps/google/vietnam/education/top-free/
31. The Investor, Vietnamese commitment to language learning stands out: Duolingo exec — https://theinvestor.vn/vietnamese-commitment-to-language-learning-stands-out-in-the-region-duolingo-exec-d7001.html
32. The Investor, English, Chinese most popular languages on Duolingo in Vietnam (2022 report) — https://theinvestor.vn/english-chinese-most-popular-languages-learnt-on-world-famous-app-duolingo-in-vietnam-d2983.html
33. KrASIA, Duolingo plots expansion in Vietnam (2020) — https://kr-asia.com/duolingo-plots-expansion-in-vietnam
34. BestApp.vn, Duolingo Max vs Super 2026 (reseller) — https://bestapp.vn/blog/duolingo-max-vs-super-2026-goi-nao-dang-tien
35. VnEconomy, Labor exports approach 100,000 in eight months (Sep 2025) — https://en.vneconomy.vn/labor-exports-approach-100000-mark-in-eight-months.htm
36. Wikipedia, Japanese language education in Vietnam — https://en.wikipedia.org/wiki/Japanese_language_education_in_Vietnam
37. Shadowing Korean, JLPT stats by country (2025) — https://shadowingkorean.com/jlpt-stats/
38. Zila Education, TOPIK examinees in Vietnam highest in the world — https://www.zila.com.vn/tin-tuc-so-luong-thi-sinh-thi-topik-tai-viet-nam-cao-nhat-the-gioi.html
39. Tuổi Trẻ, Korea announces 2026 TOPIK plan (Oct 2025) — https://tuoitre.vn/han-quoc-cong-bo-ke-hoach-to-chuc-ky-thi-nang-luc-tieng-han-nam-2026-20251010150412251.htm
40. Thanh Niên, Vietnamese take HSK the most in the world (Mar 2026) — https://thanhnien.vn/nguoi-viet-thi-tieng-trung-dong-nhat-the-gioi-185260319120651807.htm
41. VnExpress, Vietnamese average IELTS score drops in ranking (Oct 2024) — https://vnexpress.net/diem-trung-binh-ielts-cua-nguoi-viet-tut-hang-4803639.html
42. Tuổi Trẻ News, Vietnam returns to moderate English proficiency group (EF EPI 2025) — https://news.tuoitre.vn/vietnam-returns-to-global-moderate-english-proficiency-group-ef-103251120163417603.htm
43. Asia News Network / Viet Nam News, Vietnam to make English compulsory from Grade 1 by 2030 — https://asianews.network/vietnam-to-make-english-compulsory-from-grade-1-by-2030/
44. Wikipedia, VSTEP — https://en.wikipedia.org/wiki/Vietnamese_Standardized_Test_of_English_Proficiency
45. Counterpoint Research, Vietnam smartphone market Q1 2025 — https://www.counterpointresearch.com/insight/vietnam-smartphone-market-q1-2025/
46. StatCounter, Mobile OS market share Viet Nam (Sep 2026) — https://gs.statcounter.com/os-market-share/mobile/viet-nam
47. StatCounter, Android version market share Viet Nam (Sep 2026) — https://gs.statcounter.com/android-version-market-share/mobile/viet-nam
48. VietnamNet, Vietnam spends US$100 million on in-app purchases Jan–May 2023 — https://vietnamnet.vn/en/vietnam-spends-us-100-million-on-in-app-purchases-in-jan-may-2165837.html
49. Viet Nam News, Google Apps Summit 2025 spotlights Việt Nam — https://vietnamnews.vn/economy/1729500/google-apps-summit-2025-spotlights-viet-nam-as-apac-s-fastest-growth-engine.html
50. LEARN Journal, Vietnamese students' use of smartphone apps in English learning — https://so04.tci-thaijo.org/index.php/LEARN/article/view/263430
51. Expertium, Benchmark of Spaced Repetition Algorithms — https://expertium.github.io/Benchmark.html
52. open-spaced-repetition, awesome-fsrs — https://github.com/open-spaced-repetition/awesome-fsrs
53. Duolingo investor release, Foreign Language Annals study (2022) — https://investors.duolingo.com/news-releases/news-release-details/leading-language-research-journal-publishes-study-showing
54. Babbel Magazine, Babbel verified (Yale/MSU studies) — https://www.babbel.com/magazine/babbel-verified
55. Duolingo blog, The habit-building research behind your streak — https://blog.duolingo.com/how-duolingo-streak-builds-habit
56. Deconstructor of Fun, Duolingo streaks teardown (third-party, unsourced figures) — https://duolingo.deconstructoroffun.com/mechanics/streaks
57. arXiv 2203.16175, When Gamification Spoils Your Learning — https://www.arxiv.org/abs/2203.16175
58. Frontiers in Psychology 2025, gamified reading course quasi-experiment — https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1448916/pdf
59. Hamada 2020, Frontiers in Psychology, extensive reading meta-analysis and propensity study — https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.00617/full
60. TeacherToolkit summary of Agarwal et al. 2021 systematic review of classroom retrieval practice — https://www.teachertoolkit.co.uk/2021/08/22/classroom-retrieval-practice/
61. Craven & Fredrick 2026, Education Sciences, LLM-generated feedback in L2 writing: scoping review — https://www.mdpi.com/2227-7102/16/8/1196
62. Whitworth 2024, Oxford, systematic review of shadowing — https://ora.ox.ac.uk/objects/uuid:3104cae1-3a6b-400a-b173-de44384238d2
63. dev.to, "17MB vs 1.2GB" pronunciation scoring (author-reported) — https://dev.to/fabiosuizu/17mb-vs-12gb-how-a-tiny-model-beats-human-experts-at-pronunciation-scoring-5588
64. GitHub, OpenPronounce — https://github.com/Halleck45/OpenPronounce
65. Google Developers Blog, Introducing Gemma 3n developer guide — https://developers.googleblog.com/en/introducing-gemma-3n-developer-guide/
66. Google, Gemma Terms of Use — https://ai.google.dev/gemma/terms
67. PremAI, Best lightweight language models worth running in 2026 — https://www.premai.io/blog/best-lightweight-language-models-worth-running/
68. GitHub, mybigday/llama.rn — https://github.com/mybigday/llama.rn
69. Software Mansion, React Native ExecuTorch — https://executorch.swmansion.com/
70. Expo docs, expo-ai (alpha) — https://docs.expo.dev/versions/unversioned/sdk/ai.md
71. GitHub, XDcobra/react-native-sherpa-onnx — https://github.com/XDcobra/react-native-sherpa-onnx
72. pub.dev, sherpa_onnx supported functions/models — https://pub.dev/documentation/sherpa_onnx/
73. GitHub, jamsch/expo-speech-recognition — https://github.com/jamsch/expo-speech-recognition
74. Moonshine Voice docs, Moonshine vs Whisper — https://moonshine-voice.readthedocs.io/en/latest/moonshine-vs-whisper/
75. Vocova, Whisper accuracy benchmark 2026 — https://vocova.app/blog/ai-transcription-accuracy-benchmark-2026
76. Quick TTS, Every Piper voice ranked — https://quick-tts.com/blog/piper-voices-ranked.html
77. Hugging Face, hexgrad/Kokoro-82M — https://huggingface.co/hexgrad/Kokoro-82M
78. Hugging Face, Kokoro-82M VOICES.md — https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md
79. PyPI, misaki G2P — https://pypi.org/project/misaki/
80. CodeSOTA, Local TTS models: licenses — https://www.codesota.com/guides/tts-models
81. Google Play Console Help, App testing requirements for new personal developer accounts — https://support.google.com/googleplay/android-developer/answer/14151465?hl=en
82. Google Play Console Help, Target API level requirements — https://support.google.com/googleplay/android-developer/answer/11926878?hl=en
83. Google Play Console Help, Data safety — https://support.google.com/googleplay/android-developer/answer/10787469?hl=en
84. Google Play Console, Grow with Google Play Pass — https://play.google.com/console/about/programs/googleplaypass/
85. Android Central, Play Pass now available in 90 countries (June 2021) — https://androidcentral.com/google-play-pass-subscription-service-now-available-90-countries
86. AnkiWeb, Support Anki — https://apps.ankiweb.net/support
87. Palteca, Dreaming Spanish review (competitor-authored) — https://palteca.com/dreaming-spanish-review
88. Kaiwa blog, why you can't speak Vietnamese after apps (vendor blog) — https://trykaiwa.com/blog/vietnamese-why-you-cant-speak-after-apps-what-works
89. DealStreetAsia, ELSA raises $23m Series C — https://www.dealstreetasia.com/stories/elsa-funding-round-361190
