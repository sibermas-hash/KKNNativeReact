<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\KKN\LogAudit;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessAuditLog implements ShouldQueue
{
    use Queueable;

    protected $data;

    /**
     * Transient DB/Redis errors must not lose audit events.
     * Re-audit 2026-05-10 H-004: default tries=0 silently dropped failures.
     */
    public int $tries = 3;

    public array $backoff = [10, 60, 300];

    /**
     * Create a new job instance.
     */
    public function __construct(array $data)
    {
        $this->data = $data;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        LogAudit::create($this->data);
    }
}
