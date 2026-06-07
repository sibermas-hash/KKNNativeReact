<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExternalKknBatch extends Model
{
    protected $fillable = ['periode_id', 'home_university', 'program_name', 'letter_number', 'letter_date', 'letter_file_path', 'expected_participants', 'target_regency', 'notes', 'created_by'];

    protected $casts = ['letter_date' => 'date', 'expected_participants' => 'integer'];

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'periode_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function students(): HasMany
    {
        return $this->hasMany(ExternalStudentProfile::class, 'batch_id');
    }
}
