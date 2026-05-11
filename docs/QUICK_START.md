# Quick Start Guide - SIBERMAS KKN

**Last Updated:** 2026-05-11
**Estimated Time:** 30 minutes

---

## Prerequisites

Before you begin, ensure you have:

- [ ] PHP 8.4+ installed
- [ ] Composer 2.x installed
- [ ] Node.js 20+ installed
- [ ] pnpm 8.x installed
- [ ] PostgreSQL 16+ installed
- [ ] Redis 7+ installed
- [ ] Git installed

---

## Step 1: Clone Repository

```bash
git clone https://github.com/your-org/sibermas.git
cd sibermas
```

---

## Step 2: Install Backend Dependencies

```bash
cd apps/api

# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

### Configure Database

Edit `.env` with your database credentials:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=sibermas_kkn
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### Run Migrations

```bash
php artisan migrate
```

### Seed Database (Optional - for development)

```bash
php artisan db:seed --class=LocalDevSeeder
```

---

## Step 3: Install Frontend Dependencies

```bash
cd ../web  # or cd apps/web

# Install Node dependencies
pnpm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local with:
# NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
# NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 4: Start Development Servers

### Terminal 1: Backend API

```bash
cd apps/api
php artisan serve
# Runs on http://localhost:8000
```

### Terminal 2: Frontend Web

```bash
cd apps/web
pnpm dev
# Runs on http://localhost:3000
```

---

## Step 5: Verify Installation

### API Health Check

```bash
curl http://localhost:8000/api/health
# Should return: {"status":"ok"}
```

### Web App

Open browser: http://localhost:3000

### Test Login

Default credentials (after seeding):
- Username: `admin`
- Password: `password`

---

## Common Issues & Solutions

### "php command not found"

Install PHP 8.4:
```bash
# macOS with Homebrew
brew install php@8.4

# Ubuntu/Debian
sudo apt install php8.4 php8.4-cli php8.4-pgsql php8.4-redis
```

### "PostgreSQL connection refused"

1. Start PostgreSQL:
```bash
# macOS
brew services start postgresql@16

# Ubuntu
sudo systemctl start postgresql
```

2. Create database:
```bash
createdb sibermas_kkn
```

### "Redis connection refused"

1. Start Redis:
```bash
# macOS
brew services start redis

# Ubuntu
sudo systemctl start redis
```

### "npm install failed"

Clear cache and retry:
```bash
pnpm store prune
rm -rf node_modules
pnpm install
```

---

## Development Commands

### Backend (API)

```bash
cd apps/api

php artisan serve                    # Start server
php artisan migrate                  # Run migrations
php artisan migrate:fresh           # Reset database
php artisan db:seed                # Seed data
php artisan test                    # Run tests
php artisan test --filter=AuthTest  # Run specific tests
./vendor/bin/pint                   # Format code
./vendor/bin/pint --test           # Check formatting
```

### Frontend (Web)

```bash
cd apps/web

pnpm dev                    # Start dev server
pnpm build                  # Production build
pnpm test                   # Run tests
pnpm test:cov               # Run tests with coverage
pnpm lint                   # Lint code
pnpm type-check             # TypeScript check
```

### All Apps

```bash
# From root directory
pnpm --filter api test           # Run API tests
pnpm --filter web test          # Run Web tests
pnpm --filter web build         # Build Web
pnpm build                      # Build all
```

---

## Project Structure Quick Reference

```
apps/
├── api/              # Laravel backend
│   ├── app/
│   │   ├── Http/Controllers/Api/V1/
│   │   │   ├── Admin/      # 56 admin controllers
│   │   │   ├── Auth/        # Auth controller
│   │   │   ├── Student/     # 16 student controllers
│   │   │   └── Dpl/         # 9 DPL controllers
│   │   ├── Models/KKN/      # 60+ models
│   │   └── Services/KKN/    # 18 KKN services
│   └── routes/api.php       # API routes
│
├── web/              # Next.js frontend
│   └── src/
│       ├── app/(admin)/     # Admin pages (38+)
│       ├── app/(auth)/       # Auth pages
│       └── app/(student)/    # Student pages (14+)
│
└── mobile/           # Expo mobile app
```

---

## Next Steps

1. Read [API.md](./API.md) - API documentation
2. Read [SECURITY.md](./SECURITY.md) - Security guidelines
3. Read [BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md) - KKN workflow
4. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues

---

## Need Help?

- [Documentation](./README.md) - Full docs
- [GitHub Issues](https://github.com/your-org/sibermas/issues)
- Email: support@sibermas.uinsaizu.ac.id