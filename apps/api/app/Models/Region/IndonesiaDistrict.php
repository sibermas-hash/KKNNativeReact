<?php

declare(strict_types=1);

namespace App\Models\Region;

use Illuminate\Database\Eloquent\Model;

class IndonesiaDistrict extends Model
{
    protected $table = 'indonesia_districts';

    protected $primaryKey = 'code';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['code', 'name', 'regency_code'];
}
