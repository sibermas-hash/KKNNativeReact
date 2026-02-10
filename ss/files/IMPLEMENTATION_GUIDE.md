# KKN Management System - Complete Implementation Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [File Storage Configuration](#file-storage-configuration)
6. [Testing](#testing)
7. [Deployment](#deployment)

---

## 🔧 Prerequisites

### Required Software
- PHP 8.2+
- Composer
- Node.js 18+
- MySQL 8.0+ or PostgreSQL 14+
- Laravel 12

### Laravel Packages to Install
```bash
# Core dependencies
composer require inertiajs/inertia-laravel
composer require tightenco/ziggy

# PDF generation
composer require barryvdh/laravel-dompdf

# Excel export (optional)
composer require maatwebsite/excel

# Image processing
composer require intervention/image
```

### Frontend Dependencies
```bash
npm install @inertiajs/react react react-dom
npm install lucide-react
npm install @headlessui/react
npm install recharts  # For charts
```

---

## 🗄️ Database Setup

### Step 1: Run Migrations in Order

Create a new migration file for each table in the correct order:

```bash
# Create migration files
php artisan make:migration create_groups_table
php artisan make:migration create_group_members_table
php artisan make:migration create_scores_table
php artisan make:migration create_reports_table
php artisan make:migration create_logbooks_table
php artisan make:migration create_workshops_table
php artisan make:migration create_workshop_participants_table
php artisan make:migration create_proposals_table
```

Copy the migration code from `database_migrations.md` into each respective file.

### Step 2: Create Models

```bash
php artisan make:model Group
php artisan make:model GroupMember
php artisan make:model Score
php artisan make:model Report
php artisan make:model Logbook
php artisan make:model Workshop
php artisan make:model WorkshopParticipant
php artisan make:model Proposal
```

### Step 3: Define Model Relationships

**app/Models/User.php:**
```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    // Existing code...

    // As Student
    public function groupMember()
    {
        return $this->hasOne(GroupMember::class);
    }

    public function scores()
    {
        return $this->hasMany(Score::class);
    }

    public function reports()
    {
        return $this->hasMany(Report::class);
    }

    public function logbooks()
    {
        return $this->hasMany(Logbook::class);
    }

    // As DPL
    public function dplGroups()
    {
        return $this->hasMany(Group::class, 'dpl_id');
    }

    // As Village Head
    public function villageGroups()
    {
        return $this->hasMany(Group::class, 'village_head_id');
    }

    // Workshops
    public function workshopParticipations()
    {
        return $this->hasMany(WorkshopParticipant::class);
    }
}
```

**app/Models/Group.php:**
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Group extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'village',
        'district',
        'dpl_id',
        'village_head_id',
        'year',
        'status',
    ];

    public function dpl()
    {
        return $this->belongsTo(User::class, 'dpl_id');
    }

    public function villageHead()
    {
        return $this->belongsTo(User::class, 'village_head_id');
    }

    public function members()
    {
        return $this->hasMany(GroupMember::class);
    }

    public function scores()
    {
        return $this->hasMany(Score::class);
    }

    public function reports()
    {
        return $this->hasMany(Report::class);
    }

    public function logbooks()
    {
        return $this->hasMany(Logbook::class);
    }
}
```

**app/Models/Score.php:**
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Score extends Model
{
    protected $fillable = [
        'user_id',
        'group_id',
        'proposal_score',
        'execution_score',
        'article_score',
        'final_report_score',
        'discipline_score',
        'attitude_score',
        'dpl_weighted_score',
        'village_weighted_score',
        'total_score',
        'letter_grade',
        'dpl_graded_by',
        'village_graded_by',
        'dpl_graded_at',
        'village_graded_at',
    ];

    protected $casts = [
        'dpl_graded_at' => 'datetime',
        'village_graded_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function dplGradedBy()
    {
        return $this->belongsTo(User::class, 'dpl_graded_by');
    }

    public function villageGradedBy()
    {
        return $this->belongsTo(User::class, 'village_graded_by');
    }
}
```

### Step 4: Run Migrations

```bash
php artisan migrate
```

### Step 5: Create Seeders (Optional)

```bash
php artisan make:seeder UserSeeder
php artisan make:seeder GroupSeeder
```

---

## ⚙️ Backend Implementation

### Step 1: Copy Service Classes

Create the services directory and copy all service classes:

```bash
mkdir -p app/Services
```

Copy these files to `app/Services/`:
- `GradingService.php`
- `ReportManagementService.php`
- `LogbookService.php`
- `WorkshopService.php`

### Step 2: Create Controllers

```bash
php artisan make:controller GradingController
php artisan make:controller LogbookController
php artisan make:controller ReportController
php artisan make:controller WorkshopController
php artisan make:controller DashboardController
```

Copy the controller code from `Controllers.php`.

### Step 3: Define Routes

**routes/web.php:**
```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GradingController;
use App\Http\Controllers\LogbookController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\WorkshopController;

// Dashboard
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Logbook routes
    Route::prefix('logbook')->name('logbook.')->group(function () {
        Route::get('/', [LogbookController::class, 'index'])->name('index');
        Route::get('/create', [LogbookController::class, 'create'])->name('create');
        Route::post('/', [LogbookController::class, 'store'])->name('store');
        Route::put('/{id}', [LogbookController::class, 'update'])->name('update');
        Route::delete('/{id}', [LogbookController::class, 'destroy'])->name('destroy');
        
        // DPL routes
        Route::middleware(['role:dpl'])->group(function () {
            Route::get('/pending', [LogbookController::class, 'pendingApprovals'])->name('pending');
            Route::post('/{id}/review', [LogbookController::class, 'review'])->name('review');
            Route::post('/bulk-approve', [LogbookController::class, 'bulkApprove'])->name('bulk-approve');
        });
    });

    // Reports routes
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('/', [ReportController::class, 'index'])->name('index');
        Route::post('/upload', [ReportController::class, 'upload'])->name('upload');
        Route::post('/{id}/submit', [ReportController::class, 'submit'])->name('submit');
        Route::get('/{id}/download', [ReportController::class, 'download'])->name('download');
        
        // DPL routes
        Route::middleware(['role:dpl'])->group(function () {
            Route::post('/{id}/review', [ReportController::class, 'review'])->name('review');
        });
    });

    // Grading routes (DPL only)
    Route::middleware(['role:dpl'])->prefix('grading')->name('grading.')->group(function () {
        Route::get('/', [GradingController::class, 'index'])->name('index');
        Route::post('/dpl-scores', [GradingController::class, 'submitDPLScores'])->name('dpl-scores');
        Route::post('/bulk-dpl-scores', [GradingController::class, 'bulkSubmitDPLScores'])->name('bulk-dpl-scores');
        Route::get('/export', [GradingController::class, 'export'])->name('export');
    });

    // Village Head grading
    Route::middleware(['role:village_head'])->prefix('grading')->name('grading.')->group(function () {
        Route::post('/village-scores', [GradingController::class, 'submitVillageScores'])->name('village-scores');
    });

    // Workshops
    Route::prefix('workshops')->name('workshops.')->group(function () {
        Route::get('/', [WorkshopController::class, 'index'])->name('index');
        Route::post('/{id}/register', [WorkshopController::class, 'register'])->name('register');
        Route::get('/{participantId}/certificate', [WorkshopController::class, 'downloadCertificate'])->name('certificate');
        
        // Admin routes
        Route::middleware(['role:admin'])->group(function () {
            Route::post('/{id}/attendance', [WorkshopController::class, 'markAttendance'])->name('attendance');
        });
    });
});
```

### Step 4: Create Middleware

```bash
php artisan make:middleware RoleMiddleware
```

**app/Http/Middleware/RoleMiddleware.php:**
```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string $role)
    {
        if (!$request->user() || $request->user()->role !== $role) {
            abort(403, 'Unauthorized action.');
        }

        return $next($request);
    }
}
```

Register in **app/Http/Kernel.php**:
```php
protected $middlewareAliases = [
    // ...
    'role' => \App\Http\Middleware\RoleMiddleware::class,
];
```

---

## 🎨 Frontend Implementation

### Step 1: Setup Tailwind CSS

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/**/*.blade.php",
    "./resources/**/*.jsx",
    "./resources/**/*.js",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
```

### Step 2: Create Component Structure

```
resources/js/
├── Components/
│   ├── GlassCard.jsx
│   ├── AnalyticsCard.jsx
│   ├── FormField.jsx
│   └── FileUpload.jsx
├── Layouts/
│   └── AuthenticatedLayout.jsx
└── Pages/
    ├── Dashboard/
    │   └── Index.jsx
    ├── Logbook/
    │   ├── Index.jsx
    │   ├── Create.jsx
    │   └── PendingApprovals.jsx
    ├── Reports/
    │   └── Index.jsx
    ├── Grading/
    │   └── Index.jsx
    └── Workshops/
        └── Index.jsx
```

### Step 3: Copy React Components

Copy the provided React components to their respective locations.

### Step 4: Create Shared Components

**resources/js/Components/GlassCard.jsx:**
```jsx
export default function GlassCard({ children, className = '' }) {
    return (
        <div className={`
            backdrop-blur-xl bg-white/70 dark:bg-slate-800/70 
            border border-white/20 dark:border-slate-700/50
            rounded-2xl p-6 
            shadow-xl shadow-black/5
            ${className}
        `}>
            {children}
        </div>
    );
}
```

---

## 📁 File Storage Configuration

### Step 1: Configure Filesystems

**config/filesystems.php:**
```php
'disks' => [
    'public' => [
        'driver' => 'local',
        'root' => storage_path('app/public'),
        'url' => env('APP_URL').'/storage',
        'visibility' => 'public',
    ],

    'private' => [
        'driver' => 'local',
        'root' => storage_path('app/private'),
        'visibility' => 'private',
    ],

    // For S3 (production)
    's3' => [
        'driver' => 's3',
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION'),
        'bucket' => env('AWS_BUCKET'),
    ],
],
```

### Step 2: Create Storage Link

```bash
php artisan storage:link
```

### Step 3: Set Permissions

```bash
chmod -R 775 storage
chmod -R 775 bootstrap/cache
```

---

## 🧪 Testing

### Create Test Files

```bash
php artisan make:test GradingServiceTest
php artisan make:test LogbookServiceTest
php artisan make:test ReportServiceTest
```

### Example Test

**tests/Feature/LogbookServiceTest.php:**
```php
<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Group;
use App\Services\LogbookService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class LogbookServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $logbookService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->logbookService = new LogbookService();
    }

    public function test_can_create_logbook_entry()
    {
        $user = User::factory()->create();
        $group = Group::factory()->create();

        $logbook = $this->logbookService->createEntry(
            $user->id,
            $group->id,
            '2025-01-15',
            'Desa Test',
            'ACC',
            'Testing logbook entry creation'
        );

        $this->assertDatabaseHas('logbooks', [
            'user_id' => $user->id,
            'group_id' => $group->id,
        ]);
    }
}
```

Run tests:
```bash
php artisan test
```

---

## 🚀 Deployment

### Production Checklist

1. **Environment Setup**
```bash
cp .env.example .env
php artisan key:generate
```

2. **Optimize Application**
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
npm run build
```

3. **Set Proper Permissions**
```bash
chown -R www-data:www-data storage bootstrap/cache
```

4. **Setup Queue Worker**
```bash
php artisan queue:work --daemon
```

5. **Setup Scheduler**
Add to crontab:
```
* * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1
```

---

## 📝 Additional Features

### PDF Certificate Template

Create **resources/views/certificates/workshop.blade.php:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { size: A4 landscape; margin: 0; }
        body { 
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 60px;
            background: url('/images/certificate-bg.jpg') no-repeat center;
            background-size: cover;
        }
        .certificate {
            text-align: center;
            padding: 40px;
        }
        .title {
            font-size: 48px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 30px;
        }
        .subtitle {
            font-size: 24px;
            margin-bottom: 40px;
        }
        .participant-name {
            font-size: 36px;
            font-weight: bold;
            margin: 30px 0;
            border-bottom: 2px solid #333;
            display: inline-block;
            padding-bottom: 10px;
        }
        .details {
            font-size: 18px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="certificate">
        <h1 class="title">SERTIFIKAT</h1>
        <p class="subtitle">Nomor: {{ $certificate_number }}</p>
        
        <p class="details">Diberikan kepada:</p>
        
        <div class="participant-name">{{ $participant_name }}</div>
        <p class="details">NIM: {{ $nim }}</p>
        
        <p class="details">
            Sebagai Peserta<br>
            <strong>{{ $workshop_title }}</strong><br>
            Metodologi {{ $methodology }}<br>
            {{ $location }}, {{ $workshop_date }}
        </p>
        
        <p style="margin-top: 60px;">{{ $issue_date }}</p>
    </div>
</body>
</html>
```

---

## 🎯 Next Steps

1. Implement user authentication with roles
2. Add email notifications for workflow events
3. Integrate real-time updates with Laravel Echo and Pusher
4. Add data export features (Excel, PDF)
5. Implement advanced analytics dashboard
6. Add multi-language support
7. Implement comprehensive logging

---

## 📚 Resources

- [Laravel Documentation](https://laravel.com/docs)
- [Inertia.js Documentation](https://inertiajs.com)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)

---

**Implementation Time Estimate:** 2-3 weeks for complete system

**Questions?** Review the code comments and Laravel best practices documentation.
