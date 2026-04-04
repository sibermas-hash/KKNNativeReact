#!/usr/bin/env node
/**
 * Fix truncated className strings in TSX files.
 * Common pattern: className="... text-slate-200\n<NextElement  (missing ">)
 * Also: className={clsx('...\n  (missing closing ', ...)}> )
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get list of files with esbuild syntax errors
const result = execSync(
  `cd ${path.resolve(__dirname, '..')} && npx vite build 2>&1 || true`,
  { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 }
);

// Extract file from error
const match = result.match(/file: (.+\.tsx):(\d+):(\d+)/);
if (match) {
  console.log(`Current blocker: ${match[1]}:${match[2]}`);
}

// Instead of trying to auto-fix (too risky), let's identify ALL files with
// unterminated strings in className by looking for the pattern
const baseDir = path.resolve(__dirname, '..', 'resources', 'js');

function findBrokenFiles(dir) {
  const broken = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      broken.push(...findBrokenFiles(full));
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      const issues = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Pattern 1: className="... without closing " before end of line, 
        // followed by a line starting with < (JSX element)
        if (line.includes('className="') && !line.includes('className=""')) {
          const afterClassName = line.substring(line.lastIndexOf('className="'));
          const quoteCount = (afterClassName.match(/"/g) || []).length;
          // Odd number of quotes means unterminated
          if (quoteCount % 2 !== 0) {
            // Check if next line starts with < or similar
            if (i + 1 < lines.length) {
              const nextLine = lines[i + 1].trim();
              if (nextLine.startsWith('<') || nextLine.startsWith('{')) {
                issues.push({ line: i + 1, type: 'unterminated-className', content: line.trim().substring(0, 80) });
              }
            }
          }
        }
        // Pattern 2: className={clsx(' without proper closing
        if (line.includes("className={clsx('") || line.includes('className={clsx("')) {
          const afterClsx = line.substring(line.indexOf('clsx('));
          // Check bracket balance
          let parens = 0;
          let inString = false;
          let stringChar = '';
          for (const ch of afterClsx) {
            if (!inString && (ch === "'" || ch === '"')) {
              inString = true;
              stringChar = ch;
            } else if (inString && ch === stringChar) {
              inString = false;
            } else if (!inString && ch === '(') parens++;
            else if (!inString && ch === ')') parens--;
          }
          if (parens > 0 || inString) {
            issues.push({ line: i + 1, type: 'unterminated-clsx', content: line.trim().substring(0, 80) });
          }
        }
      }
      if (issues.length > 0) {
        broken.push({ file: full.replace(baseDir + '/', ''), issues });
      }
    }
  }
  return broken;
}

const broken = findBrokenFiles(baseDir);
console.log(`\nFound ${broken.length} files with potential className issues:\n`);
broken.forEach(({ file, issues }) => {
  console.log(`  ${file}`);
  issues.forEach(i => console.log(`    L${i.line}: [${i.type}] ${i.content}`));
});
