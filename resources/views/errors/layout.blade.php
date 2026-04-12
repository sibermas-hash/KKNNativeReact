<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title') - System Alert | KKN UIN SAIZU</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .glow { box-shadow: 0 0 40px -10px rgba(16, 185, 129, 0.4); }
    </style>
</head>
<body class="bg-[#0f172a] antialiased text-slate-100 selection:bg-emerald-500 selection:text-white">
    <div class="flex min-h-screen items-center justify-center p-8 relative overflow-hidden">
        <!-- Background Ornaments -->
        <div class="absolute top-0 right-0 h-full w-1/3 bg-emerald-500 opacity-[0.03] -skew-x-12 translate-x-1/2"></div>
        <div class="absolute bottom-[-10%] left-[-10%] h-[500px] w-[500px] bg-emerald-500/10 rounded-full blur-[120px]"></div>

        <div class="w-full max-w-xl relative z-10">
            <!-- Icon Console -->
            <div class="mb-14 flex flex-col items-center">
                <div class="relative">
                    <div class="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 animate-pulse"></div>
                    <div class="relative h-28 w-28 flex items-center justify-center rounded-[2.5rem] bg-emerald-600 border-4 border-emerald-400/30 text-white glow">
                        @yield('icon')
                    </div>
                </div>
                <div class="mt-8 flex flex-col items-center">
                    <span class="mono text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500">System Interruption</span>
                </div>
            </div>

            <!-- Content Dossier -->
            <div class="rounded-[3rem] bg-slate-900 border border-white/5 p-12 shadow-2xl backdrop-blur-3xl mb-12 relative group">
                <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-[3rem] pointer-events-none"></div>
                
                <div class="space-y-6 relative">
                    <h1 class="text-4xl font-black text-white tracking-tighter uppercase leading-none">@yield('heading')</h1>
                    <div class="h-1 w-20 bg-emerald-500 rounded-full"></div>
                    <p class="text-[13px] font-bold text-slate-400 leading-relaxed uppercase tracking-wide opacity-80">@yield('message')</p>
                    
                    <div class="pt-8 border-t border-white/5 grid grid-cols-2 gap-6">
                        <div>
                            <span class="mono text-[9px] font-black text-emerald-500/50 uppercase tracking-widest block mb-1">Status Code</span>
                            <span class="mono text-emerald-400 font-black text-sm uppercase">@yield('code', 'ERR_001')</span>
                        </div>
                        <div>
                            <span class="mono text-[9px] font-black text-emerald-500/50 uppercase tracking-widest block mb-1">Timestamp</span>
                            <span class="mono text-slate-500 font-bold text-[10px] uppercase">{{ now()->format('H:i:s T') }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row items-center justify-center gap-6">
                <a href="javascript:history.back()" class="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-xs font-black text-white uppercase tracking-[0.2em] hover:bg-white/10 transition-all hover:-translate-y-1 active:scale-95 text-center">
                    &larr; Back Protocol
                </a>
                <a href="/" class="w-full sm:w-auto px-10 py-5 rounded-2xl bg-emerald-600 text-slate-950 text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:bg-emerald-500 transition-all hover:-translate-y-1 active:scale-95 text-center">
                    Beranda Utama
                </a>
            </div>

            <!-- Footer Badge -->
            <div class="mt-20 flex flex-col items-center gap-4">
                <div class="flex items-center gap-3 grayscale opacity-30">
                    <div class="h-px w-8 bg-slate-500"></div>
                    <span class="mono text-[10px] font-black tracking-[0.4em] uppercase text-slate-400">UIN SAIZU PORTAL</span>
                    <div class="h-px w-8 bg-slate-500"></div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
