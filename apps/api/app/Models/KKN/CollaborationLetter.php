<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CollaborationLetter extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'external_university_id',
        'letter_number',
        'letter_date',
        'subject',
        'sender_name',
        'sender_position',
        'file_path',
        'status',
        'notes',
        'created_by',
        'verified_by',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'letter_date' => 'date',
            'verified_at' => 'datetime',
        ];
    }

    public function externalUniversity(): BelongsTo
    {
        return $this->belongsTo(ExternalUniversity::class, 'external_university_id');
    }

    public function participants(): HasMany
    {
        return $this->hasMany(PesertaKkn::class, 'collaboration_letter_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by')->withTrashed();
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by')->withTrashed();
    }
}
