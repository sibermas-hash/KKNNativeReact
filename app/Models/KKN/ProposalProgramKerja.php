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
#[Table('proposal_program_kerja')]
#[Fillable([
    'program_kerja_id',
        'file_path',
        'file_name',
        'version',
        'uploaded_at',
])]
#[Casts([
    'version' => 'integer',
        'uploaded_at' => 'datetime',
])]
class ProposalProgramKerja extends Model
{
    use HasFactory;

    

    

    public $timestamps = false;

    

    

    public function programKerja(): BelongsTo
    {
        return $this->belongsTo(ProgramKerja::class, 'program_kerja_id');
    }
}
