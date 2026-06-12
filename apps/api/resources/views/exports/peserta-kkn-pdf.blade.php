<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Daftar Peserta KKN</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: #333333;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header h2 {
            margin: 0;
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .header h3 {
            margin: 5px 0 0 0;
            font-size: 12px;
            font-weight: normal;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            border: 1px solid #000000;
            padding: 6px 8px;
            text-align: left;
            vertical-align: middle;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
            text-align: center;
        }
        .text-center {
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>Daftar Peserta KKN Angkatan {{ $angkatan ?? '58' }}</h2>
        <h3>Status: Aktif & Lulus Wawancara</h3>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 5%;" class="text-center">NO</th>
                <th style="width: 35%;">Nama Lengkap</th>
                <th style="width: 15%;" class="text-center">NIM</th>
                <th style="width: 25%;">Program Studi</th>
                <th style="width: 20%;">Jenis KKN</th>
            </tr>
        </thead>
        <tbody>
            @foreach($peserta as $index => $p)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>{{ $p->mahasiswa?->nama ?? '-' }}</td>
                    <td class="text-center">{{ $p->mahasiswa?->nim ?? '-' }}</td>
                    <td>{{ $p->mahasiswa?->prodi?->nama ?? $p->mahasiswa?->external_prodi_name ?? '-' }}</td>
                    <td>{{ $p->periode?->jenisKkn?->name ?? '-' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
