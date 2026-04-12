<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <meta name="theme-color" content="#ffffff" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <link rel="icon" type="image/png" href="/favicon_kkn.png" />
    <link rel="shortcut icon" type="image/png" href="/favicon_kkn.png" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/favicon_kkn.png" />

    <!-- Google Fonts: Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">

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
