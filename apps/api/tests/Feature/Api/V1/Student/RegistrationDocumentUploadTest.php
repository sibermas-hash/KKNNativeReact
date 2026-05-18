<?php

use App\Models\KKN\DokumenPesertaKkn;
use App\Models\KKN\JenisKknDocumentRequirement;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('rejects empty upload requests without changing registration status', function () {
    $user = createUserWithRole('student');
    $period = createActivePeriod('registration');
    $mahasiswa = Mahasiswa::factory()->create([
        'user_id' => $user->id,
        'health_certificate_path' => 'health-certificates/legacy-existing.pdf',
    ]);

    JenisKknDocumentRequirement::query()->updateOrCreate(
        [
            'jenis_kkn_id' => $period->jenis_kkn_id,
            'document_key' => 'health_certificate',
        ],
        [
            'document_label' => 'Surat Keterangan Dokter',
            'description' => 'Wajib unggah surat keterangan dokter.',
            'is_required' => true,
            'sort_order' => 1,
        ]
    );

    $registration = PesertaKkn::factory()->create([
        'mahasiswa_id' => $mahasiswa->id,
        'periode_id' => $period->id,
        'status' => 'pending',
    ]);

    $this->actingAs($user)
        ->postJson("/api/v1/student/registration/{$period->id}/documents", [])
        ->assertStatus(422)
        ->assertJsonPath('error.errors.documents.0', 'Pilih minimal satu dokumen untuk diunggah.');

    expect($registration->fresh()->status)->toBe('pending');
    expect(DokumenPesertaKkn::query()->where('peserta_kkn_id', $registration->id)->count())->toBe(0);
});

it('stores uploaded documents and updates registration status', function () {
    Storage::fake(config('filesystems.default'));

    $user = createUserWithRole('student');
    $period = createActivePeriod('registration');
    $mahasiswa = Mahasiswa::factory()->create([
        'user_id' => $user->id,
        'health_certificate_path' => null,
        'parent_permission_path' => null,
    ]);

    JenisKknDocumentRequirement::query()->updateOrCreate(
        [
            'jenis_kkn_id' => $period->jenis_kkn_id,
            'document_key' => 'health_certificate',
        ],
        [
            'document_label' => 'Surat Keterangan Dokter',
            'description' => 'Wajib unggah surat keterangan dokter.',
            'is_required' => true,
            'sort_order' => 1,
        ]
    );

    $registration = PesertaKkn::factory()->create([
        'mahasiswa_id' => $mahasiswa->id,
        'periode_id' => $period->id,
        'status' => 'pending',
    ]);

    $this->actingAs($user)
        ->post("/api/v1/student/registration/{$period->id}/documents", [
            'health_certificate' => UploadedFile::fake()->create('surat-sehat.pdf', 200, 'application/pdf'),
        ])
        ->assertNoContent();

    $document = DokumenPesertaKkn::query()
        ->where('peserta_kkn_id', $registration->id)
        ->where('document_type', 'health_certificate')
        ->first();

    expect($registration->fresh()->status)->toBe('document_submitted');
    expect($document)->not->toBeNull();
    Storage::disk(config('filesystems.default'))->assertExists($document->file_path);
});
