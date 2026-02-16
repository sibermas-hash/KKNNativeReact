<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifikasi Sertifikat KKN - UIN Saizu</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-slate-50 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div class="bg-emerald-800 p-6 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
                <svg class="w-8 h-8 text-emerald-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
            </div>
            <h1 class="text-xl font-bold text-white">Verifikasi Sertifikat</h1>
            <p class="text-emerald-100 text-sm mt-1">SIM-KKN UIN Saizu Purwokerto</p>
        </div>

        <div class="p-8">
            <div class="flex items-center justify-center mb-6">
                <div class="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold border border-emerald-100">
                    Sertifikat Asli & Terverifikasi
                </div>
            </div>

            <div class="space-y-4">
                <div>
                    <label class="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">ID Sertifikat</label>
                    <div class="text-slate-900 font-mono font-bold bg-slate-50 p-2 rounded border border-slate-200 text-center">
                        {{ $token }}
                    </div>
                </div>

                <div class="pt-4 border-t border-slate-100">
                    <p class="text-sm text-slate-600 text-center italic">
                        "Dokumen ini secara resmi diterbitkan oleh Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM) UIN Saizu Purwokerto."
                    </p>
                </div>
            </div>

            <div class="mt-8">
                <a href="/" class="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl">
                    Kembali ke Beranda
                </a>
            </div>
        </div>

        <div class="bg-slate-50 p-4 text-center">
            <p class="text-[10px] text-slate-400">Copyright &copy; {{ date('Y') }} SIM-KKN UIN Saizu Purwokerto. Seluruh Hak Cipta Dilindungi.</p>
        </div>
    </div>
</body>
</html>
