<?php
$output = shell_exec('cd /Users/macm4/Documents/KKN/kknuinsaizu && git status 2>&1; git add . 2>&1; git commit -m "chore: Apply all fixes (CI, Index.ts, Routes)" 2>&1; git push origin main 2>&1');
file_put_contents('/Users/macm4/Documents/KKN/kknuinsaizu/git_log_output.txt', $output);
echo "Log Git telah ditulis.";
