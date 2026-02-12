<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== FINAL SERVER VERIFICATION ===\n";
echo "APP_URL: " . config('app.url') . "\n";
echo "DB_CONNECTION: " . config('database.default') . "\n";

try {
    $pdo = Illuminate\Support\Facades\DB::connection()->getPdo();
    echo "DB Connection: SUCCESS\n";
    
    $groupCount = App\Models\Group::count();
    echo "Groups in DB: $groupCount\n";
    
    $studentCount = App\Models\User::count();
    echo "Users in DB: $studentCount\n";
    
    // Test a specific group (Kelompok 1, ID 3)
    $group = App\Models\Group::find(3);
    if ($group) {
        $students = $group->students;
        echo "Group 3 ({$group->name}) Students: " . $students->count() . "\n";
    }
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
