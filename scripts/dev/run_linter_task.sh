#!/bin/bash
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd /Users/macm4/Documents/KKN/kknuinsaizu

echo "Menjalankan auto-formatting (Prettier)..." > linter_report.txt
npm run format >> linter_report.txt 2>&1

echo "\n\nMenjalankan ESLint..." >> linter_report.txt
npm run lint >> linter_report.txt 2>&1

echo "\nSelesai." >> linter_report.txt
