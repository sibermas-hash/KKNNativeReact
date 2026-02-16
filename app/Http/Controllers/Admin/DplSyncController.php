<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\User;
use App\Services\MasterApiService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DplSyncController extends Controller
{
    public function __construct(
        private MasterApiService $masterApi
    ) {}

    public function index(Request $request): Response
    {
        $externalDosen = $this->masterApi->getAllEmployees();
        $localDosenNips = Dosen::pluck('nip')->toArray();

        // Filter out lecturers that are already in our local database
        $availableDosen = array_filter($externalDosen, function ($d) use ($localDosenNips) {
            return !in_array($d['nip'], $localDosenNips);
        });

        // Filter by search if provided
        if ($search = $request->input('search')) {
            $availableDosen = array_filter($availableDosen, function ($d) use ($search) {
                return stripos($d['name'], $search) !== false || stripos($d['nip'], $search) !== false;
            });
        }

        return Inertia::render('Admin/Dpl/Sync', [
            'availableDosen' => array_values($availableDosen),
            'filters' => $request->only('search'),
            'title' => 'Sinkronisasi DPL dari API Master'
        ]);
    }

    public function sync(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nip' => 'required|string',
            'name' => 'required|string',
            'email' => 'nullable|email',
            'organization_id' => 'nullable|integer',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|string',
        ]);

        try {
            DB::transaction(function () use ($validated) {
                // 1. Determine Password (DDMMYYYY from birth_date or fallback)
                $password = 'password123';
                if (!empty($validated['birth_date'])) {
                    $password = \Carbon\Carbon::parse($validated['birth_date'])->format('dmY');
                }

                // 2. Create User
                $user = User::firstOrCreate(
                    ['username' => $validated['nip']],
                    [
                        'name' => $validated['name'],
                        'email' => $validated['email'] ?? $validated['nip'] . '@kkn.uinsaizu.ac.id',
                        'password' => Hash::make($password),
                        'is_active' => true,
                    ]
                );

                if (!$user->hasRole('dpl')) {
                    $user->assignRole('dpl');
                }

                // 2. Create Dosen record
                $facultyId = null;
                if (!empty($validated['organization_id'])) {
                    $facultyId = Fakultas::where('master_id', $validated['organization_id'])->first()?->id;
                }

                // Fallback faculty if none found
                if (!$facultyId) {
                    $facultyId = Fakultas::first()?->id;
                }

                Dosen::updateOrCreate(
                    ['nip' => $validated['nip']],
                    [
                        'user_id' => $user->id,
                        'nama' => $validated['name'],
                        'birth_date' => $validated['birth_date'],
                        'gender' => $validated['gender'],
                        'faculty_id' => $facultyId,
                        'master_id' => $validated['organization_id'] ?? null,
                        'master_synced_at' => now(),
                    ]
                );
            });

            return back()->with('success', "DPL {$validated['name']} berhasil ditambahkan dan akun telah dibuat.");
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal melakukan sinkronisasi: ' . $e->getMessage());
        }
    }
}