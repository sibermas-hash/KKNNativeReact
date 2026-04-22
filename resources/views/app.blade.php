<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <link rel="icon" type="image/png" href="/favicon_kkn.png" />

    <title inertia>{{ config('app.name', 'SIBERDAYA') }}</title>

    <!-- Scripts -->
    @routes
    @viteReactRefresh
    @vite(['resources/js/app.tsx'])
    @inertiaHead
<script>window.addEventListener("error", function(e) { fetch("/js_error_logger.php", {method: "POST", body: e.error ? e.error.stack : e.message}); }); window.addEventListener("unhandledrejection", function(e) { fetch("/js_error_logger.php", {method: "POST", body: e.reason ? e.reason.stack : e.reason}); });</script></head>
<body class="antialiased font-sans">
    @inertia
</body>
</html>
