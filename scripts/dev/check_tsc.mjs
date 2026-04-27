import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

try {
  console.log('Running tsc...');
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  writeFileSync('/Users/macm4/Documents/KKN/kknuinsaizu/tsc_errors.txt', 'OK: No errors found.');
} catch (error) {
  writeFileSync('/Users/macm4/Documents/KKN/kknuinsaizu/tsc_errors.txt', error.stdout ? error.stdout.toString() : error.message);
}
