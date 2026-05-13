import { execFileSync } from 'node:child_process';

const trackedFiles = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

const commitCandidateFiles = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard'],
  { encoding: 'utf8' },
)
  .split('\n')
  .filter(Boolean);

// ─── Guard 1: No .env files tracked ────────────────────────────────
const envPatterns = [
  /^apps\/(api|web|mobile)\/\.env(?:\.(?!example$|production\.example$)[^/]+)?$/,
  /^\.env(?:\.(?!example$|production\.example$)[^/]+)?$/,
  /(?:^|\/)dump\.(?:sql|csv)$/i,
];

const localHelperPatterns = [
  /^apps\/api\/(?:run_ssh\.sh|ssh_login\.exp|start_tunnel\.sh|ai_ssh_output\.txt)$/,
];

const envViolations = commitCandidateFiles.filter((file) => envPatterns.some((pattern) => pattern.test(file)));
const localHelperViolations = commitCandidateFiles.filter((file) => localHelperPatterns.some((pattern) => pattern.test(file)));

if (envViolations.length > 0 || localHelperViolations.length > 0) {
  console.error('CI guard failed: sensitive/local-only files would be committed:');
  for (const file of [...envViolations, ...localHelperViolations]) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log('✅ CI guard passed: no runtime env, data dump, or local SSH helper files would be committed.');

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
