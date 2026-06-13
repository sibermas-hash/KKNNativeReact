<?php

declare(strict_types=1);

namespace App\Models\Region;

use Illuminate\Database\Eloquent\Model;

class IndonesiaRegency extends Model
{
    protected $table = 'indonesia_regencies';

    protected $primaryKey = 'code';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['code', 'name', 'province_code'];
}
