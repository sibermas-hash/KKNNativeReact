<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Notifications\Notification;

/*
 * NotificationController (legacy /api/notifications endpoints).
 *
 * These endpoints power the in-app NotificationBell. Verified contract:
 *   GET /notifications/unread — returns { notifications: [...], unread_count: N }
 *                               User ONLY sees their own notifications.
 *   POST /notifications/{id}/read — marks read; rejects cross-user access with 404.
 *   POST /notifications/read-all — marks ALL unread as read for this user.
 */

beforeEach(function () {
    DatabaseNotification::query()->delete();
});

it('unread endpoint requires authentication', function () {
    $this->getJson('/api/notifications/unread')->assertStatus(401);
});

it('unread returns empty when user has no notifications', function () {
    $user = createUserWithRole('superadmin');
    $response = $this->actingAs($user)->getJson('/api/notifications/unread');

    $response->assertOk();
    $response->assertJsonPath('data.unread_count', 0);
    expect($response->json('data.notifications'))->toBe([]);
});

it('unread returns only the current user notifications', function () {
    $alice = createUserWithRole('superadmin');
    $bob = createUserWithRole('superadmin');

    // Alice has 2 unread
    $alice->notify(new TestNotification('alice-1'));
    $alice->notify(new TestNotification('alice-2'));
    // Bob has 3 unread
    $bob->notify(new TestNotification('bob-1'));
    $bob->notify(new TestNotification('bob-2'));
    $bob->notify(new TestNotification('bob-3'));

    $aliceResp = $this->actingAs($alice)->getJson('/api/notifications/unread');
    $aliceResp->assertOk();
    expect($aliceResp->json('data.unread_count'))->toBe(2);
    expect(count($aliceResp->json('data.notifications')))->toBe(2);

    $bobResp = $this->actingAs($bob)->getJson('/api/notifications/unread');
    expect($bobResp->json('data.unread_count'))->toBe(3);
});

it('unread tops out at 15 items', function () {
    $user = createUserWithRole('superadmin');

    for ($i = 0; $i < 20; $i++) {
        $user->notify(new TestNotification("n-{$i}"));
    }

    $response = $this->actingAs($user)->getJson('/api/notifications/unread');
    $response->assertOk();
    expect($response->json('data.unread_count'))->toBe(20);
    expect(count($response->json('data.notifications')))->toBe(15);
});

it('markRead succeeds for owner and returns 404 for other users', function () {
    $alice = createUserWithRole('superadmin');
    $bob = createUserWithRole('superadmin');

    $alice->notify(new TestNotification('alice-secret'));
    $notificationId = $alice->unreadNotifications()->firstOrFail()->id;

    // Alice can mark her own
    $this->actingAs($alice)
        ->postJson("/api/notifications/{$notificationId}/read")
        ->assertOk();

    expect($alice->unreadNotifications()->count())->toBe(0);

    // Re-add a new notification for alice
    $alice->notify(new TestNotification('alice-2'));
    $aliceNotifId = $alice->unreadNotifications()->firstOrFail()->id;

    // Bob CANNOT mark alice's notification (should 404 — findOrFail on his scope)
    $this->actingAs($bob)
        ->postJson("/api/notifications/{$aliceNotifId}/read")
        ->assertStatus(404);

    // Alice's notification still unread
    expect($alice->unreadNotifications()->count())->toBe(1);
});

it('markAllRead clears every unread for current user only', function () {
    $alice = createUserWithRole('superadmin');
    $bob = createUserWithRole('superadmin');

    $alice->notify(new TestNotification('a1'));
    $alice->notify(new TestNotification('a2'));
    $bob->notify(new TestNotification('b1'));

    $this->actingAs($alice)
        ->postJson('/api/notifications/read-all')
        ->assertOk()
        ->assertJsonPath('success', true);

    expect($alice->unreadNotifications()->count())->toBe(0);
    expect($bob->unreadNotifications()->count())->toBe(1);
});

it('markRead requires authentication', function () {
    $this->postJson('/api/notifications/fake-id/read')->assertStatus(401);
});

it('markAllRead requires authentication', function () {
    $this->postJson('/api/notifications/read-all')->assertStatus(401);
});

// ───── Index endpoint (paginated history) ──────────────────────────────

it('index endpoint requires authentication', function () {
    $this->getJson('/api/notifications')->assertStatus(401);
});

it('index returns pagination meta and empty list for a fresh user', function () {
    $user = createUserWithRole('superadmin');
    $response = $this->actingAs($user)->getJson('/api/notifications');

    $response->assertOk();
    expect($response->json('data.notifications'))->toBe([]);
    expect($response->json('data.unread_count'))->toBe(0);
    expect($response->json('data.meta.current_page'))->toBe(1);
    expect($response->json('data.meta.total'))->toBe(0);
});

it('index returns mixed read + unread by default (status=all)', function () {
    $user = createUserWithRole('superadmin');

    $user->notify(new TestNotification('a'));
    $user->notify(new TestNotification('b'));
    // Mark first as read
    $first = $user->unreadNotifications()->orderBy('created_at')->firstOrFail();
    $first->markAsRead();

    $response = $this->actingAs($user)->getJson('/api/notifications');
    $response->assertOk();
    expect($response->json('data.meta.total'))->toBe(2);
    expect($response->json('data.unread_count'))->toBe(1);

    $list = $response->json('data.notifications');
    $readFlags = array_column($list, 'is_read');
    expect($readFlags)->toContain(true);
    expect($readFlags)->toContain(false);
});

it('index filters by status=unread', function () {
    $user = createUserWithRole('superadmin');

    $user->notify(new TestNotification('unread-1'));
    $user->notify(new TestNotification('unread-2'));
    $first = $user->unreadNotifications()->firstOrFail();
    $first->markAsRead();

    $response = $this->actingAs($user)->getJson('/api/notifications?status=unread');
    $response->assertOk();
    foreach ($response->json('data.notifications') as $n) {
        expect($n['is_read'])->toBe(false);
    }
});

it('index filters by status=read', function () {
    $user = createUserWithRole('superadmin');

    $user->notify(new TestNotification('a'));
    $user->notify(new TestNotification('b'));
    $user->unreadNotifications->markAsRead();

    $response = $this->actingAs($user)->getJson('/api/notifications?status=read');
    $response->assertOk();
    expect($response->json('data.meta.total'))->toBe(2);
    foreach ($response->json('data.notifications') as $n) {
        expect($n['is_read'])->toBe(true);
    }
});

it('index filters by priority', function () {
    $user = createUserWithRole('superadmin');

    $user->notify(new TestNotification('info-n', priority: 'info'));
    $user->notify(new TestNotification('danger-n', priority: 'danger'));
    $user->notify(new TestNotification('danger-2', priority: 'danger'));

    $response = $this->actingAs($user)->getJson('/api/notifications?priority=danger');
    $response->assertOk();
    expect($response->json('data.meta.total'))->toBe(2);
    foreach ($response->json('data.notifications') as $n) {
        expect($n['priority'])->toBe('danger');
    }
});

it('index returns only the current user notifications', function () {
    $alice = createUserWithRole('superadmin');
    $bob = createUserWithRole('superadmin');

    $alice->notify(new TestNotification('alice-1'));
    $alice->notify(new TestNotification('alice-2'));
    $bob->notify(new TestNotification('bob-1'));

    $aliceResp = $this->actingAs($alice)->getJson('/api/notifications');
    expect($aliceResp->json('data.meta.total'))->toBe(2);

    $bobResp = $this->actingAs($bob)->getJson('/api/notifications');
    expect($bobResp->json('data.meta.total'))->toBe(1);
});

it('index rejects invalid status and priority values', function () {
    $user = createUserWithRole('superadmin');

    $this->actingAs($user)
        ->getJson('/api/notifications?status=invalid')
        ->assertStatus(422);

    $this->actingAs($user)
        ->getJson('/api/notifications?priority=wrong')
        ->assertStatus(422);
});

it('index supports per_page override within bounds', function () {
    $user = createUserWithRole('superadmin');

    for ($i = 0; $i < 15; $i++) {
        $user->notify(new TestNotification("n-{$i}"));
    }

    $response = $this->actingAs($user)->getJson('/api/notifications?per_page=10');
    $response->assertOk();
    expect($response->json('data.meta.per_page'))->toBe(10);
    expect(count($response->json('data.notifications')))->toBe(10);
    expect($response->json('data.meta.last_page'))->toBe(2);

    // per_page above cap (50) is rejected by validator
    $this->actingAs($user)
        ->getJson('/api/notifications?per_page=999')
        ->assertStatus(422);
});

// ─── Helper notification class ──────────────────────────────────────────

class TestNotification extends Notification
{
    public function __construct(
        private readonly string $marker,
        private readonly string $priority = 'info',
    ) {}

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toDatabase($notifiable): array
    {
        return [
            'type' => 'info',
            'title' => 'Test notification',
            'message' => "Body with marker {$this->marker}",
            'priority' => $this->priority,
            'icon' => 'bell',
        ];
    }
}
