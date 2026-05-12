#!/usr/bin/env bash
# deploy.sh — Quick deploy script (push to GitHub)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

git add -A
if git diff --cached --quiet; then
  echo "No changes to commit."
  exit 0
fi
git commit -m "update: $(date '+%Y-%m-%d %H:%M')"
git push origin main
echo "Done" > "$SCRIPT_DIR/deploy_success.txt"
