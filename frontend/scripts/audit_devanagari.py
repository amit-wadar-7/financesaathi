import os
import re

devanagari_pattern = re.compile(r'[\u0900-\u097F]')

# We can analyze files for visible text strings, or inspect rendered mock text
pages_dir = os.path.join(os.path.dirname(__file__), '..', 'src', 'pages')

print("Scanning pages for t() call density and hardcoded English strings...")

for fname in sorted(os.listdir(pages_dir)):
    if not fname.endswith('.jsx'):
        continue
    fpath = os.path.join(pages_dir, fname)
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    t_calls = len(re.findall(r'\bt\(', content))
    # Count JSX text nodes (lines between tags that have English letters and no curly braces)
    jsx_text_lines = [l.strip() for l in content.splitlines() if re.search(r'>\s*[A-Za-z]{3,}[^<{]*<', l)]
    dev_matches = len(re.findall(devanagari_pattern, content))

    print(f"{fname:20} | t() calls: {t_calls:3} | JSX text candidates: {len(jsx_text_lines):3} | Devanagari chars: {dev_matches:4}")
