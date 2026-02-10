Berikut adalah production-grade implementation plan untuk membangun ulang sistem KKN modern berbasis Laravel 12 + Inertia + React + Tailwind, terinspirasi Kampelmas tetapi dengan arsitektur yang jauh lebih bersih, scalable, dan premium.

Saya susun berurutan:

Database Schema

Backend Architecture (Services, Models, Logic)

Document Management

Logbook Workflow

Workshop & Certificate

Frontend Inertia React Architecture

Premium UI System

Deployment & Scaling Strategy

1. DATABASE SCHEMA (FOUNDATION)

Gunakan pendekatan Domain-driven modular schema

Core Entities
users
groups
group_members
villages
kkn_periods

Migration: groups
Schema::create('groups', function (Blueprint $table) {
    $table->id();

    $table->string('name');
    $table->foreignId('kkn_period_id')->constrained();
    $table->foreignId('village_id')->constrained();

    $table->foreignId('dpl_id')
        ->constrained('users');

    $table->timestamps();
});

group_members
Schema::create('group_members', function (Blueprint $table) {

    $table->id();

    $table->foreignId('group_id')->constrained();

    $table->foreignId('user_id')->constrained();

    $table->boolean('is_leader')->default(false);

});

2. ADVANCED MULTI-TIER GRADING SYSTEM

Gunakan pendekatan separate grading sources

JANGAN simpan semua di satu tabel.

Pisahkan:

dpl_grades
village_grades
final_grades (computed cache)

Migration: dpl_grades
Schema::create('dpl_grades', function (Blueprint $table) {

    $table->id();

    $table->foreignId('student_id')
        ->constrained('users');

    $table->foreignId('group_id')
        ->constrained();

    $table->foreignId('dpl_id')
        ->constrained('users');

    $table->decimal('final_report',5,2);
    $table->decimal('execution',5,2);
    $table->decimal('article',5,2);

    $table->timestamps();

});

village_grades
Schema::create('village_grades', function (Blueprint $table) {

    $table->id();

    $table->foreignId('student_id')
        ->constrained('users');

    $table->foreignId('group_id')
        ->constrained();

    $table->decimal('discipline',5,2);
    $table->decimal('attitude',5,2);

    $table->timestamps();

});

final_grades (cached computed)

IMPORTANT for performance

Schema::create('final_grades', function (Blueprint $table) {

    $table->id();

    $table->foreignId('student_id')->unique();

    $table->decimal('total_score',5,2);

    $table->string('letter_grade',2);

    $table->timestamps();

});

3. GRADE CALCULATION SERVICE (CRITICAL)

app/Services/GradeService.php

namespace App\Services;

use App\Models\DplGrade;
use App\Models\VillageGrade;
use App\Models\FinalGrade;

class GradeService
{

    public function calculate(int $studentId): FinalGrade
    {

        $dpl = DplGrade::where('student_id',$studentId)->first();

        $village = VillageGrade::where('student_id',$studentId)->first();

        if(!$dpl || !$village)
            throw new \Exception('Incomplete grading');


        $dplScore =
            ($dpl->final_report * 0.30) +
            ($dpl->execution * 0.40) +
            ($dpl->article * 0.30);


        $villageScore =
            ($village->discipline + $village->attitude) / 2;


        // final weight example
        $total =
            ($dplScore * 0.7) +
            ($villageScore * 0.3);


        $letter = $this->mapLetter($total);


        return FinalGrade::updateOrCreate(
            ['student_id'=>$studentId],
            [
                'total_score'=>$total,
                'letter_grade'=>$letter
            ]
        );

    }


    private function mapLetter($score)
    {

        return match(true) {

            $score >= 85 => 'A',
            $score >= 80 => 'A-',
            $score >= 75 => 'B+',
            $score >= 70 => 'B',
            $score >= 65 => 'C+',
            $score >= 60 => 'C',
            default => 'D'
        };

    }

}

4. REPORT MANAGEMENT SYSTEM

Use ENUM Type

reports migration
Schema::create('reports', function (Blueprint $table) {

    $table->id();

    $table->foreignId('student_id')->constrained();

    $table->foreignId('group_id')->constrained();

    $table->enum('type',[
        'FINAL_REPORT',
        'VILLAGE_MAP',
        'VIDEO',
        'ARTICLE',
        'JOURNAL',
        'OUTCOME',
        'OTHER'
    ]);

    $table->string('file_path');

    $table->enum('status',[
        'DRAFT',
        'SUBMITTED',
        'APPROVED',
        'REVISION'
    ])->default('DRAFT');

    $table->timestamps();

});

Storage Service
app/Services/ReportService.php

class ReportService
{

    public function upload($user,$file,$type)
    {

        $path = $file->store(
            "reports/{$user->id}",
            'public'
        );


        return Report::updateOrCreate(
            [
                'student_id'=>$user->id,
                'type'=>$type
            ],
            [
                'file_path'=>$path,
                'status'=>'SUBMITTED'
            ]
        );

    }

}

5. LOGBOOK SYSTEM
migration
Schema::create('logbooks', function (Blueprint $table) {

    $table->id();

    $table->foreignId('student_id');

    $table->foreignId('group_id');

    $table->date('date');

    $table->text('activity');

    $table->enum('status',[
        'PENDING',
        'APPROVED',
        'REJECTED'
    ])->default('PENDING');

    $table->foreignId('approved_by')
        ->nullable()
        ->constrained('users');

    $table->timestamps();

});

Logbook Approval Service
class LogbookService
{

    public function approve(Logbook $logbook, User $dpl)
    {

        $logbook->update([
            'status'=>'APPROVED',
            'approved_by'=>$dpl->id
        ]);

    }

}

6. WORKSHOP SYSTEM
workshops
Schema::create('workshops', function (Blueprint $table){

    $table->id();

    $table->string('title');

    $table->date('date');

});

workshop_participants
Schema::create('workshop_participants', function(Blueprint $table){

    $table->id();

    $table->foreignId('workshop_id');

    $table->foreignId('user_id');

    $table->boolean('attended')->default(false);

});

Certificate Service
use Barryvdh\DomPDF\Facade\Pdf;

class CertificateService
{

    public function generate(User $user, Workshop $workshop)
    {

        $pdf = Pdf::loadView('certificates.template',[
            'user'=>$user,
            'workshop'=>$workshop
        ]);

        return $pdf->download();

    }

}

7. REACT INERTIA FRONTEND
File Upload Component
import { useForm } from '@inertiajs/react'

export default function UploadReport(){

    const { data,setData,post,progress } = useForm({
        file:null,
        type:'FINAL_REPORT'
    })

    function submit(e){
        e.preventDefault()

        post('/reports')
    }

    return (

        <form onSubmit={submit}>

            <input
                type="file"
                onChange={e=>setData('file',e.target.files[0])}
            />

            {progress &&
                <progress value={progress.percentage} max="100"/>
            }

            <button>Upload</button>

        </form>

    )

}

8. DPL Dashboard (Pending Approvals)

Controller

$pending = Logbook::where('status','PENDING')
    ->where('group_id',$dpl->group_id)
    ->count();


React Card

<Card>
    <CardTitle>Pending Approvals</CardTitle>
    <CardValue>{pending}</CardValue>
</Card>

9. PREMIUM UI ARCHITECTURE

Stack:

Tailwind
shadcn/ui
Framer Motion
Lucide Icons
Headless UI


Layout structure:

resources/js/
    Layouts/
        AppLayout.jsx

    Pages/
        Dashboard.jsx
        Reports/
        Logbook/
        Grades/

    Components/
        AnalyticsCard.jsx
        UploadZone.jsx
        DataTable.jsx


Example Analytics Card

<Card className="backdrop-blur-xl bg-white/10">

    <Users/>

    <div>Students</div>

    <div className="text-3xl font-bold">
        {count}
    </div>

</Card>

10. DASHBOARD METRICS QUERIES

Completion rate

Report::where('status','APPROVED')
    ->count()


Pending grading

FinalGrade::whereNull('total_score')

11. FINAL PRODUCTION ARCHITECTURE
Laravel
    Models
    Services
    Actions

React Inertia
    Pages
    Components

Storage
    S3

Queue
    Redis

Cache
    Redis

PDF
    DomPDF

Auth
    Laravel Sanctum

12. OPTIONAL ENTERPRISE FEATURES (RECOMMENDED)

Add later:

• real-time notifications
• auto grade calculation via Observer
• certificate auto generation
• audit logs
• role permissions

RESULT

This architecture is:

• scalable
• production-grade
• clean
• modular
• faster than Kampelmas
• future-proof

If you want, next I can generate:

• Full migration files ready to paste
• Full Service Classes ready
• Full React Pages ready

Just say:
"generate full production code"


-----------


This is a comprehensive architectural plan to rebuild the KKN Management System using Laravel 12 (Jetstream/Inertia), React, and Tailwind CSS. I have focused on modernizing the "Kampelmas" workflow while strictly adhering to your business logic requirements.Phase 1: Database Schema Design (Migrations)We need a structured schema to handle the multi-role grading and document workflows.PHP// database/migrations/xxxx_create_kkn_schema_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. KKN Groups (Kelompok)
        Schema::create('kkn_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "Kelompok 51"
            $table->foreignId('dpl_id')->constrained('users'); // Field Supervisor
            $table->foreignId('village_head_id')->nullable()->constrained('users'); // Village Head
            $table->string('village_name');
            $table->year('academic_year');
            $table->timestamps();
        });

        // 2. Student Registrations (Links User to Group)
        Schema::create('kkn_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('kkn_group_id')->constrained()->cascadeOnDelete();
            $table->enum('role', ['member', 'leader'])->default('member');
            $table->timestamps();
        });

        // 3. Reports (Documents)
        Schema::create('kkn_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kkn_registration_id')->constrained()->cascadeOnDelete();
            $table->enum('type', [
                'final_report', 'village_map', 'video_link', 'activity_plan', 
                'daily_log', 'financial_report', 'article_draft'
            ]);
            $table->string('file_path')->nullable(); // S3 or Local path
            $table->string('external_link')->nullable(); // For YouTube videos
            $table->enum('status', ['draft', 'submitted', 'approved', 'revision_required'])->default('draft');
            $table->text('feedback')->nullable(); // DPL Feedback
            $table->timestamps();
        });

        // 4. Logbooks
        Schema::create('kkn_logbooks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kkn_registration_id')->constrained();
            $table->date('activity_date');
            $table->text('activity_description');
            $table->json('evidence_photos')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamps();
        });

        // 5. Grades (Multi-Tiered)
        Schema::create('kkn_grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kkn_registration_id')->constrained()->unique();
            
            // DPL Components (Academic)
            $table->decimal('score_report', 5, 2)->default(0);      // 30%
            $table->decimal('score_execution', 5, 2)->default(0);   // 40%
            $table->decimal('score_article', 5, 2)->default(0);     // 30%
            
            // Village Head Components (Social)
            $table->decimal('score_discipline', 5, 2)->default(0);
            $table->decimal('score_attitude', 5, 2)->default(0); // Sikap
            
            // Aggregates
            $table->decimal('final_score', 5, 2)->nullable();
            $table->string('grade_letter', 2)->nullable(); // A, B+, etc.
            
            $table->boolean('is_finalized')->default(false);
            $table->timestamps();
        });

        // 6. Workshops
        Schema::create('workshops', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->dateTime('start_time');
            $table->dateTime('end_time');
            $table->string('location');
            $table->string('certificate_template_path')->nullable();
            $table->timestamps();
        });

        Schema::create('workshop_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workshop_id')->constrained();
            $table->foreignId('user_id')->constrained();
            $table->boolean('attended')->default(false);
            $table->string('certificate_number')->nullable()->unique();
            $table->timestamps();
        });
    }
};
Phase 2: Backend Services (Business Logic)We will use a Service Pattern to keep Controllers clean.1. The Grading Service (app/Services/GradingService.php)This handles the specific weighting logic requested.PHPnamespace App\Services;

use App\Models\KknGrade;

class GradingService
{
    /**
     * Calculate Final Score based on weighted components.
     * Logic: 
     * Academic Score = (Report * 0.3) + (Execution * 0.4) + (Article * 0.3)
     * Social Score = (Discipline + Attitude) / 2
     * Final = (Academic * 0.6) + (Social * 0.4)  <-- Assumption on split, adjust as needed.
     */
    public function calculateGrade(KknGrade $grade): void
    {
        // 1. Calculate DPL Component (Academic)
        $academicScore = (
            ($grade->score_report * 0.30) +
            ($grade->score_execution * 0.40) +
            ($grade->score_article * 0.30)
        );

        // 2. Calculate Village Head Component (Social)
        // If not input yet, treat as 0 or exclude depending on logic
        $socialScore = ($grade->score_discipline + $grade->score_attitude) / 2;

        // 3. Final Aggregation (Example: 70% Academic, 30% Social)
        $total = ($academicScore * 0.70) + ($socialScore * 0.30);

        $grade->final_score = $total;
        $grade->grade_letter = $this->mapScoreToLetter($total);
        $grade->save();
    }

    private function mapScoreToLetter(float $score): string
    {
        return match (true) {
            $score >= 85 => 'A',
            $score >= 80 => 'A-',
            $score >= 75 => 'B+',
            $score >= 70 => 'B',
            $score >= 65 => 'B-',
            $score >= 60 => 'C+',
            $score >= 55 => 'C',
            default => 'D',
        };
    }
}
2. Certificate Generation (app/Services/CertificateService.php)Using barryvdh/laravel-dompdf.PHPnamespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\WorkshopParticipant;

class CertificateService
{
    public function generate(WorkshopParticipant $participant)
    {
        $data = [
            'name' => $participant->user->name,
            'workshop' => $participant->workshop->title,
            'date' => $participant->workshop->start_time->format('d F Y'),
            'number' => $participant->certificate_number,
        ];

        $pdf = Pdf::loadView('certificates.workshop_default', $data);
        $pdf->setPaper('a4', 'landscape');
        
        return $pdf->stream('certificate.pdf');
    }
}
Phase 3: Frontend Implementation (React + Inertia + Tailwind)To achieve the "WOW" factor, we will use a Glassmorphism design system.1. The Layout (Shell)Use a dark sidebar with a glass-effect main content area.JavaScript// resources/js/Layouts/AppLayout.jsx
import { Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, FileText, CheckSquare, Users } from 'lucide-react';

export default function AppLayout({ children }) {
    const { auth } = usePage().props;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex font-sans selection:bg-indigo-500 selection:text-white">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col p-6 hidden md:flex">
                <div className="text-2xl font-bold text-indigo-400 mb-10 tracking-tighter">
                    KKN<span className="text-white">PRO</span>
                </div>
                
                <nav className="space-y-2 flex-1">
                    <NavLink href={route('dashboard')} icon={LayoutDashboard} active={route().current('dashboard')}>
                        Dashboard
                    </NavLink>
                    <NavLink href={route('logbooks.index')} icon={CheckSquare} active={route().current('logbooks.*')}>
                        Logbook
                    </NavLink>
                    <NavLink href={route('reports.index')} icon={FileText} active={route().current('reports.*')}>
                        Reports & Docs
                    </NavLink>
                </nav>
            </aside>

            {/* Main Content with Glass Effect */}
            <main className="flex-1 p-4 md:p-8 relative overflow-hidden">
                {/* Ambient Background Glow */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -z-10 transform -translate-x-1/2 -translate-y-1/2"></div>
                
                <div className="backdrop-blur-xl bg-gray-800/40 border border-white/5 rounded-3xl h-full shadow-2xl overflow-y-auto p-6 md:p-10">
                    {children}
                </div>
            </main>
        </div>
    );
}

const NavLink = ({ href, active, icon: Icon, children }) => (
    <Link 
        href={href} 
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group
            ${active 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
    >
        <Icon size={20} className={active ? 'text-white' : 'text-gray-500 group-hover:text-indigo-400'} />
        <span className="font-medium">{children}</span>
    </Link>
);
2. Report Upload Component (Progressive UI)Replaces the standard file input with a drag-and-drop zone using useForm for progress.JavaScript// resources/js/Pages/Reports/Partials/UploadCard.jsx
import { useForm } from '@inertiajs/react';
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';

export default function UploadCard({ type, label, existingReport }) {
    const { data, setData, post, progress, processing } = useForm({
        file: null,
        type: type
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('reports.store'), { preserveScroll: true });
    };

    return (
        <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6 relative group hover:border-indigo-500/50 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-white">{label}</h3>
                    <p className="text-sm text-gray-400">PDF, Max 5MB</p>
                </div>
                {existingReport?.status === 'approved' ? (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/20 flex items-center gap-1">
                        <CheckCircle size={12} /> Approved
                    </span>
                ) : (
                    <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded-full border border-yellow-500/20">
                        {existingReport ? existingReport.status : 'Pending'}
                    </span>
                )}
            </div>

            <form onSubmit={submit} className="mt-4">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-700 border-dashed rounded-xl cursor-pointer hover:bg-gray-800 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 text-indigo-500 mb-2" />
                        <p className="text-sm text-gray-400">
                            {data.file ? data.file.name : "Click to upload"}
                        </p>
                    </div>
                    <input 
                        type="file" 
                        className="hidden" 
                        onChange={e => setData('file', e.target.files[0])} 
                    />
                </label>

                {progress && (
                    <div className="w-full bg-gray-700 rounded-full h-1.5 mt-4">
                        <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${progress.percentage}%` }}></div>
                    </div>
                )}

                <button 
                    disabled={processing || !data.file}
                    className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {processing ? 'Uploading...' : 'Submit Report'}
                </button>
            </form>
        </div>
    );
}
3. Logbook with Partial Reloads (DPL View)Instead of a table, use a card grid for pending approvals.JavaScript// resources/js/Pages/DPL/LogbookReview.jsx
import { router } from '@inertiajs/react';

export default function LogbookReview({ logbooks }) { // logbooks passed as prop from Controller
    
    const handleAction = (id, status) => {
        router.patch(route('dpl.logbooks.update', id), { status }, {
            preserveScroll: true,
            onSuccess: () => {
                // Optional toast notification here
            }
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {logbooks.data.map((log) => (
                <div key={log.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                        <img 
                            src={log.student.avatar_url} 
                            className="w-10 h-10 rounded-full bg-gray-700 object-cover" 
                        />
                        <div>
                            <h4 className="font-semibold text-white">{log.student.name}</h4>
                            <p className="text-xs text-gray-400">{log.activity_date}</p>
                        </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                        {log.activity_description}
                    </p>

                    <div className="flex gap-2 mt-auto">
                        <button 
                            onClick={() => handleAction(log.id, 'approved')}
                            className="flex-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 py-2 rounded-lg text-sm font-medium border border-green-600/20 transition-all"
                        >
                            Accept
                        </button>
                        <button 
                            onClick={() => handleAction(log.id, 'rejected')}
                            className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 py-2 rounded-lg text-sm font-medium border border-red-600/20 transition-all"
                        >
                            Reject
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
Mathematical Logic for GradingTo ensure transparency in the "GradeCalculatorService", the formula used for the final calculation is:$$Score_{Final} = (S_{Report} \times 0.3) + (S_{Execution} \times 0.4) + (S_{Article} \times 0.3)$$Note: This formula applies to the Academic portion. If the Village Head's score is integrated, the formula expands:$$Score_{Total} = (Score_{Final} \times W_{Academic}) + (\frac{S_{Discipline} + S_{Attitude}}{2} \times W_{Social})$$Where $W_{Academic}$ and $W_{Social}$ are the weights assigned to the DPL and Village Head respectively (e.g., 0.6 and 0.4).Next Steps

--------

We are building a KKN Management System with Laravel, Inertia.js, React, and Tailwind CSS. The system has multiple features including a multi-tiered grading system, document management, logbook approval, workshop management, and certificate generation.

We'll break down the implementation into steps:

Step 1: Database Schema
We need to create the following tables:

users (already exists by default, but we'll add roles: student, dpl, village_head, admin, etc.)

groups (for KKN groups)

group_members (many-to-many between users and groups)

reports (for the 7 types of reports)

grades (for storing grades from DPL and Village Head)

logbooks (for daily activities)

workshops (for workshop sessions)

workshop_registrations (for students registering for workshops)

certificates (for generated certificates)

Let's design the tables:

users table (extended)
We'll add a role column and maybe other necessary columns.

groups table
id

name (e.g., "Kelompok 1 / Jompo")

village_name

dpl_id (foreign key to users, where role is DPL)

created_at, updated_at

group_members table
id

group_id

user_id (student)

created_at

reports table
id

group_id

type (enum: ['final_report', 'village_map', 'video', 'article', 'recognition', 'journal', 'outcome'])

file_path

status (enum: ['draft', 'submitted', 'approved', 'revision_required'])

submitted_at

reviewed_at

reviewer_id (foreign key to users, e.g., DPL)

created_at, updated_at

grades table
We have multiple graders: DPL and Village Head. We can structure it as:

id

group_id

student_id (user_id)

grader_id (user_id of the grader, either DPL or Village Head)

grader_type (enum: ['dpl', 'village_head']) to distinguish

criteria_1 (for DPL: final_report, execution, article; for Village Head: discipline, attitude)

criteria_2

criteria_3 (only for DPL, village head only has two criteria)

total_score (calculated, but we can store for caching)

letter_grade (calculated, stored for caching)

created_at, updated_at

Alternatively, we can have two separate tables for DPL grades and Village Head grades. But to keep it flexible, let's use one table with dynamic criteria.

However, the grading criteria are fixed:

DPL: final_report (30%), execution (40%), article (30%)

Village Head: discipline (50%), attitude (50%)

We can store the scores in a JSON column for flexibility, but for simplicity and querying, let's use separate columns.

We'll create two tables:

dpl_grades

id

group_id

student_id

dpl_id (foreign key to users)

final_report_score

execution_score

article_score

total_score (calculated: 0.3*final_report + 0.4*execution + 0.3*article)

letter_grade (mapped from total_score)

created_at, updated_at

village_head_grades

id

group_id

student_id

village_head_id (foreign key to users)

discipline_score

attitude_score

total_score (calculated: 0.5*discipline + 0.5*attitude)

letter_grade (mapped from total_score)

created_at, updated_at

Then, for the final grade, we need to combine the DPL grade and the Village Head grade. We can do this in a view or a computed attribute.

But note: the final grade also includes LPPM? In the screenshot, there is an LPPM column. We need to clarify what LPPM is. Let's assume it's another grader.

We might have multiple graders, so a more flexible schema might be better.

Alternatively, we can have a grade_items table that defines the grading criteria and their weights, and then a grades table that stores the score for each student for each criterion by each grader.

But given the complexity, let's stick to the two fixed graders (DPL and Village Head) and fixed criteria.

We'll add an lppm_grades table if needed.

However, in the screenshot, the "Input Nilai KKN (DESA+LPPM)" shows that the village head and LPPM scores are input together. So maybe LPPM is part of the village head? Or a separate entity.

Let's assume LPPM is a separate grader with its own criteria.

We'll design:

grader_types table (to define the graders: DPL, Village Head, LPPM)

id

name

description

grading_criteria table (to define the criteria for each grader type)

id

grader_type_id

name

weight (decimal)

grades table

id

student_id

group_id

grader_type_id

grading_criterion_id

score

created_at, updated_at

But this might be overkill for now.

Given the time, we'll stick to the fixed graders and criteria as per the requirement.

We'll have:

DPL: final_report (30%), execution (40%), article (30%)

Village Head: discipline (50%), attitude (50%)

LPPM: (maybe a separate score, but in the screenshot it's a column in the same table as village head)

In the screenshot "Input Nilai KKN (DESA+LPPM)", there are columns for Keaktifan, Kedisiplinan, and LPPM. So it seems the village head inputs Keaktifan and Kedisiplinan, and LPPM inputs a score. Then in the rekap, there are separate columns for Kedisiplinan, Sikap (from village head) and LPPM.

Let's break down the final grade as per the rekap table in screenshot 10:

Columns: DPL, Proposal, Pelaksanaan, Artikel, Kedisiplinan, Sikap, LPPM, Total, Huruf.

Wait, in the rekap, there is no separate DPL column, but there are Proposal, Pelaksanaan, Artikel (which are from DPL). Then Kedisiplinan and Sikap from village head, and LPPM from LPPM.

So the total grade is calculated from:

Proposal (from DPL) -> 30%

Pelaksanaan (from DPL) -> 40%

Artikel (from DPL) -> 30%

Kedisiplinan (from village head) -> 50% of village head grade?

Sikap (from village head) -> 50% of village head grade?

LPPM (from LPPM) -> 100% of LPPM grade?

But then how are these combined? In the rekap, the Total column is calculated from all these? We need to know the weight of each grader's contribution.

Let's assume the final grade is calculated as:
Total = (DPL_total * 0.4) + (Village_head_total * 0.3) + (LPPM_total * 0.3)

Where:

DPL_total = (Proposal*0.3 + Pelaksanaan*0.4 + Artikel*0.3)

Village_head_total = (Kedisiplinan*0.5 + Sikap*0.5)

LPPM_total = LPPM (as is, out of 100)

But without the exact weights, we cannot be sure.

For now, we'll design the database to store the scores as per the graders and then we can adjust the calculation in the service class.

We'll create three tables for grades:

dpl_grades (for DPL scores)

village_head_grades (for village head scores)

lppm_grades (for LPPM scores)

And then a view or a computed total grade.

Alternatively, we can store all grades in one table with a polymorphic relation to the grader (DPL, VillageHead, LPPM). But since the criteria are different, it's easier to separate.

Let's go with three tables.

logbooks table
id

student_id

group_id

activity_date

activity (text)

status (enum: ['pending', 'approved', 'rejected'])

reviewed_by (user_id, the DPL)

reviewed_at

created_at, updated_at

workshops table
id

title

description

start_date

end_date

location

max_participants

created_at, updated_at

workshop_registrations table
id

workshop_id

student_id

registered_at

attended (boolean, default false)

created_at, updated_at

certificates table
id

workshop_registration_id

certificate_number

file_path

issued_at

created_at, updated_at

Step 2: Backend Services
We'll create Laravel models, migrations, and service classes.

2.1. Grading Service
We need a service class that can calculate the total grade and letter grade for a student.

Let's create a GradingService class.

We'll define the weights in a config file or in the service.

Example:

php
namespace App\Services;

use App\Models\DplGrade;
use App\Models\VillageHeadGrade;
use App\Models\LppmGrade;

class GradingService
{
    // Weights for DPL components
    const DPL_WEIGHTS = [
        'final_report' => 0.3,
        'execution' => 0.4,
        'article' => 0.3,
    ];

    // Weights for Village Head components
    const VILLAGE_HEAD_WEIGHTS = [
        'discipline' => 0.5,
        'attitude' => 0.5,
    ];

    // Weights for each grader in the final grade
    const GRADER_WEIGHTS = [
        'dpl' => 0.4,
        'village_head' => 0.3,
        'lppm' => 0.3,
    ];

    public function calculateTotalGrade($studentId, $groupId)
    {
        // Get grades from each grader
        $dplGrade = DplGrade::where('student_id', $studentId)->where('group_id', $groupId)->first();
        $villageHeadGrade = VillageHeadGrade::where('student_id', $studentId)->where('group_id', $groupId)->first();
        $lppmGrade = LppmGrade::where('student_id', $studentId)->where('group_id', $groupId)->first();

        // Calculate weighted score for each grader
        $dplTotal = $this->calculateDplTotal($dplGrade);
        $villageHeadTotal = $this->calculateVillageHeadTotal($villageHeadGrade);
        $lppmTotal = $lppmGrade ? $lppmGrade->score : 0;

        // Calculate final total
        $finalTotal = 
            $dplTotal * self::GRADER_WEIGHTS['dpl'] +
            $villageHeadTotal * self::GRADER_WEIGHTS['village_head'] +
            $lppmTotal * self::GRADER_WEIGHTS['lppm'];

        $letterGrade = $this->convertToLetterGrade($finalTotal);

        return [
            'total' => $finalTotal,
            'letter_grade' => $letterGrade,
        ];
    }

    private function calculateDplTotal($dplGrade)
    {
        if (!$dplGrade) {
            return 0;
        }

        return 
            $dplGrade->final_report_score * self::DPL_WEIGHTS['final_report'] +
            $dplGrade->execution_score * self::DPL_WEIGHTS['execution'] +
            $dplGrade->article_score * self::DPL_WEIGHTS['article'];
    }

    private function calculateVillageHeadTotal($villageHeadGrade)
    {
        if (!$villageHeadGrade) {
            return 0;
        }

        return 
            $villageHeadGrade->discipline_score * self::VILLAGE_HEAD_WEIGHTS['discipline'] +
            $villageHeadGrade->attitude_score * self::VILLAGE_HEAD_WEIGHTS['attitude'];
    }

    private function convertToLetterGrade($score)
    {
        if ($score >= 85) {
            return 'A';
        } elseif ($score >= 80) {
            return 'A-';
        } elseif ($score >= 75) {
            return 'B+';
        } elseif ($score >= 70) {
            return 'B';
        } elseif ($score >= 65) {
            return 'B-';
        } elseif ($score >= 60) {
            return 'C+';
        } elseif ($score >= 55) {
            return 'C';
        } elseif ($score >= 50) {
            return 'C-';
        } elseif ($score >= 45) {
            return 'D';
        } else {
            return 'E';
        }
    }
}
We can then use this service in a controller to calculate and store the total grade.

2.2. Report Management
We'll create a model and controller for reports. The report submission will be handled by a form request that validates the file type and stores it in the storage.

We'll use Laravel's filesystem to store the reports. We can configure the disk to be S3 or local.

2.3. Logbook Approval
We'll create a controller for logbooks. The DPL can view logbooks for their groups and update the status.

2.4. Workshop and Certificate
We'll create controllers for workshops and certificates. When a student is marked as attended, we can generate a PDF certificate and store it.

Step 3: Frontend with Inertia and React
We'll create React components for each feature.

3.1. Grading Interface
We'll create a form for DPL and Village Head to input grades. We'll use Inertia's useForm to handle submissions.

3.2. Report Upload
We'll create a component for uploading reports with a progress bar. We can use Inertia's useForm and the progress property.

3.3. Logbook
Students will have a form to submit daily logbooks. DPL will have a table of logbooks with actions to approve or reject.

3.4. Workshop Registration
Students can view available workshops and register. Admins can mark attendance and generate certificates.

Step 4: UI/UX
We'll use Tailwind CSS to style the components. We'll implement a dark/light mode toggle and use glassmorphism effects.

We'll use Lucide React for icons.

Implementation Plan
Database Migrations: Create all the necessary tables.

Models and Relationships: Define the Eloquent models and their relationships.

Controllers and Routes: Create controllers and define routes for each feature.

Services: Create the GradingService and any other services.

Inertia Pages: Create React components for each page.

Styling: Apply Tailwind CSS and custom styles for a premium look.

Let's start by creating the migrations.

KKN Management System Implementation Plan
1. Database Schema Design
Core Tables
php
// Database/migrations/xxxx_create_tables.php

// Users table (extended for roles)
Schema::table('users', function (Blueprint $table) {
    $table->enum('role', ['student', 'dpl', 'village_head', 'admin', 'lppm'])->default('student');
    $table->string('nim')->nullable()->unique();
    $table->string('phone')->nullable();
    $table->foreignId('group_id')->nullable()->constrained('kkn_groups');
});

// KKN Groups
Schema::create('kkn_groups', function (Blueprint $table) {
    $table->id();
    $table->string('name'); // e.g., "1 / Jompo"
    $table->string('village_name');
    $table->foreignId('dpl_id')->constrained('users');
    $table->integer('generation'); // KKN Angkatan Ke
    $table->timestamps();
});

// Reports
Schema::create('reports', function (Blueprint $table) {
    $table->id();
    $table->foreignId('group_id')->constrained('kkn_groups');
    $table->enum('type', [
        'final_report',
        'village_map',
        'video',
        'article',
        'recognition',
        'journal',
        'outcome'
    ]);
    $table->string('file_path');
    $table->enum('status', ['draft', 'submitted', 'approved', 'revision_required'])->default('draft');
    $table->timestamp('submitted_at')->nullable();
    $table->timestamp('reviewed_at')->nullable();
    $table->foreignId('reviewer_id')->nullable()->constrained('users');
    $table->timestamps();
});

// Grading Tables
Schema::create('dpl_grades', function (Blueprint $table) {
    $table->id();
    $table->foreignId('student_id')->constrained('users');
    $table->foreignId('group_id')->constrained('kkn_groups');
    $table->decimal('proposal_score', 5, 2)->nullable(); // 30%
    $table->decimal('execution_score', 5, 2)->nullable(); // 40%
    $table->decimal('article_score', 5, 2)->nullable(); // 30%
    $table->decimal('total_score', 5, 2)->nullable();
    $table->string('letter_grade', 2)->nullable();
    $table->foreignId('dpl_id')->constrained('users');
    $table->timestamps();
});

Schema::create('village_grades', function (Blueprint $table) {
    $table->id();
    $table->foreignId('student_id')->constrained('users');
    $table->foreignId('group_id')->constrained('kkn_groups');
    $table->decimal('discipline_score', 5, 2)->nullable(); // 50%
    $table->decimal('attitude_score', 5, 2)->nullable(); // 50%
    $table->decimal('total_score', 5, 2)->nullable();
    $table->string('letter_grade', 2)->nullable();
    $table->foreignId('village_head_id')->constrained('users');
    $table->timestamps();
});

Schema::create('lppm_grades', function (Blueprint $table) {
    $table->id();
    $table->foreignId('student_id')->constrained('users');
    $table->foreignId('group_id')->constrained('kkn_groups');
    $table->decimal('lppm_score', 5, 2)->nullable();
    $table->string('letter_grade', 2)->nullable();
    $table->timestamps();
});

// Logbooks
Schema::create('logbooks', function (Blueprint $table) {
    $table->id();
    $table->foreignId('student_id')->constrained('users');
    $table->foreignId('group_id')->constrained('kkn_groups');
    $table->date('activity_date');
    $table->text('activity_description');
    $table->text('results')->nullable();
    $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
    $table->foreignId('reviewed_by')->nullable()->constrained('users');
    $table->timestamp('reviewed_at')->nullable();
    $table->timestamps();
});

// Workshops
Schema::create('workshops', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->text('description');
    $table->dateTime('start_date');
    $table->dateTime('end_date');
    $table->string('location');
    $table->integer('max_participants');
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});

Schema::create('workshop_registrations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('workshop_id')->constrained();
    $table->foreignId('user_id')->constrained();
    $table->timestamp('registered_at');
    $table->boolean('attended')->default(false);
    $table->timestamps();
});

Schema::create('certificates', function (Blueprint $table) {
    $table->id();
    $table->string('certificate_number')->unique();
    $table->foreignId('workshop_registration_id')->constrained();
    $table->string('file_path');
    $table->date('issue_date');
    $table->json('metadata')->nullable(); // Store workshop details, hours, etc.
    $table->timestamps();
});
2. Backend Services Implementation
Grade Calculation Service
php
// app/Services/GradeCalculationService.php
namespace App\Services;

use App\Models\DplGrade;
use App\Models\VillageGrade;
use App\Models\LppmGrade;

class GradeCalculationService
{
    private array $weights = [
        'dpl' => [
            'proposal' => 0.3,
            'execution' => 0.4,
            'article' => 0.3
        ],
        'village' => [
            'discipline' => 0.5,
            'attitude' => 0.5
        ],
        'final' => [
            'dpl' => 0.5,
            'village' => 0.3,
            'lppm' => 0.2
        ]
    ];

    public function calculateStudentFinalGrade(int $studentId, int $groupId): array
    {
        $dplGrade = DplGrade::where('student_id', $studentId)
            ->where('group_id', $groupId)
            ->first();
            
        $villageGrade = VillageGrade::where('student_id', $studentId)
            ->where('group_id', $groupId)
            ->first();
            
        $lppmGrade = LppmGrade::where('student_id', $studentId)
            ->where('group_id', $groupId)
            ->first();

        // Calculate DPL total
        $dplTotal = $this->calculateWeightedScore([
            $dplGrade->proposal_score ?? 0,
            $dplGrade->execution_score ?? 0,
            $dplGrade->article_score ?? 0
        ], $this->weights['dpl']);

        // Calculate Village total
        $villageTotal = $this->calculateWeightedScore([
            $villageGrade->discipline_score ?? 0,
            $villageGrade->attitude_score ?? 0
        ], $this->weights['village']);

        // Calculate Final total
        $finalTotal = $this->calculateWeightedScore([
            $dplTotal,
            $villageTotal,
            $lppmGrade->lppm_score ?? 0
        ], $this->weights['final']);

        $letterGrade = $this->convertToLetterGrade($finalTotal);

        return [
            'total_score' => round($finalTotal, 2),
            'letter_grade' => $letterGrade,
            'breakdown' => [
                'dpl' => round($dplTotal, 2),
                'village' => round($villageTotal, 2),
                'lppm' => $lppmGrade->lppm_score ?? 0
            ]
        ];
    }

    private function calculateWeightedScore(array $scores, array $weights): float
    {
        $total = 0;
        foreach ($scores as $index => $score) {
            $weight = array_values($weights)[$index] ?? 0;
            $total += $score * $weight;
        }
        return $total;
    }

    private function convertToLetterGrade(float $score): string
    {
        return match(true) {
            $score >= 85 => 'A',
            $score >= 80 => 'A-',
            $score >= 75 => 'B+',
            $score >= 70 => 'B',
            $score >= 65 => 'B-',
            $score >= 60 => 'C+',
            $score >= 55 => 'C',
            $score >= 50 => 'C-',
            $score >= 45 => 'D',
            default => 'E'
        };
    }
}
Report Management Service
php
// app/Services/ReportService.php
namespace App\Services;

use App\Models\Report;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ReportService
{
    private array $allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'video/mp4',
        'image/jpeg',
        'image/png'
    ];

    public function uploadReport(UploadedFile $file, int $groupId, string $type): Report
    {
        $this->validateFile($file);
        
        $path = $file->store("reports/group_{$groupId}", 's3');
        
        return Report::create([
            'group_id' => $groupId,
            'type' => $type,
            'file_path' => $path,
            'status' => 'submitted',
            'submitted_at' => now(),
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType()
        ]);
    }

    private function validateFile(UploadedFile $file): void
    {
        if (!in_array($file->getMimeType(), $this->allowedTypes)) {
            throw new \Exception('File type not allowed');
        }
        
        if ($file->getSize() > 100 * 1024 * 1024) { // 100MB limit
            throw new \Exception('File too large');
        }
    }
}
3. Frontend React Components
Multi-File Upload Component
jsx
// resources/js/Components/Report/ReportUpload.jsx
import { useForm } from '@inertiajs/inertia-react';
import { Upload, FileText, Video, Map, FileCheck } from 'lucide-react';

export default function ReportUpload({ groupId }) {
    const { data, setData, post, progress, processing } = useForm({
        files: [],
        report_type: ''
    });

    const reportTypes = [
        { id: 'final_report', label: 'Laporan Akhir', icon: FileText },
        { id: 'village_map', label: 'Peta Aset Desa', icon: Map },
        { id: 'video', label: 'Video Kegiatan', icon: Video },
        { id: 'article', label: 'Artikel Kampelmas', icon: FileCheck }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('reports.upload', { group: groupId }), {
            onSuccess: () => {
                // Success handling
            }
        });
    };

    return (
        <div className="glassmorphism p-6 rounded-2xl">
            <h3 className="text-xl font-semibold mb-4">Upload Laporan</h3>
            
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    {/* Report Type Selection */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {reportTypes.map((type) => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => setData('report_type', type.id)}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                    data.report_type === type.id
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-gray-200 hover:border-primary-300'
                                }`}
                            >
                                <type.icon className="w-6 h-6 mx-auto mb-2" />
                                <span className="text-sm">{type.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* File Upload Area */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <input
                            type="file"
                            multiple
                            onChange={(e) => setData('files', Array.from(e.target.files))}
                            className="hidden"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="cursor-pointer bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                        >
                            Pilih Berkas
                        </label>
                        <p className="text-sm text-gray-500 mt-2">
                            Maksimum 100MB per file
                        </p>
                    </div>

                    {/* Progress Bar */}
                    {progress && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-primary-600 h-2 rounded-full transition-all"
                                style={{ width: `${progress.percentage}%` }}
                            />
                        </div>
                    )}

                    {/* Selected Files */}
                    {data.files.length > 0 && (
                        <div className="space-y-2">
                            {data.files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm">{file.name}</span>
                                    <span className="text-xs text-gray-500">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={processing || !data.report_type || data.files.length === 0}
                        className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {processing ? 'Mengunggah...' : 'Upload Laporan'}
                    </button>
                </div>
            </form>
        </div>
    );
}
DPL Dashboard Component
jsx
// resources/js/Components/Dashboard/DplDashboard.jsx
import { Users, FileCheck, Clock, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function DplDashboard() {
    const [stats, setStats] = useState({
        pendingLogbooks: 0,
        totalStudents: 0,
        completedReports: 0,
        pendingApprovals: []
    });

    useEffect(() => {
        fetchDashboardData();
        // Setup real-time updates
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        const response = await axios.get(route('dpl.dashboard.stats'));
        setStats(response.data);
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glassmorphism p-6 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Pending Logbooks</p>
                            <p className="text-2xl font-bold">{stats.pendingLogbooks}</p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-500" />
                    </div>
                </div>

                <div className="glassmorphism p-6 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Students</p>
                            <p className="text-2xl font-bold">{stats.totalStudents}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-500" />
                    </div>
                </div>

                <div className="glassmorphism p-6 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Completed Reports</p>
                            <p className="text-2xl font-bold">{stats.completedReports}</p>
                        </div>
                        <FileCheck className="w-8 h-8 text-green-500" />
                    </div>
                </div>

                <div className="glassmorphism p-6 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Avg Score</p>
                            <p className="text-2xl font-bold">85.2</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-purple-500" />
                    </div>
                </div>
            </div>

            {/* Pending Approvals */}
            <div className="glassmorphism p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-4">Pending Approvals</h3>
                <div className="space-y-3">
                    {stats.pendingApprovals.map((approval) => (
                        <div key={approval.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium">{approval.student_name}</p>
                                <p className="text-sm text-gray-500">{approval.group_name}</p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleApproval(approval.id, 'approved')}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleApproval(approval.id, 'rejected')}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
4. Certificate Generation Service
php
// app/Services/CertificateService.php
namespace App\Services;

use App\Models\Certificate;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class CertificateService
{
    public function generateCertificate(int $registrationId): Certificate
    {
        $registration = WorkshopRegistration::with(['user', 'workshop'])->find($registrationId);
        
        $certificateNumber = $this->generateCertificateNumber();
        
        // Generate PDF
        $pdf = Pdf::loadView('certificates.template', [
            'certificateNumber' => $certificateNumber,
            'participant' => $registration->user,
            'workshop' => $registration->workshop,
            'issueDate' => now(),
            'metadata' => [
                'hours' => $registration->workshop->duration_hours,
                'materials' => json_decode($registration->workshop->materials, true)
            ]
        ]);
        
        $filename = "certificates/{$certificateNumber}.pdf";
        Storage::disk('s3')->put($filename, $pdf->output());
        
        return Certificate::create([
            'certificate_number' => $certificateNumber,
            'workshop_registration_id' => $registrationId,
            'file_path' => $filename,
            'issue_date' => now(),
            'metadata' => json_encode([
                'workshop_title' => $registration->workshop->title,
                'participant_name' => $registration->user->name,
                'issued_at' => now()->format('Y-m-d H:i:s')
            ])
        ]);
    }

    private function generateCertificateNumber(): string
    {
        $year = date('Y');
        $month = date('m');
        $sequence = Certificate::whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->count() + 1;
            
        return "B-{$sequence}/Un.19/K.LPPM/PP.{$month}/{$year}";
    }
}
5. Implementation Steps
Week 1: Setup & Core Structure
Install Laravel with Inertia.js + React

Configure Tailwind CSS with glassmorphism utilities

Set up database migrations

Create authentication with role-based access

Week 2: Grade Management Module
Implement GradeCalculationService

Create grading interfaces for DPL, Village Head, and LPPM

Build real-time grade calculation and caching

Implement grade import/export with Excel

Week 3: Document Management
Create report upload system with S3 integration

Implement file validation and virus scanning

Build report approval workflow

Create document version control

Week 4: Logbook & Real-time Features
Implement daily logbook with rich text editor

Create real-time approval notifications

Build DPL dashboard with analytics

Implement WebSocket for real-time updates

Week 5: Workshop & Certification
Build workshop registration system

Implement certificate PDF generation

Create certificate verification system

Add workshop attendance tracking

Week 6: UI/UX Polish & Testing
Implement dark/light mode toggle

Add smooth animations and transitions

Conduct user testing

Performance optimization

6. Premium UI Features
Add to tailwind.config.js:

js
module.exports = {
    theme: {
        extend: {
            backdropFilter: {
                'none': 'none',
                'blur': 'blur(20px)',
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'pulse-subtle': 'pulseSubtle 2s infinite',
            }
        }
    }
}
This system provides a complete, modern KKN management solution with real-time features, beautiful UI, and robust backend logic. The architecture supports scalability and can be extended with additional modules as needed.

-----------

I'll analyze the Kampelmas system screenshots you've provided and create a comprehensive implementation plan for your modern KKN Management System. Let me break this down into a structured, production-ready approach.
System Analysis from Screenshots
Based on the Kampelmas interface, I can see:
Multi-role system: DPL (supervisor), Village Head, Students, Admin
Grading components: DPL scores (Laporan, Pelaksanaan, Artikel) + Village scores (Kedisiplinan, Sikap) + LLPM scores
Report types: 7 document types (Laporan Akhir, Peta Aset Desa, Video, Artikel, Rekognisi, Jurnal, Outcome)
Workshop management: Registration list with timestamps, certificate generation with QR codes
Group-based organization: KKN groups assigned to specific villages
Phase 1: Database Schema & Migrations
1.1 Core Tables Migration
php
Copy
<?php
// database/migrations/2024_01_01_000001_create_kkn_core_tables.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // KKN Periods/Generations
        Schema::create('kkn_periods', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "KKN Angkatan 51"
            $table->year('year');
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['registration', 'ongoing', 'completed', 'archived'])->default('registration');
            $table->timestamps();
        });

        // Villages/Desa
        Schema::create('villages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('district'); // Kecamatan
            $table->string('regency'); // Kabupaten
            $table->string('province');
            $table->decimal('distance_from_campus', 8, 2)->nullable(); // km
            $table->timestamps();
        });

        // KKN Groups (Kelompok)
        Schema::create('kkn_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kkn_period_id')->constrained('kkn_periods');
            $table->foreignId('village_id')->constrained('villages');
            $table->string('name'); // e.g., "1 / Jompo"
            $table->foreignId('dpl_id')->constrained('users'); // DPL supervisor
            $table->timestamps();
        });

        // Group-Student pivot
        Schema::create('kkn_group_student', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kkn_group_id')->constrained('kkn_groups');
            $table->foreignId('student_id')->constrained('users');
            $table->enum('role', ['leader', 'member'])->default('member');
            $table->timestamps();
        });

        // Proposals
        Schema::create('proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kkn_group_id')->constrained('kkn_groups');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('partner_name'); // Nama Mitra
            $table->text('partner_address')->nullable();
            $table->string('partner_phone')->nullable();
            $table->decimal('budget', 15, 2)->default(0);
            $table->enum('status', ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'revision_required'])->default('draft');
            $table->text('revision_notes')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });

        // Reports (7 types)
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kkn_group_id')->constrained('kkn_groups');
            $table->enum('type', [
                'final_report',      // Laporan Akhir
                'village_map',       // Peta Aset Desa
                'activity_video',    // Video Kegiatan
                'article',           // Artikel Kampelmas
                'recognition',       // Rekognisi
                'journal',           // Jurnal
                'outcome'            // Outcome (KKN Mandiri)
            ]);
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->string('file_path')->nullable();
            $table->string('file_url')->nullable();
            $table->enum('status', ['draft', 'submitted', 'under_review', 'approved', 'revision_required'])->default('draft');
            $table->text('feedback')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->timestamps();
        });

        // Logbooks (Daily activities)
        Schema::create('logbooks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users');
            $table->foreignId('kkn_group_id')->constrained('kkn_groups');
            $table->date('activity_date');
            $table->string('title');
            $table->text('description');
            $table->text('problems')->nullable();
            $table->text('solutions')->nullable();
            $table->string('photo_path')->nullable();
            $table->enum('status', ['draft', 'submitted', 'approved', 'rejected'])->default('draft');
            $table->text('rejection_reason')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->timestamps();
        });

        // Workshops
        Schema::create('workshops', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->dateTime('start_date');
            $table->dateTime('end_date');
            $table->string('location');
            $table->integer('capacity');
            $table->enum('status', ['upcoming', 'ongoing', 'completed', 'cancelled'])->default('upcoming');
            $table->timestamps();
        });

        // Workshop Registrations
        Schema::create('workshop_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workshop_id')->constrained('workshops');
            $table->foreignId('student_id')->constrained('users');
            $table->enum('status', ['registered', 'attended', 'no_show', 'cancelled'])->default('registered');
            $table->string('certificate_number')->nullable();
            $table->string('certificate_path')->nullable();
            $table->timestamp('certificate_generated_at')->nullable();
            $table->timestamps();
        });

        // GRADING SYSTEM TABLES
        
        // DPL Scores (Supervisor)
        Schema::create('dpl_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users');
            $table->foreignId('kkn_period_id')->constrained('kkn_periods');
            $table->foreignId('dpl_id')->constrained('users');
            $table->decimal('report_score', 5, 2)->default(0); // Laporan: 30%
            $table->decimal('execution_score', 5, 2)->default(0); // Pelaksanaan: 40%
            $table->decimal('article_score', 5, 2)->default(0); // Artikel: 30%
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->unique(['student_id', 'kkn_period_id']);
        });

        // Village Head Scores
        Schema::create('village_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users');
            $table->foreignId('kkn_period_id')->constrained('kkn_periods');
            $table->foreignId('village_id')->constrained('villages');
            $table->string('village_head_name');
            $table->decimal('discipline_score', 5, 2)->default(0); // Kedisiplinan
            $table->decimal('attitude_score', 5, 2)->default(0); // Sikap
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->unique(['student_id', 'kkn_period_id']);
        });

        // LLPM Scores (Institution)
        Schema::create('llpm_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users');
            $table->foreignId('kkn_period_id')->constrained('kkn_periods');
            $table->decimal('score', 5, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->unique(['student_id', 'kkn_period_id']);
        });

        // Final Aggregated Scores
        Schema::create('final_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users');
            $table->foreignId('kkn_period_id')->constrained('kkn_periods');
            
            // Raw scores
            $table->decimal('dpl_weighted', 5, 2)->default(0); // 70% of total
            $table->decimal('village_weighted', 5, 2)->default(0); // 20% of total
            $table->decimal('llpm_weighted', 5, 2)->default(0); // 10% of total
            
            // Final calculations
            $table->decimal('total_score', 5, 2)->default(0);
            $table->string('letter_grade', 3)->nullable();
            $table->enum('status', ['incomplete', 'complete', 'published'])->default('incomplete');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            
            $table->unique(['student_id', 'kkn_period_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('final_scores');
        Schema::dropIfExists('llpm_scores');
        Schema::dropIfExists('village_scores');
        Schema::dropIfExists('dpl_scores');
        Schema::dropIfExists('workshop_registrations');
        Schema::dropIfExists('workshops');
        Schema::dropIfExists('logbooks');
        Schema::dropIfExists('reports');
        Schema::dropIfExists('proposals');
        Schema::dropIfExists('kkn_group_student');
        Schema::dropIfExists('kkn_groups');
        Schema::dropIfExists('villages');
        Schema::dropIfExists('kkn_periods');
    }
};
Phase 2: Service Classes & Business Logic
2.1 Grading Service
php
Copy
<?php
// app/Services/GradingService.php

namespace App\Services;

use App\Models\DplScore;
use App\Models\VillageScore;
use App\Models\LlpmScore;
use App\Models\FinalScore;
use App\Models\User;
use App\Models\KknPeriod;

class GradingService
{
    // Weight configurations
    const DPL_WEIGHT = 0.70;      // 70%
    const VILLAGE_WEIGHT = 0.20;  // 20%
    const LLPM_WEIGHT = 0.10;     // 10%

    // DPL internal weights
    const REPORT_WEIGHT = 0.30;   // 30% of DPL score
    const EXECUTION_WEIGHT = 0.40; // 40% of DPL score
    const ARTICLE_WEIGHT = 0.30;  // 30% of DPL score

    /**
     * Grade mapping based on Indonesian academic standards
     */
    protected array $gradeMap = [
        ['min' => 85, 'max' => 100, 'grade' => 'A', 'point' => 4.00],
        ['min' => 80, 'max' => 84.99, 'grade' => 'A-', 'point' => 3.70],
        ['min' => 75, 'max' => 79.99, 'grade' => 'B+', 'point' => 3.30],
        ['min' => 70, 'max' => 74.99, 'grade' => 'B', 'point' => 3.00],
        ['min' => 65, 'max' => 69.99, 'grade' => 'B-', 'point' => 2.70],
        ['min' => 60, 'max' => 64.99, 'grade' => 'C+', 'point' => 2.30],
        ['min' => 55, 'max' => 59.99, 'grade' => 'C', 'point' => 2.00],
        ['min' => 50, 'max' => 54.99, 'grade' => 'C-', 'point' => 1.70],
        ['min' => 40, 'max' => 49.99, 'grade' => 'D', 'point' => 1.00],
        ['min' => 0, 'max' => 39.99, 'grade' => 'E', 'point' => 0.00],
    ];

    /**
     * Calculate DPL component score from raw inputs
     */
    public function calculateDplComponent(float $report, float $execution, float $article): float
    {
        return round(
            ($report * self::REPORT_WEIGHT) +
            ($execution * self::EXECUTION_WEIGHT) +
            ($article * self::ARTICLE_WEIGHT),
            2
        );
    }

    /**
     * Calculate village component score (average of discipline and attitude)
     */
    public function calculateVillageComponent(float $discipline, float $attitude): float
    {
        return round(($discipline + $attitude) / 2, 2);
    }

    /**
     * Calculate final weighted total
     */
    public function calculateFinalTotal(float $dplComponent, float $villageComponent, float $llpmScore): float
    {
        $dplWeighted = $dplComponent * self::DPL_WEIGHT;
        $villageWeighted = $villageComponent * self::VILLAGE_WEIGHT;
        $llpmWeighted = $llpmScore * self::LLPM_WEIGHT;

        return round($dplWeighted + $villageWeighted + $llpmWeighted, 2);
    }

    /**
     * Map numeric score to letter grade
     */
    public function getLetterGrade(float $score): string
    {
        foreach ($this->gradeMap as $range) {
            if ($score >= $range['min'] && $score <= $range['max']) {
                return $range['grade'];
            }
        }
        return 'E';
    }

    /**
     * Get grade point (IPK conversion)
     */
    public function getGradePoint(float $score): float
    {
        foreach ($this->gradeMap as $range) {
            if ($score >= $range['min'] && $score <= $range['max']) {
                return $range['point'];
            }
        }
        return 0.00;
    }

    /**
     * Update or create DPL scores
     */
    public function updateDplScore(User $student, KknPeriod $period, array $data): DplScore
    {
        $componentScore = $this->calculateDplComponent(
            $data['report_score'],
            $data['execution_score'],
            $data['article_score']
        );

        $score = DplScore::updateOrCreate(
            [
                'student_id' => $student->id,
                'kkn_period_id' => $period->id,
            ],
            [
                'dpl_id' => auth()->id(),
                'report_score' => $data['report_score'],
                'execution_score' => $data['execution_score'],
                'article_score' => $data['article_score'],
                'notes' => $data['notes'] ?? null,
            ]
        );

        $this->recalculateFinalScore($student, $period);

        return $score;
    }

    /**
     * Update or create Village scores
     */
    public function updateVillageScore(User $student, KknPeriod $period, array $data): VillageScore
    {
        $score = VillageScore::updateOrCreate(
            [
                'student_id' => $student->id,
                'kkn_period_id' => $period->id,
            ],
            [
                'village_id' => $data['village_id'],
                'village_head_name' => $data['village_head_name'],
                'discipline_score' => $data['discipline_score'],
                'attitude_score' => $data['attitude_score'],
                'notes' => $data['notes'] ?? null,
            ]
        );

        $this->recalculateFinalScore($student, $period);

        return $score;
    }

    /**
     * Recalculate and update final score
     */
    public function recalculateFinalScore(User $student, KknPeriod $period): FinalScore
    {
        $dplScore = DplScore::where('student_id', $student->id)
            ->where('kkn_period_id', $period->id)
            ->first();

        $villageScore = VillageScore::where('student_id', $student->id)
            ->where('kkn_period_id', $period->id)
            ->first();

        $llpmScore = LlpmScore::where('student_id', $student->id)
            ->where('kkn_period_id', $period->id)
            ->first();

        // Calculate components
        $dplComponent = $dplScore ? $this->calculateDplComponent(
            $dplScore->report_score,
            $dplScore->execution_score,
            $dplScore->article_score
        ) : 0;

        $villageComponent = $villageScore ? $this->calculateVillageComponent(
            $villageScore->discipline_score,
            $villageScore->attitude_score
        ) : 0;

        $llpmComponent = $llpmScore ? $llpmScore->score : 0;

        // Calculate weighted scores
        $dplWeighted = round($dplComponent * self::DPL_WEIGHT, 2);
        $villageWeighted = round($villageComponent * self::VILLAGE_WEIGHT, 2);
        $llpmWeighted = round($llpmComponent * self::LLPM_WEIGHT, 2);

        $totalScore = $dplWeighted + $villageWeighted + $llpmWeighted;

        // Determine status
        $status = 'incomplete';
        if ($dplScore && $villageScore && $llpmScore) {
            $status = 'complete';
        }

        return FinalScore::updateOrCreate(
            [
                'student_id' => $student->id,
                'kkn_period_id' => $period->id,
            ],
            [
                'dpl_weighted' => $dplWeighted,
                'village_weighted' => $villageWeighted,
                'llpm_weighted' => $llpmWeighted,
                'total_score' => round($totalScore, 2),
                'letter_grade' => $this->getLetterGrade($totalScore),
                'status' => $status,
            ]
        );
    }

    /**
     * Get complete grade breakdown for a student
     */
    public function getGradeBreakdown(User $student, KknPeriod $period): array
    {
        $finalScore = FinalScore::where('student_id', $student->id)
            ->where('kkn_period_id', $period->id)
            ->first();

        $dplScore = DplScore::where('student_id', $student->id)
            ->where('kkn_period_id', $period->id)
            ->first();

        $villageScore = VillageScore::where('student_id', $student->id)
            ->where('kkn_period_id', $period->id)
            ->first();

        $llpmScore = LlpmScore::where('student_id', $student->id)
            ->where('kkn_period_id', $period->id)
            ->first();

        return [
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'nim' => $student->nim,
            ],
            'period' => [
                'id' => $period->id,
                'name' => $period->name,
            ],
            'components' => [
                'dpl' => $dplScore ? [
                    'raw' => [
                        'report' => $dplScore->report_score,
                        'execution' => $dplScore->execution_score,
                        'article' => $dplScore->article_score,
                    ],
                    'component_score' => $this->calculateDplComponent(
                        $dplScore->report_score,
                        $dplScore->execution_score,
                        $dplScore->article_score
                    ),
                    'weighted' => $finalScore?->dpl_weighted ?? 0,
                    'weight_percent' => self::DPL_WEIGHT * 100,
                ] : null,
                'village' => $villageScore ? [
                    'raw' => [
                        'discipline' => $villageScore->discipline_score,
                        'attitude' => $villageScore->attitude_score,
                    ],
                    'village_head' => $villageScore->village_head_name,
                    'component_score' => $this->calculateVillageComponent(
                        $villageScore->discipline_score,
                        $villageScore->attitude_score
                    ),
                    'weighted' => $finalScore?->village_weighted ?? 0,
                    'weight_percent' => self::VILLAGE_WEIGHT * 100,
                ] : null,
                'llpm' => $llpmScore ? [
                    'raw_score' => $llpmScore->score,
                    'weighted' => $finalScore?->llpm_weighted ?? 0,
                    'weight_percent' => self::LLPM_WEIGHT * 100,
                ] : null,
            ],
            'final' => $finalScore ? [
                'total_score' => $finalScore->total_score,
                'letter_grade' => $finalScore->letter_grade,
                'grade_point' => $this->getGradePoint($finalScore->total_score),
                'status' => $finalScore->status,
            ] : null,
            'completion_status' => [
                'dpl' => $dplScore !== null,
                'village' => $villageScore !== null,
                'llpm' => $llpmScore !== null,
                'overall' => $finalScore?->status === 'complete',
            ],
        ];
    }
}
2.2 Report Management Service
php
Copy
<?php
// app/Services/ReportService.php

namespace App\Services;

use App\Models\Report;
use App\Models\KknGroup;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;

class ReportService
{
    protected array $reportTypes = [
        'final_report' => [
            'label' => 'Laporan Akhir',
            'description' => 'Dokumen laporan akhir KKN',
            'allowed_extensions' => ['pdf', 'doc', 'docx'],
            'max_size' => 51200, // 50MB
        ],
        'village_map' => [
            'label' => 'Peta Aset Desa',
            'description' => 'Peta dan dokumentasi aset desa',
            'allowed_extensions' => ['pdf', 'jpg', 'jpeg', 'png', 'zip'],
            'max_size' => 102400, // 100MB
        ],
        'activity_video' => [
            'label' => 'Video Kegiatan',
            'description' => 'Dokumentasi video kegiatan KKN',
            'allowed_extensions' => ['mp4', 'mov', 'avi', 'mkv'],
            'max_size' => 524288, // 512MB
        ],
        'article' => [
            'label' => 'Artikel Kampelmas',
            'description' => 'Artikel ilmiah/media massa',
            'allowed_extensions' => ['pdf', 'doc', 'docx'],
            'max_size' => 10240, // 10MB
        ],
        'recognition' => [
            'label' => 'Rekognisi',
            'description' => 'Dokumen rekognisi/sertifikat',
            'allowed_extensions' => ['pdf', 'jpg', 'jpeg', 'png'],
            'max_size' => 10240,
        ],
        'journal' => [
            'label' => 'Jurnal',
            'description' => 'Artikel jurnal ilmiah',
            'allowed_extensions' => ['pdf'],
            'max_size' => 20480,
        ],
        'outcome' => [
            'label' => 'Outcome (KKN Mandiri)',
            'description' => 'Hasil/produk KKN mandiri',
            'allowed_extensions' => ['pdf', 'zip', 'rar'],
            'max_size' => 102400,
        ],
    ];

    public function getReportTypes(): array
    {
        return $this->reportTypes;
    }

    public function getReportTypeConfig(string $type): ?array
    {
        return $this->reportTypes[$type] ?? null;
    }

    public function uploadReport(Report $report, UploadedFile $file, string $disk = 's3'): array
    {
        $config = $this->getReportTypeConfig($report->type);
        
        // Validate
        if (!$config) {
            throw new \InvalidArgumentException("Invalid report type: {$report->type}");
        }

        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, $config['allowed_extensions'])) {
            throw new \InvalidArgumentException(
                "File type not allowed. Allowed: " . implode(', ', $config['allowed_extensions'])
            );
        }

        if ($file->getSize() > $config['max_size'] * 1024) {
            throw new \InvalidArgumentException(
                "File too large. Max size: " . ($config['max_size'] / 1024) . " MB"
            );
        }

        // Generate path
        $group = $report->kknGroup;
        $period = $group->kknPeriod;
        $filename = sprintf(
            '%s_%s_%s_%s.%s',
            $report->type,
            $group->id,
            $report->id,
            time(),
            $extension
        );
        
        $path = "kkn/{$period->year}/{$period->id}/groups/{$group->id}/reports/{$filename}";

        // Store file
        Storage::disk($disk)->putFileAs(
            dirname($path),
            $file,
            basename($path),
            'private'
        );

        // Update report
        $report->update([
            'file_path' => $path,
            'file_url' => Storage::disk($disk)->url($path),
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        return [
            'path' => $path,
            'url' => $report->file_url,
            'size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
        ];
    }

    public function approveReport(Report $report, ?string $feedback = null): void
    {
        $report->update([
            'status' => 'approved',
            'feedback' => $feedback,
            'reviewed_at' => now(),
            'reviewed_by' => auth()->id(),
        ]);
    }

    public function requestRevision(Report $report, string $feedback): void
    {
        $report->update([
            'status' => 'revision_required',
            'feedback' => $feedback,
            'reviewed_at' => now(),
            'reviewed_by' => auth()->id(),
        ]);
    }

    public function getGroupReportStatus(KknGroup $group): array
    {
        $reports = Report::where('kkn_group_id', $group->id)
            ->get()
            ->keyBy('type');

        $status = [];
        foreach ($this->reportTypes as $type => $config) {
            $report = $reports->get($type);
            $status[$type] = [
                'label' => $config['label'],
                'status' => $report?->status ?? 'not_uploaded',
                'submitted_at' => $report?->submitted_at,
                'file_url' => $report?->file_url,
                'feedback' => $report?->feedback,
            ];
        }

        return $status;
    }
}
2.3 Certificate Generation Service
php
Copy
<?php
// app/Services/CertificateService.php

namespace App\Services;

use App\Models\WorkshopRegistration;
use App\Models\Workshop;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class CertificateService
{
    public function generateWorkshopCertificate(WorkshopRegistration $registration): array
    {
        if ($registration->status !== 'attended') {
            throw new \InvalidArgumentException('Student must be marked as attended first');
        }

        $workshop = $registration->workshop;
        $student = $registration->student;

        // Generate certificate number
        $certificateNumber = $this->generateCertificateNumber($workshop, $registration);

        // Generate QR code
        $qrData = [
            'certificate_number' => $certificateNumber,
            'student_name' => $student->name,
            'workshop' => $workshop->title,
            'date' => $workshop->start_date->format('Y-m-d'),
            'verify_url' => route('certificates.verify', $certificateNumber),
        ];

        $qrCode = QrCode::format('png')
            ->size(200)
            ->errorCorrection('H')
            ->generate(json_encode($qrData));

        $qrPath = "certificates/qr/{$certificateNumber}.png";
        Storage::disk('public')->put($qrPath, $qrCode);

        // Prepare PDF data
        $data = [
            'certificate_number' => $certificateNumber,
            'student_name' => $student->name,
            'student_nim' => $student->nim,
            'workshop_title' => $workshop->title,
            'workshop_description' => $workshop->description,
            'location' => $workshop->location,
            'start_date' => $workshop->start_date,
            'end_date' => $workshop->end_date,
            'duration_hours' => $workshop->start_date->diffInHours($workshop->end_date),
            'qr_code_path' => Storage::disk('public')->path($qrPath),
            'issued_date' => now(),
            'issuer_name' => config('app.certificate.issuer_name', 'Ketua LPPM'),
            'issuer_title' => config('app.certificate.issuer_title', 'Prof. Dr.'),
        ];

        // Generate PDF
        $pdf = Pdf::loadView('certificates.workshop', $data)
            ->setPaper('A4', 'landscape');

        $pdfPath = "certificates/workshop/{$certificateNumber}.pdf";
        Storage::disk('public')->put($pdfPath, $pdf->output());

        // Update registration
        $registration->update([
            'certificate_number' => $certificateNumber,
            'certificate_path' => $pdfPath,
            'certificate_generated_at' => now(),
        ]);

        return [
            'certificate_number' => $certificateNumber,
            'pdf_path' => $pdfPath,
            'pdf_url' => Storage::disk('public')->url($pdfPath),
            'qr_path' => $qrPath,
        ];
    }

    protected function generateCertificateNumber(Workshop $workshop, WorkshopRegistration $registration): string
    {
        $year = $workshop->start_date->year;
        $workshopId = str_pad($workshop->id, 3, '0', STR_PAD_LEFT);
        $regId = str_pad($registration->id, 4, '0', STR_PAD_LEFT);
        $random = strtoupper(Str::random(4));

        return "B-{$random}/Un.19/K.LPPM/PP.{$workshopId}/{$year}";
    }

    public function verifyCertificate(string $certificateNumber): ?array
    {
        $registration = WorkshopRegistration::where('certificate_number', $certificateNumber)
            ->with(['workshop', 'student'])
            ->first();

        if (!$registration) {
            return null;
        }

        return [
            'valid' => true,
            'certificate_number' => $registration->certificate_number,
            'student_name' => $registration->student->name,
            'workshop_title' => $registration->workshop->title,
            'issued_date' => $registration->certificate_generated_at,
            'status' => $registration->status,
        ];
    }
}
Phase 3: React Inertia Components
3.1 Premium Dashboard Layout with Dark Mode
tsx
Copy
// resources/js/Layouts/DashboardLayout.tsx
import { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
  LayoutDashboard, 
  FileText, 
  BookOpen, 
  Users, 
  ClipboardCheck,
  Award,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Bell,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title }: Props) {
  const { auth, unreadNotifications } = usePage().props;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved) {
      setDarkMode(JSON.parse(saved));
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
    document.documentElement.classList.toggle('dark', newMode);
  };

  const navigation = [
    { name: 'Dashboard', href: route('dashboard'), icon: LayoutDashboard },
    { name: 'My Proposal', href: route('proposals.index'), icon: FileText },
    { name: 'Logbook', href: route('logbooks.index'), icon: BookOpen },
    { name: 'Reports', href: route('reports.index'), icon: ClipboardCheck },
    { name: 'Workshops', href: route('workshops.index'), icon: Award },
  ];

  // DPL-specific navigation
  if (auth.user.role === 'dpl') {
    navigation.push(
      { name: 'My Groups', href: route('dpl.groups'), icon: Users },
      { name: 'Grade Input', href: route('grades.input'), icon: ClipboardCheck }
    );
  }

  return (
    <div className={cn("min-h-screen transition-colors duration-300", darkMode ? "dark bg-slate-950" : "bg-slate-50")}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-72 transition-all duration-300 ease-in-out",
        "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800",
        !sidebarOpen && "-translate-x-full lg:translate-x-0 lg:w-20",
        "flex flex-col"
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Award className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 dark:text-white text-lg leading-tight">KKN</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Management</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                "hover:bg-slate-100 dark:hover:bg-slate-800",
                route().current(item.href) 
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "text-slate-600 dark:text-slate-400"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform group-hover:scale-110",
                route().current(item.href) && "text-emerald-600 dark:text-emerald-400"
              )} />
              {sidebarOpen && (
                <span className="font-medium text-sm">{item.name}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {sidebarOpen && <span className="font-medium text-sm">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          
          <Link
            href={route('logout')}
            method="post"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium text-sm">Logout</span>}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300 min-h-screen",
        sidebarOpen ? "lg:ml-72" : "lg:ml-20"
      )}>
        {/* Top header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            {title && (
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h1>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium text-sm">
                  {auth.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{auth.user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{auth.user.role}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {profileOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{auth.user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{auth.user.email}</p>
                    </div>
                    <Link
                      href={route('profile.edit')}
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Profile Settings
                    </Link>
                    <Link
                      href={route('logout')}
                      method="post"
                      className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      Sign out
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
3.2 Analytics Dashboard with Glassmorphism Cards
tsx
Copy
// resources/js/Pages/Dashboard.tsx
import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { 
  TrendingUp, 
  Users, 
  FileCheck, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface Props {
  stats: {
    totalStudents: number;
    activeGroups: number;
    submissionRate: number;
    pendingApprovals: number;
    trends: {
      students: number;
      submissions: number;
    };
  };
  recentActivities: Array<{
    id: number;
    type: string;
    description: string;
    time: string;
  }>;
  chartData: Array<{
    name: string;
    registrations: number;
    completions: number;
  }>;
}

export default function Dashboard({ stats, recentActivities, chartData }: Props) {
  const StatCard = ({ 
    title, 
    value, 
    trend, 
    trendUp, 
    icon: Icon, 
    color 
  }: {
    title: string;
    value: string | number;
    trend: string;
    trendUp: boolean;
    icon: any;
    color: string;
  }) => (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800 group hover:shadow-lg transition-all duration-300">
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2 transition-opacity group-hover:opacity-30",
        color
      )} />
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          <div className="mt-2 flex items-center gap-1">
            {trendUp ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-500" />
            )}
            <span className={cn(
              "text-sm font-medium",
              trendUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            )}>
              {trend}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">vs last month</span>
          </div>
        </div>
        <div className={cn(
          "p-3 rounded-xl",
          color.replace('bg-', 'bg-opacity-10 bg-')
        )}>
          <Icon className={cn("w-6 h-6", color.replace('bg-', 'text-').replace('/20', ''))} />
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout title="Dashboard">
      <Head title="Dashboard" />

      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            trend={`${stats.trends.students}%`}
            trendUp={stats.trends.students > 0}
            icon={Users}
            color="bg-blue-500"
          />
          <StatCard
            title="Active Groups"
            value={stats.activeGroups}
            trend="12%"
            trendUp={true}
            icon={Activity}
            color="bg-emerald-500"
          />
          <StatCard
            title="Submission Rate"
            value={`${stats.submissionRate}%`}
            trend={`${stats.trends.submissions}%`}
            trendUp={stats.trends.submissions > 0}
            icon={FileCheck}
            color="bg-amber-500"
          />
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            trend="5%"
            trendUp={false}
            icon={Clock}
            color="bg-rose-500"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Registration Trends</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Student registrations vs completions over time</p>
              </div>
              <select className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300">
                <option>Last 6 months</option>
                <option>Last year</option>
              </select>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    className="dark:stroke-slate-400"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    className="dark:stroke-slate-400"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="registrations" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorRegistrations)" 
                    strokeWidth={2}
                    name="Registrations"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completions" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorCompletions)" 
                    strokeWidth={2}
                    name="Completions"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
              View all activity
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
3.3 Multi-Tiered Grading Interface
tsx
Copy
// resources/js/Pages/Grades/Input.tsx
import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Progress } from '@/Components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Calculator, 
  Save, 
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Building2,
  Users
} from 'lucide-react';

interface Student {
  id: number;
  name: string;
  nim: string;
  group: string;
  hasDplScore: boolean;
  hasVillageScore: boolean;
  hasLlpmScore: boolean;
  finalScore?: {
    total_score: number;
    letter_grade: string;
    status: string;
  };
}

interface Props {
  students: Student[];
  kknPeriod: {
    id: number;
    name: string;
  };
}

export default function GradeInput({ students, kknPeriod }: Props) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<'dpl' | 'village' | 'llpm'>('dpl');

  // DPL Score Form
  const dplForm = useForm({
    student_id: '',
    report_score: '',
    execution_score: '',
    article_score: '',
    notes: '',
  });

  // Village Score Form
  const villageForm = useForm({
    student_id: '',
    discipline_score: '',
    attitude_score: '',
    village_head_name: '',
    notes: '',
  });

  // LLPM Score Form
  const llpmForm = useForm({
    student_id: '',
    score: '',
    notes: '',
  });

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    dplForm.setData('student_id', student.id.toString());
    villageForm.setData('student_id', student.id.toString());
    llpmForm.setData('student_id', student.id.toString());
  };

  const calculateDplComponent = () => {
    const report = parseFloat(dplForm.data.report_score) || 0;
    const execution = parseFloat(dplForm.data.execution_score) || 0;
    const article = parseFloat(dplForm.data.article_score) || 0;
    return (report * 0.3 + execution * 0.4 + article * 0.3).toFixed(2);
  };

  const calculateVillageComponent = () => {
    const discipline = parseFloat(villageForm.data.discipline_score) || 0;
    const attitude = parseFloat(villageForm.data.attitude_score) || 0;
    return ((discipline + attitude) / 2).toFixed(2);
  };

  const submitDplScore = () => {
    dplForm.post(route('grades.dpl.store', kknPeriod.id), {
      preserveScroll: true,
      onSuccess: () => {
        // Show success notification
      },
    });
  };

  return (
    <DashboardLayout title="Grade Input">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Students ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {students.map((student) => (
                <button
                  key={student.id}
                  onClick={() => handleStudentSelect(student)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl transition-all duration-200",
                    selectedStudent?.id === student.id
                      ? "bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-500"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-transparent"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{student.name}</p>
                      <p className="text-sm text-slate-500">{student.nim}</p>
                    </div>
                    <div className="flex gap-1">
                      {student.hasDplScore && (
                        <span className="w-2 h-2 rounded-full bg-blue-500" title="DPL Score" />
                      )}
                      {student.hasVillageScore && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Village Score" />
                      )}
                      {student.hasLlpmScore && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" title="LLPM Score" />
                      )}
                    </div>
                  </div>
                  {student.finalScore && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-bold",
                        student.finalScore.letter_grade.startsWith('A') ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" :
                        student.finalScore.letter_grade.startsWith('B') ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" :
                        "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                      )}>
                        {student.finalScore.letter_grade}
                      </span>
                      <span className="text-xs text-slate-500">{student.finalScore.total_score}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Grade Input Forms */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                {selectedStudent ? `Input Grades: ${selectedStudent.name}` : 'Select a Student'}
              </span>
              {selectedStudent?.finalScore && (
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-bold",
                  selectedStudent.finalScore.status === 'complete' 
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                )}>
                  {selectedStudent.finalScore.status === 'complete' ? 'Complete' : 'Incomplete'}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedStudent ? (
              <>
                {/* Tabs */}
                <div className="flex gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  {[
                    { id: 'dpl', label: 'DPL Score', icon: GraduationCap, color: 'blue' },
                    { id: 'village', label: 'Village Score', icon: Building2, color: 'emerald' },
                    { id: 'llpm', label: 'LLPM Score', icon: Calculator, color: 'amber' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                        activeTab === tab.id
                          ? `bg-white dark:bg-slate-700 text-${tab.color}-600 dark:text-${tab.color}-400 shadow-sm`
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* DPL Form */}
                {activeTab === 'dpl' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="report_score">Report (30%)</Label>
                        <Input
                          id="report_score"
                          type="number"
                          min="0"
                          max="100"
                          value={dplForm.data.report_score}
                          onChange={(e) => dplForm.setData('report_score', e.target.value)}
                          placeholder="0-100"
                        />
                        {dplForm.errors.report_score && (
                          <p className="text-sm text-red-500">{dplForm.errors.report_score}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="execution_score">Execution (40%)</Label>
                        <Input
                          id="execution_score"
                          type="number"
                          min="0"
                          max="100"
                          value={dplForm.data.execution_score}
                          onChange={(e) => dplForm.setData('execution_score', e.target.value)}
                          placeholder="0-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="article_score">Article (30%)</Label>
                        <Input
                          id="article_score"
                          type="number"
                          min="0"
                          max="100"
                          value={dplForm.data.article_score}
                          onChange={(e) => dplForm.setData('article_score', e.target.value)}
                          placeholder="0-100"
                        />
                      </div>
                    </div>

                    {/* Live Preview */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">DPL Component Score</span>
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{calculateDplComponent()}</span>
                      </div>
                      <Progress value={parseFloat(calculateDplComponent())} className="h-2" />
                      <p className="text-xs text-slate-500 mt-2">Weighted: 70% of final grade</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dpl_notes">Notes</Label>
                      <textarea
                        id="dpl_notes"
                        value={dplForm.data.notes}
                        onChange={(e) => dplForm.setData('notes', e.target.value)}
                        className="w-full min-h-[100px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        placeholder="Add any notes about this student's performance..."
                      />
                    </div>

                    <Button 
                      onClick={submitDplScore} 
                      disabled={dplForm.processing}
                      className="w-full"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {dplForm.processing ? 'Saving...' : 'Save DPL Score'}
                    </Button>
                  </div>
                )}

                {/* Village Form */}
                {activeTab === 'village' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="discipline_score">Discipline</Label>
                        <Input
                          id="discipline_score"
                          type="number"
                          min="0"
                          max="100"
                          value={villageForm.data.discipline_score}
                          onChange={(e) => villageForm.setData('discipline_score', e.target.value)}
                          placeholder="0-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="attitude_score">Attitude</Label>
                        <Input
                          id="attitude_score"
                          type="number"
                          min="0"
                          max="100"
                          value={villageForm.data.attitude_score}
                          onChange={(e) => villageForm.setData('attitude_score', e.target.value)}
                          placeholder="0-100"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="village_head_name">Village Head Name</Label>
                      <Input
                        id="village_head_name"
                        value={villageForm.data.village_head_name}
                        onChange={(e) => villageForm.setData('village_head_name', e.target.value)}
                        placeholder="Enter village head name"
                      />
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Village Component Score</span>
                        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{calculateVillageComponent()}</span>
                      </div>
                      <Progress value={parseFloat(calculateVillageComponent())} className="h-2 bg-emerald-100" />
                      <p className="text-xs text-slate-500 mt-2">Weighted: 20% of final grade</p>
                    </div>

                    <Button 
                      onClick={() => villageForm.post(route('grades.village.store', kknPeriod.id))}
                      disabled={villageForm.processing}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Village Score
                    </Button>
                  </div>
                )}

                {/* LLPM Form */}
                {activeTab === 'llpm' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="llpm_score">LLPM Score</Label>
                      <Input
                        id="llpm_score"
                        type="number"
                        min="0"
                        max="100"
                        value={llpmForm.data.score}
                        onChange={(e) => llpmForm.setData('score', e.target.value)}
                        placeholder="0-100"
                      />
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">LLPM Weighted Score</span>
                        <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                          {(parseFloat(llpmForm.data.score || '0') * 0.1).toFixed(2)}
                        </span>
                      </div>
                      <Progress value={parseFloat(llpmForm.data.score || '0')} className="h-2 bg-amber-100" />
                      <p className="text-xs text-slate-500 mt-2">Weighted: 10% of final grade</p>
                    </div>

                    <Button 
                      onClick={() => llpmForm.post(route('grades.llpm.store', kknPeriod.id))}
                      disabled={llpmForm.processing}
                      className="w-full bg-amber-600 hover:bg-amber-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save LLPM Score
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 dark:text-slate-400">Select a student from the list to input grades</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
3.4 File Upload Component with Progress
tsx
Copy
// resources/js/Components/FileUpload.tsx
import { useCallback, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { 
  Upload, 
  File, 
  X, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Video,
  FileArchive
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Progress } from '@/Components/ui/progress';

interface FileUploadProps {
  reportType: string;
  reportTypeLabel: string;
  acceptedTypes: string[];
  maxSize: number; // in MB
  existingFile?: {
    url: string;
    name: string;
    status: string;
  } | null;
  onSuccess?: () => void;
}

const fileTypeIcons: Record<string, any> = {
  'pdf': FileText,
  'doc': FileText,
  'docx': FileText,
  'jpg': ImageIcon,
  'jpeg': ImageIcon,
  'png': ImageIcon,
  'mp4': Video,
  'mov': Video,
  'zip': FileArchive,
  'rar': FileArchive,
};

export function FileUpload({ 
  reportType, 
  reportTypeLabel, 
  acceptedTypes, 
  maxSize,
  existingFile,
  onSuccess 
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const form = useForm({
    file: null as File | null,
    type: reportType,
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    if (!acceptedTypes.includes(extension)) {
      alert(`Invalid file type. Accepted: ${acceptedTypes.join(', ')}`);
      return;
    }

    if (file.size > maxSize * 1024 * 1024) {
      alert(`File too large. Max size: ${maxSize}MB`);
      return;
    }

    setSelectedFile(file);
    form.setData('file', file);

    // Create preview for images
    if (['jpg', 'jpeg', 'png'].includes(extension)) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) return;

    form.post(route('reports.upload'), {
      preserveScroll: true,
      onSuccess: () => {
        setSelectedFile(null);
        setPreview(null);
        onSuccess?.();
      },
    });
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    form.setData('file', null);
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || 'file';
    const Icon = fileTypeIcons[ext] || File;
    return <Icon className="w-8 h-8 text-slate-400" />;
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    const styles = {
      not_uploaded: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
      draft: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
      submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
      approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
      revision_required: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    };
    
    return (
      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", styles[status as keyof typeof styles])}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Existing file info */}
      {existingFile && !selectedFile && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getFileIcon(existingFile.name)}
              <div>
                <p className="font-medium text-slate-900 dark:text-white text-sm truncate max-w-[200px]">
                  {existingFile.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(existingFile.status)}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={existingFile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
              >
                View
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Upload area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200 text-center",
          dragActive 
            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" 
            : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600",
          selectedFile && "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/5"
        )}
      >
        <input
          type="file"
          accept={acceptedTypes.map(t => `.${t}`).join(',')}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {selectedFile ? (
          <div className="space-y-4">
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-lg" />
            ) : (
              <div className="w-20 h-20 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                {getFileIcon(selectedFile.name)}
              </div>
            )}
            <div>
              <p className="font-medium text-slate-900 dark:text-white">{selectedFile.name}</p>
              <p className="text-sm text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={clearSelection}
              className="p-2 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Upload className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Drop your file here, or <span className="text-emerald-600 dark:text-emerald-400">browse</span>
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {acceptedTypes.join(', ')} up to {maxSize}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload progress and actions */}
      {selectedFile && (
        <div className="space-y-3">
          {form.progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Uploading...</span>
                <span className="font-medium text-slate-900 dark:text-white">{form.progress.percentage}%</span>
              </div>
              <Progress value={form.progress.percentage} className="h-2" />
            </div>
          )}
          
          {form.errors.file && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              {form.errors.file}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={form.processing}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {form.processing ? 'Uploading...' : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {reportTypeLabel}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={clearSelection}
              disabled={form.processing}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
3.5 Reports Management Page
tsx
Copy
// resources/js/Pages/Reports/Index.tsx
import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { FileUpload } from '@/Components/FileUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { 
  FileText, 
  Map, 
  Video, 
  Newspaper, 
  Award, 
  BookOpen, 
  Target,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface ReportType {
  type: string;
  label: string;
  description: string;
  icon: any;
  acceptedTypes: string[];
  maxSize: number;
  status: string;
  fileUrl?: string;
  submittedAt?: string;
}

interface Props {
  reportTypes: ReportType[];
  groupName: string;
  completionPercentage: number;
}

const iconMap = {
  final_report: FileText,
  village_map: Map,
  activity_video: Video,
  article: Newspaper,
  recognition: Award,
  journal: BookOpen,
  outcome: Target,
};

export default function ReportsIndex({ reportTypes, groupName, completionPercentage }: Props) {
  return (
    <DashboardLayout title="Reports">
      <Head title="Reports" />

      <div className="space-y-6">
        {/* Progress Overview */}
        <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Group {groupName}</p>
                <h2 className="text-2xl font-bold mt-1">Report Submission Progress</h2>
                <p className="text-emerald-100 mt-1">
                  {Math.round(completionPercentage)}% complete • {reportTypes.filter(r => r.status === 'approved').length} of {reportTypes.length} approved
                </p>
              </div>
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <span className="text-3xl font-bold">{Math.round(completionPercentage)}%</span>
              </div>
            </div>
            <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Report Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {reportTypes.map((report) => {
            const Icon = iconMap[report.type as keyof typeof iconMap] || FileText;
            
            return (
              <Card key={report.type} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    {report.status === 'approved' && (
                      <span className="px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Approved
                      </span>
                    )}
                    {report.status === 'submitted' && (
                      <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Reviewing
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-3">{report.label}</CardTitle>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{report.description}</p>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    reportType={report.type}
                    reportTypeLabel={report.label}
                    acceptedTypes={report.acceptedTypes}
                    maxSize={report.maxSize}
                    existingFile={report.fileUrl ? {
                      url: report.fileUrl,
                      name: `${report.type}_document`,
                      status: report.status
                    } : null}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
3.6 Logbook with Real-time Approval
tsx
Copy
// resources/js/Pages/Logbooks/Index.tsx
import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';

interface LogbookEntry {
  id: number;
  date: string;
  title: string;
  description: string;
  problems: string | null;
  solutions: string | null;
  photoUrl: string | null;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  rejectionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
}

interface Props {
  entries: LogbookEntry[];
  isDpl: boolean;
  groupStudents?: Array<{
    id: number;
    name: string;
    pendingCount: number;
  }>;
  selectedStudentId?: number;
}

export default function LogbooksIndex({ entries, isDpl, groupStudents, selectedStudentId }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<LogbookEntry | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEntryForDay = (day: Date) => {
    return entries.find(e => format(parseISO(e.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500';
      case 'submitted': return 'bg-blue-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-slate-300 dark:bg-slate-600';
    }
  };

  const handleApproval = (entryId: number, status: 'approved' | 'rejected', reason?: string) => {
    router.patch(route('logbooks.review', entryId), {
      status,
      rejection_reason: reason,
    }, {
      preserveScroll: true,
      only: ['entries'],
    });
  };

  return (
    <DashboardLayout title="Logbook">
      <Head title="Logbook" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Student list for DPL */}
        {isDpl && groupStudents && (
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Select Student
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {groupStudents.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => router.get(route('logbooks.index'), { student_id: student.id }, { preserveState: true })}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl text-left transition-all",
                      selectedStudentId === student.id
                        ? "bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-500"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800 border-2 border-transparent"
                    )}
                  >
                    <span className="font-medium text-sm text-slate-900 dark:text-white">{student.name}</span>
                    {student.pendingCount > 0 && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                        {student.pendingCount}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className={cn("space-y-6", isDpl ? "lg:col-span-3" : "lg:col-span-4")}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium"
                >
                  Today
                </button>
                <button
                  onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('calendar')}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  viewMode === 'calendar' 
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  viewMode === 'list'
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                List
              </button>
            </div>
          </div>

          {/* Calendar View */}
          {viewMode === 'calendar' && (
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">
                  {day}
                </div>
              ))}
              {days.map((day, idx) => {
                const entry = getEntryForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                
                return (
                  <button
                    key={idx}
                    onClick={() => entry && setSelectedEntry(entry)}
                    className={cn(
                      "aspect-square rounded-xl border-2 p-2 transition-all relative",
                      !isCurrentMonth && "opacity-30",
                      isToday(day) && "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
                      entry ? "hover:shadow-md cursor-pointer" : "border-slate-100 dark:border-slate-800",
                      selectedEntry?.id === entry?.id && "ring-2 ring-emerald-500"
                    )}
                  >
                    <span className={cn(
                      "text-sm font-medium",
                      isToday(day) ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {entry && (
                      <div className={cn(
                        "absolute bottom-2 left-2 right-2 h-1.5 rounded-full",
                        getStatusColor(entry.status)
                      )} />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Entry Detail Modal */}
          {selectedEntry && (
            <Card className="animate-in slide-in-from-bottom-4">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {format(parseISO(selectedEntry.date), 'EEEE, MMMM d, yyyy')}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={cn(
                      selectedEntry.status === 'approved' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                      selectedEntry.status === 'submitted' && "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
                      selectedEntry.status === 'rejected' && "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
                      selectedEntry.status === 'draft' && "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
                    )}>
                      {selectedEntry.status.charAt(0).toUpperCase() + selectedEntry.status.slice(1)}
                    </Badge>
                    {selectedEntry.submittedAt && (
                      <span className="text-xs text-slate-500">
                        Submitted {format(parseISO(selectedEntry.submittedAt), 'MMM d, HH:mm')}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white mb-1">{selectedEntry.title}</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{selectedEntry.description}</p>
                </div>

                {(selectedEntry.problems || selectedEntry.solutions) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedEntry.problems && (
                      <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-lg">
                        <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Problems</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{selectedEntry.problems}</p>
                      </div>
                    )}
                    {selectedEntry.solutions && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Solutions</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{selectedEntry.solutions}</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedEntry.photoUrl && (
                  <img 
                    src={selectedEntry.photoUrl} 
                    alt="Activity" 
                    className="rounded-lg max-h-64 object-cover w-full"
                  />
                )}

                {/* DPL Actions */}
                {isDpl && selectedEntry.status === 'submitted' && (
                  <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <Button
                      onClick={() => handleApproval(selectedEntry.id, 'approved')}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleApproval(selectedEntry.id, 'rejected', 'Please provide more details')}
                      variant="outline"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}

                {selectedEntry.status === 'rejected' && selectedEntry.rejectionReason && (
                  <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-lg">
                    <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Rejection Reason</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{selectedEntry.rejectionReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
Phase 4: Backend Controllers
4.1 Grade Controller
php
Copy
<?php
// app/Http/Controllers/GradeController.php

namespace App\Http\Controllers;

use App\Models\KknPeriod;
use App\Models\User;
use App\Services\GradingService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GradeController extends Controller
{
    public function __construct(
        private GradingService $gradingService
    ) {}

    public function input(KknPeriod $period)
    {
        $this->authorize('inputGrades', $period);

        $students = User::whereHas('kknGroups', function ($q) use ($period) {
            $q->where('kkn_period_id', $period->id);
        })
        ->with(['finalScores' => fn($q) => $q->where('kkn_period_id', $period->id)])
        ->get()
        ->map(fn($s) => [
            'id' => $s->id,
            'name' => $s->name,
            'nim' => $s->nim,
            'group' => $s->kknGroups->first()->name ?? '-',
            'hasDplScore' => $s->dplScores()->where('kkn_period_id', $period->id)->exists(),
            'hasVillageScore' => $s->villageScores()->where('kkn_period_id', $period->id)->exists(),
            'hasLlpmScore' => $s->llpmScores()->where('kkn_period_id', $period->id)->exists(),
            'finalScore' => $s->finalScores->first() ? [
                'total_score' => $s->finalScores->first()->total_score,
                'letter_grade' => $s->finalScores->first()->letter_grade,
                'status' => $s->finalScores->first()->status,
            ] : null,
        ]);

        return Inertia::render('Grades/Input', [
            'students' => $students,
            'kknPeriod' => [
                'id' => $period->id,
                'name' => $period->name,
            ],
        ]);
    }

    public function storeDpl(Request $request, KknPeriod $period)
    {
        $this->authorize('inputDplGrades', $period);

        $validated = $request->validate([
            'student_id' => 'required|exists:users,id',
            'report_score' => 'required|numeric|min:0|max:100',
            'execution_score' => 'required|numeric|min:0|max:100',
            'article_score' => 'required|numeric|min:0|max:100',
            'notes' => 'nullable|string',
        ]);

        $student = User::findOrFail($validated['student_id']);
        
        $this->gradingService->updateDplScore($student, $period, $validated);

        return back()->with('success', 'DPL score saved successfully');
    }

    public function storeVillage(Request $request, KknPeriod $period)
    {
        $this->authorize('inputVillageGrades');

        $validated = $request->validate([
            'student_id' => 'required|exists:users,id',
            'discipline_score' => 'required|numeric|min:0|max:100',
            'attitude_score' => 'required|numeric|min:0|max:100',
            'village_head_name' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $student = User::findOrFail($validated['student_id']);
        
        $this->gradingService->updateVillageScore($student, $period, $validated);

        return back()->with('success', 'Village score saved successfully');
    }

    public function breakdown(User $student, KknPeriod $period)
    {
        $this->authorize('viewGrades', [$student, $period]);

        $breakdown = $this->gradingService->getGradeBreakdown($student, $period);

        return Inertia::render('Grades/Breakdown', [
            'breakdown' => $breakdown,
        ]);
    }
}
4.2 Report Controller
php
Copy
<?php
// app/Http/Controllers/ReportController.php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\KknGroup;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function __construct(
        private ReportService $reportService
    ) {}

    public function index()
    {
        $group = auth()->user()->kknGroups()->latest()->first();
        
        if (!$group) {
            return redirect()->route('dashboard')->with('error', 'You are not assigned to any KKN group');
        }

        $statuses = $this->reportService->getGroupReportStatus($group);
        
        $reportTypes = array_map(function ($type, $config) use ($statuses) {
            return [
                'type' => $type,
                'label' => $config['label'],
                'description' => $config['description'],
                'icon' => $type, // Will be mapped in frontend
                'acceptedTypes' => $config['allowed_extensions'],
                'maxSize' => $config['max_size'] / 1024, // Convert to MB
                'status' => $statuses[$type]['status'],
                'fileUrl' => $statuses[$type]['file_url'],
                'submittedAt' => $statuses[$type]['submitted_at'],
            ];
        }, array_keys($this->reportService->getReportTypes()), $this->reportService->getReportTypes());

        $approvedCount = count(array_filter($statuses, fn($s) => $s['status'] === 'approved'));

        return Inertia::render('Reports/Index', [
            'reportTypes' => $reportTypes,
            'groupName' => $group->name,
            'completionPercentage' => (count($reportTypes) > 0) ? ($approvedCount / count($reportTypes)) * 100 : 0,
        ]);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'type' => 'required|in:' . implode(',', array_keys($this->reportService->getReportTypes())),
            'file' => 'required|file',
        ]);

        $group = auth()->user()->kknGroups()->latest()->firstOrFail();
        
        $report = Report::firstOrNew([
            'kkn_group_id' => $group->id,
            'type' => $request->type,
        ]);

        $report->kkn_group_id = $group->id;
        $report->type = $request->type;
        $report->save();

        $this->reportService->uploadReport($report, $request->file('file'));

        return back()->with('success', 'Report uploaded successfully');
    }
}
Phase 5: Routes & Middleware
php
Copy
<?php
// routes/web.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\LogbookController;
use App\Http\Controllers\WorkshopController;
use App\Http\Controllers\CertificateController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Proposals
    Route::resource('proposals', ProposalController::class);
    
    // Reports
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::post('/reports/upload', [ReportController::class, 'upload'])->name('reports.upload');
    
    // Logbooks
    Route::get('/logbooks', [LogbookController::class, 'index'])->name('logbooks.index');
    Route::post('/logbooks', [LogbookController::class, 'store'])->name('logbooks.store');
    Route::patch('/logbooks/{logbook}/review', [LogbookController::class, 'review'])->name('logbooks.review');
    
    // Grades
    Route::middleware(['role:dpl|admin'])->group(function () {
        Route::get('/grades/{period}/input', [GradeController::class, 'input'])->name('grades.input');
        Route::post('/grades/{period}/dpl', [GradeController::class, 'storeDpl'])->name('grades.dpl.store');
        Route::post('/grades/{period}/village', [GradeController::class, 'storeVillage'])->name('grades.village.store');
        Route::post('/grades/{period}/llpm', [GradeController::class, 'storeLlpm'])->name('grades.llpm.store');
    });
    
    Route::get('/grades/{student}/{period}/breakdown', [GradeController::class, 'breakdown'])->name('grades.breakdown');
    
    // Workshops
    Route::get('/workshops', [WorkshopController::class, 'index'])->name('workshops.index');
    Route::post('/workshops/{workshop}/register', [WorkshopController::class, 'register'])->name('workshops.register');
    
    // Certificates
    Route::get('/certificates/{certificateNumber}/verify', [CertificateController::class, 'verify'])
        ->name('certificates.verify')
        ->withoutMiddleware(['auth']);
    Route::get('/certificates/{registration}/download', [CertificateController::class, 'download'])
        ->name('certificates.download');
});

require __DIR__.'/auth.php';
Summary
This implementation provides:
Database Schema: Comprehensive migrations for all KKN entities with proper relationships
Grading Service: Weighted calculation system with DPL (70%), Village (20%), and LLPM (10%) components
Report Management: 7 document types with status tracking and file storage
Logbook System: Daily activity tracking with DPL approval workflow
Workshop & Certificates: Registration system with PDF certificate generation including QR codes
Modern UI: React components with:
Dark/light mode support
Glassmorphism effects
Real-time progress tracking
Interactive calendars
File upload with drag-and-drop
Responsive design with Tailwind CSS
The system is built on Laravel 12 with Inertia.js for seamless SPA-like experience while maintaining Laravel's robust backend architecture.