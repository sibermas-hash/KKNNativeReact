Internal Server Error

Error
app/Http/Controllers/Admin/GeneratorNilaiController.php:25
Class "App\Http\Controllers\Admin\Periode" not found

LARAVEL
12.51.0
PHP
8.4.17
UNHANDLED
CODE 0
500
GET
https://kkn.infiatin.cloud/admin/grade-generator

Exception trace
App\Http\Controllers\Admin\GeneratorNilaiController->index()
app/Http/Controllers/Admin/GeneratorNilaiController.php:25

20
21class GeneratorNilaiController extends Controller
22{
23    public function index(): Response
24    {
25        $periods = Periode::with('tahunAkademik')->orderByDesc('id')->get()->map(fn($p) => [
26            'id' => $p->id,
27            'name' => "Angkatan " . ($p->name ?? '-') . " (" . ($p->tahunAkademik?->year ?? '-') . ")",
28        ]);
29
30        $groups = KelompokKkn::with(['lokasi', 'dpl.user:id,name'])
31            ->orderBy('code')
32            ->get()
33            ->map(function (KelompokKkn $g) {
34                $addressParts = explode(',', $g->lokasi?->address ?? '');
35                $kelompokNum = preg_replace('/[^0-9]/', '', $g->code);
36                return [
37
7 vendor frames

Illuminate\Routing\ControllerDispatcher->dispatch()
vendor/laravel/framework/src/Illuminate/Routing/ControllerDispatcher.php:46
Illuminate\Routing\Route->runController()
vendor/laravel/framework/src/Illuminate/Routing/Route.php:265
Illuminate\Routing\Route->run()
vendor/laravel/framework/src/Illuminate/Routing/Route.php:211
Illuminate\Routing\Router->{closure:Illuminate\Routing\Router::runRouteWithinStack():821}()
vendor/laravel/framework/src/Illuminate/Routing/Router.php:822
Illuminate\Pipeline\Pipeline->{closure:Illuminate\Pipeline\Pipeline::prepareDestination():178}()
vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php:180
Spatie\Permission\Middleware\RoleMiddleware->handle()
vendor/spatie/laravel-permission/src/Middleware/RoleMiddleware.php:37
Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():194}:195}()
vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php:219
App\Http\Middleware\CspHeaders->handle()
app/Http/Middleware/CspHeaders.php:16

11    /**
12     * Handle an incoming request.
13     */
14    public function handle(Request $request, Closure $next): Response
15    {
16        $response = $next($request);
17
18        // Security headers
19        $response->headers->set('X-Content-Type-Options', 'nosniff');
20        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
21        $response->headers->set('X-XSS-Protection', '1; mode=block');
22        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
23        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
24
25        // Only apply CSP in non-local environments to avoid Vite dev server friction
26        if (config('app.env') !== 'local') {
27            $csp = implode('; ', [
28
7 vendor frames

Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():194}:195}()
vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php:219
Inertia\Middleware->handle()
vendor/inertiajs/inertia-laravel/src/Middleware.php:122
Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():194}:195}()
vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php:219
Illuminate\Routing\Middleware\SubstituteBindings->handle()
vendor/laravel/framework/src/Illuminate/Routing/Middleware/SubstituteBindings.php:50
Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():194}:195}()
vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php:219
Illuminate\Routing\Middleware\ThrottleRequests->handleRequest()
vendor/laravel/framework/src/Illuminate/Routing/Middleware/ThrottleRequests.php:166
Illuminate\Routing\Middleware\ThrottleRequests->handle()
vendor/laravel/framework/src/Illuminate/Routing/Middleware/ThrottleRequests.php:93
App\Http\Middleware\KknThrottleMiddleware->handle()
app/Http/Middleware/KknThrottleMiddleware.php:58

53        if (str_contains($routeName, 'bulk') || str_contains($routeName, 'mass')) {
54            $maxAttempts = 5;
55            $decayMinutes = 60;
56        }
57
58        return parent::handle($request, $next, $maxAttempts, $decayMinutes, $prefix);
59    }
60}
61
43 vendor frames

Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():194}:195}()
vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php:219
Illuminate\Auth\Middleware\Authenticate->handle()
vendor/laravel/framework/src/Illuminate/Auth/Middleware/Authenticate.php:63
Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():194}:195}()
vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php:219
Illuminate\Foundation\Http\Middleware\VerifyCsrfToken->handle()
vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/VerifyCsrfToken.php:87
Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():194}:195}()
vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php:219
Illuminate\View\Middleware\ShareErrorsFromSession->handle()
vendor/laravel/framework/src/Illuminate/View/Middleware/ShareErrorsFromSession.php:48
Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():194}:195}()
vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php:219
Illuminate\Session\Middleware\StartSession->handleStatefulRequest()
vendor/laravel/framework/src/Illuminate/Session/Middleware/StartSession.php:120
Illuminate\Session\Middleware\StartSession->handle()
vendor/laravel/framework/src/Illuminate/Session/Middleware/StartSession.php:63
Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():194}:195}()
vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php:219
Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse->handle()
vendor/laravel/framework/src/Illuminate/Cookie/Middleware/AddQueuedCookiesToResponse.php:36
Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():194}:195}()
vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php:219
Illuminate\Cookie\Middleware\EncryptCookies->handle()
vendor/laravel/framework/src/Illuminate/Cookie/Middleware/EncryptCookies.php:74
Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():194}:195}()
vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php:219
Illuminate\Pipeline\Pipeline->then()
vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php:137
Illuminate\Routing\Router->runRouteWithinStack()
vendor/laravel/framework/src/Illuminate/Routing/Router.php:821
Illuminate\Routing\Router->runRoute()
vendor/laravel/framework/src/Illuminate/Routing/Router.php:800
Illuminate\Routing\Router->dispatchToRoute()
vendor/laravel/framework/src/Illuminate/Routing/Router.php:764
Illuminate\Routing\Router->dispatch()
vendor/laravel/framework/src/Illuminate/Routing/Router.php:753
Illuminate\Foundation\Http\Kernel->{closure:Illuminate\Foundation\Http\Kernel::dispatchToRouter():197}()
vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php:200
Illuminate\Pipeline\Pipeline->{closure:Illuminate\Pipeline\Pipeline::prepareDestination():178}()
vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php:180
Illuminate\Foundation\Http\Middleware\TransformsRequest->handle()
vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/TransformsRequest.php:21
Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull->handle()
vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/ConvertEmptyStringsToNull.php:31
Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():194}:195}()
vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php:219
Illuminate\Foundation\Http\Middleware\TransformsRequest->handle()
vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/TransformsRequest.php:21
Illuminate\Foundation\Http\Middleware\TrimStrings->handle()
vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/TrimStrings.php:51
Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():194}:195}()
vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php:219
Illuminate\Http\Middleware\ValidatePostSize->handle()
vendor/laravel/framework/src/Illuminate/Http/Middleware/ValidatePostSize.php:27
Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():194}:195}()
vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php:219
Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance->handle()
vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/PreventRequestsDuringMaintenance.php:109
Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():194}:195}()
vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php:219
Illuminate\Http\Middleware\HandleCors->handle()
vendor/laravel/framework/src/Illuminate/Http/Middleware/HandleCors.php:61
Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():194}:195}()
vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php:219
Illuminate\Http\Middleware\TrustProxies->handle()
vendor/laravel/framework/src/Illuminate/Http/Middleware/TrustProxies.php:58
Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():194}:195}()
vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php:219
Illuminate\Foundation\Http\Middleware\InvokeDeferredCallbacks->handle()
vendor/laravel/framework/src/Illuminate/Foundation/Http/Middleware/InvokeDeferredCallbacks.php:22
Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():194}:195}()
vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php:219
Illuminate\Http\Middleware\ValidatePathEncoding->handle()
vendor/laravel/framework/src/Illuminate/Http/Middleware/ValidatePathEncoding.php:26
Illuminate\Pipeline\Pipeline->{closure:{closure:Illuminate\Pipeline\Pipeline::carry():194}:195}()
vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php:219
Illuminate\Pipeline\Pipeline->then()
vendor/laravel/framework/src/Illuminate/Pipeline/Pipeline.php:137
Illuminate\Foundation\Http\Kernel->sendRequestThroughRouter()
vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php:175
Illuminate\Foundation\Http\Kernel->handle()
vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php:144
Illuminate\Foundation\Application->handleRequest()
vendor/laravel/framework/src/Illuminate/Foundation/Application.php:1220
public/index.php
public/index.php:20

15
16// Bootstrap Laravel and handle the request...
17/** @var Application $app */
18$app = require_once __DIR__.'/../bootstrap/app.php';
19
20$app->handleRequest(Request::capture());
21
Queries
pgsql
select * from "sessions" where "id" = 'j9UVOC8m7ZSFeO4Akr00sdJqwDVyuPFpBvdobCl2' limit 1
30.28ms
pgsql
select * from "users" where "id" = 307 limit 1
2.98ms
pgsql
select * from "cache" where "key" in ('kkn-uin-saizu-cache-e17aabd50a606956dc22f49911a30154abea81a5')
1.5ms
pgsql
select * from "cache" where "key" in ('kkn-uin-saizu-cache-e17aabd50a606956dc22f49911a30154abea81a5:timer')
0.91ms
pgsql
select * from "cache" where "key" in ('kkn-uin-saizu-cache-e17aabd50a606956dc22f49911a30154abea81a5')
0.91ms
pgsql
select * from "cache" where "key" = 'kkn-uin-saizu-cache-e17aabd50a606956dc22f49911a30154abea81a5' limit 1 for update
0.81ms
pgsql
update "cache" set "value" = 'i:2;' where "key" = 'kkn-uin-saizu-cache-e17aabd50a606956dc22f49911a30154abea81a5'
0.92ms
pgsql
select "roles".*, "model_has_roles"."model_id" as "pivot_model_id", "model_has_roles"."role_id" as "pivot_role_id", "model_has_roles"."model_type" as "pivot_model_type" from "roles" inner join "model_has_roles" on "roles"."id" = "model_has_roles"."role_id" where "model_has_roles"."model_id" in (307) and "model_has_roles"."model_type" = 'App\Models\User'
4.65ms
pgsql
select "permissions".*, "role_has_permissions"."role_id" as "pivot_role_id", "role_has_permissions"."permission_id" as "pivot_permission_id" from "permissions" inner join "role_has_permissions" on "permissions"."id" = "role_has_permissions"."permission_id" where "role_has_permissions"."role_id" in (2)
2.79ms




Headers
x-forwarded-proto
https
x-forwarded-host
kkn.infiatin.cloud
x-forwarded-for
112.78.156.229
upgrade-insecure-requests
1
sec-fetch-user
?1
sec-fetch-site
same-origin
sec-fetch-mode
navigate
sec-fetch-dest
document
sec-ch-ua-platform
"Windows"
sec-ch-ua-mobile
?0
sec-ch-ua
"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"
priority
u=0, i
pragma
no-cache
cookie
XSRF-TOKEN=eyJpdiI6ImcycWsrZkN5MkN2RkU2RHFYVkl5dkE9PSIsInZhbHVlIjoiNmlaWG9jc0gwMGR6b0tjOVoxMFRkeHJpZGFuS1RhR3hFTFA5UWpzbVl6MkU1cElpK0ZCcmhPNDlhbkpRTG9hRWlwUllqQk9DUkNBcGx6eDhPZ3g3c3JoaTViSWRYaml1R29zdWl6b1FOZ3MzUDJvblQ4VkRGSjZLZ2c4N0ppMU0iLCJtYWMiOiJkMzcxYjBlYjhmM2NhYWE1YmJmOWMyYWNlNWJlNjRiNmVlZGM4YzhmZWRlMTRlYjdlZmU5ZjY1MzlkY2YzZjBlIiwidGFnIjoiIn0%3D; kkn_session_v3=eyJpdiI6InZSUkRsWldCSFE4cTk4T2FTWGNTMUE9PSIsInZhbHVlIjoiejd1VkNFZnUrOVh1dzBaVndEU25RdXo4K3p6bFdma0lhZ2l4V1kvNU51VkJnYXZhNjdHeHI2THF5RnlhbWxTd0JWeVh5VWtTdEZhWXJJbjFuVnl3SVRPa0hrcnhydG9kV2tydVV3Tjd0eUg4VTc4OW1NdUtRRnFsdE9GU3ZJU0IiLCJtYWMiOiI3OWE4ZWQzYjBkZjc0ZTg3ZTdiYTUwMjQ3YjE2OWUxZjhmYTkwYzFlYzA1YjkzM2FlNjU0NGE4ZTBmZDEwOWNjIiwidGFnIjoiIn0%3D
connection
keep-alive
cf-warp-tag-id
ee14046b-a895-4b82-ab02-facc2526bb4a
cf-visitor
{"scheme":"https"}
cf-ray
9cd059586e9b44b4-SIN
cf-ipcountry
ID
cf-connecting-ip
112.78.156.229
cdn-loop
cloudflare; loops=1
cache-control
no-cache
accept-language
id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7
accept-encoding
gzip, br
accept
text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
user-agent
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36
host
kkn.infiatin.cloud
Body
// No request body
Routing
controller
App\Http\Controllers\Admin\GeneratorNilaiController@index
route name
admin.grade-generator.index
middleware
web, auth, kkn.throttle, role:admin|superadmin
Routing parameters
// No routing parameters
