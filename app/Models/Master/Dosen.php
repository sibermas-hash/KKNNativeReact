<?php

declare(strict_types=1);

namespace App\Models\Master;

use App\Models\KKN\Dosen as KknDosen;
use App\Models\User;
use Illuminate\Database\Eloquent\Attributes\Cast;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Table('dosen')]
class Dosen extends Model
{
    #[Fillable]
    public string $nip;
    #[Fillable]
    public string $nama;
    #[Fillable]
    public string $email;
    #[Fillable]
    public ?string $telepon = null;
    #[Fillable]
    public ?string $gelar_depan = null;
    #[Fillable]
    public ?string $gelar_belakang = null;
    #[Fillable]
    public ?string $jabatan = null;
    #[Fillable]
    public ?string $prodi = null;
    #[Fillable]
    #[Cast('string')]
    public string $status;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id')->whereNotNull('user_id');
    }

    public function kknLecturer(): HasOne
    {
        return $this->hasOne(KknDosen::class, 'nip', 'nip');
    }
}
