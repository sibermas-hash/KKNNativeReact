const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
let count = 0;

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');

      // Simple regex to match "const res = await endpoints.something(); return res;"
      // We look for "queryFn" followed by "return res;" inside it, and safely replace it.
      const newContent = content.replace(
        /(const\s+res\s*=\s*await\s+[^;]+;\s*)return\s+res;/g,
        '$1return (res as any).data;'
      );

      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated: ${fullPath}`);
        count++;
      }
    }
  }
}

processDirectory(srcDir);
console.log(`Total files updated: ${count}`);
