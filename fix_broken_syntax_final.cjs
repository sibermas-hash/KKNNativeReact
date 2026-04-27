const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Pattern: <motion.div variants={itemVariants} className="<div className="ANYTHING">"
    // We want: <motion.div variants={itemVariants} className="ANYTHING">
    
    // Using a regex that handles the nested quotes correctly
    // It looks for the literal <div className=" inside the className value
    const brokenRegex = /<motion\.div variants=\{itemVariants\} className="<div className="([^"]+)">"/g;
    
    if (brokenRegex.test(content)) {
        content = content.replace(brokenRegex, '<motion.div variants={itemVariants} className="$1">');
        modified = true;
    }

    // Secondary pass for any variations
    if (content.includes('className="<div className="')) {
        // Find occurrences of <motion.div ... className="<div className="CLASSES">"
        // and fix them manually if regex missed any due to spacing
        const lines = content.split('\n');
        const fixedLines = lines.map(line => {
            if (line.includes('className="<div className="')) {
                // Example: <motion.div variants={itemVariants} className="<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">"
                const startIdx = line.indexOf('className="<div className="');
                const classesStart = startIdx + 'className="<div className="'.length;
                const endOfClasses = line.indexOf('">"', classesStart);
                if (endOfClasses !== -1) {
                    const classes = line.substring(classesStart, endOfClasses);
                    const prefix = line.substring(0, startIdx);
                    return prefix + `className="${classes}">`;
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

console.log("Fixing broken JSX syntax...");
walkDir('/Users/macm4/Documents/KKN/kknuinsaizu/resources/js/Pages/Admin');
console.log("Syntax fix completed.");
