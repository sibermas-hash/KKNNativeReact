import os
import re

src_dir = "/Users/macm4/Documents/KKN/kknuinsaizu/apps/web/src"

# We want to find pattern:
# queryFn: async () => { const res = await endpoints...(...); return res; }
# and replace `return res;` with `return (res as any).data;` OR just `return res.data;`
# Actually, the best is to cast it properly if we can, but `return (res as any).data;` is safest to avoid TS errors.
# Let's replace `return res; }` with `return (res as any).data; }` where it is inside a queryFn.

count = 0

for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith((".tsx", ".ts")):
            filepath = os.path.join(root, file)
            with open(filepath, "r") as f:
                content = f.read()
            
            # Find any queryFn that assigns to res and returns res.
            # Example: queryFn: async () => { const res = await endpoints.dashboard(); return res; },
            new_content = re.sub(
                r'(queryFn:\s*async\s*\([^)]*\)\s*=>\s*\{[^}]*const res = await[^;]+;\s*)return res;(\s*\})',
                r'\1return (res as any).data;\2',
                content
            )
            
            # Also catch the ones using api.get directly:
            # queryFn: async () => { const res = await api.get('...'); return res; }
            new_content = re.sub(
                r'(queryFn:\s*async\s*\([^)]*\)\s*=>\s*\{[^}]*const res = await api\.get[^;]+;\s*)return res;(\s*\})',
                r'\1return (res as any).data;\2',
                new_content
            )
            
            if new_content != content:
                with open(filepath, "w") as f:
                    f.write(new_content)
                print(f"Updated: {filepath}")
                count += 1

print(f"Total files updated: {count}")
