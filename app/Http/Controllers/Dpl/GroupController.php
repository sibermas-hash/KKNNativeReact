<?php

namespace App\Http\Controllers\Dpl;

use App\Http\Controllers\Controller;
use App\Models\KKN\KelompokKkn;
use Inertia\Inertia;
use Inertia\Response;

class GroupController extends Controller
{
    public function index(): Response
    {
        $dosen = auth()->user()->dosen;
        abort_if(!$dosen, 403, 'Data dosen tidak ditemukan.');

        $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');

        $kelompok = KelompokKkn::whereIn('id', $groupIds)
            ->with(['periode', 'lokasi'])
            ->withCount(['peserta', 'kegiatan', 'programKerja'])
            ->get();

        return Inertia::render('Dpl/Groups/Index', [
            'groups' => $kelompok->map(fn (KelompokKkn $group) => [
                'id' => $group->id,
                'code' => $group->code,
                'name' => $group->nama_kelompok,
                'status' => $group->status,
                'member_count' => $group->peserta_count,
                'daily_report_count' => $group->kegiatan_count,
                'work_program_count' => $group->program_kerja_count,
                'period_name' => $group->periode?->name ?? '-',
                'village_name' => $group->lokasi?->village_name ?? '-',
            ])->values(),
        ]);
    }

    public function show(KelompokKkn $group): Response
    {
        $dosen = auth()->user()->dosen;
        abort_if(!$dosen, 403, 'Data dosen tidak ditemukan.');
        $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');
        abort_if(!$groupIds->contains($group->id), 403, 'Anda tidak memiliki akses ke kelompok ini.');

        $group->load([
            'periode', 'lokasi',
            'peserta.mahasiswa.fakultas',
            'peserta.mahasiswa.prodi',
            'peserta.mahasiswa.nilai' => fn($q) => $q->where('kelompok_id', $group->id),
            'programKerja',
            'posko',
        ]);

        return Inertia::render('Dpl/Groups/Show', [
            'group' => [
                'id' => $group->id,
                'code' => $group->code,
                'name' => $group->nama_kelompok,
                'status' => $group->status,
                'capacity' => $group->capacity,
                'period_name' => $group->periode?->name ?? '-',
                'village_name' => $group->lokasi?->village_name ?? '-',
                'address' => $group->lokasi?->address,
                'members' => $group->peserta->map(function ($registration) {
                    $nilai = $registration->mahasiswa?->nilai?->first();
                    return [
                        'id' => $registration->id,
                        'status' => $registration->status,
                        'role' => $registration->role,
                        'student' => [
                            'nim' => $registration->mahasiswa?->nim ?? '-',
                            'name' => $registration->mahasiswa?->nama ?? 'Mahasiswa tidak ditemukan',
                            'faculty_name' => $registration->mahasiswa?->fakultas?->nama ?? '-',
                            'program_name' => $registration->mahasiswa?->prodi?->nama ?? '-',
                        ],
                        'nilai' => $nilai ? [
                            'id' => $nilai->id,
                            'is_finalized' => (bool)$nilai->is_finalized,
                        ] : null,
                    ];
                })->values(),
                'work_programs' => $group->programKerja->map(fn ($program) => [
                    'id' => $program->id,
                    'title' => $program->title,
                    'status' => $program->status,
                ])->values(),
                'posko' => $group->posko ? [
                    'latitude' => $group->posko->latitude,
                    'longitude' => $group->posko->longitude,
                    'photo_url' => route('student.posko.photo', $group->posko),
                    'photo_name' => basename((string) $group->posko->photo_path),
                    'updated_at' => optional($group->posko->updated_at)->format('d M Y H:i'),
                ] : null,
            ],
        ]);
    }
}
