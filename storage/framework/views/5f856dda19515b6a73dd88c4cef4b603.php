
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Kompilasi Laporan Harian KKN</title>
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 11px; color: #1e293b; }
        .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { color: #1e40af; margin: 0; font-size: 18px; }
        .header h2 { color: #64748b; margin: 5px 0; font-size: 14px; }
        .info-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
        .info-table td { padding: 6px 10px; border: 1px solid #e2e8f0; }
        .info-table .label { background: #f1f5f9; font-weight: bold; width: 30%; color: #334155; }
        .stats-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .stats-table td { padding: 10px; text-align: center; border: 1px solid #e2e8f0; }
        .stats-table .number { font-size: 22px; font-weight: bold; color: #1e40af; }
        .report-item { border: 1px solid #e2e8f0; margin-bottom: 12px; padding: 10px; page-break-inside: avoid; }
        .report-header { background: #f1f5f9; padding: 8px 10px; margin: -10px -10px 10px -10px; font-weight: bold; color: #334155; }
        .status-approved { color: #059669; font-weight: bold; }
        .status-pending { color: #d97706; font-weight: bold; }
        .status-revision { color: #dc2626; font-weight: bold; }
        .status-rejected { color: #dc2626; font-weight: bold; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        .dpl-notes { background: #fef3c7; padding: 8px; margin-top: 8px; border-left: 3px solid #d97706; }
    </style>
</head>
<body>
    <div class="header">
        <h1>UIN PROF. K.H. SAIFUDDIN ZUHRI PURWOKERTO</h1>
        <h2>Kompilasi Laporan Harian KKN</h2>
    </div>

    <table class="info-table">
        <tr>
            <td class="label">Nama Mahasiswa</td>
            <td><?php echo e($user->name); ?></td>
            <td class="label">NIM</td>
            <td><?php echo e($user->student->nim ?? '-'); ?></td>
        </tr>
        <tr>
            <td class="label">Program Studi</td>
            <td><?php echo e($user->student->program->name ?? '-'); ?></td>
            <td class="label">Fakultas</td>
            <td><?php echo e($user->student->program->faculty->name ?? '-'); ?></td>
        </tr>
        <?php if($registration): ?>
        <tr>
            <td class="label">Kelompok</td>
            <td><?php echo e($registration->group->name ?? '-'); ?></td>
            <td class="label">Lokasi KKN</td>
            <td><?php echo e($registration->group->location->name ?? '-'); ?></td>
        </tr>
        <tr>
            <td class="label">DPL</td>
            <td colspan="3"><?php echo e($registration->group->lecturer->user->name ?? '-'); ?></td>
        </tr>
        <?php endif; ?>
    </table>

    <table class="stats-table">
        <tr>
            <td>
                <div class="number"><?php echo e($stats['total']); ?></div>
                <div>Total Laporan</div>
            </td>
            <td>
                <div class="number" style="color: #059669;"><?php echo e($stats['approved']); ?></div>
                <div>Disetujui</div>
            </td>
            <td>
                <div class="number" style="color: #d97706;"><?php echo e($stats['pending']); ?></div>
                <div>Menunggu</div>
            </td>
            <td>
                <div class="number" style="color: #dc2626;"><?php echo e($stats['revision'] + $stats['rejected']); ?></div>
                <div>Revisi/Ditolak</div>
            </td>
            <td>
                <div class="number"><?php echo e($stats['completion_rate']); ?>%</div>
                <div>Tingkat Kelengkapan</div>
            </td>
        </tr>
    </table>

    <h3 style="color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 5px;">Detail Laporan Harian</h3>

    <?php $__empty_1 = true; $__currentLoopData = $reports; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $report): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
    <div class="report-item">
        <div class="report-header">
            Tanggal: <?php echo e($report->date ? \Carbon\Carbon::parse($report->date)->format('d F Y') : '-'); ?>

            | Status:
            <span class="status-<?php echo e($report->status); ?>">
                <?php echo e(strtoupper($report->status)); ?>

            </span>
        </div>

        <p><strong>Kegiatan:</strong></p>
        <p><?php echo e($report->activity ?? '-'); ?></p>

        <?php if($report->location): ?>
        <p><strong>Lokasi:</strong> <?php echo e($report->location); ?></p>
        <?php endif; ?>

        <?php if($report->review_notes): ?>
        <div class="dpl-notes">
            <strong>Catatan DPL:</strong> <?php echo e($report->review_notes); ?>

        </div>
        <?php endif; ?>
    </div>
    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
    <p style="text-align: center; color: #64748b; padding: 20px;">
        Belum ada laporan harian yang tercatat.
    </p>
    <?php endif; ?>

    <div class="footer">
        Dokumen ini digenerate otomatis oleh SIM-KKN UIN SAIZU pada <?php echo e($generatedAt); ?>.
        <br>Untuk keperluan arsip dan verifikasi.
    </div>
</body>
</html>
<?php /**PATH /var/www/resources/views/pdf/daily-report-compilation.blade.php ENDPATH**/ ?>