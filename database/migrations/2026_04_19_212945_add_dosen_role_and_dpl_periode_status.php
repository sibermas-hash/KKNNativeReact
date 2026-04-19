<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tambah role 'dosen' (base role untuk semua dosen)
        Role::findOrCreate('dosen', 'web');

        // 2. Tambah kolom status pada dpl_periode untuk alur approval
        Schema::table('dpl_periode', function (Blueprint $table) {
            $table->string('status', 20)->default('pending')->after('is_active');
            $table->timestamp('approved_at')->nullable()->after('status');
            $table->unsignedBigInteger('approved_by')->nullable()->after('approved_at');
            $table->text('rejection_reason')->nullable()->after('approved_by');

            $table->index('status');
        });

        // 3. Migrasi: semua user role 'dpl' juga mendapat role 'dosen'
        $dplRole = Role::findByName('dpl', 'web');
        $dosenRole = Role::findByName('dosen', 'web');

        \DB::table('model_has_roles')
            ->where('role_id', $dplRole->id)
            ->get()
            ->each(function ($row) use ($dosenRole) {
                \DB::table('model_has_roles')->insertOrIgnore([
                    'role_id' => $dosenRole->id,
                    'model_type' => $row->model_type,
                    'model_id' => $row->model_id,
                ]);
            });
    }

    public function down(): void
    {
        Schema::table('dpl_periode', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropColumn(['status', 'approved_at', 'approved_by', 'rejection_reason']);
        });

        // Hapus role dosen dari semua user lalu hapus role
        $dosenRole = Role::findByName('dosen', 'web');
        if ($dosenRole) {
            \DB::table('model_has_roles')->where('role_id', $dosenRole->id)->delete();
            $dosenRole->delete();
        }
    }
};
