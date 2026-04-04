<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifikasi Sertifikat KKN - UIN Saizu</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        /* FIXED: Replaced CDN Tailwind with inline CSS for security & reliability */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background-color: #f8fafc;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }
        .container {
            max-width: 28rem;
            width: 100%;
            background: white;
            border-radius: 1rem;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }
        .header {
            background-color: #065f46;
            padding: 1.5rem;
            text-align: center;
        }
        .header-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 4rem;
            height: 4rem;
            background: rgba(255,255,255,0.1);
            border-radius: 9999px;
            margin-bottom: 1rem;
        }
        .header-icon svg {
            width: 2rem;
            height: 2rem;
            color: #d1fae5;
        }
        .header h1 {
            font-size: 1.25rem;
            font-weight: 700;
            color: white;
        }
        .header p {
            color: #a7f3d0;
            font-size: 0.875rem;
            margin-top: 0.25rem;
        }
        .content {
            padding: 2rem;
        }
        .badge {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.5rem;
        }
        .badge span {
            padding: 0.5rem 1rem;
            background-color: #ecfdf5;
            color: #047857;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 600;
            border: 1px solid #d1fae5;
        }
        .info-block {
            margin-bottom: 1rem;
        }
        .info-label {
            display: block;
            font-size: 0.75rem;
            font-weight: 500;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.25rem;
        }
        .info-value {
            color: #0f172a;
            font-family: monospace;
            font-weight: 700;
            background: #f8fafc;
            padding: 0.5rem;
            border-radius: 0.375rem;
            border: 1px solid #e2e8f0;
            text-align: center;
        }
        .divider {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #e2e8f0;
        }
        .quote {
            font-size: 0.875rem;
            color: #475569;
            text-align: center;
            font-style: italic;
        }
        .btn {
            display: block;
            width: 100%;
            text-align: center;
            background-color: #0f172a;
            color: white;
            font-weight: 600;
            padding: 0.75rem 1rem;
            border-radius: 0.75rem;
            text-decoration: none;
            transition: background-color 0.2s;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        }
        .btn:hover {
            background-color: #1e293b;
        }
        .footer {
            background-color: #f8fafc;
            padding: 1rem;
            text-align: center;
        }
        .footer p {
            font-size: 0.625rem;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
            </div>
            <h1>Verifikasi Sertifikat</h1>
            <p>SIM-KKN UIN Saizu Purwokerto</p>
        </div>

        <div class="content">
            <div class="badge">
                <span>Sertifikat Asli & Terverifikasi</span>
            </div>

            <div>
                <div class="info-block">
                    <label class="info-label">ID Sertifikat</label>
                    <div class="info-value">{{ $token }}</div>
                </div>

                <div class="divider">
                    <p class="quote">
                        "Dokumen ini secara resmi diterbitkan oleh Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM) UIN Saizu Purwokerto."
                    </p>
                </div>
            </div>

            <div style="margin-top: 2rem;">
                <a href="/" class="btn">Kembali ke Beranda</a>
            </div>
        </div>

        <div class="footer">
            <p>Copyright &copy; {{ date('Y') }} SIM-KKN UIN Saizu Purwokerto. Seluruh Hak Cipta Dilindungi.</p>
        </div>
    </div>
</body>
</html>
