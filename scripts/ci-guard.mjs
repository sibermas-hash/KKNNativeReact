import { execFileSync } from 'node:child_process';

const trackedFiles = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

// ─── Guard 1: No .env files tracked ────────────────────────────────
const envPatterns = [
  /^apps\/(api|web|mobile)\/\.env(?:\.(?!example$|production\.example$)[^/]+)?$/,
  /^\.env(?:\.(?!example$|production\.example$)[^/]+)?$/,
  /(?:^|\/)dump\.(?:sql|csv)$/i,
];

const envViolations = trackedFiles.filter((file) => envPatterns.some((pattern) => pattern.test(file)));

if (envViolations.length > 0) {
  console.error('CI guard failed: sensitive files are tracked:');
  for (const file of envViolations) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log('✅ CI guard passed: no tracked runtime env files or root data dumps.');

// ─── Guard 2: Check storage operational files not tracked ──────────
const storagePatterns = [
  /^apps\/api\/storage\/pail\//,
  /^apps\/api\/storage\/DOC\sDB\//,
  /^apps\/api\/storage\/DPL\//,
  /^apps\/api\/storage\/surat\//,
];

const storageViolations = trackedFiles.filter((file) => storagePatterns.some((pattern) => pattern.test(file)));

if (storageViolations.length > 0) {
  console.error('⚠️  Warning: operational storage files are tracked:');
  for (const file of storageViolations) {
    console.error(`  - ${file}`);
  }
  console.error('  Add them to .gitignore and run git rm --cached');
}
