# concepts — ingest report (de-vi)

Records: 35 · schema-valid: 35 · failed: 0 · validator errors after merge: 9

## Records

- ✅ line 1 `de:concept:three-genders`
- ✅ line 2 `de:concept:gender-endings`
- ✅ line 3 `de:concept:ein-kein`
- ✅ line 4 `de:concept:plurals`
- ✅ line 5 `de:concept:accusative`
- ✅ line 6 `de:concept:dative-phrases`
- ✅ line 7 `de:concept:present-endings`
- ✅ line 8 `de:concept:sein-haben`
- ✅ line 9 `de:concept:vowel-change`
- ✅ line 10 `de:concept:verb-second`
- ✅ line 11 `de:concept:questions`
- ✅ line 12 `de:concept:separable-verbs`
- ✅ line 13 `de:concept:modal-verbs`
- ✅ line 14 `de:concept:perfekt`
- ✅ line 15 `de:concept:numbers`
- ✅ line 16 `de:concept:clock-time`
- ✅ line 17 `de:concept:du-sie`
- ✅ line 18 `de:concept:place-prepositions`
- ✅ line 19 `de:concept:sounds-umlaut-ch`
- ✅ line 20 `de:concept:final-devoicing-length`
- ✅ line 21 `de:concept:capitals-eszett`
- ✅ line 22 `de:concept:compounds`
- ✅ line 23 `de:concept:false-friends`
- ✅ line 24 `sein`
- ✅ line 25 `haben`
- ✅ line 26 `werden`
- ✅ line 27 `wohnen`
- ✅ line 28 `arbeiten`
- ✅ line 29 `spielen`
- ✅ line 30 `sprechen`
- ✅ line 31 `fahren`
- ✅ line 32 `essen`
- ✅ line 33 `können`
- ✅ line 34 `müssen`
- ✅ line 35 `anrufen`

## Validator errors (fix these records and ingest again)

- paradigms: wohnen: regular pre:2s must be "wohnest", got "wohnst"
- paradigms: wohnen: regular pre:3s must be "wohnet", got "wohnt"
- paradigms: wohnen: regular pre:2p must be "wohnet", got "wohnt"
- paradigms: sprechen: group "vowel change e → i" is not one of regular, irregular
- paradigms: fahren: group "vowel change a → ä" is not one of regular, irregular
- paradigms: essen: group "vowel change e → i" is not one of regular, irregular
- paradigms: können: group "modal" is not one of regular, irregular
- paradigms: müssen: group "modal" is not one of regular, irregular
- paradigms: anrufen: group "separable" is not one of regular, irregular

## Written

- content/de/pedagogy/concepts.json
- content/de/pedagogy/paradigms.json
