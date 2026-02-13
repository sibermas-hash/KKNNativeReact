Internal Server Error

ParseError
resources/views/admin/exports/blanko_nilai.blade.php:1
syntax error, unexpected end of file

LARAVEL
12.51.0
PHP
8.4.17
UNHANDLED
CODE 0
500
GET
https://kkn.infiatin.cloud/admin/grade-generator/export-pdf/1?period_id=1

Exception trace
resources/views/admin/exports/blanko_nilai.blade.php
resources/views/admin/exports/blanko_nilai.blade.php:1

1<!DOCTYPE html>
2<html>
3<head>
4    <meta charset="utf-8">
5    <title>Blanko Penilaian KKN</title>
6    <style>
7        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 10pt; line-height: 1.2; color: #000; margin: 0; padding: 0; }
8        .container { padding: 20px; }
9        .header { margin-bottom: 25px; text-align: center; }
10        .header h1 { margin: 0; font-size: 14pt; font-weight: bold; }
11        .header h2 { margin: 2px 0; font-size: 12pt; font-weight: bold; }
12        
13        .meta { margin-bottom: 20px; width: 100%; border-collapse: collapse; }
14        .meta td { padding: 1px 0; vertical-align: top; }
15        .meta td.label { width: 100px; }
16        .meta td.colon { width: 15px; text-align: center; }
17        .meta td.value { font-weight: normal; }
18
8 vendor frames

Illuminate\Filesystem\Filesystem->getRequire()
vendor/laravel/framework/src/Illuminate/Filesystem/Filesystem.php:124
Illuminate\View\Engines\PhpEngine->evaluatePath()
vendor/laravel/framework/src/Illuminate/View/Engines/PhpEngine.php:57
Illuminate\View\Engines\CompilerEngine->get()
vendor/laravel/framework/src/Illuminate/View/Engines/CompilerEngine.php:76
Illuminate\View\View->getContents()
vendor/laravel/framework/src/Illuminate/View/View.php:208
Illuminate\View\View->renderContents()
vendor/laravel/framework/src/Illuminate/View/View.php:191
Illuminate\View\View->render()
vendor/laravel/framework/src/Illuminate/View/View.php:160
Barryvdh\DomPDF\PDF->loadView()
vendor/barryvdh/laravel-dompdf/src/PDF.php:142
Barryvdh\DomPDF\Facade\Pdf::__callStatic()
vendor/barryvdh/laravel-dompdf/src/Facade/Pdf.php:66
App\Http\Controllers\Admin\GeneratorNilaiController->exportPdf()
app/Http/Controllers/Admin/GeneratorNilaiController.php:289

284            return $pdf->download("Database_Nilai_KKN_Angkatan_{$periodId}.pdf");
285        } else {
286            $kelompokKkn = KelompokKkn::with(['lokasi', 'dpl.user:id,name'])->findOrFail($id);
287            $students = $this->getStudentsForGroup($kelompokKkn);
288            
289            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.exports.blanko_nilai', [
290                'group'    => $kelompokKkn,
291                'students' => $students,
292                'angkatan' => '57',
293                'tahun'    => '2026'
294            ]);
295
296            return $pdf->download("Blanko_Penilaian_Kelompok_{$kelompokKkn->code}.pdf");
297        }
298    }
299
300    public function exportZip(Request $request)
301
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
29.87ms
pgsql
select * from "users" where "id" = 307 limit 1
3.04ms
pgsql
select * from "cache" where "key" in ('kkn-uin-saizu-cache-1695c7511180c6d12a985751887c978056023a0e')
1.79ms
pgsql
delete from "cache" where "key" in ('kkn-uin-saizu-cache-1695c7511180c6d12a985751887c978056023a0e', 'kkn-uin-saizu-cache-illuminate:cache:flexible:created:1695c7511180c6d12a985751887c978056023a0e') and "expiration" <= 1770946105
14.64ms
pgsql
select * from "cache" where "key" in ('kkn-uin-saizu-cache-1695c7511180c6d12a985751887c978056023a0e:timer')
1.03ms
pgsql
delete from "cache" where "key" in ('kkn-uin-saizu-cache-1695c7511180c6d12a985751887c978056023a0e:timer', 'kkn-uin-saizu-cache-illuminate:cache:flexible:created:1695c7511180c6d12a985751887c978056023a0e:timer') and "expiration" <= 1770946105
6.68ms
pgsql
insert into "cache" ("key", "value", "expiration") values ('kkn-uin-saizu-cache-1695c7511180c6d12a985751887c978056023a0e:timer', 'i:1770946165;', 1770946165) on conflict do nothing
8.18ms
pgsql
select * from "cache" where "key" in ('kkn-uin-saizu-cache-1695c7511180c6d12a985751887c978056023a0e')
0.99ms
pgsql
insert into "cache" ("key", "value", "expiration") values ('kkn-uin-saizu-cache-1695c7511180c6d12a985751887c978056023a0e', 'i:0;', 1770946165) on conflict do nothing
7.01ms
pgsql
select * from "cache" where "key" = 'kkn-uin-saizu-cache-1695c7511180c6d12a985751887c978056023a0e' limit 1 for update
1.07ms
pgsql
update "cache" set "value" = 'i:1;' where "key" = 'kkn-uin-saizu-cache-1695c7511180c6d12a985751887c978056023a0e'
0.94ms
pgsql
select "roles".*, "model_has_roles"."model_id" as "pivot_model_id", "model_has_roles"."role_id" as "pivot_role_id", "model_has_roles"."model_type" as "pivot_model_type" from "roles" inner join "model_has_roles" on "roles"."id" = "model_has_roles"."role_id" where "model_has_roles"."model_id" in (307) and "model_has_roles"."model_type" = 'App\Models\User'
4.57ms
pgsql
select "permissions".*, "role_has_permissions"."role_id" as "pivot_role_id", "role_has_permissions"."permission_id" as "pivot_permission_id" from "permissions" inner join "role_has_permissions" on "permissions"."id" = "role_has_permissions"."permission_id" where "role_has_permissions"."role_id" in (2)
2.8ms
kkn
select * from "kelompok_kkn" where "kelompok_kkn"."id" = '1' limit 1
28.88ms
kkn
select * from "lokasi" where "lokasi"."id" in (1)
1.83ms
kkn
select * from "dosen" where "dosen"."id" in (1)
1.67ms
kkn
select "id", "name" from "users" where "users"."id" in (26)
2ms
kkn
select * from "peserta_kkn" where "kelompok_id" = 1
2.07ms
kkn
select "id", "user_id", "nim", "nama" from "mahasiswa" where "mahasiswa"."id" in (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11)
2.41ms
kkn
select * from "nilai_kkn" where "mahasiswa_id" = 27 and "kelompok_id" = 1 limit 1
2.68ms
kkn
select * from "nilai_kkn" where "mahasiswa_id" = 28 and "kelompok_id" = 1 limit 1
1.08ms
kkn
select * from "nilai_kkn" where "mahasiswa_id" = 29 and "kelompok_id" = 1 limit 1
0.97ms
kkn
select * from "nilai_kkn" where "mahasiswa_id" = 30 and "kelompok_id" = 1 limit 1
1.03ms
kkn
select * from "nilai_kkn" where "mahasiswa_id" = 31 and "kelompok_id" = 1 limit 1
0.98ms
kkn
select * from "nilai_kkn" where "mahasiswa_id" = 32 and "kelompok_id" = 1 limit 1
0.96ms
kkn
select * from "nilai_kkn" where "mahasiswa_id" = 33 and "kelompok_id" = 1 limit 1
1.06ms
kkn
select * from "nilai_kkn" where "mahasiswa_id" = 34 and "kelompok_id" = 1 limit 1
1.23ms
kkn
select * from "nilai_kkn" where "mahasiswa_id" = 35 and "kelompok_id" = 1 limit 1
1.16ms
kkn
select * from "nilai_kkn" where "mahasiswa_id" = 36 and "kelompok_id" = 1 limit 1
1.05ms
kkn
select * from "nilai_kkn" where "mahasiswa_id" = 37 and "kelompok_id" = 1 limit 1
1.17ms




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
referer
https://kkn.infiatin.cloud/admin/grade-generator
priority
u=0, i
cookie
XSRF-TOKEN=eyJpdiI6IlVmdWcwTHAzRWV5RHBUZExtL0E0OVE9PSIsInZhbHVlIjoidHlCeVM5a1Jld3JnMHZubmt4aklDNXZtQTRYVFhVU2hHeS8rNVBtMWN6S2E0QzNLVzdSb1ZBR05JU0djMFlCMW5KdG9KcUNORDkvZkdFT2VFVmZhTGVzZWVMVGhmSmdFOFNpV0JDdEVWUGV4Q01OUzlSR3JOL2NncFI4OVAxRUQiLCJtYWMiOiI3MWFlYzUyMjQ2NmM0NDk4NjY3NjMyNTgzN2Y2MjM3NWIxOWYxNTQ0MTU0OTUzMjA4NGMwZTc3ZDE1MWI1YTdhIiwidGFnIjoiIn0%3D; kkn_session_v3=eyJpdiI6IjFlRytwbWdjTDJxRjNHbTNqUURabkE9PSIsInZhbHVlIjoiU212VU9VdHlqaXlRN3BZeDhpNmxGanhNam1md1l5bTZUSVdPZFpoaUhqQ3NGWlIwVVV0Z0xHL0srWWNPUjFJZ3llVC9LbnJUaUJnWXNLUXRmMml4c1JoeEx0VEl2UUd4SlcrTkx2TTNOVDhCQjZRUkFSN3JaRGloZGkyRFdtSVEiLCJtYWMiOiJmZDk0ZDM2YTBmYmE0ZTU5YzJjM2M3NmYxMDMyZGM2YzVjNjI0M2I3ZGIzMTY2YjdiZjRmMzY2ODIxOTFjYmI0IiwidGFnIjoiIn0%3D
connection
keep-alive
cf-warp-tag-id
ee14046b-a895-4b82-ab02-facc2526bb4a
cf-visitor
{"scheme":"https"}
cf-ray
9cd08c876d6a81a4-SIN
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
text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
user-agent
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36
host
kkn.infiatin.cloud
Body
{
    "period_id": "1"
}
Routing
controller
App\Http\Controllers\Admin\GeneratorNilaiController@exportPdf
route name
admin.grade-generator.export-pdf
middleware
web, auth, kkn.throttle, role:admin|superadmin
Routing parameters
{
    "id": "1"
}
