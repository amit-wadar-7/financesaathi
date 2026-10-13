import os
import re

pattern = re.compile(r'sunita|pooja|rekha|anita|pragati|amit wadar|admin123|officer123|leader123|borrower123|amit123', re.I)

matches = []
unexpected = []
for root_dir in ['frontend/src', 'backend/app']:
    for root, dirs, files in os.walk(root_dir):
        if '__pycache__' in root:
            continue
        for f in files:
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8', errors='ignore') as fh:
                for idx, line in enumerate(fh, 1):
                    if pattern.search(line):
                        clean_line = line.strip().encode('ascii', errors='replace').decode('ascii')
                        item = f"{p}:{idx}: {clean_line[:100]}"
                        matches.append(item)
                        if "seed.py" not in p:
                            unexpected.append(item)

print(f"Total matches found: {len(matches)}")
print(f"Unexpected matches outside seed.py: {len(unexpected)}")
if unexpected:
    print("UNEXPECTED:")
    for u in unexpected:
        print(u)
else:
    print("SUCCESS: Zero forbidden keywords found outside seed.py!")
