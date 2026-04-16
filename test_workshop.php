<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::role('superadmin')->first();
auth()->login($user);

$controller = app(\App\Http\Controllers\WorkshopController::class);
$request = \Illuminate\Http\Request::create('/admin/workshops', 'GET');
$request->setUserResolver(fn() => $user);

try {
    $response = $controller->index($request, app(\App\Services\PeriodContextService::class));
    if (isset($response->original) && $response->original instanceof \Inertia\Response) {
        echo "SUCCESS: Inertia page -> " . $response->original->component . "\n";
        // Let's also verify props
        $props = $response->original->props;
        echo "PROPS count: " . count($props) . "\n";
    } else {
        echo "ERROR: Response isn't an Inertia response. It returned something else.\n";
        print_r($response);
    }
} catch (\Throwable $e) {
    echo "CRASH: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
