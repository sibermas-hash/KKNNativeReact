import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function walk(dir) {
    let results = [];
    const list = readdirSync(dir);
    list.forEach((file) => {
        const filePath = join(dir, file);
        const stat = statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else {
            if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js')) {
                results.push(filePath);
            }
        }
    });
    return results;
}

const files = walk('/Users/macm4/Documents/KKN/kknuinsaizu/resources/js');
let changedCount = 0;

files.forEach(file => {
    let content = readFileSync(file, 'utf8');
    if (content.includes('@/Components/ui')) {
        const newContent = content.replace(/@\/Components\/ui/g, '@/Components/UI');
        writeFileSync(file, newContent, 'utf8');
        changedCount++;
    }
});

console.log(`Success! Replaced incorrect import paths in ${changedCount} files.`);
