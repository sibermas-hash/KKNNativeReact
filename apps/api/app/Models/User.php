<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\KKN\DeviceToken;
use App\Models\KKN\Dosen;
use App\Models\KKN\ExternalUniversity;
use App\Models\KKN\Fakultas;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\ProfilUser;
use App\Models\KKN\ProgramKerja;
use App\Models\KKN\SystemSetting;
use App\Notifications\Auth\ResetPasswordNotification;
use App\Traits\HasManuallyEditedFields;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    // R13-DB-001: soft-delete on identity tables. Migration
    // 2026_05_11_060000_add_soft_deletes_to_identity_tables adds the
    // deleted_at column. Without this, hard-delete would cascade through
    // dozens of FKs and destroy audit-critical data.
    use SoftDeletes;

    protected $table = 'users';

    protected $fillable = [
        'username',
        'name',
        'email',
        'is_active',
        'must_change_password',
        'password_changed_at',
        'password',
        'avatar',
        'avatar_moderation_status',
        'avatar_moderation_reason',
        'avatar_moderation_reviewed_at',
        'avatar_moderation_reviewed_by',
        'phone',
        'address',
        'address_village_name',
        'address_district_name',
        'address_regency_name',
        'address_postal_code',
        'address_lat',
        'address_lng',
        'address_registered_at',
        'address_verified_at',
        'fakultas_id',
        'external_university_id',
        'manually_edited_fields',
        'notification_preferences',
        // 2FA fields intentionally excluded — use forceFill() in the 2FA setup flow
        'two_factor_confirmed_at',
        'two_factor_enforced',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        // R13-DB-004: 2FA secrets stored encrypted-at-rest but ALSO hidden
        // from serialization. Without this, any Resource or toArray() call
        // decrypts and leaks the TOTP seed + recovery codes.
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'must_change_password' => 'boolean',
        'password_changed_at' => 'datetime',
        'address_lat' => 'float',
        'address_lng' => 'float',
        'address_registered_at' => 'datetime',
        'address_verified_at' => 'datetime',
        'fakultas_id' => 'integer',
        'external_university_id' => 'integer',
        'password' => 'hashed',
        'manually_edited_fields' => 'array',
        'notification_preferences' => 'array',
        // PII encryption (Phase 3). Columns widened to TEXT in migration
        // 2026_05_10_050000_expand_pii_columns_on_users. No lookup-by-value
        // across the codebase for these fields; if a future feature needs
        // search (e.g. "find users in village X"), add a blind index per
        // the HasBlindIndex pattern.
        //
        // email + address_lat/lng intentionally NOT encrypted — email is
        // used by Laravel auth guard lookup (encryption requires auth
        // guard override); lat/lng are floats used for geo calculations.
        'phone' => 'encrypted',
        'address' => 'encrypted',
        'address_village_name' => 'encrypted',
        'address_district_name' => 'encrypted',
        'address_regency_name' => 'encrypted',
        'address_postal_code' => 'encrypted',

        // 2FA (TOTP) — encrypted at rest.
        // two_factor_secret: base32 TOTP secret (Google Authenticator compatible)
        // two_factor_recovery_codes: JSON array of single-use backup codes (hashed)
        'two_factor_secret' => 'encrypted',
        'two_factor_recovery_codes' => 'encrypted:array',
        'two_factor_confirmed_at' => 'datetime',
        'two_factor_enforced' => 'boolean',
    ];

    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasManuallyEditedFields, HasRoles, Notifiable;

    /**
     * Send the password reset notification.
     *
     * @param  string  $token
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    /**
     * Default per-channel preferences. Returned when the user hasn't
     * customized — all channels on.
     */
    public const DEFAULT_NOTIFICATION_PREFERENCES = [
        'in_app' => true,
        'email' => true,
        'push' => true,
    ];

    /**
     * Returns the effective notification preferences, merging user overrides
     * over the defaults. Always returns a complete array so callers can
     * `$user->notificationPreferences()['push']` without null checks.
     */
    public function notificationPreferences(): array
    {
        $defaults = [
            'in_app' => SystemSetting::get('notification_default_in_app', '1') !== '0',
            'email' => SystemSetting::get('notification_default_email', '1') !== '0',
            'push' => SystemSetting::get('notification_default_push', '1') !== '0',
        ];
        $stored = $this->notification_preferences ?? [];

        return array_merge($defaults, is_array($stored) ? $stored : []);
    }

    /**
     * Whether this user should receive notifications via the given channel
     * name. Channel names match Laravel notification via() return values
     * (`database` → in_app, `mail` → email, `fcm` → push).
     */
    public function wantsNotificationVia(string $channel): bool
    {
        $prefs = $this->notificationPreferences();

        return match ($channel) {
            'database' => $prefs['in_app'] ?? true,
            'mail', 'email' => $prefs['email'] ?? true,
            'fcm', 'push' => $prefs['push'] ?? true,
            default => true,
        };
    }

    /**
     * Password policy: Minimum 8 characters, mixed case, numbers, and symbols.
     * Apply this across all password validation rules for consistency.
     */
    public const PASSWORD_REQUIREMENTS = 'min:8|mixed_case|numbers|symbols';

    // ── 2FA (TOTP) helpers ───────────────────────────────────────────

    /**
     * Apakah user sudah mengaktifkan + mengkonfirmasi 2FA?
     */
    public function hasTwoFactorEnabled(): bool
    {
        return filled($this->two_factor_secret) && filled($this->two_factor_confirmed_at);
    }

    /**
     * Apakah user WAJIB pakai 2FA berdasarkan role atau enforced flag?
     * - superadmin selalu wajib
     * - admin wajib
     * - dpl wajib
     * - dosen biasa + student optional
     */
    public function requiresTwoFactor(): bool
    {
        if ($this->two_factor_enforced) {
            return true;
        }
        $privilegedRoles = ['superadmin', 'admin', 'faculty_admin', 'external_lppm_admin', 'dpl'];
        foreach ($privilegedRoles as $role) {
            if ($this->hasRole($role)) {
                return true;
            }
        }

        return false;
    }

    public function fakultas(): BelongsTo
    {
        return $this->belongsTo(Fakultas::class, 'fakultas_id');
    }

    public function externalUniversity(): BelongsTo
    {
        return $this->belongsTo(ExternalUniversity::class, 'external_university_id');
    }

    public function mahasiswa(): HasOne
    {
        return $this->hasOne(Mahasiswa::class, 'user_id');
    }

    public function dosen(): HasOne
    {
        return $this->hasOne(Dosen::class, 'user_id', 'id');
    }

    public function profile(): HasOne
    {
        return $this->hasOne(ProfilUser::class, 'user_id');
    }

    public function deviceTokens(): HasMany
    {
        return $this->hasMany(DeviceToken::class);
    }

    public function approvedProgramKerja(): HasMany
    {
        return $this->hasMany(ProgramKerja::class, 'approved_by');
    }

    public function reviewedLaporanAkhir(): HasMany
    {
        return $this->hasMany(LaporanAkhir::class, 'reviewed_by');
    }

    public function nilaiKkn(): HasMany
    {
        return $this->hasMany(NilaiKkn::class, 'user_id');
    }

    /**
     * Get the active KKN group ID for this user (if student).
     * SURGICAL: Uses in-memory collection check if relations are already loaded to prevent redundant DB hits.
     */
    public function getActiveGroupId(): ?int
    {
        $mahasiswa = $this->mahasiswa;
        if (! $mahasiswa) {
            return null;
        }

        // Check if nested relation 'peserta' is already loaded on the 'mahasiswa' relation
        if ($mahasiswa->relationLoaded('peserta')) {
            return $mahasiswa->peserta
                ->first(fn ($p) => $p->status === 'approved')
                ?->kelompok_id;
        }

        // Fallback to a clean, non-N+1 query
        return $mahasiswa->peserta()
            ->where('status', 'approved')
            ->value('kelompok_id');
    }
}
