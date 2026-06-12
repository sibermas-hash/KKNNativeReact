<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ensure the columns exist (in case they were accidentally dropped)
        Schema::table('jenis_kkn', function (Blueprint $table) {
            if (! Schema::hasColumn('jenis_kkn', 'requirements_config')) {
                $table->json('requirements_config')->nullable();
            }
            if (! Schema::hasColumn('jenis_kkn', 'attendance_config')) {
                $table->json('attendance_config')->nullable();
            }
        });

        // Ambil semua data Jenis KKN yang ada
        $types = DB::table('jenis_kkn')->get();

        foreach ($types as $type) {
            $requirements = [];

            // 1. Konversi Minimal SKS (Database Check)
            if (isset($type->min_sks) && $type->min_sks > 0) {
                $requirements[] = [
                    'name' => 'Minimal '.$type->min_sks.' SKS',
                    'type' => 'db_check',
                    'field' => 'sks_completed',
                    'min_value' => $type->min_sks,
                    'key' => 'min_sks',
                ];
            }

            // 2. Konversi Minimal GPA (Database Check)
            if (isset($type->min_gpa) && (float) $type->min_gpa > 0) {
                $requirements[] = [
                    'name' => 'Minimal IPK '.number_format((float) $type->min_gpa, 2),
                    'type' => 'db_check',
                    'field' => 'gpa',
                    'min_value' => $type->min_gpa,
                    'key' => 'min_gpa',
                ];
            }

            // 3. Konversi BTA-PPI (Database Check)
            if (isset($type->require_bta_ppi) && $type->require_bta_ppi) {
                $requirements[] = [
                    'name' => 'Lulus Ujian BTA-PPI',
                    'type' => 'db_check',
                    'field' => 'status_bta_ppi',
                    'expected_value' => 'LULUS',
                    'key' => 'bta_ppi',
                ];
            }

            // 4. Konversi Surat Sehat (Upload)
            if (isset($type->require_health_certificate) && $type->require_health_certificate) {
                $requirements[] = [
                    'name' => 'Surat Keterangan Sehat',
                    'type' => 'upload',
                    'key' => 'health_certificate',
                ];
            }

            // 5. Konversi Izin Orang Tua (Upload)
            if (isset($type->require_parent_permission) && $type->require_parent_permission) {
                $requirements[] = [
                    'name' => 'Surat Izin Orang Tua',
                    'type' => 'upload',
                    'key' => 'parent_permission',
                ];
            }

            // 6. Konversi Dokumen Wajib Lainnya (Upload)
            $existingDocs = isset($type->required_documents) ? json_decode($type->required_documents ?? '[]', true) : [];
            foreach ($existingDocs as $docName) {
                if (filled($docName)) {
                    $requirements[] = [
                        'name' => $docName,
                        'type' => 'upload',
                        'key' => str_replace(' ', '_', strtolower($docName)),
                    ];
                }
            }

            // Update ke kolom JSON baru
            DB::table('jenis_kkn')->where('id', $type->id)->update([
                'requirements_config' => json_encode($requirements),
                'attendance_config' => json_encode([
                    'geofence_enabled' => true,
                    'radius_meters' => 500,
                    'location_source' => 'posko',
                    'require_photo' => true,
                ]),
            ]);
        }
    }

    public function down(): void
    {
        // Kembalikan ke null jika rollback
        DB::table('jenis_kkn')->update([
            'requirements_config' => null,
            'attendance_config' => null,
        ]);
    }
};
