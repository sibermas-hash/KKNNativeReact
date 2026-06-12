<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\MasterApi\SiakadRecordFilter;
use App\Services\MasterApiService;
use Illuminate\Console\Command;

/**
 * Exposes the configured SIAKAD filter and, optionally, runs the filter
 * against the live SIAKAD API stream without writing anything. Answers:
 *
 *   "If we sync now, how many records would be rejected, and why?"
 *
 * Useful before production deploys — lets ops review the filter's effect
 * before any data lands in the database.
 */
class FilterStatusCommand extends Command
{
    protected $signature = 'siakad:filter-status
        {--dry-run : Stream the live SIAKAD data and count what would be rejected}
        {--entity=both : both | students | lecturers}
        {--limit=0 : Stop after N records per entity (0 = all)}';

    protected $description = 'Show SIAKAD sync filter configuration; optionally dry-run against live API.';

    public function handle(SiakadRecordFilter $filter, MasterApiService $api): int
    {
        $this->renderConfig();

        if (! $this->option('dry-run')) {
            $this->line('');
            $this->info('Pass --dry-run to see actual filter effects on the live SIAKAD API.');

            return self::SUCCESS;
        }

        $entity = $this->option('entity');
        $limit = max(0, (int) $this->option('limit'));

        if (in_array($entity, ['both', 'students'], true)) {
            $this->runDryRun('students', $filter, fn () => $api->yieldSyncMahasiswa(), $limit);
        }

        if (in_array($entity, ['both', 'lecturers'], true)) {
            $this->runDryRun('lecturers', $filter, fn () => $api->yieldSyncDosen(), $limit);
        }

        return self::SUCCESS;
    }

    private function renderConfig(): void
    {
        $cfg = (array) config('siakad_filters', []);
        $enabled = (bool) ($cfg['enabled'] ?? true);
        $this->line('');
        $this->line('<fg=cyan>╔══════════════════════════════════════════════════════════╗</>');
        $this->line('<fg=cyan>║</>  SIAKAD Filter Configuration                             <fg=cyan>║</>');
        $this->line('<fg=cyan>╚══════════════════════════════════════════════════════════╝</>');
        $this->line('');

        if (! $enabled) {
            $this->warn('  ⚠ Filters are DISABLED (SIAKAD_FILTERS_ENABLED=false)');
            $this->line('    All records will be accepted.');

            return;
        }

        $s = (array) ($cfg['students'] ?? []);
        $l = (array) ($cfg['lecturers'] ?? []);

        $this->info('  Students:');
        $this->line(sprintf('    min_batch_year          : <options=bold>%d</>', $s['min_batch_year'] ?? 0));
        $this->line(sprintf('    max_batch_year_offset   : <options=bold>+%d</> (max allowed = current year + offset)', $s['max_batch_year_offset'] ?? 1));
        $this->line('    status_aktif filter     : <fg=gray>disabled (all statuses accepted)</>');
        $this->line(sprintf('    skip_non_kkn_jenjang    : <options=bold>%s</>', ($s['skip_non_kkn_jenjang'] ?? false) ? 'yes (S2/S3/Pascasarjana)' : 'no'));
        $this->line(sprintf('    require_valid_nik       : <options=bold>%s</>', ($s['require_valid_nik'] ?? false) ? 'yes (strict mode)' : 'no (stored NULL if invalid)'));
        $this->line(sprintf('    blocklist_nim           : <options=bold>%d entries</>', count($s['blocklist_nim'] ?? [])));
        $this->line(sprintf('    blocklist_nim_prefix    : <options=bold>%s</>', implode(', ', $s['blocklist_nim_prefix'] ?? []) ?: '(none)'));
        $this->line(sprintf('    blocklist_fakultas_ids  : <options=bold>%s</>', implode(', ', $s['blocklist_fakultas_ids'] ?? []) ?: '(none)'));

        $this->line('');
        $this->info('  Lecturers:');
        $this->line('    status_aktif filter     : <fg=gray>disabled (all statuses accepted)</>');
        $this->line(sprintf('    skip_tugas_belajar      : <options=bold>%s</>', ($l['skip_tugas_belajar'] ?? true) ? 'yes' : 'no'));
        $this->line(sprintf('    require_numeric_nip     : <options=bold>%s</>', ($l['require_numeric_nip'] ?? true) ? 'yes (reject LB-xxxx honorer)' : 'no'));
        $this->line(sprintf('    blocklist_nip           : <options=bold>%d entries</>', count($l['blocklist_nip'] ?? [])));
    }

    private function runDryRun(string $kind, SiakadRecordFilter $filter, \Closure $streamFactory, int $limit): void
    {
        $this->line('');
        $this->info(sprintf('─── dry-run %s ───', $kind));

        $counts = ['total' => 0, 'would_sync' => 0, 'would_skip' => 0];
        $byReason = [];

        $method = $kind === 'students' ? 'shouldSyncStudent' : 'shouldSyncLecturer';

        foreach ($streamFactory() as $record) {
            $counts['total']++;
            $decision = $filter->$method($record);
            if ($decision['action'] === SiakadRecordFilter::SYNC) {
                $counts['would_sync']++;
            } else {
                $counts['would_skip']++;
                $reason = $decision['reason'] ?? 'unknown';
                $byReason[$reason] = ($byReason[$reason] ?? 0) + 1;
            }
            if ($limit > 0 && $counts['total'] >= $limit) {
                break;
            }
        }

        $this->line(sprintf('  total scanned    : <options=bold>%d</>', $counts['total']));
        $this->line(sprintf('  would sync       : <fg=green>%d</>', $counts['would_sync']));
        $this->line(sprintf('  would skip       : <fg=yellow>%d</>', $counts['would_skip']));

        if (! empty($byReason)) {
            arsort($byReason);
            $this->line('');
            $this->line('  skip reasons:');
            foreach ($byReason as $reason => $count) {
                $this->line(sprintf('    %5d  %-35s %s', $count, $reason, SiakadRecordFilter::reasonLabel($reason)));
            }
        }
    }
}
