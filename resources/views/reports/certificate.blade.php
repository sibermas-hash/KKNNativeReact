<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <style>
        @page { size: a4 landscape; margin: 0; }
        body {
            font-family: 'Times New Roman', serif;
            background-color: #fff;
            margin: 0;
            padding: 0;
            color: #1a202c;
        }
        .cert-outer {
            width: 100%;
            height: 100%;
            padding: 30px;
            box-sizing: border-box;
            background: #fff;
            position: relative;
        }
        .cert-border-main {
            border: 15px solid #103b29; /* UIN Dark Green */
            height: 100%;
            padding: 10px;
            box-sizing: border-box;
            position: relative;
        }
        .cert-border-inner {
            border: 3px solid #d4af37; /* Gold */
            height: 100%;
            padding: 40px;
            box-sizing: border-box;
            background-image: url('https://www.transparenttextures.com/patterns/cubes.png'); /* Subtle pattern */
            position: relative;
        }
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 150px;
            color: rgba(16, 59, 41, 0.03);
            font-weight: bold;
            z-index: 0;
            white-space: nowrap;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            position: relative;
            z-index: 10;
        }
        .header h1 {
            font-size: 38px;
            color: #103b29;
            margin: 0;
            letter-spacing: 3px;
            font-weight: 900;
        }
        .header h2 {
            font-size: 20px;
            color: #1a202c;
            margin: 5px 0;
            font-weight: bold;
        }
        .header .sub-header {
            font-size: 14px;
            color: #4a5568;
            border-top: 2px solid #103b29;
            display: inline-block;
            padding-top: 5px;
            margin-top: 5px;
        }
        .main-content {
            text-align: center;
            margin-top: 30px;
            position: relative;
            z-index: 10;
        }
        .presented-text {
            font-size: 18px;
            font-style: italic;
            color: #4a5568;
        }
        .student-name {
            font-size: 42px;
            font-weight: bold;
            color: #103b29;
            margin: 15px 0;
            text-transform: uppercase;
        }
        .student-info {
            font-size: 18px;
            color: #2d3748;
            margin-bottom: 20px;
        }
        .certify-text {
            font-size: 16px;
            line-height: 1.6;
            color: #1a202c;
            max-width: 800px;
            margin: 0 auto;
        }
        .grade-ribbon {
            margin: 25px auto;
            position: relative;
            display: inline-block;
            background: #d4af37;
            color: #fff;
            padding: 10px 40px;
            font-weight: bold;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .grade-ribbon:before, .grade-ribbon:after {
            content: '';
            position: absolute;
            border-top: 20px solid transparent;
            border-bottom: 20px solid transparent;
            bottom: -10px;
            z-index: -1;
        }
        .grade-ribbon:before {
            border-right: 30px solid #b8860b;
            left: -20px;
        }
        .grade-ribbon:after {
            border-left: 30px solid #b8860b;
            right: -20px;
        }
        .signatures {
            margin-top: 40px;
            width: 100%;
            position: relative;
            z-index: 10;
        }
        .sig-table { width: 100%; border-collapse: collapse; }
        .sig-cell { width: 40%; text-align: center; font-size: 14px; }
        .sig-qr { width: 20%; text-align: center; }
        .sig-name { font-weight: bold; text-decoration: underline; font-size: 16px; margin-top: 60px; }
        .footer-info {
            position: absolute;
            bottom: 20px;
            left: 40px;
            font-size: 9px;
            color: #718096;
            font-family: sans-serif;
        }
        .qr-img {
            width: 80px;
            height: 80px;
            border: 1px solid #e2e8f0;
            padding: 2px;
            background: #fff;
        }
    </style>
</head>
<body>
    <div class="cert-outer">
        <div class="cert-border-main">
            <div class="cert-border-inner">
                <div class="watermark">UIN SAIZU</div>
                
                <div class="header">
                    <h1>SERTIFIKAT KULIAH KERJA NYATA</h1>
                    <h2>LEMBAGA PENELITIAN DAN PENGABDIAN KEPADA MASYARAKAT</h2>
                    <div class="sub-header">UNIVERSITAS ISLAM NEGERI PROF. K.H. SAIFUDDIN ZUHRI PURWOKERTO</div>
                </div>

                <div class="main-content">
                    <p class="presented-text">Diberikan kepada:</p>
                    <p class="student-name">{{ $name }}</p>
                    <p class="student-info">Nomor Induk Mahasiswa: <strong>{{ $nim }}</strong></p>

                    <div class="certify-text">
                        Telah mengikuti dan dinyatakan <strong>LULUS</strong> kegiatan Kuliah Kerja Nyata (KKN)<br>
                        Angkatan <strong>{{ $period }}</strong> yang berlokasi di <strong>Desa {{ $location }}</strong><br>
                        dengan predikat:
                    </div>

                    <div class="grade-ribbon">
                        PREDIKAT: {{ $grade }} (NILAI: {{ $score }})
                    </div>
                </div>

                <div class="signatures">
                    <table class="sig-table">
                        <tr>
                            <td class="sig-cell">
                                Mengetahui,<br>Ketua LPPM
                                <div class="sig-name">Prof. Dr. H. Fauzi, M.Ag.</div>
                                NIP. 197103131998031004
                            </td>
                            <td class="sig-qr">
                                <img src="{{ $qr_url }}" class="qr-img" alt="QR Code Verification">
                                <div style="font-size: 8px; margin-top: 5px; color: #718096;">Scan to Verify</div>
                            </td>
                            <td class="sig-cell">
                                Purwokerto, {{ $date }}<br>Kepala Pusat Pengabdian
                                <div class="sig-name">Dr. M. Syaikhul Mujab, S.Ag.</div>
                                NIP. 197412152003121002
                            </td>
                        </tr>
                    </table>
                </div>

                <div class="footer-info">
                    ID Sertifikat: {{ $certificate_no }}<br>
                    Dokumen ini sah dan diterbitkan secara elektronik melalui SIM-KKN UIN Saizu Purwokerto.
                </div>
            </div>
        </div>
    </div>
</body>
</html>
