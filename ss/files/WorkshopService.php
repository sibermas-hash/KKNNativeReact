<?php
// app/Services/WorkshopService.php

namespace App\Services;

use App\Models\Workshop;
use App\Models\WorkshopParticipant;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class WorkshopService
{
    /**
     * Create a new workshop
     */
    public function createWorkshop(array $data): Workshop
    {
        return Workshop::create([
            'title' => $data['title'],
            'description' => $data['description'],
            'methodology' => $data['methodology'],
            'workshop_date' => $data['workshop_date'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'location' => $data['location'],
            'max_participants' => $data['max_participants'] ?? null,
            'status' => 'scheduled',
        ]);
    }

    /**
     * Register participant for workshop
     */
    public function registerParticipant(int $workshopId, int $userId): WorkshopParticipant
    {
        $workshop = Workshop::findOrFail($workshopId);

        // Check if workshop is full
        if ($workshop->max_participants) {
            $currentParticipants = WorkshopParticipant::where('workshop_id', $workshopId)->count();
            
            if ($currentParticipants >= $workshop->max_participants) {
                throw new \InvalidArgumentException("Workshop is full");
            }
        }

        // Check if already registered
        $existing = WorkshopParticipant::where('workshop_id', $workshopId)
            ->where('user_id', $userId)
            ->first();

        if ($existing) {
            throw new \InvalidArgumentException("Already registered for this workshop");
        }

        return WorkshopParticipant::create([
            'workshop_id' => $workshopId,
            'user_id' => $userId,
            'attendance_status' => 'registered',
        ]);
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

            // Generate certificate if attended
            if ($attended) {
                $this->generateCertificate($participant);
            }

            return $participant->fresh();
        });
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
        $workshop = $participant->workshop()->with('participants')->first();
        $user = $participant->user;

        $certificateData = [
            'participant_name' => $user->name,
            'nim' => $user->nim,
            'workshop_title' => $workshop->title,
            'workshop_date' => $workshop->workshop_date,
            'methodology' => $workshop->methodology,
            'location' => $workshop->location,
            'certificate_number' => $this->generateCertificateNumber($participant),
            'issue_date' => now()->format('d F Y'),
        ];

        // Generate PDF using DomPDF
        $pdf = Pdf::loadView('certificates.workshop', $certificateData)
            ->setPaper('a4', 'landscape');

        // Save to storage
        $filename = "certificate_{$user->nim}_{$workshop->id}_" . time() . ".pdf";
        $path = "certificates/workshops/{$workshop->id}/{$filename}";
        
        Storage::disk('private')->put($path, $pdf->output());

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
     * Get workshop participants with attendance
     */
    public function getWorkshopParticipants(int $workshopId): array
    {
        $participants = WorkshopParticipant::where('workshop_id', $workshopId)
            ->with(['user:id,name,nim'])
            ->get();

        return [
            'participants' => $participants->map(function ($participant) {
                return [
                    'id' => $participant->id,
                    'user' => $participant->user,
                    'attendance_status' => $participant->attendance_status,
                    'checked_in_at' => $participant->checked_in_at,
                    'certificate_generated' => $participant->certificate_generated,
                    'certificate_path' => $participant->certificate_path,
                ];
            }),
            'statistics' => [
                'total_registered' => $participants->count(),
                'attended' => $participants->where('attendance_status', 'attended')->count(),
                'absent' => $participants->where('attendance_status', 'absent')->count(),
                'certificates_issued' => $participants->where('certificate_generated', true)->count(),
            ],
        ];
    }

    /**
     * Get user's workshop history
     */
    public function getUserWorkshops(int $userId): array
    {
        $participants = WorkshopParticipant::where('user_id', $userId)
            ->with(['workshop'])
            ->get();

        return $participants->map(function ($participant) {
            return [
                'workshop' => [
                    'id' => $participant->workshop->id,
                    'title' => $participant->workshop->title,
                    'date' => $participant->workshop->workshop_date,
                    'methodology' => $participant->workshop->methodology,
                    'location' => $participant->workshop->location,
                ],
                'attendance_status' => $participant->attendance_status,
                'certificate_available' => $participant->certificate_generated,
                'certificate_path' => $participant->certificate_path,
                'attended_at' => $participant->checked_in_at,
            ];
        })->toArray();
    }

    /**
     * Get certificate download URL
     */
    public function getCertificateDownloadUrl(int $participantId, int $userId): string
    {
        $participant = WorkshopParticipant::where('id', $participantId)
            ->where('user_id', $userId)
            ->firstOrFail();

        if (!$participant->certificate_generated) {
            throw new \InvalidArgumentException("Certificate not yet generated");
        }

        return Storage::disk('private')->temporaryUrl(
            $participant->certificate_path,
            now()->addHours(1)
        );
    }

    /**
     * Update workshop status
     */
    public function updateWorkshopStatus(int $workshopId, string $status): Workshop
    {
        $allowedStatuses = ['scheduled', 'ongoing', 'completed', 'cancelled'];
        
        if (!in_array($status, $allowedStatuses)) {
            throw new \InvalidArgumentException("Invalid status");
        }

        $workshop = Workshop::findOrFail($workshopId);
        $workshop->update(['status' => $status]);

        return $workshop->fresh();
    }

    /**
     * Get workshop statistics
     */
    public function getWorkshopStatistics(int $workshopId): array
    {
        $workshop = Workshop::with('participants')->findOrFail($workshopId);
        $participants = $workshop->participants;

        return [
            'workshop_info' => [
                'id' => $workshop->id,
                'title' => $workshop->title,
                'date' => $workshop->workshop_date,
                'status' => $workshop->status,
            ],
            'registration' => [
                'total_registered' => $participants->count(),
                'max_capacity' => $workshop->max_participants,
                'spots_remaining' => $workshop->max_participants 
                    ? $workshop->max_participants - $participants->count() 
                    : null,
            ],
            'attendance' => [
                'attended' => $participants->where('attendance_status', 'attended')->count(),
                'absent' => $participants->where('attendance_status', 'absent')->count(),
                'pending' => $participants->where('attendance_status', 'registered')->count(),
                'attendance_rate' => $participants->count() > 0 
                    ? ($participants->where('attendance_status', 'attended')->count() / $participants->count()) * 100 
                    : 0,
            ],
            'certificates' => [
                'generated' => $participants->where('certificate_generated', true)->count(),
                'pending' => $participants->where('attendance_status', 'attended')
                    ->where('certificate_generated', false)->count(),
            ],
        ];
    }

    /**
     * Cancel registration
     */
    public function cancelRegistration(int $participantId, int $userId): bool
    {
        $participant = WorkshopParticipant::where('id', $participantId)
            ->where('user_id', $userId)
            ->firstOrFail();

        // Only allow cancellation if not yet attended
        if ($participant->attendance_status !== 'registered') {
            throw new \InvalidArgumentException("Cannot cancel after attendance has been marked");
        }

        return $participant->delete();
    }

    /**
     * Get upcoming workshops
     */
    public function getUpcomingWorkshops(): array
    {
        $workshops = Workshop::where('workshop_date', '>=', now()->toDateString())
            ->where('status', 'scheduled')
            ->orderBy('workshop_date')
            ->get();

        return $workshops->map(function ($workshop) {
            $participantsCount = WorkshopParticipant::where('workshop_id', $workshop->id)->count();
            
            return [
                'id' => $workshop->id,
                'title' => $workshop->title,
                'description' => $workshop->description,
                'methodology' => $workshop->methodology,
                'date' => $workshop->workshop_date,
                'time' => $workshop->start_time . ' - ' . $workshop->end_time,
                'location' => $workshop->location,
                'registered' => $participantsCount,
                'max_participants' => $workshop->max_participants,
                'is_full' => $workshop->max_participants 
                    ? $participantsCount >= $workshop->max_participants 
                    : false,
            ];
        })->toArray();
    }

    /**
     * Regenerate certificate (if needed)
     */
    public function regenerateCertificate(int $participantId): string
    {
        $participant = WorkshopParticipant::findOrFail($participantId);

        if ($participant->attendance_status !== 'attended') {
            throw new \InvalidArgumentException("Can only generate certificate for attended participants");
        }

        // Delete old certificate if exists
        if ($participant->certificate_path && Storage::disk('private')->exists($participant->certificate_path)) {
            Storage::disk('private')->delete($participant->certificate_path);
        }

        return $this->generateCertificate($participant);
    }
}
