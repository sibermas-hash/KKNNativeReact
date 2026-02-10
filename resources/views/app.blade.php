<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
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
