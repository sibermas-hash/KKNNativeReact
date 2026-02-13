Internal Server Error

Error
app/Http/Controllers/Admin/TahunAkademikController.php:16
Class "App\Http\Controllers\Admin\AcademicYear" not found

LARAVEL
12.51.0
PHP
8.4.17
UNHANDLED
CODE 0
500
GET
https://kkn.infiatin.cloud/admin/academic-years

Exception trace
App\Http\Controllers\Admin\TahunAkademikController->index()
app/Http/Controllers/Admin/TahunAkademikController.php:16

11
12class TahunAkademikController extends Controller
13{
14    public function index(): Response
15    {
16        $academicYears = AcademicYear::orderByDesc('year')->get();
17
18        return Inertia::render('Admin/AcademicYears/Index', [
19            'academicYears' => $academicYears,
20        ]);
21    }
22
23    public function store(Request $request): RedirectResponse
24    {
25        $validated = $request->validate([
26            'year' => ['required', 'string', 'max:9', 'unique:academic_years,year'],
27            'is_active' => ['boolean'],
28
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
29ms
pgsql
select * from "users" where "id" = 307 limit 1
2.2ms
pgsql
select * from "cache" where "key" in ('kkn-uin-saizu-cache-919b81bf47996b165bca03754f49fa643c424f24')
0.89ms
pgsql
select * from "cache" where "key" in ('kkn-uin-saizu-cache-919b81bf47996b165bca03754f49fa643c424f24:timer')
0.61ms
pgsql
insert into "cache" ("key", "value", "expiration") values ('kkn-uin-saizu-cache-919b81bf47996b165bca03754f49fa643c424f24:timer', 'i:1770940960;', 1770940960) on conflict do nothing
26.34ms
pgsql
select * from "cache" where "key" in ('kkn-uin-saizu-cache-919b81bf47996b165bca03754f49fa643c424f24')
0.5ms
pgsql
insert into "cache" ("key", "value", "expiration") values ('kkn-uin-saizu-cache-919b81bf47996b165bca03754f49fa643c424f24', 'i:0;', 1770940960) on conflict do nothing
7.5ms
pgsql
select * from "cache" where "key" = 'kkn-uin-saizu-cache-919b81bf47996b165bca03754f49fa643c424f24' limit 1 for update
0.53ms
pgsql
update "cache" set "value" = 'i:1;' where "key" = 'kkn-uin-saizu-cache-919b81bf47996b165bca03754f49fa643c424f24'
0.48ms
pgsql
select "roles".*, "model_has_roles"."model_id" as "pivot_model_id", "model_has_roles"."role_id" as "pivot_role_id", "model_has_roles"."model_type" as "pivot_model_type" from "roles" inner join "model_has_roles" on "roles"."id" = "model_has_roles"."role_id" where "model_has_roles"."model_id" in (307) and "model_has_roles"."model_type" = 'App\Models\User'
2.83ms
pgsql
select "permissions".*, "role_has_permissions"."role_id" as "pivot_role_id", "role_has_permissions"."permission_id" as "pivot_permission_id" from "permissions" inner join "role_has_permissions" on "permissions"."id" = "role_has_permissions"."permission_id" where "role_has_permissions"."role_id" in (2)
1.55ms




Headers
x-xsrf-token
eyJpdiI6IkJJRk1JNUozSHpsalNBQUZtN3dYZGc9PSIsInZhbHVlIjoiaHRsaFFrNy9Yb0tOenNKRUJsSVRpckpRdkVMaEsxaURWR21sNXk5RGpvU1A3M1B0SEUwUXl4cHMvSDdCblBhOWNDYzgwTmpVQUNXMXgwbTltQVdiS2pkYTYza1VnWHNPODVmdXNEMEM0M0lncXVBUEVOUlZzMHJVY2Y1YlpoOHYiLCJtYWMiOiIxZGI5YTg5YjkyNTYxMjg3MjY3M2E1Nzk5YTQ2MmFjNTliNzBkMzBmOTIxZTE5NWRhZjg3NTYyM2IyYzkwNGRmIiwidGFnIjoiIn0=
x-requested-with
XMLHttpRequest
x-inertia-version
6b9a685a206da4b8c2ccb21d73bfe29a
x-inertia
true
x-forwarded-proto
https
x-forwarded-host
kkn.infiatin.cloud
x-forwarded-for
112.78.156.229
sec-fetch-site
same-origin
sec-fetch-mode
cors
sec-fetch-dest
empty
sec-ch-ua-platform
"Windows"
sec-ch-ua-mobile
?0
sec-ch-ua
"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"
referer
https://kkn.infiatin.cloud/admin/grade-generator
priority
u=1, i
cookie
XSRF-TOKEN=eyJpdiI6IkJJRk1JNUozSHpsalNBQUZtN3dYZGc9PSIsInZhbHVlIjoiaHRsaFFrNy9Yb0tOenNKRUJsSVRpckpRdkVMaEsxaURWR21sNXk5RGpvU1A3M1B0SEUwUXl4cHMvSDdCblBhOWNDYzgwTmpVQUNXMXgwbTltQVdiS2pkYTYza1VnWHNPODVmdXNEMEM0M0lncXVBUEVOUlZzMHJVY2Y1YlpoOHYiLCJtYWMiOiIxZGI5YTg5YjkyNTYxMjg3MjY3M2E1Nzk5YTQ2MmFjNTliNzBkMzBmOTIxZTE5NWRhZjg3NTYyM2IyYzkwNGRmIiwidGFnIjoiIn0%3D; kkn_session_v3=eyJpdiI6IjV0TXg1MldDUmkzQXlCM0UzeFN3YlE9PSIsInZhbHVlIjoiUWw0MFVkWkxPK0hBL3BqV3FsSEd4MUNvUlNpVXd1eDFXUnpjMmU5aVBwT0IyZEl1RDZlaGNuSStFSGVIbHlWUlB6d2JtZmxyalFxUm5QUGZQOXdFKzR3aHFOZkZRYkx6UWFuNEYyZTJsR3liSU0yS1dHR0luOUJoQ0xnaUFOcG0iLCJtYWMiOiI0NjRjMTRmYzgzNjAxNDU4MzQ3NzNiOGZlYjc3MzVmMmM0ZDUzOTU0NGE5NzVhODhmZTcxMDgzYTdkZjk0YmYyIiwidGFnIjoiIn0%3D
connection
keep-alive
cf-warp-tag-id
ee14046b-a895-4b82-ab02-facc2526bb4a
cf-visitor
{"scheme":"https"}
cf-ray
9cd00d720a15a439-SIN
cf-ipcountry
ID
cf-connecting-ip
112.78.156.229
cdn-loop
cloudflare; loops=1
accept-language
id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7
accept-encoding
gzip, br
accept
text/html, application/xhtml+xml
user-agent
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36
host
kkn.infiatin.cloud
Body
// No request body
Routing
controller
App\Http\Controllers\Admin\TahunAkademikController@index
route name
admin.academic-years.index
middleware
web, auth, kkn.throttle, role:admin|superadmin
Routing parameters
// No routing parameters


-----------
tolong fix
https://kkn.infiatin.cloud/admin/periods 
https://kkn.infiatin.cloud/admin/programs
https://kkn.infiatin.cloud/admin/groups
https://kkn.infiatin.cloud/admin/registrations

-------------
Not Found :

https://kkn.infiatin.cloud/admin/evaluations
https://kkn.infiatin.cloud/admin/workshops
https://kkn.infiatin.cloud/admin/proposals

----------

https://kkn.infiatin.cloud/admin/rekap-nilai

Internal Server Error

Illuminate\Database\QueryException
vendor/laravel/framework/src/Illuminate/Database/Connection.php:838
SQLSTATE[42703]: Undefined column: 7 ERROR: column fak.name does not exist LINE 1: ...d" as "user_id", "u"."name" as "nama", "s"."nim", "fak"."nam... ^ HINT: Perhaps you meant to reference the column "fak.nama". (Connection: pgsql, Host: 172.21.0.3, Port: 5432, Database: kknuinsaizu, SQL: select "s"."id" as "mahasiswa_id", "u"."id" as "user_id", "u"."name" as "nama", "s"."nim", "fak"."name" as "fakultas", "prodi"."name" as "prodi", "g"."code" as "kode_kelompok", "lok"."village_name" as "desa", "dpl_u"."name" as "nama_dpl", "ks"."final_report_score" as "nilai_laporan_akhir", "ks"."execution_score" as "nilai_pelaksanaan", "ks"."article_score" as "nilai_artikel", "ks"."attitude_score" as "nilai_sikap", "ks"."discipline_score" as "nilai_kedisiplinan", "ks"."workshop_score" as "nilai_workshop", "ks"."administration_score" as "nilai_administrasi", "ks"."total_score" as "nilai_akhir", "ks"."letter_grade" as "huruf", "ks"."is_finalized", "ks"."dpl_graded_at" as "dpl_submitted_at", "ks"."village_graded_at" as "mitra_submitted_at", "ks"."admin_graded_at" as "admin_submitted_at" from "mahasiswa" as "s" inner join "users" as "u" on "s"."user_id" = "u"."id" inner join "peserta_kkn" as "r" on "s"."id" = "r"."mahasiswa_id" inner join "kelompok_kkn" as "g" on "r"."kelompok_id" = "g"."id" inner join "lokasi" as "lok" on "g"."location_id" = "lok"."id" left join "dosen" as "dpl_l" on "g"."dpl_id" = "dpl_l"."id" left join "users" as "dpl_u" on "dpl_l"."user_id" = "dpl_u"."id" left join "fakultas" as "fak" on "s"."faculty_id" = "fak"."id" left join "prodi" as "prodi" on "s"."program_id" = "prodi"."id" left join "nilai_kkn" as "ks" on "ks"."mahasiswa_id" = "s"."id" and "ks"."kelompok_id" = "g"."id" where "g"."period_id" = 1 order by "g"."code" asc, "u"."name" asc)

LARAVEL
12.51.0
PHP
8.4.17
UNHANDLED
CODE 42703
500
GET
https://kkn.infiatin.cloud/admin/rekap-nilai

Exception trace
7 vendor frames

Illuminate\Database\Connection->runQueryCallback()
vendor/laravel/framework/src/Illuminate/Database/Connection.php:838
Illuminate\Database\Connection->run()
vendor/laravel/framework/src/Illuminate/Database/Connection.php:794
Illuminate\Database\Connection->select()
vendor/laravel/framework/src/Illuminate/Database/Connection.php:411
Illuminate\Database\Query\Builder->runSelect()
vendor/laravel/framework/src/Illuminate/Database/Query/Builder.php:3438
Illuminate\Database\Query\Builder->{closure:Illuminate\Database\Query\Builder::get():3422}()
vendor/laravel/framework/src/Illuminate/Database/Query/Builder.php:3423
Illuminate\Database\Query\Builder->onceWithColumns()
vendor/laravel/framework/src/Illuminate/Database/Query/Builder.php:4013
Illuminate\Database\Query\Builder->get()
vendor/laravel/framework/src/Illuminate/Database/Query/Builder.php:3422
App\Repositories\KknScoreRepository->getRekapNilai()
app/Repositories/KknScoreRepository.php:65

60                'ks.village_graded_at as mitra_submitted_at',
61                'ks.admin_graded_at as admin_submitted_at',
62            ])
63            ->orderBy('g.code')
64            ->orderBy('u.name')
65            ->get();
66    }
67}
68
App\Http\Controllers\Admin\RekapNilaiController->{closure:App\Http\Controllers\Admin\RekapNilaiController::index():47}()
app/Http/Controllers/Admin/RekapNilaiController.php:47

42                'groups' => [],
43            ]);
44        }
45
46        return Inertia::render('Admin/RekapNilai/Index', [
47            'rows' => Inertia::defer(fn () => $this->repo->getRekapNilai($periodeId, $filters)),
48            'stats' => Inertia::defer(function () use ($periodeId, $filters) {
49                $rows = $this->repo->getRekapNilai($periodeId, $filters);
50                return [
51                    'total' => $rows->count(),
52                    'finalized' => $rows->where('is_finalized', true)->count(),
53                    'missing_dpl' => $rows->whereNull('dpl_submitted_at')->count(),
54                    'missing_mitra' => $rows->whereNull('mitra_submitted_at')->count(),
55                    'distribusi' => $rows->groupBy('huruf')->map->count()->sortKeys(),
56                    'rata_rata' => round($rows->avg('nilai_akhir') ?? 0, 2),
57                ];
58            }),
59
24 vendor frames

Illuminate\Container\BoundMethod::{closure:Illuminate\Container\BoundMethod::call():35}()
vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php:36
Illuminate\Container\Util::unwrapIfClosure()
vendor/laravel/framework/src/Illuminate/Container/Util.php:43
Illuminate\Container\BoundMethod::callBoundMethod()
vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php:84
Illuminate\Container\BoundMethod::call()
vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php:35
Illuminate\Container\Container->call()
vendor/laravel/framework/src/Illuminate/Container/Container.php:799
Illuminate\Support\Facades\Facade::__callStatic()
vendor/laravel/framework/src/Illuminate/Support/Facades/Facade.php:363
Inertia\ResolvesCallables->resolveCallable()
vendor/inertiajs/inertia-laravel/src/ResolvesCallables.php:14
Inertia\DeferProp->__invoke()
vendor/inertiajs/inertia-laravel/src/DeferProp.php:56
Illuminate\Container\BoundMethod::{closure:Illuminate\Container\BoundMethod::call():35}()
vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php:36
Illuminate\Container\Util::unwrapIfClosure()
vendor/laravel/framework/src/Illuminate/Container/Util.php:43
Illuminate\Container\BoundMethod::callBoundMethod()
vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php:84
Illuminate\Container\BoundMethod::call()
vendor/laravel/framework/src/Illuminate/Container/BoundMethod.php:35
Illuminate\Container\Container->call()
vendor/laravel/framework/src/Illuminate/Container/Container.php:799
Illuminate\Support\Facades\Facade::__callStatic()
vendor/laravel/framework/src/Illuminate/Support/Facades/Facade.php:363
Inertia\ResolvesCallables->resolveCallable()
vendor/inertiajs/inertia-laravel/src/ResolvesCallables.php:14
Inertia\Response->resolvePropertyInstances()
vendor/inertiajs/inertia-laravel/src/Response.php:442
Inertia\Response->resolveProperties()
vendor/inertiajs/inertia-laravel/src/Response.php:233
Inertia\Response->toResponse()
vendor/inertiajs/inertia-laravel/src/Response.php:194
Illuminate\Routing\Router::toResponse()
vendor/laravel/framework/src/Illuminate/Routing/Router.php:921
Illuminate\Routing\Router->prepareResponse()
vendor/laravel/framework/src/Illuminate/Routing/Router.php:906
Illuminate\Routing\Router->{closure:Illuminate\Routing\Router::runRouteWithinStack():821}()
vendor/laravel/framework/src/Illuminate/Routing/Router.php:821
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
23.07ms
pgsql
select * from "users" where "id" = 307 limit 1
1.97ms
pgsql
select * from "cache" where "key" in ('kkn-uin-saizu-cache-f28a6e985643f048d57248cb3766009d6c526ee3')
0.83ms
pgsql
select * from "cache" where "key" in ('kkn-uin-saizu-cache-f28a6e985643f048d57248cb3766009d6c526ee3:timer')
0.43ms
pgsql
select * from "cache" where "key" in ('kkn-uin-saizu-cache-f28a6e985643f048d57248cb3766009d6c526ee3')
0.38ms
pgsql
select * from "cache" where "key" = 'kkn-uin-saizu-cache-f28a6e985643f048d57248cb3766009d6c526ee3' limit 1 for update
0.41ms
pgsql
update "cache" set "value" = 'i:2;' where "key" = 'kkn-uin-saizu-cache-f28a6e985643f048d57248cb3766009d6c526ee3'
0.44ms
pgsql
select "roles".*, "model_has_roles"."model_id" as "pivot_model_id", "model_has_roles"."role_id" as "pivot_role_id", "model_has_roles"."model_type" as "pivot_model_type" from "roles" inner join "model_has_roles" on "roles"."id" = "model_has_roles"."role_id" where "model_has_roles"."model_id" in (307) and "model_has_roles"."model_type" = 'App\Models\User'
4.05ms
pgsql
select "permissions".*, "role_has_permissions"."role_id" as "pivot_role_id", "role_has_permissions"."permission_id" as "pivot_permission_id" from "permissions" inner join "role_has_permissions" on "permissions"."id" = "role_has_permissions"."permission_id" where "role_has_permissions"."role_id" in (2)
2.36ms
pgsql
select * from "cache" where "key" in ('kkn-uin-saizu-cache-spatie.permission.cache')
0.88ms
pgsql
select * from "cache" where "key" in ('kkn-uin-saizu-cache-active_period')
0.86ms
kkn
select * from "periode"
27.53ms
kkn
select "id", "nama" as "name" from "fakultas"
1.47ms




Headers
x-xsrf-token
eyJpdiI6ImdyTkYzNXVUQzFxSzFvUGkrbzBhREE9PSIsInZhbHVlIjoiSitwZ3FURnZwaFI1ajhkck1DNlNEME1jSStDSHBEL0c4RDBVYXhzRDJPektSS29PeW55aTRWLzBzMTBKYWRZTWo3aWxkYnJFeExMNlRKNDY5c2lqZDgvYW9CUFpLblI3M0RIMFBMKzVnMVZ1MFVORXkzVytNWXJMS0VzdGRKODgiLCJtYWMiOiI0NjliNzZhMWNhNmE0Zjg0Yjk5MmQ2NTIyMjFkN2VlNTE2ZGRiYjYxNDc4MzNkZTBhY2MxYmIyNGY2NzgxYmZjIiwidGFnIjoiIn0=
x-requested-with
XMLHttpRequest
x-inertia-version
6b9a685a206da4b8c2ccb21d73bfe29a
x-inertia-partial-data
rows,stats,groups
x-inertia-partial-component
Admin/RekapNilai/Index
x-inertia
true
x-forwarded-proto
https
x-forwarded-host
kkn.infiatin.cloud
x-forwarded-for
112.78.156.229
sec-fetch-site
same-origin
sec-fetch-mode
cors
sec-fetch-dest
empty
sec-ch-ua-platform
"Windows"
sec-ch-ua-mobile
?0
sec-ch-ua
"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"
referer
https://kkn.infiatin.cloud/admin/rekap-nilai
priority
u=1, i
cookie
XSRF-TOKEN=eyJpdiI6ImdyTkYzNXVUQzFxSzFvUGkrbzBhREE9PSIsInZhbHVlIjoiSitwZ3FURnZwaFI1ajhkck1DNlNEME1jSStDSHBEL0c4RDBVYXhzRDJPektSS29PeW55aTRWLzBzMTBKYWRZTWo3aWxkYnJFeExMNlRKNDY5c2lqZDgvYW9CUFpLblI3M0RIMFBMKzVnMVZ1MFVORXkzVytNWXJMS0VzdGRKODgiLCJtYWMiOiI0NjliNzZhMWNhNmE0Zjg0Yjk5MmQ2NTIyMjFkN2VlNTE2ZGRiYjYxNDc4MzNkZTBhY2MxYmIyNGY2NzgxYmZjIiwidGFnIjoiIn0%3D; kkn_session_v3=eyJpdiI6IlFkcU11a2Y2anFGajVIYmhNcFVZRWc9PSIsInZhbHVlIjoic0w1U1NvSDhFUlZRWlJKbjZDaGlhUVlUeElqaDRPUEdrblBpdFhUQ1c5bDEyRVM1bmFLNUkwek1USDYzUm4rWTdvVE1rRjV4Zi9lbk5BOGhtT2xFVXl6aGI5TlVZZG5SbmRFSitMemlJM0x3bkdrOXA0YzdaUDhBd1lqUk5SWFIiLCJtYWMiOiJkNWYwN2JiYmQxYjRiNDE5OGE2MzZiMmExNzJkOWQzNmNkMTgxZTJhZTQ4NGE3ODQwYWUwZTM2MWJkZmQ2NzJjIiwidGFnIjoiIn0%3D
connection
keep-alive
cf-warp-tag-id
ee14046b-a895-4b82-ab02-facc2526bb4a
cf-visitor
{"scheme":"https"}
cf-ray
9cd012e3deb218f8-SIN
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
text/html, application/xhtml+xml
user-agent
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36
host
kkn.infiatin.cloud
Body
// No request body
Routing
controller
App\Http\Controllers\Admin\RekapNilaiController@index
route name
admin.rekap-nilai.index
middleware
web, auth, kkn.throttle, role:admin|superadmin
Routing parameters
// No routing parameters
