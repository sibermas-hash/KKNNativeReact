<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PlottingService
{
    /**
     * Automatically distribute unassigned approved students to available groups in a period.
     */
    public function autoPlotStudents(int $periodeId): array
    {
        return DB::transaction(function () use ($periodeId) {
            $periode = Periode::findOrFail($periodeId);
            
            // 1. Get unassigned approved students
            $unassignedStudents = PesertaKkn::where('periode_id', $periodeId)
                ->where('status', 'approved')
                ->whereNull('kelompok_id')
                ->with('mahasiswa')
                ->get();

            if ($unassignedStudents->isEmpty()) {
                return [
                    'success' => true,
                    'message' => 'Tidak ada mahasiswa yang perlu ditempatkan.',
                    'plotted_count' => 0,
                ];
            }

            // 2. Get available groups with their current count
            $groups = KelompokKkn::where('periode_id', $periodeId)
                ->withCount('peserta')
                ->get();

            if ($groups->isEmpty()) {
                throw new \RuntimeException('Tidak ada kelompok yang tersedia di periode ini.');
            }

            // Map current counts to group IDs for memory-efficient access
            $groupCounts = $groups->pluck('peserta_count', 'id')->all();
            
            $plottedCount = 0;
            $studentIndex = 0;
            $totalStudents = $unassignedStudents->count();

            // 3. Simple Round-Robin Distribution (Respecting Capacity)
            // Sort groups by current participant count ascending to fill the least populated first
            $sortedGroups = $groups->sortBy('peserta_count')->values();

            while ($studentIndex < $totalStudents) {
                $anyGroupFilled = false;
                
                foreach ($sortedGroups as $group) {
                    if ($studentIndex >= $totalStudents) break;

                    // Check capacity (default to 15 if not set)
                    $capacity = $group->capacity ?: 15;
                    $currentCount = $groupCounts[$group->id] ?? 0;

                    if ($currentCount < $capacity) {
                        $student = $unassignedStudents[$studentIndex];
                        $student->update([
                            'kelompok_id' => $group->id,
                            'joined_group_at' => now(),
                        ]);
                        
                        // Increment in-memory counter
                        $groupCounts[$group->id]++;
                        
                        $studentIndex++;
                        $plottedCount++;
                        $anyGroupFilled = true;
                    }
                }

                // If no group could take more students in a full loop, we stop to avoid infinite loop
                if (!$anyGroupFilled) {
                    Log::warning("Auto-plotting stopped: Capacity reached for all groups in period {$periodeId}. Remaining: " . ($totalStudents - $studentIndex));
                    break;
                }
            }

            return [
                'success' => true,
                'message' => "Berhasil menempatkan {$plottedCount} mahasiswa ke {$groups->count()} kelompok.",
                'plotted_count' => $plottedCount,
                'remaining_count' => $totalStudents - $studentIndex,
            ];
        });
    }
}
