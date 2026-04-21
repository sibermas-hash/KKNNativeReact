<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { size: A4 landscape; margin: 0; }
        body { 
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 60px;
            background-color: #f8fafc;
        }
        .border {
            border: 15px solid #059669;
            padding: 40px;
            height: 100%;
            position: relative;
        }
        .inner-border {
            border: 2px solid #059669;
            padding: 20px;
            height: 100%;
        }
        .certificate {
            text-align: center;
        }
        .header {
            margin-bottom: 30px;
        }
        .univ-name {
            font-size: 24px;
            font-weight: bold;
            color: #059669;
            text-transform: uppercase;
        }
        .title {
            font-size: 48px;
            font-weight: bold;
            color: #064e3b;
            margin: 20px 0;
        }
        .number {
            font-size: 14px;
            color: #475569;
            margin-bottom: 40px;
        }
        .given-to {
            font-size: 18px;
            font-style: italic;
            margin-bottom: 10px;
        }
        .participant-name {
            font-size: 34px;
            font-weight: bold;
            color: #0f172a;
            border-bottom: 2px solid #0f172a;
            display: inline-block;
            padding: 0 40px 5px 40px;
            margin-bottom: 5px;
        }
        .nim {
            font-size: 16px;
            margin-bottom: 30px;
        }
        .as-participant {
            font-size: 18px;
            margin: 20px 0;
            line-height: 1.6;
        }
        .workshop-title {
            font-size: 22px;
            font-weight: bold;
            color: #059669;
        }
        .footer {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
        }
        .signatory {
            text-align: center;
            width: 200px;
        }
        .date {
            margin-bottom: 60px;
        }
        .sign-name {
            font-weight: bold;
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="border">
        <div class="inner-border">
            <div class="certificate">
                <div class="header">
                    <div class="univ-name">UIN Profesor Kiai Haji Saifuddin Zuhri Purwokerto</div>
                    <div class="units">Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM)</div>
                </div>

                <div class="title">{{ $cert_title }}</div>
                <div class="number">Nomor: {{ $certificate_number }}</div>

                <div class="given-to">Diberikan kepada:</div>
                <div class="participant-name">{{ $participant_name }}</div>
                <div class="nim">{{ str_contains($nim, '-') ? 'IDENTITAS' : (strlen($nim) > 10 ? 'NIP' : 'NIM') }}: {{ $nim }}</div>

                <div class="as-participant">
                    Dinyatakan telah mengikuti Workshop Pembekalan KKN dengan tema:<br>
                    <span class="workshop-title">"{{ $workshop_title }}"</span><br>
                    Metodologi: {{ $methodology }} | Lokasi: {{ $location }}
                </div>

                <div style="margin-top: 40px;">
                    Dikeluarkan pada: {{ $issue_date }}
                </div>

                <div class="footer">
                    <div style="text-align: right; padding-right: 50px;">
                        <p class="date">Ketua LPPM,</p>
                        <br><br>
                        <p class="sign-name">{{ $signer_name }}</p>
                        <p>NIP. {{ $signer_nip }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
