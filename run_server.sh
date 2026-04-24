#!/bin/bash
expect -c '
set timeout 30
spawn ssh -o StrictHostKeyChecking=no -p 1977 kampelmas@172.16.2.70 "cd /usr/local/www/apache24/data/sibermas2026 && pwd && git status"
expect "*?assword:*"
send "KampelM45/.26:\r"
expect eof
' > ssh_output.txt 2>&1
