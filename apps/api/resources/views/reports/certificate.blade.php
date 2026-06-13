<!DOCTYPE html>
<html>

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <style>
        @page {
            size: a4 landscape;
            margin: 0;
        }

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
            border: 15px solid #103b29;
            /* UIN Dark Green */
            height: 100%;
            padding: 10px;
            box-sizing: border-box;
            position: relative;
        }

        .cert-border-inner {
            border: 3px solid #d4af37;
            /* Gold */
            height: 100%;
            padding: 40px;
            box-sizing: border-box;
            background-image: url('{{ $bg_image }}');
            background-size: cover;
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
            font-size: 32px;
            color: #103b29;
            margin: 0;
            letter-spacing: 2px;
            font-weight: 900;
            text-transform: uppercase;
        }

        .header h2 {
            font-size: 18px;
            color: #1a202c;
            margin: 5px 0;
            font-weight: bold;
        }

        .header .sub-header {
            font-size: 12px;
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
            font-size: 16px;
            font-style: italic;
            color: #4a5568;
            margin-bottom: 10px;
        }

        .student-name {
            font-size: 36px;
            font-weight: bold;
            color: #103b29;
            margin: 10px 0;
            text-transform: uppercase;
        }

        .student-info {
            font-size: 16px;
            color: #2d3748;
            margin-bottom: 20px;
        }

        .certify-text {
            font-size: 15px;
            line-height: 1.6;
            color: #1a202c;
            max-width: 850px;
            margin: 0 auto;
        }

        .grade-ribbon {
            margin: 20px auto;
            position: relative;
            display: inline-block;
            background: #d4af37;
            color: #fff;
            padding: 8px 30px;
            font-weight: bold;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .grade-ribbon:before,
        .grade-ribbon:after {
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

        .sig-table {
            width: 100%;
            border-collapse: collapse;
        }

        .sig-cell {
            width: 40%;
            text-align: center;
            font-size: 13px;
            vertical-align: top;
        }

        .sig-qr {
            width: 20%;
            text-align: center;
            vertical-align: top;
        }

        .sig-name {
            font-weight: bold;
            text-decoration: underline;
            font-size: 14px;
            margin-top: 50px;
        }

        .footer-info {
            position: absolute;
            bottom: 20px;
            left: 40px;
            font-size: 8px;
            color: #718096;
            font-family: sans-serif;
        }

        .qr-img {
            width: 70px;
            height: 70px;
            border: 1px solid #e2e8f0;
            padding: 2px;
            background: #fff;
        }

        .student-photo {
            position: absolute;
            object-fit: cover;
            border: 3px solid #d4af37;
            background: #fff;
            z-index: 20;
        }

        .signature-img {
            display: block;
            margin: 8px auto -42px;
            object-fit: contain;
        }

        .stamp-img {
            position: absolute;
            left: 50%;
            bottom: 48px;
            transform: translateX(-50%);
            object-fit: contain;
            opacity: .9;
            z-index: 15;
        }
    </style>
</head>

<body>
    <div class="cert-outer">
        <div class="cert-border-main">
            <div class="cert-border-inner">
                <div class="watermark">UIN SAIZU</div>
                @if(!empty($photo_image) && !empty($layout['photo']['visible']))
                    <img src="{{ $photo_image }}" class="student-photo" alt="Foto Peserta" style="left: {{ (float)($layout['photo']['x'] ?? 77) }}%; top: {{ (float)($layout['photo']['y'] ?? 23) }}%; width: {{ (float)($layout['photo']['width'] ?? 11) }}%; height: {{ (float)($layout['photo']['height'] ?? 14) }}%;">
                @endif

                <div class="header">
                    <h1>{{ $title }}</h1>
                    <h2>LEMBAGA PENELITIAN DAN PENGABDIAN KEPADA MASYARAKAT</h2>
                    <div class="sub-header">UNIVERSITAS ISLAM NEGERI PROF. K.H. SAIFUDDIN ZUHRI PURWOKERTO</div>
                </div>

                <div class="main-content">
                    <p class="presented-text">Sertifikat ini diberikan kepada:</p>
                    <div class="student-name">{{ $name }}</div>
                    <div class="student-info">NIM. <strong>{{ $nim }}</strong></div>

                    <div class="certify-text">
                        {!! nl2br(e($body)) !!}
                    </div>

                    <div class="grade-ribbon">
                        PREDIKAT: {{ $grade }}
                    </div>
                </div>

                <div class="signatures">
                    <table class="sig-table">
                        <tr>
                            <td class="sig-cell">&nbsp;</td>
                            <td class="sig-qr">
                                <img src="{{ $qr_url }}" class="qr-img" alt="QR Code Verification">
                                <div style="font-size: 7px; margin-top: 5px; color: #718096;">VERIFIKASI DIGITAL</div>
                            </td>
                            <td class="sig-cell">
                                Purwokerto, {{ $date }}<br>{{ $signer2_title }}
                                @if(!empty($signer_right_signature) && !empty($layout['signer_right_signature']['visible']))
                                    <img src="{{ $signer_right_signature }}" class="signature-img" alt="TTD Kanan" style="width: {{ (float)($layout['signer_right_signature']['width'] ?? 16) }}%; height: {{ (float)($layout['signer_right_signature']['height'] ?? 8) }}%;">
                                @endif
                                <div class="sig-name">{{ $signer2_name }}</div>
                            </td>
                        </tr>
                    </table>
                </div>

                @if(!empty($stamp_image) && !empty($layout['stamp']['visible']))
                    <img src="{{ $stamp_image }}" class="stamp-img" alt="Stempel" style="width: {{ (float)($layout['stamp']['width'] ?? 11) }}%; height: {{ (float)($layout['stamp']['height'] ?? 11) }}%;">
                @endif

                <div class="footer-info">
                    ID Sertifikat: {{ $certificate_no }}<br>
                    Dokumen ini sah dan diterbitkan secara elektronik melalui SIBERMAS UIN Saizu Purwokerto.
                </div>
            </div>
        </div>
    </div>
</body>

</html>