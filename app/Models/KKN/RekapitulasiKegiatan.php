<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RekapitulasiKegiatan extends Model
{
    protected $connection = 'kkn';

    protected $table = 'rekapitulasi_kegiatan';

    protected $fillable = [
    'kelompok_id',
    'program_kerja_id',
    'uraian_kegiatan',
    'satuan',
    'volume',
    'swadaya_mhs',
    'swadaya_masyarakat',
    'bantuan_pemerintah',
    'donatur_lain',
    'jumlah',
    'keterangan',
];

    protected $casts = [
    'volume' => 'integer',
    'swadaya_mhs' => 'integer',
    'swadaya_masyarakat' => 'integer',
    'bantuan_pemerintah' => 'integer',
    'donatur_lain' => 'integer',
    'jumlah' => 'integer',
];

    use HasFactory;

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }

    public function programKerja(): BelongsTo
    {
        return $this->belongsTo(ProgramKerja::class, 'program_kerja_id');
    }
}
