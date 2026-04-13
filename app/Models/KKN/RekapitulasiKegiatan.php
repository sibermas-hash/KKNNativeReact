<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use Illuminate\Database\Eloquent\Attributes\Connection;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Casts;
use Illuminate\Database\Eloquent\Attributes\Hidden;

#[Connection('kkn')]
#[Table('rekapitulasi_kegiatan')]
#[Fillable([
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
])]
#[Casts([
    'volume' => 'integer',
        'swadaya_mhs' => 'integer',
        'swadaya_masyarakat' => 'integer',
        'bantuan_pemerintah' => 'integer',
        'donatur_lain' => 'integer',
        'jumlah' => 'integer',
])]
class RekapitulasiKegiatan extends Model
{
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
