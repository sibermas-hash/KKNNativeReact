<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JenisKknDocumentRequirement extends Model
{
    use HasFactory;

    protected $table = 'jenis_kkn_document_requirements';

    protected $fillable = [
        'jenis_kkn_id',
        'document_key',
        'document_label',
        'description',
        'is_required',
        'sort_order',
        'default_template_id',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function jenisKkn(): BelongsTo
    {
        return $this->belongsTo(JenisKkn::class, 'jenis_kkn_id');
    }

    public function defaultTemplate(): BelongsTo
    {
        return $this->belongsTo(DocumentTemplate::class, 'default_template_id');
    }

    public function periodTemplates(): HasMany
    {
        return $this->hasMany(PeriodeDocumentTemplate::class, 'jenis_kkn_document_requirement_id');
    }
}
