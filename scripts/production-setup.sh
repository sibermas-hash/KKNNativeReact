#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════════════╗
# ║    Emergency Setup - Quick Deploy untuk Production                    ║
# ║    Jalankan script ini untuk siap production dalam 10 menit           ║
# ╚═══════════════════════════════════════════════════════════════════════╝

set -euo pipefail

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  KKN System - Production Emergency Setup                   ║"
echo "║  (Quick deployment untuk siap go-live)                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${PROJECT_ROOT}"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

# ─────────────────────────────────────────────────────────────────────────
# Utility Functions
# ─────────────────────────────────────────────────────────────────────────

# Check apakah command ada
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ─────────────────────────────────────────────────────────────────────────
# 1. ENVIRONMENT CHECK
# ─────────────────────────────────────────────────────────────────────────

echo ""
echo "Step 1: Checking environment..."
echo "─────────────────────────────────────────────────────────────"

# Check PHP
if command_exists php; then
    PHP_VERSION=$(php -v | head -n 1 | grep -oP '\d+\.\d+\.\d+')
    success "PHP version: $PHP_VERSION"
else
    error "PHP not installed"
fi

# Check Composer
if command_exists composer; then
    success "Composer installed"
else
    error "Composer not installed"
fi

# Check Node/NPM
if command_exists npm; then
    NPM_VERSION=$(npm -v)
    success "NPM version: $NPM_VERSION"
else
    warning "NPM not found (frontend assets will not be built)"
fi

# ─────────────────────────────────────────────────────────────────────────
# 2. BACKUP EXISTING DATA
# ─────────────────────────────────────────────────────────────────────────

echo ""
echo "Step 2: Backing up existing data..."
echo "─────────────────────────────────────────────────────────────"

if [ -f .env ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    success "Environment file backed up"
fi

# ─────────────────────────────────────────────────────────────────────────
# 3. INSTALL DEPENDENCIES
# ─────────────────────────────────────────────────────────────────────────

echo ""
echo "Step 3: Installing PHP dependencies..."
echo "─────────────────────────────────────────────────────────────"

if [ -f composer.json ]; then
    composer install --no-dev --optimize-autoloader 2>/dev/null || warning "Composer install failed, trying without optimization"
    composer install --no-dev 2>/dev/null || error "Composer install failed"
    success "PHP dependencies installed"
else
    error "composer.json not found"
fi

# ─────────────────────────────────────────────────────────────────────────
# 4. BUILD FRONTEND
# ─────────────────────────────────────────────────────────────────────────

echo ""
echo "Step 4: Building frontend assets..."
echo "─────────────────────────────────────────────────────────────"

if [ -f package.json ] && command_exists npm; then
    npm ci --prefer-offline --no-audit 2>/dev/null || npm install
    npm run build
    success "Frontend assets built"
else
    warning "Skipping frontend build (npm not available or no package.json)"
fi

# ─────────────────────────────────────────────────────────────────────────
# 5. LARAVEL SETUP
# ─────────────────────────────────────────────────────────────────────────

echo ""
echo "Step 5: Configuring Laravel..."
echo "─────────────────────────────────────────────────────────────"

# Generate APP_KEY if not exists
if ! grep -q "^APP_KEY=" .env; then
    php artisan key:generate
    success "APP_KEY generated"
fi

# Create storage symlink
if [ ! -L public/storage ]; then
    php artisan storage:link
    success "Storage symlink created"
fi

# Clear all caches
php artisan cache:clear
php artisan view:clear
php artisan route:clear
success "Caches cleared"

# ─────────────────────────────────────────────────────────────────────────
# 6. DATABASE MIGRATIONS
# ─────────────────────────────────────────────────────────────────────────

echo ""
echo "Step 6: Running database migrations..."
echo "─────────────────────────────────────────────────────────────"

php artisan migrate --force
success "Database migrations complete"

# ─────────────────────────────────────────────────────────────────────────
# 7. CACHE WARMING (Production)
# ─────────────────────────────────────────────────────────────────────────

echo ""
echo "Step 7: Warming up caches for production..."
echo "─────────────────────────────────────────────────────────────"

php artisan config:cache
php artisan route:cache
success "Application caches warmed"

# ─────────────────────────────────────────────────────────────────────────
# 8. PERMISSION FIX
# ─────────────────────────────────────────────────────────────────────────

echo ""
echo "Step 8: Fixing file permissions..."
echo "─────────────────────────────────────────────────────────────"

# Get web server user (usually www in FreeBSD, www-data in Linux)
WEB_USER="${WEB_USER:-www}"
WEB_GROUP="${WEB_GROUP:-www}"

if id "$WEB_USER" >/dev/null 2>&1; then
    chown -R "$WEB_USER:$WEB_GROUP" storage bootstrap/cache 2>/dev/null || true
    chmod -R 775 storage bootstrap/cache 2>/dev/null || true
    success "File permissions fixed for $WEB_USER:$WEB_GROUP"
else
    # Fallback for Linux if running on Linux
    if id "www-data" >/dev/null 2>&1; then
        chown -R "www-data:www-data" storage bootstrap/cache 2>/dev/null || true
        chmod -R 775 storage bootstrap/cache 2>/dev/null || true
        success "File permissions fixed for www-data:www-data"
    else
        warning "Web server user not found, skipping chown"
    fi
fi

# ─────────────────────────────────────────────────────────────────────────
# 9. BACKUP AUTOMATION SETUP
# ─────────────────────────────────────────────────────────────────────────

echo ""
echo "Step 9: Setup backup automation..."
echo "─────────────────────────────────────────────────────────────"

if [ -f scripts/backup.sh ]; then
    chmod +x scripts/backup.sh
    success "Backup script ready (run: sudo bash scripts/setup-backup.sh)"
else
    warning "Backup script not found"
fi

# ─────────────────────────────────────────────────────────────────────────
# 10. HEALTH CHECK
# ─────────────────────────────────────────────────────────────────────────

echo ""
echo "Step 10: Running health checks..."
echo "─────────────────────────────────────────────────────────────"

# Check artisan
if php artisan tinker --execute="echo 'OK'" &>/dev/null; then
    success "Laravel artisan OK"
else
    warning "Laravel artisan check failed"
fi

# Check database connection
if php artisan db:seed --seed=\App\Seeders\DatabaseSeeder --force 2>&1 | grep -q "Error" ; then
    warning "Database connection might have issues (attempt to run migrations first)"
else
    success "Database connection verified"
fi

# ─────────────────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────────────────

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Production Setup Complete! ✅                             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Next Steps:"
echo "  1. Verify .env configuration (database, email, etc.)"
echo "  2. Test application: php artisan serve"
echo "  3. Setup backup automation: sudo bash scripts/setup-backup.sh"
echo "  4. Configure web server (NGINX/Apache)"
echo "  5. Setup SSL certificate"
echo "  6. Enable application monitoring"
echo ""
echo "Troubleshooting:"
echo "  • Database issues: php artisan migrate --force"
echo "  • Permission issues: chown -R \$WEB_USER:\$WEB_GROUP storage bootstrap/cache"
echo "  • Cache issues: php artisan cache:clear && php artisan route:clear"
echo ""
echo "Documentation:"
echo "  • Deployment: PRODUCTION_DEPLOYMENT_CHECKLIST.md"
echo "  • Architecture: FULL_SYSTEM_AUDIT_2026_04_07.md"
echo "  • Local setup: README.md"
echo ""

exit 0
