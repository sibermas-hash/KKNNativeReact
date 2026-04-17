<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Model;

class KonfigurasiSertifikat extends Model
{
    protected $connection = 'kkn';

    protected $table = 'konfigurasi_sertifikat';

    protected $guarded = ['id'];
}
