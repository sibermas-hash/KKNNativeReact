<?php

declare(strict_types=1);

namespace App\Enums;

enum LogbookCategory: string
{
    case SHILATURRAHMI = 'shilaturrahmi';
    case PROGRAM_UNGGULAN = 'program_unggulan';
    case PROGRAM_PENDUKUNG = 'program_pendukung';
    case ADMINISTRASI = 'administrasi';

    public function label(): string
    {
        return match ($this) {
            self::SHILATURRAHMI => 'Shilaturrahmi / Koordinasi',
            self::PROGRAM_UNGGULAN => 'Program Unggulan',
            self::PROGRAM_PENDUKUNG => 'Program Pendukung',
            self::ADMINISTRASI => 'Administrasi / Piket Posko',
        };
    }
}
