<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\TahunAkademik;
use App\Models\KKN\Periode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PeriodeController extends Controller
{
    public function index(Request $request): Response
    {
        $periods = Periode::with('tahunAkademik')
            ->withCount(['kelompok', 'peserta', 'dplPeriods'])
            ->when($request->search, function ($query, $search) {
                $s = str_replace(['%', '_'], ['\\%', '\\_'], $search);
                $query->where('periode', 'like', "%{$s}%")
                      ->orWhere('jenis', 'like', "%{$s}%")
                      ->orWhere('name', 'like', "%{$s}%");
            })
            ->orderByDesc('periode')
            ->paginate(10)
            ->withQueryString();

        $periods->getCollection()->transform(fn ($p) => [
            'id' => $p->id,
            'periode' => $p->periode,
            'jenis' => $p->jenis,
            'name' => $p->name,
            'start_date' => $p->start_date?->format('Y-m-d'),
            'end_date' => $p->end_date?->format('Y-m-d'),
            'registration_start' => $p->registration_start?->format('Y-m-d'),
            'registration_end' => $p->registration_end?->format('Y-m-d'),
            'grading_start' => $p->grading_start?->format('Y-m-d'),
            'grading_end' => $p->grading_end?->format('Y-m-d'),
            'kuota' => $p->kuota,
            'is_active' => $p->is_active,
            'academic_year' => $p->tahunAkademik ? ['id' => $p->tahunAkademik->id, 'year' => $p->tahunAkademik->year] : null,
            'groups_count' => $p->kelompok_count,
            'participants_count' => $p->peserta_count,
            'dpl_periods_count' => $p->dpl_periods_count,
            'can_delete' => $this->canDeletePeriod($p),
            'delete_blocker' => $this->getDeleteBlockerReason($p),
        ]);

        $academicYears = TahunAkademik::orderByDesc('year')->get()
            ->map(fn ($ay) => ['id' => $ay->id, 'year' => $ay->year]);

        return Inertia::render('Admin/Periods/Index', [
            'periods' => $periods,
            'academicYears' => $academicYears,
            'filters' => $request->only('search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'academic_year_id' => ['required', 'exists:tahun_akademik,id'],
            'periode' => ['required', 'integer'],
            'jenis' => ['required', 'string', 'max:100'],
            'name' => ['required', 'string', 'max:100'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'registration_start' => ['required', 'date'],
            'registration_end' => ['required', 'date', 'after:registration_start'],
            'kuota' => ['required', 'integer', 'min:1'],
            'grading_start' => ['nullable', 'date'],
            'grading_end' => ['nullable', 'date', 'after_or_equal:grading_start'],
            'is_active' => ['boolean'],
        ]);

        if (!empty($validated['is_active'])) {
            Periode::where('is_active', true)->update(['is_active' => false]);
            Periode::flushContextCache();
        }

        Periode::create($validated);

        return redirect()->back()->with('success', 'Periode KKN berhasil ditambahkan.');
    }

    public function update(Request $request, Periode $periode): RedirectResponse
    {
        $validated = $request->validate([
            'academic_year_id' => ['required', 'exists:tahun_akademik,id'],
            'periode' => ['required', 'integer'],
            'jenis' => ['required', 'string', 'max:100'],
            'name' => ['required', 'string', 'max:100'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'registration_start' => ['required', 'date'],
            'registration_end' => ['required', 'date', 'after:registration_start'],
            'kuota' => ['required', 'integer', 'min:1'],
            'grading_start' => ['nullable', 'date'],
            'grading_end' => ['nullable', 'date', 'after_or_equal:grading_start'],
            'is_active' => ['boolean'],
        ]);

        if (!empty($validated['is_active'])) {
            Periode::where('id', '!=', $periode->id)
                ->where('is_active', true)
                ->update(['is_active' => false]);
            Periode::flushContextCache();
        }

        $periode->update($validated);

        return redirect()->back()->with('success', 'Periode KKN berhasil diperbarui.');
    }

    public function duplicate(Periode $periode): RedirectResponse
    {
        DB::transaction(function () use ($periode) {
            $periode->loadMissing('kelompok');

            $newPeriod = $periode->replicate();
            $newPeriod->name = $this->generateCopyName($periode->name);
            $newPeriod->is_active = false;
            $newPeriod->save();

            foreach ($periode->kelompok as $group) {
                $newGroup = $group->replicate();
                $newGroup->period_id = $newPeriod->id;
                $newGroup->dpl_id = null;
                $newGroup->dpl_period_id = null;
                $newGroup->status = 'draft';
                $newGroup->code = $this->generateUniqueGroupCode();
                $newGroup->token = $this->generateUniqueGroupToken();
                $newGroup->save();

                // Duplicate slot rules for the new group
                foreach ($group->slotTerkunci as $slot) {
                    $newSlot = $slot->replicate();
                    $newSlot->kelompok_id = $newGroup->id;
                    $newSlot->save();
                }
            }
        });

        return redirect()->back()->with('success', 'Struktur periode dan kelompok berhasil diduplikasi.');
    }

    public function destroy(Periode $periode): RedirectResponse
    {
        $periode->loadCount(['kelompok', 'peserta', 'dplPeriods']);

        if (!$this->canDeletePeriod($periode)) {
            return redirect()->back()->with('error', $this->getDeleteBlockerReason($periode));
        }

        $periode->delete();

        return redirect()->back()->with('success', 'Periode KKN berhasil dihapus.');
    }

    private function canDeletePeriod(Periode $period): bool
    {
        return !$period->is_active
            && (int) ($period->kelompok_count ?? 0) === 0
            && (int) ($period->peserta_count ?? 0) === 0
            && (int) ($period->dpl_periods_count ?? 0) === 0;
    }

    private function getDeleteBlockerReason(Periode $period): ?string
    {
        if ($period->is_active) {
            return 'Periode aktif tidak dapat dihapus. Nonaktifkan atau aktifkan periode lain terlebih dahulu.';
        }

        if (
            (int) ($period->kelompok_count ?? 0) > 0 ||
            (int) ($period->peserta_count ?? 0) > 0 ||
            (int) ($period->dpl_periods_count ?? 0) > 0
        ) {
            return 'Periode tidak dapat dihapus karena masih memiliki kelompok, peserta, atau penugasan DPL.';
        }

        return null;
    }

    private function generateCopyName(string $name): string
    {
        $baseName = preg_replace('/\s+\(Copy(?: \d+)?\)$/', '', $name) ?: $name;
        $candidate = $baseName . ' (Copy)';
        $suffix = 2;

        while (Periode::withTrashed()->where('name', $candidate)->exists()) {
            $candidate = sprintf('%s (Copy %d)', $baseName, $suffix);
            $suffix++;
        }

        return $candidate;
    }

    private function generateUniqueGroupCode(): string
    {
        do {
            $code = 'KKN-' . strtoupper(Str::random(6));
        } while (KelompokKkn::withTrashed()->where('code', $code)->exists());

        return $code;
    }

    private function generateUniqueGroupToken(): string
    {
        do {
            $token = strtoupper(Str::random(8));
        } while (KelompokKkn::withTrashed()->where('token', $token)->exists());

        return $token;
    }
}
