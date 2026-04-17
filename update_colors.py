import os
import glob

def process_file(path):
    with open(path, 'r') as f:
        content = f.read()

    # We want to darken text colors.
    # #6b7280 -> #4b5563
    # #4b5563 -> #374151
    # text-[#9ca3af] -> text-[#6b7280] (except placeholder which is fine)
    
    # Simple replacement:
    new_content = content.replace('text-[#4b5563]', 'text-[#374151]')
    new_content = new_content.replace('text-[#6b7280]', 'text-[#4b5563]')
    
    # For #9ca3af, we only darken if it's text-
    new_content = new_content.replace('text-[#9ca3af]', 'text-[#6b7280]')
    new_content = new_content.replace('placeholder:text-[#6b7280]', 'placeholder:text-[#9ca3af]')

    if new_content != content:
        with open(path, 'w') as f:
            f.write(new_content)
        print(f"Updated {path}")

for root, _, files in os.walk('resources/js'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))
