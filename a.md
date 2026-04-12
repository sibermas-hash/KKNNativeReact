For a KKN Management System with Laravel + Inertia.js + React, the cleanest enterprise-grade solution is NOT purely date-driven and NOT purely state-driven.
The recommended architecture is a Hybrid: State Machine + Date Windows.

This pattern is used in many academic systems, ERP workflows, and large SaaS platforms.

1. Date-Driven vs State-Driven (Recommended Architecture)
❌ Pure Date-Driven (Not Recommended)

Example:

registration_start
registration_end
execution_start
execution_end

System checks now() against these values.

Problems
Admin cannot pause or rollback phases
Hard to override for specific students
Hard to validate sequential transitions
Breaks when manual intervention is required

Example problem:

Group A finishes early
But execution_end still next week

System becomes rigid.

❌ Pure State Machine Only

Example:

current_phase = REGISTRATION
Problems
No scheduling
Requires manual admin switching every phase
✅ Best Practice: Hybrid Phase Engine

Use state machine as the source of truth and date ranges as automation triggers.

Example database
kkn_phases
---------
id
phase_key
phase_name
start_date
end_date
status

Example data:

phase_key	start_date	end_date	status
PRE_REGISTRATION	1 Jan	10 Jan	CLOSED
REGISTRATION	11 Jan	20 Jan	ACTIVE
PLOTTING	21 Jan	25 Jan	PENDING
EXECUTION	26 Jan	30 Mar	PENDING
GRADING	1 Apr	10 Apr	PENDING
FINALIZED	11 Apr	-	PENDING
State Enum
enum KknPhase
{
    PRE_REGISTRATION
    REGISTRATION
    PLOTTING
    EXECUTION
    GRADING
    FINALIZED
}

System always reads:

current_phase

Dates are secondary automation.

2. Feature Gating (Cleanest Enterprise Pattern)

Use Phase Middleware + Policy Layer

Layer 1 — Middleware (Global Phase Guard)
php artisan make:middleware EnsurePhase

Example:

class EnsurePhase
{
    public function handle($request, Closure $next, $phase)
    {
        if (KknPhaseService::current() !== $phase) {
            abort(403, 'Feature not available in this phase.');
        }

        return $next($request);
    }
}

Route example:

Route::middleware(['phase:EXECUTION'])->group(function () {
    Route::get('/logs', LogController::class);
});
Layer 2 — Policy (User-level access)
StudentPolicy

Example:

public function logActivity(Student $student)
{
    return KknPhaseService::isExecutionPhase();
}

This ensures:

SYSTEM PHASE ✔
+
USER PERMISSION ✔
3. Phase Controller (Admin UI/UX)

Enterprise systems use a Phase Timeline Controller.

UI Pattern
PRE-REGISTRATION   ✔ Completed
REGISTRATION       ✔ Completed
PLOTTING           ▶ Active
EXECUTION          ○ Pending
GRADING            ○ Pending
FINALIZED          ○ Pending

Admin controls:

[ Activate Phase ]
[ Rollback ]
[ Skip Phase ]
[ Lock Phase ]
Recommended UX Layout
KKN Phase Controller
--------------------------------

[ PRE-REGISTRATION ]  ✔ Completed
[ REGISTRATION ]      ✔ Completed
[ PLOTTING ]          ▶ Active
[ EXECUTION ]         ○ Locked
[ GRADING ]           ○ Locked
[ FINALIZED ]         ○ Locked

--------------------------------

Current Phase: PLOTTING

Next Phase: EXECUTION

[ Advance Phase ]
Transition Validation

Before moving phases run validators.

Example:

REGISTRATION -> PLOTTING

Check:

all students registered
minimum quota reached
documents uploaded

Service example:

PhaseTransitionService
canTransitionTo(PLOTTING)
4. Handling Edge Cases (Scalability)

Academic systems must support exceptions.

Case 1 — Group finishes early

Solution:

group_status

Example table:

kkn_groups
-----------
id
location
status

Statuses:

ACTIVE
COMPLETED
EXTENDED

Execution phase stays active but groups can finish earlier.

Case 2 — Student exemption

Example:

students
---------
id
phase_override

Example:

phase_override = EXECUTION

System logic:

effective_phase =
student_override ?? system_phase
Case 3 — Manual Admin Override

Admin UI:

Student Phase Override

Student: Ahmad
Current Phase: REGISTRATION

Override To:
[ EXECUTION ]

Reason:
[ Field Replacement ]

Audit log:

phase_overrides
----------------
id
student_id
from_phase
to_phase
reason
created_by
created_at
5. Domain Architecture (Recommended)

Follow DDD-lite architecture.

app/
 ├ Domains/
 │   ├ KKN
 │   │   ├ Models
 │   │   ├ Services
 │   │   ├ Policies
 │   │   ├ Enums
 │   │   ├ Actions
 │   │   └ Events

Example services:

KknPhaseService
KknPlacementService
KknExecutionService
KknGradingService
6. Recommended Database Structure

Core tables:

kkn_phases
students
kkn_registrations
kkn_groups
kkn_group_members
kkn_logs
kkn_grades
phase_overrides
7. Automation Layer

Add scheduled automation.

php artisan schedule

Example:

CheckPhaseTransitionJob

Logic:

if today > phase.end_date
→ suggest next phase

Admin still confirms.

8. Clean Architecture Flow

Student accesses execution log:

Request
  ↓
Middleware EnsurePhase
  ↓
Policy Check
  ↓
Controller
  ↓
Domain Service
  ↓
Repository / Model
9. Enterprise Features You Should Consider
Audit Log
phase_changes
---------------
phase
changed_by
timestamp
Notifications

Send notification when phase changes.

Email / WhatsApp / Dashboard.

Phase Dashboard

Admin dashboard:

Total Students: 850
Registered: 820
Grouped: 810
Active in Field: 790
Completed: 120
10. Final Architecture Recommendation

Architecture Pattern

Hybrid Phase Engine
+ Middleware Feature Gating
+ Policy Authorization
+ Domain Services
+ Phase Controller UI
+ Override System

Benefits:

✔ predictable workflow
✔ admin control
✔ scalable for thousands of students
✔ exception handling
✔ enterprise maintainability

💡 Important Advice

Your KKN system is basically a Workflow Engine.

So treat phases like:

Finite State Machine

With:

Transitions
Validation
Guards
Overrides

If you want, I can also show you:

A real production-grade architecture used by universities

including:

database schema
Laravel service layer
React admin UI
phase transition engine

It will save weeks of development mistakes.

Building a KKN (Student Community Service) system requires balancing rigid institutional timelines with the messy reality of fieldwork. For an enterprise-grade Laravel/Inertia stack, you should move away from simple date checks toward a State-Machine driven architecture with a Date-Aware Overlay.

Here is a professional architectural recommendation for your multi-stage workflow.

1. State-Driven vs. Date-Driven: The "Hybrid" Approach
Relying solely on dates is risky; if an admin isn't ready to release group placements on the exact date specified, the system will break.

Recommendation: Use a State Machine as the "Source of Truth," but use Dates as "Triggers" or "Constraints."

Global Period State: Maintain a kkn_periods table with a status column (e.g., registration, plotting, execution).

The Logic: An admin manually "advances" the phase. However, the system prevents advancement if current dates don't match or validation fails (e.g., "Cannot move to Execution because 10 groups have no supervisor assigned").

2. Feature Gating: The "Pipeline" Middleware
The cleanest way to handle this in Laravel 11 is through a combination of Global Scopes and Custom Middleware.

The Phase Middleware
Create a middleware that checks the active period's status. Instead of hardcoding strings, use a WorkflowStatus Enum.

PHP
// app/Http/Middleware/EnsureAcademicPhase.php
public function handle(Request $request, Closure $next, string $requiredPhase)
{
    $currentPhase = Period::active()->status; 

    if ($currentPhase->value !== $requiredPhase) {
        return redirect()->route('dashboard')->with('error', 'This feature is not yet available.');
    }

    return $next($request);
}
Route Definition
In your web.php, group your routes by phase. This makes the codebase self-documenting.

PHP
Route::middleware(['auth', 'phase:registration'])->group(function () {
    Route::post('/register-kkn', [RegistrationController::class, 'store']);
});

Route::middleware(['auth', 'phase:execution'])->group(function () {
    Route::post('/daily-log', [LogbookController::class, 'store']);
});
3. Admin Controls: The "Command Center"
For the UI/UX in React, avoid a simple dropdown. Use a Linear Stepper that acts as a "Pre-flight Checklist."

Transition Validation: Before moving from Registration to Plotting, the Admin UI should hit an API endpoint that returns a checklist:

[OK] Registration closed.

[ERROR] 15 students haven't uploaded their health certificates.

The "Safety Lock": Implement a "Maintenance Mode" toggle for the period so admins can adjust data without students triggering race conditions during a phase shift.

4. Scalability & Edge Cases (The "Override" Pattern)
In KKN, a global state is often too broad. Some students might be in "Execution" while a late-registered student is still in "Registration."

The "Status Hierarchy"
Implement a status on both the Period (Global) and the Student/Group (Local).

Global Status: Defines the default behavior.

Local Status: (e.g., kkn_registrations.status) Allows for overrides.

Strategy for Manual Overrides:
Use a Spatie Permissions or a custom Policy that checks for an is_overridden flag.

PHP
public function view(User $user, KknRegistration $registration)
{
    // If the student is finished early, they can see 'Grading' 
    // even if the Global Period is still in 'Execution'.
    return $registration->status === WorkflowStatus::GRADING;
}
5. Technical Stack Implementation Tips
State Machine Package: Use spatie/laravel-model-states. It allows you to define transitions, so you can't accidentally jump from Pre-Registration to Grading.

Inertia Shared Data: Share the current_phase in HandleInertiaRequests.php. This allows you to hide/show Nav links in your React components globally without extra API calls.

Audit Logs: Since this is "Academic Infrastructure," log every state change. Use spatie/laravel-activitylog to track which admin pushed the period into the next phase.

Enterprise-grade architectural recommendation for your KKN Management System (Laravel 11 + Inertia.js + React)
Multi-stage academic workflows like Pre-Registration → Registration → Group Placement/Plotting → Field Execution (Logging) → Grading → Finalized are classic stateful business processes. The gold-standard pattern in enterprise systems (university ERPs, LMS platforms, and similar Laravel-based academic tools) is the State Machine Pattern combined with a hybrid date/state model.
This is far superior to ad-hoc if (now()->between(...)) checks scattered across controllers. It gives you explicit transitions, guards, history, events, and auditability—exactly what you need for compliance, overrides, and scalability.
Recommended Stack (Production-Ready & Laravel 11 Native)

State Management: spatie/laravel-model-states (v2+ – actively maintained, Laravel 11 compatible). It combines the State Pattern (states as dedicated classes) + State Machine (explicit transitions + guards).
Alternative (also excellent): asantibanez/laravel-eloquent-state-machines if you prefer a lighter trait-based approach with built-in history.

Why this over raw Enums? Enums alone can't enforce transitions, run guards, or log history cleanly.
Additional tools:
Spatie Activity Log (or the state machine’s built-in history) for audit trail.
Laravel Events + Listeners/Notifications on every transition.
Laravel Scheduler for optional auto-advance.
Inertia shared data + React components for UI consistency.


Core models you’ll need:

KknCycle (or AcademicPeriod): one active cycle per semester/year with global phase.
KknRegistration / StudentKkn / KknGroup: per-student/group entities with their own status (for overrides).

1. Date-Driven vs. State-Driven → Hybrid (State-Driven Primary)
Pure Date-Driven (only registration_start, execution_end etc. on KknCycle):

Pros: Simple, predictable for students.
Cons: No transition validation, impossible to handle exceptions gracefully, no history/audit, brittle when admin needs to extend one phase.

Pure State-Driven (recommended base):

Define phases as state classes:PHP// app/States/KknPhase/PreRegistration.php
use Spatie\ModelStates\State;
class PreRegistration extends KknPhaseState {
    public function color(): string { return 'blue'; }
    // custom methods: canRegister(), etc.
}
// ... similarly for Registration, Plotting, Execution, Grading, Finalized
On KknCycle model:PHPuse Spatie\ModelStates\HasStates;

class KknCycle extends Model {
    use HasStates;

    protected function registerStates(): void
    {
        $this->addState('phase', KknPhaseState::class)
            ->default(PreRegistration::class)
            ->allowTransition(PreRegistration::class, Registration::class)
            ->allowTransition(Registration::class, Plotting::class, /* custom Transition class with guards */)
            // ... all sequential + any allowed manual jumps
            ->allowTransition(Execution::class, Grading::class);
    }
}

Hybrid Recommendation (Enterprise Best Practice):

Store date ranges as metadata on KknCycle (or a separate KknPhaseSchedule pivot) for UI display, student-facing countdowns, and optional auto-advance via Scheduler.
State is the source of truth for feature gating and logic.
Daily scheduler job:PHP// app/Console/Commands/AdvanceKknPhase.php
$cycle = KknCycle::current();
if ($cycle->shouldAutoAdvance()) {
    $cycle->phase->transitionTo(NextPhase::class); // runs guards automatically
}
Benefits:
Dates handle “normal flow”.
State handles overrides, early/late transitions, and validation.
Full history and auditability out of the box.


This is how mature academic systems (and tools like Moodle/Canvas under the hood) work.
2. Feature Gating (Cleanest Implementation)
Server-side enforcement first (never trust frontend).
Layered approach (best for Inertia + React):

Policies (most Laravel-native):PHPclass KknCyclePolicy
{
    public function accessExecution(User $user, KknCycle $cycle): bool
    {
        return $cycle->phase->isAtLeast(Execution::class) 
            && $user->studentKkn?->status->canLog();
    }
}
Custom Middleware (for route groups):PHP// app/Http/Middleware/CheckKknPhase.php
public function handle(Request $request, Closure $next, string $requiredPhase)
{
    $cycle = KknCycle::currentOrFail();
    if (!$cycle->phase->isAtLeast($requiredPhase)) {
        abort(403, "KKN is currently in {$cycle->phase} phase.");
    }
    return $next($request);
}Usage:PHPRoute::middleware(['auth', 'kkn.phase:execution'])->prefix('execution')->group(...);
Inertia Shared Data (for React conditional rendering):
In HandleInertiaRequests.php:PHPInertia::share([
    'currentKknPhase' => fn () => KknCycle::current()?->phase,
    'userKknStatus'   => fn () => auth()->user()?->studentKkn?->status,
]);In React: Use the prop to disable/hide tabs, show banners (“Registration is closed”), etc. But always re-validate on form submission.
Extra: Laravel Gates for fine-grained abilities (canLogField, canViewGrading).

This gives you clean, testable, reusable gating without scattering if conditions everywhere.
3. Admin "Phase Controller" UI/UX Pattern
Intuitive pattern: Central Phase Dashboard (single Inertia page: /admin/kkn/phase).

Visual Stepper (React + shadcn/ui or Mantine Stepper component):
Horizontal or vertical timeline showing all 6 phases.
Current phase = active + highlighted.
Past phases = completed (green check).
Future phases = locked (gray).

Phase Card:
Phase name + dates + key metrics (% registered, groups plotted, logs submitted, etc.).
“Advance to Next Phase” primary button → opens confirmation modal.

Modal Flow (sequential + validated):
Checklist (auto-populated + clickable):
“All students have registered?” (with count + link to incomplete list).
“All groups plotted?” etc.

Optional “Override reason” textarea (required for manual jumps).
Preview panel: “This will affect X students/groups”.
“Confirm Transition” → calls PhaseController@advance.

Backend (PhaseController):PHPpublic function advance(AdvanceKknPhaseRequest $request)
{
    $cycle = KknCycle::current();
    $cycle->phase->transitionTo($request->nextPhase); // runs all guards automatically
    // Dispatch event → notifications, logging, etc.
    return back()->with('success', 'Phase advanced successfully');
}
Extra admin tools:
Bulk student/group status overrides (table with filters).
Full transition history log (with who/when/why).
“Lock phase” toggle (prevents further student actions).


This UX feels professional and prevents mistakes—admins see exactly what they’re doing.
4. Scalability & Edge Cases
Designed for exceptions from day one:

Groups finishing early / late: Each KknGroup or StudentKkn has its own status state machine (same Spatie setup). Global phase sets the “allowed window”, but individual status can be ahead/behind.
Policy example: canLog() checks globalPhase >= Execution && groupStatus->is(Execution::class).

Manual overrides:
Add forceTransitionTo() method on the state machine (bypasses some guards but still logs).
Admin-only policy.

Data validation on transitions:
Use custom Transition classes in Spatie (e.g., RegistrationToPlottingTransition with canTransition() guard that runs complex queries).
Hook into before / after transition events.

Performance at scale:
Cache current cycle + phase (Cache::remember('current_kkn_cycle', ...)).
Queue heavy side-effects (mass notifications, report generation) on transition.
Use Eloquent eager loading + indexing on phase column (cast to string).
For very large universities: consider Laravel Octane + Horizon for queue workers.

Audit & Compliance: Every transition is logged with user, timestamp, reason, and before/after snapshot.

Final Architecture Summary (Recommended Folder Structure)
textapp/
├── States/KknPhase/          # PreRegistration.php, Execution.php etc.
├── Models/
│   ├── KknCycle.php
│   ├── KknGroup.php
│   └── StudentKkn.php
├── Policies/
├── Http/Middleware/CheckKknPhase.php
├── Services/KknPhaseService.php   # orchestration if needed
└── Events/KknPhaseAdvanced.php
This approach is maintainable, auditable, flexible, and scales from one university to multi-campus. It follows SOLID principles and Laravel best practices while giving you enterprise-level workflow control.
If you want, I can provide:

Full starter code for the KknPhaseState hierarchy.
Example React Stepper + Inertia page.
Database migration + seeder for a sample cycle.

Just let me know which part you'd like next! This pattern has been battle-tested in similar academic Laravel projects and will serve you well.

I'll provide you with a comprehensive enterprise-grade architectural recommendation for your KKN Management System. This is a complex workflow orchestration problem that requires a hybrid approach combining state machines with temporal controls.
1. Hybrid Architecture: State-Driven with Date Constraints
Recommendation: Use a State Machine with Date-Based Validation, not pure dates.
Why Not Pure Date-Driven?
Brittle: Hard to handle exceptions (extensions, early completions)
No audit trail: Can't track who changed phases and why
Race conditions: Multiple simultaneous requests can cause inconsistent states
Impossible to pause: Can't freeze the system for maintenance or disputes
Why Not Pure State-Driven?
Manual overhead: Admins must remember to trigger every transition
No automatic progression: System can't auto-advance at semester end
Inconsistent with academic reality: Deadlines exist and must be enforced
The Hybrid Solution: Temporal State Machine
php
Copy
// Core State Machine Definition
namespace App\Domain\Kkn\Enums;

enum KknPhase: string {
    case PRE_REGISTRATION = 'pre_registration';
    case REGISTRATION = 'registration';
    case GROUP_PLACEMENT = 'group_placement';
    case FIELD_EXECUTION = 'field_execution';
    case GRADING = 'grading';
    case FINALIZED = 'finalized';
    
    // Define valid transitions (directed graph)
    public function canTransitionTo(self $target): bool {
        $validTransitions = [
            self::PRE_REGISTRATION->value => [self::REGISTRATION],
            self::REGISTRATION->value => [self::GROUP_PLACEMENT, self::PRE_REGISTRATION], // Allow rollback
            self::GROUP_PLACEMENT->value => [self::FIELD_EXECUTION, self::REGISTRATION],
            self::FIELD_EXECUTION->value => [self::GRADING, self::GROUP_PLACEMENT],
            self::GRADING->value => [self::FINALIZED, self::FIELD_EXECUTION],
            self::FINALIZED->value => [], // Terminal state
        ];
        
        return in_array($target, $validTransitions[$this->value] ?? [], true);
    }
    
    public function getNext(): ?self {
        return match($this) {
            self::PRE_REGISTRATION => self::REGISTRATION,
            self::REGISTRATION => self::GROUP_PLACEMENT,
            self::GROUP_PLACEMENT => self::FIELD_EXECUTION,
            self::FIELD_EXECUTION => self::GRADING,
            self::GRADING => self::FINALIZED,
            self::FINALIZED => null,
        };
    }
}
php
Copy
// Phase Configuration with Temporal Constraints
namespace App\Domain\Kkn\Models;

class KknPeriod extends Model {
    protected $fillable = [
        'academic_year',
        'semester',
        'phase', // Current state (enum)
        'phase_entered_at',
        'phase_entered_by', // Admin who triggered
        'transition_reason',
        
        // Temporal boundaries (soft constraints)
        'planned_registration_start',
        'planned_registration_end',
        'planned_execution_start',
        'planned_execution_end',
        
        // Actual dates (what really happened)
        'actual_registration_start',
        'actual_registration_end',
        
        // Override flags for edge cases
        'is_frozen', // Pause all transitions
        'allow_early_completion',
    ];
    
    // State machine guard: Temporal validation
    public function canAutoAdvance(): bool {
        if ($this->is_frozen) return false;
        
        return match($this->phase) {
            KknPhase::REGISTRATION => now()->gte($this->planned_registration_end),
            KknPhase::FIELD_EXECUTION => now()->gte($this->planned_execution_end),
            default => false, // Manual phases require admin action
        };
    }
    
    // Business rule validation before transition
    public function validateTransition(KknPhase $target): ValidationResult {
        $errors = [];
        
        // 1. State machine validity
        if (!$this->phase->canTransitionTo($target)) {
            $errors[] = "Invalid transition from {$this->phase->value} to {$target->value}";
        }
        
        // 2. Data completeness validation
        $errors = array_merge($errors, $this->validatePhaseData($target));
        
        // 3. Temporal constraints (can be overridden by admin)
        if (!$this->is_manual_override) {
            $errors = array_merge($errors, $this->validateTemporalConstraints($target));
        }
        
        return ValidationResult::make($errors);
    }
    
    private function validatePhaseData(KknPhase $target): array {
        return match($target) {
            KknPhase::GROUP_PLACEMENT => $this->validateAllStudentsRegistered(),
            KknPhase::FIELD_EXECUTION => $this->validateAllGroupsPlotted(),
            KknPhase::GRADING => $this->validateExecutionLogsComplete(),
            KknPhase::FINALIZED => $this->validateGradesPublished(),
            default => [],
        };
    }
}
2. Feature Gating Architecture
Layer 1: Middleware (Request-Level Blocking)
php
Copy
namespace App\Http\Middleware;

class KknPhaseGate {
    public function handle(Request $request, Closure $next, string $requiredPhase) {
        $period = KknPeriod::active(); // Current active period
        
        // Check if we're in the required phase
        if ($period->phase->value !== $requiredPhase) {
            // Return Inertia response with proper error handling
            return back()->with('flash', [
                'type' => 'error',
                'message' => "This feature is only available during the {$requiredPhase} phase.",
                'current_phase' => $period->phase->value,
                'expected_phase' => $requiredPhase,
            ]);
        }
        
        return $next($request);
    }
}
php
Copy
// Route definition
Route::middleware(['auth', 'kkn.phase:field_execution'])->group(function () {
    Route::post('/logs', [ExecutionLogController::class, 'store']);
    Route::put('/logs/{log}', [ExecutionLogController::class, 'update']);
});
Layer 2: Policy-Based Authorization (Fine-Grained Control)
php
Copy
namespace App\Policies;

class ExecutionLogPolicy {
    public function create(User $user): bool {
        $period = KknPeriod::active();
        
        // Basic phase check
        if ($period->phase !== KknPhase::FIELD_EXECUTION) {
            return false;
        }
        
        // Individual student override check
        $enrollment = $user->currentKknEnrollment();
        
        // Edge case: Student finished early, admin granted early grading access
        if ($enrollment?->phase_override === KknPhase::GRADING) {
            return false; // They should use grading features now, not logging
        }
        
        // Edge case: Student granted extended execution time
        if ($enrollment?->execution_extended_until?->isFuture()) {
            return true; // Still allowed to log even if global phase ended
        }
        
        return true;
    }
}
Layer 3: Service Layer (Business Logic Enforcement)
php
Copy
namespace App\Domain\Kkn\Services;

class ExecutionLogService {
    public function createLog(CreateLogDTO $dto): ExecutionLog {
        return DB::transaction(function() use ($dto) {
            // Re-verify all conditions (defense in depth)
            $this->gate->authorize('create', ExecutionLog::class);
            
            // Additional business rules
            $enrollment = $dto->user->currentKknEnrollment();
            
            if ($enrollment->isSuspended()) {
                throw new BusinessRuleException("Cannot create logs while suspended");
            }
            
            // Create with phase context for audit trail
            return ExecutionLog::create([
                ...$dto->toArray(),
                'created_during_phase' => KknPeriod::active()->phase,
                'period_id' => KknPeriod::active()->id,
            ]);
        });
    }
}
Layer 4: Frontend State Synchronization
TypeScript
Copy
// React Hook for phase-aware feature toggling
export function useKknPhase() {
    const { props } = usePage<SharedData>();
    
    return {
        currentPhase: props.kknPeriod.phase,
        phaseConfig: props.kknPeriod.config,
        
        // Computed permissions
        canRegister: props.kknPeriod.phase === 'registration' && 
                     props.auth.user.enrollment?.status === 'eligible',
        
        canLogActivity: props.kknPeriod.phase === 'field_execution' || 
                        props.auth.user.enrollment?.phase_override === 'field_execution',
        
        // Time-based warnings
        phaseEndsAt: props.kknPeriod.plannedPhaseEnd,
        daysRemaining: calculateDaysRemaining(props.kknPeriod.plannedPhaseEnd),
        
        // Override status for UI badges
        isOverridden: !!props.auth.user.enrollment?.phase_override,
        overrideReason: props.auth.user.enrollment?.override_reason,
    };
}

// Component usage with automatic UI adaptation
function ActivityLogger() {
    const { canLogActivity, currentPhase, isOverridden } = useKknPhase();
    
    if (!canLogActivity) {
        return <PhaseLockedMessage currentPhase={currentPhase} />;
    }
    
    return (
        <div>
            {isOverridden && <OverrideBadge reason={overrideReason} />}
            <LogForm />
        </div>
    );
}
3. Admin Phase Controller UI/UX Pattern
Recommended Pattern: "Mission Control" Dashboard
Design Philosophy: Treat phase transitions like rocket launches—requires checklists, confirmations, and abort capabilities.
TypeScript
Copy
// React Component Structure
function PhaseControlCenter() {
    const { period, statistics, validationResults } = usePhaseControl();
    
    return (
        <div className="phase-control-center">
            {/* Visual Pipeline */}
            <PhasePipeline 
                currentPhase={period.phase}
                phases={KKN_PHASES}
                statistics={statistics}
            />
            
            {/* Active Phase Card */}
            <CurrentPhaseCard 
                period={period}
                onAdvance={handlePhaseAdvance}
                onRollback={handlePhaseRollback}
                onFreeze={handleFreeze}
            />
            
            {/* Validation Dashboard */}
            <PreFlightChecklist 
                validations={validationResults}
                onResolve={navigateToResolve}
            />
            
            {/* Exception Management */}
            <ExceptionQueue 
                pendingApprovals={period.pendingExceptions}
            />
        </div>
    );
}
Key UI Components:
Visual Pipeline: Horizontal stepper showing all phases
Green: Completed phases with timestamp
Blue: Current active phase
Gray: Future phases
Yellow: Phases with warnings
Red: Phases blocked by validation errors
Current Phase Card:
Large phase indicator with "time in phase" counter
Auto-advance countdown (if configured)
Primary action: "Advance to [Next Phase]" (disabled until validations pass)
Secondary actions: "Rollback", "Freeze System", "Emergency Override"
Pre-Flight Checklist:
Collapsible sections for each validation category
Real-time counters (e.g., "245/250 students registered")
"Fix Issues" buttons that navigate to relevant admin pages
Override toggles for each validation (with required justification)
Transition Modal:
TypeScript
Copy
function PhaseTransitionModal({ targetPhase, onConfirm }) {
    return (
        <Modal>
            <Alert level="warning">
                You are about to transition from {currentPhase} to {targetPhase}.
                This will affect {studentCount} students.
            </Alert>
            
            <ConfirmationChecklist>
                <Checkbox>I have verified all pre-flight checks</Checkbox>
                <Checkbox>I understand this will {impactDescription}</Checkbox>
                <Checkbox>I have notified stakeholders (auto-send available)</Checkbox>
            </ConfirmationChecklist>
            
            <TextArea 
                label="Transition Reason (required)"
                required
            />
            
            <div className="actions">
                <Button variant="danger" onClick={onConfirm}>
                    Confirm Transition
                </Button>
                <Button variant="secondary">Abort</Button>
            </div>
        </Modal>
    );
}
4. Handling Edge Cases & Scalability
Pattern: Per-Entity Phase Overrides
php
Copy
// Enrollment-level override for individual exceptions
class KknEnrollment extends Model {
    protected $fillable = [
        'student_id',
        'period_id',
        'group_id',
        
        // Override system
        'phase_override',
        'override_granted_by',
        'override_granted_at',
        'override_reason',
        'override_expires_at', // Optional time limit
        
        // Extension system (for early/late completion)
        'execution_started_at',
        'execution_extended_until',
        'execution_completed_at',
        
        // Status tracking
        'status', // active, suspended, completed, withdrawn
    ];
    
    public function effectivePhase(): KknPhase {
        // Priority: Override > Individual Timeline > Global Phase
        if ($this->phase_override && $this->override_expires_at?->isFuture()) {
            return $this->phase_override;
        }
        
        if ($this->execution_completed_at) {
            return KknPhase::GRADING; // Auto-advance completed students
        }
        
        if ($this->execution_extended_until?->isFuture()) {
            return KknPhase::FIELD_EXECUTION; // Extended time
        }
        
        return $this->period->phase;
    }
}
Pattern: Async Processing for Bulk Operations
php
Copy
// When transitioning phases with 1000+ students
class PhaseTransitionJob implements ShouldQueue {
    use Batchable, Dispatchable;
    
    public function handle(PhaseTransitionService $service) {
        // Process in chunks to avoid timeout
        KknEnrollment::where('period_id', $this->periodId)
            ->where('status', 'active')
            ->chunkById(100, function($enrollments) use ($service) {
                foreach ($enrollments as $enrollment) {
                    $service->applyPhaseTransition($enrollment, $this->targetPhase);
                }
            });
        
        // Notify admins of completion
        event(new PhaseTransitionCompleted($this->periodId));
    }
}
Pattern: Feature Flags for Gradual Rollout
php
Copy
// For testing new phases with specific groups
class KknFeatureFlag {
    public function isEnabled(string $feature, User $user): bool {
        $period = KknPeriod::active();
        
        // Global kill switch
        if ($period->is_frozen) return false;
        
        // Phase-based gating
        if (!$period->phase->allowsFeature($feature)) {
            // Check for pilot group membership
            if ($user->isInPilotGroup($feature)) {
                return true;
            }
            return false;
        }
        
        return true;
    }
}
5. Complete System Architecture Diagram
plain
Copy
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React UI   │  │  Phase Ctrl  │  │   Student    │      │
│  │  (Features)  │  │   Dashboard  │  │   Portal     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          │                 │                 │
          └─────────────────┴─────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────┐
│                  INERTIA / API LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Phase      │  │   Feature    │  │   Override   │      │
│  │  Controller  │  │   Gateway    │  │   Controller │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          │                 │                 │
┌─────────▼─────────────────▼─────────────────▼───────────────┐
│                   DOMAIN LAYER                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Phase Management Service                  │    │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐      │    │
│  │  │   State    │  │  Temporal  │  │ Validation │      │    │
│  │  │  Machine   │  │  Engine    │  │   Engine   │      │    │
│  │  └────────────┘ └────────────┘ └────────────┘      │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Enrollment │  │    Group     │  │    Grading   │      │
│  │   Service    │  │   Service    │  │    Service   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Database   │  │    Queue     │  │     Cache    │      │
│  │  (Postgres)  │  │    (Redis)   │  │   (Redis)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
6. Database Schema Essentials
php
Copy
// Migration structure
Schema::create('kkn_periods', function (Blueprint $table) {
    $table->id();
    $table->string('academic_year');
    $table->enum('semester', ['odd', 'even']);
    $table->string('phase'); // Enum value
    $table->timestamp('phase_entered_at');
    $table->foreignId('phase_entered_by')->constrained('users');
    $table->text('transition_reason');
    
    // Temporal planning
    $table->timestamp('planned_registration_start')->nullable();
    $table->timestamp('planned_registration_end')->nullable();
    $table->timestamp('planned_execution_start')->nullable();
    $table->timestamp('planned_execution_end')->nullable();
    
    // Actual execution tracking
    $table->timestamp('actual_registration_start')->nullable();
    $table->timestamp('actual_registration_end')->nullable();
    
    // Control flags
    $table->boolean('is_frozen')->default(false);
    $table->boolean('allow_early_completion')->default(false);
    $table->json('validation_overrides')->nullable(); // Which checks were skipped
    
    $table->timestamps();
    $table->softDeletes();
});

Schema::create('kkn_phase_transitions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('period_id')->constrained('kkn_periods');
    $table->string('from_phase');
    $table->string('to_phase');
    $table->timestamp('occurred_at');
    $table->foreignId('triggered_by')->constrained('users');
    $table->string('trigger_type'); // manual, auto, scheduled, api
    $table->text('reason');
    $table->json('validation_snapshot'); // State of validations at transition
    $table->json('affected_entities'); // Counts of students/groups affected
    
    $table->timestamps();
});
Summary: Key Architectural Decisions
Table
Decision	Choice	Rationale
State vs Date	Hybrid	Academic workflows need both structure (state) and real-world constraints (dates)
Gating Strategy	4-Layer Defense	Middleware (coarse) → Policy (medium) → Service (fine) → Frontend (UX)
Admin Control	Mission Control Pattern	Academic admins need visibility, validation, and safety mechanisms
Edge Cases	Per-Entity Overrides	Scales from individual accommodations to bulk exceptions
Audit Trail	Immutable Transition Log	Academic integrity requires complete history
This architecture provides the rigidity needed for academic compliance while maintaining the flexibility required for real-world exceptions. The state machine ensures data integrity, while the temporal layer handles the reality of academic schedules.

Okay, this is a detailed technical question about Laravel/Inertia/React architecture for a multi-stage academic workflow system. The user is building a KKN Management System - that's like community service placement in Indonesia. They're asking about four specific areas: date-driven vs state-driven, feature gating, admin controls UI, and scalability with edge cases.

Hmm, the user clearly has some experience - they're asking for enterprise-grade approaches, not basic CRUD. They've identified the core tension: dates are simple but inflexible, while pure state machines lack temporal context. For academic workflows, you actually need both. The registration period might have fixed dates, but individual groups can have different execution timelines or need manual overrides.

I should recommend a hybrid approach. A status field that can be overridden, but with date ranges as validation rules. That way the system can auto-transition based on time, but admins can force early progression or handle exceptions. For feature gating, Laravel's Gate and Policy system is perfect here - check both the workflow state and the user's group status. Inertia middleware can protect routes, and React components can hide UI elements based on permissions.

The admin Phase Controller needs to handle sequential progression with validation. Think about pre-transition hooks - when moving from Registration to Plotting, verify that minimum group size is met. Also need partial overrides for groups that finish early - that's where per-group status shines. The global system status provides default behavior, but each group can have its own execution status.

Edge cases: some groups finishing early should be able to log completion while others continue. Overrides need audit trails. The admin dashboard should show both global phase and any group-specific deviations.

I'll structure the response with clear sections, code examples for Laravel policies and React components, database schema suggestions, and a practical implementation sequence. The tone should be confident and solution-oriented, showing real architectural thinking.

This is an excellent architectural question. For a KKN Management System, you're dealing with a classic "multi-tenant workflow" problem where the program has a timeline, but groups have individual execution states.

Here is an enterprise-grade architectural recommendation for Laravel 11, Inertia.js, and React.

Core Recommendation: Hybrid State & Date Driven
Do not choose one. Use a Hybrid Model.

Date Ranges = Global Program Constraints (When can people register? When must grades be submitted?)

State Machine = Group-Level Progress (Has this specific group completed field execution?)

Database Schema Snippet
php
// programs_table
$table->timestamp('registration_starts_at');
$table->timestamp('registration_ends_at');
$table->timestamp('execution_starts_at');
$table->timestamp('execution_ends_at');
$table->enum('global_phase', ['pre_reg', 'reg', 'plotting', 'execution', 'grading', 'finalized']);

// kkn_groups_table
$table->enum('local_status', ['pending', 'registered', 'plotted', 'field_active', 'submitted', 'graded']);
$table->timestamp('field_started_at')->nullable();
$table->timestamp('field_completed_at')->nullable();
Why Hybrid?
Dates prevent access outside official university hours (e.g., no grading at 2 AM).

State allows a group that finished fieldwork early to proceed to grading while others are still logging.

1. Feature Gating: Middleware & Policies
Do not put @if logic in controllers. Use Laravel's native authorization layer.

The "Workflow Gate" Pattern
Step 1: Centralized Phase Service

php
// app/Services/WorkflowService.php
class WorkflowService {
    public function canAccessExecution(KKNGroup $group, Program $program): bool {
        // Admin override exists?
        if ($group->admin_override_until) return true;
        
        // Global date check
        if (now()->lt($program->execution_starts_at)) return false;
        
        // Group state check
        return in_array($group->local_status, ['plotted', 'field_active']);
    }
}
Step 2: Laravel Policy

php
// app/Policies/KKNGroupPolicy.php
public function submitDailyLog(User $user, KKNGroup $group) {
    $program = $group->program;
    
    return app(WorkflowService::class)->canAccessExecution($group, $program)
        && $group->local_status !== 'submitted';
}
Step 3: Inertia Middleware (For Route Protection)

php
// app/Http/Middleware/EnsureExecutionPhase.php
class EnsureExecutionPhase {
    public function handle($request, Closure $next) {
        $group = $request->user()->activeKknGroup;
        
        if (!app(WorkflowService::class)->canAccessExecution($group, $group->program)) {
            return inertia()->render('Errors/PhaseLocked', [
                'required_phase' => 'execution'
            ])->toResponse($request);
        }
        
        return $next($request);
    }
}
Step 4: React UI Gating (using Ziggy & Permissions)

jsx
// usePermissions.js - Inertia shared prop
const { canSubmitLog } = usePage().props.auth.permissions;

// DailyLogForm.jsx
{canSubmitLog && <LogSubmissionButton />}
2. Admin Phase Controller UI/UX Pattern
Do not use a simple dropdown. Use a Guided Workflow Wizard with validation gates.

The "Phase Conductor" Component
jsx
// Admin/PhaseConductor.jsx
const PhaseConductor = ({ program, groupsCount }) => {
  const phases = ['pre_reg', 'reg', 'plotting', 'execution', 'grading', 'finalized'];
  const currentIndex = phases.indexOf(program.global_phase);
  
  const handleTransition = async (targetPhase) => {
    // Pre-flight validation
    const validation = await axios.post('/api/admin/validate-phase-transition', {
      from: program.global_phase,
      to: targetPhase
    });
    
    if (!validation.data.valid) {
      toast.error(validation.data.reason); 
      // e.g., "Cannot go to Grading: 12 groups have no logs"
      return;
    }
    
    // Confirm modal showing impact
    await confirm(`Move ${groupsCount} groups to ${targetPhase}?`);
    
    // Execute transition
    await router.post('/api/admin/advance-phase', { targetPhase });
  };
  
  return (
    <div className="phase-timeline">
      {phases.map((phase, idx) => (
        <PhaseNode
          key={phase}
          label={phase}
          isActive={idx === currentIndex}
          isCompleted={idx < currentIndex}
          isLocked={idx > currentIndex + 1} // Can't skip 2 phases
          onActivate={() => handleTransition(phase)}
        />
      ))}
    </div>
  );
};
Backend Transition Validation (Critical for Data Integrity)
php
// app/Actions/ValidatePhaseTransition.php
class ValidatePhaseTransition {
    public function execute(Program $program, string $newPhase): ValidationResult {
        return match($newPhase) {
            'grading' => $this->validateAllGroupsHaveMinLogs($program, 30),
            'finalized' => $this->validateAllGradesSubmitted($program),
            default => ValidationResult::valid()
        };
    }
}
3. Handling Edge Cases (Early Finishers & Overrides)
This is where your system gains enterprise credibility.

Pattern A: Per-Group "Fast Track"
Allow admins to manually advance a group's local_status without changing the global phase.

UI: Group Table with "Override" Column

jsx
// Admin/GroupList.jsx
<GroupRow group={group}>
  <Select
    value={group.local_status}
    onChange={(newStatus) => {
      Inertia.post(`/admin/groups/${group.id}/override-status`, {
        status: newStatus,
        reason: 'Completed field work early'
      });
    }}
    options={getAllowedNextStatuses(group)}
  />
  {group.local_status !== getDefaultStatusForGlobalPhase() && (
    <Badge color="yellow">Override Active</Badge>
  )}
</GroupRow>
Backend Override Logic

php
// app/Models/KKNGroup.php
public function setLocalStatus(string $status, string $reason): void {
    $this->local_status = $status;
    $this->status_overridden_at = now();
    $this->status_override_reason = $reason;
    $this->status_override_by = auth()->id();
    $this->save();
    
    // Log to audit trail
    AuditLog::create(['action' => "status_override_to_{$status}", 'reason' => $reason]);
}
Pattern B: Bulk Operations for Edge Cases
Provide a "Bulk Exception Handler" dashboard for common scenarios:

"Reset to Plotting" button for groups who failed registration.

"Extend Execution" button that updates execution_ends_at for specific groups (JSON column overridden_dates).

Pattern C: Automatic Re-sync Job
Run a daily cron that checks for inconsistencies:

php
// Artisan command: php artisan workflow:reconcile
foreach ($groups as $group) {
    $expectedStatus = $this->getExpectedStatusFromDates($group);
    if ($group->local_status !== $expectedStatus && !$group->status_overridden_at) {
        $group->local_status = $expectedStatus;
        $group->save();
    }
}
4. Complete Architecture Diagram
text
┌─────────────────────────────────────────────────────────────┐
│  React (Inertia) UI                                         │
│  - PhaseConductor (Admin only)                              │
│  - Conditional rendering via usePage().props.permissions   │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP Request (with Inertia headers)
┌──────────────────▼──────────────────────────────────────────┐
│  Laravel Routes + Middleware                                │
│  - EnsureExecutionPhase (checks WorkflowService)           │
│  - AdminOnly + EnsureValidPhaseTransition                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│  Laravel Policy + WorkflowService                           │
│  - canAccessFeature(Group, Feature)                        │
│  - validateTransition(Program, TargetPhase)                │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│  Database (Transaction Safe)                                │
│  - programs (date ranges + global_phase)                   │
│  - kkn_groups (local_status + override flags)              │
│  - audit_logs (all phase changes)                          │
└─────────────────────────────────────────────────────────────┘
Implementation Priority
Week 1: Build WorkflowService + Policies + Global phase toggling.

Week 2: Implement Admin PhaseConductor with validation.

Week 3: Add per-group override UI + audit log.

Week 4: Add bulk exception handlers and reconcile cron job.

This approach scales to 10,000+ groups and allows for complex scenarios like "Group A needs 2 more weeks in the field" without breaking the global schedule.

KKN Management System: Enterprise Architecture for Multi-Stage Academic Workflows
This is a classic Finite State Machine (FSM) problem dressed in academic clothing. Here's a production-grade blueprint.

1. Date-Driven vs. State-Driven: Use Both, But State Wins
Verdict: Hybrid State Machine with Date Suggestions, not Date Authority.
Date ranges are hints, not gates. The state machine is the single source of truth.
Pre-Registration → Registration → Plotting → Execution → Grading → Finalized
The problem with pure date-driven systems is that real life never fits the calendar. An admin must be able to override. The problem with pure state-driven without dates is you lose automation and auditability.
Database Schema
sql-- The global period (one active at a time)
CREATE TABLE kkn_periods (
    id              BIGINT PRIMARY KEY,
    name            VARCHAR(100),        -- e.g. "KKN Semester Genap 2025"
    status          ENUM(
                        'pre_registration',
                        'registration',
                        'plotting',
                        'execution',
                        'grading',
                        'finalized'
                    ) DEFAULT 'pre_registration',
    
    -- Dates are ADVISORY (shown in UI, used for automation triggers)
    registration_start  TIMESTAMP NULL,
    registration_end    TIMESTAMP NULL,
    execution_start     TIMESTAMP NULL,
    execution_end       TIMESTAMP NULL,
    grading_end         TIMESTAMP NULL,
    
    transitioned_at     TIMESTAMP NULL,   -- when last status change happened
    transitioned_by     BIGINT NULL,      -- admin user_id
    created_at          TIMESTAMP,
    updated_at          TIMESTAMP
);

-- Per-group override capability
CREATE TABLE kkn_group_status_overrides (
    id              BIGINT PRIMARY KEY,
    kkn_period_id   BIGINT,
    group_id        BIGINT,
    status          ENUM(...same as above...),
    reason          TEXT,
    overridden_by   BIGINT,
    created_at      TIMESTAMP
);

-- Full audit trail — non-negotiable for academic systems
CREATE TABLE kkn_period_transitions (
    id              BIGINT PRIMARY KEY,
    kkn_period_id   BIGINT,
    from_status     VARCHAR(50),
    to_status       VARCHAR(50),
    triggered_by    ENUM('manual', 'scheduled', 'system'),
    actor_id        BIGINT NULL,
    notes           TEXT NULL,
    created_at      TIMESTAMP
);

2. The State Machine Implementation
Core Service Class (Laravel)
php// app/Services/KknPeriodStateMachine.php

namespace App\Services;

use App\Models\KknPeriod;
use App\Exceptions\InvalidStateTransitionException;

class KknPeriodStateMachine
{
    // The ONLY valid transitions — enforce sequential progression
    private const TRANSITIONS = [
        'pre_registration' => ['registration'],
        'registration'     => ['plotting'],
        'plotting'         => ['execution'],
        'execution'        => ['grading'],
        'grading'          => ['finalized'],
        'finalized'        => [],           // terminal state
    ];

    // Pre-transition validation rules per target state
    private const TRANSITION_GUARDS = [
        'plotting'   => 'validatePlottingReadiness',
        'execution'  => 'validateExecutionReadiness',
        'grading'    => 'validateGradingReadiness',
        'finalized'  => 'validateFinalizationReadiness',
    ];

    public function __construct(private KknPeriod $period) {}

    public function canTransitionTo(string $targetStatus): bool
    {
        return in_array($targetStatus, self::TRANSITIONS[$this->period->status] ?? []);
    }

    public function transitionTo(string $targetStatus, int $actorId, string $notes = ''): void
    {
        if (!$this->canTransitionTo($targetStatus)) {
            throw new InvalidStateTransitionException(
                "Cannot transition from [{$this->period->status}] to [{$targetStatus}]"
            );
        }

        // Run guard if defined
        if (isset(self::TRANSITION_GUARDS[$targetStatus])) {
            $this->{self::TRANSITION_GUARDS[$targetStatus]}();
        }

        $previousStatus = $this->period->status;

        \DB::transaction(function () use ($targetStatus, $actorId, $notes, $previousStatus) {
            $this->period->update([
                'status'         => $targetStatus,
                'transitioned_at' => now(),
                'transitioned_by' => $actorId,
            ]);

            // Write to audit log
            $this->period->transitions()->create([
                'from_status'   => $previousStatus,
                'to_status'     => $targetStatus,
                'triggered_by'  => 'manual',
                'actor_id'      => $actorId,
                'notes'         => $notes,
            ]);
        });

        // Fire event for downstream side effects
        event(new KknPeriodTransitioned($this->period, $previousStatus, $targetStatus));
    }

    // --- Guards ---

    private function validatePlottingReadiness(): void
    {
        $unassignedStudents = $this->period->registrations()
            ->where('status', 'approved')
            ->whereNull('group_id')
            ->count();

        if ($unassignedStudents > 0) {
            throw new InvalidStateTransitionException(
                "Cannot advance to Plotting: {$unassignedStudents} approved students have no group assignment."
            );
        }
    }

    private function validateGradingReadiness(): void
    {
        $incompleteLogbooks = $this->period->groups()
            ->whereDoesntHave('logbookSummary')
            ->count();

        if ($incompleteLogbooks > 0) {
            throw new \Exception(
                "{$incompleteLogbooks} groups have not submitted required logbooks."
            );
        }
    }

    // ... more guards
}
Scheduled Automation (Optional Soft Triggers)
php// app/Console/Commands/AutoAdvanceKknPeriod.php

class AutoAdvanceKknPeriod extends Command
{
    protected $signature = 'kkn:auto-advance';

    public function handle(KknPeriodStateMachine $fsm): void
    {
        $period = KknPeriod::active()->first();
        if (!$period) return;

        $now = now();
        $machine = new KknPeriodStateMachine($period);

        // Suggest transitions based on dates — but only if valid
        $autoMap = [
            'pre_registration' => ['date' => $period->registration_start, 'target' => 'registration'],
            'registration'     => ['date' => $period->registration_end,   'target' => 'plotting'],
        ];

        if (isset($autoMap[$period->status])) {
            $rule = $autoMap[$period->status];
            if ($rule['date'] && $now->gte($rule['date']) && $machine->canTransitionTo($rule['target'])) {
                // Only auto-advance if guard passes too
                try {
                    $machine->transitionTo($rule['target'], actorId: 0, notes: 'Auto-advanced by scheduler');
                } catch (\Exception $e) {
                    // Log warning — admin must manually intervene
                    Log::warning("Auto-advance failed for period {$period->id}: " . $e->getMessage());
                    Notification::send(User::admins()->get(), new AutoAdvanceFailedNotification($period, $e));
                }
            }
        }
    }
}

3. Feature Gating: Middleware + Policies
The Pattern: Two Layers
Request
  └─► PeriodPhaseMiddleware      (checks GLOBAL period status)
        └─► GroupPhasePolicy     (checks GROUP-level override)
              └─► Controller
Middleware — Global Gate
php// app/Http/Middleware/RequireKknPhase.php

namespace App\Http\Middleware;

class RequireKknPhase
{
    public function handle(Request $request, Closure $next, string ...$allowedPhases): Response
    {
        $period = KknPeriod::active()->first();

        if (!$period) {
            return $this->deny($request, 'Tidak ada periode KKN aktif.');
        }

        // Check group-level override first (more specific wins)
        $student = $request->user();
        $effectiveStatus = $this->resolveEffectiveStatus($period, $student);

        if (!in_array($effectiveStatus, $allowedPhases)) {
            if ($request->wantsJson() || $request->header('X-Inertia')) {
                return response()->json([
                    'message'         => 'Fitur ini tidak tersedia pada fase saat ini.',
                    'current_phase'   => $effectiveStatus,
                    'allowed_phases'  => $allowedPhases,
                ], 403);
            }

            return redirect()->route('dashboard')
                ->with('phase_error', "Halaman ini hanya tersedia pada fase: " . implode(', ', $allowedPhases));
        }

        return $next($request);
    }

    private function resolveEffectiveStatus(KknPeriod $period, ?User $student): string
    {
        if (!$student || !$student->isStudent()) {
            return $period->status;
        }

        $group = $student->kknGroup;
        if (!$group) return $period->status;

        $override = KknGroupStatusOverride::where('group_id', $group->id)
            ->where('kkn_period_id', $period->id)
            ->latest()
            ->first();

        return $override?->status ?? $period->status;
    }

    private function deny(Request $request, string $message): Response
    {
        if ($request->header('X-Inertia')) {
            return Inertia::render('Errors/PhaseLocked', ['message' => $message])
                ->toResponse($request)
                ->setStatusCode(403);
        }
        return redirect()->route('dashboard')->with('error', $message);
    }
}
Route Registration
php// routes/web.php

Route::middleware(['auth', 'verified'])->group(function () {

    // Registration features — only accessible during 'registration' phase
    Route::middleware(['kkn.phase:registration'])
        ->prefix('registration')
        ->group(function () {
            Route::get('/', [RegistrationController::class, 'index']);
            Route::post('/', [RegistrationController::class, 'store']);
        });

    // Logbook/Execution — only during 'execution' phase
    Route::middleware(['kkn.phase:execution'])
        ->prefix('logbook')
        ->group(function () {
            Route::get('/', [LogbookController::class, 'index']);
            Route::post('/entry', [LogbookController::class, 'store']);
        });

    // Grading — accessible during grading AND finalized (view-only after)
    Route::middleware(['kkn.phase:grading,finalized'])
        ->prefix('grades')
        ->group(function () {
            Route::get('/', [GradeController::class, 'index']);
        });
});
Register Middleware in Bootstrap
php// bootstrap/app.php

->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'kkn.phase' => \App\Http\Middleware\RequireKknPhase::class,
    ]);
})

4. Admin Phase Controller UI/UX
Backend Controller
php// app/Http/Controllers/Admin/KknPhaseController.php

class KknPhaseController extends Controller
{
    public function index(): Response
    {
        $period = KknPeriod::active()->with('transitions')->firstOrFail();
        $machine = new KknPeriodStateMachine($period);

        return Inertia::render('Admin/PhaseController/Index', [
            'period'              => KknPeriodResource::make($period),
            'availableTransitions'=> $this->buildTransitionOptions($period, $machine),
            'transitionHistory'   => PeriodTransitionResource::collection($period->transitions()->latest()->take(20)->get()),
            'phaseHealth'         => $this->computePhaseHealth($period),
        ]);
    }

    public function advance(AdvancePhaseRequest $request, KknPeriod $period): RedirectResponse
    {
        $machine = new KknPeriodStateMachine($period);

        try {
            $machine->transitionTo(
                $request->target_status,
                auth()->id(),
                $request->notes ?? ''
            );
        } catch (InvalidStateTransitionException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', "Periode berhasil dipindahkan ke fase: {$request->target_status}");
    }

    private function computePhaseHealth(KknPeriod $period): array
    {
        // Checklist items the admin sees before confirming transition
        return match($period->status) {
            'registration' => [
                ['label' => 'Mahasiswa terdaftar', 'value' => $period->registrations()->count(), 'ok' => $period->registrations()->count() > 0],
                ['label' => 'Persetujuan pending', 'value' => $period->registrations()->where('status', 'pending')->count(), 'ok' => true],
            ],
            'plotting' => [
                ['label' => 'Kelompok terbentuk', 'value' => $period->groups()->count(), 'ok' => $period->groups()->count() > 0],
                ['label' => 'Mahasiswa tanpa kelompok', 'value' => $period->registrations()->whereNull('group_id')->count(), 'ok' => $period->registrations()->whereNull('group_id')->count() === 0],
            ],
            default => [],
        };
    }
}
React Phase Controller Component
jsx// resources/js/Pages/Admin/PhaseController/Index.jsx

import { PHASE_LABELS, PHASE_ORDER } from '@/constants/kkn-phases';

const PhaseTimeline = ({ currentStatus, availableTransitions, onAdvance }) => {
    return (
        <div className="phase-timeline">
            {PHASE_ORDER.map((phase, idx) => {
                const currentIdx = PHASE_ORDER.indexOf(currentStatus);
                const state = idx < currentIdx ? 'completed'
                            : idx === currentIdx ? 'active'
                            : 'pending';

                return (
                    <div key={phase} className={`phase-node phase-node--${state}`}>
                        <div className="phase-node__icon">
                            {state === 'completed' ? <CheckIcon /> : idx + 1}
                        </div>
                        <span>{PHASE_LABELS[phase]}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default function PhaseControllerIndex({ period, availableTransitions, phaseHealth, transitionHistory }) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [targetPhase, setTargetPhase] = useState(null);
    const { post, processing } = useForm();

    const healthIssues = phaseHealth.filter(h => !h.ok);
    const isHealthy = healthIssues.length === 0;

    const handleAdvanceClick = (transition) => {
        setTargetPhase(transition);
        setConfirmOpen(true);
    };

    const confirmAdvance = () => {
        post(route('admin.kkn.phase.advance', period.id), {
            target_status: targetPhase.to,
            notes: targetPhase.notes,
        });
        setConfirmOpen(false);
    };

    return (
        <AdminLayout>
            <div className="phase-controller">
                {/* Visual timeline */}
                <PhaseTimeline currentStatus={period.status} />

                {/* Health checklist — shown before transition */}
                {phaseHealth.length > 0 && (
                    <div className="phase-health-card">
                        <h3>Kesiapan Transisi</h3>
                        {phaseHealth.map(item => (
                            <div key={item.label} className={`health-item ${item.ok ? 'ok' : 'warning'}`}>
                                {item.ok ? <CheckIcon /> : <WarnIcon />}
                                <span>{item.label}: <strong>{item.value}</strong></span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Advance button — disabled if health checks fail */}
                {availableTransitions.map(transition => (
                    <button
                        key={transition.to}
                        onClick={() => handleAdvanceClick(transition)}
                        disabled={!isHealthy || processing}
                        className="btn-advance"
                    >
                        Maju ke: {PHASE_LABELS[transition.to]}
                        {!isHealthy && <span className="badge-warn">Ada masalah</span>}
                    </button>
                ))}

                {/* Audit log */}
                <TransitionHistoryTable rows={transitionHistory} />
            </div>

            {/* Confirmation modal */}
            <ConfirmModal
                open={confirmOpen}
                title={`Konfirmasi transisi ke "${PHASE_LABELS[targetPhase?.to]}"`}
                description="Tindakan ini tidak dapat dibalik. Pastikan semua data sudah lengkap."
                onConfirm={confirmAdvance}
                onCancel={() => setConfirmOpen(false)}
            />
        </AdminLayout>
    );
}

5. Scalability: Group Overrides & Edge Cases
Group-Level Override Controller
php// app/Http/Controllers/Admin/GroupPhaseOverrideController.php

class GroupPhaseOverrideController extends Controller
{
    public function store(Request $request, KknGroup $group): RedirectResponse
    {
        $request->validate([
            'status' => ['required', Rule::in(KknPeriod::STATUSES)],
            'reason' => ['required', 'string', 'min:10'],
        ]);

        $period = KknPeriod::active()->firstOrFail();

        // Prevent overriding BACKWARD past global period (a group cannot be in 'registration' if period is 'finalized')
        $globalIdx = array_search($period->status, KknPeriod::STATUSES);
        $targetIdx = array_search($request->status, KknPeriod::STATUSES);

        if ($targetIdx > $globalIdx + 1) {
            return back()->withErrors(['status' => 'Override tidak boleh melebihi 1 fase di depan periode global.']);
        }

        KknGroupStatusOverride::create([
            'group_id'      => $group->id,
            'kkn_period_id' => $period->id,
            'status'        => $request->status,
            'reason'        => $request->reason,
            'overridden_by' => auth()->id(),
        ]);

        return back()->with('success', "Override fase untuk kelompok {$group->name} berhasil disimpan.");
    }
}

6. Architecture Summary
┌─────────────────────────────────────────────────────────────────┐
│                    INERTIA.JS FRONTEND                          │
│  PhaseTimeline  │  HealthChecklist  │  GroupOverrideManager     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP + Inertia
┌──────────────────────────▼──────────────────────────────────────┐
│                    LARAVEL BACKEND                               │
│                                                                  │
│  RequireKknPhase Middleware  ──►  Route Groups (phase-gated)     │
│                                                                  │
│  KknPeriodStateMachine  ──►  Transition Guards  ──►  Events      │
│                                                                  │
│  Scheduler (auto-advance suggestions)                            │
│                                                                  │
│  Policies  ──►  Group-Level Overrides                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    DATABASE                                      │
│  kkn_periods  │  kkn_period_transitions  │  group_overrides      │
└─────────────────────────────────────────────────────────────────┘
ConcernDecisionRationaleSource of truthstatus column (FSM)Dates can change; state cannot regressDate roleAdvisory + scheduler hintsFlexibility without losing automationGating layerMiddleware (global) + Policy (group)Separation of concernsAdmin UXTimeline + health checklist + confirm modalPrevents accidental advancementOverride scopePer-group, max +1 phase aheadAllows early finishers, prevents chaosAuditkkn_period_transitions tableAcademic accountability requirement
This architecture gives you full control, auditability, and the flexibility to handle real-world academic edge cases without fighting your own codebase.