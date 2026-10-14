"""Export wordfreq Zipf frequencies for one language (P3a acquisition helper).

Run by the dispatch-only workflow (and by a developer run) with the PINNED
package version `wordfreq==3.1.1`; the export is `word,zipf` for the top
50,000 words of the `large` list when the language has one, else the
`best` list. The CSV is hashed and pinned like every other artifact.

    python export-wordfreq.py <lang> <out.csv>
"""
import csv
import sys

import wordfreq  # type: ignore

lang = sys.argv[1]
out = sys.argv[2]
try:
    words = wordfreq.top_n_list(lang, 50000, wordlist="large")
    wordlist = "large"
except LookupError:
    words = wordfreq.top_n_list(lang, 50000, wordlist="best")
    wordlist = "best"
with open(out, "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f, lineterminator="\n")
    w.writerow(["word", "zipf"])
    for word in words:
        w.writerow([word, f"{wordfreq.zipf_frequency(word, lang, wordlist=wordlist):.2f}"])
print(f"wordfreq {lang}: {len(words)} words ({wordlist} list) -> {out}")
