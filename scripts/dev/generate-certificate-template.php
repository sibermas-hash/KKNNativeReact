<?php

use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\Style\Font;
use PhpOffice\PhpWord\Style\Paragraph;
use PhpOffice\PhpWord\IOFactory;

require_once __DIR__ . '/../vendor/autoload.php';

$templatePath = '/Users/macm4/Documents/KKN/kknuinsaizu/storage/app/templates/certificate_template.docx';

// Buat dokumen Word baru dengan PhpWord
$phpWord = new PhpWord();

// Set metadata
$phpWord->getDocInfo()->setTitle('REKOGNISI KKN UIN Saizu');
$phpWord->getDocInfo()->setCreator('SIBERMAS');
$phpWord->getDocInfo()->setSubject('Template Sertifikat KKN');

// Set default font
$phpWord->setDefaultFontName('Times New Roman');
$phpWord->setDefaultFontSize(12);

// ==================== HALAMAN SERTIFIKAT ====================
$section = $phpWord->addSection([
    'pageSizeW' => \PhpOffice\PhpWord\Shared\Converter::inchToTwip(11.69),
    'pageSizeH' => \PhpOffice\PhpWord\Shared\Converter::inchToTwip(8.27),
    'marginLeft' => \PhpOffice\PhpWord\Shared\Converter::inchToTwip(0.5),
    'marginRight' => \PhpOffice\PhpWord\Shared\Converter::inchToTwip(0.5),
    'marginTop' => \PhpOffice\PhpWord\Shared\Converter::inchToTwip(0.5),
    'marginBottom' => \PhpOffice\PhpWord\Shared\Converter::inchToTwip(0.5),
]);

// Judul
$section->addText('REKOGNISI', [
    'bold' => true,
    'size' => 28,
    'alignment' => 'center',
]);

$section->addText('LEMBAGA PENELITIAN DAN PENGABDIAN KEPADA MASYARAKAT', [
    'bold' => true,
    'size' => 14,
    'alignment' => 'center',
]);

$section->addText('UNIVERSITAS ISLAM NEGERI PROF. K.H. SAIFUDDIN ZUHRI PURWOKERTO', [
    'bold' => true,
    'size' => 12,
    'alignment' => 'center',
]);

$section->addText(' ', ['size' => 20]);

// Intro
$section->addText('Sertifikat ini diberikan kepada:', [
    'size' => 12,
    'alignment' => 'center',
    'italic' => true,
]);

$section->addText(' ', ['size' => 10]);

// Nama (placeholder)
$section->addText('$NAME', [
    'bold' => true,
    'size' => 24,
    'alignment' => 'center',
]);

$section->addText('NIM. $NIM', [
    'size' => 12,
    'alignment' => 'center',
]);

$section->addText(' ', ['size' => 20]);

// Isi (placeholder)
$section->addText('$BODY', [
    'size' => 12,
    'alignment' => 'center',
    'lineSpacing' => 1.5,
]);

$section->addText(' ', ['size' => 20]);

// Predikat
$section->addText('PREDIKAT: $GRADE', [
    'bold' => true,
    'size' => 16,
    'alignment' => 'center',
]);

$section->addText(' ', ['size' => 40]);

// Tanda Tangan
$section->addText('Mengetahui,', [
    'size' => 10,
]);

$section->addText('$SIGNER1_TITLE', [
    'size' => 10,
    'alignment' => 'center',
]);

$section->addText(' ', ['size' => 40]);

$section->addText('$SIGNER1_NAME', [
    'bold' => true,
    'size' => 11,
    'underline' => 'single',
    'alignment' => 'center',
]);

$section->addText(' ', ['size' => 30]);

$section->addText('Purwokerto, $DATE', [
    'size' => 10,
]);

$section->addText('$SIGNER2_TITLE', [
    'size' => 10,
    'alignment' => 'center',
]);

$section->addText(' ', ['size' => 40]);

$section->addText('$SIGNER2_NAME', [
    'bold' => true,
    'size' => 11,
    'underline' => 'single',
    'alignment' => 'center',
]);

$section->addText(' ', ['size' => 20]);

// Footer
$section->addText('Nomor: $CERT_NO', [
    'size' => 10,
    'alignment' => 'center',
]);

$section->addText('Dokumen ini sah dan diterbitkan secara elektronik melalui SIBERMAS UIN Saizu Purwokerto', [
    'size' => 8,
    'alignment' => 'center',
]);

// Simpan dokumen
$objWriter = IOFactory::createWriter($phpWord, 'Word2007');
$objWriter->save($templatePath);

echo "✓ Template Word berhasil dibuat: {$templatePath}\n";
echo "\nPlaceholder yang tersedia:\n";
echo "  - \$NAME         → Nama mahasiswa\n";
echo "  - \$NIM          → NIM mahasiswa\n";
echo "  - \$BODY         → Isi rekognisi\n";
echo "  - \$GRADE        → Predikat (A/B/C)\n";
echo "  - \$DATE         → Tanggal\n";
echo "  - \$CERT_NO      → Nomor sertifikat\n";
echo "  - \$SIGNER1_NAME → Nama penanda tangan 1\n";
echo "  - \$SIGNER1_TITLE→ Jabatan 1\n";
echo "  - \$SIGNER2_NAME → Nama penanda tangan 2\n";
echo "  - \$SIGNER2_TITLE→ Jabatan 2\n";