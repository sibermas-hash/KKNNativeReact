const fs = require('fs');
const path = require('path');

const dirPath = '/Users/macm4/Documents/KKN/kknuinsaizu/apps/web/src/app';

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Look for "return res as {" and replace with "return res as unknown as {"
      const newContent = content.replace(/return res as { success/g, 'return res as unknown as { success');
      
      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log('Fixed:', fullPath);
      }
    }
  }
}

processDirectory(dirPath);
console.log('Done fixing type errors.');
