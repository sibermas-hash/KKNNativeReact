import fs from 'fs';
import path from 'path';

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already animated
    if (content.includes('containerVariants')) {
        return;
    }
    
    let modified = false;

    // 1. Add import
    if (!content.includes("import { motion }")) {
        // Try to insert after imports
        content = content.replace(/(import .*?;)/, "$1\nimport { motion } from 'framer-motion';");
        modified = true;
    }

    // 2. Add variants before return (
    const returnRegex = /(return\s*\(\s*<AppLayout[\s\S]*?>)/;
    if (returnRegex.test(content)) {
        const variants = `
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

  `;
        content = content.replace(returnRegex, variants + '$1');
        modified = true;
    }

    // 3. Replace the main container right after <Head ... />
    // This looks for `<Head... />` followed by some spaces/newlines, then a `<div className="...">`
    // We replace it with `<motion.div variants={containerVariants} initial="hidden" animate="show" className="...">`
    const mainDivRegex = /(<Head[^>]*\/>\s*)<div(\s+className="[^"]+")>/;
    if (mainDivRegex.test(content)) {
        content = content.replace(mainDivRegex, '$1<motion.div variants={containerVariants} initial="hidden" animate="show"$2>');
        
        // Replace the last </div> before </AppLayout> with </motion.div>
        const appLayoutEndRegex = /<\/div>(\s*<\/AppLayout>)/;
        content = content.replace(appLayoutEndRegex, '</motion.div>$1');
        modified = true;
    }

    // 4. Wrap inner elements: <PageHeader, <ContentPanel
    const pageHeaderRegex = /(<PageHeader[\s\S]*?<\/PageHeader>)/g;
    content = content.replace(pageHeaderRegex, '<motion.div variants={itemVariants}>\n$1\n</motion.div>');

    const contentPanelRegex = /(<ContentPanel[\s\S]*?<\/ContentPanel>)/g;
    content = content.replace(contentPanelRegex, '<motion.div variants={itemVariants}>\n$1\n</motion.div>');
    
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated:', filePath);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (file === 'Index.tsx') {
            processFile(fullPath);
        }
    }
}

walkDir('/Users/macm4/Documents/KKN/kknuinsaizu/resources/js/Pages/Admin');
