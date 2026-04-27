<?php

require_once __DIR__ . '/../vendor/autoload.php';

use PhpOffice\PhpWord\TemplateProcessor;

echo "=== TEST GENERATE WORD CERTIFICATE ===\n\n";

// Path template
$templatePath = storage_path('app/templates/certificate_template.docx');

if (!file_exists($templatePath)) {
    echo "❌ Template tidak ditemukan: {$templatePath}\n";
    exit(1);
}

echo "✓ Template ditemukan: {$templatePath}\n";

// Data dummy untuk test
$dummyData = [
    'NAME' => 'BUDI SANTOSO',
    'NIM' => '2123456789',
    'BODY' => 'Telah menyelesaikan Kuliah Kerja Nyata (KKN) UIN Prof. K.H. Saifuddin Zuhri Purwokerto Periode 56 Tematik Tahun 2026 dengan hasil yang memuaskan.',
    'GRADE' => 'A',
    'DATE' => '15 April 2026',
    'CERT_NO' => 'UIN-SAIZU/KKN/56/2026/0001',
    'SIGNER1_NAME' => 'Dr. H. Ahmad Fauzi, M.Ag.',
    'SIGNER1_TITLE' => 'Wakil Kepala Bagian Akademik',
    'SIGNER2_NAME' => 'Drs. H. Suprianto, M.Si.',
    'SIGNER2_TITLE' => 'Kepala LPPM',
];

echo "\nData test:\n";
foreach ($dummyData as $key => $value) {
    echo "  - {$key}: {$value}\n";
}

// Load template
$templateProcessor = new TemplateProcessor($templatePath);
echo "\n✓ Template berhasil di-load\n";

// Set values
foreach ($dummyData as $key => $value) {
    $templateProcessor->setValue($key, $value);
}
echo "✓ Placeholder berhasil di-set\n";

// Save ke file temporary
$outputPath = storage_path('app/templates/test_certificate_output.docx');
$templateProcessor->saveAs($outputPath);

if (file_exists($outputPath)) {
    $size = filesize($outputPath);
    echo "\n✅ SUCCESS! File berhasil di-generate\n";
    echo "📄 Output: {$outputPath}\n";
    echo "📊 Size: " . number_format($size) . " bytes\n";
} else {
    echo "\n❌ Gagal generate file\n";
}