<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'address_village_name')) {
                $table->string('address_village_name', 150)->nullable()->after('address');
            }
            if (! Schema::hasColumn('users', 'address_district_name')) {
                $table->string('address_district_name', 150)->nullable()->after('address_village_name');
            }
            if (! Schema::hasColumn('users', 'address_regency_name')) {
                $table->string('address_regency_name', 150)->nullable()->after('address_district_name');
            }
            if (! Schema::hasColumn('users', 'address_postal_code')) {
                $table->string('address_postal_code', 10)->nullable()->after('address_regency_name');
            }
            if (! Schema::hasColumn('users', 'address_lat')) {
                $table->decimal('address_lat', 10, 8)->nullable()->after('address_postal_code');
            }
            if (! Schema::hasColumn('users', 'address_lng')) {
                $table->decimal('address_lng', 11, 8)->nullable()->after('address_lat');
            }
            if (! Schema::hasColumn('users', 'address_registered_at')) {
                $table->timestamp('address_registered_at')->nullable()->after('address_lng');
            }
        });

        if (Schema::hasColumn('users', 'domicile_village_name')) {
            DB::table('users')->whereNull('address_village_name')->update(['address_village_name' => DB::raw('domicile_village_name')]);
        }
        if (Schema::hasColumn('users', 'domicile_district_name')) {
            DB::table('users')->whereNull('address_district_name')->update(['address_district_name' => DB::raw('domicile_district_name')]);
        }
        if (Schema::hasColumn('users', 'domicile_regency_name')) {
            DB::table('users')->whereNull('address_regency_name')->update(['address_regency_name' => DB::raw('domicile_regency_name')]);
        }

        if (Schema::hasColumn('mahasiswa', 'domisili_lat')) {
            DB::statement(<<<'SQL'
                UPDATE users
                SET
                    address = COALESCE(users.address, mahasiswa.domisili_address),
                    address_village_name = COALESCE(users.address_village_name, mahasiswa.domisili_village),
                    address_district_name = COALESCE(users.address_district_name, mahasiswa.domisili_district),
                    address_regency_name = COALESCE(users.address_regency_name, mahasiswa.domisili_regency),
                    address_postal_code = COALESCE(users.address_postal_code, mahasiswa.domisili_postal_code),
                    address_lat = COALESCE(users.address_lat, mahasiswa.domisili_lat),
                    address_lng = COALESCE(users.address_lng, mahasiswa.domisili_lng),
                    address_registered_at = COALESCE(users.address_registered_at, mahasiswa.domisili_registered_at)
                FROM mahasiswa
                WHERE mahasiswa.user_id = users.id
            SQL);
        }

        Schema::table('users', function (Blueprint $table) {
            $drop = array_values(array_filter([
                'domicile_village_name',
                'domicile_district_name',
                'domicile_regency_name',
            ], fn (string $column) => Schema::hasColumn('users', $column)));

            if ($drop !== []) {
                $table->dropColumn($drop);
            }
        });

        Schema::table('mahasiswa', function (Blueprint $table) {
            $drop = array_values(array_filter([
                'domisili_lat',
                'domisili_lng',
                'domisili_address',
                'domisili_village',
                'domisili_district',
                'domisili_regency',
                'domisili_province',
                'domisili_postal_code',
                'domisili_registered_at',
            ], fn (string $column) => Schema::hasColumn('mahasiswa', $column)));

            if ($drop !== []) {
                $table->dropColumn($drop);
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'domicile_village_name')) {
                $table->string('domicile_village_name', 150)->nullable()->after('address');
            }
            if (! Schema::hasColumn('users', 'domicile_district_name')) {
                $table->string('domicile_district_name', 150)->nullable()->after('domicile_village_name');
            }
            if (! Schema::hasColumn('users', 'domicile_regency_name')) {
                $table->string('domicile_regency_name', 150)->nullable()->after('domicile_district_name');
            }
        });

        Schema::table('mahasiswa', function (Blueprint $table) {
            if (! Schema::hasColumn('mahasiswa', 'domisili_lat')) {
                $table->decimal('domisili_lat', 10, 8)->nullable();
            }
            if (! Schema::hasColumn('mahasiswa', 'domisili_lng')) {
                $table->decimal('domisili_lng', 11, 8)->nullable();
            }
            if (! Schema::hasColumn('mahasiswa', 'domisili_address')) {
                $table->string('domisili_address', 500)->nullable();
            }
            if (! Schema::hasColumn('mahasiswa', 'domisili_village')) {
                $table->string('domisili_village', 100)->nullable();
            }
            if (! Schema::hasColumn('mahasiswa', 'domisili_district')) {
                $table->string('domisili_district', 100)->nullable();
            }
            if (! Schema::hasColumn('mahasiswa', 'domisili_regency')) {
                $table->string('domisili_regency', 100)->nullable();
            }
            if (! Schema::hasColumn('mahasiswa', 'domisili_province')) {
                $table->string('domisili_province', 100)->nullable();
            }
            if (! Schema::hasColumn('mahasiswa', 'domisili_postal_code')) {
                $table->string('domisili_postal_code', 10)->nullable();
            }
            if (! Schema::hasColumn('mahasiswa', 'domisili_registered_at')) {
                $table->timestamp('domisili_registered_at')->nullable();
            }
        });

        DB::table('users')->update([
            'domicile_village_name' => DB::raw('address_village_name'),
            'domicile_district_name' => DB::raw('address_district_name'),
            'domicile_regency_name' => DB::raw('address_regency_name'),
        ]);

        if (Schema::hasColumn('mahasiswa', 'domisili_lat')) {
            DB::statement(<<<'SQL'
                UPDATE mahasiswa
                SET
                    domisili_address = users.address,
                    domisili_village = users.address_village_name,
                    domisili_district = users.address_district_name,
                    domisili_regency = users.address_regency_name,
                    domisili_postal_code = users.address_postal_code,
                    domisili_lat = users.address_lat,
                    domisili_lng = users.address_lng,
                    domisili_registered_at = users.address_registered_at
                FROM users
                WHERE mahasiswa.user_id = users.id
            SQL);
        }

        Schema::table('users', function (Blueprint $table) {
            $drop = array_values(array_filter([
                'address_village_name',
                'address_district_name',
                'address_regency_name',
                'address_postal_code',
                'address_lat',
                'address_lng',
                'address_registered_at',
            ], fn (string $column) => Schema::hasColumn('users', $column)));

            if ($drop !== []) {
                $table->dropColumn($drop);
            }
        });
    }
};
