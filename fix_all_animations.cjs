const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 1. Fix the specific broken className bug
    // <motion.div variants={itemVariants} className="<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">"
    // Note: It's missing the closing >
    const brokenRegex = /<motion\.div variants=\{itemVariants\} className="<div className="([^"]+)">"/g;
    if (brokenRegex.test(content)) {
        content = content.replace(brokenRegex, '<motion.div variants={itemVariants} className="$1">');
        modified = true;
    }

    // 2. Wrap PageHeader
    // Match <PageHeader ... /> or <PageHeader ...> </PageHeader>
    // but only if it's not already inside a motion.div
    const pageHeaderRegex = /(?<!<motion\.div variants=\{itemVariants\}>\s*)<PageHeader([\s\S]*?)(?:\/>|<\/PageHeader>)/g;
    if (pageHeaderRegex.test(content)) {
        content = content.replace(pageHeaderRegex, (match) => {
            // Final safety check: does the immediate context have itemVariants?
            const index = content.indexOf(match);
            const context = content.substring(Math.max(0, index - 100), index);
            if (context.includes('variants={itemVariants}')) return match;
            modified = true;
            return `<motion.div variants={itemVariants}>\n${match}\n</motion.div>`;
        });
    }

    // 3. Wrap ContentPanel
    const contentPanelRegex = /(?<!<motion\.div variants=\{itemVariants\}>\s*)<ContentPanel([\s\S]*?)<\/ContentPanel>/g;
    if (contentPanelRegex.test(content)) {
        content = content.replace(contentPanelRegex, (match) => {
            const index = content.indexOf(match);
            const context = content.substring(Math.max(0, index - 100), index);
            if (context.includes('variants={itemVariants}')) return match;
            modified = true;
            return `<motion.div variants={itemVariants}>\n${match}\n</motion.div>`;
        });
    }

    // 4. Wrap stats grid (div className="grid ... gap-4")
    // but ONLY if it's not already a motion.div
    const gridRegex = /(?<!<motion\.div variants=\{itemVariants\}\s*)<div className="grid[^"]*gap-4[^"]*">([\s\S]*?)<\/div>/g;
    if (gridRegex.test(content)) {
        content = content.replace(gridRegex, (match, inner) => {
            const index = content.indexOf(match);
            const context = content.substring(Math.max(0, index - 100), index);
            if (context.includes('variants={itemVariants}')) return match;
            modified = true;
            return `<motion.div variants={itemVariants}>\n${match}\n</motion.div>`;
        });
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("✔ Processed: " + filePath);
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

console.log("Finalisasi animasi massal...");
walkDir('/Users/macm4/Documents/KKN/kknuinsaizu/resources/js/Pages/Admin');
console.log("Selesai! ✨");
