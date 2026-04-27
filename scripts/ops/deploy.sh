#!/usr/bin/env bash

# ╔═══════════════════════════════════════════════════════════════════════╗
# ║    SIBERMAS - FreeBSD Premium Auto-Deploy Script                      ║
# ║    Target: Production Native Environment                              ║
# ╚═══════════════════════════════════════════════════════════════════════╝

set -e

# Configuration
PROJECT_ROOT="/usr/local/www/kkn-system"
WEB_USER="www"
WEB_GROUP="www"
PHP_BIN="/usr/local/bin/php"
COMPOSER_BIN="/usr/local/bin/composer"
NPM_BIN="/usr/local/bin/npm"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting deployment process...${NC}"

# 1. Pull latest changes
echo -e "${YELLOW}📥 Pulling latest code from GitHub...${NC}"
git pull origin main

# 2. Install/Update Dependencies
echo -e "${YELLOW}📦 Updating PHP dependencies...${NC}"
$COMPOSER_BIN install --no-dev --optimize-autoloader --no-interaction

echo -e "${YELLOW}📦 Updating Node dependencies...${NC}"
$NPM_BIN ci

# 3. Build Frontend Assets
echo -e "${YELLOW}🏗️ Building frontend assets (Vite)...${NC}"
$NPM_BIN run build

# 4. Database Migrations
echo -e "${YELLOW}🗄️ Running database migrations...${NC}"
$PHP_BIN artisan migrate --force

# 5. Optimize Laravel
echo -e "${YELLOW}⚡ Optimizing application cache...${NC}"
$PHP_BIN artisan config:cache
$PHP_BIN artisan route:cache
$PHP_BIN artisan view:cache
$PHP_BIN artisan event:cache

# 6. Fix Permissions
echo -e "${YELLOW}🔑 Fixing file permissions for FreeBSD ($WEB_USER)...${NC}"
chown -R $WEB_USER:$WEB_GROUP storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# 7. Restart Queue Worker (If using supervisor/systemrc)
echo -e "${YELLOW}🔄 Restarting queue workers...${NC}"
$PHP_BIN artisan queue:restart

echo -e "${GREEN}✅ Deployment successful! SIBERMAS is now up to date.${NC}"
echo -e "${BLUE}🌐 URL: https://sibermas.uinsaizu.ac.id${NC}"
