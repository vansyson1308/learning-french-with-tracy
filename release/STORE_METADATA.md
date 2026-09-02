# Store metadata audit and truth check (Phase 10 §63, §66)

## What the repository contains

`metadata/app-info/en-US.json`, `metadata/version/1.0.0/en-US.json` and
`store.config.example.json` are the **upstream** Lingo Lessons listing
texts ("Lingo Lessons: Languages", "Spanish, French, German+", 8 language
courses, privacy/support URLs on the upstream author's domain). `README.md`
still links the upstream App Store id 6781818623. `app.json` name is
"Lingo Lessons"; the icon and splash are upstream's.

These files were **not modified**: they belong to the upstream identity,
and Gate 1 leaves every identity decision to the owner. They are audited
here so that whichever identity option the owner chooses, the listing that
ships is truthful.

## Truth findings against the current product

| Statement in stored metadata | True for this build? | Action |
|---|---|---|
| "8 Language Courses … from English" | Yes — all eight packs still ship and are green | keep |
| "Your streak, XP, **hearts**, course progress…" | **No** — hearts were removed (no energy gates) | drop "hearts" |
| "Audio Practice — hear words and phrases" | Yes | keep |
| "Mistake Review … reinforce them over time" | Yes (mistakes + FSRS review) | keep; may say "spaced repetition" |
| Privacy policy URL `ahmetdedeler.com/lingo/privacy` | Unknown ownership; the policy text there is not this app's policy | **replace** with the owner's hosted copy of `release/PRIVACY_POLICY.md` |
| Support URL on the upstream domain | Unknown ownership | **replace** with the owner's |
| Nothing about French A1 checks, speaking practice, writing, conversation | Omission | add (draft below) |

Nothing in the stored metadata claims official CEFR certification,
pronunciation scoring, an AI tutor, fully offline speech, broad accent
comprehension, or A2. The draft below keeps it that way.

## Screenshot check

`app-store-screenshots/en-US` and `screenshots/final` are upstream's
captures of the generic path/lesson UI. They show no feature the app lacks,
but they show nothing of the French A1 checks, speaking, writing or
conversation practice either. New captures on the release build are an
owner task (§66); they must not depict a certificate, a score for
pronunciation, or a tutor chat.

## Draft listing text (English, honest; for the owner to adopt under the chosen identity)

**Subtitle** (30 chars): "French to A1 — and 7 more"

**Promotional text**: Short, playful lessons with real audio. French goes
all the way to an A1 check across listening, reading, speaking, writing and
conversation — on your device, with no account, ads or paywall.

**Description**:

Learn French from English with bite-sized lessons, spaced-repetition
review, and a daily session that picks what you need next. Seven more
starter courses (Spanish, German, Italian, Portuguese, Japanese, Korean,
Chinese) are included.

FRENCH, ALL THE WAY TO A1
• Six sections: everyday basics, grammar foundations, listening and
  reading, speaking, writing, and short conversations.
• Listening with recorded clips, reading with short texts, speaking with
  your device's speech recognition, writing with instant feedback, and
  conversation practice with a supportive partner.
• Section checks and an A1 check that show what you have demonstrated in
  each of the five skill areas. This is a CEFR-aligned estimate from the
  app's own checks — not an official examination or certificate.

HOW IT WORKS
• Daily session: reviews what is about to fade, teaches what comes next.
• Spaced repetition (FSRS) keeps words, listening and speaking practice
  on a schedule that fits your memory.
• Mistakes come back until you get them right.

PRIVATE BY DESIGN
• No account, no ads, no analytics. Your progress stays on your device;
  export a backup whenever you like.
• Speaking practice uses your device's speech recognition after you tap
  record; the app never uploads audio. On some devices the system
  service may use the network — the app tells you before a spoken check.

Requires a microphone and speech recognition for the speaking parts;
everything else works without them.

**Keywords**: French, learn French, A1, CEFR, vocabulary, listening,
speaking, writing, spaced repetition, Spanish, German, language

## Version (§65)

See `RELEASE_IDENTITY.md`: `expo.version` is 1.1.0; build numbers live on
EAS (`appVersionSource: remote`) under the upstream project and cannot be
read from here. Proposed, not applied: Option A → next version above the
live store version; Option B → 1.0.0 / build 1.
