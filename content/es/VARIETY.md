# Spanish variety — es-vi (P3e)

**Production model: Peninsular Spanish (español de España).** Every target-language
text the course models — lesson prompts and options, sentences, readings, clip
transcripts, speech targets, model answers, conversation partner lines, checkpoint,
placement and DELE A1 items — uses the Peninsular form. Reasons: the DELE is
administered by the Instituto Cervantes, the selected voices (Kokoro `ef_dora` /
`em_alex`) are Castilian, and a learner needs one consistent variety.

**Latin-American forms are accepted, never punished.** They are listed in every
accepted-answer list (typed alternatives, speech `acceptedVariants`, rubric slot
variants, required concepts, scenario intents) and shown as a note on the teach card
of the Peninsular word: *"Ở Mỹ Latinh: el boleto"*.

| Peninsular (taught) | Latin America (accepted, shown as a note) | Lexicon |
|---|---|---|
| el billete | el boleto | `es:w:boleto` → `es:w:billete` |
| el zumo | el jugo | `es:w:jugo` → `es:w:zumo` |
| el coche | el carro, el auto | `es:w:auto` → `es:w:coche` |
| el ordenador | la computadora | `es:w:computadora` → `es:w:ordenador` |
| el móvil | el celular | (no lexeme for *celular* yet) |
| vosotros habláis | ustedes hablan | paradigm cell `pre:2p`, concept cards |

**vosotros / ustedes.** The paradigms carry the *vosotros* forms (`pre:2p`: sois, estáis,
habláis, coméis, vivís…) and the post-answer note names them ("dạng ngôi vosotros").
At A1 *vosotros* is taught for **recognition**; when the learner speaks or writes,
*ustedes* (third-person plural) is equally accepted. *Ustedes* is also the formal
plural in Spain.

**Other notes.** *papa* is "the Pope" in Spain (potato = *patata*); the guidebook says so.
*¡Vale!* is the Peninsular "OK".

## How the rule is enforced

- A lexeme that is a regional form carries `variety: { region: "latam", equivalent }`
  (`content/es/lexicon/lexemes.json`). It is never in the syllabus (`syllabus.json`),
  never the model of an exercise, and its surface appears on the equivalent's teach card.
- `content:validate` rejects a regional form in any target-language model text of the
  primary course and its sources (`scripts/lib/variety.ts`); accepted-answer lists are
  exempt.
- Adding a pair: add (or mark) the regional lexeme with `variety`, add the row above,
  run `bun scripts/syllabus.ts derive --target es --level A1 --min 600`,
  `bun run content:validate`.
