<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentTemplate extends Model
{
    use HasFactory;

    protected $table = 'document_templates';

    protected $fillable = [
        'document_key',
        'name',
        'description',
        'file_path',
        'file_name',
        'mime_type',
        'file_size',
        'uploaded_by',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'file_size' => 'integer',
    ];

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function requirementDefaults(): HasMany
    {
        return $this->hasMany(JenisKknDocumentRequirement::class, 'default_template_id');
    }

    public function periodAssignments(): HasMany
    {
        return $this->hasMany(PeriodeDocumentTemplate::class, 'document_template_id');
    }
}
