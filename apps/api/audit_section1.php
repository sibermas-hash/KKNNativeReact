<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$routes = app('router')->getRoutes()->getRoutes();

$issues = [];
$noClient = [];
$total = 0;

$clientCode = file_get_contents(__DIR__.'/../../packages/api-client/src/endpoints/index.ts');

foreach ($routes as $route) {
    if (!str_starts_with($route->uri(), 'api/v1')) continue;
    $total++;

    $action = $route->getAction();
    $controllerAction = $action['controller'] ?? null;
    
    if (!$controllerAction) continue;
    
    @list($controller, $method) = explode('@', $controllerAction);
    
    // Check controller exists
    if (!class_exists($controller)) {
        $issues[] = "❌ [{$route->methods()[0]} {$route->uri()}] Controller $controller does not exist";
        continue;
    }
    
    // Check method exists
    if (!method_exists($controller, $method)) {
        $issues[] = "❌ [{$route->methods()[0]} {$route->uri()}] Method $method does not exist in $controller";
        continue;
    }
    
    // Check ApiResponse trait
    $traits = class_uses_recursive($controller);
    if (!in_array('App\Http\Traits\ApiResponse', $traits)) {
        $issues[] = "❌ [{$route->methods()[0]} {$route->uri()}] Controller does not use ApiResponse trait";
    }

    // Check if route has an API client
    $uriPart = str_replace('api/v1/', '', $route->uri());
    $uriPartRegex = preg_quote($uriPart, '~');
    $uriPartRegex = preg_replace('~\\\{[^}]+\\\}~', '.*', $uriPartRegex);
    if (!preg_match('~' . $uriPartRegex . '~', $clientCode)) {
        $noClient[] = "❌ [{$route->methods()[0]} {$route->uri()}] No matching API client call found";
    }
}

echo "Total routes audited: $total\n";
echo "Routes with issues: " . count($issues) . "\n";
foreach ($issues as $issue) echo "$issue\n";
echo "Routes with no API client function: " . count($noClient) . "\n";
foreach ($noClient as $nc) echo "$nc\n";
