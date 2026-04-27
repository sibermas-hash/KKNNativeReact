const { execSync } = require('child_process');
const fs = require('fs');
try {
  const status = execSync('git status', { encoding: 'utf8' });
  const log = execSync('git log -n 1', { encoding: 'utf8' });
  fs.writeFileSync('git_status.txt', status + '\n\n' + log);
} catch (e) {
  fs.writeFileSync('git_status.txt', (e.stdout || '') + '\n' + (e.stderr || ''));
}
