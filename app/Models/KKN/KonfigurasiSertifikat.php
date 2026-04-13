<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Attributes\Connection;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Casts;
use Illuminate\Database\Eloquent\Attributes\Hidden;

#[Connection('kkn')]
#[Table('konfigurasi_sertifikat')]
#[Fillable([
    'config_key',
        'label',
        'value',
        'type',
])]
#[Casts([
    'value' => 'string',
])]
class KonfigurasiSertifikat extends Model
{
    

    

    

    
}
