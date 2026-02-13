<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Database Nilai KKN</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 10pt; line-height: 1.2; color: #000; margin: 0; padding: 0; }
        .container { padding: 20px; }
        .header { margin-bottom: 25px; }
        .header h1 { margin: 0; font-size: 14pt; font-weight: bold; }
        .header h2 { margin: 2px 0; font-size: 12pt; font-weight: bold; }

        .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table th, .table td { border: 1px solid #000; padding: 4px 6px; font-size: 8pt; height: 18px; }
        .table th { text-align: center; font-weight: bold; background-color: #f2f2f2; }
        .table td.center { text-align: center; }
        .table td.name { text-align: left; }

        @page { margin: 1cm; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>DATABASE NILAI KKN</h1>
            <h2>Angkatan {{ $period_id ?? '57' }} Tahun {{ $tahun ?? '2026' }}</h2>
        </div>

        <table class="table">
            <thead>
                <tr>
                    <th width="30">NO</th>
                    <th width="70">KELOMPOK</th>
                    <th>NAMA MAHASISWA</th>
                    <th width="90">NIM</th>
                    <th width="60">DISIPLIN</th>
                    <th width="60">SIKAP</th>
                    <th width="60">TOTAL (B)</th>
                </tr>
            </thead>
            <tbody>
                @foreach($students as $idx => $student)
                <tr>
                    <td class="center">{{ $idx + 1 }}</td>
                    <td class="center">{{ $student['group_code'] }}</td>
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
            </tbody>
        </table>
    </div>
</body>
</html>
