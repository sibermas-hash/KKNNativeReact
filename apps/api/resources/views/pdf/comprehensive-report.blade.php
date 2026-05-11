<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Komprehensif KKN — {{ $periode->name }}</title>
    <style>
        @page { margin: 20mm 15mm; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 10px; color: #1e293b; line-height: 1.4; }
        h1 { font-size: 22px; margin: 0 0 4px; color: #0f766e; }
        h2 { font-size: 14px; margin: 16px 0 6px; color: #064e3b; border-bottom: 2px solid #10b981; padding-bottom: 3px; }
        h3 { font-size: 11px; margin: 10px 0 4px; color: #374151; }
        table { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 8px; }
        th, td { border: 1px solid #e2e8f0; padding: 4px 6px; text-align: left; }
        th { background: #f0fdfa; font-weight: bold; color: #0f766e; }
        .cover { text-align: center; padding-top: 80mm; page-break-after: always; }
        .cover .logo { font-size: 32px; color: #0f766e; font-weight: bold; margin-bottom: 20mm; }
        .cover .title { font-size: 26px; font-weight: bold; color: #0f172a; }
        .cover .subtitle { font-size: 14px; color: #64748b; margin: 10mm 0; }
        .cover .institution { font-size: 12px; color: #0f766e; margin-top: 40mm; font-weight: bold; }
        .stats-grid { display: table; width: 100%; border-spacing: 4px; margin-bottom: 10px; }
        .stat-cell { display: table-cell; background: #f0fdfa; padding: 8px; border-radius: 4px; text-align: center; vertical-align: middle; }
        .stat-cell .value { font-size: 18px; font-weight: bold; color: #064e3b; }
        .stat-cell .label { font-size: 8px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; }
        .section { page-break-inside: avoid; margin-bottom: 14px; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .muted { color: #94a3b8; }
        .grade-A { color: #059669; font-weight: bold; }
        .grade-B { color: #0891b2; font-weight: bold; }
        .grade-C { color: #d97706; font-weight: bold; }
        .grade-D { color: #dc2626; font-weight: bold; }
        .grade-E { color: #991b1b; font-weight: bold; }
        .footer { position: fixed; bottom: -10mm; left: 0; right: 0; text-align: center; font-size: 8px; color: #94a3b8; }
    </style>
</head>
<body>

<div class="footer">
    Laporan Komprehensif KKN — LPPM UIN Prof. K.H. Saifuddin Zuhri Purwokerto
</div>

<!-- === COVER === -->
<div class="cover">
    <div class="logo">SIBERMAS</div>
    <div class="title">LAPORAN KOMPREHENSIF<br>KULIAH KERJA NYATA</div>
    <div class="subtitle">{{ $periode->name }}</div>
    @if ($periode->jenisKkn)
        <div style="font-size: 11px; color: #6b7280;">Jenis KKN: {{ $periode->jenisKkn->nama ?? '-' }}</div>
    @endif
    <div class="institution">
        LEMBAGA PENELITIAN DAN PENGABDIAN KEPADA MASYARAKAT<br>
        UIN Prof. K.H. Saifuddin Zuhri Purwokerto
    </div>
    <div style="margin-top: 8mm; font-size: 10px; color: #6b7280;">
        Digenerate: {{ $generated_at->format('d F Y, H:i') }} WIB
    </div>
</div>

<!-- === 1. EXECUTIVE SUMMARY === -->
<h2>1. Ringkasan Eksekutif</h2>

<div class="stats-grid">
    <div class="stat-cell">
        <div class="value">{{ number_format($summary['total_mahasiswa']) }}</div>
        <div class="label">Total Mahasiswa</div>
    </div>
    <div class="stat-cell">
        <div class="value">{{ number_format($summary['total_ditempatkan']) }}</div>
        <div class="label">Sudah Ditempatkan</div>
    </div>
    <div class="stat-cell">
        <div class="value">{{ number_format($summary['total_kelompok']) }}</div>
        <div class="label">Kelompok Aktif</div>
    </div>
    <div class="stat-cell">
        <div class="value">{{ number_format($summary['total_dpl']) }}</div>
        <div class="label">DPL</div>
    </div>
</div>

<div class="stats-grid">
    <div class="stat-cell">
        <div class="value">{{ $summary['average_grade'] }}</div>
        <div class="label">Rata-rata Nilai</div>
    </div>
    <div class="stat-cell">
        <div class="value">{{ $summary['graded_count'] }}</div>
        <div class="label">Sudah Dinilai</div>
    </div>
    <div class="stat-cell">
        <div class="value">{{ $summary['pass_rate'] }}%</div>
        <div class="label">Pass Rate (A/B/C)</div>
    </div>
</div>

<h3>Distribusi Grade</h3>
<table>
    <thead>
        <tr>
            <th>Grade</th>
            <th class="text-center">Jumlah Mahasiswa</th>
            <th class="text-center">Persentase</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($summary['grade_distribution'] as $grade => $count)
            @php $pct = $summary['graded_count'] > 0 ? round($count / $summary['graded_count'] * 100, 1) : 0; @endphp
            <tr>
                <td class="grade-{{ $grade }}"><strong>{{ $grade }}</strong></td>
                <td class="text-center">{{ $count }}</td>
                <td class="text-center">{{ $pct }}%</td>
            </tr>
        @endforeach
    </tbody>
</table>

<!-- === 2. REKAP PER FAKULTAS === -->
<div class="section">
    <h2>2. Rekap per Fakultas</h2>
    <table>
        <thead>
            <tr>
                <th>Fakultas</th>
                <th class="text-center">Jumlah Mahasiswa</th>
                <th class="text-center">Lulus</th>
                <th class="text-center">Pass Rate</th>
                <th class="text-center">Rata-rata Nilai</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($by_faculty as $row)
                <tr>
                    <td>{{ $row['faculty'] }}</td>
                    <td class="text-center">{{ $row['student_count'] }}</td>
                    <td class="text-center">{{ $row['pass_count'] }}</td>
                    <td class="text-center">{{ $row['pass_rate'] }}%</td>
                    <td class="text-center">{{ $row['avg_grade'] ?: '-' }}</td>
                </tr>
            @empty
                <tr><td colspan="5" class="text-center muted">Belum ada data</td></tr>
            @endforelse
        </tbody>
    </table>
</div>

<!-- === 3. REKAP PER KELOMPOK === -->
<div class="section">
    <h2>3. Rekap per Kelompok</h2>
    <table>
        <thead>
            <tr>
                <th>Kode</th>
                <th>Nama Kelompok</th>
                <th>Lokasi</th>
                <th>Desa</th>
                <th class="text-center">Anggota</th>
                <th class="text-center">Avg Nilai</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($by_group as $row)
                <tr>
                    <td><strong>{{ $row['code'] }}</strong></td>
                    <td>{{ $row['name'] }}</td>
                    <td>{{ $row['location'] }}</td>
                    <td>{{ $row['village'] }}</td>
                    <td class="text-center">{{ $row['member_count'] }}</td>
                    <td class="text-center">{{ $row['avg_grade'] ?? '-' }}</td>
                </tr>
            @empty
                <tr><td colspan="6" class="text-center muted">Belum ada kelompok</td></tr>
            @endforelse
        </tbody>
    </table>
</div>

<!-- === 4. TOP 10 MAHASISWA === -->
<div class="section">
    <h2>4. Top 10 Mahasiswa Terbaik</h2>
    <table>
        <thead>
            <tr>
                <th class="text-center">#</th>
                <th>Nama</th>
                <th>NIM</th>
                <th>Kelompok</th>
                <th class="text-center">Nilai</th>
                <th class="text-center">Grade</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($top_students as $idx => $s)
                <tr>
                    <td class="text-center"><strong>{{ $idx + 1 }}</strong></td>
                    <td>{{ $s['name'] }}</td>
                    <td>{{ $s['nim'] }}</td>
                    <td>{{ $s['group'] }}</td>
                    <td class="text-center">{{ number_format($s['total_score'], 2) }}</td>
                    <td class="text-center grade-{{ $s['letter_grade'] }}">{{ $s['letter_grade'] }}</td>
                </tr>
            @empty
                <tr><td colspan="6" class="text-center muted">Belum ada nilai final</td></tr>
            @endforelse
        </tbody>
    </table>
</div>

<!-- === 5. AT-RISK STUDENTS === -->
@if (count($at_risk) > 0)
<div class="section">
    <h2>5. Mahasiswa At-Risk (Nilai < 70)</h2>
    <p class="muted" style="margin-bottom: 6px;">Mahasiswa berikut memerlukan atensi khusus — nilai final di bawah standar kelulusan:</p>
    <table>
        <thead>
            <tr>
                <th>Nama</th>
                <th>NIM</th>
                <th>Kelompok</th>
                <th class="text-center">Nilai</th>
                <th class="text-center">Grade</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($at_risk as $s)
                <tr>
                    <td>{{ $s['name'] }}</td>
                    <td>{{ $s['nim'] }}</td>
                    <td>{{ $s['group'] }}</td>
                    <td class="text-center">{{ number_format($s['total_score'], 2) }}</td>
                    <td class="text-center grade-{{ $s['letter_grade'] }}">{{ $s['letter_grade'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</div>
@endif

<!-- === 6. STATISTIK LAPORAN === -->
<div class="section">
    <h2>6. Statistik Laporan Kegiatan</h2>
    <h3>Laporan Harian</h3>
    <div class="stats-grid">
        <div class="stat-cell">
            <div class="value">{{ number_format($daily_report_stats['total']) }}</div>
            <div class="label">Total</div>
        </div>
        <div class="stat-cell">
            <div class="value" style="color: #059669;">{{ number_format($daily_report_stats['approved']) }}</div>
            <div class="label">Approved</div>
        </div>
        <div class="stat-cell">
            <div class="value" style="color: #d97706;">{{ number_format($daily_report_stats['pending']) }}</div>
            <div class="label">Pending</div>
        </div>
        <div class="stat-cell">
            <div class="value" style="color: #dc2626;">{{ number_format($daily_report_stats['revision']) }}</div>
            <div class="label">Revisi</div>
        </div>
    </div>

    <h3>Program Kerja</h3>
    <div class="stats-grid">
        <div class="stat-cell">
            <div class="value">{{ number_format($work_program_stats['total']) }}</div>
            <div class="label">Total Proker</div>
        </div>
        <div class="stat-cell">
            <div class="value" style="color: #059669;">{{ number_format($work_program_stats['approved']) }}</div>
            <div class="label">Approved</div>
        </div>
        <div class="stat-cell">
            <div class="value" style="color: #d97706;">{{ number_format($work_program_stats['pending']) }}</div>
            <div class="label">Pending</div>
        </div>
    </div>
</div>

<div class="section">
    <h2>Catatan</h2>
    <p style="font-size: 9px; color: #64748b;">
        Laporan ini digenerate secara otomatis dari sistem SIBERMAS pada {{ $generated_at->format('d F Y H:i') }} WIB.
        Data yang ditampilkan merupakan snapshot saat pembuatan laporan. Untuk data real-time silakan akses
        dashboard SIBERMAS di <strong>https://sibermas.uinsaizu.ac.id</strong>.
    </p>
</div>

</body>
</html>
