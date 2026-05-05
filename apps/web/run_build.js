const { exec } = require('child_process');
const fs = require('fs');

exec('pnpm build', { cwd: '/Users/macm4/Documents/KKN/kknuinsaizu/apps/web' }, (error, stdout, stderr) => {
    let output = '';
    if (error) {
        output += `ERROR:\n${error.message}\n`;
    }
    if (stderr) {
        output += `STDERR:\n${stderr}\n`;
    }
    output += `STDOUT:\n${stdout}\n`;
    
    fs.writeFileSync('/Users/macm4/Documents/KKN/kknuinsaizu/apps/web/build_result.txt', output);
});
