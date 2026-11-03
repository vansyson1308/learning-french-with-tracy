"""Furigana from JmdictFurigana entries, shared by ja-subset.py (which keeps only the entries a course word uses) and
ja-lex.py (which writes the readings). A surface's furigana is the JmdictFurigana entry for the surface and its kana, or a
chain of entries and literal kana that spells both; the kanji stem of an inflecting entry (待 of 待つ) may explain a
conjugated spelling (待って). Nothing is guessed: no chain, no reading."""
import re

HAN = re.compile(r"[㐀-鿿豈-﫿々〆ヶ]")


def hira(s):
    return "".join(chr(ord(c) - 0x60) if 0x30A1 <= ord(c) <= 0x30F6 else c for c in s)


def index(furigana):
    """{"text|reading": [[base, ruby|None], ...]} → text (or stem) → [(reading, segments, key)], sorted."""
    by_text = {}
    for key, segs in furigana.items():
        text, reading = key.split("|", 1)
        by_text.setdefault(text, []).append((reading, segs, key))
        last = max((i for i, s in enumerate(segs) if s[1] is not None), default=-1)
        stem = segs[: last + 1]
        base = "".join(s[0] for s in stem)
        if stem and base != text and re.fullmatch(r"[ぁ-ゖ]+", text[len(base):]):
            by_text.setdefault(base, []).append(("".join(s[1] or s[0] for s in stem), stem, key))
    return {t: sorted(v, key=lambda x: (x[0], x[2])) for t, v in by_text.items()}


def chain(surface, kana, by_text):
    """(segments as [[base, ruby|None]], keys of the entries used), or None."""
    target = hira(kana)

    def solve(i, j):
        if i == len(surface):
            return ([], []) if j == len(target) else None
        for end in range(len(surface), i, -1):
            text = surface[i:end]
            if not HAN.search(text):
                continue
            for reading, segs, key in by_text.get(text, []):
                r = hira(reading)
                if target.startswith(r, j):
                    rest = solve(end, j + len(r))
                    if rest is not None:
                        return [list(s) for s in segs] + rest[0], [key] + rest[1]
        c = surface[i]
        if not HAN.search(c) and j < len(target) and hira(c) == target[j]:
            rest = solve(i + 1, j + 1)
            if rest is not None:
                return [[c, None]] + rest[0], rest[1]
        return None

    return solve(0, 0)


def merged(segs):
    """[[base, ruby|None]] → schema segments: kana runs merged, ruby only on bases with kanji."""
    out = []
    for base, ruby in segs:
        if ruby is not None and HAN.search(base):
            out.append({"base": base, "ruby": ruby})
        elif out and "ruby" not in out[-1]:
            out[-1] = {"base": out[-1]["base"] + base}
        else:
            out.append({"base": base})
    return out
