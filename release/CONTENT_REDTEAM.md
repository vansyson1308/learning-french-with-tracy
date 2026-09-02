# French content red team (Phase 10 §25-§28)

Two independent adversarial passes over **every learner-facing string** in
the French course (6,702 extracted strings across 13 source files:
course pack, checkpoints, placement, interaction scenarios, lexicon,
writing tasks, speech items, pedagogy concepts, listening scripts,
objectives, readings, conjugations, match overrides), followed by
engine-level attacks on the writing rubric, the speech grader and the
interaction machine. Both passes were run blind to each other with the same
brief (native-quality French, A1 register, tu/vous consistency, gender and
article correctness, accepted-answer coverage, distractor sanity,
instruction/answer mismatches, anything a native speaker would never say)
and reported findings as `severity | file | path | current | proposed |
reason` rows.

## Findings

| Pass | critical | major | minor | note | total |
|---|---|---|---|---|---|
| A (systematic read) | 10 | 13 | 18 | 6 | 47 |
| B (adversarial read) | 6 | 22 | 21 | 14 | 63 |

The two passes converged on the same top findings (both flagged
*Il est un garçon*, the single-word-order writing slots, the false "-son →
feminine" rule, the *manger* explanation, the unaccented Section-5
guidebooks and the two blank-less fill-blanks), which is the strongest
signal that the list below is the real defect set rather than reviewer
taste.

## Applied — critical

| # | Where | Was | Now | Why |
|---|---|---|---|---|
| C1 | Section 1 · Basics 1 · lesson 2, exercises 6, 7, 8, 10 | *Il est un garçon.* / *Elle est une fille.* (word bank ×2, fill-blank *Il est un ___.*, type-answer) | *C'est un garçon.* / *C'est une fille.* (*C'est un ___.*) | With a determiner + noun predicate French requires the presentative *c'est*; *il est + un + noun* is the textbook anglicism, and lesson 2 drilled it four times. The four exercises lose their bundled audio (see residual R1). |
| C2 | Section 1 · Food · lesson 2, exercise 8 | fill-blank *Je bois de l'eau.* with no blank, correct option `leau` (misspelt), `l'eau` marked wrong | *Je bois de ___.* — options `jus / l'eau / fromage / pain`, correct `l'eau` | Unanswerable item that taught a misspelling as correct. |
| C3 | Section 1 · Animals · lesson 3, exercise 8 | fill-blank *L'oiseau vole haut.* with no blank, correct option `Loiseau` | *___ vole haut.* — options `souris / l'âne / chat / L'oiseau` | Same defect; the elided subject was the intended target. |
| C4 | Writing tasks `q_note_train`, `cp5_note_train`, `a1cap_note_train` (+ their course/checkpoint/capstone copies) | single contiguous phrase slots (*le train est demain à neuf heures* / *train demain à neuf heures*) | information-unit slots: addressee · *train* · day (*demain* / *samedi*) · time (*à neuf heures* …) | *Le train part à neuf heures* — the course's own model sentence for the fact — and the fronted *Demain, le train est à neuf heures* both failed the scored A1 check. |
| C5 | Writing task `o_name` (+ course copy) | `requireSentenceVerbs: m'appelle, suis` while the slot accepts *moi c'est Léa* | `m'appelle, suis, c'est` | The accepted variant could never pass the verb check. |
| C6 | Speech items `m_price`, `cp4_price_five`, `pl4_price_seven` (+ course, checkpoint and placement copies) | only *Ça coûte N euros*; concept slot `coûte` | + *Ça fait N euros*, *C'est N euros*, *N euros*; concept slot `coûte / ça fait / c'est` | "Say what it costs" never asked for *coûter*; *Ça fait / C'est … euros* are the forms the partner lines and the capstone item already use. A scored Section-4 item failed learners for the taught form. |

## Applied — major

| # | Where | Change |
|---|---|---|
| M1 | Concept *Two endings that need care* (`fr:concept:gender-tricky-endings`) + Gender & Articles guidebook | "-ion and -son words are feminine" replaced by the data-backed statement: the 96.7 % masculine figure for -on is computed once -ion/-son words are set aside, and **those groups are mixed** — the dependable feminine sub-families are -tion/-sion (99 %) and -aison/-ison (*maison, raison, saison, prison*), while *l'avion, le camion, le lion, le poisson, le poison, le blouson* stay masculine. Memory hint rewritten accordingly (the old one produced **la poisson* for a Section-1 word). |
| M2 | Concept *Endings that say masculine* + guidebook | -age exceptions now list *la page, la plage* (a Section-3 lexeme) *and la cage*; -eau exceptions add *la peau*. |
| M3 | Concept *Endings that say feminine* | Names the everyday exceptions (*le silence*, *le génie*) instead of "a rare exception exists". |
| M4 | Section 1 · Food guidebook | "*Manger* adds -e before silent endings: *je mange, tu manges*" (false) → keeps its *e* before *-ons*: *nous mangeons*. |
| M5 | Section 1 · Animals guidebook | *la chatte* removed as the showcase feminine noun (vulgar reading for every French speaker); *la vache* used instead. |
| M6 | Section 5 guidebooks (all four units) + unit title | Accents restored in model French: *J'habite à*, *J'aime le café*, *Il habite à Lyon*, *le train est demain à neuf heures*, *À demain !*, *Prénom*, *Âge*, *Écris qui tu es*. These were the only unaccented models in the course — inside the section that teaches orthography. |
| M7 | Numbers concept + Numbers guidebook | "*quatre-vingts* keeps its -s only when bare" → keeps its -s unless another number follows (*quatre-vingts euros*, but *quatre-vingt-un*). The old wording taught the misspelling **quatre-vingt euros*. |
| M8 | Writing task `r_message_full` (+ course copy) | one fixed word order (*je suis au café demain à dix heures*) → slots addressee · place · day · time · closing (now also *à bientôt, à plus, bises*); verb allowlist adds *serai, se voit, se retrouve* so *On se voit au café demain à dix heures* passes. |
| M9 | Writing tasks `q_note_cafe`, `cp5_note_anna`, `a1cap_note_resto`, `a1cap_note_magasin` (+ copies) | same information-unit restructuring (addressee · what · day/time · open), so *Rendez-vous au café à deux heures*, *Samedi on mange au restaurant* (the reading passage's own sentence) and *Demain, le magasin ouvre* pass. |
| M10 | Writing task `p_like_two` (+ course copy) | slots *liking verb* · *thé* · *pain* instead of *j'aime le thé* + *le pain*, so *J'aime le pain et le thé* passes. |
| M11 | Writing task `cp5_sofia_tea` (+ checkpoint copy) | accepts *adore* and *aime bien* like its sibling tasks. |
| M12 | Writing profile tasks (`o_profile`, `cp5_profile_*`) | accept *moi c'est X* and list *c'est* in the verb allowlist, matching `o_name`. |
| M13 | Speech items `m_train_time`, `cp4_train_ten`, `pl4_train_eight` (+ copies) | accept *Il part à N heures*, *À N heures*, *Le train est à N heures*, *Le départ est à N heures*. |
| M14 | Speech item `k_pardon` (+ course copy) | accept *Excusez-moi*, *Pardon, madame/monsieur*, *Oh, pardon*, *Désolé(e)*. |
| M15 | Scenarios `salut_ca_va`, `a1cap_voisin`, `cp_rencontre` | "doing well" intents accept *Bien, merci !*, *Oui, ça va bien*, *Je vais très bien* (the canonical short native answer previously dropped to the repair path). Branch order was already deterministic (authored order wins), so the *ça va* ⊂ *ça va bien* overlap flagged by pass B cannot misroute. |
| M16 | Scenario `cp_boulangerie` | water intent evaluated before "that's all", as its practice twin already does, so *De l'eau, s'il vous plaît, et c'est tout* serves the water. |

## Applied — minor

- *Youre* → *You're* (word-bank distractor); *Lea* → *Léa* (Section 5 prompt); *the prize money* → *the door* (ambiguous distractor for *le prix*).
- Basics 1 guidebook: the *de l'eau* note no longer implies *de + le/la → de l'*; it states the partitive (*de la + eau*, *l'* before a vowel, *du pain*).
- Cognates guidebook/concept: "six are real vocabulary" now says "for example" before listing four; liaison example *un petit ami* (a boyfriend) → *un petit enfant*; elision concept lists *ce → c'* (*c'est*), which the course uses everywhere.
- Speech: *Describe the door.* → *Say that the door is closed.* (the only accepted answer); *J'adore / J'aime bien le café/thé* accepted; *La gare / Une gare* accepted; *Une semaine a sept jours* accepted; *Salut !*, *À bientôt !*, *À plus !* accepted for the bus farewell.
- Scenarios: *Non, merci* declines "Et avec ça ?"; *C'est quel quai ?* asks the platform; *La gare, c'est où ?* / *Pour aller à la gare ?* (and the hotel twins) ask the way; *À plus (tard)* says goodbye.
- Placement: distractor *At twenty o'clock* → *At eight in the evening*.
- Readings: *prend le train pour aller à la bibliothèque* / *pour aller en ville*; notice title *À la gare*.

## Declined or deferred (with reasons)

| Finding | Decision | Reason |
|---|---|---|
| Partner lines *Vous voulez quoi ?* / *Vous voulez boire quoi ?* (rephrase lines, 3 clips), *Ah, ça va seulement ?* (1 clip), *Et voilà votre boisson !* (2 clips), *un jus* → *un jus d'orange* (1 clip) | **Applied in the V1 publication program** (texts re-worded in commit 844b2e7; clips re-synthesized by the reception-audio workflow's incremental generate mode) | Every one of these strings is a synthesized listening clip whose asset key is the content hash of its text. Changing the text requires re-running the dispatch-only Piper pipeline, which regenerates all 177 reception clips (no incremental mode) and rewrites the audio baseline. All are register/naturalness issues (minor); none is wrong French. Tracked as roadmap item "re-record six partner lines". |
| *C'est ___ amie de Marie* ("She is Marie's friend") — pass B suggested *une* could compete with *l'* | No change | The item offers only `l'` and `la`; it tests elision, and *la amie* is impossible. No second defensible key exists. |
| *la voie* glossed "the platform" | No change | Pragmatic gloss for station announcements (*voie 2*); noted in the lexicon review, not an error. |
| *Je voudrais un thé* as the example under *vouloir* | No change | Deliberate: the conditional is the form the course teaches for ordering. |
| *Je veux du café* in the Food guidebook | No change | Grammatical; register note only. Section 6 teaches *je voudrais*. |
| *voie une* vs *voie un*; *Ouvert* under a feminine shop name | No change | Both attested; sign usage is invariable. |
| Bare-noun acceptance for "how many cats" (*Deux chats* without *il y a*) | No change | The objective is *il y a* production; the inconsistency with bare-noun items elsewhere is a design choice recorded in the dossier. |

## Engine changes that came out of the attacks

- **Keyword stuffing** (`src/lib/writing/rubric.ts`): writing every authored
  variant of a slot ("je m'appelle Léa je suis Léa moi c'est Léa …") was
  accepted for 79 % of guided tasks. The engine now counts *distinct,
  non-overlapping realizations* of a slot that has two or more authored
  phrasings; two or more in one answer is a list of guesses, not an answer,
  and is refused with "Say … once — one clear sentence is enough". Overlapping
  matches (*moi je suis Léa* hitting two variants at once) count once;
  single-phrasing slots (a name, *demain*) are exempt, so "… demain à dix
  heures. À demain !" is fine; open-practice tasks (menu slots such as "a
  sentence about you": *je suis / j'ai / j'habite*) are exempt by mode.
- **Information-unit slots**: the systematic pattern behind twelve of the
  findings was rubric slots that encoded one word order. Slots are now
  authored per fact (addressee · what · day · time · closing) so any order
  and any of the taught verbs pass, while the attacks that must still fail
  (prompt copy, cue values only, wrong name, wrong number, wrong person,
  English wrapper, over-length garbage) are pinned by tests.
- **Addressee slot**: the "wrong fact" attack showed that a note written to
  the wrong person (*Salut Zorglub* for a note to Paul) passed. Every note
  task with a "To" cue now requires the addressee.

## Attack results after the fixes (all pinned as tests)

| Suite | Scope | Result |
|---|---|---|
| `src/lib/__tests__/rubric-speech-attacks.test.ts` | every guided writing task (14) and every speech item (28) | model answers pass; accent-less typing passes; prompt copy, cue-only fragments, English wrapper, over-length paste, irrelevant French, wrong person, wrong fact, keyword stuffing never pass; silence/garbage never grade; wrong quantity and negated *il y a* never satisfy a concept; n-best and article leniencies measured and bounded |
| `src/lib/__tests__/interaction-attacks.test.ts` | every scenario (18) | every intent matches its own utterance and is never shadowed; clarification/"I don't know"/silence never match; negated utterances never match; technical outcomes never judge or move the conversation; stale finals ignored; repair never converts a first miss into a scored pass |
| `bun test` (5 timezone lanes) / `bunx jest` | whole repository | 1,173 / 69 passing after the content changes; content validation green (writing mirrors, speech mirrors, reserved-item isolation, answer-leak rule) |

## Residuals

- **R1 — four Section-1 prompts without bundled audio.** *C'est un garçon.* /
  *C'est une fille.* have no legacy recording (the legacy manifest is an
  immutable baseline and the reception pipeline only synthesizes listening
  clips). The four exercises render without a speaker button; the two
  orphaned recordings of the wrong sentences stay in the baseline, unused.
  A pack-sentence mode for the Piper pipeline is the post-v1 fix.
- **R2 — telegraphic notes are accepted by design.** With per-fact slots,
  *Salut Marie, café à deux heures* passes the note rubric. That is how
  French people text; the checkpoint construct is "conveys the facts", not
  "writes full clauses" (tasks that demand a clause carry a verb allowlist).
- **R3 — one-verb sentences with two liking verbs.** *J'adore le thé et
  j'aime le pain* trips the stuffing rule (two distinct phrasings of the
  liking slot). Judged rare at A1 and recoverable from the feedback text.
- **R4 — deferred partner-line register fixes** (table above).

## How the passes were run

Extracted strings: `scratchpad/review/learner-facing.tsv` (6,702 rows) and
per-file chunks; findings: `passA-findings.tsv`, `passB-findings.tsv`, with
summaries. Repairs were applied by a fail-closed script that asserted every
current value before replacing it and then propagated each writing task and
speech item into every embedded course/checkpoint/placement copy (34 writing
copies, 51 speech copies), after which `bun scripts/compile-content.ts` and
`bun scripts/validate-content.ts` were re-run.
