<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\KKN\LogAudit;
use Illuminate\Database\Eloquent\Model;

/**
 * Model-level audit trail writer.
 *
 * Registered per-model via {@see \App\Providers\AppServiceProvider::boot()}.
 * Writes `log_audit` rows synchronously (cheap — single insert). The more
 * expensive diff computation is kept in pure PHP.
 *
 * Design:
 *   - CREATE: store new_values only (old is always empty on create)
 *   - UPDATE: store ONLY the diff (changed fields) — never the full row.
 *             Saves ~80% storage vs logging full snapshots and makes the
 *             audit viewer immediately useful ("what changed?").
 *   - DELETE: store old_values (snapshot at deletion time)
 *
 * Sensitive fields are redacted by name match (password, tokens, 2FA) AND
 * PII (NIK, NIP, NIM, phone, birth_date, email, password_changed_at). This
 * aligns with the Sentry PII scrubbing in config/sentry.php so audit log
 * + error log never expose the same data.
 */
class AuditObserver
{
    /**
     * Fields masked to '***MASKED***' in both old_values and new_values.
     * Keep in sync with config/sentry.php `before_send` scrubber.
     */
    private const SENSITIVE_FIELDS = [
        // Credentials
        'password',
        'password_confirmation',
        'current_password',
        'remember_token',
        'api_token',
        'two_factor_secret',
        'two_factor_recovery_codes',

        // Government / institutional IDs
        'nik',
        'nip',
        'nim',
        'nidn',
        'npwp',

        // PII that rarely needs to appear in audit detail
        'phone',
        'no_hp',
        'telepon',
        'birth_date',
        'tanggal_lahir',
        'mother_name',
        'nama_ibu',
        'email',
        'api_email',

        // Banking
        'no_rekening',
        'nama_bank',
    ];

    private const MASK = '***MASKED***';

    public function created(Model $model): void
    {
        $this->log('CREATE', $model);
    }

    public function updated(Model $model): void
    {
        $this->log('UPDATE', $model);
    }

    public function deleted(Model $model): void
    {
        $this->log('DELETE', $model);
    }

    private function log(string $action, Model $model): void
    {
        // Skip when there's no authenticated actor. Most console / queue
        // writes fall into this bucket and would pollute the audit log
        // with "system" rows.
        if (! auth()->check()) {
            return;
        }

        [$oldValues, $newValues] = $this->computeDiff($action, $model);

        // UPDATE without any actual change to non-sensitive fields. Happens
        // when a "save" only touches updated_at, or when every changed field
        // was redacted. Skipping these keeps the audit log focused.
        if ($action === 'UPDATE' && empty($oldValues) && empty($newValues)) {
            return;
        }

        LogAudit::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'description' => $this->describeChange($action, $model, $oldValues ?? [], $newValues ?? []),
            'severity' => $this->deriveSeverity($action, $model),
            'model_type' => $model::class,
            'model_id' => $model->getKey(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()?->ip(),
            'user_agent' => request()?->userAgent(),
        ]);
    }

    /**
     * Build old/new value arrays appropriate for the given action.
     * For UPDATE, returns ONLY the changed fields (diff) — not the whole row.
     *
     * @return array{0: ?array, 1: ?array}
     */
    private function computeDiff(string $action, Model $model): array
    {
        if ($action === 'CREATE') {
            return [null, $this->mask($model->getAttributes())];
        }

        if ($action === 'DELETE') {
            return [$this->mask($model->getOriginal()), null];
        }

        // UPDATE — diff only.
        $changed = $model->getChanges(); // fields whose value differs from original
        // Exclude Eloquent bookkeeping columns that don't carry user-facing
        // semantics. updated_at changes on every save; it's already
        // implicit in the audit row's created_at.
        unset($changed['updated_at']);

        $old = [];
        $new = [];
        foreach ($changed as $field => $newValue) {
            $old[$field] = $model->getOriginal($field);
            $new[$field] = $newValue;
        }

        return [$this->mask($old), $this->mask($new)];
    }

    /**
     * Replace sensitive field values with a constant mask. Keeps the keys
     * visible so reviewers can see WHICH sensitive field changed, just
     * not its value.
     */
    private function mask(array $attrs): array
    {
        foreach ($attrs as $key => $_value) {
            if (in_array($key, self::SENSITIVE_FIELDS, true)) {
                $attrs[$key] = self::MASK;
            }
        }
        return $attrs;
    }

    private function describeChange(string $action, Model $model, array $old, array $new): string
    {
        $name = class_basename($model);
        $id = (string) ($model->getKey() ?? '?');

        return match ($action) {
            'CREATE' => "Membuat {$name} #{$id}",
            'UPDATE' => "Mengubah {$name} #{$id} (" . implode(', ', array_keys($new)) . ')',
            'DELETE' => "Menghapus {$name} #{$id}",
            default  => "{$action} {$name} #{$id}",
        };
    }

    private function deriveSeverity(string $action, Model $model): string
    {
        if ($action === 'DELETE') {
            return 'high';
        }

        // Promote grade/certificate mutations to high — these are the most
        // fraud-sensitive surfaces in the system.
        $class = $model::class;
        if (str_contains($class, 'NilaiKkn') || str_contains($class, 'Sertifikat') || str_contains($class, 'Konfigurasi')) {
            return 'high';
        }

        return $action === 'UPDATE' ? 'medium' : 'low';
    }
}
