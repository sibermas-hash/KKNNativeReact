#!/bin/bash

# Dependency Update Script
# This script updates dependencies safely in minor/patch versions only

echo "🔄 Updating Composer Dependencies (safe updates only)..."
composer update --no-interaction --prefer-dist maatwebsite/excel

echo ""
echo "🔄 Updating NPM Dependencies (safe minor/patch updates)..."
npm update

echo ""
echo "✅ Dependency updates complete!"
echo ""
echo "⚠️  Note: Major version upgrades require manual testing:"
echo "   - @inertiajs/react: 2.x → 3.x (breaking changes)"
echo "   - vite: 7.x → 8.x (potential breaking changes)"
echo "   - laravel-vite-plugin: 2.x → 3.x"
echo "   - typescript: 5.x → 6.x"
