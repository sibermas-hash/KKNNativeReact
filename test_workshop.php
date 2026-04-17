<?php

use App\Http\Controllers\WorkshopController;
use App\Models\User;
use App\Services\PeriodContextService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Request;
use Inertia\Response;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

$user = User::role('superadmin')->first();
auth()->login($user);

$controller = app(WorkshopController::class);
$request = Request::create('/admin/workshops', 'GET');
$request->setUserResolver(fn () => $user);

try {
    $response = $controller->index($request, app(PeriodContextService::class));
    if (isset($response->original) && $response->original instanceof Response) {
        echo 'SUCCESS: Inertia page -> '.$response->original->component."\n";
        // Let's also verify props
        $props = $response->original->props;
        echo 'PROPS count: '.count($props)."\n";
    } else {
        echo "ERROR: Response isn't an Inertia response. It returned something else.\n";
        print_r($response);
    }
} catch (Throwable $e) {
    echo 'CRASH: '.$e->getMessage()."\n";
    echo $e->getTraceAsString();
}
