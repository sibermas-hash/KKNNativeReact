<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UserActivityLog — pencatatan aksi pengguna (login, logout, update profil, dll).
 *
 * Kontras dengan `LogAudit` (yang fokus ke data diff), model ini fokus ke
 * rangkaian aksi yang dilakukan user. Digunakan untuk:
 *   - Dashboard superadmin: statistik login per role.
 *   - Security monitoring: deteksi brute-force, akun dorman.
 *   - Compliance: audit trail aksi user.
 *
 * @property int $id
 * @property int|null $user_id
 * @property string $action
 * @property string $status
 * @property array|null $metadata
 * @property string|null $ip_address
 * @property string|null $user_agent
 * @property \Illuminate\Support\Carbon $created_at
 */
class UserActivityLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id', 'action', 'status', 'metadata',
        'ip_address', 'user_agent', 'created_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
