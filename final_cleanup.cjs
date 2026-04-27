const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    if (content.includes('className="<div className="')) {
        content = content.split('className="<div className="').join('className="');
        // Fix the closing quotes and the missing '>' for motion.div
        content = content.split('gap-4">"').join('gap-4">');
        content = content.split('gap-6">"').join('gap-6">');
        content = content.split('gap-8">"').join('gap-8">');
        modified = true;
    }

    // Also wrap PageHeader and ContentPanel if not already wrapped
    // Using a simpler approach without complex lookbehinds
    const componentsToWrap = ['PageHeader', 'ContentPanel'];
    componentsToWrap.forEach(comp => {
        const regex = new RegExp('<' + comp + '[\\s\\S]*?(?:/>|</' + comp + '>)', 'g');
        content = content.replace(regex, (match) => {
            const index = content.indexOf(match);
            const prev = content.substring(Math.max(0, index - 50), index);
            if (prev.includes('variants={itemVariants}')) return match;
            modified = true;
            return `<motion.div variants={itemVariants}>\n${match}\n</motion.div>`;
        });
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("✔ Updated: " + filePath);
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
