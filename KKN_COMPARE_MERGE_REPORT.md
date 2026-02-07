# KKN Unified Analysis and Merge Plan

Date: 2026-02-06
Workspace: c:\laragon\www\KKN

Sources scanned:
- SI_KKN (CodeIgniter 2.0.3)
- LaraKKN (Laravel 7)
- KKN-ONLINE-UIN-SUSKA (Phalcon 3.x)
- SIG-Pemetaan-KKN (Laravel 10)

Notes and limitations:
- Only local repository contents were used. If any external integrations exist (SIA, email, SMS), they are not verified here.
- Some repositories do not include database schema or migrations. Where schema is missing, fields are inferred from models and queries and marked as estimated.


PHASE 1: REPOSITORY ANALYSIS

A. SI_KKN (CodeIgniter 2.0.3)

1. Tech Stack and Version
- Framework: CodeIgniter 2.0.3 (system/core/CodeIgniter.php)
- PHP requirement: Not specified in repo (legacy CI2, likely PHP 5.x)
- Database: Oracle (VARCHAR2 types in db/DB.txt)
- Frontend: jQuery 1.7/1.8, jQuery UI, Fancybox, Chosen, fileupload, Grocery CRUD
- CSS framework: Not explicit
- JavaScript library: jQuery, jQuery UI
- Package manager: None
- Additional dependencies: FPDF

2. Structure and Architecture
- Pattern: MVC (CodeIgniter)
- Main folders: application/, system/, assets/, templates/, uploads/
- Separation of concerns: Partial (controllers contain logic and view orchestration)
- Modularization: Low
- Code organization quality: 3/10

3. Database Schema
- Tables: 7 (KKN_MHS, KKN_TA, KKN_PERIODE, KKN_ANGKATAN, KKN_KELOMPOK, KKN_DETAIL_KELOMPOK, KKN_ADMIN)
- Relations: Yes (foreign keys to D_MAHASISWA, D_DOSEN, MD_KEC/KAB/PROP)
- Normalization: 2NF to 3NF (core entities separated)
- Index optimization: Unknown
- Migrations: No
- Seeders: No

4. Authentication and Authorization
- Authentication: Session data from SIA (login via external SIA)
- Role management: Admin, Dosen, Mahasiswa (status in session)
- Permission system: Hard-coded checks
- Session handling: PHP session
- Security features: CI form_validation, basic XSS cleaning

Functional coverage (summary)
- Student registration: Y
- Document upload: Y
- Registration status tracking: Y (SUDAH 1-3)
- DPL management: Partial (assignment and group views)
- Location management: Partial (codes stored, no GIS)
- Group management: Y
- Monitoring/logbook: N
- Reporting: Partial (export CSV/XLS, print cards)
- Proker: N
- Evaluation/scoring: N
- Dashboard: Basic
- Notifications: N
- API: N

Notes:
- Strong point: student biodata flow, document upload, group assignment, exports.
- Weak points: very old framework, no tests, no modern security practices, no GIS, no logbook, no proker.

5. Code Quality
- Naming consistency: 4/10
- Function length: Long in controllers
- Duplication: High
- Comment quality: 4/10
- Readability: 4/10

Best practices
- Dependency injection: No
- Repository pattern: No
- Service layer: No
- Request validation: Partial (form_validation)
- Error handling: Minimal
- Logging: No
- Environment configuration: No .env
- Security: Basic (XSS clean), no CSRF tokens observed

Testing
- Unit tests: No
- Feature tests: No
- Integration tests: No

Documentation
- README: Minimal (README.txt)
- Install guide: No
- ERD: No

Performance and Scalability
- Query optimization: Unknown
- Caching: No
- Pagination: Yes (admin list)
- Can handle 2000 concurrent users: Unlikely
- Estimated scalability: 3/10

UI/UX
- Design: 3/10
- Consistency: 4/10
- Responsiveness: 3/10
- Accessibility: 2/10
- Loading speed: Medium


B. LaraKKN (Laravel 7 + AdminLTE)

1. Tech Stack and Version
- Framework: Laravel 7 (composer.json)
- PHP requirement: ^7.2.5
- Database: MySQL (larakkn.sql)
- Frontend: AdminLTE, Bootstrap 4, jQuery, Vue 2
- CSS framework: Bootstrap 4
- JS libs: Chart.js, Dropzone, Pusher, Moment
- Package manager: Composer, NPM, Laravel Mix
- Additional dependencies: jeremykenedy/laravel-auth, laravel-roles, laravel2step

2. Structure and Architecture
- Pattern: MVC + Modules (nWidart)
- Main folders: app/, Modules/, resources/, database/
- Separation of concerns: Moderate
- Modularization: Medium (Student, Dosen, Assign modules)
- Code organization quality: 6/10

3. Database Schema
- Tables: 28 (SQL dump)
- Relations: Yes (roles, users, app-* domain tables)
- Normalization: 2NF-3NF
- Index optimization: Unknown
- Migrations: Yes (15) but domain tables mostly from SQL dump
- Seeders: Yes

4. Authentication and Authorization
- Authentication: Laravel Auth (jeremykenedy/laravel-auth)
- Role management: laravel-roles, role_user
- Permission system: role based, 2FA support
- Session handling: Laravel session
- Security features: CSRF, password hashing, recaptcha

Functional coverage (summary)
- Student registration: Partial (Laravel register, no dedicated KKN biodata flow)
- Document upload: Y (daily/final report attachments)
- Registration status tracking: Partial
- DPL management: Y (dosen dashboard, group assignment)
- Location management: N
- Group management: Y (group, token)
- Monitoring/logbook: Y (daily report)
- Reporting: Y (daily and final reports)
- Proker: Y (proposal, approval)
- Evaluation/scoring: N
- Dashboard: Y (AdminLTE)
- Notifications: Partial (Pusher available)
- API: N

Notes:
- Strong point: KKN workflow for proker, daily report, final report, group token.
- Weak point: no GIS, no placement algorithm, registration not aligned with SIA flow.

5. Code Quality
- Naming consistency: 6/10
- Function length: Medium to long (controllers using DB facade)
- Duplication: Medium
- Comment quality: 4/10
- Readability: 6/10

Best practices
- Dependency injection: Limited
- Repository pattern: No
- Service layer: No (direct DB queries)
- Request validation: Limited
- Error handling: Minimal
- Logging: Available (laravel-logger)
- Environment configuration: .env
- Security: CSRF, password hashing, roles, 2FA

Testing
- Unit tests: Minimal (framework defaults)
- Feature tests: Minimal
- Integration tests: No

Documentation
- README: Yes (install and features)
- Install guide: Yes
- ERD: No

Performance and Scalability
- Query optimization: Unknown
- Caching: No explicit
- Pagination: Limited
- Can handle 2000 concurrent users: Maybe with optimization
- Estimated scalability: 5/10

UI/UX
- Design: 6/10 (AdminLTE)
- Consistency: 6/10
- Responsiveness: 6/10
- Accessibility: 4/10
- Loading speed: Medium


C. KKN-ONLINE-UIN-SUSKA (Phalcon)

1. Tech Stack and Version
- Framework: Phalcon MVC (references to docs 3.3)
- PHP requirement: Not specified
- Database: MySQL (config.php)
- Frontend: Bootstrap, Owl Carousel, Magnific Popup
- CSS framework: Bootstrap
- JavaScript library: jQuery (likely)
- Package manager: Composer (only mpdf/mpdf)
- Additional dependencies: mpdf/mpdf

2. Structure and Architecture
- Pattern: MVC (Phalcon)
- Main folders: app/, public/
- Separation of concerns: Moderate
- Modularization: Low
- Code organization quality: 4/10

3. Database Schema
- Tables: Estimated 6 (mhs, kelompok, fakultas, jurusan, users, settings)
- Relations: Basic
- Normalization: 2NF
- Index optimization: Unknown
- Migrations: No
- Seeders: No

4. Authentication and Authorization
- Authentication: Custom Phalcon auth, session variables
- Role management: role field on users
- Permission system: Basic
- Session handling: Phalcon session
- Security features: Password hashing via Phalcon security

Functional coverage (summary)
- Student registration: N
- Document upload: N
- Registration status tracking: N
- DPL management: N
- Location management: N
- Group management: Partial (kelompok list)
- Monitoring/logbook: N
- Reporting: N (no evidence)
- Proker: N
- Evaluation/scoring: N
- Dashboard: Basic
- Notifications: N
- API: Partial (datatable JSON)

Notes:
- Strong point: simple admin management for basic entities.
- Weak point: lacks core KKN workflow modules.

5. Code Quality
- Naming consistency: 5/10
- Function length: Medium
- Duplication: Medium
- Comment quality: 3/10
- Readability: 5/10

Best practices
- Dependency injection: Limited (Phalcon DI)
- Repository pattern: No
- Service layer: No
- Request validation: Minimal
- Error handling: Minimal
- Logging: No
- Environment configuration: No .env
- Security: Basic hash check

Testing
- Unit tests: No
- Feature tests: No
- Integration tests: No

Documentation
- README: No
- Install guide: No
- ERD: No

Performance and Scalability
- Query optimization: Unknown
- Caching: No
- Pagination: Possible via datatables
- Can handle 2000 concurrent users: Unlikely
- Estimated scalability: 4/10

UI/UX
- Design: 5/10
- Consistency: 5/10
- Responsiveness: 5/10
- Accessibility: 3/10
- Loading speed: Medium


D. SIG-Pemetaan-KKN (Laravel 10 + GIS)

1. Tech Stack and Version
- Framework: Laravel 10 (composer.json)
- PHP requirement: ^8.1
- Database: MySQL (migrations)
- Frontend: Leaflet, Leaflet Draw, OpenStreetMap
- CSS framework: Custom + Leaflet styles
- JS library: Leaflet
- Package manager: Composer, NPM (Vite)
- Additional dependencies: Spatie permissions, Sanctum

2. Structure and Architecture
- Pattern: MVC + Service Layer
- Main folders: app/, app/Services, resources/, database/
- Separation of concerns: Good
- Modularization: Medium (services by domain)
- Code organization quality: 7/10

3. Database Schema
- Tables: 8 (users, password_reset_tokens, failed_jobs, personal_access_tokens, locations, groups, lecturers, permissions tables)
- Relations: Yes
- Normalization: 3NF
- Index optimization: Unknown
- Migrations: Yes
- Seeders: Yes

4. Authentication and Authorization
- Authentication: Laravel auth + Sanctum
- Role management: Spatie permission
- Permission system: RBAC
- Session handling: Laravel session
- Security features: CSRF, hashing

Functional coverage (summary)
- Student registration: N
- Document upload: N
- Registration status tracking: N
- DPL management: Partial (lecturer CRUD)
- Location management: Y (GIS)
- Group management: Y
- Monitoring/logbook: N
- Reporting: N
- Proker: N
- Evaluation/scoring: N
- Dashboard: Y (basic)
- Notifications: N
- API: Partial (Sanctum ready)

Notes:
- Strong point: GIS module and modern Laravel architecture.
- Weak point: lacks student workflow modules.

5. Code Quality
- Naming consistency: 7/10
- Function length: Medium
- Duplication: Low
- Comment quality: 4/10
- Readability: 7/10

Best practices
- Dependency injection: Yes
- Repository pattern: Partial (service layer)
- Service layer: Yes
- Request validation: Yes (FormRequest)
- Error handling: Basic
- Logging: Laravel default
- Environment configuration: .env
- Security: CSRF, hashing, RBAC

Testing
- Unit tests: Minimal
- Feature tests: Minimal
- Integration tests: No

Documentation
- README: Yes
- Install guide: Yes
- ERD: No

Performance and Scalability
- Query optimization: Unknown
- Caching: No explicit
- Pagination: Not seen
- Can handle 2000 concurrent users: Maybe with optimization
- Estimated scalability: 6/10

UI/UX
- Design: 6/10
- Consistency: 6/10
- Responsiveness: 6/10
- Accessibility: 4/10
- Loading speed: Medium


PHASE 2: COMPARATIVE MATRIX

| Aspect | SI_KKN | LaraKKN | UIN-SUSKA | SIG-Pemetaan | Winner | Notes |
|---|---|---|---|---|---|---|
| Framework | CI 2.0.3 | Laravel 7 | Phalcon 3.x | Laravel 10 | SIG-Pemetaan | Most modern and supported |
| Modernity | 2/10 | 6/10 | 4/10 | 9/10 | SIG-Pemetaan | PHP 8.1 + Laravel 10 |
| Community Support | 3/10 | 8/10 | 5/10 | 9/10 | SIG-Pemetaan | Laravel ecosystem |
| Online Registration | Yes | Partial | No | No | SI_KKN | Best student biodata flow |
| DPL Management | Partial | Yes | No | Partial | LaraKKN | Dosen dashboard + approvals |
| Location Placement | Partial | No | No | Yes | SIG-Pemetaan | GIS + location CRUD |
| Group Management | Yes | Yes | Partial | Yes | SI_KKN | Mature group assignment flow |
| Monitoring/Logbook | No | Yes | No | No | LaraKKN | Daily report module |
| Reporting | Partial | Yes | No | No | LaraKKN | Daily + final reports |
| Proker | No | Yes | No | No | LaraKKN | Proposal + approval workflow |
| Evaluation/Scoring | No | No | No | No | None | Build new |
| Dashboard | Basic | Yes | Basic | Basic | LaraKKN | AdminLTE dashboards |
| Code Quality | 3/10 | 6/10 | 4/10 | 7/10 | SIG-Pemetaan | Service layer + modern Laravel |
| Documentation | 3/10 | 6/10 | 2/10 | 6/10 | LaraKKN/SIG | Both have README |
| Security | 3/10 | 6/10 | 4/10 | 8/10 | SIG-Pemetaan | RBAC + Sanctum |
| Performance | 3/10 | 5/10 | 4/10 | 6/10 | SIG-Pemetaan | Newer stack |
| UI/UX | 3/10 | 6/10 | 5/10 | 6/10 | LaraKKN | AdminLTE |
| Ease to Customize | 3/10 | 6/10 | 4/10 | 7/10 | SIG-Pemetaan | Cleaner architecture |
| Maintainability | 2/10 | 5/10 | 4/10 | 7/10 | SIG-Pemetaan | Service layer |
| Scalability | 3/10 | 5/10 | 4/10 | 7/10 | SIG-Pemetaan | PHP 8.1 + Laravel 10 |
| Overall Score | 35/100 | 62/100 | 40/100 | 70/100 | SIG-Pemetaan | Best base for long term |


PHASE 3: MERGE STRATEGY

A. Base Framework Choice
Primary Choice: Laravel 10 (SIG-Pemetaan-KKN)
Reason:
- Modern and supported (PHP 8.1, Laravel 10)
- Already includes GIS and RBAC foundation
- Cleaner architecture with service layer

Alternative: Upgrade LaraKKN to Laravel 10
Reason:
- Rich KKN workflow modules already exist
- Larger feature coverage out of the box


B. Feature Mapping

1. Student Registration and Biodata
Ambil dari: SI_KKN
Alasan:
- Clear SIA-linked registration flow
- Document upload and status tracking
- Group visibility and export
Modifikasi yang diperlukan:
- Port to Laravel 10
- Replace Oracle-specific schema with MySQL
- Add email verification and audit logging
Estimasi effort: High
Priority: P0

2. DPL Management
Ambil dari: LaraKKN + SI_KKN
Alasan:
- Dosen dashboard and monitoring in LaraKKN
- Group assignment flow in SI_KKN
Modifikasi yang diperlukan:
- Unified DPL CRUD and role permissions
- Add workload calculation and limits
Estimasi effort: Medium
Priority: P0

3. Location and GIS Mapping
Ambil dari: SIG-Pemetaan-KKN
Alasan:
- Leaflet map integration
- Location CRUD with coordinates
- Group to location mapping
Modifikasi yang diperlukan:
- Add kuota per lokasi and filters
- Integrate with placement algorithm
Estimasi effort: Medium
Priority: P1

4. Group Formation
Ambil dari: SI_KKN + LaraKKN
Alasan:
- SI_KKN has mature group naming and assignment
- LaraKKN has group token features
Modifikasi yang diperlukan:
- Add auto grouping rules and constraints
- Add swap/transfer workflow
Estimasi effort: High
Priority: P0

5. Logbook and Daily Report
Ambil dari: LaraKKN
Alasan:
- Daily report workflow with attachments
- Dosen review view
Modifikasi yang diperlukan:
- Add approvals and timeline
- Add mobile friendly input
Estimasi effort: Medium
Priority: P1

6. Proker Management
Ambil dari: LaraKKN
Alasan:
- Proposal and approval flow already exists
Modifikasi yang diperlukan:
- Add budget planning and realization
- Add multi attachment
Estimasi effort: Medium
Priority: P1

7. Final Report
Ambil dari: LaraKKN
Alasan:
- Final report upload and review views
Modifikasi yang diperlukan:
- Add versioning and templates
Estimasi effort: Medium
Priority: P1

8. Evaluation and Scoring
Ambil dari: New module
Alasan:
- No repo provides full scoring workflow
Modifikasi yang diperlukan:
- Define criteria and weighting
- DPL + peer + community scoring
Estimasi effort: High
Priority: P1

9. Reporting and Export
Ambil dari: SI_KKN + KKN-ONLINE (mpdf) + LaraKKN
Alasan:
- SI_KKN has CSV/XLS exports
- KKN-ONLINE includes mpdf
- LaraKKN has reporting views
Modifikasi yang diperlukan:
- Central export service (CSV, XLSX, PDF)
- Role-based export permissions
Estimasi effort: Medium
Priority: P2

10. Notifications
Ambil dari: LaraKKN
Alasan:
- Pusher integration available
Modifikasi yang diperlukan:
- Queue-based notifications (email, in-app)
Estimasi effort: Medium
Priority: P2


C. Database Schema Unification (Proposed)

Core tables
- users (auth)
- roles, permissions (RBAC)
- user_profiles
- students
- lecturers
- academic_years
- periods
- batches (angkatan)
- locations
- groups
- group_members
- registrations
- registration_documents
- daily_reports
- daily_report_files
- proker
- proker_proposals
- proker_reviews
- final_reports
- final_report_files
- evaluations
- evaluation_items
- evaluation_scores
- announcements
- notifications
- audit_logs
- settings

Example core table
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role ENUM('admin','dpl','mahasiswa','koordinator','pimpinan'),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

Migration plan
1. Create auth and RBAC tables
2. Create master data tables (academic_years, periods, batches, faculties, programs)
3. Create location and group tables
4. Create registration and document tables
5. Create monitoring and report tables
6. Create evaluation tables
7. Add indexes and foreign keys


D. Architecture Design (Laravel 10)

Recommended structure
- app/Http/Controllers (split by role: Admin, DPL, Mahasiswa)
- app/Http/Requests (validation)
- app/Models (Eloquent)
- app/Services (business logic)
- app/Repositories (data access)
- app/Policies (authorization)
- resources/views (role specific layouts)
- database/migrations, database/seeders
- public/uploads (document storage)

Design patterns
- Repository Pattern
- Service Layer
- Strategy Pattern for placement algorithm
- Observer for notifications
- Factory for report generation


E. Integration Plan (Module Order)

| Module | Priority | Effort | Dependencies | Target Week |
|---|---|---|---|---|
| Auth and RBAC | P0 | M | None | Week 1-2 |
| User management | P0 | L | Auth | Week 2 |
| Master data (faculties, periods) | P0 | M | User mgmt | Week 3 |
| Student registration | P0 | H | Master data | Week 4-5 |
| DPL management | P0 | M | User mgmt | Week 5 |
| Group management | P0 | H | Registration | Week 6-7 |
| Placement and assignment | P0 | H | Group, DPL, locations | Week 7-8 |
| Dashboards | P1 | H | Above modules | Week 9 |
| Daily report | P1 | M | Dashboards | Week 10 |
| Proker | P1 | M | Dashboards | Week 10-11 |
| Final report | P1 | H | Daily report | Week 11-12 |
| Evaluation | P1 | M | Final report | Week 13 |
| GIS mapping | P2 | H | Locations | Week 14 |
| Reporting and export | P2 | M | All | Week 15 |
| Notifications | P2 | M | All | Week 16 |
| Mobile optimization | P3 | M | All | Week 17 |


PHASE 4: UI/UX UNIFICATION

Base UI framework recommendation: Bootstrap 5
Reason: easy migration from AdminLTE, good ecosystem, responsive by default.

Color palette (placeholder, confirm with UIN SAIZU branding)
- Primary: #0B6B3A
- Secondary: #1F8A5B
- Accent: #F2B705
- Success: #2E7D32
- Warning: #F9A825
- Danger: #C62828
- Info: #0277BD

Typography
- Heading: Poppins
- Body: Inter
- Monospace: JetBrains Mono

Component sources
- Buttons and forms: LaraKKN (AdminLTE) as baseline
- Tables and cards: LaraKKN + SIG-Pemetaan
- Maps: SIG-Pemetaan
- Charts: LaraKKN (Chart.js)


PHASE 5: SECURITY ENHANCEMENT

Security checklist
- Input validation: SIG-Pemetaan (FormRequest)
- SQL injection prevention: Laravel Eloquent
- XSS protection: Blade escaping
- CSRF protection: Laravel middleware
- Authentication: Laravel Auth + Sanctum
- Authorization: Spatie permissions
- File upload security: new validation and storage policies
- Password hashing: Laravel bcrypt/argon
- Session management: Laravel session
- API security: Sanctum
- Rate limiting: Laravel throttle
- Audit logging: use laravel-logger or custom audit_logs


PHASE 6: PERFORMANCE OPTIMIZATION

Database
- Add indexes on foreign keys and frequently filtered columns
- Use eager loading to avoid N+1 queries
- Use caching for static master data

Application
- Use queue for notifications and report exports
- Use lazy loading for heavy dashboard widgets
- Optimize asset pipeline (Vite)

Server
- PHP 8.1+ with OPcache enabled
- Redis for cache and queue


PHASE 7: TESTING STRATEGY

Unit tests
- Services (target 80%)
- Helpers (target 90%)
- Models (target 70%)

Feature tests
- Registration flow
- Placement algorithm
- Report submission
- Role access control

Integration tests
- API endpoints
- Map data endpoints

Performance tests
- Load test at 2000 concurrent users

Security tests
- Vulnerability scan and basic pen-test


PHASE 8: DEPLOYMENT PLAN

Environments
- Development: local setup
- Staging: staging.kkn.uinsaizu.ac.id
- Production: kkn.uinsaizu.ac.id

Server requirements (estimate for 2000 users)
- CPU: 4-8 cores
- RAM: 8-16 GB
- Storage: 200 GB (adjust for uploads)
- DB: MySQL 8
- Cache: Redis

Deployment checklist
- Configure .env
- Run migrations and seeders
- Set storage permissions
- Configure queue workers
- Configure cron jobs
- Enable SSL
- Set up monitoring and backups


PHASE 9: DOCUMENTATION

Technical
- Architecture diagram
- Database ERD
- API docs
- Deployment guide

User manuals
- Admin guide
- DPL guide
- Student guide

Developer
- Code structure and conventions
- Git workflow
- Contribution guide


DELIVERABLES SUMMARY

- This report provides a full comparison and merge strategy.
- Best base stack: Laravel 10 from SIG-Pemetaan-KKN, with KKN workflows ported from LaraKKN and registration flow adapted from SI_KKN.
- Next action: confirm branding (colors) and finalize unified database schema before development.
