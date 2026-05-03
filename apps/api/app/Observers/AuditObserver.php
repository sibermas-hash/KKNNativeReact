<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\KKN\LogAudit;
use Illuminate\Database\Eloquent\Model;

class AuditObserver
{
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
        if (! auth()->check()) {
            return;
        }

        $sensitiveKeys = ['password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes'];

        $oldValues = $action === 'UPDATE'
            ? collect($model->getOriginal())->except($sensitiveKeys)->toArray()
            : null;

        $newValues = $action !== 'DELETE'
            ? collect($model->getAttributes())->except($sensitiveKeys)->toArray()
            : null;

        LogAudit::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'model_type' => $model::class,
            'model_id' => $model->getKey(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()?->ip(),
            'user_agent' => request()?->userAgent(),
        ]);
    }
}
