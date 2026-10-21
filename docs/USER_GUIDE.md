# User guide

Everything in this guide describes the app as it actually behaves in the current release; every section is walked on a release build before the guide is marked final (see the validation record in the repository, `docs/USER_GUIDE_VALIDATION.md`). A Vietnamese version of this guide is `docs/USER_GUIDE.vi.md` (website: `/vi/guide/`).

## 1. What the app is

Learning French with Tracy is a free French course for English speakers. It runs entirely on your phone: a learning path in six sections, a daily session that decides what to review, listening, reading, speaking, writing and short conversations, checkpoints, a starting-point check and an A1 capstone. There is no account, no advertising and no analytics. Seven other language courses inherited from the open-source base (Spanish, German, Italian, Portuguese, Japanese, Korean, Chinese) are also included in their original, simpler form.

## 2. Installation

- **iPhone:** from the App Store, or through a TestFlight invitation during testing. iOS 16.4 or later.
- **Android:** from Google Play, or through a closed-test link; a direct `.apk` from GitHub Releases is possible during testing (Android shows an "unknown app" warning for files that do not come from the store). Android 7.0 or later.

The app needs about 150 MB of storage and no permissions to install. The only permissions it ever asks for are the microphone and speech recognition, and only when you start a speaking exercise.

## 3. First launch

The first screen asks which course you want. French is the course this app is built around and comes in two editions: one explained in English (`fr-en`) and one explained in Vietnamese (`fr-vi`) — same French words, audio, lessons and checks, different explanation language; each card says which ("Explained in …"). The edition explained in your app language is listed first and already selected; keep it (or tap another course). Then pick a **Daily XP goal** — 10, 20, 30 or 50 XP (a lesson is worth 15 XP, 20 when perfect) — and tap **Learn French** (the button names the course you selected). You land on the **Learn** tab. You can change the course later from Profile → Learning → **Switch**.

## 4. Choosing French

French and Spanish for Vietnamese speakers (`es-vi`) are the courses with the full feature set: Today sessions, listening, speaking, writing, conversations, checkpoints, the starting-point check and the A1 capstone. Both French editions have it. Your French memory is shared between them: a word you review in one edition is the same memory card in the other, and the starting-point check and checkpoint results carry over — only lesson completion and XP are counted per edition. The other courses offer the learning path, practice of mistakes and word review.

### Spanish for Vietnamese speakers (`es-vi`) and DELE A1 practice

`es-vi` teaches neutral Latin-American Spanish to A1 with the same six-section structure as French; every explanation, question and piece of feedback is in Vietnamese. The older `es-en` course stays under **Other courses** in the course picker so earlier progress is kept, but it is no longer offered at first launch.

The **DELE A1 practice** card on the Practice tab follows the public DELE A1 format (Instituto Cervantes): Reading (45 min), Listening (20 min), Writing (25 min) and Speaking (15 min plus preparation). **Practise one part** is untimed with feedback after each answer; the **timed mock** runs two parallel forms, A and B — a retake gets the other one. When a part's time is up, it ends and the questions you didn't reach count as not answered. Results show each part's points, the two score groups (Reading + Writing, Listening + Speaking) against the format's threshold, and an **estimated readiness**. It is not a real exam score, is not issued by Instituto Cervantes and does not predict a result; every question is original to the course. **Practise the words from these questions** starts an ordinary vocabulary review (recorded in your memory cards) over the words of the questions you missed. Without speech recognition on the device the Speaking part is skipped and the result says there is not enough data for an estimate. Spanish listening audio arrives once the audio generation run has finished; until then listening questions offer the skip button.

## 5. Starting-point check (placement)

If you have studied French before, the Learn tab shows **Studied French before? Find your starting point**. The check is short (a few minutes), adapts to your answers, and offers **I don't know** on every question — use it; it is never punished twice. At the end you see the course position the app suggests, with **Start here** or **Start from the beginning**. Lessons before your starting point are marked *Cleared by your placement check. Review any time.* You can redo or reset the check from Profile → **Your French goals**.

## 6. Learn (the path)

The Learn tab shows the path: sections, units and lesson nodes. The current lesson is the one you can tap; earlier ones can be replayed; later ones are locked. A screen reader announces each node's state (*Completed. Practice again.*, *Locked. Complete earlier lessons first.*, *Cleared by your placement check. Review any time.*). Each unit has a guidebook (the book icon, labelled *<unit> guidebook*) explaining its grammar in plain language.

## 7. Sections and units

1. **Section 1: Beginner** — units *Basics 1*, *Greetings*, *Food*, *Animals*, *Travel*.
2. **Section 2: Building blocks** — *Gender & Articles*, *High-Yield Verbs*, *Cognates & False Friends*, *Numbers 0–100*, *Connected French* (liaison and elision).
3. **Section 3: Understand everyday French** — *Écoute !*, *Messages & panneaux*, *Annonces & consignes*, *Petits dialogues*, *Petites histoires* (listening and reading).
4. **Section 4: Speak your first French** — *Dis bonjour !*, *Je me présente*, *Les chiffres à voix haute*, *Décris-le !*.
5. **Section 5: Write everyday French** — *Écris qui tu es*, *Des phrases simples*, *Petits messages*, *Formulaires et messages*.
6. **Section 6: Talk with someone** — *Premiers échanges*, *Au café, au magasin*, *Trouver son chemin*, *Faire des projets* (conversations with a partner voice).

Each section ends with a **checkpoint** (section 6 leads to the A1 capstone).

## 8. Lesson exercise types

- **Choose** the meaning (tap one of four options; a speaker button plays the French).
- **Arrange the words** into a sentence from a word bank.
- **Match** pairs of words.
- **Type** the translation (accents are accepted with or without diacritics; typos in small words are marked).
- **Fill the blank** in a sentence.
- French-specific: **choose the article** (le/la/l'/les), **conjugate** a verb in a cloze, **number** drills, and concept cards that explain a rule before you practise it.
- Listening and reading exercises (section 3), speaking (section 4), writing (section 5) and conversation (section 6) — described below.

Tap **Check** to grade an answer, **Continue** to move on. Multiple-choice answers appear in a different order each time you sit a lesson (the same order if you reopen it the same day), so a position is never the clue. Wrong answers come back later in the same lesson until you get them right. **I don't know** appears only in the starting-point check and on steps that need audio or the microphone (**Skip this step**); ordinary lesson exercises are always answered. At the end you see a summary: reviews, new words, streak and XP.

## 9. Vocabulary

Practice → **Open vocabulary** (also the Learn tab header) opens the vocabulary browser. Filter by **All / Learned / Not yet / Nouns / Verbs / Expressions**, sort by **Course order**, or search French or English. Each word shows its meaning, article and gender, pronunciation, an example sentence, and a memory-strength bar.

## 10. Rich dictionary

Every French word in the course has an entry: part of speech, gender, pronunciation (from the Lexique lexical database), an example sentence with translation, and confusable words to keep apart. Tap a word inside a reading passage to open its entry.

## 11. Memory: how review works

The app schedules review with a spaced-repetition algorithm (FSRS). Every word, sound and phrase you meet has a memory card; each time you answer, the card's next review date moves — sooner when you struggled, later when you knew it. You never rate yourself; your answers are the evidence. The strength bar on a word shows how likely you are to remember it right now.

## 12. Today

The **Today** tab builds one session from what your memory needs: reviews that are due first (most at risk first), then new material from your current unit, then mixed practice, then a short matching finale. Choose a **Session length** — 5, 10 or 15 minutes — and tap **Start today's session**. On a device that can record, a **Can't speak now** switch appears above the button: turn it on and speaking reviews are left out of that session and stay due.

## 13. Review

Practice → **Review words**, **Review listening** and **Review speaking** each open a review session for that skill. In a review you can tap **Undo this review** right after answering if you tapped the wrong thing. Skipped speaking reviews stay due.

## 14. Listening practice

Listening exercises play a recorded clip (**Play audio**, then **Play again**). Tap **Slow** for a slowed replay. In practice you can replay as often as you like; in scored checks the number of plays is limited and shown. Answer the comprehension question, then **Check**.

## 15. Speaking practice

Speaking exercises come in two kinds: **repeat after the model** (you hear a model clip and say it back) and **say it yourself** (you get a situation and facts, and produce the sentence). Tap **Record your answer**, speak, tap **Stop recording**. The app shows *I heard: …* with what your device's recogniser understood, and either *Sounds right — check to continue!* or *Not quite. Try again, or check what you have.* You can **Play back my recording** before you decide. You have two attempts; then the model answer is shown.

## 16. Microphone permission

The first speaking exercise asks for **microphone** and **speech recognition** permission. If you decline, the exercise shows **Allow microphone**, or **Open Settings** when the system will no longer ask; every speaking step also offers **Skip this step**.

- iPhone: Settings → Privacy & Security → Microphone, and Settings → Privacy & Security → Speech Recognition.
- Android: Settings → Apps → Learning French with Tracy → Permissions → Microphone.

## 17. Device and network speech behaviour

Recognition is done by your device's system service, not by the app. Before your first attempt the app checks whether your device has an on-device French model. If it does not, you see this notice: *Speech recognition is provided by your device's system service. Without an offline French model it may use the internet to recognize what you say. This app itself never uploads or stores your recording — and you can always skip speaking.* Tap **Got it** to continue or skip. The app deletes the temporary recording of each attempt when the step ends and keeps no transcripts.

## 18. Writing practice

Practice → **Practice writing** (and section 5 lessons) gives guided writing tasks: a short instruction plus the facts to use (for example a name, a city, a time). Type your French in **Your French answer** and tap **Check**. Feedback names exactly what is missing ("You included a greeting, but not the time") or what to change; it never scores grammar it cannot check. Form tasks show labelled fields (Prénom, Âge, Ville…) — write just the fact in each box. Open practice tasks (*Write freely in French*) accept any French about the topic.

## 19. Conversation practice

Practice → **Have a conversation** starts a short spoken exchange with a partner voice: greet, order, ask the way, buy a ticket. Each of your turns is recorded like a speaking exercise; the partner answers what you said. If the partner did not understand, it rephrases once; **Skip this step** moves on. The transcript of the exchange stays on screen so you can read back what was said.

## 20. Reading

Reading passages (section 3) are short notices, messages and texts. Tap any word to see its meaning. Answer the comprehension questions; in checkpoints the passage stays visible while you answer.

## 21. Checkpoints

Each section ends with a checkpoint (Learn tab, after the last lesson; *Finish this section's lessons to unlock*). Checkpoints are scored: option order is shuffled every time, listening clips have limited plays, and the speaking checkpoint needs the microphone (**Got it — start the check** after the permission notice). Results show which goals you demonstrated; you can retake a checkpoint after the cooling-off period shown on the results screen.

## 22. A1 capstone

After section 6 the **A1 check** (Profile → Your French goals → **Take the A1 check**) combines listening, reading, speaking, writing and conversation items. It needs speech recognition; on a device or platform without it the capstone screen says so before you start.

## 23. CEFR-aligned A1 estimate

Profile → **Your French goals** shows five skill areas — listening, reading, speaking, writing, interaction — with how many of the required goals you have demonstrated in checkpoints (for example *Listening 1/3*), and an overall line: *Demonstrated across all five skills* or *Not complete yet*. A goal counts only when a scored checkpoint shows it; the capstone alone never completes a skill.

## 24. Why it is not official certification

The estimate is what this course's own checks observed. It is not an official CEFR examination, not certified and not recognised by any authority; an official level comes only from an accredited examination. The Goals screen says this in its own words under **What this estimate is and is not**.

## 25. Goals screen

Besides the estimate, the Goals screen lets you **Find your starting point** / **Retake the check**. When your starting point is above the beginning of the path it also offers **Reset starting point** (with a confirmation: *Keep it* or *Reset*); otherwise it reads *Starting from the beginning.* Resetting the starting point never deletes completed lessons or review history.

## 26. XP, streak and activity

Profile shows **Day streak**, **Course XP**, **Today's XP**, **To review**, **Lessons done** and **Words learned**, plus a seven-day activity strip. A day counts for the streak when you complete a lesson or a Today session (local calendar day). Practice sessions give a smaller fixed XP and never count as completed lessons.

## 27. Backup export

Profile → Data → **Export progress** (*Save a backup file of everything.*) creates a backup file and opens the system share sheet — save it to Files/Drive or send it to yourself. The file contains your progress for every course in two parts — your settings, scores and check results, and your spaced-repetition cards with their review history; it contains no recordings, transcripts or personal identifiers. Unsaved review history from a session you are in the middle of is written out first, so the file is complete.

## 28. Backup import / restore

Profile → Data → **Import progress** (*Restore from a backup file.*) → pick the file → confirm **Import**. The app checks the file completely before touching your current progress; if anything is wrong it says why and your current progress is unchanged. A backup made by a newer version of the app is refused rather than guessed at. Backups made by older versions (before the local database) import normally. Before an import replaces anything, the app saves a copy of your current progress as `progress-before-import-<date>.json` in its own documents folder; if the import cannot be verified afterwards, your previous progress is put back automatically and the screen says so.

## 29. Data and privacy

Everything lives on your device: a local database holds your cards and review history, a settings store holds everything else. The first time a version with the local database starts over older progress, it moves your history across once and keeps a copy of the old progress as `progress-before-v4-<date>.json` in the app's documents folder. The app makes no network requests of its own, has no account, no analytics and no advertising. Speaking uses your device's system recogniser (see section 17). Deleting the app deletes all its data. The full policy is under Profile → **Privacy** and on the website.

## 30. Accessibility

Every control has a screen-reader label and state; correct and incorrect answers are marked with a symbol and text, not colour alone; text follows the system size (reading passages up to 200%); dark mode follows the system or your choice under Profile → **Appearance** (*Device / Light / Dark*). Speaking steps are always skippable. See the accessibility statement on the website for the current status per feature.

The app's own language — every screen, button, hint and message — is Vietnamese or English: Profile → **App language** (*Device / Tiếng Việt / English*). *Device* follows your phone's language (Vietnamese on a Vietnamese phone, English otherwise). Course content (word meanings, questions, guidebooks) keeps the language the course was written in; the French course is glossed in English until the Vietnamese French course ships.

## 31. Offline usage

Lessons, Today, vocabulary, listening clips, reading, writing and checkpoints work without any connection.

## 32. What may still require network

- Speech recognition on devices without an on-device French model (section 17).
- Installing and updating the app from the store.
- Opening the website links (Privacy, Support) from the Profile screen.

## 33. Troubleshooting

- **No sound:** check the silent switch and volume; make sure Bluetooth audio is routed where you expect; tap **Play again**.
- **Microphone unavailable:** allow the microphone and speech recognition in Settings (section 16); restart the exercise.
- **Speech recognition unavailable:** the platform has no recogniser (for example the web version). Use **Skip this step**; speaking reviews stay due.
- **Speech recognition needs internet:** the app told you your device has no offline French model. Connect, or skip speaking.
- **Wrong recognition:** speak slower and closer to the microphone, in a quiet place; say only the French sentence; check *I heard: …* and retry.
- **Can't speak now:** in Today, tap **Can't speak now** before starting; speaking reviews are left for later.
- **No review due:** learn a new lesson on the path; Today will have material tomorrow.
- **Placement reset:** Profile → Your French goals → Reset starting point.
- **Backup import fails:** use a file created by Export progress; do not edit it; a truncated or newer-version file is refused and nothing changes.
- **Large text or layout issue:** every screen scrolls; if a control is unreachable at your text size, report it with the accessibility template.
- **Android sideload warning:** expected for a file not installed from Google Play.
- **Privacy questions:** Profile → Privacy, or the Support page.

## 34. Reset and placement behaviour

Resetting your starting point clears only the placement result (the "cleared" markers on the path); completed lessons, XP, streak and review cards stay. To start completely fresh, delete and reinstall the app (export a backup first if you might want it back).

## 35. Licenses and attributions

Profile → **Licenses & attributions** (*Software notices and data sources.*) lists every third-party source: the Lingo Lessons base (MIT), Lexique 4 lexical data (CC BY-SA 4.0), the FSRS scheduler (ts-fsrs, MIT), and — under **Audio** — Piper (MIT) with each voice used to synthesize the bundled audio and its license. The same list is on the website.

## 36. Support and contact

The Support page on the website has the FAQ and the contact routes; bug reports go to GitHub Issues with templates for bugs, audio or speech problems, accessibility issues and French corrections. The support email is duymank250997@gmail.com (it may change in a later version; the Support page always shows the current one). Never send voice recordings.
