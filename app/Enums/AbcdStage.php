<?php

namespace App\Enums;

enum AbcdStage: string
{
    case DISCOVERY = 'Discovery';
    case DREAM = 'Dream';
    case DESIGN = 'Design';
    case DEFINE = 'Define';
    case DESTINY = 'Destiny';
    case REFLECTION = 'Reflection';

    public function label(): string
    {
        return match($this) {
            self::DISCOVERY => 'Discovery (Penemuan Aset)',
            self::DREAM => 'Dream (Impian & Visi)',
            self::DESIGN => 'Design (Perancangan Strategi)',
            self::DEFINE => 'Define (Aksi Nyata)',
            self::DESTINY => 'Destiny (Keberlanjutan)',
            self::REFLECTION => 'Reflection (Monitoring & Evaluasi)',
        };
    }

    public function weekNumber(): int
    {
        return match($this) {
            self::DISCOVERY => 1,
            self::DREAM => 2,
            self::DESIGN => 2,
            self::DEFINE => 3,
            self::DESTINY => 4,
            self::REFLECTION => 5, // Laporan Akhir
        };
    }
}
