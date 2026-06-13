<?php

declare(strict_types=1);

namespace App\Models\Region;

use Illuminate\Database\Eloquent\Model;

class IndonesiaVillage extends Model
{
    protected $table = 'indonesia_villages';

    protected $primaryKey = 'code';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['code', 'name', 'district_code'];
}
