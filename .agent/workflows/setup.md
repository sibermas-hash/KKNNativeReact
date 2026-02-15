---
description: How to set up the project on a new PC for development
---

## Prerequisites

1. Install PHP 8.2+, Composer, Node.js 18+, npm
2. Install Git
3. Install Cloudflared (for SSH tunnel to server)

## Clone & Setup

1. Clone the repository:
```bash
git clone https://github.com/putrihati-cmd/kknuinsaizu.git
cd kknuinsaizu
```

2. Install PHP dependencies:
```bash
composer install
```

3. Install JS dependencies:
```bash
npm install
```

4. Copy environment file:
```bash
cp .env.example .env
php artisan key:generate
```

5. Configure `.env` — set database connection for `kkn`:
```
DB_CONNECTION_KKN=mysql
DB_HOST_KKN=your-db-host
DB_PORT_KKN=3306
DB_DATABASE_KKN=kkn
DB_USERNAME_KKN=your-username
DB_PASSWORD_KKN=your-password
```

6. Run migrations:
```bash
php artisan migrate
```

7. Start development servers:
```bash
# Terminal 1 - PHP server
php artisan serve

# Terminal 2 - Vite dev server
npm run dev
```

## Important Project Context

Read `.agent/context.md` for complete project context including:
- All 27 database models and their relationships
- All 30 admin pages and their locations
- All 20 admin controllers
- UI component API notes (Modal uses `open` not `show`, FormSelect uses `options` array)
- Known issues and TODOs
- Deployment instructions

## Key Commands

```bash
# Deploy to server
# Use /deploy workflow

# Run specific seeder
php artisan db:seed --class=MigrateDplPeriodDataSeeder

# Build for production
npm run build

# Type check
npx tsc --noEmit
```
