<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Drop dead/unused columns identified during audit 2026-05-06:
 *
 * - mahasiswa.email_api     : 0 data, not in fillable, not used anywhere
 * - mahasiswa.university    : all rows = "Universitas UIN SAIZU Purwokerto" (hardcoded, useless)
 * - users.email_api         : not in fillable, not used in any logic
 * - users.email_verified_at : only in $casts, not used in any logic (4 rows)
 * - users.prodi_id          : not in fillable, prodi is on mahasiswa table
 * - periode.angkatan        : replaced by periode.periode, not in fillable (silent fail on write)
 */
return new class extends Migration
{
    public function up(): void
    {
        $dropIfExists = function (string $table, array $columns): void {
            $existing = array_values(array_filter(
                $columns,
                fn ($col) => Schema::hasColumn($table, $col)
            ));
            if (! empty($existing)) {
                Schema::table($table, function (Blueprint $t) use ($existing) {
                    $t->dropColumn($existing);
                });
            }
        };

        $dropIfExists('mahasiswa', ['email_api', 'university']);
        $dropIfExists('users', ['email_api', 'email_verified_at', 'prodi_id']);
        $dropIfExists('periode', ['angkatan']);
    }

    public function down(): void
    {
        Schema::table('mahasiswa', function (Blueprint $table) {
            $table->string('email_api', 100)->nullable();
            $table->string('university', 100)->nullable();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('email_api', 100)->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->foreignId('prodi_id')->nullable()->constrained('prodi');
        });

        Schema::table('periode', function (Blueprint $table) {
            $table->integer('angkatan')->nullable();
        });
    }
};
