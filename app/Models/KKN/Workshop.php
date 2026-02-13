<?php

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workshop extends Model
{
    use HasFactory;

    protected $connection = 'kkn';
    protected $table = 'workshop';

    protected $fillable = [
        'title',
        'description',
        'methodology',
        'workshop_date',
        'start_time',
        'end_time',
        'location',
        'max_participants',
        'status',
    ];

    protected $casts = [
        'workshop_date' => 'date',
    ];

    public function peserta(): HasMany
    {
        return $this->hasMany(PesertaWorkshop::class, 'workshop_id');
    }

    public function participants(): HasMany
    {
        return $this->peserta();
    }
}
