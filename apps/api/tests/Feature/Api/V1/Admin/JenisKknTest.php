<?php

use App\Models\KKN\DocumentTemplate;
use App\Models\KKN\JenisKkn;
use App\Models\KKN\Prodi;

describe('Admin Jenis KKN API', function () {
    beforeEach(function () {
        $this->admin = createUserWithRole('superadmin');
    });

    it('persists sort_order and dynamic configs when creating a jenis kkn', function () {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/jenis-kkn', [
                'code' => 'KHUSUS-77',
                'name' => 'KKN Khusus 77',
                'description' => 'Skema audit',
                'registration_mode' => 'selective',
                'placement_mode' => 'manual_admin',
                'color' => '#0f766e',
                'is_active' => true,
                'sort_order' => 7,
                'requirements_config' => [
                    'min_sks' => 110,
                    'min_gpa' => 3.25,
                    'min_semester' => 7,
                    'require_bta_ppi' => true,
                    'require_not_married' => false,
                    'require_parent_permission' => true,
                    'require_health_cert' => true,
                ],
                'attendance_config' => [
                    'geofence_enabled' => true,
                    'radius_meters' => 750,
                    'location_source' => 'custom',
                    'require_photo' => true,
                    'allow_offline_sync' => false,
                ],
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.code', 'KHUSUS-77')
            ->assertJsonPath('data.sort_order', 7)
            ->assertJsonPath('data.requirements_config.min_semester', 7)
            ->assertJsonPath('data.attendance_config.radius_meters', 750)
            ->assertJsonPath('data.attendance_config.location_source', 'custom');

        $jenisKkn = JenisKkn::where('code', 'KHUSUS-77')->first();

        expect($jenisKkn)->not->toBeNull();
        expect($jenisKkn?->sort_order)->toBe(7);
        expect($jenisKkn?->requirements_config['min_semester'] ?? null)->toBe(7);
        expect($jenisKkn?->attendance_config['allow_offline_sync'] ?? null)->toBeFalse();
    });

    it('returns sort_order and default template metadata for document requirements', function () {
        $jenisKkn = JenisKkn::factory()->create([
            'code' => 'AUDIT-JK',
            'name' => 'KKN Audit',
            'sort_order' => 9,
        ]);

        $template = DocumentTemplate::create([
            'document_key' => 'surat_izin',
            'name' => 'Template Surat Izin',
            'description' => 'Template default',
            'file_path' => 'document-templates/template-surat-izin.docx',
            'file_name' => 'template-surat-izin.docx',
            'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'file_size' => 1024,
            'uploaded_by' => $this->admin->id,
            'is_active' => true,
        ]);

        $jenisKkn->documentRequirements()->create([
            'document_key' => 'surat_izin',
            'document_label' => 'Surat Izin',
            'description' => 'Wajib diunggah',
            'is_required' => true,
            'sort_order' => 2,
            'default_template_id' => $template->id,
        ]);

        $this->actingAs($this->admin)
            ->getJson("/api/v1/admin/jenis-kkn/{$jenisKkn->id}")
            ->assertOk()
            ->assertJsonPath('data.sort_order', 9)
            ->assertJsonPath('data.document_requirements.0.default_template_id', $template->id)
            ->assertJsonPath('data.document_requirements.0.default_template.file_name', 'template-surat-izin.docx')
            ->assertJsonPath(
                'data.document_requirements.0.default_template.download_url',
                route('api.v1.admin.document-templates.download', $template)
            );
    });

    it('rejects duplicate document keys inside the same jenis kkn with validation error', function () {
        $jenisKkn = JenisKkn::factory()->create([
            'code' => 'AUDIT-DOC',
            'name' => 'KKN Audit Dokumen',
        ]);

        $jenisKkn->documentRequirements()->create([
            'document_key' => 'surat_izin',
            'document_label' => 'Surat Izin',
            'is_required' => true,
            'sort_order' => 1,
        ]);

        $this->actingAs($this->admin)
            ->postJson("/api/v1/admin/jenis-kkn/{$jenisKkn->id}/document-requirements", [
                'document_key' => 'surat_izin',
                'document_label' => 'Surat Izin Cadangan',
                'is_required' => true,
                'sort_order' => 2,
            ])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonPath('error.errors.document_key.0', 'Kunci dokumen sudah digunakan pada jenis KKN ini.');
    });

    it('rejects invalid specific prodi ids when creating jenis kkn', function () {
        $prodi = Prodi::factory()->create();

        $this->actingAs($this->admin)
            ->postJson('/api/v1/admin/jenis-kkn', [
                'code' => 'KHUSUS-PRODI',
                'name' => 'KKN Khusus Prodi',
                'registration_mode' => 'open',
                'placement_mode' => 'manual_admin',
                'requirements_config' => [
                    'specific_prodi_ids' => [$prodi->id, 999999999],
                ],
            ])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonValidationErrors(['requirements_config.specific_prodi_ids.1']);
    });
})->group('admin');
