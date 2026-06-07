<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExternalStudentProfile extends Model
{
    protected $fillable = ['mahasiswa_id', 'batch_id', 'external_nim', 'home_university', 'external_faculty', 'external_study_program', 'source_row_number'];

    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(Mahasiswa::class, 'mahasiswa_id');
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(ExternalKknBatch::class, 'batch_id');
    }
}
