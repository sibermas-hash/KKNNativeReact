# KKN UIN SAIZU - Laravel 10 + Inertia + React + TypeScript

## Project Overview
- Target: 2000 students, 130-200 DPL, admin staff
- Timeline: 6-7 months
- Team size: 1-3 developers
- Scope: CRUD-heavy workflows, reporting, GIS

---

## Core Tech Stack

Backend
- Laravel 10.x
- PHP 8.1+
- MySQL 8.0
- Redis (cache + queue)
- Auth: Laravel Sanctum
- Authorization: Spatie Laravel Permission
- Storage: Laravel Filesystem (local/S3)

Frontend
- React 18 + TypeScript (strict)
- Inertia.js 1.x
- Vite 4.x
- Tailwind CSS 3.x
- Forms: React Hook Form + Zod
- State: Zustand (minimal use)
- Date/Time: Day.js

Tooling
- Backend lint: Laravel Pint
- Frontend lint: ESLint + Prettier
- Tests: Pest (backend), Vitest + React Testing Library (frontend)

Optional add-ons (only if needed)
- Charts: Recharts or Chart.js
- Tables: TanStack Table
- UI components: Headless UI or shadcn/ui

---

## Project Initialization

1. Create Laravel project
```bash
composer create-project laravel/laravel kkn-uinsaizu
cd kkn-uinsaizu
```

2. Install Inertia and React
```bash
composer require inertiajs/inertia-laravel
npm install @inertiajs/react react react-dom
npm install -D @vitejs/plugin-react @types/react @types/react-dom
```

3. Install TypeScript and Tailwind
```bash
npm install -D typescript @types/node
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

4. Core frontend deps
```bash
npm install react-hook-form @hookform/resolvers zod
npm install axios clsx tailwind-merge
npm install dayjs
npm install zustand
```

5. Configure Inertia middleware
```bash
php artisan inertia:middleware
```
Add in `app/Http/Kernel.php` (web group):
```php
\App\Http\Middleware\HandleInertiaRequests::class,
```

6. Update `vite.config.js`
```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    laravel({
      input: 'resources/js/app.tsx',
      refresh: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': '/resources/js',
    },
  },
});
```

7. Install backend packages
```bash
composer require laravel/sanctum
composer require spatie/laravel-permission
composer require maatwebsite/excel
composer require barryvdh/laravel-dompdf
composer require intervention/image
composer require laravel/pint --dev
composer require pestphp/pest --dev --with-all-dependencies
php artisan pest:install
```

---

## Target File Structure

```
app/
  Http/
    Controllers/
      Admin/
      DPL/
      Student/
      Auth/
    Requests/
    Resources/
    Middleware/
  Models/
  Services/
  Repositories/
  Policies/
  Enums/
  Traits/
database/
  migrations/
  seeders/
  factories/
resources/
  js/
    Components/
      ui/
      forms/
      tables/
      layouts/
    Pages/
      Auth/
      Admin/
      DPL/
      Student/
      Dashboard/
    Layouts/
    hooks/
    lib/
    types/
    stores/
    app.tsx
  views/
    app.blade.php
routes/
  web.php
  api.php
```

---

## Database Schema (Core)

Phase 1: Authentication + Master Data
- users
- user_profiles (polymorphic)
- students
- lecturers
- faculties
- programs
- academic_years
- periods

Phase 2: KKN Workflow
- locations
- groups
- registrations
- registration_documents
- daily_reports
- daily_report_files
- work_programs
- work_program_proposals
- final_reports
- evaluations
- evaluation_items

Note: Schema SQL is unchanged from the prompt and can be used as-is for migrations.

---

## Inertia + React Setup

`resources/js/app.tsx`
```tsx
import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

const appName = import.meta.env.VITE_APP_NAME || 'KKN UIN SAIZU';

createInertiaApp({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) =>
    resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx')),
  setup({ el, App, props }) {
    const root = createRoot(el);
    root.render(<App {...props} />);
  },
  progress: { color: '#0B6B3A' },
});
```

`resources/js/types/index.ts`
```ts
export interface User {
  id: number;
  username: string;
  email: string;
  roles: Role[];
  profile?: UserProfile;
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
}

export interface UserProfile {
  phone?: string;
  address?: string;
  avatar?: string;
}

export interface Student {
  id: number;
  user_id: number;
  nim: string;
  name: string;
  faculty: Faculty;
  program: Program;
  batch_year: number;
  gender: 'L' | 'P';
}

export interface Lecturer {
  id: number;
  user_id: number;
  nip: string;
  name: string;
  faculty: Faculty;
}

export interface Faculty {
  id: number;
  code: string;
  name: string;
}

export interface Program {
  id: number;
  faculty_id: number;
  code: string;
  name: string;
}

export interface Period {
  id: number;
  academic_year: AcademicYear;
  name: string;
  start_date: string;
  end_date: string;
  registration_start: string;
  registration_end: string;
  is_active: boolean;
}

export interface AcademicYear {
  id: number;
  year: string;
  is_active: boolean;
}

export interface Group {
  id: number;
  period: Period;
  location: Location;
  lecturer?: Lecturer;
  code: string;
  name: string;
  token?: string;
  capacity: number;
  status: 'draft' | 'active' | 'closed';
}

export interface Location {
  id: number;
  village_name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
}

export interface Registration {
  id: number;
  student: Student;
  period: Period;
  group?: Group;
  status: 'pending' | 'document_submitted' | 'approved' | 'rejected' | 'completed';
  registration_date: string;
  documents: RegistrationDocument[];
}

export interface RegistrationDocument {
  id: number;
  document_type: string;
  file_path: string;
  file_name: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface DailyReport {
  id: number;
  student: Student;
  group: Group;
  date: string;
  title: string;
  activity: string;
  output?: string;
  status: 'draft' | 'submitted' | 'approved' | 'revision';
  files: DailyReportFile[];
}

export interface DailyReportFile {
  id: number;
  file_path: string;
  file_name: string;
}

export interface PageProps<T extends Record<string, unknown> = Record<string, unknown>> {
  auth: { user: User };
  flash?: {
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
  };
  errors?: Record<string, string>;
  [key: string]: unknown;
}
```

`resources/js/Layouts/AppLayout.tsx`
```tsx
import { PropsWithChildren } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

export default function AppLayout({
  title,
  children,
}: PropsWithChildren<{ title?: string }>) {
  const { auth, flash } = usePage<PageProps>().props;

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title={title} />

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-primary">
                  KKN UIN SAIZU
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700">{auth.user.username}</span>
            </div>
          </div>
        </div>
      </nav>

      {flash?.success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <p className="text-sm text-green-700">{flash.success}</p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
```

`resources/js/Pages/Dashboard.tsx`
```tsx
import { PageProps } from '@/types';
import AppLayout from '@/Layouts/AppLayout';

interface DashboardProps extends PageProps {
  stats: {
    total_students: number;
    total_groups: number;
    total_reports: number;
  };
}

export default function Dashboard({ stats }: DashboardProps) {
  return (
    <AppLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">Total Mahasiswa</h3>
          <p className="text-3xl font-bold text-primary mt-2">
            {stats.total_students}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">Total Kelompok</h3>
          <p className="text-3xl font-bold text-primary mt-2">
            {stats.total_groups}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">Laporan Harian</h3>
          <p className="text-3xl font-bold text-primary mt-2">
            {stats.total_reports}
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
```

`app/Http/Controllers/DashboardController.php`
```php
<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $stats = [
            'total_students' => \App\Models\Student::count(),
            'total_groups' => \App\Models\Group::count(),
            'total_reports' => \App\Models\DailyReport::count(),
        ];

        return Inertia::render('Dashboard', [
            'stats' => $stats,
        ]);
    }
}
```

---

## Development Phases (High Level)

1. Foundation (Weeks 1-3)
- Project setup
- Auth + roles
- Master data CRUD

2. Registration Flow (Weeks 4-6)
- Periods
- Registration + document upload
- Approval workflow

3. Core KKN Features (Weeks 7-12)
- Group assignment
- Daily report
- Proker
- Final report

4. Evaluation + Reporting (Weeks 13-16)
- Scoring
- Export (Excel/PDF)
- Dashboards

5. Polish + Testing (Weeks 17-20)

6. Deployment (Weeks 21-24)

---

## Coding Standards

Backend
- Repository + Service layer
- Form Requests for validation
- Policies for authorization
- PSR-12

Frontend
- Functional components + hooks
- TypeScript strict
- Small reusable components
- Tailwind utility-first styling

---

## Security Checklist

- Validate all inputs
- CSRF protection
- File upload validation (mime/size)
- Role-based access with Spatie
- Rate limiting for sensitive routes
- Audit logs for critical actions

---

## Performance Checklist

- Eager load relations
- Index foreign keys
- Cache master data in Redis
- Use queues for heavy jobs
- Enable OPcache

---

## Testing

Backend
- Pest tests for services and critical flows

Frontend
- Vitest for complex components

---

## Deployment Checklist (Summary)

- Configure .env
- Install dependencies
- Build assets
- Run migrations
- Setup queue workers
- Configure SSL
- Enable monitoring and backups
