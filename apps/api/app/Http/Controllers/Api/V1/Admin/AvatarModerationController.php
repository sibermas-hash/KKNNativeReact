<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Admin endpoint for Layer 4 (human-in-the-loop) avatar moderation.
 *
 * Workflow (PRD_AVATAR_VALIDATION.md):
 *   1. User uploads avatar → ProfileController::updateAvatar
 *   2. Layer 3 AI runs; if AI unavailable → status='pending'
 *   3. Admin lists pending via GET /admin/avatar-moderation
 *   4. Admin approves or rejects
 *      - approve → status='approved', foto bisa dipakai
 *      - reject  → status='rejected', file dihapus, user diminta upload ulang
 */
class AvatarModerationController extends Controller
{
    use ApiResponse;

    /**
     * GET /admin/avatar-moderation
     * List avatars awaiting moderation (pending first, then rejected for audit trail).
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status', 'pending');
        $allowed = ['pending', 'approved', 'rejected', 'all'];
        if (! in_array($status, $allowed, true)) {
            $status = 'pending';
        }

        $query = User::query()
            ->select([
                'id', 'name', 'username', 'email', 'avatar',
                'avatar_moderation_status', 'avatar_moderation_reason',
                'avatar_moderation_reviewed_at', 'avatar_moderation_reviewed_by',
                'updated_at',
            ])
            ->with(['mahasiswa:id,user_id,nim,fakultas_id,prodi_id', 'mahasiswa.fakultas:id,nama', 'mahasiswa.prodi:id,nama']);

        if ($status !== 'all') {
            $query->where('avatar_moderation_status', $status);
        } else {
            $query->whereIn('avatar_moderation_status', ['pending', 'approved', 'rejected']);
        }

        // Rejected rows may have avatar cleared; pending/approved must still have files.
        if (in_array($status, ['pending', 'approved'], true)) {
            $query->whereNotNull('avatar');
        }

        // Pending first so admin sees backlog immediately
        $users = $query->orderByRaw("CASE avatar_moderation_status WHEN 'pending' THEN 0 WHEN 'rejected' THEN 1 ELSE 2 END")
            ->orderByDesc('updated_at')
            ->paginate(20);

        $users->getCollection()->transform(function (User $u) {
            $mhs = $u->mahasiswa;
            return [
                'id' => $u->id,
                'name' => $u->name,
                'username' => $u->username,
                'email' => $u->email,
                'nim' => $mhs?->nim,
                'fakultas' => $mhs?->fakultas?->nama,
                'prodi' => $mhs?->prodi?->nama,
                'avatar_url' => $u->avatar ? rtrim((string) config('app.frontend_url', config('app.url')), '/').'/storage/'.$u->avatar : null,
                'status' => $u->avatar_moderation_status,
                'reason' => $u->avatar_moderation_reason,
                'reviewed_at' => $u->avatar_moderation_reviewed_at,
                'updated_at' => $u->updated_at,
            ];
        });

        return $this->success([
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
            'counts' => [
                'pending' => User::where('avatar_moderation_status', 'pending')->whereNotNull('avatar')->count(),
                'approved' => User::where('avatar_moderation_status', 'approved')->whereNotNull('avatar')->count(),
                'rejected' => User::where('avatar_moderation_status', 'rejected')->count(),
            ],
        ]);
    }

    /**
     * PATCH /admin/avatar-moderation/{user}/approve
     */
    public function approve(Request $request, User $user): JsonResponse
    {
        $user->update([
            'avatar_moderation_status' => 'approved',
            'avatar_moderation_reason' => null,
            'avatar_moderation_reviewed_at' => now(),
            'avatar_moderation_reviewed_by' => $request->user()->id,
        ]);

        return $this->success(['status' => 'approved'], 'Foto disetujui.');
    }

    /**
     * PATCH /admin/avatar-moderation/{user}/reject
     * Rejects the avatar, deletes the file, and clears user's avatar pointer.
     * The user will need to re-upload.
     */
    public function reject(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $user->update([
            'avatar' => null,
            'avatar_moderation_status' => 'rejected',
            'avatar_moderation_reason' => $data['reason'],
            'avatar_moderation_reviewed_at' => now(),
            'avatar_moderation_reviewed_by' => $request->user()->id,
        ]);

        return $this->success(['status' => 'rejected'], 'Foto ditolak. User akan diminta upload ulang.');
    }

    /**
     * PATCH /admin/avatar-moderation/bulk-approve
     */
    public function bulkApprove(Request $request): JsonResponse
    {
        $data = $request->validate(['ids' => ['required', 'array', 'min:1'], 'ids.*' => ['integer', 'exists:users,id']]);

        $count = User::whereIn('id', $data['ids'])
            ->where('avatar_moderation_status', 'pending')
            ->whereNotNull('avatar')
            ->update([
                'avatar_moderation_status' => 'approved',
                'avatar_moderation_reason' => null,
                'avatar_moderation_reviewed_at' => now(),
                'avatar_moderation_reviewed_by' => $request->user()->id,
            ]);

        return $this->success(['count' => $count], "{$count} foto disetujui.");
    }

    /**
     * PATCH /admin/avatar-moderation/bulk-reject
     */
    public function bulkReject(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:users,id'],
            'reason' => ['required', 'string', 'min:5', 'max:500'],
        ]);

        $users = User::whereIn('id', $data['ids'])
            ->where('avatar_moderation_status', 'pending')
            ->whereNotNull('avatar')
            ->get();

        foreach ($users as $user) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $user->update([
                'avatar' => null,
                'avatar_moderation_status' => 'rejected',
                'avatar_moderation_reason' => $data['reason'],
                'avatar_moderation_reviewed_at' => now(),
                'avatar_moderation_reviewed_by' => $request->user()->id,
            ]);
        }

        $count = $users->count();
        return $this->success(['count' => $count], "{$count} foto ditolak.");
    }
}
