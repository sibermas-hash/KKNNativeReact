<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PeriodeDocumentTemplate extends Model
{
    use HasFactory;

    protected $table = 'periode_document_templates';

    protected $fillable = [
        'periode_id',
        'jenis_kkn_document_requirement_id',
        'document_template_id',
    ];

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'periode_id');
    }

    public function requirement(): BelongsTo
    {
        return $this->belongsTo(JenisKknDocumentRequirement::class, 'jenis_kkn_document_requirement_id');
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(DocumentTemplate::class, 'document_template_id');
    }
}
