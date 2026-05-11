import { execFileSync } from 'node:child_process';

const trackedFiles = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

const forbiddenPatterns = [
  /^apps\/(api|web|mobile)\/\.env(?:\.(?!example$|production\.example$)[^/]+)?$/,
  /^\.env(?:\.(?!example$|production\.example$)[^/]+)?$/,
  /(?:^|\/)dump\.(?:sql|csv)$/i,
];

const violations = trackedFiles.filter((file) => forbiddenPatterns.some((pattern) => pattern.test(file)));

if (violations.length > 0) {
  console.error('CI guard failed: sensitive files are tracked:');
  for (const file of violations) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log('CI guard passed: no tracked runtime env files or root data dumps.');
