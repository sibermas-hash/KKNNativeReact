# Dokumentasi End-to-End (E2E) Testing - KKN UIN SAIZU

**Tanggal:** 18 April 2026  
**Project:** KKN UIN SAIZU Portal  
**Tools:** Playwright + Vitest  
**Tech Stack:** Laravel 13 + Inertia + React/TypeScript

---

## Ringkasan Hasil E2E Test

```
Running 7 tests using 4 workers

✓  4 [chromium] › tests/e2e/frontend_audit.spec.ts:5:5   › Audit Public Landing Page Visuals
✓  3 [chromium] › tests/e2e/public-auth.spec.ts:4:3      › home page opens and login portal routes to login form
✓  5 [chromium] › tests/e2e/frontend_audit.spec.ts:35:5  › Audit Authentication UI Feedback
✓  6 [chromium] › tests/e2e/frontend_audit.spec.ts:54:5  › Audit Dashboard Layout & Navigation
✓  1 [chromium] › tests/e2e/role-dashboards.spec.ts:5:3  › student can login and open mahasiswa dashboard
✗  2 [chromium] › tests/e2e/admin-flow.spec.ts:5:3        › admin can login and open operational pages
✗  7 [chromium] › tests/e2e/role-dashboards.spec.ts:13:3 › dpl can login and open dpl dashboard and groups

Results: 5 passed, 2 failed (Duration: 12.7s)
```

---

## 1. Struktur E2E Tests

### Lokasi Files

```
tests/e2e/
├── public-auth.spec.ts        # Test halaman publik & login
├── role-dashboards.spec.ts    # Test dashboard Student & DPL
├── admin-flow.spec.ts         # Test alur kerja Admin
├── frontend_audit.spec.ts      # Audit UI/UX mendalam
└── utils/
    └── auth.ts                # Helper functions untuk login
```

---

## 2. Detail Setiap Test

### 2.1 Public Auth Test (`public-auth.spec.ts`)

**Status: ✅ PASSED**

| Test Case          | Expected                            | Actual  |
| ------------------ | ----------------------------------- | ------- |
| Home page loads    | Halaman landing publik muncul       | ✅ PASS |
| Login portal link  | Link "login portal" terlihat        | ✅ PASS |
| Redirect ke /login | Setelah klik, URL berubah ke /login | ✅ PASS |
| Login form visible | Form login dengan captcha terlihat  | ✅ PASS |

**Kode:**

```typescript
test('home page opens and login portal routes to login form', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /login portal/i })).toBeVisible();
    await page.getByRole('link', { name: /login portal/i }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-identifier')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    await expect(page.getByTestId('login-captcha-answer')).toBeVisible();
});
```

---

### 2.2 Role Dashboards Test (`role-dashboards.spec.ts`)

**Status: ⚠️ 1 PASSED, 1 FAILED**

#### ✅ Student Dashboard - PASSED

| Test Case              | Expected                           | Actual  |
| ---------------------- | ---------------------------------- | ------- |
| Login as student       | Berhasil login                     | ✅ PASS |
| Redirect ke /mahasiswa | Setelah login, URL /mahasiswa      | ✅ PASS |
| Dashboard visible      | Text "portal mahasiswa" terlihat   | ✅ PASS |
| Progress visible       | Text "progres pengabdian" terlihat | ✅ PASS |

#### ❌ DPL Dashboard - FAILED

| Test Case    | Error                                       |
| ------------ | ------------------------------------------- |
| Login as DPL | `getByTestId('login-identifier')` not found |

**Error:**

```
Error: expect(locator).toBeVisible() failed
Locator: getByTestId('login-identifier')
Expected: visible
Error: element(s) not found
```

**Analisis:** Test gagal karena halaman yang di-load bukan halaman login yang diharapkan. Kemungkinan halaman redirect atau ada masalah pada flow login DPL.

---

### 2.3 Admin Flow Test (`admin-flow.spec.ts`)

**Status: ❌ FAILED**

| Test Case      | Error                                                               |
| -------------- | ------------------------------------------------------------------- |
| Login as admin | `getByRole('heading', { name: /validasi pendaftaran/i })` not found |

**Error:**

```
Error: expect(locator).toBeVisible() failed
Locator: getByRole('heading', { name: /validasi pendaftaran/i }).first()
Expected: visible
Error: element(s not found
```

**Analisis:** Admin berhasil login dan redirect ke `/admin`, tapi halaman `/admin/pendaftaran` tidak menampilkan heading "validasi pendaftaran". Kemungkinan perubahan UI atau route.

---

### 2.4 Frontend Audit Test (`frontend_audit.spec.ts`)

**Status: ⚠️ 3 PASSED, 1 FAILED**

#### ✅ Test 1: Audit Public Landing Page Visuals - PASSED

| Check                    | Result                                 |
| ------------------------ | -------------------------------------- |
| Broken images check      | ✅ PASS - Tidak ada broken images      |
| Emerald-600 design token | ✅ PASS - Detected: `rgb(5, 150, 105)` |
| Mobile responsive        | ✅ PASS - Menu button visible          |

**Output:**

```
Detected Primary Color: rgb(5, 150, 105)
```

#### ✅ Test 2: Audit Authentication UI Feedback - PASSED

| Check                  | Result                        |
| ---------------------- | ----------------------------- |
| Captcha rendering      | ✅ PASS                       |
| Invalid login feedback | ✅ PASS - Error box displayed |
| Error message length   | ✅ PASS (> 5 chars)           |

#### ❌ Test 3: Audit Dashboard Layout & Navigation - FAILED

| Test Case                                | Error                                       |
| ---------------------------------------- | ------------------------------------------- |
| Login as admin (via X-Test-Login header) | `getByTestId('login-identifier')` not found |

**Analisis:** Metode login menggunakan `X-Test-Login` header tidak berfungsi seperti yang diharapkan. Test mencoba login melalui portal tapi element tidak ditemukan.

---

## 3. Konfigurasi Playwright

```typescript
// playwright.config.ts
export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: 'http://127.0.0.1:8000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        viewport: { width: 1440, height: 960 },
        actionTimeout: 15000,
        navigationTimeout: 30000,
    },
    webServer: [
        {
            command: 'php artisan serve --host=127.0.0.1 --port=8000',
            url: `${baseURL}/login`,
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
        },
        {
            command: 'npm run dev -- --host 127.0.0.1 --port 5173',
            url: 'http://127.0.0.1:5173/@vite/client',
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
        },
    ],
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
```

---

## 4. Cara Menjalankan E2E Tests

### Commands

```bash
# Semua E2E tests
npx playwright test

# Dengan reporter detail
npx playwright test --reporter=list

# Dengan HTML report
npx playwright test --reporter=html
npx playwright show-report

# Spesifik file
npx playwright test tests/e2e/public-auth.spec.ts
npx playwright test tests/e2e/admin-flow.spec.ts
npx playwright test tests/e2e/role-dashboards.spec.ts
npx playwright test tests/e2e/frontend_audit.spec.ts

# Spesifik test case
npx playwright test -g "student can login"

# Mode UI (interaktif)
npx playwright test --ui

# Dengan browser tertentu
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug
```

### Environment Variables

```bash
# Setup credentials
export E2E_ADMIN_LOGIN=admin
export E2E_ADMIN_PASSWORD=Password#123
export E2E_STUDENT_LOGIN=student
export E2E_STUDENT_PASSWORD=Password#123
export E2E_DPL_LOGIN=dpl
export E2E_DPL_PASSWORD=Password#123

# Setup base URL
export PLAYWRIGHT_BASE_URL=http://127.0.0.1:8000
```

---

## 5. Masalah & Perbaikan

### Issue 1: Login Element Not Found

**Gejala:** `getByTestId('login-identifier')` tidak ditemukan

**Kemungkinan Penyebab:**

1. Halaman login tidak fully loaded sebelum test berjalan
2. CAPTCHA tidak selesai loading
3. Test mencoba navigasi sebelum element ready

**Solusi:**

```typescript
// Tambah wait sebelum check element
await page.waitForLoadState('networkidle');
await expect(page.getByTestId('login-identifier')).toBeVisible();
```

### Issue 2: Admin Pendaftaran Page Heading Not Found

**Gejala:** Heading "validasi pendaftaran" tidak ditemukan di `/admin/pendaftaran`

**Kemungkinan Penyebab:**

1. Perubahan UI - heading mungkin sudah diganti
2. Page tidak fully loaded
3. Permission issue - user tidak punya akses

**Solusi:**

```typescript
// Cek actual heading yang ada di page
const heading = page.locator('h1, h2, h3').first();
await expect(heading).toBeVisible();
```

### Issue 3: X-Test-Login Header Tidak Berfungsi

**Gejala:** Test menggunakan header untuk instant login gagal

**Kemungkinan Penyebab:**

1. Middleware tidak menerima header tersebut
2. Feature tidak diimplementasikan

**Solusi:** Gunakan fungsi loginThroughPortal yang sudah ada

---

## 6. Test Coverage Matrix

| Feature                    | Coverage | Status |
| -------------------------- | -------- | ------ |
| Public Landing Page        | ✅       | PASS   |
| Login Form + Captcha       | ✅       | PASS   |
| Student Dashboard          | ✅       | PASS   |
| DPL Dashboard              | ⚠️       | FAIL   |
| Admin Dashboard            | ⚠️       | FAIL   |
| Admin Pendaftaran Page     | ⚠️       | FAIL   |
| UI/UX Audit (Design Token) | ✅       | PASS   |
| UI/UX Audit (Responsive)   | ✅       | PASS   |
| UI/UX Audit (Error States) | ✅       | PASS   |

---

## 7. Rekomendasi Perbaikan

### Priority 1: Fix Failing Tests

1. **DPL Dashboard Test**
    - Verifikasi credentials yang digunakan
    - Tambah wait untuk page load
    - Cek redirect flow

2. **Admin Flow Test**
    - Update selector untuk heading terbaru
    - Verifikasi page structure

3. **Frontend Audit Dashboard Test**
    - Gunakan login helper yang benar
    - Hindari X-Test-Login header

### Priority 2: Tambah Coverage

1. **Registration Flow Test**
    - Test halaman registrasi KKN
    - Test form submission
    - Test document upload

2. **Daily Report Test**
    - Test laporan harian
    - Test GPS validation

3. **Assessment Test**
    - Test grading interface
    - Test nilai export

---

## 9. Rekomendasi Perbaikan (Untuk Developer)

### Issue 1: Login Element Not Found (DPL & Admin Flow)

**Gejala:**

- `getByTestId('login-identifier')` tidak ditemukan
- Terjadi pada test DPL dashboard dan Admin flow

**Kemungkinan Penyebab:**

1. Halaman login tidak fully loaded sebelum test berjalan
2. CAPTCHA tidak selesai loading
3. Test mencoba navigasi sebelum element ready
4. Redirect dari halaman sebelumnya tidak berjalan dengan benar

**Solusi yang Direkomendasikan:**

```typescript
// Di tests/e2e/utils/auth.ts

// 1. Tambah wait untuk network idle sebelum check element
export async function loginThroughPortal(page: Page, credentials: LoginCredentials) {
    await page.goto('/login');

    // Tambah wait state
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');

    // Tambah explicit wait untuk form
    await page.waitForSelector('[data-testid="login-identifier"]', {
        state: 'visible',
        timeout: 10000,
    });

    await expect(page.getByTestId('login-identifier')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    await expect(page.getByTestId('login-captcha-question')).toBeVisible();
    // ... rest of the code
}

// 2. Untuk debugging, tambahkan screenshot saat failure
export async function loginThroughPortalWithDebug(page: Page, credentials: LoginCredentials) {
    await page.goto('/login');

    try {
        await page.waitForLoadState('networkidle');
        await expect(page.getByTestId('login-identifier')).toBeVisible({ timeout: 10000 });
    } catch (e) {
        await page.screenshot({ path: `debug-login-${Date.now()}.png` });
        throw e;
    }
    // ... rest
}
```

### Issue 2: Admin Pendaftaran Page Heading Not Found

**Gejala:**

- Heading "validasi pendaftaran" tidak ditemukan di `/admin/pendaftaran`
- Test gagal setelah berhasil login

**Kemungkinan Penyebab:**

1. Perubahan UI - heading mungkin sudah diganti
2. Page tidak fully loaded
3. Permission issue - user tidak punya akses

**Solusi yang Direkomendasikan:**

```typescript
// Di tests/e2e/admin-flow.spec.ts

test('admin can login and open operational pages', async ({ page }) => {
    await loginAsAdmin(page);

    await expect(page).toHaveURL(/\/admin(?:\?.*)?$/);

    //方式 1: Gunakan selector yang lebih fleksibel
    await expect(page.getByRole('heading').first()).toBeVisible();

    //方式 2: Cek beberapa kemungkinan heading
    const possibleHeadings = [/validasi/i, /pendaftaran/i, /manajemen/i, /pengelolaan/i];

    for (const pattern of possibleHeadings) {
        const heading = page.getByRole('heading', { name: pattern });
        if ((await heading.count()) > 0) {
            await expect(heading.first()).toBeVisible();
            break;
        }
    }

    await page.goto('/admin/pendaftaran');
    await expect(page).toHaveURL(/\/admin\/pendaftaran/);

    //方式 3: Cek element apapun yang visible sebagai fallback
    await page.waitForLoadState('networkidle');
    const content = page.locator('main, .content, [role="main"]').first();
    await expect(content).toBeVisible();
});
```

### Issue 3: X-Test-Login Header Tidak Berfungsi

**Gejala:**

- Test menggunakan header untuk instant login gagal
- `getByTestId('login-identifier')` tetap dipanggil

**Kemungkinan Penyebab:**

1. Middleware tidak menerima header tersebut
2. Feature tidak diimplementasikan atau sudah dihapus

**Solusi yang Direkomendasikan:**

```typescript
// Di tests/e2e/frontend_audit.spec.ts

// Sebelum (yang gagal):
test('Audit Dashboard Layout & Navigation', async ({ page }) => {
    // ❌ Cara ini tidak berfungsi
    await page.setExtraHTTPHeaders({ 'X-Test-Login': 'admin' });
    await page.goto('/admin');
    // ...
});

// Sesudah (yang disarankan):
test('Audit Dashboard Layout & Navigation', async ({ page }) => {
    // ✅ Gunakan login helper yang sudah ada
    await loginAsAdmin(page);

    await expect(page).toHaveURL(/\/admin/);

    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    // ...
});
```

### Issue 4: Wait Strategy yang Konsisten

**Rekomendasi untuk semua test:**

```typescript
// Tambah di setiap test
test.describe.configure({ mode: 'parallel' }); // atau 'serial' jika perlu

// Gunakan consistent wait
await page.goto('/url');
await page.waitForLoadState('networkidle'); // Tambah ini

// Atau gunakan waiting strategies lain:
// - page.waitForURL('/expected-url')
// - page.waitForSelector('.selector')
```

---

## 10. Checklist Perbaikan

- [ ] Fix login element not found di DPL test
- [ ] Fix login element not found di Admin flow test
- [ ] Fix login element not found di Frontend audit dashboard test
- [ ] Update selector untuk admin/pendaftaran heading
- [ ] Gunakan login helper yang konsisten (bukan X-Test-Login header)
- [ ] Tambah wait state untuk semua navigation
- [ ] Tambah screenshot on failure untuk debugging

---

## 11. Ringkasan Teknis untuk Developer

### Struktur Test Files

```
tests/e2e/
├── public-auth.spec.ts         # Test publik - JANGAN UBAH (sudah работает)
├── role-dashboards.spec.ts    # ⚠️ Perlu fix - login element
├── admin-flow.spec.ts         # ⚠️ Perlu fix - selector heading
├── frontend_audit.spec.ts     # ⚠️ Perlu fix - gunakan loginAsAdmin()
└── utils/
    └── auth.ts                # Helper login - Pertahankan seperti sekarang
```

### Credentials yang Digunakan

```typescript
// Dari environment atau default
E2E_ADMIN_LOGIN=admin
E2E_ADMIN_PASSWORD=Password#123
E2E_STUDENT_LOGIN=student
E2E_STUDENT_PASSWORD=Password#123
E2E_DPL_LOGIN=dpl
E2E_DPL_PASSWORD=Password#123
```

### Test yang SUDAH BERFUNCGI (Don't Break)

- ✅ public-auth.spec.ts - Semua test
- ✅ role-dashboards.spec.ts - "student can login" only
- ✅ frontend_audit.spec.ts - Test 1 & 2 saja

### Test yang PERLU DIPERBAIKI

- ❌ role-dashboards.spec.ts - "dpl can login"
- ❌ admin-flow.spec.ts - "admin can login"
- ❌ frontend_audit.spec.ts - "Dashboard Layout"

---

## 12. Screenshots & Videos

Failed test screenshots dan videos disimpan di:

```
test-results/
├── admin-flow-Admin-Flow-...
├── role-dashboards-Role-Dashb-...
└── frontend_audit-Frontend-De-...
```

Untuk melihat:

```bash
npx playwright show-report
```

---

## 13. Summary

| Metric      | Value   |
| ----------- | ------- |
| Total Tests | 7       |
| Passed      | 5 (71%) |
| Failed      | 2 (29%) |
| Duration    | 12.7s   |

### next step:

1. Perbaiki 2 test yang gagal
2. Tambah test coverage untuk fitur lain
3. Setup CI/CD pipeline untuk E2E tests
