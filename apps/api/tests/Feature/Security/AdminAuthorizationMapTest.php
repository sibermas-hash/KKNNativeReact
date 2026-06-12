<?php

declare(strict_types=1);

use App\Http\Middleware\EnsureAdminAuthorization;
use Illuminate\Support\Facades\Gate;

/*
 * Architecture test enforcing H-001 (audit finding).
 *
 * Every controller in App\Http\Controllers\Api\V1\Admin\ MUST appear in
 * EnsureAdminAuthorization::PERMISSION_MAP, and every mapped permission
 * MUST be a defined Gate ability.
 */

it('maps every V1 admin controller to a permission', function () {
    $adminDir = app_path('Http/Controllers/Api/V1/Admin');

    expect(is_dir($adminDir))->toBeTrue('Admin controller directory missing');

    // R-007 fix: recurse into subdirectories so nested namespaces are also
    // validated (e.g., Api/V1/Admin/Reports/FooController.php).
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($adminDir, RecursiveDirectoryIterator::SKIP_DOTS)
    );

    $classes = [];
    foreach ($iterator as $file) {
        /** @var SplFileInfo $file */
        if (! $file->isFile() || $file->getExtension() !== 'php') {
            continue;
        }
        $relative = str_replace($adminDir.DIRECTORY_SEPARATOR, '', $file->getPathname());
        $fqn = 'App\\Http\\Controllers\\Api\\V1\\Admin\\'
            .str_replace([DIRECTORY_SEPARATOR, '.php'], ['\\', ''], $relative);
        $classes[] = $fqn;
    }

    $mapped = array_keys(EnsureAdminAuthorization::PERMISSION_MAP);
    $missing = array_diff($classes, $mapped);

    expect($missing)->toBeEmpty(
        'These admin controllers are not mapped in EnsureAdminAuthorization::PERMISSION_MAP: '
        .implode(', ', array_map(fn ($c) => class_basename($c), $missing))
        .'. Add them to prevent silent permission bypass.'
    );
});

it('does not reference admin controllers that no longer exist', function () {
    $mapped = array_keys(EnsureAdminAuthorization::PERMISSION_MAP);
    $missing = array_filter($mapped, fn ($c) => ! class_exists($c));

    expect($missing)->toBeEmpty(
        'EnsureAdminAuthorization references non-existent classes: '
        .implode(', ', $missing)
    );
});

it('references only defined Gate abilities', function () {
    $abilities = array_unique(array_values(EnsureAdminAuthorization::PERMISSION_MAP));

    $undefined = array_filter($abilities, fn ($ability) => ! Gate::has($ability));

    expect($undefined)->toBeEmpty(
        'Gate abilities used by EnsureAdminAuthorization are not defined in AppServiceProvider: '
        .implode(', ', $undefined)
    );
});
