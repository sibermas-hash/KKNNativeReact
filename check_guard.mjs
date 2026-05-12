import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';

try {
  const output = execFileSync('node', ['scripts/ci-guard.mjs'], { encoding: 'utf8' });
  fs.writeFileSync('guard_out.txt', output || 'Passed without output');
} catch (e) {
  fs.writeFileSync('guard_out.txt', 'Error: ' + e.stderr + '\n' + e.stdout + '\n' + e.message);
}
