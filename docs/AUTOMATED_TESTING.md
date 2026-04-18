# Dokumentasi Automated Testing - KKN UIN SAIZU

**Tanggal:** 18 April 2026  
**Project:** KKN UIN SAIZU Portal  
**Tech Stack:** Laravel 13 + Inertia + React/TypeScript

---

## Ringkasan Hasil Testing

| Tool                 | Status   | Hasil                    |
| -------------------- | -------- | ------------------------ |
| **Playwright (E2E)** | ✅ LULUS | 7 passed (6.0s)          |
| **Vitest (Unit)**    | ✅ LULUS | 3 passed                 |
| **PHPUnit/Pest**     | ⚠️ Gagal | 131 failed (schema sync) |

---

## 1. Playwright E2E Tests

### Hasil Test

```
Running 7 tests using 4 workers

✓  4 [chromium] › tests/e2e/frontend_audit.spec.ts:5:5 › Frontend Deep Audit - UI & UX Integrity › Audit Public Landing Page Visuals (1.7s)
✓  3 [chromium] › tests/e2e/public-auth.spec.ts:4:3 › Public Portal › home page opens and login portal routes to login form (1.8s)
✓  5 [chromium] › tests/e2e/frontend_audit.spec.ts:35:5 › Frontend Deep Audit - UI & UX Integrity › Audit Authentication UI Feedback (725ms)
✓  6 [chromium] › tests/e2e/frontend_audit.spec.ts:54:5 › Frontend Deep Audit - UI & UX Integrity › Audit Dashboard Layout & Navigation (856ms)
✓  1 [chromium] › tests/e2e/role-dashboards.spec.ts:5:3 › Role Dashboards › student can login and open mahasiswa dashboard (3.6s)
✓  2 [chromium] › tests/e2e/admin-flow.spec.ts:5:3 › Admin Flow › admin can login and open operational pages (4.3s)
✓  7 [chromium] › tests/e2e/role-dashboards.spec.ts:13:3 › Role Dashboards › dpl can login and open dpl dashboard and groups (1.1s)

7 passed (6.0s)
```

### File Test

| File                                | Deskripsi                     |
| ----------------------------------- | ----------------------------- |
| `tests/e2e/public-auth.spec.ts`     | Test halaman publik dan login |
| `tests/e2e/role-dashboards.spec.ts` | Test dashboard student & DPL  |
| `tests/e2e/admin-flow.spec.ts`      | Test alur kerja admin         |
| `tests/e2e/frontend_audit.spec.ts`  | Audit UI/UX mendalam          |

### Konfigurasi

```typescript
// playwright.config.ts
- baseURL: http://127.0.0.1:8000
- viewport: 1440x960
- reporter: list + html
- webServer: PHP Artisan + Vite
```

### Cara Menjalankan

```bash
# Semua E2E test
npx playwright test

# Spesifik file
npx playwright test tests/e2e/public-auth.spec.ts

# Dengan HTML report
npx playwright test --reporter=html
npx playwright show-report
```

---

## 2. Vitest Unit Tests

### Hasil Test

```
Test Files  2 passed (2)
Tests       3 passed (3)
Duration: 659ms
```

### Konfigurasi

```typescript
// vitest.config.ts
- environment: jsdom
- coverage: v8 provider
- exclude: node_modules, tests/e2e, playwright-report
```

### Cara Menjalankan

```bash
# Semua test
npm run test

# Dengan coverage
npm run test -- --coverage
```

---

## 3. Pest/PHPUnit Tests

### Hasil

```
Tests: 131 failed, 9 skipped, 246 passed
```

### Masalah

1. **Schema tidak sinkron** - Beberapa kolom/tabel tidak ada di database test
2. **Syntax error** - `StoreRegistrationRequest.php:18` memiliki bug kritis
3. **Migration issue** - RefreshPostgresDatabase trait tidak berfungsi dengan benar

### Cara Menjalankan

```bash
# Semua test
php artisan test

# Pest
./vendor/bin/pest

# Specific test
./vendor/bin/pest --filter=LoginTest
```

---

## 4. TestSprite (AI Integration Tests)

### Lokasi

`testsprite_tests/` - 30+ Python test files

### Coverage

- API authentication tests
- Registration workflow tests
- Admin dashboard tests
- Phase switching tests

---

## 5. Dashboard Testing Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    TESTING SUMMARY                          │
├─────────────────────┬───────────┬───────────┬──────────────┤
│ Type                │ Total     │ Passed    │ Failed       │
├─────────────────────┼───────────┼───────────┼──────────────┤
│ Playwright (E2E)    │ 7         │ 7         │ 0            │
│ Vitest (Unit)       │ 3         │ 3         │ 0            │
│ Pest/PHPUnit        │ 377       │ 246       │ 131          │
│ TestSprite (AI)     │ 30+       │ -         │ -            │
└─────────────────────┴───────────┴───────────┴──────────────┘
```

---

## 6. Rekomendasi Perbaikan

### Priority 1 - Fix Pest Tests

1. **Perbaiki syntax error** di `StoreRegistrationRequest.php`
2. **Sinkronisasi schema** antara model dan database
3. **Perbaiki RefreshPostgresDatabase trait**

### Priority 2 - Tambah Coverage

1. Tambah E2E test untuk edge cases
2. Tambah unit test untuk service layer
3. Setup CI/CD pipeline

---

## 7. CI/CD Integration

```yaml
# .github/workflows/test.yml (contoh)
name: Tests
on: [push, pull_request]
jobs:
    test:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3
            - name: Install PHP
              uses: shivammathur/setup-php@v2
              with:
                  php-version: '8.4'
            - name: Install Node
              uses: actions/setup-node@v3
            - name: Install Dependencies
              run: composer install && npm ci
            - name: Run Playwright
              run: npx playwright test
            - name: Run Vitest
              run: npm run test
            - name: Run Pest
              run: ./vendor/bin/pest
```
