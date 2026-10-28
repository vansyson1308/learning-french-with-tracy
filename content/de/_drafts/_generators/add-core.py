"""Add the missing A1 core words to the frozen map (selected from the pool by surface, frozen-first)."""
import json, pathlib
S = pathlib.Path(r"C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-app-hoc-ngoai-ngu\82ea6b33-e22d-4a2d-907b-9b4441f9e202\scratchpad")
f = json.load(open(S / "de-frozen-reviewed.json", encoding="utf-8"))
CORE = {"nicht": "de:w:nicht", "hier": "de:w:hier", "auch": "de:w:auch", "wo": "de:w:wo", "wann": "de:w:wann",
        "heute": "de:w:heute", "morgen": "de:w:morgen-adverb", "gestern": "de:w:gestern", "aber": "de:w:aber"}
for s, i in CORE.items():
    assert s not in f, s
    assert i not in f.values(), i
    f[s] = i
(S / "de-frozen-reviewed.json").write_text(json.dumps(f, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(len(f))
