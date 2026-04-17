import os
import re

def standardize_file(path):
    with open(path, 'r') as f:
        content = f.read()

    # Font sizes
    content = content.replace('text-[10px]', 'text-xs')
    content = content.replace('text-[11px]', 'text-xs')
    content = content.replace('text-[13px]', 'text-sm')
    content = content.replace('text-[15px]', 'text-base')
    content = content.replace('tracking-[0.05em]', 'tracking-wider')
    content = content.replace('tracking-[0.2em]', 'tracking-widest')
    
    # Colors
    content = content.replace('text-[#111827]', 'text-gray-900')
    content = content.replace('text-[#1a1a1a]', 'text-gray-900')
    content = content.replace('text-[#374151]', 'text-gray-700')
    content = content.replace('text-[#4b5563]', 'text-gray-600')
    content = content.replace('text-[#6b7280]', 'text-gray-500')
    content = content.replace('text-[#9ca3af]', 'text-gray-400')
    
    content = content.replace('bg-[#f9fafb]', 'bg-gray-50')
    content = content.replace('bg-[#f3f4f6]', 'bg-gray-100')
    
    content = content.replace('border-[#e5e7eb]', 'border-gray-200')
    content = content.replace('border-[#d1d5db]', 'border-gray-300')

    with open(path, 'w') as f:
        f.write(content)

for root, _, files in os.walk('resources/js'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            standardize_file(os.path.join(root, file))
print("Standardization complete.")
