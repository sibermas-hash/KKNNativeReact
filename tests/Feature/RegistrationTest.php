<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureProfileCompleted;
use App\Models\KKN\JenisKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    private function createCompleteStudentUser(): User
    {
        $user = User::factory()->create([
            'phone' => '081111111111',
            'address' => 'Jl. Pahlawan No. 1',
            'domicile_village_name' => 'Desa Asal',
            'domicile_district_name' => 'Kecamatan Asal',
            'domicile_regency_name' => 'Kabupaten Asal',
            'address_verified_at' => now(),
            'avatar' => 'avatars/default.png',
        ]);
        $user->assignRole('student');

        Mahasiswa::factory()->create([
            'user_id' => $user->id,
            'nik' => '3301010101010011',
            'mother_name' => 'Siti Salamah',
            'birth_place' => 'Purwokerto',
            'birth_date' => '2003-01-11',
            'gender' => 'L',
            'shirt_size' => 'L',
            'sks_completed' => 110,
            'gpa' => 3.5,
            'status_bta_ppi' => 'LULUS',
        ]);

        return $user;
    }

    private function getJenisReguler(): JenisKkn
    {
        return JenisKkn::where('code', 'REGULER')->first()
            ?? JenisKkn::factory()->create(['code' => 'REGULER', 'min_sks' => 100]);
    }

    public function test_student_can_open_registration_listing_page(): void
    {
        $user = $this->createCompleteStudentUser();
        $jenisKkn = $this->getJenisReguler();

        Periode::factory()->active()->create([
            'jenis_kkn_id' => $jenisKkn->id,
            'current_phase' => 'registration',
        ]);

        $response = $this->actingAs($user)
            ->get(route('student.daftar.index'));

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Student/KknDaftar')
                ->has('periods')
            );
    }

    public function test_student_can_register_by_uploading_documents(): void
    {
        $user = $this->createCompleteStudentUser();
        $jenisKkn = $this->getJenisReguler();
        $jenisKkn->update([
            'require_health_certificate' => true,
            'require_parent_permission' => true,
        ]);

        $period = Periode::factory()->active()->create([
            'jenis_kkn_id' => $jenisKkn->id,
            'current_phase' => 'registration',
        ]);

        $healthCert = UploadedFile::fake()->create('health.pdf', 500);
        $parentPerm = UploadedFile::fake()->create('parent.pdf', 500);

        $response = $this->actingAs($user)
            ->post(route('student.registration.documents.store', ['periode' => $period->id]), [
                'health_certificate' => $healthCert,
                'parent_permission' => $parentPerm,
                'notes' => 'Test registration',
            ]);

        $response->assertRedirect(route('student.dashboard'));

        $this->assertDatabaseHas('peserta_kkn', [
            'mahasiswa_id' => $user->mahasiswa->id,
            'periode_id' => $period->id,
            'status' => 'document_submitted',
        ]);

        $registration = PesertaKkn::query()
            ->where('mahasiswa_id', $user->mahasiswa->id)
            ->where('periode_id', $period->id)
            ->firstOrFail();

        $this->assertDatabaseHas('dokumen_peserta_kkn', [
            'peserta_kkn_id' => $registration->id,
            'document_type' => 'health_certificate',
        ]);

        $this->assertDatabaseHas('dokumen_peserta_kkn', [
            'peserta_kkn_id' => $registration->id,
            'document_type' => 'parent_permission',
        ]);
    }

    public function test_upload_page_displays_dynamic_document_requirements(): void
    {
        $user = $this->createCompleteStudentUser();
        $jenisKkn = $this->getJenisReguler();
        $jenisKkn->update([
            'required_documents' => ['Scan KRS', 'Bukti Pembayaran UKT'],
        ]);

        $period = Periode::factory()->active()->create([
            'jenis_kkn_id' => $jenisKkn->id,
            'current_phase' => 'registration',
        ]);

        $response = $this->actingAs($user)
            ->get(route('student.registration.documents', ['periode' => $period->id]));

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Student/Register/UploadDokumen')
                ->has('document_requirements', 2)
                ->where('document_requirements.0.label', 'Scan KRS')
                ->where('document_requirements.1.label', 'Bukti Pembayaran UKT')
            );
    }

    public function test_student_can_upload_dynamic_registration_documents(): void
    {
        $user = $this->createCompleteStudentUser();
        $jenisKkn = $this->getJenisReguler();
        $jenisKkn->update([
            'required_documents' => ['Scan KRS'],
        ]);

        $period = Periode::factory()->active()->create([
            'jenis_kkn_id' => $jenisKkn->id,
            'current_phase' => 'registration',
        ]);

        $krsFile = UploadedFile::fake()->create('krs.pdf', 400);

        $response = $this->actingAs($user)
            ->post(route('student.registration.documents.store', ['periode' => $period->id]), [
                'krs' => $krsFile,
                'notes' => 'Dokumen KRS lengkap',
            ]);

        $response->assertRedirect(route('student.dashboard'));

        $registration = PesertaKkn::query()
            ->where('mahasiswa_id', $user->mahasiswa->id)
            ->where('periode_id', $period->id)
            ->firstOrFail();

        $this->assertSame('document_submitted', $registration->status);

        $this->assertDatabaseHas('dokumen_peserta_kkn', [
            'peserta_kkn_id' => $registration->id,
            'document_type' => 'krs',
        ]);
    }

    public function test_student_cannot_register_if_ineligible_due_to_sks(): void
    {
        $user = $this->createCompleteStudentUser();
        $user->mahasiswa->update(['sks_completed' => 50]);

        $jenisKkn = $this->getJenisReguler();
        $jenisKkn->update(['min_sks' => 100]);

        $period = Periode::factory()->active()->create([
            'jenis_kkn_id' => $jenisKkn->id,
            'current_phase' => 'registration',
        ]);

        $response = $this->actingAs($user)
            ->get(route('student.daftar.index'));

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('periods.0', fn ($p) => $p
                    ->where('can_register', false)
                    ->etc()
                )
            );
    }

    public function test_student_cannot_register_for_multiple_periods(): void
    {
        $user = $this->createCompleteStudentUser();
        $jenisKkn = $this->getJenisReguler();

        $period1 = Periode::factory()->active()->create([
            'jenis_kkn_id' => $jenisKkn->id,
            'current_phase' => 'registration',
        ]);

        $period2 = Periode::factory()->active()->create([
            'jenis_kkn_id' => $jenisKkn->id,
            'current_phase' => 'registration',
        ]);

        // Registered in period 1
        PesertaKkn::create([
            'mahasiswa_id' => $user->mahasiswa->id,
            'periode_id' => $period1->id,
            'status' => 'document_submitted',
        ]);

        // Attempt to register in period 2
        $response = $this->actingAs($user)
            ->get(route('student.registration.documents', ['periode' => $period2->id]));

        $response->assertRedirect(route('student.daftar.index'))
            ->assertSessionHas('error');
    }

    public function test_student_is_redirected_to_profile_when_incomplete(): void
    {
        $this->withMiddleware([EnsureProfileCompleted::class]);

        $user = User::factory()->create([
            'phone' => null,
        ]);
        $user->assignRole('student');
        Mahasiswa::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)
            ->get(route('student.daftar.index'));

        $response->assertRedirect(route('profile.show'))
            ->assertSessionHas('warning');
    }

    public function test_guest_cannot_access_registration_listing(): void
    {
        $response = $this->get(route('student.daftar.index'));

        $response->assertRedirect(route('login'));
    }
}
