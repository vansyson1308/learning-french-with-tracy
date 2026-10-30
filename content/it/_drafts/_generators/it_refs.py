"""lexemeRefs of an Italian text: the lexicon entries whose lookup form, or a known inflected form, appears in it."""
import json, os, re

_ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "lexicon", "lexemes.json"))
LEX = json.load(open(_ROOT, encoding="utf-8"))["lexemes"]
FORMS = {}
for l in LEX:
    if l["partOfSpeech"] in ("pronoun", "determiner", "preposition", "conjunction"):
        continue  # function words are not listed as context
    for f in {l["lookupForm"], l["lemma"]}:
        FORMS.setdefault(f.lower(), l["id"])
# High-frequency inflected forms → lemma; regular plurals and -are present forms are tried below.
EXTRA = {
    "sono": "essere", "sei": "essere", "è": "essere", "siamo": "essere", "siete": "essere", "ho": "avere", "hai": "avere", "ha": "avere", "abbiamo": "avere", "avete": "avere", "hanno": "avere",
    "vado": "andare", "vai": "andare", "va": "andare", "andiamo": "andare", "andate": "andare", "vanno": "andare", "vengo": "venire", "vieni": "venire", "viene": "venire", "veniamo": "venire", "vengono": "venire",
    "faccio": "fare", "fai": "fare", "fa": "fare", "facciamo": "fare", "fanno": "fare", "sto": "stare", "stai": "stare", "sta": "stare", "stiamo": "stare", "stanno": "stare",
    "voglio": "volere", "vuoi": "volere", "vuole": "volere", "vogliamo": "volere", "vogliono": "volere", "posso": "potere", "puoi": "potere", "può": "potere", "possiamo": "potere", "possono": "potere",
    "devo": "dovere", "devi": "dovere", "deve": "dovere", "dobbiamo": "dovere", "devono": "dovere", "so": "sapere", "sai": "sapere", "sa": "sapere", "bevo": "bere", "bevi": "bere", "beve": "bere", "beviamo": "bere", "bevono": "bere",
    "dico": "dire", "dici": "dire", "dice": "dire", "esco": "uscire", "esci": "uscire", "esce": "uscire", "escono": "uscire", "uomini": "uomo", "donne": "donna", "mani": "mano", "uova": "uovo", "braccia": "braccio",
    "piace": "piacere", "piacciono": "piacere", "stato": "essere", "stata": "essere", "fatto": "fare", "letto": "leggere", "scritto": "scrivere", "preso": "prendere", "visto": "vedere", "detto": "dire", "perso": "perdere", "aperta": "aperto", "chiusa": "chiuso",
}
ENDINGS = [("i", "o"), ("i", "e"), ("e", "a"), ("a", "o"), ("e", "o"), ("o", "are"), ("i", "are"), ("a", "are"), ("iamo", "are"), ("ate", "are"), ("ano", "are"), ("ato", "are"), ("ata", "are"), ("ati", "are"), ("o", "ere"), ("i", "ere"), ("e", "ere"), ("iamo", "ere"), ("ete", "ere"), ("ono", "ere"), ("uto", "ere"), ("o", "ire"), ("i", "ire"), ("e", "ire"), ("iamo", "ire"), ("ite", "ire"), ("ono", "ire"), ("ito", "ire"), ("isco", "ire"), ("isci", "ire"), ("isce", "ire"), ("iscono", "ire"), ("he", "a"), ("hi", "o")]


def _lookup(t):
    if t in FORMS:
        return FORMS[t]
    if t in EXTRA and EXTRA[t] in FORMS:
        return FORMS[EXTRA[t]]
    for end, base in ENDINGS:
        if t.endswith(end) and len(t) > len(end) + 1:
            cand = t[: -len(end)] + base
            if cand in FORMS:
                return FORMS[cand]
    return None


def refs(text):
    out = []
    for tok in re.findall(r"[A-Za-zÀ-ÿ]+", text):
        i = _lookup(tok.lower())
        if i and i not in out:
            out.append(i)
    return out
