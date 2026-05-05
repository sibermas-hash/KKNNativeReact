const fs = require('fs');
const path = require('path');

const dirPath = '/Users/macm4/Documents/KKN/kknuinsaizu/apps/web/src/app';
let fixedFiles = [];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      // Match: return res as { success: ... };  (without "unknown as" already present)
      // Replace with: return (res as unknown as { success: ... }).data;
      // But skip lines that already have "as unknown as"
      const regex = /return res as (\{ success[^}]+\});/g;
      let newContent = content;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const fullMatch = match[0];
        // Skip if already has "unknown as"
        if (fullMatch.includes('as unknown as')) continue;
        const typeStr = match[1];
        const replacement = `return (res as unknown as ${typeStr}).data;`;
        newContent = newContent.replace(fullMatch, replacement);
      }
      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        fixedFiles.push(fullPath);
      }
    }
  }
}

processDirectory(dirPath);
fixedFiles.forEach(f => console.log('Fixed: ' + f));
console.log('Total fixed: ' + fixedFiles.length);
