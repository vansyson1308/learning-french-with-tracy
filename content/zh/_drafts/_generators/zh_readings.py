"""Shared helpers of the zh-vi generators: CC-CEDICT numbered pinyin → tone marks (the same rule as
scripts/lib/cjk-readings/pinyin.ts numberedToMarked), the CC-CEDICT line parser, the toneless/compact pinyin folds, and
a minimal msgpack reader for wordfreq's cBpack word lists (arrays, maps, strings and small integers only)."""
import re
import unicodedata

HAN = re.compile(r"[㐀-鿿豈-﫿〇]")
TONE_MARKS = ["̄", "́", "̌", "̀"]
INITIAL = "(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?"
FINAL = "(?:a|ai|an|ang|ao|e|ei|en|eng|er|i|ia|ian|iang|iao|ie|in|ing|iong|iu|o|ong|ou|u|ua|uai|uan|uang|ue|ui|un|uo|ü|üan|üe|ün)"
SYLLABLE = re.compile(f"^(?:{INITIAL}{FINAL}|r|m|n|ng|hm|hng)$")


def nfc(s):
    return unicodedata.normalize("NFC", s)


def is_syllable(toneless):
    return bool(SYLLABLE.match(toneless))


def numbered_to_marked(syl):
    """"zhong1" → "zhōng", "lu:4" → "lǜ", "r5" → "r"; None when it is not a pinyin syllable."""
    m = re.match(r"^([a-zü:v]+)([1-5])$", syl.strip(), re.I)
    if not m:
        return None
    base = re.sub(r"u:|v", "ü", m.group(1).lower())
    tone = int(m.group(2))
    if not is_syllable(base):
        return None
    if tone == 5:
        return nfc(base)
    vowels = [i for i, c in enumerate(base) if c in "aeiouü"]
    if not vowels:
        return None
    if "a" in base:
        t = base.index("a")
    elif "e" in base:
        t = base.index("e")
    elif "ou" in base:
        t = base.index("ou")
    else:
        t = vowels[-1]
    chars = list(base)
    chars[t] = chars[t] + TONE_MARKS[tone - 1]
    return nfc("".join(chars))


def strip_tones(s):
    d = unicodedata.normalize("NFD", s)
    return nfc("".join(c for c in d if c not in TONE_MARKS))


def compact(s):
    """Tone-marked, spaceless, lower case: two spellings with the same tones compare equal."""
    return nfc(re.sub(r"[\s'’·\-]", "", s.lower()))


def tones_of(marked):
    """'xué shēng' → [2, 1]; a syllable without a mark is 0 (neutral)."""
    out = []
    for syl in marked.split(" "):
        d = unicodedata.normalize("NFD", syl)
        t = 0
        for i, mark in enumerate(TONE_MARKS):
            if mark in d:
                t = i + 1
        out.append(t)
    return out


def parse_cedict(lines, wanted):
    """{headword: [(traditional, simplified, [numbered...], proper)]} for every line whose simplified or traditional
    headword is wanted."""
    out = {}
    for line in lines:
        if line.startswith("#") or not line.strip():
            continue
        m = re.match(r"^(\S+) (\S+) \[([^\]]*)\] /", line)
        if not m:
            continue
        trad, simp, py = m.group(1), m.group(2), m.group(3).split()
        if simp not in wanted and trad not in wanted:
            continue
        proper = any(re.match(r"^[A-Z]", s) for s in py)
        entry = (trad, simp, py, proper)
        for key in {simp, trad}:
            if key in wanted:
                out.setdefault(key, []).append(entry)
    return out


def cedict_marked(numbered):
    marked = [numbered_to_marked(s.lower()) for s in numbered]
    return " ".join(marked) if all(marked) else None


# --- msgpack (the subset wordfreq's cBpack files use) ------------------------------------------------------------


def unpack(data):
    pos = 0

    def read():
        nonlocal pos
        b = data[pos]
        pos += 1
        if b <= 0x7F:
            return b
        if 0x80 <= b <= 0x8F:
            return {read(): read() for _ in range(b & 0x0F)}
        if 0x90 <= b <= 0x9F:
            return [read() for _ in range(b & 0x0F)]
        if 0xA0 <= b <= 0xBF:
            n = b & 0x1F
            s = data[pos:pos + n].decode("utf-8")
            pos += n
            return s
        if b == 0xC0:
            return None
        if b in (0xC2, 0xC3):
            return b == 0xC3
        if b in (0xD9, 0xDA, 0xDB):
            w = {0xD9: 1, 0xDA: 2, 0xDB: 4}[b]
            n = int.from_bytes(data[pos:pos + w], "big")
            pos += w
            s = data[pos:pos + n].decode("utf-8")
            pos += n
            return s
        if b in (0xDC, 0xDD):
            w = 2 if b == 0xDC else 4
            n = int.from_bytes(data[pos:pos + w], "big")
            pos += w
            return [read() for _ in range(n)]
        if b in (0xDE, 0xDF):
            w = 2 if b == 0xDE else 4
            n = int.from_bytes(data[pos:pos + w], "big")
            pos += w
            return {read(): read() for _ in range(n)}
        if b in (0xCC, 0xCD, 0xCE, 0xCF):
            w = {0xCC: 1, 0xCD: 2, 0xCE: 4, 0xCF: 8}[b]
            n = int.from_bytes(data[pos:pos + w], "big")
            pos += w
            return n
        if b >= 0xE0:
            return b - 0x100
        raise ValueError(f"msgpack type 0x{b:02x} not supported")

    return read()
