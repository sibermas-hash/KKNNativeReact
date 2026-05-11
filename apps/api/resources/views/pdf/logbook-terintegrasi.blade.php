<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Logbook Harian KKN — {{ $mahasiswa->user->name ?? 'Mahasiswa' }}</title>
    <style>
        @page { margin: 18mm 15mm; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 10px; color: #1e293b; line-height: 1.45; }
        h1 { font-size: 20px; margin: 0 0 4px; color: #0f766e; text-transform: uppercase; }
        h2 { font-size: 13px; margin: 14px 0 6px; color: #064e3b; border-bottom: 2px solid #10b981; padding-bottom: 3px; }
        h3 { font-size: 11px; margin: 8px 0 4px; color: #374151; }
        table { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 8px; }
        th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; vertical-align: top; }
        th { background: #f0fdfa; color: #0f766e; font-weight: bold; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .muted { color: #94a3b8; }
        .cover { text-align: center; padding-top: 35mm; }
        .cover .logo-text { font-size: 28px; color: #0f766e; font-weight: bold; letter-spacing: 1px; margin-bottom: 8mm; }
        .cover .title { font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 15mm; }
        .cover .subtitle { font-size: 13px; color: #475569; margin: 4mm 0; }
        .cover .institution { font-size: 11px; color: #0f766e; margin-top: 25mm; font-weight: bold; line-height: 1.6; }
        .identity-block { margin-top: 20mm; border: 1px solid #94a3b8; padding: 6mm 8mm; width: 75%; margin-left: auto; margin-right: auto; text-align: left; background: #f8fafc; }
        .identity-block table { border: 0; }
        .identity-block td { border: 0; padding: 2px 6px; }
        .identity-block td:first-child { width: 35%; color: #475569; }
        .identity-block td:nth-child(2) { width: 3%; }
        .status-badge { display: inline-block; padding: 1px 6px; border-radius: 8px; font-size: 8px; font-weight: bold; }
        .badge-approved { background: #d1fae5; color: #047857; }
        .badge-revision { background: #fee2e2; color: #b91c1c; }
        .badge-submitted { background: #fef3c7; color: #b45309; }
        .badge-draft { background: #e2e8f0; color: #475569; }
        .sig-block { margin-top: 18mm; page-break-inside: avoid; }
        .sig-block table { border: 0; }
        .sig-block td { border: 0; text-align: center; vertical-align: top; padding: 0 6mm; }
        .sig-space { height: 22mm; border-bottom: 1px solid #64748b; margin-bottom: 2mm; margin-top: 4mm; }
        .footer-page { position: fixed; bottom: -10mm; left: 0; right: 0; text-align: center; font-size: 8px; color: #94a3b8; }
        .cell-date { width: 60px; white-space: nowrap; }
        .cell-status { width: 70px; }
    </style>
</head>
<body>

<div class="footer-page">
    Logbook Harian KKN — Sistem SIBERMAS, LPPM UIN Prof. K.H. Saifuddin Zuhri Purwokerto
</div>

{{-- ========= COVER ========= --}}
<div class="cover" style="page-break-after: always;">
    <div class="logo-text">UIN SAIZU</div>
    <div style="font-size: 11px; color: #475569;">UIN Prof. K.H. Saifuddin Zuhri Purwokerto</div>
    <div style="font-size: 10px; color: #6b7280;">Lembaga Penelitian dan Pengabdian kepada Masyarakat</div>

    <div class="title">LOGBOOK HARIAN<br>KULIAH KERJA NYATA</div>
    <div class="subtitle">{{ $periode->name ?? 'Periode KKN' }}</div>
    @if ($periode->tahunAkademik)
        <div style="font-size: 10px; color: #6b7280;">Tahun Akademik {{ $periode->tahunAkademik->year ?? '-' }}</div>
    @endif

    <div class="identity-block">
        <table>
            <tr><td><strong>Nama Mahasiswa</strong></td><td>:</td><td>{{ $mahasiswa->user?->name ?? '-' }}</td></tr>
            <tr><td><strong>NIM</strong></td><td>:</td><td>{{ $mahasiswa->nim ?? '-' }}</td></tr>
            <tr><td><strong>Fakultas</strong></td><td>:</td><td>{{ $mahasiswa->fakultas?->nama ?? '-' }}</td></tr>
            <tr><td><strong>Program Studi</strong></td><td>:</td><td>{{ $mahasiswa->prodi?->nama ?? '-' }}</td></tr>
            @if ($kelompok)
                <tr><td><strong>Kelompok</strong></td><td>:</td><td>{{ $kelompok->code }} — {{ $kelompok->nama_kelompok ?? '-' }}</td></tr>
            @endif
            @if ($kelompok?->lokasi)
                <tr><td><strong>Lokasi KKN</strong></td><td>:</td><td>{{ $kelompok->lokasi->village_name }}, {{ $kelompok->lokasi->district_name }}</td></tr>
            @endif
            @if ($dpl)
                <tr><td><strong>DPL</strong></td><td>:</td><td>{{ $dpl->name }}</td></tr>
            @endif
        </table>
    </div>

    <div class="institution">
        LEMBAGA PENELITIAN DAN PENGABDIAN<br>KEPADA MASYARAKAT<br>
        UIN Prof. K.H. Saifuddin Zuhri Purwokerto
    </div>
    <div style="margin-top: 6mm; font-size: 9px; color: #6b7280;">
        Digenerate: {{ $generated_at->format('d F Y, H:i') }} WIB
    </div>
</div>

{{-- ========= DAFTAR KEGIATAN ========= --}}
<h2>Rekap Kegiatan Harian</h2>

<div style="font-size: 9px; color: #475569; margin-bottom: 4mm;">
    Total: <strong>{{ $kegiatan->count() }}</strong> kegiatan
    @if ($approved_only)
        (hanya kegiatan yang telah <strong>disetujui DPL</strong>)
    @else
        (semua status termasuk draft/pending)
    @endif
</div>

<table>
    <thead>
        <tr>
            <th class="cell-date">Tanggal</th>
            <th>Judul &amp; Kegiatan</th>
            <th class="cell-status">Status</th>
            <th>Reviewer</th>
        </tr>
    </thead>
    <tbody>
        @forelse ($kegiatan as $k)
            <tr>
                <td class="cell-date">{{ $k->date->format('d M Y') }}</td>
                <td>
                    <strong>{{ $k->title }}</strong><br>
                    <div style="font-size: 9px; color: #475569; margin-top: 2px;">
                        {{ \Illuminate\Support\Str::limit($k->activity, 500) }}
                    </div>
                    @if ($k->location_name)
                        <div style="font-size: 8px; color: #94a3b8; margin-top: 2px;">
                            📍 {{ $k->location_name }}
                        </div>
                    @endif
                </td>
                <td class="cell-status text-center">
                    @php
                        $badgeClass = match ($k->canonicalStatus()) {
                            'approved' => 'badge-approved',
                            'revision' => 'badge-revision',
                            'submitted' => 'badge-submitted',
                            default => 'badge-draft',
                        };
                    @endphp
                    <span class="status-badge {{ $badgeClass }}">{{ $k->status_label }}</span>
                </td>
                <td>
                    {{ $k->reviewer?->name ?? '-' }}
                    @if ($k->reviewed_at)
                        <div style="font-size: 8px; color: #94a3b8;">{{ $k->reviewed_at->format('d M Y') }}</div>
                    @endif
                </td>
            </tr>
        @empty
            <tr>
                <td colspan="4" class="text-center muted" style="padding: 8mm 0;">
                    Belum ada kegiatan yang {{ $approved_only ? 'disetujui' : 'tercatat' }}.
                </td>
            </tr>
        @endforelse
    </tbody>
</table>

{{-- ========= TANDA TANGAN ========= --}}
<div class="sig-block">
    <p style="font-size: 10px; color: #374151; margin-bottom: 3mm;">
        Demikian logbook ini dibuat dengan sebenar-benarnya dan menyatakan bahwa kegiatan-kegiatan di atas
        telah dilaksanakan dan diverifikasi oleh Dosen Pembimbing Lapangan (DPL).
    </p>
    <table>
        <tr>
            <td width="45%">
                Purwokerto, {{ $generated_at->format('d F Y') }}<br>
                Dosen Pembimbing Lapangan,
                <div class="sig-space"></div>
                <strong>{{ $dpl?->name ?? '______________________' }}</strong>
                @if ($dpl)
                    <div style="font-size: 9px; color: #64748b;">NIP / NIDN: {{ $dpl->nip ?? '-' }}</div>
                @endif
            </td>
            <td width="10%"></td>
            <td width="45%">
                Mahasiswa Peserta KKN,
                <div class="sig-space"></div>
                <strong>{{ $mahasiswa->user?->name ?? '______________________' }}</strong>
                <div style="font-size: 9px; color: #64748b;">NIM: {{ $mahasiswa->nim ?? '-' }}</div>
            </td>
        </tr>
    </table>
</div>

<div style="margin-top: 12mm; font-size: 8px; color: #94a3b8; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 3mm;">
    Dokumen ini digenerate oleh SIBERMAS pada {{ $generated_at->format('d F Y H:i') }} WIB.
    Autentikasi dokumen dapat diverifikasi di <strong>https://sibermas.uinsaizu.ac.id</strong>.
</div>

</body>
</html>
