<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifikasi Sertifikat KKN - UIN Saizu</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background-color: #ffffff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            color: #111827;
        }
        .container {
            max-width: 32rem;
            width: 100%;
            background: #ffffff;
            border-radius: 1.5rem;
            box-shadow: 0 40px 100px -20px rgba(16, 185, 129, 0.08);
            border: 1px solid #f0fdf4;
            overflow: hidden;
        }
        .header {
            background-color: #059669;
            padding: 3rem 2rem;
            text-align: center;
            position: relative;
        }
        .header-bg-icon {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.05;
            color: #ffffff;
            pointer-events: none;
        }
        .header-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 4.5rem;
            height: 4.5rem;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 1.25rem;
            margin-bottom: 1.5rem;
            backdrop-filter: blur(8px);
        }
        .header-icon svg {
            width: 2.25rem;
            height: 2.25rem;
            color: #ffffff;
        }
        .header h1 {
            font-size: 1rem;
            font-weight: 900;
            color: white;
            text-transform: uppercase;
            letter-spacing: 0.2em;
        }
        .header p {
            color: #d1fae5;
            font-size: 0.75rem;
            font-weight: 600;
            margin-top: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            opacity: 0.8;
        }
        .content {
            padding: 3rem 2.5rem;
        }
        .status-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 2.5rem;
        }
        .status-badge span {
            padding: 0.625rem 1.25rem;
            background-color: #f0fdf4;
            color: #059669;
            border-radius: 9999px;
            font-size: 0.625rem;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            border: 1px solid #dcfce7;
        }
        .failed-badge span {
            background-color: #fef2f2;
            color: #dc2626;
            border-color: #fee2e2;
        }
        .info-grid {
            display: grid;
            gap: 1.5rem;
        }
        .info-item {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .info-label {
            font-size: 0.625rem;
            font-weight: 800;
            color: #059669;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            opacity: 0.6;
        }
        .info-value {
            font-size: 0.875rem;
            font-weight: 700;
            color: #111827;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid #f3f4f6;
        }
        .token-display {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            background: #f9fafb;
            padding: 1rem;
            border-radius: 1rem;
            font-size: 0.75rem;
            word-break: break-all;
            text-align: center;
            color: #047857;
            border: 1px dashed #d1fae5;
        }
        .btn {
            display: block;
            width: 100%;
            text-align: center;
            background-color: #059669;
            color: white;
            font-weight: 900;
            padding: 1rem;
            border-radius: 1rem;
            text-decoration: none;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            transition: all 0.2s;
            box-shadow: 0 10px 20px -5px rgba(5, 150, 105, 0.2);
            margin-top: 3rem;
        }
        .btn:hover {
            background-color: #047857;
            transform: translateY(-2px);
            box-shadow: 0 15px 30px -5px rgba(5, 150, 105, 0.3);
        }
        .footer {
            padding: 2rem;
            text-align: center;
            border-top: 1px solid #f9fafb;
        }
        .footer p {
            font-size: 0.625rem;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-bg-icon">
                <svg width="120" height="120" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
            </div>
            <div class="header-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
            </div>
            <h1>Verifikasi Dokumen</h1>
            <p>LPPM UIN Saizu Purwokerto</p>
        </div>

        <div class="content">
            @if($is_valid)
                <div class="status-badge">
                    <span>Otentik & Terverifikasi</span>
                </div>

                <div class="info-grid">
                    <div class="info-item">
                        <label class="info-label">Nama Mahasiswa</label>
                        <div class="info-value">{{ $certificate_data['name'] }}</div>
                    </div>
                    <div class="info-item">
                        <label class="info-label">Nomor Induk Mahasiswa</label>
                        <div class="info-value">{{ $certificate_data['nim'] }}</div>
                    </div>
                    <div class="info-item">
                        <label class="info-label">Periode KKN</label>
                        <div class="info-value">{{ $certificate_data['period'] }}</div>
                    </div>
                    <div class="info-item">
                        <label class="info-label">Lokasi Pengabdian</label>
                        <div class="info-value">{{ $certificate_data['location'] }}</div>
                    </div>
                    <div class="info-item">
                        <label class="info-label">Predikat Kelulusan</label>
                        <div class="info-value">Predikat: {{ $certificate_data['grade'] }}</div>
                    </div>
                    <div class="info-item">
                        <label class="info-label">Token Verifikasi</label>
                        <div class="token-display">{{ $token }}</div>
                    </div>
                </div>
            @else
                <div class="status-badge failed-badge">
                    <span>Dokumen Tidak Valid</span>
                </div>
                <div style="text-align: center; color: #6b7280; font-size: 0.875rem; line-height: 1.6;">
                    Maaf, informasi sertifikat dengan token ini tidak ditemukan dalam basis data resmi kami atau belum difinalisasi.
                </div>
                <div class="info-grid" style="margin-top: 2rem;">
                    <div class="info-item">
                        <label class="info-label">Token yang Dicari</label>
                        <div class="token-display">{{ $token }}</div>
                    </div>
                </div>
            @endif

            <a href="/" class="btn">Kembali ke Beranda</a>
        </div>

        <div class="footer">
            <p>&copy; {{ date('Y') }} SIBERDAYA &bull; DIGITAL TRUST SYSTEM</p>
        </div>
    </div>
</body>
</html>
