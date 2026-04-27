const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Pattern: <motion.div variants={itemVariants} className="<div className="grid ... gap-4">"
    // Using a more flexible regex with non-greedy match
    const brokenRegex = /<motion\.div variants=\{itemVariants\} className="<div className="(.+?)">"/g;
    
    if (brokenRegex.test(content)) {
        content = content.replace(brokenRegex, '<motion.div variants={itemVariants} className="$1">');
        modified = true;
    }

    // Fallback split/join if regex is too strict
    if (content.includes('className="<div className="')) {
        const lines = content.split('\n');
        const fixedLines = lines.map(line => {
            if (line.includes('className="<div className="')) {
                const parts = line.split('className="<div className="');
                if (parts.length === 2) {
                    const classesAndRest = parts[1].split('">"');
                    if (classesAndRest.length >= 2) {
                        const classes = classesAndRest[0];
                        const rest = classesAndRest.slice(1).join('">"');
                        return parts[0] + 'className="' + classes + '">' + rest;
                    }
                }
            }
            return line;
        });
        const newContent = fixedLines.join('\n');
        if (newContent !== content) {
            content = newContent;
            modified = true;
        }
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

console.log("Fixing broken JSX syntax (v2)...");
walkDir('/Users/macm4/Documents/KKN/kknuinsaizu/resources/js/Pages/Admin');
console.log("Syntax fix completed.");
