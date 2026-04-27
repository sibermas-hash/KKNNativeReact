import os
import re

log_lines = []

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    if 'containerVariants' in content:
        return

    modified = False

    # 1. Add import
    if 'import { motion }' not in content:
        content = re.sub(r"(import .*?;)", r"\1\nimport { motion } from 'framer-motion';", content, count=1)
        modified = True

    # 2. Add variants
    variants = """
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 20 },
    },
  };

"""
    if re.search(r"(return\s*\(\s*<AppLayout[\s\S]*?>)", content):
        content = re.sub(r"(return\s*\(\s*<AppLayout[\s\S]*?>)", variants + r"\1", content, count=1)
        modified = True

    # 3. Replace main container right after <AppLayout ...>
    match = re.search(r'(<AppLayout[^>]*>[\s\S]*?)(<div\s+className="[^"]+">)([\s\S]*)', content)
    if match:
        pre = match.group(1)
        div = match.group(2)
        rest = match.group(3)
        div = div.replace('<div', '<motion.div variants={containerVariants} initial="hidden" animate="show"')
        
        # Now find the last </div> in `rest` before `</AppLayout>`
        rest_split = rest.rsplit('</div>', 1)
        if len(rest_split) == 2:
            rest = rest_split[0] + '</motion.div>' + rest_split[1]
            content = pre + div + rest
            modified = True

    # 4. Wrap inner elements: <PageHeader, <ContentPanel
    if modified:
        content = re.sub(r"(<PageHeader[\s\S]*?<\/PageHeader>)", r"<motion.div variants={itemVariants}>\n\1\n</motion.div>", content)
        content = re.sub(r"(<ContentPanel[\s\S]*?<\/ContentPanel>)", r"<motion.div variants={itemVariants}>\n\1\n</motion.div>", content)
        # for stats grids: <div className="grid... gap-4"> ... </div>
        # this one we can just manually replace `<div className="grid...` with `<motion.div variants={itemVariants}...`
        content = re.sub(r'(<div\s+className="grid[^"]*gap-4[^"]*">)', r'<motion.div variants={itemVariants} className="\g<1>">'.replace('className="<div className="', 'className="'), content)
        content = re.sub(r'(<motion\.div variants=\{itemVariants\} className="grid[^"]*gap-4[^"]*">[\s\S]*?)(</div>)', r'\1</motion.div>', content)

        with open(filepath, 'w') as f:
            f.write(content)
        log_lines.append(f"Updated: {filepath}")

for root, dirs, files in os.walk('/Users/macm4/Documents/KKN/kknuinsaizu/resources/js/Pages/Admin'):
    for file in files:
        if file == 'Index.tsx':
            process_file(os.path.join(root, file))

with open('/Users/macm4/Documents/KKN/kknuinsaizu/add_animations.log', 'w') as f:
    f.write('\n'.join(log_lines))
