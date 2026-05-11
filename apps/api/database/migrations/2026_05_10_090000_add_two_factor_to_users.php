<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 2FA (TOTP) fields untuk admin + DPL — proteksi akun privilege.
 *
 * Kolom:
 *   - two_factor_secret: base32 secret (encrypted), null = 2FA tidak aktif
 *   - two_factor_recovery_codes: JSON array of hashed backup codes (encrypted)
 *   - two_factor_confirmed_at: null sampai user konfirmasi 6-digit code pertama
 *   - two_factor_enforced: boolean — superadmin bisa paksa user tertentu wajib 2FA
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->text('two_factor_secret')->nullable()->after('password');
            $t->text('two_factor_recovery_codes')->nullable()->after('two_factor_secret');
            $t->timestamp('two_factor_confirmed_at')->nullable()->after('two_factor_recovery_codes');
            $t->boolean('two_factor_enforced')->default(false)->after('two_factor_confirmed_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->dropColumn([
                'two_factor_secret',
                'two_factor_recovery_codes',
                'two_factor_confirmed_at',
                'two_factor_enforced',
            ]);
        });
    }
};
