<?php

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProposalProgramKerja extends Model
{
    use HasFactory;

    protected $table = 'proposal_program_kerja';

    public $timestamps = false;

    protected $fillable = [
        'program_kerja_id',
        'file_path',
        'file_name',
        'version',
        'uploaded_at',
    ];

    protected $casts = [
        'version' => 'integer',
        'uploaded_at' => 'datetime',
    ];

    public function programKerja(): BelongsTo
    {
        return $this->belongsTo(ProgramKerja::class, 'program_kerja_id');
    }
}
