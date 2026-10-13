import os
import re
import glob

def get_css_classes(css_path):
    with open(css_path, "r", encoding="utf-8") as f:
        content = f.read()
    # remove comments
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    # find all class selectors: .classname
    classes = set(re.findall(r'\.([a-zA-Z0-9_\-]+)', content))
    return classes

def get_jsx_classes(jsx_dir):
    jsx_files = glob.glob(os.path.join(jsx_dir, "**", "*.jsx"), recursive=True)
    jsx_classes = {}
    for path in jsx_files:
        with open(path, "r", encoding="utf-8") as f:
            code = f.read()
        # match className="..." or className={`...`} or className={'...'}
        # simple regex for literal class tokens
        matches = re.findall(r'className\s*=\s*(?:["\']([^"\']+)["\']|\{[`"\']([^`"\']+)[`"\']\})', code)
        tokens = set()
        for m in matches:
            val = m[0] or m[1]
            # split by spaces or template literals
            for token in re.split(r'[\s\${}?:`]+', val):
                # filter out obvious JS expressions, empty, or special chars
                token = token.strip("'\"")
                if token and re.match(r'^[a-zA-Z0-9_\-]+$', token) and not token in ("true", "false", "null", "undefined"):
                    tokens.add(token)
        jsx_classes[path] = tokens
    return jsx_classes

def main():
    css_path = os.path.abspath("frontend/src/styles.css")
    jsx_dir = os.path.abspath("frontend/src")
    defined = get_css_classes(css_path)
    used = get_jsx_classes(jsx_dir)
    
    total_missing = 0
    missing_by_file = {}
    for path, classes in used.items():
        missing = [c for c in classes if c not in defined]
        if missing:
            rel = os.path.relpath(path, jsx_dir)
            missing_by_file[rel] = sorted(missing)
            total_missing += len(missing)

    print(f"Total defined CSS classes: {len(defined)}")
    print(f"Files with missing classes: {len(missing_by_file)}")
    print(f"Total missing class occurrences: {total_missing}")
    for file, miss in sorted(missing_by_file.items()):
        print(f"\n{file} ({len(miss)} missing):")
        print("  " + ", ".join(miss))

if __name__ == "__main__":
    main()
