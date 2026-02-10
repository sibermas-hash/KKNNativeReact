# KKN Management System - Database Migrations

## 1. Groups Table (KKN Groups)
```php
// database/migrations/2024_01_01_000001_create_groups_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('groups', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "Kelompok 1 - Dompet"
            $table->string('village'); // Desa name
            $table->string('district'); // Kecamatan
            $table->foreignId('dpl_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('village_head_id')->nullable()->constrained('users')->onDelete('set null');
            $table->integer('year'); // e.g., 2025
            $table->enum('status', ['active', 'completed', 'archived'])->default('active');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('groups');
    }
};
```

## 2. Group Members Table
```php
// database/migrations/2024_01_01_000002_create_group_members_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('group_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('role', ['member', 'coordinator'])->default('member');
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamps();
            
            $table->unique(['group_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_members');
    }
};
```

## 3. Scores Table (Multi-tiered Grading)
```php
// database/migrations/2024_01_01_000003_create_scores_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('group_id')->constrained()->onDelete('cascade');
            
            // DPL Scores (70% total)
            $table->decimal('proposal_score', 5, 2)->nullable(); // Not used in final calc
            $table->decimal('execution_score', 5, 2)->nullable(); // 40%
            $table->decimal('article_score', 5, 2)->nullable(); // 30%
            $table->decimal('final_report_score', 5, 2)->nullable(); // Used separately
            
            // Village Head Scores (30% total)
            $table->decimal('discipline_score', 5, 2)->nullable(); // 15%
            $table->decimal('attitude_score', 5, 2)->nullable(); // 15%
            
            // Calculated Fields
            $table->decimal('dpl_weighted_score', 5, 2)->nullable();
            $table->decimal('village_weighted_score', 5, 2)->nullable();
            $table->decimal('total_score', 5, 2)->nullable();
            $table->char('letter_grade', 2)->nullable();
            
            // Metadata
            $table->foreignId('dpl_graded_by')->nullable()->constrained('users');
            $table->foreignId('village_graded_by')->nullable()->constrained('users');
            $table->timestamp('dpl_graded_at')->nullable();
            $table->timestamp('village_graded_at')->nullable();
            
            $table->timestamps();
            
            $table->unique(['user_id', 'group_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scores');
    }
};
```

## 4. Reports Table (Document Management)
```php
// database/migrations/2024_01_01_000004_create_reports_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('group_id')->constrained()->onDelete('cascade');
            
            $table->enum('type', [
                'final_report',
                'village_map',
                'video_documentation',
                'photo_documentation',
                'attendance_sheet',
                'activity_proposal',
                'evaluation_report'
            ]);
            
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('file_path');
            $table->string('file_name');
            $table->string('mime_type');
            $table->unsignedBigInteger('file_size'); // in bytes
            
            $table->enum('status', [
                'draft',
                'submitted',
                'under_review',
                'revision_required',
                'approved',
                'rejected'
            ])->default('draft');
            
            $table->text('feedback')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['user_id', 'type']);
            $table->index(['group_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
```

## 5. Logbooks Table (Daily Activity)
```php
// database/migrations/2024_01_01_000005_create_logbooks_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('logbooks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('group_id')->constrained()->onDelete('cascade');
            
            $table->date('activity_date');
            $table->string('village'); // Desa
            $table->enum('activity_type', ['ACC', 'Tolak', 'Pending'])->default('Pending');
            $table->text('activity_description');
            $table->text('documentation')->nullable(); // JSON array of image paths
            
            $table->enum('approval_status', [
                'pending',
                'approved',
                'rejected',
                'revision_required'
            ])->default('pending');
            
            $table->text('feedback')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            
            $table->timestamps();
            
            $table->index(['user_id', 'activity_date']);
            $table->index(['group_id', 'approval_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('logbooks');
    }
};
```

## 6. Workshops Table
```php
// database/migrations/2024_01_01_000006_create_workshops_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workshops', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('methodology'); // e.g., "ABCD", "Participatory"
            $table->date('workshop_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('location');
            $table->integer('max_participants')->nullable();
            $table->enum('status', ['scheduled', 'ongoing', 'completed', 'cancelled'])->default('scheduled');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workshops');
    }
};
```

## 7. Workshop Participants Table
```php
// database/migrations/2024_01_01_000007_create_workshop_participants_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workshop_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workshop_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            $table->timestamp('registered_at')->useCurrent();
            $table->enum('attendance_status', [
                'registered',
                'attended',
                'absent',
                'excused'
            ])->default('registered');
            
            $table->timestamp('checked_in_at')->nullable();
            $table->boolean('certificate_generated')->default(false);
            $table->string('certificate_path')->nullable();
            $table->timestamp('certificate_issued_at')->nullable();
            
            $table->timestamps();
            
            $table->unique(['workshop_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workshop_participants');
    }
};
```

## 8. Proposals Table
```php
// database/migrations/2024_01_01_000008_create_proposals_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('group_id')->constrained()->onDelete('cascade');
            
            $table->string('title');
            $table->string('program_title');
            $table->string('program_department'); // Program Studi/Fakultas
            $table->integer('team_member_count');
            $table->json('team_members'); // Array of member details
            $table->decimal('budget', 15, 2)->nullable();
            $table->text('objectives')->nullable();
            
            $table->enum('status', [
                'draft',
                'submitted',
                'under_review',
                'approved',
                'rejected',
                'revision_required'
            ])->default('draft');
            
            $table->text('feedback')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proposals');
    }
};
```

## 9. Notifications Table
```php
// database/migrations/2024_01_01_000009_create_notifications_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type'); // e.g., 'logbook_approved', 'report_reviewed'
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable(); // Additional metadata
            $table->boolean('read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            
            $table->index(['user_id', 'read']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
```

## Database Relationships Summary

### User Model Relationships:
- `hasMany(GroupMember)` - as student
- `hasMany(Group)` - as DPL
- `hasMany(Group)` - as village head
- `hasOne(Score)` - per group
- `hasMany(Report)`
- `hasMany(Logbook)`
- `hasMany(WorkshopParticipant)`
- `hasMany(Proposal)`

### Group Model Relationships:
- `belongsTo(User, 'dpl_id')`
- `belongsTo(User, 'village_head_id')`
- `hasMany(GroupMember)`
- `hasMany(Score)`
- `hasMany(Report)`
- `hasMany(Logbook)`

### Score Model Relationships:
- `belongsTo(User)`
- `belongsTo(Group)`
- `belongsTo(User, 'dpl_graded_by')`
- `belongsTo(User, 'village_graded_by')`

This schema supports:
✅ Multi-tiered grading
✅ Document management with workflow
✅ Daily logbook approval
✅ Workshop certification
✅ Real-time notifications
