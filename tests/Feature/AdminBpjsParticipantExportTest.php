<?php

namespace Tests\Feature;

use App\Exports\BpjsParticipantExport;
use App\Models\KKN\Fakultas;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\Prodi;
use App\Models\KKN\TahunAkademik;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Maatwebsite\Excel\Facades\Excel;
use Tests\TestCase;

class AdminBpjsParticipantExportTest extends TestCase
{
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);

        $this->admin = User::factory()->create([
            'username' => 'admin_bpjs',
            'name' => 'Admin BPJS',
            'email' => 'admin-bpjs@example.test',
        ]);
        $this->admin->assignRole('superadmin');
    }

    public function test_bpjs_export_only_downloads_approved_participants_with_required_columns(): void
    {
        Excel::fake();

        $faculty = Fakultas::factory()->create(['nama' => 'Fakultas Syariah']);
        $program = Prodi::factory()->create([
            'fakultas_id' => $faculty->id,
            'nama' => 'Hukum Ekonomi Syariah',
        ]);
        $academicYear = TahunAkademik::factory()->create();
        $period = Periode::factory()->create([
            'academic_year_id' => $academicYear->id,
            'name' => 'Periode KKN BPJS',
        ]);
        $location = Lokasi::factory()->create();
        $group = KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'location_id' => $location->id,
            'nama_kelompok' => 'Kelompok BPJS A',
        ]);

        $approvedUser = User::factory()->create([
            'username' => 'bpjs_mahasiswa',
            'name' => 'Mahasiswa BPJS',
            'email' => 'bpjs-mahasiswa@example.test',
            'phone' => '081234567890',
            'address' => 'Jl. Ahmad Yani No. 15, Purwokerto',
        ]);
        $approvedUser->assignRole('student');

        $approvedStudent = Mahasiswa::factory()->create([
            'user_id' => $approvedUser->id,
            'nim' => '24030001',
            'nik' => '3303010101010001',
            'nama' => 'Mahasiswa BPJS',
            'mother_name' => 'Ibu BPJS',
            'fakultas_id' => $faculty->id,
            'prodi_id' => $program->id,
            'gpa' => 3.54,
            'sks_completed' => 144,
        ]);

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $approvedStudent->id,
            'periode_id' => $period->id,
            'kelompok_id' => $group->id,
        ]);

        $pendingUser = User::factory()->create([
            'username' => 'bpjs_pending',
            'name' => 'Mahasiswa Pending',
            'email' => 'bpjs-pending@example.test',
            'phone' => '089999999999',
            'address' => 'Jl. Raya Pending',
        ]);
        $pendingUser->assignRole('student');

        $pendingStudent = Mahasiswa::factory()->create([
            'user_id' => $pendingUser->id,
            'nim' => '24030002',
            'nik' => '3303010101010002',
            'nama' => 'Mahasiswa Pending',
            'mother_name' => 'Ibu Pending',
            'fakultas_id' => $faculty->id,
            'prodi_id' => $program->id,
        ]);

        PesertaKkn::factory()->create([
            'mahasiswa_id' => $pendingStudent->id,
            'periode_id' => $period->id,
            'kelompok_id' => $group->id,
            'status' => 'pending',
        ]);

        $this->actingAs($this->admin)
            ->get('/admin/pendaftaran/ekspor-bpjs')
            ->assertOk();

        Excel::assertDownloaded('peserta-bpjs-kkn.xlsx', function (BpjsParticipantExport $export) {
            $rows = $export->collection();
            $mapped = $export->map($rows->first());

            $this->assertCount(1, $rows);
            $this->assertSame('Mahasiswa BPJS', $mapped[1]);
            $this->assertSame('24030001', $mapped[2]);
            $this->assertSame('3303010101010001', $mapped[3]);
            $this->assertSame('3.54', $mapped[4]);
            $this->assertSame(144, $mapped[5]);
            $this->assertSame('Ibu BPJS', $mapped[6]);
            $this->assertSame('Jl. Ahmad Yani No. 15, Purwokerto', $mapped[7]);
            $this->assertSame('081234567890', $mapped[8]);
            $this->assertSame('Disetujui', $mapped[13]);

            return true;
        });
    }
}
