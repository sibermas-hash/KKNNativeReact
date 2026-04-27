#!/bin/sh
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
echo "Running ESLint..." > linter_output.txt
npx eslint "resources/**/*.{ts,tsx}" >> linter_output.txt 2>&1
echo "Running PHP lint..." >> linter_output.txt
find app routes config -name "*.php" -exec php -l {} \; | grep -v "No syntax errors" >> linter_output.txt 2>&1
echo "Finished." >> linter_output.txt
