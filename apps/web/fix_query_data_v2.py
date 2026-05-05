import os
import re

src_dir = "/Users/macm4/Documents/KKN/kknuinsaizu/apps/web/src"

count = 0

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith((".tsx", ".ts")):
            filepath = os.path.join(root, file)
            with open(filepath, "r") as f:
                content = f.read()
            
            # Simple replacement: `return res;` right after `const res = await ...`
            # Pattern: const res = await (.*?);\s+return res;
            # Replacement: const res = await \1;\n      return (res as any).data;
            
            new_content = re.sub(
                r'(const\s+res\s*=\s*await\s+[^;]+;)\s+return\s+res;',
                r'\1\n      return (res as any).data;',
                content
            )
            
            if new_content != content:
                with open(filepath, "w") as f:
                    f.write(new_content)
                print(f"Updated: {filepath}")
                count += 1

print(f"Total files updated: {count}")
with open('/Users/macm4/Documents/KKN/kknuinsaizu/apps/web/fix_log.txt', 'w') as f:
    f.write(f"Updated {count} files")
