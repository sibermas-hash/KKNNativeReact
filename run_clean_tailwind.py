import os
import re

directory = "/Users/macm4/Documents/Projek/KKN/kknuinsaizu/resources/js/Pages/Admin"

def apply_fixes(content):
    # Font sizes
    content = re.sub(r'text-\[([89]|10|11)px\]', 'text-xs', content)
    content = re.sub(r'text-\[(12|13|14)px\]', 'text-sm', content)
    
    # Font weights
    content = content.replace('font-black', 'font-semibold')
    
    # Tracking
    content = re.sub(r'tracking-\[[0-9\.]+em\]', '', content)
    content = content.replace('tracking-widest', '')
    content = content.replace('tracking-tight', '')
    content = content.replace('tracking-tighter', '')
    content = content.replace('tracking-wider', '')
    
    # Emerald Texts
    content = content.replace('text-emerald-950', 'text-gray-900')
    content = content.replace('text-emerald-900', 'text-gray-800')
    content = content.replace('text-emerald-800', 'text-gray-700')
    content = content.replace('text-emerald-700', 'text-gray-600')
    content = content.replace('text-emerald-400', 'text-gray-500')
    
    # Emerald Backgrounds
    content = re.sub(r'bg-emerald-50/[0-9]+', 'bg-gray-50', content)
    content = content.replace('bg-emerald-50', 'bg-gray-50')
    content = content.replace('bg-emerald-950', 'bg-white')
    content = content.replace('bg-emerald-900', 'bg-gray-100')
    
    # Borders
    content = content.replace('border-emerald-50', 'border-gray-200')
    content = content.replace('border-emerald-100', 'border-gray-200')
    content = content.replace('border-emerald-200', 'border-gray-300')
    content = re.sub(r'\bborder-2\b', 'border', content)
    
    # Shadows
    content = content.replace('shadow-2xl', 'shadow-sm')
    content = content.replace('shadow-xl', 'shadow-sm')
    content = content.replace('shadow-lg', 'shadow-sm')
    
    # Border Radii
    content = re.sub(r'rounded-\[[0-9\.]+rem\]', 'rounded-xl', content)
    
    # Uppercase
    content = re.sub(r'\buppercase\b', '', content)
    
    # Clean up multiple spaces that might have been created inside strings
    content = re.sub(r' +', ' ', content)
    content = content.replace('" ', '"').replace(' "', '"')
    
    return content

count = 0
for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                original = f.read()
            
            modified = apply_fixes(original)
            
            if original != modified:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(modified)
                count += 1
                print(f"Modified: {path}")

print(f"Total files modified: {count}")
