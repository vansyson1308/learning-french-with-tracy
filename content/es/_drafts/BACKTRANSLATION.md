# Back-translation pass — es-vi (P3e §8)

Done in a Claude Code session on 2026-10-22. Every (Spanish, Vietnamese) pair of the
course was read side by side and the Vietnamese checked back against the Spanish:

| Group | Pairs |
|---|---|
| Pack words (`words[]`) | 135 |
| Pack exercises (select / match / fill-blank / word-bank / type-answer) | 307 |
| Lexicon glosses (`glosses.vi` vs surface + English gloss) | 890 |
| Lexicon example translations | 1,607 |
| Concept-card examples | 29 |
| Reading glossaries | 56 |
| **Total (distinct)** | **3,024** |

Extraction: every pair where the course shows Spanish with its Vietnamese meaning
(the correct option of a `targetToNative` / `nativeToTarget` select, match pairs,
fill-blank translations, word-bank answers, lexicon glosses and examples, concept
examples, reading glosses). Prompts that are instructions ("Số 8 là…") were read as
context only.

Every flag below is **resolved** (changed in the source, see the P3e §8 commit) or
**justified** (kept, with the reason). No flag is open.

## 1. Resolved — the Vietnamese did not say what the Spanish says

| Where | Spanish | Was | Now |
|---|---|---|---|
| es-vi:ue-l2-e5 | El taxi es caro. | Chiếc taxi đắt. (the vehicle is expensive) | Đi taxi đắt. |
| es-vi:un-l2-e3 | Es por la mañana. | Bây giờ là buổi sáng. ("it is morning now" — the Spanish answers *when*) | Vào buổi sáng. |
| es-vi:uu-l1-e0 | ¿Puedo ayudarle? | Tôi giúp gì được cho bạn? (*le* is *usted*) | Tôi giúp gì được cho anh/chị? |
| es:w:gato | Ella asustó al gato. | …làm con mèo sợ chạy mất (adds "ran off") | Cô ấy làm con mèo hoảng sợ. |
| es:w:familia | Ella no sabe nada sobre su familia. | …về gia đình bạn | …về gia đình mình. |
| es:w:tener | Ella tiene seis hermanos. | sáu người anh em trai | sáu anh chị em |
| es:w:solo | La máquina se lava sola. | Máy tự giặt sạch. | Máy tự làm sạch. |
| es:w:encontrar | María y Gertrudis… | Mary và Gertrude… (names changed) | María và Gertrudis… |
| es:w:todavia | Helado es todavía mejor. | Món đông lạnh… | Kem còn ngon hơn. |
| es:w:permitir | No puedo permitirme comprarlo. | Tôi không dám cho phép mình mua nó. | Tôi không đủ tiền mua nó. |
| es:w:perfecto | Él es perfecto en todo. | Anh ấy giỏi mọi thứ. | Anh ấy hoàn hảo về mọi mặt. |
| es:w:justo | El avión está justo saliendo. | Máy bay sắp cất cánh. | Máy bay đang cất cánh. |
| es:w:abogado | Dudo que sea un abogado. | Tôi nghi ông ta là luật sư. (opposite) | Tôi không tin ông ta là luật sư. |
| es:w:encantador | Juan es un hombre encantador… | John là… | Juan là… |
| es:w:mediodia | Comemos al mediodía. | Chúng tôi ăn trưa vào buổi trưa. | Chúng tôi ăn vào buổi trưa. |

## 2. Resolved — the Spanish itself was wrong, regional or unusable (example dropped)

*Creé en vos mismo.* (Rioplatense voseo) · *Quiero enseñarme a hacer artesanías.* (should
be *aprender*) · *Se nos convirtió en un blanco.* (unclear) · *Ocupo ayuda.* (Mexican
*ocupar* = *necesitar*) · *Dónde Están Mis Sueños* (a title, no ¿?) · *Esta ilustración es
cine.* · *'lanzar un chiste* (stray apostrophe) · *Libre crezca fecundo.* (anthem line) ·
*¡Aguas! ¡Viene un camión!* (Mexican slang) · *Hay veinticuatro horas por el día.* (*al
día*) · *Este día es viernes.* (*Hoy es viernes*) · *…es más una área gris…* (*un área*) ·
*El próximo lunes es feriado.* (Spain: *festivo*) · *¿Cuánto cuesta la tienda?* (asks the
price of the shop). Originals added where a lexeme would be left bare: *El área de
fumadores está fuera.* · *El lunes voy a clase.*

(The LanguageTool gate, run first, had already removed 32 failing examples and
repaired eight lexemes — see `content/es/languagetool-allow.json` and the §8 commit.)

## 3. Resolved — the lexeme was the wrong word

The ETL read a noun where the course needs the adjective or adverb. Surfaces fixed
(ids unchanged): *el rápido* → **rápido** (adj.), *el querido* → **querido** (adj., "thân
mến"), *el gordo* → **gordo** (adj.), *el casado* → **casado** (adj.), *el ayer* → **ayer**
(adv.); *la tuya* (the thuja tree) is the possessive pronoun **tuya** ("của bạn"); *vestido*
(adj.) is "ăn mặc", not "chiếc váy".

Broken English glosses (shown in es-en): terminar "to to" → "to finish, to end";
policía "Civility, polity" → "the police"; triste "As a temporary state" → "sad";
novia "a type of sweet roll" → "the girlfriend; the bride"; tía "the girl, woman" →
"the aunt"; billete "the banknote" → "the ticket (also: banknote)"; quedar "to be" →
"to stay, to remain; to arrange to meet"; vuelta → "the turn; the change (money)"
(vi: "vòng / lượt về / tiền thừa").

## 4. Resolved — homographs in the A1 syllabus (systemic ETL defect)

Reading the glosses exposed words no A1 learner needs at the top of the frequency list
(*asir*, *mesar*, *ademar*, *el hemo*, *aguar*…). Cause: the ETL splits a word form's count
between every lemma that has the form, and a verb with an inflection table gets a
richness bonus — so *así* fed *asir* (rank 37), *casa* fed *casar*, *además* fed *ademar*,
*hemos* fed *el hemo*. These 33 lexemes keep their gloss and examples but lose the
measured frequency (it belongs to the other word), so they leave the daily-words
syllabus: asir, casar, coser, hermanar, papar, idear, seriar, esposar, podar, mesar,
ademar, personarse, hemo, aguar, equipar, librar, sangrar, restar, reglar, embargar,
vera, son, era, este (east), nueva, primera, escucha, llama, toma, dije, señor (adj.),
el dónde (noun; the adverb *dónde* is its own lexeme), vuelto (participle of *volver*).
(*tipar* and *haya* were fixed the same way by the LanguageTool pass.)

The syllabus rule was also missing the course's own core vocabulary: 23 hand-authored
A1 lexemes without a frequency measurement (siete, ocho, nueve, once, doce, quince,
treinta, cincuenta, el miércoles, enero, el apellido, la farmacia, el andén, el euro,
la amiga, la panadería, ellos, muy, recto, hasta luego, la sed, los hermanos,
el vietnamita) were never daily words. Course-authored lexemes (source
`original-lexicon-etl` only) are now syllabus members (`scripts/lib/syllabus.ts`).

**Template note for de / it / pt (P3d):** run the same homograph check on every new
pool before authoring — a lemma whose own string is rare (secondary zipf missing or
< 3.5) while its measured rank is high is almost always fed by another word's form.

## 5. Justified — kept as is

| Where | Pair | Why it stays |
|---|---|---|
| pack u3-l0-e8, u3-l3-e7 | Tengo un hermano. → Tôi có một anh trai. | Vietnamese must choose older/younger to form a sentence; the word gloss on the teach card and in the dictionary gives both ("anh / em trai", "chị / em gái"). |
| es:w:manana | la mañana → buổi sáng / ngày mai | One lexeme covers *la mañana* (morning) and the adverb *mañana* (tomorrow), which the course uses (*El tren sale mañana*); the teach card shows both. |
| pack u1-l0-e6 | Hola, buenos días. → Xin chào, chào buổi sáng | Word-bank answer mirrors the double greeting on purpose (tokens). |
| pack us-l2-e1 | Yo soy Marcos → còn tôi, tôi là Marcos | The explicit *yo* is contrastive in the dialogue; "còn tôi" carries it. |
| es:w:querer | Te quiero. → Anh yêu em. | Vietnamese must pick pronouns; a neutral rendering ("Tôi yêu bạn") sounds unnatural for a love declaration. |
| es:w:senor-adjective | dale un señor golpe → một cú ra trò; Eres muy señor de hacerlo → Bạn hoàn toàn có quyền làm điều đó | Both are correct renderings of the colloquial adjective (DLE: "señor", adj. coloq.); the lexeme is no longer a daily word (§4), so A1 learners only meet it in the dictionary. |
| es:w:maestro | la práctica hace al maestro → có công mài sắt, có ngày nên kim | Idiom rendered by the Vietnamese idiom, not word for word. |
| es:w:medicina, es:w:corazon, es:w:oro | proverbs | Same: Vietnamese proverb equivalents. |
| es:w:tiempo | Amiga, ha pasado demasiado tiempo. → Bạn ơi, lâu quá rồi. | Natural Vietnamese for the vocative; LanguageTool's comma flag is a false positive (allow-listed). |
| Latin-American usages in lexicon examples (*papá ya es muy grande*, *recién*, *acá*) | | Recognition-only dictionary examples, not model text; the variety rule (VARIETY.md) governs the course text, which LanguageTool and `content:validate` check. |
