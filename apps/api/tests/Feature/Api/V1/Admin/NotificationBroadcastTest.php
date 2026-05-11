<?php

declare(strict_types=1);

use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\User;
use App\Notifications\GenericNotification;
use Illuminate\Support\Facades\Notification;

/*
 * POST /api/v1/admin/notifications/broadcast
 *
 * Tests target resolution and the chunked dispatch. Uses Notification::fake()
 * so we never actually queue or send anything — just assert what would have
 * been sent to which users.
 */

it('rejects unauthenticated callers', function () {
    $this->postJson('/api/v1/admin/notifications/broadcast', [])
        ->assertStatus(401);
});

it('rejects non-superadmin callers (admin role gets 403 via PERMISSION_MAP)', function () {
    $admin = createUserWithRole('admin');

    $this->actingAs($admin)
        ->postJson('/api/v1/admin/notifications/broadcast', [
            'title' => 'T',
            'message' => 'M',
            'target' => 'all',
        ])
        ->assertStatus(403);
});

it('rejects validation when title or message missing', function () {
    $sa = createUserWithRole('superadmin');

    $this->actingAs($sa)
        ->postJson('/api/v1/admin/notifications/broadcast', ['target' => 'all'])
        ->assertStatus(422);
});

it('rejects invalid target string', function () {
    $sa = createUserWithRole('superadmin');

    $this->actingAs($sa)
        ->postJson('/api/v1/admin/notifications/broadcast', [
            'title' => 'T',
            'message' => 'M',
            'target' => 'nonsense:42',
        ])
        ->assertStatus(400);
});

it('dispatches to all active users when target=all', function () {
    Notification::fake();

    $sa = createUserWithRole('superadmin');
    $u1 = createUserWithRole('student');
    $u2 = createUserWithRole('dosen');
    // Inactive user — should NOT receive
    $inactive = User::factory()->create(['is_active' => false]);

    $response = $this->actingAs($sa)
        ->postJson('/api/v1/admin/notifications/broadcast', [
            'title' => 'Pengumuman',
            'message' => 'Body.',
            'target' => 'all',
        ]);

    $response->assertOk();

    // Assert specific users (can't check "only" because DB has seeded users).
    Notification::assertSentTo($sa, GenericNotification::class);
    Notification::assertSentTo($u1, GenericNotification::class);
    Notification::assertSentTo($u2, GenericNotification::class);
    Notification::assertNotSentTo($inactive, GenericNotification::class);
});

it('dispatches only to users with target role when target=role:student', function () {
    Notification::fake();

    $sa = createUserWithRole('superadmin');
    $alice = createUserWithRole('student');
    $bob = createUserWithRole('student');
    $dosen = createUserWithRole('dosen');

    $this->actingAs($sa)
        ->postJson('/api/v1/admin/notifications/broadcast', [
            'title' => 'T',
            'message' => 'M',
            'target' => 'role:student',
        ])
        ->assertOk();

    Notification::assertSentTo($alice, GenericNotification::class);
    Notification::assertSentTo($bob, GenericNotification::class);
    Notification::assertNotSentTo($dosen, GenericNotification::class);
    Notification::assertNotSentTo($sa, GenericNotification::class);
});

it('dispatches to fakultas members when target=fakultas:{id}', function () {
    Notification::fake();

    $sa = createUserWithRole('superadmin');
    $fakultas = Fakultas::factory()->create();

    // A student whose Mahasiswa.fakultas_id matches
    $student = createUserWithRole('student');
    Mahasiswa::factory()->create([
        'user_id' => $student->id,
        'fakultas_id' => $fakultas->id,
    ]);

    // An unrelated student in a different fakultas
    $otherFakultas = Fakultas::factory()->create();
    $otherStudent = createUserWithRole('student');
    Mahasiswa::factory()->create([
        'user_id' => $otherStudent->id,
        'fakultas_id' => $otherFakultas->id,
    ]);

    $this->actingAs($sa)
        ->postJson('/api/v1/admin/notifications/broadcast', [
            'title' => 'T',
            'message' => 'M',
            'target' => 'fakultas:'.$fakultas->id,
        ])
        ->assertOk();

    Notification::assertSentTo($student, GenericNotification::class);
    Notification::assertNotSentTo($otherStudent, GenericNotification::class);
});

it('dispatches to specific user_ids', function () {
    Notification::fake();

    $sa = createUserWithRole('superadmin');
    $u1 = createUserWithRole('student');
    $u2 = createUserWithRole('student');
    $u3 = createUserWithRole('student');

    $this->actingAs($sa)
        ->postJson('/api/v1/admin/notifications/broadcast', [
            'title' => 'T',
            'message' => 'M',
            'target' => 'user_ids',
            'user_ids' => [$u1->id, $u3->id],
        ])
        ->assertOk();

    Notification::assertSentTo($u1, GenericNotification::class);
    Notification::assertSentTo($u3, GenericNotification::class);
    Notification::assertNotSentTo($u2, GenericNotification::class);
});

it('rejects user_ids target with empty array', function () {
    $sa = createUserWithRole('superadmin');

    $this->actingAs($sa)
        ->postJson('/api/v1/admin/notifications/broadcast', [
            'title' => 'T',
            'message' => 'M',
            'target' => 'user_ids',
            'user_ids' => [],
        ])
        ->assertStatus(400);
});

it('returns helpful error when no recipients match', function () {
    Notification::fake();

    $sa = createUserWithRole('superadmin');

    // No users with a 'nonexistent_role' role — should trigger "no recipients"
    $response = $this->actingAs($sa)
        ->postJson('/api/v1/admin/notifications/broadcast', [
            'title' => 'T',
            'message' => 'M',
            'target' => 'role:nonexistent_role',
        ]);

    $response->assertStatus(400);
    $response->assertJsonPath('error.message', 'Tidak ada penerima yang cocok dengan target tersebut.');
    Notification::assertNothingSent();
});

it('reports total_sent in success response', function () {
    Notification::fake();

    $sa = createUserWithRole('superadmin');
    $u1 = createUserWithRole('student');
    $u2 = createUserWithRole('student');

    // Use user_ids so the count isn't polluted by seeded users.
    $response = $this->actingAs($sa)
        ->postJson('/api/v1/admin/notifications/broadcast', [
            'title' => 'T',
            'message' => 'M',
            'target' => 'user_ids',
            'user_ids' => [$u1->id, $u2->id],
        ]);

    $response->assertOk();
    expect($response->json('data.total_sent'))->toBe(2);
    expect($response->json('data.total_matched'))->toBe(2);
});
