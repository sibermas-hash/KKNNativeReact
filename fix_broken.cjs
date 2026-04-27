const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Fix the broken className string: className="<div className="grid..." -> className="grid..."
    // Specifically looking for: className="<div className="something">"
    const brokenRegex = /className="<div className="([^"]+)">"/g;
    
    let modified = false;
    if (brokenRegex.test(content)) {
        content = content.replace(brokenRegex, 'className="$1"');
        modified = true;
    }

    // Also some files might not have been wrapped for PageHeader properly if my previous script had issues?
    // Let's just fix the broken className first.
    
    // Also wait, I might have double `variants={itemVariants}` or something.
    // Let's check `className="<div className="` 
    // The previous string replacement was: '<motion.div variants={itemVariants} className="$1"'
    // Where $1 was `<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">`
    // So the result was `<motion.div variants={itemVariants} className="<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">"`
    // Let's match exact pattern:
    const exactBrokenRegex = /className="<div className="([^"]+)">"/g;
    if (exactBrokenRegex.test(content)) {
        content = content.replace(exactBrokenRegex, 'className="$1"');
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
