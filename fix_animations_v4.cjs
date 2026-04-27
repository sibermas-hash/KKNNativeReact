const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 1. Fix the broken motion.div tag for grid
    // The previous buggy script created: <motion.div variants={itemVariants} className="<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">"
    // Note: It's missing the closing '>' for the motion.div tag too.
    
    // Pattern to look for:
    const searchStr = '<motion.div variants={itemVariants} className="<div className="';
    if (content.includes(searchStr)) {
        // We find each occurrence
        let index = content.indexOf(searchStr);
        while (index !== -1) {
            // Find the end of the broken className string: ">"
            const endStr = '">"';
            const endIndex = content.indexOf(endStr, index);
            if (endIndex !== -1) {
                // Extract the classes
                // The structure is: <motion.div ... className="<div className="CLASSES">"
                const startOfClasses = index + searchStr.length;
                const endOfClasses = endIndex;
                const classes = content.substring(startOfClasses, endOfClasses);
                
                const originalTag = content.substring(index, endIndex + endStr.length);
                const fixedTag = `<motion.div variants={itemVariants} className="${classes}">`;
                
                content = content.replace(originalTag, fixedTag);
                modified = true;
                // Search again from the new position
                index = content.indexOf(searchStr, index + fixedTag.length);
            } else {
                // Try to find the other version if ">" is different
                const endStr2 = '">"'; // sometimes it might be just ">
                // Actually, let's just use a more flexible regex now that I know what happened
                const flexibleRegex = /<motion\.div variants=\{itemVariants\} className="<div className="([^"]+)">"/g;
                if (flexibleRegex.test(content)) {
                    content = content.replace(flexibleRegex, '<motion.div variants={itemVariants} className="$1">');
                    modified = true;
                }
                break;
            }
        }
    }

    // 2. Wrap PageHeader if not already wrapped
    // We look for PageHeader that isn't preceded by motion.div
    // PageHeader can be self-closing or not.
    const pageHeaderPatterns = [
        /<PageHeader([\s\S]*?)\/>/g,
        /<PageHeader([\s\S]*?)<\/PageHeader>/g
    ];

    pageHeaderPatterns.forEach(pattern => {
        content = content.replace(pattern, (match) => {
            // Check if already wrapped in motion.div variants={itemVariants}
            // This is a bit tricky with regex, so we'll check the context in the file
            const matchIndex = content.indexOf(match);
            const prefix = content.substring(Math.max(0, matchIndex - 50), matchIndex);
            if (prefix.includes('variants={itemVariants}')) {
                return match; // already wrapped
            }
            modified = true;
            return `<motion.div variants={itemVariants}>\n${match}\n</motion.div>`;
        });
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("✔ Fixed: " + filePath);
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
