<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <meta name="theme-color" content="#0f172a" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/logo192.png" />

    <title inertia>{{ config('app.name', 'KKN UIN SAIZU') }}</title>
    @viteReactRefresh
    @vite('resources/js/app.tsx')
    @routes
    @inertiaHead
</head>
<body class="antialiased">
    @inertia
</body>
</html>
