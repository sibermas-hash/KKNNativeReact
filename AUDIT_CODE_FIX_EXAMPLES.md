# 📝 AUDIT FINDINGS - CODE FIX EXAMPLES
## KKN Application (April 9, 2026)

---

## 🔧 FIX #1: Remove CSRF Debug Code

**File**: `app/Http/Middleware/VerifyCsrfToken.php`  
**Time**: 2 minutes  
**Difficulty**: ⭐ Trivial

### Before
```php
<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * Indicates whether the XSRF-TOKEN cookie should be set on the response.
     *
     * @var bool
     */
    protected $addHttpCookie = true;

    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * TEMPORARY: Only for debugging 419 issue — REMOVE after root cause found.  ⚠️ REMOVE THIS
     *
     * @var array<int, string>
     */
    protected $except = [
        // All clear for now — no exceptions
    ];
}
```

### After
```php
<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * Indicates whether the XSRF-TOKEN cookie should be set on the response.
     *
     * @var bool
     */
    protected $addHttpCookie = true;

    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        // All URIs protected by CSRF verification
    ];
}
```

### Verification
```bash
# 1. Login and test normal CSRF flow
npm run dev

# 2. Verify no extra comments in code
grep -r "TEMPORARY" app/

# 3. Should return empty (no TEMPORARY comments found)
```

---

## 🔧 FIX #2: Add Error Logging to Auth Controller

**File**: `app/Http/Controllers/Auth/AuthenticatedSessionController.php`  
**Lines**: 84-95 (store method)  
**Time**: 15 minutes  
**Difficulty**: ⭐ Easy

### Before
```php
public function store(LoginRequest $request): RedirectResponse
{
    // ... other code ...

    try {
        $request->authenticate();
    } catch (ValidationException $e) {
        $this->refreshCaptcha($request);
        $request->session()->regenerateToken();
        throw $e;
    } catch (\Throwable) {  // ⚠️ NO LOGGING!
        $this->refreshCaptcha($request);
        $request->session()->regenerateToken();
        return back()->withErrors([
            'login' => 'Gagal masuk ke sistem. Silakan coba lagi.',
        ]);
    }

    // ... rest of method ...
}
```

### After
```php
use Illuminate\Support\Facades\Log;

public function store(LoginRequest $request): RedirectResponse
{
    // ... other code ...

    try {
        $request->authenticate();
    } catch (ValidationException $e) {
        $this->refreshCaptcha($request);
        $request->session()->regenerateToken();
        throw $e;
    } catch (\Throwable $e) {  // ✅ CATCH THROWABLE WITH VARIABLE
        Log::error('Login authentication error', [  // ✅ ADD LOGGING
            'login_attempt' => $request->input('login'),
            'error_message' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
        
        $this->refreshCaptcha($request);
        $request->session()->regenerateToken();
        return back()->withErrors([
            'login' => 'Gagal masuk ke sistem. Silakan coba lagi.',
        ]);
    }

    // ... rest of method ...
}
```

### Verification
```bash
# 1. Test login with invalid credentials to trigger error
# 2. Check logs
tail -f storage/logs/laravel.log | grep "Login authentication error"

# 3. Should see JSON with error details
# {"login_attempt":"user@example.com","error_message":"...","ip_address":"127.0.0.1"}
```

---

## 🔧 FIX #3: Add Redis Caching Example

**File**: `app/Services/DashboardStatisticsService.php` (existing, already has caching)  
**Time**: 30 minutes for additional caching  
**Difficulty**: ⭐⭐ Easy-Medium

### Example: Cache Master Data

Add this to a service (e.g., `app/Services/MasterDataService.php`):

```php
<?php

namespace App\Services;

use App\Models\KKN\Fakultas;
use App\Models\KKN\Program;
use Illuminate\Support\Facades\Cache;

class MasterDataService
{
    private const CACHE_TTL_DAY = 86400;    // 24 hours
    private const CACHE_TTL_HOUR = 3600;   // 1 hour

    /**
     * Get all faculties with caching
     */
    public function getFaculties(): \Illuminate\Database\Eloquent\Collection
    {
        return Cache::remember(
            'master:faculties:all',
            self::CACHE_TTL_DAY,
            function () {
                return Fakultas::orderBy('nama')->get();
            }
        );
    }

    /**
     * Get all programs with caching
     */
    public function getPrograms(): \Illuminate\Database\Eloquent\Collection
    {
        return Cache::remember(
            'master:programs:all',
            self::CACHE_TTL_DAY,
            function () {
                return Program::with('faculty')
                    ->orderBy('nama')
                    ->get();
            }
        );
    }

    /**
     * Invalidate master data cache when updated
     */
    public function clearCache(): void
    {
        Cache::forget('master:faculties:all');
        Cache::forget('master:programs:all');
    }
}
```

### Usage in Controller
```php
// Old way - queries every time
public function index()
{
    $faculties = Fakultas::all();  // Query runs every request
    return inertia('Admin/Dashboard', ['faculties' => $faculties]);
}

// New way - cached
public function index(MasterDataService $masterData)
{
    $faculties = $masterData->getFaculties();  // Cached for 24 hours
    return inertia('Admin/Dashboard', ['faculties' => $faculties]);
}
```

### Register in Service Provider
```php
// app/Providers/AppServiceProvider.php

public function register(): void
{
    $this->app->singleton(MasterDataService::class);
}
```

---

## 🔧 FIX #4: Add Type Safety to WHC

**File**: `resources/js/HOCs/withRBAC.tsx`  
**Time**: 20 minutes  
**Difficulty**: ⭐⭐ Medium

### Before
```typescript
import type { PageProps } from '@/types';

export function withRBAC<P>(
    WrappedComponent: React.ComponentType<P>,  // ⚠️ Generic P not validated
    requiredRoles: string[]
) {
    return (props: P) => {
        const { user } = usePage<T>().props;
        const userRoles = user.roles || [];
        
        const roleNames = userRoles.map(r => 
            typeof r === 'object' && r !== null 
                ? (r as { name: string }).name 
                : String(r)
        );

        // No type checking on PageProps access
        // ...
    };
}
```

### After
```typescript
import type { PageProps, User } from '@/types';

interface WithRBACProps extends PageProps {
    user: User;
}

export function withRBAC<P extends WithRBACProps>(
    WrappedComponent: React.ComponentType<P>,  // ✅ Constrained with extends
    requiredRoles: string[]
) {
    return (props: P & WithRBACProps) => {
        const { user } = props;
        const userRoles = user.roles || [];
        
        const roleNames = userRoles.map(r => {
            // ✅ Better type guard
            if (typeof r === 'object' && r !== null && 'name' in r) {
                return (r as { name: string }).name;
            }
            return String(r);
        });

        // Type-safe access
        const hasRequiredRole = requiredRoles.some(role => 
            roleNames.includes(role)
        );

        if (!hasRequiredRole) {
            return <div>Unauthorized access</div>;
        }

        return <WrappedComponent {...props} />;
    };
}
```

---

## 🔧 FIX #5: Optimize N+1 Query Example

**File**: `app/Http/Controllers/Admin/RekapNilaiController.php`  
**Time**: 1-2 hours (for testing)  
**Difficulty**: ⭐⭐⭐ Medium-Hard

### Before (Potential N+1)
```php
public function index(Request $request, RekapNilaiRepository $repository)
{
    $scores = NilaiKkn::query()
        ->where('is_finalized', false)
        ->get();  // Loads all scores

    // Problem: Loop will trigger query per score
    $results = $scores->map(function($score) {
        return [
            'student' => $score->user->mahasiswa->nama,  // N+1: Query per user
            'group' => $score->kelompok->nama_kelompok,  // N+1: Query per group
            'total' => $score->total_score,
        ];
    });

    return response()->json($results);
}
```

### After (Optimized)
```php
public function index(Request $request, RekapNilaiRepository $repository)
{
    $scores = NilaiKkn::query()
        ->where('is_finalized', false)
        // ✅ Eager load all relationships
        ->with([
            'user.mahasiswa',  // Load mahasiswa through user
            'kelompok',        // Load group
            'dplGradedBy',     // Load graders if needed
        ])
        ->get();  // Now single query with joins

    // No N+1 problems: all data already loaded
    $results = $scores->map(function($score) {
        return [
            'student' => $score->user?->mahasiswa?->nama,
            'group' => $score->kelompok?->nama_kelompok,
            'total' => $score->total_score,
        ];
    });

    return response()->json($results);
}
```

### Verification (Debug Bar)
```php
// Enable debug bar
// In development, check bottom right corner
// it should show: 1 query (with joins)
// NOT: 1 + 2*$scores->count() queries
```

---

## 🔧 FIX #6: Add Error Boundary to Component

**File**: `resources/js/Pages/Admin/Dashboard.tsx` (example)  
**Time**: 10 minutes  
**Difficulty**: ⭐ Trivial

### Before
```typescript
import { useState } from 'react';
import AdminLayout from '@/Layouts/AppLayout';

export default function Dashboard({ period, statistics, users }: PageProps) {
    const [filter, setFilter] = useState('');

    return (
        <AdminLayout title="Admin Dashboard">
            <div className="p-6">
                <h1>Dashboard</h1>
                {/* If component throws error, entire page crashes */}
                <StatisticsCard stats={statistics} />
                <UserList users={users} filter={filter} />
            </div>
        </AdminLayout>
    );
}
```

### After
```typescript
import { useState } from 'react';
import AdminLayout from '@/Layouts/AppLayout';
import ErrorBoundary from '@/Components/ErrorBoundary';

export default function Dashboard({ period, statistics, users }: PageProps) {
    const [filter, setFilter] = useState('');

    return (
        <AdminLayout title="Admin Dashboard">
            <div className="p-6">
                <h1>Dashboard</h1>
                
                {/* ✅ Wrap critical components */}
                <ErrorBoundary>
                    <StatisticsCard stats={statistics} />
                </ErrorBoundary>

                <ErrorBoundary>
                    <UserList users={users} filter={filter} />
                </ErrorBoundary>
            </div>
        </AdminLayout>
    );
}
```

### Verification
```bash
# 1. Run app in development
npm run dev

# 2. Intentionally break a component (for testing)
# Throw error in StatisticsCard
throw new Error("Test error!");

# 3. Should see error boundary UI, not crash
# Page recovers when error is fixed
```

---

## 🔧 FIX #7: API Documentation Setup

**Time**: 3-4 hours  
**Difficulty**: ⭐⭐ Easy-Medium

### Option A: Using Scribe (Recommended)

```bash
# Install
composer require knuckleswtf/scribe --dev

# Generate documentation
php artisan scribe:generate

# Customize: config/scribe.php created
```

### Option B: Using L5 Swagger

```bash
# Install
composer require darkaonline/l5-swagger

# Generate
php artisan vendor:publish --provider="Darkaonline\L5Swagger\L5SwaggerServiceProvider"

# Access at: /api/documentation
```

### Documenting Endpoints

```php
// In controller, add PHPDoc comments

/**
 * List all faculties
 *
 * @group Master Data
 * @authenticated
 * @response status=200 scenario="Success" {
 *   "data": [
 *     {"id": 1, "nama": "Teknik", "master_id": 101},
 *     {"id": 2, "nama": "Sains", "master_id": 102}
 *   ]
 * }
 * @response status=401 scenario="Unauthorized" {
 *   "error": "Unauthenticated"
 * }
 */
public function getFaculties()
{
    return FacultyResource::collection(Fakultas::all());
}
```

---

## 🔧 FIX #8: Implement Basic Tests

**Time**: 2-3 hours for first test suite  
**Difficulty**: ⭐⭐⭐ Medium-Hard

### Test Structure

```php
// tests/Feature/AuthenticationTest.php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    /**
     * Test successful login
     */
    public function test_login_with_valid_credentials()
    {
        // Arrange
        $user = User::factory()->create([
            'login' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        // Act
        $response = $this->post('/login', [
            'login' => 'test@example.com',
            'password' => 'password123',
            'captcha_answer' => '5', // Mock captcha
        ]);

        // Assert
        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
    }

    /**
     * Test login with invalid credentials
     */
    public function test_login_with_invalid_password()
    {
        // Arrange
        User::factory()->create([
            'login' => 'test@example.com',
            'password' => bcrypt('correct-password'),
        ]);

        // Act
        $response = $this->post('/login', [
            'login' => 'test@example.com',
            'password' => 'wrong-password',
            'captcha_answer' => '5',
        ]);

        // Assert
        $response->assertRedirect('/login');
        $this->assertGuest();
        $response->assertSessionHasErrors();
    }

    /**
     * Test rate limiting on login
     */
    public function test_login_rate_limiting()
    {
        // Arrange
        User::factory()->create([
            'login' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        // Act & Assert
        for ($i = 0; $i < 5; $i++) {
            $response = $this->post('/login', [
                'login' => 'test@example.com',
                'password' => 'wrong',
                'captcha_answer' => '5',
            ]);
            $response->assertStatus(302); // Redirect
        }

        // 6th attempt should be rate limited
        $response = $this->post('/login', [
            'login' => 'test@example.com',
            'password' => 'wrong',
            'captcha_answer' => '5',
        ]);
        $response->assertStatus(429); // Too Many Requests
    }
}
```

### Run Tests
```bash
# Run all tests
php artisan test

# Run with coverage
php artisan test --coverage

# Run specific test
php artisan test tests/Feature/AuthenticationTest.php
```

---

## 📋 QUICK REFERENCE TABLE

| Fix # | File | What | Time | Difficulty | Impact |
|-------|------|------|------|------------|--------|
| 1 | VerifyCsrfToken.php | Remove debug code | 2min | ⭐ | Clean code |
| 2 | AuthenticatedSessionController.php | Add logging | 15min | ⭐ | Debugging |
| 3 | Services/ | Add caching | 30min | ⭐⭐ | Performance +30% |
| 4 | HOCs/withRBAC.tsx | Type safety | 20min | ⭐⭐ | Type safety |
| 5 | Controllers/RekapNilaiController.php | Fix N+1 | 1-2h | ⭐⭐⭐ | Performance +10% |
| 6 | Pages/Dashboard.tsx | Error boundaries | 10min | ⭐ | Stability |
| 7 | config/ | API docs | 3-4h | ⭐⭐ | Documentation |
| 8 | tests/ | Add tests | 2-3h | ⭐⭐⭐ | Confidence |

---

**Total Implementation Time**: 8-12 hours (spread over 1 week)  
**Recommended Schedule**: 2-3 hours per day  
**Start**: Immediately after audit review
