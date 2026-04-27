const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 1. Fix the double-div className bug for grid
    // Pattern: <motion.div variants={itemVariants} className="<div className="([^"]+)">"
    // Note: The previous bug created: className="<div className="...
    // We want to extract the class inside the nested div and put it in the motion.div
    const brokenGridRegex = /<motion\.div variants=\{itemVariants\} className="<div className="([^"]+)">"/g;
    if (brokenGridRegex.test(content)) {
        content = content.replace(brokenGridRegex, '<motion.div variants={itemVariants} className="$1">');
        modified = true;
    }

    // 2. Wrap PageHeader if not already wrapped (handle both /> and </PageHeader>)
    // Avoid double wrapping by checking if preceded by <motion.div variants={itemVariants}>
    const pageHeaderRegex = /(?<!<motion\.div variants=\{itemVariants\}>\s*)(<PageHeader[\s\S]*?(?:\/>|<\/PageHeader>))/g;
    if (pageHeaderRegex.test(content)) {
        content = content.replace(pageHeaderRegex, '<motion.div variants={itemVariants}>\n$1\n</motion.div>');
        modified = true;
    }

    // 3. Fix double imports if any
    const lines = content.split('\n');
    const importLines = lines.filter(line => line.includes("import { motion } from 'framer-motion'") || line.includes("import { motion, AnimatePresence } from 'framer-motion'"));
    if (importLines.length > 1) {
        // Keep the one with AnimatePresence if it exists, otherwise keep the first one
        const hasAnimatePresence = importLines.some(l => l.includes('AnimatePresence'));
        let kept = false;
        const newLines = lines.filter(line => {
            if (line.includes("from 'framer-motion'")) {
                if (!kept) {
                    if (hasAnimatePresence) {
                        if (line.includes('AnimatePresence')) {
                            kept = true;
                            return true;
                        }
                        return false;
                    } else {
                        kept = true;
                        return true;
                    }
                }
                return false;
            }
            return true;
        });
        content = newLines.join('\n');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Fixed & Refined: " + filePath);
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

console.log("Memulai perbaikan dan penyempurnaan animasi...");
walkDir('/Users/macm4/Documents/KKN/kknuinsaizu/resources/js/Pages/Admin');
console.log("Penyempurnaan selesai! ✨");
