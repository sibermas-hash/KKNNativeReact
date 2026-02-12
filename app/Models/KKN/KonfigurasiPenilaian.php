<?php

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Model;

class KonfigurasiPenilaian extends Model
{
    protected $connection = 'kkn';
    protected $table = 'konfigurasi_penilaian';

    protected $fillable = [
        'config_key',
        'label',
        'percentage',
        'group',
        'description'
    ];
}
