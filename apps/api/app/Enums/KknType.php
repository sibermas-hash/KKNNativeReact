<?php

declare(strict_types=1);

namespace App\Enums;

enum KknType: string
{
    case REGULER = 'REGULER';
    case NUSANTARA = 'NUSANTARA';
    case INTERNASIONAL = 'INTERNASIONAL';
    case TEMATIK = 'TEMATIK';
    case RESPONSIF = 'RESPONSIF';
    case KOLABORASI_PTKIN = 'KOLABORASI_PTKIN';
    case KAMPUNG_ZAKAT = 'KAMPUNG_ZAKAT';
    case DESA_KATANA = 'DESA_KATANA';

    public function label(): string
    {
        return match ($this) {
            self::REGULER => __('KKN Reguler'),
            self::NUSANTARA => __('KKN Nusantara'),
            self::INTERNASIONAL => __('KKN Terpadu Internasional Mandiri'),
            self::TEMATIK => __('KKN Tematik'),
            self::RESPONSIF => __('KKN Responsif (Rumah Masing-masing)'),
            self::KOLABORASI_PTKIN => __('KKN Kolaborasi PTKIN'),
            self::KAMPUNG_ZAKAT => __('KKN Tematik Kampung Zakat'),
            self::DESA_KATANA => __('KKN Tematik Desa Katana'),
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::REGULER => __('KKN wajib (Gasal/Genap, minimal 100 SKS, durasi 40 hari).'),
            self::NUSANTARA => __('KKN tingkat nasional berbasis Asta Protas Kemenag RI (Min 85 SKS, IPK 3.25).'),
            self::INTERNASIONAL => __('KKN di wilayah Asia Tenggara dengan masa tinggal minimal 1 bulan (Min 100 SKS, IPK 3.25).'),
            self::TEMATIK => __('KKN dengan tema khusus berdasarkan usulan dosen atau kebutuhan LPPM.'),
            self::RESPONSIF => __('KKN mandiri di rumah masing-masing dengan pendaftaran terbuka dan penempatan swadaya.'),
            self::KOLABORASI_PTKIN => __('KKN hasil kolaborasi antar PTKIN se-Indonesia.'),
            self::KAMPUNG_ZAKAT => __('KKN tematik khusus mahasiswa Prodi Mazawa untuk pemberdayaan berbasis zakat.'),
            self::DESA_KATANA => __('KKN tematik Desa Tanggap Bencana fokus pada mitigasi dan edukasi.'),
        };
    }

    public function registrationMode(): string
    {
        return match ($this) {
            self::REGULER, self::RESPONSIF => 'open', // Pendaftaran mandiri
            self::TEMATIK => 'proposal_based', // KKN Tematik/pengabdian dosen
            default => 'selective', // Seleksi khusus panitia
        };
    }

    public function placementMode(): string
    {
        return match ($this) {
            self::REGULER => 'automatic_after_approval', // Sistem yang menempatkan
            self::RESPONSIF => 'self_determined', // Rumah/lokasi masing-masing mahasiswa
            self::TEMATIK => 'proposal_defined', // Mengikuti proposal pengabdian dosen
            self::INTERNASIONAL, self::KOLABORASI_PTKIN => 'host_defined', // Ditentukan mitra/host
            default => 'manual_admin', // Manual oleh admin LPPM
        };
    }

    public function isSelfService(): bool
    {
        return $this->registrationMode() === 'open' && $this->placementMode() === 'automatic_after_approval';
    }

    // Helper untuk mapping ke kolom database lama (legacy compatibility)
    public function getProgramType(): string
    {
        return match ($this) {
            self::REGULER => 'reguler',
            self::NUSANTARA => 'nusantara',
            self::INTERNASIONAL => 'internasional_mandiri',
            self::KOLABORASI_PTKIN => 'kolaborasi_ptkin',
            default => 'tematik',
        };
    }

    public function getProgramSubtype(): ?string
    {
        return match ($this) {
            self::KAMPUNG_ZAKAT => 'kampung_zakat',
            self::DESA_KATANA => 'desa_katana',
            default => null,
        };
    }
}
