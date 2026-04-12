<!DOCTYPE html>
<html>
<head>
    <title>Sertifikat KKN UIN SAIZU</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; margin: 0; padding: 0; color: #1a4731; }
        .border { border: 20px solid #10b981; padding: 50px; height: 90%; }
        .inner-border { border: 5px double #059669; padding: 40px; text-align: center; }
        .header { margin-bottom: 30px; }
        .logo { width: 100px; margin-bottom: 10px; }
        h1 { font-size: 48px; margin-bottom: 10px; color: #065f46; letter-spacing: 2px; }
        .subtitle { font-size: 20px; font-style: italic; margin-bottom: 40px; }
        .content { font-size: 24px; line-height: 1.6; }
        .name { font-size: 36px; font-weight: bold; text-decoration: underline; margin: 20px 0; display: block; }
        .nim { font-size: 20px; font-weight: normal; }
        .footer { margin-top: 60px; }
        .signature { margin-top: 50px; text-align: right; padding-right: 50px; }
        .legal { font-size: 12px; color: #6b7280; margin-top: 100px; text-align: center; }
    </style>
</head>
<body>
    <div class="border">
        <div class="inner-border">
            <div class="header">
                <h1>SERTIFIKAT KKN</h1>
                <div class="subtitle">Universitas Islam Negeri Prof. K.H. Saifuddin Zuhri Purwokerto</div>
            </div>

            <div class="content">
                Diberikan kepada:<br>
                <div class="name">{{ $mahasiswa->nama }}</div>
                <div class="nim">NIM: {{ $mahasiswa->nim }}</div>
                <br>
                Telah menyelesaikan pengabdian masyarakat<br>
                <strong>{{ $score->kelompok->periode->name ?? 'Kuliah Kerja Nyata' }}</strong><br>
                di desa {{ $score->kelompok->lokasi->village_name ?? 'Lokasi Terkait' }} dengan predikat:<br>
                <span style="font-size: 42px; font-weight: bold; color: #10b981;">"{{ $score->letter_grade }}"</span>
            </div>

            <div class="signature">
                Purwokerto, {{ now()->translatedFormat('d F Y') }}<br>
                Ketua LPPM<br><br><br><br>
                <strong>( ________________________ )</strong><br>
                NIP. .............................
            </div>

            <div class="legal">
                Sertifikat ini diterbitkan secara elektronik oleh Portal KKN UIN SAIZU.<br>
                ID Sertifikat: {{ strtoupper(substr(md5($score->id), 0, 8)) }}
            </div>
        </div>
    </div>
</body>
</html>
