<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\KonfigurasiPenilaian;
use App\Models\KKN\PesertaWorkshop;
use App\Models\KKN\Workshop;
use App\Models\User;
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
        $payload = [
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'workshop_date' => $data['workshop_date'],
            'start_time' => $data['start_time'] ?? null,
            'end_time' => $data['end_time'] ?? null,
            'location' => $data['location'] ?? null,
            'max_participants' => $data['max_participants'] ?? null,
            'status' => 'scheduled',
        ];

        if (Workshop::supportsPeriodAssignment()) {
            $payload['periode_id'] = $data['periode_id'] ?? null;
        }

        return Workshop::create($payload);
    }

    public function updateWorkshop(Workshop $workshop, array $data): Workshop
    {
        return DB::transaction(function () use ($workshop, $data) {
            if (! $this->canMutateWorkshop($workshop)) {
                throw new \InvalidArgumentException('Pembekalan yang sudah memasuki tahap presensi tidak dapat diubah lagi.');
            }

            $registeredCount = $workshop->peserta()->count();
            $maxParticipants = $data['max_participants'] ?? null;

            if ($maxParticipants !== null && $maxParticipants < $registeredCount) {
                throw new \InvalidArgumentException('Kuota pembekalan tidak boleh lebih kecil dari jumlah peserta yang sudah terdaftar.');
            }

            $workshop->update([
                ...(Workshop::supportsPeriodAssignment() ? ['periode_id' => $data['periode_id'] ?? $workshop->periode_id] : []),
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'workshop_date' => $data['workshop_date'],
                'start_time' => $data['start_time'] ?? null,
                'end_time' => $data['end_time'] ?? null,
                'location' => $data['location'] ?? null,
                'max_participants' => $maxParticipants,
            ]);

            return $workshop->fresh();
        });
    }

    public function cancelWorkshop(Workshop $workshop): Workshop
    {
        return DB::transaction(function () use ($workshop) {
            if (! $this->canCancelWorkshop($workshop)) {
                throw new \InvalidArgumentException('Pembekalan yang sudah memiliki presensi tercatat tidak dapat dibatalkan.');
            }

            $workshop->update([
                'status' => 'cancelled',
            ]);

            return $workshop->fresh();
        });
    }

    /**
     * Register participant for workshop
     */
    public function registerParticipant(int $workshopId, int $userId): PesertaWorkshop
    {
        return DB::transaction(function () use ($workshopId, $userId) {
            $workshop = Workshop::lockForUpdate()->findOrFail($workshopId);

            if ($workshop->status !== 'scheduled') {
                throw new \InvalidArgumentException('Pembekalan belum dibuka untuk pendaftaran');
            }

            // Check if already registered
            $existing = PesertaWorkshop::where('workshop_id', $workshopId)
                ->where('user_id', $userId)
                ->first();

            if ($existing) {
                throw new \InvalidArgumentException('Anda sudah terdaftar pada pembekalan ini');
            }

            // Check if workshop is full (inside transaction with lock)
            if ($workshop->max_participants) {
                $currentParticipants = PesertaWorkshop::where('workshop_id', $workshopId)->count();

                if ($currentParticipants >= $workshop->max_participants) {
                    throw new \InvalidArgumentException('Kuota pembekalan sudah penuh');
                }
            }

            return PesertaWorkshop::create([
                'workshop_id' => $workshopId,
                'user_id' => $userId,
                'attendance_status' => 'registered',
            ]);
        });
    }

    /**
     * Self-attendance by student with GPS, Token, and Device validation
     */
    public function submitSelfAttendance(int $workshopId, int $userId, float $lat, float $lng, string $token, string $deviceSignature, string $ip): PesertaWorkshop
    {
        return DB::transaction(function () use ($workshopId, $userId, $lat, $lng, $token, $deviceSignature, $ip) {
            $workshop = Workshop::findOrFail($workshopId);

            // 1. Validate Secret Token
            if ($workshop->active_token !== $token) {
                throw new \InvalidArgumentException('Kode rahasia absensi salah atau sudah kadaluwarsa.');
            }

            // 2. Validate Geofence (GPS)
            if ($workshop->latitude && $workshop->longitude) {
                $distance = $this->calculateDistance($lat, $lng, (float) $workshop->latitude, (float) $workshop->longitude);

                // Add 10% tolerance for GPS jitter (min 5 meters)
                $tolerance = max(5, $workshop->radius_meters * 0.1);
                $maxAllowedDistance = $workshop->radius_meters + $tolerance;

                if ($distance > $maxAllowedDistance) {
                    throw new \InvalidArgumentException('Posisi Anda berada di luar radius lokasi pembekalan ('.round($distance).'m).');
                }
            }

            // 3. Anti-Cheating: Device Fingerprinting
            // Check if this device has already been used by another user for THIS workshop
            $deviceUsed = PesertaWorkshop::where('workshop_id', $workshopId)
                ->where('user_id', '!=', $userId)
                ->where('device_signature', $deviceSignature)
                ->exists();

            if ($deviceUsed) {
                throw new \InvalidArgumentException('Perangkat ini sudah digunakan untuk melakukan absensi NIM lain. Akses ditolak.');
            }

            $participant = PesertaWorkshop::where('workshop_id', $workshopId)
                ->where('user_id', $userId)
                ->firstOrFail();

            $participant->update([
                'attendance_status' => 'attended',
                'checked_in_at' => now(),
                'device_signature' => $deviceSignature,
                'ip_address' => $ip,
            ]);

            $this->generateCertificate($participant);
            $this->syncWorkshopScore($participant);

            return $participant->fresh();
        });
    }

    /**
     * Calculate distance between two GPS points in meters (Haversine formula)
     */
    private function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000; // meters
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLng / 2) * sin($dLng / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Sync workshop attendance to student's KKN grade
     */
    protected function syncWorkshopScore(PesertaWorkshop $participant): void
    {
        $user = $participant->user;
        $groupId = $user->getActiveGroupId();

        if ($groupId) {
            $configuredScore = KonfigurasiPenilaian::where('config_key', 'workshop_attendance_score')
                ->first()?->percentage ?? 100;
            $workshopScore = $participant->attendance_status === 'attended'
                ? (float) $configuredScore
                : 0.0;
            $adminId = auth()->id()
                ?? User::role('superadmin')->value('id');

            $this->gradingService->updateUnifiedScore(
                $user->id,
                $groupId,
                [
                    'administration_score' => $workshopScore,
                ],
                $adminId
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

            $participants = PesertaWorkshop::where('workshop_id', $workshopId)->get();

            foreach ($participants as $participant) {
                $attended = in_array($participant->user_id, $attendedUserIds);

                $participant->update([
                    'attendance_status' => $attended ? 'attended' : 'absent',
                    'checked_in_at' => $attended ? now() : null,
                    'is_passed' => $attended,
                ]);

                if ($attended) {
                    $this->generateCertificate($participant);
                } else {
                    $this->revokeCertificate($participant);
                }

                $this->syncWorkshopScore($participant);

                $results[] = $participant->fresh();
            }

            return $results;
        });
    }

    /**
     * Bulk mark passing status
     */
    public function bulkMarkPassingStatus(int $workshopId, array $passedUserIds): array
    {
        return DB::transaction(function () use ($workshopId, $passedUserIds) {
            $results = [];

            $participants = PesertaWorkshop::where('workshop_id', $workshopId)->get();

            foreach ($participants as $participant) {
                $passed = in_array($participant->user_id, $passedUserIds);

                $participant->update([
                    'is_passed' => $passed,
                ]);

                // Sinkronisasi nilai otomatis ketika kelulusan berubah
                $this->syncWorkshopScore($participant);

                $results[] = $participant->fresh();
            }

            return $results;
        });
    }

    /**
     * Generate PDF certificate for participant
     */
    public function generateCertificate(PesertaWorkshop $participant): string
    {
        $workshop = $participant->workshop;
        $user = $participant->user;

        $certificateData = [
            'participant_name' => $user->name,
            'nim' => $user->mahasiswa?->nim ?? '-',
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
        $filename = 'certificate_'.($user->mahasiswa?->nim ?? $user->id)."_{$workshop->id}_".time().'.pdf';
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
    private function generateCertificateNumber(PesertaWorkshop $participant): string
    {
        $workshop = $participant->workshop;
        $date = now()->format('Ymd');

        return "B-449/Un.19/K.LPPM/P.{$date}/{$workshop->id}";
    }

    private function revokeCertificate(PesertaWorkshop $participant): void
    {
        if ($participant->certificate_path) {
            Storage::disk('public')->delete($participant->certificate_path);
        }

        $participant->update([
            'certificate_generated' => false,
            'certificate_path' => null,
            'certificate_issued_at' => null,
        ]);
    }

    /**
     * Get upcoming workshops
     */
    public function getUpcomingWorkshops(
        ?int $userId = null,
        bool $includeParticipants = false,
        bool $includeAllStatuses = false,
        ?int $periodId = null
    ): array {
        $query = Workshop::where('workshop_date', '>=', now()->toDateString())
            ->withCount('peserta');

        if (Workshop::supportsPeriodAssignment() && $periodId) {
            $query->where('periode_id', $periodId);
        }

        if (! $includeAllStatuses) {
            $query->where('status', 'scheduled');
        }

        if (Workshop::supportsPeriodAssignment()) {
            $query->with('periode:id,name');
        }

        if ($includeParticipants) {
            $query->with([
                'peserta' => fn ($participantQuery) => $participantQuery
                    ->with('user:id,name,email')
                    ->orderBy('created_at'),
            ]);
        } elseif ($userId) {
            $query->with([
                'peserta' => fn ($participantQuery) => $participantQuery
                    ->select('id', 'workshop_id', 'user_id', 'attendance_status')
                    ->where('user_id', $userId),
            ]);
        }

        $workshops = $query
            ->orderBy('workshop_date')
            ->get();

        return $workshops->map(function ($workshop) use ($userId, $includeParticipants) {
            $userRegistration = $userId ? $workshop->peserta->first() : null;
            $timeWindow = collect([$workshop->start_time, $workshop->end_time])
                ->filter()
                ->implode(' - ');
            $hasRecordedAttendance = $includeParticipants
                ? $workshop->peserta->contains(fn (PesertaWorkshop $participant) => in_array($participant->attendance_status, ['attended', 'absent', 'excused'], true))
                : false;

            return [
                'id' => $workshop->id,
                'title' => $workshop->title,
                'description' => $workshop->description,
                'methodology' => $workshop->methodology,
                'date' => $workshop->workshop_date->format('d-m-Y'),
                'workshop_date_value' => $workshop->workshop_date->format('Y-m-d'),
                'time' => $timeWindow !== '' ? $timeWindow : 'Menunggu jadwal',
                'start_time' => $workshop->start_time ? substr((string) $workshop->start_time, 0, 5) : null,
                'end_time' => $workshop->end_time ? substr((string) $workshop->end_time, 0, 5) : null,
                'location' => $workshop->location,
                'registered' => $workshop->peserta_count,
                'max_participants' => $workshop->max_participants,
                'status' => $workshop->status,
                'period' => Workshop::supportsPeriodAssignment() && $workshop->periode
                    ? [
                        'id' => $workshop->periode->id,
                        'name' => $workshop->periode->name,
                    ]
                    : null,
                'is_full' => $workshop->max_participants
                    ? $workshop->peserta_count >= $workshop->max_participants
                    : false,
                'can_edit' => $includeParticipants && ! $hasRecordedAttendance,
                'can_cancel' => $includeParticipants && ! $hasRecordedAttendance,
                'is_registered' => (bool) $userRegistration,
                'attendance_status' => $userRegistration?->attendance_status,
                'participants' => $includeParticipants
                    ? $workshop->peserta->map(fn (PesertaWorkshop $participant) => [
                        'id' => $participant->id,
                        'user_id' => $participant->user_id,
                        'name' => $participant->user?->name ?? 'Peserta Pembekalan',
                        'email' => $participant->user?->email,
                        'attendance_status' => $participant->attendance_status,
                        'certificate_generated' => (bool) $participant->certificate_generated,
                        'checked_in_at' => $participant->checked_in_at?->toDateTimeString(),
                    ])->values()->all()
                    : [],
            ];
        })->toArray();
    }

    private function canMutateWorkshop(Workshop $workshop): bool
    {
        if ($workshop->status !== 'scheduled') {
            return false;
        }

        return ! $workshop->peserta()
            ->whereIn('attendance_status', ['attended', 'absent', 'excused'])
            ->exists();
    }

    private function canCancelWorkshop(Workshop $workshop): bool
    {
        return $this->canMutateWorkshop($workshop);
    }
}
