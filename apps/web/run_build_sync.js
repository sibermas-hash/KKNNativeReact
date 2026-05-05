const { execSync } = require('child_process');
const fs = require('fs');

try {
    const stdout = execSync('pnpm build', { cwd: '/Users/macm4/Documents/KKN/kknuinsaizu/apps/web', encoding: 'utf-8', stdio: 'pipe' });
    fs.writeFileSync('/Users/macm4/Documents/KKN/kknuinsaizu/apps/web/build_result.txt', `STDOUT:\n${stdout}`);
} catch (error) {
    fs.writeFileSync('/Users/macm4/Documents/KKN/kknuinsaizu/apps/web/build_result.txt', `ERROR:\n${error.message}\nSTDOUT:\n${error.stdout}\nSTDERR:\n${error.stderr}`);
}
