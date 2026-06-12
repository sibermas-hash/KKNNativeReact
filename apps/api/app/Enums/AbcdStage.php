<?php

declare(strict_types=1);

namespace App\Enums;

enum AbcdStage: string
{
    case DISCOVERY = 'discovery';
    case DREAM = 'dream';
    case DESIGN = 'design';
    case DEFINE = 'define';
    case DESTINY = 'destiny';
    case REFLECTION = 'reflection';

    public function label(): string
    {
        return match ($this) {
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
        return match ($this) {
            self::DISCOVERY => 1,
            self::DREAM => 2,
            self::DESIGN => 3,
            self::DEFINE => 4,
            self::DESTINY => 5,
            self::REFLECTION => 6,
        };
    }
}
