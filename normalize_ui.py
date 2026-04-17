import os
import re

def standardize_file(path):
    with open(path, 'r') as f:
        content = f.read()

    replacements = {
        # Font Sizes
        'text-[10px]': 'text-xs',
        'text-[11px]': 'text-xs',
        'text-[12px]': 'text-xs',
        'text-[13px]': 'text-sm',
        'text-[14px]': 'text-sm',
        'text-[15px]': 'text-base',
        
        # Emerald Texts -> Gray Texts
        'text-emerald-950': 'text-gray-900',
        'text-emerald-900': 'text-gray-900',
        'text-emerald-800': 'text-gray-800',
        'text-emerald-700': 'text-gray-700',
        'text-emerald-600/70': 'text-gray-500',
        
        # Slate Texts -> Gray Texts
        'text-slate-900': 'text-gray-900',
        'text-slate-800': 'text-gray-800',
        'text-slate-700': 'text-gray-700',
        'text-slate-600': 'text-gray-600',
        'text-slate-500': 'text-gray-500',
        'text-slate-400': 'text-gray-400',
        
        # Backgrounds
        'bg-slate-50': 'bg-gray-50',
        'bg-slate-100': 'bg-gray-100',
        'bg-emerald-50/50': 'bg-gray-50',
        'bg-[#f3f4f6]': 'bg-gray-100',
        'bg-[#f9fafb]': 'bg-gray-50',
        
        # Borders
        'border-emerald-100': 'border-gray-200',
        'border-emerald-50': 'border-gray-100',
        'border-slate-200': 'border-gray-200',
        'border-slate-100': 'border-gray-100',
        'border-[#e5e7eb]': 'border-gray-200',
        'border-[#d1d5db]': 'border-gray-300',
        
        # Letter Spacing
        'tracking-[0.05em]': 'tracking-wider',
        'tracking-[0.2em]': 'tracking-widest',
        'tracking-[0.1em]': 'tracking-wider',
        
        # Colors (Hex -> Tailwind standard gray)
        'text-[#111827]': 'text-gray-900',
        'text-[#1a1a1a]': 'text-gray-900',
        'text-[#374151]': 'text-gray-700',
        'text-[#4b5563]': 'text-gray-600',
        'text-[#6b7280]': 'text-gray-500',
        'text-[#9ca3af]': 'text-gray-400',
        
        # Placeholders
        'placeholder:text-[#9ca3af]': 'placeholder:text-gray-400',
        'placeholder:text-emerald-300': 'placeholder:text-gray-400',
        'placeholder:text-slate-400': 'placeholder:text-gray-400',
        'placeholder:text-emerald-400/50': 'placeholder:text-gray-400',
        
        # Shadows
        'shadow-sm-soft': 'shadow-sm',
        'shadow-soft': 'shadow-md',
        
        # Mixed up primary color issues
        'text-emerald-500': 'text-[#1a7a4a]', # standardize brand color
    }
    
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(path, 'w') as f:
            f.write(new_content)
        print(f"Standardized {path}")

# Run across all JS/TS files
for root, _, files in os.walk('resources/js'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts') or file.endswith('.jsx') or file.endswith('.js'):
            standardize_file(os.path.join(root, file))

print("Design system normalization complete.")
