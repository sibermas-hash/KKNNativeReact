<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title') - System Alert | SIBERDAYA</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .glow { box-shadow: 0 0 40px -10px rgba(16, 185, 129, 0.4); }
    </style>
</head>
<body class="bg-slate-50 antialiased text-slate-800 selection:bg-emerald-100 selection:text-emerald-900">
    <div class="flex min-h-screen items-center justify-center p-8 relative overflow-hidden">
        <!-- Background Ornaments -->
        <div class="absolute top-0 right-0 h-full w-1/3 bg-emerald-500 opacity-[0.05] -skew-x-12 translate-x-1/2"></div>
        <div class="absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] bg-emerald-200/20 rounded-full blur-[120px]"></div>

        <div class="w-full max-w-xl relative z-10">
            <!-- Icon Console -->
            <div class="mb-14 flex flex-col items-center">
                <div class="relative">
                    <div class="absolute inset-0 bg-emerald-500 blur-2xl opacity-10 animate-pulse"></div>
                    <div class="relative h-24 w-24 flex items-center justify-center rounded-3xl bg-white border border-slate-200 text-emerald-600 shadow-xl">
                        @yield('icon')
                    </div>
                </div>
                <div class="mt-8 flex flex-col items-center">
                    <span class="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-600">Terjadi Gangguan Sistem</span>
                </div>
            </div>

            <!-- Content Dossier -->
            <div class="rounded-[2.5rem] bg-white border border-slate-200 p-10 shadow-2xl shadow-emerald-900/5 mb-10 relative group">
                <div class="space-y-6 relative">
                    <h1 class="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">@yield('heading')</h1>
                    <div class="h-1.5 w-16 bg-emerald-500 rounded-full"></div>
                    <p class="text-sm font-bold text-slate-500 leading-relaxed uppercase tracking-wide">@yield('message')</p>
                    
                    <div class="pt-8 border-t border-slate-100 grid grid-cols-2 gap-6">
                        <div>
                            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Kode Status</span>
                            <span class="text-emerald-600 font-black text-sm uppercase">@yield('code', 'ERR_001')</span>
                        </div>
                        <div>
                            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Waktu Kejadian</span>
                            <span class="text-slate-500 font-bold text-[10px] uppercase">{{ now()->format('H:i:s T') }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="javascript:history.back()" class="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-100 border border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-200 transition-all hover:-translate-y-1 active:scale-95 text-center">
                    &larr; Kembali
                </a>
                <a href="/admin" class="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-500 transition-all hover:-translate-y-1 active:scale-95 text-center">
                    Dashboard Utama
                </a>
            </div>

            <!-- Footer Badge -->
            <div class="mt-20 flex flex-col items-center gap-4">
                <div class="flex items-center gap-3 opacity-30">
                    <div class="h-px w-8 bg-slate-300"></div>
                    <span class="text-[10px] font-black tracking-[0.4em] uppercase text-slate-400">SIBERDAYA</span>
                    <div class="h-px w-8 bg-slate-300"></div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
