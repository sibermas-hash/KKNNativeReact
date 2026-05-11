<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * H-016 (audit deferred): Migration Analyzer.
 *
 * DRY-RUN ONLY. Produces a report of migration debt so operators can plan
 * consolidation. This command does NOT modify the database or delete files.
 *
 * Categorizes migrations into:
 *   - duplicate-name groups (suggests consolidation candidates)
 *   - fix_* / patch chains (indicates earlier migration was wrong)
 *   - drop_*_then_re_add pairs (column whiplash)
 *   - performance-index groups (commonly over-split across many migrations)
 *
 * Output: `php artisan migrations:analyze` prints the report to stdout.
 * `--json` emits machine-readable JSON suitable for CI.
 *
 * Usage:
 *   php artisan migrations:analyze
 *   php artisan migrations:analyze --json > migration-report.json
 */
class AnalyzeMigrationsCommand extends Command
{
    protected $signature = 'migrations:analyze {--json : Output as JSON}';

    protected $description = 'Analyze migration debt (duplicates, fix-chains, drop-then-readd). Read-only.';

    public function handle(): int
    {
        $migrations = $this->loadMigrations();

        $report = [
            'total' => count($migrations),
            'duplicate_names' => $this->findDuplicateNames($migrations),
            'performance_index_migrations' => $this->findPerformanceIndexes($migrations),
            'fix_migrations' => $this->findFixMigrations($migrations),
            'drop_then_readd_pairs' => $this->findDropThenReadd($migrations),
            'future_dated' => $this->findFutureDated($migrations),
        ];

        if ($this->option('json')) {
            $this->line(json_encode($report, JSON_PRETTY_PRINT));
            return self::SUCCESS;
        }

        $this->renderHuman($report);
        return self::SUCCESS;
    }

    /**
     * @return array<int,array{name:string,date:string,slug:string,full:string}>
     */
    private function loadMigrations(): array
    {
        $dir = database_path('migrations');
        $files = glob($dir.'/*.php') ?: [];
        $rows = [];

        foreach ($files as $path) {
            $base = basename($path, '.php');
            // Laravel migration filename: YYYY_MM_DD_HHMMSS_slug.php
            if (! preg_match('/^(\d{4}_\d{2}_\d{2}(?:_\d{6})?)_(.+)$/', $base, $m)) {
                continue;
            }

            $rows[] = [
                'name' => $base,
                'date' => $m[1],
                'slug' => $m[2],
                'full' => $path,
            ];
        }

        usort($rows, static fn ($a, $b) => strcmp($a['date'], $b['date']));
        return $rows;
    }

    /**
     * Migrations whose slug (post-date suffix) appears more than once.
     */
    private function findDuplicateNames(array $migrations): array
    {
        $bySlug = [];
        foreach ($migrations as $row) {
            $bySlug[$row['slug']][] = $row['name'];
        }
        return array_filter($bySlug, fn ($names) => count($names) > 1);
    }

    /**
     * All performance-index-adding migrations, grouped to show over-splitting.
     */
    private function findPerformanceIndexes(array $migrations): array
    {
        return array_values(array_filter($migrations, fn ($row) =>
            str_contains($row['slug'], 'performance_index') ||
            str_contains($row['slug'], 'performance_indexes')
        ));
    }

    /**
     * Migrations whose slug starts with `fix_`, `patch_`, or similar — each
     * indicates an earlier migration was wrong.
     */
    private function findFixMigrations(array $migrations): array
    {
        $prefixes = ['fix_', 'patch_', 'cleanup_', 'consolidate_', 'repair_', 'correct_'];
        return array_values(array_filter($migrations, function ($row) use ($prefixes) {
            foreach ($prefixes as $prefix) {
                if (str_starts_with($row['slug'], $prefix)) return true;
            }
            return false;
        }));
    }

    /**
     * Find `add_X_to_Y` / `drop_X` pairs where the same column name appears
     * in both an add and a drop migration — indicates column whiplash.
     */
    private function findDropThenReadd(array $migrations): array
    {
        $adds = [];
        $drops = [];

        foreach ($migrations as $row) {
            // crude: extract the noun between `add_` / `drop_` and the next `_from|_to|_on`
            if (preg_match('/^add_(.+?)_(?:to|on)_(.+)$/', $row['slug'], $m)) {
                $adds[$m[1]][] = $row;
            } elseif (preg_match('/^drop_(.+?)(?:_from|_column|_from_mahasiswa|_from_dosen)?$/', $row['slug'], $m)) {
                $drops[$m[1]][] = $row;
            }
        }

        $pairs = [];
        foreach ($drops as $column => $dropRows) {
            // Partial match — e.g. "is_bta_ppi_passed" drop vs "is_bta_ppi_passed_to_mahasiswa" add
            foreach ($adds as $addedColumn => $addRows) {
                if ($addedColumn === $column || str_starts_with($addedColumn, $column) || str_starts_with($column, $addedColumn)) {
                    foreach ($addRows as $add) {
                        foreach ($dropRows as $drop) {
                            // Only flag when both exist and the add is on different date (re-add pattern)
                            if ($add['date'] !== $drop['date']) {
                                $pairs[] = [
                                    'column' => $column,
                                    'add' => $add['name'],
                                    'drop' => $drop['name'],
                                    'order' => $add['date'] < $drop['date']
                                        ? 'add-then-drop'
                                        : 'drop-then-readd',
                                ];
                            }
                        }
                    }
                }
            }
        }

        return $pairs;
    }

    /**
     * Migrations whose date prefix is in the future (indicates wrong clock or
     * intentional-but-confusing date convention).
     */
    private function findFutureDated(array $migrations): array
    {
        $today = now()->format('Y_m_d');
        return array_values(array_filter($migrations, fn ($row) =>
            str_starts_with($row['date'], '2026') ||
            $row['date'] > $today
        ));
    }

    private function renderHuman(array $report): void
    {
        $this->line('');
        $this->line('<fg=cyan>╔════════════════════════════════════════════════════╗</>');
        $this->line('<fg=cyan>║</>    <options=bold>SIBERMAS Migration Debt Analyzer</>              <fg=cyan>║</>');
        $this->line('<fg=cyan>║</>    <fg=yellow>Audit finding H-016 — dry-run only</>           <fg=cyan>║</>');
        $this->line('<fg=cyan>╚════════════════════════════════════════════════════╝</>');
        $this->line('');

        $this->line(sprintf('  Total migrations: <options=bold>%d</>', $report['total']));
        $this->line('');

        // --- Duplicate slugs ---
        if (! empty($report['duplicate_names'])) {
            $this->warn('  ⚠ Duplicate slug names ('.count($report['duplicate_names']).' groups):');
            foreach ($report['duplicate_names'] as $slug => $names) {
                $this->line('    '.Str::padRight($slug, 50).' ['.count($names).' files]');
                foreach ($names as $n) $this->line('        '.$n);
            }
            $this->line('');
        }

        // --- Performance indexes ---
        $perfCount = count($report['performance_index_migrations']);
        if ($perfCount > 0) {
            $this->warn("  ⚠ Performance-index migrations ({$perfCount} — suggest consolidating to ONE):");
            foreach ($report['performance_index_migrations'] as $row) {
                $this->line('    '.$row['name']);
            }
            $this->line('');
        }

        // --- Fix migrations ---
        $fixCount = count($report['fix_migrations']);
        if ($fixCount > 0) {
            $this->warn("  ⚠ fix_/patch_/cleanup_ migrations ({$fixCount} — each indicates an earlier migration was wrong):");
            foreach ($report['fix_migrations'] as $row) {
                $this->line('    '.$row['name']);
            }
            $this->line('');
        }

        // --- Drop-then-readd ---
        $pairCount = count($report['drop_then_readd_pairs']);
        if ($pairCount > 0) {
            $this->warn("  ⚠ Potential drop-then-readd / add-then-drop pairs ({$pairCount}):");
            foreach ($report['drop_then_readd_pairs'] as $pair) {
                $this->line(sprintf('    [%s] %s', $pair['order'], $pair['column']));
                $this->line('        ADD : '.$pair['add']);
                $this->line('        DROP: '.$pair['drop']);
            }
            $this->line('');
        }

        // --- Future-dated ---
        $futCount = count($report['future_dated']);
        if ($futCount > 0) {
            $this->warn("  ⚠ Future-dated migrations ({$futCount}) — filenames start with 2026 or later:");
            $this->line('    First 5 shown:');
            foreach (array_slice($report['future_dated'], 0, 5) as $row) {
                $this->line('    '.$row['name']);
            }
            if ($futCount > 5) {
                $this->line('    ... and '.($futCount - 5).' more');
            }
            $this->line('');
        }

        $this->line('<fg=green>  RECOMMENDATIONS</>');
        $this->line('  ─────────────────────────────────────────────────');
        $this->line('  1. Run against a STAGING database first:');
        $this->line('       php artisan schema:dump --prune --database=staging');
        $this->line('     Freezes current schema, deletes old migrations.');
        $this->line('');
        $this->line('  2. Audit every fix_*/patch_* migration to confirm the');
        $this->line('     FINAL column set is what you want. Especially:');
        $this->line('       - is_bta_ppi_passed (dropped then re-added)');
        $this->line('       - jenis_kkn columns (refactor + cleanup chain)');
        $this->line('');
        $this->line('  3. Before production rollout, test migrations from');
        $this->line('     scratch: drop DB, run `migrate --seed`, compare');
        $this->line('     schema against the pre-consolidation snapshot.');
        $this->line('');
        $this->line('  Tip: Re-run with --json to pipe into CI checks.');
        $this->line('');
    }
}
