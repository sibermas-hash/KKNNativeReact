const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let lines = content.split('\n');
    let modified = false;

    // Find all lines that import from framer-motion
    const motionImports = lines.filter(l => l.includes("from 'framer-motion'"));
    
    if (motionImports.length > 1) {
        // Keep only the most comprehensive one (the one with AnimatePresence if it exists)
        const hasAnimatePresence = motionImports.find(l => l.includes('AnimatePresence'));
        const toKeep = hasAnimatePresence || motionImports[0];
        
        let alreadyKept = false;
        const newLines = lines.filter(line => {
            if (line.includes("from 'framer-motion'")) {
                if (line === toKeep && !alreadyKept) {
                    alreadyKept = true;
                    return true;
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
        console.log("Cleaned imports: " + filePath);
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
