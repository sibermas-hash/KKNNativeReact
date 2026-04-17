<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SlotTerkunci extends Model
{
    protected $connection = 'kkn';

    protected $table = 'slot_terkunci';

    protected $fillable = [
        'kelompok_id',
        'tipe_slot',
        'fakultas_id',
        'prodi_id',
        'kuota_slot',
    ];

    protected $casts = ['kuota_slot' => 'integer'];

    use HasFactory;

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }

    public function fakultas(): BelongsTo
    {
        return $this->belongsTo(Fakultas::class, 'fakultas_id');
    }

    public function prodi(): BelongsTo
    {
        return $this->belongsTo(Prodi::class, 'prodi_id');
    }
}
