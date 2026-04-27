const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // This specifically targets the exact strings inserted by the previous buggy script
    if (content.includes('className="<div className="')) {
        content = content.replaceAll('className="<div className="', 'className="');
        content = content.replaceAll('gap-4">"', 'gap-4"');
        content = content.replaceAll('gap-6">"', 'gap-6"');
        content = content.replaceAll('gap-8">"', 'gap-8"');
        // general regex to fix `">"` at the end of classNames
        content = content.replace(/gap-(\d+)">"/g, 'gap-$1"');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Fixed: " + filePath);
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
