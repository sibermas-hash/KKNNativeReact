<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkProgramProposal extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'work_program_id',
        'file_path',
        'file_name',
        'version',
        'uploaded_at',
    ];

    protected $casts = [
        'version' => 'integer',
        'uploaded_at' => 'datetime',
    ];

    public function workProgram(): BelongsTo
    {
        return $this->belongsTo(WorkProgram::class);
    }
}
