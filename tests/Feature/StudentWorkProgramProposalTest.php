<?php

namespace Tests\Feature;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\ProgramKerja;
use App\Models\KKN\ProposalProgramKerja;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentWorkProgramProposalTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_student_can_create_work_program_with_initial_proposal(): void
    {
        [$user, $group] = $this->createStudentWithApprovedGroup();

        $this->actingAs($user)
            ->post(route('student.program-kerja.store'), [
                'title' => 'Pemberdayaan UMKM Desa',
                'description' => 'Pelatihan branding dan pemasaran digital untuk UMKM lokal.',
                'objectives' => 'Meningkatkan daya jual UMKM desa.',
                'target_participants' => 35,
                'budget' => 750000,
                'kategori' => 'unggulan',
                'proposal_file' => UploadedFile::fake()->create('proposal-awal.pdf', 300, 'application/pdf'),
            ])
            ->assertRedirect(route('student.program-kerja.index'));

        $programKerja = ProgramKerja::query()
            ->where('kelompok_id', $group->id)
            ->where('title', 'Pemberdayaan UMKM Desa')
            ->firstOrFail();

        $proposal = ProposalProgramKerja::query()
            ->where('program_kerja_id', $programKerja->id)
            ->firstOrFail();

        $this->assertSame(1, $proposal->version);
        $this->assertSame('proposal-awal.pdf', $proposal->file_name);
        Storage::disk('public')->assertExists($proposal->file_path);
    }

    public function test_student_can_view_upload_and_download_work_program_proposals(): void
    {
        [$user, $group] = $this->createStudentWithApprovedGroup();

        $programKerja = ProgramKerja::factory()->create([
            'kelompok_id' => $group->id,
            'title' => 'Literasi Digital Warga',
            'description' => 'Pendampingan penggunaan layanan digital dasar.',
            'objectives' => 'Warga mampu memakai layanan digital mandiri.',
            'budget' => 500000,
            'kategori' => 'pendukung',
            'submitted_at' => now(),
        ]);

        $firstPath = 'program-kerja/proposals/'.$programKerja->id.'/proposal-v1.pdf';
        Storage::disk('public')->put($firstPath, 'proposal versi 1');

        $proposalV1 = ProposalProgramKerja::query()->create([
            'program_kerja_id' => $programKerja->id,
            'file_path' => $firstPath,
            'file_name' => 'proposal-v1.pdf',
            'version' => 1,
            'uploaded_at' => now()->subDay(),
        ]);

        $this->actingAs($user)
            ->get(route('student.program-kerja.show', $programKerja))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Student/WorkPrograms/Show')
                ->where('workProgram.title', 'Literasi Digital Warga')
                ->where('workProgram.proposals.0.file_name', 'proposal-v1.pdf')
                ->where('workProgram.proposals.0.version', 1)
            );

        $this->actingAs($user)
            ->post(route('student.program-kerja.proposals.upload', $programKerja), [
                'proposal_file' => UploadedFile::fake()->create('proposal-v2.docx', 320, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
            ])
            ->assertRedirect(route('student.program-kerja.show', $programKerja));

        $proposalV2 = ProposalProgramKerja::query()
            ->where('program_kerja_id', $programKerja->id)
            ->where('version', 2)
            ->firstOrFail();

        Storage::disk('public')->assertExists($proposalV2->file_path);

        $this->actingAs($user)
            ->get(route('student.program-kerja.proposals.download', [
                'programKerja' => $programKerja->id,
                'proposal' => $proposalV2->id,
            ]))
            ->assertOk()
            ->assertDownload('proposal-v2.docx');

        $this->assertDatabaseHas('proposal_program_kerja', [
            'id' => $proposalV1->id,
            'program_kerja_id' => $programKerja->id,
            'version' => 1,
        ]);
    }

    /**
     * @return array{0: User, 1: KelompokKkn}
     */
    private function createStudentWithApprovedGroup(): array
    {
        $period = Periode::factory()->execution()->create();

        $user = User::factory()->create([
            'phone' => '081234567890',
            'address' => 'Jl. Kelompok No. 7',
            'domicile_village_name' => 'Desa Kelompok',
            'domicile_district_name' => 'Kecamatan Kelompok',
            'domicile_regency_name' => 'Kabupaten Kelompok',
            'address_verified_at' => now(),
            'avatar' => 'avatars/student.png',
        ]);
        $user->assignRole('student');

        $mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $user->id,
            'nik' => '3301010101010099',
            'mother_name' => 'Ibu Mahasiswa',
            'birth_place' => 'Purwokerto',
            'birth_date' => '2003-01-01',
            'gender' => 'L',
            'shirt_size' => 'L',
        ]);

        $group = KelompokKkn::factory()->create([
            'periode_id' => $period->id,
        ]);

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'kelompok_id' => $group->id,
            'periode_id' => $period->id,
        ]);

        return [$user, $group];
    }
}
