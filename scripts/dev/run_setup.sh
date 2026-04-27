#!/bin/sh
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
echo "Starting install..." > run_log.txt
composer install >> run_log.txt 2>&1
npm install >> run_log.txt 2>&1
npx tsc --noEmit >> run_log.txt 2>&1
echo "Finished." >> run_log.txt
