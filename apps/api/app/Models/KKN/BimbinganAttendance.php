<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Kehadiran mahasiswa di sesi bimbingan — bagian Sistem Bimbingan Online (R6).
 */
class BimbinganAttendance extends Model
{
    use HasFactory;

    public const STATUS_HADIR = 'hadir';

    public const STATUS_TIDAK_HADIR = 'tidak_hadir';

    public const STATUS_IZIN = 'izin';

    protected $table = 'bimbingan_attendances';

    protected $fillable = [
        'session_id',
        'mahasiswa_id',
        'status',
        'note',
        'marked_at',
    ];

    protected $casts = [
        'marked_at' => 'datetime',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(BimbinganSession::class, 'session_id');
    }

    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(Mahasiswa::class, 'mahasiswa_id');
    }
}
