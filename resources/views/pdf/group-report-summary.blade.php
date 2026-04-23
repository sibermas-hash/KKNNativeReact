{{-- resources/views/pdf/group-report-summary.blade.php --}}
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Ringkasan Laporan Kelompok {{ $group->nama_kelompok ?? $group->code }}</title>
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 11px; color: #1e293b; }
        .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { color: #1e40af; margin: 0; font-size: 18px; }
        .header h2 { color: #64748b; margin: 5px 0; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-size: 10px; }
        th { background: #1e40af; color: white; font-weight: bold; }
        tr:nth-child(even) { background: #f8fafc; }
        .info { margin-bottom: 15px; }
        .info p { margin: 3px 0; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>UIN PROF. K.H. SAIFUDDIN ZUHRI PURWOKERTO</h1>
        <h2>Ringkasan Laporan Harian Kelompok {{ $group->nama_kelompok ?? $group->code }}</h2>
    </div>

    <div class="info">
        @php
            $lokasi = $group->lokasi;
            $lokasiLabel = trim(implode(', ', array_filter([
                $lokasi?->village_name,
                $lokasi?->district_name,
                $lokasi?->regency_name,
            ])));
            $dplName = $group->dpl?->user?->name ?? $group->ketua_dpl?->user?->name ?? '-';
        @endphp
        <p><strong>Lokasi:</strong> {{ $lokasiLabel !== '' ? $lokasiLabel : '-' }}</p>
        <p><strong>DPL:</strong> {{ $dplName }}</p>
        <p><strong>Jumlah Anggota:</strong> {{ $group->peserta->count() }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Nama Mahasiswa</th>
                <th>Kegiatan</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($reports as $report)
            <tr>
                <td>{{ $loop->iteration }}</td>
                <td>{{ $report->date ? \Carbon\Carbon::parse($report->date)->format('d/m/Y') : '-' }}</td>
                <td>{{ $report->mahasiswa?->user?->name ?? '-' }}</td>
                <td>{{ \Illuminate\Support\Str::limit($report->activity ?? '-', 80) }}</td>
                <td>{{ strtoupper($report->status) }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="5" style="text-align: center; color: #64748b;">Belum ada laporan.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Dokumen ini digenerate otomatis oleh SIBERMAS pada {{ $generatedAt }}.
    </div>
</body>
</html>
