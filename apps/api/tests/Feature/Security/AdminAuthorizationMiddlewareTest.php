<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Middleware\EnsureAdminAuthorization;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Spatie\Permission\Models\Role;

function securityTestUserWithRole(string $role): User
{
    Role::findOrCreate($role, 'web');

    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

it('blocks unmapped admin controllers even for superadmin', function () {
    $user = securityTestUserWithRole('superadmin');
    $controller = new class {
        public function __invoke()
        {
            return response()->json(['ok' => true]);
        }
    };

    $request = Request::create('/api/v1/admin/unmapped-security-test', 'GET');
    $request->setUserResolver(fn () => $user);
    $request->setRouteResolver(fn () => tap(
        new Route(['GET'], 'api/v1/admin/unmapped-security-test', ['uses' => $controller::class.'@__invoke']),
        fn (Route $route) => $route->bind($request)
    ));

    $middleware = new EnsureAdminAuthorization;

    $middleware->handle($request, fn () => response()->json(['ok' => true]));
})->throws(
    Symfony\Component\HttpKernel\Exception\HttpException::class,
    'Authorization misconfiguration.'
);

it('allows mapped admin controllers for superadmin after coverage check', function () {
    $user = securityTestUserWithRole('superadmin');
    $request = Request::create('/api/v1/admin/dashboard', 'GET');
    $request->setUserResolver(fn () => $user);
    $request->setRouteResolver(fn () => tap(
        new Route(['GET'], 'api/v1/admin/dashboard', ['uses' => DashboardController::class.'@index']),
        fn (Route $route) => $route->bind($request)
    ));

    $response = (new EnsureAdminAuthorization)->handle(
        $request,
        fn () => response()->json(['ok' => true])
    );

    expect($response->getStatusCode())->toBe(200);
});
