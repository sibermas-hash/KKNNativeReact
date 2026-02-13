<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Blanko Penilaian KKN</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11pt; line-height: 1.4; color: #333; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 16pt; text-transform: uppercase; }
        .header h2 { margin: 5px 0; font-size: 14pt; text-transform: uppercase; }
        
        .meta { margin-bottom: 20px; width: 100%; border-collapse: collapse; }
        .meta td { padding: 2px 0; vertical-align: top; }
        .meta td.label { width: 120px; font-weight: bold; }
        .meta td.colon { width: 15px; }

        .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .table th, .table td { border: 1px solid #000; padding: 6px 8px; font-size: 10pt; }
        .table th { background-color: #f2f2f2; text-align: center; font-weight: bold; text-transform: uppercase; }
        .table td.center { text-align: center; }
        .table td.name { text-align: left; }

        .footer { width: 100%; margin-top: 30px; }
        .footer td { width: 50%; vertical-align: top; }
        .footer .signature { margin-top: 60px; }
        .note { font-size: 9pt; font-style: italic; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Blanko Penilaian Peserta KKN</h1>
        <h2>Angkatan {{ $angkatan ?? '57' }} Tahun {{ $tahun ?? '2026' }}</h2>
    </div>

    <table class="meta">
        <tr>
            <td class="label">KELOMPOK</td>
            <td class="colon">:</td>
            <td>{{ $group->code }}</td>
        </tr>
        <tr>
            <td class="label">DESA</td>
            <td class="colon">:</td>
            <td>{{ $group->lokasi?->village_name ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">KECAMATAN</td>
            <td class="colon">:</td>
            <td>{{ $group->lokasi?->address ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">KABUPATEN</td>
            <td class="colon">:</td>
            <td>{{ $group->nama_kelompok ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">DPL</td>
            <td class="colon">:</td>
            <td>{{ $group->dpl?->user?->name ?? '-' }}</td>
        </tr>
    </table>

    <table class="table">
        <thead>
            <tr>
                <th width="30">NO</th>
                <th>NAMA MAHASISWA</th>
                <th width="100">NIM</th>
                <th width="80">DISIPLIN</th>
                <th width="80">SIKAP</th>
                <th width="80">TOTAL</th>
            </tr>
        </thead>
        <tbody>
            @foreach($students as $idx => $student)
            <tr>
                <td class="center">{{ $idx + 1 }}</td>
                <td class="name">{{ $student['name'] }}</td>
                <td class="center">{{ $student['nim'] }}</td>
                <td class="center">{{ $student['discipline'] ?? '' }}</td>
                <td class="center">{{ $student['attitude'] ?? '' }}</td>
                <td class="center">
                    @if(isset($student['discipline']) && isset($student['attitude']))
                        {{ round(($student['discipline'] + $student['attitude']) / 2) }}
                    @endif
                </td>
            </tr>
            @endforeach
            
            @php $fill = max(0, 15 - count($students)); @endphp
            @for($i = 1; $i <= $fill; $i++)
            <tr>
                <td class="center">{{ count($students) + $i }}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            </tr>
            @endfor
        </tbody>
    </table>

    <table class="footer">
        <tr>
            <td>
                <div class="note">
                    *Keterangan:<br>
                    - Rentang Nilai 60-100
                </div>
            </td>
            <td style="text-align: right;">
                <div>.........................., .............................. 2026</div>
                <div style="margin-top: 5px;">Kepala Desa/Lurah,</div>
                <div class="signature">
                    .........................................................<br>
                    NIP.
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
