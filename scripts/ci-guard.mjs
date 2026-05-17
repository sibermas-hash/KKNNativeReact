import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

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

// ─── Guard 3: Production templates/docs must not contain dev defaults ───────
const productionTemplate = 'apps/api/.env.production.example';
const productionTemplateContents = readFileSync(productionTemplate, 'utf8');
const dbPasswordLine = productionTemplateContents.match(/^DB_PASSWORD=(.*)$/m)?.[1] ?? '';
const insecureTemplatePassword = dbPasswordLine.split('#', 1)[0].trim();

if (insecureTemplatePassword !== '') {
  console.error(`CI guard failed: ${productionTemplate} must not ship a concrete DB_PASSWORD value.`);
  process.exit(1);
}

const publicDocsFiles = [
  'apps/api/public/docs/index.html',
  'apps/api/public/docs/openapi.yaml',
  'apps/api/public/docs/collection.json',
];

const publicDocsLocalhostViolations = [];

for (const file of publicDocsFiles) {
  const contents = readFileSync(file, 'utf8');
  if (/https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?/i.test(contents)) {
    publicDocsLocalhostViolations.push(file);
  }
}

if (publicDocsLocalhostViolations.length > 0) {
  console.error('CI guard failed: public API docs still contain localhost-style base URLs:');
  for (const file of publicDocsLocalhostViolations) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log('✅ CI guard passed: no tracked runtime env/data dumps and no dev-only defaults in production templates/docs.');
