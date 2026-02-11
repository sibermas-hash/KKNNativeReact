<?php

namespace App\Services;

use App\Models\Workshop;
use App\Models\WorkshopParticipant;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class WorkshopService
{
    protected $gradingService;

    public function __construct(GradingService $gradingService)
    {
        $this->gradingService = $gradingService;
    }
    /**
     * Create a new workshop
     */
    public function createWorkshop(array $data): Workshop
    {
        return Workshop::create([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'methodology' => $data['methodology'] ?? null,
            'workshop_date' => $data['workshop_date'],
            'start_time' => $data['start_time'] ?? null,
            'end_time' => $data['end_time'] ?? null,
            'location' => $data['location'] ?? null,
            'max_participants' => $data['max_participants'] ?? null,
            'status' => 'scheduled',
        ]);
    }

    /**
     * Register participant for workshop
     */
    public function registerParticipant(int $workshopId, int $userId): WorkshopParticipant
    {
        return DB::transaction(function () use ($workshopId, $userId) {
            $workshop = Workshop::lockForUpdate()->findOrFail($workshopId);

            // Check if already registered
            $existing = WorkshopParticipant::where('workshop_id', $workshopId)
                ->where('user_id', $userId)
                ->first();

            if ($existing) {
                throw new \InvalidArgumentException("Already registered for this workshop");
            }

            // Check if workshop is full (inside transaction with lock)
            if ($workshop->max_participants) {
                $currentParticipants = WorkshopParticipant::where('workshop_id', $workshopId)->count();
                
                if ($currentParticipants >= $workshop->max_participants) {
                    throw new \InvalidArgumentException("Workshop is full");
                }
            }

            return WorkshopParticipant::create([
                'workshop_id' => $workshopId,
                'user_id' => $userId,
                'attendance_status' => 'registered',
            ]);
        });
    }

    /**
     * Mark participant as attended
     */
    public function markAttendance(int $participantId, bool $attended = true): WorkshopParticipant
    {
        return DB::transaction(function () use ($participantId, $attended) {
            $participant = WorkshopParticipant::findOrFail($participantId);

            $participant->update([
                'attendance_status' => $attended ? 'attended' : 'absent',
                'checked_in_at' => $attended ? now() : null,
            ]);

            // Generate certificate and update kkn_scores if attended
            if ($attended) {
                $this->generateCertificate($participant);
                $this->syncWorkshopScore($participant);
            }

            return $participant->fresh();
        });
    }

    /**
     * Sync workshop attendance to student's KKN grade
     */
    protected function syncWorkshopScore(WorkshopParticipant $participant): void
    {
        $user = $participant->user;
        $groupId = $user->getActiveGroupId();

        if ($groupId) {
             // A4: Use configurable workshop score
             $workshopScore = \App\Models\GradingConfig::where('config_key', 'workshop_attendance_score')
                ->first()?->percentage ?? 100;

             $this->gradingService->submitAdminScores(
                 $user->id,
                 $groupId,
                 (float) $workshopScore,
                 $participant->user->kknScores()->where('group_id', $groupId)->first()?->administration_score ?? 0,
                 auth()->id() ?? \App\Models\User::role('admin')->first()?->id ?? 1
             );
        }
    }

    /**
     * Bulk mark attendance
     */
    public function bulkMarkAttendance(int $workshopId, array $attendedUserIds): array
    {
        return DB::transaction(function () use ($workshopId, $attendedUserIds) {
            $results = [];

            $participants = WorkshopParticipant::where('workshop_id', $workshopId)->get();

            foreach ($participants as $participant) {
                $attended = in_array($participant->user_id, $attendedUserIds);
                
                $participant->update([
                    'attendance_status' => $attended ? 'attended' : 'absent',
                    'checked_in_at' => $attended ? now() : null,
                ]);

                if ($attended) {
                    $this->generateCertificate($participant);
                }

                $results[] = $participant->fresh();
            }

            return $results;
        });
    }

    /**
     * Generate PDF certificate for participant
     */
    public function generateCertificate(WorkshopParticipant $participant): string
    {
        $workshop = $participant->workshop;
        $user = $participant->user;

        $certificateData = [
            'participant_name' => $user->name,
            'nim' => $user->student?->nim ?? '-',
            'workshop_title' => $workshop->title,
            'workshop_date' => $workshop->workshop_date->format('d F Y'),
            'methodology' => $workshop->methodology,
            'location' => $workshop->location,
            'certificate_number' => $this->generateCertificateNumber($participant),
            'issue_date' => now()->format('d F Y'),
        ];

        // Generate PDF using DomPDF
        $pdf = Pdf::loadView('certificates.workshop', $certificateData)
            ->setPaper('a4', 'landscape');

        // Save to storage
        $filename = "certificate_" . ($user->student?->nim ?? $user->id) . "_{$workshop->id}_" . time() . ".pdf";
        $path = "certificates/workshops/{$workshop->id}/{$filename}";
        
        Storage::disk('public')->put($path, $pdf->output());

        // Update participant record
        $participant->update([
            'certificate_generated' => true,
            'certificate_path' => $path,
            'certificate_issued_at' => now(),
        ]);

        return $path;
    }

    /**
     * Generate unique certificate number
     */
    private function generateCertificateNumber(WorkshopParticipant $participant): string
    {
        $workshop = $participant->workshop;
        $date = now()->format('Ymd');
        
        return "B-449/Un.19/K.LPPM/P.{$date}/{$workshop->id}";
    }

    /**
     * Get upcoming workshops
     */
    public function getUpcomingWorkshops(): array
    {
        $workshops = Workshop::where('workshop_date', '>=', now()->toDateString())
            ->where('status', 'scheduled')
            ->withCount('participants')
            ->orderBy('workshop_date')
            ->get();

        return $workshops->map(function ($workshop) {
            return [
                'id' => $workshop->id,
                'title' => $workshop->title,
                'description' => $workshop->description,
                'methodology' => $workshop->methodology,
                'date' => $workshop->workshop_date->format('d-m-Y'),
                'time' => $workshop->start_time . ' - ' . $workshop->end_time,
                'location' => $workshop->location,
                'registered' => $workshop->participants_count,
                'max_participants' => $workshop->max_participants,
                'is_full' => $workshop->max_participants 
                    ? $workshop->participants_count >= $workshop->max_participants 
                    : false,
            ];
        })->toArray();
    }
}
