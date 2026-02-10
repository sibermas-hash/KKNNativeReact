<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GradingConfig extends Model
{
    protected $fillable = [
        'config_key',
        'label',
        'percentage',
        'group',
        'description'
    ];
}
