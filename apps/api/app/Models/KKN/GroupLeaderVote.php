<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GroupLeaderVote extends Model
{
    use HasFactory;

    protected $table = 'group_leader_votes';

    protected $fillable = [
        'kelompok_id',
        'voter_peserta_id',
        'candidate_peserta_id',
        'voted_at',
    ];

    protected $casts = [
        'kelompok_id' => 'integer',
        'voter_peserta_id' => 'integer',
        'candidate_peserta_id' => 'integer',
        'voted_at' => 'datetime',
    ];

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }

    public function voter(): BelongsTo
    {
        return $this->belongsTo(PesertaKkn::class, 'voter_peserta_id');
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(PesertaKkn::class, 'candidate_peserta_id');
    }
}
