<?php

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Model;

class KonfigurasiSertifikat extends Model
{
    protected $connection = 'kkn';
    protected $table = 'konfigurasi_sertifikat';

    protected $fillable = [
        'config_key',
        'label',
        'value',
        'type',
    ];
}