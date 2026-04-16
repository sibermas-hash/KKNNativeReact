<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Blanko Penilaian KKN</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 10pt; line-height: 1.2; color: #000; margin: 0; padding: 0; }
        .container { padding: 20px; }
        .header { margin-bottom: 25px; text-align: center; }
        .header h1 { margin: 0; font-size: 14pt; font-weight: bold; }
        .header h2 { margin: 2px 0; font-size: 12pt; font-weight: bold; }
        
        .meta { margin-bottom: 20px; width: 100%; border-collapse: collapse; }
        .meta td { padding: 1px 0; vertical-align: top; }
        .meta td.label { width: 100px; }
        .meta td.colon { width: 15px; text-align: center; }
        .meta td.value { font-weight: normal; }

        .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table th, .table td { border: 1px solid #000; padding: 4px 6px; font-size: 9pt; height: 22px; }
        .table th { text-align: center; font-weight: bold; }
        .table td.center { text-align: center; }
        .table td.name { text-align: left; }

        .footer { width: 100%; margin-top: 20px; }
        .footer td { vertical-align: top; font-size: 9pt; }
        .note { margin-top: 5px; font-style: italic; }
        .signature-block { width: 300px; float: right; text-align: left; }
        .signature-space { margin-top: 50px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Blanko Penilaian Peserta KKN</h1>
            <h2>Angkatan <?php echo e($angkatan ?? '57'); ?> Tahun <?php echo e($tahun ?? '2026'); ?></h2>
        </div>

        <?php
            $addressParts = explode(',', $group->lokasi?->address ?? '');
            $kecamatan = trim($addressParts[0] ?? '-');
            $kabupaten = trim($addressParts[1] ?? '-');
            $kelompokNumber = preg_replace('/[^0-9]/', '', $group->code);
        ?>
        <table class="meta">
            <tr>
                <td class="label">KELOMPOK</td>
                <td class="colon">:</td>
                <td class="value"><?php echo e($kelompokNumber); ?></td>
            </tr>
            <tr>
                <td class="label">DESA</td>
                <td class="colon">:</td>
                <td class="value"><?php echo e($group->lokasi?->village_name ?? '-'); ?></td>
            </tr>
            <tr>
                <td class="label">KECAMATAN</td>
                <td class="colon">:</td>
                <td class="value"><?php echo e($kecamatan); ?></td>
            </tr>
            <tr>
                <td class="label">KABUPATEN</td>
                <td class="colon">:</td>
                <td class="value"><?php echo e($kabupaten); ?></td>
            </tr>
            <tr>
                <td class="label">DPL</td>
                <td class="colon">:</td>
                <td class="value"><?php echo e($group->dpl?->user?->name ?? '-'); ?></td>
            </tr>
        </table>

        <table class="table">
            <thead>
                <tr>
                    <th width="30">NO</th>
                    <th>NAMA MAHASISWA</th>
                    <th width="90">NIM</th>
                    <th width="70">DISIPLIN</th>
                    <th width="70">SIKAP</th>
                    <th width="70">TOTAL NILAI</th>
                </tr>
            </thead>
            <tbody>
                <?php $__currentLoopData = $students; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $idx => $student): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                <tr>
                    <td class="center"><?php echo e($idx + 1); ?></td>
                    <td class="name"><?php echo e($student['name']); ?></td>
                    <td class="center"><?php echo e($student['nim']); ?></td>
                    <td class="center"><?php echo e($student['discipline'] ?? ''); ?></td>
                    <td class="center"><?php echo e($student['attitude'] ?? ''); ?></td>
                    <td class="center">
                        <?php if(isset($student['discipline']) && isset($student['attitude'])): ?>
                            <?php echo e(round(($student['discipline'] + $student['attitude']) / 2)); ?>

                        <?php endif; ?>
                    </td>
                </tr>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            </tbody>
        </table>

        <div class="footer">
            <div class="signature-block">
                <div>.........................., .............................. 2026</div>
                <div style="margin-top: 5px;">Kepala Desa/Lurah,</div>
                <div class="signature-space">
                    .........................................................<br>
                    NIP.
                </div>
            </div>
            
            <div class="note">
                *Keterangan:<br>
                - Rentang Nilai 60-100
            </div>
        </div>
    </div>
</body>
</html>
<?php /**PATH /var/www/resources/views/admin/exports/blanko_nilai.blade.php ENDPATH**/ ?>